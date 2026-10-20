import { test, expect } from "../fixtures/console-guard";

test("el recorrido coordina números, tarjetas y conectores sin repetir la secuencia", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const order: number[] = [];
    Reflect.set(window, "tcTraceOrder", order);
    document.addEventListener("animationstart", (event) => {
      if (event.animationName === "tc-trace-card-enter" && event.target instanceof HTMLElement)
        order.push(
          Number(event.target.closest<HTMLElement>("[data-motion-step]")!.dataset.motionStep)
        );
    });
  });
  await page.goto("/metodologia/");
  const trace = page.locator('[data-motion="trace"]');
  if (!(await trace.isVisible())) {
    expect(await trace.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
      0
    );
    return;
  }
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "tcTraceOrder")))
    .toEqual([0, 1, 2]);
  const cards = trace.locator(".tc-trace-card");
  const timing = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const css = getComputedStyle(element);
      return {
        delay: Number.parseFloat(css.animationDelay),
        duration: Number.parseFloat(css.animationDuration),
      };
    })
  );
  for (let index = 1; index < timing.length; index++) {
    const gap = timing[index]!.delay - timing[index - 1]!.delay;
    expect(gap).toBeGreaterThanOrEqual(0.15);
    expect(gap).toBeLessThan(timing[index - 1]!.duration);
  }
  expect(timing.at(-1)!.delay + timing.at(-1)!.duration).toBeLessThan(1.5);
  await expect(trace.locator(".tc-trace-number")).toHaveCount(3);
  await expect(trace.locator(".tc-trace-link")).toHaveCount(2);
  await expect
    .poll(() => trace.evaluate((element) => element.getAnimations({ subtree: true }).length))
    .toBe(0);
  for (const card of await cards.all()) await expect(card).toHaveCSS("opacity", "1");
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
  );
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  expect(await page.evaluate(() => Reflect.get(window, "tcTraceOrder"))).toEqual([0, 1, 2]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(cards.first()).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const card of await cards.all()) {
    await expect(card).toHaveCSS("animation-name", "none");
    await expect(card).toHaveCSS("opacity", "1");
  }
});

test("el archivo se despliega desde el centro y termina con las hojas estables", async ({
  page,
}) => {
  await page.goto("/datos/");
  const archive = page.locator('[data-motion="archive"]');
  if (!(await archive.isVisible())) {
    expect(
      await archive.evaluate((element) => element.getAnimations({ subtree: true }).length)
    ).toBe(0);
    return;
  }
  const sheets = archive.locator(".archive-sheet");
  const delays = await sheets.evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).animationDelay))
  );
  expect(delays[1]).toBeLessThan(delays[0]!);
  expect(delays[0]).toBeLessThan(delays[2]!);
  await expect
    .poll(() => archive.evaluate((element) => element.getAnimations({ subtree: true }).length))
    .toBe(0);
  expect(
    await sheets.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).rotate)
    )
  ).toEqual(["-8deg", "0deg", "8deg"]);
  for (const sheet of await sheets.all()) await expect(sheet).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const sheet of await sheets.all()) await expect(sheet).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(sheets.first()).toHaveCSS("animation-name", "none");
});

test("las descargas conservan identidad, foco y acceso durante la entrada por escala", async ({
  page,
}) => {
  await page.goto("/datos/");
  const cards = page.locator('[data-entrance="card"]');
  await expect(cards).toHaveCount(6);
  const first = cards.first();
  await first.scrollIntoViewIfNeeded();
  const action = first.getByRole("link", { name: /^Descargar / });
  const href = await action.getAttribute("href");
  await action.focus();
  await expect(first).toHaveAttribute("data-entrance-state", "settled");
  await expect(first).toHaveCSS("scale", "none");
  await expect(first).toHaveCSS("opacity", "1");
  await expect(action).toBeFocused();
  expect(await action.getAttribute("href")).toBe(href);
  await expect(page.locator('#archivos [data-entrance="heading"]')).toHaveCSS(
    "animation-name",
    "tc-heading-enter"
  );
});
