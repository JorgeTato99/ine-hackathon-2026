"""Ejecuta las comprobaciones del proyecto y conserva el primer fallo."""

# Los comandos se forman como argv interno; no se utiliza shell.
import subprocess  # nosec B404
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    """Comprueba el lock antes de ejecutar herramientas del entorno actual."""
    commands = [
        ["uv", "lock", "--check"],
        [sys.executable, "-m", "mypy"],
        [sys.executable, "-m", "ruff", "check", "src", "scripts", "tests"],
        [sys.executable, "-m", "ruff", "format", "--check", "src", "scripts", "tests"],
        [
            sys.executable,
            "-m",
            "bandit",
            "-c",
            "pyproject.toml",
            "-r",
            "src",
            "scripts",
        ],
        [
            sys.executable,
            "-m",
            "pytest",
            "--cov",
            "--cov-report=term-missing",
            "--junitxml=artifacts/tests.xml",
        ],
        ["uv", "build"],
        [sys.executable, "scripts/verify_distribution.py"],
    ]
    for command in commands:
        print("Ejecutando: " + " ".join(command), flush=True)
        result = subprocess.run(command, cwd=ROOT, check=False)  # nosec B603
        if result.returncode:
            return result.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
