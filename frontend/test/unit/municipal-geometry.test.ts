import { describe, expect, it } from "vitest";
import { parseMunicipalGeometry } from "@/utils/municipal-geometry";

const geometry = () => ({
  type: "FeatureCollection",
  features: ["01001", "01002"].map((CVEGEO) => ({
    type: "Feature",
    properties: { CVEGEO },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [0, 1],
          [0, 0],
        ],
      ],
    },
  })),
});
const ids = new Set(["01001", "01002"]);

describe("Contrato de identidad de la cartografía", () => {
  it("conserva claves con ceros, propiedades y coordenadas del recurso válido", () => {
    const data = geometry();
    expect(parseMunicipalGeometry(data, 2, ids)).toBe(data);
    const multi = {
      ...data,
      features: [
        {
          ...data.features[0],
          geometry: { type: "MultiPolygon", coordinates: [data.features[0]!.geometry.coordinates] },
        },
        data.features[1],
      ],
    };
    expect(parseMunicipalGeometry(multi, 2, ids)).toBe(multi);
  });
  it.each([
    null,
    0,
    [],
    {},
    { type: "FeatureCollection", features: null },
    { ...geometry(), features: [] },
  ])("rechaza un documento sin el universo acordado: %j", (value) => {
    expect(() => parseMunicipalGeometry(value, 2, ids)).toThrow(/La tabla sigue disponible/);
  });
  it("rechaza cobertura incompatible aunque el número de filas coincida", () => {
    const duplicate = geometry();
    duplicate.features[1]!.properties.CVEGEO = "01001";
    expect(() => parseMunicipalGeometry(duplicate, 2, ids)).toThrow();
    const foreign = geometry();
    foreign.features[1]!.properties.CVEGEO = "02001";
    expect(() => parseMunicipalGeometry(foreign, 2, ids)).toThrow();
    foreign.features[1]!.properties.CVEGEO = "1002";
    expect(() => parseMunicipalGeometry(foreign, 2, ids)).toThrow();
    expect(() => parseMunicipalGeometry(geometry(), 2, new Set(["01001"]))).toThrow();
  });
  it.each([
    null,
    { type: "Feature" },
    { ...geometry().features[0], type: "wrong" },
    { ...geometry().features[0], properties: null },
    { ...geometry().features[0], geometry: null },
    { ...geometry().features[0], geometry: { type: "Point", coordinates: [0, 0] } },
    { ...geometry().features[0], geometry: { type: "Polygon", coordinates: [] } },
  ])("rechaza entidades incompatibles con polígonos municipales: %j", (feature) => {
    expect(() =>
      parseMunicipalGeometry({ ...geometry(), features: [feature, geometry().features[1]] }, 2, ids)
    ).toThrow();
  });
});
