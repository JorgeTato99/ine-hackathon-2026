export const contextGuides = {
  elecciones: {
    label: "Elecciones locales en 2027",
    summary: "Consulta qué municipios eligen ayuntamiento o gubernatura el 6 de junio de 2027.",
    reading:
      "Los colores muestran qué autoridades locales se eligen ese día. La elección federal es nacional: no elegir ayuntamiento ese día no significa que no haya elección federal. El calendario puede cambiar.",
  },
  rezago: {
    label: "Participación por debajo del país",
    summary:
      "Cuenta en cuántas elecciones la participación del municipio fue menor que la del país.",
    reading:
      "Se revisan las seis elecciones de 2009 a 2024. Un valor de 6 indica que el municipio estuvo por debajo del país en las seis. Se compara el porcentaje de participación, no la cantidad de habitantes ni una causa de la abstención.",
  },
  zonas: {
    label: "Participación de municipios vecinos",
    summary:
      "Observa cómo se relaciona la participación de un municipio con la de sus vecinos en 2024.",
    reading:
      "El análisis identifica grupos de municipios vecinos con participación baja o alta, y municipios que difieren de sus vecinos. Sin patrón concluyente significa que el análisis no encontró evidencia suficiente de una agrupación. Estos colores no son el riesgo previsto para 2027.",
  },
  personas: {
    label: "Personas y participación",
    summary: "Consulta cuántas personas pertenecen a cada grupo de edad o situación electoral.",
    reading:
      "Son cantidades de personas, no porcentajes ni resultados de una campaña. Los dos primeros grupos corresponden a 2024; los nuevos votantes de 2027 se estiman con el censo de 2020. Sin dato indica que no hay conteo disponible, no que haya cero personas; los totales suman solo los datos disponibles. La escala de color conserva la misma referencia nacional al filtrar.",
  },
  casillas: {
    label: "Falta de casillas en elecciones anteriores",
    summary:
      "Identifica municipios donde al menos parte de la lista electoral se quedó sin casilla en alguna elección de 2009 a 2024.",
    reading:
      "Una elección o dos y más elecciones indica cuántas veces se registró el problema. No significa que todo el municipio se quedara sin casillas ni que ocurrirá de nuevo en 2027. Esta alerta se lee por separado del semáforo.",
  },
  seguridad: {
    label: "Seguridad en el municipio",
    summary: "Consulta datos históricos de homicidios e instituciones de seguridad.",
    reading:
      "La tasa de homicidios, transformada en logaritmo, es una de las 34 variables del modelo. La policía, la justicia cívica y la comparación de fuentes son contexto. No tener policía municipal no significa que no actúen otras instituciones. Cada indicador conserva su periodo; no describe la seguridad en tiempo real.",
  },
  historia: {
    label: "Participación en elecciones anteriores",
    summary:
      "Elige una elección para consultar el porcentaje de participación observado en ese año.",
    reading:
      "Un color más intenso indica un porcentaje mayor de participación. La historia reúne datos de 2009 a 2024 sobre el territorio municipal de 2024. Sin dato no equivale a cero; sin casilla señala que no se pudo votar, no que la gente decidiera abstenerse.",
  },
} as const;

export const helpTopics = {
  national: {
    label: "participación nacional estimada",
    summary: "El calendario electoral permite estimar un nivel nacional de 51.4 % para 2027.",
    detail:
      "La versión 1.6 utiliza una sola estimación nacional, 51.4 %, calculada a partir del calendario de elecciones locales. Se basa en tres elecciones intermedias y tiene un error de prueba de unos 3.3 puntos. No es una cifra conocida de antemano; esa incertidumbre forma parte del rango municipal.",
  },
  baseline: {
    label: "color sin intervención",
    summary: "Este filtro usa el semáforo original, antes de aplicar la intervención.",
    detail:
      "El filtro mantiene el mismo grupo de municipios al comparar. Con intervención, el color de algunos municipios puede cambiar en el mapa; eso no los quita del grupo que seleccionaste. Rojo indica mayor riesgo de baja participación respecto de otros municipios, no una certeza ni una causa.",
  },
  roll: {
    label: "lista electoral",
    summary: "Personas registradas para votar; también se llama lista nominal.",
    detail:
      "Aquí se usa la lista nominal de 2024: las personas registradas para votar en esa elección. No es toda la población ni la lista definitiva de 2027. La participación histórica se calcula entre quienes tienen dato de si votaron o no; los registros sin ese dato se tratan aparte.",
  },
  customs: {
    label: "usos y costumbres",
    summary: "Elección de autoridades mediante normas comunitarias propias.",
    detail:
      "La entrega identifica municipios que eligen autoridades por sistemas normativos indígenas o comunitarios. Describe cómo se eligen autoridades locales. No significa que sus habitantes no participen en la elección federal de 2027.",
  },
  interval: {
    label: "rango de la estimación",
    summary: "La cifra central es incierta; el rango muestra esa incertidumbre.",
    detail:
      "La versión 1.6 combina el error municipal con la incertidumbre del nivel nacional estimado. El intervalo del 90 % es aproximado y mide entre 18 y 29 puntos de ancho. La evaluación es retrospectiva con datos revisados; la cobertura puede variar por territorio y tamaño. No garantiza 90 % en cada grupo ni lo que ocurrirá en 2027.",
  },
  position: {
    label: "escala de riesgo",
    summary: "Ordena municipios entre sí; no es un porcentaje de abstención.",
    detail:
      "La escala va de 0 a 100. Un número más alto indica una posición de mayor riesgo: se prevé menor participación respecto del país. No significa que ese porcentaje de personas dejará de votar. En el escenario sin intervención, el rojo reúne el 20 % con mayor riesgo relativo.",
  },
  probability: {
    label: "posibilidad de quedar en rojo",
    summary: "Resume cuántas simulaciones del modelo dejaron al municipio en rojo.",
    detail:
      "Se simularon 2,000 resultados posibles incorporando errores del modelo. El porcentaje indica en cuántos el municipio quedó rojo. Corresponde al escenario sin intervención. No es la posibilidad de que una persona deje de votar; incluso un porcentaje alto debe leerse como probable, no seguro.",
  },
  gap: {
    label: "diferencia de participación joven",
    summary: "Compara al grupo de 20 a 29 años con el municipio en 2024.",
    detail:
      "Se resta la participación del municipio a la del grupo joven. Un valor negativo significa que ese grupo participó menos. Ejemplo ilustrativo: pasar de 60 % a 48 % supone 12 puntos porcentuales menos; no es lo mismo que bajar un 12 % relativo.",
  },
  unreported: {
    label: "delitos no denunciados o sin investigación",
    summary: "Es un dato del estado, no una medición de este municipio.",
    detail:
      "La cifra oculta estima qué porcentaje de delitos no se denunció o no tuvo una carpeta de investigación. Corresponde al estado en 2025, según la ENVIPE 2026. No permite afirmar que el municipio tenga exactamente ese porcentaje.",
  },
  civic: {
    label: "justicia cívica",
    summary: "Indica qué autoridad de justicia cívica registró el municipio.",
    detail:
      "El INEGI distingue si existe un juzgado cívico, otra autoridad, ninguna u otra situación. Aquí se muestra esa categoría, no una evaluación del servicio. El registro corresponde al 31 de diciembre de 2024, no a una consulta en tiempo real.",
  },
  forecastParticipation: {
    label: "participación esperada",
    summary:
      "Estimación de cuántas personas votarían de cada 100, en el territorio y la intervención elegidos.",
    detail:
      "En un municipio se muestra su predicción. En un estado o en el país se calcula un promedio ponderado por las personas en la lista de 2024, no un promedio simple de porcentajes. Con credencialización se añaden también las nuevas personas a la lista de los municipios rojos base. La cifra es una estimación con incertidumbre; las diferencias frente a ninguna intervención son puntos porcentuales.",
  },
  trafficLight: {
    label: "color del municipio",
    summary: "Rojo, amarillo y verde comparan el riesgo de menor participación entre municipios.",
    detail:
      "Sin intervención, rojo reúne al 20 % de mayor riesgo relativo, amarillo al 20 % siguiente y verde al resto. Con intervención, el color utiliza los mismos umbrales de referencia. Un color no equivale a un porcentaje de abstención ni decide por sí solo la prioridad de recursos. Gris significa que falta el dato.",
  },
  redCount: {
    label: "municipios en rojo",
    summary: "Cuenta los municipios del territorio que quedan en rojo con la intervención elegida.",
    detail:
      "El conteo sigue al país o estado seleccionado y al tipo de intervención. La referencia sin intervención contiene 495 municipios rojos. Con las tres acciones quedan 411: salen 84. Al pulsar la leyenda se resaltan categorías del mapa, pero no se cambia el ámbito de estas cifras. Si se abre un municipio, esta tarjeta pasa a mostrar su color.",
  },
  redPeople: {
    label: "personas en rojo",
    summary:
      "Personas en la lista de 2024 de los municipios que quedan en rojo; no es el número de abstenciones.",
    detail:
      "Se suma la lista electoral de 2024 de los municipios cuyo riesgo es alto en la intervención elegida. El conteo incluye a todas las personas registradas en esos municipios, no solo a quienes se estima que no votarán. Se conserva la lista de 2024 para esta comparación, incluso cuando la intervención incorpora nuevas personas.",
  },
  currentRoll: {
    label: "personas en la lista",
    summary:
      "Personas registradas en el territorio; la credencialización puede ampliar este total bajo un supuesto.",
    detail:
      "Sin intervención se usa la lista electoral de 2024. Con credencialización o las tres acciones se añaden las nuevas personas calculadas solo para los municipios que eran rojos sin intervención y tienen dato del componente de credencialización. Si falta ese componente, no se suman votos ni personas por él. No es la lista oficial definitiva de 2027. Las ausencias se muestran como sin dato y no se convierten en cero.",
  },
  countryGap: {
    label: "distancia frente al país",
    summary:
      "Diferencia en puntos entre la participación esperada del municipio y el nivel nacional base de 51.4 %.",
    detail:
      "Se resta 51.41 % a la predicción del municipio en la intervención elegida. Una distancia negativa significa puntos menos; una positiva, puntos más. Es una diferencia de porcentajes, no un cambio porcentual relativo. Las barras de factores explican únicamente la distancia de la predicción sin intervención; no explican el efecto de una campaña.",
  },
  additionalVotes: {
    label: "votos adicionales supuestos",
    summary:
      "Votos que añadiría la acción elegida bajo sus supuestos; no son votos obtenidos ni un efecto medido.",
    detail:
      "Se suman los votos adicionales del tipo de intervención, únicamente en los 495 municipios que eran rojos sin intervención. La cuenta se realiza municipio por municipio y después se agrega por territorio. Con las tres acciones el total nacional es 528,400. Si falta un componente, se suma solo lo conocido y se identifica la intervención parcial. Credencializar puede añadir votos y bajar ligeramente el porcentaje porque también amplía la lista.",
  },
  homicideSources: {
    label: "comparación estatal de fuentes de homicidios",
    summary: "Indica si INEGI o SESNSP registra más homicidios en el estado durante 2019–2024.",
    detail:
      "La etiqueta compara las dos fuentes en todo el estado, no la diferencia específica del municipio. Sus registros tienen criterios distintos; que una fuente cuente más no prueba por sí solo subregistro ni una causa. La tasa municipal mostrada usa defunciones por homicidio de INEGI de 2022–2024; su logaritmo sí entra al modelo. Esta comparación estatal es contexto y no modifica el pronóstico.",
  },
  historyNational: {
    label: "participación histórica del país",
    summary:
      "Participación observada nacional de la elección elegida, tomada de los metadatos del análisis.",
    detail:
      "Es una observación de 2009 a 2024 y no una predicción. La fuente conserva las correcciones declaradas por el equipo de datos. Cambiar el estado o municipio no cambia esta referencia nacional. Las elecciones intermedias y presidenciales tienen calendarios distintos y deben leerse en ese contexto.",
  },
  historyTerritory: {
    label: "participación histórica del territorio",
    summary:
      "En un municipio es el dato observado; en un territorio agregado es una referencia ponderada con la lista de 2024.",
    detail:
      "La ficha utiliza el porcentaje histórico del municipio, dejando vacíos cuando falta información. En el estado o país seleccionado esta tarjeta pondera los porcentajes disponibles con la lista de 2024; por eso se etiqueta como referencia y no como una tasa observada reconstruida con la lista de cada año. La falta de casillas se muestra aparte, no como abstención voluntaria.",
  },
  historyLow: {
    label: "municipios bajo 40 %",
    summary:
      "Municipios con participación observada menor de 40 % en el año y territorio elegidos.",
    detail:
      "El corte es constante en los seis años para facilitar la comparación. No se incluyen los municipios sin dato ni los ceros identificados como falta de casillas. Es un indicador histórico y no el semáforo previsto para 2027; no implica que esos municipios vayan a quedar rojos.",
  },
  boothHistory: {
    label: "municipios sin casilla",
    summary: "Casos identificados en el año elegido donde no se pudo votar por falta de casillas.",
    detail:
      "Estos casos no se presentan como 0 % de participación voluntaria. En el mapa histórico tienen gris rayado y en la gráfica se deja un hueco con un rombo. Son distintos de sin dato y de la alerta que resume antecedentes de otras elecciones. Esta condición se mantiene separada del riesgo de 2027.",
  },
  contributions: {
    label: "factores de la predicción",
    summary:
      "Cinco grupos de variables reparten la distancia de la predicción base frente al país.",
    detail:
      "Las barras expresan puntos que suben o bajan la predicción sin intervención. Suman su distancia a 51.41 %, con tolerancia de redondeo. Siempre mantienen el mismo orden y corresponden a historia, calendario, lista y población, condiciones sociales y competencia política. Son un reparto del modelo, no causas probadas, y no cambian al elegir una intervención.",
  },
  historySeries: {
    label: "historial municipal y nacional",
    summary: "Compara lo observado en seis elecciones con el punto y rango estimados de 2027.",
    detail:
      "La línea continua es el municipio y la discontinua el país. En 2009, 2015 y 2021 hubo elecciones intermedias; las demás elecciones históricas fueron presidenciales. Los datos vacíos se dejan como huecos. Un rombo gris señala falta de casillas. El punto de 2027 es una estimación de la intervención elegida y su intervalo no garantiza el resultado futuro. La tabla equivalente permite leer las cifras sin depender de la gráfica.",
  },
} as const;
export type HelpTopic = keyof typeof helpTopics;

export const zoneLabels: Record<string, string> = {
  "fría (bajo-bajo)": "Participación baja entre vecinos",
  "caliente (alto-alto)": "Participación alta entre vecinos",
  "bajo rodeado de alto": "Menor participación que sus vecinos",
  "alto rodeado de bajo": "Mayor participación que sus vecinos",
  "no significativa": "Sin patrón concluyente",
};
export const boothLabels: Record<string, string> = {
  recurrente: "Ocurrió en dos o más elecciones",
  antecedente: "Ocurrió en una elección",
  "sin antecedente": "Sin casos registrados",
};
