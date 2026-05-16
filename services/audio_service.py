import base64
import io
from typing import TypedDict

from api.validation import AudioParametersBase
from audio import Spectrum, TransformedPeak, generate_combined_wav_bytes_and_data


class AudioResult(TypedDict):
    wav_buffer: io.BytesIO
    transformed_data: list[TransformedPeak]
    audio_base64: str


class AudioGenerationService:
    """Handles the core business logic for audio generation from spectra"""

    def generate_audio_from_spectrum(
        self,
        spectrum: Spectrum,
        algorithm: str,
        parameters: AudioParametersBase,
    ) -> AudioResult:
        """
        Generate audio from a compound's spectrum.

        Args:
            spectrum: List of (m/z, intensity) tuples
            algorithm: Algorithm type ('linear', 'inverse', 'modulo')
            parameters: Dict containing all generation parameters

        Returns:
            Dict containing wav_buffer, transformed_data, and audio_base64
        """
        wav_buffer, transformed_data = generate_combined_wav_bytes_and_data(
            spectrum,
            algorithm=algorithm,
            offset=parameters["offset"],
            scale=parameters["scale"],
            shift=parameters["shift"],
            factor=parameters["factor"],
            modulus=parameters["modulus"],
            base=parameters["base"],
            duration=parameters["duration"],
            sample_rate=parameters["sample_rate"],
            hq=parameters["hq"],
        )

        return {
            "wav_buffer": wav_buffer,
            "transformed_data": transformed_data,
            "audio_base64": base64.b64encode(wav_buffer.getvalue()).decode(),
        }

    def get_algorithm_parameters(
        self, algorithm: str, params: AudioParametersBase
    ) -> dict[str, float]:
        """Extract only the relevant parameters for the specified algorithm"""
        if algorithm == "linear":
            return {"offset": params["offset"]}
        elif algorithm == "inverse":
            return {"scale": params["scale"], "shift": params["shift"]}
        elif algorithm == "modulo":
            return {
                "factor": params["factor"],
                "modulus": params["modulus"],
                "base": params["base"],
            }
        return {}
