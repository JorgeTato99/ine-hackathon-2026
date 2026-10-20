# Changelog

Todas las modificaciones notables de **ine-hackathon-2026** se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y las versiones siguen [Semantic Versioning 2.0.0](https://semver.org/lang/es/).

## 📖 Guía de uso

### Documentar cambios

Registrar cambios terminados en `[Unreleased]`. Usar las categorías estándar y
crear únicamente las que tengan contenido:

| Categoría     | Uso                                                   |
| ------------- | ----------------------------------------------------- |
| ✨ Added      | Funcionalidades nuevas.                               |
| 🔄 Changed    | Cambios en comportamiento existente.                  |
| ⚠️ Deprecated | Funcionalidades disponibles cuya retirada se anuncia. |
| 🗑️ Removed    | Funcionalidades retiradas.                            |
| 🐛 Fixed      | Correcciones de comportamiento incorrecto.            |
| 🔒 Security   | Correcciones de vulnerabilidades identificadas.       |

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

| Etapa                      | Criterio de incremento                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desarrollo inicial `0.y.z` | Usar `0.Y.0` para funcionalidad significativa o incompatibilidades y `0.y.Z` para correcciones compatibles. Es una convención del proyecto; SemVer considera inestable esta etapa. |
| API estable `>=1.0.0`      | MAJOR para incompatibilidades, MINOR para funcionalidad compatible y deprecaciones, PATCH para correcciones compatibles.                                                           |

El primer registro de versión de un proyecto nuevo puede ser `0.1.0`.
El historial debe reflejar sus propias entregas, con fecha ISO 8601.

## [Unreleased]

## [0.2.0] - 2026-10-20 - Exploración territorial y resultados científicos

### 🎯 Resumen

**Tipo de release:** Feature. Integrar el análisis científico y Traza Cívica en
un mismo repositorio, con resultados precalculados, cartografía local y una
aplicación estática reproducible. La versión del software es independiente de
la entrega científica `resultados-1.1` y del sistema de diseño 1.6.0.

### Added

- Incorporar el frontend React con exportación estática, cartografía Leaflet Canvas,
  filtros, tabla con orden y paginación, ficha municipal y modo mapa ampliado.
- Definir el sistema de diseño con tokens, temas claro/oscuro, componentes
  reutilizables, índices de lectura y movimiento accesible.
- Incluir la base de entrega CSV/XLSX de Sofía con historia municipal,
  resultados, diccionario y guía de lectura, preservando su procedencia.
- Incorporar preparacion reproducible de seis elecciones con Polars y Parquet, conservando originales y equivalencias municipales.
- Incluir tablas agregadas, auditoria cartografica, notebook de inicio y decisiones de Sofia.
- Comprobar tipos, valores invalidos, distritos nulos, catalogo de sexo 2024, cobertura, distribucion y entorno sin API ni boosting externo.
- Agregar acercamiento animado al seleccionar un municipio en la vista normal y
  en modo mapa, respetando movimiento reducido y permitiendo interrumpir el recorrido.
- Integrar `resultados-1.1` del [PR #3](https://github.com/JorgeTato99/ine-hackathon-2026/pull/3)
  con dos pestañas: pronóstico de 2027 y siete vistas de indicadores y contexto.
  Compartir filtros, selección y Canvas; presentar cifras de control, unidades y
  leyendas propias para cada vista.
- Incorporar tres niveles nacionales y comparación sin/con intervención al mismo
  nivel, con intervalos del 90 %, probabilidad de rojo de referencia y desglose de
  supuestos en la ficha. Identificar siempre la intervención como supuesto, no
  efecto medido.
- Publicar CSV y metadatos científicos íntegros, exportaciones filtradas y capas
  GeoJSON/GPKG con indicadores y seis escenarios, acompañados de procedencia y SHA-256.

### Changed

- Separar el presupuesto del compilado de los perfiles de pruebas: usar por
  defecto dos workers unitarios y un navegador, con alternativas ligero y rápido.
- Actualizar la procedencia al corte científico `3f58a1d`: normalizar ceros
  negativos y conservar las cifras e intervalos del mapa sin cambios numéricos.
- Adoptar la plantilla con Python 3.14.8, datos como base y notebooks predeterminados.
- Aplicar mypy estricto y cobertura a src, conservando flexibilidad de exploracion en notebooks.
- Mantener DuckDB como contraste opcional y restringir las descargas a fuentes HTTPS configuradas.
- Reducir el acercamiento municipal de 1.5 a 0.8 segundos y centralizar su duración
  en los [tokens de movimiento](frontend/docs/movimiento.md).
- Restaurar el escalado nativo durante el acercamiento y retirar los redibujados
  intermedios: las pruebas con dos y ocho refrescos introdujeron pausas que
  empeoraron la experiencia de uso.
- Sustituir los valores ilustrativos de la muestra por resultados del modelo y
  actualizar metodología, descargas y sistema de diseño a la entrega vigente.
  Distinguir ceros por falta de casillas y la geometría sin datos de Villa de Pozos;
  conservar ausencias y normalizar 15 `NaN` de brecha joven solo en la salida web/SIG.

### Fixed

- Corregir la correspondencia de Paracho y Parácuaro en 2021 mediante reglas por
  elección y controles de continuidad por secciones, conservando los originales.
- Validar claves de la base de entrega con errores explícitos, también al ejecutar
  Python con optimizaciones, sin depender de aserciones eliminables.
- Limpiar la selección municipal y la ficha al pulsar MX, sincronizando mapa y
  URL para que una recarga no vuelva al municipio anterior. Conservar filtros,
  escenarios y modo de presentación.

### Security

- Actualizar la dependencia transitiva [certifi a 2026.10.19](https://pypi.org/project/certifi/2026.10.19/)
  para resolver el aviso `PYSEC-2026-4320` detectado en la auditoría del entorno Python.
