import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { riskTokens } from "@/theme/tokens";

export function RiskLegend({ compact = false }: { compact?: boolean }) {
  return (
    <Box
      aria-label="Leyenda del riesgo ilustrativo"
      sx={{
        px: 2,
        py: 1,
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        flexWrap: "wrap",
        borderTop: compact ? 0 : 1,
        borderColor: "divider",
      }}
    >
      {!compact && (
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          Riesgo de muestra
        </Typography>
      )}
      {Object.entries(riskTokens).map(([key, token]) => (
        <Box key={key} sx={{ display: "flex", gap: 0.6, alignItems: "center", fontSize: 11 }}>
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              bgcolor: token.map,
              backgroundImage:
                key === "medio"
                  ? "radial-gradient(#36415299 1px, transparent 1px)"
                  : key === "alto"
                    ? "repeating-linear-gradient(135deg, transparent 0 4px, #36415277 4px 5px, transparent 5px 8px)"
                    : key === "sin_estimacion"
                      ? "repeating-linear-gradient(45deg, transparent 0 3px, #36415277 3px 4px, transparent 4px 7px)"
                      : "none",
              backgroundSize: key === "medio" ? "6px 6px" : "auto",
              border: "1px solid #586171",
              width: 12,
              height: 12,
              borderRadius: key === "bajo" ? "50%" : 0,
            }}
          />
          {token.label}
        </Box>
      ))}
    </Box>
  );
}
