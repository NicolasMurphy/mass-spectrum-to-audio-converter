import os
import threading
from collections.abc import Mapping, Sequence
from typing import Any

import requests

# The station picker expects:
#   - 1-100 peaks
#   - each frequency in audible range [20, 20000] Hz
#   - each amplitude in [0, 1]
# We filter and (if needed) truncate to most-prominent peaks before sending.
MIN_AUDIBLE_HZ = 20.0
MAX_AUDIBLE_HZ = 20000.0
MAX_PEAKS = 100


def _build_payload(
    compound_name: str,
    accession: str,
    algorithm: str,
    parameters: dict[str, float],
    transformed_data: Sequence[Mapping[str, Any]],
) -> dict[str, Any] | None:
    """Reshape transformed_data into the picker's expected payload, or return
    None if there are no peaks in the audible range to send."""
    valid_peaks = [
        p
        for p in transformed_data
        if MIN_AUDIBLE_HZ <= p["frequency"] <= MAX_AUDIBLE_HZ
    ]
    if not valid_peaks:
        return None

    # If the spectrum has more peaks than the picker accepts, keep the most
    # prominent by normalized amplitude.
    if len(valid_peaks) > MAX_PEAKS:
        valid_peaks = sorted(
            valid_peaks, key=lambda p: p["amplitude_linear"], reverse=True
        )[:MAX_PEAKS]

    return {
        "compound": compound_name,
        "accession": accession,
        "algorithm": algorithm,
        "parameters": parameters,
        "frequencies": [p["frequency"] for p in valid_peaks],
        "amplitudes": [p["amplitude_linear"] for p in valid_peaks],
    }


def send_station_notification(
    compound_name: str,
    accession: str,
    algorithm: str,
    parameters: dict[str, float],
    transformed_data: Sequence[Mapping[str, Any]],
) -> None:
    """Send compound event to the generative-station picker webhook."""
    url = os.getenv("STATION_WEBHOOK_URL")
    secret = os.getenv("STATION_WEBHOOK_SECRET")

    if not url or not secret:
        return

    payload = _build_payload(
        compound_name, accession, algorithm, parameters, transformed_data
    )
    if payload is None:
        print(f"Station webhook skipped (no audible peaks): {compound_name}")
        return

    headers = {"Authorization": f"Bearer {secret}"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        if response.status_code == 200:
            print(
                f"Station webhook sent: {compound_name} ({len(payload['frequencies'])} peaks)"
            )
        else:
            print(f"Station webhook failed {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Station webhook request failed: {e}")


def notify_station_async(
    compound_name: str,
    accession: str,
    algorithm: str,
    parameters: dict[str, float],
    transformed_data: Sequence[Mapping[str, Any]],
) -> None:
    """Fire send_station_notification on a daemon thread so the audio response
    returns immediately. Matches the Discord webhook pattern."""

    def _send() -> None:
        send_station_notification(
            compound_name, accession, algorithm, parameters, transformed_data
        )

    threading.Thread(target=_send, daemon=True).start()
