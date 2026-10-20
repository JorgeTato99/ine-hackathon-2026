# Contrato de integración de datos

## Alcance y estado

La entrega vigente es `data/processed/mapa/resultados-1.1/`, recibida del PR #3,
commit `3f58a1d21a2c804a8711d5dbdfc55f7ee6d04c7b`. Sus tres archivos UTF-8 contienen
historia, indicadores y resultados precalculados del análisis de Sofía. 2027 es
pronóstico condicionado al nivel nacional, no observación futura. La intervención
es un supuesto aritmético, no un efecto medido. La muestra 0.3 se conserva solo
como antecedente y fixture; no alimenta la publicación vigente.

Los CSV utilizan comas como separador, comillas dobles y punto decimal. Una celda
vacía indica ausencia; nunca se convierte automáticamente en cero.
En esta entrega hay 15 `NaN` literales en `brecha_jovenes_2024`: se normalizan a
`null` únicamente al exportar para la web. Los originales se conservan íntegros.

## Entradas

| Archivo               | Granularidad y contenido                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `municipios.csv`      | Una fila por `cvegeo`; identidad, nombres, historia 2009-2024 y auxiliares declarados en metadatos. |
| `escenarios_2027.csv` | Una fila por `cvegeo` + `escenario_id`; estimación, riesgo, calidad y campos del escenario.         |
| `metadatos.json`      | Versión, fuentes, unidades, significado, reglas y advertencias de la entrega.                       |

No se fija el número de escenarios de la muestra como límite de la aplicación.
Los textos científicos pueden entregarse en documentos, configuración o materiales
del análisis; este contrato no impone un cuarto archivo científico.

### Identidad e historia

- `cvegeo`: texto de cinco posiciones, con ceros iniciales; clave de unión geográfica.
- `clave_ine_2024`: texto, referencia de INE de 2024; no se utiliza como identidad entre años.
- `nombre_mpio`, `nombre_edo`: nombres para consulta.
- `part_2009`, `part_2012`, `part_2015`, `part_2018`, `part_2021`, `part_2024`:
  proporciones observadas; ausencia distinta de cero.
- Los auxiliares, como `ln_2024` y variables juveniles, mantienen población y año
  declarados. No se presentan automáticamente como población o necesidad de 2027.

Las tablas de origen se enlazan por año y clave INE usando la correspondencia;
el panel utiliza `cvegeo`. Esto no demuestra estabilidad de límites municipales
a través del tiempo ni autoriza reconstruir automáticamente las series con una
geografía común. La entrega real ya incorpora la reconstrucción del análisis con
territorio de 2024 (D6); el frontend consume esas series sin reconstruirlas de nuevo.

En Paracho y Parácuaro, el CCPC de 2021 intercambia los **nombres**, mientras las
claves INE y sus conjuntos de secciones permanecen iguales en las seis elecciones.
La corrección, acotada a 2021 en
[`municipality_overrides_by_year.csv`](../config/municipality_overrides_by_year.csv),
asigna INE `16065` a CVEGEO `16064` (Parácuaro), e INE `16066` a CVEGEO `16065`
(Paracho). Se conservan el nombre original INE y el nombre del destino INEGI en
columnas diferentes; no se alteran los CSV de origen ni sus conteos.

### Escenarios y estados

| Campo                            | Interpretación de intercambio                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `escenario_id`                   | Identificador del escenario, conservado como texto.                                            |
| `part_pred`                      | Participación estimada, en proporción de 0 a 1 cuando exista.                                  |
| `part_pred_inf`, `part_pred_sup` | Intervalos sólo si la metodología los produce; no se fabrican para completar la interfaz.      |
| `estado_estimacion`, `motivo`    | Estado y explicación de calidad/ausencia. `motivo` se lee como texto.                          |
| `riesgo`                         | Clasificación precalculada, separada de la calidad; sus reglas finales las define el análisis. |
| Otros campos                     | Nivel nacional, intervención, magnitudes y auxiliares con unidades y significado declarados.   |

La participación comunicada es `SV / (SV + NV)`; NS queda fuera del denominador.
La calidad y sus umbrales provisionales de muestra no se adoptan como metodología
final por estar en los archivos.

**Antecedente de la muestra 0.3:** las historias de Paracho (`16065`)
y Parácuaro (`16064`) contienen los datos de 2021 intercambiados. Se conserva la
muestra original para trazabilidad. Esa omisión provisional no se aplica a
`resultados-1.1`, cuya historia proviene de la entrega científica regenerada.

La entrega contiene 2,477 registros y la geometría 2,478 municipios. Villa de Pozos
(`24059`) conserva geometría y se representa sin dato, en gris. No se le fabrican
resultados. Las 12 referencias INE vacías no afectan la unión por CVEGEO.
Los ceros identificados como falta de casillas se muestran como «Sin casilla:
no se pudo votar» y no se dibujan como abstención voluntaria en la serie.

## Comparabilidad y recepción

La entrega identifica tres parejas canónicas sin/con intervención y las comparaciones
admisibles. Para atribuir una diferencia al supuesto de intervención deben mantenerse
el contexto nacional y las otras condiciones pertinentes. Sin comparabilidad
confirmada se conserva la lectura individual, sin una conclusión conjunta.
En 1.1 cada nivel nacional tiene `ninguna` y `dirigida_rojos`; la UI conserva el
mismo nivel al comparar. El mapa usa `riesgo` del escenario, y el filtro de color
usa la cohorte fija de `semaforo` en municipios. La probabilidad de rojo de la ficha
se identifica como referencia sin intervención.

La referencia histórica o elección predictora la define el modelo y se comunica
en los artefactos científicos. La interfaz no fija 2021 como referencia automática;
el tipo de elección se muestra como contexto, sin imponer una variable predictora.

Cada recepción comprueba claves, unicidad, cobertura, tipos, unidades, rangos,
referencias de escenarios y coherencia de estados. Los cambios de metadatos se
comparan además de las cifras. Pandera se utiliza sobre tablas materializadas.
Los controles técnicos no certifican validez científica ni armonización territorial.

`validate_outputs` compara pertenencia municipal de secciones con la referencia
de 2024, usando entidad + sección. Informa cobertura y la fracción de LN comparable
asignada a otro CVEGEO; más del 90 % sin excepción documentada bloquea la validación.
Los cambios parciales se conservan como diagnóstico. Las excepciones requieren
año, referencia, municipio emisor, receptor, motivo y fuente en
[`section_continuity_exceptions.csv`](../config/section_continuity_exceptions.csv).
Este control no certifica que una sección tenga la misma geometría entre años.
Consultar [datos y cartografía](../data/README.md#continuidad-por-secciones).

## Versión y salidas

La publicación identifica archivos, geometría, textos y transformaciones empleados.
Ver [vistas y cifras de control](vistas-mapa.md) y
[integración del frontend](../frontend/docs/resultados.md).
Las figuras, la aplicación, el reporte y la presentación utilizan el mismo corte.
Las consultas y exportaciones conservan versión, escenarios, unidades, fuentes y
ausencias; los cambios incompatibles no se aplican silenciosamente.
