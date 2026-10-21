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
      "Estos datos ayudan a conocer el territorio, pero no cambian el semáforo: no mejoraron la predicción del modelo. No tener policía municipal no significa que no actúen otras instituciones. Cada indicador conserva su periodo; no describe la seguridad en tiempo real.",
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
    label: "participación nacional supuesta",
    summary: "Elige un punto de partida para todo el país.",
    detail:
      "El modelo no sabe cuánta gente votará en todo México en 2027. Por eso se prueban tres porcentajes nacionales, tomados de elecciones anteriores. Cambiar este supuesto cambia las estimaciones municipales. Para comparar la intervención se conserva siempre el mismo porcentaje nacional.",
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
      "El rango se calcula con los errores observados al probar el modelo en otras elecciones. Se presenta como intervalo del 90 %. En las pruebas cubrió entre 85 % y 90 % de los valores reales. Depende del supuesto nacional elegido; no garantiza dónde quedará el resultado de 2027.",
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
