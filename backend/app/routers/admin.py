"""Admin (PIN-protected) endpoints. All require the X-Admin-PIN header."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_club, require_admin
from ..elo import apply_match
from ..models import Club, Match, MatchRequest, Player
from ..schemas import (
    MatchOut,
    MatchRequestUpdate,
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

    result = apply_match(winner.elo, loser.elo)

    match = Match(
        club_id=club.id,
        winner_id=winner.id,
        loser_id=loser.id,
        winner_elo_before=result.winner_elo_before,
        loser_elo_before=result.loser_elo_before,
        elo_change=result.change,
        played_at=payload.played_at or datetime.now(timezone.utc),
        recorded_at=datetime.now(timezone.utc),
        notes=payload.notes,
    )

    winner.elo = result.winner_elo_after
    winner.wins += 1
    winner.matches_played += 1
    loser.elo = result.loser_elo_after
    loser.losses += 1
    loser.matches_played += 1

    db.add(match)
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


def _require_player(db: Session, club_id: str, player_id: str) -> Player:
    p = db.get(Player, player_id)
    if p is None or p.club_id != club_id:
        raise HTTPException(404, f"Player {player_id} not found in club")
    return p
