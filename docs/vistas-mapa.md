# Vistas del mapa

Qué muestra la aplicación y de qué columnas sale cada cosa. Datos: `data/processed/mapa/resultados-1.0/`
(formato de [contrato-datos.md](contrato-datos.md); unidades y significado de cada columna en
`metadatos.json`). Decisiones D18, D19, D22 y D23 de la [bitácora](bitacora.md).

## Estado

- **`resultados-1.0` ya sirve para construir las dos pestañas.** Reemplaza a `muestra-0.3`.
- **Llegará `resultados-1.1`** con dos cambios. Las columnas actuales no cambian de nombre ni de significado.
  1. Escenario **con intervención** (D22): filas nuevas en `escenarios_2027.csv` con `intervencion` distinto
     de `"ninguna"`, `efecto_interv` y `votos_adicionales` llenos. Los supuestos están por definirse.
  2. Una columna de usos y costumbres que incluya a los 7 municipios fuera de Oaxaca. Hoy `es_sni` solo
     marca a los 418 de Oaxaca.
- Mientras tanto, el selector "sin / con intervención" se puede armar con `escenario_id`, aunque por ahora
  solo exista `int-ninguna`.

## Estructura: dos pestañas (D23)

El pronóstico no se mezcla con los indicadores.

| Pestaña | Para qué | Contenido |
| --- | --- | --- |
| **1 · Pronóstico 2027** | Dónde se prevé menor participación el 6 de junio de 2027 | Semáforo, nivel nacional, sin o con intervención, ficha con intervalo |
| **2 · Indicadores y contexto** | Por qué, a quién y en qué condiciones | 7 vistas informativas, una a la vez |

Los **filtros son comunes** a las dos pestañas. Cada pestaña tiene sus propias **tarjetas** arriba.

## Pestaña 1 · Pronóstico 2027

**Color del municipio:** `semaforo` en `municipios.csv`.

| Valor | Color | Regla (D18) | Municipios | Lista 2024 |
| --- | --- | --- | ---: | ---: |
| `rojo` | rojo | 20 % de mayor riesgo (`posicion_riesgo` ≥ 80) | 495 | 23,818,704 |
| `amarillo` | amarillo | el 20 % siguiente (60 a < 80) | 496 | 43,525,306 |
| `verde` | verde | el resto | 1,486 | 30,986,338 |

- `riesgo` en `escenarios_2027.csv` equivale a `semaforo`: `alto` = rojo, `medio` = amarillo, `bajo` = verde.
- **El color no cambia con el nivel nacional.** El semáforo ordena municipios entre sí. Lo comprobé: `riesgo`
  es igual en los 3 niveles.
- Mostrar también la palabra (rojo, amarillo, verde), no solo el color, para accesibilidad.

**Selectores:**

1. **Nivel nacional** (`nivel_nacional`). Cambia solo la participación estimada (`part_pred`) y su intervalo,
   no el color.

   | Nivel | Participación nacional | Origen |
   | --- | --- | --- |
   | `bajo` | 44.1 % | como la intermedia de 2009 |
   | `medio` | 47.1 % | como 2015 |
   | `alto` | 51.8 % | como 2021 |

2. **Sin o con intervención** (`intervencion`). Con `resultados-1.1`.

**Tarjetas:**

- **Municipios en rojo:** conteo de `semaforo == "rojo"`. Valor actual: 495.
- **Personas en rojo:** suma de `ln_2024` en los rojos. Valor actual: 23.8 millones.
- **Participación nacional del escenario:** `niveles_nacionales_2027` de `metadatos.json`.
- **Con intervención** (`resultados-1.1`): votos adicionales y municipios que saldrían del rojo.

**Ficha del municipio:**

- **Nombre:** `nombre_mpio` con `nombre_edo`. Hay 2 nombres que se repiten dentro de un mismo estado; la
  clave es siempre `cvegeo`.
- **Participación estimada:** `part_pred`, con su intervalo de `part_pred_inf` a `part_pred_sup` (90 %).
- **Posición de riesgo:** `posicion_riesgo`, de 0 a 100, donde 100 es el mayor riesgo.
- **Probabilidad de quedar en rojo:** `probabilidad_rojo`. Si es 0.8 o más, decir **"probable"**, no
  "seguro"; los metadatos explican por qué.
- **Qué se elige ese día:** `ayuntamiento_mismo_dia_2027`, `gobernador_mismo_dia_2027` y `es_sni`. Es lo
  que más explica el rojo.
- **Aviso** si `alerta_sin_casilla` no es `"sin antecedente"`: ese riesgo va aparte del semáforo.
- **Leyenda fija:** "El modelo ordena bien a los municipios, pero no predice el nivel nacional. El intervalo
  es ancho (de ±8 a ±15 pp); la posición es más confiable que la cifra."

## Pestaña 2 · Indicadores y contexto

Selector de vista. Cada una pinta el mapa con su propia columna y tiene sus propias tarjetas. Las cifras
son de `resultados-1.0` y sirven para comprobar que la aplicación suma bien.

### 1. Qué se elige el 6 de junio de 2027

Categorías que se arman con `ayuntamiento_mismo_dia_2027`, `gobernador_mismo_dia_2027` y `es_sni`:

| Categoría | Regla | Municipios | Lista 2024 |
| --- | --- | ---: | ---: |
| Ayuntamiento y gubernatura | los dos `true` | 676 | 33.5 M |
| Ayuntamiento, sin gubernatura | solo ayuntamiento `true` | 1,125 | 56.1 M |
| Sin elección municipal: usos y costumbres (Oaxaca) | `es_sni` `true` | 418 | 1.1 M |
| Sin elección municipal: otros | ayuntamiento `false` y `es_sni` `false` | 258 | 7.6 M |

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
  mediana −12.0).
- Las dos últimas columnas tienen 8 y 245 vacíos: "sin dato", no cero.

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
| Usos y costumbres | `es_sni` (en `resultados-1.1`, la columna que incluye a los 7 fuera de Oaxaca) |
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
