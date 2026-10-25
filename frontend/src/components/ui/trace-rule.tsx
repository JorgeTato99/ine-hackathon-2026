import Box from "@mui/material/Box";
import { identityTokens } from "@/theme/tokens";

/** Firma decorativa de la marca; no representa relaciones ni mediciones territoriales. */
export function TraceRule({ tone = "brand" }: { tone?: "brand" | "inherit" }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        color: tone === "inherit" ? "inherit" : "primary.main",
      }}
    >
      <svg
        width={identityTokens.signatureWidth}
        height={identityTokens.signatureHeight}
        viewBox="0 0 52 16"
        fill="none"
        focusable="false"
      >
        <path d={identityTokens.signaturePath} stroke="currentColor" strokeWidth="1.5" />
        {identityTokens.signatureNodes.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2" fill="currentColor" />
        ))}
      </svg>
      <Box sx={{ height: identityTokens.rule, bgcolor: "currentColor", opacity: 0.3, flex: 1 }} />
    </Box>
  );
}
