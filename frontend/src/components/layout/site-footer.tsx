import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BrandBanner } from "@/components/ui/brand-banner";
import { Icon } from "@/components/ui/icon";
import { TraceRule } from "@/components/ui/trace-rule";
import { resultsRelease } from "@/content/release";
import { footerTokens, layout, typeScale } from "@/theme/tokens";

const navigation = [
  { href: "/", label: "Explorar el mapa" },
  { href: "/metodologia/", label: "Cómo leer los resultados" },
  { href: "/datos/", label: "Consultar los archivos" },
] as const;

export function SiteFooter() {
  return (
    <Box
      component="footer"
      data-app-chrome="footer"
      sx={(theme) => ({
        bgcolor: footerTokens.background,
        color: footerTokens.ink,
        ...theme.applyStyles("dark", { bgcolor: footerTokens.darkBackground }),
        "& a": { color: "inherit", textDecoration: "none", textUnderlineOffset: "4px" },
        "& a:hover": { color: footerTokens.accent, textDecoration: "underline" },
        "& a:focus-visible": { outlineColor: footerTokens.accent },
      })}
    >
      <Box sx={{ maxWidth: layout.app, mx: "auto", px: { xs: 2, md: 4 }, pt: { xs: 4, md: 5 } }}>
        <Box sx={{ color: footerTokens.accent, mb: { xs: 3, md: 4 } }}>
          <TraceRule tone="inherit" />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.4fr .9fr 1fr" },
            gap: { xs: 3, md: 5 },
            pb: { xs: 4, md: 5 },
          }}
        >
          <Box sx={{ gridColumn: { sm: "1 / -1", md: "auto" } }}>
            <BrandBanner />
            <Typography
              component="p"
              sx={{ ...typeScale.title, fontSize: "1.5rem", mt: 2, mb: 1.5 }}
            >
              Cada territorio tiene una historia.
            </Typography>
            <Typography variant="body2" sx={{ color: footerTokens.muted, maxWidth: "44ch" }}>
              Explora cómo ha participado la ciudadanía y compara lo que podría pasar en 2027.
            </Typography>
          </Box>
          <Box component="nav" aria-label="Al pie de página">
            <Typography component="h2" variant="overline" sx={{ display: "block", mb: 1.5 }}>
              Sigue explorando
            </Typography>
            <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {navigation.map(({ href, label }) => (
                <Box component="li" key={href}>
                  <Box
                    component="a"
                    href={href}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      minHeight: 44,
                      py: 1,
                    }}
                  >
                    {label}
                    <Icon name="arrow" size={16} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          <Box>
            <Typography component="h2" variant="overline" sx={{ display: "block", mb: 1.5 }}>
              Fuentes y alcance
            </Typography>
            <Typography variant="body2" sx={{ color: footerTokens.muted, mb: 1 }}>
              Participación: INE · Conteos Censales.
              <br />
              Cartografía: INEGI, adaptada para esta consulta.
            </Typography>
            <Typography variant="body2" sx={{ color: footerTokens.muted, mb: 0.5 }}>
              Los pronósticos dependen de supuestos. La intervención es hipotética; su efecto no
              está comprobado.
            </Typography>
            <Box
              component="a"
              href="/datos/#fuentes"
              sx={{ display: "inline-flex", alignItems: "center", gap: 1, minHeight: 44, py: 1 }}
            >
              Consultar las fuentes <Icon name="arrow" size={16} />
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            borderTop: 1,
            borderColor: footerTokens.line,
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 1.5, md: 3 },
          }}
        >
          <Box sx={{ maxWidth: "60ch" }}>
            <Typography variant="body2">Hackathon INE 2026 · Reto 2</Typography>
            <Typography variant="caption" sx={{ color: footerTokens.muted }}>
              Proyecto del equipo participante. Este sitio no es una publicación oficial del INE.
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: footerTokens.muted }}>
            {resultsRelease.version} · Información agregada, sin datos personales
          </Typography>
          <Box
            component="a"
            href="#main-content"
            sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, gap: 1 }}
          >
            Volver al contenido
            <Icon name="arrow" size={16} style={{ transform: "rotate(-90deg)" }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
