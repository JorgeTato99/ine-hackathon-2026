# Seguridad

## Alcance

La plantilla configura análisis de código y auditoría de dependencias. Las aplicaciones derivadas deben definir sus propias políticas de soporte, contactos y tiempos de respuesta.

## Comunicar un problema

Utiliza el canal privado de seguridad del repositorio si está habilitado o solicita al mantenedor un canal privado. No publiques credenciales ni datos sensibles en issues.

Antes de publicar un proyecto derivado, documenta un contacto operativo y la versión a la que aplica su política.

## Comprobaciones

```console
uv run --locked bandit -c pyproject.toml -r src scripts
uv run --locked pip-audit --skip-editable
```

Bandit falla cuando detecta hallazgos según su configuración. El verificador propaga ese código de salida.

pip-audit examina las distribuciones del entorno seleccionado y consulta servicios externos. `--skip-editable` omite el paquete local sin publicación; sus dependencias permanecen incluidas. Instala los extras relevantes antes de auditar una aplicación derivada.

No se presupone que pip-audit interprete directamente `uv.lock`. El lock determina el entorno que se audita; se debe registrar su selección de extras/grupos.

Los resultados de estas herramientas representan un control parcial, que debe complementarse con revisión de código y pruebas del comportamiento de cada aplicación.

El builtin `detect-private-key` de prek detecta ciertos encabezados de claves privadas; no es un detector general de tokens o contraseñas. Un proyecto puede añadir un escáner como [Gitleaks](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1) según su alcance. Esta plantilla no declara una auditoría completa de secretos.
