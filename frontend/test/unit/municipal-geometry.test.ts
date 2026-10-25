import { describe, expect, it } from "vitest";
import { parseMunicipalGeometry, municipalOutline } from "@/utils/municipal-geometry";
import type { Polygon } from "geojson";

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

describe("Contorno municipal de referencia", () => {
  const rectangle: Polygon = {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [4, 0],
        [4, 1],
        [0, 1],
        [0, 0],
      ],
    ],
  };
  it("conserva orientación norte, proporciones y margen sin deformar para llenar el cuadrado", () => {
    const path = municipalOutline(rectangle, 96, 8)!;
    const points = [...path.matchAll(/[ML]([\d.]+),([\d.]+)/g)].map((match) => [
      Number(match[1]),
      Number(match[2]),
    ]);
    expect(points).toHaveLength(5);
    expect(points[0]![1]).toBeGreaterThan(points[3]![1]!);
    expect(Math.min(...points.map((point) => point[0]!))).toBe(8);
    expect(Math.max(...points.map((point) => point[0]!))).toBe(88);
    const height =
      Math.max(...points.map((point) => point[1]!)) - Math.min(...points.map((point) => point[1]!));
    expect(height).toBeCloseTo(20, 1);
  });
  it("conserva huecos y partes separadas en un trazado con anillos cerrados", () => {
    const hole = [
      [1, 0.2],
      [2, 0.2],
      [2, 0.4],
      [1, 0.2],
    ];
    const path = municipalOutline(
      {
        type: "MultiPolygon",
        coordinates: [
          [...rectangle.coordinates, hole],
          [
            [
              [6, 0],
              [7, 0],
              [7, 1],
              [6, 0],
            ],
          ],
        ],
      },
      96,
      8
    )!;
    expect(path.match(/M/g)).toHaveLength(3);
    expect(path.match(/Z/g)).toHaveLength(3);
    expect(path).not.toMatch(/NaN|Infinity/);
  });
  it.each([NaN, Infinity, 86])("omite coordenadas no representables (%s)", (value) => {
    expect(
      municipalOutline(
        {
          type: "Polygon",
          coordinates: [
            [
              [0, value],
              [1, 0],
              [1, 1],
              [0, value],
            ],
          ],
        },
        96,
        8
      )
    ).toBeNull();
  });
  it("omite geometrías sin extensión y dimensiones que no dejan área útil", () => {
    expect(
      municipalOutline(
        {
          type: "Polygon",
          coordinates: [
            [
              [1, 0],
              [1, 1],
              [1, 2],
              [1, 0],
            ],
          ],
        },
        96,
        8
      )
    ).toBeNull();
    expect(municipalOutline(rectangle, 16, 8)).toBeNull();
    expect(municipalOutline({ type: "Polygon", coordinates: [] }, 96, 8)).toBeNull();
  });
});

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
