"""Continuidad independiente del nombre, con cobertura y excepciones acotadas."""

import polars as pl
import pytest

from scripts.section_continuity import continuity_report, map_sections, require_continuity


def mapped_rows(rows):
    return pl.DataFrame(
        rows,
        schema={
            "AELEC": pl.Int16,
            "EDOCVE": pl.Int8,
            "MPIOCVE": pl.Int16,
            "SECCION": pl.Int32,
            "LN": pl.Int64,
            "cvegeo": pl.String,
        },
        orient="row",
    )


def transfer_frame(foreign_ln, own_ln):
    return mapped_rows(
        [
            (2021, 1, 1, 10, foreign_ln, "01001"),
            (2021, 1, 1, 11, own_ln, "01001"),
            (2024, 1, 2, 10, 100, "01002"),
            (2024, 1, 1, 11, 100, "01001"),
        ]
    )


def transfer_exception(**changes):
    return {
        "anio": "2021",
        "anio_referencia": "2024",
        "cvegeo": "01001",
        "cvegeo_receptor": "01002",
        "motivo": "Transferencia documentada de la sección 10",
        "fuente": "Fuente del cambio territorial",
        **changes,
    }


@pytest.mark.parametrize(
    "foreign_ln,own_ln,blocked", [(90, 10, False), (91, 9, True), (100, 0, True)]
)
def test_strict_ninety_percent_threshold(foreign_ln, own_ln, blocked):
    report = continuity_report(transfer_frame(foreign_ln, own_ln))
    row = report.filter(pl.col("anio") == 2021).row(0, named=True)
    assert row["bloqueante"] is blocked
    if blocked:
        with pytest.raises(ValueError, match="más del 90 %"):
            require_continuity(report)
    else:
        require_continuity(report)


def test_whole_municipality_swap_is_detected_despite_unique_keys():
    frame = mapped_rows(
        [
            (2021, 16, 65, 1426, 19051, "16065"),
            (2021, 16, 66, 1440, 27223, "16064"),
            (2024, 16, 65, 1426, 20136, "16064"),
            (2024, 16, 66, 1440, 28648, "16065"),
        ]
    )
    report = continuity_report(frame)
    assert report.filter(pl.col("bloqueante"))["cvegeo"].to_list() == ["16064", "16065"]
    corrected = frame.with_columns(
        pl.when(pl.col("AELEC") == 2021)
        .then(pl.col("cvegeo").replace({"16064": "16065", "16065": "16064"}))
        .otherwise(pl.col("cvegeo"))
        .alias("cvegeo")
    )
    require_continuity(continuity_report(corrected))


def test_section_identity_includes_state():
    frame = mapped_rows([(2021, 1, 1, 10, 10, "01001"), (2024, 2, 1, 10, 10, "02001")])
    row = continuity_report(frame).filter(pl.col("anio") == 2021).row(0, named=True)
    assert row["ln_comparable"] == 0
    assert row["proporcion_en_otro"] is None
    assert row["estado_comparacion"] == "sin_cobertura"


def test_unmatched_sections_are_reported_and_do_not_dilute_mismatch():
    frame = mapped_rows(
        [
            (2021, 1, 1, 10, 10, "01001"),
            (2021, 1, 1, 99, 990, "01001"),
            (2024, 1, 2, 10, 50, "01002"),
        ]
    )
    report = continuity_report(frame)
    row = report.filter(pl.col("anio") == 2021).row(0, named=True)
    assert row["ln_total"] == 1000
    assert row["ln_comparable"] == 10
    assert row["proporcion_cobertura_ln"] == 0.01
    assert row["proporcion_en_otro"] == 1.0
    assert row["bloqueante"]


def test_zero_nominal_list_is_not_claimed_as_verified_continuity():
    report = continuity_report(mapped_rows([(2024, 1, 1, 10, 0, "01001")]))
    row = report.row(0, named=True)
    assert row["proporcion_en_otro"] is None
    assert row["proporcion_cobertura_ln"] is None
    assert row["estado_comparacion"] == "sin_lista_nominal"


def test_partial_territorial_transfer_stays_visible_without_blocking():
    report = continuity_report(transfer_frame(505, 495))
    row = report.filter(pl.col("anio") == 2021).row(0, named=True)
    assert row["requiere_revision"]
    assert not row["bloqueante"]
    require_continuity(report)


def test_documented_exception_keeps_raw_transfer_visible():
    report = continuity_report(transfer_frame(100, 0), [transfer_exception()])
    row = report.filter(pl.col("anio") == 2021).row(0, named=True)
    assert row["proporcion_en_otro"] == 1.0
    assert row["proporcion_en_otro_sin_excepcion"] == 0.0
    assert row["requiere_revision"]
    require_continuity(report)


@pytest.mark.parametrize(
    "changes",
    [
        {"fuente": ""},
        {"anio_referencia": "2021"},
        {"anio": "2018"},
        {"cvegeo_receptor": "01003"},
        {"cvegeo_receptor": "02002"},
        {"cvegeo": "1001"},
    ],
)
def test_exceptions_cannot_be_blanket_waivers(changes):
    with pytest.raises(ValueError):
        continuity_report(transfer_frame(100, 0), [transfer_exception(**changes)])


def test_exception_does_not_hide_transfer_to_another_recipient():
    frame = mapped_rows(
        [
            (2021, 1, 1, 10, 5, "01001"),
            (2021, 1, 1, 11, 95, "01001"),
            (2024, 1, 2, 10, 100, "01002"),
            (2024, 1, 3, 11, 100, "01003"),
        ]
    )
    with pytest.raises(ValueError):
        require_continuity(continuity_report(frame, [transfer_exception()]))


def test_missing_reference_or_duplicate_section_membership_is_rejected():
    frame = transfer_frame(100, 0)
    with pytest.raises(ValueError, match="referencia"):
        continuity_report(frame.filter(pl.col("AELEC") == 2021))
    with pytest.raises(ValueError, match="varias pertenencias"):
        continuity_report(pl.concat([frame, frame.head(1)]))


def test_missing_or_duplicate_source_equivalence_is_rejected():
    sections = transfer_frame(100, 0).drop("cvegeo")
    crosswalk = pl.DataFrame(
        {"anio": [2021], "cve_ent_ine": [1], "cve_mun_ine": [1], "cvegeo": ["01001"]}
    )
    with pytest.raises(ValueError, match="sin equivalencia"):
        map_sections(sections, crosswalk)
    with pytest.raises(ValueError, match="duplicadas"):
        map_sections(sections, pl.concat([crosswalk, crosswalk]))
