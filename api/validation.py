from typing import Any, Literal, TypedDict, cast, overload


class AudioParametersBase(TypedDict):
    offset: float
    scale: float
    shift: float
    duration: float
    sample_rate: int
    factor: float
    modulus: float
    base: float
    hq: bool


class AudioParameters(AudioParametersBase):
    compound: str


def validate_algorithm(algorithm: str) -> None:
    if algorithm not in ["linear", "inverse", "modulo"]:
        raise ValueError(
            f"Unsupported algorithm: '{algorithm}'. Must be 'linear', 'inverse', or 'modulo'"
        )


def validate_number_range(value: float, param_name: str) -> None:
    if not (-1_000_000 <= value <= 1_000_000):
        raise ValueError(f"{param_name} must be between -1,000,000 and 1,000,000.")


@overload
def validate_and_parse_parameters(
    data: dict[str, Any] | None,
    require_compound: Literal[True] = True,
) -> AudioParameters: ...


@overload
def validate_and_parse_parameters(
    data: dict[str, Any] | None,
    require_compound: Literal[False],
) -> AudioParametersBase: ...


def validate_and_parse_parameters(
    data: dict[str, Any] | None,
    require_compound: bool = True,
) -> AudioParameters | AudioParametersBase:
    if not isinstance(data, dict) or not data:
        raise ValueError("No JSON data provided")

    raw_sr = data.get("sample_rate")
    if raw_sr is not None:
        if isinstance(raw_sr, float) or (isinstance(raw_sr, str) and "." in raw_sr):
            raise ValueError("Invalid sample_rate. Must be an integer.")

    compound = None
    if require_compound:
        compound = data.get("compound")
        if not compound or not compound.strip():
            raise ValueError("No compound provided")

        if len(compound) > 349:
            raise ValueError(
                "Compound name is too long. Maximum length is 349 characters."
            )

    try:
        offset = float(data.get("offset", 300))
    except (ValueError, TypeError):
        raise ValueError("Invalid offset. Must be a float.") from None
    validate_number_range(offset, "offset")

    try:
        scale = float(data.get("scale", 100000))
    except (ValueError, TypeError):
        raise ValueError("Invalid scale. Must be a float.") from None
    validate_number_range(scale, "scale")

    try:
        shift = float(data.get("shift", 1))
    except (ValueError, TypeError):
        raise ValueError("Invalid shift. Must be a float.") from None
    validate_number_range(shift, "shift")

    try:
        duration = float(data.get("duration", 5))
    except (ValueError, TypeError):
        raise ValueError("Invalid duration. Must be a float.") from None

    try:
        sample_rate = int(data.get("sample_rate", 44100))
    except (ValueError, TypeError):
        raise ValueError("Invalid sample_rate. Must be an integer.") from None

    try:
        factor = float(data.get("factor", 10))
    except (ValueError, TypeError):
        raise ValueError("Invalid factor. Must be a float.") from None
    validate_number_range(factor, "factor")

    try:
        modulus = float(data.get("modulus", 500))
    except (ValueError, TypeError):
        raise ValueError("Invalid modulus. Must be a float.") from None
    validate_number_range(modulus, "modulus")

    try:
        base = float(data.get("base", 100))
    except (ValueError, TypeError):
        raise ValueError("Invalid base. Must be a float.") from None
    validate_number_range(base, "base")

    hq = data.get("hq", False)
    if not isinstance(hq, bool):
        raise ValueError("Invalid hq. Must be a boolean.")

    if not (0.01 <= duration <= 30):
        raise ValueError("Duration must be between 0.01 and 30 seconds.")

    if not 3500 <= sample_rate <= 192000:
        raise ValueError("Sample rate must be between 3500 and 192000.")

    base_params: AudioParametersBase = {
        "offset": offset,
        "scale": scale,
        "shift": shift,
        "duration": duration,
        "sample_rate": sample_rate,
        "factor": factor,
        "modulus": modulus,
        "base": base,
        "hq": hq,
    }

    if not require_compound:
        return base_params

    return cast(AudioParameters, {**base_params, "compound": compound})


def validate_spectrum_text_range(text: str) -> None:
    if not (3 <= len(text) <= 100000):
        raise ValueError("Spectrum data must be between 3 and 100,000 characters.")


def validate_spectrum_peaks(spectrum: list[tuple[float, float]]) -> None:
    if not spectrum:
        raise ValueError("Spectrum data contains no peaks")
    for mz, intensity in spectrum:
        if intensity <= 0:
            raise ValueError(
                f"Peak intensities must be greater than 0 (got {intensity} at m/z {mz})"
            )


RENDER_COST_BUDGET = 2_500_000_000
HQ_COST_FACTOR = 5


class RenderCostExceeded(ValueError):
    pass


def validate_render_cost(
    spectrum: list[tuple[float, float]],
    duration: float,
    sample_rate: int,
    hq: bool,
) -> None:
    samples = int(sample_rate * duration)
    cost = len(spectrum) * samples * (HQ_COST_FACTOR if hq else 1)
    if cost > RENDER_COST_BUDGET:
        raise RenderCostExceeded(
            "Audio is too large to generate at these settings. "
            "Lower the duration or sample rate and try again."
        )
