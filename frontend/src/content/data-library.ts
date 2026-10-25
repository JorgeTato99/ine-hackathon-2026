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
    title: "Paquete del mapa y base de entrega",
    description:
      "Mapa portable, tablas, Excel, diccionario, metadatos y enlace al sitio. No sustituye el reporte, la presentación ni las cartas del concurso.",
    files: [
      resource({
        title: "Mapa y base de datos completos",
        description:
          "ZIP verificado con las cinco opciones de 2027, GeoPackage y base original. Puede abrirse el mapa sin Internet con QGIS.",
        href: `/data/${resultsRelease.version}/mapa-escenarios.zip`,
        format: "ZIP",
        unit: "Componente del mapa · archivos originales y manifiesto",
      }),
      resource({
        title: "Base de datos en Excel",
        description: "Libro original del equipo de datos con las tablas de la entrega.",
        href: `/data/${resultsRelease.version}/base-datos/base-datos-reto2-ine-2026.xlsx`,
        format: "XLSX",
        unit: "Historia, municipios y escenarios",
      }),
      resource({
        title: "Diccionario de variables",
        description: "Nombres, unidades y significado de las columnas de la base.",
        href: `/data/${resultsRelease.version}/base-datos/diccionario.csv`,
        format: "CSV",
        unit: "Definiciones de las variables",
      }),
      resource({
        title: "Historia municipal en tabla larga",
        description:
          "Datos históricos por municipio y elección. En esta tabla la participación va de 0 a 100; en los archivos del mapa va de 0 a 1.",
        href: `/data/${resultsRelease.version}/base-datos/historia_municipal.csv`,
        format: "CSV",
        unit: "Una fila por municipio y elección",
      }),
    ],
  },
  {
    title: "Tablas para consultar las cifras",
    description: "Dos tablas CSV y un archivo que explica sus datos, fuentes y límites.",
    files: [
      resource({
        title: "Historia municipal",
        description:
          "Identidad, historia 2009–2024, semáforo e indicadores. Original conservado sin alterar.",
        href: `/data/${resultsRelease.version}/municipios.csv`,
        format: "CSV",
        unit: "Una fila por municipio · Clave de cinco dígitos",
      }),
      resource({
        title: "Pronósticos y escenarios 2027",
        description:
          "Cinco escenarios: sin intervención y cuatro tipos de intervención supuesta. El nivel nacional estimado es 51.4 %. No son efectos medidos.",
        href: `/data/${resultsRelease.version}/escenarios_2027.csv`,
        format: "CSV",
        unit: "Una fila por municipio y escenario",
      }),
      resource({
        title: "Guía de los datos y del modelo",
        description:
          "Explica la versión, el modelo, las unidades, las fuentes y las advertencias. Archivo JSON para consulta con otras herramientas.",
        href: `/data/${resultsRelease.version}/metadatos.json`,
        format: "JSON",
        unit: "Descripción de la entrega científica original",
      }),
    ],
  },
  {
    title: "Archivos para abrir el mapa",
    description:
      "Los mismos límites municipales en dos formatos, con indicadores y resultados de los cinco escenarios. Para programas de mapas como QGIS.",
    files: [
      resource({
        title: "Cartografía GeoJSON",
        description:
          "Límites municipales simplificados, indicadores y estimaciones por escenario. Cada municipio conserva su clave de cinco dígitos.",
        href: `/data/${resultsRelease.version}/municipios.geojson`,
        format: "GeoJSON",
        unit: "Un municipio por elemento · Coordenadas EPSG:4326",
      }),
      resource({
        title: "Cartografía GeoPackage",
        description:
          "La misma información del GeoJSON, en un solo archivo para programas de mapas. La capa se llama resultados_2027.",
        href: `/data/${resultsRelease.version}/municipios.gpkg`,
        format: "GPKG",
        unit: "Capa resultados_2027 · EPSG:4326",
      }),
    ],
  },
  {
    title: "Verificar los archivos descargados",
    description:
      "Para comprobar de qué entrega proviene cada archivo y que su contenido no cambió.",
    files: [
      resource({
        title: "Manifiesto de publicación",
        description:
          "Incluye una huella digital (SHA-256) de cada archivo, advertencias y la fuente del mapa por estado. Permite verificar su contenido con otras herramientas.",
        href: "/data/manifest.json",
        format: "JSON",
        unit: `Corte ${manifest.version} · Integridad de archivos`,
      }),
    ],
  },
] as const;
