"""Población municipal del INEGI: Censo 2010, Encuesta Intercensal 2015 y Censo 2020.

Fuente
    INEGI, sitio oficial https://www.inegi.org.mx. Las rutas salen del servicio que alimenta la
    pestaña "Tabulados" (https://www.inegi.org.mx/app/api/descarga/componente/descargamasiva/
    lista/archivoscompaginacion, idBiinegi 3001 = Censo 2020, 487 = Censo 2010, 1714 =
    Intercensal 2015; campo `pathLogico`). URL de cada archivo = BASE + pathLogico + extensión:
    - ITER 2020: https://www.inegi.org.mx/contenidos/programas/ccpv/2020/datosabiertos/iter/iter_00_cpv2020_csv.zip
    - ITER 2010: https://www.inegi.org.mx/contenidos/programas/ccpv/2010/datosabiertos/iter_nal_2010_csv.zip
    - Tabulados 2020 (básico y ampliado), 2010 (básico municipal) y 2015 (Intercensal) por
      entidad; la lista completa la arma `manifiesto()` (388 archivos, unos 430 MB).

Qué produce
    data/processed/externos/inegi_municipal_{2010,2015,2020}.parquet  una fila por municipio
    data/processed/externos/inegi_edad_sexo.parquet        largo, grupos quinquenales
    data/processed/externos/inegi_edad_desplegada.parquet  largo, edad simple (2010 y 2020)
    data/processed/externos/verificaciones/inegi_verificaciones.json

Cómo correrlo (desde la raíz del repo; openpyxl y xlrd no están en uv.lock, por eso se usa un
entorno efímero que no toca pyproject.toml ni uv.lock):
    uv tool run --from uv==0.13.1 uv run --no-project --with polars==2.0.0 \
        --with openpyxl==3.1.5 --with xlrd==2.0.1 python -I scripts/externos/fuente_inegi.py

    Los crudos se guardan en data/raw/externos/inegi/. Si ya están, no se vuelven a descargar.
    Antes de procesar se compara el SHA-256 de cada crudo con
    data/reference/huellas_fuentes_externas.csv; si alguno difiere, el script se detiene
    (--aceptar-huellas-distintas lo convierte en aviso).

Verificaciones (resultados en el JSON)
    - El servidor responde 200 + HTML cuando un archivo no existe: se detecta y se falla.
    - Cada columna leída de un tabulado se valida por el texto de su encabezado.
    - Suma de municipios = fila nacional del ITER (2010, 2020) y = tabulado nacional (2015, 2020).
    - Suma de municipios = total estatal del ITER en las 32 entidades.
    - Edad por sexo suma la población total; 18+ por edad simple = P_18YMAS_M/F del ITER;
      quinquenios del ITER 2020 = quinquenios armados desde edad simple.
    - Migración del tabulado = PNACOE, PRESOE y P_5YMAS del ITER.

Seguridad
    Solo descarga por HTTPS desde www.inegi.org.mx. Los archivos se leen como datos (CSV dentro
    de ZIP, XLS y XLSX); no se ejecuta nada descargado.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import sys
import time
import urllib.request
import zipfile
from pathlib import Path
from urllib.parse import urlsplit

import openpyxl
import polars as pl
import xlrd

RAIZ = next(
    p
    for p in [Path(__file__).resolve(), *Path(__file__).resolve().parents]
    if (p / "pyproject.toml").is_file()
)
HUELLAS = RAIZ / "data" / "reference" / "huellas_fuentes_externas.csv"
BASE = "https://www.inegi.org.mx/contenidos"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120 Safari/537.36"
)

# Abreviaturas por entidad tal como aparecen en pathLogico del API (índice 0 = entidad 01).
AB_2020 = [
    "ags",
    "bc",
    "bcs",
    "cam",
    "coa",
    "col",
    "chs",
    "chh",
    "cdmx",
    "dgo",
    "gto",
    "gro",
    "hgo",
    "jal",
    "mex",
    "mic",
    "mor",
    "nay",
    "nl",
    "m_oax",
    "pue",
    "qro",
    "qroo",
    "slp",
    "sin",
    "son",
    "tab",
    "tam",
    "tla",
    "ver",
    "yuc",
    "zac",
]
AB_2015 = [
    "ags",
    "bc",
    "bcs",
    "cam",
    "coah",
    "col",
    "chis",
    "chih",
    "cdmx",
    "dgo",
    "gto",
    "gro",
    "hgo",
    "jal",
    "mex",
    "mich",
    "mor",
    "nay",
    "nl",
    "oax",
    "pue",
    "qro",
    "qroo",
    "slp",
    "sin",
    "son",
    "tab",
    "tamps",
    "tlax",
    "ver",
    "yuc",
    "zac",
]
TEMAS_2015 = [
    "01_poblacion",
    "04_migracion",
    "05_etnicidad",
    "06_educacion",
    "07_servicios_de_salud",
    "14_vivienda",
]


# --------------------------------------------------------------------------- descarga


def manifiesto() -> list[tuple[str, str]]:
    """(ruta relativa local, URL) de cada archivo usado."""
    m = [
        (
            "2020/iter_00_cpv2020_csv.zip",
            f"{BASE}/programas/ccpv/2020/datosabiertos/iter/iter_00_cpv2020_csv.zip",
        ),
        (
            "2010/iter_nal_2010_csv.zip",
            f"{BASE}/programas/ccpv/2010/datosabiertos/iter_nal_2010_csv.zip",
        ),
        (
            "2020/tabulados/cpv2020_b_eum_01_poblacion.xlsx",
            f"{BASE}/programas/ccpv/2020/tabulados/cpv2020_b_eum_01_poblacion.xlsx",
        ),
        (
            "2015/tabulados/01_poblacion.xls",
            f"{BASE}/programas/intercensal/2015/tabulados/01_poblacion.xls",
        ),
    ]
    for ab in AB_2020:
        for t in ("01_poblacion", "04_migracion"):
            m.append(
                (
                    f"2020/tabulados/cpv2020_b_{ab}_{t}.xlsx",
                    f"{BASE}/programas/ccpv/2020/tabulados/cpv2020_b_{ab}_{t}.xlsx",
                )
            )
        a = ab.replace("m_", "")
        m.append(
            (
                f"2020/tabulados_ampliado/cpv2020_a_{a}_05_etnicidad.xlsx",
                f"{BASE}/programas/ccpv/2020/tabulados/ampliado/cpv2020_a_{a}_05_etnicidad.xlsx",
            )
        )
    for i in range(1, 33):
        for t in ("01_03B", "04_02B", "04_04B"):
            m.append(
                (
                    f"2010/tabulados/{t}_MUNICIPAL_{i:02d}.xls",
                    f"{BASE}/programas/ccpv/2010/tabulados/Basico/{t}_MUNICIPAL_{i:02d}.xls",
                )
            )
    for ab in AB_2015:
        for t in TEMAS_2015:
            m.append(
                (
                    f"2015/tabulados/{t}_{ab}.xls",
                    f"{BASE}/programas/intercensal/2015/tabulados/{t}_{ab}.xls",
                )
            )
    return m


def descargar(raw: Path, rel: str, url: str, intentos: int = 4) -> Path:
    destino = raw / rel
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    partes = urlsplit(url)
    if partes.scheme != "https" or partes.hostname != "www.inegi.org.mx":
        raise ValueError(f"URL fuera de la fuente oficial: {url}")
    destino.parent.mkdir(parents=True, exist_ok=True)
    print("descargando", rel, flush=True)
    ultimo = None
    for k in range(intentos):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            # Esquema y host validados arriba.
            with urllib.request.urlopen(req, timeout=300) as r:  # nosec B310
                ctype = r.headers.get("Content-Type", "")
                datos = r.read()
            # El servidor responde 200 + HTML cuando el archivo no existe.
            if "text/html" in ctype or datos[:15].lower().startswith(b"<!doctype html"):
                raise RuntimeError("respuesta HTML (archivo inexistente)")
            tmp = destino.with_name(destino.name + ".part")
            tmp.write_bytes(datos)
            tmp.rename(destino)
            return destino
        except Exception as e:  # noqa: BLE001
            ultimo = e
            time.sleep(3 * (k + 1))
    raise RuntimeError(f"No se pudo descargar {url}: {ultimo}")


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


# --------------------------------------------------------------------------- lectura de tabulados

ENT_RE = re.compile(r"^(\d{2})\s")
MUN_RE = re.compile(r"^(\d{3})\s")


def norm(v) -> str:
    return "" if v is None else str(v).replace("\xa0", " ").strip()


def num(v):
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = norm(v).replace(" ", "").replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def filas(path: Path, hoja: str) -> list[list]:
    if path.suffix == ".xlsx":
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        try:
            return [list(r) for r in wb[hoja].iter_rows(values_only=True)]
        finally:
            wb.close()
    wb = xlrd.open_workbook(str(path))
    sh = wb.sheet_by_name(hoja) if isinstance(hoja, str) else wb.sheet_by_index(hoja)
    return [sh.row_values(i) for i in range(sh.nrows)]


def exigir_encabezado(fs: list[list], col: int, texto: str, path: Path, hoja) -> None:
    """Falla si `texto` no aparece al inicio de alguna celda de la columna `col` en el encabezado."""
    for r in fs[:14]:
        if col < len(r) and norm(r[col]).startswith(texto):
            return
    raise ValueError(
        f"{path.name}[{hoja}]: no encontré '{texto}' en la columna {col} del encabezado"
    )


def datos(fs: list[list]):
    """Filas de datos: col 0 = 'NN Entidad'. Devuelve (ent, mun|'000'|None, fila)."""
    for r in fs:
        m = ENT_RE.match(norm(r[0]))
        if not m:
            continue
        c1 = norm(r[1])
        mm = MUN_RE.match(c1)
        if mm:
            mun = mm.group(1)
        elif c1 == "Total":
            mun = "000"
        else:
            mun = None  # p. ej. 'Resto de los municipios'
        yield m.group(1), mun, r


def edad_simple(lbl: str):
    """'00 años' -> 0; '100 años y más' -> 100; 'No especificado' -> 'ne'; 'Total' -> 'total'."""
    s = norm(lbl)
    if s == "Total":
        return "total"
    if s == "No especificado":
        return "ne"
    m = re.match(r"^(\d+) años( y más)?$", s)
    if not m:
        raise ValueError(f"edad no reconocida: {lbl!r}")
    return int(m.group(1))


def quinquenio(edad: int) -> str:
    if edad >= 85:
        return "85+"
    a = 5 * (edad // 5)
    return f"{a}-{a + 4}"


# --------------------------------------------------------------------------- edad y sexo


def edad_desplegada(raw: Path, anio: int) -> pl.DataFrame:
    """Tabulado 'Población total por municipio y edad desplegada según sexo' (2010, 2020)."""
    regs = []
    for i in range(1, 33):
        if anio == 2020:
            p = raw / f"2020/tabulados/cpv2020_b_{AB_2020[i - 1]}_01_poblacion.xlsx"
            hoja = "03"
        else:
            p = raw / f"2010/tabulados/01_03B_MUNICIPAL_{i:02d}.xls"
            hoja = 0
        fs = filas(p, hoja)
        exigir_encabezado(fs, 2, "Edad desplegada", p, hoja)
        exigir_encabezado(fs, 4, "Hombres", p, hoja)
        exigir_encabezado(fs, 5, "Mujeres", p, hoja)
        for ent, mun, r in datos(fs):
            if ent != f"{i:02d}" or mun is None:
                raise ValueError(f"{p.name}: fila inesperada {r[:3]}")
            e = edad_simple(r[2])
            regs.append(
                (
                    ent + mun,
                    e if isinstance(e, int) else None,
                    {"total": "total", "ne": "no_especificado"}.get(
                        e, "100+" if e == 100 else str(e)
                    ),
                    num(r[3]),
                    num(r[4]),
                    num(r[5]),
                )
            )
    df = pl.DataFrame(
        regs, schema=["cvegeo", "edad", "edad_etiqueta", "total", "hombre", "mujer"], orient="row"
    )
    return df.with_columns(pl.lit(anio).alias("anio"))


def edad_sexo_2015(raw: Path) -> pl.DataFrame:
    """Tabulado 01_poblacion hoja 02: grupos quinquenales de edad por sexo (estimadores)."""
    regs = []
    for _i, ab in enumerate(AB_2015, start=1):
        p = raw / f"2015/tabulados/01_poblacion_{ab}.xls"
        fs = filas(p, "02")
        exigir_encabezado(fs, 2, "Grupos quinquenales de edad", p, "02")
        exigir_encabezado(fs, 3, "Estimador", p, "02")
        exigir_encabezado(fs, 5, "Hombres", p, "02")
        exigir_encabezado(fs, 6, "Mujeres", p, "02")
        for ent, mun, r in datos(fs):
            est = norm(r[3])
            if est not in ("Valor", "Coeficiente de variación"):
                continue
            g = norm(r[2])
            if g == "Total":
                gl = "total"
            elif g == "No especificado":
                gl = "no_especificado"
            else:
                m = re.match(r"^(\d+)-(\d+) años$", g) or re.match(r"^(\d+) años y más$", g)
                if not m:
                    raise ValueError(f"grupo no reconocido {g!r}")
                gl = (
                    f"{int(m.group(1))}-{int(m.group(2))}"
                    if m.lastindex == 2
                    else f"{int(m.group(1))}+"
                )
            regs.append((ent + mun, gl, est, num(r[4]), num(r[5]), num(r[6])))
    df = pl.DataFrame(
        regs, schema=["cvegeo", "grupo_edad", "estimador", "total", "hombre", "mujer"], orient="row"
    )
    return df


# --------------------------------------------------------------------------- ITER


def leer_iter(zp: Path, miembro: str) -> pl.DataFrame:
    with zipfile.ZipFile(zp) as z:
        b = z.read(miembro)
    df = pl.read_csv(io.BytesIO(b), infer_schema=False, encoding="utf8")
    df = df.rename({c: c.lstrip("﻿").strip().upper() for c in df.columns})
    return df


def iter_municipal(df: pl.DataFrame) -> tuple[pl.DataFrame, pl.DataFrame, pl.DataFrame]:
    """(municipios, entidades, nacional) — filas LOC=0000."""
    df = df.filter(pl.col("LOC") == "0000")
    nac = df.filter(pl.col("ENTIDAD") == "00")
    ent = df.filter((pl.col("ENTIDAD") != "00") & (pl.col("MUN") == "000"))
    mun = df.filter((pl.col("ENTIDAD") != "00") & (pl.col("MUN") != "000"))
    return mun, ent, nac


# --------------------------------------------------------------------------- migración (2010, 2020)


def migracion_tab(raw: Path, anio: int, cual: str) -> pl.DataFrame:
    """cual='nacimiento' (Migración 2) o 'residencia' (Migración 4). Totales por municipio y categoría."""
    regs = []
    for i in range(1, 33):
        if anio == 2020:
            p = raw / f"2020/tabulados/cpv2020_b_{AB_2020[i - 1]}_04_migracion.xlsx"
            hoja = "02" if cual == "nacimiento" else "04"
        else:
            p = (
                raw
                / f"2010/tabulados/{'04_02B' if cual == 'nacimiento' else '04_04B'}_MUNICIPAL_{i:02d}.xls"
            )
            hoja = 0
        fs = filas(p, hoja)
        exigir_encabezado(
            fs,
            2,
            "Lugar de nacimiento" if cual == "nacimiento" else "Lugar de residencia en",
            p,
            hoja,
        )
        exigir_encabezado(fs, 4, "Población", p, hoja)
        exigir_encabezado(fs, 5, "Hombres", p, hoja)
        exigir_encabezado(fs, 6, "Mujeres", p, hoja)
        for ent, mun, r in datos(fs):
            cat, sub = norm(r[2]), norm(r[3])
            if sub != "Total":
                continue  # desglose por entidad de origen
            clave = {
                "Total": "total",
                "En la entidad": "misma_entidad",
                "En otra entidad": "otra_entidad",
                "En los Estados Unidos de América": "eua",
                "En otro país": "otro_pais",
                "No especificado": "no_especificado",
            }.get(cat)
            if clave is None:
                raise ValueError(f"{p.name}: categoría {cat!r}")
            regs.append((ent + mun, clave, num(r[4]), num(r[5]), num(r[6])))
    df = pl.DataFrame(regs, schema=["cvegeo", "cat", "total", "hombre", "mujer"], orient="row")
    w = df.pivot(on="cat", index="cvegeo", values="total")
    for c in ("total", "misma_entidad", "otra_entidad", "eua", "otro_pais", "no_especificado"):
        if c not in w.columns:
            w = w.with_columns(pl.lit(None, pl.Float64).alias(c))
    # Las categorías sin población no aparecen como fila en el tabulado: equivalen a 0.
    return w.with_columns(
        [
            pl.col(c).fill_null(0)
            for c in ("misma_entidad", "otra_entidad", "eua", "otro_pais", "no_especificado")
        ]
    )


# --------------------------------------------------------------------------- 2020 ampliado (autoadscripción)


def autoadscripcion_2020(raw: Path) -> pl.DataFrame:
    regs = []
    for ab in AB_2020:
        a = ab.replace("m_", "")
        p = raw / f"2020/tabulados_ampliado/cpv2020_a_{a}_05_etnicidad.xlsx"
        fs = filas(p, "02")
        exigir_encabezado(fs, 4, "Población de 3 años y más", p, "02")
        exigir_encabezado(fs, 5, "Se considera indígena", p, "02")
        for ent, mun, r in datos(fs):
            if mun in (None, "000") or norm(r[2]) != "Total":
                continue
            regs.append((ent + mun, norm(r[3]), num(r[4]), num(r[5])))
    df = pl.DataFrame(regs, schema=["cvegeo", "est", "pob3", "pct"], orient="row")
    v = df.filter(pl.col("est") == "Valor").select(
        "cvegeo", pl.col("pob3").alias("pob3_amp"), pl.col("pct").alias("pct_ai")
    )
    cv = df.filter(pl.col("est") == "Coeficiente de variación").select(
        "cvegeo", pl.col("pct").alias("cv_ai")
    )
    return v.join(cv, on="cvegeo", how="left")


# --------------------------------------------------------------------------- 2015


def tab2015(
    raw: Path, tema: str, hoja: str, encabezados: list[tuple[int, str]], extraer
) -> list[dict]:
    out = []
    for ab in AB_2015:
        p = raw / f"2015/tabulados/{tema}_{ab}.xls"
        fs = filas(p, hoja)
        for c, t in encabezados:
            exigir_encabezado(fs, c, t, p, hoja)
        for ent, mun, r in datos(fs):
            d = extraer(ent, mun, r)
            if d:
                out.append(d)
    return out


def municipal_2015(raw: Path) -> tuple[pl.DataFrame, dict]:
    sexo_sfx = {"Total": "", "Hombres": "_hombres", "Mujeres": "_mujeres"}
    info: dict = {}

    def k(ent, mun):
        return ent + mun

    # Población total por sexo (01_poblacion hoja 03), con CV del total.
    def f_pob(ent, mun, r):
        if mun is None or norm(r[3]) not in ("Valor", "Coeficiente de variación"):
            return None
        return {"cvegeo": k(ent, mun), "sexo": norm(r[2]), "est": norm(r[3]), "v": num(r[4])}

    pob = pl.DataFrame(
        tab2015(
            raw,
            "01_poblacion",
            "03",
            [(2, "Sexo"), (3, "Estimador"), (4, "Población total")],
            f_pob,
        )
    )
    pob_w = (
        pob.filter(pl.col("est") == "Valor")
        .with_columns(
            pl.col("sexo")
            .replace_strict(
                {
                    "Total": "poblacion_total",
                    "Hombres": "poblacion_hombres",
                    "Mujeres": "poblacion_mujeres",
                }
            )
            .alias("col")
        )
        .pivot(on="col", index="cvegeo", values="v")
    )
    cv_tot = pob.filter(
        (pl.col("est") == "Coeficiente de variación") & (pl.col("sexo") == "Total")
    ).select("cvegeo", pl.col("v").alias("cv_poblacion_total"))

    # 18 años y más por sexo: suma de grupos 18-24 ... 65+ (06_educacion hoja 02, sin 'No especificado').
    def f_18(ent, mun, r):
        if mun is None or norm(r[3]) != "Valor":
            return None
        return {
            "cvegeo": k(ent, mun),
            "grupo": norm(r[2]),
            "t": num(r[4]),
            "h": num(r[5]),
            "m": num(r[6]),
        }

    e18 = pl.DataFrame(
        tab2015(
            raw,
            "06_educacion",
            "02",
            [
                (2, "Grupos de edad"),
                (3, "Estimador"),
                (4, "Población de 15 años y más"),
                (5, "Hombres"),
                (6, "Mujeres"),
            ],
            f_18,
        )
    )
    info["grupos_06_educacion_02"] = sorted(e18["grupo"].unique().to_list())
    g18 = ["18-24 años", "25-34 años", "35-44 años", "45-54 años", "55-64 años", "65 años y más"]
    p18 = (
        e18.filter(pl.col("grupo").is_in(g18))
        .group_by("cvegeo")
        .agg(
            pl.col("t").sum().alias("poblacion_18ymas"),
            pl.col("h").sum().alias("poblacion_18ymas_hombres"),
            pl.col("m").sum().alias("poblacion_18ymas_mujeres"),
            pl.len().alias("_n18"),
        )
    )
    p15 = e18.filter(pl.col("grupo") == "Total").select(
        "cvegeo", pl.col("t").alias("poblacion_15ymas")
    )

    # Lengua indígena (05_etnicidad hoja 01) — solo municipios desglosados; el resto va en 'Resto de los municipios'.
    def f_hli(ent, mun, r):
        if mun is None or norm(r[3]) != "Valor" or norm(r[2]) != "Total":
            return None
        return {
            "cvegeo": k(ent, mun),
            "poblacion_3ymas": num(r[4]),
            "pct_3ymas_habla_lengua_indigena": num(r[5]),
        }

    hli = pl.DataFrame(
        tab2015(
            raw,
            "05_etnicidad",
            "01",
            [(4, "Población de 3 años y más"), (5, "Habla lengua indígena")],
            f_hli,
        )
    )

    # Autoadscripción indígena (05_etnicidad hoja 02), universo población total; mismo desglose parcial.
    def f_ai(ent, mun, r):
        if mun is None or norm(r[3]) != "Valor" or norm(r[2]) != "Total":
            return None
        return {
            "cvegeo": k(ent, mun),
            "pct_autoadscripcion_indigena": num(r[5]),
            "pct_autoadscripcion_indigena_en_parte": num(r[6]),
        }

    ai = pl.DataFrame(
        tab2015(
            raw,
            "05_etnicidad",
            "02",
            [(5, "Autoadscripción indígena"), (5, "Se considera"), (6, "Se considera en parte")],
            f_ai,
        )
    )

    # Grado promedio de escolaridad (06_educacion hoja 04, última columna).
    def f_gpe(ent, mun, r):
        if mun is None or norm(r[3]) != "Valor":
            return None
        return {"cvegeo": k(ent, mun), "sexo": norm(r[2]), "v": num(r[16])}

    gpe = pl.DataFrame(
        tab2015(raw, "06_educacion", "04", [(16, "Grado promedio de escolaridad")], f_gpe)
    )
    gpe_w = gpe.with_columns(
        pl.col("sexo")
        .replace_strict({k_: "grado_promedio_escolaridad" + s for k_, s in sexo_sfx.items()})
        .alias("col")
    ).pivot(on="col", index="cvegeo", values="v")

    # Migración: lugar de residencia en marzo de 2010 (04_migracion hoja 01).
    def f_mig(ent, mun, r):
        if mun is None or norm(r[3]) != "Valor" or norm(r[2]) != "Total":
            return None
        return {
            "cvegeo": k(ent, mun),
            "poblacion_5ymas": num(r[4]),
            "pct_5ymas_residia_misma_entidad_hace5": num(r[5]),
            "pct_5ymas_residia_otra_entidad_o_pais_hace5": num(r[9]),
            "pct_5ymas_residencia_hace5_no_especificada": num(r[10]),
        }

    mig = pl.DataFrame(
        tab2015(
            raw,
            "04_migracion",
            "01",
            [
                (4, "Población de 5 años y más"),
                (5, "En la misma entidad"),
                (9, "En otra entidad o país"),
                (10, "No especificado"),
            ],
            f_mig,
        )
    )

    # Afiliación a servicios de salud (07_servicios_de_salud hoja 01).
    def f_sal(ent, mun, r):
        if mun is None or norm(r[3]) != "Valor" or norm(r[2]) != "Total":
            return None
        return {
            "cvegeo": k(ent, mun),
            "pct_afiliada_servicios_salud": num(r[5]),
            "pct_sin_afiliacion_servicios_salud": num(r[12]),
        }

    sal = pl.DataFrame(
        tab2015(raw, "07_servicios_de_salud", "01", [(5, "Afiliada"), (12, "No afiliada")], f_sal)
    )

    # TIC en viviendas (14_vivienda hoja 22).
    tic_map = {"Internet": "internet", "Computadora": "computadora", "Teléfono celular": "celular"}

    def f_tic(ent, mun, r):
        if mun is None or norm(r[3]) != "Valor" or norm(r[2]) not in tic_map:
            return None
        return {
            "cvegeo": k(ent, mun),
            "bien": tic_map[norm(r[2])],
            "vph": num(r[4]),
            "pct": num(r[5]),
        }

    tic = pl.DataFrame(
        tab2015(
            raw,
            "14_vivienda",
            "22",
            [
                (2, "Tipo de bien o tecnología"),
                (4, "Viviendas particulares habitadas"),
                (5, "Disponen"),
            ],
            f_tic,
        )
    )
    vph = tic.group_by("cvegeo").agg(
        pl.col("vph").max().alias("viviendas_particulares_habitadas"),
        (pl.col("vph").max() != pl.col("vph").min()).any().alias("_vph_dif"),
    )
    tic_w = tic.with_columns(("pct_viviendas_con_" + pl.col("bien")).alias("col")).pivot(
        on="col", index="cvegeo", values="pct"
    )

    nombres = pl.DataFrame(
        tab2015(
            raw,
            "01_poblacion",
            "03",
            [],
            lambda e, m, r: (
                {
                    "cvegeo": e + m,
                    "nombre_entidad": norm(r[0])[3:],
                    "nombre_municipio": norm(r[1])[4:].rstrip(" *"),
                    "marca_inegi_2015": {
                        "**": "muestra_insuficiente",
                        "*": "municipio_censado",
                    }.get(re.search(r"(\**)$", norm(r[1])).group(1)),
                }
                if m not in (None, "000") and norm(r[2]) == "Total" and norm(r[3]) == "Valor"
                else None
            ),
        )
    )

    df = nombres
    for t in (pob_w, cv_tot, p15, p18, hli, ai, gpe_w, mig, sal, vph, tic_w):
        df = df.join(t, on="cvegeo", how="left")
    info["vph_distinto_entre_bienes"] = int(df["_vph_dif"].fill_null(False).sum())
    info["municipios_sin_6_grupos_18ymas"] = int((df["_n18"].fill_null(0) != 6).sum())

    # Conteos estimados = base × porcentaje / 100 (derivados; INEGI publica el porcentaje).
    df = df.with_columns(
        (pl.col("poblacion_3ymas") * pl.col("pct_3ymas_habla_lengua_indigena") / 100)
        .round(0)
        .alias("poblacion_3ymas_habla_lengua_indigena_est"),
        (pl.col("poblacion_5ymas") * pl.col("pct_5ymas_residia_otra_entidad_o_pais_hace5") / 100)
        .round(0)
        .alias("poblacion_5ymas_residia_otra_entidad_o_pais_hace5_est"),
        (pl.col("poblacion_total") * pl.col("pct_afiliada_servicios_salud") / 100)
        .round(0)
        .alias("poblacion_afiliada_servicios_salud_est"),
        *[
            (pl.col("viviendas_particulares_habitadas") * pl.col(f"pct_viviendas_con_{b}") / 100)
            .round(0)
            .alias(f"viviendas_con_{b}_est")
            for b in tic_map.values()
        ],
    )
    # '** Municipio con muestra insuficiente': INEGI llena los porcentajes con 0 y 'No especificado' = 100;
    # no son datos, se anulan todos los porcentajes y conteos derivados de porcentajes.
    insuf = pl.col("marca_inegi_2015") == "muestra_insuficiente"
    info["municipios_muestra_insuficiente"] = df.filter(insuf)["cvegeo"].to_list()
    info["municipios_censados"] = int(
        df.filter(pl.col("marca_inegi_2015") == "municipio_censado").height
    )
    anular = [
        c for c in df.columns if c.startswith(("pct_", "grado_promedio")) or c.endswith("_est")
    ]
    df = df.with_columns([pl.when(insuf).then(None).otherwise(pl.col(c)).alias(c) for c in anular])
    df = df.drop("_vph_dif", "_n18").with_columns(pl.lit(2015).alias("anio"))
    df = df.filter(pl.col("cvegeo").str.slice(2, 3) != "000")
    return df, info


# --------------------------------------------------------------------------- 2010 / 2020 municipal


def municipal_censo(raw: Path, anio: int) -> tuple[pl.DataFrame, pl.DataFrame, pl.DataFrame, dict]:
    if anio == 2020:
        df = leer_iter(
            raw / "2020/iter_00_cpv2020_csv.zip",
            "iter_00_cpv2020/conjunto_de_datos/conjunto_de_datos_iter_00CSV20.csv",
        )
        res, resoe, viv_den = "PRES2015", "PRESOE15", "VIVPARH_CV"
    else:
        df = leer_iter(
            raw / "2010/iter_nal_2010_csv.zip",
            "iter_00_cpv2010/conjunto_de_datos/iter_00_cpv2010.csv",
        )
        res, resoe, viv_den = "PRES2005", "PRESOE05", "VIVPAR_HAB"
    mun, ent, nac = iter_municipal(df)
    cols = {
        "POBTOT": "poblacion_total",
        "POBMAS": "poblacion_hombres",
        "POBFEM": "poblacion_mujeres",
        "P_18YMAS": "poblacion_18ymas",
        "P_18YMAS_M": "poblacion_18ymas_hombres",
        "P_18YMAS_F": "poblacion_18ymas_mujeres",
        "P_18A24": "poblacion_18a24",
        "P_60YMAS": "poblacion_60ymas",
        "P_3YMAS": "poblacion_3ymas",
        "P_5YMAS": "poblacion_5ymas",
        "P_15YMAS": "poblacion_15ymas",
        "GRAPROES": "grado_promedio_escolaridad",
        "GRAPROES_M": "grado_promedio_escolaridad_hombres",
        "GRAPROES_F": "grado_promedio_escolaridad_mujeres",
        "P3YM_HLI": "poblacion_3ymas_habla_lengua_indigena",
        "P3HLINHE": "poblacion_3ymas_habla_lengua_indigena_no_espanol",
        "PHOG_IND": "poblacion_en_hogares_indigenas",
        "PNACENT": "poblacion_nacida_en_la_entidad",
        "PNACOE": "poblacion_nacida_otra_entidad",
        res: "poblacion_5ymas_residia_misma_entidad_hace5",
        resoe: "poblacion_5ymas_residia_otra_entidad_hace5",
        "PDER_SS": "poblacion_afiliada_servicios_salud",
        "PSINDER": "poblacion_sin_afiliacion_servicios_salud",
        "TVIVPARHAB": "viviendas_particulares_habitadas",
        "VIVPAR_HAB": "viviendas_particulares_habitadas_con_info",
        "VPH_INTER": "viviendas_con_internet",
        "VPH_PC": "viviendas_con_computadora",
        "VPH_CEL": "viviendas_con_celular",
    }
    if anio == 2020:
        cols.update(
            {
                "VIVPARH_CV": "viviendas_particulares_habitadas_con_caracteristicas",
                "POB_AFRO": "poblacion_afromexicana",
            }
        )
    faltan = [c for c in cols if c not in mun.columns]
    if faltan:
        raise ValueError(f"ITER {anio}: faltan columnas {faltan}")
    no_num = {}
    exprs = []
    for c, n in cols.items():
        # Algunas columnas (p. ej. POB_AFRO 2020) traen espacios a la izquierda: se recortan antes de convertir.
        v = pl.col(c).str.strip_chars()
        no_num[c] = int(
            mun.filter(
                v.is_not_null() & (v != "") & v.cast(pl.Float64, strict=False).is_null()
            ).height
        )
        exprs.append(v.cast(pl.Float64, strict=False).alias(n))
    out = mun.select(
        (pl.col("ENTIDAD") + pl.col("MUN")).alias("cvegeo"),
        pl.lit(anio).alias("anio"),
        pl.col("NOM_ENT").str.strip_chars().alias("nombre_entidad"),
        pl.col("NOM_MUN").str.strip_chars().alias("nombre_municipio"),
        *exprs,
    )
    den = cols[viv_den]
    out = out.with_columns(
        (pl.col("poblacion_3ymas_habla_lengua_indigena") / pl.col("poblacion_3ymas") * 100).alias(
            "pct_3ymas_habla_lengua_indigena"
        ),
        (
            pl.col("poblacion_5ymas_residia_otra_entidad_hace5") / pl.col("poblacion_5ymas") * 100
        ).alias("pct_5ymas_residia_otra_entidad_hace5"),
        (pl.col("poblacion_afiliada_servicios_salud") / pl.col("poblacion_total") * 100).alias(
            "pct_afiliada_servicios_salud"
        ),
        *[
            (pl.col(f"viviendas_con_{b}") / pl.col(den) * 100).alias(f"pct_viviendas_con_{b}")
            for b in ("internet", "computadora", "celular")
        ],
    )
    # Migración internacional desde tabulados (ITER no la trae).
    nac_t = migracion_tab(raw, anio, "nacimiento")
    res_t = migracion_tab(raw, anio, "residencia")
    out = out.join(
        nac_t.select(
            "cvegeo",
            pl.col("eua").alias("poblacion_nacida_eua"),
            (pl.col("eua") + pl.col("otro_pais")).alias("poblacion_nacida_otro_pais"),
            pl.col("otra_entidad").alias("_tab_pnacoe"),
        ),
        on="cvegeo",
        how="left",
    )
    out = out.join(
        res_t.select(
            "cvegeo",
            pl.col("eua").alias("poblacion_5ymas_residia_eua_hace5"),
            (pl.col("eua") + pl.col("otro_pais")).alias("poblacion_5ymas_residia_otro_pais_hace5"),
            pl.col("otra_entidad").alias("_tab_presoe"),
            pl.col("total").alias("_tab_p5"),
        ),
        on="cvegeo",
        how="left",
    )
    out = out.with_columns(
        (pl.col("poblacion_5ymas_residia_otro_pais_hace5") / pl.col("poblacion_5ymas") * 100).alias(
            "pct_5ymas_residia_otro_pais_hace5"
        )
    )
    if anio == 2020:
        ai = autoadscripcion_2020(raw)
        out = out.join(
            ai.select(
                "cvegeo",
                pl.col("pct_ai").alias("pct_3ymas_autoadscripcion_indigena"),
                pl.col("cv_ai").alias("cv_pct_3ymas_autoadscripcion_indigena"),
                (pl.col("pob3_amp") * pl.col("pct_ai") / 100)
                .round(0)
                .alias("poblacion_3ymas_autoadscripcion_indigena_est"),
            ),
            on="cvegeo",
            how="left",
        )
    return out, ent, nac, no_num


def cruce_quinquenios_iter_2020(raw: Path, es: pl.DataFrame) -> dict:
    """ITER 2020 trae P_{a}A{a+4}_{M,F} y P_85YMAS_{M,F}: deben coincidir con los grupos armados del tabulado."""
    d, _, _ = iter_municipal(
        leer_iter(
            raw / "2020/iter_00_cpv2020_csv.zip",
            "iter_00_cpv2020/conjunto_de_datos/conjunto_de_datos_iter_00CSV20.csv",
        )
    )
    partes = []
    for sx, sexo in (("M", "hombre"), ("F", "mujer")):
        cols = [(f"P_{a}A{a + 4}_{sx}", f"{a}-{a + 4}") for a in range(0, 85, 5)] + [
            (f"P_85YMAS_{sx}", "85+")
        ]
        for c, g in cols:
            partes.append(
                d.select(
                    (pl.col("ENTIDAD") + pl.col("MUN")).alias("cvegeo"),
                    pl.lit(sexo).alias("sexo"),
                    pl.lit(g).alias("grupo_edad"),
                    pl.col(c).str.strip_chars().cast(pl.Int64, strict=False).alias("iter"),
                )
            )
    j = pl.concat(partes).join(
        es.filter(pl.col("anio") == 2020), on=["cvegeo", "sexo", "grupo_edad"], how="left"
    )
    return {
        "celdas": j.height,
        "difieren": int(j.filter(pl.col("iter") != pl.col("poblacion")).height),
        "sin_par_o_no_numericas": int(
            j.filter(pl.col("iter").is_null() | pl.col("poblacion").is_null()).height
        ),
    }


# --------------------------------------------------------------------------- principal


def main() -> None:
    ap = argparse.ArgumentParser(description="INEGI municipal 2010, 2015 y 2020.")
    ap.add_argument(
        "--verif",
        type=Path,
        default=RAIZ / "data/processed/externos/verificaciones/inegi_verificaciones.json",
    )
    ap.add_argument(
        "--aceptar-huellas-distintas",
        action="store_true",
        help="avisa en vez de fallar si un crudo no coincide con huellas_fuentes_externas.csv",
    )
    a = ap.parse_args()
    raw = RAIZ / "data/raw/externos/inegi"
    outd = RAIZ / "data/processed/externos"
    outd.mkdir(parents=True, exist_ok=True)
    a.verif.parent.mkdir(parents=True, exist_ok=True)

    man = manifiesto()
    esperadas = huellas_registradas("data/raw/externos/inegi/")
    hashes = {}
    for rel, url in man:
        p = descargar(raw, rel, url)
        h = comprobar_huella(p, esperadas, not a.aceptar_huellas_distintas)
        hashes[rel] = {"url": url, "sha256": h, "bytes": p.stat().st_size}
    V: dict = {"archivos": hashes}

    # ---------------- municipal 2010 / 2020
    resoe_col = {2010: "PRESOE05", 2020: "PRESOE15"}
    for anio in (2010, 2020):
        m, ent, nac, no_num = municipal_censo(raw, anio)
        V[f"no_numericos_iter_{anio}"] = {k: v for k, v in no_num.items() if v}
        V[f"n_municipios_{anio}"] = m.height
        V[f"suma_poblacion_total_municipios_{anio}"] = m["poblacion_total"].sum()
        V[f"pobtot_nacional_iter_{anio}"] = float(nac["POBTOT"][0])
        ent_tot = ent.select(
            (pl.col("ENTIDAD")).alias("e"), pl.col("POBTOT").cast(pl.Float64).alias("est")
        )
        suma_e = m.group_by(pl.col("cvegeo").str.slice(0, 2).alias("e")).agg(
            pl.col("poblacion_total").sum().alias("mun")
        )
        cmp_e = ent_tot.join(suma_e, on="e").with_columns(
            (pl.col("est") - pl.col("mun")).alias("dif")
        )
        V[f"entidades_con_diferencia_estado_vs_suma_municipios_{anio}"] = cmp_e.filter(
            pl.col("dif") != 0
        ).to_dicts()
        # cruces internos tabulado vs ITER
        V[f"migracion_tab_vs_iter_{anio}"] = {
            "otra_entidad_nacimiento_difiere": int(
                m.filter(pl.col("_tab_pnacoe") != pl.col("poblacion_nacida_otra_entidad")).height
            ),
            "otra_entidad_residencia_difiere": int(
                m.filter(
                    pl.col("_tab_presoe") != pl.col("poblacion_5ymas_residia_otra_entidad_hace5")
                ).height
            ),
            "pob5ymas_difiere": int(
                m.filter(pl.col("_tab_p5") != pl.col("poblacion_5ymas")).height
            ),
            "sin_dato_tabulado": int(m.filter(pl.col("_tab_p5").is_null()).height),
        }
        m = m.drop("_tab_pnacoe", "_tab_presoe", "_tab_p5")
        # Suma municipal de cada conteo del ITER vs fila nacional del ITER.
        inv = {
            "poblacion_total": "POBTOT",
            "poblacion_18ymas": "P_18YMAS",
            "poblacion_18ymas_hombres": "P_18YMAS_M",
            "poblacion_18ymas_mujeres": "P_18YMAS_F",
            "poblacion_3ymas_habla_lengua_indigena": "P3YM_HLI",
            "poblacion_nacida_otra_entidad": "PNACOE",
            "poblacion_5ymas_residia_otra_entidad_hace5": resoe_col[anio],
            "viviendas_con_internet": "VPH_INTER",
            "viviendas_con_computadora": "VPH_PC",
            "viviendas_con_celular": "VPH_CEL",
            "poblacion_afiliada_servicios_salud": "PDER_SS",
        }
        V[f"suma_municipal_vs_nacional_iter_{anio}"] = {
            k: {
                "suma_municipios": float(m[k].sum()),
                "nacional_iter": float(str(nac[c][0]).strip()),
                "igual": float(m[k].sum()) == float(str(nac[c][0]).strip()),
            }
            for k, c in inv.items()
        }
        if anio == 2020:
            V["autoadscripcion_2020_municipios_con_dato"] = int(
                m["pct_3ymas_autoadscripcion_indigena"].is_not_null().sum()
            )
        V[f"nulos_{anio}"] = {c: int(m[c].null_count()) for c in m.columns if m[c].null_count()}
        m.write_parquet(outd / f"inegi_municipal_{anio}.parquet")

    # ---------------- municipal 2015
    m15, info15 = municipal_2015(raw)
    V["info_2015"] = info15
    V["n_municipios_2015"] = m15.height
    V["suma_poblacion_total_municipios_2015"] = m15["poblacion_total"].sum()
    fs = filas(raw / "2015/tabulados/01_poblacion.xls", "03")
    nal = [
        num(r[4])
        for r in fs
        if norm(r[0]) == "Estados Unidos Mexicanos"
        and norm(r[1]) == "Total"
        and norm(r[2]) == "Total"
        and norm(r[3]) == "Valor"
    ]
    V["pobtot_nacional_tabulado_2015"] = nal[0] if nal else None
    fs = filas(raw / "2020/tabulados/cpv2020_b_eum_01_poblacion.xlsx", "01")
    nal = [
        num(r[2])
        for r in fs
        if norm(r[0]) == "Estados Unidos Mexicanos" and norm(r[1]) == "Población"
    ]
    V["pobtot_nacional_tabulado_2020"] = nal[0] if nal else None
    # Municipios que aparecen o desaparecen entre años.
    claves = {
        a: set(pl.read_parquet(outd / f"inegi_municipal_{a}.parquet")["cvegeo"].to_list())
        for a in (2010, 2020)
    }
    claves[2015] = set(m15["cvegeo"].to_list())
    V["municipios_nuevos"] = {
        "2015_vs_2010": sorted(claves[2015] - claves[2010]),
        "2020_vs_2015": sorted(claves[2020] - claves[2015]),
        "faltan_2015_vs_2010": sorted(claves[2010] - claves[2015]),
        "faltan_2020_vs_2015": sorted(claves[2015] - claves[2020]),
    }
    V["sumas_2015"] = {
        c: float(m15[c].sum())
        for c in (
            "poblacion_15ymas",
            "poblacion_18ymas",
            "poblacion_18ymas_hombres",
            "poblacion_18ymas_mujeres",
            "poblacion_5ymas",
            "viviendas_particulares_habitadas",
        )
    }
    V["nulos_2015"] = {c: int(m15[c].null_count()) for c in m15.columns if m15[c].null_count()}
    m15.write_parquet(outd / "inegi_municipal_2015.parquet")

    # ---------------- edad y sexo
    largos = []
    desp = []
    for anio in (2010, 2020):
        d = edad_desplegada(raw, anio)
        mun_d = d.filter(pl.col("cvegeo").str.slice(2, 3) != "000")
        tot = mun_d.filter(pl.col("edad_etiqueta") == "total")
        det = mun_d.filter(pl.col("edad_etiqueta") != "total")
        # chequeo: suma de edades = total del tabulado, por sexo
        s = det.group_by("cvegeo").agg(
            pl.col("hombre").sum(), pl.col("mujer").sum(), pl.col("total").sum()
        )
        c = tot.join(s, on="cvegeo", suffix="_suma")
        V[f"edad_desplegada_{anio}"] = {
            "municipios": tot.height,
            "suma_edades_distinta_de_total": int(
                c.filter(
                    (pl.col("hombre") != pl.col("hombre_suma"))
                    | (pl.col("mujer") != pl.col("mujer_suma"))
                    | (pl.col("total") != pl.col("total_suma"))
                ).height
            ),
            "total_distinto_de_h_mas_m": int(
                tot.filter(pl.col("total") != pl.col("hombre") + pl.col("mujer")).height
            ),
        }
        ld = det.unpivot(
            index=["cvegeo", "edad", "edad_etiqueta"],
            on=["hombre", "mujer"],
            variable_name="sexo",
            value_name="poblacion",
        )
        desp.append(ld.with_columns(pl.lit(anio).alias("anio")))
        q = ld.with_columns(
            pl.when(pl.col("edad").is_null())
            .then(pl.lit("no_especificado"))
            .otherwise(pl.col("edad").map_elements(quinquenio, return_dtype=pl.String))
            .alias("grupo_edad")
        )
        q = q.group_by("cvegeo", "sexo", "grupo_edad").agg(pl.col("poblacion").sum())
        largos.append(
            q.with_columns(
                pl.lit(anio).alias("anio"),
                pl.lit(None, pl.Float64).alias("cv_pct"),
                pl.lit("censo").alias("tipo_dato"),
            )
        )
        # 18+ por sexo desde edad simple vs ITER
        m = pl.read_parquet(outd / f"inegi_municipal_{anio}.parquet")
        a18 = (
            ld.filter(pl.col("edad") >= 18)
            .group_by("cvegeo", "sexo")
            .agg(pl.col("poblacion").sum())
            .pivot(on="sexo", index="cvegeo", values="poblacion")
        )
        j = m.select(
            "cvegeo",
            "poblacion_18ymas_hombres",
            "poblacion_18ymas_mujeres",
            "poblacion_hombres",
            "poblacion_mujeres",
        ).join(a18, on="cvegeo", how="full", coalesce=True)
        j = j.join(
            tot.select("cvegeo", pl.col("hombre").alias("th"), pl.col("mujer").alias("tm")),
            on="cvegeo",
            how="full",
            coalesce=True,
        )
        V[f"cruce_edad_vs_iter_{anio}"] = {
            "18ymas_hombres_difiere": int(
                j.filter(pl.col("hombre") != pl.col("poblacion_18ymas_hombres")).height
            ),
            "18ymas_mujeres_difiere": int(
                j.filter(pl.col("mujer") != pl.col("poblacion_18ymas_mujeres")).height
            ),
            "hombres_total_difiere": int(
                j.filter(pl.col("th") != pl.col("poblacion_hombres")).height
            ),
            "mujeres_total_difiere": int(
                j.filter(pl.col("tm") != pl.col("poblacion_mujeres")).height
            ),
            "en_iter_sin_tabulado": int(j.filter(pl.col("th").is_null()).height),
            "en_tabulado_sin_iter": int(j.filter(pl.col("poblacion_hombres").is_null()).height),
        }

    e15 = edad_sexo_2015(raw)
    e15m = e15.filter(pl.col("cvegeo").str.slice(2, 3) != "000")
    val = e15m.filter(pl.col("estimador") == "Valor")
    cvs = e15m.filter(pl.col("estimador") == "Coeficiente de variación")
    tot15 = val.filter(pl.col("grupo_edad") == "total")
    det15 = val.filter(pl.col("grupo_edad") != "total")
    s15 = det15.group_by("cvegeo").agg(pl.col("hombre").sum(), pl.col("mujer").sum())
    c15 = tot15.join(s15, on="cvegeo", suffix="_suma")
    V["edad_sexo_2015"] = {
        "municipios": tot15.height,
        "grupos": sorted(det15["grupo_edad"].unique().to_list()),
        "suma_grupos_distinta_de_total": int(
            c15.filter(
                (pl.col("hombre") != pl.col("hombre_suma"))
                | (pl.col("mujer") != pl.col("mujer_suma"))
            ).height
        ),
        "max_dif_abs": float(
            c15.select(
                pl.max_horizontal(
                    (pl.col("hombre") - pl.col("hombre_suma")).abs(),
                    (pl.col("mujer") - pl.col("mujer_suma")).abs(),
                ).max()
            ).item()
            or 0
        ),
    }
    l15 = det15.unpivot(
        index=["cvegeo", "grupo_edad"],
        on=["hombre", "mujer"],
        variable_name="sexo",
        value_name="poblacion",
    )
    cv15 = cvs.filter(pl.col("grupo_edad") != "total").unpivot(
        index=["cvegeo", "grupo_edad"],
        on=["hombre", "mujer"],
        variable_name="sexo",
        value_name="cv_pct",
    )
    l15 = l15.join(cv15, on=["cvegeo", "grupo_edad", "sexo"], how="left")
    largos.append(
        l15.with_columns(
            pl.lit(2015).alias("anio"), pl.lit("estimacion_muestral").alias("tipo_dato")
        )
    )
    # 2015: total del tabulado de edad vs población total (01_poblacion hoja 03)
    j15 = tot15.join(
        m15.select("cvegeo", "poblacion_hombres", "poblacion_mujeres"),
        on="cvegeo",
        how="full",
        coalesce=True,
    )
    V["cruce_edad_vs_poblacion_2015"] = {
        "hombres_difiere": int(j15.filter(pl.col("hombre") != pl.col("poblacion_hombres")).height),
        "mujeres_difiere": int(j15.filter(pl.col("mujer") != pl.col("poblacion_mujeres")).height),
        "sin_par": int(
            j15.filter(pl.col("hombre").is_null() | pl.col("poblacion_hombres").is_null()).height
        ),
    }

    orden = ["cvegeo", "anio", "sexo", "grupo_edad", "poblacion", "cv_pct", "tipo_dato"]
    es = pl.concat(
        [
            x.select(orden).with_columns(
                pl.col("poblacion").cast(pl.Int64),
                pl.col("anio").cast(pl.Int32),
                pl.col("cv_pct").cast(pl.Float64),
            )
            for x in largos
        ]
    )
    # Los tabulados omiten las filas sin población (p. ej. edades simples con 0 personas). Se completa la
    # rejilla con 0: es seguro porque la suma de las filas presentes ya iguala el total publicado (ver arriba).
    grupos_censo = [quinquenio(e) for e in range(0, 85, 5)] + ["85+", "no_especificado"]
    grupos_2015 = [f"{e}-{e + 4}" for e in range(0, 75, 5)] + ["75+", "no_especificado"]
    completos = []
    for anio, gr, tipo in (
        (2010, grupos_censo, "censo"),
        (2015, grupos_2015, "estimacion_muestral"),
        (2020, grupos_censo, "censo"),
    ):
        x = es.filter(pl.col("anio") == anio)
        extra = set(x["grupo_edad"].unique().to_list()) - set(gr)
        if extra:
            raise ValueError(f"{anio}: grupos inesperados {extra}")
        rej = (
            x.select("cvegeo")
            .unique()
            .join(pl.DataFrame({"sexo": ["hombre", "mujer"]}), how="cross")
            .join(pl.DataFrame({"grupo_edad": gr}), how="cross")
        )
        y = rej.join(x.drop("anio", "tipo_dato"), on=["cvegeo", "sexo", "grupo_edad"], how="left")
        V[f"edad_sexo_filas_rellenadas_con_0_{anio}"] = int(y["poblacion"].null_count())
        completos.append(
            y.with_columns(
                pl.col("poblacion").fill_null(0),
                pl.lit(anio, pl.Int32).alias("anio"),
                pl.lit(tipo).alias("tipo_dato"),
            ).select(orden)
        )
    es = pl.concat(completos)
    orden_g = {g: i for i, g in enumerate(grupos_censo + ["75+"])}
    es = (
        es.with_columns(
            pl.col("grupo_edad").replace_strict(orden_g, return_dtype=pl.Int32).alias("_o")
        )
        .sort("anio", "cvegeo", "sexo", "_o")
        .drop("_o")
    )
    es.write_parquet(outd / "inegi_edad_sexo.parquet")
    V["cruce_quinquenios_iter_vs_tabulado_2020"] = cruce_quinquenios_iter_2020(raw, es)
    dd = pl.concat(
        [
            x.select(
                "cvegeo",
                pl.col("anio").cast(pl.Int32),
                "sexo",
                pl.col("edad").cast(pl.Int16),
                "edad_etiqueta",
                pl.col("poblacion").cast(pl.Int64),
            )
            for x in desp
        ]
    )
    etiquetas = [str(e) for e in range(100)] + ["100+", "no_especificado"]
    rej = (
        dd.select("cvegeo", "anio")
        .unique()
        .join(pl.DataFrame({"sexo": ["hombre", "mujer"]}), how="cross")
        .join(
            pl.DataFrame(
                {"edad_etiqueta": etiquetas, "edad": [*range(101), None]},
                schema={"edad_etiqueta": pl.String, "edad": pl.Int16},
            ),
            how="cross",
        )
    )
    dd = rej.join(dd.drop("edad"), on=["cvegeo", "anio", "sexo", "edad_etiqueta"], how="left")
    V["edad_desplegada_filas_rellenadas_con_0"] = int(dd["poblacion"].null_count())
    dd = dd.with_columns(pl.col("poblacion").fill_null(0)).select(
        "cvegeo", "anio", "sexo", "edad", "edad_etiqueta", "poblacion"
    )
    dd.sort("anio", "cvegeo", "sexo", "edad", nulls_last=True).write_parquet(
        outd / "inegi_edad_desplegada.parquet"
    )

    # suma de grupos = población total del municipal
    for anio in (2010, 2015, 2020):
        m = pl.read_parquet(outd / f"inegi_municipal_{anio}.parquet")
        g = (
            es.filter(pl.col("anio") == anio)
            .group_by("cvegeo")
            .agg(pl.col("poblacion").sum().alias("suma_grupos"))
        )
        j = m.select("cvegeo", "poblacion_total").join(g, on="cvegeo", how="full", coalesce=True)
        V[f"edad_sexo_suma_vs_poblacion_total_{anio}"] = {
            "difieren": int(j.filter(pl.col("suma_grupos") != pl.col("poblacion_total")).height),
            "sin_par": int(
                j.filter(
                    pl.col("suma_grupos").is_null() | pl.col("poblacion_total").is_null()
                ).height
            ),
            "suma_nacional_grupos": int(g["suma_grupos"].sum()),
        }

    a.verif.write_text(json.dumps(V, ensure_ascii=False, indent=1, default=str))
    print(
        json.dumps(
            {k: v for k, v in V.items() if k != "archivos"},
            ensure_ascii=False,
            indent=1,
            default=str,
        )
    )


if __name__ == "__main__":
    main()
