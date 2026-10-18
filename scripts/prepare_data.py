"""Ejecuta de principio a fin la preparación de datos y cartografía."""

import subprocess  # nosec B404: argv interno y sin shell.
import sys

from scripts.common import ROOT


def main() -> None:
    for module in [
        "download_data",
        "download_geometry",
        "prepare_catalogs",
        "build_crosswalk",
        "validate_outputs",
        "export_reference",
    ]:
        print(f"\nEjecutando {module}...", flush=True)
        subprocess.run([sys.executable, "-m", f"scripts.{module}"], cwd=ROOT, check=True)  # nosec B603: módulos constantes, sin entrada externa.


if __name__ == "__main__":
    main()
