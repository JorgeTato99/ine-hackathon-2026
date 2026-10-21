"use client";

import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import type { SxProps, Theme } from "@mui/material/styles";
import { colors, density as densityTokens } from "@/theme/tokens";
import { entranceProps, type EntrancePreset } from "@/theme/entrance";

export function Surface({
  children,
  tone = "paper",
  density = "comfortable",
  sx = [],
  entrance,
}: {
  children: ReactNode;
  tone?: "paper" | "brand";
  density?: keyof typeof densityTokens;
  sx?: SxProps<Theme>;
  entrance?: EntrancePreset;
}) {
  return (
    <Paper
      {...(entrance ? entranceProps(entrance) : {})}
      variant="outlined"
      sx={[
        { p: { xs: densityTokens.compact, sm: densityTokens[density] }, minWidth: 0 },
        ...(tone === "brand"
          ? [
              (theme: Theme) => ({
                bgcolor: colors.light.accentSoft,
                borderColor: "transparent",
                ...theme.applyStyles("dark", { bgcolor: colors.dark.accentSoft }),
              }),
            ]
          : []),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Paper>
  );
}
