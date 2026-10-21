"""Comparaciones por identidad, ausencias y procedencia; sin entrenar modelos."""

import csv
import json
import sys
from types import SimpleNamespace

import pytest

from scripts.compare_publications import (
    ROOT,
    compare_publications,
    load_publication,
    metadata_changes,
    read_table,
    unit_for,
    verify_git_source,
)


def publication(tmp_path, name, *, rows=None, metadata=None, year="2027"):
    folder = tmp_path / name
    folder.mkdir()
    tables = {
        "municipios.csv": (
            ["cvegeo", "nombre_mpio", "part_2024", "n_jov_2024"],
            rows or [["01001", "A, municipio", "0.5", "0"], ["01002", "B", "0.4", ""]],
        ),
        "escenarios_2027.csv": (
            ["cvegeo", "escenario_id", "anio", "nivel_nacional", "intervencion", "part_pred"],
            [["01001", "nac-medio_int-ninguna", year, "medio", "ninguna", "0.5"]],
        ),
    }
    for filename, (fields, data) in tables.items():
        with (folder / filename).open("w", encoding="utf-8", newline="") as stream:
            writer = csv.writer(stream, lineterminator="\n")
            writer.writerow(fields)
            writer.writerows(data)
    meta = {
        "version_resultados": "resultados-prueba",
        "generado": "2026-10-21T00:00:00",
        "modelo": "prueba",
        "escenarios": ["nac-medio_int-ninguna"],
        "unidades": {"part_*": "proporción", "n_jov_2024": "personas"},
        **(metadata or {}),
    }
    (folder / "metadatos.json").write_text(json.dumps(meta), encoding="utf-8")
    return load_publication(folder, "a" * 40, tmp_path)


def test_reordered_rows_and_identical_values_do_not_change_content(tmp_path):
    before = publication(tmp_path, "before")
    after = publication(
        tmp_path, "after", rows=[["01002", "B", "0.4", ""], ["01001", "A, municipio", "0.5", "0"]]
    )
    report = compare_publications(before, after)
    assert report["status"] == "unchanged"
    assert report["summary"]["cells"] == 0
    assert report["tables"][0]["coverage"][-1]["column"] == "part_2024"


def test_zero_missing_and_format_are_different(tmp_path):
    before = publication(tmp_path, "before")
    after = publication(
        tmp_path, "after", rows=[["01001", "A, municipio", "0.50", ""], ["01002", "B", "0.6", "0"]]
    )
    report = compare_publications(before, after)
    assert report["summary"]["kinds"] == {"available": 1, "data": 1, "format": 1, "missing": 1}
    changes = report["tables"][0]["changes"]
    assert next(item for item in changes if item["kind"] == "missing")["before"] == "0"
    assert next(item for item in changes if item["kind"] == "available")["after"] == "0"
    assert next(item for item in changes if item["kind"] == "format")["delta"] is None
    assert next(item for item in changes if item["kind"] == "data")["delta"] == "0.2"


@pytest.mark.parametrize(
    "change",
    [{"unidades": {"part_*": "porcentaje"}}, {"modelo": "otro"}, {"nueva_regla": "ausencia"}],
)
def test_definitions_block_numeric_deltas_even_with_same_version(tmp_path, change):
    before = publication(tmp_path, "before")
    after = publication(
        tmp_path,
        "after",
        rows=[["01001", "A, municipio", "0.7", "0"], ["01002", "B", "0.4", ""]],
        metadata=change,
    )
    report = compare_publications(before, after)
    assert report["definitionsChanged"]
    assert report["tables"][0]["changes"][0]["delta"] is None


def test_scenario_conditions_block_deltas_and_missing_metadata_is_not_null(tmp_path):
    before = publication(tmp_path, "before")
    after = publication(tmp_path, "after", year="2028")
    after["tables"]["escenarios_2027.csv"]["rows"][("01001", "nac-medio_int-ninguna")][
        "part_pred"
    ] = "0.7"
    report = compare_publications(before, after)
    assert report["conditionsChanged"] == ["nac-medio_int-ninguna"]
    assert all(item["delta"] is None for item in report["tables"][1]["changes"])
    assert metadata_changes({}, {"regla": None}) == [
        {"path": "/regla", "kind": "added", "before": None, "after": None}
    ]
    assert (
        unit_for(
            {"unidades": {"part_*": "proporción", "part_pred_inf, part_pred_sup": "intervalo"}},
            "part_pred_inf",
        )
        == "intervalo"
    )


@pytest.mark.parametrize(
    "content",
    [
        "cvegeo,cvegeo\n01001,01001\n",
        "cvegeo,ln_2024\n01001\n",
        "cvegeo\n01001,0\n",
        "cvegeo\n01001\n01001\n",
        "cvegeo\n1001\n",
        "cvegeo\n０１００１\n",
        "cvegeo,ln_2024\n01001,NaN\n",
        "cvegeo,ln_2024\n01001,1_000\n",
        "cvegeo,ln_2024\n01001, 1000\n",
        "cvegeo,historia_completa\n01001,False\n",
        "nombre_mpio\nA\n",
    ],
)
def test_bad_tables_fail_instead_of_creating_false_changes(tmp_path, content):
    path = tmp_path / "bad.csv"
    path.write_text(content, encoding="utf-8")
    with pytest.raises(ValueError):
        read_table(path, ("cvegeo",))


def test_coverage_and_unknown_columns_are_explicit(tmp_path):
    before = publication(tmp_path, "before")
    after = publication(
        tmp_path, "after", rows=[["01001", "A, municipio", "0.5", "0"], ["01003", "C", "0.3", "1"]]
    )
    after["tables"]["municipios.csv"]["fields"].append("region")
    for row in after["tables"]["municipios.csv"]["rows"].values():
        row["region"] = "Norte"
    report = compare_publications(before, after)
    assert report["tables"][0]["addedRows"] == [["01003"]]
    assert report["tables"][0]["removedRows"] == [["01002"]]
    assert report["tables"][0]["addedColumns"] == ["region"]


def test_missing_source_and_false_git_provenance_fail(tmp_path, monkeypatch):
    with pytest.raises(FileNotFoundError):
        load_publication(tmp_path / "absent", "a" * 40, tmp_path)
    source = publication(tmp_path, "source")
    monkeypatch.setattr("scripts.compare_publications.shutil.which", lambda _: "git")
    monkeypatch.setattr(
        "scripts.compare_publications.subprocess.run",
        lambda *args, **kwargs: SimpleNamespace(stdout=b"different"),
    )
    with pytest.raises(ValueError, match="Git"):
        verify_git_source(source, tmp_path)


def test_real_comparison_is_reproducible_and_scenarios_unchanged():
    before = load_publication(
        ROOT / "data/processed/mapa/resultados-1.2", "ac8dc3cdbb06b5a0d5ddd63b67bee9a43def9821"
    )
    after = load_publication(
        ROOT / "data/processed/mapa/resultados-1.3", "f25d9c2709d2a93179c7ee2d6d2df985d418d6ca"
    )
    report = compare_publications(before, after)
    assert report["summary"] == {
        "cells": 105,
        "municipalities": 15,
        "kinds": {"missing": 105},
        "metadata": 4,
    }
    assert report["tables"][1]["changes"] == []
    assert (
        report["before"]["files"]["escenarios_2027.csv"]
        == report["after"]["files"]["escenarios_2027.csv"]
    )
    assert all(
        item["before"] in {"0", "0.0"} and item["after"] == "" and item["delta"] is None
        for item in report["tables"][0]["changes"]
    )
    output = ROOT / "frontend/public/data/publicaciones/resultados-1.2__resultados-1.3.json"
    assert json.loads(output.read_text(encoding="utf-8")) == report


def test_metadata_types_are_not_confused_with_equal_python_values():
    changes = metadata_changes({"regla": 1, "lista": [1]}, {"regla": True, "lista": [True]})
    assert {change["path"] for change in changes} == {"/regla", "/lista"}


def test_snapshot_values_and_hashes_come_from_same_bytes(tmp_path, monkeypatch):
    source = publication(tmp_path, "snapshot")
    from scripts import compare_publications as module

    original_read = module.read_table

    def concurrent_edit(path, keys, raw=None):
        if path.name == "municipios.csv":
            path.write_text(
                path.read_text(encoding="utf-8").replace("0.5,0", "0.5,9"), encoding="utf-8"
            )
        return original_read(path, keys, raw=raw) if raw is not None else original_read(path, keys)

    monkeypatch.setattr(module, "read_table", concurrent_edit)
    loaded = load_publication(tmp_path / "snapshot", "a" * 40, tmp_path)
    assert loaded["tables"]["municipios.csv"]["rows"][("01001",)]["n_jov_2024"] == "0"
    assert loaded["files"] == source["files"]
    assert "0.5,9" in (tmp_path / "snapshot/municipios.csv").read_text(encoding="utf-8")


def test_overflowing_json_numbers_fail_at_load(tmp_path):
    publication(tmp_path, "overflow")
    metadata = tmp_path / "overflow/metadatos.json"
    metadata.write_text(
        metadata.read_text(encoding="utf-8")[:-1] + ',"regla":1e999}', encoding="utf-8"
    )
    with pytest.raises(ValueError, match="finito"):
        load_publication(tmp_path / "overflow", "a" * 40, tmp_path)


@pytest.mark.parametrize(
    "relative",
    [
        "frontend/public/data/municipios.geojson",
        "frontend/public/data/resultados-1.3/municipios.gpkg",
        "frontend/public/data/resultados-1.3/controles.json",
        "frontend/public/data/publicaciones/out.csv",
        "src/out.json",
    ],
)
def test_cli_rejects_destinations_that_could_replace_other_artifacts(
    tmp_path, monkeypatch, relative
):
    from scripts import compare_publications as module

    destination = tmp_path / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(b"original intacto")
    monkeypatch.setattr(module, "ROOT", tmp_path)
    monkeypatch.setattr(module, "load_publication", lambda *args: {})
    monkeypatch.setattr(module, "verify_git_source", lambda *args: None)
    monkeypatch.setattr(module, "compare_publications", lambda *args: {"summary": {}})
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "compare",
            "--before",
            "before",
            "--after",
            "after",
            "--before-commit",
            "a" * 40,
            "--after-commit",
            "b" * 40,
            "--output",
            str(destination),
        ],
    )
    with pytest.raises(ValueError, match="salida|comparaci"):
        module.main()
    assert destination.read_bytes() == b"original intacto"


def test_incomplete_coverage_is_visible_even_when_both_cuts_are_identical(tmp_path):
    before = publication(tmp_path, "before")
    after = publication(tmp_path, "after")
    report = compare_publications(before, after)
    assert report["status"] == "unchanged"
    assert report["coverageIncomplete"]
    assert report["scenarioCoverage"]["before"] == [
        {"scenario": "nac-medio_int-ninguna", "expected": 2, "present": 1, "missing": ["01002"]}
    ]


def test_unknown_types_warn_instead_of_claiming_numeric_change(tmp_path):
    before = publication(tmp_path, "before")
    after = publication(tmp_path, "after")
    for cut, value in [(before, "0"), (after, "0.0")]:
        cut["tables"]["municipios.csv"]["fields"].append("new_field")
        for row in cut["tables"]["municipios.csv"]["rows"].values():
            row["new_field"] = value
    report = compare_publications(before, after)
    assert report["tables"][0]["unclassifiedColumns"] == ["new_field"]
    assert all(
        item["kind"] == "unclassified" and item["delta"] is None
        for item in report["tables"][0]["changes"]
    )


def test_atomic_output_preserves_previous_report_on_replace_failure(tmp_path, monkeypatch):
    from scripts import compare_publications as module

    monkeypatch.setattr(module, "ROOT", tmp_path)
    output = module.validate_output(tmp_path / "frontend/public/data/publicaciones/report.json")
    module.write_report(output, "anterior")

    def fail_replace(*args):
        raise PermissionError("ocupado")

    monkeypatch.setattr(module.os, "replace", fail_replace)
    with pytest.raises(PermissionError):
        module.write_report(output, "nuevo")
    assert output.read_text(encoding="utf-8") == "anterior"
    assert list(output.parent.glob("*.tmp")) == []
