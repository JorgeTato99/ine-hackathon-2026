import type { Dataset, Municipality } from "@/types/dataset";
import { estimateFor } from "./dataset";
import type { MapPaint } from "./indicators";

function cell(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = typeof value === "string" && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function selectionCsv(
  dataset: Dataset,
  municipalities: Municipality[],
  scenario: string,
  context?: { title: string; paints: Record<string, MapPaint> }
) {
  if (!dataset.sample) {
    const indicators = Object.keys(
      dataset.municipalities.find((item) => item.hasData)?.indicators ?? {}
    ).filter((key) => !["cvegeo", "nombre_mpio", "nombre_edo"].includes(key));
    const fields = [
      "cvegeo",
      "nombre_mpio",
      "nombre_edo",
      "escenario_id",
      "part_pred",
      "part_pred_inf",
      "part_pred_sup",
      "riesgo_escenario",
      "votos_adicionales",
      "efecto_interv",
      "estado_estimacion",
      "motivo",
      "version_resultados",
      "vista",
      "valor_vista",
      "advertencia",
      ...indicators,
    ];
    const rows = municipalities.map((item) => {
      const result = estimateFor(dataset, scenario, item.id);
      return [
        item.id,
        item.name,
        item.state,
        scenario,
        result.participation,
        result.lower,
        result.upper,
        result.risk,
        result.additionalVotes,
        result.interventionEffect,
        result.state,
        result.reason,
        dataset.version,
        context?.title ?? "Pronóstico 2027",
        context?.paints[item.id]?.label ?? null,
        "2027: pronóstico condicionado; intervención: supuesto, no efecto medido",
        ...indicators.map((key) => item.indicators?.[key] ?? null),
      ]
        .map(cell)
        .join(",");
    });
    return [fields.map(cell).join(","), ...rows].join("\r\n") + "\r\n";
  }
  const fields = [
    "cvegeo",
    "municipio",
    "entidad",
    "escenario_id",
    "participacion_2027_ejemplo",
    "riesgo_ejemplo",
    "estado_estimacion",
    "motivo",
    "version_resultados",
    "advertencia",
    "fuente_historica",
    "unidad_participacion",
  ];
  const rows = municipalities.map((item) => {
    const estimate = estimateFor(dataset, scenario, item.id);
    return [
      item.id,
      item.name,
      item.state,
      scenario,
      estimate.participation,
      estimate.risk,
      estimate.state,
      estimate.reason,
      dataset.version,
      "Muestra de interfaz: 2027 ilustrativo, sin comparabilidad científica confirmada",
      "INE, Conteos Censales de Participación Ciudadana 2009–2024",
      "proporción 0–1; vacío indica ausencia",
    ]
      .map(cell)
      .join(",");
  });
  return [fields.map(cell).join(","), ...rows].join("\r\n") + "\r\n";
}
export function municipalityDocument(
  dataset: Dataset,
  municipality: Municipality,
  scenario: string,
  second?: string
) {
  return {
    version: dataset.version,
    sample: dataset.sample,
    warning: dataset.sample
      ? "2027 es ilustrativo; no es un pronóstico final."
      : "2027 es un pronóstico condicionado. Intervención: supuesto, no efecto medido.",
    units: "Participación en proporción de 0 a 1; ausencia es null.",
    municipality,
    scenario: dataset.scenarios.find((item) => item.id === scenario),
    result: estimateFor(dataset, scenario, municipality.id),
    geometry: dataset.geometry.metadata,
    comparisonPolicy: dataset.comparisonPolicy,
    source: dataset.source,
    metadataReference: dataset.sample
      ? "/data/muestra-0.3/metadatos.json"
      : `/data/${dataset.version}/metadatos.json`,
    historicalSource: "INE, Conteos Censales de Participación Ciudadana 2009–2024",
    secondReading: second
      ? {
          scenario: dataset.scenarios.find((item) => item.id === second),
          result: estimateFor(dataset, second, municipality.id),
          comparability:
            second !== scenario &&
            dataset.comparisonPolicy.status === "confirmed" &&
            dataset.comparisonPolicy.pairs.some(
              (pair) => pair.includes(scenario) && pair.includes(second)
            )
              ? "confirmed"
              : "pending",
        }
      : null,
  };
}
export function saveFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
