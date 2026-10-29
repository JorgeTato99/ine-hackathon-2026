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

## [0.6.1] - 2026-10-28 - Enlaces seguros y lectura de la ficha

### 🎯 Resumen

Corregir las rutas sin diagonal final detrás del túnel HTTPS y simplificar la
lectura de probabilidades y diferencias. Mantener resultados-1.6 y sus archivos
científicos intactos.

### Fixed

- Conservar esquema y origen públicos al redirigir `/datos` y `/metodologia`;
  evitar que Nginx exponga HTTP y el puerto interno 8080. Comprobarlo en el
  contenedor real durante CI.
- Mostrar un decimal en las diferencias y probabilidades en entero, manteniendo
  los criterios con precisión original y explicando el redondeo.
- Aclarar que retener primerizos aplica a toda la generación de 18–20 de 2024, haya
  votado o no, en metodología y ayuda del control.
- Actualizar arquitectura y entrega del mapa a 1.6 y retirar los nombres de la
  nota del acuerdo de producto. Incorporar la corrección documental del PR #15.

### Security

- Actualizar Tornado 6.5.10 a 6.6 para resolver los tres avisos que bloqueaban
  la auditoría del entorno de notebooks, sin cambiar las librerías del modelo.

## [0.6.0] - 2026-10-24 - Pronóstico 1.6 y experiencia territorial

### 🎯 Resumen

Integrar resultados-1.6 con Delta con guardia, cinco intervenciones y estados
parciales explícitos. Completar P1 conservando el morado, la identidad gráfica,
las ayudas y el mapa ampliado aprobados. El navegador consume resultados
precalculados; los escenarios siguen siendo supuestos, no efectos medidos.

### Added

- Identificar intervención parcial por municipio y acción, con aviso visible en
  ficha, resumen territorial y descargas; conservar motivos en GeoJSON y GPKG.
- Mostrar la comparación estatal INEGI–SESNSP junto a homicidios y una ayuda que
  distingue ese contexto del predictor municipal transformado.

- Recuperar el modo mapa ampliado con cuatro paneles minimizables, anchuras de ficha,
  acción Despejar, acceso dentro del mapa y retorno de foco/scroll sin recargar la cartografía.
- Reincorporar ayudas de dos niveles en todos los KPI y conceptos de la ficha, y
  la silueta real municipal reutilizando geometría en caché.

- Incorporar resultados-1.6: una predicción nacional estimada, cinco tipos de
  intervención, explicación base con cinco grupos de variables e historial
  municipal frente al país, con intervalos de 2027.
- Ofrecer las pestañas Pronóstico e Histórico, búsqueda por estado/municipio,
  cifras por ámbito y una leyenda que resalta clases sin alterar los totales.
- Publicar el ZIP portable 1.6, la base Excel y el diccionario; verificar
  integridad de los archivos y coherencia de versión antes de compilar.

### Changed

- Usar el ancho intermedio como predeterminado de la ficha ampliada y renombrar
  las opciones a Compacta, Normal y Amplia, conservando las tres medidas.
- Centrar la atribución INEGI debajo de los controles inferiores del mapa ampliado;
  compactar el texto y los márgenes conservando el tamaño de letra.
- Agrupar zoom, MX, Despejar, tema y Salir abajo al centro en modo ampliado;
  liberar la esquina derecha para extender la ficha desde el margen superior al inferior.
- Dar toda la altura disponible a la ficha derecha del mapa ampliado y mover el
  resumen al centro superior, sin solapar los paneles al ajustar la anchura.
  Abrir ligeramente el encuadre municipal en ese modo y reforzar la jerarquía
  visual con cabeceras suaves y acentos morados discretos (diseño 1.18.0).
- Centrar el explorador en un mapa grande con controles flotantes de escritorio,
  ficha derecha con scroll propio y hoja inferior en móvil. Adaptar altura y
  leyenda a ventanas bajas; conservar tabla, ordenación, paginación y descargas.
- Calcular agregados con la lista ampliada cuando se supone credencialización.
  Mostrar diferencias frente a ninguna intervención y distinguir 84 salidas del
  rojo con combinada de las 85 que salen con alguna de las acciones.
- Actualizar Metodología, Datos y descargas y el contrato de integración;
  comparar los metadatos y la cobertura de las publicaciones 1.3 y 1.6.
- Recuperar el morado primario y conservar azul tinta como secundario; aumentar
  la altura normal y definir rellenos claros/oscuros con rojo sin naranja en diseño 1.17.0;
  conservar palabras, etiquetas y alternativas HTML. Reservar el rayado histórico
  exclusivamente para falta de casillas, distinta de baja participación.
- Integrar el símbolo, banner e ilustraciones aprobados en cabecera, favicon,
  footer, metodología y uso de archivos; servir variantes por tamaño y formato,
  con carga diferida y caché. Conservar las animaciones editoriales accesibles.
- Consolidar la identidad con Source Sans 3 y Newsreader locales y tokens centrales;
  rediseñar el footer con navegación, fuentes, alcance y versión de datos, y
  presentar las descargas como registros de archivo con tamaño y acción clara.

### Removed

- Retirar de la interfaz el selector de nivel nacional, las siete vistas de
  contexto, filtros avanzados, consultas guardadas, distribución y comparación binaria. Migrar enlaces antiguos al formato vigente;
  conservar patrones y componentes anteriores como antecedentes reutilizables.

### Fixed

- No sumar altas al denominador cuando falta el componente S3, sin convertir
  desconocidos en cero ni perder componentes conocidos de una intervención parcial.
- Mantener las cuatro cifras visibles al desplazar el mapa normal; evitar que
  el contenedor corto del encabezado anule su posición persistente.
- Actualizar controles, explicaciones, rangos y comparación de publicaciones a 1.6,
  incluida la distinción entre usos predictivo y descriptivo de homicidios.

- Evitar que el resumen de un municipio verde se describa como de mayor riesgo;
  aclarar que el color es una comparación entre municipios.
- Reservar el área libre al enfocar el mapa para que los controles y la leyenda
  no oculten el municipio ni intercepten su selección. Conservar el vuelo nativo
  de 800 ms, sin redibujados intermedios.

### Security

- Actualizar filelock4.2.0 a4.2.1 para resolver los avisos de seguridad del CI;
  conservar las demás dependencias científicas fijadas.

## [0.5.1] - 2026-10-21 - Nombre accesible del escenario activo

### 🎯 Resumen

**Tipo de release:** Corrección compatible. Incluir el resumen visible del
escenario en el nombre accesible de su botón de configuración. Datos 1.3 y
sistema de diseño 1.8.0 se conservan.

### Fixed

- Corregir la discordancia entre texto visible y nombre accesible del acceso a
  escenarios/temas, detectada por el CI completo; utilizar su contenido como nombre.
- Incluir WCAG 2.1 A en la comprobación nueva y medir colores sobre el Canvas
  nativo, evitando la mezcla de píxeles de una captura reducida. Conservar los
  criterios de mayoría de color y presencia de trama, y el DPR del dispositivo.

## [0.5.0] - 2026-10-21 - Exploración ampliada y preparación de entrega

### 🎯 Resumen

**Tipo de release:** Funcionalidad compatible. Dar más espacio al territorio e
integrar la consulta en el modo ampliado, conservando resultados científicos 1.3.
El sistema de diseño pasa a 1.8.0; el ZIP del mapa mantiene su identidad.

### Added

- Agregar acceso «Ampliar mapa» dentro del mapa normal, con retorno de foco al
  botón utilizado y conservación de consulta, selección e instancia cartográfica.
- Preparar un apartado editorial de producto/arquitectura, guía operativa y matriz
  de entrega que distinguen pruebas técnicas y decisiones pendientes del equipo.
- Preparar protocolo y hoja vacía para observar comprensión con personas no
  expertas, sin presentar revisiones técnicas como sesiones humanas realizadas.
- Documentar la condición de integración de actividades territoriales: fuente
  inspeccionable, ámbito, periodo y lectura de ausencias; mantener EXT-ACT inactiva.

### Changed

- Aumentar la altura normal del mapa mediante tokens adaptables; ganar 70 px en
  los tamaños de escritorio de referencia, con mínimos y máximos para móvil.
- Mantener Pronóstico y Datos del territorio accesibles en el modo mapa, con un
  acceso explícito a sus controles y resumen del escenario o tema activo.
- Reunir chips eliminables, total y acciones persistentes en filtros; distribuir
  barra, paneles y leyenda según el espacio disponible, con tarjetas compactas.

### Fixed

- Corregir el clic en el cuerpo de los chips y conservar un destino de foco al
  quitarlos, tanto en consulta normal como en filtros del modo mapa.
- Evitar fragmentos de leyenda detrás de los paneles, conservar su preferencia de
  apertura y mantener controles utilizables en móvil y horizontal.
- Identificar contexto sin rotularlo como pronóstico y conservar el aviso de
  muestra cuando corresponda; restaurar foco también si el puntero no lo movió.

## [0.4.0] - 2026-10-21 - Comparaciones de publicaciones verificables

### 🎯 Resumen

**Tipo de release:** Funcionalidad compatible. Consultar qué cambió entre los
originales 1.2 y 1.3 con procedencia verificable. El mapa usa resultados 1.3.

### Added

- Sección de comparación en Datos: resumen calculado, búsqueda por municipio,
  campo o escenario, tabla paginada y valores originales antes y después.
- Preparador independiente que verifica originales contra Git, compara por
  identidad territorial y conserva la diferencia entre vacío, cero y formato.
- Comparación completa de metadatos, unidades, cobertura por escenario y por
  campo, con avisos de tipos desconocidos o condiciones no comparables.
- Descarga de comparación con inventario de fuentes, generador y huella propia,
  preparada mediante escritura atómica en una carpeta auxiliar restringida.

### Changed

- Distinguir en la documentación del frontend las fuentes de versión de software,
  diseño y datos, retirando referencias desactualizadas del índice.
- Actualizar la explicación de ausencias en Datos e incorporar el nuevo capítulo
  al índice que sigue la lectura.

## [0.3.0] - 2026-10-21 - Consultas personales con procedencia

### 🎯 Resumen

**Tipo de release:** Funcionalidad compatible. Guardar y compartir consultas del
explorador sin cuentas ni servidor, conservando los resultados científicos 1.3.

### Added

- Gestor de consultas desde la vista normal y el modo mapa: guardar filtros,
  escenarios, selección y tabla con nombre, nota personal y fuente científica;
  recuperar, editar los textos y eliminar con confirmación.
- Exportación e importación de archivos JSON como copias, con vista previa,
  validación íntegra y límites de 50 consultas y 256 KiB.
- Resumen de territorio, vista y escenario en cada tarjeta, identificación de
  otra publicación y advertencia antes de usar datos actuales de una fuente distinta.
- Protección de borradores, corrupción y fallos de almacenamiento local, con
  respaldo y reinicio explícito que respeta cambios de otras pestañas.
- Documentación de alcance, recuperación, intercambio y límites del almacenamiento.

### Changed

- Recuperar una consulta reemplaza sus parámetros completos y abre la ficha en
  el modo correspondiente, sin mezclar filtros previos ni presentar el archivo
  como copia congelada de resultados antiguos.

## [0.2.5] - 2026-10-21 - Estilo del mapa listo antes de escribir

### 🎯 Resumen

**Tipo de release:** Corrección compatible. Evitar la pérdida de caracteres al
escribir durante la primera carga del mapa con recursos lentos. Conservar los
datos 1.3 y la carga diferida del JavaScript cartográfico.

### Fixed

- Cargar el CSS de Leaflet desde el layout inicial, con la misma entrada en
  Storybook, para que su descarga tardía no retenga la confirmación de los
  controles de consulta. Conservar los estilos propios con precedencia posterior.

## [0.2.4] - 2026-10-21 - Consulta estable al escribir y ordenar

### 🎯 Resumen

**Tipo de release:** Corrección compatible. Conservar cada tecla y cada
activación de ordenación mientras Next publica la consulta. Mantener los
resultados científicos 1.3, el renderer y las animaciones existentes.

### Fixed

- Calcular el sentido de ordenación desde la URL vigente y aplicar la misma
  normalización de columnas al mostrar y al activar la tabla de contexto.
- Sincronizar los controles con una instantánea de la URL después de escribir
  el historial, para evitar pérdida de caracteres en búsquedas y límites de
  lista electoral. Conservar navegación, consulta al recargar y filtrado diferido.

### Changed

- Actualizar las referencias de arquitectura y documentar la lectura de consulta
  y las pruebas de escritura, teclado, historial y activaciones consecutivas.

## [0.2.3] - 2026-10-20 - Conteos ausentes y entrega 1.3

### 🎯 Resumen

**Tipo de release:** Corrección compatible. Publicar resultados-1.3 y regenerar
el paquete portable con la base del mismo corte. Conservar escenarios, pronósticos
y diseño; distinguir conteos ausentes de ceros observados.

### Fixed

- Corregir la lectura de 105 celdas de siete campos en 15 municipios sin conteos
  por edad de 2024: mostrar «Sin dato» en los grupos de personas y componentes
  S1/S2, en lugar de cero. Mantener los pronósticos y el componente S3.
- Contar esas ausencias en las tarjetas y explicar que los totales suman solo
  datos disponibles, sin cambiar las sumas nacionales ni los seis escenarios.

### Changed

- Actualizar originales, procedencia, JSON y descargas SIG a resultados-1.3,
  [PR #5](https://github.com/JorgeTato99/ine-hackathon-2026/pull/5).
  Regenerar el ZIP con base-datos-1.3, guía y manifiesto de integridad.

## [0.2.2] - 2026-10-20 - Resultados 1.2 y paquete portable del mapa

### 🎯 Resumen

**Tipo de release:** Corrección compatible. Publicar la entrega científica
`resultados-1.2` sin cambiar pronósticos ni semáforo. Incorporar el componente
portable del mapa con la base original y conservar las correcciones de main.

### Changed

- Actualizar los originales, las descargas SIG, JSON y la procedencia del sitio
  a resultados-1.2; recibir las 15 ausencias de brecha joven como celdas vacías
  desde el origen y rechazar NaN nuevos en la preparación web.
- Integrar la base de entrega 1.2 de Sofía y mantener los validadores que siguen
  activos con Python optimizado, junto con las equivalencias de 2021 corregidas.

### Added

- Generar un ZIP portable con URL, GPKG, base CSV/XLSX, metadatos, guía y huellas
  SHA-256. Comprobar claves, versión, lectura SIG, integridad y repetibilidad,
  según la [guía de entrega del mapa](docs/entrega-mapa.md).

### Fixed

- Escribir los JSON derivados con saltos LF también en Windows para conservar
  el mismo formato de publicación y comprobar sus huellas sin cambios de fin de línea.
- Evitar que el foco durante una entrada animada desplace el destino entre pulsar
  y soltar, perdiendo enlaces como «Ver archivos». Conservar el foco inmediato
  por teclado y el destino del clic/toque, con limpieza de gestos cancelados.

## [0.2.1] - 2026-10-20 - Lenguaje claro y ayudas de lectura

### 🎯 Resumen

**Tipo de release:** Mejora compatible. Facilitar la lectura del explorador,
metodología y descargas sin formación estadística. Conservar resultados-1.1,
archivos científicos, parámetros URL y comportamiento del mapa. Formalizar el
lenguaje y las ayudas en el sistema de diseño 1.7.0.

### Added

- Agregar ayudas junto a conceptos de riesgo, lista electoral, escenarios e
  incertidumbre, con resumen al apuntar/enfocar y diálogo por clic, teclado o tacto.
  Conservar el contexto al cerrar y devolver el foco al control de origen.
- Documentar el patrón reutilizable, su catálogo en Storybook y un protocolo
  de comprensión con personas en [lenguaje y ayudas](frontend/docs/lenguaje-y-ayudas.md).

### Changed

- Explicar las siete vistas bajo «Datos del territorio» y «Tema del mapa», con
  etiquetas cotidianas, periodos y lectura visible de colores, conteos y ausencias.
- Aclarar en la ficha la diferencia entre escala de riesgo, posibilidad de rojo,
  rango estimado y puntos porcentuales; separar la brecha joven de 2024 de los
  supuestos de intervención que usan 2021.
- Orientar las descargas por su utilidad y explicar formatos, claves y celdas
  vacías. Presentar fallos de carga con acciones para recuperarse y conservar
  la tabla como alternativa al mapa.

### Fixed

- Corregir la etiqueta de muestra que persistía en las páginas informativas y
  hacer coincidir el nombre accesible del botón «Qué ver» con su texto visible.
- Evitar presentar un rango de estimación vacío para Villa de Pozos: mostrar su
  ausencia de datos sin confundirla con cero participación.

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
