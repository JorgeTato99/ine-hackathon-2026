import { parseQueryFile, queryFile, queryLimits, type SavedQuery } from "@/utils/saved-queries";

export const savedQueriesKey = "traza-civica.consultas.v1";
export type QueryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type QueryStorageState =
  | { status: "ok"; queries: SavedQuery[]; error?: string }
  | { status: "corrupt"; queries: SavedQuery[]; raw: string; message: string }
  | { status: "unavailable"; queries: SavedQuery[]; message: string };
const browserStorage = () => window.localStorage;
export function readSavedQueries(
  getStorage: () => QueryStorage = browserStorage
): QueryStorageState {
  let raw: string | null;
  try {
    raw = getStorage().getItem(savedQueriesKey);
  } catch {
    return {
      status: "unavailable",
      queries: [],
      message: "El navegador no permite guardar consultas. Puedes exportar la consulta actual.",
    };
  }
  if (raw === null) return { status: "ok", queries: [] };
  try {
    return { status: "ok", queries: parseQueryFile(raw).queries };
  } catch {
    return {
      status: "corrupt",
      queries: [],
      raw,
      message:
        "Hay consultas que no podemos leer. Descarga un respaldo antes de reiniciar el almacenamiento.",
    };
  }
}
/** Relee antes de mutar; una escritura fallida conserva la copia persistida anterior. */
export function changeSavedQueries(
  transform: (queries: SavedQuery[]) => SavedQuery[],
  getStorage: () => QueryStorage = browserStorage
): QueryStorageState {
  const latest = readSavedQueries(getStorage);
  if (latest.status !== "ok") return latest;
  let raw: string;
  let checked: ReturnType<typeof parseQueryFile>;
  try {
    const queries = transform(latest.queries);
    if (queries.length > queryLimits.count)
      throw new Error("Límite de 50 consultas. Elimina alguna o exporta antes de agregar más.");
    raw = JSON.stringify(queryFile(queries));
    checked = parseQueryFile(raw);
  } catch (error) {
    return {
      ...latest,
      error: error instanceof Error ? error.message : "No se pudo preparar el cambio.",
    };
  }
  try {
    getStorage().setItem(savedQueriesKey, raw);
    return { status: "ok", queries: checked.queries };
  } catch (error) {
    return {
      status: "unavailable",
      queries: latest.queries,
      message:
        error instanceof Error && !["QuotaExceededError", "SecurityError"].includes(error.name)
          ? error.message
          : "No se pudo guardar el cambio. Se conservaron las consultas anteriores; puedes exportar la actual.",
    };
  }
}
export function resetSavedQueries(
  expectedRaw: string,
  getStorage: () => QueryStorage = browserStorage
) {
  const latest = readSavedQueries(getStorage);
  if (latest.status !== "corrupt" || latest.raw !== expectedRaw)
    return { state: latest, removed: false };
  try {
    getStorage().removeItem(savedQueriesKey);
    return { state: readSavedQueries(getStorage), removed: true };
  } catch {
    return {
      state: {
        status: "unavailable" as const,
        queries: [],
        message: "No se pudo reiniciar el almacenamiento.",
      },
      removed: false,
    };
  }
}
