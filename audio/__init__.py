"""
Audio Conversion package for converting mz and intensity values to hz and dB.

Creates the audio file, and keeps track of data transformations.
"""

from .audio_generation import (
    Spectrum,
    TransformedPeak,
    generate_combined_wav_bytes_and_data,
    generate_sine_wave,
    parse_spectrum_text,
)
from .frequency_algorithms import (
    mz_to_frequency_inverse,
    mz_to_frequency_linear,
    mz_to_frequency_modulo,
)

__all__ = [
    "Spectrum",
    "TransformedPeak",
    "generate_sine_wave",
    "generate_combined_wav_bytes_and_data",
    "parse_spectrum_text",
    "mz_to_frequency_linear",
    "mz_to_frequency_inverse",
    "mz_to_frequency_modulo",
]
