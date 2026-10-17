from __future__ import annotations

from enum import Enum
from fastapi import Header, HTTPException, status


class Role(str, Enum):
    ADMIN = "ADMIN"
    DRIVER = "DRIVER"
    VIEWER = "VIEWER"


def current_role(
    x_user_role: str | None = Header(default=None, alias="X-User-Role")
) -> Role:
    """Read the caller's simulated Oracle role from the request header."""
    if not x_user_role:
        return Role.VIEWER
    try:
        return Role(x_user_role.upper())
    except ValueError:
        return Role.VIEWER


def require_admin(x_user_role: str | None = Header(default=None, alias="X-User-Role")) -> Role:
    """DCL enforcement gate: the middleware blocks non-admin writes before
    they ever reach the database, mirroring Oracle role restrictions."""
    role = current_role(x_user_role)
    if role is not Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{role.value}' is not permitted to perform write operations.",
        )
    return role
