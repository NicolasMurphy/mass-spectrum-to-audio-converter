"""
Array Reuse Strategy:
- time_array: Pre-allocated array of time points in seconds [0.0, 0.0000227, 0.0000454, ...]
- wave_buffer: Pre-allocated array that gets overwritten for each peak [0, 15000, -8000, ...]

Audio Amplitude Scaling:
- np.iinfo(np.int16).max = 32,767 (max positive value for 16-bit audio)
- We use positive max because sine naturally creates both +/- values
- Converts normalized intensity (0-1) to audio amplitude scale (-32,768 to +32,767)

Sine Wave Generation:
- 2*pi*freq*time calculates phase values (in radians)
- np.sin() converts radians to wave heights (-1 to +1)
- Multiply by amplitude to get final audio values
- np.sin(..., out=buffer) writes directly into buffer (no temporary arrays)

Key NumPy Functions:
- np.sin(): Vectorized sine calculation using the system's optimized math library
  (e.g., Ubuntu → glibc's libm, Windows → Microsoft's UCRT), always outputs [-1, 1]
- np.linspace(start, stop, num, endpoint): Creates evenly spaced numbers over an interval (endpoint=False excludes the stop value)
- np.zeros_like(array): Returns array of zeros with same shape/type as input array
"""

import numpy as np
from scipy.io.wavfile import write
import io
from .frequency_algorithms import (
    mz_to_frequency_linear,
    mz_to_frequency_inverse,
    mz_to_frequency_modulo,
)
import re


def generate_sine_wave(freq, intensity, time_array, wave_buffer):
    """Generate sine wave into provided buffer (reusable array)"""
    amplitude = np.iinfo(np.int16).max * intensity
    np.sin(2 * np.pi * freq * time_array, out=wave_buffer)
    wave_buffer *= amplitude
    return wave_buffer


def generate_combined_wav_bytes_and_data(
    spectrum_data,
    offset: float = 300,
    scale: float = 100000,
    shift: float = 1,
    duration: float = 5,
    sample_rate: int = 44100,
    algorithm: str = "linear",
    factor: float = 10,
    modulus: float = 500,
    base: float = 100,
):
    # Time array: represents sample points from 0 to duration
    # float32 keeps sine math in single precision (~2x faster, well within int16 output precision)
    time_array = np.linspace(0, duration, int(sample_rate * duration), False, dtype=np.float32)

    # Final output: will contain the sum of all sine waves
    combined_wave = np.zeros_like(time_array)

    # Reusable buffer that gets overwritten for each peak
    sine_wave_buffer = np.zeros_like(time_array)

    transformed_data = []

    # Pre-normalize intensities to prevent huge numbers
    max_intensity = max(intensity for mz, intensity in spectrum_data)

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
    combined_wave = np.int16(combined_wave * np.iinfo(np.int16).max)

    wav_buffer = io.BytesIO()
    write(wav_buffer, sample_rate, combined_wave)
    wav_buffer.seek(0)

    return wav_buffer, transformed_data


def parse_spectrum_text(text_input):
    try:
        values = re.split(r"\s+", text_input.strip())
        float_values = [float(x) for x in values if x]

        if len(float_values) % 2 != 0:
            raise ValueError(
                "Spectrum data must have an even number of values (pairs of mz/intensity)"
            )

        spectrum_data = []
        for i in range(0, len(float_values), 2):
            mz = float_values[i]
            intensity = float_values[i + 1]
            spectrum_data.append((mz, intensity))

        return spectrum_data
    except (ValueError, IndexError) as e:
        raise ValueError(f"Invalid spectrum data format: {e}")
