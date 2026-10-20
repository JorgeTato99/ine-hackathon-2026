import { test, expect } from "../fixtures/console-guard";

for (const entry of [
  { route: "metodologia", last: "territorio" },
  { route: "datos", last: "incidencias" },
]) {
  test(`${entry.route}: carga y capítulos entran una vez sin ocultar texto ni alterar el índice`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const counts = new WeakMap<Element, number>();
      Reflect.set(window, "tcEntranceCounts", counts);
      document.addEventListener("animationstart", (event) => {
        if (
          event.animationName.startsWith("tc-") &&
          event.target instanceof Element &&
          event.target.hasAttribute("data-entrance")
        )
          counts.set(event.target, (counts.get(event.target) ?? 0) + 1);
      });
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/${entry.route}/`);
    const hero = page.locator('[data-entrance="hero"]');
    const target = page.locator(`#${entry.last} [data-entrance="heading"]`);
    const count = () =>
      target.evaluate(
        (element) =>
          (Reflect.get(window, "tcEntranceCounts") as WeakMap<Element, number>).get(element) ?? 0
      );
    await expect
      .poll(() =>
        hero.evaluate(
          (element) =>
            (Reflect.get(window, "tcEntranceCounts") as WeakMap<Element, number>).get(element) ?? 0
        )
      )
      .toBe(1);
    await expect(hero).toHaveCSS("opacity", "1");
    expect(await target.getAttribute("data-entrance-state")).toBeNull();
    await expect(target).toHaveCSS("opacity", "1");
    const reveal = () =>
      page.evaluate(
        (id) =>
          window.scrollTo({
            top: document.getElementById(id)!.getBoundingClientRect().top + window.scrollY - 80,
            behavior: "instant",
          }),
        entry.last
      );
    await reveal();
    await expect(target).toHaveAttribute("data-entrance-state", "entered");
    await expect.poll(count).toBe(1);
    await expect.poll(() => target.evaluate((element) => element.getAnimations().length)).toBe(0);
    await expect(
      page.getByRole("navigation", { name: "En esta página" }).locator(`a[href="#${entry.last}"]`)
    ).toHaveAttribute("aria-current", "location");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await reveal();
    expect(await count()).toBe(1);
    await expect(target).toHaveCSS("opacity", "1");
  });
}

test("reducir movimiento asienta las entradas; sin observer el contenido sigue disponible", async ({
  page,
}) => {
  await page.goto("/datos/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-entrance="hero"]')).toHaveAttribute(
    "data-entrance-state",
    "settled"
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const heading = page.locator('#incidencias [data-entrance="heading"]');
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveCSS("animation-name", "none");
  await expect(heading).toHaveCSS("opacity", "1");
  await page.addInitScript(() => Reflect.set(window, "IntersectionObserver", undefined));
  await page.goto("/metodologia/");
  const fallback = page.locator('#participacion [data-entrance="heading"]');
  await expect(fallback).toHaveAttribute("data-entrance-state", "settled");
  await expect(fallback).toHaveCSS("animation-name", "none");
  await expect(fallback).toHaveCSS("opacity", "1");
});
