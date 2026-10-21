"use client";

import dynamic from "next/dynamic";
import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useDataset } from "@/services/use-dataset";
import { useMapMode } from "@/hooks/use-map-mode";
import { notifyExplorerQuery, useExplorerQuery } from "@/hooks/use-explorer-query";
import { riskTokens, radii } from "@/theme/tokens";
import {
  defaultScenarios,
  estimateFor,
  filterMunicipalities,
  formatInteger,
  municipalityById,
} from "@/utils/dataset";
import {
  readAdvancedFilters,
  applyAdvancedFilters,
  advancedFilterCount,
  nominalRangeError,
} from "@/utils/explorer-filters";
import { readTableState, orderMunicipalities } from "@/utils/explorer-table";
import { saveFile, selectionCsv } from "@/utils/downloads";
import { Icon } from "@/components/ui/icon";
import { EntranceScope } from "@/components/motion/entrance-scope";
import { ExplorerHeader } from "./explorer-header";
import { ExplorerFilters } from "./explorer-filters";
import { ExplorerScenarios } from "./explorer-scenarios";
import { RiskLegend } from "./risk-legend";
import { MunicipalityDetails } from "./municipality-details";
import { MunicipalityTable } from "./municipality-table";
import { MapModeChrome, type MapPanel } from "./map-mode-chrome";
import { ResultsViews, ResultsCards, ResultsLegend } from "./results-controls";
import { ResultsDetails } from "./results-details";
import {
  readPresentation,
  mapPresentation,
  controlCards,
  forecastLegend,
  readContextFilters,
  applyContextFilters,
} from "@/utils/indicators";

const TerritorialMap = dynamic(() => import("@/components/map/territorial-map"), {
  ssr: false,
  loading: () => <WorkspaceLoading />,
});
export function WorkspaceLoading() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rounded" height={300} />
      <Typography role="status" variant="body2" sx={{ mt: 1.5 }}>
        Cargando los datos del mapa…
      </Typography>
    </Box>
  );
}

export function Explorer() {
  const query = useDataset();
  const params = useExplorerQuery();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const [detailOpen, setDetailOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<MapPanel>(() =>
    params.get("municipio") ? "detail" : null
  );
  const workspace = useRef<HTMLDivElement>(null);
  const restoreScroll = useRef(0);
  const returnView = useRef(params.get("vista") === "tabla" ? "tabla" : "mapa");
  const search = params.get("buscar") ?? "";
  const deferredSearch = useDeferredValue(search);
  const rawState = params.get("entidad") ?? "";
  const rawRisk = params.get("riesgo") ?? "";
  const rawSelected = params.get("municipio") ?? "";
  const requestedMapMode = params.get("modo") === "mapa";
  const view = !requestedMapMode && params.get("vista") === "tabla" ? "tabla" : "mapa";
  const comparing = params.get("comparar") === "1";
  const dataset = query.data;
  const presentationQuery = new URLSearchParams(
    ["pestana", "indicador", "grupo", "seguridad", "anio"].map((key) => [
      key,
      params.get(key) ?? "",
    ])
  ).toString();
  const contextQuery = new URLSearchParams(
    ["tamano", "ayuntamiento", "costumbres", "alerta"].map((key) => [key, params.get(key) ?? ""])
  ).toString();
  const presentation = useMemo(
    () => readPresentation(new URLSearchParams(presentationQuery)),
    [presentationQuery]
  );
  const contextFilters = useMemo(
    () => readContextFilters(new URLSearchParams(contextQuery)),
    [contextQuery]
  );
  const isContext = Boolean(dataset && !dataset.sample && presentation.tab === "contexto");
  const mapInfo = useMemo(
    () => (dataset && !dataset.sample ? mapPresentation(dataset, presentation) : null),
    [dataset, presentation]
  );
  const mapMode = requestedMapMode && Boolean(dataset);
  const state = dataset?.municipalities.some((m) => m.stateCode === rawState) ? rawState : "";
  const risk = Object.hasOwn(riskTokens, rawRisk) ? rawRisk : "";
  const defaults = defaultScenarios(dataset?.scenarios ?? []);
  const scenario = dataset?.scenarios.some((s) => s.id === params.get("escenario"))
    ? params.get("escenario")!
    : defaults[0];
  const requestedSecond = dataset?.scenarios.some((s) => s.id === params.get("segundo"))
    ? params.get("segundo")!
    : defaults[1];
  const scenarioInfo = dataset?.scenarios.find((item) => item.id === scenario);
  const second =
    dataset && !dataset.sample
      ? (dataset.scenarios.find(
          (item) =>
            item.national === scenarioInfo?.national &&
            item.intervention !== scenarioInfo?.intervention
        )?.id ?? "")
      : requestedSecond;
  const historyFilter = params.get("historia"),
    geometryFilter = params.get("cartografia"),
    minimum = params.get("ln_min"),
    maximum = params.get("ln_max");
  const advanced = useMemo(
    () =>
      readAdvancedFilters(
        new URLSearchParams({
          historia: historyFilter ?? "",
          cartografia: geometryFilter ?? "",
          ln_min: minimum ?? "",
          ln_max: maximum ?? "",
        })
      ),
    [historyFilter, geometryFilter, minimum, maximum]
  );
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
  const updateFilters = useCallback(
    (changes: Record<string, string>) => {
      update({ ...changes, municipio: "", pagina: "" });
      setActivePanel((panel) => (panel === "detail" ? null : panel));
    },
    [update]
  );
  const updateScenarios = useCallback(
    (changes: Record<string, string>) => update({ ...changes, pagina: "" }),
    [update]
  );
  const onSelect = useCallback(
    (code: string) => {
      update({ municipio: code });
      if (mapMode) setActivePanel((panel) => (code ? "detail" : panel === "detail" ? null : panel));
      else setDetailOpen(Boolean(code));
    },
    [update, mapMode]
  );
  const items = useMemo(
    () =>
      dataset
        ? applyContextFilters(
            applyAdvancedFilters(
              filterMunicipalities(dataset, deferredSearch, state, risk, scenario),
              advanced
            ),
            dataset.sample
              ? { tamano: "", ayuntamiento: "", costumbres: "", alerta: "" }
              : contextFilters
          )
        : [],
    [dataset, deferredSearch, state, risk, scenario, advanced, contextFilters]
  );
  const tableState = readTableState(params, isContext);
  const orderedItems = useMemo(
    () =>
      dataset
        ? orderMunicipalities(
            dataset,
            items,
            scenario,
            tableState.column,
            tableState.direction,
            isContext ? mapInfo?.paints : undefined
          )
        : [],
    [dataset, items, scenario, tableState.column, tableState.direction, isContext, mapInfo]
  );
  const visibleIds = useMemo(() => items.map((m) => m.id), [items]);
  const states = useMemo(
    () =>
      dataset
        ? [...new Map(dataset.municipalities.map((m) => [m.stateCode, m.state])).entries()].sort(
            (a, b) => a[1].localeCompare(b[1], "es")
          )
        : [],
    [dataset]
  );
  const selected = items.some((m) => m.id === rawSelected) ? rawSelected : "";
  const selectedMunicipality = dataset ? municipalityById(dataset, selected) : undefined;
  const withEstimate = dataset
    ? items.filter((m) => estimateFor(dataset, scenario, m.id).participation !== null).length
    : 0;
  const cards = useMemo(
    () => (dataset && !dataset.sample ? controlCards(dataset, items, scenario, presentation) : []),
    [dataset, items, scenario, presentation]
  );
  const legend =
    dataset && !dataset.sample ? (
      <ResultsLegend
        title={isContext ? (mapInfo?.title ?? "Indicadores") : "Pronóstico 2027"}
        description={
          isContext
            ? (mapInfo?.description ?? "")
            : "Rojo indica mayor riesgo de baja participación respecto de otros municipios. El filtro conserva el color sin intervención; el mapa muestra el escenario elegido. La falta de casillas se consulta por separado."
        }
        entries={isContext ? (mapInfo?.legend ?? []) : forecastLegend()}
      />
    ) : (
      <RiskLegend />
    );
  const modeLegend =
    dataset && !dataset.sample ? (
      <ResultsLegend
        compact
        title={isContext ? (mapInfo?.title ?? "Indicadores") : "Pronóstico 2027"}
        description={
          isContext
            ? (mapInfo?.description ?? "")
            : "Semáforo del escenario seleccionado. Intervención: supuesto, no efecto medido."
        }
        entries={isContext ? (mapInfo?.legend ?? []) : forecastLegend()}
      />
    ) : undefined;
  const details =
    dataset && !dataset.sample && selectedMunicipality ? (
      <ResultsDetails
        dataset={dataset}
        municipality={selectedMunicipality}
        scenario={scenario}
        presentation={presentation}
        contextLabel={isContext ? mapInfo?.paints[selected]?.label : undefined}
        {...(comparing ? { second } : {})}
      />
    ) : dataset ? (
      <MunicipalityDetails
        dataset={dataset}
        municipality={selectedMunicipality}
        scenario={scenario}
        compactEmpty
        hideHeadingLabel={mapMode}
        {...(comparing ? { second } : {})}
      />
    ) : null;
  const scenarioPanel = dataset ? (
    <Box>
      {!dataset.sample && mapMode && (
        <Box sx={{ p: 2, pb: 0 }}>
          <ResultsViews presentation={presentation} onChange={updateScenarios} compact />
          <Box sx={{ mt: 1 }}>
            <ResultsCards
              cards={cards}
              count={items.length}
              withData={items.filter((item) => item.hasData).length}
            />
          </Box>
        </Box>
      )}
      {dataset.sample || presentation.tab === "pronostico" ? (
        <ExplorerScenarios
          dataset={dataset}
          scenario={scenario}
          second={second}
          comparing={comparing}
          onChange={updateScenarios}
        />
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography component="h2" variant="subtitle2">
            {mapInfo?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mapInfo?.description}
          </Typography>
        </Box>
      )}
    </Box>
  ) : null;

  const download = () => {
    if (dataset)
      saveFile(
        `municipios-${dataset.version}.csv`,
        "\uFEFF" +
          selectionCsv(dataset, orderedItems, scenario, isContext && mapInfo ? mapInfo : undefined),
        "text/csv;charset=utf-8"
      );
  };
  const closePanel = useCallback(() => {
    const trigger = activePanel;
    setActivePanel(null);
    if (trigger)
      document
        .querySelector<HTMLElement>(`[data-panel-trigger="${trigger}"]`)
        ?.focus({ preventScroll: true });
  }, [activePanel]);
  const exitMapMode = useCallback(() => {
    setActivePanel(null);
    update({ modo: "", vista: returnView.current === "tabla" ? "tabla" : "" });
  }, [update]);
  useMapMode(mapMode, workspace, restoreScroll, () => {
    if (activePanel) closePanel();
    else exitMapMode();
  });
  const enterMapMode = () => {
    restoreScroll.current = window.scrollY;
    returnView.current = view;
    setDetailOpen(false);
    setScenarioOpen(false);
    setActivePanel(selected ? "detail" : null);
    update({ modo: "mapa", vista: "" });
  };
  const filterProps = {
    search,
    state,
    risk,
    advanced,
    states,
    mobile,
    count: items.length,
    onChange: updateFilters,
    sample: dataset?.sample ?? true,
    contextFilters: dataset && !dataset.sample ? contextFilters : undefined,
  };

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: mapMode ? "none" : "block" }}>
        <ExplorerHeader
          onMapMode={enterMapMode}
          mapDisabled={!dataset}
          sample={dataset?.sample ?? false}
        />
      </Box>
      {query.isPending && <WorkspaceLoading />}
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => void query.refetch()}>Reintentar</Button>}
        >
          No pudimos cargar los resultados. Reintenta; si el problema continúa, recarga la página.
        </Alert>
      )}
      {dataset && (
        <EntranceScope
          sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", minWidth: 0, gap: 1.5 }}
        >
          {!dataset.sample && !mapMode && (
            <ResultsViews presentation={presentation} onChange={updateScenarios} />
          )}
          <Box sx={{ display: mapMode ? "none" : "block" }}>
            <ExplorerFilters {...filterProps} />
          </Box>
          <Box
            ref={workspace}
            id="territorial-content"
            data-pw="explorer-workspace"
            data-map-mode={mapMode ? "true" : "false"}
            role={mapMode ? "region" : !dataset.sample ? "tabpanel" : undefined}
            aria-labelledby={!mapMode && !dataset.sample ? `tab-${presentation.tab}` : undefined}
            aria-label={mapMode ? "Exploración en modo mapa" : undefined}
            tabIndex={-1}
            sx={{
              display: "grid",
              gridTemplateColumns: mapMode ? "1fr" : { xs: "1fr", md: "minmax(0, 1fr) 340px" },
              gap: mapMode ? 0 : 2,
              alignItems: "start",
              outline: "none",
              ...(mapMode
                ? {
                    position: "fixed",
                    inset: 0,
                    height: "100dvh",
                    zIndex: theme.zIndex.drawer,
                    bgcolor: "background.default",
                  }
                : {}),
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                overflow: "hidden",
                minWidth: 0,
                ...(mapMode
                  ? { position: "absolute", inset: 0, height: "100%", border: 0, borderRadius: 0 }
                  : {}),
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: mapMode ? "none" : { xs: "grid", sm: "flex" },
                  gridTemplateColumns: "minmax(0, 1fr) auto auto",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ButtonGroup size="small" aria-label="Vista territorial">
                  <Button
                    variant={view === "mapa" ? "contained" : "outlined"}
                    aria-pressed={view === "mapa"}
                    startIcon={<Icon name="map" size={16} />}
                    onClick={() => update({ vista: "" })}
                  >
                    Mapa
                  </Button>
                  <Button
                    variant={view === "tabla" ? "contained" : "outlined"}
                    aria-pressed={view === "tabla"}
                    startIcon={<Icon name="table" size={16} />}
                    onClick={() => update({ vista: "tabla" })}
                  >
                    Tabla
                  </Button>
                </ButtonGroup>
                <Typography
                  variant="caption"
                  role="status"
                  aria-live="polite"
                  sx={{
                    flex: "1 1 auto",
                    color: "text.secondary",
                    gridColumn: { xs: "1 / -1", sm: "auto" },
                    order: { xs: 4, sm: 0 },
                  }}
                >
                  <strong>{formatInteger(items.length)}</strong>{" "}
                  {items.length === 1 ? "municipio" : "municipios"} · {formatInteger(withEstimate)}{" "}
                  con estimación
                </Typography>
                {mobile && (
                  <Button
                    size="small"
                    startIcon={<Icon name="compare" size={16} />}
                    onClick={() => setScenarioOpen(true)}
                  >
                    Escenarios
                  </Button>
                )}
                <Tooltip title="Todos los municipios filtrados, no sólo la página de tabla">
                  <span>
                    <Button
                      size="small"
                      variant="text"
                      aria-label="Descargar tabla (CSV)"
                      sx={{ minWidth: { xs: 32, sm: 64 }, gap: 0.75 }}
                      disabled={!items.length}
                      onClick={download}
                    >
                      <Icon name="download" size={16} />
                      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                        Descargar tabla (CSV)
                      </Box>
                    </Button>
                  </span>
                </Tooltip>
              </Box>
              {view === "mapa" ? (
                <Box
                  data-pw="map-workspace"
                  sx={{
                    height: mapMode
                      ? "100%"
                      : !dataset.sample
                        ? {
                            xs: "clamp(240px, calc(100dvh - 535px), 480px)",
                            sm: "clamp(280px, calc(100dvh - 460px), 620px)",
                            lg: "clamp(300px, calc(100dvh - 445px), 640px)",
                          }
                        : {
                            xs: "clamp(280px, calc(100dvh - 420px), 480px)",
                            sm: "clamp(340px, calc(100dvh - 360px), 620px)",
                            lg: "clamp(360px, calc(100dvh - 340px), 640px)",
                          },
                    position: "relative",
                  }}
                >
                  <TerritorialMap
                    dataset={dataset}
                    visibleIds={visibleIds}
                    selectedId={selected}
                    scenario={scenario}
                    stateFilter={state}
                    onSelect={onSelect}
                    mapMode={mapMode}
                    panelOpen={Boolean(activePanel)}
                    paints={isContext ? mapInfo?.paints : undefined}
                  />
                </Box>
              ) : (
                <MunicipalityTable
                  dataset={dataset}
                  items={orderedItems}
                  selected={selected}
                  scenario={scenario}
                  context={isContext ? mapInfo?.paints : undefined}
                  contextTitle={isContext ? mapInfo?.title : undefined}
                  onSelect={onSelect}
                  state={tableState}
                  onSort={(column) => {
                    // Next puede publicar searchParams después del siguiente clic.
                    const currentParams = new URLSearchParams(window.location.search);
                    const current = readTableState(
                      currentParams,
                      Boolean(
                        dataset &&
                        !dataset.sample &&
                        readPresentation(currentParams).tab === "contexto"
                      )
                    );
                    update({
                      orden: column,
                      direccion:
                        current.column === column && current.direction === "asc" ? "desc" : "asc",
                      pagina: "",
                    });
                  }}
                  onPage={(page) => update({ pagina: page > 0 ? String(page + 1) : "" })}
                  onPageSize={(size) => update({ filas: String(size), pagina: "" })}
                />
              )}
              {!mapMode && legend}
              {!dataset.sample && !mapMode && mobile && (
                <Box sx={{ p: 1.5, borderTop: 1, borderColor: "divider" }}>
                  <ResultsCards
                    cards={cards}
                    count={items.length}
                    withData={items.filter((item) => item.hasData).length}
                  />
                </Box>
              )}
              {!mapMode && selectedMunicipality && mobile && (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: "action.hover",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">{selectedMunicipality.name}</Typography>
                  <Button
                    onClick={() => setDetailOpen(true)}
                    endIcon={<Icon name="chevron" size={16} />}
                  >
                    Ver ficha
                  </Button>
                </Box>
              )}
            </Paper>
            {!mobile && !mapMode && (
              <Paper
                component="aside"
                aria-label="Ficha municipal"
                variant="outlined"
                sx={{ minWidth: 0, overflow: "hidden" }}
              >
                {!dataset.sample && (
                  <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                    <ResultsCards
                      compact
                      cards={cards}
                      count={items.length}
                      withData={items.filter((item) => item.hasData).length}
                    />
                  </Box>
                )}
                {scenarioPanel}
                <Box sx={{ borderTop: 1, borderColor: "divider" }}>{details}</Box>
              </Paper>
            )}
            {mapMode && (
              <MapModeChrome
                search={search}
                count={items.length}
                filterCount={
                  advancedFilterCount(advanced) +
                  Number(Boolean(state)) +
                  Number(Boolean(risk)) +
                  (dataset.sample ? 0 : Object.values(contextFilters).filter(Boolean).length)
                }
                error={nominalRangeError(advanced)}
                municipality={selectedMunicipality}
                singleResult={items.length === 1 ? items[0] : undefined}
                risk={selected ? estimateFor(dataset, scenario, selected).risk : "sin_estimacion"}
                panel={activePanel}
                filters={<ExplorerFilters {...filterProps} floating onClose={closePanel} />}
                scenarios={scenarioPanel}
                details={details}
                onSearch={(value) => updateFilters({ buscar: value })}
                onExit={exitMapMode}
                onPanel={(panel) => {
                  if (panel === activePanel) closePanel();
                  else setActivePanel(panel);
                }}
                onClosePanel={closePanel}
                onDownload={download}
                onTable={() => {
                  returnView.current = "tabla";
                  exitMapMode();
                }}
                onSelect={onSelect}
                sample={dataset.sample}
                viewLabel={dataset.sample ? undefined : mapInfo?.title}
                legend={modeLegend}
                selectionLabel={isContext ? mapInfo?.paints[selected]?.label : undefined}
              />
            )}
          </Box>
          {!mapMode && (
            <Typography
              component="p"
              variant="caption"
              color="text.secondary"
              sx={{ m: 0, px: 0.5 }}
            >
              {dataset.sample
                ? "El mapa muestra el escenario A en la lectura doble. La referencia predictora corresponde al modelo."
                : `${dataset.version}. ${isContext ? "Los indicadores de contexto se leen separados del pronóstico." : "El modelo ordena municipios; el nivel nacional es un supuesto. La intervención no es un efecto medido."}`}{" "}
              <a href="/datos/">Datos, fuentes y cartografía</a>.
            </Typography>
          )}
          {mobile && !mapMode && (
            <>
              <Dialog
                open={scenarioOpen}
                onClose={() => setScenarioOpen(false)}
                fullWidth
                maxWidth="sm"
                aria-labelledby="mobile-scenarios-title"
              >
                <DialogTitle id="mobile-scenarios-title">Configurar escenarios</DialogTitle>
                <DialogContent sx={{ p: 0 }}>{scenarioPanel}</DialogContent>
                <DialogActions>
                  <Button onClick={() => setScenarioOpen(false)}>Volver al mapa</Button>
                </DialogActions>
              </Dialog>
              <Drawer
                anchor="bottom"
                open={detailOpen && Boolean(selectedMunicipality)}
                onClose={() => setDetailOpen(false)}
                slotProps={{
                  paper: {
                    sx: {
                      maxHeight: "88dvh",
                      borderRadius: `${radii.overlay} ${radii.overlay} 0 0`,
                    },
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1, pt: 1 }}>
                  <IconButton aria-label="Cerrar ficha" onClick={() => setDetailOpen(false)}>
                    <Icon name="close" />
                  </IconButton>
                </Box>
                {details}
              </Drawer>
            </>
          )}
        </EntranceScope>
      )}
    </Stack>
  );
}
