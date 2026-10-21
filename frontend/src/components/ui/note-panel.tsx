"use client";

import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { colors } from "@/theme/tokens";

export function NotePanel({
  title,
  children,
  tone = "info",
  announce = false,
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "warning";
  announce?: boolean;
}) {
  return (
    <Alert
      role={announce ? "alert" : "note"}
      severity={tone}
      variant="outlined"
      sx={(theme) => ({
        bgcolor: tone === "warning" ? colors.light.warningSoft : colors.light.infoSoft,
        color: tone === "warning" ? colors.light.warning : colors.light.info,
        borderColor: "transparent",
        alignItems: "flex-start",
        py: 1.5,
        ...theme.applyStyles("dark", {
          bgcolor: tone === "warning" ? colors.dark.warningSoft : colors.dark.infoSoft,
          color: tone === "warning" ? colors.dark.warning : colors.dark.info,
        }),
        "& .MuiAlert-icon": { color: "inherit" },
        "& .MuiAlert-message": { minWidth: 0 },
      })}
    >
      <Typography component="p" variant="body2" sx={{ fontWeight: 700, m: 0, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography component="div" variant="body2">
        {children}
      </Typography>
    </Alert>
  );
}
