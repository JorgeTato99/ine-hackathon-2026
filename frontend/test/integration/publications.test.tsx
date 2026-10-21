import type { ComponentProps } from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublicationComparison } from "@/components/editorial/publication-comparison";
import { AppProviders } from "@/components/providers/app-providers";

type ComparisonData = ComponentProps<typeof PublicationComparison>["data"];
const source: ComparisonData = JSON.parse(
  readFileSync("public/data/publicaciones/resultados-1.2__resultados-1.3.json", "utf8")
);
function open(data: ComparisonData) {
  return render(
    <AppProviders>
      <PublicationComparison
        data={data}
        currentVersion="resultados-1.3"
        downloadHref="/data/publicaciones/resultados-1.2__resultados-1.3.json"
        fileInfo={{ bytes: 1, sha256: "a".repeat(64) }}
      />
    </AppProviders>
  );
}
describe("Publicaciones: casos no presentes en el corte real", () => {
  it("encuentra escenario por texto y anuncia el singular sin cambiar datos", async () => {
    const user = userEvent.setup();
    const data = structuredClone(source);
    const change = {
      ...data.tables[0]!.changes[0]!,
      scenario: "nac-medio_int-ninguna",
      column: "part_pred",
      kind: "data",
      before: "0.5",
      after: "0.6",
      unitBefore: "proporción",
      unitAfter: "proporción",
    };
    data.tables[0]!.changes = [];
    data.tables[1]!.changes = [change];
    data.summary.cells = 1;
    data.summary.municipalities = 1;
    data.after.files["escenarios_2027.csv"]!.sha256 = "f".repeat(64);
    open(data);
    await user.click(screen.getByRole("button", { name: "Ver celdas modificadas (1)" }));
    await user.type(screen.getByRole("textbox", { name: "Buscar en los cambios" }), "nac-medio");
    expect(screen.getByRole("status")).toHaveTextContent("1 celda coincide con tu búsqueda");
    expect(screen.getByText("1 celda")).toBeInTheDocument();
    expect(screen.getByText("1 municipio")).toBeInTheDocument();
    expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(1);
  });
  it("advierte cobertura incompleta y tipos desconocidos antes de abrir detalles", async () => {
    const user = userEvent.setup();
    const data = structuredClone(source);
    data.coverageIncomplete = true;
    data.scenarioCoverage.after[0]!.missing = ["01001"];
    data.scenarioCoverage.after[0]!.present -= 1;
    data.tables[0]!.unclassifiedColumns = ["campo_nuevo"];
    open(data);
    expect(screen.getByText(/Faltan filas para algunos municipios/)).toBeInTheDocument();
    expect(screen.getByText(/Hay columnas con tipo por confirmar/)).toHaveTextContent(
      "campo_nuevo"
    );
    await user.click(screen.getByRole("button", { name: "Reglas, cobertura y procedencia" }));
    expect(screen.getByText(/faltan 1. Las claves están en el JSON/)).toBeInTheDocument();
  });
});
