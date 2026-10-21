import { test, expect } from "../fixtures/console-guard";

const pages = [
  {
    route: "metodologia",
    chapters: ["recorrido", "participacion", "dimensiones", "comparar", "territorio"],
  },
  { route: "datos", chapters: ["archivos", "importar", "fuentes", "incidencias", "publicaciones"] },
] as const;

for (const entry of pages) {
  test(`${entry.route}: el índice sigue la lectura hacia abajo y al regresar`, async ({ page }) => {
    await page.goto(`/${entry.route}/`);
    const nav = page.getByRole("navigation", { name: "En esta página" });
    const originalUrl = page.url();
    for (const id of entry.chapters) {
      await page.evaluate((target) => {
        const section = document.getElementById(target)!;
        window.scrollTo({
          top: section.getBoundingClientRect().top + window.scrollY - 80,
          behavior: "instant",
        });
      }, id);
      await expect(nav.locator(`a[href="#${id}"]`)).toHaveAttribute("aria-current", "location");
      await expect(nav.locator('a[aria-current="location"]')).toHaveCount(1);
    }
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
    );
    await expect(nav.locator(`a[href="#${entry.chapters.at(-1)}"]`)).toHaveAttribute(
      "aria-current",
      "location"
    );
    await page.evaluate((target) => {
      window.scrollTo({
        top: document.getElementById(target)!.getBoundingClientRect().top + window.scrollY - 80,
        behavior: "instant",
      });
    }, entry.chapters[0]);
    await expect(nav.locator(`a[href="#${entry.chapters[0]}"]`)).toHaveAttribute(
      "aria-current",
      "location"
    );
    expect(page.url()).toBe(originalUrl);
  });
}

test("anclas y teclado conservan el capítulo activo en oscuro y con movimiento reducido", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/metodologia/#comparar");
  const nav = page.getByRole("navigation", { name: "En esta página" });
  await expect(nav.locator('a[href="#comparar"]')).toHaveAttribute("aria-current", "location");
  const participation = nav.locator('a[href="#participacion"]');
  await participation.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#participacion$/);
  await expect(participation).toHaveAttribute("aria-current", "location");
  await expect(participation).toHaveCSS("transition-duration", "0s");
  expect(
    await participation.evaluate(
      (element) => getComputedStyle(element, "::before").transitionDuration
    )
  ).toBe("0s");
  await page.getByRole("button", { name: "Activar tema oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await participation.click();
  await expect(participation).toHaveAttribute("aria-current", "location");
  await expect(participation).toHaveCSS("background-color", "rgb(48, 45, 83)");
  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = nav.locator('a[href="#dimensiones"]');
  await dimensions.click();
  await expect(dimensions).toHaveAttribute("aria-current", "location");
  const viewport = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    width: document.documentElement.clientWidth,
  }));
  expect(viewport.content).toBeLessThanOrEqual(viewport.width);
});
