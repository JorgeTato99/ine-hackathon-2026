import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { typeScale } from "@/theme/tokens";

export function PageHeader({
  eyebrow,
  title,
  description,
  density = "compact",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  density?: "compact" | "workspace" | "editorial";
  children?: ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="overline"
        component="p"
        sx={{ color: "primary.main", m: 0, mb: density === "workspace" ? 1 : 1.5 }}
      >
        {eyebrow}
      </Typography>
      <Typography
        component="h1"
        variant="h1"
        sx={density === "editorial" ? typeScale.display : typeScale.title}
      >
        {title}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{
          mt: density === "workspace" ? 1.5 : 2,
          maxWidth: density === "workspace" ? "90ch" : "62ch",
          ...(density === "editorial" ? typeScale.body : typeScale.small),
        }}
      >
        {description}
      </Typography>
      {children && <Box sx={{ mt: 3 }}>{children}</Box>}
    </Box>
  );
}
