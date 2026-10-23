# 4 · Pronóstico 2027

Notebooks `04` (sección 6) y `05`. Decisiones D18, D25 y D27.

## 4.1 Una sola predicción: nivel nacional por calendario (D27)

El modelo municipal da la **desviación prevista** de cada municipio frente al país. Para dar una sola
predicción de participación, el nivel del país se estima con un **modelo nacional por calendario**: una
recta ajustada a las tres intermedias de los CCPC, con el % de la lista que elige ayuntamiento el mismo día.

| Intermedia | % de la lista con ayuntamiento ese día | Participación del país | Predicha con las otras dos | Error |
| --- | ---: | ---: | ---: | ---: |
| 2009 | 47.0 % | 44.1 % | 45.7 % | +1.6 |
| 2015 | 57.9 % | 47.1 % | 45.8 % | −1.2 |
| 2021 | 95.1 % | 51.8 % | 57.3 % | +5.4 |
| **2027** | **91.2 %** | **51.4 % (estimado)** | | |

- **La recta:** participación nacional = 37.43 + 0.153 × % de la lista con ayuntamiento. Su error de prueba
  (raíz del error cuadrático medio) es de 3.3 puntos.
- **Es una estimación con solo tres elecciones:** por eso su error se suma al rango de cada municipio.
- **Participación del municipio** = 51.4 % + desviación prevista + ajuste. El ajuste es común a todos y hace
  que el promedio ponderado por la lista de 2024 sea 51.4 %.
- **El semáforo no depende del nivel nacional,** solo del orden. Con otro nivel, todos los porcentajes se
  moverían casi lo mismo.
- **Sensibilidad:** si el país votara como en 2009 (44.1 %) o en 2015 (47.1 %), cada municipio bajaría unos 7 o
  4 puntos. Esas cifras quedan solo en la documentación (D27).
- **Antecedente:** D25 marcaba el nivel de 2021 como el más comparable. D27 lo sustituye por una estimación
  con el calendario de 2027, que da casi lo mismo (51.4 % contra 51.8 %).

### Casos que parecen raros y por qué no lo son

- **Xalapa (predicción: 42.9 %, con un rango de 33.2 % a 53.4 %).**
  - En 2027, Veracruz tiene la elección federal y diputaciones locales, pero **no ayuntamiento**.
  - Su 51.5 % de 2021 estuvo impulsado por su elección municipal. Sin ella (2009 y 2015), quedó unos 4.5
    puntos debajo del país.
  - El modelo predice −8.9 frente al país.
  - Con el nivel nacional estimado da 42.9 %, casi su 42.6 % de 2015. Con el nivel de 2015 (47.1 %) habría dado 38.5 %, menos que cualquiera de sus datos: por eso no se usa ese nivel.
  - Al predecir 2015, el modelo dio −4.7 para Xalapa y fue −4.5.
- **Durango capital (patrón de referencia).** No tiene ayuntamiento en las intermedias. Pasó de −2.2 a
  −6.8 y luego a −11.7 frente al país (2009, 2015 y 2021), a medida que el resto del país sí elegía
  ayuntamiento. En números absolutos votó casi lo mismo (alrededor de 40 % en 2015 y en 2021).
- **Mapimí (Durango).**
  - Empeora frente al país en cada elección: −1.2, −4.1 y −8.8 en las presidenciales de 2012, 2018 y 2024;
    −11.1 en la intermedia de 2021.
  - El modelo predice −13.5.
  - Al ser un municipio chico, su rango es ancho, y su 40.7 % de 2021 cabe dentro.
- **En general,** al predecir 2021, los municipios sin elección municipal votaron 5 puntos **menos** de lo
  que dijo el modelo (mediana). Si hay sesgo, es optimista.

## 4.2 Incertidumbre

**Rango de 90 % de cada municipio** (notebook 05, secciones 0 y 1):

- Sale de los **errores reales de la validación**, de las dos direcciones: real menos previsto, quitando el
  desplazamiento general de cada elección.
- Se separan por tamaño de la lista: menos de 5 mil, 5 a 20 mil, 20 a 100 mil y 100 mil o más.
- Va de unos −16 a +13 pp en los municipios de menos de 5 mil electores, y de −8 a +9 pp en los de 100 mil o
  más.
- **Probado de una elección a otra, cubrió entre 85 % y 90 %**, cerca del 90 % que promete.
- **Se le suma en cuadratura el error del nivel nacional** (1.645 × 3.3 puntos). El rango final mide de 20 a 31
  puntos de ancho.
- La posición de un municipio frente a los demás es más confiable que su cifra exacta.

**Variabilidad del modelo** (notebook 04, sección 6): 300 reentrenamientos con muestras al azar de
municipios (bootstrap) dan unos 1.7 pp. No incluyen el error de una elección nueva, por eso el mapa usa el
intervalo de arriba.

**Probabilidad de quedar en rojo:**

- **Cómo se calcula:** se hacen 2,000 simulaciones. En cada una, a la predicción de cada municipio se le
  suma un error tomado al azar de los errores de la validación de su mismo tamaño, y se vuelve a ordenar.
- **Al predecir 2021 está bien calibrada en el rango medio y es optimista arriba:** cuando dice 60 %,
  fueron rojos el 66 %; cuando dice 80 %, el 71 %; cuando dice 94 %, el 89 %.
- **Al predecir 2015 es más optimista:** cuando dice 80 %, fue el 59 %.
- **Cómo leerla:** con 80 % o más se lee como "probable", no como "seguro".

## 4.3 Semáforo (D18)

- **Posición de riesgo** = 100 − percentil de la desviación prevista. 100 es el municipio que se prevé más
  por debajo del país.
- **Cortes:**
  - **rojo:** posición de 80 o más, el 20 % de mayor riesgo. Corresponde a una desviación prevista de
    −6.31 pp o menos;
  - **amarillo:** de 60 a menos de 80, el 20 % siguiente (desviación de hasta +2.35 pp);
  - **verde:** el resto.
- **Por qué el 20 %:** es donde el modelo se validó mejor (70 % de acierto en el 20 % de mayor riesgo al
  predecir 2021).

| Semáforo | Municipios | Personas en la lista 2024 |
| --- | ---: | ---: |
| Rojo | 495 | 23,818,704 |
| Amarillo | 496 | 43,525,306 |
| Verde | 1,486 | 30,986,338 |

- **Firmeza del rojo:** 287 son "rojos firmes" (probabilidad de rojo de 70 % o más; 12.4 millones de
  personas) y 208 están en el límite. Además, 126 amarillos tienen entre 30 % y 70 % de probabilidad de rojo.
- **Dos historias del rojo:**
  - **413 municipios sin elección municipal ese día** (6.3 millones de personas): 311 de usos y costumbres
    en Oaxaca, 63 de Veracruz, 32 de Durango y 7 con usos y costumbres fuera de Oaxaca;
  - **82 que sí eligen ayuntamiento** pero votan poco siempre (17.5 millones de personas): Tijuana, Juárez,
    Mexicali, Reynosa, Hermosillo y otras ciudades, sobre todo del norte.

## 4.4 Archivos

`data/processed/mapa/resultados-1.4/`, con el formato de [`docs/contrato-datos.md`](../contrato-datos.md):

| Archivo | Contenido |
| --- | --- |
| `municipios.csv` | Una fila por municipio: identidad, historia, posición de riesgo, semáforo, probabilidad de rojo, personas en juego, supuestos de intervención, alertas y contexto |
| `escenarios_2027.csv` | 5 filas por municipio, una por tipo de intervención (ninguna, retener primerizos, jóvenes de 20 a 29, credencialización y combinada), con el nivel estimado: participación esperada, rango, riesgo, efecto y votos adicionales |
| `metadatos.json` | Unidades y significado de cada columna, reglas, fuentes y advertencias |

Cifras de control y vistas del mapa: [`docs/vistas-mapa.md`](../vistas-mapa.md).
