"""Seed two demo clubs with players so the app has data on first boot.

PINs and names here are placeholders — the user will reconfigure them.
Override the default PINs with NORTHSIDE_PIN / RIVERSIDE_PIN env vars.
"""
import os
import random

from sqlalchemy import select

from .database import SessionLocal
from .models import Club, Match, Player
from .elo import apply_match
from .security import hash_pin

_DEMO = [
    {
        "name": "Northside TTC",
        "slug": "northside",
        "pin_env": "NORTHSIDE_PIN",
        "default_pin": "1234",
        "players": ["Alice", "Bob", "Carol", "Dave", "Erin", "Frank"],
    },
    {
        "name": "Riverside Paddlers",
        "slug": "riverside",
        "pin_env": "RIVERSIDE_PIN",
        "default_pin": "5678",
        "players": ["Grace", "Heidi", "Ivan", "Judy", "Mallory"],
    },
]


def seed_if_empty() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(Club).limit(1)) is not None:
            return  # already seeded

        rng = random.Random(42)
        for club_spec in _DEMO:
            pin = os.getenv(club_spec["pin_env"], club_spec["default_pin"])
            club = Club(
                name=club_spec["name"],
                slug=club_spec["slug"],
                admin_pin_hash=hash_pin(pin),
            )
            db.add(club)
            db.flush()

            players = [Player(club_id=club.id, name=n) for n in club_spec["players"]]
            db.add_all(players)
            db.flush()

            # A handful of random completed matches so the leaderboard isn't flat.
            for _ in range(len(players) * 2):
                a, b = rng.sample(players, 2)
                result = apply_match(a.elo, b.elo)
                db.add(
                    Match(
                        club_id=club.id,
                        winner_id=a.id,
                        loser_id=b.id,
                        winner_elo_before=result.winner_elo_before,
                        loser_elo_before=result.loser_elo_before,
                        elo_change=result.change,
                    )
                )
                a.elo, a.wins, a.matches_played = result.winner_elo_after, a.wins + 1, a.matches_played + 1
                b.elo, b.losses, b.matches_played = result.loser_elo_after, b.losses + 1, b.matches_played + 1

        db.commit()
        print("[seed] Demo clubs created: northside, riverside")
    finally:
        db.close()
