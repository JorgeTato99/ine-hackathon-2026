"""Calibración opcional del testing con Python estándar; no añade dependencias Node.

Windows mide todo el árbol con Job Objects. En Linux requiere un cgroup exclusivo
declarado mediante BENCHMARK_CGROUP=1. No lanzar otras tareas en ese contenedor.
"""

from __future__ import annotations

import argparse
import csv
import ctypes as C
import hashlib
import json
import os
import shutil
import signal
import statistics
import subprocess
import sys
import time
from ctypes import wintypes as W
from datetime import UTC, datetime
from pathlib import Path

FRONTEND = Path(__file__).resolve().parents[2]


class BasicLimits(C.Structure):
    _fields_ = [
        ("process_time", C.c_int64),
        ("job_time", C.c_int64),
        ("flags", W.DWORD),
        ("min_ws", C.c_size_t),
        ("max_ws", C.c_size_t),
        ("active", W.DWORD),
        ("affinity", C.c_size_t),
        ("priority", W.DWORD),
        ("scheduling", W.DWORD),
    ]


class IoCounters(C.Structure):
    _fields_ = [
        (name, C.c_uint64)
        for name in (
            "read_ops",
            "write_ops",
            "other_ops",
            "read_bytes",
            "write_bytes",
            "other_bytes",
        )
    ]


class ExtendedLimits(C.Structure):
    _fields_ = [
        ("basic", BasicLimits),
        ("io", IoCounters),
        ("process_memory", C.c_size_t),
        ("job_memory", C.c_size_t),
        ("peak_process_memory", C.c_size_t),
        ("peak_job_memory", C.c_size_t),
    ]


class Accounting(C.Structure):
    _fields_ = [
        (name, C.c_int64) for name in ("user", "kernel", "period_user", "period_kernel")
    ] + [(name, W.DWORD) for name in ("faults", "total", "active", "terminated")]


class WindowsMeter:
    definition = "Windows Job Object: CPU de todo el árbol y memoria comprometida máxima"

    def __init__(self, memory_gib, priority=0x20):
        self.api = C.WinDLL("kernel32", use_last_error=True)
        self.api.CreateJobObjectW.argtypes = [C.c_void_p, W.LPCWSTR]
        self.api.CreateJobObjectW.restype = W.HANDLE
        for name in ("SetInformationJobObject", "QueryInformationJobObject"):
            getattr(self.api, name).argtypes = [W.HANDLE, C.c_int, C.c_void_p, W.DWORD] + (
                [C.c_void_p] if name.startswith("Query") else []
            )
        self.api.AssignProcessToJobObject.argtypes = [W.HANDLE, W.HANDLE]
        self.api.TerminateJobObject.argtypes = [W.HANDLE, W.UINT]
        self.api.CloseHandle.argtypes = [W.HANDLE]
        self.job = self.api.CreateJobObjectW(None, None)
        self.require(self.job)
        limits = ExtendedLimits()
        limits.basic.flags = 0x2000 | 0x200 | (0x20 if priority is not None else 0)
        limits.basic.priority = priority or 0
        limits.job_memory = memory_gib * 1024**3
        self.require(
            self.api.SetInformationJobObject(self.job, 9, C.byref(limits), C.sizeof(limits))
        )

    @staticmethod
    def require(value):
        if not value:
            raise C.WinError(C.get_last_error())

    def attach(self, process):
        self.require(self.api.AssignProcessToJobObject(self.job, W.HANDLE(int(process._handle))))

    def sample(self):
        pass  # El kernel mantiene el pico y la contabilidad incluso tras salir un hijo.

    def result(self):
        accounts, limits = Accounting(), ExtendedLimits()
        self.require(
            self.api.QueryInformationJobObject(
                self.job, 1, C.byref(accounts), C.sizeof(accounts), None
            )
        )
        self.require(
            self.api.QueryInformationJobObject(self.job, 9, C.byref(limits), C.sizeof(limits), None)
        )
        return {
            "cpu_seconds": (accounts.user + accounts.kernel) / 1e7,
            "peak_gib": limits.peak_job_memory / 1024**3,
            "processes": accounts.total,
        }

    def terminate(self, process):
        self.api.TerminateJobObject(self.job, 124)

    def close(self):
        self.api.CloseHandle(self.job)


class CgroupMeter:
    definition = (
        "Linux cgroup exclusivo: CPU total y memory.current con caché, muestras cada 100 ms"
    )
    directory = Path("/sys/fs/cgroup")

    def __init__(self, _memory_gib):
        if os.environ.get("BENCHMARK_CGROUP") != "1":
            raise RuntimeError(
                "Linux requiere BENCHMARK_CGROUP=1 dentro de un contenedor exclusivo."
            )
        self.start_cpu = self.cpu()
        self.peak = self.memory()

    def cpu(self):
        return (
            int(
                dict(
                    line.split() for line in (self.directory / "cpu.stat").read_text().splitlines()
                )["usage_usec"]
            )
            / 1e6
        )

    def memory(self):
        return int((self.directory / "memory.current").read_text())

    def attach(self, _process):
        pass

    def sample(self):
        self.peak = max(self.peak, self.memory())

    def result(self):
        self.sample()
        return {"cpu_seconds": self.cpu() - self.start_cpu, "peak_gib": self.peak / 1024**3}

    def terminate(self, process):
        os.killpg(process.pid, signal.SIGKILL)

    def close(self):
        pass


def fingerprint():
    files = [
        FRONTEND / name
        for name in (
            "package.json",
            "package-lock.json",
            "vitest.config.mts",
            "playwright.config.ts",
            "next.config.ts",
        )
    ]
    for directory in ("src", "scripts", "test/integration", "test/test-utils", "playwright-tests"):
        files.extend(
            path
            for path in (FRONTEND / directory).rglob("*")
            if path.is_file() and path.suffix in {".ts", ".tsx", ".mts", ".mjs", ".js", ".css"}
        )
    files.append(FRONTEND / "test/vitest.setup.ts")
    digest = hashlib.sha256()
    for path in sorted(set(files)):
        digest.update(path.relative_to(FRONTEND).as_posix().encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


def coverage_totals(directory):
    coverage = json.loads((directory / "coverage-final.json").read_text(encoding="utf-8"))
    result = {key: [0, 0] for key in ("statements", "functions", "branches")}
    for entry in coverage.values():
        for name, counts in (
            ("statements", list(entry["s"].values())),
            ("functions", list(entry["f"].values())),
            ("branches", [count for row in entry["b"].values() for count in row]),
        ):
            result[name][0] += sum(value > 0 for value in counts)
            result[name][1] += len(counts)
    return result


def execute(args, node, workers, index, warm, output):
    label = f"{args.battery}-w{workers}-{'warm' if warm else 'r'}{index}"
    report_path = output / f"{label}.tests.json"
    env = dict(
        os.environ,
        TEST_PROFILE="ligero",
        UV_THREADPOOL_SIZE="2",
        RAYON_NUM_THREADS="2",
        NODE_OPTIONS="--max-old-space-size=3072",
        NEXT_TELEMETRY_DISABLED="1",
        STORYBOOK_DISABLE_TELEMETRY="1",
        FORCE_COLOR="0",
        PLAYWRIGHT_SKIP_BROWSER_GC="1",
    )
    env.pop("PLAYWRIGHT_BASE_URL", None)
    env.pop("VITEST_MAX_WORKERS", None)
    command = [node]
    if args.battery in {"unit", "coverage"}:
        command += [
            str(FRONTEND / "node_modules/vitest/vitest.mjs"),
            "run",
            f"--maxWorkers={workers}",
            "--reporter=json",
            f"--outputFile={report_path}",
        ]
        if args.battery == "coverage":
            command += [
                "--coverage",
                f"--coverage.reportsDirectory={output / (label + '.coverage')}",
            ]
    elif args.battery == "e2e":
        command += [
            str(FRONTEND / "node_modules/@playwright/test/cli.js"),
            "test",
            f"--workers={workers}",
            "--retries=0",
            "--reporter=json",
            f"--output={output / (label + '.assets')}",
        ]
        env["PLAYWRIGHT_JSON_OUTPUT_FILE"] = str(report_path)
    else:
        command += [str(FRONTEND / "node_modules/next/dist/bin/next"), "build", "--webpack"]
        env.update(
            BUILD_WORKERS=str(workers),
            UV_THREADPOOL_SIZE=str(workers),
            RAYON_NUM_THREADS=str(workers),
            NODE_OPTIONS="--max-old-space-size=6144",
        )
    meter = WindowsMeter(args.memory_gib) if os.name == "nt" else CgroupMeter(args.memory_gib)
    process = None
    reason = None
    start = time.perf_counter()
    try:
        with (output / f"{label}.log").open("w", encoding="utf-8") as log:
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
        "workers": workers,
        "round": index,
        "warm": warm,
        "exit_code": code,
        "seconds": seconds,
        **metrics,
        "average_cores": metrics["cpu_seconds"] / seconds,
        "memory_definition": meter.definition,
        "valid": code == 0 and reason is None,
        "reason": reason,
        "command": command,
    }
    try:
        if args.battery in {"unit", "coverage"}:
            report = json.loads(report_path.read_text(encoding="utf-8"))
            result["passed_tests"] = report["numPassedTests"]
            result["valid"] &= (
                report["numTotalTests"] == args.expected_tests
                and report["numPassedTests"] == args.expected_tests
                and report["numFailedTests"] == report["numPendingTests"] == 0
            )
            if args.battery == "coverage":
                result["coverage"] = coverage_totals(output / (label + ".coverage"))
        elif args.battery == "e2e":
            stats = json.loads(report_path.read_text(encoding="utf-8"))["stats"]
            result["passed_tests"] = stats["expected"]
            result["valid"] &= stats["expected"] == args.expected_tests and all(
                stats[key] == 0 for key in ("unexpected", "flaky", "skipped")
            )
        else:
            result["valid"] &= (FRONTEND / "out/index.html").is_file()
    except (OSError, KeyError, ValueError) as error:
        result["valid"] = False
        result["reason"] = str(error)
    if not result["valid"] and not result["reason"]:
        result["reason"] = "Código de salida, cantidad de pruebas o estado inválidos."
    return result


def summarize(runs, workers):
    points = []
    for value in workers:
        complete_group = [run for run in runs if run["workers"] == value]
        group = [run for run in complete_group if not run["warm"]]
        valid = [run for run in group if run["valid"]]
        if not valid:
            continue
        times = [run["seconds"] for run in valid]
        points.append(
            {
                "workers": value,
                "samples": len(valid),
                "invalid": sum(not run["valid"] for run in complete_group),
                "seconds": statistics.median(times),
                "min_seconds": min(times),
                "max_seconds": max(times),
                "average_cores": statistics.median(run["average_cores"] for run in valid),
                "cpu_seconds": statistics.median(run["cpu_seconds"] for run in valid),
                "peak_gib": max(run["peak_gib"] for run in valid),
            }
        )
    eligible = [point for point in points if point["samples"] >= 3 and point["invalid"] == 0]
    selected = None
    if eligible:
        fastest = min(point["seconds"] for point in eligible)
        # Un segundo de diferencia no justifica ocupar más workers en esta batería pequeña.
        fast = min(
            (point for point in eligible if point["seconds"] <= fastest + 1),
            key=lambda p: p["workers"],
        )
        efficient = min(
            (point for point in eligible if point["seconds"] <= fastest * 1.3),
            key=lambda p: (p["average_cores"], p["peak_gib"], p["workers"]),
        )
        light = min(eligible, key=lambda p: p["workers"])
        selected = {
            "ligero": light["workers"],
            "eficiente": efficient["workers"],
            "rapido": fast["workers"],
            "fastest_seconds": fastest,
            "efficient_time_limit": fastest * 1.3,
        }
    return {"points": points, "selected": selected}


def save(output, protocol, runs, workers):
    summary = summarize(runs, workers)
    (output / "results.json").write_text(
        json.dumps({"protocol": protocol, "runs": runs, **summary}, indent=2) + "\n",
        encoding="utf-8",
    )
    columns = [
        "label",
        "workers",
        "round",
        "warm",
        "valid",
        "seconds",
        "cpu_seconds",
        "average_cores",
        "peak_gib",
        "exit_code",
        "reason",
    ]
    with (output / "runs.csv").open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(runs)
    rows = [
        f"| {p['workers']} | {p['samples']} | {p['invalid']} | {p['seconds']:.2f} | {p['average_cores']:.2f} | {p['peak_gib']:.3f} |"
        for p in summary["points"]
    ]
    text = (
        "# Calibración: "
        + protocol["battery"]
        + "\n\n| Workers | Muestras | Inválidas | Mediana s | Núcleos medios | Pico GiB |\n| --- | ---: | ---: | ---: | ---: | ---: |\n"
        + "\n".join(rows)
    )
    text += "\n\nSelección: `" + json.dumps(summary["selected"], ensure_ascii=False) + "`\n"
    text += "\nMemoria: " + (runs[0]["memory_definition"] if runs else "sin muestras") + ".\n"
    (output / "RESUMEN.md").write_text(text, encoding="utf-8")
    return summary


def self_check():
    rows = [
        {
            "workers": worker,
            "round": index,
            "warm": False,
            "valid": True,
            "seconds": seconds,
            "cpu_seconds": cores * seconds,
            "average_cores": cores,
            "peak_gib": worker,
        }
        for worker, seconds, cores in [(1, 15, 1), (2, 11, 1.5), (4, 10, 3)]
        for index in range(3)
    ]
    selected = summarize(rows, [1, 2, 4])["selected"]
    assert selected["eficiente"] == 2 and selected["ligero"] == 1 and selected["rapido"] == 2
    rows[-1]["valid"] = False
    assert summarize(rows, [1, 2, 4])["selected"]["eficiente"] == 2
    assert summarize(rows[:1], [1])["selected"] is None
    print("Selector: margen, empate, exclusión de fallos y mínimo de muestras correctos.")


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-check", action="store_true")
    parser.add_argument("--battery", choices=["unit", "coverage", "e2e", "build"])
    parser.add_argument("--workers", default="1,2")
    parser.add_argument("--repetitions", type=int, default=3)
    parser.add_argument("--warmups", type=int, default=1)
    parser.add_argument("--expected-tests", type=int)
    parser.add_argument("--timeout", type=int, default=180)
    parser.add_argument("--memory-gib", type=int, default=16)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    if args.self_check:
        self_check()
        return 0
    if args.battery is None or (args.battery != "build" and not args.expected_tests):
        parser.error("Especificar --battery y --expected-tests (excepto para build).")
    try:
        workers = sorted({int(value) for value in args.workers.split(",")})
    except ValueError:
        parser.error("--workers acepta enteros separados por comas.")
    if (
        not workers
        or min(workers) < 1
        or args.repetitions < 1
        or args.warmups < 0
        or args.memory_gib < 1
    ):
        parser.error("Valores de workers/repeticiones/memoria inválidos.")
    node = shutil.which("node")
    if not node:
        parser.error("Node no está en PATH.")
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    output = (args.output or FRONTEND / "artifacts/benchmarks" / timestamp).resolve()
    output.mkdir(parents=True, exist_ok=True)
    protocol = {
        "battery": args.battery,
        "expected_tests": args.expected_tests,
        "workers": workers,
        "source_sha256": fingerprint(),
        "platform": os.name,
        "logical_cpus": os.cpu_count(),
        "node": subprocess.check_output([node, "--version"], text=True).strip(),
        "memory_limit_gib": args.memory_gib,
        "threshold": 1.3,
        "tie_seconds": 1,
        "driver_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    }
    previous = output / "results.json"
    runs = []
    if args.resume:
        old = json.loads(previous.read_text(encoding="utf-8"))
        if old["protocol"] != protocol:
            raise RuntimeError("Cambió el protocolo o el código: usar una carpeta nueva.")
        runs = old["runs"]
    elif previous.exists():
        parser.error("La carpeta ya tiene resultados: usar --resume o una carpeta nueva.")
    first_round = max((run["round"] for run in runs if not run["warm"]), default=0) + 1
    schedule = []
    if not args.resume:
        schedule.extend(
            (value, index + 1, True) for index in range(args.warmups) for value in workers
        )
    for index in range(first_round, first_round + args.repetitions):
        order = workers if index % 2 else list(reversed(workers))
        schedule.extend((value, index, False) for value in order)
    for value, index, warm in schedule:
        if fingerprint() != protocol["source_sha256"]:
            raise RuntimeError("El código cambió durante la medición; se detuvo la batería.")
        result = execute(args, node, value, index, warm, output)
        if args.battery == "coverage" and result["valid"]:
            old_coverage = next(
                (run["coverage"] for run in runs if run.get("valid") and "coverage" in run), None
            )
            if old_coverage is not None and old_coverage != result["coverage"]:
                result.update(valid=False, reason="La cobertura cambió entre puntos.")
        runs.append(result)
        summary = save(output, protocol, runs, workers)
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
            raise RuntimeError("Timeout: revisar procesos antes de reanudar.")
    print(json.dumps(summary), flush=True)
    return 0 if all(run["valid"] for run in runs) else 1


if __name__ == "__main__":
    raise SystemExit(main())
