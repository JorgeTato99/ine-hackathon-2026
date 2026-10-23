# Variables del modelo de riesgo de abstención 2027

Qué datos consideramos para anticipar dónde se votará menos en la intermedia del 6 de junio de 2027,
de dónde salen, cómo se transformaron, cuáles entraron al modelo y por qué las demás no.

| Archivo | Contenido |
| --- | --- |
| [catalogo.md](catalogo.md) | Todas las variables, una por renglón: fuente, año que se usa en cada elección, transformación, resultado de las pruebas y si entró o no |
| [cambios-y-pruebas.md](cambios-y-pruebas.md) | Variables que cambiaron de lectura durante el análisis y la prueba del 22 de octubre con 39 variables que no se habían probado |
| [otras-fuentes.md](otras-fuentes.md) | Bases de datos públicas que no usamos y si podrían ayudar |

## En números

| | Variables |
| --- | ---: |
| Probadas en total | 101 |
| En el modelo final (ensamble Huber + random forest, D21) | 34 |
| Probadas al final y no agregadas (notebook 04b, D20) | 18 |
| Probadas el 22 de octubre con datos que ya teníamos | 39 |
| Probadas el 22 de octubre con una base nueva (elecciones de ayuntamiento, Magar) | 3 |
| Otras exploradas (gasto de campaña, COVID, celular, computadora, policía municipal, antecedentes de falta de casillas y de paquetes perdidos) | 7 |

Las 101 salen de 8 instituciones (INE, INEGI, que incluye el Censo Nacional de Gobiernos Municipales,
CONAPO, CONEVAL, Banxico, SESNSP, IEEPCO y los organismos públicos locales) y de una base académica
de elecciones de ayuntamiento (Magar, ITAM).

## Qué predice el modelo

La **desviación** de cada municipio: su participación menos la nacional, en puntos porcentuales, en una
intermedia. El nivel nacional de 2027 no se predice: se plantea en tres escenarios.

## Las tres reglas que deciden si una variable entra

1. **Solo información anterior a la elección.** Para 2015 se usan datos de 2009 a 2014; para 2021, de 2015
   a 2020; para 2027, de 2021 a 2026. Ejemplo: el censo de 2010 alimenta la predicción de 2015 y el de 2020
   las de 2021 y 2027.
2. **Estabilidad.** Se mide la correlación (Spearman) de la variable con **lo que la historia no anticipa**:
   la parte de la intermedia que no se explica con la presidencial anterior. Es estable si tiene el mismo
   signo y es distinta de cero (intervalo de 95 % por bootstrap) en las dos intermedias pasadas, 2015 y 2021.
3. **Mejora de la predicción** (D20, fijada antes de ver resultados). Al agregarla, el error debe bajar
   en las dos validaciones: aprender de 2015 y predecir 2021, y al revés, con intervalo por bootstrap que
   no incluya el cero. Que se relacione no basta: tiene que aportar algo que el modelo no tenga ya.

Las 34 variables del modelo se eligieron en el paso 4, antes de la regla 3. No todas son estables (ver
el catálogo). Se conservaron porque el modelo les da poco peso si no ayudan y la validación salió bien.

## Lo esencial

- **Lo que más pesa:** la historia del municipio (5.6 a 7 puntos de importancia) y si elige ayuntamiento
  el mismo día (2.9 a 3.9). Las sociales y económicas, en conjunto, 1.5 a 1.8. La violencia y la
  competencia política, casi cero.
- **Muchas variables se relacionan con votar menos, pero casi ninguna agrega información.** La historia
  del municipio ya resume la mayor parte de lo que dicen.
- **De las 60 probadas después del modelo** (18 el 20 de octubre y 42 el 22), 3 mejoran el modelo final
  en las dos validaciones, alrededor de 1 % cada una, y **juntas ya no mejoran**. No se agregan (D26; ver
  [cambios-y-pruebas.md](cambios-y-pruebas.md)).

Fuentes de cada cifra: notebooks `03b`, `04` y `04b`; scripts de la prueba del 22 de octubre en
`notebooks/pruebas_variables/`; decisiones en `docs/bitacora.md`.
