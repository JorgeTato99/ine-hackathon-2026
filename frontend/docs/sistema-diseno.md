# Sistema de diseño de Traza Cívica

Versión **1.18.1** · Actualizado el 2026-10-24.
[Frontend](../README.md) · [Tokens y componentes](tokens-y-componentes.md) · [Explorador](explorador.md).

## Fundamento

MUI es la única biblioteca de componentes. Carbon aporta criterios para una
herramienta analítica: jerarquía, cifras legibles, navegación territorial y tabla
alternativa al mapa. La identidad propia conserva el carácter de atlas cívico,
con la simplificación de datos de D30 y la recuperación de experiencia acordada por Jorge y Sofía. No se imita la imagen del
INE ni se presenta el sitio como publicación oficial.

El diseño, la versión de software y el corte científico son independientes.
Sus fuentes son `src/theme/tokens.ts`, `package.json` y `public/data/manifest.json`.
El corte actual es resultados-1.6; el software es 0.6.0. Se conservan morado,
tipografías locales y los modos normal/ampliado aprobados. Las ayudas y avisos
usan las mismas superficies, tokens y controles del sistema.

## Identidad y tipografía

Fondo cálido #F7F6F2, texto #222838, acento morado #4338CA. En oscuro se usan
#151823, #F2F3F8 y #B8AEFF. Source Sans 3 Variable gobierna interfaz, capítulos,
ficha, registros y cifras. Newsreader Variable se reserva a títulos principales
y firma de marca. Ambas se sirven localmente con sus avisos OFL.

Los cuatro recursos aprobados —símbolo, banner, metodología y descargas— conservan
sus originales. `BrandMark` usa máscara en color heredado; `BrandArtwork` usa
picture/srcset, AVIF y WebP con tamaños adaptados; `BrandBanner` combina arte y
texto HTML. Los SVG que incluyen raster no se describen como vectorizaciones.
Ver [identidad y recursos](identidad-y-recursos.md).

`TraceRule` es decorativo, no una medición. El footer usa superficie de tinta,
fuentes y alcance, navegación y versión científica. Las imágenes de marca pueden
conservar su índigo original: son arte aprobado, separado del color de acciones.

## Composición vigente

Pronóstico 2027 e Histórico son las dos pestañas. Cuatro cifras se mantienen
visibles al desplazar la página. Estado y municipio permiten recorrer el territorio;
los cinco tipos de intervención son botones visibles. El modo ampliado ocupa la ventana con paneles minimizables. En escritorio los controles
flotan sobre el mapa; en móvil tienen su espacio antes del mapa. La ficha ocupa
una columna derecha con scroll propio, o una hoja inferior en teléfono.

La altura de escritorio usa el comienzo real del mapa y el espacio de la ventana,
sin escuchar scroll. En ventanas bajas la leyenda pasa a franja compacta. Al
enfocar se reserva el área libre mayor junto a la leyenda o encima de ella.
La tabla conserva orden, paginación y exportación.

No se muestran controles de nivel nacional, siete vistas de contexto, consultas
guardadas, filtros avanzados, distribución ni comparación binaria. Se recupera la ampliación como función independiente de los datos.
Los 16 componentes/auxiliares sustituidos se preservan fuera del código activo,
con copia SHA-256 en `temp/migracion-resultados-1.5/componentes-retirados/`.
Los patrones y helpers compartidos todavía útiles conservan sus pruebas.

## Color de información y accesibilidad

El semáforo usa colores planos: rojo #C74A5A, amarillo #D9B44A y verde #65A58A en claro;
#903545, #A18435 y #39715D en oscuro. Gris #D8DBDE / #69717D representa ausencia. Las palabras acompañan siempre al color en leyenda,
ficha, tabla y tooltip. La selección tiene contorno oscuro y halo blanco.
No se considera que una paleta por sí sola garantice accesibilidad.

Histórico usa cinco cortes constantes y azules de claro a oscuro. Solo la falta
de casillas lleva rayado gris; sin dato es una categoría distinta. Las líneas
dejan huecos y cuentan con tabla HTML equivalente. Las barras muestran valores
con signo y texto, en orden fijo y sin depender de una interpretación del color.

Los campos tienen etiquetas, las acciones nombres accesibles y el estado elegido
se comunica con aria-selected/aria-pressed. El teléfono usa el foco y Escape de
Drawer. Los contrastes y el reflow se comprueban en ambos temas, con teclado,
axe y Chromium a 320 px; eso no reemplaza una sesión humana con lector de pantalla.

## Movimiento

Se conservan las composiciones editoriales y entradas aprobadas, con contenido
visible antes y después y respeto a movimiento reducido. Ver [movimiento](movimiento.md).
El mapa conserva vuelo nativo de 800 ms, configurable en tokens. Los ensayos de
redibujado intermedio se descartaron por pausas; la explicación permanece en código.

## Documentación y calidad

Las reglas de composición están en [Explorador](explorador.md); el intercambio y
los controles, en [Resultados](resultados.md). Los componentes se documentan en
Storybook, con ejemplos identificados como ficticios cuando corresponda. Las
pruebas de los controles retirados se preservan en temp y se sustituyen por los
recorridos vigentes. No se reducen umbrales de cobertura para cerrar la migración.

## Identidad recuperada y lectura asistida · 1.17.0

El morado recupera el rol primario en ambos temas; azul tinta #275A70 / #A4CDDF
queda como secundario de apoyo, separado de información y del semáforo. La tipografía
actual se conserva. El símbolo, banner e ilustraciones aprobados no se regeneran.

El rojo deja su componente anaranjado; las tres variantes oscuras tienen menor
luminancia que las claras. Las mismas funciones de tokens alimentan Canvas, leyenda
y futuras vistas. Se comprueba el RGB real del Canvas en ambos temas, además de
texto, foco y alternativas. Esto no sustituye la revisión perceptiva del equipo.

Las ayudas de dos niveles y la silueta municipal son parte de la experiencia actual.
La silueta usa una proyección coherente, conserva partes y huecos y declara Sin escala.
El modo mapa y sus cuatro paneles se definen en [Explorador](explorador.md).

### Jerarquía del mapa ampliado · 1.18.1

Resumen centrado arriba; herramientas y leyenda a la izquierda; ficha sola a la
derecha desde arriba hasta abajo. Zoom, MX y las acciones van abajo al centro del
espacio libre, en una fila o dos según el ancho. El resumen se adapta a
su contenedor; todos conservan título y controles −/+. Cabeceras con fondo tenue,
filete morado en la ficha y bloque de predicción con acento primario aportan
jerarquía sin introducir otra paleta, sombras fuertes ni efectos de desenfoque.
La selección municipal deja un poco más de territorio alrededor (encuadre +14 %
por lado en este modo). Medidas en [tokens y componentes](tokens-y-componentes.md).
