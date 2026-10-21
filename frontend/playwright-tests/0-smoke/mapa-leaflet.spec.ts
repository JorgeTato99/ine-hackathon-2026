import { test, expect } from "../fixtures/console-guard";
import { datasetFixture } from "../../test/fixtures/dataset";
import { riskTokens, type Risk } from "../../src/theme/tokens";

const risks = Object.keys(riskTokens) as Risk[];
const ids = ["01001", "01002", "16064", "01099"];

test.beforeEach(async ({ page }) => {
  const dataset = datasetFixture();
  for (const municipality of dataset.municipalities) municipality.hasGeometry = true;
  for (const [i, id] of ids.entries())
    for (const [s, scenario] of ["base", "con"].entries()) {
      dataset.estimates[scenario]![id] = {
        participation: risks[(i + s) % risks.length] === "sin_estimacion" ? null : 0.5,
        lower: null,
        upper: null,
        risk: risks[(i + s) % risks.length]!,
        state: "estimado",
        reason: null,
      };
    }
  const geometry = {
    type: "FeatureCollection",
    features: ids.map((CVEGEO, i) => ({
      type: "Feature",
      properties: { CVEGEO },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-103 + i, 21],
            [-102.5 + i, 21],
            [-102.5 + i, 21.5],
            [-103 + i, 21.5],
            [-103 + i, 21],
          ],
        ],
      },
    })),
  };
  await page.route("**/data/dataset.json", (route) => route.fulfill({ json: dataset }));
  await page.route("**/data/municipios.geojson", (route) => route.fulfill({ json: geometry }));
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("conserva cámara al cambiar de escenario y libera el mapa al abrir la tabla", async ({
  page,
}) => {
  await page.goto("/?buscar=01001&escenario=base");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await expect(map).toHaveAttribute("data-map-engine", "leaflet-canvas");
  await page.getByRole("button", { name: "Acercar mapa", exact: true }).click();
  await map.focus();
  const before = await map.getAttribute("data-map-view");
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => map.getAttribute("data-map-view")).not.toBe(before);
  const camera = await map.getAttribute("data-map-view");
  const scenarioButton = page.getByRole("button", { name: "Escenarios", exact: true });
  const scenariosDialog = await scenarioButton.isVisible();
  if (scenariosDialog) await scenarioButton.click();
  await page.getByRole("combobox", { name: "Escenario de muestra", exact: true }).click();
  await page
    .getByRole("option", { name: "Nacional medio · intervención alta", exact: true })
    .click();
  if (scenariosDialog) {
    await page.getByRole("button", { name: "Volver al mapa", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  await expect(map).toHaveAttribute("data-map-scenario", "con");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await expect(map).toHaveAttribute("data-map-view", camera!);
  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  await expect(map).toHaveCount(0);
  await page.getByRole("button", { name: "Mapa", exact: true }).click();
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await expect(map.locator("canvas")).toHaveCount(1);
});

test("dibuja los cuatro riesgos y sus cambios con colores y tramas reales de Canvas", async ({
  page,
}) => {
  await page.goto("/?escenario=base");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  const scenarioButton = page.getByRole("button", { name: "Escenarios", exact: true });
  const scenariosDialog = await scenarioButton.isVisible();
  for (const [i, id] of ids.entries()) {
    const previousView = await map.getAttribute("data-map-view");
    await page.getByRole("searchbox", { name: "Buscar municipio o clave" }).fill(id);
    await expect.poll(() => map.getAttribute("data-map-view")).not.toBe(previousView);
    await expect(map).toHaveAttribute("data-map-visible", "1");
    for (const [s, scenario] of ["base", "con"].entries()) {
      if (scenariosDialog) await scenarioButton.click();
      await page.getByRole("combobox", { name: "Escenario de muestra", exact: true }).click();
      await page
        .getByRole("option", {
          name:
            scenario === "base"
              ? "Nacional medio · intervención ninguna"
              : "Nacional medio · intervención alta",
          exact: true,
        })
        .click();
      if (scenariosDialog) {
        await page.getByRole("button", { name: "Volver al mapa", exact: true }).click();
        await page.getByRole("dialog").waitFor({ state: "hidden" });
      }
      await expect(map).toHaveAttribute("data-map-scenario", scenario);
      await expect(map).toHaveAttribute("data-map-ready", "true");
      await map.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const color = riskTokens[risks[(i + s) % risks.length]!].map;
      // Leer el Canvas renderizado evita mezclar píxeles al reducir una captura
      // de DPR fraccional a CSS. El umbral sigue siendo mayoría del color base.
      const result = await map.evaluate((target, color) => {
        const canvas = target.querySelector("canvas")!;
        const mapBox = target.getBoundingClientRect();
        const box = canvas.getBoundingClientRect();
        const scaleX = canvas.width / box.width,
          scaleY = canvas.height / box.height;
        const width = Math.round(20 * scaleX),
          height = Math.round(20 * scaleY);
        const x = Math.round((mapBox.left + mapBox.width / 2 - box.left) * scaleX - width / 2);
        const y = Math.round((mapBox.top + mapBox.height / 2 - box.top) * scaleY - height / 2);
        const pixels = canvas.getContext("2d")!.getImageData(x, y, width, height).data;
        const rgb = color.match(/\w\w/g)!.map((value) => parseInt(value, 16));
        let matching = 0;
        for (let p = 0; p < pixels.length; p += 4)
          if (rgb.every((value, j) => Math.abs(pixels[p + j]! - value) < 8)) matching++;
        return { matching, total: width * height, dpr: devicePixelRatio };
      }, color);
      expect(
        result.matching / result.total,
        `${id}/${scenario}/${color}/${JSON.stringify(result)}`
      ).toBeGreaterThan(0.5);
      if (risks[(i + s) % risks.length] !== "bajo")
        expect(result.matching).toBeLessThan(result.total);
    }
  }
});

test("el doble clic amplía sin seleccionar y un clic posterior abre la ficha", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?buscar=01001&escenario=base");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  const center = { x: box.width / 2, y: box.height / 2 };
  if (!isMobile) {
    const zoom = Number((await map.getAttribute("data-map-view"))!.split(",")[2]);
    await map.dblclick({ position: center });
    await expect
      .poll(async () => Number((await map.getAttribute("data-map-view"))!.split(",")[2]))
      .toBeGreaterThan(zoom);
    await page.waitForTimeout(300);
    await expect(page).not.toHaveURL(/municipio=/);
  }
  await map.click({ position: center });
  await expect(page).toHaveURL(/municipio=01001/);
  await expect(page.getByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
});
