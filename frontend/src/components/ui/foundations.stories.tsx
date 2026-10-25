import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { BrandMark } from "./brand-mark";
import { RiskBadge } from "./risk-badge";
import {
  colors,
  riskTokens,
  brand,
  designSystem,
  typeScale,
  space,
  radii,
  fontFamilies,
} from "@/theme/tokens";
import { TraceRule } from "./trace-rule";

const meta = { title: "Sistema de diseño/Fundamentos", tags: ["autodocs"] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Identidad: Story = {
  render: () => (
    <Box sx={{ p: 4, display: "flex", alignItems: "center", gap: 2, color: "primary.main" }}>
      <BrandMark size={64} />
      <Box>
        <Typography sx={typeScale.wordmark}>{brand.name}</Typography>
        <Typography color="text.secondary">{brand.descriptor}</Typography>
        <Typography variant="caption">Sistema visual {designSystem.version}</Typography>
      </Box>
    </Box>
  ),
};
export const Paleta: Story = {
  render: () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 2,
        maxWidth: 1000,
      }}
    >
      {Object.entries(colors).map(([mode, palette]) => (
        <Box
          key={mode}
          sx={{ p: 3, bgcolor: palette.canvas, color: palette.ink, borderRadius: radii.panel }}
        >
          <Typography variant="h2" sx={{ mb: 3 }}>
            {mode === "light" ? "Claro" : "Oscuro"}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(100px,1fr))", gap: 2 }}>
            {Object.entries(palette).map(([role, color]) => (
              <Box key={role}>
                <Box
                  sx={{
                    height: 48,
                    bgcolor: color,
                    border: `1px solid ${palette.control}`,
                    borderRadius: radii.control,
                  }}
                />
                <Typography variant="body2" sx={{ color: palette.ink }}>
                  {role}
                </Typography>
                <Typography variant="caption" sx={{ color: palette.muted }}>
                  {color}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  ),
};
export const Tipografia: Story = {
  render: () => (
    <Stack spacing={3} sx={{ p: 4, maxWidth: 900 }}>
      {Object.entries(typeScale)
        .filter(([role]) => role !== "family")
        .map(([role, styles]) => (
          <Box key={role}>
            <Typography variant="caption" color="text.secondary">
              {role} ·{" "}
              {typeof styles !== "string" &&
              "fontFamily" in styles &&
              styles.fontFamily === fontFamilies.editorial
                ? "Newsreader"
                : "Source Sans 3"}
            </Typography>
            <Typography sx={typeof styles === "string" ? {} : styles}>
              El territorio, en contexto
            </Typography>
          </Box>
        ))}
      <TraceRule />
    </Stack>
  ),
};
export const EspaciadoYRadios: Story = {
  render: () => (
    <Stack spacing={4} sx={{ p: 4, width: 600, maxWidth: "100%" }}>
      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Retícula de 8 px
        </Typography>
        {Object.entries(space).map(([factor, pixels]) => (
          <Box key={factor} sx={{ display: "flex", alignItems: "center", gap: 2, py: 0.5 }}>
            <Typography variant="caption" sx={{ width: 130 }}>
              MUI {factor} · {pixels}
            </Typography>
            <Box sx={{ height: 12, width: pixels, minWidth: 1, bgcolor: "primary.main" }} />
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {Object.entries(radii).map(([role, radius]) => (
          <Box key={role} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: radius }}>
            <Typography variant="body2">{role}</Typography>
            <Typography variant="caption">{radius}</Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  ),
};
export const RiesgoIlustrativo: Story = {
  render: () => (
    <Stack spacing={2} sx={{ p: 3 }}>
      <Typography variant="body2">
        Riesgo de muestra: sin umbrales científicos definitivos.
      </Typography>
      {Object.keys(riskTokens).map((risk) => (
        <RiskBadge key={risk} risk={risk as keyof typeof riskTokens} />
      ))}
      <Typography variant="caption">
        La calidad se presenta por separado; las ausencias no son riesgo bajo.
      </Typography>
    </Stack>
  ),
};
export const Controles: Story = {
  render: () => (
    <Stack spacing={3} sx={{ p: 3, width: 360, maxWidth: "100%" }}>
      <TextField label="Municipio o CVEGEO" placeholder="Conserva ceros iniciales" size="small" />
      <Button variant="contained">Consultar territorio</Button>
      <Button variant="outlined">Descargar datos</Button>
      <Button disabled>Acción no disponible</Button>
    </Stack>
  ),
};
export const Estados: Story = {
  render: () => (
    <Stack spacing={2} sx={{ p: 3, width: 520, maxWidth: "100%" }}>
      <Skeleton variant="rounded" height={60} />
      <Alert severity="info">Sin registros con estos filtros. Prueba otra selección.</Alert>
      <Alert severity="warning">La comparación todavía no tiene confirmación científica.</Alert>
      <Alert severity="error" action={<Button color="inherit">Reintentar</Button>}>
        No se pudo cargar el archivo.
      </Alert>
    </Stack>
  ),
};
