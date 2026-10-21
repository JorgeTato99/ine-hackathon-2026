"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DataStatus } from "@/components/ui/data-status";
import { colors, radii } from "@/theme/tokens";

export function TraceOverview() {
  return (
    <Box component="figure" data-motion="trace" sx={{ m: 0, px: { xs: 0, sm: 2 }, py: 1 }}>
      <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none" }}>
        {[
          { year: "2009—2024", title: "Lo que observamos", status: "observed" },
          { year: "ANÁLISIS", title: "Lo que estima el análisis", status: "modeled" },
          { year: "2027", title: "Los supuestos que comparamos", status: "modeled" },
        ].map((item, index) => (
          <Box
            component="li"
            key={item.year}
            className="tc-trace-step"
            data-motion-step={index}
            sx={{
              "--tc-sequence-order": index,
              position: "relative",
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              mb: index === 2 ? 0 : 2,
            }}
          >
            {index < 2 && (
              <Box
                aria-hidden="true"
                className="tc-trace-link"
                sx={{
                  position: "absolute",
                  left: 13,
                  top: 44,
                  bottom: -32,
                  borderLeft: "1px dashed",
                  borderColor: "primary.main",
                  opacity: 0.4,
                }}
              />
            )}
            <Box
              aria-hidden="true"
              className="tc-trace-number"
              sx={{
                mt: 2,
                width: 28,
                height: 28,
                border: "1px solid",
                borderColor: "primary.main",
                bgcolor: "background.paper",
                borderRadius: "50%",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                color: "primary.main",
                fontWeight: 700,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </Box>
            <Box
              className="tc-trace-card"
              sx={(theme) => ({
                p: 1.5,
                flex: 1,
                borderRadius: radii.panel,
                bgcolor: "#FFFFFFB8",
                border: "1px solid #FFFFFF",
                ...theme.applyStyles("dark", {
                  bgcolor: colors.dark.surface,
                  borderColor: colors.dark.line,
                }),
              })}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  mb: 1,
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{item.title}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {item.year}
                </Typography>
              </Box>
              <DataStatus status={item.status as "observed" | "modeled"} />
            </Box>
          </Box>
        ))}
      </Box>
      <Typography
        component="figcaption"
        variant="caption"
        sx={{ pl: 5.5, mt: 1.5, color: "text.secondary" }}
      >
        Datos de elecciones anteriores, estimaciones y supuestos: cada uno tiene una lectura
        distinta.
      </Typography>
    </Box>
  );
}
