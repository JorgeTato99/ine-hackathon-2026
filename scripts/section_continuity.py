"""Diagnóstico de identidad por secciones; no armoniza límites históricos."""

from collections.abc import Sequence

import polars as pl

SOURCE_KEYS = ["AELEC", "EDOCVE", "MPIOCVE"]
SECTION_KEYS = ["AELEC", "EDOCVE", "SECCION"]


def aggregate_sections(frame: pl.LazyFrame) -> pl.DataFrame:
    """Reduce los registros de sexo/edad antes de comparar pertenencia municipal."""
    return (
        frame.select(*SOURCE_KEYS, "SECCION", "LN")
        .group_by(*SOURCE_KEYS, "SECCION")
        .agg(pl.col("LN").sum())
        .collect(engine="streaming")
    )


def map_sections(sections: pl.DataFrame, crosswalk: pl.DataFrame) -> pl.DataFrame:
    """Asocia cada sección con la equivalencia de su elección, sin usar nombres."""
    lookup = crosswalk.select(
        pl.col("anio").cast(pl.Int16).alias("AELEC"),
        pl.col("cve_ent_ine").cast(pl.Int8).alias("EDOCVE"),
        pl.col("cve_mun_ine").cast(pl.Int16).alias("MPIOCVE"),
        pl.col("cvegeo").cast(pl.String),
    )
    if lookup.unique(subset=SOURCE_KEYS).height != lookup.height:
        raise ValueError("Equivalencias duplicadas al asociar secciones")
    mapped = sections.join(lookup, on=SOURCE_KEYS, how="left", validate="m:1")
    if mapped.filter(
        pl.col("cvegeo").is_null() | ~pl.col("cvegeo").str.contains(r"^\d{5}$")
    ).height:
        raise ValueError("Hay secciones sin equivalencia municipal")
    return mapped


def continuity_report(
    mapped: pl.DataFrame,
    exceptions: Sequence[dict[str, str]] = (),
    *,
    reference_year: int = 2024,
) -> pl.DataFrame:
    """Mide LN ajena entre secciones comparables e informa también la cobertura.

    La referencia identifica a quién pertenece una sección en el corte elegido;
    no cambia la asignación histórica ni demuestra continuidad de su geometría.
    Las excepciones requieren año, referencia, emisor, receptor, motivo y fuente.
    """
    if mapped.is_empty() or mapped.select(pl.any_horizontal(pl.all().is_null()).any()).item():
        raise ValueError("Se requieren secciones completas para comprobar continuidad")
    if mapped.filter(pl.col("LN") < 0).height:
        raise ValueError("La lista nominal no puede ser negativa")
    if mapped.unique(subset=SECTION_KEYS).height != mapped.height:
        raise ValueError("Una sección tiene varias pertenencias o filas en la misma elección")
    reference = mapped.filter(pl.col("AELEC") == reference_year).select(
        "EDOCVE", "SECCION", pl.col("cvegeo").alias("cvegeo_referencia")
    )
    if reference.is_empty():
        raise ValueError("No hay secciones para el año de referencia")
    matched = mapped.join(reference, on=["EDOCVE", "SECCION"], how="inner", validate="m:1")
    matched = matched.with_columns(pl.lit(False).alias("excepcion_documentada"))
    seen = set()
    for row in exceptions:
        fields = ("anio", "anio_referencia", "cvegeo", "cvegeo_receptor", "motivo", "fuente")
        if any(not row.get(field, "").strip() for field in fields):
            raise ValueError("Excepción de continuidad sin alcance, motivo o fuente")
        year, baseline = int(row["anio"]), int(row["anio_referencia"])
        origin, target = row["cvegeo"], row["cvegeo_receptor"]
        key = (year, baseline, origin, target)
        if (
            key in seen
            or baseline != reference_year
            or year == reference_year
            or len(origin) != 5
            or not origin.isdigit()
            or len(target) != 5
            or not target.isdigit()
            or origin == target
            or origin[:2] != target[:2]
        ):
            raise ValueError(f"Excepción de continuidad inválida o duplicada: {key}")
        condition = (
            (pl.col("AELEC") == year)
            & (pl.col("cvegeo") == origin)
            & (pl.col("cvegeo_referencia") == target)
        )
        if matched.filter(condition).is_empty():
            raise ValueError(f"Excepción sin transferencia observable en este corte: {key}")
        seen.add(key)
        matched = matched.with_columns(
            (pl.col("excepcion_documentada") | condition).alias("excepcion_documentada")
        )
    foreign = pl.col("cvegeo") != pl.col("cvegeo_referencia")
    totals = mapped.group_by("AELEC", "cvegeo").agg(
        pl.len().alias("secciones_totales"), pl.col("LN").sum().alias("ln_total")
    )
    comparable = matched.group_by("AELEC", "cvegeo").agg(
        pl.len().alias("secciones_comparables"),
        pl.col("LN").sum().alias("ln_comparable"),
        pl.col("LN").filter(foreign).sum().alias("ln_en_otro"),
        pl.col("LN")
        .filter(foreign & ~pl.col("excepcion_documentada"))
        .sum()
        .alias("ln_en_otro_sin_excepcion"),
    )
    report = totals.join(comparable, on=["AELEC", "cvegeo"], how="left").with_columns(
        pl.col(
            "secciones_comparables", "ln_comparable", "ln_en_otro", "ln_en_otro_sin_excepcion"
        ).fill_null(0)
    )
    return (
        report.with_columns(
            pl.when(pl.col("ln_total") > 0)
            .then(pl.col("ln_comparable") / pl.col("ln_total"))
            .otherwise(None)
            .alias("proporcion_cobertura_ln"),
            *[
                pl.when(pl.col("ln_comparable") > 0)
                .then(pl.col(column) / pl.col("ln_comparable"))
                .otherwise(None)
                .alias(name)
                for column, name in [
                    ("ln_en_otro", "proporcion_en_otro"),
                    ("ln_en_otro_sin_excepcion", "proporcion_en_otro_sin_excepcion"),
                ]
            ],
        )
        .with_columns(
            pl.lit(reference_year).alias("anio_referencia"),
            (pl.col("proporcion_en_otro") > 0.5).fill_null(False).alias("requiere_revision"),
            (pl.col("proporcion_en_otro_sin_excepcion") > 0.9).fill_null(False).alias("bloqueante"),
            pl.when(pl.col("ln_total") == 0)
            .then(pl.lit("sin_lista_nominal"))
            .when(pl.col("ln_comparable") == 0)
            .then(pl.lit("sin_cobertura"))
            .otherwise(pl.lit("comparable"))
            .alias("estado_comparacion"),
        )
        .rename({"AELEC": "anio"})
        .sort("anio", "cvegeo")
    )


def require_continuity(report: pl.DataFrame) -> None:
    """Bloquea una transferencia no justificada superior al 90 % de LN comparable."""
    blocked = report.filter(pl.col("bloqueante"))
    if blocked.height:
        keys = [(r["anio"], r["cvegeo"]) for r in blocked.iter_rows(named=True)]
        raise ValueError(f"Continuidad municipal: más del 90 % de LN en otro CVEGEO: {keys}")
