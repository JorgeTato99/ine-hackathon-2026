# Reporte C · Participación sospechosamente alta

Investigación del 19 de octubre de 2026 con prensa, informes y actas oficiales.

- **Actas presidenciales 2024 (INE):** https://computos2024.ine.mx/20240608_2030_COMPUTOS.zip
- Los scripts de trabajo de esta investigación no están en el repositorio; las cifras que verificamos se reproducen en `notebooks/02_investigacion_datos_raros.ipynb`; las demás son de este reporte y están marcadas como no verificadas por nosotros donde corresponde.
- **Límite:** se agotaron las búsquedas web, así que solo hay prensa para Guerrero. Chiapas, Puebla y Oaxaca se revisaron solo con datos oficiales.

## Resumen

1. **Los altos municipales son reales, no un error de los conteos.** En 2024, la participación de las actas presidenciales casi coincide con la de los conteos:

   | Municipio | Actas | Conteos |
   | --- | ---: | ---: |
   | San Miguel Totolapan | 94.5 % | 92.6 % |
   | San Juan Atzompa | 87.9 % | 87.4 % |
   | Zinacantán | 88.3 % | 86.6 % |

2. **Tres secciones con 100 % no cuadran con sus actas.** Los conteos marcan a todos como "votó", pero el acta tiene menos votos:

   | Sección | Marcados como "votó" en los conteos | Votos en el acta |
   | --- | ---: | ---: |
   | Atoyac 642 | 239 | 123 |
   | Malinaltepec 1704 | 1,044 | 927 |
   | Chiapilla 435 | 846 | 731 |

   No prueba fraude, pero esas secciones no deben entrar al modelo tal cual.
3. **En las secciones de Guerrero con 100 % el voto presidencial fue casi unánime** (82 % a 98 % para PT-PVEM-Morena).
   - En todo el país hay 68 casillas con 95 % o más de participación y 90 % o más para un solo bloque. De ellas, 15 están en San Miguel Totolapan y 10 en Técpan.
   - Fábrica de Periodismo (13 de junio de 2024) reportó casillas "unánimes" en los distritos de Ciudad Altamirano y Zihuatanejo.
4. **No se encontraron denuncias formales, impugnaciones de casillas ni carpetas de la Fiscalía de Delitos Electorales (FISEL) sobre esas secciones.**
   - Sí hay contexto documentado de control criminal en Tierra Caliente y Costa Grande en 2024, sobre todo imposición de candidaturas y voto dirigido.
   - Donde la prensa documenta voto dirigido, la participación fue normal: Cutzamala 58 %, Tlalchapa 61 %, Chilapa 50 %.
5. **Explicación estructural de la mayoría de los altos de 2018 a 2024:** elecciones municipales el mismo día que la federal en municipios pequeños.
   - Veracruz es el caso más claro: sus 9 casos son todos de 2021, cuando eligió ayuntamientos junto con la federal.
   - Mediana de participación de los municipios de Veracruz con menos de 5,000 electores: 71.6 % en 2018, 83.3 % en 2021 y 61.9 % en 2024.

## Casos principales

### Guerrero 2024

- **San Miguel Totolapan:**
  - **Elección municipal muy reñida y de dos opciones:** PRI 7,585 contra PT 4,829 (IEPC Guerrero). Explica buena parte del salto.
    https://www.iepcgro.mx/proceso2024/assets/fdocs/ayuntamiento_por_candidatura.pdf
  - **Contexto regional de control criminal** (Amapola, 23 de julio de 2024) y de imposición de candidatos (Animal Político/Amapola, 10 de enero de 2024).
    https://amapolaperiodismo.com/2024/07/23/tierra-caliente-de-las-balas-a-la-paz-criminal/
  - **Las actas cuadran exacto en las secciones con 100 %** (394 de 394 y 287 de 287), con 98.2 % y 94.4 % para el bloque Morena.
  - **No se encontraron impugnaciones** ni carpetas de la FISEL.
- **Técpan de Galeana:**
  - **Testimonio único de un excandidato:** dice que un grupo armado retuvo a representantes de casilla (Animal Político, 1 de noviembre de 2024).
    https://grupoanimal.mx/estados/tecpan-galeana-guerrero-violencia-crimen-organizado
  - **Sección 2290:** 541 votos para una lista de 540.
  - **Sección 2286:** 623 votos para una lista de 596 (104.5 %).
  - **La elección municipal no fue reñida**, así que no explica estos casos.
- **Malinaltepec, sección 1704:** los conteos marcan 1,044 de 1,044 (incluidas 54 personas de 80 años o más), contra 927 votos en el acta. El municipio votó 68 %, su nivel habitual.
- **Atoyac de Álvarez, sección 642:** los conteos marcan 239 de 239, contra 123 votos en el acta. La sección ya aparece con 100 % en 2018 y 2021.
- **Teloloapan, sección 2416:** el acta cuadra (133 de 133).

### Chiapas (solo datos oficiales)

- **Zinacantán:** voto en bloque opositor, alrededor de 80 % para PAN-PRI-PRD. Es compatible con voto comunitario tsotsil sostenido.
- **Frontera Comalapa, sección 530:** 2,444 personas marcadas como "votó" en los conteos contra 1,775 votos en el acta. Las listas de las dos fuentes no coinciden.
- **Villaflores, secciones 1862 y 1879:** las actas superan la lista nominal (102 %).
- **Chiapilla, sección 435:** 846 marcados como "votó" en los conteos contra 731 votos en el acta.

### Puebla y Oaxaca

- **San Juan Atzompa y La Magdalena Tlatlauquitepec:** las actas confirman los altos. Son municipios diminutos con elección municipal el mismo día.
- **Magdalena Tlacotepec y San Juan Bautista Tlacoatzintepec:** las actas confirman los altos. Falta verificar si eligen por usos y costumbres.

## Patrones

1. **Municipio pequeño con elección municipal el mismo día:** es la explicación dominante fuera de Guerrero y Chiapas.
2. **Yucatán y Campeche votan alto de forma estructural, y con competencia entre partidos.**
3. **Participación alta con voto casi unánime:** casi solo en Guerrero (6.1 por mil casillas) y Chiapas (3.2 por mil).
4. **El control criminal documentado no produce, en general, participación alta.** Se ve en resultados desproporcionados.
5. **Los conteos pueden inflar algunas secciones:** marcan más "votó" que los votos del acta (hipótesis: marcado irregular o error de captura).
6. **Hay secciones que se repiten año con año** (Atoyac 614, Totolapan 2127, Petatlán).

## Recomendación: separar en tres capas

| Capa | Criterio | Qué hacer |
| --- | --- | --- |
| **A. Error o calidad del dato** | Más de 20 % "no sabemos", o los conteos no cuadran con el acta (más de 10 % de diferencia) | Tratar como "sin dato" y documentarlo |
| **B. Estructural legítimo** | Municipios pequeños con elección municipal el mismo día; Yucatán | Conservar. Agregar como variable si ese año hubo elección municipal el mismo día |
| **C. Atípico sin explicar** | 95 % o más de participación con 90 % o más para un solo bloque | Conservar con una marca y probar el modelo con y sin ellos. Mostrarlos con incertidumbre alta |

## Cómo comunicarlo sin acusar

- **Decir** "participación atípica" o "estadísticamente inusual". **Nunca** "fraude", "relleno" ni "coacción".
- **Separar tres niveles en cada afirmación:**
  - el dato;
  - lo que dice la prensa, atribuido;
  - lo que no se encontró (sin denuncias ni impugnaciones).
- **Poner siempre la explicación legítima** junto a la sospecha.
- **Las diferencias entre los conteos y las actas** se plantean como pregunta al INE: "dos fuentes oficiales no coinciden".

## Pendientes

- Prensa sobre Chiapas.
- Catálogo del IEEPCO de municipios que eligen por usos y costumbres.
- Actas de 2018 y 2021, para repetir el cruce.
- Informes de observación electoral 2024.
