"""Comprueba que el verificador no transforma errores en resultados correctos."""

import importlib.util
import subprocess
from pathlib import Path


def load_checks():
    spec = importlib.util.spec_from_file_location(
        "template_check", Path(__file__).resolve().parents[1] / "scripts/check.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_stops_at_first_failure(monkeypatch):
    module = load_checks()
    calls = []

    def fail(command, **kwargs):
        calls.append(command)
        return subprocess.CompletedProcess(command, 7)

    monkeypatch.setattr(module.subprocess, "run", fail)
    assert module.main() == 7
    assert len(calls) == 1


def test_runs_all_checks_on_success(monkeypatch):
    module = load_checks()
    calls = []

    def succeed(command, **kwargs):
        calls.append(command)
        return subprocess.CompletedProcess(command, 0)

    monkeypatch.setattr(module.subprocess, "run", succeed)
    assert module.main() == 0
    assert len(calls) == 8
