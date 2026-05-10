import os

import requests


def send_webhook_notification(
    compound_name, accession, algorithm, duration, sample_rate
):
    """Send webhook notification when a compound is generated"""
    webhook_url = os.getenv("WEBHOOK_URL")

    if not webhook_url:
        return

    payload = {
        "content": f"**New Compound Generated!**\n\n**Compound:** {compound_name}\n**Accession:** {accession}\n**Algorithm:** {algorithm}\n**Duration:** {duration}s\n**Sample Rate:** {sample_rate}Hz"
    }

    try:
        response = requests.post(webhook_url, json=payload, timeout=5)
        if response.status_code == 204:
            print("Webhook sent successfully!")
        else:
            print(f"Webhook failed with status {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Webhook request failed: {e}")
