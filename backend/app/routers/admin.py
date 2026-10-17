from __future__ import annotations

import time

from fastapi import APIRouter

from .. import db

router = APIRouter(prefix="/api/admin", tags=["Database Control (DCL / TCL / PL-SQL)"])


@router.get("/roles")
def roles():
    """DCL matrix surfaced to the Security Simulator panel."""
    return {
        "roles": [
            {
                "role": "ADMIN",
                "session": True,
                "select_warehouses": True,
                "modify_packages": True,
                "modify_schema": True,
            },
            {
                "role": "DRIVER",
                "session": True,
                "select_warehouses": True,
                "modify_packages": True,
                "modify_schema": False,
            },
            {
                "role": "VIEWER",
                "session": True,
                "select_warehouses": True,
                "modify_packages": False,
                "modify_schema": False,
            },
        ],
        "grants": [
            "GRANT SELECT, UPDATE ON packages TO driver_role",
            "GRANT ALL ON warehouses TO admin_role",
            "REVOKE DELETE ON packages FROM driver_role",
        ],
    }


@router.get("/logs")
def logs(limit: int = 30):
    """PL/SQL trigger audit feed (operational_logs CLOB payloads)."""
    rows = db.query(
        "SELECT l.log_id, l.action, l.payload, l.logged_at, p.code AS package_code "
        "FROM operational_logs l LEFT JOIN packages p ON p.package_id = l.package_id "
        "ORDER BY l.log_id DESC FETCH FIRST :lim ROWS ONLY",
        {"lim": limit},
    )
    return {"count": len(rows), "logs": rows}


@router.post("/tcl-sandbox")
def tcl_sandbox():
    """Simulate a mid-batch network failure and prove atomic ROLLBACK safety."""
    steps: list[str] = []
    batch = int(time.time() * 1000) % 100000
    with db.connection() as conn:
        cur = conn.cursor()
        steps.append("BEGIN TRANSACTION")
        try:
            cur.execute(
                "INSERT INTO packages (code, description, weight_kg, declared_value, priority) "
                "VALUES (:code, :descr, :w, :v, :p)",
                {"code": f"TCL-{batch}-A", "descr": "batch A", "w": 40, "v": 1000, "p": 3},
            )
            steps.append("INSERT 1: SUCCESS")

            # Intentionally violate ck_package_priority (BETWEEN 1 AND 5).
            cur.execute(
                "INSERT INTO packages (code, description, weight_kg, declared_value, priority) "
                "VALUES (:code, :descr, :w, :v, :p)",
                {"code": f"TCL-{batch}-B", "descr": "batch B", "w": 55, "v": 2000, "p": 9},
            )
            steps.append("INSERT 2: SUCCESS")

            cur.execute(
                "INSERT INTO packages (code, description, weight_kg, declared_value, priority) "
                "VALUES (:code, :descr, :w, :v, :p)",
                {"code": f"TCL-{batch}-C", "descr": "batch C", "w": 60, "v": 3000, "p": 2},
            )
            steps.append("INSERT 3: SUCCESS")

            conn.commit()
            steps.append("COMMIT")
            return {"outcome": "COMMITTED", "steps": steps}
        except Exception as exc:  # noqa: BLE001
            conn.rollback()
            steps.append("INSERT 2: FAILURE")
            steps.append("EXECUTE ROLLBACK")
            return {
                "outcome": "ROLLED_BACK",
                "steps": steps,
                "error": db.translate_oracle_error(exc),
            }
