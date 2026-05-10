from flask import request
from audio import parse_spectrum_text
from db import get_search_history, get_popular_compounds
from .validation import (
    validate_algorithm,
    validate_and_parse_parameters,
    validate_spectrum_text_range,
)
from services import AudioGenerationService, CompoundDataService, NotificationService


audio_service = AudioGenerationService()
compound_service = CompoundDataService()
notification_service = NotificationService()


def history():
    try:
        limit = request.args.get("limit", default=20, type=int)
        limit = max(1, min(limit, 100))
        history_data = get_search_history(limit=limit)
        return {"history": history_data}, 200
    except Exception:
        return {"error": "Internal server error"}, 500


def popular():
    try:
        limit = request.args.get("limit", default=20, type=int)
        limit = max(1, min(limit, 100))
        popular_data = get_popular_compounds(limit=limit)
        return {"popular": popular_data}, 200
    except Exception:
        return {"error": "Internal server error"}, 500


def generate_audio_with_data(algorithm):
    try:
        validate_algorithm(algorithm)
    except ValueError as e:
        return {"error": str(e)}, 400

    data = request.get_json()

    try:
        params = validate_and_parse_parameters(data)
    except ValueError as e:
        return {"error": str(e)}, 400

    try:
        compound_data = compound_service.get_compound_spectrum(params["compound"])

        audio_result = audio_service.generate_audio_from_spectrum(
            compound_data["spectrum"], algorithm, params
        )

        compound_service.log_compound_search(
            compound_data["compound_name"], compound_data["accession"]
        )

        notification_service.notify_audio_generated(
            compound_data["compound_name"],
            compound_data["accession"],
            algorithm,
            params["duration"],
            params["sample_rate"],
        )

        response_data = {
            "compound": compound_data["compound_name"],
            "accession": compound_data["accession"],
            "audio_base64": audio_result["audio_base64"],
            "spectrum": audio_result["transformed_data"],
            "algorithm": algorithm,
            "parameters": audio_service.get_algorithm_parameters(algorithm, params),
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
        else:
            return {"error": error_msg}, 400
    except Exception:
        return {"error": "Internal server error"}, 500


def generate_audio_with_custom_data(algorithm):
    try:
        validate_algorithm(algorithm)
    except ValueError as e:
        return {"error": str(e)}, 400

    data = request.get_json()

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

        audio_result = audio_service.generate_audio_from_spectrum(
            spectrum, algorithm, params
        )

        compound_name = "Custom Compound"
        accession = "CUSTOM-001"

        response_data = {
            "compound": compound_name,
            "accession": accession,
            "audio_base64": audio_result["audio_base64"],
            "spectrum": audio_result["transformed_data"],
            "algorithm": algorithm,
            "parameters": audio_service.get_algorithm_parameters(algorithm, params),
            "audio_settings": {
                "duration": params["duration"],
                "sample_rate": params["sample_rate"],
                "hq": params["hq"],
            },
        }

        return response_data, 200

    except ValueError as e:
        return {"error": str(e)}, 400
    except Exception:
        return {"error": "Internal server error"}, 500
