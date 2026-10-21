"""Compara dos entregas científicas sin modificar la publicación vigente."""

import argparse
import csv
import hashlib
import io
import json
import math
import os
import re
import shutil

# Sólo se invoca Git para leer blobs, sin shell ni filtros externos.
import subprocess  # nosec B404
import tempfile
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

from scripts.prepare_results import BOOLEAN, TEXT

ROOT = Path(__file__).resolve().parents[1]
FILES = ("municipios.csv", "escenarios_2027.csv", "metadatos.json")
TABLE_KEYS = {"municipios.csv": ("cvegeo",), "escenarios_2027.csv": ("cvegeo", "escenario_id")}
TEXT_COLUMNS = TEXT | {
    "escenario_id",
    "nivel_nacional",
    "intervencion",
    "estado_estimacion",
    "motivo",
    "riesgo",
}
NUMERIC_COLUMNS = {
    "anio",
    "ln_2024",
    "ns_2024",
    "posicion_riesgo",
    "probabilidad_rojo",
    "peso_jov_2024",
    "n_jov_2024",
    "nv_jov_2024",
    "primerizos_votaron_2024",
    "jovenes_21_29_lista_2024",
    "jovenes_21_29_no_votaron_2024",
    "nuevos_votantes_2027",
    "credencializacion_18_19_2021",
    "nuevos_sin_credencial_2027_si_se_repite_2021",
    "interv_votos_retener_primerizos",
    "interv_votos_brecha_joven",
    "interv_votos_credencializar",
    "interv_nuevos_en_lista",
    "elecciones_por_debajo_del_pais",
    "brecha_jovenes_2024",
    "homicidios_2022_2024",
    "tasa_homicidios_2022_2024",
    "percentil_homicidios_2022_2024",
    "cifra_oculta_estatal_2025",
    "policias_municipales_por_10mil_habitantes",
    "desv_base",
    "efecto_interv",
    "part_pred",
    "part_pred_inf",
    "part_pred_sup",
    "votos_adicionales",
    *(f"part_{year}" for year in (2009, 2012, 2015, 2018, 2021, 2024)),
}
PUBLICATION_FIELDS = {"version_resultados", "generado", "tipo", "archivos"}


def typed_value(column, raw):
    if raw == "":
        return "missing", None
    if column in TEXT_COLUMNS:
        return "text", raw
    if column in BOOLEAN:
        if raw not in {"true", "false"}:
            raise ValueError(f"Booleano inválido en {column}")
        return "boolean", raw == "true"
    if column not in NUMERIC_COLUMNS:
        return "unclassified", raw
    if not re.fullmatch(r"[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?", raw):
        raise ValueError(f"Número inválido en {column}")
    try:
        number = Decimal(raw)
    except InvalidOperation as error:
        raise ValueError(f"Número inválido en {column}") from error
    if not number.is_finite():
        raise ValueError(f"Número no finito en {column}")
    return "number", number


def read_table(path, keys, raw=None):
    content = path.read_bytes() if raw is None else raw
    with io.StringIO(content.decode("utf-8-sig"), newline="") as stream:
        reader = csv.reader(stream, strict=True)
        fields = next(reader, [])
        if not fields or len(fields) != len(set(fields)) or any(not field for field in fields):
            raise ValueError(f"Cabecera vacía o duplicada: {path.name}")
        if not set(keys) <= set(fields):
            raise ValueError(f"Faltan claves: {path.name}")
        rows = {}
        for line, values in enumerate(reader, 2):
            if len(values) != len(fields):
                raise ValueError(f"Número de columnas inválido: {path.name}:{line}")
            row = dict(zip(fields, values, strict=True))
            if not re.fullmatch(r"[0-9]{5}", row["cvegeo"]):
                raise ValueError(f"CVEGEO inválido: {path.name}:{line}")
            if "escenario_id" in keys and not re.fullmatch(
                r"[a-zA-Z0-9_-]{1,100}", row["escenario_id"]
            ):
                raise ValueError("Escenario inválido")
            key = tuple(row[column] for column in keys)
            if key in rows:
                raise ValueError(f"Clave duplicada: {path.name}:{line}")
            for column, value in row.items():
                typed_value(column, value)
            rows[key] = row
    return {"fields": fields, "rows": rows}


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Clave JSON duplicada: {key}")
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError(f"Valor JSON no finito: {value}")


def finite_float(raw):
    value = float(raw)
    if not math.isfinite(value):
        raise ValueError("Valor JSON no finito")
    return value


def load_publication(folder, commit, repository_root=ROOT):
    if not re.fullmatch(r"[a-f0-9]{40}", commit):
        raise ValueError("Se requiere un commit completo")
    raw_files = {name: (folder / name).read_bytes() for name in FILES}
    files = {
        name: {"bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}
        for name, raw in raw_files.items()
    }
    metadata = json.loads(
        raw_files["metadatos.json"].decode("utf-8-sig"),
        object_pairs_hook=unique_object,
        parse_constant=reject_constant,
        parse_float=finite_float,
    )
    if (
        not isinstance(metadata, dict)
        or not isinstance(metadata.get("version_resultados"), str)
        or not isinstance(metadata.get("generado"), str)
    ):
        raise ValueError("Metadatos sin versión o fecha de origen")
    if not isinstance(metadata.get("unidades"), dict) or any(
        not isinstance(value, str) for value in metadata["unidades"].values()
    ):
        raise ValueError("Unidades inválidas")
    tables = {
        name: read_table(folder / name, keys, raw=raw_files[name])
        for name, keys in TABLE_KEYS.items()
    }
    municipalities = {key[0] for key in tables["municipios.csv"]["rows"]}
    descriptors = {}
    for key, row in tables["escenarios_2027.csv"]["rows"].items():
        if key[0] not in municipalities:
            raise ValueError("Escenario sin municipio")
        descriptor = tuple(row.get(column) for column in ("anio", "nivel_nacional", "intervencion"))
        if (
            None in descriptor
            or "" in descriptor
            or key[1] in descriptors
            and descriptors[key[1]] != descriptor
        ):
            raise ValueError("Escenario con descriptores inconsistentes")
        descriptors[key[1]] = descriptor
    if set(descriptors) != set(metadata.get("escenarios", [])):
        raise ValueError("Los escenarios no coinciden con los metadatos")
    return {
        "version": metadata["version_resultados"],
        "generatedAtSource": metadata["generado"],
        "source": {
            "repository": "https://github.com/JorgeTato99/ine-hackathon-2026",
            "commit": commit,
            "directory": folder.resolve().relative_to(repository_root.resolve()).as_posix(),
        },
        "files": files,
        "metadata": metadata,
        "tables": tables,
    }


def verify_git_source(publication, repository_root=ROOT):
    source = publication["source"]
    git = shutil.which("git")
    if git is None:
        raise FileNotFoundError("Git no está disponible")
    for name, expected in publication["files"].items():
        reference = f"{source['commit']}:{source['directory']}/{name}"
        # Sólo lectura de un blob, argumentos separados y sin shell ni filtros externos.
        result = subprocess.run(
            [git, "show", reference], cwd=repository_root, check=True, capture_output=True
        )  # nosec B603
        if (
            hashlib.sha256(result.stdout).hexdigest() != expected["sha256"]
            or len(result.stdout) != expected["bytes"]
        ):
            raise ValueError(f"El original no coincide con Git: {name}")


def flatten(value, prefix=""):
    if isinstance(value, dict) and (value or not prefix):
        return {
            key: leaf
            for name, item in value.items()
            for key, leaf in flatten(
                item, f"{prefix}/{name.replace('~', '~0').replace('/', '~1')}"
            ).items()
        }
    return {prefix: value}


def metadata_changes(before, after):
    left, right = flatten(before), flatten(after)
    return [
        {
            "path": key,
            "kind": "added" if key not in left else "removed" if key not in right else "changed",
            "before": left.get(key),
            "after": right.get(key),
        }
        for key in sorted(left.keys() | right.keys())
        if key not in left
        or key not in right
        or json.dumps(left[key], sort_keys=True, allow_nan=False)
        != json.dumps(right[key], sort_keys=True, allow_nan=False)
    ]


def unit_for(metadata, column):
    units = metadata.get("unidades", {})
    if not isinstance(units, dict):
        raise ValueError("Unidades inválidas")
    if column in units:
        return units[column]
    matches = [
        value for key, value in units.items() if column in [part.strip() for part in key.split(",")]
    ]
    if not matches:
        patterns = [
            (len(key), value)
            for key, value in units.items()
            if key.endswith("*") and column.startswith(key[:-1])
        ]
        specificity = max((length for length, _ in patterns), default=0)
        matches = [value for length, value in patterns if length == specificity]
    if len(set(matches)) > 1:
        raise ValueError(f"Unidad ambigua: {column}")
    return matches[0] if matches else None


def compare_publications(before, after):
    meta = metadata_changes(before["metadata"], after["metadata"])
    definitions_changed = any(item["path"].split("/")[1] not in PUBLICATION_FIELDS for item in meta)

    def contexts(publication):
        return {
            key[1]: tuple(row[column] for column in ("anio", "nivel_nacional", "intervencion"))
            for key, row in publication["tables"]["escenarios_2027.csv"]["rows"].items()
        }

    old_contexts, new_contexts = contexts(before), contexts(after)
    conditions_changed = sorted(
        key
        for key in old_contexts.keys() & new_contexts.keys()
        if old_contexts[key] != new_contexts[key]
    )
    tables = []
    changed_municipalities = set()
    all_kinds = Counter()

    def scenario_coverage(publication):
        codes = {key[0] for key in publication["tables"]["municipios.csv"]["rows"]}
        by_scenario = {}
        for code, scenario in publication["tables"]["escenarios_2027.csv"]["rows"]:
            by_scenario.setdefault(scenario, set()).add(code)
        return [
            {
                "scenario": scenario,
                "expected": len(codes),
                "present": len(present),
                "missing": sorted(codes - present),
            }
            for scenario, present in sorted(by_scenario.items())
        ]

    source_coverage = {"before": scenario_coverage(before), "after": scenario_coverage(after)}
    for name in TABLE_KEYS:
        left, right = before["tables"][name], after["tables"][name]
        left_rows, right_rows = left["rows"], right["rows"]
        shared = sorted(set(left["fields"]) & set(right["fields"]))
        changes = []
        coverage = []
        for column in sorted(set(left["fields"]) | set(right["fields"])):
            coverage.append(
                {
                    "column": column,
                    "missingBefore": sum(row[column] == "" for row in left_rows.values())
                    if column in left["fields"]
                    else None,
                    "missingAfter": sum(row[column] == "" for row in right_rows.values())
                    if column in right["fields"]
                    else None,
                }
            )
        for key in sorted(left_rows.keys() & right_rows.keys()):
            for column in shared:
                old, new = left_rows[key][column], right_rows[key][column]
                if old == new:
                    continue
                old_type, old_value = typed_value(column, old)
                new_type, new_value = typed_value(column, new)
                kind = (
                    "missing"
                    if new == ""
                    else "available"
                    if old == ""
                    else "unclassified"
                    if "unclassified" in {old_type, new_type}
                    else "format"
                    if (old_type, old_value) == (new_type, new_value)
                    else "data"
                )
                old_unit, new_unit = (
                    unit_for(before["metadata"], column),
                    unit_for(after["metadata"], column),
                )
                comparable = (
                    kind == "data"
                    and old_type == new_type == "number"
                    and old_unit is not None
                    and old_unit == new_unit
                    and not definitions_changed
                    and (len(key) == 1 or key[1] not in conditions_changed)
                )
                municipality = after["tables"]["municipios.csv"]["rows"].get((key[0],), {})
                changes.append(
                    {
                        "cvegeo": key[0],
                        "scenario": key[1] if len(key) > 1 else None,
                        "name": municipality.get("nombre_mpio", key[0]),
                        "state": municipality.get("nombre_edo", ""),
                        "column": column,
                        "kind": kind,
                        "before": old,
                        "after": new,
                        "typeBefore": old_type,
                        "typeAfter": new_type,
                        "unitBefore": old_unit,
                        "unitAfter": new_unit,
                        "comparable": comparable,
                        "delta": str(new_value - old_value) if comparable else None,
                    }
                )
                changed_municipalities.add(key[0])
                all_kinds[kind] += 1
        added, removed = (
            sorted(right_rows.keys() - left_rows.keys()),
            sorted(left_rows.keys() - right_rows.keys()),
        )
        changed_municipalities.update(key[0] for key in added + removed)
        tables.append(
            {
                "name": name,
                "rowsBefore": len(left_rows),
                "rowsAfter": len(right_rows),
                "addedRows": [list(key) for key in added],
                "removedRows": [list(key) for key in removed],
                "addedColumns": sorted(set(right["fields"]) - set(left["fields"])),
                "removedColumns": sorted(set(left["fields"]) - set(right["fields"])),
                "unclassifiedColumns": sorted(
                    (set(left["fields"]) | set(right["fields"]))
                    - TEXT_COLUMNS
                    - BOOLEAN
                    - NUMERIC_COLUMNS
                ),
                "coverage": coverage,
                "changes": changes,
            }
        )
    cells = sum(len(table["changes"]) for table in tables)
    structural = any(
        table[key]
        for table in tables
        for key in ("addedRows", "removedRows", "addedColumns", "removedColumns")
    )
    return {
        "schemaVersion": 1,
        "generator": {"script": "scripts/compare_publications.py", "schemaVersion": 1},
        "status": "changes" if cells or meta or structural else "unchanged",
        "before": {
            key: value for key, value in before.items() if key not in {"metadata", "tables"}
        },
        "after": {key: value for key, value in after.items() if key not in {"metadata", "tables"}},
        "summary": {
            "cells": cells,
            "municipalities": len(changed_municipalities),
            "kinds": dict(sorted(all_kinds.items())),
            "metadata": len(meta),
        },
        "definitionsChanged": definitions_changed,
        "conditionsChanged": conditions_changed,
        "scenarioCoverage": source_coverage,
        "coverageIncomplete": any(
            item["missing"] for group in source_coverage.values() for item in group
        ),
        "metadataChanges": meta,
        "tables": tables,
    }


def validate_output(path):
    destination = path.resolve()
    auxiliary = (ROOT / "frontend/public/data/publicaciones").resolve()
    if destination.suffix != ".json" or not destination.is_relative_to(auxiliary):
        raise ValueError("La salida debe ser JSON dentro de frontend/public/data/publicaciones")
    return destination


def write_report(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="\n",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as stream:
            temporary = Path(stream.name)
            stream.write(content)
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--before", type=Path, required=True)
    parser.add_argument("--after", type=Path, required=True)
    parser.add_argument("--before-commit", required=True)
    parser.add_argument("--after-commit", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    destination = validate_output(args.output)
    before = load_publication(args.before, args.before_commit)
    after = load_publication(args.after, args.after_commit)
    verify_git_source(before)
    verify_git_source(after)
    report = compare_publications(before, after)
    content = json.dumps(report, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n"
    write_report(destination, content)
    print(json.dumps(report["summary"]))


if __name__ == "__main__":
    main()
