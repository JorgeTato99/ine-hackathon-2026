# 2 · Variables

El detalle completo está en [`docs/variables/`](../variables/):
- **catálogo:** las 101 variables, con fuente, año usado, transformación, resultado y estado;
- **cambios de lectura y pruebas finales;**
- **otras bases de datos posibles.**

## Las tres reglas

1. **Solo información anterior a cada elección.** El modelo aprende de transiciones presidencial →
   intermedia:

   | Elección a predecir | Presidencial anterior | Intermedia anterior | Censo, CONEVAL y CONAPO | Homicidios |
   | --- | --- | --- | --- | --- |
   | 2015 | 2012 | 2009 | 2010 | 2012–2014 |
   | 2021 | 2018 | 2015 | 2020 | 2018–2020 |
   | **2027** | **2024** | **2021** | **2020** | **2022–2024** |

2. **Estabilidad:** correlación con lo que la historia no anticipa, con el mismo signo y distinta de cero
   en 2015 y en 2021.
3. **Mejora (D20, fijada antes de ver resultados):** al agregarla, el error baja en las dos validaciones.

## Las 34 del modelo

| Bloque | Variables | Importancia* |
| --- | --- | --- |
| Historia (3) | Desviación en la presidencial anterior y en la intermedia anterior; desviación de los vecinos | 5.6 a 7 pp |
| Elecciones locales y usos y costumbres (7) | Ayuntamiento, gubernatura y diputación local el mismo día (en la intermedia y en la presidencial anterior); usos y costumbres | 2.9 a 3.9 pp |
| Lista nominal (6) | % rural, % hombres, % de 20 a 29, % de 65 o más, crecimiento de la lista, cobertura de la lista | 1.5 a 1.8 pp (junto con las sociales) |
| Sociales y económicas (16) | Escolaridad, lengua indígena, internet, migración (5), población, pobreza, pobreza extrema, carencia de salud, rezago educativo, marginación, localidades pequeñas, homicidios | |
| Políticas (2) | Margen y número efectivo de partidos de la presidencial anterior | casi 0 |

\* Importancia por permutación: cuánto empeora la predicción de una elección no vista si se revuelve el
bloque entre municipios (notebook 04b). Se calculó con la parte Huber del modelo (auditoría H006). Los
homicidios (`homicidios_100mil_log`) son una de las 34 variables y casi no pesan.

De las 28 que pasaron por la prueba de estabilidad (notebook 03b), 19 son estables. Las otras 6 (las dos
desviaciones históricas y 4 de calendario) son la base del modelo y no se sometieron a esa prueba. Las 9
no estables (margen, número de partidos, pobreza, pobreza extrema, 4 de migración y vecinos) se
conservaron, porque el modelo les da poco peso si no ayudan.

## Lo que se probó y no entró

- **18 variables del censo y de casillas** (notebook 04b, D20). 12 son estables, pero mejoran menos de 1 %.
- **39 variables que ya teníamos** y **3 de elecciones de ayuntamiento (Magar)**, probadas el 22 de
  octubre. 3 mejoran alrededor de 1 % por separado y juntas no; no se agregan (D26).
- **Otras:** gasto de campaña, COVID, celular, computadora, policía municipal y antecedentes de paquetes
  perdidos. Sin aporte.

## Prueba en las cinco elecciones (notebook 04b, sección 10)

Solo **elegir ayuntamiento el mismo día** y **usos y costumbres** funcionan igual en las intermedias y en
las presidenciales. 10 variables funcionan con signo opuesto, porque miden qué tan sensible es el
municipio al ciclo presidencial–intermedia. 19 funcionan solo en intermedias, 4 solo en presidenciales y
9 no son estables.
