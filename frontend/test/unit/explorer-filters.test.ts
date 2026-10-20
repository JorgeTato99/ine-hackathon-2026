import { describe, expect, it } from "vitest";
import { datasetFixture } from "../fixtures/dataset";
import {
  advancedFilterCount,
  applyAdvancedFilters,
  emptyAdvancedFilters,
  historyCoverage,
  nominalRangeError,
  readAdvancedFilters,
} from "@/utils/explorer-filters";

describe("Consulta avanzada sin inferencias científicas", () => {
  it("normaliza categorías desconocidas y conserva cero en los límites", () => {
    const filters = readAdvancedFilters(
      new URLSearchParams("historia=otra&cartografia=no&ln_min=0")
    );
    expect(filters).toEqual({ ...emptyAdvancedFilters, minimum: "0" });
    expect(advancedFilterCount(filters)).toBe(1);
    expect(readAdvancedFilters(new URLSearchParams())).toEqual(emptyAdvancedFilters);
  });
  it("cuenta presencia en las seis elecciones, incluyendo proporciones de cero", () => {
    const d = datasetFixture();
    expect(d.municipalities.map(historyCoverage)).toEqual([
      "completa",
      "parcial",
      "parcial",
      "ausente",
    ]);
    const m = d.municipalities[0]!;
    m.history["2009"] = null;
    expect(historyCoverage(m)).toBe("parcial");
  });
  it("filtra historia y geometría sin cambiar los registros originales", () => {
    const items = datasetFixture().municipalities,
      original = structuredClone(items);
    expect(
      applyAdvancedFilters(items, {
        ...emptyAdvancedFilters,
        history: "completa",
        geometry: "con",
      }).map((x) => x.id)
    ).toEqual(["01001"]);
    expect(
      applyAdvancedFilters(items, {
        ...emptyAdvancedFilters,
        history: "ausente",
        geometry: "sin",
      }).map((x) => x.id)
    ).toEqual(["01099"]);
    expect(applyAdvancedFilters(items, emptyAdvancedFilters)).toEqual(items);
    expect(items).toEqual(original);
  });
  it("incluye ambos extremos y excluye ausencias sólo al acotar lista nominal", () => {
    const items = datasetFixture().municipalities;
    expect(
      applyAdvancedFilters(items, { ...emptyAdvancedFilters, minimum: "0", maximum: "0" }).map(
        (x) => x.id
      )
    ).toEqual(["01002"]);
    expect(
      applyAdvancedFilters(items, { ...emptyAdvancedFilters, minimum: "100", maximum: "100" }).map(
        (x) => x.id
      )
    ).toEqual(["01001", "16064"]);
    expect(applyAdvancedFilters(items, { ...emptyAdvancedFilters, minimum: "101" })).toEqual([]);
    expect(
      applyAdvancedFilters(items, { ...emptyAdvancedFilters, maximum: "99" }).map((x) => x.id)
    ).toEqual(["01002"]);
  });
  it.each(["-1", "1.5", "Infinity", "texto", "9007199254740992"])(
    "explica y no aplica silenciosamente un límite inválido: %s",
    (minimum) => {
      const filters = { ...emptyAdvancedFilters, minimum };
      expect(nominalRangeError(filters)).toMatch(/enteros/);
      expect(applyAdvancedFilters(datasetFixture().municipalities, filters)).toEqual([]);
    }
  );
  it("distingue un rango invertido de un extremo abierto", () => {
    expect(nominalRangeError({ ...emptyAdvancedFilters, minimum: "5", maximum: "4" })).toMatch(
      /superar/
    );
    expect(nominalRangeError({ ...emptyAdvancedFilters, maximum: "0" })).toBeNull();
  });
});
