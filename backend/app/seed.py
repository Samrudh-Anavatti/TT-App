"""Seed the clubs on first boot (runs only when the database is empty).

Admin PINs come from environment variables — set them as App Service application
settings (STANMORE_PIN). The `default_pin` values below are throwaway placeholders
and must NOT be treated as real secrets (this repo is public).

Clubs start with no players; add real players via the admin panel.
"""
import os

from sqlalchemy import select

from .database import SessionLocal
from .models import Club
from .security import hash_pin, verify_pin

_CLUBS = [
    {"name": "Stanmore TTC", "slug": "stanmore", "pin_env": "STANMORE_PIN", "default_pin": "changeme"},
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


def sync_admin_pins() -> None:
    """Reconcile each club's admin PIN from its env var on startup.

    Seeding only runs on an empty DB, so once a club exists its hashed PIN is
    frozen. This lets the admin password be rotated by updating the App Service
    setting (e.g. STANMORE_PIN) and restarting — no DB surgery. Skips clubs whose
    env var is unset, and only rewrites the hash when the PIN actually changed
    (bcrypt is salted, so we compare via verify, not by hashing).
    """
    db = SessionLocal()
    try:
        changed = []
        for spec in _CLUBS:
            pin = os.getenv(spec["pin_env"])
            if not pin:
                continue
            club = db.scalar(select(Club).where(Club.slug == spec["slug"]))
            if club and not verify_pin(pin, club.admin_pin_hash):
                club.admin_pin_hash = hash_pin(pin)
                changed.append(spec["slug"])
        if changed:
            db.commit()
            print(f"[seed] Admin PIN updated from env for: {', '.join(changed)}")
    finally:
        db.close()
