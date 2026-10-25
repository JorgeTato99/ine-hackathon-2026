import { describe, expect, it } from "vitest";
import {
  captureQuery,
  newSavedQuery,
  parseQueryFile,
  prepareRestore,
  queryFile,
  queryLimits,
  savedQuerySummary,
} from "@/utils/saved-queries";
import {
  changeSavedQueries,
  readSavedQueries,
  resetSavedQueries,
  savedQueriesKey,
  type QueryStorage,
} from "@/services/saved-query-store";
import { datasetFixture } from "../fixtures/dataset";

const dataset = datasetFixture();
function entry() {
  return newSavedQuery(
    dataset,
    captureQuery(dataset, new URLSearchParams()),
    "Consulta",
    "<script>personal</script>"
  );
}
function file() {
  return queryFile([entry()]);
}
function memory(): QueryStorage & { raw: string | null; fail: boolean } {
  return {
    raw: null,
    fail: false,
    getItem() {
      return this.raw;
    },
    setItem(_key: string, value: string) {
      if (this.fail) throw new DOMException("full", "QuotaExceededError");
      this.raw = value;
    },
    removeItem() {
      this.raw = null;
    },
  };
}
describe("Archivos de consultas", () => {
  it("conserva la distribución al exportar/restaurar y normaliza la opción predeterminada", () => {
    const params = captureQuery(dataset, new URLSearchParams("distribucion=abajo&municipio=01001"));
    const query = newSavedQuery(dataset, params, "Lectura inferior", "");
    const restored = parseQueryFile(JSON.stringify(queryFile([query]))).queries[0]!;
    expect(restored.params.distribucion).toBe("abajo");
    expect(prepareRestore(restored, dataset).params.distribucion).toBe("abajo");
    expect(savedQuerySummary(restored, dataset)[0]).toMatch(/Mapa con ficha debajo/);
    expect(captureQuery(dataset, new URLSearchParams("distribucion=lateral"))).not.toHaveProperty(
      "distribucion"
    );
    expect(
      captureQuery(dataset, new URLSearchParams("distribucion=desconocida"))
    ).not.toHaveProperty("distribucion");
    expect(() => newSavedQuery(dataset, { distribucion: "desconocida" }, "Inválida", "")).toThrow();
  });
  it("describe la consulta y conserva claves no disponibles como referencia", () => {
    const record = entry();
    record.params = { municipio: "01001", modo: "mapa", escenario: "base" };
    expect(savedQuerySummary(record, dataset)).toContain("Aguascalientes (01001) · Aguascalientes");
    record.params = {
      municipio: "99999",
      escenario: "antiguo",
      vista: "tabla",
      pestana: "contexto",
      indicador: "historia",
    };
    expect(savedQuerySummary(record, dataset)).toContain("Municipio 99999");
    expect(savedQuerySummary(record, dataset)).toContain("Escenario: antiguo");
    expect(savedQuerySummary(record, dataset)[0]).toMatch(/^Tabla/);
  });
  it("conserva texto personal sin ejecutarlo, procedencia y formato", () => {
    const source = file();
    expect(parseQueryFile(JSON.stringify(source))).toEqual(source);
    expect(source.queries[0]?.sourceCommit).toBeNull();
    expect(parseQueryFile(JSON.stringify(queryFile([]))).queries).toHaveLength(0);
  });
  it("rechaza íntegramente tipos, esquemas, fechas y parámetros desconocidos", () => {
    const source = file();
    const first = source.queries[0]!;
    for (const invalid of [
      { ...source, schemaVersion: 2 },
      { ...source, url: "https://outside.invalid" },
      { ...source, queries: [first, { ...first, id: crypto.randomUUID(), title: 3 }] },
      {
        ...source,
        queries: [{ ...first, params: { __proto__: null, url: "https://outside.invalid" } }],
      },
      { ...source, queries: [{ ...first, params: JSON.parse('{"__proto__":"x"}') }] },
      { ...source, queries: [{ ...first, params: { buscar: true } }] },
      { ...source, queries: [{ ...first, params: { municipio: "1001" } }] },
      { ...source, queries: [{ ...first, params: { riesgo: "extremo" } }] },
      { ...source, queries: [{ ...first, params: { ln_min: "3", ln_max: "2" } }] },
      { ...source, queries: [{ ...first, params: { pagina: "0" } }] },
      { ...source, queries: [{ ...first, createdAt: "2026-02-30T00:00:00.000Z" }] },
      { ...source, queries: [{ ...first, updatedAt: "2000-01-01T00:00:00.000Z" }] },
      { ...source, queries: [first, first] },
      { ...source, queries: [{ ...first, title: "a".repeat(81) }] },
      { ...source, queries: [{ ...first, notes: "a".repeat(1001) }] },
    ])
      expect(() => parseQueryFile(JSON.stringify(invalid))).toThrow();
  });
  it("admite 50, rechaza 51 y aplica límite exacto de bytes UTF8", () => {
    const source = queryFile(Array.from({ length: 50 }, entry));
    expect(parseQueryFile(JSON.stringify(source)).queries).toHaveLength(50);
    source.queries.push(entry());
    expect(() => parseQueryFile(JSON.stringify(source))).toThrow();
    const raw = JSON.stringify(file());
    const padded = raw + " ".repeat(queryLimits.bytes - new TextEncoder().encode(raw).length);
    expect(parseQueryFile(padded).queries).toHaveLength(1);
    expect(() => parseQueryFile(padded + " ")).toThrow(/256/);
    expect(() => parseQueryFile(padded + "é")).toThrow(/256/);
  });
  it("captura defaults efectivos, cero y regreso a tabla; rechaza rango inválido", () => {
    const params = captureQuery(
      dataset,
      new URLSearchParams("modo=mapa&ln_min=0&municipio=01002&extra=ignorar"),
      "tabla"
    );
    expect(params).toMatchObject({
      escenario: "base",
      segundo: "con",
      vista: "tabla",
      ln_min: "0",
      municipio: "01002",
    });
    expect(params).not.toHaveProperty("extra");
    expect(() => captureQuery(dataset, new URLSearchParams("ln_min=foo"))).toThrow();
  });
  it("resuelve la pareja actual y avisa si otro corte perdió escenarios o territorio", () => {
    const record = entry();
    record.resultVersion = "antigua";
    record.sourceCommit = "a".repeat(40);
    record.params = { escenario: "ausente", segundo: "otro", municipio: "99999", entidad: "99" };
    const prepared = prepareRestore(record, dataset);
    expect(prepared.warnings).toHaveLength(4);
    expect(prepared.params.escenario).toBe("base");
    expect(prepared.params).not.toHaveProperty("municipio");
    expect(prepared.params).not.toHaveProperty("entidad");
    expect(record.params.municipio).toBe("99999");
    const real = { ...dataset, sample: false };
    expect(captureQuery(real, new URLSearchParams("escenario=base&segundo=otro")).segundo).toBe(
      "con"
    );
  });
});
describe("Persistencia sin pérdida silenciosa", () => {
  it("relee antes de cada cambio y conserva anteriores si se excede el límite", () => {
    const store = memory();
    const first = entry(),
      otherTab = entry();
    changeSavedQueries(
      () => [first],
      () => store
    );
    store.raw = JSON.stringify(queryFile([first, otherTab]));
    expect(
      changeSavedQueries(
        (entries) => [...entries, entry()],
        () => store
      ).queries
    ).toHaveLength(3);
    const previous = store.raw;
    expect(
      changeSavedQueries(
        () => Array.from({ length: 51 }, entry),
        () => store
      )
    ).toMatchObject({ status: "ok", error: expect.stringContaining("50") });
    expect(store.raw).toBe(previous);
  });
  it("conserva contenido corrupto, cuota y lectura bloqueada; nunca informa éxito", () => {
    const store = memory();
    store.raw = "contenido irreconocible";
    expect(readSavedQueries(() => store)).toMatchObject({ status: "corrupt", raw: store.raw });
    expect(
      changeSavedQueries(
        () => [entry()],
        () => store
      ).status
    ).toBe("corrupt");
    expect(store.raw).toBe("contenido irreconocible");
    store.raw = JSON.stringify(file());
    const previous = store.raw;
    store.fail = true;
    expect(
      changeSavedQueries(
        (entries) => [...entries, entry()],
        () => store
      )
    ).toMatchObject({ status: "unavailable", queries: parseQueryFile(previous).queries });
    expect(store.raw).toBe(previous);
    expect(
      readSavedQueries(() => {
        throw new DOMException("blocked", "SecurityError");
      }).status
    ).toBe("unavailable");
    expect(savedQueriesKey).toBe("traza-civica.consultas.v1");
  });
  it("no borra contenido nuevo al confirmar un reinicio antiguo", () => {
    const store = memory();
    store.raw = "ilegible";
    const expected = store.raw;
    store.raw = JSON.stringify(file());
    const previous = store.raw;
    expect(resetSavedQueries(expected, () => store)).toMatchObject({
      removed: false,
      state: { status: "ok" },
    });
    expect(store.raw).toBe(previous);
    store.raw = "otro ilegible";
    expect(resetSavedQueries(expected, () => store).removed).toBe(false);
    expect(store.raw).toBe("otro ilegible");
    expect(resetSavedQueries(store.raw, () => store).removed).toBe(true);
    expect(store.raw).toBeNull();
  });
});
