import type { Dataset } from "@/types/dataset";
import { defaultScenarios, filterMunicipalities, scenarioLabel } from "./dataset";
import { riskTokens } from "@/theme/tokens";
import { applyAdvancedFilters, nominalRangeError, readAdvancedFilters } from "./explorer-filters";
import { boundedPage, pageSizes, readTableState, sortLabels } from "./explorer-table";
import {
  applyContextFilters,
  contextViews,
  peopleGroups,
  readContextFilters,
  readPresentation,
} from "./indicators";

export const queryLimits = { count: 50, title: 80, notes: 1000, bytes: 256 * 1024 } as const;
export type SavedQuery = {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  resultVersion: string;
  sourceCommit: string | null;
  params: Record<string, string>;
};
export type QueryFile = {
  format: "traza-civica.consultas";
  schemaVersion: 1;
  queries: SavedQuery[];
};
export function savedQuerySummary(query: SavedQuery, dataset: Dataset) {
  const params = new URLSearchParams(query.params);
  const presentation = readPresentation(params);
  const municipality = dataset.municipalities.find((item) => item.id === params.get("municipio"));
  const state = dataset.municipalities.find((item) => item.stateCode === params.get("entidad"));
  const scenario = dataset.scenarios.find((item) => item.id === params.get("escenario"));
  const view =
    params.get("modo") === "mapa"
      ? "Modo mapa"
      : params.get("vista") === "tabla"
        ? "Tabla"
        : "Mapa";
  return [
    `${view} · ${presentation.tab === "contexto" ? contextViews[presentation.view] : "Pronóstico 2027"}`,
    municipality
      ? `${municipality.name} (${municipality.id}) · ${municipality.state}`
      : params.has("municipio")
        ? `Municipio ${params.get("municipio")}`
        : (state?.state ??
          (params.has("entidad") ? `Estado ${params.get("entidad")}` : "Todo México")),
    scenario
      ? scenarioLabel(scenario)
      : `Escenario: ${params.get("escenario") ?? "predeterminado"}`,
    ...(params.has("buscar") ? [`Búsqueda: ${params.get("buscar")}`] : []),
  ];
}
const enums: Record<string, readonly string[]> = {
  riesgo: Object.keys(riskTokens),
  modo: ["mapa"],
  vista: ["tabla", "mapa"],
  comparar: ["1"],
  pestana: ["pronostico", "contexto"],
  indicador: Object.keys(contextViews),
  grupo: Object.keys(peopleGroups),
  seguridad: ["homicidios", "institucion", "policia"],
  anio: ["2009", "2012", "2015", "2018", "2021", "2024"],
  tamano: ["pequeno", "medio", "grande", "mayor"],
  ayuntamiento: ["si", "no"],
  costumbres: ["si", "no"],
  alerta: ["con", "sin"],
  historia: ["completa", "parcial", "ausente"],
  cartografia: ["con", "sin"],
  orden: Object.keys(sortLabels),
  direccion: ["asc", "desc"],
  filas: pageSizes.map(String),
};
const keys = new Set([
  ...Object.keys(enums),
  "buscar",
  "entidad",
  "municipio",
  "escenario",
  "segundo",
  "ln_min",
  "ln_max",
  "pagina",
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function invalid(message = "El archivo no tiene un formato de consultas válido."): never {
  throw new Error(message);
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function exact(value: Record<string, unknown>, fields: string[]) {
  if (
    Object.keys(value).length !== fields.length ||
    fields.some((key) => !Object.hasOwn(value, key))
  )
    invalid();
}
function text(value: unknown, max: number, required = false): value is string {
  return typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);
}
function iso(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
export function validateQueryParams(value: unknown): Record<string, string> {
  if (!record(value)) invalid();
  const clean: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!keys.has(key) || typeof item !== "string" || item.length === 0)
      invalid("La consulta contiene un filtro desconocido o inválido.");
    if (Object.hasOwn(enums, key) && !enums[key]!.includes(item)) invalid();
    if (key === "buscar" && !text(item, 100))
      invalid("La búsqueda debe tener hasta 100 caracteres.");
    if (
      (key === "entidad" && !/^\d{2}$/.test(item)) ||
      (key === "municipio" && !/^\d{5}$/.test(item))
    )
      invalid();
    if (["escenario", "segundo"].includes(key) && !/^[a-zA-Z0-9_-]{1,100}$/.test(item)) invalid();
    if (
      ["ln_min", "ln_max", "pagina"].includes(key) &&
      (!/^\d+$/.test(item) ||
        !Number.isSafeInteger(Number(item)) ||
        (key === "pagina" && Number(item) < 1))
    )
      invalid();
    clean[key] = item;
  }
  const error = nominalRangeError(readAdvancedFilters(new URLSearchParams(clean)));
  if (error) invalid(error);
  return clean;
}
export function queryFile(queries: SavedQuery[]): QueryFile {
  return { format: "traza-civica.consultas", schemaVersion: 1, queries };
}
export function parseQueryFile(raw: string): QueryFile {
  if (new TextEncoder().encode(raw).byteLength > queryLimits.bytes)
    invalid("El archivo supera 256 KiB.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    invalid("No pudimos leer el JSON de consultas.");
  }
  if (!record(value)) invalid();
  exact(value, ["format", "schemaVersion", "queries"]);
  if (
    value.format !== "traza-civica.consultas" ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.queries) ||
    value.queries.length > queryLimits.count
  )
    invalid("El archivo debe usar el formato de Traza Cívica y contener hasta 50 consultas.");
  const ids = new Set<string>();
  const queries = value.queries.map((entry: unknown): SavedQuery => {
    if (!record(entry)) invalid();
    exact(entry, [
      "id",
      "title",
      "notes",
      "createdAt",
      "updatedAt",
      "resultVersion",
      "sourceCommit",
      "params",
    ]);
    if (
      typeof entry.id !== "string" ||
      !uuid.test(entry.id) ||
      ids.has(entry.id) ||
      !text(entry.title, queryLimits.title, true) ||
      !text(entry.notes, queryLimits.notes) ||
      !iso(entry.createdAt) ||
      !iso(entry.updatedAt) ||
      entry.updatedAt < entry.createdAt ||
      typeof entry.resultVersion !== "string" ||
      !/^[\w.-]{1,80}$/.test(entry.resultVersion) ||
      (entry.sourceCommit !== null &&
        (typeof entry.sourceCommit !== "string" || !/^[a-f0-9]{40}$/i.test(entry.sourceCommit)))
    )
      invalid();
    ids.add(entry.id);
    return {
      id: entry.id,
      title: entry.title,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      resultVersion: entry.resultVersion,
      sourceCommit: entry.sourceCommit,
      params: validateQueryParams(entry.params),
    };
  });
  return queryFile(queries);
}

/** Guarda la lectura efectiva, incluidos los valores que la interfaz resuelve por defecto. */
export function captureQuery(dataset: Dataset, input: URLSearchParams, returnView = "mapa") {
  const params = new URLSearchParams();
  const set = (key: string, value: string | null | undefined) => {
    if (value) params.set(key, value);
  };
  const defaults = defaultScenarios(dataset.scenarios);
  const main =
    dataset.scenarios.find((item) => item.id === input.get("escenario")) ??
    dataset.scenarios.find((item) => item.id === defaults[0]);
  const second = dataset.sample
    ? (dataset.scenarios.find((item) => item.id === input.get("segundo"))?.id ?? defaults[1])
    : dataset.scenarios.find(
        (item) => item.national === main?.national && item.intervention !== main?.intervention
      )?.id;
  set("escenario", main?.id);
  set("segundo", second);
  set("buscar", input.get("buscar"));
  set(
    "entidad",
    dataset.municipalities.some((item) => item.stateCode === input.get("entidad"))
      ? input.get("entidad")
      : null
  );
  set("riesgo", Object.hasOwn(riskTokens, input.get("riesgo") ?? "") ? input.get("riesgo") : null);
  set("modo", input.get("modo") === "mapa" ? "mapa" : null);
  set(
    "vista",
    input.get("modo") === "mapa" ? returnView : input.get("vista") === "tabla" ? "tabla" : "mapa"
  );
  set("comparar", input.get("comparar") === "1" ? "1" : null);
  const advanced = readAdvancedFilters(input);
  set("historia", advanced.history);
  set("cartografia", advanced.geometry);
  set("ln_min", advanced.minimum);
  set("ln_max", advanced.maximum);
  const presentation = readPresentation(input);
  for (const [key, value] of Object.entries({
    pestana: presentation.tab,
    indicador: presentation.view,
    grupo: presentation.group,
    seguridad: presentation.security,
    anio: presentation.year,
  }))
    set(key, value);
  if (!dataset.sample)
    for (const [key, value] of Object.entries(readContextFilters(input))) set(key, value);
  const table = readTableState(input, !dataset.sample && presentation.tab === "contexto");
  set("orden", table.column);
  set("direccion", table.direction);
  set("filas", String(table.pageSize));
  const items = applyContextFilters(
    applyAdvancedFilters(
      filterMunicipalities(
        dataset,
        params.get("buscar") ?? "",
        params.get("entidad") ?? "",
        params.get("riesgo") ?? "",
        main?.id ?? ""
      ),
      advanced
    ),
    dataset.sample
      ? { tamano: "", ayuntamiento: "", costumbres: "", alerta: "" }
      : readContextFilters(params)
  );
  set("pagina", String(boundedPage(table.page, items.length, table.pageSize) + 1));
  set(
    "municipio",
    items.some((item) => item.id === input.get("municipio")) ? input.get("municipio") : null
  );
  return validateQueryParams(Object.fromEntries(params));
}
export function newSavedQuery(
  dataset: Dataset,
  params: Record<string, string>,
  title: string,
  notes: string
): SavedQuery {
  const now = new Date().toISOString();
  const entry = {
    id: crypto.randomUUID(),
    title: title.trim(),
    notes,
    createdAt: now,
    updatedAt: now,
    resultVersion: dataset.version,
    sourceCommit: dataset.source?.commit ?? null,
    params,
  };
  return parseQueryFile(JSON.stringify(queryFile([entry]))).queries[0]!;
}
export function prepareRestore(query: SavedQuery, dataset: Dataset) {
  const warnings: string[] = [];
  if (
    query.resultVersion !== dataset.version ||
    query.sourceCommit !== (dataset.source?.commit ?? null)
  )
    warnings.push(
      `La consulta se guardó con ${query.resultVersion} (fuente ${query.sourceCommit?.slice(0, 7) ?? "sin commit"}); ahora se abrirá con ${dataset.version} (fuente ${dataset.source?.commit.slice(0, 7) ?? "sin commit"}). El archivo no conserva resultados antiguos.`
    );
  const params = new URLSearchParams(query.params);
  for (const key of ["escenario", "segundo"])
    if (params.has(key) && !dataset.scenarios.some((item) => item.id === params.get(key))) {
      warnings.push(
        `El escenario ${params.get(key)} ya no está disponible; se usará una opción actual.`
      );
      params.delete(key);
    }
  if (
    params.has("entidad") &&
    !dataset.municipalities.some((item) => item.stateCode === params.get("entidad"))
  ) {
    warnings.push("El estado guardado no está disponible; se quitará ese filtro.");
    params.delete("entidad");
  }
  const canonical = captureQuery(dataset, params, params.get("vista") ?? "mapa");
  if (params.has("municipio") && !canonical.municipio)
    warnings.push(
      "El municipio guardado no está disponible en esta consulta; no se abrirá su ficha."
    );
  if (!dataset.sample && query.params.segundo && canonical.segundo !== query.params.segundo)
    warnings.push("La comparación utilizará la pareja actual del mismo supuesto nacional.");
  return { params: canonical, warnings };
}
