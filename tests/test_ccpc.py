"""Contratos de datos, distritos ausentes y catálogos de sexo por elección."""

import csv

import pandera.errors
import polars as pl
import pytest

from ine_hackathon_2026.ccpc import quality, scan_typed, validate_municipal


def sample_csv(tmp_path, **changes):
    row = {
        "AELEC": 2024,
        "FELECCION": "2024-06-02",
        "EDOCVE": 1,
        "EDONOM": "Entidad",
        "MPIOCVE": 1,
        "MPIONOM": "Nombre, con coma",
        "SECCION": 1,
        "TIPOSEC": "U",
        "DEF": " ",
        "DEL": "",
        "SEXO": 2,
        "EDAD": 140,
        "LN": 10,
        "SV": 4,
        "NV": 5,
        "NS": 1,
    }
    row.update(changes)
    path = tmp_path / "sample.csv"
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(row))
        writer.writeheader()
        writer.writerow(row)
    return path


def test_parquet_preserves_integer_demographics_and_nullable_districts(tmp_path):
    path = sample_csv(tmp_path)
    frame = scan_typed([path], 2024)
    assert quality(frame, 2024) == {
        "filas": 1,
        "numericos_invalidos": 0,
        "anio_incorrecto": 0,
        "claves_invalidas": 0,
        "sin_nombre": 0,
        "ln_distinto_sv_nv_ns": 0,
        "edad_fuera_rango": 0,
        "sexo_fuera_catalogo": 0,
        "distrito_fuera_rango": 0,
    }
    target = tmp_path / "sample.parquet"
    frame.sink_parquet(target)
    back = pl.read_parquet(target)
    assert back.schema["EDAD"] == pl.Int16
    assert back.schema["SEXO"] == pl.Int8
    assert back.schema["DEF"] == back.schema["DEL"] == pl.Int16
    assert back["DEF"].to_list() == back["DEL"].to_list() == [None]
    assert back["SEXO"].to_list() == [2]
    assert back["MPIONOM"].to_list() == ["Nombre, con coma"]


@pytest.mark.parametrize(
    "changes,field",
    [
        ({"EDAD": 17}, "edad_fuera_rango"),
        ({"EDAD": 141}, "edad_fuera_rango"),
        ({"EDAD": "incorrecto"}, "numericos_invalidos"),
        ({"SEXO": 3}, "sexo_fuera_catalogo"),
        ({"SV": -1}, "numericos_invalidos"),
        ({"LN": 11}, "ln_distinto_sv_nv_ns"),
        ({"AELEC": 2021}, "anio_incorrecto"),
        ({"EDOCVE": 33}, "claves_invalidas"),
        ({"MPIONOM": " "}, "sin_nombre"),
        ({"DEF": 0}, "distrito_fuera_rango"),
    ],
)
def test_invalid_raw_values_are_detected(tmp_path, changes, field):
    assert quality(scan_typed([sample_csv(tmp_path, **changes)], 2024), 2024)[field] == 1


def test_sex_catalog_differs_before_2024(tmp_path):
    path = sample_csv(tmp_path, AELEC=2021)
    assert quality(scan_typed([path], 2021), 2021)["sexo_fuera_catalogo"] == 1


def test_invalid_district_is_not_silently_converted_to_null(tmp_path):
    with pytest.raises(pl.exceptions.InvalidOperationError):
        scan_typed([sample_csv(tmp_path, DEF="incorrecto")], 2024).collect()


def test_missing_columns_and_unsupported_inputs_fail(tmp_path):
    with pytest.raises(ValueError):
        scan_typed([], 2024)
    with pytest.raises(ValueError):
        scan_typed([tmp_path / "anything"], 2027)
    path = tmp_path / "incomplete.csv"
    path.write_text("LN\n1\n", encoding="utf-8")
    with pytest.raises(ValueError, match="columnas"):
        scan_typed([path], 2024)
    with pytest.raises(ValueError):
        quality(pl.DataFrame().lazy(), 2027)


def municipal():
    return pl.DataFrame(
        {"anio": [2024], "cvegeo": ["01001"], "ln": [10], "sv": [4], "nv": [5], "ns": [1]}
    )


def test_materialized_municipal_contract_accepts_valid_data():
    validate_municipal(municipal())


@pytest.mark.parametrize(
    "change", [pl.lit(-1, dtype=pl.Int64).alias("nv"), pl.lit("001").alias("cvegeo")]
)
def test_pandera_checks_values_on_materialized_data(change):
    with pytest.raises(pandera.errors.SchemaErrors):
        validate_municipal(municipal().with_columns(change))


def test_duplicate_keys_and_invalid_denominator_fail():
    with pytest.raises(pandera.errors.SchemaErrors):
        validate_municipal(pl.concat([municipal(), municipal()]))
    with pytest.raises(ValueError, match="LN"):
        validate_municipal(municipal().with_columns(pl.lit(11, dtype=pl.Int64).alias("ln")))
    with pytest.raises(ValueError, match="denominador"):
        validate_municipal(
            municipal().with_columns(
                pl.lit(0, dtype=pl.Int64).alias("sv"),
                pl.lit(0, dtype=pl.Int64).alias("nv"),
                pl.lit(10, dtype=pl.Int64).alias("ns"),
            )
        )
