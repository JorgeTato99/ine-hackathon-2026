import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decodeDataset, estimateFor, formatProbability } from "@/utils/dataset";
import {
  baselineId,
  forecastPaints,
  forecastTotals,
  historicalClass,
  historyLegend,
  indicator,
  interventions,
  readForecastQuery,
  hasEstimateReason,
  interventionNewRegistrants,
} from "@/utils/forecast";

const dataset = decodeDataset(JSON.parse(readFileSync("public/data/dataset.json", "utf8")));
const rows = dataset.municipalities;
const find = (id: string) => rows.find((item) => item.id === id)!;
describe("integración de producto 1.6 (sin evaluar el modelo científico)", () => {
  it("redondea la probabilidad al entero y distingue la ausencia", () => {
    expect(formatProbability(0.9265)).toBe("93%");
    expect(formatProbability(0)).toBe("0%");
    expect(formatProbability(0.7995)).toBe("80%");
    expect(formatProbability(0.8)).toBe("80%");
    expect(formatProbability(null)).toBe("Sin dato");
  });
  it("bloquea cortes incompletos o sin contexto histórico antes de dibujar", () => {
    const missing = structuredClone(dataset);
    delete missing.estimates[baselineId]!["02004"];
    expect(() => decodeDataset(missing)).toThrow(/Cobertura/);
    const invalidHistory = structuredClone(dataset);
    invalidHistory.nationalHistory!["2009"] = 1.1;
    expect(() => decodeDataset(invalidHistory)).toThrow(/histórica nacional/);
    const noExplanation = structuredClone(dataset);
    noExplanation.municipalities.find(
      (item) => item.id === "02004"
    )!.indicators!.aporte_calendario = null;
    expect(() => decodeDataset(noExplanation)).toThrow(/aportaciones/);
  });
  it("reproduce los cinco controles nacionales y ajusta el denominador", () => {
    const expected = [
      [495, 24955268, 0, 0, 51.4],
      [476, 23670302, 84789, 19, 51.5],
      [427, 20254454, 307818, 68, 51.7],
      [488, 24870039, 135793, 7, 51.4],
      [411, 18886724, 528400, 84, 51.8],
    ];
    interventions.forEach((option, index) => {
      const value = forecastTotals(dataset, rows, `nac-estimado_int-${option.id}`);
      expect([
        value.red,
        value.redPeople,
        value.additional,
        value.exits,
        Number((value.participation! * 100).toFixed(1)),
      ]).toEqual(expected[index]);
      expect(value.baseNominal).toBe(98330348);
      if (option.id === "combinada" || option.id === "credencializacion")
        expect(value.nominal).toBe(98660657);
      else expect(value.nominal).toBe(value.baseNominal);
    });
  });
  it.each([
    ["20", 299, 267, 24659],
    ["30", 69, 47, 88533],
    ["02", 6, 6, 57779],
  ])("reproduce los controles territoriales %s", (state, red, combined, votes) => {
    const scope = rows.filter((item) => item.stateCode === state);
    expect(forecastTotals(dataset, scope, baselineId).red).toBe(red);
    const value = forecastTotals(dataset, scope, "nac-estimado_int-combinada");
    expect(value.red).toBe(combined);
    expect(value.additional).toBe(votes);
  });
  it("no asume que combinar acciones saca más municipios del rojo", () => {
    expect(estimateFor(dataset, "nac-estimado_int-jovenes_20_29", "20060").risk).not.toBe("alto");
    expect(estimateFor(dataset, "nac-estimado_int-combinada", "20060").risk).toBe("alto");
    expect(
      rows.filter(
        (item) =>
          item.baseRisk === "alto" &&
          interventions.some(
            (option) =>
              estimateFor(dataset, `nac-estimado_int-${option.id}`, item.id).risk !== "alto"
          )
      )
    ).toHaveLength(85);
  });
  it("conserva aportaciones y distingue explicación base de intervención", () => {
    for (const item of rows.filter((item) => item.hasData)) {
      const sum = ["historia", "calendario", "lista", "social", "politica"].reduce(
        (value, group) => value + indicator(item, `aporte_${group}`)!,
        0
      );
      expect(
        Math.abs(sum - (estimateFor(dataset, baselineId, item.id).participation! - 0.5141) * 100)
      ).toBeLessThanOrEqual(0.020001);
    }
    expect(estimateFor(dataset, baselineId, "30087").participation).toBe(0.4313);
    expect(indicator(find("30087"), "aporte_calendario")).toBe(-9.97);
  });
  it("mantiene cortes históricos fijos, ausencia y falta de casillas separadas", () => {
    const model = structuredClone(find("01001"));
    for (const [value, category] of [
      [0.3999, "0"],
      [0.4, "1"],
      [0.5, "2"],
      [0.6, "3"],
      [0.7, "4"],
      [null, "sin_estimacion"],
    ] as const) {
      model.history["2009"] = value;
      expect(historicalClass(model, "2009")).toBe(category);
    }
    const booth = rows.find((item) => item.historyStatus?.["2024"] === "sin_casilla")!;
    expect(historicalClass(booth, "2024")).toBe("sin_casilla");
    expect(historicalClass(find("24059"), "2024")).toBe("sin_estimacion");
    expect(historyLegend.map((item) => item.id)).toContain("sin_casilla");
    expect(forecastTotals(dataset, [find("24059")], baselineId).participation).toBeNull();
  });
  it("migra enlaces y atenúa sin alterar cifras ni ocultar geometrías", () => {
    const query = readForecastQuery(
      dataset,
      new URLSearchParams(
        "escenario=nac-medio_int-dirigida_rojos&municipio=30087&pestana=contexto&indicador=historia"
      )
    );
    expect(query).toMatchObject({ intervention: "combinada", state: "30", historical: true });
    const paints = forecastPaints(dataset, baselineId, false, "2024", "20", "alto");
    expect(Object.keys(paints)).toHaveLength(2478);
    expect(paints["30087"]!.dimmed).toBe(true);
    expect(rows.filter((item) => item.stateCode === "20" && !paints[item.id]!.dimmed)).toHaveLength(
      299
    );
    expect(dataset.nationalHistory?.["2024"]).toBe(0.5968);
  });
  it("D32 conserva los motivos y no suma altas cuando falta S3", () => {
    for (const code of ["07064", "20248"]) {
      const item = find(code);
      const result = estimateFor(dataset, "nac-estimado_int-combinada", code);
      expect(hasEstimateReason(result, "intervencion_parcial")).toBe(true);
      expect(hasEstimateReason(result, "antecedente_sin_casilla")).toBe(true);
      expect(
        hasEstimateReason({ ...result, reason: "intervencion_parcialidad" }, "intervencion_parcial")
      ).toBe(false);
      expect(indicator(item, "interv_nuevos_en_lista")).toBeGreaterThan(0);
      expect(interventionNewRegistrants(item, "combinada", "alto")).toBe(0);
      expect(forecastTotals(dataset, [item], "nac-estimado_int-combinada").nominal).toBe(
        item.nominal
      );
    }
    // Un cero observado de votos no equivale a desconocer la tasa S3.
    const knownZero = structuredClone(find("02004"));
    knownZero.indicators!.interv_votos_credencializar = 0;
    knownZero.indicators!.interv_nuevos_en_lista = 10;
    expect(interventionNewRegistrants(knownZero, "credencializacion", "alto")).toBe(10);
    const partials = interventions.map(
      (option) =>
        forecastTotals(dataset, rows, `nac-estimado_int-${option.id}`).partialInterventions
    );
    expect(partials).toEqual([0, 6, 9, 73, 77]);
  });
});
