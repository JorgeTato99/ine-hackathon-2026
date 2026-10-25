"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import Drawer from "@mui/material/Drawer";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme, useColorScheme } from "@mui/material/styles";
import { useDataset } from "@/services/use-dataset";
import { notifyExplorerQuery, useExplorerQuery } from "@/hooks/use-explorer-query";
import { formatInteger, normalized } from "@/utils/dataset";
import { readTableState, orderMunicipalities } from "@/utils/explorer-table";
import { saveFile, selectionCsv } from "@/utils/downloads";
import {
  forecastPaints,
  historyLegend,
  historicalClass,
  historyYears,
  interventions,
  midtermYears,
  readForecastQuery,
  riskNames,
} from "@/utils/forecast";
import {
  riskTokens,
  riskMapColor,
  fontFamilies,
  forecastLayout,
  explorerLayout,
} from "@/theme/tokens";
import { ForecastSummary } from "./forecast-summary";
import { ForecastDetails } from "./forecast-details";
import { MunicipalityTable } from "./municipality-table";
import { MunicipalIdentity } from "./municipal-identity";
import { useMapMode } from "@/hooks/use-map-mode";
import {
  MapModePanels,
  type MapPanelId,
  type MapPanelState,
  type DetailWidth,
} from "./map-mode-panels";

const TerritorialMap = dynamic(() => import("@/components/map/territorial-map"), {
  ssr: false,
  loading: () => <WorkspaceLoading contained />,
});
const allowedQuery = new Set([
  "entidad",
  "municipio",
  "escenario",
  "pestana",
  "anio",
  "leyenda",
  "vista",
  "orden",
  "direccion",
  "pagina",
  "filas",
  "modo",
]);
export function WorkspaceLoading({ contained = false }: { contained?: boolean }) {
  return (
    <Box sx={{ p: 2, height: contained ? "100%" : 320 }}>
      <Skeleton variant="rounded" height="85%" />
      <Typography role="status" variant="body2" sx={{ mt: 1 }}>
        Cargando los datos del mapa…
      </Typography>
    </Box>
  );
}
export function ForecastExplorer() {
  const workspace = useRef<HTMLDivElement>(null);
  const query = useDataset();
  const params = useExplorerQuery();
  const mobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const dataset = query.data;
  const mapMode = params.get("modo") === "mapa" && Boolean(dataset);
  const { mode, systemMode } = useColorScheme();
  const dark = (mode === "system" ? systemMode : mode) === "dark";
  const restoreScroll = useRef(0);
  const modeTrigger = useRef<HTMLElement | null>(null);
  const returnView = useRef("");
  const [expanded, setExpanded] = useState<MapPanelState>({
    tools: true,
    summary: true,
    legend: true,
    detail: true,
  });
  const [mobilePanel, setMobilePanel] = useState<MapPanelId | null>("tools");
  const [detailWidth, setDetailWidth] = useState<DetailWidth>("normal");
  const state = useMemo(
    () => (dataset ? readForecastQuery(dataset, params) : null),
    [dataset, params]
  );
  useEffect(() => {
    const element = workspace.current;
    if (!element || mobile || mapMode) return;
    const measure = () => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      const height = `${Math.max(forecastLayout.minimumMapHeight, window.innerHeight - top - forecastLayout.viewportGutter)}px`;
      if (element.style.getPropertyValue("--tc-workspace-height") !== height)
        element.style.setProperty("--tc-workspace-height", height);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (element.parentElement) observer?.observe(element.parentElement);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [dataset, mobile, mapMode, state?.intervention, params]);
  const update = useCallback((changes: Record<string, string>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${next.size ? `?${next}` : ""}`
    );
    notifyExplorerQuery();
  }, []);
  const exitMapMode = useCallback(() => update({ modo: "", vista: returnView.current }), [update]);
  useMapMode(mapMode, workspace, restoreScroll, exitMapMode, modeTrigger);
  const enterMapMode = (trigger: HTMLElement) => {
    modeTrigger.current = trigger;
    restoreScroll.current = window.scrollY;
    returnView.current = params.get("vista") === "tabla" ? "tabla" : "";
    setMobilePanel(state?.selected ? "detail" : "tools");
    update({ modo: "mapa", vista: "" });
  };
  const togglePanel = (panel: MapPanelId) => {
    setExpanded((current) => ({ ...current, [panel]: !current[panel] }));
    setMobilePanel((current) => (current === panel ? null : panel));
  };
  const toggleZen = () => {
    const open = mobile ? mobilePanel !== null : Object.values(expanded).some(Boolean);
    setExpanded({ tools: !open, summary: !open, legend: !open, detail: !open });
    setMobilePanel(open ? null : "tools");
  };
  // Los enlaces anteriores conservan municipio y tipo equivalente, sin aplicar filtros retirados.
  useEffect(() => {
    if (!state) return;
    const next = new URLSearchParams(params);
    for (const key of [...next.keys()]) if (!allowedQuery.has(key)) next.delete(key);
    if (params.has("escenario") || params.has("intervencion"))
      next.set("escenario", state.scenario);
    if (state.state) next.set("entidad", state.state);
    else next.delete("entidad");
    if (!state.selected) next.delete("municipio");
    const legendIds = state.historical
      ? historyLegend.map((item) => item.id)
      : ["alto", "medio", "bajo", "sin_estimacion"];
    if (next.has("leyenda") && !legendIds.includes(next.get("leyenda")!)) next.delete("leyenda");
    if (state.historical) {
      next.set("pestana", "historico");
      next.set("anio", state.year);
    } else next.delete("pestana");
    if (next.toString() !== params.toString()) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${next.size ? `?${next}` : ""}`
      );
      notifyExplorerQuery();
    }
  }, [state, params]);
  const states = useMemo(
    () =>
      dataset
        ? [
            ...new Map(
              dataset.municipalities.map((item) => [item.stateCode, item.state])
            ).entries(),
          ].sort((a, b) => a[1].localeCompare(b[1], "es"))
        : [],
    [dataset]
  );
  const stateCode = state?.state ?? "";
  const scope = useMemo(
    () =>
      dataset?.municipalities.filter((item) => !stateCode || item.stateCode === stateCode) ?? [],
    [dataset, stateCode]
  );
  const paints = useMemo(
    () =>
      dataset && state
        ? forecastPaints(
            dataset,
            state.scenario,
            state.historical,
            state.year,
            state.state,
            params.get("leyenda") ?? "",
            dark
          )
        : {},
    [dataset, state, params, dark]
  );
  const visibleIds = useMemo(() => dataset?.municipalities.map((item) => item.id) ?? [], [dataset]);
  const tableRows = useMemo(
    () =>
      scope.filter(
        (item) =>
          !params.get("leyenda") ||
          (state?.historical
            ? historicalClass(item, state.year)
            : (dataset?.estimates[state?.scenario ?? ""]?.[item.id]?.risk ?? "sin_estimacion")) ===
            params.get("leyenda")
      ),
    [scope, params, state, dataset]
  );
  const tableState = readTableState(params, state?.historical);
  const ordered = useMemo(
    () =>
      dataset && state
        ? orderMunicipalities(
            dataset,
            tableRows,
            state.scenario,
            tableState.column,
            tableState.direction,
            state.historical ? paints : undefined
          )
        : [],
    [dataset, state, tableRows, tableState.column, tableState.direction, paints]
  );
  const select = useCallback(
    (id: string) => {
      const item = dataset?.municipalities.find((item) => item.id === id);
      if (id) {
        setExpanded((current) => ({ ...current, detail: true }));
        setMobilePanel("detail");
      }
      update({
        municipio: id,
        entidad: item?.stateCode ?? "",
        pagina: "",
        vista: "",
        ...(id ? {} : { leyenda: "" }),
      });
    },
    [dataset, update]
  );
  if (query.isPending) return <WorkspaceLoading />;
  if (query.isError || !dataset || !state)
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => void query.refetch()}>Reintentar</Button>}
      >
        No pudimos cargar los resultados. Reintenta la consulta o visita{" "}
        <a href="/datos/">Datos y descargas</a>.
      </Alert>
    );
  const stateName = states.find(([code]) => code === state.state)?.[1];
  const legend = state.historical
    ? historyLegend
    : ["alto", "medio", "bajo", "sin_estimacion"].map((id) => ({
        id,
        label: riskNames[id]!,
        color: riskMapColor(id as keyof typeof riskTokens, dark),
      }));
  const viewTable = !mapMode && params.get("vista") === "tabla";
  const detail = state.selected ? (
    <ForecastDetails
      dataset={dataset}
      municipality={state.selected}
      scenario={state.scenario}
      historical={state.historical}
    />
  ) : null;
  const detailHeader = (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        bgcolor: "background.paper",
        zIndex: 2,
        px: 2.5,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        alignItems: "start",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {state.selected && (
          <MunicipalIdentity dataset={dataset} municipality={state.selected} compact />
        )}
      </Box>
      <Button
        aria-label="Cerrar ficha municipal"
        onClick={() => update({ municipio: "" })}
        sx={{ minWidth: 36, fontSize: 20 }}
      >
        ×
      </Button>
    </Box>
  );
  const controls = (
    <Box
      data-pw="forecast-map-controls"
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        px: 1.5,
        py: 0.5,
        boxShadow: "0 2px 8px #00000012",
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          lg:
            mapMode || state.selected
              ? "minmax(0, 1fr)"
              : "minmax(320px, .8fr) minmax(450px, 1.2fr)",
          xl: mapMode ? "minmax(0, 1fr)" : "minmax(320px, .8fr) minmax(450px, 1.2fr)",
        },
        alignItems: "center",
        columnGap: 2,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: mapMode ? "minmax(0, 1fr)" : "minmax(130px, .8fr) minmax(160px, 1.2fr)",
          },
          gap: 1.5,
          maxWidth: 850,
          py: 0.75,
        }}
      >
        <Autocomplete
          size="small"
          options={states}
          value={states.find(([code]) => code === state.state) ?? null}
          getOptionLabel={(option) => option[1]}
          isOptionEqualToValue={(a, b) => a[0] === b[0]}
          onChange={(_, value) =>
            update({ entidad: value?.[0] ?? "", municipio: "", pagina: "", leyenda: "" })
          }
          renderInput={(props) => <TextField {...props} label="Estado" placeholder="Todo México" />}
          clearText="Quitar estado"
          openText="Elegir estado"
          closeText="Cerrar lista"
          noOptionsText="No encontramos ese estado"
        />
        <Autocomplete
          size="small"
          options={scope}
          value={state.selected ?? null}
          getOptionLabel={(item) =>
            `${item.name} · ${item.id}${state.state ? "" : ` · ${item.state}`}`
          }
          filterOptions={(options, { inputValue }) =>
            options
              .filter((item) =>
                normalized(`${item.name} ${item.id} ${item.state}`).includes(normalized(inputValue))
              )
              .slice(0, 80)
          }
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_, value) => (value ? select(value.id) : update({ municipio: "" }))}
          renderInput={(props) => (
            <TextField
              {...props}
              label="Municipio"
              placeholder={state.state ? "Nombre o clave" : "Busca en todo México o elige estado"}
            />
          )}
          clearText="Quitar municipio"
          openText="Elegir municipio"
          closeText="Cerrar lista"
          noOptionsText="No encontramos ese municipio"
        />
      </Box>
      <Box sx={{ pb: 0.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>
          {state.historical ? "Elección observada" : "Tipo de intervención"}
        </Typography>
        <Box
          role="group"
          aria-label={state.historical ? "Año de la elección" : "Tipo de intervención"}
          sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}
        >
          {state.historical
            ? historyYears.map((year) => (
                <ToggleButton
                  key={year}
                  size="small"
                  value={year}
                  selected={state.year === year}
                  onClick={() => update({ anio: year, leyenda: "", pagina: "" })}
                  sx={{ textTransform: "none", px: 1.5, minHeight: 40 }}
                >
                  <Box>
                    {year}
                    <Typography component="span" sx={{ display: "block", fontSize: 10 }}>
                      {midtermYears.has(year) ? "Intermedia" : "Presidencial"}
                    </Typography>
                  </Box>
                </ToggleButton>
              ))
            : interventions.map((option) => (
                <Tooltip key={option.id} title={option.help} describeChild>
                  <ToggleButton
                    size="small"
                    value={option.id}
                    selected={state.intervention === option.id}
                    onClick={() =>
                      update({ escenario: `nac-estimado_int-${option.id}`, pagina: "" })
                    }
                    sx={{ textTransform: "none", px: 1.5, minHeight: 40 }}
                  >
                    {option.label}
                  </ToggleButton>
                </Tooltip>
              ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          {state.historical
            ? "Misma escala en todos los años. Sin casilla significa que no se pudo votar."
            : "Supuesto, no efecto medido. Se calcula solo en los 495 municipios en rojo sin intervención."}
        </Typography>
      </Box>
    </Box>
  );
  const tabs = (
    <Tabs
      value={state.historical ? "historico" : "pronostico"}
      aria-label="Contenido del mapa"
      onChange={(_, value: string) =>
        update({
          pestana: value === "historico" ? value : "",
          leyenda: "",
          pagina: "",
          orden: "",
        })
      }
    >
      <Tab
        value="pronostico"
        label="Pronóstico 2027"
        id="tab-pronostico"
        aria-controls="panel-territorial"
      />
      <Tab
        value="historico"
        label="Histórico"
        id="tab-historico"
        aria-controls="panel-territorial"
      />
    </Tabs>
  );
  const summaryNode = (
    <ForecastSummary
      compact={mapMode}
      dataset={dataset}
      rows={state.selected ? [state.selected] : scope}
      selected={state.selected}
      scenario={state.scenario}
      historical={state.historical}
      year={state.year}
    />
  );
  const legendContent = (
    <Box aria-label="Leyenda del mapa" sx={{ p: 1 }}>
      {" "}
      <Typography sx={{ fontSize: 12, fontWeight: 700, px: 0.5, mb: 0.5 }}>
        {state.historical ? `Participación · ${state.year}` : "Semáforo de riesgo"}
      </Typography>
      {legend.map((entry) => {
        const count = scope.filter(
          (item) =>
            (state.historical
              ? historicalClass(item, state.year)
              : (dataset.estimates[state.scenario]?.[item.id]?.risk ?? "sin_estimacion")) ===
            entry.id
        ).length;
        return (
          <Button
            key={entry.id}
            aria-pressed={params.get("leyenda") === entry.id}
            onClick={() =>
              update({
                leyenda: params.get("leyenda") === entry.id ? "" : entry.id,
                pagina: "",
              })
            }
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "start",
              gap: 1,
              minHeight: 32,
              py: 0.5,
              px: 0.75,
              fontSize: 11,
              color: "text.primary",
              bgcolor: params.get("leyenda") === entry.id ? "action.selected" : "transparent",
            }}
          >
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                width: 12,
                height: 12,
                flexShrink: 0,
                bgcolor: entry.color,
                border: "1px solid #6C747B",
                ...(entry.id === "sin_casilla"
                  ? {
                      backgroundImage:
                        "repeating-linear-gradient(135deg, transparent, transparent 3px, #596273 3px, #596273 4px)",
                    }
                  : {}),
              }}
            />
            <span>{entry.label}</span>
            <Box component="span" sx={{ ml: "auto", pl: 1, fontVariantNumeric: "tabular-nums" }}>
              {formatInteger(count)}
            </Box>
          </Button>
        );
      })}
      <Typography sx={{ fontSize: 10, px: 0.5, color: "text.secondary", mt: 0.5 }}>
        Pulsa para resaltar; vuelve a pulsar para quitar.
      </Typography>
    </Box>
  );
  return (
    <Box data-pw="forecast-explorer">
      <Box data-app-chrome="explorer-overview" sx={{ display: mapMode ? "none" : "block" }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontFamily: fontFamilies.editorial,
              fontSize: { xs: 25, md: 30 },
              lineHeight: 1.15,
              maxWidth: "35ch",
            }}
          >
            ¿Dónde podría votar menos gente en 2027?
          </Typography>
          {!mapMode && tabs}
          <Button data-pw="enter-map-mode" onClick={(event) => enterMapMode(event.currentTarget)}>
            Modo mapa
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Elección intermedia · 6 de junio de 2027. Estimaciones con incertidumbre; intervención
          supuesta. <a href="/metodologia/">Cómo leerlas</a>.
        </Typography>
        <Box
          component="nav"
          aria-label="Territorio seleccionado"
          sx={{
            display: "flex",
            gap: 0.5,
            alignItems: "center",
            minHeight: 28,
            flexWrap: "wrap",
            "& button": { minHeight: 28, py: 0.25 },
          }}
        >
          <Button
            size="small"
            onClick={() => select("")}
            aria-current={!state.state ? "location" : undefined}
          >
            México
          </Button>
          {stateName && (
            <>
              <span aria-hidden="true">›</span>
              <Button
                size="small"
                onClick={() => update({ municipio: "", leyenda: "" })}
                aria-current={!state.selected ? "location" : undefined}
              >
                {stateName}
              </Button>
            </>
          )}
          {state.selected && (
            <>
              <span aria-hidden="true">›</span>
              <Typography variant="caption" aria-current="location">
                {state.selected.name}
              </Typography>
            </>
          )}
        </Box>
      </Box>
      {!mapMode && summaryNode}
      {!mapMode && (mobile || viewTable) && controls}
      <Box
        id="panel-territorial"
        role="tabpanel"
        aria-labelledby={state.historical ? "tab-historico" : "tab-pronostico"}
      >
        <Box
          data-app-chrome="explorer-actions"
          sx={{
            display: mapMode ? "none" : "flex",
            gap: 1,
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
            flexWrap: "wrap",
          }}
        >
          <Button size="small" onClick={() => update({ vista: viewTable ? "" : "tabla" })}>
            {viewTable ? "Ver como mapa" : "Ver como tabla"}
          </Button>
          <Button
            size="small"
            onClick={() =>
              saveFile(
                `TrazaCivica_${dataset.version}_${state.historical ? state.year : state.intervention}.csv`,
                selectionCsv(
                  dataset,
                  tableRows,
                  state.scenario,
                  state.historical ? { title: `Histórico ${state.year}`, paints } : undefined
                ),
                "text/csv;charset=utf-8"
              )
            }
          >
            Descargar selección (CSV)
          </Button>
        </Box>
        <Box
          ref={workspace}
          tabIndex={mapMode ? -1 : undefined}
          data-pw="explorer-workspace"
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: state.selected
                ? `minmax(0, 1fr) minmax(320px, ${forecastLayout.detailWidth}px)`
                : "minmax(0, 1fr)",
            },
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
            bgcolor: "background.paper",
            ...(mapMode
              ? {
                  position: "fixed",
                  inset: 0,
                  width: "100%",
                  height: "100dvh",
                  zIndex: 1200,
                  border: 0,
                  borderRadius: 0,
                  display: "block",
                  outline: "none",
                  "--tc-map-tools-width": {
                    md: `${explorerLayout.mapMode.toolsWidth.md}px`,
                    lg: `${explorerLayout.mapMode.toolsWidth.lg}px`,
                    xl: `${explorerLayout.mapMode.toolsWidth.xl}px`,
                  },
                  "--tc-map-detail-width": {
                    md: `${explorerLayout.mapMode.compactDetailWidth}px`,
                    lg:
                      typeof explorerLayout.detailWidths[detailWidth] === "number"
                        ? `${explorerLayout.detailWidths[detailWidth]}px`
                        : explorerLayout.detailWidths[detailWidth],
                  },
                }
              : {}),
          }}
        >
          <Box sx={{ minWidth: 0, ...(mapMode ? { height: "100%" } : {}) }}>
            {/* El mapa permanece montado al abrir la tabla para conservar cámara y cartografía. */}
            <Box
              sx={{
                position: "relative",
                display: viewTable ? "none" : "block",
                height: {
                  xs: mapMode ? "100%" : forecastLayout.mobileMapHeight,
                  md: mapMode ? "100%" : forecastLayout.normalMapHeight,
                },
              }}
            >
              <TerritorialMap
                dataset={dataset}
                visibleIds={visibleIds}
                selectedId={state.selected?.id ?? ""}
                scenario={state.scenario}
                stateFilter={state.state}
                onSelect={select}
                paints={paints}
                mapMode={mapMode}
                panelOpen={
                  mapMode && (mobile ? mobilePanel !== null : Object.values(expanded).some(Boolean))
                }
              />
              {!mapMode && !mobile && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 12,
                    top: 12,
                    right: 76,
                    zIndex: 3,
                  }}
                >
                  {controls}
                </Box>
              )}
              {!mapMode && (
                <>
                  <Box
                    sx={{
                      position: "absolute",
                      left: 12,
                      bottom: 34,
                      maxWidth: "min(280px, calc(100% - 180px))",
                      bgcolor: "background.paper",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      boxShadow: "0 2px 8px #00000012",
                      maxHeight: "46%",
                      overflowY: "auto",
                    }}
                  >
                    {legendContent}
                  </Box>
                </>
              )}
              <Button
                variant="contained"
                data-pw="expand-map"
                onClick={(event) => enterMapMode(event.currentTarget)}
                sx={{
                  display: mapMode ? "none" : "inline-flex",
                  position: "absolute",
                  bottom: 44,
                  right: 12,
                  zIndex: 3,
                }}
              >
                Ampliar mapa
              </Button>
              {mapMode && (
                <MapModePanels
                  tools={
                    <>
                      {tabs}
                      {controls}
                    </>
                  }
                  summary={summaryNode}
                  legend={legendContent}
                  detail={
                    state.selected ? (
                      <>
                        {detailHeader}
                        {detail}
                      </>
                    ) : (
                      <Typography sx={{ p: 2 }}>
                        Elige un municipio en el mapa o el buscador para abrir su ficha.
                      </Typography>
                    )
                  }
                  selectedName={state.selected?.name}
                  mobile={mobile}
                  expanded={expanded}
                  mobilePanel={mobilePanel}
                  onToggle={togglePanel}
                  detailWidth={detailWidth}
                  onWidth={setDetailWidth}
                  onExit={exitMapMode}
                  onZen={toggleZen}
                />
              )}
            </Box>
            {viewTable && (
              <MunicipalityTable
                dataset={dataset}
                items={ordered}
                selected={state.selected?.id ?? ""}
                scenario={state.scenario}
                state={tableState}
                onSelect={select}
                onSort={(column) =>
                  update({
                    orden: column,
                    direccion:
                      tableState.column === column && tableState.direction === "asc"
                        ? "desc"
                        : "asc",
                    pagina: "",
                  })
                }
                onPage={(page) => update({ pagina: String(page + 1) })}
                onPageSize={(size) => update({ filas: String(size), pagina: "" })}
                {...(state.historical
                  ? { context: paints, contextTitle: `Participación ${state.year}` }
                  : {})}
              />
            )}
          </Box>
          {state.selected && !mobile && !mapMode && (
            <Box
              component="aside"
              aria-label="Ficha municipal"
              data-pw="forecast-detail"
              sx={{
                borderLeft: 1,
                borderColor: "divider",
                maxHeight: forecastLayout.normalMapHeight,
                overflowY: "auto",
              }}
            >
              {detailHeader}
              {detail}
            </Box>
          )}
        </Box>
        {!state.selected && !mapMode && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Elige un municipio en el mapa, el buscador o la tabla para abrir su ficha. El semáforo
            orienta; no decide por sí solo dónde asignar recursos.
          </Typography>
        )}
        <Drawer
          anchor="bottom"
          open={mobile && !mapMode && Boolean(state.selected)}
          onClose={() => update({ municipio: "" })}
          slotProps={{
            paper: {
              sx: { maxHeight: "74dvh", borderRadius: "12px 12px 0 0" },
              "aria-label": "Ficha municipal",
            },
          }}
        >
          {!mapMode && detailHeader}
          {mobile && !mapMode ? detail : null}
        </Drawer>
      </Box>
    </Box>
  );
}
