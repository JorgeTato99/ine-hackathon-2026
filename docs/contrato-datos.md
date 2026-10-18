# Contrato de integración de datos

## Alcance y estado

La aplicación recibe tres archivos UTF-8, con resultados precalculados. La muestra
estructural está en `data/samples/muestra-0.3/`. Sus claves, nombres y participación
histórica son reales. **Todo 2027 es ilustrativo:** escenarios, intervención,
umbrales, niveles nacionales, riesgo y cifras no constituyen metodología ni resultados
finales. La definición científica corresponde a Sofía.

Los CSV utilizan comas como separador, comillas dobles y punto decimal. Una celda
vacía indica ausencia; nunca se convierte automáticamente en cero.

## Entradas

| Archivo | Granularidad y contenido |
| --- | --- |
| `municipios.csv` | Una fila por `cvegeo`; identidad, nombres, historia 2009-2024 y auxiliares declarados en metadatos. |
| `escenarios_2027.csv` | Una fila por `cvegeo` + `escenario_id`; estimación, riesgo, calidad y campos del escenario. |
| `metadatos.json` | Versión, fuentes, unidades, significado, reglas y advertencias de la entrega. |

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

El INE renumera municipios entre elecciones. Las tablas de origen se enlazan por
año y clave INE usando la correspondencia; el panel utiliza `cvegeo`. Esto no
demuestra estabilidad de límites municipales a través del tiempo.

### Escenarios y estados

| Campo | Interpretación de intercambio |
| --- | --- |
| `escenario_id` | Identificador del escenario, conservado como texto. |
| `part_pred` | Participación estimada, en proporción de 0 a 1 cuando exista. |
| `part_pred_inf`, `part_pred_sup` | Intervalos sólo si la metodología los produce; no se fabrican para completar la interfaz. |
| `estado_estimacion`, `motivo` | Estado y explicación de calidad/ausencia. `motivo` se lee como texto. |
| `riesgo` | Clasificación precalculada, separada de la calidad; sus reglas finales las define el análisis. |
| Otros campos | Nivel nacional, intervención, magnitudes y auxiliares con unidades y significado declarados. |

La participación comunicada es `SV / (SV + NV)`; NS queda fuera del denominador.
La calidad y sus umbrales provisionales de muestra no se adoptan como metodología
final por estar en los archivos.

## Comparabilidad y recepción

Sofía identifica la pareja canónica sin/con intervención y las comparaciones
admisibles. Para atribuir una diferencia al supuesto de intervención deben mantenerse
el contexto nacional y las otras condiciones pertinentes. Sin comparabilidad
confirmada se conserva la lectura individual, sin una conclusión conjunta.

Cada recepción comprueba claves, unicidad, cobertura, tipos, unidades, rangos,
referencias de escenarios y coherencia de estados. Los cambios de metadatos se
comparan además de las cifras. Pandera se utiliza sobre tablas materializadas.
Los controles técnicos no certifican validez científica ni armonización territorial.

## Versión y salidas

La publicación identifica archivos, geometría, textos y transformaciones empleados.
Las figuras, la aplicación, el reporte y la presentación utilizan el mismo corte.
Las consultas y exportaciones conservan versión, escenarios, unidades, fuentes y
ausencias; los cambios incompatibles no se aplican silenciosamente.
