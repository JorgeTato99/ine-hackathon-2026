"""Quién ejerce la seguridad pública en cada municipio (CNGMD 2025) y cifra oculta por estado (ENVIPE 2026).

Fuentes (INEGI)
    - Censo Nacional de Gobiernos Municipales y Demarcaciones Territoriales de la Ciudad de México
      (CNGMD) 2025, año de referencia 2024, https://www.inegi.org.mx/programas/cngmd/2025/
      Datos abiertos (CSV dentro de ZIP) bajo
      https://www.inegi.org.mx/contenidos/programas/cngmd/2025/datosabiertos/:
        conjunto_de_datos_aplicabilidad_m3s1_cngmd2025_csv.zip  situación de la función, Mando Único,
                                                                 instituciones que la ejercen
        conjunto_de_datos_rec_huma_sp_cngmd2025_csv.zip         titular, personal, elementos federales
        conjunto_de_datos_aplicabilidad_m5_cngmd2025_csv.zip    justicia cívica
      Tabulado básico de seguridad pública (solo para verificar, Cuadro 1):
        https://www.inegi.org.mx/contenidos/programas/cngmd/2025/tabulados/cngmd2025_seg_publica.xlsx
    - Encuesta Nacional de Victimización y Percepción sobre Seguridad Pública (ENVIPE) 2026,
      delitos de 2025, https://www.inegi.org.mx/programas/envipe/2026/
      Tabulado III, cuadro 3.3 (cifra oculta por entidad) y su coeficiente de variación:
        https://www.inegi.org.mx/contenidos/programas/envipe/2026/tabulados/III_denuncia_delito_2026_est.xlsx
        https://www.inegi.org.mx/contenidos/programas/envipe/2026/tabulados/III_denuncia_delito_2026_cv.xlsx

Qué produce (data/processed/externos/)
    cngmd_seguridad_municipal.parquet     una fila por municipio (2,478), clave cvegeo
    envipe_cifra_oculta_estatal.parquet   una fila por entidad más el total nacional (cve_ent 00)
    verificaciones/seguridad_verificaciones.json

Cómo correrlo (desde la raíz del repo; openpyxl no está en uv.lock):
    uv tool run --from uv==0.13.1 uv run --no-project --with polars==2.0.0 \
        --with openpyxl==3.1.5 python -I scripts/externos/fuente_seguridad.py [--descargar]

    Sin --descargar usa los archivos ya presentes en data/raw/externos/seguridad/. En ambos casos
    el SHA-256 de cada archivo debe coincidir con data/reference/huellas_fuentes_externas.csv o el
    script se detiene.

Verificaciones (en el JSON)
    - CNGMD: 2,478 municipios que cruzan 1 a 1 con data/reference/municipios_inegi.csv.
    - Situación operativa por entidad y categoría contra el Cuadro 1 del tabulado (32 x 10 celdas).
      Única diferencia aceptada: Tumbiscatío, Michoacán (16096), que en los datos abiertos está en
      la categoría 3 y el tabulado cuenta en la 1. Cualquier otra diferencia detiene el script.
    - Personal de las instituciones municipales sin titulares = 164,224 (120,773 hombres y 43,451
      mujeres), igual al Cuadro 3 del tabulado; con titulares, 166,090 contra 166,091 publicados
      (Churintzio, 16028, tiene titular pero ninguna celda numérica de personal).
    - ENVIPE: la suma de las 32 entidades más los 20,587 delitos sin entidad especificada (nota 2
      del cuadro) es igual al total nacional; cifra oculta nacional 93.4 %.

Lectura de los códigos (catálogos del propio INEGI dentro de cada ZIP)
    sitopemu_b: 1 institución municipal; 2 institución municipal más otras instituciones o cuerpos
    comunales; 3 sin institución municipal, la ejerce otra institución (estatal o federal); 4 sin
    institución municipal, cuerpos comunales autogestivos; 5 sin institución municipal, cuerpos
    comunales adscritos al municipio; 6 sin institución municipal y ninguna otra la ejerce;
    7 otra situación; 9 no identificado; 0 no aplica (alcaldías de la Ciudad de México);
    96/97/98 no publicable / no sabe / no disponible.

Seguridad
    Solo descarga por HTTPS desde www.inegi.org.mx. Los CSV se leen directo del ZIP, solo los
    miembros nombrados aquí; los XLSX se leen como datos con openpyxl. No se ejecuta nada descargado.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import urllib.request
import zipfile
from pathlib import Path
from urllib.parse import urlsplit

import openpyxl
import polars as pl

RAIZ = next(
    p
    for p in [Path(__file__).resolve(), *Path(__file__).resolve().parents]
    if (p / "pyproject.toml").is_file()
)
HUELLAS = RAIZ / "data" / "reference" / "huellas_fuentes_externas.csv"
RAW = RAIZ / "data/raw/externos/seguridad"
OUT = RAIZ / "data/processed/externos"
REF = RAIZ / "data/reference/municipios_inegi.csv"
VERIF_JSON = OUT / "verificaciones" / "seguridad_verificaciones.json"

BASE = "https://www.inegi.org.mx/contenidos/programas"
# Nombre local -> ruta en BASE. El SHA-256 esperado está en huellas_fuentes_externas.csv.
FUENTES = {
    "conjunto_de_datos_aplicabilidad_m3s1_cngmd2025_csv.zip": "/cngmd/2025/datosabiertos/conjunto_de_datos_aplicabilidad_m3s1_cngmd2025_csv.zip",
    "conjunto_de_datos_rec_huma_sp_cngmd2025_csv.zip": "/cngmd/2025/datosabiertos/conjunto_de_datos_rec_huma_sp_cngmd2025_csv.zip",
    "conjunto_de_datos_aplicabilidad_m5_cngmd2025_csv.zip": "/cngmd/2025/datosabiertos/conjunto_de_datos_aplicabilidad_m5_cngmd2025_csv.zip",
    "cngmd2025_seg_publica.xlsx": "/cngmd/2025/tabulados/cngmd2025_seg_publica.xlsx",
    "III_denuncia_delito_2026_est.xlsx": "/envipe/2026/tabulados/III_denuncia_delito_2026_est.xlsx",
    "III_denuncia_delito_2026_cv.xlsx": "/envipe/2026/tabulados/III_denuncia_delito_2026_cv.xlsx",
}
ZIP_M3S1 = RAW / "conjunto_de_datos_aplicabilidad_m3s1_cngmd2025_csv.zip"
ZIP_RH = RAW / "conjunto_de_datos_rec_huma_sp_cngmd2025_csv.zip"
ZIP_M5 = RAW / "conjunto_de_datos_aplicabilidad_m5_cngmd2025_csv.zip"

QUIEN_EJERCE = {
    1: "institución municipal",
    2: "institución municipal junto con otras o con cuerpos comunales",
    3: "sin policía municipal: la ejerce otra institución (estatal o federal)",
    4: "sin policía municipal: cuerpos comunales autogestivos",
    5: "sin policía municipal: cuerpos comunales adscritos al municipio",
    6: "sin policía municipal: ninguna institución la ejerce",
    7: "otra situación",
    9: "no identificado",
    0: "no aplica (alcaldía de la Ciudad de México)",
    96: "no publicable",
    97: "no sabe",
    98: "no disponible",
}
JUSTICIA_CIVICA = {
    1: "juzgado cívico",
    2: "otra autoridad",
    3: "ninguna",
    4: "otra situación",
    9: "no identificado",
    0: "no aplica (alcaldía de la Ciudad de México)",
    96: "no publicable",
    97: "no sabe",
    98: "no disponible",
}
INSTITUCIONES = {
    1: "ejerce_sedena",
    2: "ejerce_semar",
    3: "ejerce_guardia_nacional",
    4: "ejerce_ssp_estatal",
    5: "ejerce_otra_institucion",
}
FEDERALES = {
    1: "elementos_sedena_en_el_municipio",
    2: "elementos_semar_en_el_municipio",
    3: "elementos_guardia_nacional_en_el_municipio",
}
# Columnas del Cuadro 1 del tabulado, en orden, después de "Total".
CATEGORIAS_CUADRO_1 = [1, 2, 3, 4, 5, 6, 7, 9, 0, 98]
# (entidad, código sitopemu_b) -> datos abiertos menos tabulado. Ver docstring.
DIFERENCIAS_CONOCIDAS = {("16", 1): -1, ("16", 3): 1}
DELITOS_SIN_ENTIDAD_ENVIPE = 20_587
# Nombres de las entidades como los escribe el INEGI, en orden de clave (01 a 32).
ENTIDADES = [
    "Aguascalientes",
    "Baja California",
    "Baja California Sur",
    "Campeche",
    "Coahuila de Zaragoza",
    "Colima",
    "Chiapas",
    "Chihuahua",
    "Ciudad de México",
    "Durango",
    "Guanajuato",
    "Guerrero",
    "Hidalgo",
    "Jalisco",
    "México",
    "Michoacán de Ocampo",
    "Morelos",
    "Nayarit",
    "Nuevo León",
    "Oaxaca",
    "Puebla",
    "Querétaro",
    "Quintana Roo",
    "San Luis Potosí",
    "Sinaloa",
    "Sonora",
    "Tabasco",
    "Tamaulipas",
    "Tlaxcala",
    "Veracruz de Ignacio de la Llave",
    "Yucatán",
    "Zacatecas",
]

# ---------------------------------------------------------------- utilidades


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


def comprobar_huella(p: Path, esperadas: dict[str, str]) -> str:
    """Devuelve el SHA-256 de `p`; se detiene si no coincide con la huella registrada."""
    rel = p.relative_to(RAIZ).as_posix()
    h = sha256(p)
    if esperadas.get(rel) != h:
        raise SystemExit(f"{rel}: SHA-256 {h} != {esperadas.get(rel, 'sin huella registrada')}")
    return h


def exigir(condicion: object, detalle: object) -> None:
    """Se detiene si algo no es lo esperado (no depende de `python -O`)."""
    if not condicion:
        raise SystemExit(f"verificación fallida: {detalle!r}")


def descargar() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for nombre, ruta in FUENTES.items():
        url = BASE + ruta
        partes = urlsplit(url)
        if partes.scheme != "https" or partes.hostname != "www.inegi.org.mx":
            raise ValueError(f"URL fuera de la fuente oficial: {url}")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        tmp = RAW / (nombre + ".part")
        # Esquema y host validados arriba.
        with urllib.request.urlopen(req, timeout=300) as r, tmp.open("wb") as f:  # nosec B310
            f.write(r.read())
        tmp.replace(RAW / nombre)


def leer_csv(zip_path: Path, tabla: str) -> pl.DataFrame:
    """Lee conjunto_de_datos/<tabla>_cngmd2025.csv del ZIP, todo como texto."""
    with zipfile.ZipFile(zip_path) as z:
        datos = z.read(f"conjunto_de_datos/{tabla}_cngmd2025.csv")
    return pl.read_csv(io.BytesIO(datos), infer_schema_length=0)


def entero(col: str) -> pl.Expr:
    # Los conteos traen códigos de texto (NA, NSS, ND, NP) donde no hay número: quedan nulos.
    return pl.col(col).cast(pl.Int64, strict=False)


def si_no(col: str) -> pl.Expr:
    """rnsnni1: 1 = sí -> 1, 2 = no -> 0, cualquier otro código -> nulo."""
    return pl.when(entero(col) == 1).then(1).when(entero(col) == 2).then(0).otherwise(None)


# ---------------------------------------------------------------- CNGMD


def armar_cngmd() -> tuple[pl.DataFrame, dict]:
    info: dict = {}

    # Situación operativa de la función de seguridad pública (m3s1pap1).
    sit = leer_csv(ZIP_M3S1, "m3s1pap1").select(
        "cvegeo", entero("sitopemu_b").alias("codigo_situacion_seguridad_inegi")
    )
    exigir(sit["codigo_situacion_seguridad_inegi"].is_in(list(QUIEN_EJERCE)).all(), "sitopemu_b")
    sit = sit.with_columns(
        pl.col("codigo_situacion_seguridad_inegi")
        .replace_strict(QUIEN_EJERCE, return_dtype=pl.String)
        .alias("quien_ejerce_seguridad"),
        pl.when(pl.col("codigo_situacion_seguridad_inegi").is_in([1, 2]))
        .then(True)
        .when(pl.col("codigo_situacion_seguridad_inegi").is_in([3, 4, 5, 6]))
        .then(False)
        .otherwise(None)
        .alias("tiene_policia_municipal"),
    )

    # Qué institución ejerce la función cuando no hay policía municipal (m3s1pap4; solo código 3).
    inst = (
        leer_csv(ZIP_M3S1, "m3s1pap4")
        .with_columns(entero("institsp_b").alias("institucion"), si_no("rnsnni1").alias("v"))
        .filter(pl.col("institucion").is_in(list(INSTITUCIONES)))
        .with_columns(pl.col("institucion").replace_strict(INSTITUCIONES).alias("var"))
        .pivot(on="var", index="cvegeo", values="v", aggregate_function="max")
    )

    # Mando Único Policial con el gobierno estatal (m3s1pap2; solo se pregunta con código 2).
    mando = leer_csv(ZIP_M3S1, "m3s1pap2").select(
        "cvegeo", si_no("rnsnni1").alias("mando_unico_con_el_estado")
    )

    # Personal de la institución municipal (m3s1p22, suma de grados) y titular (m3s1p21).
    p22 = leer_csv(ZIP_RH, "m3s1p22")
    pers = p22.group_by("cvegeo").agg(
        entero("sexostt").sum().alias("_suma"),
        entero("sexostt").is_not_null().sum().alias("_numericas"),
    )
    pers = pers.select(
        "cvegeo",
        pl.when(pl.col("_numericas") > 0).then(pl.col("_suma")).alias("policias_municipales"),
    )
    tit = leer_csv(ZIP_RH, "m3s1p21").select(
        "cvegeo",
        # sexo_i: 1 hombre, 2 mujer, 9 no identificado (plaza ocupada); 3 = plaza vacante.
        pl.when(entero("sexo_i").is_in([1, 2, 9]))
        .then(1)
        .when(entero("sexo_i") == 3)
        .then(0)
        .otherwise(None)
        .alias("_titular"),
    )
    pers = pers.join(tit, on="cvegeo", how="full", coalesce=True).with_columns(
        (pl.col("policias_municipales") + pl.col("_titular").fill_null(0)).alias(
            "policias_municipales_con_titular"
        )
    )

    # Elementos federales asignados a funciones de seguridad del municipio (m3s1p35).
    fed = (
        leer_csv(ZIP_RH, "m3s1p35")
        .with_columns(entero("tipoinst_b").alias("tipo"), entero("rnsnni1").alias("r"))
        .filter(pl.col("tipo").is_in(list(FEDERALES)))
        .with_columns(
            pl.when(pl.col("r") == 1)
            .then(entero("perioatt"))
            .when(pl.col("r") == 2)
            .then(pl.lit(0, dtype=pl.Int64))
            .otherwise(pl.lit(None, dtype=pl.Int64))
            .alias("n"),
            pl.col("tipo").replace_strict(FEDERALES).alias("var"),
        )
        .pivot(on="var", index="cvegeo", values="n", aggregate_function="first")
    )

    # Justicia cívica (m5sapp1).
    jc = leer_csv(ZIP_M5, "m5sapp1").select("cvegeo", entero("situoper_b").alias("_jc"))
    exigir(jc["_jc"].is_in(list(JUSTICIA_CIVICA)).all(), "situoper_b")
    jc = jc.select(
        "cvegeo",
        pl.col("_jc")
        .replace_strict(JUSTICIA_CIVICA, return_dtype=pl.String)
        .alias("justicia_civica"),
    )

    cat = pl.read_csv(REF, schema_overrides={"CVEGEO": pl.String}).select(
        pl.col("CVEGEO").alias("cvegeo")
    )
    info["claves_cngmd_fuera_del_catalogo"] = sit.join(cat, on="cvegeo", how="anti")[
        "cvegeo"
    ].to_list()
    info["claves_catalogo_sin_cngmd"] = cat.join(sit, on="cvegeo", how="anti")["cvegeo"].to_list()
    exigir(sit.height == 2478 and sit["cvegeo"].n_unique() == 2478, "2,478 municipios únicos")
    exigir(not info["claves_cngmd_fuera_del_catalogo"], info["claves_cngmd_fuera_del_catalogo"])
    exigir(not info["claves_catalogo_sin_cngmd"], info["claves_catalogo_sin_cngmd"])

    df = (
        sit.join(inst, on="cvegeo", how="left")
        .join(mando, on="cvegeo", how="left")
        .join(pers.drop("_titular"), on="cvegeo", how="left")
        .join(fed, on="cvegeo", how="left")
        .join(jc, on="cvegeo", how="left")
        .with_columns(pl.col("cvegeo").str.slice(0, 2).alias("cve_ent"))
        .select(
            "cvegeo",
            "cve_ent",
            "quien_ejerce_seguridad",
            "tiene_policia_municipal",
            "codigo_situacion_seguridad_inegi",
            "policias_municipales",
            "policias_municipales_con_titular",
            *INSTITUCIONES.values(),
            "mando_unico_con_el_estado",
            *FEDERALES.values(),
            "justicia_civica",
        )
        .sort("cvegeo")
    )

    # Totales nacionales publicados (Reporte de resultados del 19-mar-2026 y Cuadro 3 del tabulado).
    hombres_mujeres = p22.select(entero("sexos1").sum(), entero("sexos2").sum()).row(0)
    info["policias_sin_titular"] = int(df["policias_municipales"].sum())
    info["policias_hombres_mujeres"] = list(hombres_mujeres)
    info["policias_con_titular"] = int(df["policias_municipales_con_titular"].sum())
    exigir(info["policias_sin_titular"] == 164_224, info["policias_sin_titular"])
    exigir(tuple(hombres_mujeres) == (120_773, 43_451), hombres_mujeres)
    exigir(info["policias_con_titular"] == 166_090, info["policias_con_titular"])
    info["con_institucion_y_sin_policias_numericos"] = df.filter(
        pl.col("tiene_policia_municipal") & pl.col("policias_municipales").is_null()
    )["cvegeo"].to_list()
    info["con_institucion_y_cero_policias"] = df.filter(
        pl.col("tiene_policia_municipal") & (pl.col("policias_municipales") == 0)
    )["cvegeo"].to_list()
    info["municipios_por_situacion"] = {
        r["quien_ejerce_seguridad"]: r["len"]
        for r in df.group_by("quien_ejerce_seguridad").len().iter_rows(named=True)
    }
    info["municipios_por_justicia_civica"] = {
        r["justicia_civica"]: r["len"]
        for r in df.group_by("justicia_civica").len().iter_rows(named=True)
    }
    return df, info


def verificar_cuadro_1(df: pl.DataFrame) -> dict:
    """Compara municipios por entidad y situación contra el Cuadro 1 del tabulado básico."""
    ws = openpyxl.load_workbook(RAW / "cngmd2025_seg_publica.xlsx", read_only=True, data_only=True)[
        "1"
    ]
    publicado: dict[tuple[str, int], int] = {}
    for fila in ws.iter_rows(values_only=True):
        if fila and isinstance(fila[0], str) and len(fila[0]) == 2 and fila[0].isdigit():
            valores = fila[4 : 4 + len(CATEGORIAS_CUADRO_1)]
            exigir(sum(valores) == fila[3], ("total del cuadro", fila[0]))
            for codigo, n in zip(CATEGORIAS_CUADRO_1, valores, strict=True):
                publicado[(fila[0], codigo)] = n
    exigir(len({k[0] for k in publicado}) == 33, "32 entidades más el total nacional")
    datos = {
        (r["cve_ent"], r["codigo_situacion_seguridad_inegi"]): r["len"]
        for r in df.group_by("cve_ent", "codigo_situacion_seguridad_inegi")
        .len()
        .iter_rows(named=True)
    }
    diferencias = {}
    for (ent, codigo), n_pub in publicado.items():
        if ent == "00":
            n_dat = sum(v for (e, c), v in datos.items() if c == codigo)
        else:
            n_dat = datos.get((ent, codigo), 0)
        if n_dat != n_pub:
            diferencias[f"{ent}-{codigo}"] = n_dat - n_pub
    esperadas = {f"{e}-{c}": d for (e, c), d in DIFERENCIAS_CONOCIDAS.items()}
    esperadas |= {f"00-{c}": d for (e, c), d in DIFERENCIAS_CONOCIDAS.items()}
    exigir(diferencias == esperadas, diferencias)
    tumbiscatio = df.filter(pl.col("cvegeo") == "16096")["codigo_situacion_seguridad_inegi"].item()
    exigir(tumbiscatio == 3, tumbiscatio)
    return {
        "celdas_comparadas": len(publicado),
        "diferencias_datos_abiertos_menos_tabulado": diferencias,
        "explicacion": "Tumbiscatío (16096) está en el código 3 en los datos abiertos; el tabulado "
        "lo cuenta en el código 1. Se conserva el dato abierto.",
    }


# ---------------------------------------------------------------- ENVIPE


def leer_cuadro_3_3(path: Path) -> list[list]:
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True)["3.3"]
    filas = []
    for fila in ws.iter_rows(values_only=True):
        v = [x for x in fila if x is not None]
        if len(v) >= 4 and isinstance(v[0], str) and isinstance(v[1], (int, float)):
            filas.append(v[:4])
        if len(filas) == 33:
            break
    return filas


def armar_envipe() -> tuple[pl.DataFrame, dict]:
    est = leer_cuadro_3_3(RAW / "III_denuncia_delito_2026_est.xlsx")
    cv = leer_cuadro_3_3(RAW / "III_denuncia_delito_2026_cv.xlsx")
    exigir(len(est) == 33 and len(cv) == 33, (len(est), len(cv)))
    exigir(est[0][0] == "Estados Unidos Mexicanos", est[0][0])
    # El cuadro lista las entidades en orden de clave; cada renglón se comprueba por nombre.
    nombres = ["Estados Unidos Mexicanos", *ENTIDADES]
    claves = [f"{i:02d}" for i in range(33)]
    for e, c, nom in zip(est, cv, nombres, strict=True):
        exigir(e[0] == c[0] == nom, (e[0], c[0], nom))
    df = pl.DataFrame(
        {
            "cve_ent": claves,
            "entidad": [e[0] for e in est],
            "delitos_ocurridos_2025": [int(e[1]) for e in est],
            "delitos_no_denunciados_o_sin_carpeta_2025": [int(e[2]) for e in est],
            "cifra_oculta_pct_2025": [float(e[3]) for e in est],
            "cifra_oculta_coef_variacion_pct": [float(c[3]) for c in cv],
        }
    )
    estados = df.filter(pl.col("cve_ent") != "00")
    nacional = df.filter(pl.col("cve_ent") == "00").row(0, named=True)
    info = {
        "suma_estados_mas_sin_entidad": int(estados["delitos_ocurridos_2025"].sum())
        + DELITOS_SIN_ENTIDAD_ENVIPE,
        "nacional": nacional["delitos_ocurridos_2025"],
        "cifra_oculta_nacional_pct": round(nacional["cifra_oculta_pct_2025"], 2),
        "min": estados.sort("cifra_oculta_pct_2025").row(0, named=True),
        "max": estados.sort("cifra_oculta_pct_2025").row(-1, named=True),
    }
    exigir(info["suma_estados_mas_sin_entidad"] == info["nacional"], info)
    exigir(round(nacional["cifra_oculta_pct_2025"], 1) == 93.4, nacional)
    return df, info


# ---------------------------------------------------------------- main


def main() -> None:
    ap = argparse.ArgumentParser(
        description="CNGMD 2025 (seguridad pública municipal) y ENVIPE 2026."
    )
    ap.add_argument(
        "--descargar", action="store_true", help="vuelve a bajar los archivos del INEGI"
    )
    args = ap.parse_args()
    if args.descargar:
        descargar()
    esperadas = huellas_registradas("data/raw/externos/seguridad/")
    hashes = {n: comprobar_huella(RAW / n, esperadas) for n in FUENTES}

    cngmd, info_cngmd = armar_cngmd()
    info_cngmd["cuadro_1"] = verificar_cuadro_1(cngmd)
    envipe, info_envipe = armar_envipe()

    OUT.mkdir(parents=True, exist_ok=True)
    VERIF_JSON.parent.mkdir(parents=True, exist_ok=True)
    cngmd.write_parquet(OUT / "cngmd_seguridad_municipal.parquet")
    envipe.write_parquet(OUT / "envipe_cifra_oculta_estatal.parquet")
    v = {
        "cngmd": info_cngmd,
        "envipe": info_envipe,
        "hashes": hashes,
        "columnas_cngmd": {c: str(t) for c, t in cngmd.schema.items()},
        "columnas_envipe": {c: str(t) for c, t in envipe.schema.items()},
    }
    VERIF_JSON.write_text(
        json.dumps(v, ensure_ascii=False, indent=1, default=str), encoding="utf-8"
    )
    print(
        json.dumps(
            {k: v[k] for k in ("cngmd", "envipe")}, ensure_ascii=False, indent=1, default=str
        )
    )


if __name__ == "__main__":
    main()
