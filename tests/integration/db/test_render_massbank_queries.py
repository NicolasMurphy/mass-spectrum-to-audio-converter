import pytest

from db import get_db_cursor, get_massbank_peaks


def test_get_massbank_peaks():
    """Test get_massbank_peaks with local database"""
    result = get_massbank_peaks("caffeine")

    assert len(result["spectrum"]) > 0
    assert result["accession"] is not None
    assert "caffeine" in result["compound_name"].lower()


def test_get_massbank_peaks_not_found():
    with pytest.raises(ValueError):
        get_massbank_peaks("nonexistentcompound")


def test_get_massbank_peaks_case_insensitive():
    spectrum_lower = get_massbank_peaks("caffeine")["spectrum"]
    spectrum_upper = get_massbank_peaks("CAFFEINE")["spectrum"]
    assert spectrum_lower == spectrum_upper


@pytest.mark.parametrize("compound", ["glucose", "aspirin", "biotin", "tryptophan"])
def test_peak_count_table_matches_fetched_spectrum(compound):
    data = get_massbank_peaks(compound)

    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT peaks FROM accession_peak_counts WHERE accession = %s",
            (data["accession"],),
        )
        row = cursor.fetchone()

    assert row is not None
    assert row[0] == len(data["spectrum"])


# docker-compose exec app python -m pytest tests/ -v
# docker-compose exec app python -m pytest tests/ --cov=. --cov-report=term-missing
