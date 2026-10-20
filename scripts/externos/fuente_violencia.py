"""Violencia por municipio, 2009-2026: homicidios del INEGI y delitos del SESNSP.

Fuentes
    - INEGI, Estadísticas de Defunciones Registradas (EDR), https://www.inegi.org.mx/programas/edr/
      Datos abiertos CSV por año de registro 2012-2024 y microdatos DBF quinquenales para
      2009-2011 (rutas en INEGI_CSV e INEGI_DBF, bajo https://www.inegi.org.mx/contenidos).
    - SESNSP, incidencia delictiva del fuero común, página
      https://www.gob.mx/sesnsp/acciones-y-programas/datos-abiertos-de-incidencia-delictiva
      Los archivos están en ligas anónimas de SharePoint del propio SESNSP
      (sspcgob-my.sharepoint.com, constante SESNSP): municipal 2015-2025, estatal (delitos y
      víctimas) 2015-2025 y municipal RNID 2026 (delitos y víctimas), corte septiembre de 2026.

Qué produce (data/processed/externos/)
    inegi_homicidios_municipio.parquet        cvegeo, anio (ocurrencia 2009-2024), homicidios
    inegi_homicidios_municipio_mes.parquet    cvegeo, anio, mes, homicidios
    inegi_homicidios_no_especificado.parquet  registros sin municipio o entidad válida
    sesnsp_delitos_municipio.parquet          cvegeo, anio, mes, delito, carpetas (2015-2025)
    sesnsp_rnid_2026_municipio.parquet        cvegeo, anio, mes, delito, carpetas, victimas (2026)
    verificaciones/verificaciones_violencia.json

    Para leerlos extrae miembros de los ZIP en data/raw/externos/violencia/*/extraido/ (unos
    3.3 GB). Homicidio = `presunto` (o `tipo_defun` desde 2022) igual a 2.

Cómo correrlo (desde la raíz del repo; solo usa polars y numpy, que están en uv.lock):
    uv tool run --from uv==0.13.1 uv run --locked python -I scripts/externos/fuente_violencia.py

    Sin --descargar usa los ZIP ya presentes en data/raw/externos/violencia/ y compara su SHA-256
    con data/reference/huellas_fuentes_externas.csv; si alguno difiere se detiene
    (--aceptar-huellas-distintas lo convierte en aviso). Con --descargar baja solo lo que falte.

Verificaciones (en el JSON)
    - Registros por año de registro: total, presunto = 2 y causa X85-Y09 (la definición con la
      que INEGI publica sus cifras); el año de registro coincide con el del archivo.
    - Rezago de registro por año de ocurrencia; registros sin entidad o municipio válido.
    - Claves contra data/reference/municipios_inegi.csv; claves que no aparecen en la EDR de un año.
    - SESNSP: total nacional del archivo municipal = archivo estatal, y víctimas del estatal.

Seguridad
    Solo descarga por HTTPS desde www.inegi.org.mx y sspcgob-my.sharepoint.com. La liga de
    SharePoint fija una cookie de sesión anónima que solo vive en memoria durante la descarga;
    no se guarda ni hay credenciales en el código. Se exige que la respuesta sea un ZIP. Los
    miembros se extraen con nombre saneado (sin rutas) y se leen como datos (CSV y DBF con un
    lector propio de ancho fijo); no se ejecuta nada descargado.
"""

from __future__ import annotations

import argparse
import contextlib
import csv
import hashlib
import http.cookiejar
import json
import shutil
import struct
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from collections import Counter
from pathlib import Path

import numpy as np
import polars as pl

RAIZ = next(
    p
    for p in [Path(__file__).resolve(), *Path(__file__).resolve().parents]
    if (p / "pyproject.toml").is_file()
)
HUELLAS = RAIZ / "data" / "reference" / "huellas_fuentes_externas.csv"
RAW = RAIZ / "data" / "raw" / "externos" / "violencia"
OUT = RAIZ / "data" / "processed" / "externos"
VERIF = OUT / "verificaciones"
REF = RAIZ / "data" / "reference" / "municipios_inegi.csv"
UA = {"User-Agent": "Mozilla/5.0"}
HOSTS_PERMITIDOS = {"www.inegi.org.mx", "sspcgob-my.sharepoint.com"}

# ---------------------------------------------------------------------------
# Fuentes
# ---------------------------------------------------------------------------
INEGI_BASE = "https://www.inegi.org.mx/contenidos"
# Rutas obtenidas del servicio de listado de la pagina https://www.inegi.org.mx/programas/edr/
# (pestanas "Datos abiertos" y "Microdatos"); ver api_lista_*.json en RAW/inegi.
INEGI_CSV = {
    2012: "/programas/edr/datosabiertos/defunciones/2012/defunciones_base_datos_2012_csv.zip",
    2013: "/programas/edr/datosabiertos/defunciones/2013/defunciones_base_datos_2013_csv.zip",
    2014: "/programas/edr/datosabiertos/defunciones/2014/defunciones_base_datos_2014_csv.zip",
    2015: "/programas/edr/datosabiertos/defunciones/2015/defunciones_base_datos_2015_csv.zip",
    2016: "/programas/edr/datosabiertos/defunciones/2016/defunciones_base_datos_2016_csv.zip",
    2017: "/programas/edr/datosabiertos/defunciones/2017/conjunto_de_datos_defunciones_generales_2017_csv.zip",
    2018: "/programas/edr/datosabiertos/defunciones/2018/conjunto_de_datos_defunciones_registradas_2018_csv.zip",
    2019: "/programas/edr/datosabiertos/defunciones/2019/conjunto_de_datos_defunciones_registradas_2019_csv.zip",
    2020: "/programas/edr/datosabiertos/defunciones/2020/conjunto_de_datos_defunciones_registradas_2020_csv.zip",
    2021: "/programas/edr/datosabiertos/defunciones/2021/conjunto_de_datos_defunciones_registradas_2021_csv.zip",
    2022: "/programas/edr/datosabiertos/defunciones/2022/conjunto_de_datos_defunciones_registradas_2022_csv.zip",
    2023: "/programas/edr/datosabiertos/defunciones/2023/conjunto_de_datos_defunciones_registradas_2023_csv.zip",
    2024: "/programas/edr/datosabiertos/defunciones/2024/conjunto_de_datos_edr2024_csv.zip",
}
# 2009-2011 no tienen "datos abiertos"; se usan los microdatos DBF quinquenales.
INEGI_DBF = {
    "2005_2009": "/programas/edr/microdatos/defunciones/datos/defunciones_generales_base_datos_2005_2009_dbf.zip",
    "2010_2014": "/programas/edr/microdatos/defunciones/datos/defunciones_generales_base_datos_2010_2014_dbf.zip",
}
DBF_ANIOS = {2009: "2005_2009", 2010: "2010_2014", 2011: "2010_2014"}

# Ligas publicas de SharePoint publicadas en
# https://www.gob.mx/sesnsp/acciones-y-programas/datos-abiertos-de-incidencia-delictiva
SESNSP = {
    "Municipal-Delitos-2015-2025_sep2026.zip": "https://sspcgob-my.sharepoint.com/:u:/g/personal/cni_sspc_gob_mx/IQAu5tcCiBJcTL-jaYhiGJ9gARjjlJZbdMayGLmKANKtAPE?e=jyDdan",
    "Estatal-Delitos-2015-2025_sep2026.zip": "https://sspcgob-my.sharepoint.com/:u:/g/personal/cni_sspc_gob_mx/IQDORskgZaqcSox3W83-KLHZAeTct2NCwzncsRTgnZTBRus?e=xq0UDc",
    "Estatal-Víctimas-2015-2025_sep2026.zip": "https://sspcgob-my.sharepoint.com/:u:/g/personal/cni_sspc_gob_mx/IQC7gjMDceDhTovbaLjJhCsPATp0-Oa3jyDBxpZ8qZm7Nkw?e=cNhRp0",
    "RNID-Delitos_Municipal-2026-sep2026.zip": "https://sspcgob-my.sharepoint.com/:u:/g/personal/cni_sspc_gob_mx/IQAWxhtiVoD8T4LohhlsmL92AYgpTW7ZQGiU8pXp5SbRk-8?e=HoR5ps",
    "RNID-Víctimas_Municipal-2026-sep2026.zip": "https://sspcgob-my.sharepoint.com/:u:/g/personal/cni_sspc_gob_mx/IQBckYHO8d6WTZ0ZaSCYDjLIAY8dl7y6o2XJc6mhl27rGiU?e=voPydR",
}
SESNSP_SHAREPOINT_HOST = "https://sspcgob-my.sharepoint.com"

MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
]

# Delitos que se extraen (subtipo comparable 2015-2025 y con la metodologia RNID 2026).
DELITOS = {
    "homicidio_doloso": ("Homicidio", "Homicidio doloso"),
    "feminicidio": ("Feminicidio", "Feminicidio"),
    "secuestro": ("Secuestro", "Secuestro"),
    "extorsion": ("Extorsión", "Extorsión"),
    "electorales": ("Electorales", "Electorales"),
}


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------
def sha256(path: Path) -> str:
    with path.open("rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def huellas_registradas(prefijo: str) -> dict[str, str]:
    """archivo_relativo -> SHA-256 de data/reference/huellas_fuentes_externas.csv bajo `prefijo`."""
    with HUELLAS.open(encoding="utf-8", newline="") as f:
        return {
            r["archivo_relativo"]: r["sha256"]
            for r in csv.DictReader(f)
            if r["archivo_relativo"].startswith(prefijo)
        }


def comprobar_huella(p: Path, esperadas: dict[str, str], estricto: bool) -> str:
    """Devuelve el SHA-256 de `p`; falla (o avisa) si no coincide con la huella registrada."""
    rel = p.relative_to(RAIZ).as_posix()
    h = sha256(p)
    esperado = esperadas.get(rel)
    if esperado == h:
        return h
    problema = "sin huella registrada" if esperado is None else f"SHA-256 {h} != {esperado}"
    if estricto:
        raise SystemExit(f"{rel}: {problema}")
    print(f"AVISO {rel}: {problema}", file=sys.stderr, flush=True)
    return h


def insumos() -> list[Path]:
    """ZIP que lee el script (los PDF de comunicados y reportes solo sirvieron para verificar a mano)."""
    zips = [RAW / "inegi" / Path(r).name for r in [*INEGI_CSV.values(), *INEGI_DBF.values()]]
    return zips + [RAW / "sesnsp" / n for n in SESNSP]


def _validar_url(url: str) -> None:
    partes = urllib.parse.urlsplit(url)
    if partes.scheme != "https" or partes.hostname not in HOSTS_PERMITIDOS:
        raise ValueError(f"URL fuera de las fuentes oficiales: {url}")


def _descargar(url: str, destino: Path, opener=None) -> None:
    _validar_url(url)
    opener = opener or urllib.request.build_opener()
    req = urllib.request.Request(url, headers=UA)
    tmp = destino.with_suffix(destino.suffix + ".part")
    with opener.open(req, timeout=900) as r, tmp.open("wb") as f:
        shutil.copyfileobj(r, f)
    if tmp.read_bytes()[:2] != b"PK":
        tmp.unlink()
        raise ValueError(f"{url} no devolvio un ZIP (posible pagina de error)")
    tmp.rename(destino)


def descargar_sharepoint(share_url: str, destino: Path) -> None:
    """Liga anonima de OneDrive: la primera respuesta fija la cookie FedAuth y
    redirige a onedrive.aspx?id=<ruta>; con esa ruta se pide download.aspx."""
    _validar_url(share_url)
    jar = http.cookiejar.CookieJar()  # solo en memoria; no se escribe a disco

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None

    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), NoRedirect)
    try:
        op.open(urllib.request.Request(share_url, headers=UA), timeout=60)
        raise RuntimeError("se esperaba una redireccion")
    except urllib.error.HTTPError as e:
        loc = e.headers["Location"]
    ruta = urllib.parse.parse_qs(urllib.parse.urlparse(loc).query)["id"][0]
    url = (
        f"{SESNSP_SHAREPOINT_HOST}/personal/cni_sspc_gob_mx/_layouts/15/download.aspx?SourceUrl="
        + urllib.parse.quote(ruta, safe="")
    )
    _descargar(url, destino, urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar)))


def descargar_todo() -> None:
    (RAW / "inegi").mkdir(parents=True, exist_ok=True)
    (RAW / "sesnsp").mkdir(parents=True, exist_ok=True)
    for ruta in list(INEGI_CSV.values()) + list(INEGI_DBF.values()):
        d = RAW / "inegi" / Path(ruta).name
        if not d.exists():
            print("descargando", d.name, flush=True)
            _descargar(INEGI_BASE + ruta, d)
    for nombre, url in SESNSP.items():
        d = RAW / "sesnsp" / nombre
        if not d.exists():
            print("descargando", nombre, flush=True)
            descargar_sharepoint(url, d)


def nombre_seguro(nombre: str) -> str:
    with contextlib.suppress(UnicodeEncodeError, UnicodeDecodeError):
        nombre = nombre.encode("cp437").decode("utf-8")
    s = unicodedata.normalize("NFKD", Path(nombre).name).encode("ascii", "ignore").decode()
    return "".join(c if c.isalnum() or c in "._-" else "_" for c in s)


def extraer_miembro(zip_path: Path, predicado, destino_dir: Path) -> list[Path]:
    """Extrae (sin ejecutar nada) los miembros que cumplen el predicado, con nombre ASCII."""
    destino_dir.mkdir(parents=True, exist_ok=True)
    salida = []
    with zipfile.ZipFile(zip_path) as zf:
        for info in zf.infolist():
            if info.is_dir() or not predicado(info.filename):
                continue
            d = destino_dir / nombre_seguro(info.filename)
            if not d.exists() or d.stat().st_size != info.file_size:
                with zf.open(info) as src, d.open("wb") as dst:
                    shutil.copyfileobj(src, dst)
            salida.append(d)
    return salida


def catalogo_ref() -> set[str]:
    ref = pl.read_csv(
        REF, schema_overrides={"CVEGEO": pl.String, "CVE_ENT": pl.String, "CVE_MUN": pl.String}
    )
    return set(ref["CVEGEO"].to_list())


# ---------------------------------------------------------------------------
# INEGI
# ---------------------------------------------------------------------------
def leer_dbf(path: Path, campos: list[str]) -> pl.DataFrame:
    """Lector minimo de dBase III (registros de ancho fijo); solo devuelve texto."""
    data = path.read_bytes()
    n, hlen, rlen = struct.unpack("<IHH", data[4:12])
    pos, off, defs = 32, 1, {}
    while data[pos] != 0x0D:
        nombre = data[pos : pos + 11].split(b"\0")[0].decode("ascii").lower()
        largo = data[pos + 16]
        defs[nombre] = (off, largo)
        off += largo
        pos += 32
    if off != rlen:
        raise ValueError(f"{path.name}: suma de campos {off} != largo de registro {rlen}")
    reg = np.frombuffer(data, dtype=np.uint8, count=n * rlen, offset=hlen).reshape(n, rlen)
    borrado = reg[:, 0] == ord("*")
    cols = {}
    for c in campos:
        o, largo = defs[c]
        raw = np.ascontiguousarray(reg[~borrado, o : o + largo]).view(f"S{largo}").ravel()
        cols[c] = pl.Series(c, raw).cast(pl.String).str.strip_chars()
    return pl.DataFrame(cols)


CAMPOS = [
    "ent_regis",
    "mun_regis",
    "ent_resid",
    "mun_resid",
    "ent_ocurr",
    "mun_ocurr",
    "anio_ocur",
    "mes_ocurr",
    "anio_regis",
    "presunto",
    "causa_def",
]


def inegi_anio_registro(anio: int) -> pl.DataFrame:
    """Devuelve los campos minimos de todas las defunciones registradas en `anio`."""
    if anio in DBF_ANIOS:
        z = RAW / "inegi" / Path(INEGI_DBF[DBF_ANIOS[anio]]).name
        yy = f"{anio % 100:02d}"
        [p] = extraer_miembro(
            z,
            lambda f: f.upper().endswith(f"DEFUN{yy}.DBF") and f"_{anio}_" in f,
            RAW / "inegi" / "extraido" / "dbf" / str(anio),
        )
        df = leer_dbf(p, CAMPOS)
        fuente = f"{z.name}::{p.name}"
    else:
        z = RAW / "inegi" / Path(INEGI_CSV[anio]).name
        miembros = extraer_miembro(
            z,
            lambda f: (
                f.startswith("conjunto_de_datos/")
                and f.lower().endswith(".csv")
                and "bitacora" not in f.lower()
            ),
            RAW / "inegi" / "extraido" / "csv" / str(anio),
        )
        [p] = miembros
        df = pl.read_csv(p, infer_schema=False, encoding="utf8-lossy")
        df = df.rename({c: c.lstrip("\ufeff").strip().lower() for c in df.columns})
        if "tipo_defun" in df.columns:  # nemonico desde 2022 (diccionario oficial)
            df = df.rename({"tipo_defun": "presunto"})
        df = df.select([pl.col(c).str.strip_chars() for c in CAMPOS])
        fuente = f"{z.name}::{p.name}"
    df = df.with_columns(
        pl.col(c).cast(pl.Int32, strict=True)
        for c in [
            "ent_regis",
            "mun_regis",
            "ent_resid",
            "mun_resid",
            "ent_ocurr",
            "mun_ocurr",
            "anio_ocur",
            "mes_ocurr",
            "anio_regis",
            "presunto",
        ]
    )
    otros = df.filter(pl.col("anio_regis") != anio).height
    if otros:
        raise ValueError(f"{fuente}: {otros} registros con anio_regis distinto de {anio}")
    return df.with_columns(pl.lit(anio).alias("archivo"), pl.lit(fuente).alias("fuente"))


def es_x85_y09(col: pl.Expr) -> pl.Expr:
    c3 = col.str.slice(0, 3)
    return (c3 >= "X85") & (c3 <= "Y09")


def procesar_inegi(ref: set[str], verif: dict) -> None:
    partes = []
    reg_por_anio = {}
    presentes = []  # claves municipales que aparecen en el archivo anual (cualquier causa)
    for anio in range(2009, 2025):
        df = inegi_anio_registro(anio)
        codigos = set()
        for e, m in (
            ("ent_regis", "mun_regis"),
            ("ent_resid", "mun_resid"),
            ("ent_ocurr", "mun_ocurr"),
        ):
            codigos |= set(
                df.select(
                    pl.col(e).cast(pl.String).str.zfill(2) + pl.col(m).cast(pl.String).str.zfill(3)
                )
                .to_series()
                .to_list()
            )
        presentes.append(
            pl.DataFrame({"cvegeo": sorted(codigos)}).with_columns(
                pl.lit(anio, dtype=pl.Int32).alias("anio")
            )
        )
        reg_por_anio[anio] = {
            "registros_totales": df.height,
            "presunto_2": df.filter(pl.col("presunto") == 2).height,
            "causa_X85_Y09": df.filter(es_x85_y09(pl.col("causa_def"))).height,
            "presunto_2_y_X85_Y09": df.filter(
                (pl.col("presunto") == 2) & es_x85_y09(pl.col("causa_def"))
            ).height,
            "valores_presunto": dict(sorted(Counter(df["presunto"].to_list()).items())),
        }
        print("INEGI", anio, reg_por_anio[anio]["presunto_2"], flush=True)
        partes.append(df.filter(pl.col("presunto") == 2))
    verif["inegi_por_anio_registro"] = reg_por_anio

    hom = pl.concat(partes)
    hom = hom.with_columns(
        (
            pl.col("ent_ocurr").cast(pl.String).str.zfill(2)
            + pl.col("mun_ocurr").cast(pl.String).str.zfill(3)
        ).alias("cvegeo")
    )
    valido = (pl.col("ent_ocurr").is_between(1, 32)) & (pl.col("mun_ocurr") != 999)
    # Registros sin municipio/entidad de ocurrencia valida
    noesp = (
        hom.filter(~valido)
        .with_columns(
            pl.when(pl.col("ent_ocurr") == 99)
            .then(pl.lit("entidad_no_especificada"))
            .when(pl.col("ent_ocurr") > 32)
            .then(pl.lit("extranjero_u_otro_pais(33-35)"))
            .otherwise(pl.lit("municipio_no_especificado(999)"))
            .alias("motivo"),
            pl.col("ent_ocurr").cast(pl.String).str.zfill(2).alias("cve_ent_ocurrencia"),
            pl.col("ent_regis").cast(pl.String).str.zfill(2).alias("cve_ent_registro"),
        )
        .group_by("anio_ocur", "cve_ent_ocurrencia", "cve_ent_registro", "motivo")
        .agg(pl.len().cast(pl.Int64).alias("homicidios"))
        .rename({"anio_ocur": "anio"})
        .sort("anio", "cve_ent_ocurrencia", "cve_ent_registro", "motivo")
    )
    noesp.write_parquet(OUT / "inegi_homicidios_no_especificado.parquet")

    ok = hom.filter(valido & pl.col("anio_ocur").is_between(2009, 2024))
    anual = (
        ok.group_by("cvegeo", "anio_ocur")
        .agg(pl.len().cast(pl.Int64).alias("homicidios"))
        .rename({"anio_ocur": "anio"})
    )
    # Malla completa catalogo x anio con ceros explicitos (ausencia de registros = 0 registrados)
    malla = pl.DataFrame({"cvegeo": sorted(ref)}).join(
        pl.DataFrame({"anio": list(range(2009, 2025))}, schema={"anio": pl.Int32}), how="cross"
    )
    anual = (
        malla.join(anual, on=["cvegeo", "anio"], how="full", coalesce=True)
        .with_columns(
            pl.col("homicidios").fill_null(0),
            pl.col("cvegeo").is_in(list(ref)).alias("cvegeo_en_catalogo_ref"),
        )
        .join(
            pl.concat(presentes).with_columns(pl.lit(True).alias("clave_presente_en_edr_anio")),
            on=["cvegeo", "anio"],
            how="left",
        )
        .with_columns(pl.col("clave_presente_en_edr_anio").fill_null(False))
        .sort("cvegeo", "anio")
    )
    verif["inegi_ceros_sin_clave_en_edr"] = (
        anual.filter(~pl.col("clave_presente_en_edr_anio"))
        .group_by("cvegeo")
        .agg(
            pl.col("anio").min().alias("desde"),
            pl.col("anio").max().alias("hasta"),
            pl.len().alias("anios"),
        )
        .sort("cvegeo")
        .to_dicts()
    )
    anual.write_parquet(OUT / "inegi_homicidios_municipio.parquet")

    mensual = (
        ok.filter(pl.col("mes_ocurr").is_between(1, 12))
        .group_by("cvegeo", "anio_ocur", "mes_ocurr")
        .agg(pl.len().cast(pl.Int64).alias("homicidios"))
        .rename({"anio_ocur": "anio", "mes_ocurr": "mes"})
        .sort("cvegeo", "anio", "mes")
    )
    mensual.write_parquet(OUT / "inegi_homicidios_municipio_mes.parquet")

    # Verificaciones de ocurrencia
    por_ocur = hom.group_by("anio_ocur").agg(pl.len().alias("n")).sort("anio_ocur")
    verif["inegi_presunto2_por_anio_ocurrencia_todos_los_registros"] = dict(
        zip(por_ocur["anio_ocur"].to_list(), por_ocur["n"].to_list(), strict=False)
    )
    rezago = (
        hom.filter(pl.col("anio_ocur").is_between(2009, 2024))
        .with_columns((pl.col("anio_regis") - pl.col("anio_ocur")).alias("rezago"))
        .group_by("anio_ocur")
        .agg(
            pl.len().alias("total"),
            (pl.col("rezago") == 0).sum().alias("mismo_anio"),
            (pl.col("rezago") >= 1).sum().alias("anio_siguiente_o_despues"),
        )
        .sort("anio_ocur")
    )
    verif["inegi_rezago_registro_por_anio_ocurrencia"] = rezago.to_dicts()
    verif["inegi_mes_ocurr_no_especificado"] = ok.filter(
        ~pl.col("mes_ocurr").is_between(1, 12)
    ).height
    verif["inegi_ent_no_especificada_por_entidad_registro"] = (
        noesp.filter(
            pl.col("anio").is_between(2009, 2024) & (pl.col("motivo") == "entidad_no_especificada")
        )
        .group_by("anio", "cve_ent_registro")
        .agg(pl.col("homicidios").sum())
        .filter(pl.col("homicidios") >= 50)
        .sort("anio", "cve_ent_registro")
        .to_dicts()
    )
    verif["inegi_mun999_por_entidad"] = (
        noesp.filter(
            pl.col("anio").is_between(2009, 2024)
            & (pl.col("motivo") == "municipio_no_especificado(999)")
        )
        .group_by("anio", "cve_ent_ocurrencia")
        .agg(pl.col("homicidios").sum())
        .filter(pl.col("homicidios") >= 20)
        .sort("anio", "cve_ent_ocurrencia")
        .to_dicts()
    )
    verif["inegi_no_especificado_por_anio_ocurrencia"] = (
        noesp.filter(pl.col("anio").is_between(2009, 2024))
        .group_by("anio", "motivo")
        .agg(pl.col("homicidios").sum())
        .sort("anio", "motivo")
        .to_dicts()
    )
    fuera = (
        anual.filter(~pl.col("cvegeo_en_catalogo_ref"))
        .group_by("cvegeo")
        .agg(pl.col("homicidios").sum())
        .sort("cvegeo")
    )
    verif["inegi_claves_fuera_de_catalogo"] = fuera.to_dicts()
    verif["inegi_total_parquet_por_anio"] = dict(
        anual.group_by("anio").agg(pl.col("homicidios").sum()).sort("anio").iter_rows()
    )


# ---------------------------------------------------------------------------
# SESNSP
# ---------------------------------------------------------------------------
def leer_sesnsp_csv(zip_name: str, encoding: str) -> pl.DataFrame:
    [p] = extraer_miembro(
        RAW / "sesnsp" / zip_name, lambda f: f.lower().endswith(".csv"), RAW / "sesnsp" / "extraido"
    )
    df = pl.read_csv(p, infer_schema=False, encoding=encoding)
    return df.rename({c: c.lstrip("\ufeff").strip() for c in df.columns})


def a_largo(df: pl.DataFrame, claves: list[str], valor: str) -> pl.DataFrame:
    df = df.with_columns(
        pl.col(m).str.strip_chars().replace("", None).cast(pl.Int64) for m in MESES
    )
    largo = df.unpivot(index=claves, on=MESES, variable_name="mes_nombre", value_name=valor)
    return largo.with_columns(
        pl.col("mes_nombre")
        .replace_strict({m: i + 1 for i, m in enumerate(MESES)}, return_dtype=pl.Int8)
        .alias("mes")
    ).drop("mes_nombre")


def etiqueta_delito(df: pl.DataFrame) -> pl.DataFrame:
    expr = pl.lit(None, dtype=pl.String)
    for k, (tipo, sub) in reversed(DELITOS.items()):
        expr = (
            pl.when((pl.col("Tipo de delito") == tipo) & (pl.col("Subtipo de delito") == sub))
            .then(pl.lit(k))
            .otherwise(expr)
        )
    return df.with_columns(expr.alias("delito")).filter(pl.col("delito").is_not_null())


def etiqueta_rnid(df: pl.DataFrame) -> pl.DataFrame:
    """Metodologia RNID (2026): se excluyen tentativas, segun la Nota metodologica de
    comparacion historica; extorsion = presencial + por otros medios; secuestro = todos
    sus subtipos (la nota no menciona secuestro: comparabilidad no verificada)."""
    t, sub = pl.col("Tipo de delito"), pl.col("Subtipo de delito")
    tent = sub.str.starts_with("Tentativa")
    expr = (
        pl.when((t == "Homicidio") & (sub == "Homicidio doloso"))
        .then(pl.lit("homicidio_doloso"))
        .when((t == "Feminicidio") & (sub == "Feminicidio"))
        .then(pl.lit("feminicidio"))
        .when((t == "Secuestro") & ~tent)
        .then(pl.lit("secuestro"))
        .when((t == "Extorsión") & ~tent)
        .then(pl.lit("extorsion"))
        .when((t == "Electorales") & (sub == "Electorales"))
        .then(pl.lit("electorales"))
        .otherwise(pl.lit(None, dtype=pl.String))
    )
    return df.with_columns(expr.alias("delito")).filter(pl.col("delito").is_not_null())


def procesar_sesnsp(ref: set[str], verif: dict) -> None:
    mun = leer_sesnsp_csv("Municipal-Delitos-2015-2025_sep2026.zip", "latin1")
    claves_hom = [
        "Año",
        "Clave_Ent",
        "Cve. Municipio",
        "Tipo de delito",
        "Subtipo de delito",
        "Modalidad",
    ]
    verif["sesnsp_subtipos_extraidos"] = (
        etiqueta_delito(mun)
        .select("delito", "Tipo de delito", "Subtipo de delito", "Modalidad")
        .unique()
        .sort("delito", "Modalidad")
        .to_dicts()
    )
    sel = etiqueta_delito(mun)
    largo = a_largo(sel, claves_hom + ["delito"], "carpetas")
    largo = largo.with_columns(
        pl.col("Año").cast(pl.Int32).alias("anio"),
        pl.col("Cve. Municipio").str.strip_chars().str.zfill(5).alias("cvegeo"),
    )
    nulos = (
        largo.filter(pl.col("carpetas").is_null()).group_by("anio", "mes").len().sort("anio", "mes")
    )
    verif["sesnsp_celdas_mes_vacias"] = nulos.to_dicts()
    out = (
        largo.group_by("cvegeo", "anio", "mes", "delito")
        .agg(pl.col("carpetas").sum())
        .with_columns(pl.col("cvegeo").is_in(list(ref)).alias("cvegeo_en_catalogo_ref"))
        .sort("cvegeo", "anio", "mes", "delito")
    )
    out.write_parquet(OUT / "sesnsp_delitos_municipio.parquet")

    nacional_mun = (
        out.group_by("anio", "delito").agg(pl.col("carpetas").sum()).sort("delito", "anio")
    )
    # Archivo estatal (producto independiente del mismo SESNSP) para cotejar
    est = leer_sesnsp_csv("Estatal-Delitos-2015-2025_sep2026.zip", "latin1")
    est_l = a_largo(etiqueta_delito(est), ["Año", "Clave_Ent", "delito", "Modalidad"], "carpetas")
    nacional_est = est_l.group_by(pl.col("Año").cast(pl.Int32).alias("anio"), "delito").agg(
        pl.col("carpetas").sum()
    )
    vic = leer_sesnsp_csv("Estatal-Víctimas-2015-2025_sep2026.zip", "latin1")
    vic_l = a_largo(
        etiqueta_delito(vic),
        ["Año", "Clave_Ent", "delito", "Modalidad", "Sexo", "Rango de edad"],
        "victimas",
    )
    nacional_vic = vic_l.group_by(pl.col("Año").cast(pl.Int32).alias("anio"), "delito").agg(
        pl.col("victimas").sum()
    )
    comp = (
        nacional_mun.join(nacional_est, on=["anio", "delito"], suffix="_estatal")
        .join(nacional_vic, on=["anio", "delito"], how="left")
        .sort("delito", "anio")
    )
    verif["sesnsp_nacional_municipal_vs_estatal"] = comp.to_dicts()
    # Pre-jornada (enero-mayo) por anio electoral, nacional
    pre = (
        out.filter(pl.col("anio").is_in([2015, 2018, 2021, 2024]) & (pl.col("mes") <= 5))
        .group_by("anio", "delito")
        .agg(pl.col("carpetas").sum())
        .sort("delito", "anio")
    )
    verif["sesnsp_nacional_enero_mayo_anios_electorales"] = pre.to_dicts()
    cves = out.select("cvegeo").unique()
    verif["sesnsp_municipios_por_anio"] = dict(
        out.group_by("anio").agg(pl.col("cvegeo").n_unique()).sort("anio").iter_rows()
    )
    verif["sesnsp_claves_especiales_por_anio"] = (
        out.filter(~pl.col("cvegeo_en_catalogo_ref"))
        .group_by("cvegeo", "anio")
        .agg(pl.col("carpetas").sum())
        .filter(pl.col("carpetas") > 0)
        .sort("cvegeo", "anio")
        .to_dicts()
    )
    verif["sesnsp_catalogo_ausente_por_anio"] = {
        int(a): sorted(ref - set(out.filter(pl.col("anio") == a)["cvegeo"].unique().to_list()))
        for a in range(2015, 2026)
    }
    fuera = (
        out.filter(~pl.col("cvegeo_en_catalogo_ref"))
        .group_by("cvegeo")
        .agg(pl.col("carpetas").sum())
        .sort("cvegeo")
    )
    nombres = mun.select(
        pl.col("Cve. Municipio").str.zfill(5).alias("cvegeo"), "Municipio", "Entidad"
    ).unique()
    verif["sesnsp_claves_fuera_de_catalogo"] = fuera.join(
        nombres, on="cvegeo", how="left"
    ).to_dicts()
    verif["sesnsp_claves_catalogo_sin_registro"] = sorted(ref - set(cves["cvegeo"].to_list()))

    # 2026, metodologia RNID: municipal con victimas (solo ene-sep 2026)
    d26 = leer_sesnsp_csv("RNID-Delitos_Municipal-2026-sep2026.zip", "utf8")
    v26 = leer_sesnsp_csv("RNID-Víctimas_Municipal-2026-sep2026.zip", "utf8")
    verif["rnid2026_subtipos"] = (
        d26.filter(pl.col("Tipo de delito").is_in([t for t, _ in DELITOS.values()]))
        .select("Tipo de delito", "Subtipo de delito")
        .unique()
        .sort("Tipo de delito", "Subtipo de delito")
        .to_dicts()
    )
    k = ["Año", "Cve. Municipio", "delito"]
    d26l = (
        a_largo(etiqueta_rnid(d26), k + ["Modalidad"], "carpetas")
        .group_by(k + ["mes"])
        .agg(pl.col("carpetas").sum())
    )
    v26l = (
        a_largo(etiqueta_rnid(v26), k + ["Modalidad", "Sexo", "Rango de edad"], "victimas")
        .group_by(k + ["mes"])
        .agg(pl.col("victimas").sum())
    )
    r26 = (
        d26l.join(v26l, on=k + ["mes"], how="full", coalesce=True)
        .with_columns(
            pl.col("Año").cast(pl.Int32).alias("anio"),
            pl.col("Cve. Municipio").str.strip_chars().str.zfill(5).alias("cvegeo"),
        )
        .drop("Año", "Cve. Municipio")
        .filter(pl.col("mes") <= 9)
        .select("cvegeo", "anio", "mes", "delito", "carpetas", "victimas")
        .sort("cvegeo", "mes", "delito")
    )
    r26.write_parquet(OUT / "sesnsp_rnid_2026_municipio.parquet")
    verif["rnid2026_nacional_ene_sep"] = (
        r26.group_by("delito")
        .agg(pl.col("carpetas").sum(), pl.col("victimas").sum())
        .sort("delito")
        .to_dicts()
    )


def manifiesto() -> dict:
    archivos = {}
    for p in sorted(RAW.rglob("*")):
        if p.is_file() and "extraido" not in p.parts:
            archivos[str(p.relative_to(RAW))] = {"bytes": p.stat().st_size, "sha256": sha256(p)}
    return archivos


def main() -> None:
    ap = argparse.ArgumentParser(description="Violencia municipal: INEGI EDR y SESNSP.")
    ap.add_argument("--descargar", action="store_true", help="descarga lo que falte")
    ap.add_argument(
        "--aceptar-huellas-distintas",
        action="store_true",
        help="avisa en vez de fallar si un ZIP no coincide con huellas_fuentes_externas.csv",
    )
    args = ap.parse_args()
    if args.descargar:
        descargar_todo()
    esperadas = huellas_registradas("data/raw/externos/violencia/")
    for p in insumos():
        comprobar_huella(p, esperadas, not args.aceptar_huellas_distintas)
    OUT.mkdir(parents=True, exist_ok=True)
    VERIF.mkdir(parents=True, exist_ok=True)
    ref = catalogo_ref()
    verif: dict = {}
    procesar_inegi(ref, verif)
    procesar_sesnsp(ref, verif)
    verif["manifiesto_sha256"] = manifiesto()
    (VERIF / "verificaciones_violencia.json").write_text(
        json.dumps(verif, ensure_ascii=False, indent=1, default=str), encoding="utf-8"
    )
    print("listo", flush=True)


if __name__ == "__main__":
    main()
