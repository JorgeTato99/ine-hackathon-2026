# Reporte F · Otros patrones en los datos

Los scripts de trabajo de esta investigación no están en el repositorio; las cifras que verificamos se reproducen en `notebooks/02_investigacion_datos_raros.ipynb`; las demás son de este reporte y están marcadas como no verificadas por nosotros donde corresponde.

Convenciones:

- `p`: participación, votó / (votó + no votó).
- `r`: participación del municipio menos la de su estado, en el mismo año.
- Se aplica la corrección de Paracho y Parácuaro en 2021.

## Importante

### 1. Elección de gobernador el mismo día

Los estados que eligen gobernador junto con la elección intermedia caen mucho menos respecto de la presidencial anterior. Script: `s08_estab.py`.

| Comparación | Con gobernador | Sin gobernador | Prueba de diferencia |
| --- | --- | --- | --- |
| 2015 frente a 2012 | −4.3 pp (9 estados) | −17.6 pp (23 estados) | p = 2.8e-5 |
| 2021 frente a 2018 | −7.3 pp (15 estados) | −11.7 pp (17 estados) | p = 0.0065 |

- La lista de estados con gobernador se tomó **de memoria; falta verificarla**.
- Esto explica los municipios que votan casi igual en las seis elecciones (San Luis Potosí, Nuevo León, Campeche y Sonora) y los 81 municipios donde la intermedia iguala o supera a la presidencial.
- Yucatán sube de forma permanente a partir de 2012. Hipótesis: ese año empató su calendario local con el federal.
- **Recomendación:** agregar como variable si en 2027 habrá gobernador o elección local el mismo día (calendario del INE y de los institutos electorales locales). Probablemente pesa más que cualquier rasgo demográfico.

### 2. En las intermedias se amplían las diferencias entre municipios

Script: `s19_amp.py`.

- **Dispersión de `r`** (ponderada por lista nominal):

  | Año | 2009 | 2012 | 2015 | 2018 | 2021 | 2024 |
  | --- | --- | --- | --- | --- | --- | --- |
  | Dispersión | 0.064 | 0.049 | 0.081 | 0.052 | 0.085 | 0.058 |

  Es mayor en las intermedias.
- **Al predecir la intermedia con la presidencial anterior**, la pendiente es mayor que 1: 1.18 (2015 con 2012) y 1.39 (2021 con 2018). Los municipios que ya estaban por debajo quedan todavía más abajo en la intermedia.
- **Matiz a "la elección inmediata anterior predice mejor"** (`s18_saltos.py`):
  - Para 2021, 2018 (R² 0.738) gana a 2015 (R² 0.581); con las dos juntas, R² 0.771.
  - Para 2024, 2018 (la del mismo tipo, R² 0.693) gana a 2021 (la inmediata anterior, R² 0.637).
  - **No es una regla general. Hay que verificarlo.**
- **Los saltos de un año tienden a revertirse:** la correlación entre saltos consecutivos es −0.30 y −0.19.
- **Recomendación:** predecir con 2024 y 2021 juntos, y estimar la pendiente con el ciclo 2018→2021.

### 3. El "no sabemos" es pérdida de cuadernillos completos

Scripts: `s14_half.py` y `s15_mar.py`.

- Entre el 37 % y el 47 % de las secciones con NS parcial tienen NS exactamente igual a la mitad de su lista. En 2024 son 2,527 de 6,859. La lista se reparte entre la casilla básica y las contiguas, así que perder uno de dos cuadernillos da justo la mitad. La excepción es 2012.
- El NS es igual por edad y por sexo.
- Las secciones con NS votan igual que las demás en sus otros años, salvo en 2012.
- En 2015 hay 97 secciones con NS casi total y solo de 1 a 29 personas con dato. De ahí salen secciones urbanas con participación de "100 %" basadas en una sola persona.
- **Recomendación:**
  - guardar el número de personas con dato;
  - tratar como "sin dato" las secciones con menos de 30 personas con dato;
  - usar el NS como variable de calidad.

### 4. Otros casi ceros y casi cien

Script: `s07_secjump.py`.

- **La Yesca (Nayarit), 2021:** participación de 0.079. En sus otros años vota entre 0.46 y 0.65.
- **San José Miahuatlán (Puebla), 2021:** participación de 0.158. En sus otros años vota entre 0.46 y 0.79.
- **Secciones con 0 votos:** Guadalupe y Calvo, sección 1144 (0 de 1,027), y el municipio de Guerrero (Chihuahua), sección 1222, ambas en 2021.
- **Secciones con al menos 50 personas con dato**, por año:

  | Año | 2009 | 2012 | 2015 | 2018 | 2021 | 2024 |
  | --- | --- | --- | --- | --- | --- | --- |
  | Participación menor a 5 % | 36 | 19 | 36 | 8 | 17 | 6 |
  | Participación mayor a 97 % | 2 | 4 | 12 | 12 | 12 | 32 |

- Los saltos de más de 25 pp de una sección contra su propia historia se concentran en Tierra Caliente (Guerrero y Michoacán), la sierra de Sinaloa y Chihuahua, y Chiapas.
- **Recomendación:** aplicar una regla automática. Si el salto contra su historia es mayor a 30 pp y además el NS supera 20 % o la participación es menor a 5 %, marcarlo como sospechoso.

### 5. Brecha entre mujeres y hombres

Script: `s04_gap.py`.

- **Mujeres menos hombres a nivel nacional:** 6.8, 8.3, 7.9, 8.1, 7.9 y 9.4 pp de 2009 a 2024.
- **Por edad en 2024:**

  | Edad | 18–19 | 30–34 | 35–44 | 55–64 | 65–74 | 75 y más |
  | --- | --- | --- | --- | --- | --- | --- |
  | Mujeres menos hombres (pp) | 8.1 | 13.7 | 13.1 | 5.2 | −0.8 | −7.1 |

- **Es mayor en los estados de alta migración**, según la clasificación de CONAPO (dato externo, hipótesis).
- **Dentro de cada estado**, el índice de masculinidad de la lista nominal predice poco.
- Las **mujeres de 75 años o más** podrían ser un segundo grupo objetivo.

### 6. Rupturas territoriales

Script: `s13_breaks.py`.

- Hay 181 saltos bruscos de la lista nominal municipal entre elecciones.
- Los nuevos, que no vienen de 2012:
  - Tecpatán: ×0.52.
  - Siltepec: ×0.65.
  - Miacatlán: ×0.59.
  - Puente de Ixtla: ×0.61.
  - Tulum: ×2.94 de 2012 a 2015.
- **Recomendación:** marcarlos como "ruptura territorial" o armar la historia por secciones. Ya se decidió armarla por secciones (D6).

## Interesante

### 7. Donde crece la lista nominal se vota menos

Scripts: `s11_small_growth.py` y `s10_tiposec.py`.

- **A nivel sección:** duplicar la lista equivale a unos −3.4 pp de participación relativa.
- **Secciones que pasaron de rural a mixta:** en 2009 votaban como las rurales (0.475 frente a 0.482). En 2021 votan mucho menos (0.46 frente a 0.586).
- **Periferia de Monterrey (2021):** Pesquería 0.32, El Carmen 0.37 y García 0.36.
- **Recomendación:** usar el crecimiento de la lista 2021→2024 como variable. Detecta riesgo antes de que aparezca en la historia de participación.

### 8. Los de 18 años se seleccionan solos

Script: `s09_jov.py`.

- La lista nominal de 18 años es solo del 53 % al 75 % de la de 20 años, según el estado.
- A los 18 se vota entre 10.5 y 16 pp más que a los 21.
- Donde hay más jóvenes de 18 con credencial, esa ventaja es menor (Spearman de −0.38 a −0.59).
- **Recomendación:** la credencialización es una intervención en sí misma. No leer la participación de los 18 años como "los jóvenes sí votan".

### 9. Yucatán y el efecto techo

Scripts: `s16_flat.py` y `s17_yuc.py`.

- De 57 a 75 de los municipios con participación de 85 % o más son de Yucatán.
- La diferencia entre jóvenes y adultos se reduce cuando la participación es alta, y eso pasa en todo el país.
- **Recomendación:** modelar en escala logit.

### 10. Lista nominal envejecida e índice de masculinidad

Script: `s03_demo.py`. Son predictores débiles; sirven como marca de emigración, no como variable principal.

## Descartado

- **El NS por sexo o edad:** es uniforme, con diferencias menores a 0.4 pp.
- **Copias entre años:** son compatibles con el azar.
- **Secciones con lista menor a 50:** pesan como máximo 0.04 por mil de la lista nominal.
- **Cambios de tipo de sección:** solo el 2.1 % de las secciones cambia.
- **Detalles técnicos:** 105 registros no binarios en 2024; la fecha de 2024 viene en formato mes/día; `DEL` nulo en 136 secciones de 2024.
