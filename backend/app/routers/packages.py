from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from .. import db
from ..engine import EngineError, run_engine
from ..schemas import PackageIn, StatusIn
from ..security import require_admin

router = APIRouter(prefix="/api/packages", tags=["Smart Dispatch (Knapsack & Heap)"])

VALID_STATUS = {"PENDING", "PROCESSING", "DISPATCHED", "DELIVERED", "CANCELLED"}


@router.get("")
def list_packages():
    return db.query(
        "SELECT package_id, code, description, weight_kg, declared_value, priority, "
        "status, warehouse_id FROM packages ORDER BY package_id"
    )


@router.post("", dependencies=[Depends(require_admin)])
def create_package(payload: PackageIn):
    sql = (
        "INSERT INTO packages (code, description, weight_kg, declared_value, priority, warehouse_id) "
        "VALUES (:code, :descr, :weight, :value, :priority, :wid)"
    )
    try:
        new_id = db.insert_returning_id(
            sql,
            "package_id",
            {
                "code": payload.code,
                "descr": payload.description,
                "weight": payload.weight_kg,
                "value": payload.declared_value,
                "priority": payload.priority,
                "wid": payload.warehouse_id,
            },
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=db.translate_oracle_error(exc))
    return {"package_id": new_id, "status": "CREATED"}


@router.patch("/{package_id}/status", dependencies=[Depends(require_admin)])
def update_status(package_id: int, payload: StatusIn):
    status = payload.status.upper()
    if status not in VALID_STATUS:
        raise HTTPException(status_code=400, detail=f"Invalid status '{status}'")
    affected = db.execute(
        "UPDATE packages SET status = :status WHERE package_id = :id",
        {"status": status, "id": package_id},
    )
    if affected == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"package_id": package_id, "status": status, "trigger": "trg_package_status_audit"}


@router.post("/heap")
async def build_priority_heap():
    """Max-Heap priority queue of pending orders, computed in C++."""
    pkgs = db.query(
        "SELECT package_id, priority FROM packages "
        "WHERE status = 'PENDING' ORDER BY package_id"
    )
    lines = [str(len(pkgs))]
    lines += [f"{p['package_id']} {p['priority']}" for p in pkgs]
    try:
        result = await run_engine("heap", "\n".join(lines) + "\n")
    except EngineError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    result["sql"] = "SELECT package_id, priority FROM packages WHERE status = 'PENDING'"
    return result


@router.post("/optimize")
async def optimize_loading(
    capacity: float = Query(default=500, gt=0, description="Truck capacity in kg"),
):
    """0/1 Knapsack — most profitable bundle within the weight limit."""
    pkgs = db.query(
        "SELECT package_id, weight_kg, declared_value FROM packages "
        "WHERE status = 'PENDING' ORDER BY package_id"
    )
    lines = [f"{len(pkgs)} {int(capacity)}"]
    lines += [
        f"{p['package_id']} {int(p['weight_kg'])} {p['declared_value']}" for p in pkgs
    ]
    try:
        result = await run_engine("knapsack", "\n".join(lines) + "\n")
    except EngineError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    result["sql"] = "SELECT package_id, weight_kg, declared_value FROM packages WHERE status = 'PENDING'"
    return result
