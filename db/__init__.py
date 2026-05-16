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
from .queries import get_popular_compounds, get_search_history, log_search
from .render_massbank_queries import CompoundData, get_massbank_peaks

__all__ = [
    "init_pool",
    "get_connection",
    "return_connection",
    "get_db_cursor",
    "close_all_connections",
    "log_search",
    "get_search_history",
    "get_popular_compounds",
    "get_massbank_peaks",
    "CompoundData",
]
