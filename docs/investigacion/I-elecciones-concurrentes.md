# I · Elecciones locales el mismo día que la federal, 2009–2027

Investigación del 19 de octubre de 2026. Sirve para las variables del modelo "¿qué se eligió localmente el mismo día?" (paso 3, `notebooks/03_historia_y_variables.ipynb`, sección 5).

## Datos que produce

- `data/reference/elecciones_locales_concurrentes.csv`
  - 224 filas: 32 entidades × 7 elecciones (2009 a 2027).
  - Columnas: gubernatura, diputaciones locales y ayuntamientos (`si`/`no`), nota y fuente.
  - Si la entidad tuvo elección local ese año pero en otra fecha, se marca `no` y la fecha se anota en `nota`.
- `data/reference/oaxaca_municipios_sni.csv`
  - Los 418 municipios de Oaxaca que eligen por sistemas normativos indígenas (usos y costumbres), con su clave INEGI.

## Resumen: entidades con elección local el mismo día

| Elección | Gubernatura | Diputaciones locales | Ayuntamientos | Fuente principal |
| --- | ---: | ---: | ---: | --- |
| 2009 | 6 | 11 | 11 | Reseña académica (*Convergencia*, UAEM), artículo de la entonces consejera presidenta del IEDF (*Sufragio*) e IEEM |
| 2012 | 7 | 15 | 15 | IFE, *Proceso Electoral Federal 2012. 50 preguntas esenciales* |
| 2015 | 9 | 16 | 16 | INE, proyecto de acuerdo de casilla única (2014), corregido para Chiapas con un informe del INE de 2015 |
| 2018 | 9 | 27 | 25 | INE, *Some relevant aspects of the 2017-2018 Federal and Concurrent Electoral Process* |
| 2021 | 15 | 30 | 30 | INE/UTVOPL, informe de calendarios PEL 2020-2021 |
| 2024 | 9 | 31 | 30 | INE, informe de seguimiento PEL 2023-2024 (Consejo General, 31-07-2024) |
| 2027 | 17 | 31 | 30 | INE, página oficial Elecciones 2027 (mapa por entidad) |

## Verificado por nosotros

Además del trabajo del agente de investigación, comprobamos en los documentos:

- **Gubernaturas de los años presidenciales:**
  - **2012:** Chiapas, Distrito Federal, Guanajuato, Jalisco, Morelos, Tabasco y Yucatán (IFE, p. 10-11).
  - **2018:** Chiapas, Ciudad de México, Guanajuato, Jalisco, Morelos, Puebla, Tabasco, Veracruz y Yucatán (INE, cuadro "Governorships · 9").
  - **2024:** los mismos 9 que en 2018 (informe del INE de 2024: "Chiapas, Guanajuato, Jalisco, Morelos, Puebla, Tabasco, Veracruz y Yucatán [...] Gubernaturas y la Jefatura de Gobierno en la Ciudad de México").
- **2024:** diputaciones locales en 31 entidades (excepto Coahuila) y ayuntamientos en 30 (Durango y Veracruz no tuvieron), según el mismo informe del INE.
- **Chiapas 2015 no fue concurrente.** El informe del INE sobre Chiapas dice: "El 19 de julio de 2015 se renovaron los siguientes cargos locales".
- **2027:** la página oficial del INE (https://ine.mx/voto-y-elecciones/elecciones-2027/, consultada el 19-10-2026) desglosa los cargos de cada entidad.
  - Coahuila solo elige presidencias municipales.
  - Durango y Veracruz solo eligen diputaciones.
  - Hidalgo y Morelos eligen diputaciones y ayuntamientos, sin gubernatura.
  - Total: 17 gubernaturas, 31 congresos y 30 entidades con ayuntamientos. Esto cierra el pendiente del reporte G.
- **Lista SNI de Oaxaca:** la tabla del IEEPCO tiene exactamente 418 filas, numeradas del 1 al 418 sin repetir. Coincide con el texto oficial: 418 municipios por SNI y 152 por partidos, que suman 570.

## Elección judicial: no coincide con 2027

La reforma judicial de 2024 programaba la segunda elección de jueces para 2027, junto con la federal. Una reforma constitucional la movió a 2028: la aprobaron la Cámara de Diputados (26 de mayo de 2026) y el Senado (28 de mayo de 2026), y el DOF la publicó el 2 de junio de 2026. La página oficial del INE sobre 2027 tampoco menciona una elección judicial.

Fuentes (prensa; el texto del DOF no lo consultamos directamente):

- Proceso, 3 de junio de 2026: https://www.proceso.com.mx/nacional/2026/6/3/publican-en-el-dof-las-nuevas-reformas-judiciales-electorales-entran-en-vigor-este-miercoles-376301.html
- Infobae, 29 de mayo de 2026: https://www.infobae.com/mexico/2026/05/29/senado-aprueba-mover-eleccion-de-jueces-a-2028-y-da-luz-verde-a-reeleccion-de-magistrados-del-tepjf/
- N+: https://www.nmas.com.mx/politica/senado-aprueba-en-lo-general-la-reforma-que-posterga-eleccion-judicial-a-2028/

## Casos especiales que usa el modelo

1. **Oaxaca, sistemas normativos indígenas (418):** no eligen ayuntamiento en la jornada constitucional, sino en asambleas y fechas propias.
   - San Baltazar Chichicápam entró a ese régimen en 2024 (acuerdo IEEPCO-CG-SNI-73/2024), así que hasta 2024 se trata como municipio de partidos. Con eso quedan 417, la cifra que usa el INE en 2021.
   - El catálogo es de 2025. **No reconstruimos los cambios de régimen anteriores**: es una aproximación para 2009–2021.
2. **Hidalgo 2021:** no hubo elección ordinaria de ayuntamientos, pero Acaxochitlán e Ixmiquilpan tuvieron elección extraordinaria el mismo 6 de junio.
3. **Chiapas 2024:** Chicomuselo, Pantelhó y Capitán Luis Ángel Vidal eligieron ayuntamiento en una extraordinaria el 25 de agosto, no el 2 de junio.
4. **Colima 2015:** la gubernatura se votó el 7 de junio, aunque el Tribunal Electoral la anuló después (SUP-JRC-678/2015). Ese día sí hubo elección de gobernador, así que se marca `si`.
5. **Chiapas 2012 sí fue concurrente.** El IFE y la sentencia SUP-JRC-118/2012 fijan el 1 de julio; un informe del Congreso de EE. UU. de mayo de 2012 traía una fecha distinta, ya superada.
6. **Cherán (Michoacán), Oxchuc (Chiapas) y Ayutla de los Libres (Guerrero)** también eligen por sistemas normativos, según la tabla del INE de 2021. **No se aplican como excepción en el modelo** porque no tenemos documentado desde qué año. Cherán y Oxchuc ya están en la alerta de "no hubo casilla" (D12).

## Lo que queda débil

| Caso | Situación |
| --- | --- |
| 2009: diputaciones locales de Jalisco, Morelos y la Asamblea del DF | Solo Wikipedia y el total académico de 433 diputados locales |
| 2009: Coahuila y Tabasco votaron lo local el 18-10-2009 | Solo fuentes no oficiales. En cualquier caso, no fue concurrente |
| 2012 y 2015 | Las fuentes son previas a la jornada (lo que se iba a votar). No hay confirmación posterior por entidad, salvo Chiapas |
| 2009, 2012 y 2015 | No se revisó si las entidades sin elección concurrente votaron en otra fecha. Eso no cambia la variable "el mismo día" |

## Lo que encontramos con estos datos (paso 3)

- **Corrección al paso 2:** el contraste de 2012 a 2015 (−4.3 contra −17.6 puntos) no era solo efecto del gobernador. Era sobre todo tener o no tener **alguna** elección local ese día. En 2015, 15 estados no tuvieron ninguna.
- **La transición de 2024 a 2027 tiene la misma estructura que la de 2018 a 2021.** Los 6 estados sin gobernador ni en 2024 ni en 2027 (Coahuila, Durango, Hidalgo, Estado de México, Oaxaca y Tamaulipas) ya estaban en el grupo que casi no se movió en 2021. Ver el notebook 03, sección 5.

## Fuentes

**Oficiales**

- IFE (2012), *Proceso Electoral Federal 2012. 50 preguntas esenciales*, p. 10-11: https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/171938/50_preguntas_esenciales_REM_2012.pdf
- Tribunal Electoral, SUP-JRC-118/2012: https://te.gob.mx/media/SentenciasN/pdf/Superior/SUP-JRC-0118-2012.pdf
- INE, proyecto de acuerdo de casilla única 2015: https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/133334/20140811_1_E_Acuerdo_CasillaUnica.pdf
- INE, informe de coordinación con el IEPC Chiapas (jornada del 19-07-2015): https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/143390/20150723-O-1-12-26-4-3.pdf
- INE, extraordinaria de Colima del 17-01-2016: https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/164259/20161207-E-1-24-6-4-4.pdf
- INE, *Some relevant aspects of the 2017-2018 Federal and Concurrent Electoral Process*: https://ine.mx/essential-questions/
- INE/UTVOPL, informe de calendarios PEL 2020-2021: https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/119202/InformePEL2020-2021.pdf
- INE, informe de seguimiento PEL 2023-2024 (CG 31-07-2024): https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/175818/CGor202407-31-ip-10.pdf
- INE, Elecciones 2027: https://ine.mx/voto-y-elecciones/elecciones-2027/
- IEEM (2009), elecciones locales del 5 de julio de 2009: https://publicaciones.ieem.org.mx/index.php/publicacionesieem/catalog/download/173/162/696?inline=1
- IEEPCO, catálogo SNI 2024-2025 (tabla): https://www.ieepco.org.mx/cat-info/dictamenes-sni2025
- IEEPCO, presentación del catálogo 2024-2025: https://www.ieepco.org.mx/archivos/SNI_CATALOGO2025/presenta_catsni25.pdf
- IEEPCO, acuerdos IEEPCO-CG-SNI-17/2025, 09/2022 y 33/2018: https://www.ieepco.org.mx/archivos/acuerdos/2025/IEEPCO_CG_SNI_17_2025.pdf · https://www.ieepco.org.mx/archivos/acuerdos/2022/IEEPCOCGSNI092022.pdf · https://www.ieepco.org.mx/archivos/acuerdos/2018/IEEPCOCGSNI332018.pdf
- IEEPCO, dictámenes de San Juan Mixtepec (145 y 301) y San Pedro Mixtepec (330), usados para asignar la clave INEGI correcta: https://www.ieepco.org.mx/archivos/SNI_CATALOGO2025/145_SAN_JUAN_MIXTEPEC.pdf · https://www.ieepco.org.mx/archivos/SNI_CATALOGO2025/301_SAN_JUAN_MIXTEPEC.pdf · https://www.ieepco.org.mx/archivos/SNI_CATALOGO2025/330_SAN_PEDRO_MIXTEPEC.pdf
- INEGI, catálogo geoestadístico: https://gaia.inegi.org.mx/wscatgeo/v2/mgem/20208

**Académicas**

- García Reyes, C. U. (2010), reseña de *Los estados en el 2009*, *Convergencia* 54, UAEM: https://convergencia.uaemex.mx/article/download/1171/2689/
- Zavala Pérez, B. C. (2009), "Elecciones coincidentes", *Sufragio*: https://revistas-colaboracion.juridicas.unam.mx/index.php/sufragio/article/download/22118/19715

**Otras (solo para orientarse)**

- El Siglo de Torreón, 19-01-2009: https://www.elsiglodetorreon.com.mx/noticia/2009/ven-dificil-empatar-elecciones-en-coahuila.html
- Congressional Research Service, *Mexico's 2012 Elections* (23-05-2012): https://www.everycrsreport.com/files/20120523_R42548_1e1cfef7432bc2ae0c04feb6c70393ff90cb5bbb.html
- Wikipedia (español e inglés), elecciones estatales de 2009.
