import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ContentPage } from "@/components/layout/content-page";
import { TraceOverview } from "@/components/editorial/trace-overview";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { NotePanel } from "@/components/ui/note-panel";
import { DataStatus } from "@/components/ui/data-status";
import { Icon } from "@/components/ui/icon";
import { typeScale } from "@/theme/tokens";
import { resultMetadata } from "@/content/release";
import { entranceProps } from "@/theme/entrance";

export const metadata: Metadata = { title: "Metodología y alcance" };
const chapters = [
  { id: "recorrido", label: "Del dato al territorio" },
  { id: "participacion", label: "Leer la participación" },
  { id: "dimensiones", label: "Riesgo, estado y prioridad" },
  { id: "comparar", label: "Comparar escenarios" },
  { id: "territorio", label: "Territorio e incidencias" },
];
const stages = [
  {
    number: "01",
    title: "Partir de lo observado",
    status: "observed" as const,
    text: "Participación municipal de 2009 a 2024. Se conserva el tipo de elección, la ausencia de datos y las incidencias conocidas.",
    detail: "La historia ayuda a entender el municipio; no determina por sí sola lo que ocurrirá.",
  },
  {
    number: "02",
    title: "Estimar qué municipios podrían participar menos",
    status: "modeled" as const,
    text: "El análisis usa la historia y características de los municipios para compararlos. Se probó con elecciones anteriores. La participación total del país se plantea con tres supuestos porque el modelo no la predice.",
    detail: "El color compara riesgo; no decide por sí solo dónde destinar recursos.",
  },
  {
    number: "03",
    title: "Consultar con contexto",
    status: "modeled" as const,
    text: "Pronóstico 2027 e indicadores se consultan en pestañas separadas. Seis escenarios permiten comparar sin y con intervención hipotética, manteniendo el mismo nivel nacional.",
    detail:
      "Las opciones muestran cálculos ya preparados y conservan los mismos supuestos al comparar.",
  },
];
const dimensions = [
  {
    name: "Riesgo",
    question: "¿Qué significa el color de un municipio?",
    detail:
      "El semáforo compara municipios entre sí. Sin intervención, el rojo reúne al 20 % con mayor riesgo de menor participación; el amarillo al 20 % siguiente y el verde al resto. Cambiar el supuesto nacional no cambia estos colores de partida.",
    limit: "Un color no determina por sí solo dónde asignar recursos.",
  },
  {
    name: "Estado de la estimación",
    question: "¿Hay información para mostrar una estimación?",
    detail:
      "Indica si existe una estimación y avisa cuando falta información. Si no hay un dato, se muestra como tal; no se inventa un cero.",
    limit: "Que exista una estimación no garantiza que sea precisa.",
  },
  {
    name: "Prioridad",
    question: "¿Dónde conviene atender primero?",
    detail:
      "Para decidir dónde destinar recursos hacen falta objetivos y criterios explícitos. El color del mapa es una parte de esa información.",
    limit:
      "Un municipio con menor porcentaje de participación no siempre reúne a más personas que no votan. La falta de casillas también se revisa por separado.",
  },
];

export default function MethodologyPage() {
  return (
    <ContentPage
      eyebrow="Cuaderno de lectura · 01"
      title="Cómo leer los resultados"
      description="Una guía para recorrer la participación: distinguir lo observado, entender los escenarios y reconocer sus límites."
      chapters={chapters}
      aside={<TraceOverview />}
    >
      <Box component="section" id="recorrido" aria-labelledby="recorrido-title">
        <NotePanel
          tone="warning"
          title="Una estimación no es una certeza ni un efecto comprobado."
          announce
        >
          El análisis compara municipios, pero no sabe cuánta gente votará en todo el país en 2027.
          Por eso se prueban tres porcentajes nacionales. La intervención es una cuenta hipotética:
          no demuestra lo que conseguiría una campaña.
        </NotePanel>
        <Box component="details" sx={{ mt: 2 }}>
          <Box component="summary" sx={{ cursor: "pointer", color: "primary.main" }}>
            Detalles técnicos del modelo
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {resultMetadata.modelo}
          </Typography>
        </Box>
        <Box sx={{ mt: 4 }}>
          <SectionHeading
            number="01"
            id="recorrido-title"
            title="Del dato al territorio"
            description="La consulta reúne historia electoral agregada, análisis y cartografía. Cada etapa responde una pregunta diferente."
          />
        </Box>
        <Box component="ol" data-entrance-group sx={{ listStyle: "none", m: 0, p: 0 }}>
          {stages.map((stage, index) => (
            <Box
              component="li"
              {...entranceProps("item")}
              key={stage.number}
              sx={{
                display: "grid",
                gridTemplateColumns: "40px minmax(0,1fr)",
                gap: { xs: 1.5, sm: 3 },
                pb: index === stages.length - 1 ? 0 : 3,
                position: "relative",
              }}
            >
              {index !== stages.length - 1 && (
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    left: 19,
                    top: 40,
                    bottom: 0,
                    borderLeft: 1,
                    borderColor: "divider",
                  }}
                />
              )}
              <Box
                aria-hidden="true"
                sx={{
                  height: 40,
                  width: 40,
                  borderRadius: "50%",
                  border: 1,
                  borderColor: "divider",
                  display: "grid",
                  placeItems: "center",
                  color: "primary.main",
                  bgcolor: "background.paper",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {stage.number}
              </Box>
              <Box sx={{ pt: 0.5 }}>
                <Box
                  sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 1 }}
                >
                  <Typography component="h3" variant="h3">
                    {stage.title}
                  </Typography>
                  <DataStatus status={stage.status} />
                </Box>
                <Typography>{stage.text}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {stage.detail}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box component="section" id="participacion" aria-labelledby="participacion-title">
        <SectionHeading
          number="02"
          id="participacion-title"
          title="Cómo leer la participación"
          description="El porcentaje indica cuántas personas votaron de cada 100 con dato conocido. Es importante saber a quiénes incluye la cuenta."
        />
        <Surface tone="brand" density="editorial" entrance="block">
          <Typography variant="overline" component="p" sx={{ m: 0, color: "primary.main" }}>
            Participación observada
          </Typography>
          <Box
            component="figure"
            sx={{
              m: 0,
              my: 3,
              display: "flex",
              alignItems: "center",
              gap: { xs: 2, sm: 4 },
              flexWrap: "wrap",
            }}
          >
            <Typography
              component="span"
              sx={{
                ...typeScale.section,
                fontSize: { xs: 24, sm: 34 },
                color: "primary.main",
                letterSpacing: "-.035em",
              }}
            >
              ¿Cuántas personas votaron de cada 100?
            </Typography>
            <Typography component="figcaption" variant="body2" sx={{ maxWidth: "30ch" }}>
              Se cuentan quienes tienen registro de si votaron o no. Las personas sin ese dato se
              tratan por separado.
            </Typography>
          </Box>
          <Box
            component="dl"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: 2,
              m: 0,
            }}
          >
            {[
              { code: "SV", label: "Sí votaron" },
              { code: "NV", label: "No votaron" },
              { code: "NS", label: "No se conoce si votaron; se excluyen de esta cuenta" },
            ].map((item) => (
              <Box key={item.code} sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
                <Typography component="dt" sx={{ fontWeight: 700 }}>
                  {item.code}
                </Typography>
                <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.5 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
          <Box component="details" sx={{ mt: 2 }}>
            <Box component="summary" sx={{ cursor: "pointer", color: "primary.main" }}>
              Ver la fórmula de participación
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Participación = SV / (SV + NV) × 100. Si SV + NV es cero, no se calcula este
              porcentaje.
            </Typography>
          </Box>
        </Surface>
        <Box
          sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mt: 3 }}
        >
          <Box>
            <Typography component="h3" variant="h3" sx={{ mb: 1 }}>
              Ausencia no es cero
            </Typography>
            <Typography color="text.secondary">
              Un valor ausente no equivale a 0 %. Si no hubo casillas se muestra «sin casilla: no se
              pudo votar», en lugar de atribuir el cero a abstención voluntaria. La interfaz
              conserva huecos y motivos.
            </Typography>
          </Box>
          <Box>
            <Typography component="h3" variant="h3" sx={{ mb: 1 }}>
              Porcentaje y puntos porcentuales
            </Typography>
            <Typography color="text.secondary">
              Un 60 % equivale a 60 de cada 100 personas consideradas. Ejemplo ilustrativo: pasar de
              60 % a 65 % es subir 5 puntos porcentuales. En los archivos, un valor como 0.60
              representa 60 %.
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          La comparación entre municipios es más confiable que la cifra exacta. Por eso cada
          estimación muestra un rango, llamado intervalo del 90 %. Suele extenderse entre 8 y 15
          puntos porcentuales hacia cada lado, según el tamaño de la lista electoral. En las pruebas
          con elecciones anteriores, estos rangos incluyeron entre 85 % y 90 % de los resultados
          reales: no son una garantía para 2027.
        </Typography>
      </Box>
      <Box component="section" id="dimensiones" aria-labelledby="dimensiones-title">
        <SectionHeading
          number="03"
          id="dimensiones-title"
          title="Tres dimensiones diferentes"
          description="Leer el riesgo, conocer el registro y decidir una prioridad son tareas relacionadas, con significados distintos."
        />
        <Box component="dl" data-entrance-group sx={{ m: 0 }}>
          {dimensions.map((item) => (
            <Box
              key={item.name}
              {...entranceProps("item")}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "180px minmax(0,1fr)" },
                gap: { xs: 1, sm: 3 },
                py: 3,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Typography component="dt" sx={{ fontWeight: 700, color: "primary.main" }}>
                {item.name}
              </Typography>
              <Box component="dd" sx={{ m: 0 }}>
                <Typography sx={{ fontWeight: 500, mb: 1 }}>{item.question}</Typography>
                <Typography color="text.secondary">{item.detail}</Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 1.5, pl: 2, borderLeft: 2, borderColor: "divider" }}
                >
                  {item.limit}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box component="section" id="comparar" aria-labelledby="comparar-title">
        <SectionHeading
          number="04"
          id="comparar-title"
          title="Cómo comparar sin y con intervención"
          description="Compara dos cálculos que parten del mismo porcentaje de participación del país: uno sin intervención y otro con una intervención supuesta."
        />
        <Surface entrance="block">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>Antes de interpretar una diferencia</Typography>
            <DataStatus status="modeled" label="Mismo supuesto de participación del país" />
          </Box>
          <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 2 }}>
            <li>
              <strong>Conservar el punto de partida.</strong> Si cambia el porcentaje nacional, la
              diferencia ya no corresponde solo a la intervención. La aplicación mantiene ese
              porcentaje al comparar.
            </li>
            <li>
              <strong>Comparar el mismo municipio.</strong> Cada porcentaje nacional tiene dos
              opciones: sin intervención y con intervención. Se mantienen las demás condiciones para
              comparar el mismo caso.
            </li>
            <li>
              <strong>Recordar que es un supuesto.</strong> La cuenta se aplica solo a los
              municipios rojos sin intervención. La etiqueta «Supuesto, no efecto medido» indica que
              no es una mejora comprobada ni una promesa de lo que ocurrirá.
            </li>
          </Box>
        </Surface>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          La cuenta suma tres supuestos: mantener la participación de la generación más joven de
          2024, reducir a la mitad la diferencia de participación de jóvenes e incorporar nuevos
          votantes a la lista electoral. El último aumenta los votos y las personas registradas, por
          lo que el porcentaje puede cambiar poco. La ficha muestra cuánto aporta cada supuesto.
        </Typography>
      </Box>
      <Box component="section" id="territorio" aria-labelledby="territorio-title">
        <SectionHeading
          number="05"
          id="territorio-title"
          title="Límites del mapa y datos que faltan"
          description="La clave municipal permite reunir datos del mismo municipio. Sus límites pueden haber cambiado entre elecciones."
        />
        <Box sx={{ display: "grid", gap: 3 }}>
          <Box>
            <Typography component="h3" variant="h3" sx={{ mb: 1 }}>
              De dónde vienen los límites del mapa
            </Typography>
            <Typography color="text.secondary">
              Los límites se obtuvieron del INEGI el 16 de octubre de 2026 y se simplificaron para
              que el mapa cargue mejor. La historia se reconstruyó sobre el territorio de 2024. Este
              mapa sirve para explorar información; no reemplaza los límites oficiales.
            </Typography>
          </Box>
          <NotePanel title="Paracho y Parácuaro · Historia de 2021">
            Se corrigió un intercambio de nombres en la fuente de 2021 para no asignar a un
            municipio los datos del otro. La historia que se muestra ya incorpora esa corrección.
          </NotePanel>
        </Box>
      </Box>
      <Box sx={{ mt: 6 }}>
        <Surface tone="brand" entrance="block">
          <Typography component="h2" variant="h3" sx={{ mb: 1 }}>
            Consulta los archivos y sus fuentes
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Puedes descargar las tablas, los mapas y la información de la versión utilizada.
          </Typography>
          <Button
            component="a"
            href="/datos/"
            endIcon={<Icon name="arrow" size={16} />}
            variant="text"
            sx={{ p: 0 }}
          >
            Ir a datos y descargas
          </Button>
        </Surface>
      </Box>
    </ContentPage>
  );
}
