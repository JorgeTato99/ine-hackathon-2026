# Desarrollo y comprobaciones

## Entorno

```console
uv sync --locked
uv run --locked python scripts/check_environment.py
uv run --locked jupyter lab
```

Python está fijado en `.python-version`; el manifiesto admite `>=3.14,<3.15`.
Se requiere uv `>=0.13.1,<0.14`. Si el uv instalado es anterior, se puede anteponer
`uv tool run --from uv==0.13.1` a las órdenes de uv.

Las dependencias base son Polars, Arrow, NumPy, SciPy, scikit-learn, statsmodels,
GeoPandas, Shapely, Pyogrio, Pandera, Matplotlib y libpysal/esda. Desarrollo y notebooks
son grupos predeterminados. No se seleccionan API ni boosting externo. DuckDB es
opcional mediante `--group verify`.

Los comandos se ejecutan desde la raíz. Las rutas de datos se resuelven con pathlib,
sin unidades o rutas absolutas específicas de Windows.

## Calidad

```console
uv run --locked python scripts/check.py
```

El verificador comprueba lock, mypy, Ruff, formato, Bandit, pruebas con cobertura,
construcción y distribución aislada. Propaga el primer fallo. La CI ejecuta la base
en Windows y Ubuntu con fixtures pequeños; no descarga todas las elecciones.

```console
uv run --locked mypy
uv run --locked ruff check src scripts tests
uv run --locked ruff format --check src scripts tests
uv run --locked python -m pytest
uv build
uv run --locked python scripts/verify_distribution.py
```

Mypy estricto y la cobertura de líneas/ramas se aplican a `src/`, con umbral inicial
de 90 %. Los notebooks de exploración están fuera de esos controles estrictos.
La auditoría de dependencias puede ejecutarse con `uv run --locked pip-audit --skip-editable`.

## Frontend

El frontend tiene instalación y comprobaciones independientes:

```console
npm --prefix frontend ci
npm --prefix frontend run dev
npm --prefix frontend run check
```

Requiere Node 24 y npm 11; Python no interviene en su ejecución. Consultar la
[guía frontend](../frontend/README.md) y su [testing](../frontend/test/README.md).
La [guía de perfiles y recursos](../frontend/test/execution-profiles.md) reúne
los comandos, las mediciones, los ajustes y el procedimiento de recalibración.
El lock del frontend está versionado. Su perfil predeterminado es `eficiente`:
dos workers de Vitest y un navegador; la batería completa coordina ambos en
paralelo después del build. Existen también perfiles `ligero` y `rapido`, medidos
en la batería actual. El presupuesto de compilación es independiente. Para un
cierre completo, con Chromium instalado, usar `npm --prefix frontend run validate`.
Las CI de Python y frontend son independientes. Los hooks Node sólo se activan si
cambian archivos de `frontend/`; npm no sustituye los hooks de Git de la raíz.

## Convenciones y contribución

Identificadores en inglés; comentarios y documentación en español. Las pruebas cubren
comportamientos y límites reales. El formato se aplica explícitamente con
`uv run --locked ruff format src scripts tests`. Los hooks son opcionales mediante
el grupo `hooks`; Make ofrece atajos con `make help`.

Versionar código, configuración, pruebas, documentación vigente y referencias pequeñas.
Conservar investigación, comunicaciones, benchmarks exploratorios y PDFs internos en
`temp/`. `artifacts/`, `output/`, entornos y datos grandes son locales. No incluir
credenciales, cartas firmadas ni datos personales.

Consultar [CONTRIBUTING](../CONTRIBUTING.md), [SECURITY](../SECURITY.md) y
[CHANGELOG](../CHANGELOG.md). Las actualizaciones de dependencias modifican manifiesto
y lock de forma explícita y se verifican antes de publicar.
