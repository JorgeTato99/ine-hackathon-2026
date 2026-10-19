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

### Decisiones propuestas (pendientes de confirmar por Sofía)

| # | Decisión | Propuesta | Por qué |
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

- verificar las pistas para el modelo: elección local el mismo día, crecimiento de la lista y credencialización de los jóvenes;
- conseguir el calendario de elecciones locales de 2027.
