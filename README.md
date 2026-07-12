# 🏓 PongPoints

A lightweight web app for table tennis clubs to track player ELO ratings. Players
view leaderboards, post challenges, and see recent results; club admins record match
outcomes (PIN-protected), which trigger automatic ELO updates. Each club is fully
decoupled by URL slug.

See [DESIGN.md](DESIGN.md) for the full design.

## Stack

| Layer    | Choice                              |
|----------|-------------------------------------|
| Frontend | React + Vite + Tailwind + React Router (HashRouter) |
| Backend  | FastAPI + SQLAlchemy 2.0 + SQLite   |
| Auth     | Admin PIN via `X-Admin-PIN` header (bcrypt) |
| Hosting  | GitHub Pages (frontend) + a separate backend host (e.g. Azure App Service) |

> **Note:** GitHub Pages serves static files only — it cannot run the FastAPI
> backend. The frontend deploys to Pages; the backend needs its own host.

## Project layout

```
backend/   FastAPI app, ELO engine, SQLite, seed script, tests
frontend/  React SPA (dashboard, challenge form, admin panel)
.github/   GitHub Actions (Pages deploy + Azure backend template)
```

## Run locally

Two terminals.

### Backend (http://localhost:8000)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows;  source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

On first boot it seeds two demo clubs:

| Club              | Slug        | Demo PIN |
|-------------------|-------------|----------|
| Northside TTC     | `northside` | `1234`   |
| Riverside Paddlers| `riverside` | `5678`   |

API docs: http://localhost:8000/docs

### Frontend (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

The dev server proxies `/api/*` to the backend, so no env config is needed locally.
Open http://localhost:5173 and pick a club.

## Tests

```bash
cd backend
pytest
```

## Configuration

Backend env vars (see `backend/.env.example`):

- `DATABASE_URL` / `DATA_DIR` — where SQLite lives (swap to Postgres later)
- `CORS_ORIGINS` — comma-separated allowed origins (set to your Pages URL in prod)
- `SEED_ON_STARTUP` — seed demo data on first boot (default `true`)
- `NORTHSIDE_PIN` / `RIVERSIDE_PIN` — admin PINs for the seeded clubs

Frontend build-time env vars:

- `VITE_API_URL` — backend base URL (e.g. `https://<app>.azurewebsites.net/api/v1`).
  Unset locally (uses the dev proxy).
- `VITE_BASE` — base path for GitHub Pages project sites (`/<repo>/`). Set automatically
  by the deploy workflow.

## Deployment

### Frontend → GitHub Pages

Push to `main`; `.github/workflows/deploy-frontend.yml` builds and deploys.
One-time setup:

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Repo **Settings → Secrets and variables → Actions → Variables**: add
   `VITE_API_URL` pointing at your deployed backend.

### Backend → Azure App Service (or Railway/Render)

`.github/workflows/deploy-backend.yml` is a manual-trigger template. Add the
`AZURE_WEBAPP_NAME` and `AZURE_WEBAPP_PUBLISH_PROFILE` secrets, set `CORS_ORIGINS`
to your Pages origin on the web app, then run it from the Actions tab. A `Dockerfile`
is included if you prefer container-based deploys.

## Reconfiguring clubs & PINs

For the first cut, club slugs are seeded in `backend/app/seed.py` and mirrored in
`frontend/src/api.js` (`KNOWN_CLUBS`). To change names, slugs, players, or PINs,
edit the seed script and delete `backend/data/pongpoints.db` to re-seed.
