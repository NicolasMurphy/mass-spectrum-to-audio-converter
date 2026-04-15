def validate_algorithm(algorithm):
    if algorithm not in ["linear", "inverse", "modulo"]:
        raise ValueError(
            f"Unsupported algorithm: '{algorithm}'. Must be 'linear', 'inverse', or 'modulo'"
        )


def validate_number_range(value, param_name):
    if not (-1_000_000 <= value <= 1_000_000):
        raise ValueError(f"{param_name} must be between -1,000,000 and 1,000,000.")


def validate_and_parse_parameters(data, require_compound=True):
    if not data:
        raise ValueError("No JSON data provided")

    raw_sr = data.get("sample_rate")
    if raw_sr is not None:
        if isinstance(raw_sr, float) or (isinstance(raw_sr, str) and "." in raw_sr):
            raise ValueError("Invalid sample_rate. Must be an integer.")

    if require_compound:
        compound = data.get("compound")
        if not compound or not compound.strip():
            raise ValueError("No compound provided")

        if len(compound) > 349:
            raise ValueError(
                "Compound name is too long. Maximum length is 349 characters."
            )
    else:
        compound = data.get("compound", None)

    try:
        offset = float(data.get("offset", 300))
    except (ValueError, TypeError):
        raise ValueError("Invalid offset. Must be a float.")
    validate_number_range(offset, "offset")

    try:
        scale = float(data.get("scale", 100000))
    except (ValueError, TypeError):
        raise ValueError("Invalid scale. Must be a float.")
    validate_number_range(scale, "scale")

    try:
        shift = float(data.get("shift", 1))
    except (ValueError, TypeError):
        raise ValueError("Invalid shift. Must be a float.")
    validate_number_range(shift, "shift")

    try:
        duration = float(data.get("duration", 5))
    except (ValueError, TypeError):
        raise ValueError("Invalid duration. Must be a float.")

    try:
        sample_rate = int(data.get("sample_rate", 44100))
    except (ValueError, TypeError):
        raise ValueError("Invalid sample_rate. Must be an integer.")

    try:
        factor = float(data.get("factor", 10))
    except (ValueError, TypeError):
        raise ValueError("Invalid factor. Must be a float.")
    validate_number_range(factor, "factor")

    try:
        modulus = float(data.get("modulus", 500))
    except (ValueError, TypeError):
        raise ValueError("Invalid modulus. Must be a float.")
    validate_number_range(modulus, "modulus")

    try:
        base = float(data.get("base", 100))
    except (ValueError, TypeError):
        raise ValueError("Invalid base. Must be a float.")
    validate_number_range(base, "base")

    if not (0.01 <= duration <= 30):
        raise ValueError("Duration must be between 0.01 and 30 seconds.")

    if not 3500 <= sample_rate <= 192000:
        raise ValueError("Sample rate must be between 3500 and 192000.")

    result = {
        "offset": offset,
        "scale": scale,
        "shift": shift,
        "duration": duration,
        "sample_rate": sample_rate,
        "factor": factor,
        "modulus": modulus,
        "base": base,
    }

    if require_compound or compound is not None:
        result["compound"] = compound

    return result


def validate_spectrum_text_range(text):
    if not (3 <= len(text) <= 100000):
        raise ValueError("Spectrum data must be between 3 and 100,000 characters.")
