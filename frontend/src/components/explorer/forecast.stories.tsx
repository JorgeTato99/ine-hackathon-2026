import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Municipality } from "@/types/dataset";
import { ContributionChart } from "./forecast-charts";

const example: Municipality = {
  id: "00000",
  name: "Municipio ilustrativo",
  state: "Ejemplo",
  stateCode: "00",
  nominal: 10000,
  history: {},
  historyIssue: null,
  hasData: true,
  hasGeometry: false,
  indicators: {
    aporte_historia: -8,
    aporte_calendario: 2,
    aporte_lista: 0,
    aporte_social: -3,
    aporte_politica: 0.5,
  },
};
const meta = {
  title: "Sistema de diseño/Pronóstico y explicación",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Aportaciones: Story = {
  render: () => (
    <Box sx={{ maxWidth: 390, p: 2 }}>
      <Typography component="h2" variant="h3" sx={{ mb: 2 }}>
        ¿Qué empuja la predicción?
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Datos ficticios para documentar el componente.
      </Typography>
      <ContributionChart municipality={example} />
    </Box>
  ),
};
