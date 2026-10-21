"""Publica entregas científicas agregadas conservando sus originales y geometría."""

import argparse
import csv
import hashlib
import json
import math
import shutil
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURRENT_VERSION = "resultados-1.2"
CURRENT_COMMIT = "ac8dc3cdbb06b5a0d5ddd63b67bee9a43def9821"
YEARS = (2009, 2012, 2015, 2018, 2021, 2024)
TEXT = {
    "cvegeo",
    "clave_ine_2024",
    "nombre_mpio",
    "nombre_edo",
    "semaforo",
    "alerta_sin_casilla",
    "ultima_eleccion_sin_casilla",
    "zona_participacion_2024",
    "comparacion_homicidios_inegi_sesnsp",
    "quien_ejerce_seguridad",
    "justicia_civica",
}
BOOLEAN = {
    "historia_completa",
    "territorio_aproximado_2024",
    "ayuntamiento_mismo_dia_2027",
    "gobernador_mismo_dia_2027",
    "es_sni",
    "usos_y_costumbres",
    "tiene_policia_municipal",
}
RISK = {"rojo": "alto", "amarillo": "medio", "verde": "bajo"}


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def number(value):
    if value == "":
        return None
    result = float(value)
    if not math.isfinite(result):
        raise ValueError("Valor no finito")
    return int(result) if result.is_integer() else result


def scalar(key, value, *, legacy_nan=False):
    if legacy_nan and key == "brecha_jovenes_2024" and value == "NaN":
        return None
    if value == "":
        return None
    if key in TEXT:
        return value
    if key in BOOLEAN:
        if value not in {"true", "false"}:
            raise ValueError(f"Booleano inválido: {key}")
        return value == "true"
    return number(value)


def write_json(path, value):
    path.write_text(
        json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input", type=Path, default=ROOT / "data/processed/mapa" / CURRENT_VERSION
    )
    parser.add_argument("--output", type=Path, default=ROOT / "frontend/public/data")
    parser.add_argument("--commit", default=CURRENT_COMMIT)
    args = parser.parse_args()
    output = args.output
    metadata = json.loads((args.input / "metadatos.json").read_text(encoding="utf-8-sig"))
    version = metadata["version_resultados"]
    if version != CURRENT_VERSION and args.commit == CURRENT_COMMIT:
        raise ValueError("Indicar --commit con la procedencia de la nueva entrega")
    if not version.startswith("resultados-") or "/" in version or "\\" in version:
        raise ValueError("Versión científica inválida")
    geometry = json.loads((output / "municipios.geojson").read_text(encoding="utf-8"))
    previous_manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
    geometry_metadata = previous_manifest["geometryMetadata"]
    source_rows = read_csv(args.input / "municipios.csv")
    rows = {row["cvegeo"]: row for row in source_rows}
    if len(rows) != len(source_rows) or any(len(code) != 5 or not code.isdigit() for code in rows):
        raise ValueError("Claves municipales inválidas o duplicadas")
    geometry_ids = {feature["properties"]["CVEGEO"] for feature in geometry["features"]}
    if set(rows) - geometry_ids:
        raise ValueError("Resultados sin geometría")
    municipalities = {}
    for code, row in rows.items():
        indicators = {
            key: scalar(key, value, legacy_nan=version == "resultados-1.1")
            for key, value in row.items()
        }
        history = {str(year): number(row[f"part_{year}"]) for year in YEARS}
        municipalities[code] = {
            "id": code,
            "name": row["nombre_mpio"],
            "state": row["nombre_edo"],
            "stateCode": code[:2],
            "nominal": number(row["ln_2024"]),
            "history": history,
            "historyIssue": None,
            "hasData": True,
            "hasGeometry": True,
            "baseRisk": RISK[row["semaforo"]],
            "indicators": indicators,
            "historyStatus": {
                year: "sin_casilla"
                for year, value in history.items()
                if value == 0 and row["alerta_sin_casilla"] != "sin antecedente"
            },
        }
    states = {row["stateCode"]: row["state"] for row in municipalities.values()}
    for feature in geometry["features"]:
        code = feature["properties"]["CVEGEO"]
        if code not in municipalities:
            municipalities[code] = {
                "id": code,
                "name": feature["properties"]["NOMGEO"],
                "state": states.get(code[:2], code[:2]),
                "stateCode": code[:2],
                "nominal": None,
                "history": {str(year): None for year in YEARS},
                "historyIssue": None,
                "hasData": False,
                "hasGeometry": True,
                "baseRisk": "sin_estimacion",
                "indicators": dict.fromkeys(source_rows[0]),
                "historyStatus": {},
            }
    scenarios, estimates, scenario_rows = {}, {}, read_csv(args.input / "escenarios_2027.csv")
    for row in scenario_rows:
        code, key = row["cvegeo"], row["escenario_id"]
        if code not in rows or code in estimates.setdefault(key, {}):
            raise ValueError("Escenario huérfano o duplicado")
        scenario = {
            "id": key,
            "national": row["nivel_nacional"],
            "intervention": row["intervencion"],
            "year": int(row["anio"]),
        }
        if scenarios.setdefault(key, scenario) != scenario:
            raise ValueError("Identificador de escenario incoherente")
        low, value, high = [
            number(row[field]) for field in ("part_pred_inf", "part_pred", "part_pred_sup")
        ]
        if (
            any(value is None or not 0 <= value <= 1 for value in (low, value, high))
            or not low <= value <= high
        ):
            raise ValueError("Proporción o intervalo inválido")
        if row["riesgo"] not in RISK.values():
            raise ValueError("Riesgo desconocido")
        estimates[key][code] = {
            "participation": value,
            "lower": low,
            "upper": high,
            "risk": row["riesgo"],
            "state": row["estado_estimacion"],
            "reason": row["motivo"] or None,
            "additionalVotes": number(row["votos_adicionales"]),
            "interventionEffect": number(row["efecto_interv"]),
        }
    if set(scenarios) != set(metadata["escenarios"]) or any(
        set(bucket) != set(rows) for bucket in estimates.values()
    ):
        raise ValueError("Cobertura incompleta de escenarios")
    pairs = [
        [f"nac-{level}_int-ninguna", f"nac-{level}_int-dirigida_rojos"]
        for level in metadata["niveles_nacionales_2027"]
    ]
    controls = {
        "normalizations": {
            "brecha_jovenes_2024_NaN_to_null": sum(
                row["brecha_jovenes_2024"] == "NaN" for row in rows.values()
            )
        },
        "municipalities": len(rows),
        "geometries": len(geometry_ids),
        "scenarios": len(scenarios),
        "missingData": sorted(geometry_ids - set(rows)),
        "trafficLight": dict(Counter(row["semaforo"] for row in rows.values())),
        "redNominal2024": sum(
            row["nominal"] for row in municipalities.values() if row["baseRisk"] == "alto"
        ),
        "additionalVotesMedium": sum(
            row["additionalVotes"] or 0
            for row in estimates["nac-medio_int-dirigida_rojos"].values()
        ),
        "leaveRedMedium": sum(
            estimates["nac-medio_int-ninguna"][code]["risk"] == "alto" and result["risk"] != "alto"
            for code, result in estimates["nac-medio_int-dirigida_rojos"].items()
        ),
    }
    if version in {"resultados-1.1", "resultados-1.2"} and (
        controls["trafficLight"] != {"rojo": 495, "amarillo": 496, "verde": 1486}
        or controls["municipalities"] != 2477
        or controls["geometries"] != 2478
        or controls["scenarios"] != 6
        or controls["redNominal2024"] != 23818704
        or controls["additionalVotesMedium"] != 505007
        or controls["leaveRedMedium"] != 88
        or controls["missingData"] != ["24059"]
    ):
        raise ValueError(f"La entrega no coincide con los controles científicos de {version}")
    source = {
        "repository": "https://github.com/JorgeTato99/ine-hackathon-2026",
        "commit": args.commit,
        "directory": "data/processed/mapa/" + version,
    }
    dataset = {
        "schemaVersion": 2,
        "version": version,
        "sample": False,
        "generatedAtSource": metadata["generado"],
        "municipalities": sorted(municipalities.values(), key=lambda item: item["id"]),
        "scenarios": sorted(scenarios.values(), key=lambda item: item["id"]),
        "estimates": estimates,
        "comparisonPolicy": {"status": "confirmed", "pairs": pairs},
        "nationalLevels": metadata["niveles_nacionales_2027"],
        "model": metadata["modelo"],
        "intervalDescription": metadata["intervalo"],
        "warnings": metadata["advertencias"],
        "source": source,
        "geometry": {
            "path": "/data/municipios.geojson",
            "features": len(geometry_ids),
            "metadata": geometry_metadata,
        },
    }
    write_json(output / "dataset.json", dataset)
    originals = output / version
    originals.mkdir(parents=True, exist_ok=True)
    for name in ("municipios.csv", "escenarios_2027.csv", "metadatos.json"):
        shutil.copyfile(args.input / name, originals / name)
    write_json(originals / "controles.json", controls)
    enriched = []
    for feature in geometry["features"]:
        code = feature["properties"]["CVEGEO"]
        properties = {
            **{key: value for key, value in feature["properties"].items() if key != "CVEGEO"},
            **municipalities[code]["indicators"],
        }
        properties["cvegeo"] = code
        properties["nombre_mpio"] = municipalities[code]["name"]
        properties["nombre_edo"] = municipalities[code]["state"]
        properties["version_resultados"] = version
        for key, bucket in estimates.items():
            result = bucket.get(code, {})
            for field, internal in {
                "part_pred": "participation",
                "part_pred_inf": "lower",
                "part_pred_sup": "upper",
                "riesgo": "risk",
                "votos_adicionales": "additionalVotes",
                "efecto_interv": "interventionEffect",
            }.items():
                properties[key.replace("-", "_") + "_" + field] = result.get(internal)
        enriched.append(
            {"type": "Feature", "geometry": feature["geometry"], "properties": properties}
        )
    write_json(
        originals / "municipios.geojson", {"type": "FeatureCollection", "features": enriched}
    )
    import geopandas as gpd
    import pyogrio

    frame = gpd.GeoDataFrame.from_features(enriched, crs="EPSG:4326")
    for field in BOOLEAN:
        frame[field] = frame[field].astype("boolean")
    pyogrio.write_dataframe(
        frame,
        originals / "municipios.gpkg",
        layer="resultados_2027",
        driver="GPKG",
        append=False,
        dataset_metadata={
            "VERSION": version,
            "SOURCE_COMMIT": args.commit,
            "READING": "2027: pronósticos y supuestos; no observaciones ni efectos medidos",
        },
    )
    files = [
        output / "dataset.json",
        output / "municipios.geojson",
        output / "municipios.gpkg",
        *sorted(originals.iterdir()),
    ]
    write_json(
        output / "manifest.json",
        {
            "version": version,
            "sample": False,
            "source": source,
            "warnings": metadata["advertencias"],
            "geometryMetadata": geometry_metadata,
            "files": {
                str(path.relative_to(output)).replace("\\", "/"): {
                    "bytes": path.stat().st_size,
                    "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                }
                for path in files
            },
        },
    )
    write_json(
        ROOT / "frontend/src/content/release.json",
        {"version": version, "metadata": metadata, "controls": controls},
    )
    print(json.dumps(controls, ensure_ascii=True))


if __name__ == "__main__":
    main()
