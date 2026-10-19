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
  - La elección inmediata anterior predice mejor a cada municipio: 2018 explica el 72 % de las diferencias entre municipios en 2021, y 2015 solo el 30 %.
  - Los que menos votan son los hombres de 20 a 29 años (35.7 % en 2021).
  - Lo rural vota más que lo urbano, sobre todo en las intermedias (de 5 a 10 pp).

### Limitaciones que van en el reporte

- No son los resultados oficiales: no incluyen casillas especiales ni voto desde el extranjero, y la sección es la del domicilio de la credencial.
- Cuando no sabemos lo que hizo una persona, suponemos que votó igual que las personas con dato de su municipio.
- En 2012 faltan partes de la lista sin aviso.
- Las causas de los casos raros se investigan en el paso 2; hasta entonces son hipótesis.

### Siguiente paso

**Paso 2:** investigar las causas de los datos raros (municipios sin dato, participación sospechosa, 2012, edades extremas y movimientos atípicos de electores) con noticias, fuentes oficiales y los propios datos.
