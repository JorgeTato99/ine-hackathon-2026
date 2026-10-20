"""Compara los parquet actas_{2009,2012,2015} con cifras oficiales publicadas por el IFE y el INE.

Requiere haber corrido antes scripts/externos/fuente_actas_2009_2015.py.

Evidencias (todas IFE/INE, guardadas en data/raw/computos_{anio}/verificacion/; URL y SHA-256 en
data/reference/huellas_fuentes_externas.csv)
    - 2012, nacional: página del cómputo distrital de Presidente por entidad, copia de la Wayback
      Machine de http://computos2012.ife.org.mx/reportes/presidente/distritalPresidenteEF.html
      (captura 20120830144813; "Fecha y hora de impresión: 08/jul/2012 20:11").
    - 2012, por distrito: 32 páginas distritalPresidenteDistrito[N].html del mismo sitio
      (capturas de la Wayback de 2016), en verificacion/presidente_por_distrito/.
    - 2015: JSON nacional del sitio de cómputos distritales
      http://computos2015.ine.mx/JSON/DIPUTADO/NACIONAL/diputados_nacional.json (Wayback
      20150813084057) y la base por casilla del mismo sitio,
      http://computos2015.ine.mx/20150613_0000-listaActas.tar.gz.
    - 2009 y 2015, representación proporcional: el script suma DiputadosRP{2009,2015}.csv con y sin
      las casillas anuladas por el TEPJF; esas sumas se comparan a mano con los acuerdos
      CG426/2009 e INE/CG804/2015 (PDF en verificacion/). La lista nominal se compara a mano
      con CG322/2012 y CG203/2009.

Herramienta externa
    La base de cómputos 2015 se llama .tar.gz pero es un RAR v4. Se extrajo a mano, una sola vez,
    con bsdtar (libarchive), sin ejecutar nada de su contenido:
        bsdtar -xf data/raw/computos_2015/20150613_0000-listaActas.tar.gz \
            -C data/raw/computos_2015/computos2015_listaActas
    El script solo lee el diputados.csv extraído y comprueba su SHA-256.

Qué produce
    data/processed/externos/verificaciones/actas_2009_2015_verificacion.json (y lo imprime).

Cómo correrlo (desde la raíz del repo; solo usa polars):
    uv tool run --from uv==0.13.1 uv run --locked python -I scripts/externos/verificar_actas_2009_2015.py

Verificaciones
    - 2012: casillas (aprobadas, instaladas, con paquete) y votos por partido y por candidatura
      contra el cómputo distrital nacional; los 300 distritos contra las páginas por distrito.
    - 2015: totales contra el JSON nacional; cruce casilla por casilla con la base de cómputos.
    - 2009 y 2015: sumas de MR y de RP con y sin casillas anuladas.
    - SHA-256 de cada evidencia contra huellas_fuentes_externas.csv.

Seguridad
    No descarga nada. Las páginas HTML y el JSON se leen como texto: se les quitan las etiquetas
    con expresiones regulares y se cargan con json.loads; no se ejecuta ningún script de ellas.
"""

import csv
import hashlib
import io
import json
import re
import sys
from pathlib import Path

import polars as pl

RAIZ = next(
    p
    for p in [Path(__file__).resolve(), *Path(__file__).resolve().parents]
    if (p / "pyproject.toml").is_file()
)
HUELLAS = RAIZ / "data" / "reference" / "huellas_fuentes_externas.csv"
PROC = RAIZ / "data" / "processed" / "externos"
RAW = RAIZ / "data" / "raw"
SALIDA = PROC / "verificaciones" / "actas_2009_2015_verificacion.json"
DISTRITOS_2012 = RAW / "computos_2012" / "verificacion" / "presidente_por_distrito"


def comprobar_evidencias() -> dict[str, str]:
    """SHA-256 de cada archivo de verificación contra huellas_fuentes_externas.csv."""
    with HUELLAS.open(encoding="utf-8", newline="") as f:
        esperadas = {r["archivo_relativo"]: r["sha256"] for r in csv.DictReader(f)}
    archivos = [
        RAW / "computos_2012" / "verificacion" / "distritalPresidenteEF_wayback20120830144813.html",
        *sorted(DISTRITOS_2012.glob("presidente_entidad*.html")),
        RAW / "computos_2015" / "verificacion" / "diputados_nacional_wayback20150813084057.json",
        RAW / "computos_2015" / "computos2015_listaActas" / "diputados.csv",
        RAW / "computos_2015" / "DiputadosRP2015.csv",
        RAW / "computos_2009" / "DiputadosRP2009.csv",
    ]
    if len(archivos) != 37:
        raise SystemExit(f"se esperaban 32 páginas por entidad en {DISTRITOS_2012}")
    huellas = {}
    for p in archivos:
        rel = p.relative_to(RAIZ).as_posix()
        with p.open("rb") as f:
            h = hashlib.file_digest(f, "sha256").hexdigest()
        if esperadas.get(rel) != h:
            raise SystemExit(f"{rel}: SHA-256 {h} != {esperadas.get(rel, 'sin huella registrada')}")
        huellas[rel] = h
    return huellas


def suma(t: pl.DataFrame, cols: list[str]) -> dict:
    return {c: int(t[c].fill_null(0).sum()) for c in cols}


def resumen_basico(t: pl.DataFrame) -> dict:
    return {
        "filas": t.height,
        "por_tipo": dict(t.group_by("tipo_casilla").len().sort("tipo_casilla").iter_rows()),
        "por_estado": dict(t.group_by("estado").len().sort("estado").iter_rows()),
        "estatus_acta_original": dict(
            t.group_by("estatus_acta_original").len().sort("len", descending=True).iter_rows()
        ),
        "tepjf_original": dict(
            t.group_by("tepjf_original").len().sort("len", descending=True).iter_rows()
        ),
        "votos_en_no_computadas": int(
            t.filter(pl.col("estado") != "computada")["total_votos"].fill_null(0).sum()
        ),
    }


def v2012() -> dict:
    t = pl.read_parquet(PROC / "actas_2012.parquet")
    cols = [
        "votos_pan",
        "votos_pri",
        "votos_prd",
        "votos_pvem",
        "votos_pt",
        "votos_mc",
        "votos_nva_alianza",
        "votos_pri_pvem",
        "votos_prd_pt_mc",
        "votos_prd_pt",
        "votos_prd_mc",
        "votos_pt_mc",
        "no_registrados",
        "votos_nulos",
        "total_votos",
    ]
    html = (
        RAW / "computos_2012" / "verificacion" / "distritalPresidenteEF_wayback20120830144813.html"
    ).read_text(encoding="latin-1")
    texto = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
    tras_zac = texto[texto.index("ZACATECAS") :]
    nums = re.findall(r"\b\d+\b", tras_zac.split("%", 16)[-1].split("Votos por candidato")[0])
    nac = [int(x) for x in nums[: 4 + len(cols)]]
    oficial_cas = dict(
        zip(["aprobadas", "instaladas", "con_paquete", "computadas"], nac[:4], strict=False)
    )
    oficial = dict(zip(cols, nac[4:], strict=False))
    cand_txt = texto[texto.index("Votos por candidato") :]
    cn = [int(x) for x in re.findall(r"\b\d+\b", cand_txt)[:11]]
    oficial_cand = dict(
        zip(
            [
                "aprobadas",
                "instaladas",
                "con_paquete",
                "computadas",
                "PAN",
                "PRI_PVEM_coal",
                "PRD_PT_MC_coal",
                "NUEVA_ALIANZA",
                "no_registrados",
                "votos_nulos",
                "total",
            ],
            cn,
            strict=False,
        )
    )
    arch = suma(t, cols)
    sin_anul = suma(t.filter(~pl.col("anulada_tepjf")), cols)

    def cand(d):
        return {
            "PAN (candidatura del PAN)": d["votos_pan"],
            "PRI+PVEM+PRI_PVEM (coalición PRI-PVEM)": d["votos_pri"]
            + d["votos_pvem"]
            + d["votos_pri_pvem"],
            "PRD+PT+MC+combinaciones (coalición PRD-PT-MC)": d["votos_prd"]
            + d["votos_pt"]
            + d["votos_mc"]
            + d["votos_prd_pt_mc"]
            + d["votos_prd_pt"]
            + d["votos_prd_mc"]
            + d["votos_pt_mc"],
            "NVA_ALIANZA (candidatura de Nueva Alianza)": d["votos_nva_alianza"],
        }

    return {
        "basico": resumen_basico(t),
        "oficial_computo_distrital_casillas": oficial_cas,
        "oficial_computo_distrital_votos": oficial,
        "oficial_votos_por_candidato": oficial_cand,
        "archivo_todas_las_filas": arch,
        "diferencia_archivo_menos_oficial": {c: arch[c] - oficial[c] for c in cols},
        "archivo_sin_casillas_anuladas_tepjf": sin_anul,
        "candidaturas_archivo": cand(arch),
        "candidaturas_archivo_sin_anuladas": cand(sin_anul),
        "lista_nominal_suma_todas": int(t["lista_casilla"].fill_null(0).sum()),
        "lista_nominal_suma_sin_M": int(
            t.filter(pl.col("tipo_casilla") != "M")["lista_casilla"].fill_null(0).sum()
        ),
        "lista_nominal_solo_M": int(
            t.filter(pl.col("tipo_casilla") == "M")["lista_casilla"].fill_null(0).sum()
        ),
        "no_instaladas_oficial": oficial_cas["aprobadas"] - oficial_cas["instaladas"],
        "paquetes_no_recibidos_oficial": oficial_cas["instaladas"] - oficial_cas["con_paquete"],
        "paquete_no_entregado_con_votos": t.filter(
            (pl.col("estado") == "paquete no recibido") & (pl.col("total_votos") > 0)
        )
        .select(
            "EDOCVE", "distrito", "SECCION", "casilla_original", "total_votos", "tepjf_original"
        )
        .rows(),
    }


def v2012_por_distrito() -> dict:
    """Total de votos por distrito: archivo SICEEF contra las páginas de cómputo distrital del IFE."""
    filas = []
    marca = "Votación Total".encode().decode("latin-1")  # las páginas son UTF-8 leídas como latin-1
    for p in sorted(DISTRITOS_2012.glob("presidente_entidad*.html")):
        edo = int(p.name[len("presidente_entidad") :][:2])
        t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", p.read_text(encoding="latin-1")))
        inicio = t.index(marca) if marca in t else t.index("Votaci")
        cuerpo = t[inicio : t.index("TOTAL DE LA ENTIDAD")]
        for m in re.finditer(r"(?:^|\s)(\d{1,2}) ([^\d%]+?) ((?:\d+ ){19}\d+)", cuerpo):
            n = [int(x) for x in m.group(3).split()]
            filas.append(
                {
                    "EDOCVE": edo,
                    "distrito": int(m.group(1)),
                    "of_aprobadas": n[0],
                    "of_instaladas": n[1],
                    "of_paquetes": n[2],
                    "of_total": n[19],
                    "of_nulos": n[18],
                    "of_pan": n[4],
                }
            )
    of = pl.DataFrame(filas).with_columns(
        pl.col("EDOCVE").cast(pl.Int8), pl.col("distrito").cast(pl.Int16)
    )
    t = pl.read_parquet(PROC / "actas_2012.parquet")
    ar = t.group_by("EDOCVE", "distrito").agg(
        filas=pl.len(),
        total=pl.col("total_votos").sum(),
        pan=pl.col("votos_pan").sum(),
        nulos=pl.col("votos_nulos").sum(),
        con_tepjf=pl.col("tepjf_original").is_not_null().sum(),
        recontadas=(pl.col("tepjf_original") == "Casilla recontada").sum(),
    )
    m = of.join(ar, on=["EDOCVE", "distrito"], how="full", coalesce=True)
    dif = m.filter(pl.col("total") != pl.col("of_total"))
    return {
        "distritos_oficiales": of.height,
        "distritos_archivo": ar.height,
        "aprobadas_distinto_de_filas": m.filter(pl.col("of_aprobadas") != pl.col("filas")).height,
        "distritos_con_total_distinto": dif.height,
        "de_ellos_con_casillas_tepjf": dif.filter(pl.col("con_tepjf") > 0).height,
        "distritos_con_tepjf": m.filter(pl.col("con_tepjf") > 0).height,
        "distritos_con_recontadas": m.filter(pl.col("recontadas") > 0).height,
        "distritos_con_recontadas_y_total_igual": m.filter(
            (pl.col("recontadas") > 0) & (pl.col("total") == pl.col("of_total"))
        ).height,
        "suma_diferencias": int((dif["total"] - dif["of_total"]).sum()),
        "suma_oficial_distritos": int(of["of_total"].sum()),
        "detalle_distritos_con_diferencia": dif.select(
            "EDOCVE", "distrito", "of_total", "total", "con_tepjf", "recontadas"
        )
        .with_columns(diferencia=pl.col("total") - pl.col("of_total"))
        .sort("EDOCVE", "distrito")
        .to_dicts(),
    }


def leer_computos2015() -> pl.DataFrame:
    p = RAW / "computos_2015" / "computos2015_listaActas" / "diputados.csv"
    lineas = p.read_text(encoding="utf-8").splitlines()
    ini = next(i for i, linea in enumerate(lineas) if linea.startswith("ESTADO|"))
    c = pl.read_csv(io.StringIO("\n".join(lineas[ini:])), separator="|", infer_schema=False)

    def num(col):
        return pl.col(col).str.strip_chars().replace({"-": None, "": None}).cast(pl.Int64)

    return c.select(
        EDOCVE=num("ESTADO").cast(pl.Int8),
        distrito=num("DISTRITO").cast(pl.Int16),
        SECCION=num("SECCION").cast(pl.Int32),
        id_casilla=num("ID_CASILLA"),
        tipo=pl.col("TIPO_CASILLA"),
        ext=num("EXT_CONTIGUA"),
        tipo_acta=num("TIPO_ACTA"),
        c_pan=num("PAN"),
        c_total=num("TOTAL_VOTOS"),
        c_lista=num("LISTA_NOMINAL"),
        c_obs=pl.col("OBSERVACIONES").str.strip_chars(),
        c_cont=num("CONTABILIZADA"),
    )


def clave_siceef(t: pl.DataFrame) -> pl.DataFrame:
    """Traduce 'C01', 'E02C03', 'SMR01' al par (tipo, id_casilla, ext_contigua) del sistema de cómputos."""
    c = pl.col("casilla_original")
    return t.with_columns(
        tipo=pl.when(c == "B")
        .then(pl.lit("B"))
        .when(c.str.starts_with("SMR"))
        .then(pl.lit("S"))
        .otherwise(c.str.slice(0, 1)),
        id_casilla=pl.when(c == "B")
        .then(pl.lit(1, pl.Int64))
        .otherwise(c.str.extract(r"^[A-Z]+(\d+)", 1).cast(pl.Int64)),
        ext=pl.when(c.str.contains(r"^E\d+C\d+$"))
        .then(c.str.extract(r"C(\d+)$", 1).cast(pl.Int64))
        .otherwise(pl.lit(0, pl.Int64)),
    )


def v2015() -> dict:
    t = pl.read_parquet(PROC / "actas_2015.parquet")
    cols = [c for c in t.columns if c.startswith("votos_")] + [
        "no_registrados",
        "total_votos",
        "lista_casilla",
    ]
    jtxt = (
        RAW / "computos_2015" / "verificacion" / "diputados_nacional_wayback20150813084057.json"
    ).read_text(encoding="utf-8")
    j = json.loads(jtxt[jtxt.index("{") :].rstrip().rstrip(";"))

    def n(s):
        return int(str(s).replace(",", ""))

    oficial_json = {k: n(j[k]) for k in ["totAct", "totActMR", "lstNml", "totVot", "totVotMR"]}
    oficial_json.update(
        {
            "casInst": n(j["casInst"]["tot"]),
            "casPaqR": n(j["casPaqR"]["tot"]),
            "casNoInst": n(j["casNoInst"]["tot"]),
            "casPaqNoR": n(j["casPaqNoR"]["tot"]),
            "archCrt": j["archCrt"],
            "fchCrt": j["fchCrt"],
        }
    )
    oficial_json["votPtdConDst"] = {d["sglPtd"].strip(): n(d["tot"]) for d in j["votPtdConDst"]}
    c = leer_computos2015()
    mr = c.filter(pl.col("tipo_acta").is_in([2, 3]))
    k = ["EDOCVE", "distrito", "SECCION", "tipo", "id_casilla", "ext"]
    s = clave_siceef(t)
    m = s.join(mr, on=k, how="full", coalesce=True)
    ordinaria = m.filter(~pl.col("eleccion_extraordinaria").fill_null(False))
    return {
        "basico": resumen_basico(t),
        "archivo_todas_las_filas": suma(t, cols),
        "archivo_sin_anuladas_tepjf": suma(t.filter(~pl.col("anulada_tepjf")), cols),
        "archivo_sin_ags01_extraordinaria": suma(
            t.filter(~pl.col("eleccion_extraordinaria")), cols
        ),
        "oficial_sitio_computos2015_json": oficial_json,
        "base_computos2015_mr": {
            "filas_mr": mr.height,
            "total_votos": int(mr["c_total"].fill_null(0).sum()),
            "lista_nominal": int(mr["c_lista"].fill_null(0).sum()),
            "observaciones": dict(
                mr.group_by("c_obs").len().sort("len", descending=True).iter_rows()
            ),
        },
        "cruce_siceef_vs_base_computos2015": {
            "filas_sin_pareja_siceef": int(
                m.filter(pl.col("c_total").is_null() & pl.col("total_votos").is_not_null()).height
            ),
            "filas_sin_pareja_computos": int(
                m.filter(pl.col("total_votos").is_null() & pl.col("c_total").is_not_null()).height
            ),
            "lista_distinta": int(
                ordinaria.filter(pl.col("lista_casilla") != pl.col("c_lista")).height
            ),
            "total_distinto_fuera_de_ags01": int(
                ordinaria.filter(pl.col("total_votos") != pl.col("c_total")).height
            ),
            "total_distinto_y_tepjf_vacio_fuera_de_ags01": int(
                ordinaria.filter(
                    (pl.col("total_votos") != pl.col("c_total"))
                    & pl.col("tepjf_original").is_null()
                ).height
            ),
            "diferencia_total_votos_fuera_de_ags01": int(
                (ordinaria["total_votos"].fill_null(0) - ordinaria["c_total"].fill_null(0)).sum()
            ),
        },
    }


def v2009() -> dict:
    t = pl.read_parquet(PROC / "actas_2009.parquet")
    cols = [c for c in t.columns if c.startswith("votos_")] + [
        "no_registrados",
        "total_votos",
        "lista_casilla",
    ]
    return {
        "basico": resumen_basico(t),
        "archivo_todas_las_filas": suma(t, cols),
        "archivo_sin_anuladas_tepjf": suma(t.filter(~pl.col("anulada_tepjf")), cols),
    }


def rp_sin_anuladas(ruta: Path) -> dict:
    crudo = ruta.read_bytes()
    try:
        txt = crudo.decode("utf-8-sig")
    except UnicodeDecodeError:
        txt = crudo.decode("cp1252")
    d = pl.read_csv(io.StringIO(txt), infer_schema=False)
    vot = [
        c
        for c in d.columns[9:]
        if c not in ("ESTATUS_ACTA", "TEPJF", "OBSERVACIONES", "RUTA_ACTA", "LISTA_NOMINAL")
    ]
    d = d.with_columns([pl.col(c).str.strip_chars().replace("", None).cast(pl.Int64) for c in vot])
    out = {}
    for nombre, f in [
        ("todas", d),
        ("sin_anuladas", d.filter(pl.col("TEPJF").fill_null("").str.to_lowercase() != "anulada")),
    ]:
        out[nombre] = {c: int(f[c].fill_null(0).sum()) for c in vot}
        out[nombre]["filas"] = f.height
    return out


def main() -> None:
    huellas = comprobar_evidencias()
    res = {
        "2012": v2012(),
        "2012_por_distrito": v2012_por_distrito(),
        "2015": v2015(),
        "2009": v2009(),
        "rp_2015": rp_sin_anuladas(RAW / "computos_2015" / "DiputadosRP2015.csv"),
        "rp_2009": rp_sin_anuladas(RAW / "computos_2009" / "DiputadosRP2009.csv"),
        "huellas_evidencias": huellas,
    }
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps(res, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    json.dump(res, sys.stdout, ensure_ascii=False, indent=1, default=str)


if __name__ == "__main__":
    main()
