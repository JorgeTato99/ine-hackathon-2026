# Propuesta de rediseño del explorador

> **Acuerdo de producto posterior a D30:** P1 conserva las decisiones que el
> equipo ratificó después de esta propuesta: morado primario, ayudas de dos
> niveles, mapa normal y ampliado, paneles minimizables, anchos y silueta municipal.
> Las indicaciones antiguas de retirar «Ampliar mapa» o sustituir esos controles
> quedan supersedidas por ese acuerdo. La integración 1.6 actualiza datos, cifras,
> avisos y lectura sin volver a eliminar la experiencia aprobada.

Qué cambiar en el sitio (https://traza-civica.jorgetato.com/) para que se entienda en segundos y se vea
sobrio y formal. Parte del recorrido del sitio publicado el 22 de octubre de 2026 (versión 0.5.1, datos
`resultados-1.3`) y de los datos vigentes `resultados-1.6` (D27 a D33 de la [bitácora](bitacora.md)).

**Reparto:** el equipo de datos especifica y entrega los datos; el front implementa. Las prioridades están
en la [sección 9](#9--prioridades).

## 1 · La idea en una frase

**Una pregunta, un mapa grande y tres niveles: país → estado → municipio.** Arriba, siempre, cuatro cifras
que cambian según lo que se elige; a la derecha, la ficha del municipio con su predicción, por qué y qué
haría la intervención.

**Principios:**

1. **Una sola predicción** por municipio (D27). Nada de niveles nacionales para elegir.
2. **Un solo control de escenario:** el tipo de intervención (D28).
3. **Lo técnico se queda en Metodología.** En la pantalla principal no hay filtros avanzados, conteos de
   control ni textos de advertencia largos; basta una línea y un enlace.
4. **Colores planos** y la palabra junto al color (rojo, amarillo, verde) para accesibilidad.
5. **Estilo institucional sobrio,** sin imitar la imagen del INE (ni su magenta ni su logotipo).

## 2 · Lo que hay hoy y qué falla

Recorrido con capturas en Chrome a 1440 × 900.

| Vista | Qué muestra | Qué falla |
| --- | --- | --- |
| **Encabezado** | "El territorio, en contexto"; botones Consultas, Cómo explorar, Modo mapa | El título no dice qué pregunta responde el sitio. Tres botones que compiten con el mapa |
| **Pestañas** | Pronóstico 2027 y Datos del territorio | La segunda tiene 7 temas que distraen del pronóstico |
| **Barra de filtros** | Buscar municipio, Estado, "Color sin intervención", Más filtros, Restablecer | La búsqueda filtra el mapa, pero **no abre la ficha**. "Color sin intervención: Todos los niveles" no se entiende. El estado no reduce la lista de municipios |
| **Más filtros** | Ventana con 8 filtros (tamaño de lista, elección municipal, usos y costumbres, falta de casillas, datos anteriores, límites, lista mínima y máxima) | Demasiado para la pregunta principal |
| **Mapa** | Semáforo con rayas en rojo y puntos en amarillo | Las texturas se ven saturadas. **La leyenda queda debajo del mapa** y no se ve sin bajar |
| **Botones del mapa** | Mapa / Tabla, Distribución (mapa y ficha / ficha debajo), Descargar CSV, Ampliar mapa | Distribución, Ampliar mapa y Modo mapa hacen casi lo mismo |
| **Tarjetas de la derecha** | Rojos sin intervención 495; personas en rojos 23,818,704; participación supuesta del país 47.1 %; "Con estimación 2,477" | "Con estimación" y "1 municipio sin datos" son cifras de control, no de lectura. El 47.1 % ya no existe desde la 1.4 |
| **Panel de escenario** | Selector de nivel nacional (44.1 / 47.1 / 51.8 %), selector de intervención (sin / con), botón "Comparar sin/con intervención" | Con D27 sobra el nivel nacional; con D28 hay cinco tipos de intervención, no dos. El botón de comparar no muestra nada visible |
| **Ficha del municipio** | Al hacer clic en el mapa aparece **muy abajo**, después de las tarjetas y el panel de escenario | Hay que bajar para encontrarla. Mezcla pronóstico, supuestos S1 a S3, historia y seguridad en una sola columna larga |
| **Tabla** | Municipio, clave, estado, participación estimada, riesgo, "Datos de la estimación" | Útil, pero no es la vista principal. La última columna es de control |
| **Consultas guardadas** | Guardar y exportar filtros en el navegador | No ayuda a responder la pregunta |
| **Cómo explorar** | Ventana con 3 pasos | Si la pantalla es clara, no hace falta |
| **Modo mapa** | Mapa a pantalla completa con panel flotante y leyenda | **Es lo más cercano a lo que queremos:** mapa grande, controles pequeños y leyenda visible |
| **Datos del territorio** | 7 temas: elecciones locales 2027, por debajo del país, vecinos, personas y participación, falta de casillas, seguridad y participación en elecciones anteriores | Se quita por ahora (sección 5). "Participación en elecciones anteriores" ya tiene un selector de año y se reutiliza en la pestaña Histórico |
| **Metodología · Cómo leer los resultados** | Cinco capítulos | Dice "tres porcentajes nacionales", "seis escenarios" y un rango de "8 a 15 puntos hacia cada lado": ya no es así desde la 1.4 (sección 7) |
| **Datos y descargas** | CSV, JSON, GeoJSON y GeoPackage | Dice "seis escenarios: tres niveles nacionales"; hay que actualizarlo a la 1.6 |

## 3 · Nueva estructura

```
Traza Cívica          [ Pronóstico 2027 ]  [ Histórico ]  ·  Metodología  ·  Datos y descargas
```

| Se queda | Se quita | Por qué se quita |
| --- | --- | --- |
| Pestaña **Pronóstico 2027** (rediseñada) | Pestaña Datos del territorio | Distrae de la predicción; lo esencial pasa a la ficha |
| Pestaña nueva **Histórico** | Más filtros | La pregunta se responde con estado y municipio |
| **Metodología** (reescrita) | Selector de nivel nacional | D27: una sola predicción |
| **Datos y descargas** (actualizada) | "Color sin intervención" | Lo reemplaza la leyenda interactiva |
| | Consultas guardadas, Cómo explorar, Distribución, Ampliar mapa | Repiten funciones o no ayudan a leer el mapa |
| | Botón "Comparar sin/con intervención" | Las cifras de arriba ya muestran la diferencia |
| | Tarjetas "Con estimación" y "1 municipio sin datos" | Son de control; van en Metodología |

**Modo mapa pasa a ser la vista normal:** el mapa ocupa la pantalla y los controles flotan encima.

La **tabla** puede quedarse como un botón discreto ("Ver como tabla") o pasar a Datos y descargas. Recomendación:
botón discreto, porque permite ordenar por riesgo.

## 4 · Pestaña Pronóstico 2027

### 4.1 Pantalla

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ¿Dónde podría votar menos gente el 6 de junio de 2027?                                   │
│ Predicción por municipio para la elección intermedia · México                            │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  México ›                                                       (fija al bajar)          │
│  PARTICIPACIÓN ESPERADA   MUNICIPIOS EN ROJO   PERSONAS EN ROJO      PERSONAS EN LA LISTA  │
│  51.4 %                   495                  25.0 millones         98.3 millones         │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Estado ▾ ]  [ Municipio ▾ (se activa al elegir estado) ]                                │
│ Intervención:  (●Ninguna) ( Retener primerizos ) ( Jóvenes 20–29 ) ( Credencialización ) ( Las tres ) │
├────────────────────────────────────────────────────────────┬─────────────────────────────┤
│                                                            │                             │
│                     MAPA GRANDE                            │   Ficha del municipio       │
│                  (colores planos)                          │   (aparece al elegir uno;   │
│                                                            │    sin municipio, muestra   │
│  ┌ Leyenda ───────────────┐                                │    "Elige un estado o un    │
│  │ ■ Rojo · 495           │  ← clic: resalta solo esos     │    municipio en el mapa")   │
│  │ ■ Amarillo · 496       │                                │                             │
│  │ ■ Verde · 1,486        │                                │                             │
│  │ ■ Sin dato · 1         │                                │                             │
│  └────────────────────────┘                                │                             │
└────────────────────────────────────────────────────────────┴─────────────────────────────┘
```

### 4.2 Las cuatro cifras de arriba

Están siempre visibles (fijas al bajar) y **cambian con el nivel y con el tipo de intervención**. Encima
de ellas va la ruta: "México", "México › Oaxaca" o "México › Baja California › Tijuana". Cada parte de la
ruta es un enlace para regresar.

**Sin intervención:**

| Cifra | País y estado | Municipio |
| --- | --- | --- |
| **Participación esperada** | Σ (`part_pred` × lista) / Σ lista, con la lista de 2024 (`ln_2024`) | `part_pred`, con el rango debajo en letra chica |
| **Municipios en rojo** | Conteo de `riesgo == "alto"` | El color del municipio, con la palabra |
| **Personas en rojo** | Σ `ln_2024` de los rojos | "Frente al país": `(part_pred − 0.5141) × 100` puntos |
| **Personas en la lista** | Σ `ln_2024` | `ln_2024` |

**Con un tipo de intervención:** las mismas cuatro cifras y, debajo de cada una, la diferencia contra "sin
intervención" ("−84 municipios", "+0.4 puntos"). Se agrega una quinta cifra: **votos adicionales** (Σ
`votos_adicionales`), con la etiqueta "Supuesto, no efecto medido".

**Participación con intervención** del país o del estado: con credencialización (o las tres) crece la lista.
La cuenta correcta es Σ (`part_pred` × (lista + nuevos)) / Σ (lista + nuevos), donde "nuevos" =
`interv_nuevos_en_lista` solo en los municipios rojos sin intervención y solo con `credencializacion` o
`combinada`. Con esta cuenta el país da +0.36 puntos con las tres juntas en la 1.6, igual que la metodología.

**Cifras de control** (calculadas el 24 de octubre con `resultados-1.6`):

| Ámbito | Intervención | Participación esperada | Municipios en rojo | Personas en rojo | Votos adicionales | Salen del rojo |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| País | Ninguna | 51.4 % | 495 | 24,955,268 | 0 | 0 |
| País | Retener primerizos | 51.5 % | 476 | 23,670,302 | 84,789 | 19 |
| País | Jóvenes 20–29 | 51.7 % | 427 | 20,254,454 | 307,818 | 68 |
| País | Credencialización | 51.4 % | 488 | 24,870,039 | 135,793 | 7 |
| País | Las tres | 51.8 % | 411 | 18,886,724 | 528,400 | 84 |
| Baja California | Ninguna | 38.5 % | 6 | 3,182,648 | 0 | 0 |
| Baja California | Las tres | 39.9 % | 6 | 3,182,648 | 57,779 | 0 |
| Oaxaca | Ninguna | 52.0 % | 299 | 935,132 | 0 | 0 |
| Oaxaca | Las tres | 52.4 % | 267 | 832,830 | 24,659 | 32 |
| Veracruz | Ninguna | 44.2 % | 69 | 3,803,403 | 0 | 0 |
| Veracruz | Las tres | 45.3 % | 47 | 3,140,463 | 88,533 | 22 |

Personas en la lista del país: 98,330,348 (los 2,477 municipios con dato).

### 4.3 Buscar: primero estado, luego municipio

1. **Estado** (lista de 32). Al elegirlo:
   - el mapa se acerca al estado y atenúa el resto del país;
   - las cifras de arriba pasan al estado;
   - el selector de municipio se activa con solo los municipios de ese estado.
2. **Municipio** (autocompletar dentro del estado; acepta nombre o clave). Al elegirlo:
   - el mapa se centra en el municipio y lo marca con borde;
   - **se abre la ficha a la derecha** (hoy queda abajo y no se ve);
   - las cifras de arriba pasan al municipio.
3. **Clic en el mapa** hace lo mismo: un clic en un municipio desde la vista del país elige su estado y el
   municipio.
4. **Escribir directo un municipio** sin elegir estado también funciona: la búsqueda llena el estado sola.
   Hay 2 nombres que se repiten dentro de un mismo estado; la lista muestra la clave.

### 4.4 Tipo de intervención

**Botones de una sola opción** (segmentados), no una lista desplegable: se ven las cinco opciones a la vez.

| Botón | `intervencion` | Ayuda al pasar el cursor |
| --- | --- | --- |
| Ninguna | `ninguna` | Predicción sin acciones adicionales |
| Retener primerizos | `retener_primerizos` | Toda la generación de 18 a 20 años de 2024, haya votado o no, mantiene su participación respecto del municipio |
| Jóvenes 20–29 | `jovenes_20_29` | Las personas de 20 a 29 años recortan a la mitad su distancia con el resto de su municipio |
| Credencialización | `credencializacion` | Quienes cumplen 18 o 19 años tramitan su credencial y votan como los jóvenes de su municipio en 2021. Suma votos y personas a la lista, así que el porcentaje casi no sube: es una medida de inclusión |
| Las tres | `combinada` | Las tres acciones juntas |

- Debajo, una línea fija: **"Supuesto, no efecto medido. Se calcula solo en los 495 municipios en rojo."**
- El mapa se colorea con `riesgo` del escenario elegido. Los municipios que salen del rojo se ven en amarillo
  o verde según `riesgo`; conviene marcarlos además con un borde fino durante 1 o 2 segundos, para que se
  note el cambio.

### 4.5 Mapa y leyenda

- **Colores planos, sin rayas ni puntos.** Hoy el rojo lleva rayas y el amarillo puntos, para quien no
  distingue colores. Para no perder esa ayuda:
  - usar una paleta que se distinga con daltonismo (sugerencia abajo);
  - poner siempre la palabra (rojo, amarillo, verde) en la leyenda, en la ficha y al pasar el cursor.
- **Paleta sugerida** (inspirada en la paleta Okabe-Ito, pensada para daltonismo; hay que comprobarla):

  | Clase | Color | Hex |
  | --- | --- | --- |
  | Rojo · mayor riesgo | bermellón | `#C8553D` |
  | Amarillo · riesgo intermedio | ámbar | `#E3B23C` |
  | Verde · menor riesgo | verde azulado | `#4E9A84` |
  | Sin dato | gris claro | `#D5D5D2` |
  | Borde de municipio | blanco al 60 % | |
  | Municipio elegido | borde oscuro de 2 px | `#1F2A37` |

  Hay que probarla en modo oscuro y con un simulador de daltonismo (por ejemplo, el de las herramientas de
  Chrome) antes de fijarla.
- **Leyenda siempre visible,** flotando en una esquina del mapa, con el conteo de cada clase en el ámbito
  actual (país o estado).
- **Leyenda interactiva:** es la forma de "seleccionar por color". Un clic en "Rojo" resalta solo los rojos y
  atenúa los demás; otro clic lo quita. Reemplaza el filtro "Color sin intervención".
- **Al pasar el cursor:** nombre, estado, color con la palabra y participación esperada. Nada más.
- **Botones del mapa:** acercar, alejar y "México" para volver a la vista completa.

### 4.6 Ficha del municipio (panel derecho)

Ejemplo con Tijuana (`02004`), sin intervención. En el teléfono, la ficha sube desde abajo.

```
┌───────────────────────────────────────────────┐
│ Tijuana · Baja California             [ × ]   │
│ ■ ROJO · entre el 20 % de mayor riesgo         │
├───────────────────────────────────────────────┤
│ 1 · PREDICCIÓN 2027                           │
│ Participación esperada        37.1 %          │
│ Rango probable (90 %)         28.0 % – 47.9 % │
│ Frente al país                14.3 puntos menos│
│ Qué tan firme es el rojo      Probable (93 %) │
├───────────────────────────────────────────────┤
│ 2 · ¿QUÉ EMPUJA ESTA PREDICCIÓN?              │
│  Historia de participación  ◀▇▇▇▇▇▇  −12.4    │
│  Calendario y usos y cost.        ▇▶  +2.5    │
│  Lista y población                ▏   +0.4    │
│  Condiciones sociales       ◀▇▇▇     −4.5    │
│  Competencia política             ▏   −0.3    │
│  Suma: 14.3 puntos menos que el país          │
│ · Votó menos que el país en 6 de 6 elecciones │
│ · Elige ayuntamiento y gubernatura ese día    │
├───────────────────────────────────────────────┤
│ 3 · HISTORIAL                                 │
│  [gráfica: municipio vs país, 2009–2024,      │
│   y punto 2027 con su rango]                  │
├───────────────────────────────────────────────┤
│ 4 · ¿QUÉ HARÍA LA INTERVENCIÓN?               │
│  Tipo              Votos   Particip.  ¿Sale?  │
│  Retener primeriz.  5,191   37.4 %    No      │
│  Jóvenes 20–29     17,529   38.2 %    No      │
│  Credencialización  6,820   37.1 %    No      │
│  Las tres          29,540   38.5 %    No      │
│  Supuesto, no efecto medido.                  │
├───────────────────────────────────────────────┤
│ 5 · AVISOS (solo si hay)                      │
├───────────────────────────────────────────────┤
│ ▸ Contexto del municipio (no cambia la        │
│   predicción): jóvenes, seguridad             │
│ Descargar ficha                               │
└───────────────────────────────────────────────┘
```

**1 · Predicción** (del escenario elegido en `escenarios_2027.csv`):

- **Participación esperada:** `part_pred`.
- **Rango probable (90 %):** `part_pred_inf` a `part_pred_sup`.
- **Frente al país:** `(part_pred − 0.5141) × 100`, en "puntos más" o "puntos menos".
- **Qué tan firme es el rojo:** `probabilidad_rojo` de `municipios.csv`. Con 0.8 o más, decir "probable",
  nunca "seguro". Solo para rojos y amarillos.
- **Se quita "Escala de riesgo de 0 a 100".** Repite el color con otro número y confunde: no es un porcentaje
  de abstención.

**2 · ¿Qué empuja esta predicción?** Dos partes:

- **Barras por factor:** cuánto empuja cada grupo de variables la predicción hacia arriba o hacia abajo del
  país, en puntos. Las barras suman la distancia al país. Los grupos son los bloques del modelo
  ([metodología, capítulo 2](metodologia/02-variables.md)):
  - historia de participación;
  - calendario y usos y costumbres;
  - lista y población;
  - condiciones sociales;
  - competencia política.

  **Ya están en `resultados-1.6`:** `aporte_historia`, `aporte_calendario`, `aporte_lista`, `aporte_social` y
  `aporte_politica`, en puntos (D29, notebook 04c). Los cinco suman `(part_pred − 0.5141) × 100` de la fila sin
  intervención. Barras horizontales desde un eje en 0: a la izquierda baja, a la derecha sube. Ordenadas siempre
  igual (no por tamaño), para comparar municipios. Nota obligatoria debajo: "Reparto de la predicción del
  modelo; no son causas probadas".
- **Hechos del municipio** (ya están en `municipios.csv`), como frases cortas:
  - `elecciones_por_debajo_del_pais`: "Votó menos que el país en N de 6 elecciones";
  - `ayuntamiento_mismo_dia_2027` y `gobernador_mismo_dia_2027`: "Elige ayuntamiento el 6 de junio" o
    "**No** elige ayuntamiento el 6 de junio: en las intermedias sin elección municipal se vota menos";
  - `usos_y_costumbres`: "Elige a sus autoridades por usos y costumbres";
  - `brecha_jovenes_2024`: "Los jóvenes de 20 a 29 votaron N puntos menos que el municipio en 2024".

**3 · Historial:** una gráfica de líneas con la participación del municipio (`part_2009` a `part_2024`) y la
del país, más el punto de 2027 con su rango. Marcar cuáles son intermedias (2009, 2015, 2021) porque en
ellas se vota menos. Los datos vacíos se dejan como hueco, nunca como 0. Si `alerta_sin_casilla` no es "sin
antecedente", marcar el año sin casilla con un rombo gris y la nota "sin casilla: no se pudo votar".

**Participación del país por año:** `metadatos.json` → `participacion_nacional_historica.valores` (proporción
de 0 a 1): 2009: 0.4409, 2012: 0.6210, 2015: 0.4706, 2018: 0.6238, 2021: 0.5185 y 2024: 0.5968. Es la misma base de
la historia de cada municipio. En 2027 se usa 0.5141.

**4 · ¿Qué haría la intervención?**

- **Si el municipio está en rojo sin intervención:** tabla con los cuatro tipos (filas de
  `escenarios_2027.csv`): votos adicionales, participación con intervención y si sale del rojo (`riesgo` ≠
  `"alto"`). Se resalta el tipo elegido arriba.
  - **No siempre "las tres" es lo que más saca del rojo:** en Oaxaca, Mixistlán de la Reforma (`20060`) sale con jóvenes 20–29 y no
    con las tres, porque la credencialización baja un poco su porcentaje. Por eso hay que mostrar los cuatro.
  - De los 495 rojos, **85 salen con al menos un tipo** y 410 no salen con ninguno.
  - **Si `motivo` trae `intervencion_parcial`** (D32), avisar: "Intervención calculada solo con los datos
    disponibles". Pasa en 77 rojos con "las tres", casi siempre porque falta la credencialización.
- **Si no está en rojo:** una línea: "La intervención supuesta se calcula solo en los municipios en rojo."
- **Respuesta a "¿aplica por municipio o por país?":** se calcula municipio por municipio. Las cifras del
  estado y del país son la suma.

**5 · Avisos** (solo si aplican, en un recuadro discreto):

- `alerta_sin_casilla` = "recurrente" o "antecedente": "En elecciones anteriores faltaron casillas (última:
  `ultima_eleccion_sin_casilla`). Ese riesgo va aparte del color."
- `historia_completa` = `false` (38 municipios): "No tiene datos de todas las elecciones."

**Contexto (plegado):** brecha de jóvenes, homicidios, policía municipal y justicia cívica.
La tasa de homicidios en logaritmo sí es una variable del modelo; las demás columnas
de seguridad son contexto. Junto a la tasa se informa la comparación estatal de
fuentes2019–2024, sin atribuirla al municipio (H010).

**Descargar ficha:** se queda, al final.

## 5 · Pestaña Histórico

**¿Sirve?** Sí, por dos razones:

1. **Explica la predicción sin palabras:** al pasar de 2018 a 2021 o de 2024 a 2027 se ve que en las
   intermedias se vota menos y que los municipios sin elección municipal caen más.
2. **Ya está hecha a medias:** el tema "Participación en elecciones anteriores" de Datos del territorio ya
   tiene un selector de año y una escala de color. Se mueve a su propia pestaña.

**Cómo:**

- **Selector de año en botones:** 2009 · 2012 · 2015 · 2018 · 2021 · 2024, con una etiqueta chica
  ("intermedia" o "presidencial"). Opcional: un botón ▶ que recorra los años.
- **Color:** participación observada (`part_AAAA`) con **cortes fijos para todos los años** (menos de 40 %,
  40–50, 50–60, 60–70 y 70 % o más), en una escala de un solo tono (por ejemplo, azul pizarra de claro a
  oscuro). Con cortes fijos, la caída de las intermedias se ve al cambiar de año. "Sin casilla" en gris con
  rayas finas (es la única excepción a los colores planos, porque no es un nivel) y "sin dato" en gris claro.
- **Cifras de arriba:** participación del país ese año, participación del estado elegido y municipios bajo el
  40 %.
- **Estado y municipio:** los mismos selectores. Al elegir un municipio se abre la misma ficha, abierta en
  "Historial".
- **Sin intervención:** el selector no aparece en esta pestaña.

## 6 · Estilo

- **Tono:** institucional y sobrio. Fondo blanco o hueso, texto gris carbón y un solo color de acento (azul
  pizarra o azul tinta) en lugar del violeta actual. Nada de magenta, para no parecer del INE.
- **Tipografía:** una sola familia sans para la interfaz y la actual con serifa solo en el título principal.
  Las cifras grandes con números tabulares.
- **Menos cajas:** las secciones se separan con espacio y una línea fina, no con tarjetas con borde.
- **Avisos:** la franja amarilla de arriba se cambia por una línea gris bajo el título: "Estimaciones con
  supuestos. Consulta cómo leerlas." con enlace a Metodología.
- **Textos:** frases cortas, sin siglas sin explicar (S1, S2, S3, CCPC, NS, LN no aparecen en la pantalla).
- **Teléfono:** el mapa arriba, las cifras en dos filas y la ficha subiendo desde abajo.

## 7 · Metodología: "Cómo leer los resultados"

Reescribir para que diga lo mismo que la pantalla nueva y que la 1.6.

**Lo que hoy dice y ya no es cierto:**

| Dice | Debe decir |
| --- | --- |
| "Por eso se prueban tres porcentajes nacionales" | "La participación del país se estima con el calendario electoral de 2027: 51.4 %, con un error de unos 3 puntos" |
| "La participación total del país se plantea con tres supuestos porque el modelo no la predice" | Igual que arriba |
| "Seis escenarios permiten comparar sin y con intervención" | "Cinco opciones: sin intervención y cuatro tipos de intervención supuesta" |
| "[El rango] suele extenderse entre 8 y 15 puntos hacia cada lado" | "El rango mide de 18 a 29 puntos de ancho: incluye el error del municipio y el del nivel del país. Es una aproximación: en las pruebas cubrió entre 79 % y 93 %" |
| "Cambiar el supuesto nacional no cambia estos colores" | Se quita: ya no hay supuesto nacional |
| "Cada porcentaje nacional tiene dos opciones" | Se quita |
| "La cuenta suma tres supuestos" | "Hay tres tipos de intervención, que se pueden ver por separado o juntos" |

**Orden propuesto (seis bloques cortos, en el mismo orden que la pantalla):**

1. **Qué responde el mapa:** dónde podría votar menos gente el 6 de junio de 2027, comparado con el resto
   del país.
2. **La participación esperada y su rango:** qué es el 51.4 % del país, cómo se lee "puntos frente al país"
   y por qué la posición es más confiable que la cifra exacta.
3. **El color:** rojo = 20 % de mayor riesgo; amarillo = el 20 % siguiente; verde = el resto. Qué significa
   "probable". El color orienta, no decide.
4. **Qué empuja la predicción:** las cinco barras, que suman la distancia al país; en los rojos pesan sobre todo
   el calendario y la historia; es un reparto del modelo, no causas probadas.
5. **La intervención:** los tres tipos, que es un supuesto, que solo se calcula en los rojos y por qué la
   credencialización casi no sube el porcentaje.
6. **El histórico:** intermedias contra presidenciales; "sin casilla" no es abstención; sin dato no es cero.

Al final, enlace a los [límites](metodologia/07-limites.md) y a los detalles técnicos.

## 8 · Datos y descargas

- Cambiar "Seis escenarios: tres niveles nacionales, sin y con intervención" por "Cinco escenarios: sin
  intervención y cuatro tipos de intervención supuesta, con la participación del país estimada (51.4 %)".
- Cambiar `resultados-1.3` por `resultados-1.6` en toda la página y en el pie.
- Agregar la base de la entrega (`data/processed/entrega/base-datos-1.6/`, CSV y Excel con diccionario) si se
  quiere ofrecer en el sitio.

## 9 · Prioridades

**P1 · Indispensable antes del 31 de octubre**

| # | Cambio | Quién |
| --- | --- | --- |
| 1 | Migrar a `resultados-1.6`: un solo escenario por intervención, sin nivel nacional, y las columnas `aporte_*` ([vistas-mapa.md](vistas-mapa.md#estado)) | Front |
| 2 | Título con la pregunta y franja de aviso reducida a una línea | Front |
| 3 | Cuatro cifras fijas arriba, por país, estado y municipio, con intervención | Front |
| 4 | Estado → municipio; la ficha se abre a la derecha | Front |
| 5 | Botones de tipo de intervención | Front |
| 6 | Colores planos, leyenda visible e interactiva sobre el mapa | Front |
| 7 | Quitar Datos del territorio, Más filtros, Consultas, Cómo explorar, Distribución, Ampliar mapa, Comparar y el filtro de color | Front |
| 8 | Ficha en cinco partes: predicción, qué empuja la predicción (barras y hechos), historial, intervención y avisos | Front |
| 9 | Metodología y Datos y descargas al día con la 1.6 | Front, con textos del equipo de datos |

**P2 · Deseable antes del 31, si da tiempo**

| # | Cambio | Quién |
| --- | --- | --- |
| 10 | Pestaña Histórico | Front |
| 11 | Cambio de paleta y tipografía a un estilo más sobrio | Front |

**Ya entregado por el equipo de datos (24 de octubre):** `resultados-1.6` con `aporte_*` y la participación del
país por año.

**P3 · Después de la entrega**

- Botón ▶ para recorrer los años en Histórico.
- Resaltar por unos segundos los municipios que salen del rojo al cambiar de intervención.
- Revisión completa en teléfono y con lector de pantalla.

## 10 · Cómo saber que quedó bien

- Sin intervención, en la vista del país: **51.4 %, 495, 24,955,268 y 98,330,348**.
- Con "Las tres": **411 en rojo, 84 salen, 528,400 votos adicionales y 51.8 %**.
- Al elegir Oaxaca: **299 rojos**; con "Las tres", 267.
- Al elegir Tijuana, la ficha muestra **37.1 %, de 28.0 % a 47.9 %, 14.3 puntos menos que el país**; ningún
  tipo de intervención lo saca del rojo.
- En `20060` (Mixistlán de la Reforma), "Jóvenes 20–29" lo saca del rojo y "Las tres" no.
- En Tijuana, las barras dicen: historia −12.4, calendario +2.5, lista +0.4, condiciones sociales −4.5 y competencia
  política −0.3. En Xalapa, el calendario es la barra más larga (−10.0).
- Ninguna pantalla dice "tres niveles", "seis escenarios", "47.1 %", `resultados-1.3` ni `resultados-1.4` o `1.5`.
- Ninguna celda vacía se muestra como 0.
