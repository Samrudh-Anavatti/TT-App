"""Domain services shared across routers."""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from .elo import EloResult, apply_match
from .models import Match, Player


def apply_and_record_match(
    db: Session,
    club_id: str,
    winner: Player,
    loser: Player,
    *,
    notes: str | None = None,
    played_at: datetime | None = None,
) -> tuple[Match, EloResult]:
    """Apply an Elo update and persist a Match row.

    Mutates the two players' ratings and win/loss tallies and adds a ``Match`` to
    the session. Does NOT commit — the caller owns the transaction (so a tournament
    result can write its own row in the same commit). Returns the match + result.
    """
    result = apply_match(winner.elo, loser.elo)

    match = Match(
        club_id=club_id,
        winner_id=winner.id,
        loser_id=loser.id,
        winner_elo_before=result.winner_elo_before,
        loser_elo_before=result.loser_elo_before,
        elo_change=result.change,
        played_at=played_at or datetime.now(timezone.utc),
        recorded_at=datetime.now(timezone.utc),
        notes=notes,
    )

    winner.elo = result.winner_elo_after
    winner.wins += 1
    winner.matches_played += 1
    loser.elo = result.loser_elo_after
    loser.losses += 1
    loser.matches_played += 1

    db.add(match)
    return match, result
