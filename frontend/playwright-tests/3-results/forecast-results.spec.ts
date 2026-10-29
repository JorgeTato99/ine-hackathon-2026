import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test, expect } from "../fixtures/console-guard";

test("Oxchuc: probabilidad entera y diferencia con un decimal", async ({ page }) => {
  await page.goto("/?municipio=07064");
  const detail = page.getByLabel("Ficha municipal", { exact: true }).last();
  await expect(detail).toContainText("probable (93%)");
  await expect(detail).toContainText("14.9 puntos menos");
  await expect(detail).not.toContainText("92.65%");
  await expect(detail).not.toContainText("14.87 puntos");
});

test("Tijuana: rango, cinco grupos, historia, intervenciones y descarga de ficha", async ({
  page,
}) => {
  await page.goto("/?municipio=02004");
  const detail = page.getByLabel("Ficha municipal", { exact: true }).last();
  await expect(detail).toContainText("37.1");
  await expect(detail).toContainText("28.0");
  await expect(detail).toContainText("47.9");
  await expect(detail).toContainText("no son causas probadas");
  await expect(
    detail
      .getByRole("table", { name: "Cuatro intervenciones supuestas en Tijuana" })
      .getByRole("row")
  ).toHaveCount(5);
  await detail.getByText("Ver valores del historial", { exact: true }).click();
  await expect(
    detail.getByRole("table", { name: "Participación municipal y nacional" }).getByRole("row")
  ).toHaveCount(8);
  const event = page.waitForEvent("download");
  await detail.getByRole("button", { name: "Descargar ficha (JSON)", exact: true }).click();
  const file = await event;
  const document = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(document.version).toBe("resultados-1.6");
  expect(document.interventions).toHaveLength(5);
  expect(document.municipality.id).toBe("02004");
});

test("D32: el aviso parcial persiste en ficha, cambio de escenario y descarga", async ({
  page,
}, testInfo) => {
  await page.goto("/?municipio=07064&escenario=nac-estimado_int-combinada");
  const detail = page.getByLabel("Ficha municipal", { exact: true }).last();
  await expect(detail.getByRole("status")).toContainText(
    "Intervención calculada solo con los datos disponibles"
  );
  await expect(detail).toContainText("Personas adicionales en la lista: 0");
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-ready", "true");
  await expect(page.getByTestId("territorial-map")).toHaveAttribute("data-map-motion", "idle");
  await detail.getByRole("status").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `artifacts/partial-${testInfo.project.name}.png` });
  await detail.getByText("Contexto del municipio", { exact: true }).click();
  await expect(detail).toContainText("Comparación de fuentes en Chiapas (2019–2024)");
  const event = page.waitForEvent("download");
  await detail.getByRole("button", { name: "Descargar ficha (JSON)", exact: true }).click();
  const document = JSON.parse(await readFile((await (await event).path())!, "utf8"));
  expect(document.result.reason.split("|")).toContain("intervencion_parcial");
  await page.goto("/?municipio=07064&escenario=nac-estimado_int-ninguna");
  await expect(detail.getByRole("heading", { name: "Oxchuc", exact: true })).toBeVisible();
  await expect(detail.getByRole("status")).toHaveCount(0);
});

test("sin casilla y geometría sin resultados se explican sin fabricar ceros", async ({ page }) => {
  await page.goto("/?municipio=07030&pestana=historico&anio=2024");
  await expect(page.getByLabel("Ficha municipal", { exact: true }).last()).toContainText(
    "faltaron casillas"
  );
  await page.goto("/?municipio=24059");
  await expect(page.getByRole("heading", { name: "Villa de Pozos", exact: true })).toBeVisible();
  await expect(page.getByLabel("Cifras del territorio")).toContainText("Sin dato");
  await expect(page.getByLabel("Ficha municipal", { exact: true }).last()).toContainText(
    "no cuenta con datos electorales"
  );
});

test("archivo: cinco escenarios, ZIP 1.6, huella y comparación de metadatos", async ({ page }) => {
  await page.goto("/datos/");
  await expect(
    page.getByRole("heading", { name: "Archivos disponibles", exact: true })
  ).toBeVisible();
  const link = page.getByRole("link", {
    name: "Descargar ZIP: Mapa y base de datos completos",
    exact: true,
  });
  const downloadEvent = page.waitForEvent("download");
  await link.click();
  const download = await downloadEvent;
  const bytes = await readFile((await download.path())!);
  const manifest = await (await page.request.get("/data/manifest.json")).json();
  expect(manifest.version).toBe("resultados-1.6");
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(
    manifest.files["resultados-1.6/mapa-escenarios.zip"].sha256
  );
  await expect(
    page.getByRole("link", { name: "Descargar comparación y procedencia (JSON)", exact: true })
  ).toHaveAttribute("href", "/data/publicaciones/resultados-1.3__resultados-1.6.json");
  await expect(page.getByRole("main")).toContainText("Cinco escenarios");
});
