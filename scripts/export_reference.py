"""Publica tablas pequeñas revisadas y un diagnóstico del cruce municipal."""

import json
import shutil
from collections import Counter

from scripts.build_crosswalk import normalize_name, read_csv, write_csv
from scripts.common import ROOT, now_utc, sha256, write_json


def main() -> None:
    source = ROOT / "data/processed"
    target = ROOT / "data/reference"
    target.mkdir(parents=True, exist_ok=True)
    names = [
        "equivalencias_ine_inegi.csv",
        "municipios_para_mapa.csv",
        "municipios_inegi.csv",
        "municipios_ine_excluidos.csv",
        "cobertura_cartografica.json",
        "validacion.json",
    ]
    for name in names:
        shutil.copy2(source / name, target / name)
    rows = [r for r in read_csv(source / "equivalencias_ine_inegi.csv") if r["anio"] == "2024"]
    geometries = read_csv(source / "municipios_inegi.csv")
    codes = {r["CVEGEO"] for r in geometries}
    pending = [r for r in rows if not r["cvegeo"] or r["cvegeo"] not in codes]
    different = [r for r in rows if r["clave_ine"] != r["cvegeo"]]
    reviewed = [r for r in rows if r["metodo"] == "revision_documentada"]
    simple_missing = [r for r in rows if r["clave_ine"] not in codes]
    for name, subset in [
        ("sin_correspondencia_2024.csv", pending),
        ("claves_distintas_2024.csv", different),
        ("revision_documentada_2024.csv", reviewed),
        ("clave_ine_ausente_sin_equivalencia_2024.csv", simple_missing),
    ]:
        write_csv(target / name, subset, list(rows[0]))
    eligible = [r for r in rows if r["elegible"] == "True"]
    usable_codes = {r["cvegeo"] for r in eligible if r["cvegeo"]}
    without = [r for r in geometries if r["CVEGEO"] not in usable_codes]
    write_csv(
        target / "geometrias_sin_dato_utilizable_2024.csv",
        without,
        ["CVEGEO", "CVE_ENT", "CVE_MUN", "NOMGEO"],
    )
    audit = {
        "checked_at_utc": now_utc(),
        "geometry_snapshot": "2026-10-16",
        "ine_municipalities_2024": len(rows),
        "eligible_2024": len(eligible),
        "mapped_2024": len(rows) - len(pending),
        "pending_after_crosswalk": len(pending),
        "different_ine_inegi_keys": len(different),
        "reviewed_name_correspondences": len(reviewed),
        "normalized_name_differences": sum(
            normalize_name(r["municipio_ine"]) != normalize_name(r["municipio_inegi"]) for r in rows
        ),
        "ine_keys_absent_in_raw_direct_join": len(simple_missing),
        "geometries_without_usable_observation": len(without),
        "matching_methods": dict(Counter(r["metodo"] for r in rows)),
        "note": "Correspondencia operativa de identidad municipal para la captura INEGI del 16 de octubre de 2026; no acredita armonización histórica de límites. Ver data/README.md.",
    }
    write_json(target / "auditoria_geografica_2024.json", audit)
    # Canonizar únicamente las copias publicables; originales y resultados intactos.
    for path in target.iterdir():
        if path.suffix in {".csv", ".json"}:
            path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8", newline="\n")
    inputs = {name: sha256(target / name) for name in names}
    inputs["geometry_geojson_sha256"] = sha256(source / "municipios_inegi.geojson")
    write_json(
        target / "procedencia.json",
        {
            "generated_at_utc": now_utc(),
            "sources": json.loads((ROOT / "config/sources.json").read_text(encoding="utf-8")),
            "sha256": inputs,
        },
    )
    print(json.dumps(audit, ensure_ascii=True))


if __name__ == "__main__":
    main()
