import { test, expect } from "../fixtures/console-guard";

test("registra los filtros tras cargar la base y no repite entradas al consultar", async ({
  page,
}) => {
  let releaseData = () => {};
  const dataGate = new Promise<void>((resolve) => {
    releaseData = resolve;
  });
  await page.route("**/data/dataset.json", async (route) => {
    await dataGate;
    await route.continue();
  });
  await page.addInitScript(() => {
    const counts = new WeakMap<Element, number>();
    Reflect.set(window, "tcExplorerEntrances", counts);
    document.addEventListener("animationstart", (event) => {
      if (
        event.target instanceof Element &&
        event.target.matches("[data-entrance], .tc-location-pin")
      )
        counts.set(event.target, (counts.get(event.target) ?? 0) + 1);
    });
  });
  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Buscar municipio o CVEGEO" })).toHaveCount(0);
    releaseData();
    const search = page.getByRole("searchbox", { name: "Buscar municipio o CVEGEO" });
    await expect(search).toBeVisible();
    const panel = search.locator('xpath=ancestor::*[@data-entrance="card"]');
    const count = () =>
      panel.evaluate(
        (element) =>
          (Reflect.get(window, "tcExplorerEntrances") as WeakMap<Element, number>).get(element) ?? 0
      );
    await expect.poll(count).toBe(1);
    await search.focus();
    await expect(panel).toHaveAttribute("data-entrance-state", "settled");
    await expect(panel).toHaveCSS("scale", "none");
    await expect(search).toBeFocused();
    const map = page.getByTestId("territorial-map");
    await expect(map).toHaveAttribute("data-map-ready", "true");
    const hero = page.locator('.tc-explorer-hero [data-entrance="hero"]');
    const pin = page.locator(".tc-location-pin");
    const entrances = (element: Element) =>
      (Reflect.get(window, "tcExplorerEntrances") as WeakMap<Element, number>).get(element) ?? 0;
    await expect.poll(() => hero.evaluate(entrances)).toBe(1);
    if (await pin.isVisible()) await expect.poll(() => pin.evaluate(entrances)).toBe(1);
    expect(await map.evaluate((element) => element.closest("[data-entrance]") === null)).toBe(true);
    expect(await map.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
      0
    );
    await search.fill("01001");
    await page.getByRole("button", { name: "Tabla", exact: true }).click();
    await expect(page).toHaveURL(/buscar=01001/);
    await expect(page.getByRole("button", { name: "Aguascalientes", exact: true })).toBeVisible();
    expect(await count()).toBe(1);
    expect(await hero.evaluate(entrances)).toBe(1);
    if (await pin.isVisible()) expect(await pin.evaluate(entrances)).toBe(1);
    await expect(panel).toHaveAttribute("data-entrance-state", "settled");
  } finally {
    releaseData();
  }
});

test("la ficha y las guías respetan reducción de movimiento y conservan datos estáticos", async ({
  page,
}) => {
  await page.goto("/?vista=tabla&buscar=16064&municipio=16064&comparar=1");
  await expect(page.getByRole("button", { name: "CSV de la vista", exact: true })).toBeVisible();
  const show = page.getByRole("button", { name: "Ver ficha" });
  if (await show.isVisible()) await show.click();
  await expect(page.getByRole("heading", { name: "Parácuaro", level: 2 })).toBeVisible();
  const action = page.getByRole("button", { name: "Descargar ficha JSON" });
  await action.focus();
  await expect(action).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page
        .locator(".tc-selection-title, .tc-guide-label")
        .evaluateAll((elements) =>
          elements.every((element) => element.closest('[data-entrance-reduced="true"]') !== null)
        )
    )
    .toBe(true);
  const parts = page.locator(
    ".tc-guide-number, .tc-guide-label, .tc-guide-link, .tc-location-plane, .tc-location-pin, .tc-location-ring, .tc-selection-title, .tc-comparison-rule"
  );
  for (const part of await parts.all()) await expect(part).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const part of await parts.all()) await expect(part).toHaveCSS("animation-name", "none");
  await expect(action).toBeFocused();
  const history = page
    .getByRole("heading", { name: "Participación observada", exact: true })
    .locator("..");
  expect(await history.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
    0
  );
  const year = page.locator("dt").filter({ hasText: /^2021$/ });
  await expect(year.locator("..").locator("dd")).toHaveText("56.7%");
});
