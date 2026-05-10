"""
API package for mass spectrum to audio converter.

Provides route handlers and request validation.
"""

from .routes import (
    generate_audio_with_custom_data,
    generate_audio_with_data,
    history,
    popular,
)
from .validation import (
    validate_algorithm,
    validate_and_parse_parameters,
    validate_spectrum_text_range,
)

__all__ = [
    "history",
    "generate_audio_with_data",
    "generate_audio_with_custom_data",
    "popular",
    "validate_algorithm",
    "validate_and_parse_parameters",
    "validate_spectrum_text_range",
]
