# Contribuir

El código usa identificadores en inglés y comentarios/documentación en español.

Para cambios en el frontend, consulta su [guía](frontend/README.md), la
[política de testing](frontend/test/README.md) y los
[perfiles de ejecución](frontend/test/execution-profiles.md). Sus comprobaciones
son independientes del entorno Python. La siguiente rutina corresponde a Python.

1. Instala el entorno con `uv sync --locked`.
2. Añade pruebas para cambios de comportamiento.
3. Ejecuta `uv run --locked python scripts/check.py`.
4. Registra los cambios notables en `CHANGELOG.md`, bajo `[Unreleased]`.
5. Incluye el motivo del cambio y sus verificaciones en el pull request.

Los comandos de verificación no aplican correcciones de formato. Utiliza `uv run --locked ruff format src scripts tests` para aplicarlas explícitamente.

Para actualizar dependencias:

```console
uv lock --upgrade
uv sync --locked
uv run --locked python scripts/check.py
```

Revisa el diff de `uv.lock`, las notas de las versiones y los perfiles afectados. Una actualización del lock puede incorporar nuevas versiones dentro de los rangos del manifiesto.

Hooks opcionales, dentro de un repositorio Git:

```console
uv sync --locked --group hooks
uv run --locked --group hooks prek install
uv run --locked --group hooks prek run --all-files
```

Los hooks locales usan el entorno y lock del proyecto. El bloque `repo: builtin` utiliza funciones propias de prek para TOML, YAML, conflictos y ciertos encabezados de claves privadas. Para usar el runner pre-commit, sustituye ese bloque por hooks equivalentes de su ecosistema; el formato extendido de prek no es intercambiable de forma completa.

No incluyas entornos, datasets, credenciales ni evidencia temporal. Consulta [seguridad](SECURITY.md).
