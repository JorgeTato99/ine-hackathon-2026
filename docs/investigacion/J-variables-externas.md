# J · Variables externas: plan, hipótesis y resultados

Paso 3b. Documento vivo: se actualiza conforme avanza el trabajo. Primero se escriben el plan y lo que esperamos encontrar, **antes de ver los datos**; después, lo que encontramos, aunque contradiga lo esperado.

**Pregunta del reto:** "¿Qué zonas podrían presentar mayor abstención en el futuro si no se interviene?"

**Para qué sirven las variables externas:**

1. **Predecir mejor**, si aportan algo que la historia del municipio no tiene.
2. **Explicar el porqué**, para que las recomendaciones al INE sean accionables.
3. **Diseñar la intervención:** a quién, por qué canal y dónde.
4. **Construir alertas** para el mapa: indicadores que el INE pueda vigilar por zona.

**Dónde está el código.** Los análisis se hicieron primero con scripts exploratorios de trabajo (citados abajo como `scratchpad/p3b/...`), que no están en el repositorio. Lo que se usa en el proyecto está reproducido en `notebooks/03b_variables_externas_y_patrones.ipynb` y `notebooks/04_modelo_riesgo_2027.ipynb`. Las fuentes se descargan con `scripts/externos/` (ver `docs/fuentes-externas.md`). Cuando una cifra del notebook difiere de la de este reporte, vale la del notebook, que ya tiene integradas las actas de 2009–2015.

## Reglas de trabajo

- **Comparar cosas equiparables:**
  - el mismo municipio (territorio de 2024, clave INEGI);
  - el año más cercano a cada elección;
  - cuando se pueda, **el mismo grupo de edad y sexo**. Por ejemplo, la lista de hombres de 20 a 24 contra la población de hombres de 20 a 24, y no totales contra totales.
- **Cada fuente con su URL, fecha de consulta y huella digital del archivo.** Si algo no se puede verificar, se dice.
- **Una variable entra al modelo solo si mejora la validación fuera de muestra** (D14). Si no, puede servir para explicar o para el mapa.
- **No se nombran personas ni se acusa.** Se dice "lista mayor que la población residente", nunca "turismo electoral" ni "fraude".

## Fuentes y variables planeadas

| # | Fuente | Variables | Años | Hipótesis | Qué esperamos |
|---|---|---|---|---|---|
| E1 | **INEGI, censos 2010 y 2020, y Encuesta Intercensal 2015** (por municipio) | Población por edad y sexo; escolaridad; lengua indígena; internet; población nacida en otra entidad | 2010, 2015, 2020 | La escolaridad sube la participación. Más hablantes de lengua indígena se asocia a la organización comunitaria y a la falta de casillas | Escolaridad: correlación positiva y moderada con la participación, pero casi nula con lo que la historia no anticipa |
| E2 | **CONAPO, proyecciones de población por municipio, edad y sexo** | Población por grupo de edad y sexo en cada año electoral (2018, 2021, 2024 y 2027) | 2015–2030 | **Cobertura de la lista = lista / población del mismo grupo de edad y sexo.** Si pasa de 100 %, en la lista sigue gente que ya no vive ahí (sobre todo migrantes) y la participación sale baja aunque los residentes sí voten. Si es baja en jóvenes, faltan jóvenes con credencial | Municipios de alta migración con cobertura de 100 % o más, sobre todo en hombres de 25 a 44 años. Cobertura baja en el grupo de 18 a 19 años |
| E3 | **CONAPO, índices de marginación e intensidad migratoria** | Índices municipales | 2010, 2015, 2020 | La migración explica la parte de la abstención que no es desinterés | Intensidad migratoria: correlación negativa con la participación y con lo que la historia no anticipa (comprueba la hipótesis de % hombres del paso 3) |
| E4 | **CONEVAL, pobreza municipal** | % en pobreza y pobreza extrema; rezago social | 2010, 2015, 2020 | La pobreza se asocia a menos participación urbana, pero en zonas rurales la movilización local puede compensarlo | Relación débil o no lineal; posible interacción con lo rural |
| E5 | **SESNSP e INEGI (defunciones por homicidio)** | Homicidios por 100 mil habitantes, por municipio y año | 2010–2025 | La violencia baja la participación y explica dónde no se instalan casillas | Más homicidios antes de la elección: más riesgo de origen A (sin casilla) y menos participación |
| E6 | **Actas del INE** (ya descargadas) | Competitividad: diferencia entre el primer y el segundo lugar | 2018, 2021, 2024 | Donde la elección está reñida se vota más | Correlación negativa entre margen y participación |
| E7 | **Conteos censales del INE** (ya descargados) | Participación por grupo de edad y sexo; envejecimiento de la lista; brechas por edad | 2009–2024 | El cambio en la estructura por edad mueve la participación del municipio | Municipios que envejecen suben; los que tienen más jóvenes recién credencializados bajan |

## Cómo se va a analizar

1. **Limpieza y cruce:** todo a clave INEGI de 2024 y al año más cercano a cada elección. Se revisan valores faltantes y extremos.
2. **Correlaciones:**
   - con la **participación**;
   - con la **desviación** frente a la nacional;
   - con **lo que la historia no anticipa** (el residuo de 2021 dado 2018).

   Se usan Pearson y Spearman (por rangos, más robusta a extremos), ponderadas y sin ponderar por la lista. Los intervalos de confianza se calculan con bootstrap.
3. **Por grupos de edad y sexo:** cobertura de la lista contra participación del mismo grupo.
4. **Redundancia entre variables:** matriz de correlaciones y componentes principales (PCA). Muchas variables socioeconómicas dicen casi lo mismo, y conviene saberlo antes de modelar.
5. **Patrones para el mapa:** cada hallazgo útil se anota en el catálogo de indicadores (reporte K) como posible vista o alerta para el INE.

## Resultados

### R1 · Participación por edad y sexo (conteos censales, 2009–2024) — verificado

Tabla nueva: `data/processed/lista_edad_sexo_municipal.parquet` (municipio con territorio de 2024 × elección × sexo × grupo quinquenal; D10 aplicado). Script: `scratchpad/p3b/edad.py`.

- **Efecto "primera vez":** en todas las elecciones, las personas de 18 y 19 años votan más que las de 20 a 29. En 2024, los hombres de 18 y 19 votaron 52.7 % y los de 25 a 29, 40.6 %.
- **El mínimo de la vida está entre los 25 y los 29 años.** En 2024, los hombres de 25 a 29 votaron 40.6 %, el valor más bajo de todos los grupos.
- **Las mujeres votan más que los hombres hasta los 60 años.** La brecha más grande está entre los 25 y los 34 (unos 13 puntos en 2024). Desde los 65 votan más los hombres.
- **Los mayores votan cada vez más:** el grupo de 65 a 69 años pasó de 59 % (2009) a 76.5 % (2024).

### R2 · Generaciones: el votante primerizo se pierde en la siguiente elección — verificado

Script: `scratchpad/p3b/cohorte.py` (edad desplegada, nivel nacional).

| Nacidos en | Primera elección (a los 18) | Siguientes elecciones |
| --- | --- | --- |
| 2000 | 64.8 % (2018) | 42.4 % (2021) · 47.1 % (2024) |
| 2003 | 55.8 % (2021) | 48.9 % (2024, presidencial) |
| 1994 | 66.7 % (2012) | 36.7 % (2015) · 52.1 % (2018) · 39.6 % (2021) · 50.3 % (2024) |

- **A los 18 años se vota mucho; tres años después se cae entre 7 y 30 puntos**, aunque la siguiente sea presidencial (generación 2003).
- **Después, cada generación sube despacio con la edad.**
- **Para 2027:** los primerizos de 2024 (61.5 % a los 18) tendrán 21 años. Si el patrón se repite, su participación caerá. **Idea de intervención:** retener al votante primerizo, no solo motivar al nuevo.

### R3 · La estructura por edad y sexo no explica las diferencias entre municipios — verificado

Script: `scratchpad/p3b/composicion.py`. Para cada municipio calculamos su participación **esperada** si cada grupo de edad y sexo votara como el promedio nacional de ese grupo. La diferencia contra la real es el **efecto del lugar**.

- **La estructura por edad y sexo explica menos del 1 % de la variación entre municipios** en 2015, 2018, 2021 y 2024. Su efecto va de −2 a +2 puntos.
- **Casi toda la diferencia es efecto del lugar**, y ese efecto se repite: 2018 anticipa el 73 % del efecto del lugar de 2021.
- **Consecuencia:** para predecir **dónde** se vota menos sirven las características del lugar (migración, pobreza, violencia, política local), no la pirámide de edades. La edad sí sirve para **diseñar a quién** dirigir la campaña.

### R4 · Competitividad electoral (actas del INE) — no se repite en otro periodo (ver R13)

Script: `scratchpad/p3b/competitividad.py`.

- **Medidas:**
  - **margen:** diferencia entre el primer y el segundo lugar, en % de los votos;
  - **número efectivo de partidos.**
- **Cómo se agrupan los votos:**
  - **2018 y 2024:** por candidatura presidencial, con los archivos oficiales de candidaturas del INE. Cada coalición y sus combinaciones suman para su candidatura.
  - **2021 (diputaciones):** en bloques fijos por coalición nacional. Es una **aproximación**, porque en algunos distritos los partidos fueron por separado.
- **Resultados:**
  - Margen típico: 28.0 puntos (2018), 21.9 (2021) y 48.9 (2024).
  - Relación con la desviación del mismo año: débil (de −0.02 a −0.22).
  - **El margen de 2018 anticipa parte de lo que la historia no explica de 2021:**
    - Spearman −0.32, con intervalo de confianza de 95 % por bootstrap de −0.36 a −0.28.
    - Ponderado por lista, −0.35; sin Oaxaca, −0.26; controlando por lo rural, −0.30.
    - El R² de 2021 con 2018 sube de 0.714 a 0.740.
  - **De 2021 a 2024 no aparece** (−0.01).
- **Lectura posible, no verificada:** donde la presidencial fue muy desigual, la movilización de ese año no se repitió en la intermedia.
- **Para 2027 importa:** el margen de 2024 fue el más alto de los tres (48.9 puntos típicos).
- **Pendiente:** probarlo en 2012 → 2015, para lo que hacen falta las actas por casilla de 2012.


### R5 · La abstención se agrupa en el territorio — verificado

Script: `scratchpad/p3b/espacial.py`. Usa las fronteras municipales del INEGI y la vecindad tipo "reina" (municipios que comparten frontera o vértice).

- **Índice de Moran de la desviación:** 0.52 (2018), 0.53 (2021) y 0.55 (2024), con p = 0.001. Es un agrupamiento fuerte: los municipios se parecen a sus vecinos.
- **Lo que la historia no anticipa también se agrupa** (0.42). Eso apunta a efectos regionales o estatales, como las elecciones locales, más que a contagio entre vecinos: agregar el promedio de los vecinos en 2018 casi no mejora la predicción de 2021 (R² de 0.715 a 0.717).
- **Zonas frías de 2024** (LISA bajo-bajo: municipios de baja participación rodeados de baja participación, p < 0.05): 372 municipios en la primera versión, y 371 después de integrar las actas de 2009–2015 (notebook 03b). Oaxaca tiene 231; Michoacán, 38; Durango, 24; Chihuahua, 16; Jalisco, 15; y Guanajuato, 13 (cifras de la primera versión).
- **Zonas calientes de 2024** (alto-alto): 328 municipios en la primera versión y 337 en la final. Yucatán tiene 101; Puebla, 65; Tlaxcala, 40; Chiapas, 25; y Sonora, 23 (primera versión).
- **Rezago persistente:** 264 municipios votaron por debajo del país en las seis elecciones en la primera versión, y **285** en la final. Son más porque, con las actas de 2009–2015, más municipios tienen las seis elecciones con dato. En la primera versión, 702 lo hicieron en cuatro o más y 344 quedaron 5 o más puntos por debajo en cuatro o más.

### R6 · Oaxaca: elegir ayuntamiento el mismo día sube la participación federal — indicio fuerte

Participación federal (ponderada por lista) de los municipios de Oaxaca, según cómo eligen a sus autoridades municipales:

| Elección | Municipios de partidos | Municipios de usos y costumbres | Brecha | ¿Los de partidos eligen ayuntamiento ese día? |
| --- | ---: | ---: | ---: | --- |
| 2009 | 42.4 % | 37.7 % | 4.7 | no |
| 2012 | 63.1 % | 55.6 % | 7.5 | no |
| 2015 | 41.4 % | 39.6 % | 1.8 | no |
| 2018 | 69.9 % | 57.8 % | 12.1 | sí |
| 2021 | 62.8 % | 42.1 % | 20.7 | sí |
| 2024 | 64.3 % | 48.2 % | 16.1 | sí |

(Cifras finales del notebook 03b, con las actas de 2009–2015 integradas; cambian en décimas respecto de la primera versión.)

- **Mientras ningún municipio de Oaxaca elegía ayuntamiento el mismo día que la federal, la brecha era de 2 a 8 puntos.** Desde 2018, cuando los de partidos empezaron a hacerlo, subió a 12–21 puntos. La más grande fue en la intermedia de 2021.
- **Es una comparación antes y después dentro de un mismo estado**, la evidencia más limpia que tenemos del efecto de la elección municipal. No es un experimento: pudieron cambiar otras cosas en esos años.
- **Para 2027:** los 418 municipios de usos y costumbres no tendrán elección municipal el mismo día. Son la mayoría de las zonas frías de R5. La variable `ayuntamiento_mismo_dia` por municipio debe entrar al modelo.

### R7 · El votante primerizo se pierde en casi todos los municipios — verificado

Script: `scratchpad/p3b/primerizos.py`. Sigue a la generación nacida en 1998–2000 (18 a 20 años en 2018), en la transición presidencial → intermedia de 2018 a 2021, la misma que habrá de 2024 a 2027. Incluye 2,225 municipios, los que tienen al menos 50 personas de esa generación con dato en cada año.

- **Nacional:** esa generación votó 58.4 % en 2018, 41.4 % en 2021 y 47.0 % en 2024.
- **Por municipio:** en el municipio típico cayó 11.7 puntos de 2018 a 2021, **6.1 puntos más que la caída de todo su municipio**. Cayó más que el total en el **90.6 % de los municipios**.
- **Para 2027:** los primerizos de 2024 (nacidos en 2003–2006) estarán en la misma situación. Es un grupo concreto y medible para el escenario de intervención: **retener al votante primerizo**.

### R8 · Pobreza y rezago social (CONEVAL) — verificado; contradice parte de lo esperado

**Datos:** `data/processed/externos/coneval_pobreza_municipal.parquet` (serie comparable 2010–2015–2020) y `coneval_rezago_social.parquet` (2000–2020). El agente comprobó que reproducen el comunicado 016/2021 de CONEVAL, los totales estatales y los grados del índice de rezago social de 2020. La pobreza municipal de 2025 no está publicada todavía.

**Script:** `scratchpad/p3b/cruce.py`, el marco común de cruce. Usa la transición 2018 → 2021 y las variables de 2020, que se conocían antes de la elección. Spearman, con intervalo de confianza de 95 % por bootstrap.

| Variable | Con la desviación de 2021 | Con lo que 2018 no anticipa | IC 95 % | Ponderada por lista |
| --- | ---: | ---: | --- | ---: |
| Margen 1.º – 2.º lugar, 2018 | −0.34 | **−0.32** | [−0.36, −0.29] | −0.35 |
| Número efectivo de partidos, 2018 | 0.22 | **0.27** | [0.23, 0.31] | 0.32 |
| % hombres en la lista | 0.23 | **0.27** | [0.24, 0.31] | 0.34 |
| % con rezago educativo, 2020 | 0.14 | 0.19 | [0.15, 0.23] | 0.41 |
| % lista rural | 0.19 | 0.17 | [0.13, 0.21] | 0.33 |
| % sin acceso a salud, 2020 | −0.19 | −0.13 | [−0.17, −0.10] | −0.22 |
| % en pobreza, 2020 | 0.13 | −0.02 | [−0.05, 0.03] | 0.12 |
| % en pobreza extrema, 2020 | 0.12 | −0.03 | [−0.07, 0.01] | 0.17 |
| Índice de rezago social, 2020 | 0.15 | 0.04 | [0.00, 0.09] | 0.31 |

**Qué significa:**

- **Contra lo que esperábamos (E4), los municipios más pobres no votan menos que el país: votan un poco más** (0.13). Es consistente con que lo rural vota más.
- **La pobreza no ayuda a anticipar lo que la historia no explica:** su correlación con el residuo es prácticamente cero. Sirve para **explicar** el contexto en el mapa, no para predecir.
- **Matiz agregado el 20 de octubre de 2026** (notebook 03b, sección 7): el 0.13 nacional esconde dos relaciones opuestas.
  - **Fuera de Oaxaca, los más pobres votan más** (de 0.26 a 0.44 entre 2018 y 2024).
  - **Dentro de Oaxaca votan menos** (de −0.24 a −0.37). Ahí lo que separa a los municipios es el régimen de usos y costumbres: son más pobres (86.5 % contra 66.6 %) y votan menos en las federales.
  - **Los municipios sin casilla o sin dato son más pobres** (mediana de 81 % a 83 % contra 66.5 %). Pero como alerta, la pobreza marca a demasiados municipios; el antecedente de falta de casillas es más preciso (D12).
- **Las señales más fuertes hasta ahora son políticas:** el margen y el número efectivo de partidos de 2018. Donde hubo competencia, la participación se sostuvo mejor en 2021.
- **Las versiones ponderadas por lista son más altas** para el rezago educativo y el rezago social. La relación es más fuerte en los municipios grandes, lo que sugiere probar **interacciones** con el tamaño o lo urbano en el modelo.

### R9 · Violencia (INEGI y SESNSP) — verificado; contradice lo esperado

**Datos:**

- `inegi_homicidios_municipio.parquet`: homicidios por municipio y año de ocurrencia, 2009–2024. Cuadra exactamente con las cifras publicadas por el INEGI con las causas X85–Y09. 2024 está incompleto entre 2 % y 4 %, por los registros tardíos.
- `sesnsp_delitos_municipio.parquet`: carpetas de investigación por municipio y mes, 2015–2025. Cuadra exactamente con los reportes nacionales del SESNSP.
- **Límites:** en varios estados hay homicidios sin municipio de ocurrencia, sobre todo entre 2017 y 2023. No hay víctimas por municipio antes de 2026.

**Cruce con la participación** (`scratchpad/p3b/cruce.py`, ya con el error de empates corregido; ver nota abajo):

| Variable | Con la desviación de 2021 | Con lo que 2018 no anticipa | IC 95 % |
| --- | ---: | ---: | --- |
| Extorsión, enero a mayo de 2021 (tasa) | −0.17 | **−0.12** | [−0.16, −0.08] |
| Delitos electorales, enero a mayo de 2021 (tasa) | −0.08 | **−0.10** | [−0.13, −0.06] |
| Homicidios 2018–2020 (tasa) | −0.11 | 0.05 | [0.01, 0.09] |
| Homicidio doloso, enero a mayo de 2021 (tasa) | −0.13 | 0.02 | [−0.02, 0.07] |

- **Los homicidios casi no anticipan la participación.** La extorsión y los delitos electorales en los meses previos sí un poco: donde hay más, se vota menos de lo esperado.

**¿La violencia anticipa la falta de casillas (origen A)?** Medimos el AUC: 0.5 equivale a adivinar y 1 a acertar siempre.

| Señal | 2021 (24 municipios sin casilla) | 2024 (17) |
| --- | --- | --- |
| Homicidios en los 3 años previos | 0.59 (p = 0.13) | 0.52 (p = 0.75) |
| Extorsión, enero a mayo | 0.43 | 0.47 |
| Delitos electorales, enero a mayo | 0.50 | 0.54 |
| **Antecedente de lista sin casilla** | — | **El 33 % de los municipios con antecedente repitió en 2024, contra 0.7 % de los demás** |

- **Contra lo que esperábamos (E5), la violencia medida por municipio no anticipa dónde faltan casillas.** Muchos casos son de organización comunitaria (Michoacán, Oaxaca), no de violencia. Los que sí fueron por violencia (Chicomuselo y Pantelhó en 2024) son pocos para que se note en el promedio.
- **La mejor señal para la alerta es el propio antecedente:** 47 veces más probable que el resto. Respalda la propuesta D12.

**Nota de método:** la primera versión del cruce calculaba mal los rangos de Spearman cuando había empates (muchos municipios con 0 delitos), y los intervalos de confianza no contenían al valor central. Se corrigió con rangos promedio (`scipy.stats.rankdata`). Las cifras de CONEVAL y del margen no cambiaron.

### R10 · Migración, marginación y cobertura de la lista (CONAPO y Banxico) — verificado; dos hipótesis refutadas

**Datos** (el agente verificó que las proyecciones suman exactamente el total nacional de CONAPO en los 51 años, y que las remesas suman el total de Banxico):

- `conapo_proyecciones_edad_sexo.parquet`: base 2020, de 1990 a 2040, por sexo y edad quinquenal.
- `conapo_marginacion.parquet`: 2010, 2015 y 2020, método DP2, comparables entre años.
- `conapo_intensidad_migratoria.parquet`: 2010 y 2020. Sus índices no se comparan entre sí; sus porcentajes, sí.
- `banxico_remesas_municipio.parquet`: 2013–2025. Tiene ceros sospechosos que parecen fallas de cobertura, así que solo se usa en promedios.

**Cuidado con el sentido de los índices nuevos de CONAPO (DP2):** un índice **más alto** significa **menos** marginación y **menos** migración. Lo verificamos: el índice migratorio tiene −0.90 de correlación con el % de viviendas con emigrantes.

**Cobertura de la lista, comparando el mismo grupo de edad y sexo** (lista nominal entre población proyectada, de 20 años en adelante; `scratchpad/p3b/cobertura.py`):

- **A nivel nacional, la lista es mayor que la población residente en casi todos los grupos:** de 100 % a 129 %.
- **Los picos** están en los hombres de 40 a 49 años (113–115 %) y en las mujeres de 85 años o más (124–129 %).
- **El municipio típico tiene 112 %** de cobertura (2021).
- **Cobertura y migración:** la cobertura de los hombres de 25 a 44 años tiene 0.40 de correlación con el % de viviendas con emigrantes. Es compatible con personas que se fueron y siguen en la lista.
- **Pero la cobertura no va con menos participación:** 0.19 en municipios urbanos y 0.01 en rurales. Además, al calcular la participación "sobre residentes", el quintil más alto da 87.9 %, una cifra inverosímil.
- **Conclusión:** el exceso de lista mezcla emigración, registros de personas fallecidas (en edades altas) y errores de la proyección de población. **No sirve como medida limpia de "lista inflada por migración"**; la hipótesis E2 queda refutada tal como estaba planteada.

**Cruce con la participación** (transición 2018 → 2021):

| Variable | Con la desviación de 2021 | Con lo que 2018 no anticipa | IC 95 % |
| --- | ---: | ---: | --- |
| % de viviendas con emigrantes a EE. UU., 2020 | **−0.27** | 0.01 | [−0.03, 0.05] |
| % de viviendas que reciben remesas, 2020 | −0.26 | 0.04 | [0.00, 0.08] |
| Remesas por habitante, 2018–2020 (Banxico) | −0.24 | 0.02 | [−0.02, 0.06] |
| Cobertura de la lista de 20 años o más, 2018 | 0.14 | 0.20 | [0.16, 0.24] |
| % sin educación básica, 2020 | 0.08 | 0.14 | [0.10, 0.19] |
| Índice de marginación 2020 (invertido: más alto = más marginación) | 0.20 | 0.08 | [0.04, 0.12] |

- **Donde hay más migración se vota menos (−0.27), pero eso ya está en la historia del municipio:** no ayuda a anticipar lo que 2018 no anticipa. Sirve para **explicar** el mapa, no para mejorar la predicción.
- **La hipótesis de que "% hombres" era una señal de migración queda refutada:** % hombres aporta 0.27 al residuo y la migración, 0.01. Qué capta % hombres sigue sin explicación.
- **Los municipios más marginados votan un poco más que el país**, igual que con la pobreza de CONEVAL (R8).

### R11 · Censo 2020 (INEGI) y credencialización de jóvenes — verificado

**Datos** (el agente verificó totales nacionales, estatales y por edad y sexo, sin diferencias):

- `inegi_municipal_{2010,2015,2020}.parquet`;
- `inegi_edad_sexo.parquet`;
- `inegi_edad_desplegada.parquet`, con la edad año por año en 2010 y 2020.

**Credencialización, misma generación** (`scratchpad/p3b/credencializacion.py`): la lista nominal de junio de 2021 en cada edad, contra la población del censo de marzo de 2020 con un año menos.

- **Solo el 59.5 % de quienes tenían 18 años en 2021 estaba en la lista; a los 19, el 82.4 %.** A partir de los 20, la cobertura pasa de 100 %.
- **Cuidado:** el censo redondea edades (20, 30, 45…), así que por edad simple solo son confiables los 18 y 19 años.
- **En el municipio típico, solo el 68.6 % de la generación de 18 y 19 años tiene credencial**; en el 10 % más bajo, menos del 48.3 %.
- **Votó el 63 % de los de 18 y 19 que estaban en la lista, pero solo el 41 % de toda su generación.**
- **Intervención directa del INE para 2027:** credencializar a quienes cumplirán 18 años antes de la elección. Es otra palanca, distinta de motivar el voto.

**Cruce con lo que 2018 no anticipa de 2021:**

| Variable | Con la desviación | Con el residuo | IC 95 % | Ponderada |
| --- | ---: | ---: | --- | ---: |
| % autoadscripción indígena | 0.02 | −0.18 | [−0.22, −0.14] | 0.07 |
| % habla lengua indígena | 0.01 | −0.17 | [−0.21, −0.13] | 0.13 |
| Escolaridad promedio | −0.12 | −0.15 | [−0.19, −0.12] | −0.40 |
| Credencialización 18–19 | 0.27 | 0.15 | [0.12, 0.20] | −0.04 |
| % que vivía en otra entidad hace 5 años | −0.14 | −0.13 | [−0.17, −0.09] | −0.15 |
| % viviendas con internet | −0.21 | −0.11 | [−0.14, −0.06] | −0.36 |
| % que vivía en otro país hace 5 años | −0.28 | 0.02 | [−0.02, 0.06] | 0.15 |

- **Lo indígena se relaciona con caer más de lo esperado en 2021.** Es muy probable que refleje el caso de Oaxaca y sus municipios de usos y costumbres sin elección municipal ese día (R6). Hay que separarlo en el modelo.
- **Las ciudades más escolarizadas y conectadas cayeron más de lo esperado en 2021** (ponderado: −0.40 y −0.36). La causa no la conocemos.

### R12 · Redundancia, PCA y cuánto aporta todo junto — verificado, con una advertencia importante

**Script:** `scratchpad/p3b/multivariado.py`.

- **Muchas variables dicen lo mismo:** 42 pares tienen |ρ| ≥ 0.8. Por ejemplo, pobreza con ingreso bajo (0.99), escolaridad con % sin educación básica (−0.97), y marginación con rezago social (0.97). Para explicar al INE basta **una por grupo**.
- **PCA** (variables socioeconómicas estandarizadas):
  - **Componente 1** (34 % de la varianza): desarrollo social, con escolaridad de un lado y pobreza, marginación y rezago del otro.
  - **Componente 2** (14 %): migración internacional (remesas, retorno, emigrantes) y lista mayor que la población.
  - **Componente 3** (8 %): tamaño y remesas.
  - Hacen falta 11 componentes para el 80 %.
  - Ninguno anticipa bien lo que la historia no explica (|ρ| ≤ 0.15).

**Validación cruzada dejando fuera un estado a la vez** (el modelo nunca ve el estado que predice). Se predice la desviación de 2021 en 2,433 municipios:

| Modelo | R² fuera de muestra | Error medio | Acierto en el 10 % más bajo |
| --- | ---: | ---: | ---: |
| Solo la historia (desviación 2018) | 0.686 | 5.90 pp | 0.56 |
| + elecciones locales el mismo día (2018 y 2021) | 0.778 | 5.12 pp | 0.60 |
| + margen y número efectivo de partidos 2018 | 0.787 | 4.96 pp | 0.61 |
| **Ridge: historia + todas las variables (47)** | **0.830** | **4.31 pp** | **0.63** |
| Gradient boosting: historia + locales | 0.760 | 5.30 pp | 0.58 |
| Gradient boosting: historia + todas | 0.774 | 4.86 pp | 0.54 |

**Qué significa:**

- **Las elecciones locales del mismo día son la mejora más grande:** el R² sube de 0.69 a 0.78 y el error baja casi 0.8 pp.
- **Juntas, las variables externas suman otro tanto:** R² 0.83 y error de 4.3 pp. Lo que ninguna logra sola, lo logran juntas.
- **Con tan pocos datos (2,400 municipios), el modelo lineal regularizado (ridge) gana al gradient boosting.** Es más estable y más fácil de explicar.

**Advertencia importante:** esta validación es **dentro de un mismo año** (2021). Mide si el modelo generaliza a estados que no vio, **no** si generaliza a otra elección. La prueba que importa para 2027 es **fuera de tiempo**: aprender de 2012 → 2015 y predecir 2018 → 2021 (D15). Para eso hacen falta las variables de esos años (CONEVAL 2010/2015 y marginación 2010/2015 sí existen) y, de preferencia, las actas de 2012 (en descarga). Si las relaciones cambian entre elecciones, el R² real para 2027 será menor que 0.83.

### R13 · Actas oficiales de 2009, 2012 y 2015, y prueba del margen en otro periodo — verificado; el margen NO se repite

**Datos:** `data/processed/externos/actas_{2009,2012,2015}.parquet`, del SICEEF del INE (http://siceef.ine.mx/downloadDB.html). Son resultados de cómputo distrital casilla por casilla, con las decisiones del Tribunal Electoral ya aplicadas.

**Qué verificó el agente:**

- 2015 cruza 1 a 1 con la base oficial de cómputos 2015, con lista nominal idéntica.
- 2009 y 2015 cuadran con los acuerdos del Consejo General (CG426/2009 y CG804/2015), con diferencias de 28 a 68 votos.
- 2012 cuadra distrito por distrito con el cómputo publicado por el IFE. La diferencia de +1,422 votos se explica completa por casillas con decisiones del Tribunal.

**Corrección de un dato mío:** la cifra de votación de 2012 que le di al agente para comparar (50,143,616) la escribí de memoria y **no se pudo confirmar** en ninguna fuente del IFE o INE. No se usa.

**Prueba del margen en 2012 → 2015** (`scratchpad/p3b/margen_2012.py`). Votos por candidatura según la tabla oficial del archivo:

- **El margen típico de 2012 fue de 12.8 puntos**, contra 28.0 en 2018 y 48.9 en 2024.
- **El margen de 2012 no anticipa lo que 2012 no anticipa de 2015:** Spearman 0.02, con IC 95 % de −0.02 a 0.06. El R² no cambia (0.463).
- **El número efectivo de partidos se invierte:** −0.15 en 2015, contra +0.27 en 2021.

**Conclusión:** el efecto del margen de 2018 sobre 2021 (R4) **no es una regla general**; parece propio de esa elección. **No se debe usar como variable del modelo sin más pruebas.** Es justo el riesgo de la advertencia de R12: las relaciones cambian entre elecciones, y por eso la validación que importa es de una elección a otra.

**Para qué más sirven estas actas:**

1. Aplicar la regla de origen A, B y C a 2009, 2012 y 2015. Por ejemplo, el "no sabemos" de 2015 en el boicot magisterial.
2. Hacer la validación fuera de tiempo del paso 4 con más variables.

### R14 · Qué se sostiene en las dos transiciones pasadas — verificado

**Notebook:** `notebooks/03b_variables_externas_y_patrones.ipynb`, sección 5. Para cada variable medimos su correlación con lo que la presidencial no anticipa de la intermedia, en 2012 → 2015 y en 2018 → 2021. Cada transición usa solo información disponible antes de su elección. "Estable" significa mismo signo e IC 95 % sin el 0 en las dos.

| Variable | 2012 → 2015 | 2018 → 2021 | ¿Estable? |
| --- | ---: | ---: | --- |
| Elige ayuntamiento el mismo día | 0.66 | 0.43 | sí |
| Elige gobernador el mismo día | 0.53 | 0.24 | sí |
| Usos y costumbres (Oaxaca) | −0.08 | −0.34 | sí |
| Cobertura de la lista | 0.29 | 0.20 | sí |
| % hombres | 0.22 | 0.29 | sí |
| % con rezago educativo | 0.22 | 0.20 | sí |
| % que vivía en otra entidad hace 5 años | −0.25 | −0.13 | sí |
| % de 65 años o más | 0.23 | 0.13 | sí |
| Escolaridad promedio | −0.20 | −0.16 | sí |
| Crecimiento de la lista | −0.19 | −0.16 | sí |
| % rural | 0.14 | 0.18 | sí |
| % que habla lengua indígena | −0.09 | −0.16 | sí |
| Margen presidencial | 0.01 | −0.33 | **no** |
| Número efectivo de partidos | −0.14 | 0.27 | **no** (cambia de signo) |
| % de viviendas que reciben remesas | 0.25 | 0.03 | **no** |
| % de viviendas con emigrantes | 0.17 | −0.00 | **no** |
| % en pobreza | 0.01 | −0.01 | **no** |

- **Lo más fuerte y estable es lo que se elige localmente el mismo día.** Su fuerza baja en 2021, cuando casi todo el país eligió algo local.
- **Las variables sociales estables son débiles** (|ρ| de 0.1 a 0.3) y redundantes entre sí: 11 pares con |ρ| ≥ 0.8.
- **La migración anticipó bien 2015 y nada en 2021.** Por eso no se debe confiar en ella para 2027.

**Actualización de R9 con las actas de 2009–2015:** al contar los antecedentes de falta de casillas desde 2009, repitió el 20.8 % de los municipios con antecedente en 2021 y el 16.2 % en 2024, contra el 0.5 % y el 0.3 % del resto. La violencia sigue sin anticiparlo: AUC de 0.58 (p = 0.18) y 0.49.
