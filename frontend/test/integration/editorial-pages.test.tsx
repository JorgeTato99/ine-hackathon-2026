import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import HomePage from "@/app/page";
import MethodologyPage from "@/app/metodologia/page";
import DataPage from "@/app/datos/page";
import { DataStatus } from "@/components/ui/data-status";
import { NotePanel } from "@/components/ui/note-panel";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Surface } from "@/components/ui/surface";

const environment = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => environment.pathname,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/explorer/explorer", () => ({
  Explorer: () => <p>Explorador de prueba</p>,
  WorkspaceLoading: () => <p>Cargando</p>,
}));
beforeEach(() => {
  environment.pathname = "/";
  window.history.replaceState(null, "", "/");
});
describe("páginas editoriales y marco del producto", () => {
  it("el marco conserva navegación, tema, fuentes y retorno al contenido", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <AppShell>
          <HomePage />
        </AppShell>
      </AppProviders>
    );
    expect(screen.getByText("Explorador de prueba")).toBeVisible();
    expect(
      within(screen.getByRole("navigation", { name: "Principal" })).getByRole("link", {
        name: "Explorar",
      })
    ).toHaveAttribute("aria-current", "page");
    await user.click(await screen.findByRole("button", { name: "Activar tema oscuro" }));
    expect(await screen.findByRole("button", { name: "Activar tema claro" })).toBeVisible();
    await user.click(screen.getByRole("link", { name: "Volver al contenido" }));
    expect(screen.getByRole("link", { name: "Volver al contenido" })).toHaveAttribute(
      "href",
      "#main-content"
    );
    expect(screen.getByRole("contentinfo")).toHaveTextContent("resultados-1.6");
  });
  it("metodología presenta seis capítulos coherentes y las advertencias del corte", async () => {
    environment.pathname = "/metodologia/";
    render(
      <AppProviders>
        <AppShell>
          <MethodologyPage />
        </AppShell>
      </AppProviders>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Cómo leer los resultados");
    expect(
      screen.getByRole("navigation", { name: "En esta página" }).querySelectorAll("a")
    ).toHaveLength(6);
    expect(screen.getByRole("main")).toHaveTextContent("51.4");
    expect(screen.getByRole("main")).toHaveTextContent("no son causas probadas");
    expect(screen.getByRole("main")).toHaveTextContent(
      "toda la generación que tenía entre 18 y 20 años en 2024, haya votado o no"
    );
    await userEvent.click(screen.getByText("Modelo y validación: detalles técnicos"));
    expect(screen.getByText(/Delta con guardia \(D33\): desviación/)).toBeVisible();
  });
  it("datos enlaza solo recursos vigentes, compara metadatos y conserva texto sin siglas", async () => {
    environment.pathname = "/datos/";
    render(
      <AppProviders>
        <AppShell>
          <DataPage />
        </AppShell>
      </AppProviders>
    );
    expect(screen.getAllByRole("link", { name: /^Descargar / })).toHaveLength(11);
    expect(screen.getByRole("main")).toHaveTextContent("Cinco escenarios");
    expect(
      screen.getByRole("link", { name: "Descargar ZIP: Mapa y base de datos completos" })
    ).toHaveAttribute("href", "/data/resultados-1.6/mapa-escenarios.zip");
    await userEvent.click(screen.getByRole("button", { name: "Reglas, cobertura y procedencia" }));
    expect(screen.getByRole("main")).toHaveTextContent("participacion_nacional_historica");
  });
  it("los estados y avisos mantienen su significado independiente del color", () => {
    render(
      <AppProviders>
        <Surface tone="paper">
          <DataStatus status="observed" />
          <DataStatus status="modeled" />
          <RiskBadge risk="alto" />
          <RiskBadge risk="medio" />
          <RiskBadge risk="bajo" />
          <RiskBadge risk="sin_estimacion" />
          <NotePanel title="Aviso de lectura" tone="info">
            Dato sin causa individual.
          </NotePanel>
        </Surface>
      </AppProviders>
    );
    expect(screen.getByText("Aviso de lectura")).toBeVisible();
    expect(screen.getByText("Alto")).toBeVisible();
    expect(screen.getByText("Sin estimación")).toBeVisible();
  });
});
