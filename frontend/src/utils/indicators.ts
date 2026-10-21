import type { Dataset, Municipality } from "@/types/dataset";
import { estimateFor, formatInteger, formatPercent } from "./dataset";
import { riskTokens, contextMapTokens } from "@/theme/tokens";
import { contextGuides, zoneLabels, boothLabels } from "@/content/reading-guide";

export const contextViews = {
  elecciones: contextGuides.elecciones.label,
  rezago: contextGuides.rezago.label,
  zonas: contextGuides.zonas.label,
  personas: contextGuides.personas.label,
  casillas: contextGuides.casillas.label,
  seguridad: contextGuides.seguridad.label,
  historia: contextGuides.historia.label,
} as const;
export type ContextView = keyof typeof contextViews;
export type Presentation = {
  tab: "pronostico" | "contexto";
  view: ContextView;
  group: string;
  security: string;
  year: string;
};
export type LegendItem = { label: string; color: string };
export type MapPaint = { color: string; label: string; value?: string | number | null };
export type ContextFilters = {
  tamano: string;
  ayuntamiento: string;
  costumbres: string;
  alerta: string;
};
export function readContextFilters(params: Pick<URLSearchParams, "get">): ContextFilters {
  const read = (key: string, allowed: string[]) =>
    allowed.includes(params.get(key) ?? "") ? params.get(key)! : "";
  return {
    tamano: read("tamano", ["pequeno", "medio", "grande", "mayor"]),
    ayuntamiento: read("ayuntamiento", ["si", "no"]),
    costumbres: read("costumbres", ["si", "no"]),
    alerta: read("alerta", ["con", "sin"]),
  };
}
export function applyContextFilters(items: Municipality[], filters: ContextFilters) {
  return items.filter((item) => {
    if (
      filters.ayuntamiento &&
      indicatorBoolean(item, "ayuntamiento_mismo_dia_2027") !== (filters.ayuntamiento === "si")
    )
      return false;
    if (
      filters.costumbres &&
      indicatorBoolean(item, "usos_y_costumbres") !== (filters.costumbres === "si")
    )
      return false;
    if (filters.alerta) {
      const alert = indicatorText(item, "alerta_sin_casilla");
      if (alert === null || (alert !== "sin antecedente") !== (filters.alerta === "con"))
        return false;
    }
    if (filters.tamano) {
      if (item.nominal === null) return false;
      const category =
        item.nominal < 5000
          ? "pequeno"
          : item.nominal < 20000
            ? "medio"
            : item.nominal < 100000
              ? "grande"
              : "mayor";
      if (category !== filters.tamano) return false;
    }
    return true;
  });
}
export const peopleGroups = {
  primerizos_votaron_2024: "18 a 20 años: votaron en 2024",
  jovenes_21_29_no_votaron_2024: "21 a 29 años: no votaron en 2024",
  nuevos_votantes_2027: "18 a 19 años en 2027 (estimación)",
  nuevos_sin_credencial_2027_si_se_repite_2021: "Sin credencial en 2027 (supuesto)",
} as const;
const blues = contextMapTokens.sequential;
const gray = contextMapTokens.missing;
const categories = contextMapTokens.categorical;
export function indicatorNumber(item: Municipality, key: string) {
  const value = item.indicators?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function indicatorText(item: Municipality, key: string) {
  const value = item.indicators?.[key];
  return typeof value === "string" ? value : null;
}
export function indicatorBoolean(item: Municipality, key: string) {
  const value = item.indicators?.[key];
  return typeof value === "boolean" ? value : null;
}
export function readPresentation(params: Pick<URLSearchParams, "get">): Presentation {
  const view = params.get("indicador") ?? "elecciones";
  const group = params.get("grupo") ?? "primerizos_votaron_2024";
  return {
    tab: params.get("pestana") === "contexto" ? "contexto" : "pronostico",
    view: Object.hasOwn(contextViews, view) ? (view as ContextView) : "elecciones",
    group: Object.hasOwn(peopleGroups, group) ? group : "primerizos_votaron_2024",
    security: ["homicidios", "institucion", "policia"].includes(params.get("seguridad") ?? "")
      ? params.get("seguridad")!
      : "homicidios",
    year: ["2009", "2012", "2015", "2018", "2021", "2024"].includes(params.get("anio") ?? "")
      ? params.get("anio")!
      : "2024",
  };
}
export function electionCategory(item: Municipality): string | null {
  const council = indicatorBoolean(item, "ayuntamiento_mismo_dia_2027");
  if (council === null) return null;
  if (council)
    return indicatorBoolean(item, "gobernador_mismo_dia_2027")
      ? "Ayuntamiento y gubernatura"
      : "Ayuntamiento, sin gubernatura";
  return indicatorBoolean(item, "usos_y_costumbres")
    ? "Sin ayuntamiento ese día · usos y costumbres"
    : "Sin ayuntamiento ese día · otros municipios";
}
export function historicalLabel(item: Municipality, year: string) {
  return item.historyStatus?.[year] === "sin_casilla"
    ? "Sin casilla: no se pudo votar"
    : formatPercent(item.history[year]);
}
function band(value: number, max: number) {
  return blues[Math.max(0, Math.min(6, Math.floor((value / Math.max(max, 1)) * 6)))]!;
}
export function mapPresentation(dataset: Dataset, presentation: Presentation) {
  const { view, group, year, security } = presentation;
  const title =
    presentation.tab === "pronostico"
      ? "Pronóstico 2027"
      : view === "historia"
        ? `Participación observada · ${year}`
        : view === "personas"
          ? `Personas · ${peopleGroups[group as keyof typeof peopleGroups]}`
          : view === "seguridad"
            ? `Seguridad · ${{ homicidios: "homicidios 2022–2024", institucion: "quién ejerce la seguridad", policia: "policía municipal" }[security]}`
            : contextViews[view];
  let legend: LegendItem[] = [];
  let description = contextGuides[view].reading;
  const paints: Record<string, MapPaint> = {};
  const distinct = [
    ...new Set(
      dataset.municipalities
        .map((item) => indicatorText(item, "quien_ejerce_seguridad"))
        .filter((value): value is string => value !== null)
    ),
  ].sort((a, b) => a.localeCompare(b, "es"));
  const maxPeople = Math.max(
    1,
    ...dataset.municipalities.map((item) => indicatorNumber(item, group) ?? 0)
  );
  const zoneColors: Record<string, string> = contextMapTokens.zones;
  if (view === "elecciones") {
    legend = [
      "Ayuntamiento y gubernatura",
      "Ayuntamiento, sin gubernatura",
      "Sin ayuntamiento ese día · usos y costumbres",
      "Sin ayuntamiento ese día · otros municipios",
    ].map((label, i) => ({ label, color: categories[i]! }));
  } else if (view === "zonas") {
    legend = Object.entries(zoneColors).map(([label, color]) => ({
      label: zoneLabels[label] ?? label,
      color,
    }));
  } else if (view === "casillas") {
    legend = [
      { label: boothLabels["recurrente"]!, color: "#8D76AE" },
      { label: boothLabels["antecedente"]!, color: "#C3AFD3" },
      { label: boothLabels["sin antecedente"]!, color: "#D9DDDF" },
    ];
  } else if (view === "seguridad" && security === "institucion") {
    legend = distinct.map((label, i) => ({ label, color: categories[i % categories.length]! }));
  } else if (view === "seguridad" && security === "policia") {
    legend = [
      { label: "Con policía municipal", color: "#759C81" },
      { label: "Sin policía municipal", color: "#8D76AE" },
    ];
  } else if (view === "rezago") {
    legend = Array.from({ length: 7 }, (_, i) => ({ label: `${i} elecciones`, color: blues[i]! }));
  } else if (view === "personas") {
    legend = [
      { label: "Menos personas", color: blues[0]! },
      { label: `Mayor: ${formatInteger(maxPeople)}`, color: blues[6]! },
    ];
  } else if (view === "historia") {
    legend = [
      { label: "Menor participación", color: blues[0]! },
      { label: "Mayor participación", color: blues[6]! },
      { label: "Sin casilla", color: "#8D76AE" },
    ];
  } else {
    legend = [
      { label: "Menor tasa", color: blues[0]! },
      { label: "Mayor tasa", color: blues[6]! },
    ];
  }
  for (const item of dataset.municipalities) {
    let label = "Sin dato",
      color: string = gray;
    let numeric: number | null = null;
    if (item.hasData) {
      if (view === "elecciones") label = electionCategory(item) ?? label;
      else if (view === "zonas") {
        const raw = indicatorText(item, "zona_participacion_2024");
        label = raw ? (zoneLabels[raw] ?? raw) : label;
      } else if (view === "casillas") {
        const raw = indicatorText(item, "alerta_sin_casilla");
        label = raw ? (boothLabels[raw] ?? raw) : label;
      } else if (view === "seguridad" && security === "institucion")
        label = indicatorText(item, "quien_ejerce_seguridad") ?? label;
      else if (view === "seguridad" && security === "policia") {
        const value = indicatorBoolean(item, "tiene_policia_municipal");
        if (value !== null) label = value ? "Con policía municipal" : "Sin policía municipal";
      } else {
        const value =
          view === "rezago"
            ? indicatorNumber(item, "elecciones_por_debajo_del_pais")
            : view === "personas"
              ? indicatorNumber(item, group)
              : view === "historia"
                ? (item.history[year] ?? null)
                : indicatorNumber(item, "percentil_homicidios_2022_2024");
        if (view === "historia" && item.historyStatus?.[year] === "sin_casilla") {
          label = "Sin casilla";
          color = "#8D76AE";
        } else if (value !== null) {
          numeric = value;
          label =
            view === "historia"
              ? formatPercent(value)
              : view === "rezago"
                ? `${value} elecciones`
                : view === "personas"
                  ? formatInteger(value)
                  : `${indicatorNumber(item, "tasa_homicidios_2022_2024")} homicidios por cada 100 mil habitantes al año`;
          color = band(
            value,
            view === "rezago" ? 6 : view === "personas" ? maxPeople : view === "historia" ? 1 : 100
          );
        }
      }
      color = legend.find((entry) => entry.label === label)?.color ?? (zoneColors[label] || color);
    }
    paints[item.id] = {
      color,
      label,
      value: label === "Sin dato" || label === "Sin casilla" ? null : (numeric ?? label),
    };
  }
  if (view === "elecciones")
    description +=
      " Ayuntamiento es el gobierno municipal; gubernatura es quien encabeza el gobierno del estado.";
  if (view === "seguridad")
    description +=
      security === "homicidios"
        ? " El color ordena las tasas de homicidios de 2022–2024, por cada 100 mil habitantes al año, de menor a mayor."
        : " El registro de policía e instituciones corresponde al 31 de diciembre de 2024 (CNGMD 2025).";
  return { title, description, legend: [...legend, { label: "Sin dato", color: gray }], paints };
}
export function controlCards(
  dataset: Dataset,
  items: Municipality[],
  scenario: string,
  presentation: Presentation
) {
  const rows = items.filter((item) => item.hasData),
    red = rows.filter((item) => item.baseRisk === "alto");
  const sum = (list: Municipality[], key: string) =>
    list.reduce((total, item) => total + (indicatorNumber(item, key) ?? 0), 0);
  const card = (label: string, value: number, detail?: string) => ({
    label,
    value: formatInteger(value),
    detail,
  });
  if (presentation.tab === "pronostico") {
    const info = dataset.scenarios.find((s) => s.id === scenario);
    const cards = [
      card("Rojos sin intervención", red.length),
      card(
        "Personas registradas en rojos · 2024",
        red.reduce((n, item) => n + (item.nominal ?? 0), 0)
      ),
      {
        label: "Participación supuesta del país",
        value: formatPercent(dataset.nationalLevels?.[info?.national ?? ""]),
        detail: "Es un punto de partida, no una predicción",
      },
    ];
    if (info?.intervention === "dirigida_rojos")
      cards.push(
        card(
          "Votos adicionales · supuesto",
          rows.reduce(
            (n, item) => n + (estimateFor(dataset, scenario, item.id).additionalVotes ?? 0),
            0
          )
        ),
        card(
          "Salen del rojo",
          red.filter((item) =>
            ["medio", "bajo"].includes(estimateFor(dataset, scenario, item.id).risk)
          ).length,
          `${formatInteger(red.filter((item) => ["medio", "bajo"].includes(estimateFor(dataset, scenario, item.id).risk)).reduce((sum, item) => sum + (item.nominal ?? 0), 0))} personas registradas · 2024`
        ),
        card(
          "Rojos con intervención",
          rows.filter((item) => estimateFor(dataset, scenario, item.id).risk === "alto").length
        )
      );
    else cards.push(card("Con estimación", rows.length));
    return cards;
  }
  switch (presentation.view) {
    case "elecciones": {
      const redWithoutCouncil = red.filter(
        (item) => indicatorBoolean(item, "ayuntamiento_mismo_dia_2027") === false
      );
      const redWithCouncil = red.filter(
        (item) => indicatorBoolean(item, "ayuntamiento_mismo_dia_2027") === true
      );
      return [
        "Ayuntamiento y gubernatura",
        "Ayuntamiento, sin gubernatura",
        "Sin ayuntamiento ese día · usos y costumbres",
        "Sin ayuntamiento ese día · otros municipios",
      ]
        .map((category) => {
          const group = rows.filter((item) => electionCategory(item) === category);
          return card(
            category,
            group.length,
            `${formatInteger(group.reduce((n, item) => n + (item.nominal ?? 0), 0))} personas registradas · 2024`
          );
        })
        .concat(
          card(
            "Sin elección municipal ese día",
            rows.filter((item) => indicatorBoolean(item, "ayuntamiento_mismo_dia_2027") === false)
              .length
          ),
          card(
            "Rojos sin ayuntamiento ese día",
            redWithoutCouncil.length,
            `${formatInteger(redWithoutCouncil.reduce((n, item) => n + (item.nominal ?? 0), 0))} personas registradas · 2024`
          ),
          card(
            "Rojos con ayuntamiento ese día",
            redWithCouncil.length,
            `${formatInteger(redWithCouncil.reduce((n, item) => n + (item.nominal ?? 0), 0))} personas registradas · 2024`
          )
        );
    }
    case "rezago": {
      const group = rows.filter(
        (item) => indicatorNumber(item, "elecciones_por_debajo_del_pais") === 6
      );
      return [
        card("Por debajo en las 6 elecciones", group.length),
        card(
          "Personas registradas · 2024",
          group.reduce((n, item) => n + (item.nominal ?? 0), 0)
        ),
      ];
    }
    case "zonas":
      return [
        "fría (bajo-bajo)",
        "caliente (alto-alto)",
        "bajo rodeado de alto",
        "alto rodeado de bajo",
        "no significativa",
      ]
        .map((label) =>
          card(
            zoneLabels[label] ?? label,
            rows.filter((item) => indicatorText(item, "zona_participacion_2024") === label).length
          )
        )
        .concat(
          card(
            "Sin este dato",
            rows.filter((item) => indicatorText(item, "zona_participacion_2024") === null).length
          )
        );
    case "personas":
      return [
        card("Personas del grupo seleccionado", sum(rows, presentation.group)),
        card("En municipios rojos sin intervención", sum(red, presentation.group)),
        card(
          "Municipios sin este dato",
          rows.filter((item) => indicatorNumber(item, presentation.group) === null).length
        ),
      ];
    case "casillas":
      return ["recurrente", "antecedente", "sin antecedente"].map((label) =>
        card(
          boothLabels[label] ?? label,
          rows.filter((item) => indicatorText(item, "alerta_sin_casilla") === label).length
        )
      );
    case "seguridad":
      return [
        card(
          "Sin policía municipal",
          rows.filter((item) => indicatorBoolean(item, "tiene_policia_municipal") === false).length
        ),
        card(
          "Sin dato de policía",
          rows.filter((item) => indicatorBoolean(item, "tiene_policia_municipal") === null).length
        ),
        card(
          "Sin tasa de homicidios",
          rows.filter((item) => indicatorNumber(item, "tasa_homicidios_2022_2024") === null).length
        ),
      ];
    case "historia":
      return [
        card(
          `Con dato de ${presentation.year}`,
          rows.filter(
            (item) =>
              item.history[presentation.year] !== null &&
              item.history[presentation.year] !== undefined
          ).length,
          "Incluye registros marcados sin casilla"
        ),
        card(
          "Sin casilla",
          rows.filter((item) => item.historyStatus?.[presentation.year] === "sin_casilla").length
        ),
        card(
          "Sin dato del año",
          rows.filter(
            (item) =>
              item.history[presentation.year] === null ||
              item.history[presentation.year] === undefined
          ).length
        ),
      ];
  }
}

export function forecastLegend(): LegendItem[] {
  return (["alto", "medio", "bajo", "sin_estimacion"] as const).map((risk) => ({
    label: {
      alto: "Rojo · mayor riesgo relativo",
      medio: "Amarillo · riesgo relativo intermedio",
      bajo: "Verde · resto",
      sin_estimacion: "Sin dato",
    }[risk],
    color: riskTokens[risk].map,
  }));
}
