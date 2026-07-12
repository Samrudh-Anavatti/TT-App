"""Public (unauthenticated) endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_club
from ..models import Club, Match, MatchRequest, Player
from ..schemas import (
    ClubOut,
    LeaderboardEntry,
    MatchRequestCreate,
    MatchRequestOut,
    RecentMatchOut,
)

router = APIRouter(prefix="/clubs/{slug}", tags=["public"])


@router.get("", response_model=ClubOut)
def get_club_info(club: Club = Depends(get_club)):
    return club


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(club: Club = Depends(get_club), db: Session = Depends(get_db)):
    players = db.scalars(
        select(Player)
        .where(Player.club_id == club.id, Player.active == True)  # noqa: E712
        .order_by(Player.elo.desc(), Player.wins.desc())
    ).all()
    return [
        LeaderboardEntry(rank=i + 1, **_player_dict(p)) for i, p in enumerate(players)
    ]


@router.get("/matches/recent", response_model=list[RecentMatchOut])
def recent_matches(club: Club = Depends(get_club), db: Session = Depends(get_db)):
    matches = db.scalars(
        select(Match)
        .where(Match.club_id == club.id)
        .order_by(Match.played_at.desc())
        .limit(20)
    ).all()
    names = _name_map(db, club.id)
    return [
        RecentMatchOut(
            winner_name=names.get(m.winner_id, "?"),
            loser_name=names.get(m.loser_id, "?"),
            **_match_dict(m),
        )
        for m in matches
    ]


@router.get("/match-requests", response_model=list[MatchRequestOut])
def match_requests(club: Club = Depends(get_club), db: Session = Depends(get_db)):
    reqs = db.scalars(
        select(MatchRequest)
        .where(
            MatchRequest.club_id == club.id,
            MatchRequest.status.in_(["pending", "accepted"]),
        )
        .order_by(MatchRequest.requested_at.desc())
    ).all()
    names = _name_map(db, club.id)
    return [_request_out(r, names) for r in reqs]


@router.post("/match-requests", response_model=MatchRequestOut, status_code=201)
def create_match_request(
    payload: MatchRequestCreate,
    club: Club = Depends(get_club),
    db: Session = Depends(get_db),
):
    if payload.challenger_id == payload.opponent_id:
        raise HTTPException(400, "Challenger and opponent must differ")
    _require_player(db, club.id, payload.challenger_id)
    _require_player(db, club.id, payload.opponent_id)

    req = MatchRequest(
        club_id=club.id,
        challenger_id=payload.challenger_id,
        opponent_id=payload.opponent_id,
        message=payload.message,
        scheduled_for=payload.scheduled_for,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _request_out(req, _name_map(db, club.id))


@router.put("/match-requests/{request_id}/cancel", response_model=MatchRequestOut)
def cancel_match_request(
    request_id: str,
    club: Club = Depends(get_club),
    db: Session = Depends(get_db),
):
    req = db.get(MatchRequest, request_id)
    if req is None or req.club_id != club.id:
        raise HTTPException(404, "Match request not found")
    req.status = "cancelled"
    db.commit()
    db.refresh(req)
    return _request_out(req, _name_map(db, club.id))


# ---- helpers ----

def _player_dict(p: Player) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "elo": p.elo,
        "matches_played": p.matches_played,
        "wins": p.wins,
        "losses": p.losses,
        "active": p.active,
    }


def _match_dict(m: Match) -> dict:
    return {
        "id": m.id,
        "winner_id": m.winner_id,
        "loser_id": m.loser_id,
        "winner_elo_before": m.winner_elo_before,
        "loser_elo_before": m.loser_elo_before,
        "elo_change": m.elo_change,
        "played_at": m.played_at,
        "recorded_at": m.recorded_at,
        "notes": m.notes,
    }


def _name_map(db: Session, club_id: str) -> dict[str, str]:
    rows = db.execute(
        select(Player.id, Player.name).where(Player.club_id == club_id)
    ).all()
    return {pid: name for pid, name in rows}


def _request_out(r: MatchRequest, names: dict[str, str]) -> MatchRequestOut:
    return MatchRequestOut(
        id=r.id,
        challenger_id=r.challenger_id,
        opponent_id=r.opponent_id,
        status=r.status,
        message=r.message,
        requested_at=r.requested_at,
        scheduled_for=r.scheduled_for,
        challenger_name=names.get(r.challenger_id),
        opponent_name=names.get(r.opponent_id),
    )


def _require_player(db: Session, club_id: str, player_id: str) -> Player:
    p = db.get(Player, player_id)
    if p is None or p.club_id != club_id:
        raise HTTPException(404, f"Player {player_id} not found in club")
    return p
