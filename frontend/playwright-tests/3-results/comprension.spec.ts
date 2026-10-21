import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";

test("la ayuda se lee por teclado o tacto y devuelve el foco sin cerrar el modo mapa", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?modo=mapa&municipio=01001");
  // La ficha puede usarse mientras se termina de cargar la geometría del mapa.
  await expect(page.getByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
  const trigger = page.getByRole("button", { name: "Ayuda sobre escala de riesgo", exact: true });
  if (isMobile) await trigger.tap();
  else {
    await trigger.focus();
    await expect(page.getByRole("tooltip")).toContainText("no es un porcentaje de abstención");
    await trigger.press("Enter");
  }
  const dialog = page.getByRole("dialog", { name: "Escala de riesgo", exact: true });
  await expect(dialog).toContainText("20 %");
  await expect(dialog.getByRole("button", { name: "Cerrar ayuda" })).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByTestId("explorer-workspace")).toHaveAttribute("data-map-mode", "true");
  await expect(page.getByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
});

test("ayudas dentro de filtros, rangos y lectura a 320px conservan contraste y cierre", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
  for (const mode of ["dark", "light"] as const) {
    await page
      .getByRole("button", { name: mode === "dark" ? "Activar tema oscuro" : "Activar tema claro" })
      .click();
    await page.getByRole("button", { name: /^Filtros/ }).click();
    const filterDialog = page.getByRole("dialog", { name: "Filtros de consulta" });
    const trigger = filterDialog.getByRole("button", {
      name: "Ayuda sobre lista electoral",
      exact: true,
    });
    await trigger.click();
    const help = page.getByRole("dialog", { name: "Lista electoral", exact: true });
    await expect(help).toContainText("No es toda la población");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`ayuda-320-${mode}.png`) });
    await help.getByRole("button", { name: "Cerrar ayuda" }).click();
    await expect(help).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(filterDialog).toBeVisible();
    await filterDialog.getByRole("button", { name: "Ver resultados", exact: true }).click();
    await expect(filterDialog).toHaveCount(0);
  }
});

test("explica cómo recuperar resultados y mapa sin exponer errores técnicos", async ({ page }) => {
  await page.route("**/data/dataset.json", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"invalid":true}' })
  );
  await page.goto("/");
  await expect(
    page.getByRole("alert").filter({ hasText: "No pudimos cargar los resultados" })
  ).toBeVisible();
  await page.unroute("**/data/dataset.json");
  await page.route("**/data/municipios.geojson", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"invalid":true}' })
  );
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Puedes reintentar o usar la tabla" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Tabla", exact: true }).click();
  await expect(
    page.getByRole("table", { name: "Resultados municipales", exact: true })
  ).toBeVisible();
  await page.unroute("**/data/municipios.geojson");
  await page.getByRole("button", { name: "Mapa", exact: true }).click();
  const retry = page.getByRole("button", { name: "Reintentar", exact: true });
  if (await retry.isVisible()) await retry.click();
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
});
