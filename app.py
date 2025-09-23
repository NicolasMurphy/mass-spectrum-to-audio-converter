import os
import time
import psycopg2
from flask import Flask, send_from_directory
from flask_cors import CORS
from db import init_pool
from api import (
    history,
    generate_audio_with_data,
    generate_audio_with_custom_data,
    popular,
)


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

if os.getenv("FLASK_ENV") == "development":
    CORS(app)


@app.route("/")
def serve_index():
    return send_from_directory("static", "index.html")


app.route("/history", methods=["GET"])(history)
app.route("/massbank/<algorithm>", methods=["POST"])(generate_audio_with_data)
app.route("/custom/<algorithm>", methods=["POST"])(generate_audio_with_custom_data)
app.route("/popular", methods=["GET"])(popular)


@app.route("/<path:path>")
def serve_static_or_spa(path):
    try:
        return send_from_directory("static", path)
    except FileNotFoundError:
        return send_from_directory("static", "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
