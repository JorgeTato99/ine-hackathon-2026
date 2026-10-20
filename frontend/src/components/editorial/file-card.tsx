import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Icon } from "@/components/ui/icon";
import { Surface } from "@/components/ui/surface";

export type FileResource = {
  title: string;
  description: string;
  href: string;
  format: string;
  bytes: number;
  unit: string;
};
export function FileCard({ resource }: { resource: FileResource }) {
  const size =
    resource.bytes < 1_000_000
      ? `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(resource.bytes / 1000)} kB`
      : `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(resource.bytes / 1_000_000)} MB`;
  return (
    <Surface
      entrance="card"
      density="comfortable"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          gap: 2,
        }}
      >
        <Typography
          component="span"
          variant="overline"
          sx={{
            color: "primary.main",
            borderBottom: "2px solid",
            borderColor: "primary.main",
            pb: 0.5,
          }}
        >
          {resource.format}
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary">
          {size}
        </Typography>
      </Box>
      <Typography component="h4" variant="h3" sx={{ mb: 1 }}>
        {resource.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
        {resource.description}
      </Typography>
      <Box sx={{ mt: 2, py: 1.5, borderTop: 1, borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Typography
          component="code"
          sx={{ display: "block", fontSize: 12, overflowWrap: "anywhere", color: "text.secondary" }}
        >
          {resource.href.split("/").at(-1)}
        </Typography>
        <Typography variant="caption" component="p" sx={{ m: 0, mt: 0.5 }}>
          {resource.unit}
        </Typography>
      </Box>
      <Button
        component="a"
        href={resource.href}
        download
        variant="outlined"
        size="small"
        aria-label={`Descargar ${resource.format}: ${resource.title}`}
        startIcon={<Icon name="download" size={16} />}
        sx={{ alignSelf: "start" }}
      >
        Descargar {resource.format}
      </Button>
    </Surface>
  );
}
