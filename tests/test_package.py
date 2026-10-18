"""Verifica la API pública y la instalación fuera del directorio fuente."""

import subprocess
import sys
from importlib.metadata import version

from ine_hackathon_2026 import get_version
from ine_hackathon_2026.__main__ import main


def test_reports_installed_distribution_version():
    assert get_version() == version("ine-hackathon-2026")


def test_default_command_displays_help(monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["ine-hackathon-2026"])
    main()
    assert "--version" in capsys.readouterr().out


def test_module_runs_outside_repository(tmp_path):
    result = subprocess.run(
        [sys.executable, "-m", "ine_hackathon_2026", "--version"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=True,
    )
    assert result.stdout.strip() == get_version()
