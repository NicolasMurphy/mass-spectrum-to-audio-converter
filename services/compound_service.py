from db import get_massbank_peaks, log_search


class CompoundDataService:
    """Handles all compound data operations"""

    def get_compound_spectrum(self, compound_name):
        """
        Retrieve spectrum data for a compound.

        Returns:
            Dict containing spectrum, accession, and compound_name
        """
        spectrum, accession, compound_actual = get_massbank_peaks(compound_name)
        return {
            "spectrum": spectrum,
            "accession": accession,
            "compound_name": compound_actual,
        }

    def log_compound_search(self, compound_name, accession):
        log_search(compound_name, accession)
