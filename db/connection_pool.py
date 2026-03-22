import psycopg2.pool
import os
from dotenv import load_dotenv

load_dotenv()

connection_pool = None


def init_pool(config=None):
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


def get_connection():
    if connection_pool is None:
        raise RuntimeError("Connection pool not initialized. Call init_pool() first.")
    return connection_pool.getconn()


def return_connection(conn):
    if connection_pool is None:
        raise RuntimeError("Connection pool not initialized. Call init_pool() first.")
    connection_pool.putconn(conn)


def close_all_connections():
    global connection_pool
    if connection_pool is not None:
        connection_pool.closeall()
        connection_pool = None  # Allow re-initialization after close
