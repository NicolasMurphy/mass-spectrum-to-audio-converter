from db import get_db_cursor


def get_massbank_peaks(compound_name):
    """
    Get mass spectrum peaks from local PostgreSQL database
    Two-step search like MassBank API: find compounds first, then get peaks
    Returns: (spectrum, accession, compound_actual)
    """
    try:
        with get_db_cursor() as cursor:
            # Step 1: Search the fast compound_accessions table (case-insensitive)
            search_query = """
            SELECT accession, compound_name
            FROM compound_accessions
            WHERE LOWER(compound_name) = LOWER(%s)
            ORDER BY accession
            LIMIT 1
            """

            cursor.execute(search_query, (compound_name,))
            result = cursor.fetchone()

            if not result:
                raise ValueError("No records found")

            # Use the first result
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

            # Convert to the format expected by converter.py
            spectrum = [(float(mz), float(intensity)) for mz, intensity in peak_data]

            return spectrum, accession, compound_actual

    except Exception as e:
        raise ValueError(e)
