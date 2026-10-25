"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Dataset, Municipality } from "@/types/dataset";
import {
  municipalGeometryKey,
  municipalOutline,
  type MunicipalGeometry,
} from "@/utils/municipal-geometry";
import { identityTokens, typeScale } from "@/theme/tokens";
import { TraceRule } from "@/components/ui/trace-rule";

export function MunicipalIdentity({
  dataset,
  municipality,
  compact = false,
}: {
  dataset: Dataset;
  municipality: Municipality;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const subscribe = useCallback(
    (notify: () => void) => queryClient.getQueryCache().subscribe(notify),
    [queryClient]
  );
  const snapshot = useCallback(
    () => queryClient.getQueryData<MunicipalGeometry>(municipalGeometryKey(dataset)),
    [queryClient, dataset]
  );
  // Leer sin crear consultas ni modificar las opciones de carga que pertenecen al mapa.
  const geometry = useSyncExternalStore(subscribe, snapshot, () => undefined);
  const feature = useMemo(
    () => geometry?.features.find((entry) => entry.properties.CVEGEO === municipality.id),
    [geometry, municipality.id]
  );
  const portrait = identityTokens.territory;
  const width = compact ? portrait.compactWidth : portrait.width;
  const outline = useMemo(
    () => (feature ? municipalOutline(feature.geometry, portrait.viewBox, portrait.padding) : null),
    [feature, portrait]
  );

  return (
    <Box sx={{ containerType: "inline-size" }}>
      {!compact && <TraceRule />}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: outline ? `minmax(0,1fr) ${width}px` : "minmax(0,1fr)",
          alignItems: "center",
          gap: 1.5,
          mt: compact ? 0 : 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="primary.main" sx={{ display: "block" }}>
            {compact ? "Clave" : "Ficha municipal · Clave"} {municipality.id}
          </Typography>
          <Typography
            component="h2"
            variant="h2"
            sx={{
              ...typeScale.recordTitle,
              fontSize: compact ? portrait.compactTitleSize : portrait.titleSize,
              overflowWrap: "anywhere",
              mt: 0.5,
            }}
          >
            {municipality.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {municipality.state}
          </Typography>
        </Box>
        {outline && (
          <Box component="figure" sx={{ m: 0, color: "primary.main", textAlign: "center" }}>
            <Box
              component="svg"
              role="img"
              aria-label={`Contorno de ${municipality.name}: geometría simplificada, sin escala comparativa`}
              data-municipal-outline={municipality.id}
              viewBox={`0 0 ${portrait.viewBox} ${portrait.viewBox}`}
              sx={{ display: "block", width: "100%", height: width }}
            >
              <path
                d={outline}
                fill="currentColor"
                fillOpacity={portrait.fillOpacity}
                stroke="currentColor"
                strokeWidth={portrait.stroke}
                strokeLinejoin="round"
                fillRule="evenodd"
              />
            </Box>
            <Typography component="figcaption" variant="caption" color="text.secondary">
              Sin escala
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
