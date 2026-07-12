# PongPoints — Table Tennis Club Ranking Platform

## Overview

A lightweight web app for two table tennis clubs to track player ELO ratings during practice sessions. Players can view leaderboards, request matchups, and see recent results. Club admins record match outcomes, which trigger automatic ELO updates.

Each club is fully decoupled — separate data, separate admin, separate URL slug.

---

## Architecture

```
┌─────────────────────────┐       ┌─────────────────────────┐
│   React SPA (Vite)      │       │   Python FastAPI         │
│   - Tailwind CSS        │──────▶│   - SQLite (per-club)    │
│   - React Router        │  API  │   - ELO engine           │
│   - Static hosting      │       │   - Admin PIN auth       │
└─────────────────────────┘       └─────────────────────────┘
     GitHub Pages /                   Azure App Service /
     Azure Static Web Apps            Railway / Render
```

### Tech Stack

| Layer    | Choice              | Rationale                                        |
|----------|---------------------|--------------------------------------------------|
| Frontend | React + Vite        | Fast dev, easy static deploy                     |
| Styling  | Tailwind CSS        | Utility-first, quick iteration                   |
| Routing  | React Router v6     | Client-side routing for SPA                      |
| Backend  | Python FastAPI      | Async, auto-docs, type-safe                      |
| Database | SQLite              | Zero-config, single file, plenty for ~100 players |
| ORM      | SQLAlchemy 2.0      | Mature, works great with FastAPI                  |
| Hosting  | GitHub Pages + Azure | Free frontend, cheap backend                     |

### Why SQLite?

Two clubs, maybe 30-50 players each, a few matches per practice session. SQLite handles this effortlessly with zero operational overhead. The entire database is a single file that's easy to back up. If the project grows, migrating to PostgreSQL via SQLAlchemy is straightforward.

---

## Data Model

### Club

| Field          | Type     | Notes                            |
|----------------|----------|----------------------------------|
| id             | UUID     | Primary key                      |
| name           | string   | e.g. "Northside TTC"            |
| slug           | string   | URL-safe, unique, e.g. "northside" |
| admin_pin_hash | string   | Bcrypt hash of admin PIN         |
| created_at     | datetime |                                  |

### Player

| Field          | Type     | Notes                            |
|----------------|----------|----------------------------------|
| id             | UUID     | Primary key                      |
| club_id        | UUID     | FK → Club                       |
| name           | string   | Display name                     |
| elo            | integer  | Default 1000                     |
| matches_played | integer  | Running count                    |
| wins           | integer  |                                  |
| losses         | integer  |                                  |
| active         | boolean  | Soft-delete flag                 |
| created_at     | datetime |                                  |

### Match

| Field            | Type     | Notes                              |
|------------------|----------|------------------------------------|
| id               | UUID     | Primary key                        |
| club_id          | UUID     | FK → Club                         |
| winner_id        | UUID     | FK → Player                       |
| loser_id         | UUID     | FK → Player                       |
| winner_elo_before| integer  | Snapshot for history               |
| loser_elo_before | integer  | Snapshot for history               |
| elo_change       | integer  | Points exchanged                   |
| played_at        | datetime | When the match happened            |
| recorded_at      | datetime | When admin entered it              |
| notes            | string?  | Optional, e.g. "close game"       |

### MatchRequest

| Field          | Type     | Notes                                       |
|----------------|----------|---------------------------------------------|
| id             | UUID     | Primary key                                 |
| club_id        | UUID     | FK → Club                                  |
| challenger_id  | UUID     | FK → Player (who initiated)               |
| opponent_id    | UUID     | FK → Player (who was challenged)           |
| status         | enum     | pending / accepted / cancelled / completed  |
| message        | string?  | Optional note, e.g. "Best of 3 on Tuesday?" |
| requested_at   | datetime |                                              |
| scheduled_for  | datetime?| Optional proposed date/time                 |

---

## ELO System

### Algorithm

Standard ELO with K-factor of 32 (appropriate for casual/club play with enough volatility to keep things interesting).

```
Expected score:  E_a = 1 / (1 + 10^((R_b - R_a) / 400))
New rating:      R_a' = R_a + K * (S_a - E_a)
```

Where:
- `R_a`, `R_b` = current ratings of player A and B
- `S_a` = actual score (1 for win, 0 for loss)
- `K` = 32

### Examples

| Scenario                        | Winner gains | Loser loses |
|---------------------------------|--------------|-------------|
| Equal rating (1000 vs 1000)     | +16          | -16         |
| Favourite wins (1200 vs 1000)   | +10          | -10         |
| Underdog wins (1000 vs 1200)    | +22          | -22         |
| Big upset (800 vs 1200)         | +28          | -28         |

### Constraints
- Minimum ELO: 100 (floor, can't go below)
- Starting ELO: 1000
- ELO changes are always symmetrical (winner gains what loser loses)

---

## API Design

Base URL: `/api/v1`

### Public Endpoints

```
GET  /clubs/{slug}                    → Club info
GET  /clubs/{slug}/leaderboard        → Players ranked by ELO
GET  /clubs/{slug}/matches/recent     → Last 20 matches with ELO changes
GET  /clubs/{slug}/match-requests     → Pending & upcoming challenges
POST /clubs/{slug}/match-requests     → Create a new challenge (no auth)
PUT  /clubs/{slug}/match-requests/{id}/cancel  → Cancel own request
```

### Admin Endpoints (PIN-protected)

All admin endpoints require header: `X-Admin-PIN: <pin>`

```
POST /clubs/{slug}/admin/verify       → Verify PIN (returns 200/401)
POST /clubs/{slug}/admin/matches      → Record match result → triggers ELO
POST /clubs/{slug}/admin/players      → Add new player
PUT  /clubs/{slug}/admin/players/{id} → Edit player (name, active status)
DELETE /clubs/{slug}/admin/players/{id} → Deactivate player
PUT  /clubs/{slug}/admin/match-requests/{id} → Update request status
```

### Key Request/Response Shapes

#### Record Match (Admin)
```json
POST /clubs/{slug}/admin/matches
{
  "winner_id": "uuid",
  "loser_id": "uuid",
  "played_at": "2026-07-11T18:30:00Z",
  "notes": "optional"
}
→ 201 {
  "match": { ... },
  "winner": { "name": "Alice", "elo_before": 1050, "elo_after": 1066 },
  "loser":  { "name": "Bob",   "elo_before": 1050, "elo_after": 1034 }
}
```

#### Create Match Request (Public)
```json
POST /clubs/{slug}/match-requests
{
  "challenger_id": "uuid",
  "opponent_id": "uuid",
  "message": "Want to play Thursday?",
  "scheduled_for": "2026-07-17T19:00:00Z"
}
→ 201 { "id": "uuid", "status": "pending", ... }
```

---

## Frontend

### Pages & Routes

| Route              | View             | Description                                   |
|--------------------|------------------|-----------------------------------------------|
| `/`                | Club Selector    | Pick a club (or redirect if only one)         |
| `/:slug`           | Dashboard        | Leaderboard + Notice Board + Recent Results   |
| `/:slug/challenge` | Challenge Form   | Pick two players, submit a match request      |
| `/:slug/admin`     | Admin Panel      | PIN gate → record results, manage players     |

### Dashboard Layout

```
┌──────────────────────────────────────────────┐
│  Club Name                        [Admin]    │
├──────────────────┬───────────────────────────┤
│                  │                           │
│   LEADERBOARD    │     NOTICE BOARD          │
│                  │                           │
│   #1 Alice 1250  │  🏓 Alice vs Bob          │
│   #2 Bob   1180  │     Thursday 7pm          │
│   #3 Carol 1120  │                           │
│   #4 Dave  1050  │  🏓 Carol vs Dave         │
│   ...            │     "Best of 3?"          │
│                  │                           │
│                  │  [+ Challenge Someone]    │
├──────────────────┴───────────────────────────┤
│               RECENT RESULTS                 │
│                                              │
│  Alice beat Bob (+16 / -16)     Jul 10       │
│  Carol beat Dave (+22 / -22)    Jul 9        │
│  Bob beat Carol (+18 / -18)     Jul 8        │
└──────────────────────────────────────────────┘
```

### Admin Panel Layout

```
┌──────────────────────────────────────────────┐
│  Admin — Club Name                [← Back]   │
├──────────────────────────────────────────────┤
│                                              │
│  RECORD MATCH                                │
│  ┌──────────┐  defeated  ┌──────────┐        │
│  │ Winner ▼ │            │ Loser  ▼ │        │
│  └──────────┘            └──────────┘        │
│  Date: [today]    Notes: [optional]          │
│                          [Record Match]      │
│                                              │
├──────────────────────────────────────────────┤
│  MANAGE PLAYERS                              │
│  [+ Add Player]                              │
│  Alice (1250)  [Edit] [Deactivate]           │
│  Bob   (1180)  [Edit] [Deactivate]           │
│  ...                                         │
├──────────────────────────────────────────────┤
│  PENDING REQUESTS                            │
│  Alice → Bob (Thu 7pm) [Mark Completed]      │
└──────────────────────────────────────────────┘
```

### Design Direction

The vibe should be sporty but clean — think club bulletin board meets modern web. Not corporate, not gamified. A colour palette grounded in table tennis: deep blue/green (the table), white and orange (the ball), with a clean neutral background. The leaderboard should feel satisfying to look at — clear rank indicators, subtle movement animations when ELO changes.

---

## Hosting & Deployment

### Frontend (Free)

**Option A — GitHub Pages:**
- Build React app with Vite → `dist/` folder
- Deploy via GitHub Actions on push to `main`
- Custom domain optional

**Option B — Azure Static Web Apps:**
- Same build output
- Free tier includes custom domains + SSL
- Integrated GitHub Actions deployment

### Backend

**Option A — Azure App Service (Free/Basic tier):**
- Containerised FastAPI app
- Free tier: 60 CPU-minutes/day (plenty for this)
- SQLite file persists on app storage

**Option B — Railway / Render:**
- Free hobby tier
- Git-push deploy
- Small persistent volume for SQLite

**Option C — Azure Functions (Consumption):**
- Pay-per-request (effectively free at this scale)
- Slightly more complex setup with FastAPI adapter

### Recommended: GitHub Pages (frontend) + Azure App Service Free tier (backend)

This gives you zero cost and you already know Azure.

---

## Project Structure

```
pongpoints/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── NoticeBoard.jsx
│   │   │   ├── RecentMatches.jsx
│   │   │   ├── ChallengeForm.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── RecordMatch.jsx
│   │   │   ├── ManagePlayers.jsx
│   │   │   └── PinGate.jsx
│   │   ├── hooks/
│   │   │   └── useApi.js
│   │   ├── pages/
│   │   │   ├── ClubSelector.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Admin.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic request/response
│   │   ├── database.py          # DB session setup
│   │   ├── elo.py               # ELO calculation engine
│   │   ├── routers/
│   │   │   ├── public.py        # Public endpoints
│   │   │   └── admin.py         # Admin endpoints
│   │   └── seed.py              # Initial club + player seeding
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml
│       └── deploy-backend.yml
├── DESIGN.md
└── README.md
```

---

## Implementation Order

### Phase 1 — Core (MVP)
1. Backend: Database models, migrations, seed script
2. Backend: ELO engine with unit tests
3. Backend: Public API (leaderboard, recent matches)
4. Backend: Admin API (record match, manage players)
5. Frontend: Dashboard page (leaderboard + recent results)
6. Frontend: Admin panel (PIN gate + record match + manage players)
7. Deploy

### Phase 2 — Social
8. Backend: Match request endpoints
9. Frontend: Notice board component
10. Frontend: Challenge form
11. Deploy

### Phase 3 — Polish
12. Responsive design pass
13. ELO change animations on leaderboard
14. Player profile cards (click a name → stats popup)
15. Head-to-head record in challenge form
16. Admin: undo last match (in case of mistakes)

---

## Open Questions / Future Ideas

- **Doubles support**: Could add later — separate ELO ladder for doubles pairs
- **Season resets**: Reset everyone to 1000 at start of a new season?
- **Achievements/badges**: "5-win streak", "Giant killer" (beat someone 200+ ELO above)
- **Practice vs competitive toggle**: Some matches "just for fun" (no ELO)
- **Push notifications**: Notify when someone challenges you (requires auth)
