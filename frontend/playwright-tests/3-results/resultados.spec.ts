import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/console-guard";

// Conservar DOM y fuentes sin capturar continuamente el Canvas de todo el país.
test.use({
  trace: { mode: "retain-on-failure", screenshots: false, snapshots: true, sources: true },
});

async function choose(page: Page, label: string, option: string | RegExp) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
}
async function closeScenarioDialog(page: Page) {
  const close = page.getByRole("button", { name: "Volver al mapa", exact: true });
  if (await close.isVisible()) {
    await close.click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
}
test("pronóstico real: compara al mismo nivel nacional y reproduce 505007 votos y 88 salidas", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
  await expect(page.getByRole("tab", { name: "Pronóstico 2027", exact: true })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  const cards = page.getByRole("region", { name: "Cifras de control de la consulta" });
  await page.screenshot({ path: test.info().outputPath("pronostico.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(cards.getByText("495", { exact: true })).toBeVisible();
  if (isMobile) await page.getByRole("button", { name: "Escenarios", exact: true }).click();
  await choose(page, "Intervención hipotética", "Con intervención dirigida");
  await closeScenarioDialog(page);
  await expect(page).toHaveURL(/nac-medio_int-dirigida_rojos/);
  await expect(cards.getByText("505,007", { exact: true })).toBeVisible();
  await expect(cards.getByText("88", { exact: true })).toBeVisible();
  if (isMobile) await page.getByRole("button", { name: "Escenarios", exact: true }).click();
  await choose(page, "Nivel nacional", /^Bajo/);
  await closeScenarioDialog(page);
  await expect(cards.getByText("90", { exact: true })).toBeVisible();
  await expect(cards.getByText("495", { exact: true })).toBeVisible();
});

test("las siete vistas reutilizan Canvas y los filtros se comparten entre pestañas", async ({
  page,
  isMobile,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/data/municipios.geojson")) requests++;
  });
  await page.goto("/");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await map
    .locator("canvas")
    .evaluate((element) => element.setAttribute("data-qa-retained", "yes"));
  await page.getByRole("tab", { name: "Indicadores y contexto", exact: true }).click();
  const cases = [
    ["Qué se elige en 2027", "676"],
    ["Rezago persistente", "285"],
    ["Zonas frías y calientes", "371"],
    ["Personas en juego", "2,898,581"],
    ["Alerta sin casilla", "59"],
    ["Contexto de seguridad", "517"],
    ["Historia 2009–2024", "4"],
  ];
  const cards = page.getByRole("region", { name: "Cifras de control de la consulta" });
  for (const [view, total] of cases) {
    await choose(page, "Vista de contexto", view!);
    await expect(cards.getByText(total!, { exact: true }).first()).toBeVisible();
    await expect(map.locator('[data-qa-retained="yes"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  }
  await page.getByRole("button", { name: isMobile ? /^Filtros/ : /^Más filtros/ }).click();
  await choose(page, "Usos y costumbres", "Sí");
  await page.getByRole("button", { name: "Ver resultados", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: "Pronóstico 2027", exact: true }).click();
  await expect(page).toHaveURL(/costumbres=si/);
  await expect(cards.getByText("425", { exact: true })).toBeVisible();
  expect(requests).toBe(1);
  await page.screenshot({ path: test.info().outputPath("filtros-compartidos.png") });
});

test("distingue sin casilla de cero y mantiene Villa de Pozos sin estimación", async ({ page }) => {
  await page.goto("/?modo=mapa&pestana=contexto&indicador=historia&buscar=07030&municipio=07030");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await expect(page.getByRole("heading", { name: "Chicomuselo", level: 2 })).toBeVisible();
  const year = page.locator("dt").filter({ hasText: /^2024$/ });
  await expect(year.locator("..").locator("dd")).toHaveText("Sin casilla: no se pudo votar");
  await page.goto("/?modo=mapa&buscar=24059&municipio=24059");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await expect(page.getByRole("heading", { name: "Villa de Pozos", level: 2 })).toBeVisible();
  await expect(page.getByText(/Sin datos electorales en esta entrega/)).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar ficha JSON", exact: true }).click();
  const download = await downloading;
  const { readFile } = await import("node:fs/promises");
  const document = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(document.sample).toBe(false);
  expect(document.result.participation).toBeNull();
  expect(document.municipality.id).toBe("24059");
});

for (const mode of ["normal", "mapa"]) {
  test(`MX limpia la selección y conserva la vista nacional al recargar en modo ${mode}`, async ({
    page,
  }) => {
    const params = new URLSearchParams({
      escenario: "nac-medio_int-ninguna",
      segundo: "nac-medio_int-dirigida_rojos",
    });
    if (mode === "mapa") params.set("modo", "mapa");
    await page.goto(`/?${params}`);
    const map = page.getByTestId("territorial-map");
    await expect(map).toHaveAttribute("data-map-ready", "true");
    const country = await map.getAttribute("data-map-view");
    const expectCountry = async () => {
      await expect(map).toHaveAttribute("data-map-ready", "true");
      const actual = (await map.getAttribute("data-map-view"))!.split(",").map(Number);
      const expected = country!.split(",").map(Number);
      expect(actual[2]).toBeCloseTo(expected[2]!, 5);
      const project = (lon: number, lat: number) => {
        const scale = 256 * 2 ** expected[2]!;
        const sine = Math.sin((lat * Math.PI) / 180);
        return [
          ((lon + 180) / 360) * scale,
          (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale,
        ];
      };
      const a = project(actual[0]!, actual[1]!),
        b = project(expected[0]!, expected[1]!);
      // Leaflet redondea el origen del Canvas al píxel al reconstruir la cámara.
      expect(Math.abs(a[0]! - b[0]!)).toBeLessThanOrEqual(1);
      expect(Math.abs(a[1]! - b[1]!)).toBeLessThanOrEqual(1);
    };
    params.set("municipio", "28035");
    await page.goto(`/?${params}`);
    await expect(map).toHaveAttribute("data-map-ready", "true");
    await expect(map).toHaveAttribute("data-selected-id", "28035");
    await page
      .getByRole("button", { name: "MX · Restablecer vista de México", exact: true })
      .click();
    await expect.poll(() => new URL(page.url()).searchParams.has("municipio")).toBe(false);
    const current = new URL(page.url()).searchParams;
    expect(current.get("escenario")).toBe("nac-medio_int-ninguna");
    expect(current.get("segundo")).toBe("nac-medio_int-dirigida_rojos");
    expect(current.get("modo")).toBe(mode === "mapa" ? "mapa" : null);
    await expect(map).toHaveAttribute("data-selected-id", "");
    await expectCountry();
    await page.reload();
    await expect(map).toHaveAttribute("data-map-ready", "true");
    await expect(map).toHaveAttribute("data-selected-id", "");
    await expectCountry();
  });
}
