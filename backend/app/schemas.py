"""Pydantic v2 request/response schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClubOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    slug: str
    created_at: datetime


class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    elo: int
    unrated: bool = False
    matches_played: int
    wins: int
    losses: int
    active: bool


class LeaderboardEntry(PlayerOut):
    rank: int


class MatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    winner_id: str
    loser_id: str
    winner_elo_before: int
    loser_elo_before: int
    elo_change: int
    played_at: datetime
    recorded_at: datetime
    notes: str | None = None


class RecentMatchOut(MatchOut):
    winner_name: str
    loser_name: str


class MatchRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    challenger_id: str
    opponent_id: str
    status: str
    message: str | None = None
    requested_at: datetime
    scheduled_for: datetime | None = None
    challenger_name: str | None = None
    opponent_name: str | None = None


# ---- Inbound payloads ----

class MatchRequestCreate(BaseModel):
    challenger_id: str
    opponent_id: str
    message: str | None = Field(default=None, max_length=280)
    scheduled_for: datetime | None = None


class RecordMatchIn(BaseModel):
    winner_id: str
    loser_id: str
    played_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=280)


class PlayerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    elo: int = Field(default=1000, ge=100, le=4000)  # starting rating; floor is 100
    unrated: bool = False  # add with no rating yet — a coach sets `elo` later


class PlayerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    active: bool | None = None
    elo: int | None = Field(default=None, ge=100, le=4000)


class MatchRequestUpdate(BaseModel):
    status: str  # pending/accepted/cancelled/completed


class RecordMatchResult(BaseModel):
    match: MatchOut
    winner: dict
    loser: dict


# ---- Tournaments ----

class TournamentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    rating_prize: int = Field(default=25, ge=0, le=500)


class TournamentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    status: str
    rating_prize: int
    winner_id: str | None = None
    winner_name: str | None = None
    participant_count: int = 0
    created_at: datetime
    completed_at: datetime | None = None


class StandingRow(BaseModel):
    player_id: str
    name: str
    elo: int
    wins: int
    losses: int
    played: int


class TournamentMatchRow(BaseModel):
    id: str
    winner_id: str
    loser_id: str
    winner_name: str
    loser_name: str
    elo_change: int
    played_at: datetime


class TournamentDetailOut(TournamentOut):
    standings: list[StandingRow] = []
    matches: list[TournamentMatchRow] = []


class ParticipantAdd(BaseModel):
    player_id: str


class TournamentMatchIn(BaseModel):
    winner_id: str
    loser_id: str


# ---- Participation (admin/coach view) ----

class ParticipationRow(BaseModel):
    player_id: str
    name: str
    active: bool
    matches_played: int
    wins: int
    losses: int
    matches_7d: int
    matches_30d: int
    challenges_made: int
    last_played: datetime | None = None
