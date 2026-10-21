import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/console-guard";

test("el archivo tiene navegación local, recursos identificables y descargas íntegras", async ({
  page,
}) => {
  await page.goto("/datos/");
  await page.getByRole("link", { name: "Ver archivos", exact: true }).click();
  await expect(page).toHaveURL(/#archivos$/);
  await expect(
    page.getByRole("heading", { name: "Archivos disponibles", exact: true })
  ).toBeInViewport();
  const downloads = page.getByRole("link", { name: /^Descargar / });
  await expect(downloads).toHaveCount(6);
  const labels = await downloads.evaluateAll((links) =>
    links.map((link) => link.getAttribute("aria-label"))
  );
  expect(new Set(labels).size).toBe(6);
  const manifest = await (await page.request.get("/data/manifest.json")).json();
  const event = page.waitForEvent("download");
  await page.getByRole("link", { name: "Descargar CSV: Historia municipal", exact: true }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe("municipios.csv");
  const bytes = await readFile((await download.path())!);
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(
    manifest.files["resultados-1.2/municipios.csv"].sha256
  );
  await page
    .getByRole("navigation", { name: "En esta página" })
    .getByRole("link", { name: /Cómo usar los archivos/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Cómo usar los archivos", exact: true })
  ).toBeInViewport();
});

test("una entrada activa no pierde el click ni el toque al enfocar su enlace", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/datos/");
  await expect(
    page.getByRole("button", { name: "Activar tema oscuro", exact: true })
  ).toBeEnabled();
  // Fijar el desplazamiento observado antes del foco para reproducir el fallo sin depender del reloj.
  await page.addStyleTag({
    content:
      '[data-entrance="hero"]:not([data-entrance-state="settled"]) { animation: none !important; translate: 0 24px !important; opacity: 1 !important; }',
  });
  const hero = page.locator('.tc-editorial-hero [data-entrance="hero"]');
  await expect(hero).toHaveCSS("translate", "0px 24px");
  const action = page.getByRole("link", { name: "Ver archivos", exact: true });
  if (isMobile) await action.tap();
  else await action.click();
  await expect(page).toHaveURL(/#archivos$/);
  await expect(hero).toHaveAttribute("data-entrance-state", "settled");
});

test("ambas páginas conservan contraste y reflow a 320px en los dos temas", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/metodologia/");
  for (const mode of ["dark", "light"] as const) {
    await page
      .getByRole("button", { name: mode === "dark" ? "Activar tema oscuro" : "Activar tema claro" })
      .click();
    await expect(page.locator("html")).toHaveClass(new RegExp(mode));
    for (const route of ["metodologia", "datos"]) {
      await page.goto(`/${route}/`);
      await expect(page.locator("html")).toHaveClass(new RegExp(mode));
      const dimensions = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("opacity", "1");
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations).toEqual([]);
    }
  }
});

test("el movimiento termina, respeta reducción y mantiene la navegación HTML", async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener("animationstart", (event) => {
      if (event.animationName.startsWith("tc-"))
        document.documentElement.dataset.tcAnimationStarted = "true";
    });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/datos/");
  if (await page.locator(".archive-sheet").first().isVisible())
    await expect(page.locator("html")).toHaveAttribute("data-tc-animation-started", "true");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("opacity", "1");
  const animations = () =>
    page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              "animationName" in animation && String(animation.animationName).startsWith("tc-")
          ).length
    );
  await expect.poll(animations).toBe(0);
  await page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: "Metodología", exact: true })
    .click();
  await expect(page).toHaveURL(/\/metodologia\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: "Datos y descargas", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Descarga los datos y conoce sus fuentes" })
  ).toBeVisible();
  for (const sheet of await page.locator(".archive-sheet").all())
    await expect(sheet).toHaveCSS("animation-name", "none");
  expect(await animations()).toBe(0);
});

test("los textos, anclas y archivos informativos funcionan sin JavaScript", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: testInfo.project.use.baseURL ?? "http://127.0.0.1:4173",
    viewport: { width: 320, height: 900 },
    isMobile: testInfo.project.use.isMobile ?? false,
    hasTouch: testInfo.project.use.hasTouch ?? false,
  });
  try {
    const page = await context.newPage();
    await page.goto("/metodologia/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page
      .getByRole("navigation", { name: "En esta página" })
      .getByRole("link", { name: /Leer la participación/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Cómo leer la participación", exact: true })
    ).toBeInViewport();
    await page.goto("/datos/");
    await expect(page.getByRole("link", { name: /^Descargar / })).toHaveCount(6);
    await expect(
      page.getByRole("heading", { name: "Descarga los datos y conoce sus fuentes" })
    ).toHaveCSS("opacity", "1");
    expect((await page.request.get("/data/resultados-1.2/metadatos.json")).status()).toBe(200);
    const size = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(size.width).toBeLessThanOrEqual(size.viewport);
  } finally {
    await context.close();
  }
});
