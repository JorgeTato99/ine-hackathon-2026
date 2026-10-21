import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";

test("carga mapa local, conserva tema y permite saltar al contenido", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:") && !request.url().startsWith("data:"))
      external.push(request.url());
  });
  await page.goto("/");
  await expect(page).toHaveTitle("Traza Cívica · Participación y territorio");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  expect(await map.locator("canvas").count()).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Activar tema oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole("button", { name: "Activar tema claro" })).toBeEnabled();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Activar tema claro" }).click();
  expect(external).toEqual([]);
});

test("selecciona una geometría real por clic y abre la misma ficha", async ({ page }) => {
  await page.goto("/");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  const expand = page.getByRole("button", { name: "Filtros", exact: true });
  const filtersDialog = await expand.isVisible();
  if (filtersDialog) await expand.click();
  await page.getByRole("combobox", { name: "Estado" }).click();
  await page.getByRole("option", { name: "Aguascalientes", exact: true }).click();
  await expect(page).toHaveURL(/entidad=01/);
  if (filtersDialog) {
    await page.getByRole("button", { name: "Ver resultados", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  await map.scrollIntoViewIfNeeded();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
  const geometry = JSON.parse(await readFile("public/data/municipios.geojson", "utf8"));
  const coordinates: number[][] = [];
  const walk = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number") coordinates.push(value as number[]);
    else value.forEach(walk);
  };
  for (const feature of geometry.features)
    if (feature.properties.CVE_ENT === "01") walk(feature.geometry.coordinates);
  const project = (lon: number, lat: number) =>
    [
      (6378137 * lon * Math.PI) / 180,
      6378137 * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
    ] as const;
  const points = coordinates.map((point) => project(point[0]!, point[1]!));
  const x = points.map((point) => point[0]),
    y = points.map((point) => point[1]);
  const bounds = [Math.min(...x), Math.min(...y), Math.max(...x), Math.max(...y)];
  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  const resolution = Math.max(
    (bounds[2]! - bounds[0]!) / (box!.width - 48),
    (bounds[3]! - bounds[1]!) / (box!.height - 48)
  );
  const target = project(-102.3054281909746, 21.847434);
  const pixel = {
    x: box!.x + box!.width / 2 + (target[0] - (bounds[0]! + bounds[2]!) / 2) / resolution,
    y: box!.y + box!.height / 2 - (target[1] - (bounds[1]! + bounds[3]!) / 2) / resolution,
  };
  await map.click({ position: { x: pixel.x - box!.x, y: pixel.y - box!.y } });
  await expect(page).toHaveURL(/municipio=01001/);
  await expect(page.getByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
});

test("consulta historia reconstruida y compara intervención al mismo nivel nacional", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Buscar municipio o clave" }).fill("16064");
  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  await expect(page).toHaveURL(/buscar=16064/);
  await expect(page).toHaveURL(/vista=tabla/);
  await page.getByRole("button", { name: "Parácuaro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Parácuaro", level: 2 })).toBeVisible();
  const year = page.locator("dt").filter({ hasText: /^2021$/ });
  await expect(year.locator("..").locator("dd")).toHaveText("56.7%");
  const close = page.getByRole("button", { name: "Cerrar ficha" });
  if (await close.isVisible()) {
    await close.click();
    await page.getByLabel("Cerrar ficha", { exact: true }).waitFor({ state: "detached" });
  }
  const scenarioButton = page.getByRole("button", { name: "Escenarios", exact: true });
  const scenariosDialog = await scenarioButton.isVisible();
  if (scenariosDialog) await scenarioButton.click();
  await page.getByRole("button", { name: "Comparar sin/con intervención" }).click();
  await expect(
    page.getByText("Supuesto, no efecto medido.", { exact: true }).first()
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Participación supuesta del país", exact: true })
    .click();
  await page.getByRole("option", { name: /^Alta participación/ }).click();
  await expect(page).toHaveURL(/escenario=nac-alto_int-ninguna/);
  await expect(page).toHaveURL(/segundo=nac-alto_int-dirigida_rojos/);
  if (scenariosDialog) {
    await page.getByRole("button", { name: "Volver al mapa", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  const show = page.getByRole("button", { name: "Ver ficha" });
  if (await show.isVisible()) await show.click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar ficha (JSON)" }).click();
  const download = await event;
  const document = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(document.municipality.id).toBe("16064");
  expect(document.municipality.history["2021"]).toBe(0.5672);
  expect(document.sample).toBe(false);
  expect(document.scenario.national).toBe("alto");
  expect(document.secondReading.scenario.national).toBe("alto");
  expect(document.secondReading.comparability).toBe("confirmed");
});

test("navega fuentes y descarga un GeoPackage real", async ({ page }) => {
  await page.goto("/metodologia/");
  await expect(page.getByRole("heading", { name: "Cómo leer los resultados" })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: "Datos y descargas" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Descarga los datos y conoce sus fuentes" })
  ).toBeVisible();
  const event = page.waitForEvent("download");
  await page.locator('a[download][href="/data/resultados-1.1/municipios.gpkg"]').click();
  const download = await event;
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 15).toString()).toBe("SQLite format 3");
  expect(bytes.length).toBeGreaterThan(100000);
});

test("no desborda y cumple comprobaciones automáticas en la vista inicial", async ({ page }) => {
  await page.goto("/?entidad=99&riesgo=desconocido");
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
