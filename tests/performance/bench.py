"""
Benchmark harness for generate_combined_wav_bytes_and_data.

Usage (inside app container):
    docker compose exec -T app python tests/performance/bench.py
    docker compose exec -T app python tests/performance/bench.py --baseline   # write baseline
    docker compose exec -T app python tests/performance/bench.py --json       # machine-readable
"""
import argparse
import gc
import hashlib
import json
import math
import statistics
import sys
import time
from pathlib import Path

# Allow running as a script: add project root to sys.path
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from audio import generate_combined_wav_bytes_and_data
from db import get_massbank_peaks, init_pool

SPECTRA = ["caffeine", "Ajmalin", "Cyclopyrroxanthin"]
ALGORITHMS = ["linear", "inverse", "modulo"]
WARMUP_RUNS = 2
TIMED_RUNS = 15
BASELINE_PATH = Path(__file__).parent / "baseline.json"
FLOAT_RTOL = 1e-9
FLOAT_ATOL = 1e-12


def hash_wav(wav_buffer):
    wav_buffer.seek(0)
    return hashlib.sha256(wav_buffer.read()).hexdigest()


def td_signature(td):
    """JSON-safe representation of transformed_data for parity comparison."""
    out = []
    for row in td:
        amp_db = row["amplitude_db"]
        if isinstance(amp_db, float) and math.isinf(amp_db):
            amp_db = "-inf" if amp_db < 0 else "inf"
        out.append(
            {
                "mz": float(row["mz"]),
                "frequency": float(row["frequency"]),
                "intensity": float(row["intensity"]),
                "amplitude_linear": float(row["amplitude_linear"]),
                "amplitude_db": amp_db if isinstance(amp_db, str) else float(amp_db),
            }
        )
    return out


def parity_check(baseline_td, current_td):
    """
    Guards the transform layer only: per-peak metadata (mz, frequency,
    intensity, amplitude_*). The audio output is checked separately via
    wav_hash equality in main(); changes that affect only the sine math
    will pass this check but fail the wav_hash check.
    """
    if len(baseline_td) != len(current_td):
        return f"length: {len(baseline_td)} vs {len(current_td)}"
    for i, (b, c) in enumerate(zip(baseline_td, current_td)):
        for key in ("mz", "frequency", "intensity", "amplitude_linear"):
            if not math.isclose(b[key], c[key], rel_tol=FLOAT_RTOL, abs_tol=FLOAT_ATOL):
                return f"row {i} {key}: {b[key]!r} vs {c[key]!r}"
        b_db, c_db = b["amplitude_db"], c["amplitude_db"]
        if isinstance(b_db, str) or isinstance(c_db, str):
            if b_db != c_db:
                return f"row {i} amplitude_db: {b_db!r} vs {c_db!r}"
        elif not math.isclose(b_db, c_db, rel_tol=FLOAT_RTOL, abs_tol=FLOAT_ATOL):
            return f"row {i} amplitude_db: {b_db!r} vs {c_db!r}"
    return None


def time_one(spectrum, algorithm):
    start = time.perf_counter()
    wav_buffer, td = generate_combined_wav_bytes_and_data(spectrum, algorithm=algorithm)
    elapsed = time.perf_counter() - start
    return elapsed, hash_wav(wav_buffer), td


def run_cell(spectrum, algorithm):
    last_hash = None
    last_td = None
    for _ in range(WARMUP_RUNS):
        _, last_hash, last_td = time_one(spectrum, algorithm)

    times = []
    for _ in range(TIMED_RUNS):
        gc.collect()
        elapsed, h, td = time_one(spectrum, algorithm)
        times.append(elapsed)
        if h != last_hash:
            return {"error": "non-deterministic WAV between runs (same input)"}

    return {
        "median_ms": statistics.median(times) * 1000,
        "min_ms": min(times) * 1000,
        "max_ms": max(times) * 1000,
        "stdev_ms": statistics.stdev(times) * 1000,
        "n": TIMED_RUNS,
        "wav_hash": last_hash,
        "transformed_data": td_signature(last_td),
    }


def fmt_diff(current_ms, baseline_ms):
    if baseline_ms == 0:
        return "  n/a "
    pct = 100 * (current_ms - baseline_ms) / baseline_ms
    arrow = "v" if pct < 0 else "^"
    return f"{arrow}{abs(pct):5.1f}%"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", action="store_true", help="Save current results as baseline.json")
    parser.add_argument("--json", action="store_true", help="Emit JSON to stdout")
    args = parser.parse_args()

    init_pool()

    print(f"Loading {len(SPECTRA)} spectra...")
    spectra_data = {}
    for name in SPECTRA:
        peaks, _, _ = get_massbank_peaks(name)
        spectra_data[name] = peaks
        print(f"  {name:25s} {len(peaks):>5d} peaks")

    cells = len(SPECTRA) * len(ALGORITHMS)
    print(f"\nRunning {WARMUP_RUNS} warmup + {TIMED_RUNS} timed per cell, {cells} cells\n")

    results = {}
    for spectrum_name in SPECTRA:
        spectrum = spectra_data[spectrum_name]
        results[spectrum_name] = {}
        for algo in ALGORITHMS:
            cell = run_cell(spectrum, algo)
            results[spectrum_name][algo] = cell
            if "error" in cell:
                print(f"  {spectrum_name:25s} {algo:8s}  ERROR: {cell['error']}")
            else:
                print(
                    f"  {spectrum_name:25s} {algo:8s}  "
                    f"med={cell['median_ms']:8.2f}ms  "
                    f"min={cell['min_ms']:8.2f}ms  "
                    f"max={cell['max_ms']:8.2f}ms  "
                    f"stdev={cell['stdev_ms']:6.2f}ms"
                )

    parity_failed = False
    if BASELINE_PATH.exists() and not args.baseline:
        baseline = json.loads(BASELINE_PATH.read_text())
        print(f"\nDiff vs baseline ({BASELINE_PATH.name}):\n")
        for spectrum_name in SPECTRA:
            for algo in ALGORITHMS:
                b = baseline.get(spectrum_name, {}).get(algo)
                c = results[spectrum_name][algo]
                if b is None or "error" in c or "error" in b:
                    continue
                td_err = parity_check(b["transformed_data"], c["transformed_data"])
                wav_match = b["wav_hash"] == c["wav_hash"]
                if td_err or not wav_match:
                    parity_failed = True
                    parity = f"FAIL ({td_err or 'wav-hash mismatch'})"
                else:
                    parity = "OK"
                print(
                    f"  {spectrum_name:25s} {algo:8s}  "
                    f"{b['median_ms']:8.2f}ms -> {c['median_ms']:8.2f}ms  "
                    f"{fmt_diff(c['median_ms'], b['median_ms'])}  parity:{parity}"
                )

    if args.baseline:
        BASELINE_PATH.write_text(json.dumps(results, indent=2))
        print(f"\nBaseline written: {BASELINE_PATH}")

    if args.json:
        print(json.dumps(results, indent=2))

    if parity_failed:
        print("\n*** PARITY BROKEN — investigate before keeping the change ***")
        sys.exit(1)


if __name__ == "__main__":
    main()
