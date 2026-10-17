from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from .. import db
from ..engine import EngineError, run_engine
from ..schemas import HuffmanIn, SortIn

router = APIRouter(prefix="/api/reports", tags=["System Reports (Huffman & Sorting)"])


@router.post("/sort")
async def sort_rows(payload: SortIn):
    """Divide & Conquer sorting of analytical rows via the C++ engine."""
    algo = payload.algorithm if payload.algorithm in {"quicksort", "mergesort"} else "quicksort"
    if payload.rows:
        rows = payload.rows
    else:
        rows = db.query(
            "SELECT package_id AS id, declared_value AS value FROM packages ORDER BY package_id"
        )
    lines = [str(len(rows))]
    lines += [f"{int(r['id'])} {float(r['value'])}" for r in rows]
    try:
        result = await run_engine(algo, "\n".join(lines) + "\n")
    except EngineError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    result["sql"] = "SELECT package_id, declared_value FROM packages"
    return result


@router.post("/huffman")
async def huffman_archive(payload: HuffmanIn):
    """Greedy Huffman compression of operational logs."""
    text = payload.text.replace("\n", " ").replace("\r", " ")
    try:
        result = await run_engine("huffman", text + "\n")
    except EngineError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return result


@router.get("/summary")
def summary():
    """Multi-table JOIN view feeding the exportable summary sheet."""
    rows = db.query(
        "SELECT warehouse_id, name, capacity_kg, route_count, package_count, "
        "total_declared_value FROM v_warehouse_summary ORDER BY warehouse_id"
    )
    return {
        "generated_at": db.query("SELECT TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') AS ts FROM dual")[0]["ts"],
        "view": "v_warehouse_summary",
        "rows": rows,
    }


@router.get("/summary/export", response_class=PlainTextResponse)
def summary_export():
    """Server-rendered CSV export standing in for the PDF printout."""
    rows = db.query(
        "SELECT warehouse_id, name, capacity_kg, route_count, package_count, "
        "total_declared_value FROM v_warehouse_summary ORDER BY warehouse_id"
    )
    header = "warehouse_id,name,capacity_kg,route_count,package_count,total_declared_value"
    lines = [header]
    for r in rows:
        lines.append(
            ",".join(str(r[k]) for k in (
                "warehouse_id", "name", "capacity_kg", "route_count",
                "package_count", "total_declared_value",
            ))
        )
    return "\n".join(lines)
