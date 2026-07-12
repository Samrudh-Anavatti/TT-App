"""SQLAlchemy 2.0 models. UUIDs are stored as strings for SQLite portability."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Club(Base):
    __tablename__ = "clubs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    admin_pin_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    players: Mapped[list["Player"]] = relationship(
        back_populates="club", cascade="all, delete-orphan"
    )


class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    club_id: Mapped[str] = mapped_column(ForeignKey("clubs.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    elo: Mapped[int] = mapped_column(Integer, default=1000)
    matches_played: Mapped[int] = mapped_column(Integer, default=0)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    club: Mapped["Club"] = relationship(back_populates="players")


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    club_id: Mapped[str] = mapped_column(ForeignKey("clubs.id"), index=True, nullable=False)
    winner_id: Mapped[str] = mapped_column(ForeignKey("players.id"), nullable=False)
    loser_id: Mapped[str] = mapped_column(ForeignKey("players.id"), nullable=False)
    winner_elo_before: Mapped[int] = mapped_column(Integer, nullable=False)
    loser_elo_before: Mapped[int] = mapped_column(Integer, nullable=False)
    elo_change: Mapped[int] = mapped_column(Integer, nullable=False)
    played_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class MatchRequest(Base):
    __tablename__ = "match_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    club_id: Mapped[str] = mapped_column(ForeignKey("clubs.id"), index=True, nullable=False)
    challenger_id: Mapped[str] = mapped_column(ForeignKey("players.id"), nullable=False)
    opponent_id: Mapped[str] = mapped_column(ForeignKey("players.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending/accepted/cancelled/completed
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
