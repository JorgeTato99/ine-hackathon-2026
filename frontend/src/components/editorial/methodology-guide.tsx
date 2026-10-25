import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ContentPage } from "@/components/layout/content-page";
import { SectionHeading } from "@/components/ui/section-heading";
import { BrandArtwork } from "@/components/ui/brand-artwork";
import { TraceOverview } from "./trace-overview";
import { brandImageTokens } from "@/theme/tokens";
import { entranceProps } from "@/theme/entrance";
import { resultMetadata, resultsRelease } from "@/content/release";
import manifest from "../../../public/data/manifest.json";

export const metadata: Metadata = { title: "Metodología y alcance" };
const chapters = [
  { id: "recorrido", label: "La pregunta del mapa" },
  { id: "participacion", label: "Predicción y rango" },
  { id: "dimensiones", label: "Leer el color" },
  { id: "factores", label: "Factores del modelo" },
  { id: "comparar", label: "Tipos de intervención" },
  { id: "territorio", label: "Histórico y límites" },
];
const content = [
  {
    title: "Qué responde el mapa",
    description:
      "Dónde podría votar menos gente el 6 de junio de 2027, comparado con el resto del país.",
    paragraphs: [
      "Pronóstico 2027 presenta una sola predicción base por municipio y cuatro opciones de intervención supuesta. Histórico permite recorrer la participación observada de 2009 a 2024. El mapa reúne datos agregados; no identifica ni predice la conducta de personas.",
      "La participación observada cuenta a quienes tienen registro conocido de si votaron o no. En los archivos se calcula como votaron / (votaron + no votaron). Las personas sin ese dato se tratan por separado. Un porcentaje de 60 % significa 60 de cada 100 personas consideradas.",
    ],
  },
  {
    title: "La participación esperada y su rango",
    description: "51.4 % es una estimación del país, no un resultado conocido de antemano.",
    paragraphs: [
      "El nivel nacional se estima con el calendario electoral local de 2027, utilizando tres elecciones intermedias anteriores. Su error de prueba es de unos 3.3 puntos porcentuales. Delta con guardia parte de la posición municipal en la presidencial anterior y estima su cambio; si ese antecedente falta o está afectado por ausencia de casillas, usa un modelo de nivel. La evaluación es retrospectiva con datos revisados, no una prueba independiente del resultado de 2027.",
      "El rango de cada municipio combina su incertidumbre con la del nivel nacional. Mide aproximadamente entre 18 y 29 puntos de ancho. Es una aproximación al 90 %: la cobertura varía entre grupos y no garantiza lo que ocurrirá en 2027. Por ejemplo, pasar de 40 % a 45 % es subir 5 puntos, no 5 %.",
      "Las cifras del país y de los estados se ponderan con las personas en la lista de 2024. Si la intervención incorpora nuevas personas a esa lista, también se amplía el denominador. Por eso no debe promediarse directamente el porcentaje de todos los municipios.",
    ],
  },
  {
    title: "Qué significa el color",
    description:
      "El semáforo compara riesgo entre municipios; no decide por sí solo dónde destinar recursos.",
    paragraphs: [
      "Sin intervención, rojo identifica el 20 % de mayor riesgo de baja participación; amarillo, el 20 % siguiente; verde, el resto. Hay 495 rojos, 496 amarillos y 1,486 verdes. El gris identifica una ausencia de datos y no un nivel de riesgo.",
      "Con intervención se conserva la línea de comparación inicial: un municipio puede cambiar de color si su participación supuesta cruza ese umbral. La leyenda permite resaltarlos; sus conteos corresponden al país o estado elegido y al tipo de intervención actual.",
      "La probabilidad de rojo describe resultados simulados sin intervención. Un valor de 80 % o más se lee como probable, nunca seguro. El rojo puede reflejar menor participación relativa sin que haya un descenso frente a la última elección. No etiqueta a un municipio ni prueba una causa.",
    ],
  },
  {
    title: "Qué empuja la predicción",
    description:
      "Cinco grupos de variables reparten la distancia de la predicción base frente al país.",
    paragraphs: [
      "Las barras muestran historia de participación; calendario y usos y costumbres; lista y población; condiciones sociales; y competencia política. Una barra a la izquierda baja la predicción relativa y una a la derecha la sube. Sus aportaciones suman la distancia de la predicción sin intervención al nivel nacional, con pequeñas diferencias de redondeo.",
      "Es un reparto de la predicción del modelo; no son causas probadas. Las barras siempre explican la predicción base, incluso cuando se consulta una intervención. La tasa de homicidios en logaritmo es una de las 34 variables; la policía, la justicia cívica y la comparación estatal de fuentes son contexto. La importancia de variables publicada en el análisis corresponde a la parte Huber, no a todo el ensamble.",
    ],
  },
  {
    title: "Qué supone cada intervención",
    description:
      "Cinco opciones: ninguna, tres acciones por separado y las tres juntas. Supuesto, no efecto medido.",
    paragraphs: [
      "Retener primerizos: quienes tenían entre 18 y 20 años y votaron en 2024 mantienen su participación respecto del municipio. Jóvenes 20–29: ese grupo recorta a la mitad su distancia con la participación municipal. Credencialización: nuevos votantes tramitan su credencial y participan como los jóvenes de su municipio en 2021.",
      "Las acciones se calculan solo en los 495 municipios rojos sin intervención. Las cifras estatales y nacionales son la suma de las cuentas municipales. No se está midiendo ni demostrando la eficacia de una campaña.",
      "Credencializar suma votos y personas a la lista: puede bajar ligeramente el porcentaje si las nuevas personas participan menos que el promedio. Es una medida de inclusión. Por eso las tres acciones juntas no siempre producen el mayor porcentaje o sacan del rojo a cada municipio.",
      "Con las tres acciones se calculan 528,400 votos adicionales y 84 municipios que salen del rojo; quedan 411. Si falta un componente, se suma solo lo conocido y se muestra Intervención calculada solo con los datos disponibles. Si falta credencialización, ese componente tampoco agrega personas a la lista.",
    ],
  },
  {
    title: "Histórico, territorio y límites",
    description:
      "Las elecciones intermedias y presidenciales se distinguen. Sin casilla no es abstención; sin dato no es cero.",
    paragraphs: [
      "El histórico usa los mismos cortes de participación en todos los años: menos de 40 %, 40–50 %, 50–60 %, 60–70 % y 70 % o más. Las intermedias son 2009, 2015 y 2021; las otras tres elecciones históricas son presidenciales. El año y el tipo de elección importan al comparar.",
      "La historia municipal se reúne sobre el territorio de 2024. Las claves se conservan como texto de cinco dígitos. Hay 2,477 municipios con resultados y 2,478 geometrías: Villa de Pozos tiene límites, pero no datos electorales. La cartografía simplificada es una ayuda visual; no sustituye límites oficiales.",
      "Una celda vacía es un dato ausente, nunca cero. Cuando se identifica falta de casillas, el histórico muestra sin casilla: no se pudo votar y deja un hueco en la línea. La alerta va aparte del semáforo. En 15 municipios faltan ciertos conteos por edad de 2024; sus pronósticos no desaparecen por ello.",
      "El nivel nacional se estima con pocas elecciones; los intervalos son amplios y el calendario puede cambiar. Estos resultados orientan exploración y planeación. Las decisiones de priorización requieren además objetivos explícitos, recursos y revisión territorial.",
    ],
  },
];

export default function MethodologyGuide() {
  return (
    <ContentPage
      eyebrow="Cuaderno de lectura · 01"
      title="Cómo leer los resultados"
      description="Una guía para distinguir lo observado, entender la predicción y comparar las intervenciones sin perder sus límites."
      chapters={chapters}
      aside={<TraceOverview />}
    >
      {content.map((section, index) => (
        <Box
          component="section"
          key={chapters[index]!.id}
          id={chapters[index]!.id}
          aria-labelledby={`${chapters[index]!.id}-title`}
        >
          <SectionHeading
            number={String(index + 1).padStart(2, "0")}
            id={`${chapters[index]!.id}-title`}
            title={section.title}
            description={section.description}
          />
          {index === 0 && (
            <Box
              aria-hidden="true"
              {...entranceProps("block")}
              sx={{ maxWidth: brandImageTokens.methodologyWidth, mx: "auto", mb: 4 }}
            >
              <BrandArtwork
                name="methodology"
                sizes="(min-width: 1200px) 760px, (min-width: 900px) 65vw, calc(100vw - 64px)"
              />
            </Box>
          )}
          <Box data-entrance-group sx={{ display: "grid", gap: 2.5, maxWidth: "76ch" }}>
            {section.paragraphs.map((paragraph) => (
              <Typography key={paragraph} {...entranceProps("item")} color="text.secondary">
                {paragraph}
              </Typography>
            ))}
          </Box>
          {index === 1 && (
            <Box component="details" sx={{ mt: 3 }}>
              <Typography component="summary" sx={{ cursor: "pointer", color: "primary.main" }}>
                Modelo y validación: detalles técnicos
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {resultMetadata.modelo}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {resultMetadata.intervalo}
              </Typography>
            </Box>
          )}
        </Box>
      ))}
      <Box sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Versión {resultsRelease.version}. Los metadatos conservan las fuentes, unidades y
          advertencias entregadas por el equipo de datos.
        </Typography>
        <Button component="a" href={`/data/${resultsRelease.version}/metadatos.json`}>
          Consultar los metadatos
        </Button>
        <Button
          component="a"
          href={`${manifest.source.repository}/blob/${manifest.source.commit}/docs/metodologia/README.md`}
        >
          Metodología técnica y límites
        </Button>
        <Button component="a" href="/datos/">
          Datos y descargas
        </Button>
      </Box>
    </ContentPage>
  );
}
