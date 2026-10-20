# Datos y cartografía

## Contenido

| Ruta                                | Uso                                                                                                                           | Git |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --- |
| `reference/`                        | Tablas municipales, equivalencias, catálogo, exclusiones y procedencia de una captura revisada.                               | Sí  |
| `samples/muestra-0.3/`              | Muestra estructural con incidencia histórica documentada y 2027 ilustrativo.                                                  | Sí  |
| `raw/`                              | Seis ZIP, CSV y diccionarios originales del INE, sin modificar.                                                               | No  |
| `geo/`                              | Respuestas geográficas originales del INEGI y manifiesto.                                                                     | No  |
| `processed/mapa/resultados-1.1/`    | Tres originales agregados para el mapa: semáforo, escenarios y metadatos (notebook 05). Ver [vistas](../docs/vistas-mapa.md). | Sí  |
| `processed/entrega/base-datos-1.1/` | Historia municipal, resultados 2027, diccionario, LEEME y XLSX; generados por `scripts/entrega_base_datos.py`.                | Sí  |
| `processed/` (resto)                | Parquet tipados, tablas agregadas y GeoJSON nacional.                                                                         | No  |

Los archivos grandes se generan localmente. Las fuentes y URLs están declaradas en
`config/sources.json`; los diccionarios de origen se conservan en `docs/diccionarios/`.
La muestra no contiene predicciones finales ni decisiones científicas para 2027.
En la muestra recibida, los valores de 2021 de Paracho (`16065`) y Parácuaro
(`16064`) están intercambiados. Sus archivos originales se conservan para
trazabilidad; esos valores no son referencias válidas para tests
de la muestra. La entrega vigente `resultados-1.1` ya incorpora la historia regenerada
y no arrastra esa omisión provisional. Sus originales se conservan íntegros y la
[preparación del frontend](../frontend/docs/resultados.md) los transforma sin reentrenar.

## Reproducir

Desde la raíz, en Windows, Linux o macOS con el entorno preparado:

```console
uv sync --locked
uv run --locked python -m scripts.prepare_data
```

Operaciones individuales:

```console
uv run --locked python -m scripts.download_data --years 2009
uv run --locked python -m scripts.download_geometry
uv run --locked python -m scripts.prepare_catalogs
uv run --locked python -m scripts.build_crosswalk
uv run --locked python -m scripts.validate_outputs
uv run --locked python -m scripts.export_reference
```

La descarga verifica SHA-256, CRC y miembros extraídos. La preparación utiliza
descubrimiento de `*.csv`, comillas dobles y Polars; no omite errores de lectura.
Se conservan los originales y se genera Parquet por elección.

## Tipos y controles

Edad se conserva como Int16 y sexo como Int8. Sexo utiliza 0/1 hasta 2021 y 0/1/2 en
2024, donde 2 significa no binario. Se comprueba el rango técnico observado de edad
18-140 sin atribuir plausibilidad biológica. DEF/DEL son Int16 con nulos para vacíos.

Se validan año, claves, nombres, conteos no negativos y `LN = SV + NV + NS`. El filtro
`SV + NV > 0` se aplica después de agregar por municipio-año, conservando exclusiones.
La tabla utilizable de referencia contiene 14,706 filas; la completa, 14,779. Pandera
valida una tabla municipal materializada. Las claves se leen como texto.

## Correspondencia territorial

Usar año + clave INE en `equivalencias_ine_inegi.csv` para recuperar `cvegeo`, y unir
con `CVEGEO` de `municipios_inegi.geojson`. No concatenar directamente claves INE
suponiendo que coinciden con INEGI. Se comprueban nombre y entidad, unicidad del destino
y excepciones documentadas en `config/municipality_overrides.csv`.

Las correcciones limitadas a una elección están en
[`municipality_overrides_by_year.csv`](../config/municipality_overrides_by_year.csv)
y tienen precedencia sobre el cruce ordinario. En 2021, INE `16065` se asocia a
`16064` (Parácuaro) e INE `16066` a `16065` (Paracho). Los CSV originales de Michoacán
confirman que ambas claves conservan sus mismas 16 secciones en las seis elecciones;
solo en 2021 aparecen intercambiados sus nombres. Se mantienen los nombres de origen
y las sumas originales; la corrección cambia el destino municipal de esas dos filas.

La captura geográfica del servicio oficial es del 16 de octubre de 2026; el servicio
no declara un corte histórico. Contiene 2,478 geometrías. En la elección 2024 hay
2,477 correspondencias resueltas, cero pendientes, 2,465 municipios utilizables y 12
con denominador cero. Hay 13 geometrías sin observación utilizable en ese año.

Esta correspondencia operativa de identidad no acredita estabilidad de límites ni
comparabilidad histórica. Un municipio ausente no recibe automáticamente valor cero.
Una nueva descarga se coteja contra `reference/procedencia.json`; el nombre de la
carpeta no garantiza que los bytes o el universo sean idénticos.

### Continuidad por secciones

`validate_outputs` agrega LN por elección, entidad, municipio INE y sección, y usa
la equivalencia de cada año. Compara entidad + sección con su pertenencia en 2024,
sin reasignar retrospectivamente los datos. `continuidad_secciones.csv` y su resumen
JSON se generan en `processed/` y se incluyen en `reference/` y su manifiesto.
La procedencia también registra las huellas de las reglas de equivalencia y
excepciones aplicadas, para identificar la configuración de esta preparación.

El denominador de la fracción en otro municipio es la LN de secciones encontradas
también en la referencia. Se informan además LN total, cobertura y secciones no
comparables. Sin LN comparable se declara ausencia de cobertura, no continuidad
confirmada. Una pertenencia múltiple de sección en el mismo año o una equivalencia
ausente produce un error.

Más del 50 % en otro CVEGEO se conserva como alerta; más del 90 % sin justificación
documentada bloquea la validación. Las transferencias justificadas se declaran por
año, referencia y par emisor/receptor en
[`section_continuity_exceptions.csv`](../config/section_continuity_exceptions.csv),
con motivo y fuente. No son dispensas para todo un municipio ni alteran el indicador
bruto. Actualmente no hay excepciones activas: las alertas de Tecpatán en 2009 y
2015 quedan por debajo del umbral bloqueante y visibles para revisión territorial.

El diagnóstico no prueba que la geometría de una sección permanezca constante,
ni que toda discrepancia sea un error. La eventual reconstrucción sobre geografía
de 2024 corresponde a la definición científica de Sofía. La entrega de resultados
1.1 ya incluye esa reconstrucción; la correspondencia y el diagnóstico originales
siguen siendo controles separados, no una reconstrucción automática del frontend.

El [contrato de integración](../docs/contrato-datos.md) define el significado de las
entradas científicas y las reglas que debe respetar la aplicación.
