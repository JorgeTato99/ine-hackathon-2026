"""Prepara recursos estáticos de interfaz sin recalcular modelos científicos."""

import argparse
import csv
import hashlib
import json
import shutil
from pathlib import Path

from scripts.common import ROOT, write_json

YEARS = (2009, 2012, 2015, 2018, 2021, 2024)
HISTORY_ISSUE = (
    "El dato de 2021 se omite: nombres cruzados en la muestra recibida; pendiente de regeneración."
)
HISTORY_ISSUE_SOURCE_SHA256 = "f26f5990705082872a75a31447c8d5ae4c560fcc1d7034e4cc72aa722cf0df1b"


def records(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def number(value: str, *, proportion=False) -> float | None:
    if value == "":
        return None
    result = float(value)
    if not (-float("inf") < result < float("inf")):
        raise ValueError("Número no finito en la muestra")
    if proportion and not 0 <= result <= 1:
        raise ValueError("Proporción fuera de 0–1")
    return result


def prepare_dataset(sample: Path, catalog: Path) -> dict:
    metadata = json.loads((sample / "metadatos.json").read_text(encoding="utf-8"))
    if metadata.get("tipo_muestra") != "provisional_estructural":
        raise ValueError("Este adaptador requiere una muestra estructural identificada")
    municipalities = {}
    historical_source_sha = hashlib.sha256((sample / "municipios.csv").read_bytes()).hexdigest()
    for row in records(sample / "municipios.csv"):
        code = row["cvegeo"]
        if len(code) != 5 or not code.isdigit() or code in municipalities:
            raise ValueError(f"CVEGEO inválido o duplicado: {code}")
        issue = (
            HISTORY_ISSUE
            if historical_source_sha == HISTORY_ISSUE_SOURCE_SHA256 and code in {"16064", "16065"}
            else None
        )
        municipalities[code] = {
            "id": code,
            "name": row["nombre_mpio"],
            "state": row["nombre_edo"].title(),
            "stateCode": code[:2],
            "nominal": number(row["ln_2024"]),
            "history": {
                str(year): None
                if issue and year == 2021
                else number(row[f"part_{year}"], proportion=True)
                for year in YEARS
            },
            "historyIssue": issue,
            "hasData": True,
            "hasGeometry": False,
        }
    scenarios = {}
    estimates = {}
    for row in records(sample / "escenarios_2027.csv"):
        code, scenario_id = row["cvegeo"], row["escenario_id"]
        if code not in municipalities or not scenario_id:
            raise ValueError(f"Escenario sin municipio conocido: {code}/{scenario_id}")
        scenario = {
            "id": scenario_id,
            "national": row["nivel_nacional"],
            "intervention": row["intervencion"],
            "year": int(row["anio"]),
        }
        if scenarios.setdefault(scenario_id, scenario) != scenario:
            raise ValueError(f"Escenario con significados distintos: {scenario_id}")
        bucket = estimates.setdefault(scenario_id, {})
        if code in bucket:
            raise ValueError(f"Resultado duplicado: {code}/{scenario_id}")
        low, high = (
            number(row["part_pred_inf"], proportion=True),
            number(row["part_pred_sup"], proportion=True),
        )
        if low is not None and high is not None and low > high:
            raise ValueError("Intervalo invertido")
        risk = row["riesgo"]
        if risk not in {"bajo", "medio", "alto", "sin_estimacion"}:
            raise ValueError(f"Riesgo no declarado: {risk}")
        participation = number(row["part_pred"], proportion=True)
        if not row["estado_estimacion"] or (participation is None) != (risk == "sin_estimacion"):
            raise ValueError("Estado incoherente con participación o riesgo")
        if participation is not None and (
            (low is not None and participation < low) or (high is not None and participation > high)
        ):
            raise ValueError("Participación fuera del intervalo recibido")
        bucket[code] = {
            "participation": participation,
            "lower": low,
            "upper": high,
            "risk": risk,
            "state": row["estado_estimacion"],
            "reason": row["motivo"] or None,
        }
    state_names = {row["stateCode"]: row["state"] for row in municipalities.values()}
    for row in records(catalog):
        code = row["CVEGEO"]
        if code not in municipalities:
            municipalities[code] = {
                "id": code,
                "name": row["NOMGEO"],
                "state": state_names.get(code[:2], code[:2]),
                "stateCode": code[:2],
                "nominal": None,
                "history": {str(year): None for year in YEARS},
                "historyIssue": None,
                "hasData": False,
                "hasGeometry": True,
            }
        municipalities[code]["hasGeometry"] = True
    return {
        "schemaVersion": 1,
        "version": metadata["version_resultados"],
        "sample": True,
        "generatedAtSource": metadata["generado"],
        "municipalities": sorted(municipalities.values(), key=lambda row: row["id"]),
        "scenarios": sorted(scenarios.values(), key=lambda row: row["id"]),
        "estimates": estimates,
        "comparisonPolicy": {"status": "pending", "pairs": []},
        "warnings": [
            "Los resultados, riesgos e intervenciones de 2027 son ficticios; no son un pronóstico final.",
            "La comparabilidad científica de las parejas está pendiente de definición por Sofía.",
            "Las fórmulas de los metadatos originales no se ejecutan en el navegador.",
            "Se omite 2021 en las dos historias con incidencia conocida; los originales se conservan.",
            "Una clave municipal no demuestra estabilidad histórica de límites.",
        ],
    }


def export_geometry_input(target: Path) -> None:
    import pyogrio

    frame = pyogrio.read_dataframe(
        ROOT / "data/processed/municipios_inegi.geojson", columns=["CVEGEO", "CVE_ENT", "NOMGEO"]
    )
    # Las respuestas originales declaran Mexico ITRF2008, aunque el derivado previo omitía el CRS.
    frame = frame.set_crs(6365, allow_override=True).to_crs(4326)
    target.parent.mkdir(parents=True, exist_ok=True)
    import shapely
    from shapely.geometry import mapping

    features = []
    for row in frame.itertuples():
        for index, part in enumerate(shapely.get_parts(row.geometry)):
            features.append(
                {
                    "type": "Feature",
                    "properties": {
                        "CVEGEO": row.CVEGEO,
                        "CVE_ENT": row.CVE_ENT,
                        "NOMGEO": row.NOMGEO,
                        "part": index,
                    },
                    "geometry": mapping(part),
                }
            )
    with target.open("w", encoding="utf-8") as stream:
        json.dump(
            {"type": "FeatureCollection", "features": features},
            stream,
            ensure_ascii=False,
            separators=(",", ":"),
        )


def prepare_geometry(path: Path) -> tuple[dict, dict]:
    import pyogrio
    import shapely
    from shapely.geometry import MultiPolygon, mapping, shape

    original = (
        pyogrio.read_dataframe(
            ROOT / "data/processed/municipios_inegi.geojson",
            columns=["CVEGEO", "CVE_ENT", "NOMGEO"],
        )
        .set_crs(6365, allow_override=True)
        .to_crs(4326)
    )
    incoming = json.loads(path.read_text(encoding="utf-8"))
    groups = {}
    for feature in incoming["features"]:
        code = feature["properties"]["CVEGEO"]
        if not feature.get("geometry"):
            raise ValueError(f"Geometría municipal vacía: {code}")
        geom = shape(feature["geometry"])
        if geom.geom_type not in {"Polygon", "MultiPolygon"}:
            raise ValueError(f"Geometría no poligonal: {code}")
        groups.setdefault(code, []).extend(shapely.get_parts(geom))
    if set(groups) != set(original["CVEGEO"]):
        raise ValueError("La simplificación no conserva el catálogo completo")
    features, fallbacks = [], []
    for row in original.itertuples():
        parts = groups[row.CVEGEO]
        candidate = MultiPolygon(parts)
        if (
            len(parts) != len(shapely.get_parts(row.geometry))
            or not candidate.is_valid
            or candidate.is_empty
            or abs(candidate.area / row.geometry.area - 1) > 0.05
        ):
            candidate = row.geometry
            fallbacks.append(row.CVEGEO)
        features.append(
            {
                "type": "Feature",
                "id": row.CVEGEO,
                "properties": {"CVEGEO": row.CVEGEO, "CVE_ENT": row.CVE_ENT, "NOMGEO": row.NOMGEO},
                "geometry": mapping(candidate),
            }
        )
    qa = {
        "features": len(features),
        "polygonParts": sum(len(shapely.get_parts(shape(f["geometry"]))) for f in features),
        "fallbackOriginal": fallbacks,
        "originalIsValidCoverage": False,
        "note": "Validez individual y partes conservadas; no se certifica cobertura topológica nacional.",
    }
    return {"type": "FeatureCollection", "features": features}, qa


def source_metadata() -> list:
    result = []
    for path in sorted((ROOT / "data/geo/inegi_snapshot_2026-10-16").glob("[0-9][0-9].geojson")):
        with path.open(encoding="utf-8") as stream:
            header = stream.read(4096)
        prefix = '"metadatos":'
        meta, _ = json.JSONDecoder().raw_decode(header.split(prefix, 1)[1].lstrip())
        if '"EPSG:6365"' not in header:
            raise ValueError(f"Revisar CRS de origen: {path.name}")
        result.append({"state": path.stem, "metadata": meta})
    if len(result) != 32:
        raise ValueError("Se requieren los metadatos de las 32 respuestas originales")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--export-geometry-input", type=Path)
    parser.add_argument("--geometry", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "frontend/public/data")
    args = parser.parse_args()
    if args.export_geometry_input:
        export_geometry_input(args.export_geometry_input)
        return
    if not args.geometry:
        parser.error("Indicar --geometry con la simplificación conjunta revisada")
    output = args.output
    output.mkdir(parents=True, exist_ok=True)
    sample = ROOT / "data/samples/muestra-0.3"
    dataset = prepare_dataset(sample, ROOT / "data/reference/municipios_inegi.csv")
    geometry, geometry_qa = prepare_geometry(args.geometry)
    features = geometry["features"]
    codes = set()
    for feature in features:
        code = feature["properties"]["CVEGEO"]
        if not feature.get("geometry") or feature["geometry"]["type"] not in {
            "Polygon",
            "MultiPolygon",
        }:
            raise ValueError(f"Geometría municipal vacía o no poligonal: {code}")
        if code in codes:
            raise ValueError(f"Geometría duplicada: {code}")
        codes.add(code)
        feature["id"] = code
    expected = {r["id"] for r in dataset["municipalities"] if r["hasGeometry"]}
    if codes != expected:
        raise ValueError("La cartografía preparada no conserva el catálogo completo")
    geometry.pop("crs", None)
    geometry["metadata"] = {
        "source": "INEGI, Marco Geoestadístico; ver metadatos originales por entidad",
        "captured": "2026-10-16",
        "sourceMetadata": source_metadata(),
        "transformations": "Reproyección EPSG:6365 a EPSG:4326; simplificación conjunta Mapshaper 8 % conservando partes y precisión 0.000001 grados; uso de visualización, no límites oficiales.",
        "sourceGeometrySha256": hashlib.sha256(
            (ROOT / "data/processed/municipios_inegi.geojson").read_bytes()
        ).hexdigest(),
        "qualityControl": geometry_qa,
    }
    geometry_path = output / "municipios.geojson"
    geometry_path.write_text(
        json.dumps(geometry, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    import geopandas as gpd
    import pyogrio

    package_path = output / "municipios.gpkg"
    if package_path.exists():
        package_path.unlink()
    package = gpd.GeoDataFrame.from_features(features, crs=4326)
    pyogrio.write_dataframe(
        package,
        package_path,
        layer="municipios",
        driver="GPKG",
        dataset_metadata={
            "SOURCE": "INEGI, Marco Geoestadístico; captura 2026-10-16",
            "SCOPE": "Cartografía simplificada de visualización; sin resultados científicos2027",
            "SOURCE_METADATA": json.dumps(geometry["metadata"], ensure_ascii=False),
        },
    )
    dataset["geometry"] = {
        "path": "/data/municipios.geojson",
        "features": len(features),
        "metadata": geometry["metadata"],
    }
    dataset_path = output / "dataset.json"
    dataset_path.write_text(
        json.dumps(dataset, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    originals = output / "muestra-0.3"
    originals.mkdir(exist_ok=True)
    for name in ("municipios.csv", "escenarios_2027.csv", "metadatos.json"):
        shutil.copyfile(sample / name, originals / name)
    write_json(
        output / "manifest.json",
        {
            "version": dataset["version"],
            "sample": True,
            "files": {
                str(path.relative_to(output)).replace("\\", "/"): {
                    "bytes": path.stat().st_size,
                    "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                }
                for path in [
                    dataset_path,
                    geometry_path,
                    package_path,
                    *sorted(originals.iterdir()),
                ]
            },
            "warnings": dataset["warnings"],
            "geometryMetadata": geometry["metadata"],
        },
    )
    print(
        json.dumps(
            {
                "municipalities": len(dataset["municipalities"]),
                "scenarios": len(dataset["scenarios"]),
                "output": str(output),
            },
            ensure_ascii=True,
        )
    )


if __name__ == "__main__":
    main()
