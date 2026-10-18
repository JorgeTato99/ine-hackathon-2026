# Changelog

Todas las modificaciones notables de **ine-hackathon-2026** se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y las versiones siguen [Semantic Versioning 2.0.0](https://semver.org/lang/es/).

## 📖 Guía de uso

### Documentar cambios

Registrar cambios terminados en `[Unreleased]`. Usar las categorías estándar y
crear únicamente las que tengan contenido:

| Categoría | Uso |
| --- | --- |
| ✨ Added | Funcionalidades nuevas. |
| 🔄 Changed | Cambios en comportamiento existente. |
| ⚠️ Deprecated | Funcionalidades disponibles cuya retirada se anuncia. |
| 🗑️ Removed | Funcionalidades retiradas. |
| 🐛 Fixed | Correcciones de comportamiento incorrecto. |
| 🔒 Security | Correcciones de vulnerabilidades identificadas. |

- Escribir para quien usa el proyecto: explicar qué cambia y su efecto.
- Empezar las entradas con verbos en infinitivo: agregar, corregir, retirar.
- Agrupar cambios relacionados y enlazar issues o documentación cuando aporten contexto.
- Marcar incompatibilidades con **⚠️ BREAKING** e indicar cómo migrar.
- Reservar Security para vulnerabilidades corregidas; una mejora preventiva corresponde a Changed.
- Documentar resultados reales; no presentar planes o controles configurados como comprobaciones ejecutadas.

### Publicar una versión

1. Mover el contenido de Unreleased a `## [X.Y.Z] - YYYY-MM-DD - Título breve`.
2. Añadir `### 🎯 Resumen` con el propósito de la versión y los límites de compatibilidad relevantes.
3. Mantener las categorías no vacías. Usar subapartados `####` si ayudan a agrupar cambios.
4. Sincronizar la versión del paquete, sus metadatos y el lock cuando corresponda.
5. Conservar Unreleased vacío para el siguiente ciclo, con versiones recientes primero.
6. Añadir enlaces a tags o comparaciones cuando existan; no inventar referencias.
7. Conservar el historial publicado; registrar las correcciones posteriores en una versión nueva.

| Etapa | Criterio de incremento |
| --- | --- |
| Desarrollo inicial `0.y.z` | Usar `0.Y.0` para funcionalidad significativa o incompatibilidades y `0.y.Z` para correcciones compatibles. Es una convención del proyecto; SemVer considera inestable esta etapa. |
| API estable `>=1.0.0` | MAJOR para incompatibilidades, MINOR para funcionalidad compatible y deprecaciones, PATCH para correcciones compatibles. |

El primer registro de versión de un proyecto nuevo puede ser `0.1.0`.
El historial debe reflejar sus propias entregas, con fecha ISO 8601.

## [Unreleased]

### Added

- Incorporar preparacion reproducible de seis elecciones con Polars y Parquet, conservando originales y equivalencias municipales.
- Incluir tablas agregadas, auditoria cartografica, notebook de inicio y decisiones de Sofia.
- Comprobar tipos, valores invalidos, distritos nulos, catalogo de sexo 2024, cobertura, distribucion y entorno sin API ni boosting externo.

### Changed

- Adoptar la plantilla con Python 3.14.8, datos como base y notebooks predeterminados.
- Aplicar mypy estricto y cobertura a src, conservando flexibilidad de exploracion en notebooks.
- Mantener DuckDB como contraste opcional y restringir las descargas a fuentes HTTPS configuradas.
