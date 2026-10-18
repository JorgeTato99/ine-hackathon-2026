"""Prepara Parquet tipado y catálogos municipales con Polars."""

import csv
import json

import polars as pl

from ine_hackathon_2026.ccpc import quality, scan_typed
from scripts.common import ROOT, now_utc, write_json


def municipal_table(frame: pl.LazyFrame) -> pl.DataFrame:
    grouped = (
        frame.group_by("AELEC", "EDOCVE", "MPIOCVE")
        .agg(
            pl.col("EDONOM").str.strip_chars().min().alias("entidad_ine"),
            pl.col("MPIONOM").str.strip_chars().min().alias("municipio_ine"),
            pl.col("MPIONOM")
            .str.strip_chars()
            .unique()
            .sort()
            .str.join(" | ")
            .alias("nombres_ine"),
            pl.col("MPIONOM").str.strip_chars().n_unique().alias("variantes_nombre"),
            pl.len().alias("filas_origen"),
            *[pl.col(c).sum().alias(c.lower()) for c in ("LN", "SV", "NV", "NS")],
        )
        .select(
            pl.col("AELEC").alias("anio"),
            pl.col("EDOCVE").cast(pl.String).str.pad_start(2, "0").alias("cve_ent_ine"),
            pl.col("MPIOCVE").cast(pl.String).str.pad_start(3, "0").alias("cve_mun_ine"),
            "entidad_ine",
            "municipio_ine",
            "nombres_ine",
            "variantes_nombre",
            "filas_origen",
            "ln",
            "sv",
            "nv",
            "ns",
        )
        .with_columns(
            pl.concat_str("cve_ent_ine", "cve_mun_ine").alias("clave_ine"),
            (pl.col("sv") + pl.col("nv") > 0).alias("elegible"),
        )
        .sort("cve_ent_ine", "cve_mun_ine")
    )
    return grouped.collect(engine="streaming")


def main() -> None:
    sources = json.loads((ROOT / "config/sources.json").read_text(encoding="utf-8"))
    output = ROOT / "data/processed"
    parquet_dir = output / "ccpc"
    parquet_dir.mkdir(parents=True, exist_ok=True)
    summaries = []
    municipal_rows = []
    for year in sources["elections"]:
        paths = sorted((ROOT / "data/raw" / year / "extracted").rglob("*.csv"))
        if len(paths) != 32:
            raise ValueError(f"{year}: se esperan 32 CSV estatales")
        frame = scan_typed(paths, int(year))
        summary = quality(frame, int(year))
        if any(value for name, value in summary.items() if name != "filas"):
            raise ValueError(f"Datos inválidos: {year}: {summary}")
        target = parquet_dir / f"ccpc-{year}.parquet"
        temporary = target.with_suffix(".parquet.tmp")
        frame.sink_parquet(temporary, compression="zstd")
        temporary.replace(target)
        rows = municipal_table(pl.scan_parquet(target)).to_dicts()
        if len({r["cve_ent_ine"] for r in rows}) != 32:
            raise ValueError(f"{year}: faltan entidades")
        summary.update(
            anio=int(year),
            csv=len(paths),
            municipios=len(rows),
            municipios_sin_sv_nv=sum(not r["elegible"] for r in rows),
        )
        summaries.append(summary)
        municipal_rows.extend(rows)
        print(f"{year}: {summary}", flush=True)
    for filename, rows in [
        ("municipios_ine_por_anio.csv", municipal_rows),
        ("municipios_ine_elegibles.csv", [r for r in municipal_rows if r["elegible"]]),
        ("municipios_ine_excluidos.csv", [r for r in municipal_rows if not r["elegible"]]),
    ]:
        with (output / filename).open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=list(municipal_rows[0]))
            writer.writeheader()
            writer.writerows(rows)
    write_json(
        output / "calidad_datos.json",
        {"generated_at_utc": now_utc(), "engine": "polars", "years": summaries},
    )


if __name__ == "__main__":
    main()
