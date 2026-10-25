import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const masters = resolve(root, "assets/brand");
const output = resolve(root, "public/brand/generated");
const manifestPath = resolve(masters, "manifest.json");
const recipe = {
  version: 3,
  webp: { quality: 84, alphaQuality: 100, effort: 5, smartSubsample: true },
  avif: { quality: 60, effort: 5, chromaSubsampling: "4:4:4" },
  png: { palette: true, colours: 256, compressionLevel: 9, effort: 9 },
  assets: {
    symbol: {
      widths: [32, 64, 128, 256],
      crop: { left: 159, top: 204, width: 983, height: 891 },
    },
    banner: { widths: [320, 640, 960, 1280, 1774] },
    methodology: {
      widths: [320, 480, 768, 1200, 1427],
      crop: { left: 70, top: 320, width: 1427, height: 385 },
    },
    downloads: {
      widths: [320, 640, 960, 1126],
      crop: { left: 206, top: 104, width: 1126, height: 829 },
    },
  },
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const recipeHash = digest(JSON.stringify(recipe));
const json = (data) => `${JSON.stringify(data, null, 2)}\n`;

/** La exportación usa derivados versionados; comprobarlos no los vuelve a codificar. */
export async function verifyBrandAssets() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.recipeHash !== recipeHash) throw new Error("Ejecuta npm run assets:brand.");
  for (const [path, expected] of Object.entries(manifest.integrity)) {
    const actual = digest(await readFile(resolve(root, path)));
    if (actual !== expected) throw new Error(`Recurso desactualizado: ${path}. Regenera la marca.`);
  }
}

async function prepareBrandAssets() {
  sharp.concurrency(2);
  sharp.cache({ memory: 32 });
  await mkdir(output, { recursive: true });
  const previous = await readFile(manifestPath, "utf8")
    .then(JSON.parse)
    .catch((error) => {
      if (error.code === "ENOENT") return { integrity: {} };
      throw error;
    });
  const manifest = { recipeHash, encoder: sharp.versions, assets: {}, integrity: {} };
  const runtime = {};
  const save = async (path, buffer) => {
    await writeFile(resolve(root, path), buffer);
    manifest.integrity[path] = digest(buffer);
  };

  // Conservar los trazados tipográficos ya aprobados, independientes de fuentes externas.
  const typographyPath = resolve(masters, "typography.json");
  let typography;
  try {
    typography = JSON.parse(await readFile(typographyPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    typography = {};
    for (const name of ["wordmark", "banner"]) {
      const svg = await readFile(resolve(root, `public/brand/${name}.svg`), "utf8");
      const groups = svg.match(/<g fill="[^"]+">[\s\S]*?<\/g>/g);
      if (groups?.length !== (name === "wordmark" ? 2 : 3)) {
        throw new Error(`No se reconocieron los trazados de ${name}.`);
      }
      typography[name] = groups.join("\n");
    }
    await writeFile(typographyPath, json(typography));
  }
  manifest.integrity["assets/brand/typography.json"] = digest(await readFile(typographyPath));

  for (const [name, settings] of Object.entries(recipe.assets)) {
    const original = await readFile(resolve(masters, `${name}.png`));
    manifest.integrity[`assets/brand/${name}.png`] = digest(original);
    const originalMetadata = await sharp(original).metadata();
    const image = settings.crop ? sharp(original).extract(settings.crop) : sharp(original);
    const input = await image.png().toBuffer();
    const { width, height } = await sharp(input).metadata();
    const formats = name === "symbol" ? ["png"] : ["png", "webp", "avif"];
    const candidates = {};
    for (const format of formats) {
      candidates[format] = [];
      for (const size of settings.widths) {
        let pipeline = sharp(input);
        if (name === "symbol") {
          const padding = Math.round(size * 0.06);
          pipeline = pipeline
            .resize(size - padding * 2, size - padding * 2, {
              fit: "contain",
              background: "#00000000",
            })
            .extend({
              top: padding,
              bottom: padding,
              left: padding,
              right: padding,
              background: "#00000000",
            });
        } else {
          pipeline = pipeline.resize({ width: size, withoutEnlargement: true });
        }
        const { data, info } = await pipeline[format](recipe[format]).toBuffer({
          resolveWithObject: true,
        });
        candidates[format].push({ data, width: info.width, height: info.height });
      }
    }
    const totals = Object.fromEntries(
      Object.entries(candidates).map(([format, variants]) => [
        format,
        variants.reduce((sum, item) => sum + item.data.length, 0),
      ])
    );
    // No obligar al navegador a usar un formato moderno si aquí pesa más.
    const fallback = name !== "symbol" && totals.webp < totals.png ? "webp" : "png";
    const selected = [fallback];
    if (totals.avif < Math.min(totals.png, totals.webp ?? Infinity) * 0.95) selected.push("avif");
    const sources = {};
    const variants = [];
    for (const format of selected) {
      sources[format] = [];
      for (const item of candidates[format]) {
        const file = `${name}-${digest(item.data).slice(0, 12)}-${item.width}.${format}`;
        const path = `public/brand/generated/${file}`;
        await save(path, item.data);
        const src = `/brand/generated/${file}`;
        sources[format].push({ src, width: item.width });
        variants.push({
          src,
          format,
          width: item.width,
          height: item.height,
          bytes: item.data.length,
        });
      }
    }
    const fallbackSources = sources[fallback];
    runtime[name] = {
      width: name === "symbol" ? 256 : width,
      height: name === "symbol" ? 256 : height,
      src:
        fallbackSources.find((item) => item.width >= (name === "symbol" ? 128 : 640))?.src ??
        fallbackSources.at(-1).src,
      sets: Object.fromEntries(
        Object.entries(sources).map(([format, items]) => [
          format,
          items.map((item) => `${item.src} ${item.width}w`).join(", "),
        ])
      ),
      ...(name === "symbol" ? { masks: fallbackSources.filter((item) => item.width >= 64) } : {}),
    };
    manifest.assets[name] = {
      original: {
        bytes: original.length,
        width: originalMetadata.width,
        height: originalMetadata.height,
        hasAlpha: originalMetadata.hasAlpha,
      },
      crop: settings.crop ?? null,
      candidateBytes: totals,
      selected,
      variants,
    };
    console.log(
      `${name}: ${original.length} bytes, ${width}x${height}, formatos ${selected.join("/")}`
    );
  }
  await save("src/content/brand-assets.json", Buffer.from(json(runtime)));
  const logo = await readFile(resolve(root, "public", runtime.symbol.masks.at(-1).src.slice(1)));
  const icon = await readFile(resolve(root, "public", runtime.symbol.masks[0].src.slice(1)));
  const banner = await sharp(resolve(masters, "banner.png"))
    .resize({ width: 1280 })
    .png(recipe.png)
    .toBuffer();
  const image = (buffer, x, y, w, h) =>
    `<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${buffer.toString("base64")}" />`;
  const svg = (w, h, description, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title description"><title id="title">Traza Cívica</title><desc id="description">${description}</desc>${body}</svg>\n`.replaceAll(
      "\r\n",
      "\n"
    );
  await save(
    "public/brand/logo.svg",
    Buffer.from(
      svg(
        256,
        256,
        "Símbolo aprobado de Traza Cívica. Raster incrustado sobre fondo transparente.",
        image(logo, 0, 0, 256, 256)
      )
    )
  );
  await save(
    "src/app/icon.svg",
    Buffer.from(
      svg(
        64,
        64,
        "Símbolo de Traza Cívica sobre papel cálido.",
        `<rect width="64" height="64" rx="10" fill="#F7F6F2" />${image(icon, 4, 4, 56, 56)}`
      )
    )
  );
  await save(
    "public/brand/wordmark.svg",
    Buffer.from(
      svg(
        460,
        100,
        "Traza Cívica · Participación y territorio. Símbolo aprobado y tipografía en trazados.",
        `${image(logo, 8, 14, 72, 72)}${typography.wordmark}`
      )
    )
  );
  await save(
    "public/brand/banner.svg",
    Buffer.from(
      svg(
        1200,
        630,
        "Traza Cívica · Participación y territorio. Ilustración conceptual, sin datos geográficos ni resultados.",
        `<rect width="1200" height="630" fill="#F7F6F2" />${image(banner, 0, 15, 1200, 600)}${image(logo, 72, 80, 72, 72)}${typography.banner}`
      )
    )
  );
  const social = await sharp(resolve(root, "public/brand/banner.svg")).png(recipe.png).toBuffer();
  const socialFile = `banner-social-${digest(social).slice(0, 12)}.png`;
  await save(`public/brand/generated/${socialFile}`, social);
  runtime.social = { src: `/brand/generated/${socialFile}`, width: 1200, height: 630 };
  await save("src/content/brand-assets.json", Buffer.from(json(runtime)));
  await writeFile(manifestPath, json(manifest));
  await verifyBrandAssets();
  // Retirar sólo derivados anteriores acreditados por el manifiesto, nunca los maestros.
  for (const path of Object.keys(previous.integrity)) {
    const target = resolve(root, path);
    if (dirname(target) === output && !Object.hasOwn(manifest.integrity, path)) {
      await unlink(target).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) await verifyBrandAssets();
  else await prepareBrandAssets();
}
