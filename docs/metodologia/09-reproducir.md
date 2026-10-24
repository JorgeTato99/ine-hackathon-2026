# 9 · Cómo reproducir todo

Todo se corre desde la raíz del repositorio. Versión de `uv` usada: 0.13.1. Python 3.14 y bibliotecas
fijadas en `uv.lock`.

## Orden

```bash
# 0 · Entorno
uv tool run --from uv==0.13.1 uv sync --locked

# 1 · Datos del INE: descarga, verificación SHA-256 y Parquet por elección (ver data/README.md)
uv tool run --from uv==0.13.1 uv run --locked python -m scripts.prepare_data

# 2 · Fuentes externas (ver docs/fuentes-externas.md; algunas necesitan openpyxl o xlrd en un entorno efímero)
uv tool run --from uv==0.13.1 uv run --locked python -I scripts/externos/fuente_violencia.py
uv tool run --from uv==0.13.1 uv run --locked python -I scripts/externos/fuente_actas_2009_2015.py
uv tool run --from uv==0.13.1 uv run --no-project --with polars==2.0.0 --with openpyxl==3.1.5 \
    --with xlrd==2.0.1 python -I scripts/externos/fuente_inegi.py
#   … fuente_conapo_banxico.py, fuente_coneval.py y fuente_seguridad.py, igual que en docs/fuentes-externas.md

# 3 · Notebooks, en este orden
for nb in 01_calidad_datos 02_investigacion_datos_raros 03_historia_y_variables \
          03b_variables_externas_y_patrones 04_modelo_riesgo_2027 04c_por_que_cada_municipio 05_semaforo_y_mapa \
          04b_fuentes_adicionales_e_importancia; do
  uv tool run --from uv==0.13.1 uv run --locked jupyter nbconvert --to notebook --execute --inplace \
      --ExecutePreprocessor.timeout=7200 notebooks/$nb.ipynb
done

# 4 · Base de datos de la entrega (CSV, diccionario, LEEME y Excel)
uv tool run --from uv==0.13.1 uv run --locked --with openpyxl==3.1.5 python -m scripts.entrega_base_datos --xlsx

# 5 · Pruebas del repositorio
uv tool run --from uv==0.13.1 uv run --locked --group test python -m pytest
```

El 04b es la prueba final y no genera archivos que usen los demás. Las pruebas de variables del 22 de
octubre se corren aparte: `notebooks/pruebas_variables/`.

## Qué produce cada paso

| Paso | Archivo | Se sube al repo |
| --- | --- | --- |
| 03 | `data/processed/panel_municipal.parquet` (14,862 filas: municipio × elección) | No |
| 03b | `data/processed/variables_transiciones.parquet`, `indicadores_mapa.parquet` | No |
| 04 | `data/processed/riesgo_2027.parquet`, `validacion_modelo.parquet` | No |
| 04c | `data/processed/aportes_2027.parquet` | No |
| 05 | `data/processed/mapa/resultados-1.6/` (`municipios.csv`, `escenarios_2027.csv`, `metadatos.json`) | Sí |
| entrega | `data/processed/entrega/base-datos-1.6/` | Sí |

## Prueba de reproducibilidad (20, 22 y 24 de octubre de 2026)

- **Los notebooks 03 a 05 y el 04b** se volvieron a correr de principio a fin, sin errores y con las mismas
  cifras.
- **El notebook 05** produce CSV idénticos byte por byte en dos corridas seguidas, en la misma máquina y con el
  mismo entorno (`uv.lock`). `metadatos.json` solo cambia en la fecha de generación.
- **El 24 de octubre (1.6)**, el notebook 04 dio la misma desviación prevista en dos corridas (diferencia de
  0.000000000000007).
- **En otra máquina o sistema operativo** puede haber diferencias numéricas pequeñas, sin cambiar colores ni
  totales: una auditoría externa lo comprobó (auditoría H008). La reproducibilidad se entiende como las mismas
  decisiones y cifras publicadas, no como bytes idénticos en cualquier entorno.
- **En los archivos intermedios del modelo** solo hay diferencias de 0.00000000000003, ruido de redondeo del
  random forest al usar varios procesadores, que no llega a los 4 decimales publicados.
- **El azar está fijo:**
  - semillas: `random_state=0` en el modelo y `default_rng(2027)` en simulaciones y bootstrap;
  - en el 04b, el bootstrap ordena sus datos para que el resultado no dependa del orden de las filas.

## Versiones de resultados

| Versión | Cambio |
| --- | --- |
| 1.0 | Primera entrega real para el mapa |
| 1.1 | Escenario con intervención (D22) y columna `usos_y_costumbres` |
| 1.2 | Celdas sin dato vacías, nunca `NaN` (15 en `brecha_jovenes_2024`) |
| 1.3 | En 15 municipios sin conteo por edad en 2024, las personas en juego y los supuestos S1 y S2 quedan vacíos en lugar de 0 |
| 1.4 | Una sola predicción con el nivel nacional estimado (51.4 %, D27); el rango suma el error nacional; cinco tipos de intervención (D28). `municipios.csv` igual que en la 1.3 |
| 1.5 | `municipios.csv` agrega `aporte_*`, el por qué de cada predicción (D29, notebook 04c); `metadatos.json` agrega la participación del país por elección. `escenarios_2027.csv` igual que en la 1.4 |
| **1.6** (vigente) | Zaragoza 2012 corregido (D31); intervención con componentes sin dato marcada `intervencion_parcial` (D32); modelo final Delta con guardia (D33), que recalcula todo el pronóstico; `posicion_riesgo` y `probabilidad_rojo` con 4 decimales. Mismas columnas |

El semáforo no cambió de la 1.0 a la 1.5. En la 1.6 cambia por el modelo Delta con guardia (D33): 19
municipios entran al rojo y 19 salen.
