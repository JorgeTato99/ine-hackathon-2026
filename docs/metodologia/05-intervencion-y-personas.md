# 5 · Personas en juego y escenario con intervención

Notebook `05`, secciones 3 y 5b. Decisiones D19, D22, D28 y D32.

## 5.1 Personas en juego (D19)

No se estima cuánto funcionaría una campaña: no hay ninguna medición de eso. Se cuenta **a quién podría
dirigirse** la intervención, con los datos del INE y del INEGI:

| Grupo | Cómo se cuenta | Total país | En los rojos |
| --- | --- | ---: | ---: |
| Primerizos de 2024 | Personas de 18 a 20 años que votaron en 2024 (CCPC) | 2,898,581 | 618,518 |
| Jóvenes de 21 a 29 años que no votaron en 2024 | CCPC | 9,835,966 | 3,011,632 |
| Nuevos votantes en 2027 | Tendrán 18 o 19 años el 6 de junio de 2027; censo 2020: 0.25 × edad 10 + edad 11 + 0.75 × edad 12 | 4,363,455 | 1,157,532 |
| Nuevos sin credencial si se repite 2021 | Nuevos votantes × (1 − credencialización de 18 y 19 años en 2021, con tope de 1) | 1,268,747 | 332,396 |

- **Por qué los primerizos:** la generación que votó por primera vez en 2018 cayó 11.7 puntos en 2021, 6.1
  más que su municipio, en el 90.6 % de los municipios (notebook 03b).
- **Por qué los jóvenes de 21 a 29 años:** son el grupo que menos vota. En el municipio típico, los de 20 a
  29 votaron 9.9 puntos menos que el total en 2021.
- **Sin dato:** en 15 municipios los conteos de 2024 no tienen a nadie con dato (su participación sale de
  las actas). Ahí estos conteos quedan vacíos (`resultados-1.3`); 6 de ellos están en rojo, así que los
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
| Retener a los primerizos (S1) | 84,789 | +0.32 pp | 19 | 476 |
| Jóvenes de 20 a 29 años (S2) | 307,818 | +1.28 pp | 68 | 427 |
| Credencialización (S3) | 135,793 | 0.00 pp | 7 | 488 |
| **Las tres juntas** | **528,400** | **+1.59 pp** | **84 (6.1 millones de personas)** | **411** |

- **El rojo típico está a 5.7 puntos de la línea:** ni las tres acciones juntas alcanzan para la mayoría.
- **Credencializar suma votos, pero no sube el porcentaje:** en 188 de los 495 rojos lo baja un poco, porque las
  personas nuevas votan menos que el promedio de su municipio. Es una medida de inclusión.
- **En el país, el efecto de las tres juntas es de +0.36 puntos.**
- **No siempre "las tres juntas" saca más del rojo:** Mixistlán de la Reforma (Oaxaca, 20060) sale con jóvenes de
  20 a 29 y no con las tres, porque la credencialización baja un poco su porcentaje. 85 rojos salen con al menos un
  tipo.

**Componentes sin dato (D32, auditoría H002).** Donde falta un componente, se suma solo lo conocido y el
escenario lleva `intervencion_parcial` en `motivo`:

- S3 no se puede calcular en 73 rojos (no hay participación de 18 y 19 años en 2021, casi siempre por tener
  menos de 50 jóvenes en el censo);
- S1 falta en 6 y S2 en 9 (sin conteo por edad en 2024 o sin brecha de 2021);
- **si falta S3, tampoco se agregan personas a la lista.** Antes, en Oxchuc (1,773 personas) y San Mateo del Mar
  (314) se agregaban personas sin sus votos, y la credencialización bajaba su porcentaje por falta de dato, no por
  dilución. Los dos siguen en rojo con o sin intervención.
- **Lectura:** el tipo que más mueve es el de jóvenes, pero ninguna campaña compensa que en 2027 no haya
  elección municipal en la mayoría de los rojos.

**En los archivos:**
- en `escenarios_2027.csv` va una fila por tipo (`retener_primerizos`, `jovenes_20_29`, `credencializacion` y
  `combinada`), con `efecto_interv` y `votos_adicionales`;
- en `municipios.csv` van las columnas `interv_*` con lo que suma cada supuesto en cada municipio;
- fuera del rojo, el efecto es 0.
