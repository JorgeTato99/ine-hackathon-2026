"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useColorScheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import type { Dataset } from "@/types/dataset";
import { parseMunicipalGeometry } from "@/utils/municipal-geometry";
import { radii } from "@/theme/tokens";
import { createTerritorialMap, type TerritorialMapController } from "./leaflet-map";
import type { MapPaint } from "@/utils/indicators";

type Props = {
  dataset: Dataset;
  visibleIds: string[];
  selectedId: string;
  scenario: string;
  stateFilter: string;
  onSelect: (code: string) => void;
  mapMode?: boolean;
  panelOpen?: boolean;
  paints?: Record<string, MapPaint> | undefined;
};

export default function TerritorialMap({
  dataset,
  visibleIds,
  selectedId,
  scenario,
  stateFilter,
  onSelect,
  mapMode = false,
  panelOpen = false,
  paints,
}: Props) {
  const target = useRef<HTMLDivElement>(null);
  const controller = useRef<TerritorialMapController | null>(null);
  const handler = useRef(onSelect);
  const { mode, systemMode } = useColorScheme();
  const dark = (mode === "system" ? systemMode : mode) === "dark";
  const [rendererError, setRendererError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const current = useRef({
    visibleIds,
    selectedId,
    scenario,
    stateFilter,
    dark,
    mapMode,
    panelOpen,
    paints,
  });
  const geometry = useQuery({
    queryKey: [
      "municipal-geometry",
      dataset.version,
      dataset.geometry.path,
      dataset.geometry.features,
    ],
    staleTime: Infinity,
    queryFn: async ({ signal }) => {
      const response = await fetch(dataset.geometry.path, { signal });
      if (!response.ok)
        throw new Error("No se pudo cargar la cartografía. La tabla sigue disponible.");
      const data: unknown = await response.json();
      return parseMunicipalGeometry(
        data,
        dataset.geometry.features,
        new Set(dataset.municipalities.filter((m) => m.hasGeometry).map((m) => m.id))
      );
    },
  });
  useEffect(() => {
    handler.current = onSelect;
    current.current = {
      visibleIds,
      selectedId,
      scenario,
      stateFilter,
      dark,
      mapMode,
      panelOpen,
      paints,
    };
  }, [onSelect, visibleIds, selectedId, scenario, stateFilter, dark, mapMode, panelOpen, paints]);
  useEffect(() => {
    const element = target.current;
    if (!element || !geometry.data || geometry.isError) return;
    let instance: TerritorialMapController | null = null;
    // Esperar al layout antes de medir el contenedor del mapa.
    const frame = requestAnimationFrame(() => {
      try {
        instance = createTerritorialMap(element, geometry.data, dataset, current.current, (id) =>
          handler.current(id)
        );
        controller.current = instance;
      } catch (error) {
        setRendererError(
          error instanceof Error
            ? error.message
            : "No se pudo iniciar el mapa. La tabla sigue disponible."
        );
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      instance?.dispose();
      controller.current = null;
    };
  }, [geometry.data, geometry.isError, dataset, attempt]);
  useEffect(() => {
    controller.current?.update({
      visibleIds,
      selectedId,
      scenario,
      stateFilter,
      dark,
      mapMode,
      panelOpen,
      paints,
    });
  }, [
    geometry.data,
    visibleIds,
    selectedId,
    scenario,
    stateFilter,
    dark,
    attempt,
    mapMode,
    panelOpen,
    paints,
  ]);

  if (geometry.isPending)
    return (
      <Box sx={{ p: 3, height: "100%" }}>
        <Skeleton variant="rounded" height="100%" />
        <span role="status">Cargando los límites de los municipios…</span>
      </Box>
    );
  if (geometry.isError || rendererError)
    return (
      <Alert
        severity="warning"
        action={
          <Button
            onClick={() => {
              setRendererError(null);
              setAttempt((n) => n + 1);
              if (geometry.isError) void geometry.refetch();
            }}
          >
            Reintentar
          </Button>
        }
      >
        No pudimos mostrar el mapa. Puedes reintentar o usar la tabla para consultar y seleccionar
        municipios.
      </Alert>
    );
  return (
    <Box
      sx={{
        position: "relative",
        isolation: "isolate",
        height: "100%",
        bgcolor: dark ? "#252C39" : "#EEF0EB",
      }}
    >
      <Box
        ref={target}
        role="region"
        tabIndex={0}
        aria-label="Mapa municipal interactivo. Usa más y menos para zoom y flechas para desplazarte; también puedes seleccionar desde la tabla."
        data-pw="territorial-map"
        sx={{ height: "100%", width: "100%", zIndex: 0, "& canvas": { display: "block" } }}
      />
      {!visibleIds.length && (
        <Box
          role="status"
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            p: 4,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          No hay municipios con estos filtros. Quita algún filtro o cambia la búsqueda.
        </Box>
      )}
      <Box
        sx={{
          position: "absolute",
          right: 12,
          top: 12,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: radii.panel,
          p: 0.5,
          boxShadow: "0 2px 8px #00000012",
          zIndex: 2,
        }}
      >
        <Button
          size="small"
          aria-label="Acercar mapa"
          onClick={() => controller.current?.zoom(1)}
          sx={{ minWidth: 36, fontSize: 22 }}
        >
          +
        </Button>
        <Button
          size="small"
          aria-label="Alejar mapa"
          onClick={() => controller.current?.zoom(-1)}
          sx={{ minWidth: 36, fontSize: 22 }}
        >
          −
        </Button>
        <Button
          size="small"
          aria-label="MX · Restablecer vista de México"
          onClick={() => {
            controller.current?.reset();
            handler.current("");
          }}
          sx={{ minWidth: 36, fontSize: 11 }}
        >
          MX
        </Button>
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 8,
          left: 8,
          right: 8,
          width: "fit-content",
          maxWidth: "calc(100% - 16px)",
          bgcolor: "background.paper",
          px: 1,
          py: 0.4,
          borderRadius: radii.control,
          fontSize: 11,
          color: "text.secondary",
          zIndex: 2,
        }}
      >
        INEGI · Cartografía simplificada para visualización · captura 16 oct 2026
      </Box>
    </Box>
  );
}
