import logging
from typing import TypedDict

from db import get_db_cursor

logger = logging.getLogger(__name__)


class SearchHistoryEntry(TypedDict):
    accession: str
    compound: str
    created_at: str


class PopularCompound(TypedDict):
    compound: str
    search_count: int


def log_search(compound: str, accession: str) -> None:
    try:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                """
                INSERT INTO search_history (accession, compound)
                VALUES (%s, %s)
                """,
                (accession, compound),
            )
    except Exception:
        logger.exception("Failed to log search")


def get_search_history(limit: int) -> list[SearchHistoryEntry]:
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT accession, compound, created_at
                FROM search_history
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,),
            )

            rows = cursor.fetchall()

            return [
                {"accession": row[0], "compound": row[1], "created_at": row[2].isoformat()}
                for row in rows
            ]
    except Exception:
        logger.exception("Failed to get recently generated compounds")
        return []


def get_popular_compounds(limit: int) -> list[PopularCompound]:
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT compound, COUNT(*) as search_count
                FROM search_history
                WHERE compound IS NOT NULL
                GROUP BY compound
                ORDER BY search_count DESC
                LIMIT %s
                """,
                (limit,),
            )

            rows = cursor.fetchall()

            return [{"compound": row[0], "search_count": row[1]} for row in rows]
    except Exception:
        logger.exception("Failed to get most generated compounds")
        return []
