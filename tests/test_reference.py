"""Verifica las tablas publicadas y sus hashes sin descargar los datos grandes."""

import csv
import hashlib
import json
from pathlib import Path

REFERENCE = Path(__file__).resolve().parents[1] / "data/reference"


def rows(name):
    with (REFERENCE / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def test_published_checksums_survive_cross_platform_checkout():
    manifest = json.loads((REFERENCE / "procedencia.json").read_text(encoding="utf-8"))
    for name, expected in manifest["sha256"].items():
        if name == "geometry_geojson_sha256":
            continue
        assert hashlib.sha256((REFERENCE / name).read_bytes()).hexdigest() == expected, name


def test_snapshot_keys_and_coverage_are_consistent():
    ready = rows("municipios_para_mapa.csv")
    crosswalk = rows("equivalencias_ine_inegi.csv")
    codes = {row["CVEGEO"] for row in rows("municipios_inegi.csv")}
    assert len(ready) == 14706
    assert len(crosswalk) == 14779
    assert len(codes) == 2478
    assert len({(row["anio"], row["cvegeo"]) for row in ready}) == len(ready)
    assert all(row["cvegeo"] in codes for row in crosswalk)
    assert all(int(row["sv"]) + int(row["nv"]) > 0 for row in ready)
    assert all(len(row["cvegeo"]) == 5 for row in ready)
    assert not rows("sin_correspondencia_2024.csv")
