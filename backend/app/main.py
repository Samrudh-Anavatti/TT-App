"""FastAPI application entrypoint."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import admin, public
from .seed import seed_if_empty

app = FastAPI(title="PongPoints API", version="0.1.0")

# Comma-separated list of allowed origins; "*" allows all (fine for a public read API).
_origins = os.getenv("CORS_ORIGINS", "*")
allow_origins = ["*"] if _origins.strip() == "*" else [o.strip() for o in _origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    if os.getenv("SEED_ON_STARTUP", "true").lower() == "true":
        seed_if_empty()


@app.get("/api/v1/health", tags=["meta"])
def health():
    return {"status": "ok"}
