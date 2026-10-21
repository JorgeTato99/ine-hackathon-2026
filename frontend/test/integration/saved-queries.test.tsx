import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProviders } from "@/components/providers/app-providers";
import { SavedQueriesDialog } from "@/components/explorer/saved-queries-dialog";
import { savedQueriesKey } from "@/services/saved-query-store";
import { captureQuery, newSavedQuery, queryFile } from "@/utils/saved-queries";
import { datasetFixture } from "../fixtures/dataset";

const dataset = datasetFixture();
const capture = () => captureQuery(dataset, new URLSearchParams("municipio=01002"));
const restore = vi.fn();
function open() {
  return render(
    <AppProviders>
      <SavedQueriesDialog
        dataset={dataset}
        capture={capture}
        onRestore={restore}
        onClose={vi.fn()}
      />
    </AppProviders>
  );
}
beforeEach(() => {
  localStorage.clear();
  restore.mockReset();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());
describe("Gestor personal", () => {
  it("edita sólo texto personal y elimina tras confirmación", async () => {
    const user = userEvent.setup();
    open();
    await user.type(screen.getByLabelText(/^Nombre de la consulta/), "Mi lectura");
    await user.type(screen.getByLabelText("Nota personal (opcional)"), "<b>Texto personal</b>");
    await user.click(screen.getByRole("button", { name: "Guardar consulta actual" }));
    expect(screen.getByText("Nota personal: <b>Texto personal</b>")).toBeInTheDocument();
    const previous = JSON.parse(localStorage.getItem(savedQueriesKey)!).queries[0];
    await user.click(screen.getByRole("button", { name: "Editar Mi lectura" }));
    await user.clear(screen.getByLabelText(/^Nombre de la consulta/));
    await user.type(screen.getByLabelText(/^Nombre de la consulta/), "Otro nombre");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const changed = JSON.parse(localStorage.getItem(savedQueriesKey)!).queries[0];
    expect(changed).toMatchObject({
      ...previous,
      title: "Otro nombre",
      updatedAt: changed.updatedAt,
    });
    await user.click(screen.getByRole("button", { name: "Eliminar Otro nombre" }));
    expect(localStorage.getItem(savedQueriesKey)).toContain("Otro nombre");
    await user.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
    expect(JSON.parse(localStorage.getItem(savedQueriesKey)!).queries).toHaveLength(0);
  });
  it("no anuncia éxito con cuota agotada y conserva el borrador", async () => {
    const user = userEvent.setup();
    open();
    await user.type(screen.getByLabelText(/^Nombre de la consulta/), "Sin espacio");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    await user.click(screen.getByRole("button", { name: "Guardar consulta actual" }));
    expect(screen.getByLabelText(/^Nombre de la consulta/)).toHaveValue("Sin espacio");
    expect(screen.queryByText("Consulta guardada en este navegador.")).not.toBeInTheDocument();
    expect(localStorage.getItem(savedQueriesKey)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Exportar consulta actual" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
  it("conserva corrupción hasta reinicio explícito y requiere aceptar importación", async () => {
    const user = userEvent.setup();
    localStorage.setItem(savedQueriesKey, "raw imposible");
    open();
    expect(screen.getByRole("button", { name: "Guardar consulta actual" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Reiniciar consultas" }));
    expect(localStorage.getItem(savedQueriesKey)).toBe("raw imposible");
    await user.click(screen.getByRole("button", { name: "Confirmar reinicio" }));
    const source = newSavedQuery(dataset, capture(), "De archivo", "");
    fireEvent.change(screen.getByLabelText("Archivo de consultas"), {
      target: {
        files: [
          new File([JSON.stringify(queryFile([source]))], "consultas.json", {
            type: "application/json",
          }),
        ],
      },
    });
    await screen.findByRole("button", { name: "Agregar copias" });
    expect(localStorage.getItem(savedQueriesKey)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Agregar copias" }));
    const entries = JSON.parse(localStorage.getItem(savedQueriesKey)!).queries;
    expect(entries).toHaveLength(1);
    expect(entries[0].id).not.toBe(source.id);
    fireEvent.change(screen.getByLabelText("Archivo de consultas"), {
      target: { files: [new File(['{"format":"bad"}'], "bad.json")] },
    });
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Agregar copias" })).not.toBeInTheDocument()
    );
    expect(JSON.parse(localStorage.getItem(savedQueriesKey)!).queries).toEqual(entries);
  });
  it("advierte otro corte antes de abrir y refresca cambios de otra pestaña", async () => {
    const user = userEvent.setup();
    const source = {
      ...newSavedQuery(dataset, capture(), "Antigua", ""),
      resultVersion: "anterior",
    };
    localStorage.setItem(savedQueriesKey, JSON.stringify(queryFile([source])));
    open();
    await user.click(screen.getByRole("button", { name: "Abrir Antigua" }));
    expect(restore).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancelar apertura" }));
    expect(restore).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Abrir Antigua" }));
    await user.click(screen.getByRole("button", { name: "Abrir con datos actuales" }));
    expect(restore).toHaveBeenCalledWith(expect.objectContaining({ municipio: "01002" }));
    localStorage.setItem(savedQueriesKey, JSON.stringify(queryFile([])));
    fireEvent(window, new StorageEvent("storage", { key: savedQueriesKey }));
    expect(within(screen.getByRole("dialog")).queryByText("Antigua")).not.toBeInTheDocument();
  });
  it("protege borradores y un reinicio pendiente cuando otra pestaña actualiza", async () => {
    const user = userEvent.setup();
    localStorage.setItem(savedQueriesKey, "ilegible");
    open();
    await user.click(screen.getByRole("button", { name: "Reiniciar consultas" }));
    localStorage.setItem(savedQueriesKey, JSON.stringify(queryFile([])));
    fireEvent(window, new StorageEvent("storage", { key: savedQueriesKey }));
    expect(screen.queryByRole("button", { name: "Confirmar reinicio" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Nombre de la consulta/), "Borrador");
    await user.click(screen.getByRole("button", { name: "Cerrar consultas" }));
    expect(screen.getByRole("button", { name: "Seguir editando" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(screen.getByLabelText(/^Nombre de la consulta/)).toHaveValue("Borrador");
    expect(screen.getByLabelText(/^Nombre de la consulta/)).toHaveFocus();
  });
  it("informa límite sin bloquear almacenamiento y permite exportar nombre vacío", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      savedQueriesKey,
      JSON.stringify(
        queryFile(
          Array.from({ length: 50 }, (_, index) =>
            newSavedQuery(dataset, capture(), `Consulta ${index}`, "")
          )
        )
      )
    );
    open();
    await user.type(screen.getByLabelText(/^Nombre de la consulta/), "Más");
    await user.click(screen.getByRole("button", { name: "Guardar consulta actual" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Límite de 50 consultas");
    expect(screen.getByRole("button", { name: "Importar consultas" })).toBeEnabled();
    expect(JSON.parse(localStorage.getItem(savedQueriesKey)!).queries).toHaveLength(50);
    await user.clear(screen.getByLabelText(/^Nombre de la consulta/));
    await user.type(screen.getByLabelText(/^Nombre de la consulta/), "   ");
    await user.click(screen.getByRole("button", { name: "Exportar consulta actual" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
