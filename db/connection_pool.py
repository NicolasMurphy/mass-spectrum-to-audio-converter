import os
from collections.abc import Generator
from contextlib import contextmanager
from typing import Any, cast

import psycopg2.pool
from dotenv import load_dotenv
from psycopg2.extensions import connection, cursor

load_dotenv()

connection_pool: psycopg2.pool.SimpleConnectionPool | None = None


def init_pool(config: dict[str, Any] | None = None) -> None:
    global connection_pool

    # Pool already initialized (e.g. by post_fork hook before module load)
    if connection_pool is not None:
        return

    if config is None:
        config = {
            "minconn": 1,
            "maxconn": 5,
            "dbname": os.getenv("DB_NAME"),
            "user": os.getenv("DB_USER"),
            "password": os.getenv("DB_PASSWORD"),
            "host": os.getenv("DB_HOST"),
            "port": int(os.getenv("DB_PORT", 5432)),
        }

    connection_pool = psycopg2.pool.SimpleConnectionPool(**config)


def get_connection() -> connection:
    if connection_pool is None:
        raise RuntimeError("Connection pool not initialized. Call init_pool() first.")
    return cast(connection, connection_pool.getconn())  # pyright: ignore[reportUnknownMemberType]


def return_connection(conn: connection) -> None:
    if connection_pool is None:
        raise RuntimeError("Connection pool not initialized. Call init_pool() first.")
    connection_pool.putconn(conn)  # pyright: ignore[reportUnknownMemberType]


@contextmanager
def get_db_cursor(commit: bool = False) -> Generator[cursor]:
    conn: connection | None = None
    cur: cursor | None = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        yield cur
        if commit:
            conn.commit()
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            return_connection(conn)


def close_all_connections() -> None:
    global connection_pool
    if connection_pool is not None:
        connection_pool.closeall()
        connection_pool = None  # Allow re-initialization after close
