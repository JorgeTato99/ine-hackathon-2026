"""Construye el componente portable del mapa; no sustituye la entrega completa del concurso."""

import argparse
import hashlib
import json
import re
import sqlite3
from contextlib import closing
from pathlib import Path
from urllib.parse import urlsplit
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
MAP_URL = "https://traza-civica.jorgetato.com/"
BASE_FILES = (
    "LEEME.md",
    "base-datos-reto2-ine-2026.xlsx",
    "diccionario.csv",
    "escenarios_2027.csv",
    "historia_municipal.csv",
    "municipios_2027.csv",
)


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")


def map_readme(version, url, commit):
    return f"""# Traza Cívica · Mapa de escenarios · Reto 2

Datos: {version}. Fuente científica: {commit}.
Consulta interactiva: {url}

## Contenido y apertura

- `mapa/municipios.gpkg`: mapa portable con 2,478 geometrías y los seis escenarios.
- `base-datos/`: los CSV, XLSX, diccionario y LEEME originales de Sofía.
- `metadatos.json`: variables, unidades, fuentes y límites del análisis.
- `controles.json`: cifras con las que se comprobó la publicación.
- `MANIFIESTO.json`: versión, procedencia, tamaños y SHA-256 de los archivos.

El mapa GPKG puede consultarse sin Internet con QGIS u otro programa compatible
con GeoPackage. Abrir `mapa/municipios.gpkg` y elegir la capa `resultados_2027`.
Las coordenadas usan EPSG:4326 y `cvegeo` es texto de cinco dígitos.

Para comparar sin y con intervención en QGIS:

1. Duplicar la capa para tener dos copias del mismo territorio.
2. En Simbología, elegir Categorizado y el campo
   `nac_medio_int_ninguna_riesgo` en la primera copia.
3. En la segunda, elegir `nac_medio_int_dirigida_rojos_riesgo`.
4. Usar rojo para `alto`, amarillo para `medio`, verde para `bajo` y gris para
   NULL (sin dato). Conservar ese significado en ambas capas.
5. Consultar los campos con sufijos `part_pred`, `part_pred_inf` y
   `part_pred_sup` para la cifra central y el rango; los valores van de 0 a 1.

Para otro supuesto nacional, cambiar `medio` por `bajo` o `alto` en ambas capas.
Siempre comparar el mismo nivel nacional. La URL permite hacerlo con controles
ya preparados, fichas municipales y lectura de contexto.

## Cómo interpretar los datos

Información agregada, sin datos personales. Hay 2,477 municipios con resultados;
Villa de Pozos (24059) tiene geometría pero no estimación. NULL o vacío nunca
equivale a cero. Un cero histórico identificado como falta de casillas significa
que no se pudo votar; revisar `alerta_sin_casilla` y los metadatos.

2027 es pronóstico condicionado a supuestos, no un resultado observado.
La intervención es **supuesto, no efecto medido**: no demuestra eficacia de
una campaña. El semáforo compara riesgo; no decide por sí solo la prioridad.
La seguridad es contexto histórico y no modifica ese semáforo.

En `historia_municipal.csv` la participación va de 0 a 100; en las tablas de
2027 y el GPKG va de 0 a 1. Leer `base-datos/LEEME.md` y el diccionario antes
de combinar archivos. Las 15 ausencias de brecha joven están vacías, no son cero.

## Alcance de este paquete

Este es el componente del mapa y su base de datos para incorporar al ZIP final
del equipo. No contiene el reporte metodológico/preventivo, la presentación ni
las cartas firmadas. El nombre del ZIP final debe usar el nombre registrado
del equipo y el eje del concurso. Este paquete no fija la licencia de la obra;
la consulta sobre cesión y difusión corresponde resolverla con el INE.

Fuentes y créditos: INE, INEGI y las demás fuentes declaradas en metadatos.
La geometría está simplificada para visualización; no sustituye límites oficiales.
""".encode()


def validate_gpkg(path, version, expected_count):
    """Comprueba lectura, capa, claves y versión sin modificar el GeoPackage."""
    with closing(sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)) as connection:
        if connection.execute("PRAGMA quick_check").fetchone() != ("ok",):
            raise ValueError("GeoPackage dañado")
        layer = connection.execute(
            "SELECT srs_id FROM gpkg_contents WHERE table_name = 'resultados_2027'"
        ).fetchone()
        if layer != (4326,):
            raise ValueError("Capa o sistema de coordenadas inesperado")
        count, keys, invalid = connection.execute(
            "SELECT COUNT(*), COUNT(DISTINCT cvegeo), "
            "SUM(CASE WHEN typeof(cvegeo) != 'text' OR length(cvegeo) != 5 "
            "OR version_resultados != ? OR version_resultados IS NULL THEN 1 ELSE 0 END) "
            "FROM resultados_2027",
            (version,),
        ).fetchone()
        if count != expected_count or keys != count or invalid:
            raise ValueError("Cobertura, claves o versión del GeoPackage incorrectas")


def create_package(root, output_directory, url=MAP_URL):
    parts = urlsplit(url)
    if (
        parts.scheme not in {"http", "https"}
        or not parts.hostname
        or parts.username is not None
        or parts.password is not None
        or any(character.isspace() for character in url)
    ):
        raise ValueError("URL de consulta inválida")
    public = root / "frontend/public/data"
    manifest = json.loads((public / "manifest.json").read_text(encoding="utf-8"))
    version = manifest["version"]
    if not re.fullmatch(r"resultados-\d+\.\d+", version):
        raise ValueError("Versión de datos inválida")
    commit = manifest["source"]["commit"]
    if not re.fullmatch(r"[a-f0-9]{40}", commit):
        raise ValueError("Procedencia científica inválida")
    scientific = root / "data/processed/mapa" / version
    base = root / "data/processed/entrega" / version.replace("resultados-", "base-datos-")
    files = {
        "mapa/municipios.gpkg": public / version / "municipios.gpkg",
        "metadatos.json": public / version / "metadatos.json",
        "controles.json": public / version / "controles.json",
        **{"base-datos/" + name: base / name for name in BASE_FILES},
    }
    controls = json.loads(files["controles.json"].read_text(encoding="utf-8"))
    validate_gpkg(files["mapa/municipios.gpkg"], version, controls["geometries"])
    for name in ("municipios.csv", "escenarios_2027.csv", "metadatos.json"):
        if (scientific / name).read_bytes() != (public / version / name).read_bytes():
            raise ValueError(f"La publicación difiere del original: {name}")
    if (base / "municipios_2027.csv").read_bytes() != (scientific / "municipios.csv").read_bytes():
        raise ValueError("La base municipal no coincide con el mapa")
    if (base / "escenarios_2027.csv").read_bytes() != (
        scientific / "escenarios_2027.csv"
    ).read_bytes():
        raise ValueError("La base de escenarios no coincide con el mapa")
    contents = {name: path.read_bytes() for name, path in files.items()}
    for name, path in files.items():
        if path.is_relative_to(public):
            expected = manifest["files"][path.relative_to(public).as_posix()]["sha256"]
            if hashlib.sha256(contents[name]).hexdigest() != expected:
                raise ValueError(f"Publicación modificada: {name}")
    contents["LEEME.md"] = map_readme(version, url, commit)
    contents["ENLACE.txt"] = (url + "\n").encode("utf-8")
    contents["MANIFIESTO.json"] = json_bytes(
        {
            "version_resultados": version,
            "source": manifest["source"],
            "map_url": url,
            "scope": "Componente del mapa; no es la entrega completa del concurso",
            "files": {
                name: {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
                for name, data in contents.items()
            },
        }
    )
    output_directory.mkdir(parents=True, exist_ok=True)
    stem = f"TrazaCivica_Reto2_Mapa_{version}"
    output = output_directory / (stem + ".zip")
    with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=6) as archive:
        for name, data in sorted(contents.items()):
            info = ZipInfo(stem + "/" + name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=6)
    with ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise ValueError("Falló la comprobación CRC del ZIP")
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "output/entrega")
    parser.add_argument("--url", default=MAP_URL)
    args = parser.parse_args()
    output = create_package(ROOT, args.output, args.url)
    print(f"{output} ({output.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
