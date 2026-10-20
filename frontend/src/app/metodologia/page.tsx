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
    detail: "La historia aporta contexto; no fija por sí sola la referencia predictora.",
  },
  {
    number: "02",
    title: "Modelar la posición relativa",
    status: "modeled" as const,
    text: "Ensamble de regresión robusta Huber y random forest con 34 variables. Validación de una transición presidencial–intermedia a la otra; el nivel nacional se mantiene como escenario.",
    detail: "El diseño de la interfaz no decide el modelo ni la prioridad territorial.",
  },
  {
    number: "03",
    title: "Consultar con contexto",
    status: "modeled" as const,
    text: "Pronóstico 2027 e indicadores se consultan en pestañas separadas. Seis escenarios permiten comparar sin y con intervención hipotética, manteniendo el mismo nivel nacional.",
    detail: "Cambiar una selección consulta un archivo; no genera escenarios nuevos.",
  },
];
const dimensions = [
  {
    name: "Riesgo",
    question: "¿Cómo se clasifica el territorio?",
    detail:
      "Es riesgo relativo: rojo para el 20 % de mayor riesgo, amarillo para el 20 % siguiente y verde para el resto. El color sin intervención no cambia al seleccionar otro nivel nacional.",
    limit: "Un color no determina por sí solo dónde asignar recursos.",
  },
  {
    name: "Estado de la estimación",
    question: "¿Qué registro está disponible?",
    detail:
      "Comunica el estado declarado y su motivo, junto con las condiciones de lectura. Una ausencia queda identificada.",
    limit: "«Estimado» no acredita por sí solo calidad alta.",
  },
  {
    name: "Prioridad",
    question: "¿Con qué criterio se ordena la atención?",
    detail:
      "Requiere un criterio científico explícito y recomendaciones preventivas. No se deduce automáticamente del semáforo.",
    limit:
      "Una mayor tasa, un mayor volumen de personas y una alerta sin casilla requieren lecturas distintas; un único color no sustituye el criterio de asignación.",
  },
];

export default function MethodologyPage() {
  return (
    <ContentPage
      eyebrow="Cuaderno de lectura · 01"
      title="Leer los resultados con contexto"
      description="Una guía para recorrer la participación: distinguir lo observado, entender los escenarios y reconocer sus límites."
      chapters={chapters}
      aside={<TraceOverview />}
    >
      <Box component="section" id="recorrido" aria-labelledby="recorrido-title">
        <NotePanel
          tone="warning"
          title="Pronóstico condicionado, no certeza ni efecto causal."
          announce
        >
          El modelo ordena municipios y expresa incertidumbre. No predice el nivel nacional: se
          consultan tres niveles de partida. La intervención es un cálculo con supuestos, no el
          efecto medido de una campaña.
        </NotePanel>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {resultMetadata.modelo}
        </Typography>
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
          description="Primero el denominador. Una proporción solo se interpreta bien cuando sabemos quiénes están incluidos."
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
              SV / (SV + NV)
            </Typography>
            <Typography component="figcaption" variant="body2" sx={{ maxWidth: "30ch" }}>
              Personas que votaron, entre quienes votaron o no votaron.
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
              { code: "NS", label: "Sin dato; fuera del denominador" },
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
              Proporción, porcentaje y puntos
            </Typography>
            <Typography color="text.secondary">
              0.60 se comunica como 60 %. Una diferencia de 0.01 de proporción equivale a un punto
              porcentual, no a 1 % de crecimiento relativo.
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          La posición es más confiable que la cifra exacta. Los intervalos nominales son de 90 %,
          suelen abarcar de ±8 a ±15 pp y dependen del tamaño de la lista. La cobertura observada en
          la validación fue de 85 % a 90 %.
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
          title="Comparar exige condiciones compatibles"
          description="La lectura A/B presenta dos resultados precalculados, junto con su contexto nacional e intervención."
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
            <DataStatus status="modeled" label="Parejas del mismo nivel nacional" />
          </Box>
          <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 2 }}>
            <li>
              <strong>Revisar el contexto.</strong> Si cambia el nivel nacional, una diferencia no
              puede atribuirse solamente a la intervención.
            </li>
            <li>
              <strong>Confirmar la pareja.</strong> La entrega identifica tres parejas canónicas:
              sin y con intervención dentro de cada nivel nacional, sin cambiar las demás
              condiciones.
            </li>
            <li>
              <strong>Conservar los límites.</strong> Los supuestos se aplican solo en los rojos de
              referencia y se etiquetan «Supuesto, no efecto medido». No validan eficacia ni
              garantizan una mejora.
            </li>
          </Box>
        </Surface>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          La intervención suma retención de primerizos, cierre de la mitad de la brecha joven y
          credencialización de nuevos votantes. El último supuesto también aumenta la lista nominal.
          Las cifras e intervalos se reciben precalculados; no se entrena ni se ejecuta el modelo en
          el navegador.
        </Typography>
      </Box>
      <Box component="section" id="territorio" aria-labelledby="territorio-title">
        <SectionHeading
          number="05"
          id="territorio-title"
          title="Territorio, cobertura e incidencias"
          description="Una clave permite enlazar identidades. No demuestra por sí sola que los límites hayan permanecido iguales entre elecciones."
        />
        <Box sx={{ display: "grid", gap: 3 }}>
          <Box>
            <Typography component="h3" variant="h3" sx={{ mb: 1 }}>
              Cartografía con procedencia
            </Typography>
            <Typography color="text.secondary">
              La captura municipal del servicio INEGI del 16 de octubre de 2026 conserva sus
              metadatos por entidad. Fue reproyectada y simplificada para visualización. La
              reconstrucción de historia con territorio de 2024 pertenece al análisis científico;
              esta simplificación de visualización no sustituye límites oficiales.
            </Typography>
          </Box>
          <NotePanel title="Paracho y Parácuaro · Historia de 2021">
            La entrega real sustituye la muestra anterior: utiliza la correspondencia por CVEGEO y
            la historia reconstruida del análisis. No se arrastra la omisión provisional de esos dos
            valores de 2021.
          </NotePanel>
        </Box>
      </Box>
      <Box sx={{ mt: 6 }}>
        <Surface tone="brand" entrance="block">
          <Typography component="h2" variant="h3" sx={{ mb: 1 }}>
            Sigue la traza hasta los archivos
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Consulta las fuentes, la cartografía y el manifiesto que acompañan a esta publicación.
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
