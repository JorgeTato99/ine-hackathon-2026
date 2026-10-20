"use client";

import Box from "@mui/material/Box";
import { colors, radii } from "@/theme/tokens";

const statuses = {
  modeled: {
    label: "Resultado de modelo",
    ink: colors.light.info,
    fill: colors.light.infoSoft,
    darkInk: colors.dark.info,
    darkFill: colors.dark.infoSoft,
  },
  observed: {
    label: "Historia observada",
    ink: colors.light.info,
    fill: colors.light.infoSoft,
    darkInk: colors.dark.info,
    darkFill: colors.dark.infoSoft,
  },
  sample: {
    label: "Muestra de interfaz",
    ink: colors.light.warning,
    fill: colors.light.warningSoft,
    darkInk: colors.dark.warning,
    darkFill: colors.dark.warningSoft,
  },
  pending: {
    label: "En preparación",
    ink: colors.light.muted,
    fill: colors.light.neutralSoft,
    darkInk: colors.dark.muted,
    darkFill: colors.dark.neutralSoft,
  },
} as const;

export function DataStatus({ status, label }: { status: keyof typeof statuses; label?: string }) {
  const token = statuses[status];
  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.2,
        py: 0.45,
        borderRadius: radii.pill,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.5,
        bgcolor: token.fill,
        color: token.ink,
        ...theme.applyStyles("dark", { bgcolor: token.darkFill, color: token.darkInk }),
      })}
    >
      <Box
        component="span"
        aria-hidden="true"
        sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "currentColor" }}
      />
      {label ?? token.label}
    </Box>
  );
}
