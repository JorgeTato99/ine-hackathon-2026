import assets from "@/content/brand-assets.json";

interface ArtworkAsset {
  width: number;
  height: number;
  src: string;
  sets: { png?: string; webp?: string; avif?: string };
}

/** Variantes ya preparadas: no requiere el optimizador de imágenes de Next en runtime. */
export function BrandArtwork({
  name,
  sizes,
}: {
  name: "banner" | "methodology" | "downloads";
  sizes: string;
}) {
  const asset: ArtworkAsset = assets[name];
  const responsiveSizes = `auto, ${sizes}`;
  return (
    <picture data-brand-artwork={name} style={{ display: "block" }}>
      {asset.sets.avif && (
        <source type="image/avif" srcSet={asset.sets.avif} sizes={responsiveSizes} />
      )}
      <img
        src={asset.src}
        srcSet={asset.sets.webp ?? asset.sets.png}
        sizes={responsiveSizes}
        width={asset.width}
        height={asset.height}
        alt=""
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    </picture>
  );
}
