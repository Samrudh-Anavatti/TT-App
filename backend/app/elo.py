"""ELO rating engine.

Standard ELO with a K-factor of 32 (see DESIGN.md > ELO System).

    Expected score:  E_a = 1 / (1 + 10^((R_b - R_a) / 400))
    New rating:      R_a' = R_a + K * (S_a - E_a)

Note: the illustrative examples in DESIGN.md (e.g. "1200 vs 1000 -> +10")
are approximate. This module implements the precise formula above, so the
equal-rating case yields the documented +16 / -16 and others differ slightly.
"""
from dataclasses import dataclass

K_FACTOR = 32
STARTING_ELO = 1000
MIN_ELO = 100


def expected_score(rating_a: int, rating_b: int) -> float:
    """Probability that player A beats player B."""
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400))


def elo_change(winner_elo: int, loser_elo: int, k: int = K_FACTOR) -> int:
    """Points the winner gains (and the loser nominally loses)."""
    return round(k * (1 - expected_score(winner_elo, loser_elo)))


@dataclass
class EloResult:
    winner_elo_before: int
    loser_elo_before: int
    winner_elo_after: int
    loser_elo_after: int
    change: int


def apply_match(winner_elo: int, loser_elo: int, k: int = K_FACTOR) -> EloResult:
    """Compute post-match ratings. Loser is clamped at the MIN_ELO floor."""
    change = elo_change(winner_elo, loser_elo, k)
    return EloResult(
        winner_elo_before=winner_elo,
        loser_elo_before=loser_elo,
        winner_elo_after=winner_elo + change,
        loser_elo_after=max(MIN_ELO, loser_elo - change),
        change=change,
    )
