"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { colors, radii } from "@/theme/tokens";

export function ArchiveOverview() {
  return (
    <Box component="figure" data-motion="archive" sx={{ m: 0, px: { xs: 0, sm: 2 }, py: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "end",
          justifyContent: "center",
          height: 180,
          gap: "var(--tc-archive-gap, 12px)",
          position: "relative",
        }}
        aria-hidden="true"
      >
        {[
          { type: "CSV", label: "Tablas", rotation: "-8deg" },
          { type: "JSON", label: "Procedencia", rotation: "0deg" },
          { type: "SIG", label: "Territorio", rotation: "8deg" },
        ].map((file, index) => (
          <Box
            key={file.type}
            className="archive-sheet"
            sx={(theme) => ({
              "--tc-sequence-order": [1, 0, 2][index],
              "--tc-sheet-direction": 1 - index,
              "--tc-sheet-angle": file.rotation,
              width: "31%",
              maxWidth: 104,
              height: index === 1 ? 166 : 145,
              bgcolor: "background.paper",
              borderRadius: radii.panel,
              border: "1px solid",
              borderColor: "divider",
              rotate: file.rotation,
              p: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 8px 20px #2228380A",
              ...theme.applyStyles("dark", { borderColor: colors.dark.control }),
            })}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: 16, sm: 20 },
                color: "primary.main",
                letterSpacing: "-.025em",
              }}
            >
              {file.type}
            </Typography>
            <Box sx={{ display: "grid", gap: 0.75 }}>
              <Box sx={{ height: 2, bgcolor: "divider" }} />
              <Box sx={{ height: 2, width: "70%", bgcolor: "divider" }} />
              <Box sx={{ height: 2, width: "85%", bgcolor: "divider" }} />
            </Box>
            <Typography sx={{ fontSize: 10, color: "text.secondary" }}>{file.label}</Typography>
          </Box>
        ))}
      </Box>
      <Typography
        component="figcaption"
        sx={{ fontSize: 14, fontWeight: 500, mt: 3, textAlign: "center" }}
      >
        Tres formas de seguir la misma traza.
      </Typography>
      <Typography
        variant="caption"
        component="p"
        color="text.secondary"
        sx={{ textAlign: "center", mt: 0.5 }}
      >
        Tablas, cartografía y contexto de publicación.
      </Typography>
    </Box>
  );
}
