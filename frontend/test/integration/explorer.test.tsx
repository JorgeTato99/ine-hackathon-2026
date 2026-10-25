import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { configure, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Explorer } from "@/components/explorer/explorer";
import { renderWithProviders } from "../test-utils/render-with-providers";
import { server } from "../test-utils/msw/server";
import userEvent from "@testing-library/user-event";

const data = JSON.parse(readFileSync("public/data/dataset.json", "utf8"));
// La entrega real se decodifica por HTTP; permitir carga del host sin cambiar las aserciones.
configure({ asyncUtilTimeout: 5000 });
const environment = vi.hoisted(() => ({ mobile: false }));
vi.mock("@mui/material/useMediaQuery", () => ({ default: () => environment.mobile }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("next/dynamic", () => ({
  default: () =>
    function MapFixture({ onSelect }: { onSelect: (id: string) => void }) {
      return (
        <div>
          <button onClick={() => onSelect("02004")}>Elegir Tijuana en mapa</button>
          <button onClick={() => onSelect("")}>México en mapa</button>
        </div>
      );
    },
}));
beforeEach(() => {
  environment.mobile = false;
  window.history.replaceState(null, "", "/");
  server.use(http.get("*/data/dataset.json", () => HttpResponse.json(data)));
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(() => "blob:test"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());
describe("explorador de la entrega 1.6", () => {
  it("recupera modo mapa, paneles, anchura y ayudas sin perder la consulta", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Explorer />);
    await user.click(await screen.findByRole("button", { name: "Ampliar mapa" }));
    expect(document.documentElement).toHaveAttribute("data-map-mode", "true");
    expect(window.location.search).toContain("modo=mapa");
    for (const name of ["herramientas", "cifras", "leyenda", "ficha"]) {
      await user.click(screen.getByRole("button", { name: `Minimizar ${name}` }));
      expect(screen.getByRole("button", { name: `Ampliar ${name}` })).toHaveAttribute(
        "aria-expanded",
        "false"
      );
      await user.click(screen.getByRole("button", { name: `Ampliar ${name}` }));
    }
    fireEvent.change(screen.getByLabelText("Ancho de ficha"), { target: { value: "amplia" } });
    expect(screen.getByLabelText("Ancho de ficha")).toHaveValue("amplia");
    await user.click(screen.getByRole("button", { name: "Minimizar todos los paneles" }));
    expect(screen.getByRole("button", { name: "Ampliar ficha" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Restaurar paneles" }));
    await user.click(screen.getByRole("button", { name: "Ayuda sobre participación esperada" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.documentElement).toHaveAttribute("data-map-mode", "true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.documentElement).not.toHaveAttribute("data-map-mode"));
    expect(window.location.search).not.toContain("modo=");
  }, 30000);
  it("modo mapa móvil conserva una sección abierta y adapta la selección", async () => {
    environment.mobile = true;
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?modo=mapa");
    renderWithProviders(<Explorer />);
    await screen.findByRole("button", { name: "Salir del modo mapa" });
    await user.click(screen.getByRole("button", { name: "Ampliar cifras" }));
    expect(screen.getByRole("button", { name: "Ampliar herramientas" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Minimizar todos los paneles" }));
    await user.click(screen.getByRole("button", { name: "Restaurar paneles" }));
    await user.click(screen.getByRole("button", { name: "Elegir Tijuana en mapa" }));
    await screen.findByRole("heading", { name: "Tijuana" });
    await user.click(screen.getByRole("button", { name: "Salir del modo mapa" }));
    await waitFor(() => expect(document.documentElement).not.toHaveAttribute("data-map-mode"));
    expect(window.location.search).toContain("municipio=02004");
  });
  it("permite recuperar un fallo de carga sin inventar resultados", async () => {
    server.use(http.get("*/data/dataset.json", () => new HttpResponse(null, { status: 503 })));
    renderWithProviders(<Explorer />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar");
    server.use(http.get("*/data/dataset.json", () => HttpResponse.json(data)));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByLabelText("Cifras del territorio");
  });
  it("la tabla ordena, pagina, cambia tamaño y exporta la lectura histórica", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Explorer />);
    await user.click(await screen.findByRole("button", { name: "Ver como tabla" }));
    await user.click(screen.getByRole("button", { name: "Ordenar por Riesgo relativo" }));
    await user.click(screen.getByRole("button", { name: "Ordenar por Riesgo relativo" }));
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getByText("26–50 de 2478")).toBeVisible();
    await user.click(screen.getByRole("combobox", { name: "Filas por página" }));
    await user.click(screen.getByRole("option", { name: "50" }));
    expect(screen.getByText("1–50 de 2478")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Histórico" }));
    await user.click(screen.getByRole("button", { name: "2009 Intermedia" }));
    await user.click(screen.getByRole("button", { name: "Ordenar por Participación 2009" }));
    await user.click(screen.getByRole("button", { name: "Descargar selección (CSV)" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Ver como mapa" }));
    await user.click(screen.getByRole("tab", { name: "Pronóstico 2027" }));
    await user.click(screen.getByRole("button", { name: /^Rojo · mayor riesgo/ }));
    expect(new URLSearchParams(window.location.search).get("leyenda")).toBe("alto");
    await user.click(screen.getByRole("button", { name: /^Rojo · mayor riesgo/ }));
    expect(new URLSearchParams(window.location.search).has("leyenda")).toBe(false);
  }, 30000);
  it("busca por nombre sin estado, conserva el estado al cerrar y permite quitarlo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Explorer />);
    const input = await screen.findByRole("combobox", { name: "Municipio" });
    await user.type(input, "Tijuana");
    await user.click(await screen.findByRole("option", { name: /Tijuana · 02004/ }));
    expect(window.location.search).toContain("entidad=02");
    await user.click(screen.getByRole("button", { name: "Cerrar ficha municipal" }));
    expect(window.location.search).not.toContain("municipio=");
    await user.click(screen.getByRole("combobox", { name: "Estado" }));
    fireEvent.click(screen.getByLabelText("Quitar estado"));
    expect(window.location.search).not.toContain("entidad=");
    await user.type(screen.getByRole("combobox", { name: "Estado" }), "Oaxaca");
    await user.click(await screen.findByRole("option", { name: "Oaxaca" }));
    expect(screen.getByLabelText("Cifras del territorio")).toHaveTextContent("299");
    await user.click(screen.getByRole("button", { name: "México" }));
    expect(window.location.search).not.toContain("entidad=");
  }, 30000);
  it("en móvil la hoja responde a Escape y descarga los cinco resultados", async () => {
    environment.mobile = true;
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?municipio=07030&pestana=historico&anio=2024");
    renderWithProviders(<Explorer />);
    await screen.findByRole("heading", { name: "Chicomuselo" });
    await user.click(screen.getByRole("button", { name: "Descargar ficha (JSON)" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(window.location.search).not.toContain("municipio="));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Elegir Tijuana en mapa" }));
    await screen.findByRole("heading", { name: "Tijuana" });
    await user.click(screen.getByRole("button", { name: "Cerrar ficha municipal" }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Tijuana" })).not.toBeInTheDocument()
    );
  });
  it("descarta parámetros antiguos e inválidos sin ocultar todos los municipios", async () => {
    window.history.replaceState(
      null,
      "",
      "/?municipio=99999&entidad=66&leyenda=inexistente&escenario=otro&modo=mapa"
    );
    renderWithProviders(<Explorer />);
    await screen.findByLabelText("Cifras del territorio");
    await waitFor(() => expect(window.location.search).not.toMatch(/leyenda|99999|66/));
    expect(window.location.search).toContain("modo=mapa");
    expect(window.location.search).toContain("nac-estimado_int-ninguna");
  });
  it("muestra las cifras iniciales y retira los controles anteriores", async () => {
    renderWithProviders(<Explorer />);
    const summary = await screen.findByLabelText("Cifras del territorio");
    expect(summary).toHaveTextContent("51.4");
    expect(summary).toHaveTextContent("98,330,348");
    expect(summary).toHaveTextContent("495");
    expect(screen.queryByText("Participación supuesta del país")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Más filtros" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });
  it("cambia intervención y publica la consulta sin recargar", async () => {
    renderWithProviders(<Explorer />);
    fireEvent.click(await screen.findByRole("button", { name: "Las tres" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Cifras del territorio")).toHaveTextContent("411")
    );
    expect(screen.getByLabelText("Cifras del territorio")).toHaveTextContent("528,400");
    expect(window.location.search).toContain("nac-estimado_int-combinada");
  });
  it("abre la ficha y México elimina estado y municipio de la URL", async () => {
    renderWithProviders(<Explorer />);
    fireEvent.click(await screen.findByRole("button", { name: "Elegir Tijuana en mapa" }));
    const detail = await screen.findByRole("complementary", { name: "Ficha municipal" });
    expect(within(detail).getByRole("heading", { name: "Tijuana" })).toBeVisible();
    expect(detail).toHaveTextContent("37.1");
    expect(detail).toHaveTextContent("no son causas probadas");
    expect(window.location.search).toContain("entidad=02");
    fireEvent.click(screen.getByRole("button", { name: "México en mapa" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("complementary", { name: "Ficha municipal" })
      ).not.toBeInTheDocument()
    );
    expect(window.location.search).not.toMatch(/municipio|entidad/);
  });
  it("histórico conserva la selección y oculta las intervenciones", async () => {
    window.history.replaceState(
      null,
      "",
      "/?municipio=30087&escenario=nac-medio_int-dirigida_rojos"
    );
    renderWithProviders(<Explorer />);
    await screen.findByRole("heading", { name: "Xalapa" });
    fireEvent.click(screen.getByRole("tab", { name: "Histórico" }));
    expect(await screen.findByRole("group", { name: "Año de la elección" })).toBeVisible();
    expect(screen.queryByRole("group", { name: "Tipo de intervención" })).not.toBeInTheDocument();
    expect(window.location.search).toContain("municipio=30087");
    expect(window.location.search).toContain("nac-estimado_int-combinada");
  });
  it("sin datos no se fabrica un cero ni una intervención", async () => {
    window.history.replaceState(null, "", "/?municipio=24059");
    renderWithProviders(<Explorer />);
    const detail = await screen.findByRole("complementary", { name: "Ficha municipal" });
    expect(detail).toHaveTextContent("no cuenta con datos electorales");
    expect(screen.getByLabelText("Cifras del territorio")).toHaveTextContent("Sin dato");
    expect(within(detail).queryByRole("table")).not.toBeInTheDocument();
  });
  it("muestra intervención parcial y la comparación estatal de homicidios", async () => {
    window.history.replaceState(null, "", "/?municipio=07064&escenario=nac-estimado_int-combinada");
    renderWithProviders(<Explorer />);
    const detail = await screen.findByRole("complementary", { name: "Ficha municipal" });
    expect(detail).toHaveTextContent("Intervención calculada solo con los datos disponibles");
    expect(detail).toHaveTextContent("ese componente no suma votos ni personas");
    expect(detail).toHaveTextContent("Personas adicionales en la lista: 0");
    await userEvent.click(within(detail).getByText("Contexto del municipio", { exact: true }));
    expect(detail).toHaveTextContent("Comparación de fuentes en Chiapas (2019–2024)");
    expect(detail).toHaveTextContent("La comparación es estatal");
    await userEvent.click(
      within(detail).getByRole("button", {
        name: "Ayuda sobre comparación estatal de fuentes de homicidios",
      })
    );
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "no la diferencia específica del municipio"
    );
  });
});
