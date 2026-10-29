import { describe, expect, it } from "vitest";
import {
  decodeDataset,
  defaultScenarios,
  estimateFor,
  filterMunicipalities,
  formatInteger,
  formatPercent,
  formatPointDifference,
  knownHistory,
  municipalityById,
  normalized,
  scenarioLabel,
} from "@/utils/dataset";
import { selectionCsv, municipalityDocument } from "@/utils/downloads";
import { datasetFixture } from "../fixtures/dataset";

describe("Contrato y lectura de resultados", () => {
  it("expresa una diferencia en puntos sin confundirla con porcentaje relativo", () => {
    expect(formatPointDifference(-12)).toBe("12.0 puntos menos");
    expect(formatPointDifference(5.25)).toBe("5.3 puntos más");
    expect(formatPointDifference(-14.87)).toBe("14.9 puntos menos");
    expect(formatPointDifference(-0.03)).toBe("Misma participación al redondear");
    expect(formatPointDifference(0)).toBe("Misma participación");
    expect(formatPointDifference(null)).toBe("Sin dato");
  });
  it("conserva claves, ceros, ausencias y escenarios sin exigir doce", () => {
    const data = decodeDataset(datasetFixture());
    expect(data.municipalities[0]?.id).toBe("01001");
    expect(data.scenarios).toHaveLength(3);
    expect(formatPercent(0)).toBe("0.0%");
    expect(formatPercent(null)).toBe("Sin dato");
    expect(formatPercent(undefined)).toBe("Sin dato");
    expect(formatInteger(0)).toBe("0");
    expect(formatInteger(null)).toBe("Sin dato");
    expect(formatInteger(undefined)).toBe("Sin dato");
    expect(estimateFor(data, "base", "01002").participation).toBe(0);
    expect(estimateFor(data, "base", "01099").participation).toBeNull();
    expect(estimateFor(data, "ausente", "01001").risk).toBe("sin_estimacion");
  });
  it("filtra por nombre acentuado, clave, entidad y riesgo recibido", () => {
    const data = datasetFixture();
    expect(normalized("PARÁCUARO")).toBe("paracuaro");
    expect(filterMunicipalities(data, "paracuaro", "", "", "base").map((r) => r.id)).toEqual([
      "16064",
    ]);
    expect(filterMunicipalities(data, "01001", "01", "medio", "base")).toHaveLength(1);
    expect(filterMunicipalities(data, "", "16", "bajo", "base")).toEqual([]);
    expect(filterMunicipalities(data, "", "", "sin_estimacion", "base").map((r) => r.id)).toEqual([
      "01099",
    ]);
    expect(municipalityById(data, "ausente")).toBeUndefined();
  });
  it("selecciona ejemplos existentes sin aprobar una pareja científica", () => {
    const data = datasetFixture();
    expect(defaultScenarios(data.scenarios)).toEqual(["base", "con"]);
    expect(defaultScenarios([])).toEqual(["", ""]);
    expect(defaultScenarios([data.scenarios[2]!])).toEqual(["otro", "otro"]);
    expect(defaultScenarios([data.scenarios[2]!, data.scenarios[0]!])).toEqual(["base", "otro"]);
    expect(scenarioLabel(data.scenarios[1]!)).toBe("Nacional medio · intervención alta");
    expect(knownHistory(data.municipalities[2]!)).toContainEqual({ year: "2021", value: null });
    expect(data.comparisonPolicy.status).toBe("pending");
  });
  it.each([
    null,
    false,
    "archivo",
    {},
    { ...datasetFixture(), schemaVersion: 2 },
    { ...datasetFixture(), sample: false },
  ])("rechaza un corte incompatible (%s)", (input) => {
    expect(() => decodeDataset(input)).toThrow();
  });
  it("rechaza duplicados, proporciones inválidas y escenarios sin resultados", () => {
    const duplicate = datasetFixture();
    duplicate.municipalities.push(duplicate.municipalities[0]!);
    expect(() => decodeDataset(duplicate)).toThrow(/Identidad/);
    const history = datasetFixture();
    history.municipalities[0]!.history["2024"] = 1.1;
    expect(() => decodeDataset(history)).toThrow(/Historia/);
    const invalid = datasetFixture();
    invalid.estimates.base!["01001"]!.participation = -1;
    expect(() => decodeDataset(invalid)).toThrow(/Estimación/);
    const orphan = datasetFixture();
    orphan.estimates.base!["99999"] = orphan.estimates.base!["01001"]!;
    expect(() => decodeDataset(orphan)).toThrow(/identidad/);
    const duplicateScenario = datasetFixture();
    duplicateScenario.scenarios.push(duplicateScenario.scenarios[0]!);
    expect(() => decodeDataset(duplicateScenario)).toThrow(/Catálogo/);
    const missing = datasetFixture();
    delete missing.estimates.base;
    expect(() => decodeDataset(missing)).toThrow(/Faltan/);
  });
});

describe("Descargas con procedencia", () => {
  it("exporta CSV con identificadores, cero, ausencia y advertencia", () => {
    const data = datasetFixture();
    const csv = selectionCsv(data, data.municipalities, "base");
    expect(csv).toContain('"01002","Asientos"');
    expect(csv).toContain('"0","bajo"');
    expect(csv).toContain('"01099","Sin registro"');
    expect(csv).toContain('"","sin_estimacion"');
    expect(csv).toContain("2027 ilustrativo");
    expect(csv).toContain("fixture-estructural");
  });
  it("escapa comillas y cadenas que una hoja de cálculo interpretaría como fórmula", () => {
    const data = datasetFixture();
    data.municipalities[0]!.name = '=SUM("A1")';
    expect(selectionCsv(data, [data.municipalities[0]!], "base")).toContain('"\'=SUM(""A1"")"');
  });
  it("la ficha conserva null, advertencias, condiciones y contexto de geometría", () => {
    const data = datasetFixture();
    const record = municipalityDocument(data, data.municipalities[2]!, "base");
    expect(record.sample).toBe(true);
    expect(record.municipality.history["2021"]).toBeNull();
    expect(record.result.lower).toBeNull();
    expect(record.comparisonPolicy.status).toBe("pending");
    expect(record.geometry.captured).toBe("2026-10-16");
  });
});
