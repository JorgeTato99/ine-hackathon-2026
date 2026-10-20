import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { entranceProps } from "@/theme/entrance";

export function SectionHeading({
  title,
  description,
  number,
  id,
}: {
  title: string;
  description?: string;
  number?: string;
  id?: string;
}) {
  return (
    <Box {...entranceProps("heading")} sx={{ mb: 3 }}>
      {number && (
        <Typography
          component="span"
          variant="overline"
          sx={{ display: "block", color: "primary.main", mb: 1 }}
          aria-hidden="true"
        >
          {number} /
        </Typography>
      )}
      <Typography id={id} component="h2" variant="h2" sx={{ scrollMarginTop: 24 }}>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: "65ch" }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
