import os

from utils import send_webhook_notification


def test_send_webhook_notification_success():
    """Test webhook notification sends successfully to Discord"""

    if not os.getenv("WEBHOOK_URL"):
        import pytest
        pytest.skip("WEBHOOK_URL not configured")


    send_webhook_notification(
        compound_name="Test Compound",
        accession="TEST_ACCESSION_123",
        algorithm="linear",
        duration=5.0,
        sample_rate=44100
    )
