import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";

test("un clic sobre geometría real abre su ficha y conserva una sola carga cartográfica", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/data/municipios.geojson")) requests++;
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?entidad=01");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await map.scrollIntoViewIfNeeded();
  const [lon, lat, zoom] = (await map.getAttribute("data-map-view"))!.split(",").map(Number);
  const box = (await map.boundingBox())!;
  const project = (longitude: number, latitude: number) => {
    const sine = Math.sin((latitude * Math.PI) / 180),
      scale = 256 * 2 ** zoom!;
    return [
      ((longitude + 180) / 360) * scale,
      (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale,
    ];
  };
  const center = project(lon!, lat!),
    target = project(-102.3054281909746, 21.847434);
  await map.click({
    position: {
      x: box.width / 2 + target[0]! - center[0]!,
      y: box.height / 2 + target[1]! - center[1]!,
    },
  });
  await expect(page).toHaveURL(/municipio=01001/);
  await expect(
    page.getByRole("heading", { name: "Aguascalientes", level: 2, exact: true })
  ).toBeVisible();
  await expect(map).toHaveAttribute("data-selected-id", "01001");
  expect(requests).toBe(1);
});

test("el mapa normal gana altura y la leyenda se mantiene dentro de él", async ({ page }) => {
  await page.setViewportSize({ width: 1265, height: 712 });
  await page.goto("/");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  const frame = (await map.boundingBox())!;
  const legend = (await page.getByLabel("Leyenda del mapa").boundingBox())!;
  expect(frame.height).toBeGreaterThanOrEqual(560);
  expect(legend.y + legend.height).toBeLessThan(frame.y + frame.height);
  await expect(page.getByRole("button", { name: "Ampliar mapa", exact: true })).toBeVisible();
});
test("las cifras quedan visibles al desplazar el mapa normal", async ({ page }) => {
  await page.goto("/");
  const summary = page.getByLabel("Cifras del territorio");
  await expect(summary).toBeVisible();
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
  const before = (await summary.boundingBox())!;
  await page.evaluate((distance) => window.scrollTo(0, distance), before.y + 40);
  await expect.poll(async () => Math.abs((await summary.boundingBox())!.y)).toBeLessThanOrEqual(2);
  await expect(summary).toContainText("24,955,268");
});
test("país: cifras, cinco opciones, mapa plano y controles retirados", async ({ page }) => {
  await page.goto("/");
  const summary = page.getByLabel("Cifras del territorio");
  await expect(summary).toContainText("51.4");
  await expect(summary).toContainText("98,330,348");
  await expect(summary).toContainText("24,955,268");
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
  await expect(
    page.getByRole("group", { name: "Tipo de intervención" }).getByRole("button")
  ).toHaveCount(5);
  await page.getByRole("button", { name: "Las tres", exact: true }).click();
  await expect(summary).toContainText("411");
  await expect(summary).toContainText("528,400");
  await expect(summary).toContainText("84 salen");
  await expect(summary).toContainText("51.8");
  await expect(page.getByText("Participación supuesta del país", { exact: true })).toHaveCount(0);
  for (const name of ["Más filtros", "Consultas", "Cómo explorar", "Comparar sin/con intervención"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
});

test("enlace antiguo, ficha y México vuelven a cargar el ámbito correcto", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?municipio=30087&escenario=nac-medio_int-dirigida_rojos&distribucion=abajo");
  await expect(page.getByRole("heading", { name: "Xalapa", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/nac-estimado_int-combinada/);
  await expect(page).not.toHaveURL(/distribucion/);
  if (isMobile) await page.getByRole("button", { name: "Cerrar ficha municipal" }).click();
  await page.getByRole("button", { name: "MX · Restablecer vista de México" }).click();
  await expect(page).not.toHaveURL(/municipio=|entidad=/);
  await page.reload();
  await expect(page.getByLabel("Cifras del territorio")).toContainText("528,400");
  await expect(page.getByRole("heading", { name: "Xalapa", exact: true })).toHaveCount(0);
});

test("selección conserva vuelo nativo y respeta movimiento reducido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?municipio=02004");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-selected-id", "02004");
  await expect(map).toHaveAttribute("data-map-motion", "idle");
  await expect(page.getByRole("heading", { name: "Tijuana", exact: true })).toBeVisible();
});

test("contraste, teclado y reflow en ambos temas a 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByLabel("Cifras del territorio")).toBeVisible();
  for (const mode of ["dark", "light"] as const) {
    await page
      .getByRole("button", { name: mode === "dark" ? "Activar tema oscuro" : "Activar tema claro" })
      .click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  }
  await page.getByRole("tab", { name: "Histórico", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("group", { name: "Año de la elección" })).toBeVisible();
});
