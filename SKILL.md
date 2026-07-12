---
name: pongpoints
description: Skill for building PongPoints, a table tennis club ELO ranking platform. React + Vite + Tailwind frontend with Python FastAPI + SQLite backend. Use this skill whenever working on the pongpoints project, including frontend components, backend API, ELO calculations, database models, or deployment config.
---

# PongPoints — Build Skill

Read `DESIGN.md` at the project root before starting any work. It is the source of truth for architecture, data model, API contracts, and implementation order.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6
- **Backend**: Python 3.11+ FastAPI + SQLAlchemy 2.0 + SQLite
- **Testing**: pytest (backend), Vitest (frontend)

## Project Layout

```
pongpoints/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level components
│   │   └── hooks/        # Custom hooks (useApi, etc.)
│   └── ...
├── backend/           # FastAPI service
│   ├── app/
│   │   ├── main.py       # App entry, CORS, lifespan
│   │   ├── models.py     # SQLAlchemy ORM models
│   │   ├── schemas.py    # Pydantic models
│   │   ├── database.py   # Engine + session
│   │   ├── elo.py        # ELO calculation engine
│   │   ├── routers/      # public.py + admin.py
│   │   └── seed.py       # DB seeding script
│   └── ...
└── DESIGN.md
```

## Conventions

### Backend

- Use async endpoints with `async def`.
- All IDs are UUIDs, generated server-side.
- Use Pydantic v2 models for all request/response schemas.
- Admin endpoints live in `routers/admin.py`, protected by a dependency that checks the `X-Admin-PIN` header against the club's bcrypt-hashed PIN.
- Public endpoints live in `routers/public.py`, no auth required.
- ELO calculations are pure functions in `elo.py` with no DB dependencies — easy to unit test.
- SQLAlchemy models use `mapped_column` (2.0 style).
- CORS: allow the frontend origin (configurable via env var `FRONTEND_URL`).
- Environment variables via `.env` file loaded with `python-dotenv`.

### Frontend

- Functional components only, hooks for state.
- `useApi` custom hook wraps fetch calls to the backend, handles loading/error states.
- Tailwind for all styling — no CSS files.
- Admin PIN stored in sessionStorage after verification (cleared on tab close).
- API base URL from env var `VITE_API_URL`.
- Mobile-first responsive design.

### ELO Engine

```python
K = 32
FLOOR = 100
START = 1000

def expected_score(rating_a: int, rating_b: int) -> float:
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))

def calculate_elo_change(winner_elo: int, loser_elo: int) -> int:
    expected = expected_score(winner_elo, loser_elo)
    change = round(K * (1 - expected))
    return max(1, change)  # always at least 1 point exchanged

def apply_match(winner_elo: int, loser_elo: int) -> tuple[int, int]:
    change = calculate_elo_change(winner_elo, loser_elo)
    new_winner = winner_elo + change
    new_loser = max(FLOOR, loser_elo - change)
    return new_winner, new_loser
```

### Database

- SQLite database file at `backend/data/pongpoints.db`.
- Use Alembic for migrations (init with `alembic init migrations`).
- Seed script creates the two clubs with their admin PINs.
- Back up the .db file before deployments.

### API Error Responses

Consistent shape:
```json
{
  "detail": "Human-readable error message"
}
```

Standard HTTP codes: 200/201 success, 400 bad request, 401 unauthorized, 404 not found, 422 validation error.

## Implementation Notes

### Phase 1 priorities (build in this order)
1. `backend/app/models.py` + `database.py` — get the schema right first
2. `backend/app/elo.py` + `tests/test_elo.py` — pure logic, easy to verify
3. `backend/app/seed.py` — two clubs with sample players for development
4. `backend/app/routers/public.py` — leaderboard + recent matches
5. `backend/app/routers/admin.py` — record match + manage players
6. `frontend/` — dashboard then admin panel
7. Deployment configs

### Admin PIN Security
- PINs are bcrypt-hashed in the database, never stored plain.
- The admin sends the raw PIN in `X-Admin-PIN` header on each request.
- Backend verifies with `bcrypt.checkpw()`.
- Frontend stores PIN in sessionStorage (not localStorage) so it clears on tab close.
- This is intentionally simple — it's a club practice tracker, not a bank.

### Two Clubs, Fully Decoupled
- Every query is scoped by `club_id`.
- Club is identified by its URL slug in the path.
- A FastAPI dependency resolves `slug → club` and returns 404 if not found.
- No cross-club data leakage is possible.

### Testing
- `pytest` for backend — focus on ELO engine and API endpoints.
- Test ELO edge cases: equal ratings, large gaps, floor enforcement.
- Test admin PIN rejection on wrong/missing PIN.
- Frontend: Vitest + React Testing Library for component tests if needed.

## Design Direction

Sporty but clean. Deep blue-green (table), orange accents (ball), clean white background. The leaderboard is the hero — make rank positions feel tangible. Use a monospace or tabular font for numbers/ELO so columns align. Keep the UI simple enough that a non-technical club president can navigate admin on their phone between games.
