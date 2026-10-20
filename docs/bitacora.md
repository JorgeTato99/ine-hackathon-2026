# Bitácora de decisiones de análisis

Aquí se anota cada decisión de análisis con su fecha, la evidencia y el porqué. Esta bitácora es la base de la sección de metodología del reporte.

**Objetivo del reto** (convocatoria, base cuarta): "¿Qué zonas podrían presentar mayor abstención en el futuro si no se interviene?"

---

## 2026-10-19 · Paso 1: ¿podemos confiar en los datos?

**Evidencia:** [`notebooks/01_calidad_datos.ipynb`](../notebooks/01_calidad_datos.ipynb). Todas las cifras de esta sección salen de ahí.

**Decidió:** Sofía Ordaz, el 19 de octubre de 2026. Se adoptan las ocho recomendaciones del análisis.

### Decisiones

| # | Decisión | Por qué |
| --- | --- | --- |
| D1 | **Participación = votó / (votó + no votó).** Las personas de las que no sabemos qué hicieron (NS) quedan fuera. | Es la fórmula oficial del INE (manual de la plataforma CCPC, p. 17). Si contáramos a los "no sabemos" como "no votó", un municipio parecería abstencionista solo porque se perdieron cuadernillos. |
| D2 | **Un municipio queda "sin dato" en una elección** en cualquiera de estos casos: (1) no hay ningún registro; (2) no sabemos lo que hizo más de la mitad de su lista; (3) su lista es menor al 80 % de la de sus elecciones vecinas; (4) casi nadie votó (menos de 2 %), sin "no sabemos" y con participación normal en sus otras elecciones. | Con menos de la mitad de la información, la cifra no es confiable. La regla 3 atrapa el problema de 2012, cuando faltan partes de la lista sin aviso. La regla 4 atrapa errores de registro. La regla 3 se aplica después de armar la historia con el territorio de 2024 (D6), para no marcar por error a los municipios que cedieron territorio. |
| D3 | **Marca propia en el mapa para los municipios sin dato en dos o más elecciones** ("sin registro en varias elecciones"), distinta del gris de un dato perdido una sola vez. | Cuando la información falta siempre (Cherán, de 2015 a 2024), puede ser parte del problema y no un accidente. Las causas se investigan en el paso 2. |
| D4 | **Las personas de 100 años o más se quedan en los totales.** En las gráficas por edad se agrupan en "100 y más". | Son alrededor del 0.02 % de la lista (2024). Mueven a un municipio como máximo 0.39 pp en 2024 y 1.9 pp en 2009. |
| D5 | **Participación sospechosamente alta:** si un municipio supera 85 % y queda más de 15 pp por encima de su participación típica, se marca como atípico. El modelo se prueba con y sin esos casos. Yucatán se conserva. | Yucatán es el estado que más vota en 4 de 6 elecciones. En Guerrero, las secciones con 95 % o más pasan de 2 (2012) a 30 (2024). |
| D6 | **La historia de cada municipio se arma con su territorio de 2024**, sumando secciones. Las secciones que cambiaron de número usan la equivalencia de su año. | Así se recupera la historia de los municipios nuevos (20 de 22 tenían todo su territorio en 2021), se repara la de los municipios que cedieron territorio y se evita el cruce de Paracho y Parácuaro. |
| D7 | **Las personas de sexo no binario (105 en 2024) se incluyen en los totales.** | Son muy pocas para analizarlas aparte. |
| D8 | **Grupos de edad del INE** (quinquenios y "100 y más"), destacando el grupo de 20 a 29 años. | Así los resultados se pueden comparar con la plataforma del INE, y ahí está el grupo que menos vota. |

### Hechos principales

- **Participación nacional:**

  | Año | Tipo | Participación |
  | --- | --- | ---: |
  | 2009 | intermedia | 44.06 % |
  | 2012 | presidencial | 62.08 % |
  | 2015 | intermedia | 47.07 % |
  | 2018 | presidencial | 62.37 % |
  | 2021 | intermedia | 51.84 % |
  | 2024 | presidencial | 59.67 % |

- **"No sabemos":**
  - En cada elección hay entre 3 y 67 municipios donde no sabemos lo que hizo más de la mitad de la lista. Ahí vive menos del 1 % de las personas del país.
  - En sus años con buen dato, esos municipios votan igual que los demás (diferencia menor a 2 pp).
- **2012:** 1,048 secciones existen en 2009 y en 2015 pero no aparecen en 2012. Además, 109 municipios tienen en 2012 una lista mucho menor de lo normal.
- **Municipios sin ningún registro:** 73 casos municipio-elección, 44 de ellos en Oaxaca.
- **Paracho y Parácuaro:** en 2021 los nombres vienen cruzados. Corregido en el notebook; falta corregir la tabla de equivalencias del repositorio.
- **Pistas para el modelo:**
  - Las presidenciales anticipan bien qué municipios quedan por debajo del resto; las intermedias, mucho menos. 2018 explica el 72 % de las diferencias entre municipios en 2021, y 2015 solo el 30 %. Para 2024, 2018 explica el 73 % y 2021 el 67 %. Para 2027, la base es 2024 junto con 2021, más qué elecciones locales coinciden ese día.
  - Los que menos votan son los hombres de 20 a 29 años (35.7 % en 2021).
  - Lo rural vota más que lo urbano, sobre todo en las intermedias (de 5 a 10 pp).

### Limitaciones que van en el reporte

- No son los resultados oficiales: no incluyen casillas especiales ni voto desde el extranjero, y la sección es la del domicilio de la credencial.
- Cuando no sabemos lo que hizo una persona, suponemos que votó igual que las personas con dato de su municipio.
- En 2012 faltan partes de la lista sin aviso.
- Las causas de los casos raros se investigan en el paso 2; hasta entonces son hipótesis.

---

## 2026-10-19 · Paso 2: ¿qué hay detrás de los datos raros?

**Evidencia:**

- [`notebooks/02_investigacion_datos_raros.ipynb`](../notebooks/02_investigacion_datos_raros.ipynb), que cruza nuestros datos con las actas oficiales de 2024.
- Los reportes de investigación en [`docs/investigacion/`](investigacion/) (A a F), con todas sus fuentes.

### Hallazgos principales

- **El "no sabemos" tiene tres orígenes:**
  - **A. No hubo casilla**, por decisión de la comunidad, conflicto o violencia. Es abstención real.
  - **B. Se votó, pero el paquete no llegó.**
  - **C. Se votó, pero el cuadernillo no se capturó.**
- **En 2024, de los 38 municipios con más de la mitad en "no sabemos":** 10 son de origen A, 5 de origen B y 23 de origen C.
- **Ejemplo de origen A, Cherán:** la fórmula da 47.1 %, pero solo votó el 7.1 % de su lista, porque solo hubo casillas para una parte.
- **2012:** el INE no pudo capturar 5,485 cuadernillos y los quitó de la base (*Estudio censal 2012*). Nuestra lista de 2012 coincide exactamente con su cifra: 76,490,962.
- **2015:** el "no sabemos" coincide con el boicot magisterial en Oaxaca y Guerrero, pero solo el 25 % está en los estados del boicot.
- **Actas oficiales:** en general nuestros datos coinciden con las actas (mediana 0.99). Hay 359 secciones donde nuestros datos marcan bastante más "votó" que los votos del acta.
- **San Miguel Totolapan** coincide exacto con su acta: su participación alta es real.
- **Personas de 110 años o más:** el INE ya las revisó (COTEPE 2023-2024). Son sobre todo edades exageradas en registros antiguos.
- **Crecimiento atípico de la lista:** casi todo es expansión urbana. Solo Las Minas (Veracruz, 2021) combina crecimiento atípico con salto de participación.

- **Elegir gobernador el mismo día:** entre 2012 y 2015 la participación cayó −4.3 pp en los estados que eligieron gobernador y −17.6 pp en los demás; entre 2018 y 2021, −7.3 pp contra −11.7 pp. En 2027 se eligen 17 gubernaturas ([G](investigacion/G-calendario-2027.md)). Es una variable para el modelo.
- **Búsquedas sin resultado y pendientes** (como la lista de municipios de Oaxaca por usos y costumbres): ver [H](investigacion/H-busquedas-pendientes.md).

### Decisiones

**Decidió:** Sofía Ordaz, el 19 de octubre de 2026.

| # | Decisión | Qué se decidió | Por qué |
| --- | --- | --- | --- |
| D3 (ajustada) | Qué hacer cuando hay mucho "no sabemos" | Distinguir el origen con las actas. **A:** participación calculada con las actas sobre toda la lista, más la marca "no participación comunitaria o por conflicto". **B:** participación de las actas, más una marca de conflicto. **C:** participación de las actas; si no hay actas, "sin dato" | Con la regla anterior, los municipios con más abstención real (Cherán, Chicomuselo, Pantelhó) habrían quedado en gris |
| D9 | Actas oficiales como segunda fuente | Incorporar las actas por casilla de 2018, 2021 y 2024 | Permiten separar los tres orígenes y validar los datos |
| D10 | Secciones donde nuestros datos y el acta no coinciden | Si nuestros datos marcan más de 10 % (y al menos 50) más "votó" que votos el acta, la sección queda "sin dato" | Dos fuentes oficiales no coinciden |
| D11 | Crecimiento atípico de la lista | No mostrarlo como "sospecha" en el mapa; usarlo como variable continua en el modelo | Casi todo es crecimiento urbano |

### Cómo se comunica

- **Decir** "participación atípica" o "dos fuentes oficiales no coinciden". **Nunca** "fraude", "voto de muertos" ni "turismo electoral".
- **No nombrar** a personas.

### Siguiente paso

**Paso 3 · Exploración:**

- verificar las pistas para el modelo: elección municipal el mismo día, crecimiento de la lista y credencialización de los jóvenes;
- armar la variable "gobernador el mismo día" para 2009, 2015, 2021 y 2027.

---

## 2026-10-19 · Paso 3: la historia de cada municipio y las variables

**Evidencia:**

- [`notebooks/03_historia_y_variables.ipynb`](../notebooks/03_historia_y_variables.ipynb), que genera `data/processed/panel_municipal.parquet` (municipio × elección, con el territorio de 2024).
- Reporte [I](investigacion/I-elecciones-concurrentes.md): elecciones locales el mismo día, de 2009 a 2027, y municipios de Oaxaca por sistemas normativos indígenas.
- Revisado por dos revisores independientes, que recalcularon las cifras clave. Sus hallazgos ya están corregidos en el notebook.

### Hallazgos principales

- **Historia por territorio de 2024 (D6):**
  - Entre 4.9 % y 6.5 % de la lista de cada elección vive en secciones que el INE dividió. Se asignan al municipio de su año.
  - Hay duda real solo en 13 municipios, marcados como "territorio aproximado".
  - Los 19 municipios creados después de 2009 recuperan su historia; 15 la tienen completa.
- **Actas de 2018, 2021 y 2024 (D9):** son las descargas oficiales del INE. La sección típica cuadra al 99 %.
- **Corrección al paso 2:** la falta de casillas era más amplia de lo que vimos.
  - 36 municipios tuvieron al menos 10 % de la lista sin casilla en alguna elección de 2018 a 2024.
  - 12 repiten; Tila, Cherán, Charapan, Nahuatzen, Quiroga y Tingambato, en las tres elecciones.
  - La fórmula de los conteos les inflaba la participación: 15 puntos en el caso típico.
- **Corrección al paso 2:** el efecto de 2012 → 2015 (−4.3 contra −17.6 puntos) no era solo del gobernador.
  - Lo explica sobre todo tener o no tener alguna elección local ese día.
  - En 2021, cuando casi todo el país eligió algo local, el gobernador pesó menos.
  - Los estados con elecciones locales sin gobernador en 2018 y 2021 casi no se movieron (+0.8 puntos; +1.9 sin Oaxaca).
- **2027 se parece a 2021:**
  - La transición de 2024 a 2027 tiene los mismos grupos que la de 2018 a 2021.
  - No eligen gobernador ni en 2024 ni en 2027: Coahuila, Durango, Hidalgo, Estado de México, Oaxaca y Tamaulipas.
  - La elección judicial se movió a 2028 (reforma publicada en el DOF el 2 de junio de 2026), así que no coincide con 2027.
- **Variables:**
  - La historia anticipa dos tercios de las diferencias entre municipios (2018 → 2021).
  - % jóvenes y crecimiento de la lista casi no aportan.
  - % hombres y % rural aportan poco. Lo de % hombres, como señal de migración, es una hipótesis.
- **Jóvenes de 20 a 29 años (2021):**
  - En el municipio típico votan 9.9 puntos menos que el total, en el 97.5 % de los municipios.
  - Los hombres de 20 a 29 años votan 43.1 % en el municipio típico.

### Propuestas de decisión (pendientes de Sofía)

| # | Propuesta | Por qué |
| --- | --- | --- |
| D2 (ajustada) | Regla 3 solo con elección antes y después, y con media geométrica | Con la regla anterior, municipios que crecieron de verdad (García, Juárez, Solidaridad, Pesquería) quedaban como "lista incompleta" |
| D3 (ajustada otra vez) | Usar la participación de las actas también cuando 10 % o más de la lista se queda sin casilla, aunque el "no sabemos" sea menor a la mitad | Si no, 36 municipios donde parte de la gente no tuvo dónde votar aparecen votando más que el país |
| D10 (ajustada) | Secciones que no cuadran con el acta, en los dos sentidos | Marcar "votó" de menos fabrica abstención falsa |
| D12 | Alerta propia para municipios con parte de la lista sin casilla, calculada solo con elecciones anteriores ("recurrente" o "antecedente"). En el entrenamiento se excluye solo el año sin casilla, no el municipio | Su problema es distinto (no hubo dónde votar) y una campaña no lo resuelve. No es riesgo máximo automático |
| D13 (ajustada) | "Territorio aproximado" solo si quien recibió territorio no lo tiene completo ese año; se marca a los dos | Si no, se marcaba a municipios cuya historia es exacta |
| D14 | Modelo simple: historia más nivel de elección local el mismo día; otras variables solo si mejoran la validación | Las variables de la lista casi no aportan por sí solas |
| D15 | Validar entrenando con 2012 → 2015 y probando en 2018 → 2021. Medir error, coincidencia en el 10 % de mayor riesgo y resultado ponderado por la lista. Comparar contra la regla simple justa | Simula predecir una intermedia que el modelo no ha visto, respetando el orden del tiempo |

### Siguiente paso

**Paso 4 · Modelo y validación**, con primer resultado el 22 de octubre, una vez decididas estas propuestas.
