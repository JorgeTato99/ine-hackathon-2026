# Cambios de lectura y prueba del 22 de octubre

## 1 · Variables que cambiaron de lectura durante el análisis

| Variable | Primera lectura | Lectura final | Dónde |
| --- | --- | --- | --- |
| **Elecciones locales el mismo día** | El salto de participación de 2015 se atribuía a la elección de **gobernador** | El efecto es de tener **alguna** elección local, sobre todo de ayuntamiento. Es la variable más fuerte después de la historia, y una de las dos que funcionan igual en las cinco elecciones probadas | Bitácora, paso 3 (corrección al paso 2); notebook 04b, sección 10 |
| **Usos y costumbres** (`es_sni`) | Casi no se notaba en 2015 (−0.08) | Fuerte en 2021 (−0.34) y estable en las cinco elecciones. Explicación: desde 2018, los municipios de partidos de Oaxaca eligen ayuntamiento el mismo día que la federal y los de usos y costumbres no. La brecha pasó de 1.8 puntos en 2015 a 20.7 en 2021 | Notebooks 03b y 04b |
| **Competencia política** (margen y número de partidos) | Las señales más fuertes al cruzar con 2021 (−0.33 y 0.27) | No se repiten en 2015 (0.01 y −0.14): no son estables. Siguen en el modelo, pero casi no pesan | Reporte J (R8); notebook 03b, sección 5 |
| **Pobreza** | Se esperaba que los municipios más pobres votaran menos | A nivel nacional casi no se relaciona. Fuera de Oaxaca, los más pobres votan **más**; dentro de Oaxaca, menos, por el régimen de usos y costumbres | Notebook 03b, sección 7 |
| **Migración** | Prometía explicar la abstención | Explica el nivel (donde hay más migración se vota menos), pero anticipó 2015 y no 2021: no mejora la predicción | Notebook 03b |
| **Violencia** | Se esperaba que anticipara dónde faltan casillas | Acierta como adivinar al azar (0.52 a 0.59, donde 0.5 es azar). La mejor señal es el propio antecedente de falta de casillas | Reporte J (R9) |
| **Antecedente de falta de casillas** | Estaba en la primera versión del modelo | Se sacó: aprendía de 4 municipios que se recuperaron y ponía a Tila o Nahuatzen como los de menor riesgo. Va como alerta aparte (D12) | Bitácora, paso 4 |
| **Extorsión y delitos electorales** (SESNSP) | En 2021 iban con votar menos de lo esperado (−0.13 y −0.10), pero solo se habían medido ese año | Medidos también en 2015 (prueba del 22 de octubre): no son estables. Los delitos electorales cambian de signo (+0.06 en 2015) | Sección 2 de este documento |
| **Densidad de población** | No se había considerado | Es la más fuerte de las 18 variables nuevas (−0.30 y −0.19), pero mejora el modelo menos de 1 % | Notebook 04b, D20 |

**Corrección de datos encontrada al revisar los casos atípicos:** 7 municipios fuera de Oaxaca eligen
por usos y costumbres y estaban marcados como si eligieran ayuntamiento por partidos. Se corrigió en los
notebooks 03 a 05 (`data/reference/municipios_sni_fuera_oaxaca.csv`).

**Pendiente de decisión (D24):** cuando la presidencial anterior tuvo falta de casillas, el modelo recibe
una participación de 0 % como dato de entrada (18 municipios para 2027; en 4, la participación de 2024 es
0 %). La propuesta es tratar ese dato como "sin dato", igual que ya se hace cuando la elección a predecir
tuvo falta de casillas.

## 2 · Prueba del 22 de octubre: 39 variables que teníamos y no habíamos probado, y una base nueva

**Por qué:** al documentar todas las variables encontramos datos que ya estaban descargados y nunca se
habían evaluado: componentes de pobreza, de marginación y de rezago social, remesas en dólares, delitos
del SESNSP de 2015, votos nulos y otros datos del censo.

**Método:** el mismo del notebook 04b.

1. Estabilidad en las dos intermedias.
2. Mejora al agregar la variable a Huber con 34 variables, en las dos validaciones (1,000 remuestreos).
3. Las que mejoran se confirman con el modelo final (ensamble Huber + random forest).

Script: `notebooks/pruebas_variables/variables_no_probadas.py`.

**Resultados:**

- **20 de 39 son estables.** Las más fuertes:
  - diferencia de escolaridad entre hombres y mujeres (−0.23 y −0.22);
  - % sin drenaje (0.25 y 0.15);
  - % de 60 años o más (0.19 y 0.10);
  - % en hogares indígenas (−0.10 y −0.17).
- **5 mejoran a Huber en las dos validaciones:** vulnerables por carencias, ni pobres ni vulnerables,
  carencia de seguridad social, hacinamiento y % de 60 años o más.
- **Con el modelo final solo 2 mantienen la mejora en las dos:**

| Agregar al ensamble | Error al predecir 2021 | Error al predecir 2015 |
| --- | --- | --- |
| Nada (modelo final) | 5.317 | 6.158 |
| + vulnerables por carencias (CONEVAL) | 5.246 (−0.071) | 6.138 (−0.020) |
| + ni pobres ni vulnerables (CONEVAL) | 5.244 (−0.072) | 6.129 (−0.029) |
| + las 5 que mejoraron a Huber | 5.265 (−0.052) | 6.110 (−0.048) |

  Las mejoras son de 1.4 % y 0.5 %, con intervalos que no incluyen el cero.
- **Los delitos del SESNSP de enero a mayo** (secuestro y feminicidio son estables) no sirven para
  pronosticar 2027 con anticipación: el dato de 2027 existe hasta mayo de 2027. Podrían entrar en una
  actualización de primavera.
- **Ninguna variable que antes no mostraba relación resultó útil** en esta prueba.

**La misma tarde se probó una base nueva,** las elecciones de ayuntamiento compiladas por Magar (ver
[otras-fuentes.md](otras-fuentes.md); script `notebooks/pruebas_variables/magar_ayuntamientos.py`):

- La participación en la última elección de ayuntamiento, frente a su estado, es estable (0.14 y 0.13) y
  mejora el modelo final en las dos validaciones (−0.084 y −0.076 pp).
- **Juntas, las tres que mejoraban por separado ya no mejoran en las dos validaciones:**

| Agregar al ensamble | Error al predecir 2021 | Error al predecir 2015 | Acierto en el 20 % de mayor riesgo |
| --- | --- | --- | --- |
| Nada (modelo final) | 5.317 | 6.158 | 69.8 % y 59.4 % |
| Las 3 ganadoras juntas | 5.276 (−0.040) | 6.152 (−0.005, intervalo de −0.051 a +0.036) | 69.0 % y 59.4 % |

  Si las mejoras fueran sólidas, deberían sumarse. Que no se sumen indica que en buena parte son azar.

**Recomendación (decisión de Sofía, sería D26): no agregarlas ahora.**

- **Mejoran el modelo alrededor de 1 % cada una, la misma magnitud que llevó a no agregar las 18 de D20, y
  juntas no mejoran ni el error ni el acierto en el 20 % de mayor riesgo.**
- **Hay riesgo de que sea casualidad.** Después del modelo se probaron 60 variables (18 el 20 de octubre y
  42 el 22). Con tantas pruebas sobre las mismas dos validaciones, que 3 pasen por un margen pequeño
  puede ser azar.
- **El costo es alto a nueve días de la entrega:** agregarlas cambia todos los resultados publicados.
- **Quedan documentadas como primeras candidatas para una versión posterior.**
