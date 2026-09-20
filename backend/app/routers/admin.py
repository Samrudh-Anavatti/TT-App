"""Admin (PIN-protected) endpoints. All require the X-Admin-PIN header."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_club, require_admin
from ..models import Club, Match, MatchRequest, Player
from ..services import apply_and_record_match
from ..schemas import (
    MatchOut,
    MatchRequestUpdate,
    ParticipationRow,
    PlayerCreate,
    PlayerOut,
    PlayerUpdate,
    RecordMatchIn,
    RecordMatchResult,
)

router = APIRouter(prefix="/clubs/{slug}/admin", tags=["admin"])

VALID_STATUSES = {"pending", "accepted", "cancelled", "completed"}


@router.post("/verify")
def verify(club: Club = Depends(require_admin)):
    return {"ok": True, "club": club.slug}


@router.post("/matches", response_model=RecordMatchResult, status_code=201)
def record_match(
    payload: RecordMatchIn,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if payload.winner_id == payload.loser_id:
        raise HTTPException(400, "Winner and loser must differ")

    winner = _require_player(db, club.id, payload.winner_id)
    loser = _require_player(db, club.id, payload.loser_id)

    match, result = apply_and_record_match(
        db, club.id, winner, loser, notes=payload.notes, played_at=payload.played_at
    )
    db.commit()
    db.refresh(match)

    return RecordMatchResult(
        match=MatchOut.model_validate(match),
        winner={
            "name": winner.name,
            "elo_before": result.winner_elo_before,
            "elo_after": result.winner_elo_after,
        },
        loser={
            "name": loser.name,
            "elo_before": result.loser_elo_before,
            "elo_after": result.loser_elo_after,
        },
    )


@router.post("/players", response_model=PlayerOut, status_code=201)
def add_player(
    payload: PlayerCreate,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    player = Player(club_id=club.id, name=payload.name.strip(), elo=payload.elo)
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.put("/players/{player_id}", response_model=PlayerOut)
def edit_player(
    player_id: str,
    payload: PlayerUpdate,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    player = _require_player(db, club.id, player_id)
    if payload.name is not None:
        player.name = payload.name.strip()
    if payload.active is not None:
        player.active = payload.active
    if payload.elo is not None:
        player.elo = payload.elo
    db.commit()
    db.refresh(player)
    return player


@router.delete("/players/{player_id}", response_model=PlayerOut)
def deactivate_player(
    player_id: str,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    player = _require_player(db, club.id, player_id)
    player.active = False
    db.commit()
    db.refresh(player)
    return player


@router.get("/players", response_model=list[PlayerOut])
def list_all_players(
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Player).where(Player.club_id == club.id).order_by(Player.elo.desc())
    ).all()


@router.put("/match-requests/{request_id}", response_model=dict)
def update_match_request(
    request_id: str,
    payload: MatchRequestUpdate,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(VALID_STATUSES)}")
    req = db.get(MatchRequest, request_id)
    if req is None or req.club_id != club.id:
        raise HTTPException(404, "Match request not found")
    req.status = payload.status
    db.commit()
    return {"id": req.id, "status": req.status}


@router.get("/participation", response_model=list[ParticipationRow])
def participation(
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Per-player activity for coaches: who's been coming and playing.

    Aggregates the match history (both wins and losses count as attendance) plus
    challenges raised, with 7- and 30-day windows and each player's last game.
    """
    now = datetime.now(timezone.utc)
    cutoff_7 = now - timedelta(days=7)
    cutoff_30 = now - timedelta(days=30)

    players = db.scalars(
        select(Player).where(Player.club_id == club.id).order_by(Player.name)
    ).all()

    matches = db.execute(
        select(Match.winner_id, Match.loser_id, Match.played_at).where(
            Match.club_id == club.id
        )
    ).all()

    challenges = db.execute(
        select(MatchRequest.challenger_id).where(MatchRequest.club_id == club.id)
    ).all()

    stats: dict[str, dict] = {
        p.id: {"m7": 0, "m30": 0, "last": None, "challenges": 0} for p in players
    }

    def _aware(dt):  # SQLite hands back naive datetimes; treat them as UTC
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    for winner_id, loser_id, played_at in matches:
        when = _aware(played_at)
        for pid in (winner_id, loser_id):
            s = stats.get(pid)
            if s is None:
                continue
            if s["last"] is None or when > s["last"]:
                s["last"] = when
            if when >= cutoff_7:
                s["m7"] += 1
            if when >= cutoff_30:
                s["m30"] += 1

    for (challenger_id,) in challenges:
        s = stats.get(challenger_id)
        if s is not None:
            s["challenges"] += 1

    rows = [
        ParticipationRow(
            player_id=p.id,
            name=p.name,
            active=p.active,
            matches_played=p.matches_played,
            wins=p.wins,
            losses=p.losses,
            matches_7d=stats[p.id]["m7"],
            matches_30d=stats[p.id]["m30"],
            challenges_made=stats[p.id]["challenges"],
            last_played=stats[p.id]["last"],
        )
        for p in players
    ]
    # Most recently active first; never-played players sink to the bottom.
    rows.sort(key=lambda r: (r.last_played is not None, r.last_played or datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
    return rows


def _require_player(db: Session, club_id: str, player_id: str) -> Player:
    p = db.get(Player, player_id)
    if p is None or p.club_id != club_id:
        raise HTTPException(404, f"Player {player_id} not found in club")
    return p
