from typing import TypedDict, cast

from audio import Spectrum
from db import (
    get_massbank_peaks,  # pyright: ignore[reportUnknownVariableType]
    log_search,  # pyright: ignore[reportUnknownVariableType]
)


class CompoundData(TypedDict):
    spectrum: Spectrum
    accession: str
    compound_name: str


class CompoundDataService:
    """Handles all compound data operations"""

    def get_compound_spectrum(self, compound_name: str) -> CompoundData:
        """
        Retrieve spectrum data for a compound.

        Returns:
            Dict containing spectrum, accession, and compound_name
        """
        spectrum, accession, compound_actual = cast(
            tuple[Spectrum, str, str], get_massbank_peaks(compound_name)
        )
        return {
            "spectrum": spectrum,
            "accession": accession,
            "compound_name": compound_actual,
        }

    def log_compound_search(self, compound_name: str, accession: str) -> None:
        log_search(compound_name, accession)
