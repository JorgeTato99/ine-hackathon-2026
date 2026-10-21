import type { Dataset, Estimate, Municipality } from "@/types/dataset";

const baseMunicipality: Municipality = {
  id: "01001",
  name: "Aguascalientes",
  state: "Aguascalientes",
  stateCode: "01",
  nominal: 100,
  history: { "2009": 0.4, "2012": 0.5, "2015": 0.45, "2018": 0.6, "2021": 0.5, "2024": 0.6 },
  historyIssue: null,
  hasData: true,
  hasGeometry: true,
};
const estimate: Estimate = {
  participation: 0.5,
  lower: null,
  upper: null,
  risk: "medio",
  state: "estimado",
  reason: null,
};
export function datasetFixture(): Dataset {
  const municipalities = [
    baseMunicipality,
    { ...baseMunicipality, id: "01002", name: "Asientos", nominal: 0, history: { "2024": 0 } },
    {
      ...baseMunicipality,
      id: "16064",
      name: "Parácuaro",
      state: "Michoacán",
      stateCode: "16",
      history: { "2018": 0.6, "2021": null, "2024": 0.4 },
      historyIssue: "Incidencia de 2021: dato omitido",
    },
    {
      ...baseMunicipality,
      id: "01099",
      name: "Sin registro",
      nominal: null,
      hasData: false,
      hasGeometry: false,
      history: {},
    },
  ];
  return structuredClone({
    schemaVersion: 1,
    version: "fixture-estructural",
    sample: true,
    generatedAtSource: "2026-10-17",
    municipalities,
    scenarios: [
      { id: "base", national: "medio", intervention: "ninguna", year: 2027 },
      { id: "con", national: "medio", intervention: "alta", year: 2027 },
      { id: "otro", national: "alto", intervention: "ninguna", year: 2027 },
    ],
    estimates: {
      base: {
        "01001": estimate,
        "01002": { ...estimate, participation: 0, lower: 0, upper: 0.1, risk: "bajo" },
        "16064": {
          ...estimate,
          risk: "alto",
          state: "baja_precision",
          reason: "historia_incompleta",
        },
      },
      con: {
        "01001": estimate,
        "01002": { ...estimate, participation: 0, risk: "bajo" },
        "16064": { ...estimate, risk: "alto" },
      },
      otro: { "01001": { ...estimate, participation: 0.6 } },
    },
    comparisonPolicy: { status: "pending", pairs: [] },
    warnings: ["2027 ilustrativo"],
    geometry: {
      path: "/data/municipios.geojson",
      features: 4,
      metadata: {
        captured: "2026-10-16",
        source: "INEGI, fixture",
        transformations: "Fixture sin geometría real",
        sourceMetadata: [],
      },
    },
  } satisfies Dataset);
}
