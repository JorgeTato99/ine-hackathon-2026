import { test, expect } from "../fixtures/console-guard";

test("estado, municipio por clave y ficha inmediata", async ({ page, isMobile }) => {
  await page.goto("/");
  const state = page.getByRole("combobox", { name: "Estado", exact: true });
  await state.fill("Oaxaca");
  await page.getByRole("option", { name: "Oaxaca", exact: true }).click();
  await expect(page.getByLabel("Cifras del territorio")).toContainText("299");
  const municipality = page.getByRole("combobox", { name: "Municipio", exact: true });
  await municipality.fill("20395");
  await page.getByRole("option", { name: /20395/ }).click();
  await expect(page.getByRole("button", { name: "Cerrar ficha municipal" })).toBeVisible();
  await expect(page).toHaveURL(/municipio=20395/);
  if (isMobile) await page.getByRole("button", { name: "Cerrar ficha municipal" }).click();
  else await expect(page.getByTestId("forecast-detail")).toBeVisible();
});

test("leyenda resalta sin cambiar ámbito ni cifras; tabla ordena y pagina", async ({ page }) => {
  await page.goto("/?entidad=20");
  const summary = page.getByLabel("Cifras del territorio");
  await expect(summary).toContainText("299");
  const before = await summary.textContent();
  await page.getByRole("button", { name: /^Rojo · mayor riesgo/ }).click();
  await expect(page.getByRole("button", { name: /^Rojo · mayor riesgo/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(await summary.textContent()).toBe(before);
  await page.getByRole("button", { name: "Ver como tabla", exact: true }).click();
  await expect(page.getByText("1–25 de 299", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Ordenar por Participación estimada · 2027", exact: true })
    .click();
  await page.getByRole("button", { name: "Página siguiente", exact: true }).click();
  await expect(page.getByText("26–50 de 299", { exact: true })).toBeVisible();
});

test("histórico usa años, mantiene territorio y separa sin casilla de sin dato", async ({
  page,
}) => {
  await page.goto("/?pestana=historico&anio=2024&entidad=07");
  await expect(page.getByRole("tab", { name: "Histórico", exact: true })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(page.getByRole("group", { name: "Tipo de intervención" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Sin casilla/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Sin dato/ })).toBeVisible();
  await page.getByRole("button", { name: "2009 Intermedia", exact: true }).click();
  await expect(page).toHaveURL(/anio=2009/);
  await expect(page).toHaveURL(/entidad=07/);
  await page.getByRole("tab", { name: "Pronóstico 2027", exact: true }).click();
  await expect(page.getByRole("group", { name: "Tipo de intervención" })).toBeVisible();
});
