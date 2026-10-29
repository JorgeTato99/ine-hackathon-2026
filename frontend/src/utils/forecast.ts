import type { Dataset, Estimate, Municipality } from "@/types/dataset";
import type { MapPaint } from "./indicators";
import { estimateFor } from "./dataset";
import { riskTokens, riskMapColor } from "@/theme/tokens";

export const interventions = [
  { id: "ninguna", label: "Ninguna", help: "Predicción sin acciones adicionales." },
  {
    id: "retener_primerizos",
    label: "Retener primerizos",
    help: "La generación que tenía de 18 a 20 años en 2024, haya votado o no, mantiene su participación respecto de su municipio.",
  },
  {
    id: "jovenes_20_29",
    label: "Jóvenes 20–29",
    help: "Las personas de 20 a 29 años recortan a la mitad su distancia de participación con el resto del municipio.",
  },
  {
    id: "credencializacion",
    label: "Credencialización",
    help: "Nuevos votantes tramitan su credencial y votan como los jóvenes de su municipio en 2021. Crece también la lista: más votos no siempre significan un mayor porcentaje.",
  },
  {
    id: "combinada",
    label: "Las tres",
    help: "Las tres acciones juntas. No siempre es la opción con mayor porcentaje de participación.",
  },
] as const;
export const baselineId = "nac-estimado_int-ninguna";
export const historyYears = ["2009", "2012", "2015", "2018", "2021", "2024"] as const;
export const midtermYears = new Set(["2009", "2015", "2021"]);
export const riskNames: Record<string, string> = {
  alto: "Rojo · mayor riesgo",
  medio: "Amarillo · riesgo intermedio",
  bajo: "Verde · menor riesgo relativo",
  sin_estimacion: "Sin dato",
};
export const historyLegend = [
  { id: "0", label: "Menos de 40 %", color: "#DDE8EC" },
  { id: "1", label: "40 a menos de 50 %", color: "#A8C5D2" },
  { id: "2", label: "50 a menos de 60 %", color: "#729BB1" },
  { id: "3", label: "60 a menos de 70 %", color: "#426D88" },
  { id: "4", label: "70 % o más", color: "#23465F" },
  { id: "sin_casilla", label: "Sin casilla", color: "#9B9FA5" },
  { id: "sin_estimacion", label: "Sin dato", color: riskTokens.sin_estimacion.map },
];
export function indicator(item: Municipality, key: string): number | null {
  const value = item.indicators?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function hasEstimateReason(result: Estimate, reason: string) {
  return (result.reason ?? "").split("|").some((code) => code.trim() === reason);
}
/** D32: sin votos S3 conocidos tampoco se agregan altas al denominador. */
export function interventionNewRegistrants(
  item: Municipality,
  intervention: string,
  baseRisk: string
) {
  if (
    baseRisk !== "alto" ||
    !["credencializacion", "combinada"].includes(intervention) ||
    indicator(item, "interv_votos_credencializar") === null
  )
    return 0;
  return indicator(item, "interv_nuevos_en_lista") ?? 0;
}
export function historicalClass(item: Municipality, year: string) {
  if (item.historyStatus?.[year] === "sin_casilla") return "sin_casilla";
  const value = item.history[year];
  return value === null || value === undefined
    ? "sin_estimacion"
    : String(value < 0.4 ? 0 : value < 0.5 ? 1 : value < 0.6 ? 2 : value < 0.7 ? 3 : 4);
}
/** Los totales usan solo filas disponibles. Credencializar cambia también el denominador. */
export function forecastTotals(dataset: Dataset, rows: Municipality[], scenario: string) {
  const kind = dataset.scenarios.find((s) => s.id === scenario)?.intervention;
  let votes = 0,
    nominal = 0,
    baseVotes = 0,
    baseNominal = 0,
    red = 0,
    redPeople = 0,
    additional = 0,
    exits = 0,
    partialInterventions = 0;
  for (const item of rows) {
    const current = estimateFor(dataset, scenario, item.id);
    const base = estimateFor(dataset, baselineId, item.id);
    if (item.nominal === null || current.participation === null || base.participation === null)
      continue;
    const added = interventionNewRegistrants(item, kind ?? "ninguna", base.risk);
    votes += current.participation * (item.nominal + added);
    nominal += item.nominal + added;
    baseVotes += base.participation * item.nominal;
    baseNominal += item.nominal;
    if (current.risk === "alto") {
      red++;
      redPeople += item.nominal;
    }
    additional += current.additionalVotes ?? 0;
    if (base.risk === "alto" && current.risk !== "alto") exits++;
    if (hasEstimateReason(current, "intervencion_parcial")) partialInterventions++;
  }
  return {
    participation: nominal ? votes / nominal : null,
    baseParticipation: baseNominal ? baseVotes / baseNominal : null,
    nominal,
    baseNominal,
    red,
    redPeople,
    additional,
    exits,
    partialInterventions,
  };
}
export function readForecastQuery(dataset: Dataset, params: URLSearchParams) {
  const selected = dataset.municipalities.find((m) => m.id === params.get("municipio"));
  const rawState = params.get("entidad") ?? "";
  const state =
    selected?.stateCode ??
    (dataset.municipalities.some((m) => m.stateCode === rawState) ? rawState : "");
  const old = params.get("escenario") ?? "";
  const requested =
    params.get("intervencion") ??
    (old.includes("dirigida_rojos") ? "combinada" : old.split("_int-")[1]);
  const intervention = interventions.find((item) => item.id === requested)?.id ?? "ninguna";
  const historical =
    params.get("pestana") === "historico" ||
    (params.get("pestana") === "contexto" && params.get("indicador") === "historia");
  const year = historyYears.find((year) => year === params.get("anio")) ?? "2024";
  return {
    selected,
    state,
    intervention,
    scenario: `nac-estimado_int-${intervention}`,
    historical,
    year,
  };
}
export function forecastPaints(
  dataset: Dataset,
  scenario: string,
  historical: boolean,
  year: string,
  state: string,
  highlight: string,
  dark = false
): Record<string, MapPaint> {
  return Object.fromEntries(
    dataset.municipalities.map((item) => {
      const estimate = estimateFor(dataset, scenario, item.id);
      const category = historical ? historicalClass(item, year) : estimate.risk;
      const bin = historyLegend.find((entry) => entry.id === category);
      return [
        item.id,
        {
          color: historical ? bin!.color : riskMapColor(estimate.risk, dark),
          label: historical
            ? category === "sin_casilla"
              ? "Sin casilla: no se pudo votar"
              : bin!.label
            : riskNames[estimate.risk]!,
          value: historical
            ? category === "sin_casilla"
              ? null
              : (item.history[year] ?? null)
            : estimate.participation,
          dimmed: Boolean(
            (state && item.stateCode !== state) || (highlight && category !== highlight)
          ),
        },
      ];
    })
  );
}
