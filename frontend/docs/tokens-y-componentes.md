# Tokens y componentes · Traza Cívica 1.18.1

[Diseño](sistema-diseno.md) · [Frontend](../README.md) · [Recursos visuales](identidad-y-recursos.md).

Fuente central: [tokens.ts](../src/theme/tokens.ts), aplicada por [theme.ts](../src/theme/theme.ts).
La versión visual es independiente de software 0.6.1 y datos resultados-1.6.

## Espaciado, densidad y estructura

`theme.spacing(1) = 8px`. Los factores MUI son unidades, no píxeles.

| Factor  | 0   | 0.5 | 1   | 1.5 | 2   | 2.5 | 3   | 4   | 5   | 6   | 8   | 10  | 12  |
| ------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Píxeles | 0   | 4   | 8   | 12  | 16  | 20  | 24  | 32  | 40  | 48  | 64  | 80  | 96  |

`space` ofrece los mismos valores como strings CSS. `Surface` usa densidad compact,
comfortable o editorial (16/24/32 px), y papel o marca. `layout` limita aplicación
a 1,600 px, contenido editorial a 1,240 px y rail a 200 px. `radii` centraliza
controles, paneles y overlays. Los párrafos no se extienden al ancho completo de la app.

`forecastLayout` define ficha 390 px, mínimo de mapa 560 px y margen de viewport
16 px. La UI puede conservar flujo vertical en ventanas pequeñas. `explorerLayout.detailWidths` vuelve a definir las tres anchuras del modo ampliado.

## Familias y roles

`fontFamilies.interface`: Source Sans 3 Variable con Arial/sans-serif.
`fontFamilies.editorial`: Newsreader Variable con Georgia/serif. Ambas locales;
sus avisos están en `public/third-party/`. `fonts.css` se comparte con Storybook.
Las cifras usan tabular-nums; no se animan peso ni tamaño óptico.

| Rol             | Tamaño     | Interlineado | Peso | Familia       |
| --------------- | ---------- | ------------ | ---- | ------------- |
| wordmark        | 24 px      | 1.15         | 600  | Newsreader    |
| display         | 34–54 px   | 1.08         | 500  | Newsreader    |
| title           | 26–32 px   | 1.2          | 500  | Newsreader    |
| compactTitle    | 22–28 px   | 1.15         | 500  | Source Sans 3 |
| recordTitle     | 30 px      | 1.15         | 500  | Source Sans 3 |
| fileTitle       | 24 px      | 1.2          | 500  | Source Sans 3 |
| metric          | 40 px      | 1.2          | 600  | Source Sans 3 |
| section         | 28 px      | 1.2          | 500  | Source Sans 3 |
| subtitle        | 18 px      | 1.4          | 700  | Source Sans 3 |
| body            | 17 px      | 1.65         | 400  | Source Sans 3 |
| small / caption | 14 / 12 px | 1.6 / 1.5    | 400  | Source Sans 3 |

Los componentes pueden adaptar un rol a su densidad con tokens y unidades MUI;
las familias y colores no se redefinen por página.

## Paletas

| Rol                 | Claro             | Oscuro            |
| ------------------- | ----------------- | ----------------- |
| canvas              | #F7F6F2           | #151823           |
| surface             | #FFFFFF           | #1D2230           |
| ink                 | #222838           | #F2F3F8           |
| muted               | #596273           | #BBC1CF           |
| accent / accentSoft | #4338CA / #EDEBFF | #B8AEFF / #302D53 |

`riskTokens` separa los roles de riesgo del acento de marca. Rellenos planos:
alto #C74A5A, medio #D9B44A, bajo #65A58A, sin estimación #D8DBDE. En oscuro: #903545, #A18435, #39715D y #69717D. `riskMapColor` selecciona la variante; nunca se cambia la clase de riesgo. Los textos y
superficies de badges conservan contraste propio por tema. `historyLegend`
define los cinco cortes históricos, gris rayado sin casilla y gris sin dato.
Las categorías siempre tienen palabras y alternativas de lectura.

## Contratos de componentes

| Componente                             | Contrato                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ForecastExplorer                       | Dos pestañas, URL canónica, mapa retenido, búsqueda territorial y controles flotantes           |
| ForecastSummary                        | Cuatro cifras por ámbito, diferencias y votos supuestos; denominador ampliado al credencializar |
| ForecastDetails                        | Ficha derecha/hoja móvil: predicción, factores base, historia, intervención y avisos            |
| ContributionChart                      | Cinco barras en orden fijo y eje cero; valores con signo; reparto del modelo, no causas         |
| HistoryChart                           | Municipio/país, huecos, sin casilla, rango de 2027 y tabla HTML equivalente                     |
| MunicipalityTable                      | Ordenación y paginación, selección accesible y lectura horizontal en móvil                      |
| ContentPage / ChapterNav               | Contenido editorial e índice activo por scroll y anclas, sin reescribir la URL                  |
| BrandMark / BrandBanner / BrandArtwork | Identidad aprobada, máscara heredada y variantes estáticas responsivas                          |
| SiteFooter                             | Navegación, fuentes, alcance, versión y retorno al contenido                                    |
| Surface / SectionHeading / NotePanel   | Jerarquía, densidad y avisos según propósito                                                    |

Las entradas y composiciones siguen [movimiento](movimiento.md). Storybook tiene
la explicación vigente con ejemplo ficticio; los patrones retirados quedan en
`temp/migracion-resultados-1.5/componentes-retirados/`, con hashes y sin pérdida
del trabajo previo. No forman parte de la interfaz ni del catálogo actual.

## Componentes recuperados

- MapModePanels: cuatro paneles minimizables, anchuras de ficha y acción Despejar.
- MapPanelHeader: siempre mantiene título y −/+; la X solo cierra selección o diálogo.
- ContextHelp: hover/foco con resumen y clic/toque con diálogo completo, foco recuperable.
- MunicipalIdentity compact: nombre y silueta real en ficha normal, móvil y ampliada.
- freeMapRectangle: reserva cámara al enfocar, sin cómputos por frame.

`explorerLayout.mapMode` centraliza los anchos adaptables de herramientas y ficha,
el máximo del resumen (760 × 320 px) y `municipalityContextPadding` (0.14).
`mapMode.dock` define tamaño, separación y margen de los grupos inferiores;
`mapDockPosition` los centra entre las columnas con variables CSS del workspace.
Las claves de `detailWidths` son `compacta` (360 px), `normal` (400–480 px,
predeterminada) y `amplia` (480–600 px); las medidas originales se conservan.
Este último amplía el encuadre por lado solo al seleccionar un municipio en modo
ampliado. `ForecastSummary` usa su propio ancho de contenedor: cuatro columnas
desde 600 px, dos por debajo. La ficha derecha no comparte altura con el resumen.

La paleta secundaria usa azul tinta; los roles info, warning y riesgo siguen separados.
