# Hackathon INE 2026 · Reto 2

Análisis territorial del riesgo de abstención y comparación de escenarios para
apoyar la planeación preventiva. El equipo trabaja con información agregada y
disociada: Sofía desarrolla el núcleo científico y Jorge el software y la cartografía.

La base utiliza **Python 3.14, Polars y Parquet**. La aplicación prevista es React
con resultados precalculados; el alcance actual no requiere API ni base de datos en
servidor. La preparación de datos está implementada; el frontend y el modelo final
siguen en desarrollo.

## Empezar

Requiere [uv](https://docs.astral.sh/uv/getting-started/installation/)
`>=0.13.1,<0.14`. La versión de desarrollo es Python **3.14.8**.

```console
git clone https://github.com/JorgeTato99/ine-hackathon-2026.git
cd ine-hackathon-2026
uv sync --locked
uv run --locked jupyter lab
```

El notebook `notebooks/00_inicio.ipynb` utiliza la tabla agregada incluida en
`data/reference/`: **14,706 registros municipio-año** de 2009 a 2024. No hace falta
descargar los originales para esa primera exploración. Conservar las claves como
texto para mantener sus ceros iniciales.

La muestra de integración está en `data/samples/muestra-0.3/`. Su historia electoral
es real, pero **todos los valores, escenarios y clasificaciones de 2027 son ejemplos**,
no resultados del modelo.

## Preparar datos y comprobar el proyecto

```console
uv run --locked python -m scripts.prepare_data
uv run --locked python scripts/check.py
```

El primer comando descarga/verifica los seis ZIP, prepara Parquet con Polars,
construye las correspondencias INE-INEGI y valida las salidas. Los datos grandes
permanecen fuera de Git. Las rutas son relativas al proyecto y funcionan en distintos
sistemas operativos. La geometría puede descargarse por separado con
`uv run --locked python -m scripts.download_geometry`.

## Documentación

- [Requisitos del reto](docs/requisitos.md).
- [Arquitectura y alcance del producto](docs/arquitectura.md).
- [Contrato de integración de datos](docs/contrato-datos.md).
- [Desarrollo y comprobaciones](docs/desarrollo.md).
- [Fuentes, preparación y correspondencias](data/README.md).

## Estructura

```text
src/          Paquete Python y validación de datos
scripts/      Descarga, preparación, correspondencias y comprobaciones
notebooks/    Exploración y análisis
config/       Fuentes y correspondencias documentadas
data/         Referencias pequeñas, muestra y datos locales
docs/         Documentación vigente y diccionarios de origen
tests/        Pruebas del código y las tablas publicadas
```

El proyecto parte de [python-project-template](https://github.com/JorgeTato99/python-project-template).
Se conserva su aviso de licencia en [LICENSE](LICENSE).
