# Identidad y recursos visuales

La marca es **Traza Cívica · Participación y territorio**. Su dirección visual
es un atlas cívico editorial: historia, territorio y trazas de lectura. Usa
Newsreader para títulos y marca y Source Sans 3 para interfaz y descriptor.
Paleta y proporciones se centralizan en [tokens y componentes](tokens-y-componentes.md).

## Recursos aprobados · 1.15.0

Jorge seleccionó cuatro imágenes de GPT y entregó sus PNG comprimidos. Los
maestros se conservan sin cambios en [`assets/brand/`](../assets/brand/README.md),
con procedencia y huellas en su manifiesto. Las variantes servidas están en
`public/brand/generated/`; sólo ese resultado optimizado llega al navegador.

`BrandMark` aplica el alfa del símbolo como máscara CSS y hereda el color de
marca, índigo en claro y lavanda en oscuro. Usa `image-set` con PNG de 64/128/256
px para densidades de pantalla. El favicon y los SVG de distribución incorporan
el mismo símbolo raster. **No se ha vectorizado:** un contenedor SVG con un PNG
incrustado conserva un símbolo raster. Los textos de wordmark/banner sí mantienen
los trazados tipográficos existentes; la interfaz usa las fuentes locales.

`BrandBanner` compone el arte sobre papel cálido, nombre y descriptor en el
footer. La variante PNG de 1200 × 630 se usa en Open Graph/Twitter para compartir.
No se añade sobre el mapa operativo: su cabecera conserva la altura compacta.
La ilustración metodológica acompaña «Del dato al territorio» y la carpeta
acompaña «Cómo usar los archivos». Se conservan los recorridos animados de las
cabeceras; las ilustraciones no reemplazan su contenido o secuencias.

## Variantes y carga

`BrandArtwork` usa `picture`, `srcset` y `sizes`. AVIF es preferido cuando la
medición conjunta de sus variantes ahorra al menos 5 % frente al respaldo.
El respaldo es WebP o PNG, el más pequeño en la medición de esa pieza. En la
entrega inicial las tres ilustraciones usan AVIF con respaldo WebP; el símbolo
usa PNG. No se descargan simultáneamente todos los tamaños y formatos.

| Pieza       | Anchos de archivo            | Ancho visual máximo           |
| ----------- | ---------------------------- | ----------------------------- |
| Símbolo     | 32, 64, 128, 256 px          | 28–64 px en los usos actuales |
| Banner      | 320, 640, 960, 1280, 1774 px | 400 px en footer              |
| Metodología | 320, 480, 768, 1200, 1427 px | 760 px                        |
| Descargas   | 320, 640, 960, 1126 px       | 320 px                        |

El navegador decide el archivo según ancho y densidad de pantalla. `sizes`
empieza con `auto` para las imágenes diferidas: usa su ancho real ya calculado
cuando el navegador lo admite. Conserva una lista explícita de tamaños como
respaldo, sin un listener de resize ni selección de imágenes por JavaScript.
Las imágenes decorativas tienen `alt=""`, dimensiones intrínsecas explícitas,
`loading="lazy"`, `decoding="async"` y prioridad baja. El símbolo pequeño es
parte de la identidad inmediata. Las dimensiones reservan espacio antes de la
decodificación. Las tramas científicas y el Canvas no usan estas ilustraciones.

Los anchos visuales se centralizan en `brandImageTokens`. No se reescala por
encima del maestro. Sólo se recortan márgenes de las tres piezas transparentes;
el banner conserva su composición 2:1 y su área libre para texto. El alfa se
conserva en AVIF/WebP. No se modifica el color de las ilustraciones por filtros
CSS; el banner mantiene su superficie cálida en ambos temas para asegurar lectura.

## Reproducir y verificar

```console
npm run assets:brand
node scripts/prepare-brand-assets.mjs --check
```

El script compara PNG/WebP/AVIF, publica sólo los formatos seleccionados,
genera nombres con huella, actualiza referencias/manifiesto, favicon y recursos
compuestos. Retira únicamente derivados anteriores listados en su manifiesto,
tras verificar los nuevos; no toca maestros ni imágenes de las carpetas temporales.
La codificación limita Sharp a dos hilos y se ejecuta de forma secuencial.

El build verifica las huellas de entradas y salidas. No codifica en cada build,
no descarga originales y no depende de `temp/`. Sharp está fijado como herramienta
de desarrollo. Los JSON/SVG generados se excluyen de Prettier porque su contenido
se comprueba por hash. Los SVG se emiten con finales de línea LF para conservar
sus huellas al clonar en otro sistema operativo.
Las fuentes tipográficas en trazados están preservadas en
`assets/brand/typography.json`.

El Nginx de producción sirve `brand/generated/` con caché de un año porque sus
nombres cambian al cambiar el contenido/receta. Los alias SVG sin huella conservan
revalidación. La optimización no depende de `/_next/image`, una API o un CDN.

Referencias técnicas: [exportación estática de Next.js](https://nextjs.org/docs/app/guides/static-exports#image-optimization),
[redimensionado de Sharp](https://sharp.pixelplumbing.com/api-resize/) y
[codificación de formatos](https://sharp.pixelplumbing.com/api-output/) y
[selección de imágenes adaptables en HTML](https://html.spec.whatwg.org/multipage/images.html#sizes-attributes).

## Integración

- Conservar originales y datos de procedencia como fuentes del pipeline; los
  ensayos y deliberaciones se mantienen en el archivo temporal externo.
- Publicar sólo variantes seleccionadas y optimizadas, con dimensiones explícitas
  para evitar saltos de layout y carga diferida si están fuera de la primera vista.
- Componer tipografía como texto HTML o trazados de fuentes locales, conservando
  un nombre accesible. Usar `alt=""` cuando la ilustración sea puramente decorativa.
- Crear variantes compatibles con fondo claro y oscuro; no invertir una imagen
  arbitrariamente ni simular transparencia con un fondo de cuadros.
- Mantener el rojo/amarillo/verde y los mapas reales para información científica.
  Las decoraciones no representan límites, conexiones ni resultados medidos.
- Validar marca pequeña, recortes, móvil, contraste y procedencia antes de sustituir
  recursos. La generación no cambia por sí sola la identidad vigente.

## Footer editorial · 1.14.0

`SiteFooter` es el cierre común de las tres páginas. Reúne identidad, navegación,
fuentes y alcance, seguido de versión científica y acceso al contenido principal.
La versión se lee de `resultsRelease`, sin mantener otra copia manual.

Usa `footerTokens` para fondo de tinta en claro y superficie oscura en oscuro,
texto claro, acento lavanda y divisores. `TraceRule tone="inherit"` adapta la firma
a esa superficie. Desde 1.15.0 incluye el banner optimizado; no añade animaciones
ni bibliotecas en runtime.

En escritorio presenta tres columnas; en tablet, identidad arriba y dos columnas;
en móvil se apila. Enlaces con altura mínima de 44 px y foco lavanda visible.
No es fijo ni altera la altura inicial del mapa. Se conserva
`data-app-chrome="footer"`, usado por el modo mapa para ocultar el marco general.

El aviso de participación en el hackathon no implica aval institucional. El pie
no añade una licencia jurídica ni hace afirmaciones nuevas sobre eficacia de
la intervención. El significado científico se mantiene en metodología y datos.

Volver al [sistema de diseño](sistema-diseno.md) o al [frontend](../README.md).
