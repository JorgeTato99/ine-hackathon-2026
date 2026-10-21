# Sistema de diseño de Traza Cívica

Primera implementación: 19 de octubre de 2026.
[Volver al frontend](../README.md).

El sistema visual formal está en la versión **1.8.0**. El
[catálogo de tokens y componentes](tokens-y-componentes.md) define escalas, variantes,
contratos y su versionado, separado de la versión de resultados científicos.
La política de [movimiento](movimiento.md) define animaciones, costos y accesibilidad.

**Traza Cívica · Participación y territorio** es la identidad de trabajo del
producto. No implica identidad oficial del INE ni registro de marca.

## Fundamentos

MUI es la única biblioteca de componentes. Los patrones analíticos adoptan la
claridad de Carbon: filtros explícitos, tabla alternativa al mapa y condiciones
de lectura junto al resultado. No se agrega otra biblioteca visual.

Los valores centrales están en `src/theme/tokens.ts` y el tema en
`src/theme/theme.ts`. Fondo cálido `#F7F6F2`, texto `#222838` y acento índigo
`#4338CA`; el modo oscuro conserva esos roles con acento `#B8AEFF`. Roboto se
sirve localmente. Los SVG propios están en `public/brand/` y comparten geometría
con `BrandMark`.

## Reglas de lectura

- Marca y riesgo usan colores independientes. Bajo, medio, alto y sin estimación
  tienen texto, símbolos y patrones de mapa.
- Riesgo, estado de estimación y prioridad son dimensiones distintas. El cliente
  presenta clasificaciones recibidas sin inventar umbrales científicos.
- Cero no significa ausencia. La historia conserva huecos e identifica incidencias.
- Hay foco visible, nombres accesibles, salto al contenido, movimiento reducido y
  selección por tabla además del mapa.
- La ficha acompaña al mapa en escritorio; en móvil se abre en un panel con cierre.
  Los filtros secundarios se despliegan para dar espacio al territorio.

## Explorador y jerarquía de trabajo

La versión 1.5.0 da prioridad al área de trabajo: cabecera compacta con ayuda bajo
demanda, consulta frecuente en una fila y escenarios laterales. La guía Localiza →
Explora → Consulta se conserva en ayuda y Storybook. El modo mapa utiliza el
viewport y paneles plegables. La [guía del explorador](explorador.md) define estos
recorridos y la tabla operativa.

`ExplorerHeader`, `ConsultationGuide`, `WorkspaceHeading` y `LocationGuide`
componen esta variante analítica. La ilustración de localización es conceptual,
decorativa y usa el acento de marca; no representa límites, riesgo ni cobertura.
La ficha seleccionada agrupa identidad, resultado y condiciones sin remontar
acciones al cambiar de municipio. La lectura B se distingue con una línea de
acento; sus cifras y el gráfico histórico permanecen estáticos.

El panel de filtros usa la entrada `card` una vez al cargar la base. El mapa y
sus ancestros no se transforman para una entrada; conserva hit testing, zoom y
selección. La guía de consulta reutiliza la cadencia narrativa aprobada en 1.3.0.
Las reglas y límites están en [movimiento](movimiento.md) y las composiciones
se pueden repetir en Storybook, sección **Sistema de diseño/Explorador**.

## Recorridos y componentes

`/` permite buscar por nombre/CVEGEO, filtrar, alternar mapa/tabla, abrir ficha,
consultar escenarios y descargar la vista/ficha. Los filtros se reflejan en la URL;
esto todavía no constituye consultas guardadas ni comparación entre versiones.
`/metodologia/` explica la lectura y `/datos/` reúne fuentes y descargas efectivas.

La entrega vigente `resultados-1.3` separa «Pronóstico 2027» de «Datos del territorio». Las cifras de 2027 se identifican como pronóstico condicionado y la
intervención como supuesto, no efecto medido. La comparación conserva el mismo
nivel nacional. Las vistas de contexto tienen leyendas propias, texto y valores
equivalentes en tabla; no cambian el semáforo científico. La ficha respeta el
[contrato](../../docs/contrato-datos.md). Ver [integración de resultados](resultados.md).

Storybook documenta fundamentos, paleta, riesgo, controles y tema. Se abre con
`npm run storybook`. Las comprobaciones automáticas de accesibilidad complementan
la inspección visual; no certifican conformidad integral ni comprensión por usuarios.
Consultar [testing](../test/README.md), [perfiles](../test/execution-profiles.md) y
[cartografía](cartografia.md).

La guía de [lenguaje y ayudas](lenguaje-y-ayudas.md) gobierna las etiquetas,
explicaciones visibles y el componente `ContextHelp`, también disponible en Storybook.
