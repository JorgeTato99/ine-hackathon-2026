import type { Dataset, Estimate, Municipality, Scenario } from "@/types/dataset";

export const noEstimate: Estimate = {
  participation: null,
  lower: null,
  upper: null,
  risk: "sin_estimacion",
  state: "sin_registro",
  reason: null,
};
const percent = new Intl.NumberFormat("es-MX", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("es-MX");
export function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? "Sin dato" : percent.format(value);
}
export function formatInteger(value: number | null | undefined) {
  return value === null || value === undefined ? "Sin dato" : integer.format(value);
}
export function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");
}
export function scenarioLabel(scenario: Scenario) {
  return scenario.intervention === "dirigida_rojos"
    ? `Nacional ${scenario.national} · intervención dirigida`
    : `Nacional ${scenario.national} · intervención ${scenario.intervention}`;
}
export function estimateFor(dataset: Dataset, scenario: string, code: string): Estimate {
  return dataset.estimates[scenario]?.[code] ?? noEstimate;
}
export function filterMunicipalities(
  dataset: Dataset,
  query: string,
  state: string,
  risk: string,
  scenario: string
) {
  const needle = normalized(query.trim());
  return dataset.municipalities.filter(
    (item) =>
      (!state || item.stateCode === state) &&
      (!needle || normalized(`${item.id} ${item.name} ${item.state}`).includes(needle)) &&
      (!risk || (item.baseRisk ?? estimateFor(dataset, scenario, item.id).risk) === risk)
  );
}
export function defaultScenarios(scenarios: Scenario[]) {
  const first =
    scenarios.find((s) => s.national === "medio" && s.intervention === "ninguna") ?? scenarios[0];
  const second =
    scenarios.find((s) => s.national === first?.national && s.intervention === "dirigida_rojos") ??
    scenarios.find((s) => s.national === first?.national && s.intervention === "alta") ??
    scenarios.find((s) => s.id !== first?.id) ??
    first;
  return [first?.id ?? "", second?.id ?? ""] as const;
}
export function municipalityById(dataset: Dataset, code: string) {
  return dataset.municipalities.find((item) => item.id === code);
}
export function knownHistory(item: Municipality) {
  return Object.entries(item.history).map(([year, value]) => ({ year, value }));
}

export function decodeDataset(value: unknown): Dataset {
  if (!value || typeof value !== "object")
    throw new Error("El archivo de resultados no tiene un formato válido.");
  const candidate = value as Partial<Dataset>;
  if (
    ![1, 2].includes(candidate.schemaVersion ?? 0) ||
    (candidate.schemaVersion === 1 ? candidate.sample !== true : candidate.sample !== false) ||
    typeof candidate.version !== "string" ||
    !Array.isArray(candidate.municipalities) ||
    !Array.isArray(candidate.scenarios) ||
    !candidate.scenarios.length ||
    !candidate.estimates ||
    (candidate.schemaVersion === 1
      ? candidate.comparisonPolicy?.status !== "pending"
      : candidate.comparisonPolicy?.status !== "confirmed") ||
    typeof candidate.geometry?.path !== "string" ||
    !candidate.geometry.path.startsWith("/data/")
  )
    throw new Error("El corte no corresponde al contrato de resultados de esta interfaz.");
  const ids = new Set<string>();
  if (
    candidate.schemaVersion === 2 &&
    (!candidate.nationalLevels ||
      ["bajo", "medio", "alto"].some((level) => {
        const value = candidate.nationalLevels?.[level];
        return typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1;
      }) ||
      typeof candidate.model !== "string")
  )
    throw new Error("Falta contexto científico del pronóstico.");
  for (const item of candidate.municipalities) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !/^\d{5}$/.test(item.id) ||
      ids.has(item.id) ||
      typeof item.name !== "string" ||
      typeof item.state !== "string" ||
      !item.history
    )
      throw new Error("Identidad municipal inválida o duplicada.");
    ids.add(item.id);
    for (const number of Object.values(item.history))
      if (number !== null && (!Number.isFinite(number) || number < 0 || number > 1))
        throw new Error("Historia con proporciones inválidas.");
    if (candidate.schemaVersion === 2) {
      if (
        !item.indicators ||
        !item.baseRisk ||
        !["alto", "medio", "bajo", "sin_estimacion"].includes(item.baseRisk)
      )
        throw new Error("Faltan indicadores o semáforo de referencia.");
      for (const value of Object.values(item.indicators))
        if (
          value !== null &&
          typeof value !== "string" &&
          typeof value !== "boolean" &&
          (typeof value !== "number" || !Number.isFinite(value))
        )
          throw new Error("Indicador inválido.");
      for (const [year, status] of Object.entries(item.historyStatus ?? {}))
        if (status !== "sin_casilla" || item.history[year] !== 0)
          throw new Error("Marca histórica incoherente.");
    }
  }
  const scenarioIds = new Set<string>();
  for (const scenario of candidate.scenarios) {
    if (
      !scenario.id ||
      scenarioIds.has(scenario.id) ||
      typeof scenario.national !== "string" ||
      typeof scenario.intervention !== "string"
    )
      throw new Error("Catálogo de escenarios inválido.");
    scenarioIds.add(scenario.id);
    const estimates = candidate.estimates[scenario.id];
    if (!estimates) throw new Error("Faltan resultados para un escenario.");
    for (const [code, estimate] of Object.entries(estimates)) {
      if (
        !ids.has(code) ||
        !estimate ||
        typeof estimate.state !== "string" ||
        !estimate.state ||
        (estimate.reason !== null && typeof estimate.reason !== "string") ||
        !["bajo", "medio", "alto", "sin_estimacion"].includes(estimate.risk)
      )
        throw new Error("Resultado sin identidad o riesgo declarado.");
      if (
        (estimate.participation === null) !== (estimate.risk === "sin_estimacion") ||
        (estimate.participation !== null &&
          ((estimate.lower !== null && estimate.participation < estimate.lower) ||
            (estimate.upper !== null && estimate.participation > estimate.upper)))
      )
        throw new Error("Estado o intervalo incoherente con la estimación.");
      for (const number of [estimate.participation, estimate.lower, estimate.upper])
        if (number !== null && (!Number.isFinite(number) || number < 0 || number > 1))
          throw new Error("Estimación con proporciones inválidas.");
    }
  }
  return candidate as Dataset;
}
