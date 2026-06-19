from typing import TypedDict

from audio import Spectrum
from db import get_db_cursor


class CompoundData(TypedDict):
    spectrum: Spectrum
    accession: str
    compound_name: str


def get_massbank_peaks(compound_name: str) -> CompoundData:
    """
    Get mass spectrum peaks from local PostgreSQL database
    Two-step search like MassBank API: find compounds first, then get peaks
    """
    with get_db_cursor() as cursor:
        # Step 1: Resolve the name to its highest-peak accession
        search_query = """
        SELECT ca.accession, ca.compound_name
        FROM compound_accessions ca
        JOIN accession_peak_counts apc ON apc.accession = ca.accession
        WHERE LOWER(ca.compound_name) = LOWER(%s)
        ORDER BY apc.peaks DESC, ca.accession
        LIMIT 1
        """

        cursor.execute(search_query, (compound_name,))
        result = cursor.fetchone()

        if not result:
            raise ValueError("No records found")

        accession, compound_actual = result

        # Step 2: Get all peaks for this specific accession (with DISTINCT to handle any duplicates)
        peaks_query = """
        SELECT DISTINCT mz, intensity
        FROM spectrum_data
        WHERE accession = %s
        AND intensity > 0
        ORDER BY mz
        """

        cursor.execute(peaks_query, (accession,))
        peak_data = cursor.fetchall()

        # Convert to the Spectrum format: list of (mz, intensity) tuples
        spectrum = [(float(mz), float(intensity)) for mz, intensity in peak_data]

        return {
            "spectrum": spectrum,
            "accession": accession,
            "compound_name": compound_actual,
        }
