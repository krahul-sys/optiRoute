from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from .config import settings

log = logging.getLogger("optiroute.engine")


class EngineError(RuntimeError):
    pass


async def run_engine(algo: str, payload: str = "") -> dict[str, Any]:
    """Spawn the compiled C++ binary, pipe `payload` to stdin, parse stdout JSON.

    The binary is stateless: it is hydrated from the text stream, computes,
    prints a single JSON line, and terminates immediately.
    """
    try:
        proc = await asyncio.create_subprocess_exec(
            settings.engine_bin,
            f"--algo={algo}",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError as exc:  # pragma: no cover
        raise EngineError(f"engine binary not found at {settings.engine_bin}") from exc

    timeout = settings.engine_timeout_ms / 1000.0
    try:
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(payload.encode("utf-8")), timeout=timeout
        )
    except asyncio.TimeoutError as exc:
        proc.kill()
        await proc.wait()
        raise EngineError(f"engine timed out after {settings.engine_timeout_ms} ms") from exc

    if proc.returncode != 0:
        raise EngineError(
            f"engine exited with code {proc.returncode}: {stderr.decode('utf-8', 'ignore')}"
        )

    out = stdout.decode("utf-8", "ignore").strip()
    if not out:
        raise EngineError("engine produced no output")
    try:
        return json.loads(out)
    except json.JSONDecodeError as exc:
        raise EngineError(f"invalid engine output: {out[:200]}") from exc


async def engine_latency_ms() -> float | None:
    """Cheap health probe used by the status bar."""
    try:
        result = await run_engine("heap", "0\n")
        return float(result.get("executionMs", 0.0))
    except EngineError:
        return None
