import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decodeDataset, estimateFor, filterMunicipalities } from "@/utils/dataset";
import {
  applyContextFilters,
  controlCards,
  historicalLabel,
  mapPresentation,
  readPresentation,
} from "@/utils/indicators";
import { municipalityDocument, selectionCsv } from "@/utils/downloads";
import { orderMunicipalities } from "@/utils/explorer-table";

const dataset = decodeDataset(JSON.parse(readFileSync("public/data/dataset.json", "utf8")));
const presentation = (query = "") => readPresentation(new URLSearchParams(query));
const medium = "nac-medio_int-ninguna",
  intervention = "nac-medio_int-dirigida_rojos";
const integer = (value: string) => Number(value.replace(/[^\d]/g, ""));

describe("entrega científica resultados-1.2", () => {
  it("conserva cobertura, identidad y ausencia de Villa de Pozos", () => {
    expect(dataset.version).toBe("resultados-1.2");
    expect(dataset.sample).toBe(false);
    expect(dataset.municipalities).toHaveLength(2478);
    expect(dataset.scenarios).toHaveLength(6);
    const villa = dataset.municipalities.find((item) => item.id === "24059")!;
    expect(villa.hasGeometry).toBe(true);
    expect(villa.hasData).toBe(false);
    expect(estimateFor(dataset, medium, villa.id).risk).toBe("sin_estimacion");
    expect(dataset.comparisonPolicy.pairs).toHaveLength(3);
  });
  it("reproduce rojos, personas y comparación al mismo nivel nacional", () => {
    const rows = dataset.municipalities,
      baseline = controlCards(dataset, rows, medium, presentation()),
      con = controlCards(dataset, rows, intervention, presentation());
    expect(integer(baseline[0]!.value)).toBe(495);
    expect(integer(baseline[1]!.value)).toBe(23818704);
    expect(integer(con.find((card) => card.label === "Votos adicionales · supuesto")!.value)).toBe(
      505007
    );
    expect(integer(con.find((card) => card.label === "Salen del rojo")!.value)).toBe(88);
    expect(
      rows.filter((item) => estimateFor(dataset, intervention, item.id).risk === "alto")
    ).toHaveLength(407);
    const redSin = filterMunicipalities(dataset, "", "", "alto", medium),
      redCon = filterMunicipalities(dataset, "", "", "alto", intervention);
    expect(redSin.map((item) => item.id)).toEqual(redCon.map((item) => item.id));
    expect(redCon).toHaveLength(495);
  });
  it("reproduce calendario, rezago, zonas y alertas sin confundir el municipio sin datos", () => {
    const values = (view: string) =>
      controlCards(
        dataset,
        dataset.municipalities,
        medium,
        presentation(`pestana=contexto&indicador=${view}`)
      ).map((card) => integer(card.value));
    expect(values("elecciones")).toEqual([676, 1125, 425, 251, 676, 413, 82]);
    expect(values("rezago")[0]).toBe(285);
    expect(values("zonas")).toEqual([371, 337, 21, 43, 1652, 53]);
    expect(values("casillas")).toEqual([16, 59, 2402]);
    expect(values("seguridad")).toEqual([517, 64, 7]);
    const map = mapPresentation(dataset, presentation("pestana=contexto&indicador=zonas"));
    expect(Object.values(map.paints).filter((value) => value.label === "Sin dato")).toHaveLength(
      54
    );
  });
  it("reproduce conteos de personas y conserva los vacíos", () => {
    const check = (group: string) =>
      controlCards(
        dataset,
        dataset.municipalities,
        medium,
        presentation(`pestana=contexto&indicador=personas&grupo=${group}`)
      ).map((card) => integer(card.value));
    expect(check("primerizos_votaron_2024")).toEqual([2898581, 582590, 0]);
    expect(check("jovenes_21_29_no_votaron_2024")).toEqual([9835966, 2884632, 0]);
    expect(check("nuevos_votantes_2027")).toEqual([4363455, 1104131, 8]);
    expect(check("nuevos_sin_credencial_2027_si_se_repite_2021")).toEqual([1268747, 318946, 245]);
  });
  it("conserva categorías coloreadas al traducir etiquetas sin modificar indicadores exportados", () => {
    for (const view of ["zonas", "elecciones", "casillas"]) {
      const map = mapPresentation(dataset, presentation(`pestana=contexto&indicador=${view}`));
      const missing = map.legend.find((entry) => entry.label === "Sin dato")!.color;
      const available = Object.values(map.paints).filter((paint) => paint.label !== "Sin dato");
      expect(available.every((paint) => paint.color !== missing)).toBe(true);
      expect(new Set(available.map((paint) => paint.color)).size).toBe(
        view === "zonas" ? 5 : view === "elecciones" ? 4 : 3
      );
    }
    const item = dataset.municipalities.find(
      (row) => row.indicators?.zona_participacion_2024 === "fría (bajo-bajo)"
    )!;
    const map = mapPresentation(dataset, presentation("pestana=contexto&indicador=zonas"));
    expect(map.paints[item.id]?.label).toBe("Participación baja entre vecinos");
    const csv = selectionCsv(dataset, [item], medium, map);
    expect(csv).toContain('"Participación baja entre vecinos"');
    expect(csv).toContain('"fría (bajo-bajo)"');
  });
  it("muestra cero sin casilla como una condición, sin reescribir el valor original", () => {
    const item = dataset.municipalities.find((row) => row.id === "07030")!;
    expect(item.history["2024"]).toBe(0);
    expect(historicalLabel(item, "2024")).toMatch(/Sin casilla/);
    expect(item.indicators?.brecha_jovenes_2024).toBeNull();
    const map = mapPresentation(
      dataset,
      presentation("pestana=contexto&indicador=historia&anio=2024")
    );
    expect(map.paints[item.id]?.label).toBe("Sin casilla");
    expect(map.paints["24059"]?.label).toBe("Sin dato");
  });
  it("aplica filtros comunes y ordena conteos por valor numérico", () => {
    const rows = applyContextFilters(dataset.municipalities, {
      tamano: "",
      ayuntamiento: "no",
      costumbres: "si",
      alerta: "",
    });
    expect(rows).toHaveLength(425);
    const map = mapPresentation(dataset, presentation("pestana=contexto&indicador=personas"));
    const sorted = orderMunicipalities(
      dataset,
      dataset.municipalities,
      medium,
      "indicador",
      "desc",
      map.paints
    );
    const values = sorted
      .map((item) => map.paints[item.id]?.value)
      .filter((value): value is number => typeof value === "number");
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });
  it("exporta resultados e intervalos sin presentarlos como ejemplos ni efectos medidos", () => {
    const item = dataset.municipalities[0]!;
    const csv = selectionCsv(dataset, [item], intervention);
    expect(csv).toContain('"part_pred_inf"');
    expect(csv).toContain('"semaforo"');
    expect(csv).toContain("supuesto, no efecto medido");
    expect(csv).not.toContain("_ejemplo");
    const document = municipalityDocument(dataset, item, medium, intervention);
    expect(document.sample).toBe(false);
    expect(document.secondReading?.comparability).toBe("confirmed");
    expect(municipalityDocument(dataset, item, medium, medium).secondReading?.comparability).toBe(
      "pending"
    );
    expect(
      municipalityDocument(dataset, item, medium, "nac-alto_int-dirigida_rojos").secondReading
        ?.comparability
    ).toBe("pending");
    expect(document.source?.commit).toBe("ac8dc3cdbb06b5a0d5ddd63b67bee9a43def9821");
  });
});
