# L · Presencia del Estado y qué tan completo es el dato de violencia

**Preguntas:**

1. ¿Existe un dato oficial, por municipio, de dónde el Estado no está presente en materia de seguridad?
2. ¿Qué tan completo es el dato de violencia que usaríamos en el mapa?
3. ¿Hay evidencia de que la inseguridad afecta la organización de la elección?

**Fecha de corte:** 20 de octubre de 2026. Cada cifra de este reporte se comprobó en el documento o en los
datos de la fuente. El análisis está en `notebooks/03b_variables_externas_y_patrones.ipynb`, sección 8.
Los datos se arman con `scripts/externos/fuente_seguridad.py` y `scripts/externos/fuente_violencia.py`.

## Resumen

- **Sí existe un dato municipal oficial:** el Censo Nacional de Gobiernos Municipales (CNGMD) 2025 del
  INEGI, con datos de 2024, dice quién ejerce la seguridad pública en cada uno de los 2,478 municipios.
- **No tener policía municipal no va con votar menos.** Lo que separa a los municipios con cuerpos
  comunales es que casi todos son de usos y costumbres en Oaxaca.
- **El dato de violencia no es igual de completo en todos los estados.** Proponemos usar los homicidios
  del INEGI en el mapa y avisar en cada estado qué tanto difieren las dos fuentes (D17).
- **La inseguridad sí afecta la organización electoral,** pero el INE solo lo publica a nivel nacional
  y reserva el municipio. No se puede mostrar en el mapa municipal.

## 1. Quién ejerce la seguridad pública (CNGMD 2025)

**Fuente:** INEGI, CNGMD 2025, módulo 3 (seguridad pública), datos abiertos y tabulado básico. Es lo
que reporta cada gobierno municipal sobre el 31 de diciembre de 2024.

| Situación en 2024 | Municipios |
|---|---:|
| Institución municipal | 1,573 |
| Institución municipal junto con otras o con cuerpos comunales | 324 |
| Sin policía municipal: cuerpos comunales adscritos al municipio | 400 |
| Sin policía municipal: la ejerce otra institución (estatal o federal) | 91 |
| Sin policía municipal: ninguna institución la ejerce | 23 |
| Sin policía municipal: cuerpos comunales autogestivos | 3 |
| No identificado | 45 |
| No aplica (alcaldías de la Ciudad de México) | 16 |
| Otra situación / no disponible | 3 |

- **Verificación:** las 330 celdas del Cuadro 1 del tabulado (estado por categoría) coinciden con los
  datos abiertos, salvo Tumbiscatío (Michoacán). Los datos abiertos lo ponen en "la ejerce otra
  institución" y el tabulado en "institución municipal"; usamos el dato abierto. El personal (164,224
  policías sin titulares) coincide exacto con el Cuadro 3.
- **Tamaulipas:** sus 43 municipios no tienen policía municipal; la ejerce el estado.
- **Oaxaca:** los 400 municipios con cuerpos comunales adscritos están ahí; 360 son de usos y costumbres.

**Qué encontramos al cruzarlo con la participación:**

- Los 400 municipios con cuerpos comunales votan menos que el país (mediana −7.6 pp en 2024). Pero
  son casi todos de usos y costumbres, que ya votan menos en elecciones federales.
- Fuera de usos y costumbres, los municipios sin policía municipal votaron igual que los demás en 2024
  (4.3 contra 4.5 pp sobre el país). En 2021 votaron más, porque todos eligieron ayuntamiento ese día;
  comparados con los que también lo eligieron, la diferencia no es significativa (p = 0.09).

**Advertencias:**

- "Ninguna institución la ejerce" es lo que reportó el municipio. Incluye, por ejemplo, a la capital de
  Campeche, que también aparece así en el tabulado oficial. No equivale a "zona sin Estado".
- El CNGMD describe 2024. No puede entrar al modelo, que se valida con 2015 y 2021: sería usar
  información del futuro.

**Uso en el mapa:** capa de contexto con las categorías del INEGI tal cual (`quien_ejerce_seguridad`,
`tiene_policia_municipal`, `policias_municipales_por_10mil_habitantes`, `justicia_civica` en
`indicadores_mapa.parquet`). No es una alerta.

## 2. Qué tan completo es el dato de violencia

### Homicidios: INEGI contra SESNSP, por estado

Comparamos los homicidios del INEGI (certificados de defunción, por año y entidad donde ocurrió la
defunción) con las víctimas de homicidio doloso y feminicidio del SESNSP (carpetas de las fiscalías).

- **A nivel nacional casi coinciden de 2019 a 2024:** el INEGI cuenta entre 0.5 % menos y 3.2 % más.
- **Por estado hay diferencias que se repiten.** Decimos que una fuente "cuenta más" cuando, en al
  menos 5 de los 6 años, supera a la otra por más de 5 % (regla propuesta, D17):
  - **el INEGI cuenta más** en Guanajuato, Yucatán, Hidalgo, Estado de México y Tlaxcala;
  - **el SESNSP cuenta más** en Veracruz, Oaxaca, Jalisco, Coahuila y Durango;
  - en los otros 22 estados coinciden.
- No sabemos la causa de cada diferencia. Puede ser el lugar asignado (defunción contra delito) o el
  registro de cada institución.
- **2025 no es comparable todavía.** El INEGI publicó 27,989 defunciones por presunto homicidio
  **registradas** en 2025, como cifra preliminar (comunicado del 3 de agosto de 2026). El SESNSP reporta
  23,612 víctimas de homicidio doloso y 736 de feminicidio. Los datos abiertos del INEGI de 2025, por
  lugar y año de ocurrencia, aún no están publicados.

### Delitos que no se denuncian (ENVIPE 2026)

- En 2025, el **93.4 %** de los delitos no se denunció o no llegó a una carpeta de investigación
  (INEGI, comunicado 50/26). Va de 88.4 % en Aguascalientes a 96.3 % en Veracruz (cuadro 3.3).
- **Solo existe por estado** y **no mide homicidios.** Sirve para avisar que las carpetas del SESNSP de
  extorsión o secuestro son una parte pequeña de lo que ocurre.

### El SESNSP por municipio

Antes de 2026 el SESNSP solo publica **carpetas** por municipio; las víctimas solo por estado. El manual
del nuevo Registro Nacional de Incidencia Delictiva (2026) dice que "amplía la cobertura del registro de
víctimas a nivel municipal".

**Propuesta (D17):** la capa de violencia del mapa usa los homicidios del INEGI por municipio, que no
dependen de la denuncia. Cada estado lleva su etiqueta de comparación de fuentes
(`comparacion_homicidios_inegi_sesnsp`) y su cifra oculta (`cifra_oculta_estatal_2025`). Los delitos que
solo da el SESNSP llevan ese aviso.

## 3. Lo que publica el INE sobre inseguridad y organización electoral

- **Rechazo a ser funcionario de casilla por miedo (2023-2024):** 30,381 personas dieron "miedo a
  participar" como razón, el 1.85 % de los 1,638,932 rechazos en la notificación. Las razones más comunes
  fueron "negativa a participar" (36.82 %) y "no atiende al CAE o SE" (32.05 %). El informe solo da estas
  razones a nivel nacional. Fuente: INE, informe final de la Estrategia de Capacitación y Asistencia
  Electoral 2023-2024 (CGex202407-22-ip-05), Tabla 2.26.
- **Secciones con Estrategias Diferenciadas (SED):** en 2024, 11,191 de las 59,247 problemáticas que
  originaron estas secciones (18.89 %) fueron "zonas de alta inseguridad pública". Fue 19.69 % en 2018 y
  11.25 % en 2021. Fuente: el mismo informe.
- **El INE reserva por 5 años el municipio de esas secciones** (resolución del Comité de Transparencia
  INE-CT-R-0362-2024). Su argumento es que la ciudadanía podría tomar ese dato como razón para no ser
  funcionaria de casilla o no ir a votar. Por eso no se pueden ubicar en el mapa, y no proponemos
  reconstruirlas.

## 4. Evidencia académica que respalda no usar solo homicidios

El estudio "Democracia vulnerada: el crimen organizado en las elecciones y la administración pública en
México" (México Evalúa, Data Cívica y Animal Político, 2024), con un panel municipal de 2018 y 2021,
encuentra (Tabla 2):

- por cada persona funcionaria atacada en los 6 meses previos, la participación baja 3.05 puntos;
- la tasa de homicidios del año previo tiene un coeficiente de −0.005, significativo solo al 10 % en
  uno de sus dos modelos.

Es consistente con nuestro hallazgo: la tasa de homicidios no mejora la predicción (notebook 03b,
sección 5). Lo que parece pesar es la violencia dirigida a autoridades, que no tenemos por municipio con
una fuente oficial.

## Qué no hacemos

- Un índice de "control criminal" o de "zonas sin Estado". No hay un dato público que lo sostenga.
- Ubicar las secciones con estrategias diferenciadas por inseguridad. El INE reserva ese dato y un mapa
  así podría tener el efecto que el INE quiere evitar.
