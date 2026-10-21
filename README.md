# Hackathon INE 2026 · Reto 2

Análisis territorial del riesgo de abstención y comparación de escenarios para
apoyar la planeación preventiva. El equipo trabaja con información agregada y
disociada: Sofía desarrolla el núcleo científico y Jorge el software y la cartografía.

La base utiliza **Python 3.14, Polars y Parquet**. La aplicación React consulta
resultados precalculados; el alcance actual no requiere API ni base de datos en
servidor. La preparación y el explorador territorial integran el corte científico
`resultados-1.3`: pronóstico 2027, escenarios sin/con intervención e indicadores
de contexto. Sofía conserva la definición del modelo y de las entregas posteriores.

La base de interfaz está en [frontend/](frontend/README.md), con Next estático, MUI,
React Query, pruebas y Docker propios. Se instala y ejecuta independientemente de Python.

La [vista pública de Traza Cívica](https://traza-civica.jorgetato.com/) permite
revisar las iteraciones del frontend. 2027 se presenta como pronóstico condicionado;
la intervención es un supuesto, no un efecto medido.

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

Los tres originales de la entrega vigente están en
`data/processed/mapa/resultados-1.3/`. Contienen 2,477 municipios y seis escenarios;
la geometría adicional de Villa de Pozos se conserva sin datos. Consultar el
[contrato](docs/contrato-datos.md) y la [preparación del frontend](frontend/docs/resultados.md).

La muestra `data/samples/muestra-0.3/` se conserva como antecedente y fixture: sus
valores de 2027 son ejemplos y los de 2021 de Paracho/Parácuaro están intercambiados.
La entrega científica vigente ya incorpora la historia regenerada.

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
- [Apartado de producto para el reporte](docs/producto-arquitectura.md).
- [Operación y cierre de entrega](docs/operacion.md).
- [Contrato de integración de datos](docs/contrato-datos.md).
- [Vistas del mapa y cifras de control](docs/vistas-mapa.md).
- [Desarrollo y comprobaciones](docs/desarrollo.md).
- [Frontend: instalación, pruebas y Docker](frontend/README.md).
- [Testing frontend: perfiles medidos y presupuesto del build](frontend/test/execution-profiles.md).
- [Fuentes, preparación y correspondencias](data/README.md).

## Estructura

```text
src/          Paquete Python y validación de datos
frontend/     Aplicación web y herramientas Node independientes
scripts/      Descarga, preparación, correspondencias y comprobaciones
notebooks/    Exploración y análisis
config/       Fuentes y correspondencias documentadas
data/         Referencias pequeñas, muestra y datos locales
docs/         Documentación vigente y diccionarios de origen
tests/        Pruebas del código y las tablas publicadas
```

El proyecto parte de [python-project-template](https://github.com/JorgeTato99/python-project-template).
Se conserva su aviso de licencia en [LICENSE](LICENSE).

El [paquete portable del mapa](docs/entrega-mapa.md) combina URL, GPKG y base CSV/XLSX
para incorporar al ZIP final del equipo. Se genera con un comando y conserva
procedencia, controles y huellas; no sustituye los demás entregables.
