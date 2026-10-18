"""Comprueba integridad, filtros y cobertura de los artefactos preparados."""

import csv
import json

import polars as pl

from ine_hackathon_2026.ccpc import validate_municipal
from scripts.common import ROOT, crc32_file, now_utc, sha256, write_json


def load_csv(path):
    with path.open(encoding="utf-8", newline="") as stream:
        return list(csv.DictReader(stream))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def main() -> None:
    sources = json.loads((ROOT / "config/sources.json").read_text(encoding="utf-8"))
    output = ROOT / "data/processed"
    checked_files = 0
    for year in sources["elections"]:
        directory = ROOT / "data/raw" / year
        manifest = json.loads((directory / "descarga.json").read_text(encoding="utf-8"))
        require(
            sha256(directory / manifest["zip_file"]) == manifest["zip_sha256"],
            f"SHA-256 incorrecto: {year}",
        )
        for file in manifest["files"]:
            path = directory / "extracted" / file["path"]
            require(path.stat().st_size == file["bytes"], f"Tamaño incorrecto: {path}")
            require(crc32_file(path) == file["crc32"], f"CRC incorrecto: {path}")
            checked_files += 1
        require(manifest["csv_count"] == 32, f"Cantidad de CSV incorrecta: {year}")
    snapshot = ROOT / "data/geo" / ("inegi_snapshot_" + sources["geometry"]["snapshot_date"])
    geo_manifest = json.loads((snapshot / "descarga.json").read_text(encoding="utf-8"))
    for file in geo_manifest["files"]:
        require(
            sha256(snapshot / (file["state"] + ".geojson")) == file["sha256"],
            "Captura INEGI modificada",
        )
    municipalities = load_csv(output / "municipios_ine_por_anio.csv")
    eligible = load_csv(output / "municipios_ine_elegibles.csv")
    excluded = load_csv(output / "municipios_ine_excluidos.csv")
    require(len(municipalities) == len(eligible) + len(excluded), "Partición incompleta")
    require(all(int(r["sv"]) + int(r["nv"]) > 0 for r in eligible), "Ceros entre elegibles")
    require(all(int(r["sv"]) + int(r["nv"]) == 0 for r in excluded), "Exclusión incorrecta")
    crosswalk = load_csv(output / "equivalencias_ine_inegi.csv")
    pending = load_csv(output / "equivalencias_pendientes.csv")
    ready = load_csv(output / "municipios_para_mapa.csv")
    validate_municipal(
        pl.read_csv(output / "municipios_para_mapa.csv", schema_overrides={"cvegeo": pl.String})
    )
    geo = json.loads((output / "municipios_inegi.geojson").read_text(encoding="utf-8"))
    codes = {f["properties"]["CVEGEO"] for f in geo["features"]}
    require(
        len(codes) == len(geo["features"]) == geo_manifest["feature_count"],
        "Geometrías duplicadas o faltantes",
    )
    require(len(crosswalk) == len(municipalities), "Faltan correspondencias")
    require(not pending, "Hay correspondencias pendientes de revisión")
    require(len(ready) == len(eligible), "Faltan municipios elegibles en la tabla para mapa")
    require(all(r["cvegeo"] in codes for r in ready), "Clave sin geometría")
    require(
        len({(r["anio"], r["cvegeo"]) for r in ready}) == len(ready),
        "Destinos duplicados por elección",
    )
    require(
        all(r["cve_ent_ine"] == r["cvegeo"][:2] for r in crosswalk),
        "Correspondencia entre entidades distintas",
    )
    quality = json.loads((output / "calidad_datos.json").read_text(encoding="utf-8"))
    total_rows = sum(y["filas"] for y in quality["years"])
    require(
        sum(int(r["filas_origen"]) for r in municipalities) == total_rows,
        "Se perdieron filas durante la agregación",
    )
    report = {
        "validated_at_utc": now_utc(),
        "status": "ok",
        "election_count": 6,
        "csv_count": 192,
        "extracted_files_crc_checked": checked_files,
        "source_row_count": total_rows,
        "municipality_years": len(municipalities),
        "excluded_zero_denominator": len(excluded),
        "map_ready_rows": len(ready),
        "geometry_count": len(codes),
        "pending_correspondences": len(pending),
    }
    write_json(output / "validacion.json", report)
    print(json.dumps(report, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    main()
