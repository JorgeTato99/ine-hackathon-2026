import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";

export type MunicipalGeometry = FeatureCollection<
  Polygon | MultiPolygon,
  { CVEGEO: string; CVE_ENT?: string }
>;

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
