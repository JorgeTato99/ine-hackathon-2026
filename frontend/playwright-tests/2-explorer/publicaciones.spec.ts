import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";

test("la comparación muestra ausencias, filtra por identidad y descarga su procedencia", async ({
  page,
}) => {
  await page.goto("/datos/#publicaciones");
  const section = page.getByRole("region", { name: "Cambios entre publicaciones", exact: true });
  await expect(section).toContainText("105 celdas");
  await expect(section).toContainText("15 municipios");
  await expect(section).toContainText("resultados-1.3 · vigente");
  await expect(section).toContainText("La tabla de escenarios es idéntica");
  await section.getByRole("button", { name: "Ver celdas modificadas (105)", exact: true }).click();
  const table = section.getByRole("table", { name: "Celdas modificadas entre publicaciones" });
  await expect(table.getByRole("row")).toHaveCount(26);
  await section.getByRole("textbox", { name: "Buscar en los cambios" }).fill("07030");
  await expect(table.getByRole("row")).toHaveCount(8);
  await section.getByRole("combobox", { name: "Campo modificado", exact: true }).click();
  await page.getByRole("option", { name: "n_jov_2024", exact: true }).click();
  await expect(table.getByRole("row")).toHaveCount(2);
  await expect(table.getByRole("cell", { name: "Sin dato", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "0", exact: true })).toBeVisible();
  await section.screenshot({
    path: `../temp/trabajo-nocturno/03-publicaciones/vista-${test.info().project.name}.png`,
    animations: "disabled",
  });
  const downloading = page.waitForEvent("download");
  await section
    .getByRole("link", { name: "Descargar comparación y procedencia (JSON)", exact: true })
    .click();
  const download = await downloading;
  const bytes = await readFile((await download.path())!);
  const file = JSON.parse(bytes.toString("utf8"));
  await expect(section).toContainText(createHash("sha256").update(bytes).digest("hex"));
  expect(file.generator).toEqual({ script: "scripts/compare_publications.py", schemaVersion: 1 });
  expect(file.summary).toMatchObject({ cells: 105, municipalities: 15, metadata: 4 });
  expect(file.before.source.commit).toBe("ac8dc3cdbb06b5a0d5ddd63b67bee9a43def9821");
  expect(file.after.source.commit).toBe("f25d9c2709d2a93179c7ee2d6d2df985d418d6ca");
  expect(file.tables[1].changes).toEqual([]);
  await section
    .getByRole("button", { name: "Reglas, cobertura y procedencia", exact: true })
    .click();
  await expect(section).toContainText("/sin_conteo_2024");
  const coverage = section.getByRole("table", { name: "Celdas vacías por campo", exact: true });
  const persistent = coverage.getByRole("row", { name: /municipios.csv · brecha_jovenes_2024/ });
  await expect(persistent.getByRole("cell", { name: "15", exact: true })).toHaveCount(2);
  await expect(
    section.getByRole("link", { name: "archivos en el commit f25d9c2", exact: true })
  ).toHaveAttribute("href", /\/tree\/f25d9c2/);
});

test("los detalles se leen en oscuro y a 320px sin desbordar la página", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/datos/#publicaciones");
  await page.getByRole("button", { name: "Activar tema oscuro", exact: true }).click();
  await page.setViewportSize({ width: 320, height: 900 });
  const section = page.getByRole("region", { name: "Cambios entre publicaciones", exact: true });
  await section.getByRole("button", { name: "Ver celdas modificadas (105)", exact: true }).click();
  await section
    .getByRole("button", { name: "Reglas, cobertura y procedencia", exact: true })
    .click();
  await expect(
    section.getByRole("region", { name: "Tabla de cambios entre publicaciones" })
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .include("#publicaciones")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations
  ).toEqual([]);
});
