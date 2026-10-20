# K · Catálogo de patrones e indicadores para el mapa

Documento vivo. Cada patrón encontrado en el proyecto que pueda servir al INE como **vista del mapa** o **alerta** por zona. Se indica de dónde sale, qué tan firme es y cómo se mostraría.

**Firmeza:** **verificado** (datos o fuente oficial) · **indicio** (lo muestran los datos, con límites) · **hipótesis** (por comprobar).

| # | Indicador | Qué muestra | Fuente | Firmeza | Vista o alerta propuesta |
| --- | --- | --- | --- | --- | --- |
| K1 | **Riesgo de abstención 2027** | Participación esperada sin intervención | Modelo (paso 4) | Pendiente | Vista principal: semáforo por municipio |
| K2 | **Participación histórica** | Participación por municipio y elección, 2009–2024 | Conteos censales, actas | Verificado | Vista con selector de año |
| K3 | **Desviación frente al país** | Municipios que votan siempre por debajo del promedio | Panel municipal | Verificado | Vista "rezago persistente" (por debajo del país en 4 o más de 6 elecciones) |
| K4 | **Parte de la lista sin casilla** | Gente que no tuvo dónde votar (36 municipios; 12 recurrentes) | Actas vs. conteos | Verificado | **Alerta "sin casilla"**: recurrente (2+ elecciones) o antecedente (1) |
| K5 | **Paquete no recibido** | Paquetes perdidos o quemados (27 municipio-elección) | Actas | Verificado | Alerta de conflicto electoral |
| K6 | **Secciones que no cuadran con el acta** | Dos fuentes oficiales no coinciden | Actas vs. conteos | Verificado | Capa de calidad del dato (no es acusación) |
| K7 | **Crecimiento atípico de la lista** | Crecimiento muy por encima del normal; casi todo urbano | Conteos censales (paso 2, reporte E) | Verificado | Vista de crecimiento; alerta solo si además hay salto de participación |
| K8 | **Participación sospechosamente alta** | Más de 85 % y 15 puntos sobre su nivel típico (D5) | Panel | Verificado | Capa de "participación atípica" |
| K9 | **Elecciones locales el mismo día en 2027** | Gobernador, ayuntamientos y congreso | INE (reporte I) | Verificado | Capa de contexto: los 6 estados sin gubernatura ni en 2024 ni en 2027 |
| K10 | **Brecha joven** | Participación de 20 a 29 años menos la total | Conteos por edad | Verificado | Vista para la intervención: dónde la brecha es mayor |
| K11 | **Primerizos que se pierden** | Caída de la generación primeriza en la intermedia siguiente: −11.7 puntos en el municipio típico (2018 → 2021), y mayor que la del total en el 90.6 % de los municipios | Conteos por edad | Verificado | Vista de retención del votante joven: tamaño de la generación de 2024 por municipio |
| K12 | **Brecha de género** | Mujeres menos hombres, por edad | Conteos por edad | Verificado | Vista para la intervención |
| K13 | **Elección presidencial muy desigual** | Margen grande y menos participación en la intermedia: se vio en 2018 → 2021, **no** en 2012 → 2015 | Actas | Descartado como regla general | Solo como capa de contexto |
| K14 | **Usos y costumbres (Oaxaca)** | 418 municipios que no eligen ayuntamiento el mismo día | IEEPCO | Verificado | Capa de contexto |
| K15 | **Lista mayor que la población residente** | La lista nominal supera a la población proyectada del mismo grupo de edad y sexo (112 % en el municipio típico) | INE + CONAPO | Verificado, pero mezcla emigración, registros antiguos y error de proyección | Capa de calidad del padrón, por edad y sexo. **No** usar como alerta de abstención |
| K16 | **Violencia** | Homicidios, extorsión y delitos electorales por 100 mil habitantes | INEGI / SESNSP | Verificado: **no** anticipa la falta de casillas (AUC ≈ 0.5); la extorsión y los delitos electorales anticipan un poco menos participación | Capa de contexto; no sirve como alerta de casillas |
| K17 | **Marginación, pobreza y escolaridad** | Contexto social | CONAPO, CONEVAL, INEGI | Pendiente | Capas de contexto para explicar el porqué |
| K18 | **Intensidad migratoria** | Hogares con emigrantes o remesas; donde hay más, se vota menos (−0.27) | CONAPO, Banxico | Verificado | Capa de contexto que explica parte del rezago |
| K19 | **Zonas frías y calientes** | Clusters LISA de baja o alta participación (372 bajo-bajo y 328 alto-alto en 2024) | Panel + fronteras INEGI | Verificado | Vista "zonas frías": regiones, no municipios aislados |
| K20 | **Rezago persistente** | Por debajo del país en las 6 elecciones (264 municipios) | Panel | Verificado | Vista y filtro "siempre por debajo" |
| K21 | **Municipios sin elección municipal el mismo día en 2027** | Usos y costumbres (418 en Oaxaca), Durango y Veracruz | IEEPCO + INE | Verificado; su efecto es un indicio fuerte (R6) | Capa de riesgo de contexto |
| K22 | **Jóvenes sin credencial** | % de la generación de 18 y 19 años que no está en la lista (31 % en el municipio típico) | Lista INE + Censo 2020 | Verificado | **Vista de intervención: credencialización antes de 2027** |
| K23 | **Caída de las ciudades escolarizadas en 2021** | Municipios grandes y con más escolaridad que cayeron más de lo esperado | Censo + panel | Indicio (un periodo) | Capa analítica para el reporte |
