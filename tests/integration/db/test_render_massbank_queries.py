import pytest

from db import get_massbank_peaks


def test_get_massbank_peaks():
    """Test get_massbank_peaks with local database"""
    spectrum, accession, compound_actual = get_massbank_peaks("caffeine")

    assert len(spectrum) > 0
    assert accession is not None
    assert "caffeine" in compound_actual.lower()


def test_get_massbank_peaks_not_found():
    with pytest.raises(ValueError):
        get_massbank_peaks("nonexistentcompound")


def test_get_massbank_peaks_case_insensitive():
    spectrum_lower = get_massbank_peaks("caffeine")[0]
    spectrum_upper = get_massbank_peaks("CAFFEINE")[0]
    assert spectrum_lower == spectrum_upper


# docker-compose exec app python -m pytest tests/ -v
# docker-compose exec app python -m pytest tests/ --cov=. --cov-report=term-missing
