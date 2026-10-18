"""Verifica los límites de inclusión del archivo fuente distribuible."""

import importlib.util
from pathlib import Path

import pytest


def load_distribution():
    source = Path(__file__).resolve().parents[1] / "scripts/verify_distribution.py"
    spec = importlib.util.spec_from_file_location("template_distribution", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize(
    "member",
    [
        "project-0.1.0/src/temp/__init__.py",
        "project-0.1.0/src/artifacts/__init__.py",
        "project-0.1.0/README.md",
    ],
)
def test_allows_package_names_at_nested_levels(member):
    load_distribution().validate_source_members([member], "project-0.1.0")


@pytest.mark.parametrize(
    "member",
    [
        "project-0.1.0/temp/raw.csv",
        "project-0.1.0/artifacts/log.txt",
        "project-0.1.0/.venv/pyvenv.cfg",
        "../outside",
        "/outside",
        "other-0.1.0/README.md",
    ],
)
def test_rejects_local_artifacts_or_foreign_roots(member):
    with pytest.raises(RuntimeError):
        load_distribution().validate_source_members([member], "project-0.1.0")
