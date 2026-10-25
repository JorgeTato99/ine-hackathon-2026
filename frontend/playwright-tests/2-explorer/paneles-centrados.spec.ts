import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";
import { freeMapRectangle } from "../../src/utils/map-viewport";

test("resumen central y ficha completa no se solapan al cambiar ventana y anchura", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?modo=mapa&municipio=05036");
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
  for (const width of [915, 1200, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    if (width >= 1200)
      await page
        .getByRole("combobox", { name: "Ancho de ficha", exact: true })
        .selectOption("amplia");
    const tools = (await page.getByTestId("map-tools-panel").boundingBox())!;
    const summary = (await page.getByTestId("map-summary-panel").boundingBox())!;
    const detail = (await page.getByTestId("map-detail-panel").boundingBox())!;
    expect(summary.y).toBe(16);
    expect(summary.x).toBeGreaterThanOrEqual(tools.x + tools.width + 15);
    expect(summary.x + summary.width).toBeLessThanOrEqual(detail.x - 15);
    expect(detail.y).toBe(16);
    expect(detail.y + detail.height).toBe(866);
    expect(detail.height).toBe(850);
    const actions = (await page.getByTestId("map-actions").boundingBox())!;
    const navigation = (await page.getByTestId("map-navigation").boundingBox())!;
    const attribution = (await page.getByTestId("map-attribution").boundingBox())!;
    const dockCenter =
      (Math.min(actions.x, navigation.x) +
        Math.max(actions.x + actions.width, navigation.x + navigation.width)) /
      2;
    expect(Math.abs(attribution.x + attribution.width / 2 - dockCenter)).toBeLessThan(1);
    expect(attribution.y).toBeGreaterThan(actions.y + actions.height);
    expect(attribution.y + attribution.height).toBeLessThanOrEqual(896);
    expect(actions.y).toBeGreaterThan(700);
    expect(navigation.y).toBeGreaterThan(700);
    expect(actions.x + actions.width).toBeLessThanOrEqual(detail.x - 8);
    expect(navigation.x).toBeGreaterThanOrEqual(tools.x + tools.width + 8);
    expect(actions.y + actions.height).toBeLessThanOrEqual(866);
    if (width >= 1200) {
      expect(actions.y).toBe(navigation.y);
      expect(actions.x - navigation.x - navigation.width).toBe(8);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  }
  await expect(page.getByTestId("forecast-summary")).toContainText("Comparación entre municipios");
  await expect(page.getByTestId("forecast-summary")).not.toContainText("Mayor riesgo relativo");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole("button", { name: "Minimizar cifras", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ampliar cifras", exact: true })).toBeVisible();
  expect((await page.getByTestId("map-detail-panel").boundingBox())!.height).toBe(850);
});

test("enfoque ampliado deja contexto alrededor de la geometría real sin cambiar la duración", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const geometryResponse = page.waitForResponse((response) =>
    response.url().endsWith("/data/municipios.geojson")
  );
  await page.goto("/?modo=mapa&municipio=05036");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  const geometry = await (await geometryResponse).json();
  const municipality = geometry.features.find(
    (feature: { properties: { CVEGEO: string } }) => feature.properties.CVEGEO === "05036"
  );
  const positions: number[][] = [];
  const visit = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number") positions.push(value as number[]);
    else value.forEach(visit);
  };
  visit(municipality.geometry.coordinates);
  const [, , zoom] = (await map.getAttribute("data-map-view"))!.split(",").map(Number);
  const scale = 256 * 2 ** zoom!;
  const project = ([longitude, latitude]: number[]) => {
    const sine = Math.sin((latitude! * Math.PI) / 180);
    return [
      ((longitude! + 180) / 360) * scale,
      (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale,
    ];
  };
  const pixels = positions.map(project);
  const dimensions = [0, 1].map(
    (axis) =>
      Math.max(...pixels.map((point) => point[axis]!)) -
      Math.min(...pixels.map((point) => point[axis]!))
  );
  const frame = (await map.boundingBox())!;
  const overlays = await page
    .locator('[data-map-overlay], [data-pw="map-navigation"]')
    .evaluateAll((elements) =>
      elements
        .map((element) => {
          const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
          return { left, top, right, bottom, width, height };
        })
        .filter((box) => box.width > 0 && box.height > 0)
    );
  const area = freeMapRectangle(frame.width, frame.height, overlays, 50);
  const occupancy = Math.max(
    dimensions[0]! / (area.right - area.left),
    dimensions[1]! / (area.bottom - area.top)
  );
  // El municipio ocupa cerca del 78 % del rectángulo útil, en vez de llenarlo hasta el borde.
  expect(occupancy).toBeGreaterThan(0.7);
  expect(occupancy).toBeLessThan(0.81);
  await expect(map).toHaveAttribute("data-map-motion", "idle");
  await expect(page.locator('[data-municipal-outline="05036"]')).toBeVisible();
});
