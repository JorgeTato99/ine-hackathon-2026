"""Tipos y contratos CCPC; conserva originales y registros agregados."""

from collections.abc import Sequence
from pathlib import Path

import pandera.polars as pa
import polars as pl

YEARS = (2009, 2012, 2015, 2018, 2021, 2024)
INTEGER_TYPES: dict[str, pl.DataType] = {
    "AELEC": pl.Int16(),
    "EDOCVE": pl.Int8(),
    "MPIOCVE": pl.Int16(),
    "SECCION": pl.Int32(),
    "DEF": pl.Int16(),
    "DEL": pl.Int16(),
    "SEXO": pl.Int8(),
    "EDAD": pl.Int16(),
    "LN": pl.Int64(),
    "SV": pl.Int64(),
    "NV": pl.Int64(),
    "NS": pl.Int64(),
}


def scan_typed(paths: Sequence[Path], year: int) -> pl.LazyFrame:
    """Lee CSV con comillas y convierte enteros sin ocultar errores de valores."""
    if year not in YEARS or not paths:
        raise ValueError("Se requieren CSV de una elección CCPC admitida.")
    raw = pl.scan_csv([str(path) for path in paths], infer_schema=False, quote_char='"')
    required = {*INTEGER_TYPES, "FELECCION", "EDONOM", "MPIONOM", "TIPOSEC"}
    if not required.issubset(raw.collect_schema().names()):
        raise ValueError("Faltan columnas del diccionario CCPC.")
    expressions = []
    for name, dtype in INTEGER_TYPES.items():
        text = pl.col(name).str.strip_chars()
        if name in {"DEF", "DEL"}:
            # Los vacíos documentados de distritos representan datos ausentes.
            value = text.replace("", None).cast(dtype, strict=True)
        else:
            value = text.cast(dtype, strict=False)
        expressions.append(value.alias(name))
    return raw.with_columns(expressions)


def quality(frame: pl.LazyFrame, year: int) -> dict[str, int]:
    """Agrega controles sin materializar el conjunto completo en pandas o Pandera."""
    if year not in YEARS:
        raise ValueError("Elección no admitida.")
    required = [name for name in INTEGER_TYPES if name not in {"DEF", "DEL"}]
    bad_numeric = pl.any_horizontal([pl.col(c).is_null() | pl.col(c).lt(0) for c in required])
    allowed_sex = [0, 1, 2] if year == 2024 else [0, 1]
    checks = {
        "numericos_invalidos": bad_numeric,
        "anio_incorrecto": pl.col("AELEC").ne(year),
        "claves_invalidas": ~pl.col("EDOCVE").is_between(1, 32)
        | ~pl.col("MPIOCVE").is_between(1, 999),
        "sin_nombre": pl.col("MPIONOM").fill_null("").str.strip_chars().eq(""),
        "ln_distinto_sv_nv_ns": pl.col("LN").ne(pl.col("SV") + pl.col("NV") + pl.col("NS")),
        # Rango técnico observado en los seis archivos, no validez biológica.
        "edad_fuera_rango": ~pl.col("EDAD").is_between(18, 140),
        "sexo_fuera_catalogo": ~pl.col("SEXO").is_in(allowed_sex),
        "distrito_fuera_rango": pl.any_horizontal(
            [pl.col(c).is_not_null() & ~pl.col(c).is_between(1, 999) for c in ("DEF", "DEL")]
        ),
    }
    values = (
        frame.select(
            pl.len().alias("filas"),
            *[expr.fill_null(True).sum().alias(name) for name, expr in checks.items()],
        )
        .collect(engine="streaming")
        .row(0, named=True)
    )
    return {name: int(value) for name, value in values.items()}


def validate_municipal(frame: pl.DataFrame) -> None:
    """Valida siempre la tabla materializada, con valores y claves únicas."""
    schema = pa.DataFrameSchema(
        {
            "anio": pa.Column(pl.Int64, pa.Check.isin(YEARS)),
            "cvegeo": pa.Column(pl.String, pa.Check.str_matches(r"^\d{5}$")),
            **{name: pa.Column(pl.Int64, pa.Check.ge(0)) for name in ("ln", "sv", "nv", "ns")},
        },
        unique=["anio", "cvegeo"],
    )
    schema.validate(frame, lazy=True)
    if frame.filter(pl.col("ln") != pl.col("sv") + pl.col("nv") + pl.col("ns")).height:
        raise ValueError("LN no coincide con SV + NV + NS.")
    if frame.filter(pl.col("sv") + pl.col("nv") <= 0).height:
        raise ValueError("La tabla utilizable contiene municipios sin denominador.")
