import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ContextHelp } from "./context-help";

const meta = {
  title: "Sistema de diseño/Ayudas de lectura",
  component: ContextHelp,
  tags: ["autodocs"],
} satisfies Meta<typeof ContextHelp>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Riesgo: Story = { args: { topic: "position" } };
export const Incertidumbre: Story = { args: { topic: "interval" } };
export const JuntoAlDato: Story = {
  args: { topic: "roll" },
  render: (args) => (
    <Stack direction="row" sx={{ alignItems: "center" }}>
      <Typography>Personas en lista electoral · 2024</Typography>
      <ContextHelp {...args} />
    </Stack>
  ),
};
