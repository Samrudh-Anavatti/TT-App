"""Unit tests for the ELO engine (precise K=32 formula)."""
from app.elo import MIN_ELO, apply_match, elo_change, expected_score


def test_equal_ratings_expect_half():
    assert expected_score(1000, 1000) == 0.5


def test_equal_ratings_change_is_16():
    # The one example in DESIGN.md that the precise formula reproduces exactly.
    assert elo_change(1000, 1000) == 16


def test_symmetrical_exchange_off_the_floor():
    res = apply_match(1050, 1050)
    assert res.winner_elo_after - res.winner_elo_before == 16
    assert res.loser_elo_before - res.loser_elo_after == 16


def test_favourite_gains_less_than_underdog():
    fav = apply_match(1200, 1000).change
    underdog = apply_match(1000, 1200).change
    assert fav < underdog


def test_loser_clamped_at_floor():
    res = apply_match(120, 105)
    assert res.loser_elo_after >= MIN_ELO


def test_change_is_positive_integer():
    c = elo_change(1400, 900)
    assert isinstance(c, int) and c >= 0
