from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .config import settings
from .engine import engine_latency_ms
from .routers import admin, graph, indexing, packages, reports

logging.basicConfig(level=settings.log_level.upper())
log = logging.getLogger("optiroute")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        db.init_pool()
    except Exception as exc:  # noqa: BLE001
        log.warning("Oracle pool not ready at startup: %s", exc)
    yield
    db.close_pool()


app = FastAPI(
    title="OptiRoute & CoreDB Command Center API",
    version="1.0.0",
    description=(
        "Middleware for the OptiRoute logistics optimizer. Bridges the React "
        "dashboard, the Oracle persistence layer, and the stateless C++ DAA engine."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(packages.router)
app.include_router(indexing.router)
app.include_router(admin.router)
app.include_router(reports.router)


@app.get("/api/health", tags=["System"])
async def health():
    """Powers the global System Status Bar (DB pool + engine latency)."""
    stats = db.pool_stats()
    perceived = 0.0
    try:
        perceived = await engine_latency_ms() or 0.0
    except Exception:  # noqa: BLE001
        pass
    return {
        "database": {"dsn": settings.db_dsn, **stats},
        "engine": {"binary": settings.engine_bin, "latencyMs": perceived},
        "status": "healthy" if stats["healthy"] else "degraded",
    }
