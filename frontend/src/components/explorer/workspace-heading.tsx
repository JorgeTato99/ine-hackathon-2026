import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function WorkspaceHeading({ number, title }: { number: string; title: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Typography
        component="span"
        aria-hidden="true"
        sx={{ fontSize: 11, fontWeight: 700, color: "primary.main", letterSpacing: ".06em" }}
      >
        {number} /
      </Typography>
      <Typography component="h2" variant="h3" sx={{ fontSize: 16 }}>
        {title}
      </Typography>
    </Box>
  );
}
