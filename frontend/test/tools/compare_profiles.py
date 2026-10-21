"""Compara planificación en serie/paralela sin incluir el tiempo del build."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import statistics
import subprocess
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

from benchmark import FRONTEND, CgroupMeter, WindowsMeter, coverage_totals, fingerprint

POINTS = [
    ("series", 1, 1),
    ("series", 2, 1),
    ("series", 2, 2),
    ("parallel", 2, 1),
    ("parallel", 2, 2),
    ("parallel", 2, 3),
]


def point_id(point):
    return f"{point[0]}-u{point[1]}-e{point[2]}"


def measure(args, node, point, index, warm, output):
    label = f"{point_id(point)}-{'warm' if warm else 'r'}{index}"
    reports = output / (label + ".run")
    command = [
        node,
        str(FRONTEND / "test/tools/combined.mjs"),
        f"--unit-workers={point[1]}",
        f"--e2e-workers={point[2]}",
        f"--schedule={point[0]}",
        f"--output={reports}",
    ]
    env = dict(
        os.environ,
        TEST_PROFILE="ligero",
        UV_THREADPOOL_SIZE="2",
        RAYON_NUM_THREADS="2",
        NODE_OPTIONS="--max-old-space-size=3072",
        FORCE_COLOR="0",
        NEXT_TELEMETRY_DISABLED="1",
        PLAYWRIGHT_SKIP_BROWSER_GC="1",
    )
    env.pop("VITEST_MAX_WORKERS", None)
    env.pop("PLAYWRIGHT_BASE_URL", None)
    meter = WindowsMeter(args.memory_gib) if os.name == "nt" else CgroupMeter(args.memory_gib)
    start = time.perf_counter()
    process = None
    reason = None
    try:
        with (output / (label + ".log")).open("w", encoding="utf-8") as log:
            process = subprocess.Popen(
                command,
                cwd=FRONTEND,
                env=env,
                stdout=log,
                stderr=subprocess.STDOUT,
                start_new_session=os.name != "nt",
            )
            meter.attach(process)
            while True:
                try:
                    code = process.wait(timeout=0.1)
                    break
                except subprocess.TimeoutExpired:
                    meter.sample()
                    if time.perf_counter() - start > args.timeout:
                        meter.terminate(process)
                        code = process.wait(timeout=15)
                        reason = "timeout"
                        break
        seconds = time.perf_counter() - start
        metrics = meter.result()
    except BaseException:
        if process is not None:
            meter.terminate(process)
            if process.poll() is None:
                process.kill()
            process.wait(timeout=15)
        raise
    finally:
        meter.close()
    result = {
        "label": label,
        "point": point_id(point),
        "schedule": point[0],
        "unit": point[1],
        "e2e": point[2],
        "round": index,
        "warm": warm,
        "exit_code": code,
        "seconds": seconds,
        **metrics,
        "average_cores": metrics["cpu_seconds"] / seconds,
        "memory_definition": meter.definition,
        "valid": code == 0 and reason is None,
        "reason": reason,
    }
    try:
        controller = json.loads((reports / "controller.json").read_text(encoding="utf-8"))
        unit = json.loads((reports / "unit.json").read_text(encoding="utf-8"))
        e2e = json.loads((reports / "e2e.json").read_text(encoding="utf-8"))["stats"]
        result["valid"] &= (
            controller["codes"] == [0, 0]
            and unit["numTotalTests"] == args.expected_unit
            and unit["numPassedTests"] == args.expected_unit
            and unit["numFailedTests"] == unit["numPendingTests"] == 0
            and e2e["expected"] == args.expected_e2e
            and all(e2e[key] == 0 for key in ("unexpected", "flaky", "skipped"))
        )
        result["coverage"] = coverage_totals(reports / "coverage")
        result["passed_tests"] = unit["numPassedTests"] + e2e["expected"]
    except (OSError, KeyError, ValueError) as error:
        result.update(valid=False, reason=str(error))
    if not result["valid"] and not result["reason"]:
        result["reason"] = "No pasó el contrato de ambas baterías."
    return result


def summarize(runs):
    rows = []
    for point in POINTS:
        group = [run for run in runs if run["point"] == point_id(point)]
        valid = [run for run in group if run["valid"] and not run["warm"]]
        if not valid:
            continue
        rows.append(
            {
                "point": point_id(point),
                "schedule": point[0],
                "unit": point[1],
                "e2e": point[2],
                "samples": len(valid),
                "invalid": sum(not run["valid"] for run in group),
                "seconds": statistics.median(run["seconds"] for run in valid),
                "average_cores": statistics.median(run["average_cores"] for run in valid),
                "cpu_seconds": statistics.median(run["cpu_seconds"] for run in valid),
                "peak_gib": max(run["peak_gib"] for run in valid),
            }
        )
    candidates = [row for row in rows if row["invalid"] == 0 and row["samples"] >= 3]
    selected = None
    if candidates:
        fastest = min(row["seconds"] for row in candidates)
        fast = min(
            (row for row in candidates if row["seconds"] <= fastest + 1),
            key=lambda row: (row["unit"] + row["e2e"], row["peak_gib"]),
        )
        efficient = min(
            (row for row in candidates if row["seconds"] <= fastest * 1.3),
            key=lambda row: (row["average_cores"], row["peak_gib"], row["unit"] + row["e2e"]),
        )
        light = next((row for row in candidates if row["point"] == "series-u1-e1"), None)
        selected = {
            "ligero": light,
            "eficiente": efficient,
            "rapido": fast,
            "fastest_seconds": fastest,
            "efficient_time_limit": fastest * 1.3,
        }
    return {"points": rows, "selected": selected}


def save(output, protocol, runs):
    summary = summarize(runs)
    (output / "results.json").write_text(
        json.dumps({"protocol": protocol, "runs": runs, **summary}, indent=2) + "\n",
        encoding="utf-8",
    )
    rows = [
        f"| {p['point']} | {p['samples']} | {p['invalid']} | {p['seconds']:.2f} | {p['average_cores']:.2f} | {p['peak_gib']:.3f} |"
        for p in summary["points"]
    ]
    text = (
        "# Testing conjunto, sin build\n\n| Plan | Muestras | Inválidas | Mediana s | Núcleos medios | Pico GiB |\n| --- | ---: | ---: | ---: | ---: | ---: |\n"
        + "\n".join(rows)
    )
    text += "\n\nSelección:\n\n```json\n" + json.dumps(summary["selected"], indent=2) + "\n```\n"
    (output / "RESUMEN.md").write_text(text, encoding="utf-8")
    return summary


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--repetitions", type=int, default=3)
    parser.add_argument("--warmups", type=int, default=1)
    parser.add_argument("--expected-unit", type=int, required=True)
    parser.add_argument("--expected-e2e", type=int, required=True)
    parser.add_argument("--memory-gib", type=int, default=16)
    parser.add_argument("--timeout", type=int, default=180)
    args = parser.parse_args()
    if (
        min(args.repetitions, args.expected_unit, args.expected_e2e, args.memory_gib, args.timeout)
        < 1
        or args.warmups < 0
    ):
        parser.error("Parámetros numéricos inválidos.")
    node = shutil.which("node")
    if not node or not (FRONTEND / "out/index.html").is_file():
        parser.error(
            "Se requiere Node y una exportación actualizada: ejecutar npm run build antes."
        )
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    if (output / "results.json").exists():
        parser.error("La carpeta ya contiene datos: usar otra para preservar la evidencia.")

    def signature():
        return {
            "source": fingerprint(),
            "html": hashlib.sha256((FRONTEND / "out/index.html").read_bytes()).hexdigest(),
            "helper": hashlib.sha256(
                (FRONTEND / "test/tools/combined.mjs").read_bytes()
            ).hexdigest(),
        }

    protocol = {
        "date": datetime.now(UTC).isoformat(),
        "platform": os.name,
        "logical_cpus": os.cpu_count(),
        "node": subprocess.check_output([node, "--version"], text=True).strip(),
        "expected_unit": args.expected_unit,
        "expected_e2e": args.expected_e2e,
        "memory_limit_gib": args.memory_gib,
        "fingerprint": signature(),
        "driver_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "metrics_sha256": hashlib.sha256(
            (FRONTEND / "test/tools/benchmark.py").read_bytes()
        ).hexdigest(),
        "build_included": False,
        "threshold": 1.3,
        "tie_seconds": 1,
    }
    runs = []
    schedule = [(point, index + 1, True) for index in range(args.warmups) for point in POINTS]
    for index in range(1, args.repetitions + 1):
        schedule.extend(
            (point, index, False) for point in (POINTS if index % 2 else list(reversed(POINTS)))
        )
    for point, index, warm in schedule:
        if signature() != protocol["fingerprint"]:
            raise RuntimeError("Cambió el código o el build: se detuvo la comparación.")
        result = measure(args, node, point, index, warm, output)
        baseline = next((run.get("coverage") for run in runs if run["valid"]), None)
        if result["valid"] and baseline is not None and baseline != result["coverage"]:
            result.update(valid=False, reason="Cambió la cobertura entre planes.")
        runs.append(result)
        summary = save(output, protocol, runs)
        print(
            json.dumps(
                {
                    key: result[key]
                    for key in ("label", "valid", "seconds", "average_cores", "peak_gib", "reason")
                }
            ),
            flush=True,
        )
        if result["reason"] == "timeout":
            raise RuntimeError("Timeout: revisar procesos antes de continuar.")
    print(json.dumps(summary), flush=True)
    return 0 if all(run["valid"] for run in runs) else 1


if __name__ == "__main__":
    raise SystemExit(main())
