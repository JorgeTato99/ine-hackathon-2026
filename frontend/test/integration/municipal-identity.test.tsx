import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MunicipalIdentity } from "@/components/explorer/municipal-identity";
import { municipalGeometryKey, type MunicipalGeometry } from "@/utils/municipal-geometry";
import { datasetFixture } from "../fixtures/dataset";

const clients: QueryClient[] = [];
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.restoreAllMocks();
});

const geometry: MunicipalGeometry = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { CVEGEO: "01001" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { CVEGEO: "01002" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [4, 0],
            [4, 1],
            [0, 0],
          ],
        ],
      },
    },
  ],
};

function setup(cached: boolean) {
  const dataset = datasetFixture();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  if (cached) client.setQueryData(municipalGeometryKey(dataset), geometry);
  const ui = (id: string, source = dataset) => (
    <QueryClientProvider client={client}>
      <MunicipalIdentity
        dataset={source}
        municipality={source.municipalities.find((item) => item.id === id)!}
      />
    </QueryClientProvider>
  );
  return { dataset, client, ui };
}

describe("Identidad territorial sin nuevas descargas", () => {
  it("conserva nombre y clave sin pedir cartografía si sólo se abrió la tabla", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const { ui } = setup(false);
    render(ui("01001"));
    expect(screen.getByRole("heading", { name: "Aguascalientes" })).toBeVisible();
    expect(screen.getByText(/Clave 01001/)).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("actualiza el contorno por CVEGEO al cambiar municipio y no reutiliza la silueta anterior", () => {
    const { ui, client, dataset } = setup(true);
    const { rerender } = render(ui("01001"));
    const first = screen.getByRole("img", { name: /Contorno de Aguascalientes/ });
    const path = first.querySelector("path")!.getAttribute("d");
    expect(first).toHaveAttribute("data-municipal-outline", "01001");
    expect(first.querySelector("path")).toHaveAttribute("fill-rule", "evenodd");
    rerender(ui("01002"));
    const second = screen.getByRole("img", { name: /Contorno de Asientos/ });
    expect(second).toHaveAttribute("data-municipal-outline", "01002");
    expect(second.querySelector("path")!.getAttribute("d")).not.toBe(path);
    expect(client.getQueryData(municipalGeometryKey(dataset))).toBe(geometry);
    rerender(ui("01099"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
  it("recibe la geometría del mapa por caché y omite la de otra publicación", async () => {
    const { ui, client, dataset } = setup(false);
    const { rerender } = render(ui("01001"));
    await act(async () => {
      client.setQueryData(municipalGeometryKey(dataset), geometry);
    });
    expect(await screen.findByRole("img", { name: /Contorno de Aguascalientes/ })).toBeVisible();
    rerender(ui("01001", { ...dataset, version: "otra-publicacion" }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
