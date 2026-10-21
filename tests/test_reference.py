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


def test_published_configuration_hashes_identify_the_applied_corrections():
    manifest = json.loads((REFERENCE / "procedencia.json").read_text(encoding="utf-8"))
    for name, expected in manifest["configuration_sha256"].items():
        assert hashlib.sha256((REFERENCE.parents[1] / name).read_bytes()).hexdigest() == expected


def test_2021_names_do_not_swap_paracho_and_paracuaro_histories():
    crosswalk = {(r["anio"], r["clave_ine"]): r for r in rows("equivalencias_ine_inegi.csv")}
    for year in ["2009", "2012", "2015", "2018", "2021", "2024"]:
        assert crosswalk[(year, "16065")]["cvegeo"] == "16064"
        assert crosswalk[(year, "16066")]["cvegeo"] == "16065"
    ready = {(r["anio"], r["cvegeo"]): r for r in rows("municipios_para_mapa.csv")}
    assert int(ready[("2021", "16064")]["ln"]) == 19051
    assert int(ready[("2021", "16065")]["ln"]) == 27223
