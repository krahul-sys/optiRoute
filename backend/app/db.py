from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Any, Iterable

import oracledb

from .config import settings

log = logging.getLogger("optiroute.db")

# Return CLOBs as plain str instead of LOB objects.
oracledb.defaults.fetch_lobs = False

_pool: oracledb.ConnectionPool | None = None


def init_pool() -> oracledb.ConnectionPool:
    """Open the long-lived connection pool to Oracle (called on startup)."""
    global _pool
    if _pool is None:
        _pool = oracledb.create_pool(
            user=settings.db_user,
            password=settings.db_password,
            dsn=settings.db_dsn,
            min=settings.db_pool_min,
            max=settings.db_pool_max,
            increment=1,
        )
        log.info("Oracle connection pool established -> %s", settings.db_dsn)
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


def pool_stats() -> dict[str, Any]:
    if _pool is None:
        return {"open": 0, "busy": 0, "healthy": False}
    return {
        "open": _pool.opened,
        "busy": _pool.busy,
        "healthy": True,
    }


@contextmanager
def connection():
    if _pool is None:
        init_pool()
    conn = _pool.acquire()
    try:
        yield conn
    finally:
        _pool.release(conn)


def rows_to_dicts(cursor) -> list[dict[str, Any]]:
    cols = [d[0].lower() for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def query(sql: str, params: dict | None = None) -> list[dict[str, Any]]:
    with connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, params or {})
        return rows_to_dicts(cur)


def execute(sql: str, params: dict | None = None, commit: bool = True) -> int:
    with connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, params or {})
        affected = cur.rowcount
        if commit:
            conn.commit()
        return affected


def insert_returning_id(sql: str, id_col: str, params: dict | None = None) -> int:
    """Run an INSERT and return the generated identity value via RETURNING."""
    bind = dict(params or {})
    with connection() as conn:
        cur = conn.cursor()
        out_var = cur.var(oracledb.NUMBER)
        bind["new_id"] = out_var
        cur.execute(f"{sql} RETURNING {id_col} INTO :new_id", bind)
        new_id = int(out_var.getvalue()[0])
        conn.commit()
        return new_id


# Oracle error translation for graceful frontend messaging -------------------
ORA_MESSAGES = {
    "ORA-02292": "Cannot delete: dependent child records still reference this row.",
    "ORA-02291": "Parent key not found: referenced record does not exist.",
    "ORA-00001": "Duplicate value violates a unique constraint.",
    "ORA-01400": "A required (NOT NULL) field was left empty.",
    "ORA-02290": "A CHECK constraint rejected the supplied value.",
    "ORA-20001": "Stored procedure raised a business-rule error.",
}


def translate_oracle_error(exc: Exception) -> str:
    text = str(exc)
    for code, message in ORA_MESSAGES.items():
        if code in text:
            return f"{message} ({code})"
    return text
