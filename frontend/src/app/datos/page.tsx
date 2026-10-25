import type { Metadata } from "next";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
import { BrandArtwork } from "@/components/ui/brand-artwork";
import { brandImageTokens } from "@/theme/tokens";
import { dataLibrary } from "@/content/data-library";
import { resultsRelease } from "@/content/release";
import comparison from "../../../public/data/publicaciones/resultados-1.3__resultados-1.6.json";
import { PublicationComparison } from "@/components/editorial/publication-comparison";
import { entranceProps } from "@/theme/entrance";

export const metadata: Metadata = { title: "Datos y descargas" };
const comparisonHref = "/data/publicaciones/resultados-1.3__resultados-1.6.json";
const comparisonBytes = readFileSync(resolve(process.cwd(), "public", comparisonHref.slice(1)));
if (JSON.stringify(JSON.parse(comparisonBytes.toString("utf8"))) !== JSON.stringify(comparison)) {
  throw new Error("La comparación cambió durante la compilación. Vuelve a preparar y compilar.");
}
const comparisonFile = {
  bytes: comparisonBytes.byteLength,
  sha256: createHash("sha256").update(comparisonBytes).digest("hex"),
};
const chapters = [
  { id: "archivos", label: "Archivos disponibles" },
  { id: "importar", label: "Cómo usar los archivos" },
  { id: "fuentes", label: "Fuentes y cartografía" },
  { id: "incidencias", label: "Datos que requieren cuidado" },
  { id: "publicaciones", label: "Cambios entre publicaciones" },
];
const incidents = [
  {
    title: "Villa de Pozos: aparece en el mapa, sin estimación",
    text: "Las tablas contienen 2,477 municipios y el mapa tiene límites de 2,478. Villa de Pozos (24059) aparece en gris porque no tiene resultados en esta entrega. Sin dato no significa cero participación.",
  },
  {
    title: "Qué territorio se usa para reunir la historia",
    text: "Se reunieron los resultados anteriores usando el territorio municipal de 2024. El mapa se preparó con información del INEGI consultada el 16 de octubre de 2026 y simplificada para mostrarla aquí. No sustituye los límites oficiales.",
  },
  {
    title: "Ausencias y falta de casillas",
    text: "Una celda vacía significa sin dato. Si una elección tuvo cero participación porque faltaron casillas, se muestra «sin casilla: no se pudo votar». En 15 municipios faltan algunos conteos por edad de 2024 y componentes de intervención. En la publicación vigente se conservan como vacíos; el detalle se consulta en «Cambios entre publicaciones».",
  },
  {
    title: "Qué significa comparar la intervención",
    text: "Hay una sola predicción base y cuatro opciones de intervención. Credencializar puede aumentar tanto los votos como las personas en la lista; por eso puede bajar ligeramente el porcentaje. Si falta un componente, se suma solo lo conocido y se marca «intervencion_parcial» en motivo. Si falta credencialización, ese componente no suma votos ni personas a la lista. Se etiqueta «Supuesto, no efecto medido»: no demuestra que una campaña consiga esos votos.",
  },
];

export default function DataPage() {
  return (
    <ContentPage
      eyebrow="Archivo del proyecto · 02"
      title="Descarga los datos y conoce sus fuentes"
      description="Consulta las tablas, los archivos del mapa y las explicaciones que necesitas para usar los datos sin confundir estimaciones con resultados observados."
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
          description="Para revisar cifras, elige una tabla CSV. Para abrir el mapa en un programa de mapas, elige GeoJSON o GeoPackage. Los JSON describen los datos y permiten verificar los archivos."
        />
        <NotePanel tone="warning" title="Los datos de 2027 son estimaciones y supuestos." announce>
          Los CSV conservan la entrega científica original. Los archivos del mapa incluyen los
          indicadores y cinco escenarios. Ninguno muestra resultados ya observados de 2027 ni
          demuestra el efecto de una intervención.
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
                  gridTemplateColumns: "minmax(0,1fr)",
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
          title="Cómo usar los archivos"
          description="Si vas a abrir o combinar las tablas, cuida estos tres detalles. Un CSV puede abrirse en una hoja de cálculo; los JSON están pensados para otras herramientas."
        />
        <Surface tone="brand" density="editorial" entrance="block">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, .65fr)" },
              alignItems: "center",
              gap: 3,
            }}
          >
            <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 2.5 }}>
              <li>
                <strong>Importa la tabla con sus columnas.</strong> En tu hoja de cálculo, elige
                UTF-8 para conservar acentos y coma como separador. El decimal es punto; las
                comillas dobles protegen los nombres que contienen comas.
              </li>
              <li>
                <strong>Conserva los cinco dígitos de la clave municipal.</strong> La columna
                <code> cvegeo</code> identifica cada municipio. Impórtala como texto para que
                <code> 01001</code> conserve el cero inicial.
              </li>
              <li>
                <strong>No conviertas lo que falta en cero.</strong> Una celda vacía significa que
                no hay dato. Para combinar las tablas de escenarios usa ambas columnas:{" "}
                <code>cvegeo</code> (municipio) y <code>escenario_id</code> (escenario).
              </li>
            </Box>
            <Box
              aria-hidden="true"
              sx={{ width: "100%", maxWidth: brandImageTokens.downloadsWidth, mx: "auto" }}
            >
              <BrandArtwork
                name="downloads"
                sizes="(min-width: 1200px) 320px, (min-width: 900px) 34vw, (min-width: 386px) 320px, calc(100vw - 66px)"
              />
            </Box>
          </Box>
        </Surface>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          La ficha municipal se descarga como JSON para reutilizarla con otras herramientas. GeoJSON
          y GeoPackage contienen los mismos límites y resultados municipales; elige el formato que
          admita tu programa de mapas, por ejemplo QGIS.
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
          title="Datos que requieren cuidado"
          description="Estas situaciones ayudan a distinguir una cifra real, una ausencia y una estimación antes de usar los archivos."
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
      <Box component="section" id="publicaciones" aria-labelledby="publicaciones-title">
        <SectionHeading
          number="05"
          id="publicaciones-title"
          title="Cambios entre publicaciones"
          description="Conoce qué se corrigió en los archivos. Comparar publicaciones ayuda a revisar su procedencia; es distinto de comparar escenarios sin y con intervención."
        />
        <PublicationComparison
          data={comparison}
          currentVersion={resultsRelease.version}
          downloadHref={comparisonHref}
          fileInfo={comparisonFile}
        />
      </Box>
      <Box sx={{ mt: 6 }}>
        <Surface tone="brand" entrance="block">
          <Typography component="h2" variant="h3" sx={{ mb: 1 }}>
            Un archivo necesita contexto
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Revisa entre quiénes se calcula cada porcentaje, qué significa el color del mapa y cómo
            se comparan los escenarios. El color de riesgo, por sí solo, no determina dónde conviene
            destinar recursos.
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
