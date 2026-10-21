import { describe, expect, it } from "vitest";
import { datasetFixture } from "../fixtures/dataset";
import { boundedPage, orderMunicipalities, readTableState } from "@/utils/explorer-table";
import { selectionCsv } from "@/utils/downloads";

describe("Orden y páginas de la consulta", () => {
  it("normaliza URL desconocida y conserva parámetros de consulta independientes", () => {
    expect(readTableState(new URLSearchParams())).toEqual({
      column: "municipio",
      direction: "asc",
      page: 0,
      pageSize: 25,
    });
    expect(
      readTableState(new URLSearchParams("orden=no&direccion=otro&filas=999&pagina=-2"))
    ).toEqual({ column: "municipio", direction: "asc", page: 0, pageSize: 25 });
    expect(
      readTableState(
        new URLSearchParams("orden=cvegeo&direccion=desc&filas=100&pagina=3&entidad=01")
      )
    ).toEqual({ column: "cvegeo", direction: "desc", page: 2, pageSize: 100 });
    expect(readTableState(new URLSearchParams("pagina=9007199254740992")).page).toBe(0);
  });
  it("acota páginas vacías, última exacta y cambios del universo", () => {
    expect(boundedPage(4, 0, 25)).toBe(0);
    expect(boundedPage(4, 50, 25)).toBe(1);
    expect(boundedPage(4, 51, 25)).toBe(2);
    expect(boundedPage(1, 1, 100)).toBe(0);
  });
  it("resuelve las mismas columnas de contexto al mostrar y alternar la tabla", () => {
    for (const column of ["participacion", "riesgo", "registro", "no-existe"]) {
      expect(
        readTableState(
          new URLSearchParams(`orden=${column}&direccion=desc&filas=50&pagina=2`),
          true
        )
      ).toEqual({ column: "municipio", direction: "desc", page: 1, pageSize: 50 });
    }
    for (const column of ["municipio", "cvegeo", "entidad", "indicador"]) {
      expect(readTableState(new URLSearchParams(`orden=${column}`), true).column).toBe(column);
    }
    expect(readTableState(new URLSearchParams("orden=participacion"), false).column).toBe(
      "participacion"
    );
  });
  it("ordena porcentajes como números y mantiene ceros y ausencias diferenciados", () => {
    const d = datasetFixture(),
      m = d.municipalities;
    expect(orderMunicipalities(d, m, "base", "participacion", "asc").map((x) => x.id)).toEqual([
      "01002",
      "01001",
      "16064",
      "01099",
    ]);
    expect(orderMunicipalities(d, m, "base", "participacion", "desc").map((x) => x.id)).toEqual([
      "01001",
      "16064",
      "01002",
      "01099",
    ]);
    expect(m.map((x) => x.id)).toEqual(["01001", "01002", "16064", "01099"]);
  });
  it("ordena niveles recibidos sin convertirlos en una prioridad institucional", () => {
    const d = datasetFixture();
    expect(
      orderMunicipalities(d, d.municipalities, "base", "riesgo", "asc").map((x) => x.id)
    ).toEqual(["01002", "01001", "16064", "01099"]);
    expect(
      orderMunicipalities(d, d.municipalities, "base", "riesgo", "desc").map((x) => x.id)
    ).toEqual(["16064", "01001", "01002", "01099"]);
    expect(
      orderMunicipalities(d, d.municipalities, "no-existe", "riesgo", "desc").map((x) => x.id)
    ).toEqual(["01001", "01002", "01099", "16064"]);
  });
  it("usa orden local de nombres y CVEGEO como desempate neutral y estable", () => {
    const d = datasetFixture(),
      items = d.municipalities;
    items[0]!.name = "Árbol";
    items[1]!.name = "arbol";
    expect(
      orderMunicipalities(d, items, "base", "municipio", "asc")
        .slice(0, 2)
        .map((x) => x.id)
    ).toEqual(["01001", "01002"]);
    expect(orderMunicipalities(d, items, "base", "cvegeo", "desc")[0]!.id).toBe("16064");
    expect(orderMunicipalities(d, items, "base", "entidad", "desc")[0]!.id).toBe("16064");
    expect(orderMunicipalities(d, items, "base", "registro", "asc")[0]!.id).toBe("16064");
  });
  it("exporta toda la consulta en el orden elegido sin cortarla por página", () => {
    const d = datasetFixture();
    const ordered = orderMunicipalities(d, d.municipalities, "base", "participacion", "desc");
    const csv = selectionCsv(d, ordered, "base").trim().split("\r\n");
    expect(csv).toHaveLength(5);
    expect(csv[1]).toMatch(/^"01001"/);
    expect(csv.at(-1)).toMatch(/^"01099"/);
    expect(d.comparisonPolicy.status).toBe("pending");
  });
});
