"""Protege identidad, ausencia y fidelidad al preparar la muestra del frontend."""

import csv
import hashlib
import json
from pathlib import Path

import pytest

from scripts import prepare_frontend


def write_csv(path, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


@pytest.fixture
def sample(tmp_path):
    historical = {
        "cvegeo": "01001",
        "nombre_mpio": 'Municipio, con "comillas"',
        "nombre_edo": "AGUASCALIENTES",
        "ln_2024": "100",
        **{f"part_{year}": "0.5" for year in prepare_frontend.YEARS},
    }
    historical["part_2009"] = "0"
    historical["part_2012"] = ""
    estimate = {
        "cvegeo": "01001",
        "escenario_id": "ejemplo-a",
        "nivel_nacional": "medio",
        "intervencion": "ninguna",
        "anio": "2027",
        "part_pred": "0.5",
        "part_pred_inf": "0.4",
        "part_pred_sup": "0.6",
        "riesgo": "medio",
        "estado_estimacion": "baja_precision",
        "motivo": "Valor recibido, no recalculado",
    }
    metadata = {
        "tipo_muestra": "provisional_estructural",
        "version_resultados": "muestra-prueba",
        "generado": "2026-10-19",
        "formula": "ESTE TEXTO NO SE EJECUTA",
    }
    directory = tmp_path / "muestra"
    directory.mkdir()
    catalog = tmp_path / "catalogo.csv"
    write_csv(catalog, [{"CVEGEO": "01001", "NOMGEO": "Uno"}, {"CVEGEO": "01002", "NOMGEO": "Dos"}])
    (directory / "metadatos.json").write_text(json.dumps(metadata), encoding="utf-8")
    write_csv(directory / "municipios.csv", [historical])
    write_csv(directory / "escenarios_2027.csv", [estimate])
    return directory, catalog, historical, estimate


def test_preserves_text_keys_quoted_names_zero_absence_and_original_bytes(sample):
    directory, catalog, historical, _ = sample
    before = {
        path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in directory.iterdir()
    }
    result = prepare_frontend.prepare_dataset(directory, catalog)
    first, second = result["municipalities"]
    assert first["id"] == "01001"
    assert first["name"] == historical["nombre_mpio"]
    assert first["history"]["2009"] == 0
    assert first["history"]["2012"] is None
    assert second["hasGeometry"] and not second["hasData"]
    assert all(value is None for value in second["history"].values())
    assert result["estimates"]["ejemplo-a"]["01001"]["participation"] == 0.5
    assert result["comparisonPolicy"] == {"status": "pending", "pairs": []}
    assert result["sample"] is True
    assert before == {
        path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in directory.iterdir()
    }


@pytest.mark.parametrize("invalid", ["-0.01", "1.1", "nan", "inf", "-inf"])
def test_rejects_invalid_historical_proportions(sample, invalid):
    directory, catalog, historical, _ = sample
    historical["part_2018"] = invalid
    write_csv(directory / "municipios.csv", [historical])
    with pytest.raises(ValueError):
        prepare_frontend.prepare_dataset(directory, catalog)


@pytest.mark.parametrize(
    "patch",
    [
        {"part_pred": "1.1"},
        {"part_pred_inf": "0.7", "part_pred_sup": "0.4"},
        {"part_pred_inf": "0.55"},
        {"part_pred_sup": "0.45"},
        {"riesgo": "urgente"},
        {"estado_estimacion": ""},
        {"part_pred": "", "riesgo": "medio"},
        {"part_pred": "0.5", "riesgo": "sin_estimacion"},
        {"cvegeo": "99999"},
    ],
)
def test_rejects_incoherent_estimates_instead_of_repairing_them(sample, patch):
    directory, catalog, _, estimate = sample
    write_csv(directory / "escenarios_2027.csv", [{**estimate, **patch}])
    with pytest.raises(ValueError):
        prepare_frontend.prepare_dataset(directory, catalog)


def test_keeps_missing_estimate_and_reason_without_inventing_a_risk(sample):
    directory, catalog, _, estimate = sample
    estimate.update(
        part_pred="",
        part_pred_inf="",
        part_pred_sup="",
        riesgo="sin_estimacion",
        estado_estimacion="sin_estimacion",
    )
    write_csv(directory / "escenarios_2027.csv", [estimate])
    row = prepare_frontend.prepare_dataset(directory, catalog)["estimates"]["ejemplo-a"]["01001"]
    assert row["participation"] is None
    assert row["lower"] is None and row["upper"] is None
    assert row["reason"] == estimate["motivo"]


def test_rejects_duplicate_identity_or_estimates(sample):
    directory, catalog, historical, estimate = sample
    write_csv(directory / "municipios.csv", [historical, historical])
    with pytest.raises(ValueError, match="duplicado"):
        prepare_frontend.prepare_dataset(directory, catalog)
    write_csv(directory / "municipios.csv", [historical])
    write_csv(directory / "escenarios_2027.csv", [estimate, estimate])
    with pytest.raises(ValueError, match="duplicado"):
        prepare_frontend.prepare_dataset(directory, catalog)


def test_incident_override_is_scoped_to_the_identified_original_file(sample, monkeypatch):
    directory, catalog, historical, estimate = sample
    historical["cvegeo"] = estimate["cvegeo"] = "16064"
    write_csv(directory / "municipios.csv", [historical])
    write_csv(directory / "escenarios_2027.csv", [estimate])
    result = prepare_frontend.prepare_dataset(directory, catalog)
    municipality = next(row for row in result["municipalities"] if row["id"] == "16064")
    assert municipality["history"]["2021"] == 0.5
    assert municipality["historyIssue"] is None
    monkeypatch.setattr(
        prepare_frontend,
        "HISTORY_ISSUE_SOURCE_SHA256",
        hashlib.sha256((directory / "municipios.csv").read_bytes()).hexdigest(),
    )
    result = prepare_frontend.prepare_dataset(directory, catalog)
    municipality = next(row for row in result["municipalities"] if row["id"] == "16064")
    assert municipality["history"]["2021"] is None
    assert municipality["history"]["2024"] == 0.5
    assert municipality["historyIssue"]


def test_published_results_preserve_scientific_values_and_downloads():
    root = Path(__file__).resolve().parents[1]
    published = root / "frontend/public/data"
    if not published.exists():
        pytest.skip("La distribución Python no incluye los recursos del frontend")
    actual = json.loads((published / "dataset.json").read_text(encoding="utf-8"))
    assert actual["schemaVersion"] == 2 and actual["sample"] is False
    source = root / "data/processed/mapa" / actual["version"]
    municipalities = {row["id"]: row for row in actual["municipalities"]}
    with (source / "municipios.csv").open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            item = municipalities[row["cvegeo"]]
            assert item["name"] == row["nombre_mpio"]
            assert item["nominal"] == int(row["ln_2024"])
            for year in (2009, 2012, 2015, 2018, 2021, 2024):
                value = row[f"part_{year}"]
                assert item["history"][str(year)] == (float(value) if value else None)
    with (source / "escenarios_2027.csv").open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            result = actual["estimates"][row["escenario_id"]][row["cvegeo"]]
            assert result["risk"] == row["riesgo"]
            for original, field in (
                ("part_pred", "participation"),
                ("part_pred_inf", "lower"),
                ("part_pred_sup", "upper"),
                ("votos_adicionales", "additionalVotes"),
                ("efecto_interv", "interventionEffect"),
            ):
                value = row[original]
                assert result[field] == (float(value) if value else None)
    assert municipalities["24059"]["hasData"] is False
    assert municipalities["24059"]["hasGeometry"] is True
    manifest = json.loads((published / "manifest.json").read_text(encoding="utf-8"))
    for filename, details in manifest["files"].items():
        assert hashlib.sha256((published / filename).read_bytes()).hexdigest() == details["sha256"]
    for name in ["municipios.csv", "escenarios_2027.csv", "metadatos.json"]:
        assert (source / name).read_bytes() == (published / actual["version"] / name).read_bytes()
