# Integración de resultados científicos

[Frontend](../README.md) · [Contrato](../../docs/contrato-datos.md) ·
[Vistas y controles de Sofía](../../docs/vistas-mapa.md)

Entrega `resultados-1.2`, continuación del PR #3, commit
`ac8dc3cdbb06b5a0d5ddd63b67bee9a43def9821`. Se consume el ensamble Huber + random
forest declarado en metadatos. No se entrena ni recalcula el modelo en la web.

## Preparar una publicación

Con el entorno Python de datos y la geometría ligera ya preparada:

```console
uv run python -m scripts.prepare_results --input data/processed/mapa/resultados-1.2 --commit ac8dc3cdbb06b5a0d5ddd63b67bee9a43def9821
cd frontend
npm exec prettier -- --write src/content/release.json
```

El comando valida cobertura, claves, proporciones, intervalos y cifras de control.
Genera JSON interno v2, manifiesto SHA-256, versión de la UI y descargas SIG. Una
nueva entrega debe indicar su propio commit. Los CSV originales no se modifican.

- 2,477 registros, 2,478 geometrías, seis escenarios. Villa de Pozos (24059) se
  mantiene sin resultados y en gris.
- Las 15 ausencias de `brecha_jovenes_2024` llegan vacías desde el origen en 1.2.
  La publicación usa null y registra cero normalizaciones de NaN. Un NaN nuevo
  se rechaza; el tratamiento especial de 1.1 se limita al antecedente.
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

Datos del territorio ofrece siete vistas independientes del semáforo. Cada una
define leyenda, unidades, tarjetas y valor de tabla. Seguridad y falta de casillas
no se añaden al riesgo. Las escalas nacionales de color no cambian al filtrar.
Filtros y selección se comparten entre pestañas y se conservan en la URL.
El modo mapa utiliza el mismo Canvas; su panel «Qué ver» cambia la presentación.
En escritorio las cifras quedan arriba del lateral, en una cuadrícula compacta;
en móvil acompañan al mapa por debajo. Así la entrada conserva el territorio
visible sin añadir otra franja superior. En modo mapa están en el panel de vistas.

Las tarjetas suman solo registros disponibles. Una vista puede mostrar 53 valores
ausentes y 54 geometrías grises: Villa de Pozos es la geometría adicional sin fila.

## Salidas y comprobación

`/data/resultados-1.2/` contiene los tres originales, `controles.json` y GeoJSON/GPKG
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

Las etiquetas y ayudas siguen la [política de lenguaje](lenguaje-y-ayudas.md).

La [guía de entrega del mapa](../../docs/entrega-mapa.md) define el paquete
portable con URL, GPKG y base de datos, generado desde la misma publicación.
