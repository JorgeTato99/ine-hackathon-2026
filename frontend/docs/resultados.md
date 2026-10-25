# Integración y publicación de resultados

[Frontend](../README.md) · [Explorador vigente](explorador.md) · [Contrato](../../docs/contrato-datos.md) · [Descargas](https://traza-civica.jorgetato.com/datos/).

## Corte vigente

`resultados-1.6`, recibido del PR #6 en el commit
`7ff4ca3cfbdc0b4f90d1df44be4b4acf00e61fd7`. Integra 2,477 municipios con datos,
2,478 geometrías y cinco escenarios. Villa de Pozos conserva geometría sin
inventar resultados. Recibir y publicar los archivos no certifica por sí solo el
método científico. PR6 fue revisado y fusionado tras corregir el CI; las decisiones
D31–D33 son del equipo científico.

Los tres originales están en `data/processed/mapa/resultados-1.6/`. La base de
entrega CSV/XLSX y diccionario está en `data/processed/entrega/base-datos-1.6/`.
Los originales se copian byte por byte. CVEGEO es texto de cinco dígitos;
vacío es null y un nuevo valor no finito bloquea la preparación.

## Qué transforma el software

`scripts/prepare_results.py` valida claves, cobertura, proporciones, intervalos,
tipos y controles de recepción. Publica dataset JSON, originales, GeoJSON y GPKG
en `frontend/public/data/`, con procedencia, versión y SHA-256. Los cinco campos
aporte_* se conservan en puntos y se comprueba su suma frente a la predicción
base con tolerancia de 0.02 puntos. `nationalHistory` conserva la serie de
metadatos, sin recalcular el modelo.

Los escenarios son `nac-estimado_int-ninguna`, `retener_primerizos`,
`jovenes_20_29`, `credencializacion` y `combinada`, todos con el mismo prefijo.
La UI deja de ofrecer niveles nacionales seleccionables. 0.5141 es la
estimación nacional base; el rango entregado ya incorpora su incertidumbre.

## Cifras de control

| Intervención       | Rojos | Votos adicionales | Salen del rojo |
| ------------------ | ----: | ----------------: | -------------: |
| Ninguna            |   495 |                 0 |              0 |
| Retener primerizos |   476 |            84,789 |             19 |
| Jóvenes 20–29      |   427 |           307,818 |             68 |
| Credencialización  |   488 |           135,793 |              7 |
| Combinada          |   411 |           528,400 |             84 |

Lista base: 98,330,348. Personas en rojos sin intervención: 24,955,268.
Con alguna de las cuatro acciones salen 85, comparación distinta de combinada.
Las tasas con credencialización ponderan con la lista ampliada solo en los
municipios rojos base con S3 conocido; no se promedian porcentajes sin ponderar.
La lista ampliada es 98,660,657 (330,309 altas efectivas); los 20 casos que el modelo
respalda no se confunden con los 77 escenarios combinados de intervención parcial.

`motivo` es una lista de códigos separados por `|`. `intervencion_parcial` genera
el aviso solicitado en la ficha, identifica las filas de cada acción y se conserva
en CSV/JSON y en los campos por escenario del GPKG. Si S3 no tiene dato, ni sus
votos ni sus altas se suman; un cero observado válido se conserva como cero.

## Preparar, empaquetar y compilar

Los comandos completos y el orden están en [Explorador](explorador.md#fuentes-preparación-y-entrega).
Preparar los datos, generar la comparación 1.3 → 1.6 y después ejecutar
`uv run python scripts/package_map_delivery.py --publish`. El ZIP está en
`output/entrega/` y su copia pública en `resultados-1.6/mapa-escenarios.zip`.
Se vuelve a empaquetar siempre que se preparan los datos.

Desde `frontend/`, `npm run build` verifica integridad de datos e imágenes
antes de exportar. `scripts/verify-data-assets.mjs` bloquea mezcla de versiones,
archivos modificados, rutas fuera del directorio o huellas/tamaños distintos.
El despliegue publica únicamente el export estático con Nginx.

## Límites de lectura y verificación

El modelo no se entrena en el navegador. Las barras explican la base y no causas;
las intervenciones son supuestos, no efectos medidos. La falta de casillas se
distingue de abstención y los vacíos no se transforman en cero. El historial
estatal rotula su referencia ponderada con lista de 2024, sin presentarla como
una tasa observada obtenida de otro denominador.

Las pruebas verifican intercambio, cálculo de agregados, presentación y archivos.
Las auditorías GPT-01/GPT-02 se cerraron en temp; la recepción1.6 verifica las
correcciones y sus artefactos, sin reejecutar toda la investigación. El aviso H010
identifica qué fuente cuenta más homicidios en el estado durante 2019–2024. La
tasa municipal INEGI2022–2024 en logaritmo sí entra al modelo; las otras columnas
de seguridad son contexto. La comparación estatal no prueba una diferencia local.
