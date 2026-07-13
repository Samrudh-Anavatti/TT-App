"""Seed the clubs on first boot (runs only when the database is empty).

Admin PINs come from environment variables — set them as App Service application
settings (STANMORE_PIN / YORKGARDENS_PIN). The `default_pin` values below are
throwaway placeholders and must NOT be treated as real secrets (this repo is public).

Clubs start with no players; add real players via the admin panel.
"""
import os

from sqlalchemy import select

from .database import SessionLocal
from .models import Club
from .security import hash_pin

_CLUBS = [
    {"name": "Stanmore TTC", "slug": "stanmore", "pin_env": "STANMORE_PIN", "default_pin": "changeme"},
    {"name": "York Gardens TTC", "slug": "york-gardens", "pin_env": "YORKGARDENS_PIN", "default_pin": "changeme"},
]


def seed_if_empty() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(Club).limit(1)) is not None:
            return  # already seeded

        for spec in _CLUBS:
            pin = os.getenv(spec["pin_env"], spec["default_pin"])
            db.add(Club(name=spec["name"], slug=spec["slug"], admin_pin_hash=hash_pin(pin)))

        db.commit()
        print(f"[seed] Clubs created: {', '.join(c['slug'] for c in _CLUBS)}")
    finally:
        db.close()
