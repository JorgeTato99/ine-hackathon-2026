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

### Decisiones

**Decidió:** Sofía Ordaz, el 19 de octubre de 2026. Se adoptan todas las propuestas.

| # | Propuesta | Por qué |
| --- | --- | --- |
| D2 (ajustada) | Regla 3 solo con elección antes y después, y con media geométrica | Con la regla anterior, municipios que crecieron de verdad (García, Juárez, Solidaridad, Pesquería) quedaban como "lista incompleta" |
| D3 (ajustada otra vez) | Usar la participación de las actas también cuando 10 % o más de la lista se queda sin casilla, aunque el "no sabemos" sea menor a la mitad | Si no, 36 municipios donde parte de la gente no tuvo dónde votar aparecen votando más que el país |
| D10 (ajustada) | Secciones que no cuadran con el acta, en los dos sentidos | Marcar "votó" de menos fabrica abstención falsa |
| D12 | Alerta propia para municipios con parte de la lista sin casilla, calculada solo con elecciones anteriores ("recurrente" o "antecedente"). En el entrenamiento se excluye solo el año sin casilla, no el municipio | Su problema es distinto (no hubo dónde votar) y una campaña no lo resuelve. No es riesgo máximo automático |
| D13 (ajustada) | "Territorio aproximado" solo si quien recibió territorio no lo tiene completo ese año; se marca a los dos | Si no, se marcaba a municipios cuya historia es exacta |
| D14 | Modelo simple: historia más nivel de elección local el mismo día; otras variables solo si mejoran la validación | Las variables de la lista casi no aportan por sí solas |
| D15 | Validar entrenando con 2012 → 2015 y probando en 2018 → 2021. Medir error, coincidencia en el 10 % de mayor riesgo y resultado ponderado por la lista. Comparar contra la regla simple justa | Simula predecir una intermedia que el modelo no ha visto, respetando el orden del tiempo |

### Ampliación del 19 de octubre de 2026: actas de 2009, 2012 y 2015

- **D9 ampliada.** Se agregan las actas oficiales por casilla de 2009, 2012 y 2015 (SICEEF del INE). Ver `docs/fuentes-externas.md` y el reporte J (R13). Con ellas se aplican D3 y D10 a las seis elecciones.
- **Resultado:** ya no queda ningún municipio "sin dato" por "no sabemos" sin actas ni por lista incompleta. Quedan 39 municipio-elección "sin dato": 31 por paquete perdido, 3 sin registros y 5 por la regla 4.
- **Boicot de 2015:** 39 municipios con parte de la lista sin casilla, 34 en Oaxaca. Las cifras coinciden con las del reporte A (Huautla 93.5 % contra 94 %; San José Tenango 84.1 % contra 84 %; Chilchotla 55.9 % contra 56 %).
- **De 2009 a 2024:** 75 municipios con parte de la lista sin casilla en alguna elección; 16 recurrentes y 8 en tres o más elecciones.

| # | Propuesta | Por qué |
| --- | --- | --- |
| D16 (nueva; **confirmada por Sofía Ordaz el 20 de octubre de 2026**) | Municipios con lista incompleta en los conteos: usar la participación de todas sus actas, en lugar de dejarlos "sin dato" | Recupera 108 municipios de 2012. Las secciones que faltan en los conteos se ubican con el mismo número de sección en la elección más cercana |

### Siguiente paso

**Paso 3b · Variables externas** (reportes [J](investigacion/J-variables-externas.md) y [K](investigacion/K-patrones-y-alertas.md)) y **paso 4 · Modelo y validación**, con primer resultado el 22 de octubre.

---

## 2026-10-19 · Paso 3b: variables externas y patrones

**Evidencia:** `notebooks/03b_variables_externas_y_patrones.ipynb`; reportes [J](investigacion/J-variables-externas.md) y [K](investigacion/K-patrones-y-alertas.md); fuentes en [`docs/fuentes-externas.md`](fuentes-externas.md); scripts en `scripts/externos/`.

- **Fuentes nuevas, verificadas contra sus totales oficiales:** INEGI (censos 2010 y 2020, Intercensal 2015, homicidios), CONAPO (proyecciones, marginación, intensidad migratoria), CONEVAL (pobreza y rezago social), Banxico (remesas), SESNSP (delitos) y actas del INE de 2009, 2012 y 2015.
- **Lo que anticipa la intermedia en las dos transiciones pasadas:** elegir ayuntamiento o gobernador el mismo día; en menor medida, % hombres, cobertura de la lista, escolaridad, lo rural y usos y costumbres.
- **Lo que no se sostiene:** migración, pobreza y competitividad electoral.
- **Patrones para el mapa:**
  - la edad no explica dónde, pero sí a quién;
  - el votante primerizo se pierde;
  - falta credencial al 31 % de los jóvenes de 18 y 19 años;
  - hay zonas frías (371 municipios);
  - 285 municipios votan por debajo del país en las seis elecciones.

## 2026-10-19 · Paso 4: modelo y primer resultado

**Evidencia:** `notebooks/04_modelo_riesgo_2027.ipynb`; resultado en `data/processed/riesgo_2027.parquet` (no versionado; el notebook lo regenera).

- **Modelo:** regresión robusta (Huber) con 34 variables, elegida por la regla del notebook. Es la que menos se equivoca en promedio en las dos validaciones y le gana a la regla simple en las dos.
- **Validación principal (aprende de 2015, predice 2021):**
  - error centrado de 5.49 pp contra 6.03 de la regla simple;
  - ponderado por personas, 4.69 contra 6.80;
  - acierto en el 20 % de mayor riesgo, 72 % contra 67 %;
  - en el 10 % más extremo, la regla simple acierta un poco más (61 % contra 58 %).
- **No predice bien el nivel general:** 2027 se presenta con tres escenarios nacionales (44.1 %, 47.1 % y 51.8 %).
- **Corrección antes de publicar:** los antecedentes de falta de casillas se aprendían de solo 4 municipios que se recuperaron (sesgo de selección), y ponían a Tila o Nahuatzen como los de menor riesgo. Se sacaron del modelo; van en la alerta de D12.
- **Riesgo 2027:**
  - el 10 % de mayor riesgo son 248 municipios con 10.6 millones de personas;
  - 226 no tendrán elección municipal ese día: 192 de Oaxaca, 18 de Durango y 16 de Veracruz;
  - también entran ciudades como Tijuana, Juárez, Mexicali y Reynosa.

### Siguiente paso

**Paso 5 · Semáforo y escenarios:** cortes del semáforo (rojo = 20 % de mayor riesgo, donde el modelo se validó mejor), vista por personas y escenario "con campaña dirigida" (jóvenes, primerizos y credencialización).

---

## 2026-10-20 · Complemento del paso 3b: presencia del Estado y qué tan completo es el dato de violencia

**Evidencia:** `notebooks/03b_variables_externas_y_patrones.ipynb`, sección 8; reporte
[L](investigacion/L-presencia-del-estado-y-dato-de-violencia.md). Datos nuevos:
`scripts/externos/fuente_seguridad.py` (CNGMD 2025 y ENVIPE 2026) y una salida más de
`scripts/externos/fuente_violencia.py` (víctimas del SESNSP por estado).

- **D16 confirmada** por Sofía Ordaz. El código del notebook 03 ya la aplicaba; solo cambió el texto.
- **Quién ejerce la seguridad (INEGI, 2024):** 517 municipios sin policía municipal. No tenerla no va con
  votar menos: los 400 con cuerpos comunales son casi todos de usos y costumbres, y fuera de ellos no
  hay diferencia. Entra al mapa como contexto, no como alerta ni en el modelo (es de 2024, posterior a
  las elecciones con que se valida).
- **Homicidios INEGI contra SESNSP, 2019-2024:** casi coinciden a nivel nacional (entre −0.5 % y +3.2 %),
  pero no en todos los estados.
- **Columnas nuevas en `indicadores_mapa.parquet`:** `quien_ejerce_seguridad`, `tiene_policia_municipal`,
  `justicia_civica`, `policias_municipales_por_10mil_habitantes`, `comparacion_homicidios_inegi_sesnsp` y
  `cifra_oculta_estatal_2025`. Las columnas que ya existían no cambiaron.

### Decisión

| # | Decisión | Opciones | Recomendación (adoptada por Sofía Ordaz el 20 de octubre de 2026) |
| --- | --- | --- | --- |
| D17 (nueva) | Dato de violencia para el mapa y aviso por estado | (a) carpetas del SESNSP; (b) homicidios del INEGI, con una etiqueta por estado: "una fuente cuenta más" si en al menos 5 de los 6 años (2019-2024) supera a la otra por más de 5 % | **(b).** El INEGI no depende de la denuncia y es el que se usó en el modelo. Con la regla, el INEGI cuenta más en 5 estados (Guanajuato, Yucatán, Hidalgo, Estado de México y Tlaxcala) y el SESNSP en otros 5 (Veracruz, Oaxaca, Jalisco, Coahuila y Durango). Extorsión y secuestro solo existen en el SESNSP: van con el aviso |

### Siguiente paso

**Paso 5 · Semáforo y escenarios**, con la capa de contexto de seguridad.

---

## 2026-10-20 · Paso 5: semáforo, personas en juego y archivos para el mapa

**Evidencia:** `notebooks/05_semaforo_y_mapa.ipynb`. Archivos para el mapa en
`data/processed/mapa/resultados-1.0/` (`municipios.csv`, `escenarios_2027.csv` y `metadatos.json`, con
el formato de `docs/contrato-datos.md`). El notebook 04 ahora guarda además las predicciones de su
validación (`data/processed/validacion_modelo.parquet`); el riesgo 2027 no cambió.

### Decisiones (Sofía Ordaz, 20 de octubre de 2026)

| # | Decisión | Qué se adoptó |
| --- | --- | --- |
| D17 | Dato de violencia | Homicidios del INEGI 2022-2024 por municipio, con la etiqueta por estado (ver arriba). Es contexto: no entra al semáforo |
| D18 | Cortes del semáforo | Rojo = 20 % de municipios de mayor riesgo; amarillo = el 20 % siguiente; verde = el resto |
| D19 | Escenario "con campaña dirigida" | No se estiman efectos de campañas. Se muestran las personas en juego: primerizos de 2024, jóvenes de 21 a 29 años que no votaron y nuevos votantes de 2027 |

### Hallazgos principales

> **Cifras superadas.** Son anteriores a la corrección de usos y costumbres fuera de Oaxaca y al ensamble
> (D21). Las vigentes están en la entrada "Modelo final (ensamble) y prueba en elecciones presidenciales".

- **Rojo:** 495 municipios con 26.2 millones de personas en la lista. 281 son "rojos firmes"
  (probabilidad de rojo de 70 % o más).
- **Dos historias en el rojo:**
  - 408 municipios sin elección local ese día (Oaxaca de usos y costumbres, Veracruz y Durango), con
    6.7 millones de personas;
  - 87 que sí eligen ayuntamiento pero votan poco siempre (Tijuana, Juárez, Mexicali, Reynosa,
    Hermosillo y otras), con 19.5 millones de personas.
- **Personas en juego en rojo:** 650 mil primerizos de 2024, 3.1 millones de jóvenes de 21 a 29 años
  que no votaron y 1.2 millones de nuevos votantes en 2027.
- **Incertidumbre honesta:**
  - el intervalo de cada municipio usa los errores reales de la validación, no solo el bootstrap;
  - probado de una elección a otra, cubrió entre 85 % y 92 %;
  - la probabilidad de rojo está bien calibrada al predecir 2021 y es optimista al predecir 2015, por
    eso se simula con los errores de las dos validaciones.
- **Corrección de lectura:** en `riesgo_2027.parquet`, `percentil_riesgo` = 0 es el de **mayor**
  riesgo. Para el mapa se usa `posicion_riesgo` = 100 − percentil (100 = mayor riesgo).

### Siguiente paso

**Paso 6 · Mapa y prueba con Jorge (26 a 28 de octubre):** cargar `resultados-1.0` en la aplicación.
Los cambios frente a la muestra 0.3 están en el notebook 05, sección 6.

---

## 2026-10-20 · Prueba final: otras fuentes de datos e importancia de variables

**Evidencia:** `notebooks/04b_fuentes_adicionales_e_importancia.ipynb`. También se agregó al notebook 03b
(sección 7) y al reporte J (R8) el matiz de la pobreza.

- **18 variables nuevas, con hipótesis escritas antes de probarlas:** censos completos del INEGI (religión,
  empleo, jefatura femenina, estado civil, discapacidad, bienes de la vivienda, analfabetismo, viviendas
  deshabitadas), electores por casilla (INE) y densidad de población.
- **12 son estables** frente a lo que la historia no anticipa, pero **solo dos mejoran la predicción en
  las dos validaciones**, y menos de 1 %: la densidad de población y los ocupantes por vivienda. El modelo
  no quedó corto de información.
- **Gradient boosting**, con o sin las variables nuevas, se equivoca mucho más que Huber (7.3 contra 5.5
  pp al predecir 2021).
- **Importancia por permutación:** pesan la historia del municipio (de 5.6 a 7 pp), las elecciones
  locales el mismo día y usos y costumbres (de 2.9 a 3.8 pp) y, como conjunto, las sociales y económicas
  (de 1.5 a 1.9 pp). La violencia y la competencia política casi no pesan.
- **La pobreza, con más detalle:** fuera de Oaxaca los más pobres votan más; dentro de Oaxaca, menos,
  por el régimen de usos y costumbres. Los municipios sin casilla son más pobres, pero como alerta el
  antecedente es más preciso.

### Pendiente de decisión

| # | Decisión | Opciones | Recomendación |
| --- | --- | --- | --- |
| D20 | ¿Agregar la densidad y los ocupantes por vivienda al modelo? | (a) dejar el modelo como está; (b) agregarlas y volver a correr los notebooks 04 y 05 | **(a).** La mejora es real pero menor al 1 % y no cambia el semáforo de forma visible. *Actualizado abajo: con el calendario corregido se suma el % de católicos.* |

---

## 2026-10-20 · Otros modelos, lo que el modelo no ve y corrección del calendario

**Evidencia:** `notebooks/04b_fuentes_adicionales_e_importancia.ipynb`, secciones 5 a 10. La corrección
está en el notebook 03 y en `data/reference/municipios_sni_fuera_oaxaca.csv`.

### Corrección de datos (error encontrado)

- **7 municipios fuera de Oaxaca eligen por sistemas normativos indígenas** y no votan ayuntamiento por
  partidos en la jornada: Oxchuc (Chiapas), Ayutla de los Libres y Ñuu Savi (Guerrero), Cherán (Michoacán),
  Coatetelco, Xoxocotla y Hueyapan (Morelos). El calendario los marcaba con ayuntamiento el mismo día.
  - La nota del INE ya estaba en `elecciones_locales_concurrentes.csv`, pero no se aplicaba al municipio.
  - Se encontró al revisar los casos atípicos del modelo.
  - Cada caso está verificado en documentos de los institutos electorales locales o del INE (tabla de
    referencia con cita y fuente). Cherán 2015 y 2018 se apoyan en una fuente académica.
  - Para 2027, donde no hay documento oficial todavía, se usa el régimen de 2024.
- **Efecto:** la validación del modelo no cambia; esos 7 municipios suben de riesgo en 2027. El rojo
  queda con 495 municipios y 25.6 millones de personas (antes 26.2): 414 sin elección municipal ese día
  (6.8 millones) y 81 que sí la tienen (18.8 millones). Cambiaron de color 10 municipios en el límite.

### Otros tipos de modelo

- Se compararon 14 candidatos con la misma validación: lineales (Huber, ridge, lasso, elastic net), árbol
  de decisión, random forest, extra trees, gradient boosting, red neuronal, SVR, vecinos cercanos y tres
  ensambles. Los hiperparámetros se eligieron con validación cruzada dentro de la elección de entrenamiento.
- **Ganador con la regla del notebook 04: el ensamble Huber + random forest.** Error promedio de 5.74
  contra 6.03 de Huber; baja el error en las dos validaciones fuera del ruido (−0.17 y −0.41 pp); pierde
  1.7 puntos de acierto en el 20 % de mayor riesgo al predecir 2021.
- El árbol de decisión, la red neuronal, gradient boosting, SVR y vecinos cercanos son peores que Huber.

### Lo que el modelo no ve

- El estado explica el 28 % del error del modelo y el distrito, del 41 % al 44 %. Ese efecto **no se
  repite** entre elecciones (−0.46): es coyuntura de cada elección.
- **Gasto de campaña** de diputaciones federales (INE, fiscalización; 2018 y 2021): el de 2021 no explica
  el error por distrito (0.05, intervalo con el cero). El de 2018 tiene una relación débil (−0.15) que no
  se puede validar con 2015: queda como pista.
- **Celular y computadora** dicen lo mismo que internet. **COVID:** no hay efecto aparte de la urbanización.
- **Redes sociales:** no existe dato municipal (la ENDUTIH es estatal; la publicidad política de Meta da
  rangos y requiere token; la de Google existe para México desde 2024).

### Decisiones (Sofía Ordaz, 20 de octubre de 2026)

| # | Decisión | Qué se adoptó |
| --- | --- | --- |
| D20 (actualizada) | ¿Agregar densidad, ocupantes por vivienda o % de católicos? | **No.** Mejoran menos de 1 % |
| D21 | ¿Cambiar el modelo de Huber al ensamble Huber + random forest? | **Sí.** Gana con la regla de selección fijada antes y mejora en las dos validaciones; Huber sigue sirviendo para explicar qué pesa |

---

## 2026-10-20 · Modelo final (ensamble) y prueba en elecciones presidenciales

**Evidencia:** `notebooks/04_modelo_riesgo_2027.ipynb` (ahora con el ensamble), `notebooks/04b_fuentes_adicionales_e_importancia.ipynb`
(sección 10) y `notebooks/05_semaforo_y_mapa.ipynb`.

- **D21 aplicada.** El notebook 04 agrega random forest y el ensamble a los candidatos; con la misma regla de
  selección gana el ensamble. Aprendiendo de 2015 y prediciendo 2021:
  - error centrado de 5.32 pp (Huber 5.49; regla simple 6.03);
  - ponderado por personas, 4.30 (Huber 4.68; regla simple 6.80);
  - acierto en el 20 % de mayor riesgo, 70 % (Huber 72 %; regla simple 67 %).

  Al predecir 2015 el error baja 35 % frente a la regla simple. El orden de riesgo casi coincide con el de
  Huber (correlación de rangos de 0.997); 54 municipios cambian de estar o no en rojo.
- **Probabilidad de rojo con el ensamble:** razonable en el rango medio, optimista en los extremos (al
  predecir 2021, cuando dice 80 % fue 71 %). Se documenta que 80 % o más se lee como "probable".
- **Semáforo 2027 con el ensamble:**
  - rojo: 495 municipios con 23.8 millones de personas; 287 rojos firmes;
  - 413 sin elección municipal ese día (6.3 millones de personas);
  - 82 con elección municipal pero participación baja de siempre (17.5 millones de personas).
  - personas en juego en rojo: 583 mil primerizos de 2024, 2.9 millones de jóvenes de 21 a 29 años que no
    votaron, 1.1 millones de nuevos votantes en 2027 y 319 mil de ellos sin credencial si se repite 2021.
- **Prueba en presidenciales (2012, 2018 y 2024), además de las intermedias:**
  - solo elegir ayuntamiento el mismo día y usos y costumbres son estables en las 5 elecciones;
  - 10 variables son estables con signo opuesto: miden qué tan sensible es el municipio al ciclo, por ejemplo
    densidad, % de 65 años o más y % católicos;
  - 19 funcionan solo en intermedias y 4 solo en presidenciales (migración y remesas);
  - 9 no son estables.

  Confirma las variables que usa el modelo; no se quita ni se agrega ninguna.

### Pendiente

- ~~**Archivos del mapa para Jorge**~~ **Decidido (20 de octubre):** `data/processed/mapa/resultados-1.0/` se
  sube al repo (excepción en `.gitignore`), para que la aplicación use siempre la versión que generan los
  notebooks y cada cambio quede en el historial. Son resultados por municipio, sin datos crudos ni de personas.

---

## 2026-10-20 · Estructura del mapa y escenario con intervención

**Hallazgo:** las bases piden comparar al menos un escenario sin intervención y otro con intervención
hipotética (ver `docs/requisitos.md`). `resultados-1.0` solo trae `intervencion = "ninguna"` (D19).

### Decisiones (Sofía Ordaz, 20 de octubre de 2026)

| # | Decisión | Qué se adoptó |
| --- | --- | --- |
| D22 | Escenario con intervención | Sí, como cálculo aritmético en los municipios en rojo, con la etiqueta "supuesto, no efecto medido". No cambia D19: no se estima el efecto de una campaña. En el mapa se compara sin intervención contra los tres supuestos juntos (ver abajo) |
| D23 | Estructura del mapa | Dos pestañas separadas: **Pronóstico 2027** (semáforo, escenario nacional, sin/con intervención y ficha con intervalo y probabilidad de rojo) e **Indicadores y contexto** (qué se elige en 2027, rezago persistente, zonas frías y calientes, personas en juego, alerta "sin casilla", seguridad e historia). Los filtros son comunes; cada pestaña tiene sus propias tarjetas |

Fuera del mapa: paquetes perdidos (pocos casos y fácil de leer como acusación), brecha de género (va al
reporte como gráfica nacional) y calidad del dato (marcas en la ficha, no vista).

Guía para Jorge, con columnas, categorías, cifras de control y reglas de lectura: `docs/vistas-mapa.md`.

### Escenario con intervención aplicado: `resultados-1.1`

**Evidencia:** `notebooks/05_semaforo_y_mapa.ipynb`, sección 5b.

Tres supuestos, solo en los 495 municipios en rojo. La participación con intervención es (votos previstos
+ votos adicionales) / (lista 2024 + nuevos en la lista). Para contar quién sale del rojo se usa la línea
fija del semáforo sin intervención.

| Supuesto | Qué suponemos | Votos adicionales | Rojos que salen (nivel medio) |
| --- | --- | ---: | ---: |
| S1 · Retener a los primerizos | La generación de 18 a 20 años de 2024 no cae más que su municipio (en 2021 cayó 6.1 pp más) | 80 mil | 20 |
| S2 · Cerrar la mitad de la brecha joven | Los de 20 a 29 años recortan a la mitad su brecha de 2021 con el municipio | 295 mil | 66 |
| S3 · Credencializar a los nuevos | Los nuevos sin credencial la tramitan y votan como los de 18 y 19 años de su municipio en 2021 | 130 mil | 8 |
| **Los tres juntos (escenario del mapa)** | | **505 mil** | **88 (4.7 M de personas)** |

- **Con los tres supuestos, 407 de los 495 rojos siguen en rojo.** El rojo típico sube 1.65 pp, y está
  5.5 pp por debajo de la línea.
- **Credencializar suma votos, pero no sube la tasa** (+0.03 pp), porque las personas nuevas también entran
  a la lista. Sirve para incluir a más gente.
- **En el país, el efecto es de +0.36 pp.**
- **Mensaje para el reporte:** las campañas para jóvenes ayudan, pero no compensan la falta de elección
  municipal en la mayoría de los rojos.

**Lo nuevo en `resultados-1.1`:**
- 6 escenarios por municipio: 3 niveles nacionales, sin y con intervención;
- columnas `interv_*` con lo que suma cada supuesto en cada municipio;
- columna `usos_y_costumbres` (425 municipios: 418 de Oaxaca y 7 fuera).

Las columnas y los escenarios sin intervención son idénticos a los de la 1.0. La carpeta
`resultados-1.0` se quita del repo; queda en el historial de git.
