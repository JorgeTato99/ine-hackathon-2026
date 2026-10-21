import type { Dataset, Municipality } from "@/types/dataset";
import { estimateFor } from "./dataset";

export const sortLabels = {
  municipio: "Municipio",
  cvegeo: "Clave municipal",
  entidad: "Estado",
  participacion: "Participación · ejemplo",
  riesgo: "Riesgo · ejemplo",
  registro: "Datos de la estimación",
  indicador: "Indicador seleccionado",
} as const;
export type SortColumn = keyof typeof sortLabels;
export const pageSizes = [10, 25, 50, 100] as const;
export type TableState = {
  column: SortColumn;
  direction: "asc" | "desc";
  pageSize: number;
  page: number;
};
const collator = new Intl.Collator("es-MX", { sensitivity: "base", numeric: true });
const riskOrder = { bajo: 0, medio: 1, alto: 2, sin_estimacion: null } as const;

export function readTableState(params: Pick<URLSearchParams, "get">, context = false): TableState {
  const column = params.get("orden") ?? "municipio";
  const size = Number(params.get("filas") ?? 25);
  const rawPage = params.get("pagina") ?? "1";
  const page =
    /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) && Number(rawPage) > 0
      ? Number(rawPage) - 1
      : 0;
  const validColumn = Object.hasOwn(sortLabels, column) ? (column as SortColumn) : "municipio";
  return {
    column:
      context && !["municipio", "cvegeo", "entidad", "indicador"].includes(validColumn)
        ? "municipio"
        : validColumn,
    direction: params.get("direccion") === "desc" ? "desc" : "asc",
    pageSize: pageSizes.some((value) => value === size) ? size : 25,
    page,
  };
}
export function boundedPage(page: number, count: number, size: number) {
  return Math.max(0, Math.min(page, Math.max(0, Math.ceil(count / size) - 1)));
}

/** Ausencias al final en ambos sentidos; CVEGEO desempata sin asignar prioridad. */
export function orderMunicipalities(
  dataset: Dataset,
  items: Municipality[],
  scenario: string,
  column: SortColumn,
  direction: "asc" | "desc",
  context?: Record<string, { value?: number | string | null }> | undefined
) {
  const value = (item: Municipality): string | number | null => {
    const result = estimateFor(dataset, scenario, item.id);
    switch (column) {
      case "municipio":
        return item.name;
      case "cvegeo":
        return item.id;
      case "entidad":
        return item.state;
      case "participacion":
        return result.participation;
      case "riesgo":
        return riskOrder[result.risk];
      case "registro":
        return result.state.replaceAll("_", " ");
      case "indicador":
        return context?.[item.id]?.value ?? null;
    }
  };
  const keyed = items.map((item) => ({ item, value: value(item) }));
  keyed.sort((a, b) => {
    if (a.value === null || b.value === null) {
      if (a.value !== b.value) return a.value === null ? 1 : -1;
    } else {
      const delta =
        typeof a.value === "number" && typeof b.value === "number"
          ? a.value - b.value
          : collator.compare(String(a.value), String(b.value));
      if (delta) return direction === "asc" ? delta : -delta;
    }
    return collator.compare(a.item.id, b.item.id);
  });
  return keyed.map((row) => row.item);
}
