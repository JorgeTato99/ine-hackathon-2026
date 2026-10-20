import { statSync } from "node:fs";
import { resolve } from "node:path";
import manifest from "../../public/data/manifest.json";
import { resultsRelease } from "./release";
import type { FileResource } from "@/components/editorial/file-card";

const files: Record<string, { bytes: number }> = manifest.files;
function resource(file: Omit<FileResource, "bytes">): FileResource {
  const key = file.href.replace("/data/", "");
  const bytes =
    key === "manifest.json"
      ? statSync(resolve(process.cwd(), "public/data/manifest.json")).size
      : files[key]?.bytes;
  if (bytes === undefined) throw new Error(`Archivo no registrado en el manifiesto: ${key}`);
  return { ...file, bytes };
}

export const dataLibrary = [
  {
    title: "Tablas y su contexto",
    description:
      "Historia reconstruida, indicadores y pronósticos precalculados de la entrega científica.",
    files: [
      resource({
        title: "Historia municipal",
        description:
          "Identidad, historia 2009–2024, semáforo e indicadores. Original conservado sin alterar.",
        href: `/data/${resultsRelease.version}/municipios.csv`,
        format: "CSV",
        unit: "Una fila por CVEGEO · Historia y auxiliares",
      }),
      resource({
        title: "Pronósticos y escenarios 2027",
        description:
          "Seis escenarios: tres niveles nacionales, sin y con intervención. La intervención es un supuesto, no un efecto medido.",
        href: `/data/${resultsRelease.version}/escenarios_2027.csv`,
        format: "CSV",
        unit: "Una fila por CVEGEO + escenario_id",
      }),
      resource({
        title: "Metadatos recibidos",
        description:
          "Versión, modelo, unidades, fuentes y advertencias originales. La web consulta los resultados, no ejecuta las fórmulas del modelo.",
        href: `/data/${resultsRelease.version}/metadatos.json`,
        format: "JSON",
        unit: "Descripción del corte original",
      }),
    ],
  },
  {
    title: "Geometría para visualización",
    description:
      "La misma capa municipal en dos formatos, con indicadores y resultados de los seis escenarios.",
    files: [
      resource({
        title: "Cartografía GeoJSON",
        description:
          "Polígonos simplificados, indicadores y estimaciones por escenario, enlazados por CVEGEO.",
        href: `/data/${resultsRelease.version}/municipios.geojson`,
        format: "GeoJSON",
        unit: "Una geometría por CVEGEO · EPSG:4326",
      }),
      resource({
        title: "Cartografía GeoPackage",
        description:
          "Capa resultados_2027 con la misma geometría, indicadores y escenarios; lista para herramientas SIG.",
        href: `/data/${resultsRelease.version}/municipios.gpkg`,
        format: "GPKG",
        unit: "Capa resultados_2027 · EPSG:4326",
      }),
    ],
  },
  {
    title: "Procedencia de la publicación",
    description: "El vínculo entre lo que se consulta y los archivos de este corte.",
    files: [
      resource({
        title: "Manifiesto de publicación",
        description:
          "Huellas SHA-256, advertencias y metadatos cartográficos por entidad para comprobar la identidad de los recursos.",
        href: "/data/manifest.json",
        format: "JSON",
        unit: `Corte ${manifest.version} · Integridad de archivos`,
      }),
    ],
  },
] as const;
