# Cartografía del explorador

Primera implementación: 19 de octubre de 2026. Decisión vigente: 20 de octubre de 2026.
[Volver al frontend](../README.md).

## Motor

**Leaflet 1.9.4 con renderer Canvas 2D y GeoJSON local.** No requiere claves,
proveedor de teselas, API de pago ni backend. La biblioteca tiene
[licencia BSD de dos cláusulas](https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE).
El alojamiento y la transferencia siguen consumiendo recursos propios.

La decisión compara OpenLayers, Leaflet y MapLibre con el mismo caso municipal.
La confirmación incluyó tres campañas adicionales, 336 ejecuciones de interacción
y una demo con nueve variantes. Leaflet ofreció el mejor equilibrio de inicio e
interacción para este alcance 2D. MapLibre con PMTiles destacó en selección,
escenarios y transferencia inicial; queda como alternativa si cambian el volumen,
las capas o las condiciones de red. Las mediciones son locales, con CPU residual
y móvil emulado; no garantizan una superioridad universal ni tiempos de Internet.

Los datos completos, protocolos y deliberaciones son material de trabajo conservado
fuera del repositorio en `temp/benchmarks-mapa-2026-10-19/`. Esta documentación
formal conserva la decisión y sus reglas operativas; no incorpora el historial de investigación.

## Integración y comportamiento

- `territorial-map.tsx` conecta React Query, tema, estado de consulta y errores.
  El componente se carga sólo en cliente y cuando se necesita el mapa.
- `leaflet-map.ts` gestiona polígonos, cámara, selección y liberación de recursos.
  Usa un Canvas compartido, sin capas base externas ni imágenes de marcadores.
- `pattern-canvas.ts` concentra las tramas: bajo sólido, medio con puntos,
  alto con diagonal y ausencia con diagonales cruzadas. El borde de selección
  combina halo blanco y contorno; la leyenda y la tabla complementan el color.
- `utils/municipal-geometry.ts` exige polígonos, claves CVEGEO únicas con cinco
  dígitos y cobertura exacta del corte. No sustituye la validación geoespacial.

Un clic selecciona tras 250 ms; un doble clic cancela la selección y amplía.
Arrastre, rueda, teclado y gesto táctil usan las interacciones de Leaflet.
Los controles propios y la atribución quedan sobre el Canvas en ambos temas.

La cámara se ajusta al seleccionar un municipio o cambiar efectivamente el
universo visible. Cambiar de escenario con el mismo universo conserva la cámara.
Una nueva selección usa `flyToBounds` durante **800 ms**, con el token
`motionTokens.duration.mapFlight`; combina desplazamiento y zoom con la curva
nativa de Leaflet. Funciona en la vista normal y en modo mapa y reserva el
espacio de los paneles. La ficha aparece durante el recorrido, sin bloquear acciones.
La carga inicial, las consultas compartidas y los cambios de filtros se encuadran
directamente. Con `prefers-reduced-motion: reduce` o sin soporte de transformaciones
3D, la selección también es inmediata.

Durante el vuelo se conserva el escalado nativo del Canvas, con el redibujado
habitual al finalizar. Se descartaron los refrescos intermedios de dos y ocho
puntos porque introdujeron pausas que empeoraron la UX. Se acepta el cambio
transitorio de grosor. La duración sigue siendo configurable; 0 desactiva el vuelo.

Arrastrar, usar rueda/teclado, pulsar zoom/MX o seleccionar otro municipio interrumpe
el vuelo pendiente. Activar movimiento reducido durante el recorrido completa el
encuadre inmediatamente. Al redimensionar durante el vuelo se recalcula el destino
con el espacio disponible; el recorrido puede reiniciarse. Un cambio de escenario
o tema no lo reinicia. `data-map-motion` indica `flying`/`idle`; `data-map-ready`
solo vuelve a `true` cuando la cámara termina y el Canvas se ha asentado.

El botón MX muestra el país y limpia la selección municipal de la URL y la ficha;
conserva filtros, escenario y modo de presentación. Al recargar no se recupera
el municipio anterior. Una consulta vacía conserva
la vista y comunica la ausencia de resultados. Al pasar a tabla o salir de la
página se liberan mapa, eventos, temporizador de clic, frames y ResizeObserver.

El [modo mapa](explorador.md) reutiliza el Canvas al ampliar la composición.
Redimensionar conserva centro/zoom. Al enfocar una nueva selección se reserva
espacio para paneles; abrir uno puede desplazar lo mínimo una selección oculta,
sin reiniciar su zoom. Los controles de zoom permanecen accesibles junto al panel.

La adaptación de tramas usa el hook interno `_fillStroke` de Leaflet 1.9.4;
`fillColor` conserva un color CSS válido. El relleno CanvasPattern se realiza
en el adaptador y Leaflet conserva trazos y detección geométrica. Es una dependencia
interna explícita: mantener la versión fijada y ejecutar las pruebas de píxeles,
selección y zoom antes de actualizarla. No es una API oficial de patrones.
Si Canvas o esa adaptación no están disponibles, la interfaz informa el fallo
y la tabla permanece accesible.

## Comprobación

La identidad y cobertura se verifican con unitarias. La integración imperativa
de navegador se comprueba en E2E real, no mediante Canvas simulado en jsdom:
selección sobre geometría real, teclado, cámara estable entre escenarios,
doble clic, vuelo municipal y su interrupción, movimiento reducido, tema,
descarga, desmontaje y colores/tramas de cuatro niveles en una
fixture gráfica controlada. Se ejecuta sobre la exportación de producción en
escritorio y móvil emulado. Ver [testing](../test/testing-strategy.md) y
[pruebas de navegador](../playwright-tests/README.md).

## Procedencia y transformación

Los metadatos de las 32 respuestas INEGI, capturadas el 16 de octubre, indican
Marco Geoestadístico de diciembre de 2025. No denominarlo geometría 2024 por el
nombre de una carpeta o por un ZIP incompleto.

Se reproyectó EPSG:6365 a EPSG:4326, se separaron componentes poligonales, se
simplificaron conjuntamente con Mapshaper al 8 % conservando formas y se
reagruparon por CVEGEO. Una guarda conserva el original si pierde partes,
resulta inválido o excede 5 % de variación de área.

Se conservan 2,478 municipios y 2,898 partes, con geometrías individualmente
válidas. Recurso aproximado: 8.53 MB sin comprimir y 2.73 MB gzip. Variación
relativa de área: percentil 95 de 0.505 % y máximo de 4.513 %, medidos en las
coordenadas geográficas de esta prueba, no como auditoría catastral. La cobertura
original presenta incidencias topológicas: no se certifica ausencia de huecos o
solapes nacionales. Es visualización, sin armonización histórica implícita.

## Recursos y reproducción

`public/data/manifest.json` conserva procedencia, transformaciones y huellas.
`municipios.geojson` alimenta el mapa con geometría ligera. Las descargas vigentes
en `public/data/resultados-1.2/` incluyen GeoJSON y GPKG enriquecidos con indicadores
y los seis escenarios. Los tres originales científicos se conservan íntegros.
Ver [integración y reproducción](resultados.md). La muestra antigua es un antecedente.

Desde la raíz, `scripts/prepare_frontend.py --export-geometry-input <ruta>`
exporta las partes reproyectadas. Simplificar conjuntamente con Mapshaper
`-simplify 8% keep-shapes -o precision=0.000001`; después ejecutar el script con
`--geometry <ruta>` para reagrupar, validar y generar recursos. Requiere los
datos y metadatos originales descargados y el entorno geoespacial. No ejecuta
fórmulas ni entrena modelos.

El adaptador legado reconoce por SHA-256 la muestra original con la incidencia 2021. La entrega real ya regenerada no arrastra la omisión de esos dos valores
de Paracho y Parácuaro. No se modifica el CSV científico recibido. Rige el
[contrato](../../docs/contrato-datos.md).

El mapa se carga en cliente, comparte selección/filtros con la tabla y no consulta
cartografía externa. Atribución y transformaciones acompañan los datos según los
[términos de INEGI](https://www.inegi.org.mx/inegi/terminos.html).
El sitio requiere HTTP; las descargas SIG son utilizables en herramientas externas.
