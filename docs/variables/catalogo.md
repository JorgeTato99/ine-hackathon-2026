# Catálogo de variables

Cada variable con su fuente, el año que se usa para cada elección, cómo se transformó y qué resultó.
Resumen y reglas en [README.md](README.md).

**Cómo leer las columnas**

- **Año usado:** dato que alimenta la predicción de 2015 / 2021 / 2027. Siempre es anterior a la elección.
- **ρ 2015, ρ 2021:** correlación de Spearman con lo que la historia no anticipa (la intermedia menos lo
  que se espera por la presidencial anterior). Positiva = el municipio votó más de lo esperado.
- **Estable:** mismo signo y distinta de cero (intervalo de 95 %) en las dos intermedias.
- **Mejora:** al agregarla al modelo, el error baja en las dos validaciones, fuera del ruido (D20).
- **Estado:** ✅ en el modelo · 🟡 se relaciona pero no entró · ⚪ sin relación útil · 🔵 se usa para otra
  cosa (alerta, contexto o personas en juego) · ⛔ excluida a propósito.

Todas las variables se unen por `cvegeo` y se reconstruyen con el territorio municipal de 2024 (D6).
Si falta un valor, el modelo usa la mediana.

---

## 1 · En el modelo final: 34 variables

### Historia del municipio (INE)

| Variable | Fuente | Año usado | Transformación | ρ 2015 | ρ 2021 | Estado |
| --- | --- | --- | --- | ---: | ---: | --- |
| `desviacion_presidencial` | Conteos Censales de Participación Ciudadana (CCPC) y actas por casilla | 2012 / 2018 / 2024 | Participación del municipio (votó / (votó + no votó)) menos la nacional, en puntos. Si los conteos no bastan, sale de las actas (D3) | base | base | ✅ |
| `desviacion_intermedia_previa` | CCPC y actas | 2009 / 2015 / 2021 | Igual, en la intermedia anterior | — | — | ✅ |
| `vecinos_desviacion_presidencial` | CCPC y límites municipales del INEGI | 2012 / 2018 / 2024 | Promedio de `desviacion_presidencial` de los municipios que comparten frontera o vértice (contigüidad Queen) | 0.03 | 0.06 | ✅ (no estable) |

### Elecciones locales el mismo día y usos y costumbres

| Variable | Fuente | Año usado | Transformación | ρ 2015 | ρ 2021 | Estado |
| --- | --- | --- | --- | ---: | ---: | --- |
| `ayuntamiento_mismo_dia_intermedia` | Calendarios de los OPLE e informes del INE (`data/reference/elecciones_locales_concurrentes.csv`) | 2015 / 2021 / 2027 | 1 si el municipio elige ayuntamiento ese día; 0 en municipios de usos y costumbres | 0.66 | 0.44 | ✅ estable |
| `gobernador_mismo_dia_intermedia` | Ídem | 2015 / 2021 / 2027 | 1 si el estado elige gubernatura ese día | 0.53 | 0.24 | ✅ estable |
| `diputacion_local_mismo_dia_intermedia` | Ídem | 2015 / 2021 / 2027 | 1 si el estado elige congreso local ese día | — | — | ✅ |
| `ayuntamiento_mismo_dia_presidencial` | Ídem | 2012 / 2018 / 2024 | Igual, en la presidencial anterior | — | — | ✅ |
| `gobernador_mismo_dia_presidencial` | Ídem | 2012 / 2018 / 2024 | Igual | — | — | ✅ |
| `diputacion_local_mismo_dia_presidencial` | Ídem | 2012 / 2018 / 2024 | Igual | — | — | ✅ |
| `es_sni` | IEEPCO, catálogo 2025, y fuentes de los OPLE para 7 municipios fuera de Oaxaca | Régimen de cada año | 1 si elige por sistemas normativos indígenas | −0.08 | −0.34 | ✅ estable |

### Lista nominal (INE)

| Variable | Fuente | Año usado | Transformación | ρ 2015 | ρ 2021 | Estado |
| --- | --- | --- | --- | ---: | ---: | --- |
| `pct_rural` | CCPC | 2012 / 2018 / 2024 | % de la lista en secciones rurales (`TIPOSEC = R`) | 0.14 | 0.18 | ✅ estable |
| `pct_hombres` | CCPC | Ídem | % de hombres en la lista | 0.22 | 0.29 | ✅ estable |
| `pct_20_29` | CCPC | Ídem | % de la lista de 20 a 29 años | −0.07 | −0.07 | ✅ estable |
| `pct_65_mas` | CCPC | Ídem | % de la lista de 65 años o más | 0.23 | 0.13 | ✅ estable |
| `crecimiento_lista` | CCPC | 2009→2012 / 2015→2018 / 2021→2024 | Lista de la presidencial entre lista de la intermedia anterior, menos 1, en % | −0.19 | −0.16 | ✅ estable |
| `cobertura_lista_20mas` | CCPC y CONAPO (proyecciones por edad y sexo) | 2012 / 2018 / 2024 | Lista de 20 años o más entre población de 20 años o más, mismo sexo y grupo de edad, en % | 0.29 | 0.20 | ✅ estable |

### Políticas (INE, cómputos)

| Variable | Fuente | Año usado | Transformación | ρ 2015 | ρ 2021 | Estado |
| --- | --- | --- | --- | ---: | ---: | --- |
| `margen_presidencial` | Cómputos distritales por casilla | 2012 / 2018 / 2024 | Diferencia entre el primer y el segundo lugar, por candidatura (coaliciones sumadas), en % | 0.01 | −0.33 | ✅ (no estable) |
| `partidos_efectivos_presidencial` | Ídem | Ídem | 1 / suma de los cuadrados de las proporciones de votos por candidatura | −0.14 | 0.27 | ✅ (no estable; cambia de signo) |

### Sociales y económicas

| Variable | Fuente | Año usado | Transformación | ρ 2015 | ρ 2021 | Estado |
| --- | --- | --- | --- | ---: | ---: | --- |
| `escolaridad_promedio` | INEGI, censos | 2010 / 2020 / 2020 | Grado promedio de escolaridad | −0.20 | −0.16 | ✅ estable |
| `pct_habla_lengua_indigena` | INEGI, censos | Ídem | % de 3 años o más que habla lengua indígena | −0.09 | −0.16 | ✅ estable |
| `pct_viviendas_internet` | INEGI, censos | Ídem | % de viviendas con internet | −0.08 | −0.11 | ✅ estable |
| `pct_residia_otra_entidad_hace5` | INEGI, censos | Ídem | % de 5 años o más que vivía en otro estado 5 años antes | −0.25 | −0.13 | ✅ estable |
| `pct_residia_otro_pais_hace5` | INEGI, censos | Ídem | % que vivía en otro país 5 años antes | 0.21 | 0.01 | ✅ (no estable) |
| `poblacion_log` | INEGI, censos | Ídem | Logaritmo de la población total | −0.10 | −0.08 | ✅ estable |
| `pct_pobreza` | CONEVAL, pobreza municipal | 2010 / 2020 / 2020 | % en pobreza | 0.01 | −0.01 | ✅ (no estable) |
| `pct_pobreza_extrema` | CONEVAL | Ídem | % en pobreza extrema | 0.04 | −0.02 | ✅ (no estable) |
| `pct_carencia_salud` | CONEVAL | Ídem | % con carencia de acceso a salud | −0.13 | −0.14 | ✅ estable |
| `pct_rezago_educativo` | CONEVAL | Ídem | % con carencia por rezago educativo | 0.22 | 0.20 | ✅ estable |
| `marginacion` | CONAPO, índice de marginación | 2010 / 2020 / 2020 | Índice con el signo invertido: más alto = menos marginado | 0.13 | 0.08 | ✅ estable |
| `pct_localidades_menos_5000` | CONAPO | Ídem | % de la población en localidades de menos de 5,000 habitantes | 0.15 | 0.10 | ✅ estable |
| `pct_viviendas_emigrantes` | CONAPO, intensidad migratoria | 2010 / 2020 / 2020 | % de viviendas con emigrantes a Estados Unidos | 0.17 | −0.00 | ✅ (no estable) |
| `pct_viviendas_remesas` | CONAPO | Ídem | % de viviendas que reciben remesas | 0.25 | 0.03 | ✅ (no estable) |
| `pct_viviendas_retorno` | CONAPO | Ídem | % de viviendas con migrantes de retorno | 0.21 | 0.01 | ✅ (no estable) |
| `homicidios_100mil_log` | INEGI, defunciones por homicidio, y CONAPO | 2012–2014 / 2018–2020 / 2022–2024 | Homicidios por 100 mil habitantes al año en los 3 años previos; logaritmo de (1 + tasa) | 0.12 | 0.05 | ✅ estable (casi no pesa) |

**Importancia en el modelo** (notebook 04b): historia, 5.6 a 7 puntos; elecciones locales y usos y
costumbres, 2.9 a 3.9; lista y sociales y económicas juntas, 1.5 a 1.8; políticas y violencia, casi cero.

---

## 2 · Probadas al final, no agregadas: 18 variables (notebook 04b, 20 de octubre, D20)

| Variable | Fuente | Año usado | Transformación | ρ 2015 | ρ 2021 | Estable | Mejora en las dos | Estado |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
| `densidad_log` | INEGI, censos, y área de los límites municipales | 2010 / 2020 | Logaritmo de habitantes por km² | −0.30 | −0.19 | sí | sí, −0.05 y −0.04 pp | 🟡 |
| `tasa_participacion_economica_mujeres` | INEGI, ITER | 2010 / 2020 | % de mujeres de 12 años o más económicamente activas | −0.19 | −0.18 | sí | no | 🟡 |
| `pct_viviendas_radio` | ITER | Ídem | % de viviendas con radio | −0.21 | −0.13 | sí | no | 🟡 |
| `tasa_participacion_economica` | ITER | Ídem | % de 12 años o más económicamente activa | −0.20 | −0.13 | sí | no | 🟡 |
| `electores_por_casilla` | INE, actas y CCPC | 2012 / 2018 / 2024 | Lista entre número de casillas con acta | −0.18 | −0.14 | sí | no | 🟡 |
| `pct_catolica` | ITER | 2010 / 2020 | % de población católica | 0.22 | 0.08 | sí | sí, −0.05 y −0.003 pp | 🟡 |
| `pct_casados_12mas` | ITER | Ídem | % casados de 12 años o más | 0.08 | 0.19 | sí | no | 🟡 |
| `pct_analfabetismo` | ITER | Ídem | % de 15 años o más que no sabe leer ni escribir | 0.15 | 0.12 | sí | no | 🟡 |
| `pct_sin_religion` | ITER | Ídem | % sin religión | −0.16 | −0.10 | sí | no | 🟡 |
| `pct_discapacidad_limitacion` | ITER | Ídem | % con discapacidad o limitación | 0.20 | 0.06 | sí | no | 🟡 |
| `pct_viviendas_deshabitadas` | ITER | Ídem | % de viviendas deshabitadas | 0.17 | 0.07 | sí | no | 🟡 |
| `pct_hogares_jefatura_femenina` | ITER | Ídem | % de hogares con jefatura femenina | −0.13 | −0.09 | sí | no | 🟡 |
| `promedio_ocupantes_vivienda` | ITER | Ídem | Ocupantes por vivienda | 0.00 | −0.06 | no | sí, −0.001 y −0.03 pp | ⚪ |
| `pct_solteros_12mas` | ITER | Ídem | % solteros de 12 años o más | 0.01 | −0.20 | no | no | ⚪ |
| `pct_viviendas_automovil` | ITER | Ídem | % con automóvil | 0.07 | 0.01 | no | no | ⚪ |
| `pct_viviendas_telefono_fijo` | ITER | Ídem | % con teléfono fijo | 0.00 | −0.06 | no | no | ⚪ |
| `pct_desocupacion` | ITER | Ídem | % desocupados | 0.08 | −0.02 | no | no | ⚪ |
| `pct_viviendas_tv` | ITER | Ídem | % con televisión | −0.03 | 0.03 | no | no | ⚪ |

Mejora medida con Huber de 34 variables, el modelo vigente ese día. Ninguna se agregó (D20): mejoran
menos de 1 % y el modelo ya capta esa información con población, lo rural, la escolaridad y la pobreza.

---

## 3 · Probadas el 22 de octubre: 39 variables

Mismo método. Detalle y conclusiones en [cambios-y-pruebas.md](cambios-y-pruebas.md).

| Variable | Fuente | Año usado | Transformación | ρ 2015 | ρ 2021 | Estable | Mejora en las dos | Estado |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
| `brecha_escolaridad_hombres_mujeres` | INEGI, censos | 2010 / 2020 | Escolaridad de hombres menos la de mujeres | −0.23 | −0.22 | sí | no | 🟡 |
| `pct_ocupantes_sin_drenaje_ni_sanitario` | CONAPO, marginación | 2010 / 2020 | % | 0.25 | 0.15 | sí | no | 🟡 |
| `pct_poblacion_60_mas` | INEGI, censos | 2010 / 2020 | % de la población de 60 años o más | 0.19 | 0.10 | sí | Huber sí; ensamble no | 🟡 |
| `pct_no_asiste_escuela_6_14` | CONEVAL, rezago social | 2010 / 2020 | % de 6 a 14 años que no asiste a la escuela | 0.09 | 0.18 | sí | no | 🟡 |
| `pct_sin_afiliacion_salud` | INEGI, censos | 2010 / 2020 | % sin afiliación a servicios de salud | −0.13 | −0.17 | sí | no | 🟡 |
| `pct_sin_derechohabiencia_salud` | CONEVAL, rezago social | 2010 / 2020 | % sin derechohabiencia | −0.13 | −0.17 | sí | no | 🟡 |
| `pct_poblacion_hogares_indigenas` | INEGI, censos | 2010 / 2020 | % de la población en hogares indígenas | −0.10 | −0.17 | sí | no | 🟡 |
| `sesnsp_secuestro_ene_may_log` | SESNSP | ene–may 2015 / 2021 | Carpetas por 100 mil, anualizadas; logaritmo de (1 + tasa) | −0.10 | −0.14 | sí | no | 🟡 (no existe para 2027 antes de mayo de 2027) |
| `sesnsp_feminicidio_ene_may_log` | SESNSP | Ídem | Ídem | −0.12 | −0.13 | sí | no | 🟡 (ídem) |
| `pct_ocupantes_sin_energia_electrica` | CONAPO | 2010 / 2020 | % | 0.08 | 0.11 | sí | no | 🟡 |
| `pct_poblacion_18_24` | INEGI, censos | 2010 / 2020 | % de la población de 18 a 24 años | −0.10 | −0.09 | sí | no | 🟡 |
| `pct_nacida_otra_entidad` | INEGI, censos | 2010 / 2020 | % nacida en otro estado | −0.10 | −0.09 | sí | no | 🟡 |
| `pct_viviendas_sin_refrigerador` | CONEVAL, rezago social | 2010 / 2020 | % | −0.08 | −0.07 | sí | no | 🟡 |
| `pct_ocupados_hasta_2_salarios_minimos` | CONAPO | 2010 / 2020 | % de ocupados que gana hasta 2 salarios mínimos | 0.06 | 0.07 | sí | no | 🟡 |
| `pct_votos_nulos_presidencial` | INE, cómputos por casilla | 2012 / 2018 / 2024 | Votos nulos entre votos totales, casillas básicas, contiguas y extraordinarias, en % | 0.20 | 0.07 | sí | no | 🟡 |
| `vulnerable_carencias_pct` | CONEVAL, pobreza | 2010 / 2020 | % vulnerable por carencias sociales | 0.12 | 0.07 | sí | **sí, también en el ensamble** (−0.07 y −0.02 pp) | 🟡 (no se agrega, D26) |
| `carencia_seguridad_social_pct` | CONEVAL, pobreza | 2010 / 2020 | % | 0.09 | 0.06 | sí | Huber sí; ensamble no | 🟡 |
| `pct_viviendas_sin_lavadora` | CONEVAL, rezago social | 2010 / 2020 | % | −0.09 | −0.06 | sí | no | 🟡 |
| `indice_rezago_social` | CONEVAL | 2010 / 2020 | Índice | 0.07 | 0.05 | sí | no | 🟡 |
| `vulnerable_ingreso_pct` | CONEVAL, pobreza | 2010 / 2020 | % vulnerable por ingreso | −0.14 | −0.05 | sí | no | 🟡 |
| `no_pobre_no_vulnerable_pct` | CONEVAL, pobreza | 2010 / 2020 | % ni pobre ni vulnerable | −0.10 | −0.03 | no | **sí, también en el ensamble** (−0.07 y −0.03 pp) | 🟡 (no se agrega, D26) |
| `pct_viviendas_hacinamiento` | CONAPO | 2010 / 2020 | % de viviendas con hacinamiento | −0.00 | −0.01 | no | Huber sí; ensamble no | ⚪ |
| `sesnsp_extorsion_ene_may_log` | SESNSP | ene–may 2015 / 2021 | Carpetas por 100 mil, logaritmo | −0.03 | −0.13 | no | no | ⚪ |
| `sesnsp_electorales_ene_may_log` | SESNSP | Ídem | Ídem | 0.06 | −0.10 | no (cambia de signo) | no | ⚪ |
| `sesnsp_homicidio_doloso_ene_may_log` | SESNSP | Ídem | Ídem | 0.05 | 0.02 | no | no | ⚪ |
| `pct_ocupantes_piso_tierra` | CONAPO | 2010 / 2020 | % | −0.02 | −0.09 | no | no | ⚪ |
| `carencia_alimentacion_pct` | CONEVAL | 2010 / 2020 | % | 0.22 | −0.05 | no (cambia de signo) | no | ⚪ |
| `pct_no_sabemos_presidencial` | INE, CCPC | 2012 / 2018 / 2024 | % de la lista sin dato de si votó | −0.06 | 0.03 | no | no | ⚪ |
| `brecha_joven_presidencial` | INE, CCPC | 2012 / 2018 / 2024 | Participación de 20 a 29 años menos la del municipio | 0.24 | 0.03 | no | no | ⚪ |
| `cambio_homicidios_log` | INEGI, homicidios | Trienio previo contra el anterior | Diferencia de logaritmos de las tasas | −0.03 | −0.02 | no | no | ⚪ |
| `remesas_usd_por_habitante_log` | Banxico | 2014 / 2020 / 2025 | Dólares por habitante, logaritmo de (1 + valor) | 0.15 | 0.02 | no | no | ⚪ |
| `ingreso_inferior_lpi_pct` | CONEVAL | 2010 / 2020 | % con ingreso inferior a la línea de pobreza | −0.02 | −0.02 | no | no | ⚪ |
| `pobreza_moderada_pct` | CONEVAL | 2010 / 2020 | % | −0.08 | 0.02 | no | no | ⚪ |
| `indice_intensidad_migratoria` | CONAPO | 2010 / 2020 | Índice | 0.22 | −0.02 | no | no (empeora mucho al predecir 2021) | ⚪ |
| `carencia_calidad_vivienda_pct` | CONEVAL | 2010 / 2020 | % | 0.07 | −0.02 | no | no | ⚪ |
| `tres_o_mas_carencias_pct` | CONEVAL | 2010 / 2020 | % | 0.10 | −0.02 | no | no | ⚪ |
| `pct_ocupantes_sin_agua_entubada` | CONAPO | 2010 / 2020 | % | −0.00 | 0.01 | no | no | ⚪ |
| `pct_viviendas_migrantes_circulares` | CONAPO | 2010 / 2020 | % | 0.09 | 0.01 | no | no | ⚪ |
| `carencia_servicios_basicos_vivienda_pct` | CONEVAL | 2010 / 2020 | % | 0.07 | −0.00 | no | no | ⚪ |

Para 2027 se usan los datos de 2020 (censo, CONEVAL y CONAPO), los últimos publicados por municipio.

### Base nueva: elecciones de ayuntamiento (Magar, ITAM)

| Variable | Fuente | Año usado | Transformación | ρ 2015 | ρ 2021 | Estable | Mejora en las dos | Estado |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
| `part_local_ultima_vs_estado` | Magar, `elecRetrns` | Última elección de ayuntamiento antes de cada intermedia | Votos totales entre lista nominal, menos la mediana de su estado en esa elección | 0.14 | 0.13 | sí | **sí, también en el ensamble** (−0.08 y −0.08 pp) | 🟡 (no se agrega, D26) |
| `brecha_local_federal_hist` | Magar e INE | Elecciones de ayuntamiento no concurrentes anteriores | Promedio de participación local menos la federal anterior más cercana; solo unos 1,360 municipios | 0.31 | 0.16 | sí | no | 🟡 |
| `margen_local_ultimo` | Magar | Última elección de ayuntamiento | Margen de victoria, en % | −0.00 | −0.02 | no | no | ⚪ |

Juntas, las tres que mejoran por separado (dos de CONEVAL y la de Magar) ya no mejoran en las dos validaciones.

---

## 4 · Otras exploradas

| Variable | Fuente | Qué encontramos | Estado |
| --- | --- | --- | --- |
| Gasto de campaña de diputaciones federales por distrito | INE, fiscalización 2018 y 2021 | Con el error del modelo por distrito: 2021, 0.05 (intervalo con el cero); 2018, −0.15. Queda como pista | ⚪ |
| Muertes por COVID antes de la elección de 2021 | INEGI, defunciones | Sin efecto propio, una vez que se considera lo urbano | ⚪ |
| Viviendas con celular y con computadora | INEGI, censos | Estables, pero dicen lo mismo que internet, que ya está en el modelo | ⚪ |
| No tener policía municipal | INEGI, CNGMD 2025 | No va con votar menos, salvo por los municipios de usos y costumbres. Solo existe para 2025 | 🔵 contexto |
| Antecedente de falta de casillas | INE, CCPC y actas | Estuvo en la primera versión del modelo: aprendía de 4 municipios que se recuperaron y producía resultados absurdos. Correlación con lo que la historia no anticipa: 0.04 y −0.01 | ⛔ alerta aparte (D12) |
| Antecedente de paquete perdido | INE, actas | Ningún caso antes de 2015 y 16 antes de 2021; correlación −0.01 | ⚪ |
| Composición por edad y sexo de la lista | INE, CCPC | Explica menos del 1 % de las diferencias entre municipios: sirve para saber a quién dirigirse, no dónde | 🔵 personas en juego |

## 5 · Se usan para otra cosa, no para predecir

| Dato | Uso | Columnas en `municipios.csv` |
| --- | --- | --- |
| Antecedente de falta de casillas | Alerta "sin casilla" (D12) | `alerta_sin_casilla`, `ultima_eleccion_sin_casilla` |
| Primerizos, jóvenes que no votaron, nuevos votantes, credencialización, brecha joven | Personas en juego y supuestos S1 a S3 (D19, D22) | `primerizos_votaron_2024`, `jovenes_21_29_no_votaron_2024`, `nuevos_votantes_2027`, `brecha_jovenes_2024`, `interv_*` |
| Zonas frías y calientes (LISA) | Vista de contexto | `zona_participacion_2024` |
| Rezago persistente | Vista de contexto | `elecciones_por_debajo_del_pais` |
| Homicidios recientes, quién ejerce la seguridad, justicia cívica, cifra oculta, comparación INEGI–SESNSP | Contexto de seguridad (D17) | `tasa_homicidios_2022_2024`, `quien_ejerce_seguridad`, `tiene_policia_municipal`, `justicia_civica`, `cifra_oculta_estatal_2025`, `comparacion_homicidios_inegi_sesnsp` |
