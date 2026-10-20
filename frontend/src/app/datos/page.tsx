import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ContentPage } from "@/components/layout/content-page";
import { ArchiveOverview } from "@/components/editorial/archive-overview";
import { FileCard } from "@/components/editorial/file-card";
import { SourceReference } from "@/components/editorial/source-reference";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { NotePanel } from "@/components/ui/note-panel";
import { DataStatus } from "@/components/ui/data-status";
import { Icon } from "@/components/ui/icon";
import { dataLibrary } from "@/content/data-library";
import { resultsRelease } from "@/content/release";
import { entranceProps } from "@/theme/entrance";

export const metadata: Metadata = { title: "Datos y descargas" };
const chapters = [
  { id: "archivos", label: "Archivos disponibles" },
  { id: "importar", label: "Antes de importar" },
  { id: "fuentes", label: "Fuentes y cartografía" },
  { id: "incidencias", label: "Incidencias del corte" },
];
const incidents = [
  {
    title: "Villa de Pozos: geometría sin resultados",
    text: "Los CSV contienen 2,477 municipios y la capa tiene 2,478 geometrías. Villa de Pozos (24059) se conserva en gris y sin estimación; su ausencia no se convierte en cero.",
  },
  {
    title: "Geometría e historia",
    text: "La historia fue reconstruida por el análisis con territorio de 2024. La cartografía de visualización procede del servicio INEGI capturado el 16 de octubre de 2026; no sustituye límites oficiales.",
  },
  {
    title: "Ausencias y falta de casillas",
    text: "Vacío significa sin dato. Los ceros históricos identificados como falta de casillas se muestran como «sin casilla: no se pudo votar». Los 15 NaN literales de brecha_jovenes_2024 se normalizan a ausencia solo en la exportación web; el CSV original permanece intacto.",
  },
  {
    title: "Comparabilidad",
    text: "Se comparan sin y con intervención dentro del mismo nivel nacional. El resultado es aritmético y se etiqueta «Supuesto, no efecto medido»; no acredita eficacia de campañas.",
  },
];

export default function DataPage() {
  return (
    <ContentPage
      eyebrow="Archivo del proyecto · 02"
      title="Datos abiertos, lectura responsable"
      description="Elige el archivo adecuado, conserva sus claves y sigue la procedencia de cada dato que aparece en el explorador."
      chapters={chapters}
      action={{ href: "#archivos", label: "Ver archivos" }}
      aside={<ArchiveOverview />}
    >
      <Box component="section" id="archivos" aria-labelledby="archivos-title">
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 3 }}>
          <DataStatus status="modeled" label={`${resultsRelease.version} · pronóstico 2027`} />
          <Typography variant="caption" color="text.secondary">
            Tamaños del corte publicado · kB/MB decimales
          </Typography>
        </Box>
        <SectionHeading
          number="01"
          id="archivos-title"
          title="Archivos disponibles"
          description="Tablas para analizar, geometría para visualizar y metadatos para interpretar. Los formatos cumplen funciones diferentes."
        />
        <NotePanel tone="warning" title="Originales conservados, pronósticos con límites." announce>
          Los CSV conservan la entrega científica original. Los GeoJSON y GPKG descargables
          incorporan indicadores y los seis escenarios. Los datos de 2027 son pronósticos y
          supuestos, no observaciones futuras ni efectos medidos.
        </NotePanel>
        <Box sx={{ mt: 4, display: "grid", gap: 4 }}>
          {dataLibrary.map((group, index) => (
            <Box key={group.title}>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "baseline", mb: 0.75 }}>
                <Typography
                  component="span"
                  aria-hidden="true"
                  variant="caption"
                  color="text.secondary"
                >
                  {String(index + 1).padStart(2, "0")}
                </Typography>
                <Typography component="h3" variant="h3">
                  {group.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {group.description}
              </Typography>
              <Box
                data-entrance-group
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: group.files.length === 1 ? "1fr" : "repeat(2,minmax(0,1fr))",
                    xl: `repeat(${group.files.length},minmax(0,1fr))`,
                  },
                  gap: 2,
                }}
              >
                {group.files.map((resource) => (
                  <FileCard key={resource.href} resource={resource} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box component="section" id="importar" aria-labelledby="importar-title">
        <SectionHeading
          number="02"
          id="importar-title"
          title="Antes de importar"
          description="Tres detalles pequeños evitan perder la identidad de un municipio o convertir una ausencia en un resultado."
        />
        <Surface tone="brand" density="editorial" entrance="block">
          <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 2.5 }}>
            <li>
              <strong>Conserva el formato.</strong> Lee los CSV en UTF-8, con separador coma, punto
              decimal y comillas dobles para nombres que contienen comas.
            </li>
            <li>
              <strong>Claves como texto.</strong> Importa <code>cvegeo</code> como texto de cinco
              posiciones: <code>01001</code> no es lo mismo que perder su cero inicial.
            </li>
            <li>
              <strong>Respeta la unidad y los vacíos.</strong> Une los escenarios por{" "}
              <code>cvegeo</code> + <code>escenario_id</code>. Una celda vacía significa ausencia,
              nunca cero.
            </li>
          </Box>
        </Surface>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          La ficha JSON del explorador mantiene identificadores textuales y el contexto de la
          consulta. GeoJSON y GeoPackage son alternativas para la misma capa geométrica.
        </Typography>
      </Box>
      <Box component="section" id="fuentes" aria-labelledby="fuentes-title">
        <SectionHeading
          number="03"
          id="fuentes-title"
          title="Historia electoral y cartografía"
          description="Dos fuentes distintas, unidas por identidad territorial y acompañadas por sus condiciones de uso."
        />
        <Box sx={{ display: "grid", gap: 2 }}>
          <SourceReference
            institution="INE · CCPC"
            title="Historia electoral"
            description="Conteos Censales de Participación Ciudadana, elecciones de 2009 a 2024. Información agregada, sin datos personales."
            detail="La serie combina CCPC y actas oficiales según las reglas del análisis; conserva vacíos y antecedentes de falta de casillas. Las decisiones y unidades acompañan a los archivos."
            href="https://ine.mx/transparencia/datos-abiertos/visualizacion-datos/conteos-censales-participacion/"
            linkLabel="Consultar la fuente del INE"
          />
          <SourceReference
            institution="INEGI · Marco Geoestadístico"
            title="Cartografía"
            description="Captura del servicio municipal del 16 de octubre de 2026. Los metadatos originales por entidad se conservan en el manifiesto."
            detail="Geometría reproyectada y simplificada por el equipo para visualización. La transformación no es una publicación oficial del INEGI ni acredita límites históricos constantes."
            href="https://www.inegi.org.mx/inegi/terminos.html"
            linkLabel="Créditos y términos de libre uso del INEGI"
          />
        </Box>
      </Box>
      <Box component="section" id="incidencias" aria-labelledby="incidencias-title">
        <SectionHeading
          number="04"
          id="incidencias-title"
          title="Incidencias y decisiones de presentación"
          description="Qué conserva este corte, qué omite la interfaz y por qué conviene consultar el contexto antes de usar los archivos."
        />
        <Box component="dl" data-entrance-group sx={{ m: 0 }}>
          {incidents.map((item) => (
            <Box
              key={item.title}
              {...entranceProps("item")}
              sx={{ py: 2.5, borderTop: 1, borderColor: "divider" }}
            >
              <Typography component="dt" sx={{ fontWeight: 700, mb: 1 }}>
                {item.title}
              </Typography>
              <Typography component="dd" color="text.secondary" sx={{ m: 0 }}>
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ mt: 6 }}>
        <Surface tone="brand" entrance="block">
          <Typography component="h2" variant="h3" sx={{ mb: 1 }}>
            Un archivo necesita contexto
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Revisa el denominador, la diferencia entre riesgo y prioridad y las condiciones para
            comparar escenarios.
          </Typography>
          <Button
            component="a"
            href="/metodologia/"
            endIcon={<Icon name="arrow" size={16} />}
            sx={{ p: 0 }}
          >
            Leer la metodología
          </Button>
        </Surface>
      </Box>
    </ContentPage>
  );
}
