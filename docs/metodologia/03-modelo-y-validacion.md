# 3 · Modelo y validación

Notebooks `04_modelo_riesgo_2027` y `04b_fuentes_adicionales_e_importancia`. Decisiones D12, D14, D15, D20
y D21.

## 3.1 Qué se predice

**La desviación de la participación municipal frente a la nacional en una intermedia, en puntos
porcentuales.** No se predice el nivel nacional, por dos razones:

- **Solo hay dos intermedias para aprender (2015 y 2021), y su nivel depende de cosas que cambian:** el
  calendario local, el contexto y las campañas. El modelo erró el desplazamiento general de 2021.
- **Para el INE importa el orden:** qué municipios quedarán más abajo que el resto. Eso sí se puede
  anticipar con la historia.

El nivel nacional de 2027 se plantea en tres escenarios (ver [04-pronostico-2027.md](04-pronostico-2027.md)).

## 3.2 Cómo se valida (D15)

**Como si estuviéramos antes de una elección que no conocemos:**

| Validación | Aprende de | Predice | Municipios evaluados |
| --- | --- | --- | ---: |
| Principal, respeta el orden del tiempo | 2012 → 2015 | 2018 → 2021 | 2,437 |
| Al revés, para medir incertidumbre | 2018 → 2021 | 2012 → 2015 | 2,418 |

- **Se excluyen** los municipio-elección cuya elección a predecir tuvo falta de casillas (D12) y los que no
  tienen dato de la presidencial anterior.
- **El modelo para 2027** se entrena con las dos transiciones juntas y se aplica a 2024 → 2027.

## 3.3 Contra qué se compara: la regla simple justa

**Regla simple:** la desviación de la presidencial anterior, más el cambio típico (mediana) de la
presidencial a la intermedia, aprendido de la otra transición. Es lo que haría alguien sin modelo. **Un
modelo solo se acepta si le gana.**

## 3.4 Métricas

| Métrica | Qué mide |
| --- | --- |
| **Error centrado** (la principal) | Error medio por municipio, después de quitar el desplazamiento general de la elección (se resta la mediana de lo real y de lo previsto). Mide si acierta qué municipios quedan arriba o abajo |
| Error ponderado por la lista | Lo mismo, dando más peso a los municipios con más personas |
| Error de posición | Cuántos lugares percentiles se equivoca, en promedio |
| Acierto en el 10 % y en el 20 % de mayor riesgo | De los municipios que de verdad quedaron entre los que menos votaron, qué parte identificó el modelo |

**Regla de selección (fijada antes):** el menor error centrado promedio de las dos validaciones, siempre
que le gane a la regla simple en las dos.

## 3.5 Modelos comparados

En el notebook 04 se compararon variantes de lineal, Ridge, Huber, gradient boosting, random forest y el
ensamble. En el notebook 04b, 14 tipos de modelo, con ajuste interno de hiperparámetros: Ridge, Lasso,
Elastic Net, Huber, árbol de decisión, random forest, extra trees, gradient boosting, red neuronal (MLP),
SVR, vecinos cercanos y tres ensambles.

- **Gana el ensamble Huber + random forest** (D21). Le gana a Huber solo en las dos validaciones, fuera
  del ruido: −0.17 y −0.41 pp, con bootstrap pareado.
- **Gradient boosting, árbol, red neuronal, SVR y vecinos cercanos** predicen peor de una elección a
  otra. En el notebook 04, gradient boosting tuvo el mayor error al predecir 2021 (7.32 pp, contra 6.03 de la
  regla simple).
- **Extra trees** queda segundo (5.86 pp de error promedio, contra 5.74 del ensamble), pero acierta menos en el
  20 % de mayor riesgo al predecir 2021 (62 % contra 70 %).

## 3.6 El modelo final

| Parte | Configuración |
| --- | --- |
| Regresión robusta | `HuberRegressor(alpha=1.0, epsilon=1.35, max_iter=3000)`, con imputación por mediana y escalado estándar |
| Random forest | `RandomForestRegressor(n_estimators=300, min_samples_leaf=5, max_features=0.6, random_state=0)`, con imputación por mediana |
| Predicción | Promedio simple de las dos |
| Variables | Las 34 de [02-variables.md](02-variables.md) |

## 3.7 Resultados de la validación

**Aprende de 2015 y predice 2021:**

| Medida | Regla simple | Huber | **Modelo final (ensamble)** |
| --- | ---: | ---: | ---: |
| Error centrado (pp) | 6.03 | 5.49 | **5.32** |
| Ponderado por personas (pp) | 6.80 | 4.68 | **4.30** |
| Acierto en el 20 % de mayor riesgo | 67 % | 72 % | **70 %** |
| Acierto en el 10 % más extremo | 61 % | 58 % | **57 %** |

**Al revés** (aprende de 2021 y predice 2015): error centrado de 6.16 contra 9.43 de la regla simple (−35 %).

**Lectura honesta:**

- **Gana donde importa al INE:** identificar qué municipios, y cuántas personas, quedarán más abajo. Ponderado
  por personas, se equivoca 37 % menos que la regla simple.
- **Pierde en dos cosas:**
  - el **10 % más extremo**, donde la regla simple acierta un poco más;
  - el **nivel general**, que el modelo no predice: por eso se usan escenarios.

## 3.8 Qué pesa (notebook 04b)

**Importancia por permutación, por bloque:**
- historia: 5.6 a 7 pp;
- elecciones locales y usos y costumbres: 2.9 a 3.9;
- sociales y económicas: 1.5 a 1.8;
- violencia y competencia política: casi cero.

Los pesos individuales de Huber no son "efectos": muchas variables dicen lo mismo y el modelo reparte el peso
entre ellas. Lo confiable es el conjunto.

## 3.9 Lo que el modelo no ve (notebook 04b)

- **Error agrupado por estado y por distrito:** el 28 % del error se agrupa por estado y entre 41 % y 44 %
  por distrito. Pero ese efecto no se repite de una elección a otra (correlación de −0.46 entre 2015 y
  2021). Es la coyuntura de cada elección y no se puede aprender del pasado.
- **Casos atípicos:** 45 de 2,437 al predecir 2021 (más de 3 veces el error típico). Ahí se encontró el error
  de los 7 municipios con usos y costumbres fuera de Oaxaca.
- **Gasto de campaña, COVID y tecnología:** no explican el error.

## 3.10 Antecedente que se sacó del modelo (D12)

La primera versión usaba los antecedentes de falta de casillas como variable. Aprendía de solo 4
municipios que se recuperaron (sesgo de selección) y ponía a Tila o Nahuatzen como los de menor riesgo
del país. Se sacaron del modelo; van en la alerta aparte.
