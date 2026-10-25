"""Prueba del 22 de octubre de 2026: variables de elecciones de ayuntamiento (Magar, elecRetrns).

Requiere data/raw/externos/magar/aymu1970-on.coalAgg.csv, descargado de
https://raw.githubusercontent.com/emagar/elecRetrns/master/data/aymu1970-on.coalAgg.csv
y la base de variables_no_probadas.py. Resultados en docs/variables/otras-fuentes.md.
"""
import sys
import warnings

import numpy as np
import polars as pl
from scipy.stats import spearmanr
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import HuberRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings('ignore')
pl.Config.set_tbl_rows(40); pl.Config.set_tbl_width_chars(220)
rng = np.random.default_rng(2027)
S = 'data/processed/pruebas/'   # carpeta local, fuera de git
MAGAR = 'data/raw/externos/magar/aymu1970-on.coalAgg.csv'   # https://github.com/emagar/elecRetrns (data/aymu1970-on.coalAgg.csv)
FECHA = {2015: 20150607, 2021: 20210606, 2027: 20270606}   # días de la elección federal

ay = pl.read_csv(MAGAR, infer_schema=False,
                 columns=['emm', 'yr', 'inegi', 'edon', 'date', 'status', 'mg', 'tot', 'lisnom', 'dextra'])
ay = ay.with_columns(pl.col('yr', 'inegi', 'edon', 'date', 'dextra').cast(pl.Int64, strict=False),
                     pl.col('mg', 'tot', 'lisnom').cast(pl.Float64, strict=False))
print('filas:', ay.height, '· estados de status:', ay['status'].value_counts().sort('count', descending=True).head(8).rows())
ay = ay.filter(pl.col('status') == 'ok', pl.col('dextra') == 0, pl.col('lisnom') > 0, pl.col('tot') > 0,
               pl.col('yr') >= 2000, pl.col('inegi').is_not_null(), pl.col('date').is_not_null())
ay = ay.with_columns(cvegeo=pl.col('inegi').cast(pl.Utf8).str.zfill(5), part_local=pl.col('tot') / pl.col('lisnom') * 100)
fuera = ay.filter(~pl.col('part_local').is_between(5, 100)).height
ay = ay.filter(pl.col('part_local').is_between(5, 100))
print('elecciones ordinarias válidas desde 2000:', ay.height, '· descartadas por participación fuera de 5-100 %:', fuera)
# participación federal municipal (nuestro panel) para comparar
panel = pl.read_parquet('data/processed/panel_municipal.parquet').select('cvegeo', 'AELEC', 'participacion')
FED = {2009: 20090705, 2012: 20120701, 2015: 20150607, 2018: 20180701, 2021: 20210606, 2024: 20240602}
filas = []
for T, corte in FECHA.items():
    a = ay.filter(pl.col('date') < corte)
    ult = (a.sort('date').group_by('cvegeo').last()
           .with_columns(mediana_estado=pl.col('part_local').median().over('edon', 'yr'))
           .select('cvegeo', part_local_ultima_vs_estado=pl.col('part_local') - pl.col('mediana_estado'),
                   margen_local_ultimo=pl.col('mg') * 100, anios_desde_ultima_local=pl.lit(T) - pl.col('yr')))
    # elecciones locales NO concurrentes con una federal; se comparan con la federal anterior más cercana del mismo municipio
    nc = a.filter(~pl.col('date').is_in(list(FED.values())))
    nc = nc.with_columns(fed=pl.col('date').map_elements(lambda d: max([y for y, f in FED.items() if f < d], default=None), return_dtype=pl.Int64))
    nc = nc.join(panel.rename({'AELEC': 'fed', 'participacion': 'part_fed'}).with_columns(pl.col('fed').cast(pl.Int64)), on=['cvegeo', 'fed'], how='inner')
    br = nc.group_by('cvegeo').agg(brecha_local_federal_hist=(pl.col('part_local') - pl.col('part_fed')).mean(), n_locales_no_concurrentes=pl.len())
    filas.append(ult.join(br, on='cvegeo', how='full', coalesce=True).with_columns(eleccion_objetivo=pl.lit(T, pl.Int16)))
mag = pl.concat(filas, how='diagonal_relaxed')
NUEVAS = ['part_local_ultima_vs_estado', 'margen_local_ultimo', 'brecha_local_federal_hist']
print(mag.group_by('eleccion_objetivo').agg(pl.len(), *[pl.col(c).is_not_null().sum().alias(f'con {c}') for c in NUEVAS],
                                            pl.col('anios_desde_ultima_local').median().alias('años desde la última (mediana)')).sort('eleccion_objetivo'))

base = pl.read_parquet(S + 'base_pruebas.parquet').join(mag, on=['cvegeo', 'eleccion_objetivo'], how='left').sort('eleccion_objetivo', 'cvegeo')
def con_resultado(T):
    return base.filter((pl.col('eleccion_objetivo') == T) & pl.col('desviacion_objetivo').is_not_null()
                       & ~pl.col('sin_casilla_objetivo').fill_null(False) & pl.col('desviacion_presidencial').is_not_null())
def spearman_ic(x, y, veces=400):
    ok = ~(np.isnan(x) | np.isnan(y)); x, y = x[ok], y[ok]; o = np.lexsort((y, x)); x, y = x[o], y[o]
    bs = [spearmanr(x[i], y[i]).statistic for i in (rng.integers(0, len(x), len(x)) for _ in range(400))]
    return spearmanr(x, y).statistic, np.percentile(bs, 2.5), np.percentile(bs, 97.5), int(ok.sum())
for c in NUEVAS:
    linea = [c]
    for T in (2015, 2021):
        d = con_resultado(T); m, b = np.polyfit(d['desviacion_presidencial'], d['desviacion_objetivo'], 1)
        res = d['desviacion_objetivo'].to_numpy() - (b + m * d['desviacion_presidencial'].to_numpy())
        r, lo, hi, n = spearman_ic(d[c].cast(pl.Float64).to_numpy(), res); linea.append(f'{T}: {r:.2f} [{lo:.2f}, {hi:.2f}] n={n}')
    print(' · '.join(linea))

TODAS = ['desviacion_presidencial', 'desviacion_intermedia_previa', 'vecinos_desviacion_presidencial',
         'gobernador_mismo_dia_intermedia', 'diputacion_local_mismo_dia_intermedia', 'ayuntamiento_mismo_dia_intermedia',
         'gobernador_mismo_dia_presidencial', 'diputacion_local_mismo_dia_presidencial', 'ayuntamiento_mismo_dia_presidencial', 'es_sni',
         'margen_presidencial', 'partidos_efectivos_presidencial', 'pct_rural', 'pct_hombres', 'pct_20_29', 'pct_65_mas', 'crecimiento_lista', 'cobertura_lista_20mas',
         'escolaridad_promedio', 'pct_habla_lengua_indigena', 'pct_viviendas_internet', 'pct_residia_otro_pais_hace5', 'pct_residia_otra_entidad_hace5',
         'poblacion_log', 'pct_pobreza', 'pct_pobreza_extrema', 'pct_carencia_salud', 'pct_rezago_educativo', 'marginacion', 'pct_localidades_menos_5000',
         'pct_viviendas_emigrantes', 'pct_viviendas_remesas', 'pct_viviendas_retorno', 'homicidios_100mil_log']
def huber(): return make_pipeline(SimpleImputer(strategy='median'), StandardScaler(), HuberRegressor(alpha=1.0, epsilon=1.35, max_iter=3000))
class Ensamble:
    def fit(self, X, y):
        self.h = huber().fit(X, y)
        self.r = make_pipeline(SimpleImputer(strategy='median'), RandomForestRegressor(n_estimators=300, min_samples_leaf=5, max_features=0.6, random_state=0, n_jobs=-1)).fit(X, y)
        return self
    def predict(self, X): return (self.h.predict(X) + self.r.predict(X)) / 2
def err(y, p): return np.abs((y - np.median(y)) - (p - np.median(p)))
A15, A21 = con_resultado(2015), con_resultado(2021)
SENT = [('15→21', A15, A21), ('21→15', A21, A15)]
def pred(cols, A, B, f): return f().fit(A.select(cols).to_numpy().astype(float), A['desviacion_objetivo'].to_numpy()).predict(B.select(cols).to_numpy().astype(float))
for nombre, f in [('Huber', huber), ('Ensamble', Ensamble)]:
    ref = {n: pred(TODAS, A, B, f) for n, A, B in SENT}
    for cols, etq in [([c], c) for c in NUEVAS] + [(NUEVAS, 'las 3 de Magar')]:
        linea = [f'{nombre} + {etq}']
        for n, A, B in SENT:
            y = B['desviacion_objetivo'].to_numpy(); p = pred(TODAS + cols, A, B, f); d = err(y, p) - err(y, ref[n])
            bs = [d[i].mean() for i in (rng.integers(0, len(d), len(d)) for _ in range(1000))]
            linea.append(f'{n}: {err(y, ref[n]).mean():.3f} → {err(y, p).mean():.3f} ({d.mean():+.3f} [{np.percentile(bs, 2.5):+.3f}, {np.percentile(bs, 97.5):+.3f}])')
        print(' · '.join(linea))
mag.write_parquet(S + 'magar_variables.parquet')

# --- Las tres que mejoraron el ensamble por separado, juntas (dos de CONEVAL y una de Magar)
GANADORAS = ['vulnerable_carencias_pct', 'no_pobre_no_vulnerable_pct', 'part_local_ultima_vs_estado']
ref = {n: pred(TODAS, A, B, Ensamble) for n, A, B in SENT}
linea = ['Ensamble + las 3 ganadoras']
for n, A, B in SENT:
    y = B['desviacion_objetivo'].to_numpy(); p = pred(TODAS + GANADORAS, A, B, Ensamble); d = err(y, p) - err(y, ref[n])
    bs = [d[i].mean() for i in (rng.integers(0, len(d), len(d)) for _ in range(1000))]
    k = len(y) // 5
    acierto = lambda q: len(set(np.argsort(y)[:k]) & set(np.argsort(q)[:k])) / k * 100
    linea.append(f'{n}: {err(y, ref[n]).mean():.3f} → {err(y, p).mean():.3f} ({d.mean():+.3f} [{np.percentile(bs, 2.5):+.3f}, {np.percentile(bs, 97.5):+.3f}]) '
                 f'acierto 20 %: {acierto(ref[n]):.1f} → {acierto(p):.1f}')
print(' · '.join(linea))
