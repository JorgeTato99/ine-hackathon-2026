# Explorador territorial · resultados-1.6

Actualizado el 2026-10-24. [Frontend](../README.md) · [Diseño](sistema-diseno.md) · [Contrato de datos](../../docs/contrato-datos.md).

## Experiencia vigente (D30)

`ForecastExplorer`, exportado como `Explorer`, presenta **Pronóstico 2027** e **Histórico**. El mapa es grande desde el inicio, con controles flotantes en escritorio y altura adaptada al viewport: ofrece mapa normal más alto y **Modo mapa ampliado**. Siguen fuera la distribución alternativa, consultas guardadas, filtros avanzados y comparación binaria. La tabla conserva ordenación, paginación y exportación. Los componentes de las vistas retiradas se conservan con copia verificada fuera del código activo, en `temp/migracion-resultados-1.5/componentes-retirados/`.

El recorrido es México → estado → municipio. Los selectores aceptan nombre o clave y el buscador permite encontrar directamente un municipio sin escoger estado. Los nombres repetidos se distinguen por CVEGEO. La ficha recupera la silueta real del municipio desde la geometría en caché, sin otra descarga. Se abre inmediatamente a la derecha; en móvil es una hoja inferior con cierre y gestión de foco de MUI. El botón MX elimina tanto municipio como estado de la URL.

Cuatro cifras permanecen visibles al desplazar la página: participación, rojos, personas en rojos y lista. El resumen está fuera del encabezado corto para que sticky acompañe todo el workspace. Al seleccionar municipio se sustituyen dos por color y distancia al país. Con intervención se añaden diferencias y votos adicionales supuestos. La lista base es la de 2024; credencialización y combinada amplían el denominador únicamente en los rojos base con S3 conocido.

## Leyenda y mapa

El semáforo usa rellenos planos: rojo `#C74A5A`, amarillo `#D9B44A`, verde `#65A58A` y gris sin datos en claro. En oscuro usa `#903545`, `#A18435`, `#39715D` y `#69717D` respectivamente; los datos y clases se conservan. Siempre hay etiquetas de texto en leyenda, ficha, tabla y tooltip. La leyenda se mantiene dentro del mapa; pulsarla atenúa las otras clases sin cambiar el ámbito de las cifras. El estado atenúa el resto del país sin borrar geometrías. La tabla y el CSV de selección sí siguen la clase resaltada. Los conteos de leyenda corresponden al país o estado, incluso al abrir una ficha.

Histórico usa seis años y cinco cortes constantes: <40, 40–50, 50–60, 60–70 y ≥70 %. Solo falta de casillas lleva rayado gris; las ausencias tienen gris claro. La ficha histórica abre primero el historial. La referencia histórica estatal se rotula explícitamente como ponderada con la lista de 2024: no se hace pasar por una tasa observada calculada con conteos de otro año. La línea municipal deja huecos en ausencias y falta de casillas; los valores también están disponibles como tabla HTML.

Leaflet Canvas conserva el vuelo nativo de 800 ms, sin redibujados intermedios. No cambia el motor cartográfico ni se añaden servicios de mapas externos.

## Predicciones e intervenciones

Identificadores `nac-estimado_int-ninguna`, `retener_primerizos`, `jovenes_20_29`, `credencializacion` y `combinada` (los últimos con el mismo prefijo). El nivel nacional estimado es 0.5141. Los rangos y los colores se consumen de los archivos; el front no entrena ni recalcula el modelo.

Las cinco barras aporte_* explican siempre la predicción base. Se rotulan como reparto del modelo, no causas. La tabla de intervención compara las cuatro acciones por municipio; no presupone que combinada sea la mejor. En 20060 jóvenes lo saca del rojo y combinada no. Con combinada salen 84; con al menos una opción, 85.

## URL y compatibilidad

Se conservan entidad, municipio, escenario, pestaña, año, leyenda, estado de tabla y `modo=mapa`. Los enlaces antiguos de dirigida_rojos pasan a combinada; los de sin intervención pasan a ninguna. Contexto/historia pasa a Histórico. Se eliminan parámetros de controles retirados. Los valores desconocidos reciben opciones seguras.

## Fuentes, preparación y entrega

Fuente técnica: PR #6 fusionado, commit científico `7ff4ca3cfbdc0b4f90d1df44be4b4acf00e61fd7`. La recepción de artefactos no sustituye la validez científica; Sofía cerró las decisiones D31–D33 y el software conserva su versión y límites.

Desde la raíz:

```console
uv run python scripts/prepare_results.py
uv run python -m scripts.compare_publications --before data/processed/mapa/resultados-1.3 --before-commit f25d9c2709d2a93179c7ee2d6d2df985d418d6ca --after data/processed/mapa/resultados-1.6 --after-commit 7ff4ca3cfbdc0b4f90d1df44be4b4acf00e61fd7 --output frontend/public/data/publicaciones/resultados-1.3__resultados-1.6.json
uv run python scripts/package_map_delivery.py --publish
```

Repetir el empaquetado después de preparar datos. El build comprueba los archivos publicados y sus huellas. El ZIP incorpora URL, GPKG, base CSV/XLSX, diccionario, metadatos, controles y manifiesto. No es la entrega completa del concurso. La preparación conserva CSV/JSON originales byte por byte.

## Verificación

Las pruebas de `forecast.test.ts`, integración de Explorer y E2E cubren cifras nacionales y estatales, denominador, barras, 20060, vacíos, navegación, enlaces anteriores, leyenda, histórico, descargas y reflow. Las pruebas del diseño anterior se archivaron en `temp/migracion-resultados-1.5/pruebas-anteriores/` al sustituir sus contratos de UI; no se ocultaron con skips. Se conserva la batería editorial adaptada a los nuevos capítulos y descargas. Evidencia y cierre en esa carpeta temporal.

## Modo ampliado y ayudas · diseño 1.18.1

Se entra con **Modo mapa** en la cabecera o **Ampliar mapa** dentro del mapa normal.
El workspace ocupa 100dvh y el ancho completo, conservando el mismo Canvas y caché.
`useMapMode` aísla el marco normal con inert, bloquea scroll, mueve el foco al mapa
y restaura foco y posición al salir. Escape sale del modo, salvo cuando debe cerrar
antes una ayuda o un desplegable. La selección, filtros, año e intervención se conservan.

Herramientas, cifras, leyenda y ficha tienen cabecera persistente y controles −/+.
**Despejar** reduce todos; **Restaurar** vuelve a abrirlos. Zoom y MX siempre quedan
visibles. En móvil se abre un cuerpo cada vez para evitar superposiciones. La ficha
admite Compacta, Normal (predeterminada) y Amplia en escritorio; mantiene esa anchura entre municipios
y entradas al modo. La cámara reserva el rectángulo libre más amplio entre los paneles.
Normal corresponde a la anterior Amplia (400–480 px); Compacta conserva los 360 px
y Amplia corresponde a la anterior Extendida (480–600 px).

En escritorio, **Resumen del territorio** queda arriba al centro y **Ficha municipal**
ocupa sola la columna derecha, desde el margen superior de 16 px hasta el inferior
de 34 px. Zoom, MX, Despejar, tema y Salir se agrupan abajo en el centro libre entre
paneles: una fila desde 1200 px y dos filas en ventanas menores. Ninguno ocupa ya
la esquina derecha. El resumen muestra cuatro columnas cuando su ancho llega a 600 px y dos
en espacios menores, con scroll propio si hace falta. Las anchuras laterales se
adaptan sin solaparse; en móvil se conserva el recorrido de un panel abierto cada vez.
La atribución INEGI queda debajo de los controles, alineada al mismo centro y a
4 px del borde inferior. Conserva letra de 11 px, con texto y márgenes compactos.
Al enfocar un municipio en este modo se amplía su encuadre un 14 % por lado: queda
algo más de contexto alrededor. No cambia el zoom del modo normal ni el vuelo de 800 ms.

Las cabeceras tienen fondo tenue; una línea morada identifica la ficha y un bloque
suave destaca la predicción. Se conservan la tipografía, los colores de riesgo y
las ayudas. Las cifras describen el color como comparación entre municipios, sin
rotular como mayor riesgo a un municipio verde.

El mapa normal tiene un mínimo de 560 px en escritorio y 460 px / 70dvh en móvil.
Se acepta desplazamiento inicial para darle más altura; no se reduce para meter toda
la página en el primer viewport. La ficha normal conserva scroll independiente.

Todos los KPI, incluido votos adicionales y los cuatro históricos, usan ContextHelp:
resumen al apuntar/enfocar y explicación completa al pulsar, tocar o usar Enter.
También se explican intervalo, probabilidad, factores e historial en la ficha. Los
textos están centralizados en reading-guide.ts y actualizados para la versión 1.6.

## Estados y comprobaciones de 1.6

El resumen informa cuántas intervenciones son parciales en el ámbito elegido.
La ficha identifica la acción seleccionada y cada fila de su tabla; los motivos
originales se conservan al descargar. El SIG incluye motivo y estado de cada
escenario, sin presentar un componente ausente como cero observado.

Oxchuc y San Mateo del Mar conservan componentes conocidos; credencialización sin
dato no aumenta su lista. Las altas efectivas del país son 330,309, no 332,396.
El ejemplo no monótono ahora es Mixistlán de la Reforma20060; los modelos y las
clases no se alteran para hacer que combinada parezca siempre superior.

El contexto plegado muestra H010 con el estado y periodo de comparación. Su ayuda
aclara diferencias de registro y el uso predictivo del homicidio transformado.
La paleta, fuentes, animación nativa de 800ms y los controles aprobados permanecen.

La ficha presenta diferencias en puntos con un decimal y probabilidades en
porcentaje entero. Los criterios de clasificación usan el valor original antes
de redondear; las descargas conservan sus cuatro decimales. Si una diferencia
no nula se redondea a cero, se identifica expresamente ese redondeo.
