import os

bind = "0.0.0.0:5000"
workers = int(os.environ.get("GUNICORN_WORKERS", 1))
worker_class = "sync"
preload_app = True


def post_fork(server, worker):
    """
    Re-initialize the DB connection pool in each worker after forking.

    Without this, all workers inherit the same connection pool from the master
    process, causing them to share underlying socket file descriptors. This is
    not safe and becomes a real problem with more than one worker.
    """
    from db import close_all_connections, init_pool

    close_all_connections()
    init_pool()
