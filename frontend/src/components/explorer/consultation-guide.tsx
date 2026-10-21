"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Icon } from "@/components/ui/icon";
import { colors, radii } from "@/theme/tokens";

export function ConsultationGuide() {
  return (
    <Box
      component="ol"
      data-motion="consultation"
      aria-label="Recorrido de consulta"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 2,
        m: 0,
        p: 0,
        listStyle: "none",
      }}
    >
      {[
        { title: "Localiza", detail: "Nombre o clave", icon: "search" as const },
        { title: "Explora", detail: "Mapa o tabla", icon: "map" as const },
        { title: "Consulta", detail: "Historia y escenarios", icon: "pin" as const },
      ].map((step, index) => (
        <Box
          component="li"
          key={step.title}
          className="tc-guide-step"
          sx={{ "--tc-sequence-order": index, position: "relative", minWidth: 0 }}
        >
          {index < 2 && (
            <Box
              aria-hidden="true"
              className="tc-guide-link"
              sx={{
                position: "absolute",
                top: 20,
                left: 20,
                width: "calc(100% + 16px)",
                borderTop: "1px dashed",
                borderColor: "primary.main",
                opacity: 0.35,
              }}
            />
          )}
          <Box
            className="tc-guide-number"
            aria-hidden="true"
            sx={(theme) => ({
              width: 40,
              height: 40,
              position: "relative",
              display: "grid",
              placeItems: "center",
              bgcolor: colors.light.accentSoft,
              color: "primary.main",
              border: 1,
              borderColor: "primary.main",
              borderRadius: radii.panel,
              ...theme.applyStyles("dark", { bgcolor: colors.dark.accentSoft }),
            })}
          >
            <Icon name={step.icon} size={19} />
          </Box>
          <Box className="tc-guide-label" sx={{ mt: 1.5 }}>
            <Typography
              sx={{
                color: "primary.main",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".08em",
                mb: 0.5,
              }}
              aria-hidden="true"
            >
              0{index + 1}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{step.title}</Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}
            >
              {step.detail}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
