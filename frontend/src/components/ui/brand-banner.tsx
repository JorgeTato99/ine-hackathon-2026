import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BrandArtwork } from "./brand-artwork";
import { BrandMark } from "./brand-mark";
import { brand, brandImageTokens, colors, radii, typeScale } from "@/theme/tokens";

export function BrandBanner() {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: brandImageTokens.bannerWidth,
        aspectRatio: "2 / 1",
        containerType: "inline-size",
        bgcolor: colors.light.canvas,
        color: colors.light.ink,
        borderRadius: radii.panel,
        overflow: "hidden",
        "& picture": { position: "absolute", inset: 0 },
      }}
    >
      <BrandArtwork
        name="banner"
        sizes="(min-width: 1200px) 400px, (min-width: 900px) 36vw, (min-width: 600px) 400px, calc(100vw - 32px)"
      />
      <Box
        sx={{
          position: "relative",
          width: "54%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: "6cqi",
          py: 1.5,
        }}
      >
        <Box sx={{ color: colors.light.accent, display: "flex", mb: 1 }}>
          <BrandMark size={28} />
        </Box>
        <Typography
          component="span"
          sx={{ ...typeScale.wordmark, fontSize: "clamp(1.125rem, 6cqi, 1.5rem)", mb: 0.75 }}
        >
          {brand.name}
        </Typography>
        <Typography
          component="span"
          sx={{ fontSize: "clamp(.75rem, 3cqi, .875rem)", lineHeight: 1.4 }}
        >
          {brand.descriptor}
        </Typography>
      </Box>
    </Box>
  );
}
