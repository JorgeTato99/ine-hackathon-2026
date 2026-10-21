"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { RiskBadge } from "@/components/ui/risk-badge";
import type { Municipality } from "@/types/dataset";
import type { Risk } from "@/theme/tokens";
import { radii, explorerLayout, riskTokens } from "@/theme/tokens";
import { RiskLegend } from "./risk-legend";

export type MapPanel = "filters" | "scenarios" | "detail" | null;
export function MapModeChrome({
  search,
  count,
  filterCount,
  error,
  municipality,
  singleResult,
  risk,
  panel,
  filters,
  scenarios,
  details,
  onSearch,
  onExit,
  onPanel,
  onClosePanel,
  onDownload,
  onTable,
  onSelect,
  sample = true,
  viewLabel,
  legend,
  selectionLabel,
}: {
  search: string;
  count: number;
  filterCount: number;
  error: string | null;
  municipality: Municipality | undefined;
  singleResult: Municipality | undefined;
  risk: Risk;
  panel: MapPanel;
  filters: ReactNode;
  scenarios: ReactNode;
  details: ReactNode;
  onSearch: (value: string) => void;
  onExit: () => void;
  onPanel: (panel: Exclude<MapPanel, null>) => void;
  onClosePanel: () => void;
  onDownload: () => void;
  onTable: () => void;
  onSelect: (id: string) => void;
  sample?: boolean;
  viewLabel?: string | undefined;
  legend?: ReactNode;
  selectionLabel?: string | undefined;
}) {
  const [legendOpen, setLegendOpen] = useState(true);
  const titles = {
    filters: "Filtros de consulta",
    scenarios: sample ? "Configurar escenarios" : "Elegir datos y escenarios",
    detail: "Ficha municipal",
  };
  return (
    <>
      <Paper
        data-pw="map-mode-controls"
        variant="outlined"
        sx={{
          position: "absolute",
          zIndex: 5,
          top: { xs: 8, md: 16 },
          left: { xs: 8, md: 16 },
          width: {
            xs: `min(${explorerLayout.toolbar}px, calc(100% - ${explorerLayout.zoomReserve}px))`,
            md: explorerLayout.toolbar,
          },
          "@media (min-width:780px) and (max-height:500px), (min-width:900px) and (max-width:1100px)":
            { width: explorerLayout.compactToolbar },
          p: 1.25,
          borderRadius: radii.panel,
          boxShadow: "0 4px 20px #00000014",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
          <Tooltip title="Volver a la vista normal">
            <IconButton size="small" aria-label="Salir del modo mapa" onClick={onExit}>
              <Icon name="collapse" size={18} />
            </IconButton>
          </Tooltip>
          <Typography component="h1" sx={{ fontSize: 15, fontWeight: 700, flex: 1 }}>
            Modo mapa
          </Typography>
          <Typography variant="caption" color="warning.main" sx={{ fontSize: 12 }}>
            {sample ? "2027 ilustrativo" : "2027 · pronóstico"}
          </Typography>
          <ThemeToggle />
        </Box>
        <TextField
          fullWidth
          label="Buscar municipio o clave"
          size="small"
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
          <Button
            size="small"
            data-panel-trigger="filters"
            aria-label={`Filtros${filterCount ? ` · ${filterCount}` : ""}`}
            aria-expanded={panel === "filters"}
            startIcon={<Icon name="filter" size={15} />}
            onClick={() => onPanel("filters")}
            sx={{ minWidth: 0, px: 1, flex: 1 }}
          >
            Filtros{filterCount ? ` · ${filterCount}` : ""}
          </Button>
          <Button
            size="small"
            data-panel-trigger="scenarios"
            aria-label={sample ? "Escenarios" : "Qué ver: datos y escenarios"}
            aria-expanded={panel === "scenarios"}
            startIcon={<Icon name="compare" size={15} />}
            onClick={() => onPanel("scenarios")}
            sx={{ minWidth: 0, px: 1, flex: 1 }}
          >
            {sample ? "Escenarios" : "Qué ver"}
          </Button>
          <Tooltip title="Descargar toda la consulta">
            <span>
              <IconButton
                size="small"
                aria-label="Descargar tabla (CSV)"
                disabled={!count}
                onClick={onDownload}
              >
                <Icon name="download" size={17} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}
        >
          <Typography
            role="status"
            aria-live="polite"
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", px: 0.5 }}
          >
            {count.toLocaleString("es-MX")} {count === 1 ? "municipio" : "municipios"}
          </Typography>
          <Button
            size="small"
            aria-label="Ver resultados en tabla"
            startIcon={<Icon name="table" size={14} />}
            onClick={onTable}
          >
            Tabla
          </Button>
        </Box>
        {viewLabel && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              px: 0.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {viewLabel}
          </Typography>
        )}
        {error && (
          <Typography role="status" variant="caption" color="warning.main">
            Revisa el mínimo y máximo de la lista electoral en Filtros.
          </Typography>
        )}
        {!municipality && singleResult && (
          <Button
            fullWidth
            aria-label={`Ver ficha: ${singleResult.name}`}
            onClick={() => onSelect(singleResult.id)}
            sx={{
              justifyContent: "flex-start",
              mt: 0.5,
              fontSize: 12,
              display: "block",
              textAlign: "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Ver ficha: {singleResult.name}
          </Button>
        )}
        {singleResult && !singleResult.hasGeometry && (
          <Typography variant="caption" color="text.secondary">
            No hay límites disponibles para mostrar este municipio en el mapa.
          </Typography>
        )}
        {municipality && (
          <Button
            fullWidth
            data-panel-trigger="detail"
            aria-label={`Ver ficha · ${municipality.name} ${selectionLabel ?? riskTokens[risk].label}`}
            aria-expanded={panel === "detail"}
            onClick={() => onPanel("detail")}
            sx={{
              mt: 0.75,
              p: 1,
              bgcolor: "action.hover",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 13,
              }}
            >
              Ver ficha · {municipality.name}
            </Box>
            {selectionLabel ? (
              <Typography
                component="span"
                variant="caption"
                sx={{
                  fontSize: 11,
                  maxWidth: 110,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectionLabel}
              </Typography>
            ) : (
              <RiskBadge risk={risk} />
            )}
          </Button>
        )}
      </Paper>
      <Paper
        variant="outlined"
        sx={{
          position: "absolute",
          zIndex: 2,
          left: { xs: 8, md: 16 },
          bottom: { xs: 64, md: 48 },
          maxWidth: { xs: "calc(100% - 16px)", md: 520 },
          borderRadius: radii.panel,
          overflow: "hidden",
        }}
      >
        <Button
          size="small"
          fullWidth
          aria-label={
            sample ? "Riesgo de muestra: mostrar u ocultar leyenda" : "Mostrar u ocultar leyenda"
          }
          aria-expanded={legendOpen}
          onClick={() => setLegendOpen(!legendOpen)}
          sx={{ justifyContent: "space-between", gap: 2, px: 1.5, py: 0.75, fontSize: 12 }}
        >
          {sample ? "Riesgo de muestra" : "Leyenda"}{" "}
          <Icon name={legendOpen ? "close" : "info"} size={14} />
        </Button>
        {legendOpen && (legend ?? <RiskLegend compact />)}
      </Paper>
      {panel && (
        <Paper
          key={panel}
          component="section"
          role="region"
          aria-labelledby="floating-panel-title"
          data-pw="floating-panel"
          className="tc-floating-panel"
          variant="outlined"
          sx={{
            position: "absolute",
            zIndex: 4,
            borderRadius: radii.panel,
            boxShadow: "0 6px 24px #00000020",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            width: { xs: "calc(100% - 16px)", md: explorerLayout.panel },
            left: { xs: 8, md: panel === "detail" ? "auto" : 16 },
            right: { xs: 8, md: panel === "detail" ? 76 : "auto" },
            top: {
              xs: "auto",
              md:
                panel === "detail"
                  ? 16
                  : (municipality || singleResult || error ? 272 : 224) + (viewLabel ? 24 : 0),
            },
            bottom: { xs: 8, md: panel === "detail" ? 16 : "auto" },
            maxHeight: {
              xs: "52dvh",
              md:
                panel === "detail"
                  ? "calc(100dvh - 32px)"
                  : municipality || singleResult || error
                    ? "calc(100dvh - 288px)"
                    : "calc(100dvh - 240px)",
            },
            "@media (min-width:900px) and (max-width:1100px)": {
              width: explorerLayout.compactPanel,
            },
            "@media (min-width:780px) and (max-height:500px)": {
              width: explorerLayout.compactPanel,
              left: "auto",
              right: explorerLayout.zoomReserve,
              top: 16,
              bottom: 16,
              maxHeight: "calc(100dvh - 32px)",
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 0.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              borderBottom: 1,
              borderColor: "divider",
              flexShrink: 0,
            }}
          >
            <Typography
              id="floating-panel-title"
              component="h2"
              sx={{ fontSize: 14, fontWeight: 700 }}
            >
              {titles[panel]}
            </Typography>
            <IconButton
              size="small"
              aria-label={`Plegar ${panel === "detail" ? "ficha" : panel === "filters" ? "filtros" : "escenarios"}`}
              onClick={onClosePanel}
              autoFocus
            >
              <Icon name="close" size={17} />
            </IconButton>
          </Box>
          <Box sx={{ overflowY: "auto", overscrollBehavior: "contain", minHeight: 0 }}>
            {panel === "filters" ? filters : panel === "scenarios" ? scenarios : details}
          </Box>
        </Paper>
      )}
    </>
  );
}
