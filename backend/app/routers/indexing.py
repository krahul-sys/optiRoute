from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import db
from ..engine import EngineError, run_engine

router = APIRouter(prefix="/api/index", tags=["Core Index Inspector (AVL Tree)"])


def _timestamp_keys() -> tuple[list[int], dict[str, str], dict[str, int]]:
    """Order-tracking entries keyed by creation timestamp (epoch seconds).

    Returns the int32-safe AVL keys plus label maps (key -> package code /
    package id) so the UI can render friendly names instead of raw keys.
    """
    rows = db.query(
        "SELECT package_id, code, created_at FROM packages ORDER BY created_at"
    )
    keys: list[int] = []
    labels: dict[str, str] = {}
    ids: dict[str, int] = {}
    for i, r in enumerate(rows):
        dt = r.get("created_at")
        epoch = int(dt.timestamp()) if dt is not None else 0
        # Guarantee strictly increasing, int32-safe keys for the AVL index.
        key = epoch + i
        keys.append(key)
        labels[str(key)] = r["code"]
        ids[str(key)] = r["package_id"]
    return keys, labels, ids


@router.get("/entries")
def entries():
    rows = db.query(
        "SELECT package_id, code, priority, created_at FROM packages ORDER BY created_at"
    )
    return {"count": len(rows), "entries": rows}


@router.post("/avl")
async def build_avl():
    """Rebuild the self-balancing timestamp index in the C++ engine."""
    keys, labels, ids = _timestamp_keys()
    lines = [str(len(keys))]
    lines += [f"I {k}" for k in keys]
    try:
        result = await run_engine("avl", "\n".join(lines) + "\n")
    except EngineError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    result["keys"] = keys
    result["keyLabels"] = labels
    result["keyIds"] = ids
    result["sql"] = "SELECT package_id, code, created_at FROM packages ORDER BY created_at"
    return result
