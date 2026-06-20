import time

from audio import generate_combined_wav_bytes_and_data
from db import get_massbank_peaks


# 8 peaks
def test_benzoate_performance():
    spectrum = get_massbank_peaks("benzoate")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear"
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("benzoate: ", execution_time)

    assert execution_time < 0.1
    assert len(transformation_data) == len(spectrum)


# 28 peaks
def test_arginine_performance():
    spectrum = get_massbank_peaks("arginine")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear"
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("arginine: ", execution_time)

    assert execution_time < 0.15
    assert len(transformation_data) == len(spectrum)


# 107 peaks
def test_caffeine_performance():
    spectrum = get_massbank_peaks("caffeine")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear"
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("caffeine: ", execution_time)

    assert execution_time < 0.3
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

    assert execution_time < 4.5
    assert len(transformation_data) == len(spectrum)


# 10279 peaks
def test_foetoside_c_performance():
    spectrum = get_massbank_peaks("Foetoside C")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear"
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("Foetoside C: ", execution_time)

    assert execution_time < 25
    assert len(transformation_data) == len(spectrum)


# 28 peaks
def test_arginine_hq_performance():
    spectrum = get_massbank_peaks("arginine")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear", hq=True
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("arginine hq: ", execution_time)

    assert execution_time < 0.3
    assert len(transformation_data) == len(spectrum)


# 1933 peaks
def test_cyclopyrroxanthin_hq_performance():
    spectrum = get_massbank_peaks("Cyclopyrroxanthin")["spectrum"]

    start_time = time.perf_counter()
    _, transformation_data = generate_combined_wav_bytes_and_data(
        spectrum, algorithm="linear", hq=True
    )
    end_time = time.perf_counter()
    execution_time = end_time - start_time
    print("Cyclopyrroxanthin hq: ", execution_time)

    assert execution_time < 14
    assert len(transformation_data) == len(spectrum)
