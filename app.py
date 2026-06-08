import logging
import os
import time

import psycopg2
from flask import Flask, Response, jsonify, request, send_from_directory
from flask.typing import ResponseReturnValue
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

from api import (
    generate_audio_with_custom_data,
    generate_audio_with_data,
    history,
    popular,
)
from db import init_pool


def wait_for_database() -> None:
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            init_pool()
            return
        except psycopg2.OperationalError:  # noqa: PERF203
            if attempt < max_attempts - 1:
                print(
                    f"Database not ready, waiting 30s... (attempt {attempt + 1}/{max_attempts})"
                )
                time.sleep(30)
            else:
                raise


wait_for_database()

app = Flask(__name__, static_folder="static", static_url_path="")
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
app.config["RATELIMIT_ENABLED"] = (
    os.getenv("RATELIMIT_ENABLED", "true").lower() == "true"
)
app.config["MAX_CONTENT_LENGTH"] = 200_000

if __name__ != "__main__":
    gunicorn_logger = logging.getLogger("gunicorn.error")
    logging.getLogger().handlers = gunicorn_logger.handlers
    logging.getLogger().setLevel(gunicorn_logger.level)

CORS(app, resources={r"^/(massbank|custom|history|popular)(/.*)?$": {"origins": "*"}})

limiter = Limiter(
    get_remote_address,
    app=app,
    storage_uri="memory://",
)

audio_limit = limiter.limit("15 per minute")
history_limit = limiter.shared_limit("30 per minute", scope="read-endpoints")


@app.errorhandler(Exception)
def handle_unexpected(e: Exception) -> ResponseReturnValue:
    if isinstance(e, HTTPException):
        return e
    app.logger.exception("unhandled exception")
    return jsonify({"error": "Internal server error"}), 500


@app.errorhandler(429)
def rate_limit_exceeded(e: HTTPException) -> tuple[Response, int]:
    return jsonify({"error": "Too many requests"}), 429


@app.errorhandler(413)
def request_too_large(e: HTTPException) -> tuple[Response, int]:
    return jsonify({"error": "Request body too large"}), 413


@app.route("/")
def serve_index() -> Response:
    return send_from_directory("static", "index.html")


@app.route("/health")
def health() -> tuple[dict[str, str], int]:
    return {"status": "ok"}, 200


# Temporary: confirms CF-Connecting-IP carries the real client IP while
# remote_addr resolves to the rotating Cloudflare edge IP. Remove after verifying.
@app.route("/whoami")
def whoami() -> Response:
    return jsonify(
        {
            "cf_connecting_ip": request.headers.get("CF-Connecting-IP"),
            "x_forwarded_for": request.headers.get("X-Forwarded-For"),
            "remote_addr": request.remote_addr,
        }
    )


app.route("/history", methods=["GET"])(history_limit(history))
app.route("/massbank/<algorithm>", methods=["POST"])(
    audio_limit(generate_audio_with_data)
)
app.route("/custom/<algorithm>", methods=["POST"])(
    audio_limit(generate_audio_with_custom_data)
)
app.route("/popular", methods=["GET"])(history_limit(popular))


@app.route("/<path:path>")
def serve_static_or_spa(path: str) -> Response:
    try:
        return send_from_directory("static", path)
    except FileNotFoundError:
        return send_from_directory("static", "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=os.getenv("FLASK_DEBUG", "False") == "1")  # noqa: S104
