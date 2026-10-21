import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { EntranceScope } from "@/components/motion/entrance-scope";
import { Surface } from "@/components/ui/surface";
import { ExplorerHeader } from "./explorer-header";
import { ConsultationGuide } from "./consultation-guide";
import { LocationGuide } from "./location-guide";
import { WorkspaceHeading } from "./workspace-heading";

const meta = {
  title: "Sistema de diseño/Explorador",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cabecera: Story = { render: () => <ExplorerHeader /> };
export const Encabezados: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: 3 }}>
      <WorkspaceHeading number="01" title="Delimita tu consulta" />
      <WorkspaceHeading number="02" title="Mapa municipal" />
    </Box>
  ),
};

function GuideExample() {
  const [replay, setReplay] = useState(0);
  return (
    <Box sx={{ maxWidth: 900 }}>
      <Button variant="outlined" onClick={() => setReplay((value) => value + 1)}>
        Repetir guías
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
        Composiciones de apoyo: secuencia de consulta y localización conceptual. Con movimiento
        reducido se muestran completas y estables.
      </Typography>
      <EntranceScope
        key={replay}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" },
          gap: 3,
          alignItems: "center",
        }}
      >
        <Surface tone="brand">
          <ConsultationGuide />
        </Surface>
        <Surface>
          <LocationGuide />
        </Surface>
      </EntranceScope>
    </Box>
  );
}
export const GuiasAnimadas: Story = { render: () => <GuideExample /> };
