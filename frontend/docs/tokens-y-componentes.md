# Tokens y componentes · Traza Cívica 1.7.1

Este documento define la versión vigente del sistema visual. Su fuente está en
[`src/theme/tokens.ts`](../src/theme/tokens.ts), aplicada por
[`theme.ts`](../src/theme/theme.ts). Es independiente de la versión del software
y de los resultados científicos, actualmente `resultados-1.2`.

## Espaciado y densidad

Se conserva `theme.spacing(1) = 8px`. Los factores MUI no son píxeles:

| Factor  | 0   | 0.5 | 1   | 1.5 | 2   | 2.5 | 3   | 4   | 5   | 6   | 8   | 10  | 12  |
| ------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Píxeles | 0   | 4   | 8   | 12  | 16  | 20  | 24  | 32  | 40  | 48  | 64  | 80  | 96  |

`space` exporta esas dimensiones como strings CSS: `space[3] === "24px"`.
`sx={{ p: 3 }}` y `sx={{ p: space[3] }}` producen el mismo espacio. No pasar
un número de píxeles a una propiedad MUI que espera factores.

`Surface` ofrece `compact` (16 px), `comfortable` (24 px) y `editorial` (32 px).
En pantallas pequeñas conserva 16 px para el espacio útil. El contenedor editorial
usa hasta 1,240 px, la aplicación hasta 1,600 px y el rail 200 px. La lectura se
mantiene en columnas de ancho controlado, no en párrafos de 1,600 px.

## Tipografía

La variante `typeScale.compactTitle` sirve a cabeceras de herramientas de alta
densidad. El explorador la usa con ayuda bajo demanda; no sustituye la cabecera
editorial. `explorerLayout` centraliza anchos y reservas de controles/paneles en
píxeles CSS y la fracción de viewport de la hoja móvil.

Roboto local, pesos 400/500/700, con Arial/sans-serif de respaldo. Se respeta el
tamaño base del navegador; los tamaños usan `rem`.

| Rol      | Tamaño           | Interlineado | Peso | Uso                                       |
| -------- | ---------------- | ------------ | ---- | ----------------------------------------- |
| display  | 34–54 px fluidos | 1.08         | 700  | Cabecera editorial                        |
| title    | 26–32 px fluidos | 1.2          | 700  | Cabecera analítica/h1                     |
| section  | 24 px            | 1.3          | 700  | Capítulos/h2                              |
| subtitle | 18 px            | 1.4          | 700  | Subsecciones                              |
| body     | 16 px            | 1.7          | 400  | Lectura                                   |
| small    | 14 px            | 1.6          | 400  | Ayuda y contexto corto                    |
| caption  | 12 px            | 1.5          | 400  | Metadatos                                 |
| label    | 11 px            | 1.6          | 700  | Etiquetas breves, nunca párrafos críticos |

Las cifras de tablas usan `tabular-nums`. `PageHeader` controla las variantes
compacta/workspace/editorial; no repartir overrides de h1 entre páginas.

## Paleta semántica

| Rol                   | Claro                 | Oscuro                |
| --------------------- | --------------------- | --------------------- |
| canvas                | `#F7F6F2`             | `#151823`             |
| surface               | `#FFFFFF`             | `#1D2230`             |
| ink                   | `#222838`             | `#F2F3F8`             |
| muted                 | `#596273`             | `#BBC1CF`             |
| line                  | `#DDDCD6`             | `#454C5C`             |
| control               | `#78818E`             | `#929BAD`             |
| accent                | `#4338CA`             | `#B8AEFF`             |
| accentSoft            | `#EDEBFF`             | `#302D53`             |
| neutralSoft           | `#ECECE8`             | `#2C313C`             |
| info / infoSoft       | `#245C8A` / `#EAF2F8` | `#9CCDF4` / `#20394B` |
| warning / warningSoft | `#805800` / `#FFF2CC` | `#F0CF82` / `#3D3218` |
| error / errorSoft     | `#A42E35` / `#FCE9EB` | `#FFA6AD` / `#48242B` |
| success / successSoft | `#17664B` / `#E7F2EB` | `#8DD6AF` / `#19392D` |

Los avisos de interfaz son distintos del riesgo territorial. `riskTokens` conserva
la paleta del semáforo, etiqueta, símbolo y relleno de mapa por separado.
El foco usa el acento efectivo y un anillo de 3 px con separación de 3 px. Los
campos usan el borde funcional de su modo, incluido el oscuro.

## Geometría visual y acciones

Radios CSS: control 6 px, panel 12 px, cabecera destacada 20 px, overlay 16 px y
pill 999 px. Se exportan strings para evitar que `sx.borderRadius` los multiplique.
Botones de al menos 40 px de alto; `contained` para acción principal, `outlined`
para secundaria y `text` para auxiliares. Se reutilizan botones/campos MUI directamente.

## Contratos reutilizables

La base se introdujo en 1.0.0; las incorporaciones posteriores se identifican en
el registro. Storybook muestra variantes reales y los dos modos.

| Componente        | Contrato                                                                   | Uso                                                    |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| `PageHeader`      | eyebrow, title, description; density compact/workspace/editorial; children | Explorador y cabeceras informativas                    |
| `ContentPage`     | eyebrow, title, description, aside, chapters, children; action opcional    | Composición editorial con índice y lectura             |
| `SectionHeading`  | title; description, number, id opcionales                                  | Capítulos de ambas páginas                             |
| `Surface`         | tone paper/brand; density; sx                                              | Contenido estructurado y énfasis                       |
| `NotePanel`       | title, children; tone info/warning; announce                               | Contexto estático como nota; alert solo cuando se pide |
| `DataStatus`      | observed/modeled/pending/sample; label opcional                            | Estado de contenido, independiente del riesgo          |
| `FileCard`        | recurso con título, href, formato, bytes y unidad                          | Descargas con nombres accesibles únicos                |
| `SourceReference` | institution, title, description, detail, href y linkLabel                  | Procedencia de INE/INEGI                               |
| `ChapterNav`      | lista id/label                                                             | Índice local y anclas nativas                          |

`TraceOverview` y `ArchiveOverview` son composiciones editoriales específicas, no
una biblioteca genérica de gráficos ni representaciones científicas. Las piezas
con callbacks del tema están en la frontera cliente de Next; el contenido y los
datos de archivo se prerenderizan en el build estático.

## Seguimiento del índice (1.1.0)

`ChapterNav` identifica la sección situada en la zona superior de lectura al
desplazarse en ambos sentidos, al entrar con un ancla y tras cambios de tamaño.
Al llegar al pie reconoce el último apartado aunque sea corto. Una sola entrada
usa `aria-current="location"`, fondo de acento y barra lateral. Se conserva el
peso tipográfico para evitar saltos de tamaño al cambiar el resaltado.

El scroll no modifica URL, historial ni foco. Los enlaces siguen siendo anclas
HTML utilizables sin JavaScript; el seguimiento activo es una mejora del cliente.
Las posiciones se cachean y se recalculan al cambiar tamaño o fuentes, con eventos
pasivos y como máximo un frame pendiente. React solo cambia cuando cambia el capítulo.
Las transiciones del índice se desactivan con movimiento reducido.

## Versionado

Desde 1.4.0 el explorador incorpora componentes analíticos de composición:

| Componente          | Contrato                                                 | Uso                                     |
| ------------------- | -------------------------------------------------------- | --------------------------------------- |
| `ExplorerHeader`    | `onMapMode`, `mapDisabled`; título compacto y ayuda      | Entrada de la herramienta               |
| `ConsultationGuide` | Sin props; tres etapas con cadencia narrativa compartida | Apoyo inicial en escritorio y Storybook |
| `WorkspaceHeading`  | `number`, `title`; h2 compacto                           | Secciones numeradas y catálogo aislado  |
| `LocationGuide`     | Sin props; SVG decorativo conceptual                     | Ficha sin selección                     |

Se conservan los cinco presets de entrada. Las composiciones nuevas reutilizan
sus tiempos, la secuencia narrativa y `motionCompositions.location`. La ficha
usa radios `panel` y los fondos semánticos de cada modo. El mapa conserva un
contenedor estable y las cifras se presentan sin interpolación visual.

Las [entradas normalizadas](movimiento.md)
añaden `EntranceScope`, `entranceProps` y el preset opcional `Surface.entrance`
en 1.2.0. El catálogo de escenarios y su receta se mantienen en la guía de
movimiento para que todos los componentes compartan los mismos tiempos y límites.

`EntranceScope` acepta `children` y `sx` y conserva un solo contenedor MUI.
`entranceProps(preset)` devuelve atributos para un elemento existente. Los presets
son `hero`, `heading`, `block`, `item` y `card`; `data-entrance-group` reúne elementos
`item` o `card` que aparecen juntos, con secuencia limitada. La API original se
incorporó en 1.2.0; `card` añade la entrada por escala en 1.3.0. `heading` usa
recorrido lateral desde 1.3.0.

`motionCompositions` centraliza las coreografías de `TraceOverview` y
`ArchiveOverview`. Mantienen contratos de contenido y geometría final, con pasos
explícitos, números/conectores coordinados y abanico desde el centro. Su guía,
límites de opacidad y tiempos están en [movimiento](movimiento.md).

`designSystem.version` sigue SemVer para tokens y contratos visuales: major para
API incompatible, minor para variantes compatibles, patch para correcciones.
Se documenta la versión del sistema; no se duplican `ButtonV1` y `ButtonV2`
cuando basta una variante. Una incompatibilidad que requiera coexistencia deberá
tener migración y deprecación explícitas.

La entrega de datos sigue su propio contrato y versión. Cambiar una paleta o
espaciado nunca cambia el significado de un escenario ni actualiza el modelo.

## Registro

**1.7.1 · 20 de octubre de 2026.** Evitar desplazamientos del control entre
pulsar y soltar durante entradas activas. Conservar el foco por teclado
inmediato y completar el gesto antes de asentar el contenedor para ratón/tacto.
Sin cambios a recorridos, duraciones ni APIs visuales.

**1.7.0 · 20 de octubre de 2026.** Lenguaje y ayudas de lectura:
`ContextHelp` recibe un `topic` tipado del catálogo compartido. Ofrece un resumen
al apuntar/enfocar y una explicación en diálogo por clic, teclado o tacto, con
cierre y retorno de foco. Las condiciones esenciales permanecen visibles.
«Datos del territorio» y «Tema del mapa» explican los siete temas sin cambiar
claves ni datos científicos. Reglas en [lenguaje y ayudas](lenguaje-y-ayudas.md).

**1.6.0 · 20 de octubre de 2026.** Presentación de resultados científicos:
`ResultsViews` ofrece pestañas y selectores de indicador; `ResultsCards` presenta
conteos en una franja desplazable con teclado o cuadrícula `compact` en el lateral;
`ResultsLegend` mantiene unidades
y categorías legibles; `ResultsDetails` separa pronóstico, historia y contexto.
`DataStatus.modeled` identifica resultados de modelo sin confundirlos con observaciones.

`contextMapTokens` centraliza escalas azules secuenciales, categorías, zonas LISA,
ausencia de datos y falta de casillas. Las escalas numéricas conservan su referencia
nacional al filtrar. Cada color se acompaña de etiqueta en leyenda, ficha y tabla;
las zonas LISA y la alerta sin casilla no reutilizan los colores del semáforo como
equivalencia de riesgo. Se conserva el movimiento existente, incluido el vuelo
nativo de 800 ms sin redibujados intermedios.

**1.5.0 · 20 de octubre de 2026.** Explorador compacto, filtros adicionales,
tabla con orden y paginación, y modo mapa con controles y paneles plegables.

**1.4.0 · 19 de octubre de 2026.** Integración de Explorar: cabecera y guía
compactas, encabezados de espacio de trabajo, localización conceptual de entrada
única, filtros por escala y ficha con bloques y acento de segunda lectura.
Identidad municipal con entrada lateral de 16 px/400 ms. Sin cambios al contrato
científico, a la geometría del mapa o a las APIs previas de componentes.

**1.3.0 · 19 de octubre de 2026.** Recorrido numerado con aparición escalonada y
conectores, archivo en abanico, nuevo preset `card` por escala y encabezados
laterales. Tiempos de composiciones centralizados; se conserva la API anterior,
el movimiento reducido y el acceso a las descargas durante su entrada.

**1.2.1 · 19 de octubre de 2026.** Calibración de entradas editoriales: recorrido
16/24 px, duración 400/520 ms y curva propia con aceleración gradual. Conserva
las APIs, las secuencias acotadas y la respuesta de controles e índice.

**1.2.0 · 19 de octubre de 2026.** Entradas de carga y viewport con presets
hero/heading/block/item, secuencias acotadas, protección de foco y movimiento
reducido, documentadas en Storybook. Sin cambios incompatibles de props.

**1.1.0 · 19 de octubre de 2026.** Índice con seguimiento de lectura, estado
accesible y resaltado animado en ambos temas, sin cambios incompatibles de props.

**1.0.0 · 19 de octubre de 2026.** Primera base formal: escalas explícitas,
paleta por modo y rol, tipografía analítica/editorial, superficies, estados y
composiciones aplicadas a páginas. Se separa la versión científica de la identidad.

Volver a [sistema de diseño](sistema-diseno.md), [frontend](../README.md) o
[testing](../test/README.md).

La guía de [lenguaje y ayudas](lenguaje-y-ayudas.md) gobierna las etiquetas,
explicaciones visibles y el componente `ContextHelp`, también disponible en Storybook.
