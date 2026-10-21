# Explorador territorial

Actualizado el 20 de octubre de 2026. [Frontend](../README.md) ·
[Diseño](sistema-diseno.md) · [Cartografía](cartografia.md).

## Composición y consulta

La entrada es una herramienta de consulta: título compacto, contexto indispensable,
búsqueda y filtros frecuentes. La guía de tres pasos está en «Cómo explorar».
El aviso de pronóstico condicionado permanece visible. Las páginas de metodología y descargas
conservan su composición editorial.

Buscar municipio o clave, Estado y Color sin intervención son los filtros principales. En móvil, entidad y
riesgo están en «Filtros»; en escritorio, «Más filtros» despliega los adicionales:

- Historia disponible: presencia en seis elecciones, parcial o sin registros.
  La entrega real utiliza su marca `historia_completa`; los ceros sin casilla se
  distinguen al leer la serie. Esta clasificación no acredita comparabilidad territorial
  ni calidad del modelo.
- Cartografía disponible: con o sin geometría, independiente del resultado.
- Lista nominal 2024: límites enteros, no negativos e inclusivos. Un límite activo
  excluye los valores sin ese dato; cero sigue siendo válido.
- Tamaño de lista nominal, ayuntamiento el mismo día en 2027, usos y costumbres
  y antecedente sin casilla. Se comparten entre las dos pestañas.

Los filtros se aplican al cambiar. El diálogo informa el total; «Ver resultados»
lo cierra. Los chips permiten quitar criterios y «Restablecer» limpia la consulta,
sin cambiar los escenarios. Los rangos inválidos producen una advertencia y un
universo vacío hasta corregirlos; no se intercambian extremos silenciosamente.

Los escenarios viven en el lateral de escritorio y en un panel accesible en móvil.
La comparación sin/con intervención conserva el mismo nivel nacional; no permite
atribuir a la intervención un cambio del supuesto nacional. La ficha y los controles
la identifican como «Supuesto, no efecto medido».

«Pronóstico 2027» usa el riesgo del escenario activo para el mapa y la cohorte
sin intervención para el filtro de semáforo. «Datos del territorio» ofrece siete
vistas con unidades, leyendas y cifras de control propias. La historia identifica
falta de casillas; Villa de Pozos conserva geometría gris y resultados ausentes.
Ver [reglas y reproducción de resultados](resultados.md).

## Tabla y exportación

La tabla comparte búsqueda, filtros y selección con el mapa. Permite ordenar por
municipio, CVEGEO, entidad, participación, riesgo o estado del registro. Se comparan
valores numéricos originales, no porcentajes formateados. Ausencias al final en
ambas direcciones; los empates se resuelven por CVEGEO como orden estable. Ordenar
por riesgo no representa una priorización institucional.

Tamaños: 10, 25, 50 y 100 filas; 25 por defecto. Los controles de primera/anterior/
siguiente/última página están arriba y el encabezado permanece visible al desplazar
el cuerpo. Cambiar filtros, escenario, orden o tamaño reinicia la página cuando
corresponde; una página fuera del universo se acota al intervalo válido.

El CSV incluye **toda la consulta filtrada, en el orden elegido**, no sólo la página.
Mantiene versión, procedencia, intervalos y advertencia del pronóstico y los
supuestos. CVEGEO conserva cinco dígitos. En contexto, la tabla ordena por el
indicador seleccionado y el CSV añade la vista y su valor.
La ordenación no cambia el orden canónico de IDs usado por el mapa ni lo reencuadra.

Las activaciones consecutivas de ordenación se calculan desde la URL vigente,
incluso si Next todavía no publica el cambio anterior en el render. La misma
normalización de columnas se aplica al mostrar y al alternar la tabla de contexto.

Los controles leen una instantánea de la URL con `useSyncExternalStore`. El
actualizador notifica después de `replaceState`, para que las teclas no se
pierdan mientras Next prepara su transición. `popstate` y la señal del router
conservan navegación externa. El servidor usa una consulta vacía consistente
con la exportación estática; al hidratar se lee la URL real. No se almacenan
borradores paralelos. El filtrado de búsqueda sigue usando `useDeferredValue`.

Leaflet carga su CSS desde el layout inicial, antes de los estilos propios; el
JavaScript del mapa sigue diferido. En el build se reprodujo que una hoja de
estilo tardía podía retener el commit de React y perder teclas aunque la URL ya
estuviera notificada. La carga inicial evita esa dependencia durante la edición.
Storybook importa el mismo CSS en su preview. `query-resources.spec.ts` comprueba
la hoja inicial y la escritura de cada prefijo con el código del mapa retenido.

## Modo mapa

«Modo mapa» ocupa el viewport mediante composición CSS, sin exigir la API nativa
de pantalla completa. Es la misma instancia de Leaflet y conserva consulta y
selección. Cambiar el tamaño mantiene centro y zoom; una selección nueva reserva
espacio para los paneles. Al abrir una ficha puede haber un desplazamiento mínimo
para no ocultarla, conservando el zoom.

Los controles flotantes permiten buscar, cambiar filtros y escenarios, exportar,
volver a tabla y alternar tema. La ficha es lateral en escritorio y una hoja inferior
en móvil; el horizontal corto usa lateral. Los paneles y la leyenda pueden plegarse.
No hay arrastre libre de ventanas. Una búsqueda con un único resultado ofrece abrir
su ficha directamente, también si no tiene geometría.

El fondo queda inerte mientras está activo el modo; se bloquea scroll del documento
y se mantiene scroll local en los paneles. No se abre el teclado móvil automáticamente.
Escape cierra primero el menú o panel activo; después permite salir. Se restaura
foco y desplazamiento al regresar, y si se entró desde tabla se recupera esa vista.
El botón «Tabla» dentro del modo vuelve directamente a los resultados.

La implementación del aislamiento usa [inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert).
Los paneles flotantes no son modales; los menús y diálogos de MUI conservan su
gestión de foco y Escape. La tabla sigue siendo la alternativa accesible al Canvas.

## Estado compartible y mantenimiento

| Parámetro                                        | Uso                                        |
| ------------------------------------------------ | ------------------------------------------ |
| `buscar`, `entidad`, `riesgo`                    | Consulta principal                         |
| `historia`, `cartografia`                        | Cobertura de registros y geometría         |
| `ln_min`, `ln_max`                               | Límites inclusivos de lista nominal 2024   |
| `municipio`                                      | Selección por CVEGEO                       |
| `escenario`, `segundo`, `comparar=1`             | Escenarios recibidos y lectura A/B         |
| `vista=tabla`                                    | Vista de resultados                        |
| `orden`, `direccion`                             | Columna y sentido de ordenación            |
| `filas`, `pagina`                                | Tamaño y página; página pública desde 1    |
| `modo=mapa`                                      | Composición ampliada                       |
| `pestana`, `indicador`                           | Pronóstico o vista de contexto             |
| `grupo`, `seguridad`, `anio`                     | Subvista de personas, seguridad o historia |
| `tamano`, `ayuntamiento`, `costumbres`, `alerta` | Filtros adicionales compartidos            |

Los valores categóricos o de paginación desconocidos usan valores seguros. La URL
es la fuente de la consulta; los paneles abiertos son estado de interfaz. No hay
backend ni cambios a los archivos científicos.

Lógica pura: `utils/explorer-filters.ts` y `utils/explorer-table.ts`. Composición:
`components/explorer/`. Aislamiento del modo: `hooks/use-map-mode.ts`. Renderer y
reservas de espacio: [cartografía](cartografia.md). Tokens de medidas en píxeles CSS:
`explorerLayout`; no pasarlos como factores numéricos de espaciado de MUI.

## Verificación

Las unitarias comprueban ceros, ausencias, rangos, orden numérico, empates y páginas.
Integración comprueba consultas, paneles, foco y recuperación de tabla. E2E comprueba
la exportación real, Canvas compartido, una descarga de geometría, selección, CSV
completo, teclado y accesibilidad automática en escritorio/móvil emulado.
Las pruebas no acreditan dispositivos físicos, el modelo ni eficacia de intervenciones.

Las etiquetas y ayudas siguen la [política de lenguaje](lenguaje-y-ayudas.md).
