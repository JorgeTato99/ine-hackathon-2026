"""Prueba del 22 de octubre de 2026: 39 variables que ya teníamos y nunca se probaron.

Mismo protocolo que el notebook 04b: estabilidad en las dos intermedias y mejora en las dos validaciones,
con confirmación en el ensamble final. Resultados en docs/variables/cambios-y-pruebas.md.

Uso, desde la raíz del repositorio y después de correr los notebooks 03 a 05:

    uv run --locked python notebooks/pruebas_variables/variables_no_probadas.py
"""
import io
import warnings

import numpy as np
import polars as pl
from scipy.stats import rankdata, spearmanr
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import HuberRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings('ignore')
pl.Config.set_tbl_rows(80); pl.Config.set_tbl_width_chars(230); pl.Config.set_fmt_str_lengths(60)
rng = np.random.default_rng(2027)
P, E = 'data/processed/', 'data/processed/externos/'
OUT = 'data/processed/pruebas/'   # carpeta local, fuera de git
v = pl.read_parquet(P + 'variables_transiciones.parquet')
panel = pl.read_parquet(P + 'panel_municipal.parquet')
C = {2015: 2010, 2021: 2020, 2027: 2020}          # censo / CONEVAL / CONAPO, como FUENTE_SOCIAL del 03b
PRES = {2015: 2012, 2021: 2018, 2027: 2024}
FUENTE = {}

def por_T(nombre_fuente, tabla_por_anio, columnas):
    """tabla_por_anio: función anio_fuente -> DataFrame(cvegeo, columnas...)."""
    partes = []
    for T, a in C.items():
        partes.append(tabla_por_anio(a).with_columns(eleccion_objetivo=pl.lit(T, pl.Int16)))
    for c in columnas: FUENTE[c] = nombre_fuente
    return pl.concat(partes, how='diagonal_relaxed').select('cvegeo', 'eleccion_objetivo', *columnas)

# 1 · CONEVAL pobreza: componentes no usados
CP = ['pobreza_moderada_pct', 'vulnerable_carencias_pct', 'vulnerable_ingreso_pct', 'no_pobre_no_vulnerable_pct', 'carencia_seguridad_social_pct',
      'carencia_calidad_vivienda_pct', 'carencia_servicios_basicos_vivienda_pct', 'carencia_alimentacion_pct', 'tres_o_mas_carencias_pct', 'ingreso_inferior_lpi_pct']
cp = pl.read_parquet(E + 'coneval_pobreza_municipal.parquet')
t1 = por_T('CONEVAL, pobreza municipal (2010, 2015, 2020)', lambda a: cp.filter(pl.col('anio') == a).select('cvegeo', *CP), CP)
# 2 · CONEVAL rezago social
CR = ['indice_rezago_social', 'pct_no_asiste_escuela_6_14', 'pct_viviendas_sin_lavadora', 'pct_viviendas_sin_refrigerador', 'pct_sin_derechohabiencia_salud']
cr_ = pl.read_parquet(E + 'coneval_rezago_social.parquet')
t2 = por_T('CONEVAL, rezago social (2010, 2020)', lambda a: cr_.filter(pl.col('anio') == a).select('cvegeo', *CR), CR)
# 3 · CONAPO marginación: componentes
CM = ['pct_ocupados_hasta_2_salarios_minimos', 'pct_viviendas_hacinamiento', 'pct_ocupantes_piso_tierra', 'pct_ocupantes_sin_agua_entubada',
      'pct_ocupantes_sin_energia_electrica', 'pct_ocupantes_sin_drenaje_ni_sanitario']
cm = pl.read_parquet(E + 'conapo_marginacion.parquet')
t3 = por_T('CONAPO, índice de marginación (2010, 2020)', lambda a: cm.filter(pl.col('anio') == a).select('cvegeo', *CM), CM)
# 4 · CONAPO intensidad migratoria
CI = ['indice_intensidad_migratoria', 'pct_viviendas_migrantes_circulares']
ci = pl.read_parquet(E + 'conapo_intensidad_migratoria.parquet')
t4 = por_T('CONAPO, intensidad migratoria (2010, 2020)', lambda a: ci.filter(pl.col('anio') == a).select('cvegeo', *CI), CI)
# 5 · INEGI censos: proporciones derivadas
def inegi(a):
    d = pl.read_parquet(E + f'inegi_municipal_{a}.parquet')
    return d.select('cvegeo',
                    pct_poblacion_hogares_indigenas=pl.col('poblacion_en_hogares_indigenas') / pl.col('poblacion_total') * 100,
                    pct_nacida_otra_entidad=pl.col('poblacion_nacida_otra_entidad') / pl.col('poblacion_total') * 100,
                    pct_sin_afiliacion_salud=pl.col('poblacion_sin_afiliacion_servicios_salud') / pl.col('poblacion_total') * 100,
                    brecha_escolaridad_hombres_mujeres=pl.col('grado_promedio_escolaridad_hombres') - pl.col('grado_promedio_escolaridad_mujeres'),
                    pct_poblacion_60_mas=pl.col('poblacion_60ymas') / pl.col('poblacion_total') * 100,
                    pct_poblacion_18_24=pl.col('poblacion_18a24') / pl.col('poblacion_total') * 100)
CINE = ['pct_poblacion_hogares_indigenas', 'pct_nacida_otra_entidad', 'pct_sin_afiliacion_salud', 'brecha_escolaridad_hombres_mujeres',
        'pct_poblacion_60_mas', 'pct_poblacion_18_24']
t5 = por_T('INEGI, censos 2010 y 2020', inegi, CINE)
# 6 · Banxico remesas en dólares por habitante (año anterior a la elección; 2027 usa 2025, el último completo)
rem = pl.read_parquet(E + 'banxico_remesas_municipio.parquet')
pob = pl.read_parquet(E + 'conapo_proyecciones_edad_sexo.parquet').group_by('cvegeo', 'anio').agg(poblacion=pl.col('poblacion').sum())
t6 = pl.concat([rem.filter(pl.col('anio') == a).join(pob.filter(pl.col('anio') == a), on='cvegeo')
                .select('cvegeo', remesas_usd_por_habitante_log=(pl.col('remesas_millones_usd') * 1e6 / pl.col('poblacion')).log1p())
                .with_columns(eleccion_objetivo=pl.lit(T, pl.Int16)) for T, a in {2015: 2014, 2021: 2020, 2027: 2025}.items()])
FUENTE['remesas_usd_por_habitante_log'] = 'Banxico, remesas por municipio (año anterior)'
# 7 · SESNSP: delitos de enero a mayo del año de la elección, por 100 mil (no existe para 2027 antes de mayo de 2027)
ses = pl.read_parquet(E + 'sesnsp_delitos_municipio.parquet')
t7 = (ses.filter(pl.col('anio').is_in([2015, 2021]), pl.col('mes') <= 5).group_by('cvegeo', 'anio', 'delito').agg(pl.col('carpetas').sum())
      .join(pob, on=['cvegeo', 'anio']).with_columns(tasa=(pl.col('carpetas') / pl.col('poblacion') * 1e5 * 12 / 5).log1p())
      .pivot(on='delito', index=['cvegeo', 'anio'], values='tasa')
      .rename({'anio': 'eleccion_objetivo'}).with_columns(pl.col('eleccion_objetivo').cast(pl.Int16)))
CS = [c for c in t7.columns if c not in ('cvegeo', 'eleccion_objetivo')]
t7 = t7.rename({c: f'sesnsp_{c}_ene_may_log' for c in CS}); CS = [f'sesnsp_{c}_ene_may_log' for c in CS]
for c in CS: FUENTE[c] = 'SESNSP, carpetas por municipio (enero a mayo del año de la elección)'
# 8 · INEGI homicidios: cambio entre los 3 años previos y los 3 anteriores
hom = pl.read_parquet(E + 'inegi_homicidios_municipio.parquet').filter(pl.col('clave_presente_en_edr_anio'))
def tasa(a0, a1):
    return (hom.filter(pl.col('anio').is_between(a0, a1)).group_by('cvegeo').agg(h=pl.col('homicidios').sum(), n=pl.len()).filter(pl.col('n') == a1 - a0 + 1)
            .join(pob.filter(pl.col('anio') == (a0 + a1) // 2), on='cvegeo').select('cvegeo', r=(pl.col('h') / 3 / pl.col('poblacion') * 1e5).log1p()))
t8 = pl.concat([tasa(a0, a1).join(tasa(a0 - 3, a1 - 3), on='cvegeo', suffix='_ant').select('cvegeo', cambio_homicidios_log=pl.col('r') - pl.col('r_ant'))
                .with_columns(eleccion_objetivo=pl.lit(T, pl.Int16)) for T, (a0, a1) in {2015: (2012, 2014), 2021: (2018, 2020), 2027: (2022, 2024)}.items()])
FUENTE['cambio_homicidios_log'] = 'INEGI, defunciones por homicidio (cambio entre trienios)'
# 9 · INE CCPC: brecha joven y "no sabemos" en la presidencial anterior
t9 = pl.concat([panel.filter(pl.col('AELEC') == p).select(
    'cvegeo', brecha_joven_presidencial=(pl.col('SV_20_29') / (pl.col('SV_20_29') + pl.col('NV_20_29')) - pl.col('SV') / (pl.col('SV') + pl.col('NV'))) * 100,
    pct_no_sabemos_presidencial=pl.col('pct_no_sabemos')).with_columns(pl.col('brecha_joven_presidencial').fill_nan(None), eleccion_objetivo=pl.lit(T, pl.Int16))
    for T, p in PRES.items()])
FUENTE['brecha_joven_presidencial'] = FUENTE['pct_no_sabemos_presidencial'] = 'INE, Conteos Censales (presidencial anterior)'
# 10 · INE cómputos: % de votos nulos en la presidencial anterior
sec = pl.read_parquet(P + 'secciones_territorio_2024.parquet').select('AELEC', pl.col('EDOCVE').cast(pl.Int64), 'SECCION', 'municipio_2024')
def nulos(anio):
    if anio == 2012:
        t = pl.read_parquet(E + 'actas_2012.parquet').filter(pl.col('tipo_casilla').is_in(['B', 'C', 'E']), ~pl.col('anulada_tepjf'))
        t = t.select(pl.col('EDOCVE').cast(pl.Int64), 'SECCION', nulos=pl.col('votos_nulos').cast(pl.Int64), total=pl.col('total_votos').cast(pl.Int64))
    else:
        lineas = open(f'data/raw/computos_{anio}/PRES_{anio}.csv', encoding='utf-8', errors='replace').read().splitlines()
        i = next(k for k, l in enumerate(lineas) if 'CLAVE_CASILLA' in l)
        t = pl.read_csv(io.StringIO('\n'.join(lineas[i:])), separator='|', infer_schema=False, truncate_ragged_lines=True)
        num = lambda c: pl.col(c).str.replace_all(r"[=\"',]", '').cast(pl.Int64, strict=False).fill_null(0)
        ent = 'ID_ENTIDAD' if 'ID_ENTIDAD' in t.columns else 'ID_ESTADO'
        nul = 'VN' if 'VN' in t.columns else 'VOTOS NULOS'
        tot = 'TOTAL' if 'TOTAL' in t.columns else 'TOTAL_VOTOS_CALCULADOS'
        t = t.filter(pl.col('TIPO_CASILLA').is_in(['B', 'C', 'E'])).select(EDOCVE=num(ent), SECCION=num('SECCION').cast(pl.Int32), nulos=num(nul), total=num(tot))
    t = t.with_columns(pl.col('SECCION').cast(pl.Int32)).join(sec.filter(pl.col('AELEC') == anio).drop('AELEC'), on=['EDOCVE', 'SECCION'], how='inner')
    return t.group_by(pl.col('municipio_2024').alias('cvegeo')).agg(pct_votos_nulos_presidencial=pl.col('nulos').sum() / pl.col('total').sum() * 100)
t10 = pl.concat([nulos(p).with_columns(eleccion_objetivo=pl.lit(T, pl.Int16)) for T, p in PRES.items()])
FUENTE['pct_votos_nulos_presidencial'] = 'INE, cómputos por casilla (presidencial anterior)'
print('nulos (mediana por elección):', t10.group_by('eleccion_objetivo').agg(pl.col('pct_votos_nulos_presidencial').median().round(2), pl.len()).sort('eleccion_objetivo').rows())

base = v
for t in (t1, t2, t3, t4, t5, t6, t7, t8, t9, t10):
    base = base.join(t, on=['cvegeo', 'eleccion_objetivo'], how='left')
NUEVAS = list(FUENTE)
base = base.with_columns([pl.when(pl.col(c).cast(pl.Float64).is_finite()).then(pl.col(c).cast(pl.Float64)).alias(c) for c in NUEVAS]).sort('eleccion_objetivo', 'cvegeo')
base.write_parquet(OUT + 'base_pruebas.parquet')
print('vacíos por variable (2015/2021/2027):')
print(pl.DataFrame([{'variable': c, **{str(T): base.filter(pl.col('eleccion_objetivo') == T)[c].null_count() for T in (2015, 2021, 2027)}} for c in NUEVAS]))

def con_resultado(T):
    return base.filter((pl.col('eleccion_objetivo') == T) & pl.col('desviacion_objetivo').is_not_null()
                       & ~pl.col('sin_casilla_objetivo').fill_null(False) & pl.col('desviacion_presidencial').is_not_null())
def spearman_ic(x, y, veces=400):
    ok = ~(np.isnan(x) | np.isnan(y)); x, y = x[ok], y[ok]
    orden = np.lexsort((y, x)); x, y = x[orden], y[orden]
    bs = [spearmanr(x[i], y[i]).statistic for i in (rng.integers(0, len(x), len(x)) for _ in range(veces))]
    return spearmanr(x, y).statistic, np.percentile(bs, 2.5), np.percentile(bs, 97.5), int(ok.sum())
filas = []
for T in (2015, 2021):
    d = con_resultado(T)
    m, b = np.polyfit(d['desviacion_presidencial'], d['desviacion_objetivo'], 1)
    res = d['desviacion_objetivo'].to_numpy() - (b + m * d['desviacion_presidencial'].to_numpy())
    for c in NUEVAS:
        x = d[c].cast(pl.Float64).to_numpy()
        if np.isnan(x).all(): filas.append({'variable': c, 'T': T, 'r': np.nan, 'bajo': np.nan, 'alto': np.nan, 'n': 0}); continue
        r, lo, hi, n = spearman_ic(x, res); filas.append({'variable': c, 'T': T, 'r': r, 'bajo': lo, 'alto': hi, 'n': n})
est = pl.DataFrame(filas)
tabla = (est.group_by('variable').agg(
            r15=pl.col('r').filter(pl.col('T') == 2015).first(), ic15=pl.format('[{}, {}]', pl.col('bajo').filter(pl.col('T') == 2015).first().round(2), pl.col('alto').filter(pl.col('T') == 2015).first().round(2)),
            r21=pl.col('r').filter(pl.col('T') == 2021).first(), ic21=pl.format('[{}, {}]', pl.col('bajo').filter(pl.col('T') == 2021).first().round(2), pl.col('alto').filter(pl.col('T') == 2021).first().round(2)),
            estable=((pl.col('bajo') > 0).all() | (pl.col('alto') < 0).all()))
         .with_columns(pl.col('r15', 'r21').round(2), fuente=pl.col('variable').replace_strict(FUENTE)).sort('estable', pl.col('r21').abs(), descending=True))
print(tabla.select('variable', 'r15', 'ic15', 'r21', 'ic21', 'estable', 'fuente'))
tabla.write_parquet(OUT + 'estabilidad.parquet')

# --- ¿Mejoran la predicción? Huber de 34 variables + cada una
TODAS = ['desviacion_presidencial', 'desviacion_intermedia_previa', 'vecinos_desviacion_presidencial',
         'gobernador_mismo_dia_intermedia', 'diputacion_local_mismo_dia_intermedia', 'ayuntamiento_mismo_dia_intermedia',
         'gobernador_mismo_dia_presidencial', 'diputacion_local_mismo_dia_presidencial', 'ayuntamiento_mismo_dia_presidencial', 'es_sni',
         'margen_presidencial', 'partidos_efectivos_presidencial', 'pct_rural', 'pct_hombres', 'pct_20_29', 'pct_65_mas', 'crecimiento_lista', 'cobertura_lista_20mas',
         'escolaridad_promedio', 'pct_habla_lengua_indigena', 'pct_viviendas_internet', 'pct_residia_otro_pais_hace5', 'pct_residia_otra_entidad_hace5',
         'poblacion_log', 'pct_pobreza', 'pct_pobreza_extrema', 'pct_carencia_salud', 'pct_rezago_educativo', 'marginacion', 'pct_localidades_menos_5000',
         'pct_viviendas_emigrantes', 'pct_viviendas_remesas', 'pct_viviendas_retorno', 'homicidios_100mil_log']
assert len(TODAS) == 34
def huber(): return make_pipeline(SimpleImputer(strategy='median'), StandardScaler(), HuberRegressor(alpha=1.0, epsilon=1.35, max_iter=3000))
def err(y, p): return np.abs((y - np.median(y)) - (p - np.median(p)))
A15, A21 = con_resultado(2015), con_resultado(2021)
SENT = [('15→21', A15, A21), ('21→15', A21, A15)]
def pred(cols, A, B, f=huber):
    return f().fit(A.select(cols).to_numpy().astype(float), A['desviacion_objetivo'].to_numpy()).predict(B.select(cols).to_numpy().astype(float))
ref = {n: pred(TODAS, A, B) for n, A, B in SENT}
def comparar(etq, cols, refs=ref, f=huber, veces=1000):
    fila = {'modelo': etq}
    for n, A, B in SENT:
        y = B['desviacion_objetivo'].to_numpy(); p = pred(cols, A, B, f); d = err(y, p) - err(y, refs[n])
        bs = [d[i].mean() for i in (rng.integers(0, len(d), len(d)) for _ in range(veces))]
        fila[f'error {n}'] = round(err(y, p).mean(), 3); fila[f'cambio {n}'] = round(d.mean(), 3)
        fila[f'IC {n}'] = f'[{np.percentile(bs, 2.5):+.3f}, {np.percentile(bs, 97.5):+.3f}]'; fila[f'mejora {n}'] = bool(np.percentile(bs, 97.5) < 0)
    return fila
filas = [comparar('Huber 34 (referencia)', TODAS)]
for c in NUEVAS:
    if base.filter(pl.col('eleccion_objetivo').is_in([2015, 2021]))[c].null_count() == base.filter(pl.col('eleccion_objetivo').is_in([2015, 2021])).height: continue
    filas.append(comparar(f'+ {c}', TODAS + [c]))
inc = pl.DataFrame(filas)
inc = inc.with_columns(mejora_en_las_dos=pl.col('mejora 15→21') & pl.col('mejora 21→15'))
print(inc.select('modelo', 'error 15→21', 'cambio 15→21', 'IC 15→21', 'error 21→15', 'cambio 21→15', 'IC 21→15', 'mejora_en_las_dos'))
inc.write_parquet(OUT + 'incremental.parquet')
ganan = [m.removeprefix('+ ') for m in inc.filter(pl.col('mejora_en_las_dos'))['modelo'].to_list()]
print('Mejoran en las dos validaciones (Huber):', ganan)

# --- Confirmación con el modelo final (ensamble Huber + random forest)
class Ensamble:
    def fit(self, X, y):
        self.h = huber().fit(X, y)
        self.r = make_pipeline(SimpleImputer(strategy='median'), RandomForestRegressor(n_estimators=300, min_samples_leaf=5, max_features=0.6, random_state=0, n_jobs=-1)).fit(X, y)
        return self
    def predict(self, X): return (self.h.predict(X) + self.r.predict(X)) / 2
if ganan:
    ref_e = {n: pred(TODAS, A, B, Ensamble) for n, A, B in SENT}
    filas = [comparar('Ensamble 34 (referencia)', TODAS, ref_e, Ensamble)]
    filas += [comparar(f'Ensamble + {c}', TODAS + [c], ref_e, Ensamble) for c in ganan]
    if len(ganan) > 1: filas.append(comparar('Ensamble + todas las que ganan', TODAS + ganan, ref_e, Ensamble))
    conf = pl.DataFrame(filas); print(conf.select('modelo', 'error 15→21', 'cambio 15→21', 'IC 15→21', 'error 21→15', 'cambio 21→15', 'IC 21→15'))
    conf.write_parquet(OUT + 'confirmacion_ensamble.parquet')
