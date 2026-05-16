"""
Array Reuse Strategy:
- time_array: Pre-allocated array of time points in seconds [0.0, 0.0000227, 0.0000454, ...]
- wave_buffer: Pre-allocated array that gets overwritten for each peak [0, 15000, -8000, ...]

Output Pipeline:
- Per peak: scale by working_scale (np.iinfo(np.int16).max) and accumulate into
  combined_wave. The working_scale value is vestigial — final normalization divides
  it out — but kept to preserve float accumulation rounding (changing it would
  invalidate bench wav_hash baselines).
- Final: normalize combined_wave to [-1, 1], then cast to int16 PCM (default) or
  float32 IEEE (hq=True). The hq branch also uses float64 math throughout for
  downstream DSP precision.

Sine Wave Generation:
- 2*pi*freq*time calculates phase values (in radians)
- np.sin() converts radians to wave heights (-1 to +1)
- Multiply by working_scale and accumulate into combined_wave
- np.sin(..., out=buffer) writes directly into buffer (no temporary arrays)

Key NumPy Functions:
- np.sin(): Vectorized sine calculation using the system's optimized math library
  (e.g., Ubuntu → glibc's libm, Windows → Microsoft's UCRT), always outputs [-1, 1]
- np.linspace(start, stop, num, endpoint): Creates evenly spaced numbers over an interval (endpoint=False excludes the stop value)
- np.zeros_like(array): Returns array of zeros with same shape/type as input array
"""

import io
import re
from typing import TypedDict

import numpy as np
from numpy.typing import NDArray
from scipy.io.wavfile import write  # pyright: ignore[reportMissingTypeStubs, reportUnknownVariableType]

from .frequency_algorithms import (
    mz_to_frequency_inverse,
    mz_to_frequency_linear,
    mz_to_frequency_modulo,
)

Spectrum = list[tuple[float, float]]


class TransformedPeak(TypedDict):
    mz: float
    frequency: float
    intensity: float
    amplitude_linear: float
    amplitude_db: float


def generate_sine_wave(
    freq: float,
    intensity: float,
    time_array: NDArray[np.floating],
    wave_buffer: NDArray[np.floating],
) -> NDArray[np.floating]:
    """Generate sine wave into provided buffer (reusable array)"""
    working_scale = np.iinfo(np.int16).max * intensity
    np.sin(2 * np.pi * freq * time_array, out=wave_buffer)
    wave_buffer *= working_scale
    return wave_buffer


def generate_combined_wav_bytes_and_data(
    spectrum_data: Spectrum,
    offset: float = 300,
    scale: float = 100000,
    shift: float = 1,
    duration: float = 5,
    sample_rate: int = 44100,
    algorithm: str = "linear",
    factor: float = 10,
    modulus: float = 500,
    base: float = 100,
    hq: bool = False,
) -> tuple[io.BytesIO, list[TransformedPeak]]:
    # hq=True: float64 math + float32 WAV output (DAW-friendly precision, ~3x slower).
    # hq=False: float32 math + int16 WAV output (default; fast iteration).
    math_dtype = np.float64 if hq else np.float32

    # Time array: represents sample points from 0 to duration
    time_array = np.linspace(0, duration, int(sample_rate * duration), False, dtype=math_dtype)

    # Final output: will contain the sum of all sine waves
    combined_wave = np.zeros_like(time_array)

    # Reusable buffer that gets overwritten for each peak
    sine_wave_buffer = np.zeros_like(time_array)

    transformed_data: list[TransformedPeak] = []

    # Pre-normalize intensities to prevent huge numbers
    max_intensity = max(intensity for _, intensity in spectrum_data)

    for mz, intensity in spectrum_data:
        if algorithm == "linear":
            freq = mz_to_frequency_linear(mz, offset=offset)
        elif algorithm == "inverse":
            freq = mz_to_frequency_inverse(mz, scale=scale, shift=shift)
        elif algorithm == "modulo":
            freq = mz_to_frequency_modulo(mz, factor=factor, modulus=modulus, base=base)
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")

        # Normalize intensity to 0-1 range BEFORE generating sine wave
        normalized_intensity = intensity / max_intensity

        # Store transformation data with the normalized amplitude
        transformed_data.append(
            {
                "mz": mz,
                "frequency": freq,
                "intensity": intensity,  # Keep original intensity
                "amplitude_linear": normalized_intensity,  # 0-1 range
                "amplitude_db": (
                    20 * np.log10(normalized_intensity)
                    if normalized_intensity > 0
                    else -np.inf
                ),
            }
        )

        if freq <= 0:
            continue

        # Generate sine wave using pre-allocated arrays
        sine_wave = generate_sine_wave(
            freq, normalized_intensity, time_array, sine_wave_buffer
        )

        combined_wave += sine_wave

    # Final normalization
    if np.max(np.abs(combined_wave)) > 0:
        combined_wave = combined_wave / np.max(np.abs(combined_wave))

    if hq:
        combined_wave = combined_wave.astype(np.float32)
    else:
        combined_wave = np.int16(combined_wave * np.iinfo(np.int16).max)

    wav_buffer = io.BytesIO()
    write(wav_buffer, sample_rate, combined_wave)
    wav_buffer.seek(0)

    return wav_buffer, transformed_data


def parse_spectrum_text(text_input: str) -> Spectrum:
    try:
        values = re.split(r"\s+", text_input.strip())
        float_values = [float(x) for x in values if x]

        if len(float_values) % 2 != 0:
            raise ValueError(
                "Spectrum data must have an even number of values (pairs of mz/intensity)"
            )

        spectrum_data: Spectrum = []
        for i in range(0, len(float_values), 2):
            mz = float_values[i]
            intensity = float_values[i + 1]
            spectrum_data.append((mz, intensity))

        return spectrum_data
    except (ValueError, IndexError) as e:
        raise ValueError(f"Invalid spectrum data format: {e}") from None
