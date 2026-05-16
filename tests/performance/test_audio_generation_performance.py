import time

from audio import generate_combined_wav_bytes_and_data
from db import get_massbank_peaks


# audio generation 9 peaks
def test_caffeine_performance():
    spectrum = get_massbank_peaks("caffeine")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear"
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("caffeine: ", execution_time)

    assert execution_time < 0.2
    assert len(transformation_data) == len(spectrum)


# 88 peaks
def test_ajmalin_performance():
    spectrum = get_massbank_peaks("Ajmalin")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear"
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("Ajmalin: ", execution_time)

    assert execution_time < 0.5
    assert len(transformation_data) == len(spectrum)


# 1933 peaks
def test_cyclopyrroxanthin_performance():
    spectrum = get_massbank_peaks("Cyclopyrroxanthin")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear"
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("Cyclopyrroxanthin: ", execution_time)

    assert execution_time < 9
    assert len(transformation_data) == len(spectrum)


# HQ-mode (float64 math + float32 WAV) — bench medians: caffeine ~27ms,
# Ajmalin ~220ms, Cyclopyrroxanthin ~4700ms. Thresholds set well above.
def test_caffeine_hq_performance():
    spectrum = get_massbank_peaks("caffeine")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear", hq=True
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("caffeine hq: ", execution_time)

    assert execution_time < 0.5
    assert len(transformation_data) == len(spectrum)


def test_ajmalin_hq_performance():
    spectrum = get_massbank_peaks("Ajmalin")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear", hq=True
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("Ajmalin hq: ", execution_time)

    assert execution_time < 1.5
    assert len(transformation_data) == len(spectrum)


def test_cyclopyrroxanthin_hq_performance():
    spectrum = get_massbank_peaks("Cyclopyrroxanthin")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear", hq=True
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("Cyclopyrroxanthin hq: ", execution_time)

    assert execution_time < 18
    assert len(transformation_data) == len(spectrum)
