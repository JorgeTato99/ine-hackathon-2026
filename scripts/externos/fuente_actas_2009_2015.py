"""Resultados oficiales casilla por casilla: Diputados MR 2009, Presidente 2012 y Diputados MR 2015.

Fuente
    INE, Sistema de Consulta de la Estadística de las Elecciones Federales (SICEEF), apartado
    "Descargar Bases de Datos": http://siceef.ine.mx/downloadDB.html. La lista de archivos sale de
    http://siceef.ine.mx/js/app.js (campo rutaCsvCasilla). Cada archivo se baja de
    http://siceef.ine.mx/BD/<nombre>.csv. El sitio solo responde por http:// (por https://
    Cloudflare devuelve 521); por eso la integridad se garantiza con el SHA-256 de cada archivo.

Qué produce (data/processed/externos/)
    actas_2009.parquet   Diputados MR 2009, una fila por casilla
    actas_2012.parquet   Presidente 2012, una fila por casilla
    actas_2015.parquet   Diputados MR 2015, una fila por casilla
    verificaciones/actas_2009_2015_meta.json   huellas de crudos y parquets, filas, descuadres

Cómo correrlo (desde la raíz del repo; solo usa polars, que está en uv.lock):
    uv tool run --from uv==0.13.1 uv run --locked python -I scripts/externos/fuente_actas_2009_2015.py

    Sin --descargar solo lee los crudos ya presentes en data/raw/computos_{anio}/. Con
    --descargar baja los que falten (nunca sobrescribe). En ambos casos el SHA-256 de cada CSV
    debe coincidir con data/reference/huellas_fuentes_externas.csv o el script se detiene.
    Las comparaciones contra cifras oficiales publicadas están en verificar_actas_2009_2015.py.

Verificaciones
    - SHA-256 de los nueve CSV (principal y de apoyo de cada año).
    - La clave (EDOCVE, distrito, SECCION, casilla_original) es única.
    - Filas donde la suma de partidos + no registrados + nulos no da TOTAL_VOTOS.
    - 2015: las filas de Aguascalientes 01 marcadas como elección extraordinaria son idénticas
      a DiputadosMR2015Ext.csv.

Seguridad
    Solo descarga desde siceef.ine.mx. Los CSV se leen como texto (UTF-8 con BOM o
    Windows-1252) con polars; no se ejecuta nada descargado.
"""

import argparse
import csv
import hashlib
import io
import json
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

import polars as pl

RAIZ = next(
    p
    for p in [Path(__file__).resolve(), *Path(__file__).resolve().parents]
    if (p / "pyproject.toml").is_file()
)
HUELLAS = RAIZ / "data" / "reference" / "huellas_fuentes_externas.csv"
RAW = RAIZ / "data" / "raw"
OUT = RAIZ / "data" / "processed" / "externos"
META = OUT / "verificaciones" / "actas_2009_2015_meta.json"
BASE = "http://siceef.ine.mx/BD/"

# archivo principal (por casilla) y archivos de apoyo para verificar
FUENTES = {
    2012: {
        "eleccion": "Presidente",
        "principal": "Presidente2012.csv",
        "apoyo": ["Presidente2012Seccion.csv"],
    },
    2015: {
        "eleccion": "Diputados MR",
        "principal": "DiputadosMR2015.csv",
        "apoyo": ["DiputadosMR2015Ext.csv", "DiputadosMR2015Seccion.csv", "DiputadosRP2015.csv"],
    },
    2009: {
        "eleccion": "Diputados MR",
        "principal": "DiputadosMR2009.csv",
        "apoyo": ["DiputadosMR2009Seccion.csv", "DiputadosRP2009.csv"],
    },
}

# El SHA-256 esperado de cada archivo (bajados el 19-oct-2026, hora de la CDMX) está en
# data/reference/huellas_fuentes_externas.csv.

# Columnas que no son votos por partido / coalición / candidatura
NO_PARTIDO = {
    "CIRCUNSCRIPCION",
    "ID_ESTADO",
    "NOMBRE_ESTADO",
    "ID_DISTRITO",
    "CABECERA_DISTRITAL",
    "ID_MUNICIPIO",
    "MUNICIPIO",
    "SECCION",
    "CASILLA",
    "NUM_VOTOS_CAN_NREG",
    "NUM_VOTOS_VALIDOS",
    "NUM_VOTOS_NULOS",
    "TOTAL_VOTOS",
    "LISTA_NOMINAL",
    "ESTATUS_ACTA",
    "TEPJF",
    "OBSERVACIONES",
    "RUTA_ACTA",
}


def sha256(p: Path) -> str:
    with p.open("rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def huellas_registradas(prefijo: str) -> dict[str, str]:
    """archivo_relativo -> SHA-256 de data/reference/huellas_fuentes_externas.csv bajo `prefijo`."""
    with HUELLAS.open(encoding="utf-8", newline="") as f:
        return {
            r["archivo_relativo"]: r["sha256"]
            for r in csv.DictReader(f)
            if r["archivo_relativo"].startswith(prefijo)
        }


def descargar(nombre: str, destino: Path) -> None:
    if destino.exists():
        return
    url = BASE + nombre
    partes = urlsplit(url)
    if partes.scheme != "http" or partes.hostname != "siceef.ine.mx":
        raise ValueError(f"URL fuera de la fuente oficial: {url}")
    destino.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.7.1"})
    # Esquema y host fijos; el contenido se valida después con su SHA-256.
    with urllib.request.urlopen(req, timeout=300) as r:  # nosec B310
        datos = r.read()
    tmp = destino.with_name(destino.name + ".part")
    tmp.write_bytes(datos)
    tmp.replace(destino)


def leer_csv(p: Path) -> tuple[pl.DataFrame, str]:
    """Los CSV del SICEEF vienen en UTF-8 con BOM (2015) o en Windows-1252 (2009, 2012)."""
    crudo = p.read_bytes()
    try:
        texto, cod = crudo.decode("utf-8-sig"), "utf-8"
    except UnicodeDecodeError:
        texto, cod = crudo.decode("cp1252"), "cp1252"
    return pl.read_csv(io.StringIO(texto), infer_schema=False), cod


def a_entero(col: str) -> pl.Expr:
    return pl.col(col).str.strip_chars().replace("", None).cast(pl.Int64)


def estado_casilla(anio: int) -> pl.Expr:
    est = pl.col("ESTATUS_ACTA").fill_null("").str.to_uppercase()
    return (
        pl.when(est.str.contains("NO INSTALADA"))
        .then(pl.lit("no instalada"))
        .when(est.str.contains("PAQUETE NO ENTREGADO"))
        .then(pl.lit("paquete no recibido"))
        .when(est.str.contains("SIN ACTA"))
        .then(pl.lit("sin acta"))
        .when(est == "OTROS")
        .then(pl.lit("otros"))
        .otherwise(pl.lit("computada"))
    )


def normalizar(df: pl.DataFrame, anio: int) -> pl.DataFrame:
    partidos = [c for c in df.columns if c not in NO_PARTIDO]
    tipo_raw = pl.col("CASILLA").str.replace_all(r"\d", "")
    tipo = (
        pl.when(tipo_raw.is_in(["E", "EC"]))
        .then(pl.lit("E"))
        .when(tipo_raw.is_in(["S", "SMR"]))
        .then(pl.lit("S"))
        .otherwise(tipo_raw)
    )
    obs = pl.col("OBSERVACIONES") if "OBSERVACIONES" in df.columns else pl.lit(None, pl.String)
    ext = (
        pl.col("RUTA_ACTA").fill_null("").str.starts_with("JE2015E_")
        if anio == 2015
        else pl.lit(False)
    )
    return df.select(
        anio=pl.lit(anio, pl.Int16),
        CIRCUNSCRIPCION=a_entero("CIRCUNSCRIPCION").cast(pl.Int8),
        EDOCVE=a_entero("ID_ESTADO").cast(pl.Int8),
        distrito=a_entero("ID_DISTRITO").cast(pl.Int16),
        ID_MUNICIPIO=a_entero("ID_MUNICIPIO").cast(pl.Int16),
        MUNICIPIO=pl.col("MUNICIPIO"),
        SECCION=a_entero("SECCION").cast(pl.Int32),
        casilla_original=pl.col("CASILLA"),
        tipo_casilla=tipo,
        extraordinaria_contigua=tipo_raw == "EC",
        **{f"votos_{c.lower()}": a_entero(c) for c in partidos},
        no_registrados=a_entero("NUM_VOTOS_CAN_NREG"),
        votos_nulos=a_entero("NUM_VOTOS_NULOS"),
        total_votos=a_entero("TOTAL_VOTOS"),
        lista_casilla=a_entero("LISTA_NOMINAL"),
        estado=estado_casilla(anio),
        estatus_acta_original=pl.col("ESTATUS_ACTA"),
        tepjf_original=pl.col("TEPJF"),
        anulada_tepjf=pl.col("TEPJF").fill_null("").str.to_lowercase() == "anulada",
        observaciones_original=obs,
        eleccion_extraordinaria=ext,
        ruta_acta=pl.col("RUTA_ACTA"),
    )


def verificar_extraordinaria_2015(t: pl.DataFrame, raw_dir: Path) -> dict:
    """Las 445 filas de Ags-01 en DiputadosMR2015.csv deben ser las de DiputadosMR2015Ext.csv."""
    ext, _ = leer_csv(raw_dir / "DiputadosMR2015Ext.csv")
    clave = ["EDOCVE", "distrito", "SECCION", "casilla_original"]
    e = ext.select(
        EDOCVE=a_entero("ID_ESTADO").cast(pl.Int8),
        distrito=a_entero("ID_DISTRITO").cast(pl.Int16),
        SECCION=a_entero("SECCION").cast(pl.Int32),
        casilla_original=pl.col("CASILLA"),
        e_total=a_entero("TOTAL_VOTOS"),
        e_pan=a_entero("PAN"),
        e_lista=a_entero("LISTA_NOMINAL"),
    )
    m = t.filter(pl.col("eleccion_extraordinaria")).join(e, on=clave, how="full", coalesce=True)
    return {
        "filas_ext": e.height,
        "filas_mr_marcadas": int(t["eleccion_extraordinaria"].sum()),
        "sin_pareja": int(
            m.filter(pl.col("total_votos").is_null() | pl.col("e_total").is_null()).height
        ),
        "total_distinto": int(m.filter(pl.col("total_votos") != pl.col("e_total")).height),
        "pan_distinto": int(m.filter(pl.col("votos_pan") != pl.col("e_pan")).height),
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Actas por casilla 2009, 2012 y 2015 (SICEEF).")
    ap.add_argument("--descargar", action="store_true", help="baja los CSV que falten")
    bajar = ap.parse_args().descargar
    OUT.mkdir(parents=True, exist_ok=True)
    META.parent.mkdir(parents=True, exist_ok=True)
    esperadas = huellas_registradas("data/raw/computos_")
    meta = {
        "fuente": "INE, SICEEF, Descargar Bases de Datos",
        "pagina": "http://siceef.ine.mx/downloadDB.html",
        "archivos": {},
        "salidas": {},
    }
    for anio, f in FUENTES.items():
        raw_dir = RAW / f"computos_{anio}"
        for nombre in [f["principal"], *f["apoyo"]]:
            p = raw_dir / nombre
            if bajar:
                descargar(nombre, p)
            h = sha256(p)
            rel = p.relative_to(RAIZ).as_posix()
            if esperadas.get(rel) != h:
                raise SystemExit(
                    f"{rel}: SHA-256 {h} != {esperadas.get(rel, 'sin huella registrada')}"
                )
            meta["archivos"][nombre] = {
                "url": BASE + nombre,
                "ruta": rel,
                "bytes": p.stat().st_size,
                "sha256": h,
            }
        df, cod = leer_csv(raw_dir / f["principal"])
        t = normalizar(df, anio)
        if t.select(["EDOCVE", "distrito", "SECCION", "casilla_original"]).is_duplicated().any():
            raise SystemExit(
                f"{anio}: la clave (EDOCVE, distrito, SECCION, casilla_original) se repite"
            )
        votos = [c for c in t.columns if c.startswith("votos_")] + ["no_registrados"]
        suma = pl.sum_horizontal([pl.col(c).fill_null(0) for c in votos])
        descuadre = t.filter(suma != pl.col("total_votos").fill_null(0)).height
        destino = OUT / f"actas_{anio}.parquet"
        t.write_parquet(destino)
        info = {
            "eleccion": f["eleccion"],
            "archivo": f["principal"],
            "codificacion": cod,
            "filas": t.height,
            "columnas_votos": votos,
            "filas_suma_partes_distinta_de_total": descuadre,
            "parquet": destino.relative_to(RAIZ).as_posix(),
            "parquet_sha256": sha256(destino),
        }
        if anio == 2015:
            info["chequeo_extraordinaria_ags01"] = verificar_extraordinaria_2015(t, raw_dir)
        meta["salidas"][anio] = info
        print(anio, f["principal"], t.height, "filas;", "descuadres suma vs total:", descuadre)
    META.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print("meta ->", META.relative_to(RAIZ).as_posix())


if __name__ == "__main__":
    main()
