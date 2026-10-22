# 1 · Datos y calidad

Notebooks `01_calidad_datos`, `02_investigacion_datos_raros` y `03_historia_y_variables`. Reportes de
investigación A a I en [`docs/investigacion/`](../investigacion/).

## 1.1 Fuentes del INE

| Fuente | Qué trae | Uso |
| --- | --- | --- |
| **Conteos Censales de Participación Ciudadana (CCPC) 2009–2024** | Por sección, edad y sexo: lista nominal (LN), votó (SV), no votó (NV) y no sabemos (NS). 54,872,712 registros en las seis elecciones federales | Participación, composición de la lista, jóvenes, primerizos |
| **Cómputos distritales por casilla (actas) 2009–2024** (D9) | Votos por casilla y lista de la casilla | Segunda fuente para validar los conteos y para calcular la participación cuando los conteos no bastan |
| **Límites municipales del INEGI** | 2,478 geometrías, capturadas el 16 de octubre de 2026 | Mapa, vecinos, densidad |
| **Tabla de equivalencias INE–INEGI** (`data/reference/equivalencias_ine_inegi.csv`) | Clave INE de cada año → `cvegeo` | Unir años: el INE renumera municipios entre elecciones |

Los CCPC no son los resultados oficiales: no incluyen casillas especiales ni el voto desde el extranjero,
y la sección es la del domicilio de la credencial.

**Participación nacional según los CCPC:**

| 2009 (intermedia) | 2012 | 2015 (intermedia) | 2018 | 2021 (intermedia) | 2024 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 44.06 % | 62.08 % | 47.07 % | 62.37 % | 51.84 % | 59.67 % |

## 1.2 Cómo se calcula la participación (D1)

**Participación = votó / (votó + no votó).** Las personas "no sabemos" quedan fuera, como en el manual de
la plataforma CCPC. Si se contaran como "no votó", un municipio parecería abstencionista solo porque se
perdieron cuadernillos. Supuesto implícito: quienes no tienen dato votaron como las personas con dato de
su municipio.

## 1.3 De dónde sale el "no sabemos" (paso 2, D3)

Cruzando con las actas, el "no sabemos" tiene tres orígenes:

| Origen | Qué pasó | Cómo se trata |
| --- | --- | --- |
| **A. No hubo casilla** (decisión comunitaria, conflicto o violencia) | Es abstención real | Participación de las actas sobre **toda** la lista, más la marca "sin casilla". Ejemplo: en Cherán (2024) la fórmula daría 47.1 %, pero votó el 7.1 % de la lista |
| **B. El paquete no llegó** | Se votó, pero no hay registro | Participación de las actas, más una marca de conflicto |
| **C. El cuadernillo no se capturó** | Se votó, sin registro | Participación de las actas; sin actas, "sin dato" |

Ajuste (D3, segunda vez): las actas también se usan cuando 10 % o más de la lista se quedó sin casilla,
aunque el "no sabemos" sea menor a la mitad. Sin esto, 36 municipios donde parte de la gente no tuvo
dónde votar aparecían votando más que el país.

## 1.4 Reglas de "sin dato" y de control

| Regla | Qué dice |
| --- | --- |
| **D2** | Un municipio queda "sin dato" en una elección si: (1) no hay registros; (2) no se sabe qué hizo más de la mitad de la lista y no hay actas (ver D3); (3) su lista es menor al 80 % de la de sus elecciones vecinas (ajustada: solo con elección antes y después, con media geométrica); (4) casi nadie votó (menos de 2 %), sin "no sabemos" y con participación normal en sus otras elecciones |
| **D10** | Si en una sección los conteos marcan más de 10 % (y al menos 50) más "votó" que los votos del acta, o de menos (ajustada: en los dos sentidos), la sección queda "sin dato". Dos fuentes oficiales no coinciden |
| **D16** | Municipios con lista incompleta en los conteos (108 en 2012): se usa la participación de todas sus actas |
| **D4** | Personas de 100 años o más: se quedan en los totales (0.02 % de la lista en 2024) |
| **D5** | Participación atípica: más de 85 % y más de 15 pp sobre lo típico se marca como atípico. Yucatán se conserva: es el estado que más vota en 4 de 6 elecciones. Por separado, el notebook 04b revisa los casos atípicos del error del modelo (45 de 2,437 al predecir 2021) |
| **D7** | Las personas de sexo no binario (105 en 2024) se incluyen en los totales |
| **D8** | Grupos de edad del INE (quinquenios), destacando 20 a 29 años |
| **D11** | El crecimiento atípico de la lista no se muestra como "sospecha": casi todo es crecimiento urbano |

**Resultado:** después de aplicar las actas de las seis elecciones, quedan 39 municipio-elección "sin
dato": 31 por paquete perdido, 3 sin registros y 5 por la regla 4. En la sección típica, los "votó" de
los conteos son el 99 % de los votos del acta.

## 1.5 Historia con el territorio de 2024 (D6, D13)

- **Cada municipio se reconstruye con las secciones que en 2024 le pertenecen.** Las secciones que
  cambiaron de número usan la equivalencia de su año. Así los municipios nuevos (19 desde 2009) recuperan
  su historia, y los que cedieron territorio se comparan con el mismo territorio.
- **Secciones que ya no existen en 2024:** entre 4.9 % y 6.5 % de la lista de cada elección vive en ellas,
  porque el INE las dividió. Se asignan al municipio donde estaban.
- **"Territorio aproximado" (D13):** se marca solo si quien recibió territorio no lo tiene completo ese
  año. En 2024 no hay ninguno.

## 1.6 Falta de casillas

- **75 municipios** tuvieron 10 % o más de la lista sin casilla en alguna elección de 2009 a 2024. **16**
  repiten.
- **D12:**
  - para estos municipios hay una **alerta aparte**, calculada solo con elecciones anteriores
    ("recurrente" o "antecedente");
  - en el entrenamiento del modelo se excluye el año sin casilla **cuando es la elección a predecir**.
- **Dato de entrada con falta de casillas (D24):** cuando la elección **de entrada** tuvo falta de
  casillas, se conserva la participación observada. Tratarla como "sin dato" se probó y no se adoptó (ver
  [07-limites.md](07-limites.md)).

## 1.7 Correcciones de datos encontradas en el camino

| Corrección | Qué pasaba | Dónde se corrigió |
| --- | --- | --- |
| Paracho y Parácuaro (2021) | El CCPC de 2021 trae los nombres intercambiados | Notebook 03 y tabla de equivalencias (`config/municipality_overrides_by_year.csv`) |
| 7 municipios con usos y costumbres fuera de Oaxaca | Estaban marcados como si eligieran ayuntamiento por partidos | `data/reference/municipios_sni_fuera_oaxaca.csv`, notebooks 03 a 05 |
| 15 celdas `NaN` en `brecha_jovenes_2024` | Dividían 0 entre 0 | Notebook 03b (`resultados-1.2`) |
| Personas en juego en 0 en 15 municipios | Los conteos de 2024 no tienen a nadie con dato; el 0 debía ser "sin dato" | Notebook 05 (`resultados-1.3`) |

## 1.8 Usos y costumbres

- **Oaxaca, 418 municipios:** catálogo 2025 del IEEPCO, con el dictamen de cada municipio
  (`data/reference/oaxaca_municipios_sni.csv`). San Baltazar Chichicápam se incorporó en 2024; para 2009 a
  2024 cuenta como municipio de partidos.
- **Fuera de Oaxaca, 7:** Oxchuc (Chiapas), Ayutla de los Libres y Ñuu Savi (Guerrero), Cherán
  (Michoacán), Coatetelco, Xoxocotla y Hueyapan (Morelos), con documentos de sus organismos electorales.
  Para Cherán no hay documento de 2027: se usa su régimen de 2024.
- En los archivos: `es_sni` son los 418 de Oaxaca; `usos_y_costumbres` son los 425.
