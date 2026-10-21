# Producto y arquitectura de Traza Cívica

Traza Cívica presenta los resultados del análisis territorial de participación
electoral en una herramienta de consulta para apoyar la planeación preventiva.
El municipio es la unidad de exploración y 2027 el horizonte de los escenarios.
El producto permite localizar territorios, examinar sus antecedentes y consultar
el fundamento disponible antes de tomar decisiones sobre recursos. El análisis
científico define el modelo, el semáforo y las recomendaciones; la interfaz
conserva esas definiciones y facilita su lectura.

La consulta combina mapa, tabla y ficha municipal. La búsqueda y los filtros
mantienen el mismo universo en las dos representaciones; la tabla permite ordenar,
paginar y descargar los resultados filtrados. La ficha reúne historia electoral,
pronóstico e intervalo, indicadores y advertencias. La comparación sin y con
intervención conserva el mismo supuesto de participación nacional. Los escenarios
son resultados precalculados: la persona selecciona opciones documentadas y no
modifica libremente los parámetros científicos.

El pronóstico y los datos de contexto se presentan por separado. Siete vistas
permiten consultar calendario electoral, rezago persistente, agrupamientos
territoriales, grupos de población, antecedentes sin casilla, seguridad e historia.
Su presencia facilita examinar el territorio sin incorporar automáticamente cada
indicador al riesgo. Riesgo, calidad y prioridad de atención mantienen significados
distintos. La intervención se identifica como supuesto aritmético y su diferencia
no se presenta como eficacia comprobada de una campaña.

La arquitectura separa preparación científica y publicación. Python, Polars y
Parquet permiten procesar la información agregada y producir tablas por municipio;
los resultados acordados se entregan mediante CSV y metadatos. Una preparación
posterior verifica identidades, cobertura, unidades y controles y genera los
archivos de consulta y cartografía. El frontend utiliza React, Next.js con
exportación estática, Material UI y Leaflet con Canvas. Un contenedor Nginx sirve
los archivos; el navegador consulta los resultados publicados. La operación no
requiere ejecutar el modelo en cada interacción ni mantener una API de negocio
o una base de datos transaccional en servidor.

La identidad territorial utiliza CVEGEO como texto, conservando sus cinco dígitos
y ceros iniciales. La publicación científica 1.3 contiene 2,477 municipios con
resultados y seis escenarios; la cartografía conserva 2,478 geometrías, incluida
Villa de Pozos sin estimación. Vacío y cero se distinguen, y los ceros históricos
atribuidos a falta de casillas se explican expresamente. La cartografía procede
del INEGI y se simplifica para visualización, conservando su procedencia; no
sustituye los límites oficiales. La historia electoral y las demás variables
mantienen las fuentes y decisiones documentadas por el análisis.

La trazabilidad distingue versión del software, publicación científica y
preparación cartográfica. Los archivos incluyen metadatos y huellas de integridad.
Una comparación entre publicaciones muestra correcciones de celdas y cambios de
definiciones, sin interpretarlos como cambios electorales. Las consultas personales
guardan filtros y notas en el navegador, pueden transferirse por archivo y
advierten cuando se recuperan con otra publicación; no conservan una copia de
los resultados antiguos ni publican automáticamente las notas.

La lectura combina color con texto, leyendas y tabla. Se han comprobado controles
por teclado, contraste, adaptación a pantallas pequeñas y reducción de movimiento,
junto con pruebas automatizadas de software e integridad. Su alcance es técnico;
la comprensión y utilidad para personas usuarias requieren evaluación específica.
La distribución ofrece consulta web y formatos abiertos GeoJSON, GeoPackage y
CSV/XLSX. El paquete del mapa incorpora URL, GPKG, base y guía; su integración
con el reporte, presentación y documentos firmados completa la entrega del equipo.

Referencias técnicas: [arquitectura](arquitectura.md),
[contrato de datos](contrato-datos.md), [operación](operacion.md) y
[paquete del mapa](entrega-mapa.md).
