import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";

test("protege un borrador al cerrar y un aviso de otra fuente recibe el foco", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Consultas guardadas", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Consultas guardadas" });
  await dialog.getByRole("textbox", { name: "Nombre de la consulta" }).fill("Borrador");
  await page.keyboard.press("Escape");
  await expect(dialog.getByRole("button", { name: "Seguir editando", exact: true })).toBeFocused();
  await dialog.getByRole("button", { name: "Seguir editando", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Nombre de la consulta" })).toHaveValue(
    "Borrador"
  );
  await dialog.getByRole("button", { name: "Guardar consulta actual", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Nombre de la consulta" })).toBeFocused();
  await dialog.getByRole("button", { name: "Cerrar consultas", exact: true }).click();
  await page.evaluate(() => {
    const key = "traza-civica.consultas.v1";
    const file = JSON.parse(localStorage.getItem(key)!);
    file.queries[0].sourceCommit = "a".repeat(40);
    localStorage.setItem(key, JSON.stringify(file));
  });
  await page.getByRole("button", { name: "Consultas guardadas", exact: true }).click();
  await expect(dialog).toContainText("Otra publicación · revisa la procedencia antes de abrir");
  await dialog.getByRole("button", { name: "Abrir Borrador", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Abrir con datos actuales", exact: true })
  ).toBeFocused();
  await expect(dialog).toContainText("fuente aaaaaaa");
  await dialog.getByRole("button", { name: "Cancelar apertura", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: /En este navegador/ })).toBeFocused();
});

test("guarda, recarga y recupera una consulta completa sin mezclar filtros", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?vista=tabla&entidad=01&municipio=01001&filas=50&direccion=desc");
  await page.getByRole("button", { name: "Consultas guardadas", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Consultas guardadas" });
  await dialog.getByRole("textbox", { name: "Nombre de la consulta" }).fill("Lectura compartida");
  await dialog
    .getByRole("textbox", { name: "Nota personal (opcional)" })
    .fill("Revisar, no es una recomendación.");
  await dialog.getByRole("button", { name: "Guardar consulta actual", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("Consulta guardada");
  const downloading = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Exportar Lectura compartida", exact: true }).click();
  const download = await downloading;
  const document = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(document.queries[0]).toMatchObject({
    resultVersion: "resultados-1.3",
    params: { entidad: "01", municipio: "01001", filas: "50", direccion: "desc" },
  });
  await page.goto("/?vista=tabla&buscar=Parácuaro&ln_min=99999");
  await page.reload();
  await page.getByRole("button", { name: "Consultas guardadas", exact: true }).click();
  await dialog.getByRole("button", { name: "Abrir Lectura compartida", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => new URL(page.url()).searchParams.get("municipio")).toBe("01001");
  expect(new URL(page.url()).searchParams.has("ln_min")).toBe(false);
  expect(new URL(page.url()).searchParams.has("buscar")).toBe(false);
  if (isMobile) await page.getByRole("button", { name: "Cerrar ficha", exact: true }).click();
  await expect(
    page.getByRole("table", { name: "Resultados municipales", exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Consultas guardadas", exact: true }).click();
  await dialog.getByLabel("Archivo de consultas").setInputFiles({
    name: "consultas.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(document)),
  });
  await expect(dialog.getByRole("button", { name: "Agregar copias", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Agregar copias", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Abrir Lectura compartida", exact: true })
  ).toHaveCount(2);
});

test("recupera modo mapa y su regreso a tabla, sin desbordar y con diálogo accesible", async ({
  page,
}) => {
  await page.goto("/?vista=tabla&entidad=01");
  await page.getByRole("button", { name: "Entrar al modo mapa", exact: true }).click();
  await page.getByRole("button", { name: "Consultas guardadas", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Consultas guardadas" });
  await dialog.getByRole("textbox", { name: "Nombre de la consulta" }).fill("Mapa desde tabla");
  await dialog.getByRole("button", { name: "Guardar consulta actual", exact: true }).click();
  await dialog.getByRole("button", { name: "Editar Mapa desde tabla", exact: true }).click();
  await dialog.getByRole("button", { name: "Cancelar edición", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Nombre de la consulta" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Salir del modo mapa" })).toBeVisible();
  await page.getByRole("button", { name: "Salir del modo mapa" }).click();
  await page.getByRole("button", { name: "Consultas guardadas", exact: true }).click();
  await dialog.getByRole("button", { name: "Abrir Mapa desde tabla", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salir del modo mapa" })).toBeVisible();
  await page.getByRole("button", { name: "Salir del modo mapa" }).click();
  await expect(
    page.getByRole("table", { name: "Resultados municipales", exact: true })
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole("button", { name: "Activar tema oscuro", exact: true }).click();
  await page.getByRole("button", { name: "Consultas guardadas", exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true
  );
  expect(
    (
      await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations
  ).toEqual([]);
  await dialog.screenshot({
    path: `../temp/trabajo-nocturno/02-consultas/dialogo-${test.info().project.name}.png`,
  });
  await dialog.getByRole("button", { name: "Cerrar consultas", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Consultas guardadas", exact: true })
  ).toBeFocused();
});
