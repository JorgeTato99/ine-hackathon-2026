import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { NotePanel } from "@/components/ui/note-panel";
import { DataStatus } from "@/components/ui/data-status";
import { FileCard } from "./file-card";
import { TraceOverview } from "./trace-overview";
import { ArchiveOverview } from "./archive-overview";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ChapterNav } from "./chapter-nav";
import { EntranceScope } from "@/components/motion/entrance-scope";
import { entranceProps } from "@/theme/entrance";
import { entrancePresets } from "@/theme/tokens";

const meta = {
  title: "Sistema de diseño/Composiciones",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cabeceras: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: 5, maxWidth: 900 }}>
      <ThemeToggle />
      <PageHeader
        eyebrow="Analítica · compacta"
        title="El territorio, en contexto"
        description="Una cabecera compacta reserva espacio para el mapa."
      />
      <PageHeader
        eyebrow="Lectura · editorial"
        title="Leer los resultados con contexto"
        description="El mismo contrato de contenido, con una escala editorial para páginas de lectura."
        density="editorial"
      />
    </Box>
  ),
};
export const SuperficiesYAvisos: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: 3, maxWidth: 800 }}>
      <ThemeToggle />
      <SectionHeading
        number="01"
        title="Un lenguaje compartido"
        description="Variantes del sistema visual, independientes de los estados científicos."
      />
      <Surface>
        <Typography>Superficie estándar para contenido estructurado.</Typography>
      </Surface>
      <Surface tone="brand" density="editorial">
        <Typography>Superficie de énfasis editorial.</Typography>
      </Surface>
      <NotePanel title="Información del archivo">
        Contexto que ayuda a interpretar una descarga.
      </NotePanel>
      <NotePanel title="Corte de muestra" tone="warning">
        Los resultados2027 son ilustrativos.
      </NotePanel>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <DataStatus status="observed" />
        <DataStatus status="pending" />
        <DataStatus status="sample" />
      </Box>
    </Box>
  ),
};
export const RecursoDescargable: Story = {
  render: () => (
    <Box sx={{ width: 400, maxWidth: "100%" }}>
      <FileCard
        resource={{
          title: "Historia municipal",
          description: "Recurso de muestra con identidad textual y contexto de origen.",
          href: "/data/muestra-0.3/municipios.csv",
          format: "CSV",
          bytes: 269629,
          unit: "Una fila por CVEGEO",
        }}
      />
    </Box>
  ),
};
export const DiagramasEditoriales: Story = {
  render: () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 5,
        p: 3,
        maxWidth: 900,
        bgcolor: "background.default",
      }}
    >
      <TraceOverview />
      <ArchiveOverview />
    </Box>
  ),
};

function MotionExample() {
  const [replay, setReplay] = useState(0);
  return (
    <Box sx={{ maxWidth: 900 }}>
      <Button variant="outlined" onClick={() => setReplay((value) => value + 1)}>
        Repetir ilustraciones
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
        Entradas únicas. Con movimiento reducido las ilustraciones permanecen estáticas y el texto
        conserva su visibilidad.
      </Typography>
      <EntranceScope
        key={replay}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 5,
          p: 3,
          bgcolor: "background.default",
        }}
      >
        <TraceOverview />
        <ArchiveOverview />
      </EntranceScope>
    </Box>
  );
}
export const Movimiento: Story = { render: () => <MotionExample /> };

const demoChapters = [
  { id: "demo-origen", label: "Origen" },
  { id: "demo-lectura", label: "Lectura" },
  { id: "demo-limites", label: "Límites" },
];
export const IndiceDeLectura: Story = {
  render: () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "200px minmax(0,1fr)" },
        gap: 4,
        maxWidth: 1000,
      }}
    >
      <ChapterNav chapters={demoChapters} />
      <Box>
        {demoChapters.map((item) => (
          <Box component="section" id={item.id} key={item.id} sx={{ minHeight: "60vh", pt: 3 }}>
            <SectionHeading title={item.label} />
            <Typography>
              Abre este ejemplo en el lienzo y desplázate para seguir el capítulo activo. Los
              enlaces mantienen su navegación nativa.
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  ),
};

function ContentEntranceExample() {
  const [replay, setReplay] = useState(0);
  return (
    <Box sx={{ maxWidth: 950 }}>
      <Button variant="outlined" onClick={() => setReplay((value) => value + 1)}>
        Repetir entradas
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
        Desplázate por el lienzo: cada bloque entra una vez. El texto permanece visible y el
        movimiento reducido deja todo estático.
      </Typography>
      <EntranceScope key={replay}>
        <Box {...entranceProps("hero")} sx={{ py: 4 }}>
          <PageHeader
            density="editorial"
            eyebrow="Entrada de página"
            title="Una misma cadencia"
            description="Cabecera, títulos, bloques y elementos comparten la curva del sistema."
          />
        </Box>
        <Box sx={{ minHeight: "45vh", pt: 4 }}>
          <SectionHeading title="Títulos y bloques" />
          <Surface entrance="block">
            <Typography>
              El bloque acompaña la lectura; no es necesario esperar la animación para usar su
              contenido.
            </Typography>
          </Surface>
        </Box>
        <Box
          data-entrance-group
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" },
            gap: 2,
          }}
        >
          {Object.entries(entrancePresets).map(([name, preset]) => (
            <Surface key={name} entrance="item">
              <Typography variant="h3" component="h3">
                {name}
              </Typography>
              <Typography variant="body2">
                {preset.distance} px · {preset.duration} ms
              </Typography>
            </Surface>
          ))}
        </Box>
      </EntranceScope>
    </Box>
  );
}
export const EntradasDeContenido: Story = { render: () => <ContentEntranceExample /> };
