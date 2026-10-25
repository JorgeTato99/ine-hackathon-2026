"""Comprueba que el paquete del mapa sea íntegro y no mezcle versiones."""

import csv
import hashlib
import json
import sqlite3
from contextlib import closing
from pathlib import Path
from zipfile import ZipFile

import pytest

from scripts.package_map_delivery import BASE_FILES, create_package, validate_gpkg
from scripts.prepare_results import scalar, write_json


def test_publication_json_has_portable_lf_endings(tmp_path):
    path = tmp_path / "datos.json"
    write_json(path, {"municipio": "Parácuaro", "dato": None})
    content = path.read_bytes()
    assert content.endswith(b"\n") and b"\r\n" not in content
    assert json.loads(content) == {"municipio": "Parácuaro", "dato": None}


@pytest.mark.parametrize("value", ["NaN", "nan", "inf", "-inf"])
def test_new_scientific_inputs_reject_nonfinite_youth_gaps(value):
    with pytest.raises(ValueError, match="no finito"):
        scalar("brecha_jovenes_2024", value)
    assert scalar("brecha_jovenes_2024", "") is None
    assert scalar("brecha_jovenes_2024", "0") == 0
    assert scalar("brecha_jovenes_2024", "NaN", legacy_nan=True) is None


def test_gpkg_checks_version_and_text_keys(tmp_path):
    path = tmp_path / "mapa.gpkg"
    with closing(sqlite3.connect(path)) as connection, connection:
        connection.execute("CREATE TABLE gpkg_contents (table_name TEXT, srs_id INTEGER)")
        connection.execute("INSERT INTO gpkg_contents VALUES ('resultados_2027', 4326)")
        connection.execute("CREATE TABLE resultados_2027 (cvegeo TEXT, version_resultados TEXT)")
        connection.execute("INSERT INTO resultados_2027 VALUES ('01001', 'resultados-1.2')")
    validate_gpkg(path, "resultados-1.2", 1)
    with pytest.raises(ValueError, match="versión"):
        validate_gpkg(path, "resultados-1.1", 1)
    with closing(sqlite3.connect(path)) as connection, connection:
        connection.execute("UPDATE resultados_2027 SET cvegeo = '1001'")
    with pytest.raises(ValueError, match="claves"):
        validate_gpkg(path, "resultados-1.2", 1)


@pytest.mark.parametrize(
    "url", ["javascript:alert(1)", "https://usuario:clave@example.org/", "https://example.org/\n"]
)
def test_package_rejects_unsafe_or_credentialed_urls(tmp_path, url):
    with pytest.raises(ValueError, match="URL"):
        create_package(tmp_path, tmp_path / "out", url)


def test_package_matches_real_originals_and_repeats_identically(tmp_path):
    root = Path(__file__).resolve().parents[1]
    if not (root / "frontend/public/data/manifest.json").exists():
        pytest.skip("La distribución Python no incluye los recursos web")
    archive = create_package(root, tmp_path)
    first = archive.read_bytes()
    assert create_package(root, tmp_path).read_bytes() == first
    version = "resultados-1.6"
    published = root / "frontend/public/data"
    controls = json.loads((published / version / "controles.json").read_text(encoding="utf-8"))
    assert controls["normalizations"]["brecha_jovenes_2024_NaN_to_null"] == 0
    assert controls["partialInterventions"]["combinada"] == 77
    with closing(sqlite3.connect(published / version / "municipios.gpkg")) as connection:
        reason = connection.execute(
            "SELECT nac_estimado_int_combinada_motivo FROM resultados_2027 WHERE cvegeo = ?",
            ("07064",),
        ).fetchone()[0]
        assert "intervencion_parcial" in reason.split("|")
    dataset = json.loads((published / "dataset.json").read_text(encoding="utf-8"))
    indicators = {row["id"]: row["indicators"] for row in dataset["municipalities"]}
    with (published / version / "municipios.csv").open(encoding="utf-8", newline="") as stream:
        municipalities = list(csv.DictReader(stream))
    nullable_fields = (
        "brecha_jovenes_2024",
        "peso_jov_2024",
        "n_jov_2024",
        "nv_jov_2024",
        "primerizos_votaron_2024",
        "jovenes_21_29_no_votaron_2024",
        "interv_votos_retener_primerizos",
        "interv_votos_brecha_joven",
    )
    for field in nullable_fields:
        # S2 ya tenía 11 ausencias adicionales antes de la corrección de los 15 municipios.
        expected_missing = 26 if field == "interv_votos_brecha_joven" else 15
        assert sum(row[field] == "" for row in municipalities) == expected_missing
        for row in municipalities:
            value = row[field]
            assert indicators[row["cvegeo"]][field] == (float(value) if value else None)
    prefix = archive.stem + "/"
    with ZipFile(archive) as package:
        assert package.testzip() is None
        assert len(package.namelist()) == 12
        manifest = json.loads(package.read(prefix + "MANIFIESTO.json"))
        assert manifest["version_resultados"] == version
        assert manifest["source"]["commit"] == "7ff4ca3cfbdc0b4f90d1df44be4b4acf00e61fd7"
        for name, metadata in manifest["files"].items():
            content = package.read(prefix + name)
            assert len(content) == metadata["bytes"]
            assert hashlib.sha256(content).hexdigest() == metadata["sha256"]
        for name in BASE_FILES:
            original = root / "data/processed/entrega/base-datos-1.6" / name
            assert package.read(prefix + "base-datos/" + name) == original.read_bytes()
        assert b"https://traza-civica.jorgetato.com/" in package.read(prefix + "ENLACE.txt")
        assert not any(".." in name or name.startswith("/") for name in package.namelist())
