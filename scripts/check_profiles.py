"""Verifica operaciones representativas de un perfil instalado."""

import argparse
import importlib
import importlib.metadata
import io
import json
import tomllib
from pathlib import Path


def check_core() -> dict[str, str]:
    """Comprueba la importación pública del paquete instalado."""
    config = tomllib.loads(
        (Path(__file__).resolve().parents[1] / "pyproject.toml").read_text(encoding="utf-8")
    )
    name = config["project"]["name"]
    package = name.replace("-", "_")
    module = importlib.import_module(package)
    result = module.get_version()
    if not isinstance(result, str) or result != config["project"]["version"]:
        raise RuntimeError("La versión instalada no coincide con el manifiesto.")
    return {name: result}


def check_data() -> dict[str, str]:
    """Verifica agregación y roundtrip Parquet con dos lectores."""
    np = importlib.import_module("numpy")
    pl = importlib.import_module("polars")
    pq = importlib.import_module("pyarrow.parquet")

    frame = pl.DataFrame({"zone": ["a", "a", "b"], "value": [1, 2, 4]})
    grouped = frame.group_by("zone").agg(pl.col("value").sum()).sort("zone")
    if grouped["value"].to_list() != [3, 4]:
        raise RuntimeError("La agregación produjo resultados inesperados.")
    buffer = io.BytesIO()
    frame.write_parquet(buffer)
    restored = pq.read_table(io.BytesIO(buffer.getvalue()))
    if restored.num_rows != 3 or np.sum(restored["value"].to_numpy()) != 7:
        raise RuntimeError("El intercambio Parquet no conservó los datos.")
    return {name: importlib.metadata.version(name) for name in ("numpy", "polars", "pyarrow")}


def check_notebooks() -> dict[str, str]:
    """Comprueba las importaciones de notebooks sin iniciar servidores."""
    for module in ("ipykernel", "jupyterlab"):
        importlib.import_module(module)
    return {name: importlib.metadata.version(name) for name in ("ipykernel", "jupyterlab")}


def main() -> None:
    """Selecciona el perfil que se ha instalado para esta ejecución."""
    parser = argparse.ArgumentParser()
    parser.add_argument("profile", choices=("core", "data", "notebooks"))
    selected = parser.parse_args().profile
    checks = {
        "core": check_core,
        "data": check_data,
        "notebooks": check_notebooks,
    }
    print(json.dumps({"profile": selected, "versions": checks[selected]()}, sort_keys=True))


if __name__ == "__main__":
    main()
