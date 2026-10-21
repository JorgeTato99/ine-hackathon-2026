import { readFile, readdir } from "node:fs/promises";
import { test, expect } from "../fixtures/console-guard";

async function chunkContaining(directory: string, marker: string, extension: string) {
  for (const name of await readdir(directory, { recursive: true })) {
    if (
      name.endsWith(extension) &&
      (await readFile(`${directory}/${name}`, "utf8")).includes(marker)
    )
      return name.replaceAll("\\", "/");
  }
  throw new Error(`No se encontró el recurso ${marker}`);
}

test("el CSS de Leaflet está en la carga inicial antes de permitir la consulta", async ({
  page,
}) => {
  const css = await chunkContaining("out/_next/static/css", ".leaflet-container", ".css");
  const response = await page.request.get("/");
  expect(response.ok()).toBe(true);
  const html = await response.text();
  const styles = [
    ...html.matchAll(
      /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"|<link[^>]+href="([^"]+)"[^>]+rel="stylesheet"/g
    ),
  ].map((entry) => entry[1] ?? entry[2]);
  expect(styles).toContain(`/_next/static/css/${css}`);
  await page.goto("/?modo=mapa");
  await expect(page.getByTestId("explorer-workspace")).toHaveAttribute("data-map-mode", "true");
  const search = page.getByRole("searchbox", { name: "Buscar municipio o clave", exact: true });
  await search.pressSequentially("01001");
  await expect(search).toHaveValue("01001");
});

test("cada prefijo permanece mientras el código del mapa sigue pendiente", async ({ page }) => {
  const chunk = await chunkContaining("out/_next/static/chunks", "territorial-map", ".js");
  let release!: () => void;
  const gate = new Promise<void>((done) => {
    release = done;
  });
  let intercepted = false;
  await page.route(`**/_next/static/chunks/${chunk}`, async (route) => {
    intercepted = true;
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/?modo=mapa", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("explorer-workspace")).toHaveAttribute("data-map-mode", "true");
    const search = page.getByRole("searchbox", { name: "Buscar municipio o clave", exact: true });
    let prefix = "";
    for (const character of "01001") {
      await search.pressSequentially(character);
      prefix += character;
      await expect(search).toHaveValue(prefix);
      expect(new URL(page.url()).searchParams.get("buscar")).toBe(prefix);
    }
    expect(intercepted).toBe(true);
  } finally {
    release();
  }
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
});
