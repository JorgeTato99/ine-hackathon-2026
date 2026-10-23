# 8 · Decisiones

Las 28 decisiones las tomó Sofía Ordaz a partir del análisis. El detalle, las alternativas y la
evidencia están en [`docs/bitacora.md`](../bitacora.md).

| # | Tema | Qué se decidió | Fecha |
| --- | --- | --- | --- |
| D1 | Fórmula de participación | Votó / (votó + no votó); el "no sabemos" queda fuera | 19 oct |
| D2 | Cuándo un municipio queda "sin dato" | Sin registros; más de la mitad en "no sabemos" sin actas; lista menor al 80 % de sus elecciones vecinas (con elección antes y después, media geométrica); casi nadie votó sin explicación | 19 oct, ajustada |
| D3 | "No sabemos" alto | Distinguir el origen con las actas (A sin casilla, B paquete, C cuadernillo) y usar la participación de las actas; también cuando 10 % o más de la lista se quedó sin casilla | 19 oct, ajustada dos veces |
| D4 | Personas de 100 años o más | Se quedan en los totales | 19 oct |
| D5 | Participación atípica | Se marca (más de 85 % y más de 15 pp sobre lo típico); Yucatán se conserva | 19 oct |
| D6 | Territorio | La historia de cada municipio se arma con su territorio de 2024 | 19 oct |
| D7 | Sexo no binario | Se incluye en los totales | 19 oct |
| D8 | Grupos de edad | Los del INE, destacando 20 a 29 años | 19 oct |
| D9 | Segunda fuente | Actas por casilla de las seis elecciones | 19 oct, ampliada a 2009–2015 |
| D10 | Secciones que no cuadran con su acta | Más de 10 % (y al menos 50) de diferencia en cualquier sentido: "sin dato" | 19 oct, ajustada |
| D11 | Crecimiento atípico de la lista | No es "sospecha"; casi todo es crecimiento urbano | 19 oct |
| D12 | Falta de casillas | Alerta aparte ("recurrente" o "antecedente"); en el entrenamiento se excluye el año sin casilla cuando es la elección a predecir | 19 oct |
| D13 | Territorio aproximado | Solo si quien recibió territorio no lo tiene completo ese año | 19 oct, ajustada |
| D14 | Modelo simple | Historia más elecciones locales; otras variables solo si mejoran la validación | 19 oct |
| D15 | Validación | Aprender de 2012 → 2015 y predecir 2018 → 2021 (y al revés), contra la regla simple justa | 19 oct |
| D16 | Lista incompleta en los conteos | Usar la participación de todas sus actas | 20 oct |
| D17 | Dato de violencia | Homicidios del INEGI, con aviso por estado de qué fuente cuenta más; es contexto | 20 oct |
| D18 | Cortes del semáforo | Rojo = 20 % de mayor riesgo; amarillo = el 20 % siguiente | 20 oct |
| D19 | Campaña dirigida | No se estiman efectos; se muestran las personas en juego | 20 oct |
| D20 | Variables nuevas del censo y casillas | No se agregan (mejoran menos de 1 %) | 20 oct |
| D21 | Modelo final | Ensamble Huber + random forest | 20 oct |
| D22 | Escenario con intervención | Cuenta con tres supuestos explícitos en los rojos: "supuesto, no efecto medido" | 20 oct |
| D23 | Estructura del mapa | Dos pestañas: Pronóstico 2027 e Indicadores y contexto | 20 oct |
| D24 | Falta de casillas en la elección de entrada | Se probó tratarla como "sin dato" y **no se adopta** (mejora una validación, empeora la otra y oculta a municipios con participación muy baja y repetida) | 22 oct |
| D25 | Escenarios nacionales | Se mantienen los tres; **"alto" (como 2021) se presenta como el más parecido a 2027** por su calendario | 22 oct |
| D26 | Variables probadas el 22 de octubre | No se agregan (mejoran alrededor de 1 % por separado y juntas no) | 22 oct |
| D27 | Una sola predicción | El nivel nacional de 2027 se estima con un modelo por calendario (51.4 %); el mapa muestra una sola predicción por municipio. Sustituye a D25 | 22 oct |
| D28 | Tipos de intervención | Cada supuesto por separado (retener primerizos, jóvenes de 20 a 29, credencialización) y los tres juntos | 22 oct |
