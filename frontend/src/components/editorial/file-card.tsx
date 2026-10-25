import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Icon } from "@/components/ui/icon";
import { entranceProps } from "@/theme/entrance";
import { typeScale, identityTokens } from "@/theme/tokens";

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
    <Box
      component="article"
      {...entranceProps("card")}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "44px minmax(0,1fr)", sm: "56px minmax(0,1fr) auto" },
        columnGap: { xs: 2, sm: 3 },
        rowGap: 1.5,
        py: 3,
        borderBottom: 1,
        borderColor: "divider",
        alignItems: "start",
      }}
    >
      <Box
        sx={{
          borderTop: `${identityTokens.strongRule} solid`,
          borderColor: "primary.main",
          pt: 1,
          color: "primary.main",
        }}
      >
        <Typography component="span" variant="overline" sx={{ letterSpacing: ".025em" }}>
          {resource.format}
        </Typography>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h4" variant="h3" sx={{ ...typeScale.fileTitle, mb: 1 }}>
          {resource.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {resource.description}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1.5, color: "text.secondary" }}>
          <Typography
            component="code"
            variant="caption"
            sx={{ fontFamily: "inherit", overflowWrap: "anywhere" }}
          >
            {resource.href.split("/").at(-1)}
          </Typography>
          <Typography
            component="span"
            variant="caption"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {size}
          </Typography>
        </Box>
        <Typography variant="caption" component="p" sx={{ m: 0, mt: 0.5, color: "text.secondary" }}>
          {resource.unit}
        </Typography>
      </Box>
      <Button
        component="a"
        href={resource.href}
        download
        variant="text"
        size="small"
        aria-label={`Descargar ${resource.format}: ${resource.title}`}
        startIcon={<Icon name="download" size={16} />}
        sx={{
          gridColumn: { xs: 2, sm: 3 },
          gridRow: { sm: 1 },
          justifySelf: "start",
          alignSelf: "center",
        }}
      >
        Descargar {resource.format}
      </Button>
    </Box>
  );
}
