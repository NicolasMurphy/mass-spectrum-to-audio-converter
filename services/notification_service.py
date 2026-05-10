import threading

from utils.webhook import send_webhook_notification


class NotificationService:
    """Handles external notifications and webhooks"""

    def notify_audio_generated(
        self, compound_name, accession, algorithm, duration, sample_rate
    ):
        """Send async notification about audio generation"""

        def send_async():
            send_webhook_notification(
                compound_name,
                accession,
                algorithm,
                duration,
                sample_rate,
            )

        threading.Thread(target=send_async, daemon=True).start()
