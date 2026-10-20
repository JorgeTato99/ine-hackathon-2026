import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";

const settleLayout = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => done()))
        )
      )
  );

test("la entrada muestra el mapa y la tabla permite consultar más de una página", async ({
  page,
}) => {
  await page.goto("/");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  const fraction = await map.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return Math.max(0, Math.min(innerHeight, box.bottom) - Math.max(0, box.top)) / box.height;
  });
  expect(fraction).toBeGreaterThan(0.8);
  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  const table = page.getByRole("table", { name: "Resultados municipales", exact: true });
  await expect(table.getByRole("row")).toHaveCount(26);
  await page.getByRole("combobox", { name: "Filas por página", exact: true }).click();
  await page.getByRole("option", { name: "10", exact: true }).click();
  await expect(table.getByRole("row")).toHaveCount(11);
  await page.getByRole("button", { name: "Última página", exact: true }).click();
  await expect(page.getByRole("button", { name: "Página siguiente", exact: true })).toBeDisabled();
  await page.getByRole("combobox", { name: "Filas por página", exact: true }).click();
  await page.getByRole("option", { name: "100", exact: true }).click();
  await expect(table.getByRole("row")).toHaveCount(101);
  await page
    .getByRole("button", { name: "Ordenar por Participación estimada · 2027", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ordenar por Participación estimada · 2027", exact: true })
    .click();
  await expect(page.getByRole("columnheader", { name: /Participación/ })).toHaveAttribute(
    "aria-sort",
    "descending"
  );
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV de la vista", exact: true }).click();
  const download = await downloading;
  expect((await readFile((await download.path())!, "utf8")).trim().split("\r\n")).toHaveLength(
    2479
  );
  await page
    .getByRole("searchbox", { name: "Buscar municipio o CVEGEO", exact: true })
    .fill("01001");
  await expect(table.getByRole("row")).toHaveCount(2);
  expect(new URL(page.url()).searchParams.has("pagina")).toBe(false);
});

test("el modo mapa conserva Canvas, consulta y cámara sin repetir la descarga", async ({
  page,
}) => {
  let geometryRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/data/municipios.geojson")) geometryRequests++;
  });
  await page.goto("/?entidad=01");
  const map = page.getByTestId("territorial-map"),
    workspace = page.getByTestId("explorer-workspace");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await map
    .locator("canvas")
    .evaluate((element) => element.setAttribute("data-qa-canvas", "retained"));
  await page.getByRole("button", { name: "Acercar mapa", exact: true }).click();
  const camera = await map.getAttribute("data-map-view");
  await page.evaluate(() => window.scrollTo({ top: 80, behavior: "instant" }));
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "Entrar al modo mapa", exact: true }).click();
  await expect(workspace).toHaveAttribute("data-map-mode", "true");
  await settleLayout(page);
  const current = (await map.getAttribute("data-map-view"))!.split(",").map(Number);
  const original = camera!.split(",").map(Number);
  expect(current[2]).toBeCloseTo(original[2]!, 5);
  const world = (lon: number, lat: number) => {
    const scale = 256 * 2 ** original[2]!;
    const sine = Math.sin((lat * Math.PI) / 180);
    return [
      ((lon + 180) / 360) * scale,
      (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale,
    ] as const;
  };
  const a = world(original[0]!, original[1]!),
    b = world(current[0]!, current[1]!);
  // El renderer redondea el origen de píxel al cambiar dimensiones impares.
  expect(Math.abs(a[0] - b[0])).toBeLessThanOrEqual(1);
  expect(Math.abs(a[1] - b[1])).toBeLessThanOrEqual(1);
  await expect(map.locator('[data-qa-canvas="retained"]')).toHaveCount(1);
  const rect = await map.boundingBox(),
    viewport = page.viewportSize()!;
  expect(rect).toMatchObject({ x: 0, y: 0, width: viewport.width, height: viewport.height });
  await expect(page.locator('[data-app-chrome="header"]')).toHaveAttribute("inert");
  await page.getByRole("button", { name: /^Filtros/ }).click();
  const panel = page.getByTestId("floating-panel");
  await expect(panel).toBeVisible();
  await page.getByRole("combobox", { name: "Historia disponible", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(workspace).toHaveAttribute("data-map-mode", "true");
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page
    .getByRole("searchbox", { name: "Buscar municipio o CVEGEO", exact: true })
    .fill("01001");
  await page.getByRole("button", { name: "Ver ficha: Aguascalientes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
  await page.getByRole("button", { name: "Plegar ficha", exact: true }).click();
  await page.getByRole("button", { name: "Activar tema oscuro", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Salir del modo mapa", exact: true }).click();
  await settleLayout(page);
  await expect(workspace).toHaveAttribute("data-map-mode", "false");
  await expect(map.locator('[data-qa-canvas="retained"]')).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Entrar al modo mapa", exact: true })
  ).toBeFocused();
  expect(geometryRequests).toBe(1);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBefore);
});

test("permite consultar y descargar una ficha en el panel y recuperar espacio", async ({
  page,
}) => {
  await page.goto("/?modo=mapa&buscar=01001");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await page.getByRole("button", { name: "Ver ficha: Aguascalientes", exact: true }).click();
  await expect(map).toHaveAttribute("data-selected-id", "01001");
  await expect(page.getByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar ficha JSON", exact: true }).click();
  const download = await downloading;
  const data = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(data.municipality.id).toBe("01001");
  expect(data.sample).toBe(false);
  await page.getByRole("button", { name: "Plegar ficha", exact: true }).click();
  await expect(page.getByTestId("floating-panel")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Ver ficha · Aguascalientes/ })).toBeFocused();
  await page.getByRole("button", { name: /^Ver ficha · Aguascalientes/ }).click();
  await expect(page.getByTestId("floating-panel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("floating-panel")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver resultados en tabla", exact: true }).click();
  await expect(
    page.getByRole("table", { name: "Resultados municipales", exact: true })
  ).toBeVisible();
  await expect(page).toHaveURL(/municipio=01001/);
});

test("los filtros abiertos y las fichas seleccionadas conservan nombres accesibles", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60_000);
  await page.goto("/?historia=parcial");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await page.getByRole("button", { name: isMobile ? /^Filtros/ : /^Más filtros/ }).click();
  const audit = async () => {
    // Contraste del estado presentado: esperar entradas finitas sin bloquear
    // por el ripple de foco, que puede ser una animación continua.
    await page.evaluate(async () => {
      const finite = document.getAnimations().filter((animation) => {
        const end = animation.effect?.getComputedTiming().endTime;
        return typeof end === "number" && Number.isFinite(end);
      });
      await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
    });
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  };
  await audit();
  await page.getByRole("dialog").getByRole("button", { name: "Restablecer", exact: true }).click();
  await page.getByRole("button", { name: "Ver resultados", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Entrar al modo mapa", exact: true }).click();
  await expect(page.getByTestId("explorer-workspace")).toHaveAttribute("data-map-mode", "true");
  await page
    .getByRole("searchbox", { name: "Buscar municipio o CVEGEO", exact: true })
    .fill("01001");
  await page.getByRole("button", { name: "Ver ficha: Aguascalientes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
  await audit();
  await page.getByRole("button", { name: "Plegar ficha", exact: true }).click();
  await page.getByRole("button", { name: "Ver resultados en tabla", exact: true }).click();
  await expect(
    page.getByRole("table", { name: "Resultados municipales", exact: true })
  ).toBeVisible();
  await audit();
});
