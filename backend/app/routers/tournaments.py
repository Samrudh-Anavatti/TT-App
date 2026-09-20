"""Tournament endpoints — public viewing + PIN-protected management.

A tournament is a lightweight, free-form event: an admin adds participants and
feeds in results as games happen. Each result is a *real* match — it updates
global Elo and shows in the recent-matches feed — and is also scoped to the
tournament for standings. On completion the winner (top of the standings) gets a
flat Elo "rating prize".
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_club, require_admin
from ..models import (
    Club,
    Player,
    Tournament,
    TournamentMatch,
    TournamentParticipant,
)
from ..schemas import (
    ParticipantAdd,
    StandingRow,
    TournamentCreate,
    TournamentDetailOut,
    TournamentMatchIn,
    TournamentMatchRow,
    TournamentOut,
)
from ..services import apply_and_record_match

public_router = APIRouter(prefix="/clubs/{slug}/tournaments", tags=["tournaments"])
admin_router = APIRouter(prefix="/clubs/{slug}/admin/tournaments", tags=["tournaments-admin"])


# ---- Public ----

@public_router.get("", response_model=list[TournamentOut])
def list_tournaments(club: Club = Depends(get_club), db: Session = Depends(get_db)):
    tournaments = db.scalars(
        select(Tournament)
        .where(Tournament.club_id == club.id)
        .order_by(Tournament.created_at.desc())
    ).all()
    names = _name_map(db, club.id)
    counts = _participant_counts(db, [t.id for t in tournaments])
    return [_summary(t, names, counts.get(t.id, 0)) for t in tournaments]


@public_router.get("/{tid}", response_model=TournamentDetailOut)
def get_tournament(
    tid: str, club: Club = Depends(get_club), db: Session = Depends(get_db)
):
    tournament = _require_tournament(db, club.id, tid)
    return _detail(db, tournament)


# ---- Admin ----

@admin_router.post("", response_model=TournamentOut, status_code=201)
def create_tournament(
    payload: TournamentCreate,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tournament = Tournament(
        club_id=club.id, name=payload.name.strip(), rating_prize=payload.rating_prize
    )
    db.add(tournament)
    db.commit()
    db.refresh(tournament)
    return _summary(tournament, _name_map(db, club.id), 0)


@admin_router.post("/{tid}/participants", response_model=TournamentDetailOut)
def add_participant(
    tid: str,
    payload: ParticipantAdd,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tournament = _require_active(db, club.id, tid)
    _require_player(db, club.id, payload.player_id)
    exists = db.scalar(
        select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == tid,
            TournamentParticipant.player_id == payload.player_id,
        )
    )
    if exists:
        raise HTTPException(400, "Player is already in this tournament")
    db.add(TournamentParticipant(tournament_id=tid, player_id=payload.player_id))
    db.commit()
    return _detail(db, tournament)


@admin_router.delete("/{tid}/participants/{player_id}", response_model=TournamentDetailOut)
def remove_participant(
    tid: str,
    player_id: str,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tournament = _require_active(db, club.id, tid)
    part = db.scalar(
        select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == tid,
            TournamentParticipant.player_id == player_id,
        )
    )
    if part is None:
        raise HTTPException(404, "Player is not in this tournament")
    played = db.scalar(
        select(TournamentMatch).where(
            TournamentMatch.tournament_id == tid,
            (TournamentMatch.winner_id == player_id)
            | (TournamentMatch.loser_id == player_id),
        )
    )
    if played is not None:
        raise HTTPException(400, "Can't remove a player who has already played matches")
    db.delete(part)
    db.commit()
    return _detail(db, tournament)


@admin_router.post("/{tid}/matches", response_model=TournamentDetailOut, status_code=201)
def record_tournament_match(
    tid: str,
    payload: TournamentMatchIn,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tournament = _require_active(db, club.id, tid)
    if payload.winner_id == payload.loser_id:
        raise HTTPException(400, "Winner and loser must differ")
    winner = _require_participant(db, tid, club.id, payload.winner_id)
    loser = _require_participant(db, tid, club.id, payload.loser_id)

    match, result = apply_and_record_match(
        db, club.id, winner, loser, notes=f"Tournament: {tournament.name}"
    )
    db.flush()  # assign match.id before referencing it
    db.add(
        TournamentMatch(
            tournament_id=tid,
            match_id=match.id,
            winner_id=winner.id,
            loser_id=loser.id,
            elo_change=result.change,
            played_at=match.played_at,
        )
    )
    db.commit()
    return _detail(db, tournament)


@admin_router.post("/{tid}/complete", response_model=TournamentDetailOut)
def complete_tournament(
    tid: str,
    club: Club = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tournament = _require_tournament(db, club.id, tid)
    if tournament.status == "completed":
        raise HTTPException(400, "Tournament is already completed")

    standings = _standings(db, tid)
    if not standings:
        raise HTTPException(400, "Add participants before completing the tournament")

    champion = standings[0]
    winner = db.get(Player, champion.player_id)
    if winner is not None and tournament.rating_prize:
        winner.elo += tournament.rating_prize  # the rating prize

    tournament.winner_id = champion.player_id
    tournament.status = "completed"
    tournament.completed_at = datetime.now(timezone.utc)
    db.commit()
    return _detail(db, tournament)


# ---- helpers ----

def _require_tournament(db: Session, club_id: str, tid: str) -> Tournament:
    t = db.get(Tournament, tid)
    if t is None or t.club_id != club_id:
        raise HTTPException(404, "Tournament not found")
    return t


def _require_active(db: Session, club_id: str, tid: str) -> Tournament:
    t = _require_tournament(db, club_id, tid)
    if t.status != "active":
        raise HTTPException(400, "Tournament is completed")
    return t


def _require_player(db: Session, club_id: str, player_id: str) -> Player:
    p = db.get(Player, player_id)
    if p is None or p.club_id != club_id:
        raise HTTPException(404, f"Player {player_id} not found in club")
    return p


def _require_participant(db: Session, tid: str, club_id: str, player_id: str) -> Player:
    player = _require_player(db, club_id, player_id)
    part = db.scalar(
        select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == tid,
            TournamentParticipant.player_id == player_id,
        )
    )
    if part is None:
        raise HTTPException(400, f"{player.name} is not in this tournament")
    return player


def _name_map(db: Session, club_id: str) -> dict[str, str]:
    rows = db.execute(
        select(Player.id, Player.name).where(Player.club_id == club_id)
    ).all()
    return {pid: name for pid, name in rows}


def _participant_counts(db: Session, tids: list[str]) -> dict[str, int]:
    if not tids:
        return {}
    rows = db.execute(
        select(TournamentParticipant.tournament_id).where(
            TournamentParticipant.tournament_id.in_(tids)
        )
    ).all()
    counts: dict[str, int] = {}
    for (tid,) in rows:
        counts[tid] = counts.get(tid, 0) + 1
    return counts


def _standings(db: Session, tid: str) -> list[StandingRow]:
    parts = db.scalars(
        select(TournamentParticipant).where(TournamentParticipant.tournament_id == tid)
    ).all()
    tmatches = db.scalars(
        select(TournamentMatch).where(TournamentMatch.tournament_id == tid)
    ).all()

    wins: dict[str, int] = {}
    losses: dict[str, int] = {}
    for m in tmatches:
        wins[m.winner_id] = wins.get(m.winner_id, 0) + 1
        losses[m.loser_id] = losses.get(m.loser_id, 0) + 1

    rows = []
    for part in parts:
        player = db.get(Player, part.player_id)
        if player is None:
            continue
        w = wins.get(player.id, 0)
        loss = losses.get(player.id, 0)
        rows.append(
            StandingRow(
                player_id=player.id,
                name=player.name,
                elo=player.elo,
                wins=w,
                losses=loss,
                played=w + loss,
            )
        )
    # Rank by wins, then fewest losses, then current Elo.
    rows.sort(key=lambda r: (-r.wins, r.losses, -r.elo))
    return rows


def _tournament_matches(db: Session, tid: str, names: dict[str, str]) -> list[TournamentMatchRow]:
    tmatches = db.scalars(
        select(TournamentMatch)
        .where(TournamentMatch.tournament_id == tid)
        .order_by(TournamentMatch.played_at.desc())
    ).all()
    return [
        TournamentMatchRow(
            id=m.id,
            winner_id=m.winner_id,
            loser_id=m.loser_id,
            winner_name=names.get(m.winner_id, "?"),
            loser_name=names.get(m.loser_id, "?"),
            elo_change=m.elo_change,
            played_at=m.played_at,
        )
        for m in tmatches
    ]


def _summary(t: Tournament, names: dict[str, str], count: int) -> TournamentOut:
    return TournamentOut(
        id=t.id,
        name=t.name,
        status=t.status,
        rating_prize=t.rating_prize,
        winner_id=t.winner_id,
        winner_name=names.get(t.winner_id) if t.winner_id else None,
        participant_count=count,
        created_at=t.created_at,
        completed_at=t.completed_at,
    )


def _detail(db: Session, t: Tournament) -> TournamentDetailOut:
    names = _name_map(db, t.club_id)
    standings = _standings(db, t.id)
    return TournamentDetailOut(
        id=t.id,
        name=t.name,
        status=t.status,
        rating_prize=t.rating_prize,
        winner_id=t.winner_id,
        winner_name=names.get(t.winner_id) if t.winner_id else None,
        participant_count=len(standings),
        created_at=t.created_at,
        completed_at=t.completed_at,
        standings=standings,
        matches=_tournament_matches(db, t.id, names),
    )
