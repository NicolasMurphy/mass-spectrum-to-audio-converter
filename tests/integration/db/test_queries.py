from db import get_search_history, log_search


def test_log_search_and_retrieve_history():
    """Test that log_search writes to database and appears in history"""
    log_search("Aspirin", "MSBNK-ACES_SU-AS000078")

    history = get_search_history(limit=5)

    assert len(history) > 0
    assert any(
        entry["compound"] == "Aspirin"
        and entry["accession"] == "MSBNK-ACES_SU-AS000078"
        for entry in history
    )
    assert all("created_at" in entry for entry in history)
