# Vistas del mapa

Qué muestra la aplicación y de qué columnas sale cada cosa. Datos: `data/processed/mapa/resultados-1.5/`
(formato de [contrato-datos.md](contrato-datos.md); unidades y significado de cada columna en
`metadatos.json`). Decisiones D18, D19, D22, D23, D27, D28, D29 y D30 de la [bitácora](bitacora.md).

**Diseño de la pantalla:** la propuesta de rediseño para la entrega está en
[propuesta-front.md](propuesta-front.md). Por D30, la entrega lleva dos pestañas, Pronóstico 2027 e Histórico;
las 7 vistas de indicadores se quedan aquí como referencia para una versión posterior.

## Estado

**`resultados-1.5` es la versión vigente.** Las carpetas `resultados-1.3` y `resultados-1.4` se conservan
mientras la aplicación migra.

**Respecto a la 1.4** (`escenarios_2027.csv` no cambia):

- **`municipios.csv` agrega cinco columnas (D29):** `aporte_historia`, `aporte_calendario`, `aporte_lista`,
  `aporte_social` y `aporte_politica`. Son los puntos que cada grupo de variables sube o baja la predicción frente
  al país; los cinco suman `(part_pred − 0.5141) × 100` de la fila sin intervención (diferencia de 0.02 o menos por
  redondeo). Las demás columnas no cambian.
- **`metadatos.json` agrega `participacion_nacional_historica`:** la participación del país en cada elección de
  2009 a 2024, para la gráfica del historial.
- **`scripts/prepare_results.py`** solo tiene que aceptar las cinco columnas nuevas, además del ajuste de la 1.4.

**Respecto a la 1.3** (`municipios.csv` no cambia; cambia `escenarios_2027.csv`):

- **Una sola predicción (D27):** ya no hay tres niveles nacionales. El nivel de 2027 se estima con el
  calendario local en **51.4 %** (`nivel_nacional = "estimado"`). El modelo, su prueba y la sensibilidad están
  en `metadatos.json` → `modelo_nacional`.
- **El rango de cada municipio** (`part_pred_inf` a `part_pred_sup`) suma ahora el error del nivel nacional:
  mide de 20 a 31 puntos de ancho.
- **Cinco tipos de intervención (D28)**, una fila por municipio cada uno:
  - `ninguna`;
  - `retener_primerizos`;
  - `jovenes_20_29`;
  - `credencializacion`;
  - `combinada`.

  Los identificadores son `nac-estimado_int-<tipo>`. Se reemplaza `dirigida_rojos`, que equivalía a
  `combinada`.
- **Ajuste para `scripts/prepare_results.py`:**
  - 5 escenarios en lugar de 6;
  - las claves `nac-medio_int-*` pasan a `nac-estimado_int-*`;
  - con `combinada` salen del rojo **87**, no 88.

Historia de versiones: [`docs/metodologia/09-reproducir.md`](metodologia/09-reproducir.md).

## Estructura: dos pestañas (D23)

| Pestaña | Para qué | Contenido |
| --- | --- | --- |
| **1 · Pronóstico 2027** | Dónde se prevé menor participación el 6 de junio de 2027 | Semáforo, tipo de intervención y ficha con la predicción y su rango |
| **2 · Indicadores y contexto** | Por qué, a quién y en qué condiciones | 7 vistas informativas, una a la vez |

Los **filtros son comunes** a las dos pestañas. Cada pestaña tiene sus propias **tarjetas** arriba.

## Pestaña 1 · Pronóstico 2027

**Color del municipio:** `semaforo` en `municipios.csv` (sin intervención) o `riesgo` del escenario elegido.

| Valor | Color | Regla (D18) | Municipios | Lista 2024 |
| --- | --- | --- | ---: | ---: |
| `rojo` / `alto` | rojo | 20 % de mayor riesgo (`posicion_riesgo` ≥ 80) | 495 | 23,818,704 |
| `amarillo` / `medio` | amarillo | el 20 % siguiente (60 a < 80) | 496 | 43,525,306 |
| `verde` / `bajo` | verde | el resto | 1,486 | 30,986,338 |

Mostrar también la palabra (rojo, amarillo, verde), no solo el color, para accesibilidad.

**Un solo selector: tipo de intervención** (`intervencion`). Ya no hay selector de nivel nacional (D27).

| Opción en pantalla | `intervencion` | Votos adicionales | Rojos que salen | Siguen en rojo |
| --- | --- | ---: | ---: | ---: |
| Sin intervención | `ninguna` | — | — | 495 |
| Retener a quienes votaron por primera vez en 2024 | `retener_primerizos` | 80,478 | 20 | 475 |
| Jóvenes de 20 a 29 años | `jovenes_20_29` | 294,864 | 66 | 429 |
| Credencialización de nuevos votantes | `credencializacion` | 129,665 | 5 | 490 |
| Las tres juntas | `combinada` | 505,007 | 87 | 408 |

- **Solo cambian los rojos.** Fuera del rojo, `efecto_interv` = 0 y `votos_adicionales` = 0.
- **El color con intervención** se compara contra la línea fija del semáforo sin intervención.
- **Etiqueta obligatoria:** "Supuesto, no efecto medido".
- **Credencialización** suma votos, pero en 200 de los 495 rojos baja un poco el porcentaje, porque las personas
  nuevas votan menos que el promedio. Conviene explicarlo en la ayuda: es una medida de inclusión.

**Tarjetas:**

- **Municipios en rojo:** conteo de `riesgo == "alto"` del escenario elegido. Sin intervención: 495.
- **Personas en rojo:** suma de `ln_2024` en esos municipios. Sin intervención: 23.8 millones.
- **Con intervención:** votos adicionales (suma de `votos_adicionales`) y municipios que salen del rojo.
- **Participación esperada del país:** 51.4 % (`niveles_nacionales_2027.estimado`). Etiqueta sugerida:
  "estimada con el calendario electoral de 2027".

**Ficha del municipio:**

- **Nombre:** `nombre_mpio` con `nombre_edo`. Hay 2 nombres que se repiten dentro de un mismo estado; la
  clave es siempre `cvegeo`.
- **Participación esperada en 2027:** `part_pred`, con su rango de `part_pred_inf` a `part_pred_sup` (90 %).
- **Frente al país:** `desv_base` × 100, en puntos. Por ejemplo, "9 puntos menos que el país".
- **Posición de riesgo:** `posicion_riesgo`, de 0 a 100, donde 100 es el mayor riesgo.
- **Probabilidad de quedar en rojo:** `probabilidad_rojo`. Si es 0.8 o más, decir **"probable"**, no
  "seguro"; los metadatos explican por qué.
- **Qué se elige ese día:** `ayuntamiento_mismo_dia_2027`, `gobernador_mismo_dia_2027` y `usos_y_costumbres`. Es lo
  que más explica el rojo.
- **Aviso** si `alerta_sin_casilla` no es `"sin antecedente"`: ese riesgo va aparte del semáforo.
- **Si el municipio está en rojo, desglose de la intervención:** cuánto suma cada supuesto.
  - S1 · Retener a los primerizos: `interv_votos_retener_primerizos`.
  - S2 · Cerrar la mitad de la brecha joven: `interv_votos_brecha_joven`.
  - S3 · Credencializar a los nuevos: `interv_votos_credencializar`. Agrega `interv_nuevos_en_lista`
    personas a la lista, así que suma votos pero casi no sube el porcentaje.

  Las columnas existen para todos los municipios, pero el escenario solo las aplica en los rojos. Vacío =
  sin dato para calcularlo.
- **¿Qué empuja esta predicción? (D29):** una barra por grupo con `aporte_historia`, `aporte_calendario`,
  `aporte_lista`, `aporte_social` y `aporte_politica`, en puntos (+ sube, − baja). Nota obligatoria: "Reparto de la
  predicción del modelo; no son causas probadas."
- **Leyenda fija:** "El nivel del país (51.4 %) es una estimación con un error de unos 3 puntos. El rango es
  ancho (de 20 a 31 puntos); la posición frente a los demás es más confiable que la cifra."

## Pestaña 2 · Indicadores y contexto

Selector de vista. Cada una pinta el mapa con su propia columna y tiene sus propias tarjetas. Las cifras
son de `resultados-1.5` y sirven para comprobar que la aplicación suma bien.

### 1. Qué se elige el 6 de junio de 2027

Categorías que se arman con `ayuntamiento_mismo_dia_2027`, `gobernador_mismo_dia_2027` y `usos_y_costumbres`:

| Categoría | Regla | Municipios | Lista 2024 |
| --- | --- | ---: | ---: |
| Ayuntamiento y gubernatura | los dos `true` | 676 | 33.5 M |
| Ayuntamiento, sin gubernatura | solo ayuntamiento `true` | 1,125 | 56.1 M |
| Sin elección municipal: usos y costumbres | `usos_y_costumbres` `true` | 425 | 1.2 M |
| Sin elección municipal: otros (Durango y Veracruz) | ayuntamiento `false` y `usos_y_costumbres` `false` | 251 | 7.5 M |

Con `es_sni` (solo Oaxaca) eran 418 y 258: los 7 municipios de fuera de Oaxaca pasan al grupo de usos y
costumbres.

- **Tarjeta:** 676 municipios sin elección municipal ese día.
- **Mensaje:** de los 495 rojos, 413 no eligen ayuntamiento (6.3 M de personas) y 82 sí lo eligen pero
  votan poco siempre (17.5 M).

### 2. Rezago persistente

- **Columna:** `elecciones_por_debajo_del_pais`, de 0 a 6. Escala de un solo color.
- **Tarjeta:** 285 municipios por debajo del país en las 6 elecciones (19.7 M de personas).

### 3. Zonas frías y calientes 2024

- **Columna:** `zona_participacion_2024`.
- **Valores:**
  - `fría (bajo-bajo)`: 371;
  - `caliente (alto-alto)`: 337;
  - `bajo rodeado de alto`: 21;
  - `alto rodeado de bajo`: 43;
  - `no significativa`: 1,652;
  - vacío: 53, que se muestran como "sin dato".
- Sirve para campañas regionales.

### 4. Personas en juego

Selector de grupo. Son conteos, no efectos.

| Grupo | Columna | Total país | En rojos |
| --- | --- | ---: | ---: |
| Primerizos de 2024 (18 a 20 años que votaron) | `primerizos_votaron_2024` | 2,898,581 | 582,590 |
| Jóvenes de 21 a 29 años que no votaron en 2024 | `jovenes_21_29_no_votaron_2024` | 9,835,966 | 2,884,632 |
| Nuevos votantes en 2027 (18 y 19 años) | `nuevos_votantes_2027` | 4,363,455 | 1,104,131 |
| Nuevos sin credencial si se repite 2021 | `nuevos_sin_credencial_2027_si_se_repite_2021` | 1,268,747 | 318,946 |

- **Complemento:** `brecha_jovenes_2024`, en puntos (participación de 20 a 29 años menos la del municipio;
  mediana −12.1).
- Vacíos ("sin dato", no cero): 15 en las dos primeras columnas, 8 en la tercera y 245 en la cuarta. Los
  totales no cuentan esos vacíos.

### 5. Alerta "sin casilla"

- **Columna:** `alerta_sin_casilla`.
- **Valores:**
  - `recurrente`: 16;
  - `antecedente`: 59;
  - `sin antecedente`: 2,402.
- Año de la última vez: `ultima_eleccion_sin_casilla`.
- **Puede mostrarse como un ícono encima de cualquier vista**, también en la pestaña 1. No es parte del
  semáforo.

### 6. Contexto de seguridad

Es contexto: no entra al semáforo (D17). Tres capas:

- **Homicidios:** `tasa_homicidios_2022_2024`, por 100 mil habitantes al año. Usar `percentil_homicidios_2022_2024`
  para el color. Hay 7 vacíos.
- **Quién ejerce la seguridad:** `quien_ejerce_seguridad` (10 categorías) y `tiene_policia_municipal`
  (517 `false`, 64 vacíos). En los rojos, 277 de 495 (56 %) no tienen policía municipal.
- **Aviso por estado:** `comparacion_homicidios_inegi_sesnsp`. Solo texto en la ficha o la leyenda, no color.
  - En 22 estados las dos fuentes coinciden.
  - En 5 el SESNSP cuenta más.
  - En 5 el INEGI cuenta más.
- **Ficha:** `cifra_oculta_estatal_2025` (ENVIPE, del estado), `policias_municipales_por_10mil_habitantes`
  y `justicia_civica`.

### 7. Historia 2009–2024

- **Columnas:** de `part_2009` a `part_2024`.
- **Selector de año.** En la ficha, la serie de las 6 elecciones.

## Filtros comunes

Se aplican en las dos pestañas y recalculan las tarjetas.

| Filtro | Columna |
| --- | --- |
| Estado | `nombre_edo` |
| Color del semáforo | `semaforo` |
| Tamaño de la lista | `ln_2024`: menos de 5 mil, de 5 a 20 mil, de 20 a 100 mil, 100 mil o más (los mismos cortes del intervalo) |
| Elección municipal en 2027 | `ayuntamiento_mismo_dia_2027` |
| Usos y costumbres | `usos_y_costumbres` |
| Con alerta "sin casilla" | `alerta_sin_casilla` distinto de `"sin antecedente"` |
| Búsqueda | `nombre_mpio` y `nombre_edo` |

## Reglas de lectura

- **Claves y vacíos:**
  - `cvegeo`, `clave_ine_2024`, `motivo` y `ultima_eleccion_sin_casilla` se leen como texto.
  - Una celda vacía es "sin dato", nunca cero.
- **Participación 0 %:** en algunos municipios y años (4 en 2024, entre ellos Chicomuselo y Pantelhó) la
  participación es 0 porque no se instalaron casillas. Mostrar "sin casilla: no se pudo votar", no
  "0 % de participación".
- **`ns_2024` = 1.0 con participación:** no es error. Cuando los conteos no tienen dato, la participación
  sale de las actas oficiales (D3). `ns_2024` no se muestra como indicador al público.
- **`clave_ine_2024` vacía:** pasa en 12 municipios. La unión siempre es por `cvegeo`.
- **Geometría sin fila:** `municipios_inegi.geojson` tiene 2,478 geometrías y los resultados 2,477 filas.
  La que falta es Villa de Pozos (24059, San Luis Potosí), municipio nuevo sin datos electorales: pintarla
  en gris como "sin dato".
- **Lenguaje:** no usar lenguaje acusatorio ni atribuir causas a un municipio. El rojo dice "riesgo de
  menor participación", no "municipio problemático".

## Fuera del mapa

| Tema | Dónde va | Por qué |
| --- | --- | --- |
| Paquetes perdidos | Fuera | Pocos casos (40) y fácil de leer como acusación |
| Brecha de género | Gráfica nacional en el reporte | No está por municipio en los archivos |
| Calidad del dato | Marcas en la ficha (`historia_completa` = `false` en 38 municipios) | No da para una vista: ningún municipio tiene territorio aproximado |
