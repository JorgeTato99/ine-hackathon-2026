"""Instala un wheel no editable y reconstruye el sdist fuera del árbol fuente."""

import json

# Los comandos se forman como argv interno; no se utiliza shell.
import subprocess  # nosec B404
import sys
import tarfile
import tempfile
import tomllib
import venv
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]


def run(command: list[str], cwd: Path) -> None:
    """Propaga cualquier fallo de instalación, construcción o importación."""
    subprocess.run(command, cwd=cwd, check=True)  # nosec B603


def validate_source_members(names: list[str], expected_root: str) -> None:
    """Distingue carpetas locales de nombres válidos dentro del paquete fuente."""
    for name in names:
        path = PurePosixPath(name)
        parts = path.parts
        if path.is_absolute() or ".." in parts or not parts or parts[0] != expected_root:
            raise RuntimeError("El sdist contiene una ruta fuera de su raíz esperada.")
        if len(parts) > 1 and (
            parts[1] in {"temp", "artifacts", ".git"} or parts[1].startswith(".venv")
        ):
            raise RuntimeError("El sdist contiene un entorno o evidencia local.")


def verify(root: Path, workspace: Path) -> dict[str, str]:
    """Verifica artefactos y su aislamiento del checkout editable."""
    config = tomllib.loads((root / "pyproject.toml").read_text(encoding="utf-8"))
    project = config["project"]
    package = project["name"].replace("-", "_")
    normalized = package + "-" + project["version"]
    wheel = root / "dist" / (normalized + "-py3-none-any.whl")
    sdist = root / "dist" / (normalized + ".tar.gz")
    if not wheel.is_file() or not sdist.is_file():
        raise FileNotFoundError("Construye primero con uv build.")
    with zipfile.ZipFile(wheel) as archive:
        if package + "/py.typed" not in archive.namelist():
            raise RuntimeError("Falta el marcador de tipos en el wheel.")
    extracted = workspace / "sdist"
    extracted.mkdir()
    with tarfile.open(sdist) as archive:
        names = archive.getnames()
        validate_source_members(names, normalized)
        archive.extractall(extracted, filter="data")
    source = extracted / normalized
    run(["uv", "build", "--wheel"], source)
    isolated = workspace / "installed"
    venv.EnvBuilder(with_pip=False).create(isolated)
    python = isolated / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    run(
        ["uv", "pip", "install", "--python", str(python), "--no-deps", str(wheel)],
        workspace,
    )
    code = (
        "from pathlib import Path; import importlib, sys; "
        f"module=importlib.import_module({package!r}); "
        "assert Path(module.__file__).resolve().is_relative_to(Path(sys.prefix).resolve()); "
        f"assert module.get_version()=={project['version']!r}; "
        "print(module.__file__)"
    )
    run([str(python), "-I", "-c", code], workspace)
    run([str(python), "-I", "-m", package, "--version"], workspace)
    return {"wheel": wheel.name, "sdist": sdist.name, "status": "ok"}


def main() -> None:
    """Utiliza un directorio temporal con limpieza automática."""
    with tempfile.TemporaryDirectory(prefix="python-template-wheel-") as directory:
        print(json.dumps(verify(ROOT, Path(directory)), sort_keys=True))


if __name__ == "__main__":
    main()
