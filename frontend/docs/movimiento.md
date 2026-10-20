# Movimiento: propósito, implementación y límites

Decisión del 19 de octubre de 2026: **CSS y transiciones MUI**.
No se añade una dependencia de animación.
Los gestos cartográficos los maneja Leaflet. La UI no necesita otra biblioteca
para animar grandes cambios de layout o arrastre de paneles.

Se compararon esas alternativas con Motion y dotLottie. Motion es la opción
priorizada si aparece una necesidad real de presencia interrumpible o gestos;
su API permite carga diferida con `LazyMotion`. Lottie no aporta una necesidad
actual para nuestras composiciones HTML/SVG. La investigación queda en el
expediente temporal, no como documentación científica del proyecto.

## Entradas normalizadas · sistema 1.4.0

Las páginas informativas y el explorador comparten cinco presets. La curva es
`cubic-bezier(.22, 0, .36, 1)`; el contenido principal mantiene opacidad 1 y
usa translate o scale, sin cambiar alturas ni espaciado del documento.

| Preset    | Cuándo                      | Distancia / duración     | Dónde                                           |
| --------- | --------------------------- | ------------------------ | ----------------------------------------------- |
| `hero`    | Al cargar el documento      | 24 px / 520 ms           | Título, introducción y acciones como una unidad |
| `heading` | Primera entrada en pantalla | Lateral, 16 px / 400 ms  | Encabezados de capítulo                         |
| `block`   | Primera entrada en pantalla | 24 px / 520 ms           | Fórmula, comparaciones, fuentes y cierre        |
| `item`    | Primera entrada en pantalla | 16 px / 400 ms           | Pasos, recursos y filas de definición           |
| `card`    | Primera entrada en pantalla | Scale 0.965 → 1 / 520 ms | Tarjetas de descarga, sin traslación            |

**Calibración visual 1.2.1:** el recorrido anterior de 6/12 px y 220/360 ms se
percibía demasiado breve. Esta iteración amplía el desplazamiento y la duración,
con una curva que distribuye el recorrido de forma más gradual en lugar de agotarlo tan pronto.
Los tiempos pertenecen a las entradas editoriales: botones, menús e índice conservan
su cadencia funcional. El contenido sigue disponible durante toda la animación.

En 1.3.0 los encabezados entran desde la izquierda, las descargas se asientan por
escala y las dos composiciones de cabecera tienen su propia coreografía. Los
presets verticales quedan para bloques de lectura y filas; no se mezclan varias
entradas sobre un mismo contenedor.

**Secuencias de contenido:** los elementos `item` y `card` de un mismo grupo que llegan juntos usan pasos de
60 ms, limitados a 120 ms. Si un elemento llega solo al hacer scroll, empieza
sin retraso. No hay secuencias entre capítulos ni una animación por párrafo.

**Una sola entrada:** cada objetivo deja de observarse al aparecer y no se repite
al regresar hacia arriba. La cabecera usa CSS desde el primer render; los bloques
comparten un IntersectionObserver por ámbito de entrada, sin listeners de scroll nuevos.
Las páginas informativas tienen un ámbito; Explorar delimita cabecera, base cargada
y ficha para acompañar su montaje y la preferencia de movimiento.
Si falta el observer o JavaScript, el contenido permanece visible y utilizable.

**Protecciones:** no animar los `section` con id que usa el índice; marcar su
contenido interior. El espacio y las anclas permanecen estables. El índice,
avisos importantes y cifras científicas conservan su presentación. Evitar marcas
anidadas para que los desplazamientos no se acumulen.

Al enfocar una acción se asienta su contenedor. Con movimiento reducido se
asientan los objetivos y se desconecta la observación; no se repiten entradas si
la preferencia vuelve a activarse dentro del mismo documento. No se mueve el foco
ni se bloquean acciones hasta terminar una animación.

### Receta reutilizable

```tsx
import Box from "@mui/material/Box";
import { EntranceScope } from "@/components/motion/entrance-scope";
import { entranceProps } from "@/theme/entrance";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";

<EntranceScope>
  <Box {...entranceProps("hero")}>...</Box>
  <SectionHeading title="Un capítulo" />
  <Surface entrance="block">...</Surface>
  <Box data-entrance-group>
    <Surface entrance="item">...</Surface>
    <Surface entrance="item">...</Surface>
  </Box>
</EntranceScope>;
```

`entranceProps` marca un elemento existente sin añadir wrappers, por ejemplo un
`li` o el `div` que agrupa `dt`/`dd`. `Surface` recibe el preset opcional y
`SectionHeading` usa `heading`. `EntranceScope` delimita el área que se observa;
fuera de ella los presets de viewport son estáticos. Debe envolver el contenido
editorial estático de la página; para repetir una demostración de Storybook se
remonta únicamente ese ámbito, preservando el botón de replay.

Los valores viven en `entrancePresets`, `motionTokens` y `motionCompositions`, aplicados como variables
CSS por el tema. Storybook incluye **Entradas de contenido** con replay y scroll.

## Composiciones de cabecera

Estas secuencias expresan una relación visual concreta; no sustituyen el preset
genérico de un párrafo, una tabla ni una recomendación científica.

### Recorrido 1 → 2 → 3

`TraceOverview` conserva una lista ordenada semántica. Cada número aparece por
escala y opacidad, seguido por su tarjeta desde la derecha; el conector se dibuja
hacia la siguiente etapa. Las tarjetas se solapan parcialmente para formar una
secuencia continua, no tres pausas independientes.

| Pieza      | Inicio 1 / 2 / 3              | Duración |
| ---------- | ----------------------------- | -------- |
| Números    | 120 / 340 / 560 ms            | 360 ms   |
| Tarjetas   | 180 / 400 / 620 ms            | 520 ms   |
| Conectores | 300 / 520 ms; solo dos tramos | 220 ms   |

La composición termina a los 1,140 ms. `--tc-sequence-order` se declara en cada
etapa; los tiempos se calculan a partir de `motionCompositions.trace`. No dependen
de `nth-of-type`, que puede cambiar al añadir elementos al marcado.

### Archivo en abanico

`ArchiveOverview` presenta primero la hoja central (120 ms), después la izquierda
(260 ms) y finalmente la derecha (400 ms). Cada hoja parte del centro con rotación
neutra, desplazamiento y escala suave; se abre hasta su posición final en 640 ms.
La última termina a los 1,040 ms. La geometría final conserva el diseño original.
Las hojas son decorativas y están fuera del árbol de accesibilidad.

Ambas composiciones usan CSS desde la carga, una sola vez y sin bucles. Solo en
estas ilustraciones de apoyo se permite opacidad temporal 0: no se aplica a la
introducción, avisos, acciones, descargas o contenido científico principal.
El contenido está en el HTML y la secuencia termina sin depender de JavaScript.
En móvil las ilustraciones de cabecera siguen ocultas y no ejecutan animaciones.

Las propiedades translate, rotate, scale y opacity se clasifican como movimiento
ligero, sin animación de layout ni nuevas dependencias JavaScript. Su composición
y fluidez reales dependen del navegador; no se prometen 60 fps ni métricas Core
Web Vitals sin medirlas. No se usan blur, clip-path, rebotes o parallax.

## Patrones aplicados

| Patrón                 | Propiedades / duración                                     | Propósito y límite                                            |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Archivo ilustrado      | Opacity/translate/rotate/scale, 640 ms; centro → laterales | Despliegue único de las hojas decorativas                     |
| Recorrido editorial    | Número por scale, tarjeta lateral, conector por scale      | Mostrar el orden de las tres etapas, hasta 1,140 ms           |
| Tarjetas de descarga   | Scale, 520 ms; texto opaco                                 | Presentar recursos como unidades, sin esperar para enfocarlos |
| Encabezado de capítulo | Translate lateral, 400 ms                                  | Variar la entrada conservando el espacio de ancla             |
| Flecha de acción       | Transform, 120 ms y 2 px                                   | Feedback al pasar el puntero; no sustituye foco ni etiqueta   |
| Identidad de ficha     | Translate lateral, 400 ms y 16 px                          | Señalar un municipio nuevo sin remontar acciones o formulario |
| Escenario B            | Translate, 220 ms                                          | Respuesta breve al activar la segunda lectura                 |
| Panel móvil y menús    | Transiciones MUI                                           | Mantener foco y comportamiento de componentes existentes      |

Las propiedades transform/opacity son candidatas a composición eficiente; no
se garantiza aceleración, 60 fps o costo nulo en todos los dispositivos. El
movimiento no anima geometrías del mapa, números científicos ni alturas de
capítulos. No hay bucles decorativos ni `will-change` permanente.

## Contenido y accesibilidad

### Aplicación en Explorar

`ConsultationGuide` reutiliza el ritmo narrativo 120/340/560 ms para iconos y
180/400/620 ms para etiquetas. Sus conectores se dibujan horizontalmente; esta
guía de apoyo se presenta desde `lg` y no sustituye los controles de consulta.
Es la variante horizontal de la misma familia de secuencias, no nuevos tiempos
aislados por página.

`LocationGuide` es un SVG conceptual en la ficha sin selección: planos por
escala/opacidad (520 ms), marcador desde arriba (640 ms tras 160 ms) y anillo de
localización (520 ms tras 400 ms). Termina a los 920 ms, sin rebote ni repetición
al filtrar. Está fuera del árbol de accesibilidad y no representa datos reales.
Sus tiempos y distancias viven en `motionCompositions.location`.

El ámbito de entrada del espacio de trabajo se monta cuando llega la base.
Así registra el panel de filtros, que entra por escala una sola vez; no depende
de observar mutaciones de DOM ni vuelve a montarse con cada consulta. Cabecera y
ficha conservan sus ámbitos para cancelar movimiento al reducir la preferencia.
No se aplica ninguna entrada al contenedor del mapa, sus ancestros, canvas,
geometrías, tabla de resultados, porcentajes o curva histórica.

Solo la identidad de la ficha se remonta al cambiar de CVEGEO; las acciones y
su foco mantienen identidad mientras la ficha esté montada. La segunda lectura
recibe una línea decorativa por scaleX de 400 ms al activarse. Sus valores,
avisos e intervalos aparecen directamente; no se dibujan curvas como si los
datos llegaran en el tiempo ni se usan contadores numéricos animados.

Los nuevos efectos usan translate, scale y opacity, sin nuevas dependencias ni
animación de layout. Se clasifican como ligeros, sujetos a composición real del
navegador. La preferencia reducida los muestra completos y estables, incluso al
restaurarla dentro del mismo ámbito. Storybook incluye una demostración con replay.

### Lectura y navegación

El índice de capítulos tiene un resaltado funcional: fondo/texto de acento en
120 ms y barra lateral con transform/opacity en 220 ms. El cambio de color implica
paint, acotado a las entradas que cambian; no se presenta como costo nulo. La
posición de lectura se comunica también con `aria-current="location"`, sin
anuncios repetidos, saltos de foco o cambios de URL durante el scroll.

El contenido principal y los controles se prerenderizan visibles y mantienen
opacidad 1. Las hojas decorativas y las tarjetas de la ilustración de recorrido
usan transparencia durante su entrada, al igual que las guías de consulta y
localización de Explorar; las mismas etapas se explican en el
contenido principal de Metodología. La información principal no espera
`animationend`, observadores de scroll ni consultas antes de mostrarse.

El título municipal puede remontarse para repetir su entrada; las acciones,
el panel y la selección conservan su identidad. No se fuerza foco al cambiar un
municipio ni se añade una espera artificial a la navegación.

`theme.motion.reducedMotion = "system"` aplica la preferencia a MUI. El CSS propio
incluye además su tratamiento de `prefers-reduced-motion`: sin entradas, sin
scroll suave cuando se solicita reducción.
Estas dos capas son necesarias; configurar MUI no cubre por sí solo el CSS propio.
Si se reduce el movimiento durante una secuencia, todos sus componentes se
asientan visibles. La marca persistente de `EntranceScope` evita repetir la
coreografía al restaurar la preferencia en el mismo documento.

La navegación entre páginas usa enlaces HTML directos. Las ilustraciones de
cabecera ocultas en pantalla pequeña no ejecutan su entrada.

Se probó View Transitions entre documentos y se retiró: la prueba de navegación
rápida hacia una descarga registró cancelación del opt-in, primero en móvil y
después en escritorio, incluso al restringir su activación. La navegación y la
descarga continuaron funcionando, pero la evidencia no justificó mantener ese
efecto. No se atribuye una causa no demostrada al navegador ni se añaden esperas
artificiales o filtros a la consola para conservarlo.

## Tokens y mantenimiento

`motionTokens` define feedback 120 ms, transiciones funcionales de 220/360 ms,
vuelo cartográfico de 800 ms, desplazamiento funcional 6/12 px y curvas. `entrancePresets` define el recorrido
editorial de 16/24 px y 400/520 ms, junto con `card` por escala; usa `motionTokens.easing.entrance`, independiente
de la curva de controles. El tema expone variables `--tc-motion-*` y
`--tc-entrance-*` que consume `globals.css`. Storybook importa las mismas reglas,
incluidas las de movimiento reducido.
`motionCompositions` contiene los tiempos de recorrido y abanico, sus distancias
y las escalas iniciales. No cambiar retrasos de cada componente de forma aislada:
mantener el orden, solapamiento y duración total documentados. Storybook ofrece
**Movimiento** con replay de ambas composiciones y **Entradas de contenido** con
los cinco presets.

### Acercamiento municipal

Al seleccionar un municipio, la cámara se desplaza y acerca con `flyToBounds`
de Leaflet en **0.8 segundos** (`motionTokens.duration.mapFlight`, en ms;
la API recibe segundos). Se utiliza su curva nativa de vuelo; no se aplica la
curva CSS editorial al Canvas ni se actualiza estado React en cada frame.
El destino incorpora la reserva para paneles y controles en ambas vistas.

La duración se configura en ese token; 0 desactiva el vuelo. Durante el recorrido
se conserva el escalado nativo del Canvas y Leaflet redibuja al finalizar.
Se descartaron los ensayos de dos y ocho redibujados intermedios porque las pausas
que introdujeron empeoraron la experiencia. Se acepta el engrosamiento temporal
de los bordes para mantener la continuidad del acercamiento.

Este movimiento expresa el cambio de escala territorial. No se reproduce al
cambiar escenario o tema, al cargar una URL con selección, ni en los ajustes de
filtros. La ficha se puede leer durante el recorrido y los controles siguen activos.
Los gestos y una nueva orden de cámara cancelan el vuelo anterior. Con movimiento
reducido el encuadre es directo; si se activa durante el vuelo, se completa el
destino sin continuar la animación. Sin transformaciones 3D se usa el mismo
encuadre directo. Ver las reglas de resize y comprobación en
[cartografía](cartografia.md).

Las capturas de QA se toman al estado final de animaciones. El comportamiento
temporal, la preferencia reducida y la navegación se verifican por separado en
navegador. Las cifras de bundle del proveedor no se presentan como mediciones
de este proyecto; el expediente contiene la comparación de nuestras exportaciones.

## Paneles de herramienta · sistema 1.5.0

Los paneles flotantes del modo mapa usan `tc-floating-panel-enter`: opacidad y
traslación de 12 px durante 220 ms, con la curva de entrada compartida. Es movimiento
ligero de feedback, sin dependencia adicional. Respeta movimiento reducido.
No se animan ancho, altura o posición del Canvas ni se escalonan las filas al
ordenar/filtrar. El cambio de composición aplica su layout directamente; Leaflet
actualiza tamaño y cámara. No se acredita INP o CLS mediante estas reglas: se
comprueba interacción y estabilidad en navegador.

## Fuentes primarias y referencias

Consultadas el 19 de octubre de 2026:

- [MUI: transiciones y movimiento reducido](https://mui.com/material-ui/customization/transitions/).
- [Motion: LazyMotion y carga de features](https://motion.dev/docs/react-lazy-motion).
- [Chrome: transiciones entre documentos](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document).
- [MDN: @view-transition](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition).

Volver a [sistema de diseño](sistema-diseno.md),
[tokens y componentes](tokens-y-componentes.md) o [frontend](../README.md).
