import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Surface } from "@/components/ui/surface";
import { Icon } from "@/components/ui/icon";

export function SourceReference({
  institution,
  title,
  description,
  detail,
  href,
  linkLabel,
}: {
  institution: string;
  title: string;
  description: string;
  detail: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <Surface entrance="block">
      <Typography component="span" variant="overline" sx={{ color: "primary.main" }}>
        {institution}
      </Typography>
      <Typography component="h3" variant="h3" sx={{ mt: 0.5, mb: 1.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      <Typography variant="body2" sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
        {detail}
      </Typography>
      <Box
        component="a"
        href={href}
        target="_blank"
        rel="noreferrer"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          mt: 2,
          fontSize: 14,
          color: "primary.main",
          textUnderlineOffset: "4px",
        }}
      >
        {linkLabel}
        <Icon name="arrow" size={14} />
        <Box
          component="span"
          sx={{
            position: "absolute",
            width: "1px",
            height: "1px",
            p: 0,
            overflow: "hidden",
            clipPath: "inset(50%)",
          }}
        >
          {" "}
          (abre en una pestaña nueva)
        </Box>
      </Box>
    </Surface>
  );
}
