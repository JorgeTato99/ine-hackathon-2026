# Integración de resultados científicos

[Frontend](../README.md) · [Contrato](../../docs/contrato-datos.md) ·
[Vistas y controles de Sofía](../../docs/vistas-mapa.md)

Entrega `resultados-1.1`, PR #3, commit
`3f58a1d21a2c804a8711d5dbdfc55f7ee6d04c7b`. Se consume el ensamble Huber + random
forest declarado en metadatos. No se entrena ni recalcula el modelo en la web.

## Preparar una publicación

Con el entorno Python de datos y la geometría ligera ya preparada:

```console
uv run python -m scripts.prepare_results --input data/processed/mapa/resultados-1.1 --commit 3f58a1d21a2c804a8711d5dbdfc55f7ee6d04c7b
cd frontend
npm exec prettier -- --write src/content/release.json
```

El comando valida cobertura, claves, proporciones, intervalos y cifras de control.
Genera JSON interno v2, manifiesto SHA-256, versión de la UI y descargas SIG. Una
nueva entrega debe indicar su propio commit. Los CSV originales no se modifican.

- 2,477 registros, 2,478 geometrías, seis escenarios. Villa de Pozos (24059) se
  mantiene sin resultados y en gris.
- Los 15 `NaN` literales de `brecha_jovenes_2024` pasan a null solo en la exportación
  web/SIG. No se sustituyen por cero. La conversión se registra en controles.
- `historyStatus` distingue cero por falta de casillas; conserva el valor original
  y deja un hueco en la gráfica, con la explicación textual.
- No se arrastra la omisión provisional de Paracho/Parácuaro de la muestra antigua.

## Presentación

El pronóstico pinta con `riesgo` del escenario activo. El filtro de color usa
`municipios.semaforo`, la cohorte sin intervención. Las tarjetas distinguen rojos
de referencia, rojos con intervención y salidas; las personas llevan año 2024.
Cada pareja conserva nivel nacional y dice «Supuesto, no efecto medido».

La ficha presenta intervalo nominal del 90 %, posición y probabilidad de rojo
**sin intervención**. Probabilidad ≥ 0.8 se lee probable, nunca seguro. Incluye
calendario y S1/S2/S3; el último supuesto también modifica la lista nominal.

Indicadores y contexto ofrece siete vistas independientes del semáforo. Cada una
define leyenda, unidades, tarjetas y valor de tabla. Seguridad y falta de casillas
no se añaden al riesgo. Las escalas nacionales de color no cambian al filtrar.
Filtros y selección se comparten entre pestañas y se conservan en la URL.
El modo mapa utiliza el mismo Canvas; su panel «Vistas» cambia la presentación.
En escritorio las cifras quedan arriba del lateral, en una cuadrícula compacta;
en móvil acompañan al mapa por debajo. Así la entrada conserva el territorio
visible sin añadir otra franja superior. En modo mapa están en el panel de vistas.

Las tarjetas suman solo registros disponibles. Una vista puede mostrar 53 valores
ausentes y 54 geometrías grises: Villa de Pozos es la geometría adicional sin fila.

## Salidas y comprobación

`/data/resultados-1.1/` contiene los tres originales, `controles.json` y GeoJSON/GPKG
con indicadores y los seis escenarios. Los campos SIG usan el identificador de
escenario con guiones bajos y un sufijo, por ejemplo
`nac_medio_int_ninguna_part_pred`. GPKG: capa `resultados_2027`, EPSG:4326,
`cvegeo` textual. La geometría ligera del renderizador se conserva aparte.

El CSV exporta toda la consulta filtrada, con escenario, intervalo, versión e
indicadores; la ficha JSON conserva procedencia. No se limita a la página de tabla.

`test/unit/results.test.ts` acredita controles numéricos y semántica; los casos
de `playwright-tests/3-results` recorren pestañas, filtros, Canvas y ausencias.
Estas pruebas no certifican validez científica ni eficacia de campañas.

El recorrido de las siete vistas conserva trazas DOM, red y fuentes, pero desactiva
la captura continua de pantallas del Canvas en la traza: su recopilación causaba
un bloqueo al cerrar el contexto de prueba. Las capturas explícitas y de fallos
siguen activas; no se elimina ninguna comprobación funcional.
