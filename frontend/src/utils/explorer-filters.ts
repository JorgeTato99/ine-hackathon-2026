import type { Municipality } from "@/types/dataset";

export const historyYears = ["2009", "2012", "2015", "2018", "2021", "2024"] as const;
export type HistoryFilter = "" | "completa" | "parcial" | "ausente";
export type GeometryFilter = "" | "con" | "sin";
export type AdvancedFilters = {
  history: HistoryFilter;
  geometry: GeometryFilter;
  minimum: string;
  maximum: string;
};
export const emptyAdvancedFilters: AdvancedFilters = {
  history: "",
  geometry: "",
  minimum: "",
  maximum: "",
};

export function readAdvancedFilters(params: Pick<URLSearchParams, "get">): AdvancedFilters {
  const history = params.get("historia") ?? "";
  const geometry = params.get("cartografia") ?? "";
  return {
    history: ["completa", "parcial", "ausente"].includes(history) ? (history as HistoryFilter) : "",
    geometry: ["con", "sin"].includes(geometry) ? (geometry as GeometryFilter) : "",
    minimum: params.get("ln_min") ?? "",
    maximum: params.get("ln_max") ?? "",
  };
}

function count(value: string) {
  if (!value) return null;
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : NaN;
}
export function nominalRangeError(filters: AdvancedFilters): string | null {
  const minimum = count(filters.minimum),
    maximum = count(filters.maximum);
  if (Number.isNaN(minimum) || Number.isNaN(maximum))
    return "Usa números enteros de cero o más para la lista electoral.";
  if (minimum !== null && maximum !== null && minimum > maximum)
    return "El mínimo de la lista electoral no puede superar al máximo.";
  return null;
}

/** Presencia de registros: no evalúa calidad ni comparabilidad territorial. */
export function historyCoverage(item: Municipality): HistoryFilter {
  const known = historyYears.filter(
    (year) => item.history[year] !== null && item.history[year] !== undefined
  ).length;
  if (typeof item.indicators?.historia_completa === "boolean")
    return item.indicators.historia_completa ? "completa" : known === 0 ? "ausente" : "parcial";
  return known === 0 ? "ausente" : known === historyYears.length ? "completa" : "parcial";
}
export function applyAdvancedFilters(
  items: Municipality[],
  filters: AdvancedFilters
): Municipality[] {
  if (nominalRangeError(filters)) return [];
  const minimum = count(filters.minimum),
    maximum = count(filters.maximum);
  return items.filter((item) => {
    if (filters.history && historyCoverage(item) !== filters.history) return false;
    if (filters.geometry && item.hasGeometry !== (filters.geometry === "con")) return false;
    if ((minimum !== null || maximum !== null) && item.nominal === null) return false;
    if (minimum !== null && item.nominal !== null && item.nominal < minimum) return false;
    if (maximum !== null && item.nominal !== null && item.nominal > maximum) return false;
    return true;
  });
}

export function advancedFilterCount(filters: AdvancedFilters) {
  return Object.values(filters).filter((value) => value !== "").length;
}
