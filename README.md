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

On first boot it seeds two empty clubs (add players via the admin panel):

| Club             | Slug           | PIN env var        |
|------------------|----------------|--------------------|
| Stanmore TTC     | `stanmore`     | `STANMORE_PIN`     |
| York Gardens TTC | `york-gardens` | `YORKGARDENS_PIN`  |

PINs default to `changeme` locally; set the env vars (or App Service settings) for real ones.

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
- `SEED_ON_STARTUP` — seed clubs on first boot when the DB is empty (default `true`)
- `STANMORE_PIN` / `YORKGARDENS_PIN` — admin PINs for the seeded clubs

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

### Backend → Azure App Service (GitHub Actions)

Same style as the frontend: `.github/workflows/deploy-backend.yml` runs tests and
deploys on push to `main` (paths `backend/**`). One-time Azure setup:

1. **Create the Web App** — a Linux App Service running **Python 3.11** (Free F1 tier
   is enough). Note its name.
2. **Configure the Web App** (Configuration → Application settings):

   | Setting | Value |
   |---------|-------|
   | `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |
   | `DATA_DIR` | `/home/data` |
   | `CORS_ORIGINS` | `https://<username>.github.io` |
   | `SEED_ON_STARTUP` | `true` |
   | `STANMORE_PIN` / `YORKGARDENS_PIN` | your real PINs |

   Startup command (see `backend/startup.sh`):
   ```
   bash startup.sh
   ```
3. **Wire up GitHub** — add repo **Variable** `AZURE_WEBAPP_NAME` and **Secret**
   `AZURE_WEBAPP_PUBLISH_PROFILE` (Web App → "Get publish profile"). Until the
   variable is set, the deploy step is skipped and tests still run green.

Then set the frontend's `VITE_API_URL` variable to `https://<app>.azurewebsites.net/api/v1`
and re-run the frontend workflow. A `Dockerfile` is included if you prefer container deploys.

## Reconfiguring clubs & PINs

For the first cut, club slugs are seeded in `backend/app/seed.py` and mirrored in
`frontend/src/api.js` (`KNOWN_CLUBS`). To change names, slugs, players, or PINs,
edit the seed script and delete `backend/data/pongpoints.db` to re-seed.
