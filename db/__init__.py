"""
Database package for mass spectrum to audio converter.

Provides database connection pooling and query functions.
"""

from .connection_pool import (
    close_all_connections,
    get_connection,
    get_db_cursor,
    init_pool,
    return_connection,
)
from .queries import (
    PopularCompound,
    SearchHistoryEntry,
    get_popular_compounds,
    get_search_history,
    log_search,
)
from .render_massbank_queries import CompoundData, get_massbank_peaks

__all__ = [
    "CompoundData",
    "PopularCompound",
    "SearchHistoryEntry",
    "close_all_connections",
    "get_connection",
    "get_db_cursor",
    "get_massbank_peaks",
    "get_popular_compounds",
    "get_search_history",
    "init_pool",
    "log_search",
    "return_connection",
]
