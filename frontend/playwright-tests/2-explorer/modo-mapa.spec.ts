import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";

test("el acceso dentro del mapa amplía la superficie y devuelve el foco", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?entidad=01");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  expect((await map.boundingBox())!.height).toBeGreaterThanOrEqual(515);
  await page.screenshot({ path: "../temp/trabajo-nocturno/07-mapa/normal-actual.png" });
  const enter = page.getByRole("button", { name: "Ampliar mapa", exact: true });
  await expect(enter).toBeVisible();
  await map.locator("canvas").evaluate((node) => node.setAttribute("data-retained", "yes"));
  await enter.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("explorer-workspace")).toHaveAttribute("data-map-mode", "true");
  expect(new URL(page.url()).searchParams.get("entidad")).toBe("01");
  await expect(map.locator('[data-retained="yes"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(enter).toBeFocused();
  // HTMLElement.click no enfoca el botón: reproduce navegadores de puntero/tacto
  // que no cambian document.activeElement antes de activar el acceso.
  await enter.evaluate((element: HTMLElement) => {
    element.blur();
    element.click();
  });
  await page.getByRole("button", { name: "Salir del modo mapa", exact: true }).click();
  await expect(enter).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(async () => (await map.boundingBox())!.height).toBeGreaterThanOrEqual(415);
});

test("los filtros ampliados muestran criterios y acciones persistentes, incluso en vacío", async ({
  page,
}) => {
  await page.goto("/?modo=mapa&entidad=01&historia=parcial&ln_min=100&ln_max=50");
  await page.getByRole("button", { name: /^Filtros/ }).click();
  const panel = page.getByTestId("floating-panel");
  await expect(panel.getByRole("button", { name: "Restablecer", exact: true })).toBeInViewport();
  await expect(panel.getByRole("button", { name: "Ver resultados", exact: true })).toBeInViewport();
  await expect(panel.getByRole("group", { name: "Filtros activos" })).toContainText(
    "Aguascalientes"
  );
  await panel.getByRole("button", { name: /Quitar filtro: Lista electoral/ }).click();
  await expect.poll(() => new URL(page.url()).searchParams.has("ln_min")).toBe(false);
  expect(new URL(page.url()).searchParams.get("historia")).toBe("parcial");
  await panel.getByRole("button", { name: "Restablecer", exact: true }).click();
  await expect(panel.getByRole("group", { name: "Filtros activos" })).toHaveCount(0);
  await panel.getByRole("button", { name: "Ver resultados", exact: true }).click();
  await expect(page.getByTestId("floating-panel")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Filtros/ })).toBeFocused();
  expect(new URL(page.url()).searchParams.get("modo")).toBe("mapa");
});

test("las vistas y escenarios se configuran sin salir del modo mapa", async ({ page }) => {
  await page.goto("/?modo=mapa&entidad=01");
  const controls = page.getByTestId("map-mode-controls");
  await controls.getByRole("button", { name: "Datos del territorio", exact: true }).click();
  await expect(
    controls.getByRole("button", { name: "Datos del territorio", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await controls.getByRole("button", { name: /^Cambiar tema del mapa/ }).click();
  const panel = page.getByTestId("floating-panel");
  await panel.getByRole("combobox", { name: "Tema del mapa", exact: true }).click();
  await page
    .getByRole("option", { name: "Participación en elecciones anteriores", exact: true })
    .click();
  await panel.getByRole("combobox", { name: "Año de la elección", exact: true }).click();
  await page.getByRole("option", { name: "2018", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(controls.getByRole("button", { name: /^Cambiar tema del mapa/ })).toBeFocused();
  await controls.getByRole("button", { name: "Pronóstico", exact: true }).click();
  await controls.getByRole("button", { name: /^Configurar escenarios/ }).click();
  await panel
    .getByRole("combobox", { name: "Participación supuesta del país", exact: true })
    .click();
  await page.getByRole("option", { name: /Alta participación/ }).click();
  await panel.getByRole("button", { name: "Comparar sin/con intervención", exact: true }).click();
  const params = new URL(page.url()).searchParams;
  expect(params.get("entidad")).toBe("01");
  expect(params.get("comparar")).toBe("1");
  expect(params.get("escenario")).toMatch(/^nac-alto/);
  expect(params.get("segundo")).toMatch(/^nac-alto/);
  await expect(controls.locator("#map-view-summary")).toContainText("51.8");
  await expect(controls.locator("#map-view-summary")).toContainText("Sin intervención");
  await expect(controls.locator("#map-view-summary")).toContainText("Comparación activa");
  await expect(
    panel.getByRole("region", { name: "Resumen de los municipios seleccionados" })
  ).toBeVisible();
});

test("paneles y controles siguen utilizables a 320px, oscuro y en horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  let releaseDataset = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseDataset = resolve;
  });
  await page.route("**/data/dataset.json", async (route) => {
    await gate;
    await route.continue();
  });
  const requested = page.waitForRequest("**/data/dataset.json");
  await page.goto("/?modo=mapa&entidad=01&alerta=con", { waitUntil: "domcontentloaded" });
  await requested;
  const controls = page.getByTestId("map-mode-controls");
  try {
    await expect(controls).toHaveCount(0);
  } finally {
    releaseDataset();
  }
  await expect(controls).toBeVisible();
  // El botón de tema de la cabecera queda detrás del workspace al ampliarlo.
  // Esperar y actuar sobre los controles del modo, también con datos demorados.
  await controls.getByRole("button", { name: "Activar tema oscuro", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: /^Filtros/ }).click();
  const panel = page.getByTestId("floating-panel");
  await expect(panel.getByRole("button", { name: "Restablecer", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(
    page.getByRole("button", { name: "MX · Restablecer vista de México", exact: true })
  ).toBeInViewport();
  await page.screenshot({ path: "../temp/trabajo-nocturno/07-mapa/movil-filtros-actual.png" });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(panel.getByRole("button", { name: "Restablecer", exact: true })).toBeInViewport();
  await expect(panel.getByRole("button", { name: "Plegar filtros", exact: true })).toBeInViewport();
  await page.screenshot({ path: "../temp/trabajo-nocturno/07-mapa/horizontal-actual.png" });
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
});

test("la leyenda respeta su estado y comparte espacio sin solapar la barra", async ({ page }) => {
  await page.goto("/?modo=mapa");
  const controls = page.getByTestId("map-mode-controls");
  const toggle = page.getByRole("button", { name: "Mostrar u ocultar leyenda", exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await controls.getByRole("button", { name: /^Filtros/ }).click();
  await expect(toggle).not.toBeVisible();
  await page.getByRole("button", { name: "Plegar filtros", exact: true }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  for (const size of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    const legend = page.getByRole("region", { name: "Leyenda: Pronóstico 2027", exact: true });
    await expect(legend).toBeVisible();
    await expect
      .poll(
        async () =>
          (await legend.boundingBox())!.y -
          ((await controls.boundingBox())!.y + (await controls.boundingBox())!.height)
      )
      .toBeGreaterThanOrEqual(0);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await page
      .getByRole("button", { name: "MX · Restablecer vista de México", exact: true })
      .click();
    expect(new URL(page.url()).searchParams.has("municipio")).toBe(false);
  }
  const search = controls.getByRole("searchbox", { name: "Buscar municipio o clave", exact: true });
  await search.fill("municipioinexistente");
  await expect(controls.getByRole("status")).toHaveText("0 municipios");
  await controls.getByRole("button", { name: /^Filtros/ }).click();
  await page
    .getByTestId("floating-panel")
    .getByRole("button", { name: /Quitar filtro: Búsqueda/ })
    .click();
  await expect.poll(() => new URL(page.url()).searchParams.has("buscar")).toBe(false);
  expect(new URL(page.url()).searchParams.get("modo")).toBe("mapa");
});

test("todos los criterios adicionales se editan y restablecen dentro del mapa", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ampliar mapa", exact: true }).click();
  const controls = page.getByTestId("map-mode-controls");
  await controls.getByRole("button", { name: /^Filtros/ }).click();
  const panel = page.getByTestId("floating-panel");
  const choose = async (label: string, option: string) => {
    await panel.getByRole("combobox", { name: label, exact: true }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };
  await choose("Estado", "Aguascalientes");
  await choose("Color sin intervención", "Rojo");
  await choose("Tamaño de la lista electoral", "5 mil a menos de 20 mil");
  await choose("Elección municipal en 2027", "Sí elige ese día");
  await choose("Usos y costumbres", "No");
  await choose("Falta de casillas antes", "Sin antecedente");
  await choose("Datos de elecciones anteriores", "Faltan datos en alguna elección");
  await choose("Ubicación en el mapa", "Con límites disponibles");
  await panel
    .getByRole("textbox", { name: "Lista electoral 2024 · mínimo", exact: true })
    .fill("100");
  await panel
    .getByRole("textbox", { name: "Lista electoral 2024 · máximo", exact: true })
    .fill("500000");
  const params = new URL(page.url()).searchParams;
  for (const [key, value] of Object.entries({
    entidad: "01",
    riesgo: "alto",
    tamano: "medio",
    ayuntamiento: "si",
    costumbres: "no",
    alerta: "sin",
    historia: "parcial",
    cartografia: "con",
    ln_min: "100",
    ln_max: "500000",
  }))
    expect(params.get(key)).toBe(value);
  await panel.getByRole("button", { name: "Restablecer", exact: true }).click();
  await panel.getByRole("button", { name: "Ver resultados", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.size).toBe(1);
  await page.getByRole("button", { name: "Salir del modo mapa", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ampliar mapa", exact: true })).toBeFocused();
});
