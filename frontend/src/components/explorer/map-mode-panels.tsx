"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import NativeSelect from "@mui/material/NativeSelect";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MapPanelHeader } from "@/components/map/map-panel-header";
import { mapDockPosition } from "@/components/map/map-dock-position";
import { explorerLayout } from "@/theme/tokens";

export type MapPanelId = "tools" | "summary" | "legend" | "detail";
export type DetailWidth = keyof typeof explorerLayout.detailWidths;
export type MapPanelState = Record<MapPanelId, boolean>;

function FloatingPanel({
  name,
  title,
  subtitle,
  expanded,
  toggle,
  children,
}: {
  name: MapPanelId;
  title: string;
  subtitle?: string;
  expanded: boolean;
  toggle: () => void;
  children: ReactNode;
}) {
  return (
    <Paper
      component={name === "detail" ? "aside" : "section"}
      aria-label={title}
      data-map-overlay
      data-expanded={expanded}
      data-pw={`map-${name}-panel`}
      variant="outlined"
      sx={{
        pointerEvents: "auto",
        width: expanded ? "100%" : "min(240px, 100%)",
        minHeight: 44,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        flex:
          name === "detail" ? { xs: "0 1 auto", md: expanded ? "1 1 0%" : "0 0 auto" } : "0 1 auto",
        overflow: "hidden",
        boxShadow: "0 4px 20px #00000014",
        borderTop: name === "detail" ? "2px solid" : undefined,
        borderTopColor: name === "detail" ? "primary.main" : undefined,
      }}
    >
      <MapPanelHeader
        title={title}
        {...(subtitle ? { subtitle } : {})}
        name={
          { tools: "herramientas", summary: "cifras", legend: "leyenda", detail: "ficha" }[name]
        }
        expanded={expanded}
        onToggle={toggle}
        contentId={`expanded-${name}-content`}
        heading={name === "tools" ? "h1" : "h2"}
      />
      <Box
        id={`expanded-${name}-content`}
        hidden={!expanded}
        sx={{
          display: expanded ? "block" : "none",
          overflowY: "auto",
          minHeight: 0,
          overscrollBehavior: "contain",
          maxHeight: { xs: "calc(100dvh - 252px)", md: "none" },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

export function MapModePanels({
  tools,
  summary,
  legend,
  detail,
  selectedName,
  mobile,
  expanded,
  mobilePanel,
  onToggle,
  detailWidth,
  onWidth,
  onExit,
  onZen,
}: {
  tools: ReactNode;
  summary: ReactNode;
  legend: ReactNode;
  detail: ReactNode;
  selectedName: string | undefined;
  mobile: boolean;
  expanded: MapPanelState;
  mobilePanel: MapPanelId | null;
  onToggle: (panel: MapPanelId) => void;
  detailWidth: DetailWidth;
  onWidth: (width: DetailWidth) => void;
  onExit: () => void;
  onZen: () => void;
}) {
  const isExpanded = (panel: MapPanelId) => (mobile ? mobilePanel === panel : expanded[panel]);
  const panel = (name: MapPanelId, title: string, children: ReactNode, subtitle?: string) => (
    <FloatingPanel
      name={name}
      title={title}
      {...(subtitle ? { subtitle } : {})}
      expanded={isExpanded(name)}
      toggle={() => onToggle(name)}
    >
      {children}
    </FloatingPanel>
  );
  const toolsPanel = panel("tools", "Explorar el territorio", tools);
  const summaryPanel = panel("summary", "Resumen del territorio", summary);
  const legendPanel = panel("legend", "Leyenda", legend);
  const detailPanel = panel(
    "detail",
    "Ficha municipal",
    <>
      <Box
        sx={{
          px: 2,
          pt: 1,
          display: { xs: "none", lg: "flex" },
          justifyContent: "end",
          gap: 1,
          alignItems: "center",
        }}
      >
        <Box component="label" htmlFor="map-detail-width" sx={{ fontSize: 12 }}>
          Ancho de ficha
        </Box>
        <NativeSelect
          id="map-detail-width"
          value={detailWidth}
          onChange={(event) => onWidth(event.target.value as DetailWidth)}
          inputProps={{ "aria-label": "Ancho de ficha" }}
          sx={{
            fontSize: 12,
            "& select:focus-visible": {
              outline: "3px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
          }}
        >
          <option value="compacta">Compacta</option>
          <option value="normal">Normal</option>
          <option value="amplia">Amplia</option>
        </NativeSelect>
      </Box>
      {detail}
    </>,
    selectedName
  );
  const column = {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
    minHeight: 0,
    pointerEvents: "none",
  } as const;
  const width = explorerLayout.detailWidths[detailWidth];
  const detailDimension = typeof width === "number" ? `${width}px` : width;
  return (
    <>
      <Box
        data-map-overlay
        data-pw="map-actions"
        sx={{
          position: "absolute",
          ...mapDockPosition("actions"),
          zIndex: 8,
          display: "flex",
          gap: 0.5,
          alignItems: "center",
          bgcolor: "background.paper",
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          p: 0.5,
          justifyContent: "space-between",
          "& > .MuiButton-root": { minWidth: 56, px: 0.75 },
        }}
      >
        <Button
          onClick={onZen}
          aria-label={
            (mobile ? mobilePanel !== null : Object.values(expanded).some(Boolean))
              ? "Minimizar todos los paneles"
              : "Restaurar paneles"
          }
        >
          {(mobile ? mobilePanel !== null : Object.values(expanded).some(Boolean))
            ? "Despejar"
            : "Restaurar"}
        </Button>
        <ThemeToggle />
        <Button aria-label="Salir del modo mapa" onClick={onExit}>
          Salir
        </Button>
      </Box>
      {mobile ? (
        <Box
          sx={{
            ...column,
            left: 8,
            top: 16,
            right: 8,
            maxWidth: 380,
            maxHeight: "calc(100% - 164px)",
            gap: 0.75,
            zIndex: 5,
          }}
        >
          {toolsPanel}
          {summaryPanel}
          {legendPanel}
          {detailPanel}
        </Box>
      ) : (
        <>
          <Box
            sx={{
              ...column,
              left: 16,
              top: 16,
              bottom: 34,
              width: explorerLayout.mapMode.toolsWidth,
              zIndex: 5,
            }}
          >
            {toolsPanel}
            <Box
              sx={{
                mt: "auto",
                minHeight: 44,
                display: "flex",
                flexDirection: "column",
                maxHeight: "42%",
                overflow: "hidden",
              }}
            >
              {legendPanel}
            </Box>
          </Box>
          <Box
            data-pw="map-summary-position"
            sx={{
              ...column,
              left: {
                md: explorerLayout.mapMode.toolsWidth.md + 32,
                lg: explorerLayout.mapMode.toolsWidth.lg + 32,
                xl: explorerLayout.mapMode.toolsWidth.xl + 32,
              },
              right: {
                md: explorerLayout.mapMode.compactDetailWidth + 32,
                lg: `calc(${detailDimension} + 32px)`,
              },
              top: 16,
              alignItems: "center",
              zIndex: 6,
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: explorerLayout.mapMode.summaryMaximumWidth,
                maxHeight: `min(${explorerLayout.mapMode.summaryMaximumHeight}px, calc(100dvh - 120px))`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {summaryPanel}
            </Box>
          </Box>
          <Box
            sx={{
              ...column,
              right: 16,
              top: 16,
              bottom: 34,
              width: { md: explorerLayout.mapMode.compactDetailWidth, lg: width },
              alignItems: "flex-end",
              zIndex: 6,
            }}
          >
            {detailPanel}
          </Box>
        </>
      )}
    </>
  );
}
