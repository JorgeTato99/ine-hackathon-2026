# Reporte E · Crecimiento atípico de la lista nominal

Análisis del 19 de octubre de 2026.

- Los scripts de trabajo de esta investigación no están en el repositorio; las cifras que verificamos se reproducen en `notebooks/02_investigacion_datos_raros.ipynb`; las demás son de este reporte y están marcadas como no verificadas por nosotros donde corresponde.
- **Datos:** `muni_periodo.csv` y `lista_marcas_crecimiento_atipico.csv`.

## Respuesta corta

Sí se puede marcar "a revisar", pero solo con una marca angosta.

- El indicador marca **122** combinaciones de municipio y periodo:
  - **105** son expansión urbana sostenida: periferias de Monterrey, Guadalajara, Querétaro, Valle de México y Riviera Maya;
  - **6** son artefactos por cambio de límites;
  - **11** quedan "a revisar", casi todas en municipios de menos de 6 mil electores.
- **"Crece la lista y salta la participación":** solo aparece en un caso limpio, **Las Minas (Veracruz), 2018→2021**.
- **"Un vecino crece y el otro cae":** no ocurre más de lo que daría el azar. Cuando aparece, es suburbanización.

## Cómo se calcula

- Cada sección se asigna a su municipio de 2024 y se compara la lista solo en las secciones que existen en los dos años.
- Periodos: 2009→2015, 2015→2018, 2018→2021 y 2021→2024. 2012 se excluye por sus datos incompletos.
- **Crecimiento relativo:** crecimiento de la lista del municipio menos el de su estado.
- **Puntaje robusto:** el crecimiento relativo comparado con municipios de tamaño similar.
- **Marca de crecimiento atípico:** puntaje ≥ 3.5, al menos 5 % más que su estado y al menos 300 electores de exceso.
- **Clasificación de cada marca, en orden:** cambio de límites → efecto de reseccionamiento → pico que se revierte → rebote después de una caída → expansión sostenida → pico aislado.
- **"A revisar":** pico aislado, pico que se revierte o rebote.

## Resultados

| Periodo | Crecimiento atípico | Sostenido | Cambio de límites | A revisar |
| --- | ---: | ---: | ---: | ---: |
| 2009→2015 | 26 | 24 | 0 | 2 |
| 2015→2018 | 39 | 33 | 0 | 6 |
| 2018→2021 | 33 | 25 | 5 | 3 |
| 2021→2024 | 24 | 23 | 1 | 0 |

### Casos "a revisar" estables con cualquier umbral

- **Las Minas (Veracruz), 2018→2021:**
  - La lista creció 21 % contra 3 % de su estado.
  - La participación saltó de 64.8 % a **87.6 %** y volvió a 52.8 % en 2024.
  - Serie de participación de 2009 a 2024: 56 / 63 / 53 / 65 / **88** / 53 %. Verificado.
- **Cruillas (Tamaulipas), 2018→2021:**
  - Lista +21 % contra +4 % de su estado, mientras sus vecinos San Carlos y San Nicolás pierden electores.
  - Parte del crecimiento viene de una sección que se disolvió en 2021.
- **Zapotitlán de Méndez (Puebla), 2018→2021:** lista +21 %, que se revierte en 2024.
- **Huásabas (Sonora), 2009→2015:** una sola sección que crece y luego se revierte. Participación de 91 % en 2012.

### Artefactos

- **Municipios nuevos de Chiapas** en 2018→2021 y **Hueyapan** en 2021→2024.
- **Hueyapan, 2021:** las secciones 701 y 702 se vacían, de 1,215 y 1,330 personas a **10 y 65**, y en 2024 vuelven a 1,356 y 1,560. Verificado. Son las únicas dos secciones del país con este patrón; hay que tratarlas como dato dudoso.

## Vecinos

- Hay 20 pares en los que un municipio crece y su vecino cae; casi todos son suburbanización.
- Una prueba de permutación muestra que **son menos frecuentes que al azar**: el crecimiento está agrupado en el espacio (I de Moran entre 0.24 y 0.39).
- **No usar los pares de vecinos como criterio de marca.**

## Relación con la participación

- **Entre todos los marcados,** un salto de participación en la elección siguiente aparece en el 6.9 %, contra 3.6 % en el resto (p = 0.10, no significativo).
- **Sin artefactos,** queda un solo caso: Las Minas.
- **No hay relación sistemática** entre crecimiento atípico y salto de participación (Spearman −0.016).

## Edad, sexo y secciones

- **Edad:** el crecimiento sostenido tiene perfil de familias jóvenes (30 a 44 años). No hay una firma de edad clara en los picos.
- **Sexo:** casi todos los casos están entre 45 % y 55 % de hombres.
- **Secciones:** en 66 de los 122 casos, una sola sección aporta la mitad o más del crecimiento. Eso indica dónde mirar, pero no distingue un fraccionamiento nuevo de algo raro.

## Sensibilidad

- **Cuántos municipios se marcan** según el puntaje mínimo:

  | Puntaje mínimo | 2.5 | 3 | 3.5 | 4 | 5 |
  | --- | --- | --- | --- | --- | --- |
  | Marcas | 242 | 170 | 122 | 91 | 50 |

- **La lista "a revisar" va de 5 a 31 municipios** según los umbrales.
- **Estables con cualquier umbral:** Las Minas, Cruillas, Zapotitlán de Méndez y Huásabas.

## Otros hallazgos

- **Caídas persistentes de la lista:**
  - frontera de Chihuahua y Tamaulipas en 2009→2015: Guadalupe, Praxedis, Mier y Guerrero;
  - Aguililla y Churumuco (Michoacán) en 2021→2024.

  Una lista que se vacía infla la abstención aparente.
- **Secciones con 95 % o más de participación** (al menos 200 personas con dato): 46 en 2024. Se repiten en San Miguel Totolapan, Zinacantán, Petatlán, Técpan, Hopelchén y Yucatán rural.

## Recomendación

- **Capa secundaria y opcional.** Mostrar solo el nivel "a revisar" (11 casos en 15 años), con un contorno, no con relleno. El crecimiento sostenido va aparte, como contexto de expansión urbana.
- **Nombre:** "crecimiento atípico de la lista nominal". **Nunca** "turismo electoral" ni "sospechoso".
- **Ficha tipo:**

  > Entre 2018 y 2021 la lista creció 21 % contra 3 % de su estado; el crecimiento no continuó en 2024. Señala cambios estadísticamente inusuales en el registro. Puede reflejar fraccionamientos nuevos, credencialización, reorganización de secciones u otros factores. No implica irregularidad.

- **Para el modelo:** usar el crecimiento relativo como variable continua, no la marca. Donde crece la lista se vota menos.
- **Riesgo:** con 11 casos, casi todos pequeños, y una lista que va de 5 a 31 según el umbral, la marca invita a leer causas que los datos no sostienen.
- **Siguiente paso de mayor valor:** comparar la lista nominal con la población adulta del Censo 2020.
