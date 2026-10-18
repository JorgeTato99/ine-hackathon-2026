"""Comprueba las dependencias acordadas y evita activar otros perfiles."""

import importlib
import importlib.metadata
import json
import sys


def main() -> None:
    if sys.version_info[:2] != (3, 14):
        raise RuntimeError("El proyecto utiliza Python 3.14.")
    required = {
        "numpy": "numpy",
        "scipy": "scipy",
        "scikit-learn": "sklearn",
        "statsmodels": "statsmodels.api",
        "geopandas": "geopandas",
        "pandera": "pandera.polars",
        "matplotlib": "matplotlib",
        "libpysal": "libpysal",
        "esda": "esda",
        "polars": "polars",
        "pyarrow": "pyarrow",
        "ipykernel": "ipykernel",
        "jupyterlab": "jupyterlab",
    }
    for module in required.values():
        importlib.import_module(module)
    installed = {dist.metadata["Name"].lower() for dist in importlib.metadata.distributions()}
    forbidden = {
        "xgboost",
        "lightgbm",
        "interpret",
        "interpret-core",
        "catboost",
        "fastapi",
        "uvicorn",
    }
    if present := forbidden & installed:
        raise RuntimeError(f"Perfiles no seleccionados en el entorno: {sorted(present)}")
    print(json.dumps({name: importlib.metadata.version(name) for name in required}, sort_keys=True))


if __name__ == "__main__":
    main()
