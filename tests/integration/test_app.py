import pytest

from app import app


@pytest.fixture
def client():
    """Create test client"""
    app.config["TESTING"] = True
    app.config["RATELIMIT_ENABLED"] = False
    return app.test_client()


# massbank tests


def test_generate_audio_with_linear_algorithm(client):
    """Test linear algorithm endpoint with local database"""
    response = client.post(
        "/massbank/linear",
        json={
            "compound": "caffeine",
            "offset": 400,
            "duration": 3,
            "sample_rate": 48000,
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.get_json()

    assert "audio_base64" in data
    assert "compound" in data
    assert "caffeine" in data["compound"].lower()
    assert data["algorithm"] == "linear"
    assert "parameters" in data
    assert data["parameters"]["offset"] == 400
    assert "audio_settings" in data
    assert data["audio_settings"]["duration"] == 3
    assert data["audio_settings"]["sample_rate"] == 48000
    assert data["audio_settings"]["hq"] is False
    assert "spectrum" in data
    assert len(data["spectrum"]) > 0


def test_generate_audio_hq_mode(client):
    """hq=true is echoed in audio_settings."""
    response = client.post(
        "/massbank/linear",
        json={"compound": "caffeine", "duration": 1, "hq": True},
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["audio_settings"]["hq"] is True


def test_generate_audio_invalid_hq(client):
    """Non-boolean hq is rejected."""
    response = client.post(
        "/massbank/linear",
        json={"compound": "caffeine", "hq": "true"},
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Invalid hq" in data["error"]


def test_generate_audio_with_inverse_algorithm(client):
    """Test inverse algorithm endpoint with local database"""
    response = client.post(
        "/massbank/inverse",
        json={"compound": "biotin", "scale": 2, "shift": 100},
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.get_json()

    assert "audio_base64" in data
    assert "compound" in data
    assert "biotin" in data["compound"].lower()
    assert data["algorithm"] == "inverse"
    assert "parameters" in data
    assert data["parameters"]["scale"] == 2
    assert data["parameters"]["shift"] == 100
    assert "spectrum" in data
    assert len(data["spectrum"]) > 0


def test_generate_audio_with_modulo_algorithm(client):
    """Test modulo algorithm endpoint with local database"""
    response = client.post(
        "/massbank/modulo",
        json={
            "compound": "folate",
            "factor": 15,
            "modulus": 600,
            "base": 150,
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.get_json()

    assert "audio_base64" in data
    assert "compound" in data
    assert "folate" in data["compound"].lower()
    assert data["algorithm"] == "modulo"
    assert "parameters" in data
    assert data["parameters"]["factor"] == 15
    assert data["parameters"]["modulus"] == 600
    assert data["parameters"]["base"] == 150
    assert "spectrum" in data
    assert len(data["spectrum"]) > 0


def test_generate_audio_with_nonexistent_compound(client):
    """Test error handling for compound not found in database"""
    response = client.post(
        "/massbank/linear",
        json={"compound": "nonexistentcompound12345"},
        content_type="application/json",
    )

    assert response.status_code == 404
    data = response.get_json()

    assert "error" in data
    assert "No records found" in data["error"]


def test_popular_endpoint_returns_success(client):
    response = client.get("/popular")
    assert response.status_code == 200

    data = response.get_json()
    assert "popular" in data
    assert isinstance(data["popular"], list)

    if len(data["popular"]) > 0:
        assert "compound" in data["popular"][0]
        assert "search_count" in data["popular"][0]
        assert isinstance(data["popular"][0]["search_count"], int)


def test_history_endpoint_returns_success(client):
    response = client.get("/history")
    assert response.status_code == 200

    data = response.get_json()
    assert "history" in data
    assert isinstance(data["history"], list)

    if len(data["history"]) > 0:
        assert "compound" in data["history"][0]
        assert "accession" in data["history"][0]
        assert "created_at" in data["history"][0]


# Custom tests


def test_custom_linear_endpoint_success(client):
    response = client.post(
        "/custom/linear",
        json={
            "spectrum_text": "73.04018778 16.07433749\n75.05583784 2.042927662",
            "offset": 200,
            "duration": 3,
            "sample_rate": 44100,
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.get_json()

    assert "audio_base64" in data
    assert data["compound"] == "Custom Compound"
    assert data["accession"] == "CUSTOM-001"
    assert "spectrum" in data
    assert len(data["spectrum"]) == 2


def test_custom_endpoint_missing_spectrum_text(client):
    response = client.post(
        "/custom/linear",
        json={"duration": 3, "sample_rate": 44100},
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "spectrum_text is required"


def test_custom_endpoint_spectrum_too_short(client):
    response = client.post(
        "/custom/linear",
        json={"spectrum_text": "12"},
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Spectrum data must be between 3 and 100,000 characters."


def test_custom_endpoint_spectrum_too_long(client):
    response = client.post(
        "/custom/linear",
        json={"spectrum_text": "1" * 100001},
        content_type="application/json",
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Spectrum data must be between 3 and 100,000 characters."


def test_custom_endpoint_invalid_spectrum(client):
    response = client.post(
        "/custom/linear",
        json={"spectrum_text": "not numbers at all"},
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Invalid spectrum data format" in data["error"]


def test_custom_endpoint_body_exceeds_max_content_length(client):
    huge = "1 " * 150_000  # ~300 KB body, over the 200 KB cap
    response = client.post(
        "/custom/linear",
        json={"spectrum_text": huge},
        content_type="application/json",
    )

    assert response.status_code == 413
    data = response.get_json()
    assert data["error"] == "Request body too large"


def test_custom_endpoint_non_positive_intensity(client):
    response = client.post(
        "/custom/linear",
        json={"spectrum_text": "50 0\n80 100"},
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Peak intensities must be greater than 0" in data["error"]


def test_custom_endpoint_all_zero_intensity(client):
    response = client.post(
        "/custom/linear",
        json={"spectrum_text": "50 0\n80 0"},
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "Peak intensities must be greater than 0" in data["error"]


def test_custom_endpoint_whitespace_only_spectrum(client):
    response = client.post(
        "/custom/linear",
        json={"spectrum_text": "   "},
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Spectrum data contains no peaks"


# Render cost guard tests


def test_massbank_rejects_oversized_render(client):
    response = client.post(
        "/massbank/linear",
        json={"compound": "Cyclopyrroxanthin", "duration": 30, "sample_rate": 192000},
        content_type="application/json",
    )

    assert response.status_code == 422
    data = response.get_json()
    assert "too large" in data["error"]


def test_custom_rejects_oversized_render(client):
    spectrum_text = "\n".join("100.0 1.0" for _ in range(300))
    response = client.post(
        "/custom/linear",
        json={
            "spectrum_text": spectrum_text,
            "duration": 30,
            "sample_rate": 192000,
            "hq": True,
        },
        content_type="application/json",
    )

    assert response.status_code == 422
    data = response.get_json()
    assert "too large" in data["error"]


# Malformed body tests


def test_massbank_rejects_non_object_body(client):
    response = client.post(
        "/massbank/linear",
        json=[1, 2, 3],
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "No JSON data provided"


def test_custom_rejects_non_object_body(client):
    response = client.post(
        "/custom/linear",
        json=123,
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "spectrum_text is required"
