"""Guarda una captura del servicio municipal oficial del INEGI y prepara GeoJSON."""

import csv
import json
from concurrent.futures import ThreadPoolExecutor

from shapely import make_valid
from shapely.geometry import MultiPolygon, mapping, shape

from scripts.common import ROOT, download, now_utc, sha256, write_json


def polygon_parts(geometry) -> list:
    if geometry.geom_type == "Polygon":
        return [geometry]
    if geometry.geom_type in {"MultiPolygon", "GeometryCollection"}:
        return [p for member in geometry.geoms for p in polygon_parts(member)]
    return []


def fetch_state(state: str, source: dict, directory) -> tuple:
    url = source["url_template"].format(state=state)
    path = download(url, directory / f"{state}.geojson")
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    if data.get("type") != "FeatureCollection" or not data.get("features"):
        raise ValueError(f"GeoJSON vacío o inesperado: {state}")
    for feature in data["features"]:
        if feature["properties"]["cve_ent"] != state:
            raise ValueError(f"Entidad incorrecta: {state}")
    return data["features"], {
        "state": state,
        "url": url,
        "sha256": sha256(path),
        "bytes": path.stat().st_size,
        "feature_count": len(data["features"]),
    }


def main() -> None:
    source = json.loads((ROOT / "config/sources.json").read_text(encoding="utf-8"))["geometry"]
    directory = ROOT / "data" / "geo" / ("inegi_snapshot_" + source["snapshot_date"])
    directory.mkdir(parents=True, exist_ok=True)
    states = [f"{i:02d}" for i in range(1, 33)]
    with ThreadPoolExecutor(max_workers=2) as executor:
        state_results = list(executor.map(lambda s: fetch_state(s, source, directory), states))
    features = []
    catalog = []
    repairs = []
    seen: set[str] = set()
    for state_features, _ in state_results:
        for feature in state_features:
            raw = feature["properties"]
            properties = {
                "CVEGEO": raw["cvegeo"],
                "CVE_ENT": raw["cve_ent"],
                "CVE_MUN": raw["cve_mun"],
                "NOMGEO": raw["nomgeo"],
            }
            code = properties["CVEGEO"]
            if code in seen or code != properties["CVE_ENT"] + properties["CVE_MUN"]:
                raise ValueError(f"Clave duplicada o inconsistente: {code}")
            seen.add(code)
            geometry = shape(feature["geometry"])
            if not geometry.is_valid:
                parts = polygon_parts(make_valid(geometry))
                if not parts:
                    raise ValueError(f"Municipio sin polígonos: {code}")
                geometry = MultiPolygon(parts)
                repairs.append(code)
            if geometry.is_empty or not geometry.is_valid:
                raise ValueError(f"Geometría vacía o inválida: {code}")
            west, south, east, north = geometry.bounds
            if not (-120 < west <= east < -85 and 13 < south <= north < 34):
                raise ValueError(f"Coordenadas fuera de México: {code}")
            features.append(
                {
                    "type": "Feature",
                    "id": code,
                    "properties": properties,
                    "geometry": mapping(geometry),
                }
            )
            catalog.append(properties)
    output = ROOT / "data" / "processed"
    output.mkdir(parents=True, exist_ok=True)
    with (output / "municipios_inegi.csv").open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["CVEGEO", "CVE_ENT", "CVE_MUN", "NOMGEO"])
        writer.writeheader()
        writer.writerows(sorted(catalog, key=lambda p: p["CVEGEO"]))
    geojson = output / "municipios_inegi.geojson"
    temporary = geojson.with_suffix(".geojson.tmp")
    with temporary.open("w", encoding="utf-8") as stream:
        json.dump(
            {"type": "FeatureCollection", "features": features},
            stream,
            ensure_ascii=False,
            separators=(",", ":"),
        )
    temporary.replace(geojson)
    write_json(
        directory / "descarga.json",
        {
            **source,
            "verified_at_utc": now_utc(),
            "coordinate_system": "longitud, latitud (GeoJSON)",
            "feature_count": len(features),
            "repaired_geometries": repairs,
            "repair_policy": (
                "make_valid y conservación de polígonos; respuestas originales intactas"
            ),
            "files": [metadata for _, metadata in state_results],
        },
    )
    print(
        f"Cartografía lista: {len(features)} municipios; {len(repairs)} geometrías reparadas",
        flush=True,
    )


if __name__ == "__main__":
    main()
