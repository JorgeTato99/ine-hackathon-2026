# 5 · Personas en juego y escenario con intervención

Notebook `05`, secciones 3 y 5b. Decisiones D19, D22 y D28.

## 5.1 Personas en juego (D19)

No se estima cuánto funcionaría una campaña: no hay ninguna medición de eso. Se cuenta **a quién podría
dirigirse** la intervención, con los datos del INE y del INEGI:

| Grupo | Cómo se cuenta | Total país | En los rojos |
| --- | --- | ---: | ---: |
| Primerizos de 2024 | Personas de 18 a 20 años que votaron en 2024 (CCPC) | 2,898,581 | 582,590 |
| Jóvenes de 21 a 29 años que no votaron en 2024 | CCPC | 9,835,966 | 2,884,632 |
| Nuevos votantes en 2027 | Tendrán 18 o 19 años el 6 de junio de 2027; censo 2020: 0.25 × edad 10 + edad 11 + 0.75 × edad 12 | 4,363,455 | 1,104,131 |
| Nuevos sin credencial si se repite 2021 | Nuevos votantes × (1 − credencialización de 18 y 19 años en 2021, con tope de 1) | 1,268,747 | 318,946 |

- **Por qué los primerizos:** la generación que votó por primera vez en 2018 cayó 11.7 puntos en 2021, 6.1
  más que su municipio, en el 90.6 % de los municipios (notebook 03b).
- **Por qué los jóvenes de 21 a 29 años:** son el grupo que menos vota. En el municipio típico, los de 20 a
  29 votaron 9.9 puntos menos que el total en 2021.
- **Sin dato:** en 15 municipios los conteos de 2024 no tienen a nadie con dato (su participación sale de
  las actas). Ahí estos conteos quedan vacíos (`resultados-1.3`); 7 de ellos están en rojo, así que los
  totales en rojo quedan ligeramente por debajo.

## 5.2 Escenario con intervención (D22)

Las bases piden comparar un escenario sin intervención con otro con intervención hipotética. Se hace una
**cuenta con tres supuestos explícitos**, solo en los 495 municipios en rojo. **Es un supuesto, no un
efecto medido.**

| Supuesto | Qué se supone | Cálculo por municipio |
| --- | --- | --- |
| **S1 · Retener a los primerizos** | La generación de 18 a 20 años de 2024 no cae más que su municipio | Generación (votó + no votó) × 6.1 % |
| **S2 · Cerrar la mitad de la brecha joven** | Los de 20 a 29 años recortan a la mitad su distancia con el municipio | Jóvenes de 20 a 29 (votó + no votó, 2024) × la mitad de su brecha de 2021 (0 si no había brecha) |
| **S3 · Credencializar a los nuevos** | Los nuevos sin credencial la tramitan y votan como los de 18 y 19 años de su municipio en 2021 | Nuevos sin credencial × participación de 18 y 19 años en 2021. **También suma personas a la lista** |

**Participación con intervención** = (votos previstos + votos adicionales) / (lista 2024 + nuevos en la
lista). Para saber quién sale del rojo se usa la **línea fija** del semáforo sin intervención, porque si
no, siempre habría 20 % en rojo.

**Resultados por tipo de intervención (D28), con el nivel nacional estimado (51.4 %):**

| Tipo | Votos adicionales | Efecto en el rojo típico | Rojos que salen | Siguen en rojo |
| --- | ---: | ---: | ---: | ---: |
| Retener a los primerizos (S1) | 80,478 | +0.32 pp | 20 | 475 |
| Jóvenes de 20 a 29 años (S2) | 294,864 | +1.29 pp | 66 | 429 |
| Credencialización (S3) | 129,665 | 0.00 pp | 5 | 490 |
| **Las tres juntas** | **505,007** | **+1.58 pp** | **87 (4.7 millones de personas)** | **408** |

- **El rojo típico está a 5.5 puntos de la línea:** ni las tres acciones juntas alcanzan para la mayoría.
- **Credencializar suma votos, pero no sube el porcentaje:** en 200 de los 495 rojos lo baja un poco, porque las
  personas nuevas votan menos que el promedio de su municipio. Es una medida de inclusión.
- **En el país, el efecto de las tres juntas es de +0.35 puntos.**
- **Lectura:** el tipo que más mueve es el de jóvenes, pero ninguna campaña compensa que en 2027 no haya
  elección municipal en la mayoría de los rojos.

**En los archivos:**
- en `escenarios_2027.csv` va una fila por tipo (`retener_primerizos`, `jovenes_20_29`, `credencializacion` y
  `combinada`), con `efecto_interv` y `votos_adicionales`;
- en `municipios.csv` van las columnas `interv_*` con lo que suma cada supuesto en cada municipio;
- fuera del rojo, el efecto es 0.
