import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import HomePage from "@/app/page";
import MethodologyPage from "@/app/metodologia/page";
import DataPage from "@/app/datos/page";
import { modeStorageKey } from "@/theme/settings";
import { datasetFixture } from "../fixtures/dataset";
import { server } from "../test-utils/msw/server";
import { decodeDataset } from "@/utils/dataset";

const realResults = decodeDataset(JSON.parse(readFileSync("public/data/dataset.json", "utf8")));

const environment = vi.hoisted(() => ({
  mobile: false,
  pathname: "/",
  deferNavigation: false,
  publishedSearch: "",
}));
vi.mock("@mui/material/useMediaQuery", () => ({ default: () => environment.mobile }));
vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  const subscribe = (listener: () => void) => {
    const publish = () => {
      environment.publishedSearch = window.location.search;
      listener();
    };
    window.addEventListener("popstate", publish);
    return () => window.removeEventListener("popstate", publish);
  };
  return {
    usePathname: () => environment.pathname,
    useSearchParams: () =>
      new URLSearchParams(
        useSyncExternalStore(
          subscribe,
          () => environment.publishedSearch,
          () => ""
        )
      ),
  };
});
vi.mock("next/dynamic", () => ({
  default: () =>
    function MapFixture({ onSelect }: { onSelect: (code: string) => void }) {
      return (
        <div>
          <button onClick={() => onSelect("01001")}>Seleccionar desde mapa de prueba</button>
        </div>
      );
    },
}));

beforeEach(() => {
  environment.mobile = false;
  environment.pathname = "/";
  environment.deferNavigation = false;
  environment.publishedSearch = "";
  window.history.replaceState(null, "", "/");
  const replace = window.history.replaceState.bind(window.history);
  vi.spyOn(window.history, "replaceState").mockImplementation((...args) => {
    replace(...args);
    if (!environment.deferNavigation) {
      environment.publishedSearch = window.location.search;
      window.dispatchEvent(new Event("popstate"));
    }
  });
  server.use(http.get("*/data/dataset.json", () => HttpResponse.json(datasetFixture())));
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

function openExplorer() {
  return render(
    <AppProviders>
      <AppShell>
        <HomePage />
      </AppShell>
    </AppProviders>
  );
}
async function choose(label: string, text: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: text }));
}

describe("Recorrido de consulta con muestra identificada", () => {
  it("mantiene la guía bajo demanda y devuelve el foco al cerrar la ayuda", async () => {
    const user = userEvent.setup();
    openExplorer();
    const help = screen.getByRole("button", { name: "Ayuda: cómo explorar el territorio" });
    expect(screen.queryByRole("list", { name: "Recorrido de consulta" })).not.toBeInTheDocument();
    await user.click(help);
    expect(
      within(screen.getByRole("dialog")).getByRole("list", { name: "Recorrido de consulta" })
    ).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(help).toHaveFocus();
    await user.click(help);
    await user.click(screen.getByRole("button", { name: "Cerrar ayuda" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("presenta marca, navegación, límites del pronóstico y conserva preferencia de tema", async () => {
    const user = userEvent.setup();
    openExplorer();
    expect(
      await screen.findByRole("heading", { name: "El territorio, en contexto" })
    ).toBeVisible();
    expect(await screen.findByRole("button", { name: /Consultar dos escenarios/ })).toBeEnabled();
    expect(screen.getByRole("link", { name: /Traza Cívica/ })).toHaveAttribute("href", "/");
    expect(screen.getByText(/Son estimaciones con supuestos/)).toBeVisible();
    await user.click(await screen.findByRole("button", { name: "Activar tema oscuro" }));
    expect(localStorage.getItem(modeStorageKey)).toBe("dark");
    await user.click(screen.getByRole("button", { name: "Activar tema claro" }));
    expect(localStorage.getItem(modeStorageKey)).toBe("light");
  });
  it("busca por clave, sincroniza la ficha y descarga la vista filtrada", async () => {
    const user = userEvent.setup();
    openExplorer();
    const search = await screen.findByRole("searchbox", { name: "Buscar municipio o clave" });
    await user.type(search, "01001");
    await user.click(screen.getByRole("button", { name: "Tabla" }));
    await user.click(await screen.findByRole("button", { name: "Aguascalientes" }));
    expect(await screen.findByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
    expect(window.location.search).toContain("municipio=01001");
    await user.click(screen.getByRole("button", { name: "Descargar tabla (CSV)" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Descargar ficha JSON" }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    expect(search).toHaveValue("");
    expect(window.location.search).not.toContain("municipio");
  });
  it("conserva cambios consecutivos aunque el router todavía no haya renderizado la URL", async () => {
    openExplorer();
    const search = await screen.findByRole("searchbox", { name: "Buscar municipio o clave" });
    environment.deferNavigation = true;
    fireEvent.change(search, { target: { value: "01001" } });
    fireEvent.click(screen.getByRole("button", { name: "Tabla" }));
    const params = new URLSearchParams(window.location.search);
    expect(params.get("buscar")).toBe("01001");
    expect(params.get("vista")).toBe("tabla");
    environment.deferNavigation = false;
    act(() => window.dispatchEvent(new Event("popstate")));
    await waitFor(() => expect(search).toHaveValue("01001"));
    expect(
      await screen.findByRole("table", { name: "Resultados municipales de muestra" })
    ).toBeVisible();
  });
  it("conserva cada tecla del buscador aunque Next difiera la publicación de parámetros", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?vista=tabla&entidad=01&municipio=01001&pagina=2");
    openExplorer();
    const search = await screen.findByRole("searchbox", { name: "Buscar municipio o clave" });
    environment.deferNavigation = true;
    await user.type(search, "01001");
    expect(search).toHaveValue("01001");
    const params = new URLSearchParams(window.location.search);
    expect(params.get("buscar")).toBe("01001");
    expect(params.get("entidad")).toBe("01");
    expect(params.has("municipio")).toBe(false);
    expect(params.has("pagina")).toBe(false);
  });
  it("filtra por entidad/riesgo y conserva la distinción de ausencia", async () => {
    const user = userEvent.setup();
    openExplorer();
    await screen.findByRole("button", { name: /Consultar dos escenarios/ });
    await choose("Estado", "Michoacán");
    await user.click(screen.getByRole("button", { name: "Tabla" }));
    await user.click(await screen.findByRole("button", { name: "Parácuaro" }));
    expect(await screen.findByText(/Incidencia de 2021/)).toBeVisible();
    await choose("Riesgo ilustrativo", "Bajo");
    expect(await screen.findByText(/No hay municipios con estos filtros/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    await choose("Riesgo ilustrativo", "Sin estimación");
    await user.click(await screen.findByRole("button", { name: "Sin registro" }));
    expect(screen.getByText(/Sin registro en la muestra/)).toBeVisible();
  });
  it("presenta A/B sin atribución y permite cambiar ambos escenarios", async () => {
    const user = userEvent.setup();
    openExplorer();
    await user.click(
      await screen.findByRole("button", { name: "Seleccionar desde mapa de prueba" })
    );
    await user.click(screen.getByRole("button", { name: /Consultar dos escenarios/ }));
    expect(await screen.findByText("Comparabilidad científica pendiente.")).toBeVisible();
    await choose("Escenario B", "Nacional alto · intervención ninguna");
    expect(await screen.findByText(/También cambia el contexto nacional/)).toBeVisible();
    await choose("Escenario A", "Nacional medio · intervención alta");
    expect(screen.getByText("Segunda lectura · ejemplo")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Descargar ficha JSON" }));
    await user.click(screen.getByRole("button", { name: "✓ Lectura A/B activa" }));
    expect(screen.queryByText("Segunda lectura · ejemplo")).not.toBeInTheDocument();
  });
  it("normaliza parámetros desconocidos sin perder el recorrido", async () => {
    window.history.replaceState(
      null,
      "",
      "/?entidad=99&riesgo=desconocido&municipio=99999&escenario=inexistente&segundo=no"
    );
    openExplorer();
    await screen.findByRole("button", { name: /Consultar dos escenarios/ });
    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveTextContent("Todos los estados");
    expect(screen.getByRole("combobox", { name: "Riesgo ilustrativo" })).toHaveTextContent(
      "Todos los niveles"
    );
    expect(screen.getByRole("heading", { name: "Consulta un municipio" })).toBeVisible();
  });
  it("abre y cierra ficha móvil conservando selección", async () => {
    environment.mobile = true;
    const user = userEvent.setup();
    openExplorer();
    await user.click(
      await screen.findByRole("button", { name: "Seleccionar desde mapa de prueba" })
    );
    expect(await screen.findByRole("button", { name: "Cerrar ficha" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cerrar ficha" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Cerrar ficha" })).not.toBeInTheDocument()
    );
    expect(window.location.search).toContain("municipio=01001");
    await user.click(screen.getByRole("button", { name: "Ver ficha" }));
    expect(await screen.findByRole("button", { name: "Cerrar ficha" })).toBeVisible();
  });
  it("informa el fallo del corte y permite reintentar", async () => {
    server.use(http.get("*/data/dataset.json", () => new HttpResponse(null, { status: 503 })));
    const user = userEvent.setup();
    openExplorer();
    const retry = await screen.findByRole("button", { name: "Reintentar" }, { timeout: 5000 });
    expect(screen.getByText(/No pudimos cargar los resultados/)).toBeVisible();
    server.use(http.get("*/data/dataset.json", () => HttpResponse.json(datasetFixture())));
    await user.click(retry);
    expect(await screen.findByRole("button", { name: /Consultar dos escenarios/ })).toBeEnabled();
  });
  it("consulta un rango nominal de cero y limpia filtros avanzados", async () => {
    const user = userEvent.setup();
    openExplorer();
    await user.click(await screen.findByRole("button", { name: "Más filtros" }));
    await choose("Datos de elecciones anteriores", "Faltan datos en alguna elección");
    await user.type(screen.getByLabelText("Lista electoral 2024 · mínimo"), "0");
    await user.type(screen.getByLabelText("Lista electoral 2024 · máximo"), "0");
    await user.click(screen.getByRole("button", { name: "Ver resultados" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Tabla" }));
    expect(await screen.findByRole("button", { name: "Asientos" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Parácuaro" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    expect(await screen.findByRole("button", { name: "Aguascalientes" })).toBeVisible();
  });
  it("explica un rango invertido y permite recuperarse sin perder el control", async () => {
    const user = userEvent.setup();
    openExplorer();
    await user.click(await screen.findByRole("button", { name: "Más filtros" }));
    await user.type(screen.getByLabelText("Lista electoral 2024 · mínimo"), "100");
    await user.type(screen.getByLabelText("Lista electoral 2024 · máximo"), "10");
    expect(within(screen.getByRole("dialog")).getByText(/no puede superar/)).toBeVisible();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Restablecer" })
    );
    expect(
      within(screen.getByRole("dialog")).queryByText(/no puede superar/)
    ).not.toBeInTheDocument();
    await choose("Ubicación en el mapa", "Sin límites disponibles");
    await user.click(screen.getByRole("button", { name: "Ver resultados" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Tabla" }));
    expect(await screen.findByRole("button", { name: "Sin registro" })).toBeVisible();
  });
  it("expone consulta y escenarios en paneles móviles accesibles", async () => {
    environment.mobile = true;
    const user = userEvent.setup();
    openExplorer();
    await user.click(await screen.findByRole("button", { name: "Filtros" }));
    await choose("Estado", "Michoacán");
    await user.click(screen.getByRole("button", { name: "Ver resultados" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Escenarios" }));
    await user.click(screen.getByRole("button", { name: /Consultar dos escenarios/ }));
    await choose("Escenario B", "Nacional alto · intervención ninguna");
    expect(
      within(screen.getByRole("dialog")).getByText(/También cambia el contexto nacional/)
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Volver al mapa" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("ordena la tabla en ambos sentidos sin presentar ausencias como ceros", async () => {
    const user = userEvent.setup();
    openExplorer();
    await user.click(await screen.findByRole("button", { name: "Tabla" }));
    const sorter = screen.getByRole("button", { name: "Ordenar por Participación · ejemplo" });
    await user.click(sorter);
    const table = screen.getByRole("table", { name: "Resultados municipales de muestra" });
    const first = () => within(table).getAllByRole("row")[1]!;
    const last = () => within(table).getAllByRole("row").at(-1)!;
    expect(within(first()).getByRole("button", { name: "Asientos" })).toBeVisible();
    await user.click(sorter);
    expect(within(first()).getByRole("button", { name: "Aguascalientes" })).toBeVisible();
    expect(within(last()).getByRole("button", { name: "Sin registro" })).toBeVisible();
    expect(window.location.search).toContain("direccion=desc");
    expect(screen.getByRole("columnheader", { name: /Participación/ })).toHaveAttribute(
      "aria-sort",
      "descending"
    );
  });
  it("aplica cada clic de ordenación aunque Next todavía no publique la URL", async () => {
    const user = userEvent.setup();
    openExplorer();
    await user.click(await screen.findByRole("button", { name: "Tabla" }));
    const sorter = screen.getByRole("button", { name: "Ordenar por Participación · ejemplo" });
    environment.deferNavigation = true;
    const writesBefore = vi.mocked(window.history.replaceState).mock.calls.length;
    act(() => {
      fireEvent.click(sorter);
      fireEvent.click(sorter);
    });
    expect(vi.mocked(window.history.replaceState).mock.calls.length - writesBefore).toBe(2);
    expect(new URLSearchParams(window.location.search).get("direccion")).toBe("desc");
    fireEvent.click(sorter);
    expect(new URLSearchParams(window.location.search).get("direccion")).toBe("asc");
    const municipalitySorter = screen.getByRole("button", { name: "Ordenar por Municipio" });
    fireEvent.click(municipalitySorter);
    expect(new URLSearchParams(window.location.search).get("direccion")).toBe("asc");
    fireEvent.click(municipalitySorter);
    expect(new URLSearchParams(window.location.search).get("direccion")).toBe("desc");
    fireEvent.click(sorter);
    expect(new URLSearchParams(window.location.search).get("direccion")).toBe("asc");
    fireEvent.click(sorter);
    environment.deferNavigation = false;
    act(() => window.dispatchEvent(new Event("popstate")));
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /Participación/ })).toHaveAttribute(
        "aria-sort",
        "descending"
      )
    );
    const rows = within(
      screen.getByRole("table", { name: "Resultados municipales de muestra" })
    ).getAllByRole("row");
    expect(within(rows[1]!).getByRole("button", { name: "Aguascalientes" })).toBeVisible();
    expect(within(rows.at(-1)!).getByRole("button", { name: "Sin registro" })).toBeVisible();
  });
  it("conserva orden y búsqueda en ráfaga y aplica los resets de la consulta", async () => {
    window.history.replaceState(null, "", "/?vista=tabla&pagina=2&municipio=01001&entidad=01");
    openExplorer();
    const sorter = await screen.findByRole("button", {
      name: "Ordenar por Participación · ejemplo",
    });
    const search = screen.getByRole("searchbox", { name: "Buscar municipio o clave" });
    environment.deferNavigation = true;
    fireEvent.click(sorter);
    fireEvent.change(search, { target: { value: "01001" } });
    fireEvent.click(sorter);
    const params = new URLSearchParams(window.location.search);
    expect(params.get("buscar")).toBe("01001");
    expect(params.get("entidad")).toBe("01");
    expect(params.get("direccion")).toBe("desc");
    expect(params.has("pagina")).toBe(false);
    expect(params.has("municipio")).toBe(false);
    environment.deferNavigation = false;
    act(() => window.dispatchEvent(new Event("popstate")));
    await waitFor(() => expect(search).toHaveValue("01001"));
  });
  it.each([
    ["asc", "desc", "ascending", "descending"],
    ["desc", "asc", "descending", "ascending"],
  ])(
    "alterna contexto desde la columna efectiva heredada en %s",
    async (direction, next, initialAria, nextAria) => {
      server.use(http.get("*/data/dataset.json", () => HttpResponse.json(realResults)));
      window.history.replaceState(
        null,
        "",
        `/?vista=tabla&pestana=contexto&indicador=personas&orden=participacion&direccion=${direction}&entidad=01`
      );
      openExplorer();
      const sorter = await screen.findByRole("button", {
        name: "Ordenar por Municipio",
      });
      expect(screen.getByRole("columnheader", { name: "Municipio" })).toHaveAttribute(
        "aria-sort",
        initialAria
      );
      environment.deferNavigation = true;
      fireEvent.click(sorter);
      const params = new URLSearchParams(window.location.search);
      expect(params.get("orden")).toBe("municipio");
      expect(params.get("direccion")).toBe(next);
      expect(params.get("pestana")).toBe("contexto");
      expect(params.get("entidad")).toBe("01");
      environment.deferNavigation = false;
      act(() => window.dispatchEvent(new Event("popstate")));
      await waitFor(() =>
        expect(screen.getByRole("columnheader", { name: "Municipio" })).toHaveAttribute(
          "aria-sort",
          nextAria
        )
      );
    }
  );
  it("controla tamaño, siguiente/última página y reinicio por filtros", async () => {
    const d = datasetFixture();
    for (let i = 0; i < 36; i++) {
      const m = {
        ...d.municipalities[0]!,
        id: String(1003 + i).padStart(5, "0"),
        name: `Municipio ${i + 1}`,
      };
      d.municipalities.push(m);
    }
    server.use(http.get("*/data/dataset.json", () => HttpResponse.json(d)));
    const user = userEvent.setup();
    openExplorer();
    await user.click(await screen.findByRole("button", { name: "Tabla" }));
    await choose("Filas por página", "10");
    const table = screen.getByRole("table", { name: "Resultados municipales de muestra" });
    expect(within(table).getAllByRole("row")).toHaveLength(11);
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(window.location.search).toContain("pagina=2");
    await user.click(screen.getByRole("button", { name: "Última página" }));
    expect(window.location.search).toContain("pagina=4");
    await user.click(screen.getByRole("button", { name: "Primera página" }));
    expect(window.location.search).not.toContain("pagina=");
    await choose("Filas por página", "50");
    expect(within(table).getAllByRole("row")).toHaveLength(41);
    await user.type(screen.getByRole("searchbox", { name: "Buscar municipio o clave" }), "16064");
    await waitFor(() => expect(within(table).getAllByRole("row")).toHaveLength(2));
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
  });
  it("entra en modo mapa, pliega leyenda y restaura foco y fondo al salir", async () => {
    const user = userEvent.setup();
    openExplorer();
    const enter = await screen.findByRole("button", { name: "Entrar al modo mapa" });
    await waitFor(() => expect(enter).toBeEnabled());
    await user.click(enter);
    expect(screen.getByRole("heading", { name: "Modo mapa", level: 1 })).toBeVisible();
    expect(document.documentElement).toHaveAttribute("data-map-mode", "true");
    expect(document.querySelector('[data-app-chrome="header"]')).toHaveAttribute("inert");
    const legend = screen.getByRole("button", {
      name: "Riesgo de muestra: mostrar u ocultar leyenda",
    });
    await user.click(legend);
    expect(legend).toHaveAttribute("aria-expanded", "false");
    await user.click(legend);
    expect(legend).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Descargar tabla (CSV)" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Salir del modo mapa" }));
    expect(document.documentElement).not.toHaveAttribute("data-map-mode");
    expect(document.querySelector('[data-app-chrome="header"]')).not.toHaveAttribute("inert");
    await waitFor(() => expect(enter).toHaveFocus());
  });
  it("maneja filtros flotantes y Escape por capas sin abandonar accidentalmente el modo", async () => {
    const user = userEvent.setup();
    openExplorer();
    const enter = await screen.findByRole("button", { name: "Entrar al modo mapa" });
    await waitFor(() => expect(enter).toBeEnabled());
    await user.click(enter);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(screen.getByRole("combobox", { name: "Datos de elecciones anteriores" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(screen.getByRole("region", { name: "Filtros de consulta" })).toBeVisible();
    await user.type(screen.getByLabelText("Lista electoral 2024 · mínimo"), "5");
    await user.type(screen.getByLabelText("Lista electoral 2024 · máximo"), "4");
    expect(
      screen.getByText("Revisa el mínimo y máximo de la lista electoral en Filtros.")
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    await user.click(screen.getByRole("button", { name: "Ver resultados" }));
    expect(screen.queryByRole("region", { name: "Filtros de consulta" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Escenarios" }));
    await user.click(screen.getByRole("button", { name: /Consultar dos escenarios/ }));
    await choose("Escenario B", "Nacional alto · intervención ninguna");
    await user.click(await screen.findByRole("button", { name: "Plegar escenarios" }));
    await user.click(screen.getByRole("button", { name: "Escenarios" }));
    await user.click(screen.getByRole("button", { name: "Escenarios" }));
    expect(screen.queryByRole("region", { name: "Escenarios de muestra" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(document.documentElement).not.toHaveAttribute("data-map-mode");
  });
  it("abre ficha desde el mapa y conserva acceso al dato sin geometría", async () => {
    environment.mobile = true;
    const user = userEvent.setup();
    openExplorer();
    const enter = await screen.findByRole("button", { name: "Entrar al modo mapa" });
    await waitFor(() => expect(enter).toBeEnabled());
    await user.click(enter);
    await user.click(screen.getByRole("button", { name: "Seleccionar desde mapa de prueba" }));
    expect(screen.getByRole("heading", { name: "Aguascalientes", level: 2 })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Plegar ficha" }));
    await user.click(screen.getByRole("button", { name: /^Ver ficha ·/ }));
    const search = screen.getByRole("searchbox", { name: "Buscar municipio o clave" });
    await user.type(search, "01099");
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Plegar ficha" })).not.toBeInTheDocument()
    );
    expect(
      screen.getByText("No hay límites disponibles para mostrar este municipio en el mapa.")
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Ver ficha: Sin registro" }));
    expect(screen.getByText(/Sin registro en la muestra/)).toBeVisible();
    await user.keyboard("{Escape}");
    expect(document.documentElement).toHaveAttribute("data-map-mode", "true");
    await user.click(screen.getByRole("button", { name: "Ver resultados en tabla" }));
    expect(
      await screen.findByRole("table", { name: "Resultados municipales de muestra" })
    ).toBeVisible();
  });
  it("restaura la tabla con orden y tamaño después del modo mapa", async () => {
    window.history.replaceState(
      null,
      "",
      "/?vista=tabla&filas=10&orden=participacion&direccion=desc"
    );
    const user = userEvent.setup();
    openExplorer();
    await screen.findByRole("table", { name: "Resultados municipales de muestra" });
    await user.click(screen.getByRole("button", { name: "Entrar al modo mapa" }));
    await user.click(screen.getByRole("button", { name: "Salir del modo mapa" }));
    expect(screen.getByRole("table", { name: "Resultados municipales de muestra" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: /Participación/ })).toHaveAttribute(
      "aria-sort",
      "descending"
    );
    expect(screen.getByRole("combobox", { name: "Filas por página" })).toHaveTextContent("10");
  });
  it("recupera una ficha compartida directamente en modo mapa", async () => {
    window.history.replaceState(null, "", "/?modo=mapa&buscar=16064&municipio=16064");
    const user = userEvent.setup();
    openExplorer();
    expect(await screen.findByRole("heading", { name: "Parácuaro", level: 2 })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Plegar ficha" }));
    await user.click(screen.getByRole("button", { name: /^Ver ficha ·/ }));
    await user.click(screen.getByRole("button", { name: "Plegar ficha" }));
    await user.keyboard("{Escape}");
    expect(document.documentElement).not.toHaveAttribute("data-map-mode");
    expect(window.location.search).toContain("municipio=16064");
  });
});

describe("Páginas de fuentes y alcance", () => {
  it("ofrece descargas reales y explica las incidencias", () => {
    render(
      <AppProviders>
        <DataPage />
      </AppProviders>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Descarga los datos y conoce sus fuentes"
    );
    expect(screen.getByText("Datos y estimaciones")).toBeVisible();
    expect(screen.queryByText("Muestra de interfaz")).not.toBeInTheDocument();
    const downloads = screen.getAllByRole("link", { name: /Descargar/ });
    expect(downloads).toHaveLength(6);
    expect(
      downloads.some((link) => link.getAttribute("href") === "/data/resultados-1.3/municipios.gpkg")
    ).toBe(true);
    expect(screen.getByText(/Villa de Pozos \(24059\)/)).toBeVisible();
  });
  it("presenta el modelo recibido y conserva límites de incertidumbre y causalidad", () => {
    render(
      <AppProviders>
        <MethodologyPage />
      </AppProviders>
    );
    expect(
      screen.getByRole("heading", { name: "Cómo comparar sin y con intervención" })
    ).toBeVisible();
    expect(
      screen.getByText(/La comparación entre municipios es más confiable que la cifra exacta/)
    ).toBeVisible();
    expect(
      within(screen.getByRole("alert")).getByText(
        /Una estimación no es una certeza ni un efecto comprobado/
      )
    ).toBeVisible();
  });
});

describe("Integración de resultados científicos reales", () => {
  beforeEach(() => {
    server.use(http.get("*/data/dataset.json", () => HttpResponse.json(realResults)));
  });
  it("conserva el nivel nacional al cambiar intervención y comparar", async () => {
    const user = userEvent.setup();
    openExplorer();
    await screen.findByRole("tab", { name: "Pronóstico 2027" });
    await user.click(screen.getByRole("button", { name: "Ayuda: cómo explorar el territorio" }));
    expect(
      within(screen.getByRole("dialog")).getByText(/2027 es una estimación según el supuesto/)
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cerrar ayuda" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(
      screen.getByRole("combobox", { name: "Participación supuesta del país" })
    ).toHaveTextContent("Participación media");
    await choose("Intervención (supuesto)", "Con intervención supuesta");
    const cards = within(
      screen.getByRole("region", { name: "Resumen de los municipios seleccionados" })
    );
    expect(cards.getByText("505,007", { exact: true })).toBeVisible();
    expect(cards.getByText("88", { exact: true })).toBeVisible();
    await choose("Participación supuesta del país", "Baja participación · 44.1%");
    expect(cards.getByText("90", { exact: true })).toBeVisible();
    const comparison = screen.getByRole("button", { name: "Comparar sin/con intervención" });
    await user.click(comparison);
    expect(comparison).toHaveAttribute("aria-pressed", "true");
    expect(new URLSearchParams(window.location.search).get("segundo")).toBe("nac-bajo_int-ninguna");
    await user.click(comparison);
    expect(comparison).toHaveAttribute("aria-pressed", "false");
  });
  it("ofrece los siete indicadores y una tabla del indicador seleccionado", async () => {
    const user = userEvent.setup();
    openExplorer();
    await user.click(await screen.findByRole("tab", { name: "Datos del territorio" }));
    for (const view of [
      "Participación por debajo del país",
      "Participación de municipios vecinos",
      "Falta de casillas en elecciones anteriores",
      "Participación en elecciones anteriores",
    ]) {
      await choose("Tema del mapa", view);
      expect(screen.getByRole("combobox", { name: "Tema del mapa" })).toHaveTextContent(view);
    }
    await choose("Tema del mapa", "Personas y participación");
    await user.click(screen.getByRole("button", { name: "Tabla" }));
    const table = screen.getByRole("table", { name: "Resultados municipales" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(4);
    await user.click(within(table).getByRole("button", { name: /Ordenar por Personas/ }));
    await user.click(screen.getByRole("button", { name: "Descargar tabla (CSV)" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    await user.type(screen.getByRole("searchbox", { name: "Buscar municipio o clave" }), "01001");
    await user.click(await screen.findByRole("button", { name: "Aguascalientes" }));
    expect(
      screen.getByText(
        "Este dato describe el municipio; se consulta por separado de la estimación de 2027."
      )
    ).toBeVisible();
  });
  it("permite cambiar grupos, capas de seguridad y año sin mezclar pronóstico", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?pestana=contexto&indicador=personas");
    openExplorer();
    await screen.findByRole("combobox", { name: "Grupo de personas" });
    await choose("Grupo de personas", "21 a 29 años: no votaron en 2024");
    await choose("Grupo de personas", "18 a 19 años en 2027 (estimación)");
    expect(screen.getByText("4,363,455", { exact: true })).toBeVisible();
    await choose("Grupo de personas", "Sin credencial en 2027 (supuesto)");
    expect(screen.getByText("245", { exact: true })).toBeVisible();
    await choose("Tema del mapa", "Seguridad en el municipio");
    await choose("Indicador de seguridad", "Quién ejerce la seguridad");
    await choose("Indicador de seguridad", "Policía municipal");
    await choose("Tema del mapa", "Participación en elecciones anteriores");
    await choose("Año de la elección", "2021");
    expect(window.location.search).toContain("anio=2021");
    await user.click(screen.getByRole("tab", { name: "Pronóstico 2027" }));
    expect(screen.queryByRole("combobox", { name: "Año de la elección" })).not.toBeInTheDocument();
  });
  it("comparte filtros adicionales entre pestañas y permite retirarlos por nombre", async () => {
    const user = userEvent.setup();
    openExplorer();
    await user.click(await screen.findByRole("button", { name: "Más filtros" }));
    await choose("Tamaño de la lista electoral", "Menos de 5 mil");
    await choose("Elección municipal en 2027", "No elige ese día");
    await choose("Usos y costumbres", "Sí");
    await choose("Falta de casillas antes", "Con antecedente");
    await user.click(screen.getByRole("button", { name: "Ver resultados" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const chip = screen.getByRole("button", { name: "Quitar filtro: Usos y costumbres: Sí" });
    expect(chip).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Datos del territorio" }));
    expect(window.location.search).toContain("costumbres=si");
    chip.focus();
    await user.keyboard("{Delete}");
    expect(window.location.search).not.toContain("costumbres=si");
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    await user.click(screen.getByRole("tab", { name: "Pronóstico 2027" }));
    await choose("Color sin intervención", "Rojo");
    expect(
      screen.getByRole("button", { name: "Quitar filtro: Color sin intervención: Rojo" })
    ).toBeVisible();
  });
  it("explica incertidumbre y supuestos en la ficha y corrige una pareja nacional ajena en URL", async () => {
    const red = realResults.municipalities.find(
      (item) => item.baseRisk === "alto" && Number(item.indicators?.probabilidad_rojo) >= 0.8
    )!;
    window.history.replaceState(
      null,
      "",
      `/?municipio=${red.id}&comparar=1&segundo=nac-alto_int-dirigida_rojos`
    );
    const user = userEvent.setup();
    openExplorer();
    await screen.findByRole("heading", { name: red.name, level: 2 });
    expect(screen.getByText(/Probable, no seguro/)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Cómo se calcula la intervención supuesta" })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Comparación sin/con intervención" })).toBeVisible();
    await choose("Intervención (supuesto)", "Con intervención supuesta");
    expect(screen.getByText(/No muestra votos conseguidos por una campaña/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Descargar ficha (JSON)" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
  it("mantiene sin casilla e historia incompleta como avisos y Villa de Pozos como ausencia", async () => {
    environment.mobile = true;
    window.history.replaceState(null, "", "/?modo=mapa&municipio=07030");
    const user = userEvent.setup();
    openExplorer();
    await screen.findByRole("heading", { name: "Chicomuselo", level: 2 });
    expect(screen.getByText("Sin casilla: no se pudo votar")).toBeVisible();
    expect(screen.getByText(/Falta de casillas antes:/)).toBeVisible();
    const incomplete = realResults.municipalities.find(
      (item) => item.indicators?.historia_completa === false
    )!;
    act(() => window.history.replaceState(null, "", `/?modo=mapa&municipio=${incomplete.id}`));
    expect(await screen.findByText(/Faltan datos de alguna elección./)).toBeVisible();
    act(() => window.history.replaceState(null, "", "/?modo=mapa&municipio=24059"));
    expect(await screen.findByText(/Sin datos electorales en esta entrega/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Descargar ficha (JSON)" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
  it("configura indicadores y pronóstico en el panel compacto del modo mapa", async () => {
    environment.mobile = true;
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?modo=mapa&municipio=01001");
    openExplorer();
    await user.click(await screen.findByRole("button", { name: "Plegar ficha" }));
    await user.click(screen.getByRole("button", { name: "Qué ver: datos y escenarios" }));
    await user.click(screen.getByRole("button", { name: "Datos del territorio" }));
    await choose("Tema del mapa", "Seguridad en el municipio");
    await user.click(screen.getByRole("button", { name: "Pronóstico" }));
    expect(screen.getByRole("combobox", { name: "Participación supuesta del país" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Qué ver: datos y escenarios" }));
    await user.click(screen.getByRole("button", { name: "Ver resultados en tabla" }));
    expect(await screen.findByRole("table", { name: "Resultados municipales" })).toBeVisible();
  });
});
