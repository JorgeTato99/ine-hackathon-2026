# Paquete del mapa y su base de datos

[Proyecto](../README.md) · [Contrato](contrato-datos.md) ·
[Publicación web](../frontend/docs/resultados.md).

Este paquete es el componente del mapa para incorporar a la entrega del equipo.
Contiene una copia portable, la URL de consulta y la base original. No sustituye
el ZIP final del concurso: faltan el reporte metodológico/preventivo, la
presentación y las cartas firmadas, que se coordinan por separado.

## Preparación

Se utiliza la entrega científica `resultados-1.6`, commit
`7ff4ca3cfbdc0b4f90d1df44be4b4acf00e61fd7`, y
`data/processed/entrega/base-datos-1.6/`. La base incluye CSV y XLSX proporcionados
por el análisis. No se recalculan modelos ni se reescribe ese libro para empaquetar.

Primero preparar los recursos web con el entorno de datos y la geometría ligera
existente. Después crear el ZIP:

```console
uv run python -m scripts.prepare_results
uv run python -m scripts.package_map_delivery
```

Resultado:
`output/entrega/TrazaCivica_Reto2_Mapa_resultados-1.6.zip`.
`output/` no se sube a Git. Los comandos aceptan `--help`; el paquete permite
`--output` para otra carpeta y `--url` para una dirección HTTP/HTTPS sin credenciales.

Al cambiar la versión científica, actualizar y comprobar las fuentes, la base,
las reglas de lectura y los controles antes de generar otro paquete. No basta
renombrar el ZIP ni mezclar una base nueva con un mapa anterior.

## Contenido

| Recurso                | Uso                                                                 |
| ---------------------- | ------------------------------------------------------------------- |
| `ENLACE.txt`           | Dirección del explorador interactivo.                               |
| `mapa/municipios.gpkg` | Capa `resultados_2027`, EPSG:4326, indicadores y cinco escenarios.   |
| `base-datos/`          | Cuatro CSV, diccionario incluido, XLSX y LEEME originales.          |
| `metadatos.json`       | Unidades, modelo, fuentes, supuestos y límites científicos.         |
| `controles.json`       | Cifras comprobadas al preparar la publicación.                      |
| `LEEME.md`             | Apertura, comparación sin/con intervención, advertencias y alcance. |
| `MANIFIESTO.json`      | Procedencia y huellas SHA-256 de los otros archivos del paquete.    |

GeoPackage permite consultar el mapa con un programa SIG compatible sin
depender de la web. El LEEME explica cómo duplicar la capa y categorizarla por
`nac_estimado_int_ninguna_riesgo` y `nac_estimado_int_combinada_riesgo`.
El nivel nacional base es único y estimado (51.4 %); las otras acciones son
retener primerizos, jóvenes de 20–29 y credencialización. Los campos de motivo
identifican la intervención parcial: los componentes desconocidos no se presentan
como completos y S3 sin dato tampoco agrega personas a la lista.
GeoJSON sigue disponible en el sitio como alternativa; no se duplica en el ZIP.

## Comprobaciones

El empaquetador comprueba la lectura SQLite del GPKG, su capa, coordenadas,
cobertura, claves textuales y versión. Contrasta originales municipales,
escenarios y metadatos con los publicados, además de las huellas web y CRC del
ZIP. Las claves y los vacíos se conservan. Sus pruebas también verifican que
dos empaquetados de los mismos archivos en el mismo runtime producen el mismo ZIP.
No se promete identidad binaria de GPKG regenerados con versiones distintas de GDAL.

Para una comprobación manual después de transferir, contrastar los archivos
descomprimidos con los SHA-256 de `MANIFIESTO.json`. El manifiesto no se incluye
a sí mismo en sus hashes. La publicación web mantiene su manifiesto independiente.

Las pruebas de [`test_map_delivery.py`](../tests/test_map_delivery.py) cubren
versiones mezcladas, claves incorrectas, valores no finitos, URL con credenciales,
fidelidad a los originales, integridad y repetibilidad del paquete. La
[validación del frontend](../frontend/test/README.md) comprueba lectura y descargas.

Este procedimiento no acredita la validez científica del modelo ni resuelve la
licencia de la obra o los requisitos jurídicos de cesión. Conservar los avisos
de las piezas preexistentes. El nombre del ZIP final debe coincidir con el nombre
registrado del equipo y el eje; Traza Cívica identifica aquí al producto.
