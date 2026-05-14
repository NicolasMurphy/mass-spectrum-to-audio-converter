import logging
import os
import time

import psycopg2
from flask import Flask, jsonify, send_from_directory
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


def wait_for_database():
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            init_pool()
            return
        except psycopg2.OperationalError:
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
app.config["RATELIMIT_ENABLED"] = os.getenv("RATELIMIT_ENABLED", "true").lower() == "true"
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
def handle_unexpected(e):
    if isinstance(e, HTTPException):
        return e
    app.logger.exception("unhandled exception")
    return jsonify({"error": "Internal server error"}), 500


@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify({"error": "Too many requests"}), 429


@app.errorhandler(413)
def request_too_large(e):
    return jsonify({"error": "Request body too large"}), 413


@app.route("/")
def serve_index():
    return send_from_directory("static", "index.html")


@app.route("/health")
def health():
    return {"status": "ok"}, 200


app.route("/history", methods=["GET"])(history_limit(history))
app.route("/massbank/<algorithm>", methods=["POST"])(audio_limit(generate_audio_with_data))
app.route("/custom/<algorithm>", methods=["POST"])(audio_limit(generate_audio_with_custom_data))
app.route("/popular", methods=["GET"])(history_limit(popular))


@app.route("/<path:path>")
def serve_static_or_spa(path):
    try:
        return send_from_directory("static", path)
    except FileNotFoundError:
        return send_from_directory("static", "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=os.getenv("FLASK_DEBUG", "False") == "1")  # noqa: S104
