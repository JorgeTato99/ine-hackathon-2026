import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";

test("ventana apaisada mantiene las cuatro cabeceras recuperables y el zoom", async ({ page }) => {
  await page.setViewportSize({ width: 915, height: 412 });
  await page.goto("/?modo=mapa");
  await page.getByRole("button", { name: "Minimizar todos los paneles" }).click();
  for (const name of ["herramientas", "cifras", "leyenda", "ficha"]) {
    await expect(
      page.getByRole("button", { name: `Ampliar ${name}`, exact: true })
    ).toBeInViewport();
  }
  await expect(
    page.getByRole("button", { name: "MX · Restablecer vista de México" })
  ).toBeInViewport();
  const dock = (await page.getByTestId("map-actions").boundingBox())!;
  const navigation = (await page.getByTestId("map-navigation").boundingBox())!;
  expect(dock.y).toBeGreaterThan(300);
  expect(navigation.y + navigation.height).toBeLessThanOrEqual(dock.y - 8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("cada KPI tiene ayuda breve y explicación completa con retorno de foco", async ({ page }) => {
  await page.goto("/");
  const summary = page.getByTestId("forecast-summary");
  await expect(summary.getByRole("button", { name: /^Ayuda sobre/ })).toHaveCount(4);
  const help = summary.getByRole("button", {
    name: "Ayuda sobre participación esperada",
    exact: true,
  });
  await help.hover();
  await expect(page.getByRole("tooltip")).toContainText("de cada 100");
  await help.click();
  await expect(
    page.getByRole("dialog", { name: "Participación esperada", exact: true })
  ).toContainText("promedio ponderado");
  await page.getByRole("button", { name: "Cerrar ayuda", exact: true }).click();
  await expect(help).toBeFocused();
  await page.getByRole("button", { name: "Las tres", exact: true }).click();
  await expect(summary.getByRole("button", { name: /^Ayuda sobre/ })).toHaveCount(5);
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  await expect(summary.getByRole("button", { name: /^Ayuda sobre/ })).toHaveCount(4);
});

test("mapa ampliado ocupa la ventana, conserva Canvas y permite despejar cuatro paneles", async ({
  page,
}) => {
  let loads = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/data/municipios.geojson")) loads++;
  });
  await page.goto("/");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  const original = await map.elementHandle();
  await page.getByRole("button", { name: "Ampliar mapa", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-map-mode", "true");
  const frame = (await page.getByTestId("explorer-workspace").boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(frame.x).toBe(0);
  expect(frame.y).toBe(0);
  expect(Math.abs(frame.width - viewport.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(frame.height - viewport.height)).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Minimizar todos los paneles" }).click();
  for (const name of ["herramientas", "cifras", "leyenda", "ficha"]) {
    const expand = page.getByRole("button", { name: `Ampliar ${name}`, exact: true });
    await expect(expand).toBeVisible();
    await expand.click();
    await page.getByRole("button", { name: `Minimizar ${name}`, exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Acercar mapa", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Minimizar zoom", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Salir del modo mapa", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-map-mode");
  await expect(page).not.toHaveURL(/modo=mapa/);
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
  expect(loads).toBe(1);
});

test("ficha ampliada conserva silueta, anchura, municipio y ayuda al regresar", async ({
  page,
  isMobile,
}) => {
  if (!isMobile) await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?municipio=30087&modo=mapa");
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
  if (isMobile) await page.getByRole("button", { name: "Ampliar ficha", exact: true }).click();
  await expect(page.locator('[data-municipal-outline="30087"]')).toBeVisible();
  if (!isMobile) {
    const select = page.getByRole("combobox", { name: "Ancho de ficha", exact: true });
    await expect(select).toHaveValue("normal");
    expect((await page.getByTestId("map-detail-panel").boundingBox())!.width).toBe(480);
    await select.selectOption("compacta");
    expect((await page.getByTestId("map-detail-panel").boundingBox())!.width).toBe(360);
    await select.selectOption("amplia");
    expect((await page.getByTestId("map-detail-panel").boundingBox())!.width).toBe(600);
    await page.getByRole("button", { name: "Minimizar ficha", exact: true }).click();
    await page.getByRole("button", { name: "Ampliar ficha", exact: true }).click();
    await expect(select).toHaveValue("amplia");
  }
  const help = page.getByRole("button", {
    name: "Ayuda sobre rango de la estimación",
    exact: true,
  });
  await help.click();
  await expect(
    page.getByRole("dialog", { name: "Rango de la estimación", exact: true })
  ).toContainText("18 y 29");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Rango de la estimación", exact: true })
  ).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-map-mode", "true");
  await page.getByRole("button", { name: "Salir del modo mapa", exact: true }).click();
  await expect(page).toHaveURL(/municipio=30087/);
  await expect(page).not.toHaveURL(/modo=mapa/);
  await expect(page.locator('[data-municipal-outline="30087"]')).toBeVisible();
});

test("dos paletas reales de Canvas, semáforo estable y morado principal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
  const hasColors = (colors: number[][]) =>
    page
      .getByTestId("territorial-map")
      .locator("canvas")
      .first()
      .evaluate((canvas, values) => {
        const image = (canvas as HTMLCanvasElement)
          .getContext("2d")!
          .getImageData(
            0,
            0,
            (canvas as HTMLCanvasElement).width,
            (canvas as HTMLCanvasElement).height
          ).data;
        const found = values.map(() => false);
        for (let pixel = 0; pixel < image.length; pixel += 4)
          for (let color = 0; color < values.length; color++) {
            const rgb = values[color]!;
            if (
              image[pixel] === rgb[0] &&
              image[pixel + 1] === rgb[1] &&
              image[pixel + 2] === rgb[2]
            )
              found[color] = true;
          }
        return found;
      }, colors);
  await expect
    .poll(() =>
      hasColors([
        [199, 74, 90],
        [217, 180, 74],
        [101, 165, 138],
      ])
    )
    .toEqual([true, true, true]);
  await expect(page.getByRole("button", { name: "Ampliar mapa", exact: true })).toHaveCSS(
    "background-color",
    "rgb(67, 56, 202)"
  );
  await page.getByRole("button", { name: "Activar tema oscuro", exact: true }).click();
  await expect
    .poll(() =>
      hasColors([
        [144, 53, 69],
        [161, 132, 53],
        [57, 113, 93],
      ])
    )
    .toEqual([true, true, true]);
  await expect(page.getByTestId("forecast-summary")).toContainText("495");
});

test("modo ampliado conserva acceso por teclado y reflow con ayudas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?modo=mapa");
  await expect(page.locator("html")).toHaveAttribute("data-map-mode", "true");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Salir del modo mapa", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).not.toHaveAttribute("data-map-mode");
});
