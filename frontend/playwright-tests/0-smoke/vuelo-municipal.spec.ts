import type { Locator } from "@playwright/test";
import { test, expect } from "../fixtures/console-guard";
import { datasetFixture } from "../../test/fixtures/dataset";

const centers = [
  [-102.8, 21.8],
  [-102, 22.5],
  [-102.2, 19.6],
  [-115, 29],
] as const;

test.beforeEach(async ({ page }) => {
  const dataset = datasetFixture();
  for (const municipality of dataset.municipalities) municipality.hasGeometry = true;
  const geometry = {
    type: "FeatureCollection",
    features: dataset.municipalities.map((municipality, i) => {
      const [x, y] = centers[i]!;
      return {
        type: "Feature",
        properties: { CVEGEO: municipality.id },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [x - 0.25, y - 0.25],
              [x + 0.25, y - 0.25],
              [x + 0.25, y + 0.25],
              [x - 0.25, y + 0.25],
              [x - 0.25, y - 0.25],
            ],
          ],
        },
      };
    }),
  };
  await page.route("**/data/dataset.json", (route) => route.fulfill({ json: dataset }));
  await page.route("**/data/municipios.geojson", (route) => route.fulfill({ json: geometry }));
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

async function selectMunicipality(map: Locator, point: readonly [number, number] = centers[0]) {
  const [lon, lat, zoom] = (await map.getAttribute("data-map-view"))!.split(",").map(Number);
  const box = (await map.boundingBox())!;
  const project = (x: number, y: number) => {
    const sine = Math.sin((y * Math.PI) / 180),
      scale = 256 * 2 ** zoom!;
    return [
      ((x + 180) / 360) * scale,
      (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale,
    ] as const;
  };
  const a = project(lon!, lat!),
    b = project(...point);
  await map.click({
    position: { x: box.width / 2 + b[0] - a[0], y: box.height / 2 + b[1] - a[1] },
  });
}

function observeFlight(map: Locator) {
  return map.evaluate(
    (element) =>
      new Promise<{ duration: number; transforms: string[]; redraws: number }>(
        (resolve, reject) => {
          let started = 0,
            frame = 0,
            redraws = 0;
          const transforms = new Set<string>();
          const canvas = element.querySelector("canvas")!;
          const sample = () => {
            transforms.add(canvas.style.transform);
            frame = requestAnimationFrame(sample);
          };
          const canvasObserver = new MutationObserver(() => {
            if (element.getAttribute("data-map-motion") === "flying") redraws++;
          });
          canvasObserver.observe(canvas, {
            attributes: true,
            attributeFilter: ["width", "height"],
          });
          const timeout = setTimeout(() => {
            observer.disconnect();
            canvasObserver.disconnect();
            cancelAnimationFrame(frame);
            reject(new Error("El vuelo no terminó"));
          }, 6000);
          const observer = new MutationObserver(() => {
            if (element.getAttribute("data-map-motion") === "flying" && !started) {
              started = performance.now();
              sample();
            } else if (element.getAttribute("data-map-motion") === "idle" && started) {
              observer.disconnect();
              canvasObserver.disconnect();
              clearTimeout(timeout);
              cancelAnimationFrame(frame);
              resolve({
                duration: performance.now() - started,
                transforms: [...transforms],
                redraws,
              });
            }
          });
          observer.observe(element, { attributes: true, attributeFilter: ["data-map-motion"] });
        }
      )
  );
}

for (const mode of ["normal", "mapa"]) {
  test(`acerca en 0.8 s sin redibujados intermedios en vista ${mode}`, async ({ page }) => {
    await page.goto(mode === "mapa" ? "/?modo=mapa" : "/");
    const map = page.getByTestId("territorial-map");
    await expect(map).toHaveAttribute("data-map-ready", "true");
    await expect(map).toHaveAttribute("data-map-motion", "idle");
    const before = (await map.getAttribute("data-map-view"))!.split(",").map(Number);
    const flight = observeFlight(map);
    await selectMunicipality(map);
    await expect(page).toHaveURL(/municipio=01001/);
    await expect(map).toHaveAttribute("data-map-motion", "flying");
    await expect(map).toHaveAttribute("data-map-ready", "false");
    const proof = await flight;
    expect(proof.duration).toBeGreaterThanOrEqual(750);
    expect(proof.duration).toBeLessThan(1400);
    expect(proof.transforms.length).toBeGreaterThan(4);
    expect(proof.redraws).toBe(0);
    await expect(map).toHaveAttribute("data-map-ready", "true");
    await expect(map).toHaveAttribute("data-selected-id", "01001");
    const after = (await map.getAttribute("data-map-view"))!.split(",").map(Number);
    expect(after[2]!).toBeGreaterThan(before[2]!);
    await expect(map.locator("canvas")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
    if (mode === "mapa") {
      const box = (await map.boundingBox())!,
        viewport = page.viewportSize()!;
      // El centro del municipio queda fuera del panel lateral o la hoja inferior.
      const scale = 256 * 2 ** after[2]!;
      const y = (lat: number) =>
        (0.5 -
          Math.log((1 + Math.sin((lat * Math.PI) / 180)) / (1 - Math.sin((lat * Math.PI) / 180))) /
            (4 * Math.PI)) *
        scale;
      const point = {
        x: box.width / 2 + ((centers[0][0] - after[0]!) / 360) * scale,
        y: box.height / 2 + y(centers[0][1]) - y(after[1]!),
      };
      if (viewport.width >= 900) {
        expect(point.x).toBeGreaterThan(392);
        expect(point.x).toBeLessThan(box.width - 452);
      } else expect(point.y).toBeLessThan(box.height * 0.48 - 24);
    }
    await test.info().attach("vuelo-medido.json", {
      body: JSON.stringify(proof),
      contentType: "application/json",
    });
  });
}

test("movimiento reducido enfoca sin vuelo y su activación en vivo completa el destino", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await map.evaluate((element) => {
    element.setAttribute("data-qa-started-flight", "false");
    const observer = new MutationObserver((changes) => {
      if (
        element.getAttribute("data-map-motion") === "flying" ||
        changes.some((change) => change.oldValue === "flying")
      ) {
        element.setAttribute("data-qa-started-flight", "true");
        observer.disconnect();
      }
    });
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-map-motion"],
      attributeOldValue: true,
    });
  });
  await selectMunicipality(map);
  await expect(map).toHaveAttribute("data-selected-id", "01001");
  await expect(map).toHaveAttribute("data-map-motion", "idle");
  await expect(map).not.toHaveAttribute("data-map-redraws");
  await expect(map).toHaveAttribute("data-qa-started-flight", "false");
  const destination = await map.getAttribute("data-map-view");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await selectMunicipality(map);
  await expect(map).toHaveAttribute("data-map-motion", "flying");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await expect(map).toHaveAttribute("data-map-motion", "idle");
  await expect(map).toHaveAttribute("data-map-view", destination!);
});

test("el zoom interrumpe el vuelo y no vuelve a la cámara anterior", async ({ page }) => {
  await page.goto("/?modo=mapa");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await selectMunicipality(map);
  await expect(map).toHaveAttribute("data-map-motion", "flying");
  await page.getByRole("button", { name: "Acercar mapa", exact: true }).click();
  await expect(map).toHaveAttribute("data-map-motion", "idle");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  const camera = await map.getAttribute("data-map-view");
  // Superar la duración original comprueba que no queda un frame huérfano.
  await page.waitForTimeout(1000);
  await expect(map).toHaveAttribute("data-map-view", camera!);
});

test("permite seleccionar otro municipio al volver a México", async ({ page }) => {
  await page.goto("/");
  const map = page.getByTestId("territorial-map");
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await selectMunicipality(map);
  await expect(map).toHaveAttribute("data-selected-id", "01001");
  const close = page.getByRole("button", { name: "Cerrar ficha", exact: true });
  if (await close.isVisible()) {
    await close.click();
    await close.waitFor({ state: "hidden" });
  }
  await page.getByRole("button", { name: "MX · Restablecer vista de México", exact: true }).click();
  await selectMunicipality(map, centers[3]);
  await expect(map).toHaveAttribute("data-selected-id", "01099");
  await expect(page.getByRole("heading", { name: "Sin registro", level: 2 })).toBeVisible();
});
