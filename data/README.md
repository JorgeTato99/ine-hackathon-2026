# Datos y cartografía

## Contenido

| Ruta | Uso | Git |
| --- | --- | --- |
| `reference/` | Tablas municipales, equivalencias, catálogo, exclusiones y procedencia de una captura revisada. | Sí |
| `samples/muestra-0.3/` | Tres entradas de integración con historia real y 2027 ilustrativo. | Sí |
| `raw/` | Seis ZIP, CSV y diccionarios originales del INE, sin modificar. | No |
| `geo/` | Respuestas geográficas originales del INEGI y manifiesto. | No |
| `processed/mapa/resultados-1.0/` | Resultados para el mapa: semáforo 2027, escenarios y metadatos (notebook 05). | Sí |
| `processed/` (resto) | Parquet tipados, tablas agregadas y GeoJSON nacional. | No |

Los archivos grandes se generan localmente. Las fuentes y URLs están declaradas en
`config/sources.json`; los diccionarios de origen se conservan en `docs/diccionarios/`.
La muestra no contiene predicciones finales ni decisiones científicas para 2027.

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

La captura geográfica del servicio oficial es del 16 de octubre de 2026; el servicio
no declara un corte histórico. Contiene 2,478 geometrías. En la elección 2024 hay
2,477 correspondencias resueltas, cero pendientes, 2,465 municipios utilizables y 12
con denominador cero. Hay 13 geometrías sin observación utilizable en ese año.

Esta correspondencia operativa de identidad no acredita estabilidad de límites ni
comparabilidad histórica. Un municipio ausente no recibe automáticamente valor cero.
Una nueva descarga se coteja contra `reference/procedencia.json`; el nombre de la
carpeta no garantiza que los bytes o el universo sean idénticos.

El [contrato de integración](../docs/contrato-datos.md) define el significado de las
entradas científicas y las reglas que debe respetar la aplicación.
