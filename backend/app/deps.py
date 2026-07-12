"""Shared FastAPI dependencies: club resolution + admin PIN gate."""
from fastapi import Depends, Header, HTTPException, Path
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import Club
from .security import verify_pin


def get_club(slug: str = Path(...), db: Session = Depends(get_db)) -> Club:
    club = db.scalar(select(Club).where(Club.slug == slug))
    if club is None:
        raise HTTPException(status_code=404, detail="Club not found")
    return club


def require_admin(
    club: Club = Depends(get_club),
    x_admin_pin: str | None = Header(default=None, alias="X-Admin-PIN"),
) -> Club:
    if not x_admin_pin or not verify_pin(x_admin_pin, club.admin_pin_hash):
        raise HTTPException(status_code=401, detail="Invalid admin PIN")
    return club
