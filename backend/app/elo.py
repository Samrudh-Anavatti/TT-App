"""ELO rating engine.

Standard ELO, but tuned for a *volatile* club ladder — we deliberately run a
high K-factor so ratings move fast: a couple of wins rockets you up, a couple of
losses knocks you down, and nobody holds the top for long. Set ``ELO_K`` to tune.

    Expected score:  E_a = 1 / (1 + 10^((R_b - R_a) / 400))
    New rating:      R_a' = R_a + K * (S_a - E_a)

With the default K of 64, two equally-rated players swing +32 / -32 per game
(double the classic 32-K's +16 / -16), so the ladder churns noticeably faster.
"""
import os
from dataclasses import dataclass

# High by design — see module docstring. Override with the ELO_K env var.
K_FACTOR = int(os.getenv("ELO_K", "64"))
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
