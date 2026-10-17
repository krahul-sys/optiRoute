from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from .. import db
from ..engine import EngineError, run_engine
from ..schemas import RouteIn, RouteOptimizeIn, WarehouseIn
from ..security import require_admin

router = APIRouter(prefix="/api/graph", tags=["Logistics Map (Graph Algorithms)"])


def _load_network():
    warehouses = db.query(
        "SELECT warehouse_id, name, x_coord, y_coord, capacity_kg "
        "FROM warehouses ORDER BY warehouse_id"
    )
    routes = db.query(
        "SELECT route_id, source_id, dest_id, distance_km FROM transit_routes ORDER BY route_id"
    )
    index = {w["warehouse_id"]: i for i, w in enumerate(warehouses)}
    return warehouses, routes, index


@router.get("/summary")
def summary():
    warehouses, routes, _ = _load_network()
    return {"warehouses": warehouses, "routes": routes}


@router.post("/warehouses", dependencies=[Depends(require_admin)])
def create_warehouse(payload: WarehouseIn):
    sql = (
        "INSERT INTO warehouses (name, x_coord, y_coord, capacity_kg) "
        "VALUES (:name, :x, :y, :cap)"
    )
    try:
        new_id = db.insert_returning_id(
            sql,
            "warehouse_id",
            {
                "name": payload.name,
                "x": payload.x_coord,
                "y": payload.y_coord,
                "cap": payload.capacity_kg,
            },
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=db.translate_oracle_error(exc))
    return {"warehouse_id": new_id, "status": "CREATED"}


@router.post("/routes", dependencies=[Depends(require_admin)])
def create_route(payload: RouteIn):
    sql = (
        "INSERT INTO transit_routes (source_id, dest_id, distance_km) "
        "VALUES (:s, :d, :w)"
    )
    try:
        new_id = db.insert_returning_id(
            sql,
            "route_id",
            {"s": payload.source_id, "d": payload.dest_id, "w": payload.distance_km},
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=db.translate_oracle_error(exc))
    return {"route_id": new_id, "status": "CREATED"}


@router.delete("/warehouses/{warehouse_id}", dependencies=[Depends(require_admin)])
def delete_warehouse(warehouse_id: int):
    affected = db.execute("DELETE FROM warehouses WHERE warehouse_id = :id", {"id": warehouse_id})
    if affected == 0:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return {"deleted": affected}


@router.post("/optimize")
async def optimize_route(payload: RouteOptimizeIn):
    """Dijkstra single-source shortest path via the C++ engine."""
    warehouses, routes, index = _load_network()
    if payload.source_id not in index or payload.target_id not in index:
        raise HTTPException(status_code=404, detail="Unknown warehouse id")

    s, t = index[payload.source_id], index[payload.target_id]
    lines = [f"{len(warehouses)} {len(routes)} {s} {t}"]
    for r in routes:
        lines.append(f"{index[r['source_id']]} {index[r['dest_id']]} {r['distance_km']}")
    payload_text = "\n".join(lines) + "\n"

    try:
        result = await run_engine("dijkstra", payload_text)
    except EngineError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    names = {i: w["name"] for i, w in enumerate(warehouses)}
    ids = {i: w["warehouse_id"] for i, w in enumerate(warehouses)}
    path_idx = result.get("path", [])
    result["pathNames"] = [names[i] for i in path_idx]
    result["path"] = [ids[i] for i in path_idx]
    result["sql"] = "SELECT source_id, dest_id, distance_km FROM transit_routes"
    return result


@router.post("/mst")
async def minimum_spanning_tree():
    """Kruskal MST — optimal distribution backbone layout."""
    warehouses, routes, index = _load_network()
    lines = [f"{len(warehouses)} {len(routes)}"]
    for r in routes:
        lines.append(f"{index[r['source_id']]} {index[r['dest_id']]} {r['distance_km']}")
    payload_text = "\n".join(lines) + "\n"

    try:
        result = await run_engine("mst", payload_text)
    except EngineError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    ids = {i: w["warehouse_id"] for i, w in enumerate(warehouses)}
    for e in result.get("edges", []):
        e["source_id"] = ids.get(e["u"])
        e["dest_id"] = ids.get(e["v"])
    result["sql"] = "SELECT source_id, dest_id, distance_km FROM transit_routes"
    return result
