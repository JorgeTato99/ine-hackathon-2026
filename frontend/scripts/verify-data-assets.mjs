import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Evitar publicar una mezcla entre corte, metadatos de interfaz y archivos descargables. */
export async function verifyDataAssets() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const directory = resolve(root, "public/data");
  const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
  const [manifest, dataset, release] = await Promise.all([
    readJson(resolve(directory, "manifest.json")),
    readJson(resolve(directory, "dataset.json")),
    readJson(resolve(root, "src/content/release.json")),
  ]);
  if (
    manifest.version !== dataset.version ||
    manifest.version !== release.version ||
    dataset.source?.commit !== manifest.source?.commit
  )
    throw new Error("La interfaz y las descargas pertenecen a cortes diferentes.");
  for (const [name, expected] of Object.entries(manifest.files)) {
    const path = resolve(directory, name);
    if (!path.startsWith(directory + sep)) throw new Error("Ruta de publicación inválida.");
    const content = await readFile(path);
    if (
      content.byteLength !== expected.bytes ||
      createHash("sha256").update(content).digest("hex") !== expected.sha256
    )
      throw new Error(`Recurso de datos modificado o desactualizado: ${name}`);
  }
}
