import base64
from typing import Any

from flask import request

from audio import generate_combined_wav_bytes_and_data, parse_spectrum_text
from db import (
    get_massbank_peaks,
    get_popular_compounds,
    get_search_history,
    log_search,
)
from utils import notify_audio_generated_async

from .validation import (
    AudioParametersBase,
    validate_algorithm,
    validate_and_parse_parameters,
    validate_spectrum_text_range,
)


def _algorithm_parameters(
    algorithm: str, params: AudioParametersBase
) -> dict[str, float]:
    if algorithm == "linear":
        return {"offset": params["offset"]}
    if algorithm == "inverse":
        return {"scale": params["scale"], "shift": params["shift"]}
    if algorithm == "modulo":
        return {
            "factor": params["factor"],
            "modulus": params["modulus"],
            "base": params["base"],
        }
    return {}


def history() -> tuple[dict[str, Any], int]:
    limit = request.args.get("limit", default=20, type=int)
    limit = max(1, min(limit, 100))
    history_data = get_search_history(limit=limit)
    return {"history": history_data}, 200


def popular() -> tuple[dict[str, Any], int]:
    limit = request.args.get("limit", default=20, type=int)
    limit = max(1, min(limit, 100))
    popular_data = get_popular_compounds(limit=limit)
    return {"popular": popular_data}, 200


def generate_audio_with_data(algorithm: str) -> tuple[dict[str, Any], int]:
    try:
        validate_algorithm(algorithm)
    except ValueError as e:
        return {"error": str(e)}, 400

    data: dict[str, Any] | None = request.get_json()

    try:
        params = validate_and_parse_parameters(data)
    except ValueError as e:
        return {"error": str(e)}, 400

    try:
        compound_data = get_massbank_peaks(params["compound"])

        wav_buffer, transformed_data = generate_combined_wav_bytes_and_data(
            compound_data["spectrum"],
            algorithm=algorithm,
            offset=params["offset"],
            scale=params["scale"],
            shift=params["shift"],
            factor=params["factor"],
            modulus=params["modulus"],
            base=params["base"],
            duration=params["duration"],
            sample_rate=params["sample_rate"],
            hq=params["hq"],
        )
        audio_base64 = base64.b64encode(wav_buffer.getvalue()).decode()

        log_search(compound_data["compound_name"], compound_data["accession"])

        notify_audio_generated_async(
            compound_data["compound_name"],
            compound_data["accession"],
            algorithm,
            params["duration"],
            params["sample_rate"],
        )

        response_data: dict[str, Any] = {
            "compound": compound_data["compound_name"],
            "accession": compound_data["accession"],
            "audio_base64": audio_base64,
            "spectrum": transformed_data,
            "algorithm": algorithm,
            "parameters": _algorithm_parameters(algorithm, params),
            "audio_settings": {
                "duration": params["duration"],
                "sample_rate": params["sample_rate"],
                "hq": params["hq"],
            },
        }

        return response_data, 200

    except ValueError as e:
        error_msg = str(e)
        if "No records found" in error_msg:
            return {"error": error_msg}, 404
        return {"error": error_msg}, 400


def generate_audio_with_custom_data(algorithm: str) -> tuple[dict[str, Any], int]:
    try:
        validate_algorithm(algorithm)
    except ValueError as e:
        return {"error": str(e)}, 400

    data: dict[str, Any] | None = request.get_json()

    if not data or "spectrum_text" not in data:
        return {"error": "spectrum_text is required"}, 400

    spectrum_text = data["spectrum_text"]
    try:
        validate_spectrum_text_range(spectrum_text)
    except ValueError as e:
        return {"error": str(e)}, 400

    try:
        params = validate_and_parse_parameters(data, require_compound=False)
    except ValueError as e:
        return {"error": str(e)}, 400

    try:
        spectrum = parse_spectrum_text(data["spectrum_text"])

        wav_buffer, transformed_data = generate_combined_wav_bytes_and_data(
            spectrum,
            algorithm=algorithm,
            offset=params["offset"],
            scale=params["scale"],
            shift=params["shift"],
            factor=params["factor"],
            modulus=params["modulus"],
            base=params["base"],
            duration=params["duration"],
            sample_rate=params["sample_rate"],
            hq=params["hq"],
        )
        audio_base64 = base64.b64encode(wav_buffer.getvalue()).decode()

        response_data: dict[str, Any] = {
            "compound": "Custom Compound",
            "accession": "CUSTOM-001",
            "audio_base64": audio_base64,
            "spectrum": transformed_data,
            "algorithm": algorithm,
            "parameters": _algorithm_parameters(algorithm, params),
            "audio_settings": {
                "duration": params["duration"],
                "sample_rate": params["sample_rate"],
                "hq": params["hq"],
            },
        }

        return response_data, 200

    except ValueError as e:
        return {"error": str(e)}, 400
