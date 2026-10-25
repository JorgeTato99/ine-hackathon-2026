import Box from "@mui/material/Box";
import assets from "@/content/brand-assets.json";

/** El alfa del símbolo aprobado hereda la tinta de marca en ambos temas. */
export function BrandMark({ size = 36 }: { size?: number }) {
  const mask = `image-set(${assets.symbol.masks.map((item) => `url("${item.src}") ${(item.width / size).toFixed(4)}x`).join(", ")})`;
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        verticalAlign: "middle",
        bgcolor: "currentColor",
        maskImage: mask,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
        WebkitMaskImage: mask,
      }}
    />
  );
}
