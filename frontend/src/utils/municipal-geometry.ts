import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { Dataset } from "@/types/dataset";

export type MunicipalGeometry = FeatureCollection<
  Polygon | MultiPolygon,
  { CVEGEO: string; CVE_ENT?: string }
>;

export function municipalGeometryKey(dataset: Pick<Dataset, "version" | "geometry">) {
  return [
    "municipal-geometry",
    dataset.version,
    dataset.geometry.path,
    dataset.geometry.features,
  ] as const;
}

/** Ajusta la geometría al retrato con la misma proyección Web Mercator del mapa. */
export function municipalOutline(
  geometry: Polygon | MultiPolygon,
  size: number,
  padding: number
): string | null {
  if (!Number.isFinite(size) || !Number.isFinite(padding) || padding < 0 || size <= padding * 2)
    return null;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const rings: [number, number][][] = [];
  let west = Infinity,
    east = -Infinity,
    south = Infinity,
    north = -Infinity;
  for (const polygon of polygons) {
    if (!Array.isArray(polygon) || !polygon.length) return null;
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) return null;
      const points: [number, number][] = [];
      for (const coordinate of ring) {
        if (!Array.isArray(coordinate)) return null;
        const [longitude, latitude] = coordinate;
        if (
          typeof longitude !== "number" ||
          typeof latitude !== "number" ||
          !Number.isFinite(longitude) ||
          !Number.isFinite(latitude) ||
          Math.abs(longitude) > 180 ||
          Math.abs(latitude) > 85.05112878
        )
          return null;
        const y = (Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) * 180) / Math.PI;
        points.push([longitude, y]);
        west = Math.min(west, longitude);
        east = Math.max(east, longitude);
        south = Math.min(south, y);
        north = Math.max(north, y);
      }
      rings.push(points);
    }
  }
  const width = east - west,
    height = north - south;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  const scale = (size - 2 * padding) / Math.max(width, height);
  const left = (size - width * scale) / 2,
    top = (size - height * scale) / 2;
  return rings
    .map(
      (ring) =>
        ring
          .map(
            ([x, y], index) =>
              `${index ? "L" : "M"}${(left + (x - west) * scale).toFixed(2)},${(top + (north - y) * scale).toFixed(2)}`
          )
          .join("") + "Z"
    )
    .join("");
}

/** Valida identidad y cobertura; la validez geométrica se comprueba al preparar los datos. */
export function parseMunicipalGeometry(
  value: unknown,
  expectedCount: number,
  expectedIds: ReadonlySet<string>
): MunicipalGeometry {
  const fail = () => {
    throw new Error("La cartografía no coincide con este corte. La tabla sigue disponible.");
  };
  if (!value || typeof value !== "object") return fail();
  const data = value as Record<string, unknown>;
  if (
    data.type !== "FeatureCollection" ||
    !Array.isArray(data.features) ||
    data.features.length !== expectedCount ||
    expectedIds.size !== expectedCount
  )
    return fail();
  const seen = new Set<string>();
  for (const raw of data.features) {
    if (!raw || typeof raw !== "object") return fail();
    const feature = raw as Record<string, unknown>;
    if (
      feature.type !== "Feature" ||
      !feature.properties ||
      typeof feature.properties !== "object" ||
      !feature.geometry ||
      typeof feature.geometry !== "object"
    )
      return fail();
    const properties = feature.properties as Record<string, unknown>;
    const geometry = feature.geometry as Record<string, unknown>;
    const id = properties.CVEGEO;
    if (typeof id !== "string" || !/^\d{5}$/.test(id) || !expectedIds.has(id) || seen.has(id))
      return fail();
    if (
      !["Polygon", "MultiPolygon"].includes(String(geometry.type)) ||
      !Array.isArray(geometry.coordinates) ||
      !geometry.coordinates.length
    )
      return fail();
    seen.add(id);
  }
  return value as MunicipalGeometry;
}
