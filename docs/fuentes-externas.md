# Fuentes externas

Datos de otras instituciones que se usan junto con los de la lista nominal y los cómputos del INE:
población (INEGI, CONAPO), marginación y migración (CONAPO), remesas (Banxico), pobreza y rezago
social (CONEVAL), violencia (INEGI y SESNSP) y resultados por casilla de 2009, 2012 y 2015 (INE).

Todo se consultó y descargó el **19 de octubre de 2026** (hora de la Ciudad de México). Los archivos
crudos quedan en `data/raw/externos/` y `data/raw/computos_{2009,2012,2015}/`, y los productos en
`data/processed/externos/`. Ninguna de esas carpetas se sube al repositorio. Lo que sí se versiona
es la huella SHA-256 de cada archivo crudo, en
[`data/reference/huellas_fuentes_externas.csv`](../data/reference/huellas_fuentes_externas.csv),
y los scripts de `scripts/externos/`.

## Advertencia: la votación presidencial de 2012

**La cifra 50,143,616 para el total de votos de la elección presidencial de 2012 no se pudo
confirmar en ninguna fuente del IFE o del INE, y no se usa en el proyecto.** Lo que sí está
documentado:

- El cómputo distrital publicado por el IFE suma **50,323,153** votos.
- El archivo por casilla del SICEEF suma 50,324,575. La diferencia (+1,422) se explica completa por
  las casillas recontadas o modificadas por el Tribunal Electoral (TEPJF) en 99 distritos.
- Sin las casillas anuladas por el TEPJF, el archivo suma **50,141,058**; el archivo por sección del
  propio SICEEF da la misma cifra.
- 50,143,616 difiere de esta última en 2,558 votos. Podría ser el cómputo final del TEPJF, pero eso
  no se verificó (no se consultó el sitio del TEPJF porque no es una fuente del INE).

## Tabla de fuentes

Archivos producidos: todos en `data/processed/externos/`. Scripts: todos en `scripts/externos/`.
La clave municipal `cvegeo` siempre es texto de 5 caracteres (entidad + municipio, claves del INEGI).

| Institución | Conjunto | Años | URL oficial | Archivo producido | Script | Verificaciones clave | Limitaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INEGI | Censo de Población y Vivienda: ITER y tabulados (edad desplegada por sexo, migración; etnicidad del cuestionario ampliado en 2020) | 2010, 2020 | https://www.inegi.org.mx/contenidos/programas/ccpv/ | `inegi_municipal_2010.parquet`, `inegi_municipal_2020.parquet`, `inegi_edad_sexo.parquet`, `inegi_edad_desplegada.parquet` | `fuente_inegi.py` | Suma de municipios = cifra nacional del ITER (112,336,538 en 2010; 126,014,024 en 2020) y = total de cada entidad. Edad por sexo suma la población total. Los 88,884 quinquenios del ITER 2020 coinciden con los armados desde edad simple. | Autoadscripción indígena 2020 sale de una muestra (trae coeficiente de variación). No hay autoadscripción municipal en tabulados 2010. "Derechohabiencia" 2010 y "afiliación" 2020 no son estrictamente comparables. |
| INEGI | Encuesta Intercensal: tabulados por entidad con desglose municipal | 2015 | https://www.inegi.org.mx/contenidos/programas/intercensal/2015/tabulados/ | `inegi_municipal_2015.parquet` y el año 2015 de `inegi_edad_sexo.parquet` | `fuente_inegi.py` | Suma de municipios = tabulado nacional (119,530,753). Total de edad = población total por sexo en todos los municipios. | Es una muestra: son estimaciones. Grupo de edad abierto en 75+. 11 municipios con "muestra insuficiente" (sus porcentajes se anularon). Lengua indígena y autoadscripción solo en 1,312 municipios. No separa "otra entidad" de "otro país". |
| CONAPO | Proyecciones de población por municipio, sexo y grupo quinquenal, **base 2020** | 1990-2040 | https://www.datos.gob.mx/dataset/f2b9b220-3ef7-4e3a-bde6-87e1dac78c6a | `conapo_proyecciones_edad_sexo.parquet` | `fuente_conapo_banxico.py` | Suma municipal = cifra nacional de CONAPO en los 51 años, total y por sexo (diferencia 0). Edad y sexo = suma de las 32 entidades en 252 celdas (diferencia 0). | 2021 en adelante es proyección; población a mitad de año. El grupo 15-19 no separa a los de 18-19. Faltan 24059, 25019 y 25020. |
| CONAPO | Proyecciones municipales, **base 2015** | 2015-2030 | Copia de la Wayback Machine de http://www.conapo.gob.mx/work/models/CONAPO/Datos_Abiertos/Proyecciones2018/ | `conapo_proyecciones_edad_sexo_base2015.parquet` | `fuente_conapo_banxico.py` | Suma municipal = nacional de su misma serie en los 16 años (diferencia 0). | No conoce el Censo 2020 (−0.33 % en 2020 frente a la base 2020). Último grupo 65+. Faltan 21 municipios. Se recomienda usar la base 2020 como principal. |
| CONAPO | Índice de marginación municipal, método DP2 | 2010, 2015, 2020 | https://www.datos.gob.mx/dataset/d8f2a534-bcee-4114-853d-82982a81ce24 | `conapo_marginacion.parquet` | `fuente_conapo_banxico.py` | Población total igual a la del Censo 2010, la Intercensal 2015 y el Censo 2020. 655 municipios "Muy bajo" en 2020, igual al documento metodológico. | El índice DP2 va al revés que el antiguo: más alto = menos marginación. La educación se mide como "sin educación básica", no "sin primaria". |
| CONAPO | Índice de intensidad migratoria México-Estados Unidos | 2010, 2020 | Copias de la Wayback Machine de conapo.gob.mx (2010) y repodatos.atdt.gob.mx (2020) | `conapo_intensidad_migratoria.parquet` | `fuente_conapo_banxico.py` | Grados 2020 iguales al cuadro resumen del libro IIM 2020. Contraste del CSV con el anexo del libro actualizado en 2026. | 2010 y 2020 usan métodos distintos: el índice y el grado no se comparan entre años. El índice del CSV 2020 es ≈ 0.164 mayor que el del libro de 2026 y 4 municipios cambian de grado. |
| Banxico | Cuadro CE166, ingresos por remesas por municipio (trimestral); CE81 nacional mensual solo para verificar | 2013-2025 | https://www.banxico.org.mx/SieInternet/ | `banxico_remesas_municipio.parquet` | `fuente_conapo_banxico.py` | Municipios + "No identificado" = renglón estatal. Suma de entidades = total nacional de CE81 en los 13 años (diferencia 0). | Cifras preliminares. Muchos ceros que parecen de cobertura. Según fuentes secundarias, el municipio es el del punto de pago. "Zapotitlán del Río" no se pudo cruzar. "No identificado" (0.47 %) no está en el parquet. |
| CONEVAL | Pobreza municipal, serie comparable | 2010, 2015, 2020 | https://www.coneval.org.mx/Medicion/Paginas/Pobreza-municipio-2010-2020.aspx | `coneval_pobreza_municipal.parquet` | `fuente_coneval.py` | Reproduce las cifras del Comunicado 016/2021 (municipios que concentran la mitad de la población en pobreza: 173, 185 y 199; cambios de 5 puntos: 947 y 339). Suma municipal = hoja estatal (máx. 17 personas de diferencia). | Son estimaciones de áreas pequeñas calibradas a totales estatales del MEC; no cuadran con la serie nacional ENIGH 2016-2020. Sin estimación para municipios nuevos. No hay medición municipal 2025 publicada. |
| CONEVAL | Índice de Rezago Social, entidades y municipios | 2000, 2005, 2010, 2015, 2020 | https://www.coneval.org.mx/Medicion/IRS/Paginas/Indice_de_Rezago_Social_2020_anexos.aspx | `coneval_rezago_social.parquet` | `fuente_coneval.py` | 2020: 2,469 municipios y grados iguales al Cuadro 3 de la nota oficial; los 10 municipios con mayor índice coinciden. | El índice y el grado no son comparables entre años (lo dice CONEVAL); los componentes sí son magnitudes directas. |
| INEGI | Estadísticas de Defunciones Registradas (homicidios = `presunto` 2) | 2009-2024 (año de ocurrencia) | https://www.inegi.org.mx/programas/edr/ | `inegi_homicidios_municipio.parquet`, `inegi_homicidios_municipio_mes.parquet`, `inegi_homicidios_no_especificado.parquet` | `fuente_violencia.py` | La causa X85-Y09 reproduce exactamente la cifra oficial por año de registro en los 16 años; `presunto` 2 da de 0 a 4 casos más por año. | 2024 está subestimado (≈ 2 %-4 %) porque faltan registros tardíos. Miles de casos sin entidad de ocurrencia en 2017-2023 (2,011 en 2018). Es el lugar de la defunción, no de la agresión. 2025 no está publicado. |
| SESNSP | Incidencia delictiva del fuero común, municipal (homicidio doloso, feminicidio, secuestro, extorsión, electorales) | 2015-2025 | https://www.gob.mx/sesnsp/acciones-y-programas/datos-abiertos-de-incidencia-delictiva | `sesnsp_delitos_municipio.parquet` | `fuente_violencia.py` | Total nacional del archivo municipal = archivo estatal = reporte nacional en PDF, en todos los años y delitos. | Mes de **registro** de la carpeta, no de los hechos. Carpetas no son víctimas. 2015-2016 casi sin Oaxaca municipal. Una fila ausente es "sin dato", no cero. Cifras revisadas retroactivamente. "Electorales" no equivale a violencia política. |
| SESNSP | Registro Nacional de Incidencia Delictiva (RNID), municipal, delitos y víctimas | enero-septiembre de 2026 | https://www.gob.mx/sesnsp/acciones-y-programas/datos-abiertos-de-incidencia-delictiva | `sesnsp_rnid_2026_municipio.parquet` | `fuente_violencia.py` | Totales nacionales de carpetas y víctimas = reporte RNID en PDF (exacto). | Metodología nueva: se excluyen tentativas; la comparabilidad de secuestro con 2025 no está verificada. |
| INE | SICEEF, resultados de cómputo distrital por casilla (con ajustes del TEPJF) | 2009 (diputados MR), 2012 (Presidente), 2015 (diputados MR) | http://siceef.ine.mx/downloadDB.html | `actas_2009.parquet`, `actas_2012.parquet`, `actas_2015.parquet` | `fuente_actas_2009_2015.py` y `verificar_actas_2009_2015.py` | 2012: casillas y votos contra el cómputo distrital del IFE, los 300 distritos uno por uno. 2015: cruce 1 a 1 con la base del sitio de cómputos y con el acuerdo INE/CG804/2015. 2009: contra CG426/2009 (−68 votos de 34,677,991). | Las casillas anuladas por el TEPJF conservan sus votos: para el resultado final hay que filtrar `~anulada_tepjf`. En 2015, Aguascalientes 01 trae la elección extraordinaria. Diferencias de lista nominal sin explicar (−21,631 en 2012; −11,089 en 2009). Ver la advertencia de 2012 arriba. |

## Cómo reproducir

Todos los comandos se corren desde la raíz del repositorio. Los scripts no descargan nada si los
crudos ya están; antes de procesar comparan el SHA-256 de cada insumo con
`data/reference/huellas_fuentes_externas.csv` y se detienen si alguno no coincide.

```
# Solo necesitan polars y numpy, que están en uv.lock
uv tool run --from uv==0.13.1 uv run --locked python -I scripts/externos/fuente_violencia.py
uv tool run --from uv==0.13.1 uv run --locked python -I scripts/externos/fuente_actas_2009_2015.py
uv tool run --from uv==0.13.1 uv run --locked python -I scripts/externos/verificar_actas_2009_2015.py

# Necesitan openpyxl o xlrd, que no están en uv.lock: entorno efímero, sin tocar pyproject.toml ni uv.lock
uv tool run --from uv==0.13.1 uv run --no-project --with polars==2.0.0 --with openpyxl==3.1.5 \
    --with xlrd==2.0.1 python -I scripts/externos/fuente_inegi.py
uv tool run --from uv==0.13.1 uv run --no-project --with polars==2.0.0 --with openpyxl==3.1.5 \
    --with xlrd==2.0.1 python -I scripts/externos/fuente_conapo_banxico.py
uv tool run --from uv==0.13.1 uv run --no-project --with polars==2.0.0 --with openpyxl==3.1.5 \
    python -I scripts/externos/fuente_coneval.py
```

- `fuente_inegi.py` baja lo que falte; `fuente_violencia.py`, `fuente_coneval.py` y
  `fuente_actas_2009_2015.py` lo hacen con `--descargar`.
- `fuente_conapo_banxico.py` no descarga: varios sitios oficiales bloquean las descargas
  automáticas (respuesta 403 en repodatos.atdt.gob.mx, reto JavaScript en gob.mx/conapo,
  conapo.gob.mx sin respuesta). Esos archivos se bajan a mano desde la URL que aparece en
  `huellas_fuentes_externas.csv`.
- Las verificaciones de cada script se guardan en `data/processed/externos/verificaciones/`.
- Volver a correr los scripts sobre los mismos crudos da exactamente los mismos datos. Los parquet de
  CONAPO, Banxico y CONEVAL pueden tener otro SHA-256 si cambia la versión de polars, aunque los
  valores sean idénticos.

### Herramienta externa: bsdtar

Dos pasos se hicieron a mano con `bsdtar` (de libarchive), solo para extraer, sin ejecutar nada:

- Los dos RAR de la base 2015 de CONAPO (`data/raw/externos/conapo/base2015_wayback/*.rar`), en
  `base2015_wayback/extraido/`.
- La base por casilla del sitio de cómputos 2015, que se llama `.tar.gz` pero es un RAR v4, en
  `data/raw/computos_2015/computos2015_listaActas/`.

Los scripts comprueban el SHA-256 de los archivos extraídos.

## Sobre `huellas_fuentes_externas.csv`

Columnas: `fuente`, `archivo_relativo` (ruta desde la raíz del repo), `sha256`, `url` y
`fecha_consulta`. Tiene una fila por archivo crudo (521 en total).

- En los archivos extraídos de un comprimido, la `url` es la del comprimido de origen.
- Las copias de la Wayback Machine llevan la URL de la captura en modo `id_` (bytes originales), con
  la fecha de la captura dentro de la URL.
- El cuadro de Banxico guarda dentro del archivo la fecha de consulta, así que una descarga nueva
  nunca tendrá la misma huella.
- Nueve archivos de apoyo no tienen URL porque no quedó registrada en las notas de descarga:
  `Manual_metodologico_RNID.pdf`, los reportes PDF de víctimas 2018, 2021, 2024 y 2025 y los dos de
  RNID 2026 del SESNSP (las notas solo guardan su identificador en gob.mx: 1009052, 1009060, 1009065,
  1009066, 1058530 y 1058479), y dos PDF de `computos_2012/verificacion/`
  (`20130718-O-1-3-27-6-3.pdf` y `20150317-E-4-3-264-8-4.pdf`). Ninguno lo lee un script.
