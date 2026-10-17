from __future__ import annotations


class Settings:
    """Runtime configuration sourced from environment variables."""

    db_dsn: str = "oracle-db:1521/XEPDB1"
    db_user: str = "OPTIROUTE"
    db_password: str = "optiroute"
    engine_bin: str = "/app/engine/engine"
    engine_timeout_ms: int = 5000
    log_level: str = "info"
    db_pool_min: int = 2
    db_pool_max: int = 8

    @classmethod
    def load(cls) -> "Settings":
        import os

        s = cls()
        s.db_dsn = os.getenv("DB_DSN", s.db_dsn)
        s.db_user = os.getenv("DB_USER", s.db_user)
        s.db_password = os.getenv("DB_PASSWORD", s.db_password)
        s.engine_bin = os.getenv("ENGINE_BIN", s.engine_bin)
        s.engine_timeout_ms = int(os.getenv("ENGINE_TIMEOUT_MS", s.engine_timeout_ms))
        s.log_level = os.getenv("LOG_LEVEL", s.log_level)
        return s


settings = Settings.load()
