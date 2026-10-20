import Box from "@mui/material/Box";
import { riskTokens, type Risk } from "@/theme/tokens";

export function RiskBadge({ risk }: { risk: Risk }) {
  const token = riskTokens[risk];
  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.7,
        px: 1,
        py: 0.35,
        borderRadius: 1,
        whiteSpace: "nowrap",
        fontSize: ".75rem",
        fontWeight: 700,
        color: token.ink,
        bgcolor: token.fill,
        ...theme.applyStyles("dark", { color: token.darkInk, bgcolor: token.darkFill }),
      })}
    >
      <span aria-hidden="true">{token.shape}</span>
      {token.label}
    </Box>
  );
}
