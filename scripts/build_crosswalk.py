"""Compara claves y nombres INE–INEGI sin asignar coincidencias ambiguas."""

import csv
import re
import unicodedata
from collections import Counter, defaultdict

from scripts.common import ROOT, now_utc, write_json


def normalize_name(value: str) -> str:
    plain = "".join(c for c in unicodedata.normalize("NFKD", value) if not unicodedata.combining(c))
    return " ".join(re.findall(r"[A-Z0-9]+", plain.upper()))


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def write_csv(path, rows, fields):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def match_municipality(row, by_code, by_name, overrides):
    variants = {normalize_name(n) for n in row["nombres_ine"].split(" | ")}
    override = overrides.get((row["clave_ine"], row["municipio_ine"]))
    direct = by_code.get(row["clave_ine"])
    target = None
    method = "sin_coincidencia"
    reason = ""
    if override:
        target = by_code.get(override["cvegeo"])
        if not target or target["CVE_ENT"] != row["cve_ent_ine"]:
            raise ValueError(f"Override fuera de entidad o inexistente: {override}")
        if target["NOMGEO"] != override["municipio_inegi"]:
            raise ValueError(f"Nombre INEGI cambiado en override: {override}")
        method = "revision_documentada"
        reason = override["motivo"] + "; " + override["fuente"]
    elif len(variants) > 1:
        method = "nombres_ine_ambiguos"
    elif direct and normalize_name(direct["NOMGEO"]) in variants:
        target = direct
        method = "clave_y_nombre"
    else:
        candidates = {
            candidate["CVEGEO"]: candidate
            for variant in variants
            for candidate in by_name.get((row["cve_ent_ine"], variant), [])
        }
        if len(candidates) == 1:
            target = next(iter(candidates.values()))
            method = "nombre_unico_en_entidad"
        elif len(candidates) > 1:
            method = "nombre_ambiguo"
    return {
        **row,
        "cvegeo": target["CVEGEO"] if target else "",
        "municipio_inegi": target["NOMGEO"] if target else "",
        "metodo": method,
        "evidencia_adicional": reason,
        "nombre_inegi_misma_clave": direct["NOMGEO"] if direct else "",
        "clave_directa_coincide": bool(target and target["CVEGEO"] == row["clave_ine"]),
    }


def main() -> None:
    output = ROOT / "data" / "processed"
    ine = read_csv(output / "municipios_ine_por_anio.csv")
    inegi = read_csv(output / "municipios_inegi.csv")
    by_code = {r["CVEGEO"]: r for r in inegi}
    if len(by_code) != len(inegi):
        raise ValueError("El catálogo INEGI tiene claves duplicadas")
    by_name = defaultdict(list)
    for row in inegi:
        by_name[(row["CVE_ENT"], normalize_name(row["NOMGEO"]))].append(row)
    override_rows = read_csv(ROOT / "config/municipality_overrides.csv")
    overrides = {(r["clave_ine"], r["municipio_ine"]): r for r in override_rows}
    if len(overrides) != len(override_rows):
        raise ValueError("Hay overrides duplicados")
    results = [match_municipality(r, by_code, by_name, overrides) for r in ine]
    destination_counts = Counter((r["anio"], r["cvegeo"]) for r in results if r["cvegeo"])
    for row in results:
        if row["cvegeo"] and destination_counts[(row["anio"], row["cvegeo"])] > 1:
            row["evidencia_adicional"] = "Destino duplicado propuesto: " + row["cvegeo"]
            row["cvegeo"] = ""
            row["metodo"] = "destino_duplicado"
    fields = list(results[0])
    write_csv(output / "equivalencias_ine_inegi.csv", results, fields)
    pending = [r for r in results if not r["cvegeo"]]
    write_csv(output / "equivalencias_pendientes.csv", pending, fields)
    different_codes = [r for r in results if r["cvegeo"] and not r["clave_directa_coincide"]]
    write_csv(output / "claves_ine_inegi_distintas.csv", different_codes, fields)
    ready = [r for r in results if r["cvegeo"] and r["elegible"] == "True"]
    write_csv(output / "municipios_para_mapa.csv", ready, fields)
    missing_geometry_rows = []
    summaries = []
    for year in sorted({r["anio"] for r in results}):
        subset = [r for r in results if r["anio"] == year]
        mapped = [r for r in subset if r["cvegeo"]]
        target_codes = {r["cvegeo"] for r in mapped}
        eligible = [r for r in subset if r["elegible"] == "True"]
        mapped_eligible = [r for r in eligible if r["cvegeo"]]
        summary = {
            "anio": int(year),
            "municipios_ine": len(subset),
            "mapeados": len(mapped),
            "pendientes": len(subset) - len(mapped),
            "elegibles": len(eligible),
            "elegibles_mapeados": len(mapped_eligible),
            "cobertura_elegibles_pct": round(100 * len(mapped_eligible) / len(eligible), 3),
            "metodos": dict(Counter(r["metodo"] for r in subset)),
            "geometrias_sin_datos": len(inegi) - len(target_codes),
        }
        for record in inegi:
            if record["CVEGEO"] not in target_codes:
                missing_geometry_rows.append({"anio": year, **record})
        summaries.append(summary)
        print(summary, flush=True)
    write_csv(
        output / "municipios_inegi_sin_datos.csv",
        missing_geometry_rows,
        ["anio", "CVEGEO", "CVE_ENT", "CVE_MUN", "NOMGEO"],
    )
    write_json(
        output / "cobertura_cartografica.json",
        {
            "generated_at_utc": now_utc(),
            "geometry_edition": "captura_servicio_2026-10-16",
            "years": summaries,
            "note": (
                "Correspondencias operativas derivadas; "
                "no son una tabla oficial de equivalencia histórica."
            ),
        },
    )


if __name__ == "__main__":
    main()
