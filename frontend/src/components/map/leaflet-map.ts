import * as L from "leaflet";
import type { Dataset } from "@/types/dataset";
import type { MunicipalGeometry } from "@/utils/municipal-geometry";
import { estimateFor } from "@/utils/dataset";
import { riskTokens, explorerLayout, motionTokens } from "@/theme/tokens";
import { createPatternCanvas } from "./pattern-canvas";
import type { MapPaint } from "@/utils/indicators";

export type MapState = {
  visibleIds: string[];
  selectedId: string;
  scenario: string;
  stateFilter: string;
  dark: boolean;
  mapMode: boolean;
  panelOpen: boolean;
  paints?: Record<string, MapPaint> | undefined;
};

export function createTerritorialMap(
  target: HTMLDivElement,
  geometry: MunicipalGeometry,
  dataset: Dataset,
  initial: MapState,
  onSelect: (id: string) => void
) {
  const renderer = createPatternCanvas();
  const map = L.map(target, {
    renderer,
    preferCanvas: true,
    zoomControl: false,
    attributionControl: false,
    zoomSnap: 0,
    minZoom: 3,
    maxZoom: 12,
    keyboard: true,
  }).setView([23.94, -102.54], 4);
  let current = initial;
  let visible = new Set(initial.visibleIds);
  let disposed = false;
  let flying = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let selectionTimer: ReturnType<typeof setTimeout> | undefined;
  let firstFrame = 0,
    secondFrame = 0,
    resizeFrame = 0;
  let outline: L.LayerGroup | undefined;
  const layers = new Map<string, L.Polygon>();
  const style = (id: string): L.PathOptions => ({
    fillColor:
      current.paints?.[id]?.color ??
      riskTokens[estimateFor(dataset, current.scenario, id).risk].map,
    fillOpacity: 1,
    color: current.dark ? "#404859" : "#586171",
    weight: 0.45,
    opacity: 1,
  });
  const ready = () => {
    target.dataset.mapReady = "false";
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (disposed || flying) return;
        target.dataset.selectedId = current.selectedId;
        target.dataset.mapVisible = String([...visible].filter((id) => layers.has(id)).length);
        target.dataset.mapScenario = current.scenario;
        target.dataset.mapReady = "true";
      });
    });
  };
  const cancelSelection = () => clearTimeout(selectionTimer);
  const viewChanged = () => {
    const center = map.getCenter();
    target.dataset.mapView = [center.lng, center.lat, map.getZoom()]
      .map((n) => n.toFixed(6))
      .join(",");
  };
  const finishFlight = () => {
    if (!flying) return;
    flying = false;
    target.dataset.mapMotion = "idle";
    ready();
  };
  const stopFlight = () => {
    if (!flying) return;
    finishFlight();
    map.stop();
    viewChanged();
  };
  map.on("dblclick", cancelSelection);
  map.on("moveend zoomend", viewChanged);
  map.on("moveend", finishFlight);
  target.dataset.mapMotion = "idle";
  target.addEventListener("pointerdown", stopFlight, true);
  target.addEventListener("wheel", stopFlight, { capture: true, passive: true });
  target.addEventListener("keydown", stopFlight, true);
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!disposed) {
        const resumeFlight = flying;
        stopFlight();
        const center = map.getCenter(),
          zoom = map.getZoom();
        map.invalidateSize({ pan: false, animate: false });
        map.setView(center, zoom, { animate: false });
        if (resumeFlight) fit(true);
        ready();
      }
    });
  });
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    reducedMotion.removeEventListener("change", motionPreferenceChanged);
    target.removeEventListener("pointerdown", stopFlight, true);
    target.removeEventListener("wheel", stopFlight, true);
    target.removeEventListener("keydown", stopFlight, true);
    cancelSelection();
    for (const frame of [firstFrame, secondFrame, resizeFrame]) cancelAnimationFrame(frame);
    map.remove();
    delete target.dataset.mapReady;
    delete target.dataset.mapView;
    delete target.dataset.mapMotion;
  };
  let fit: (animate?: boolean) => void;
  const motionPreferenceChanged = () => {
    if (!reducedMotion.matches || !flying) return;
    stopFlight();
    fit();
    ready();
  };
  reducedMotion.addEventListener("change", motionPreferenceChanged);
  try {
    const group = L.geoJSON(geometry, {
      style: (feature) => style(String(feature?.properties.CVEGEO)),
      onEachFeature(feature, layer) {
        const id = feature.properties.CVEGEO;
        layers.set(id, layer as L.Polygon);
        layer.on("click", () => {
          cancelSelection();
          selectionTimer = setTimeout(() => {
            if (!disposed && visible.has(id)) onSelect(id);
          }, 250);
        });
        layer.on("mouseover", () => {
          target.style.cursor = "pointer";
        });
        layer.on("mouseout", () => {
          target.style.cursor = "grab";
        });
      },
    }).addTo(map);
    const country = group.getBounds();
    const applyVisibility = () => {
      for (const [id, layer] of layers) {
        if (visible.has(id)) {
          if (!group.hasLayer(layer)) group.addLayer(layer);
        } else group.removeLayer(layer);
      }
    };
    const selectOutline = () => {
      if (outline) map.removeLayer(outline);
      outline = undefined;
      const selected = layers.get(current.selectedId)?.feature;
      if (selected && visible.has(current.selectedId)) {
        outline = L.layerGroup([
          L.geoJSON(selected, {
            interactive: false,
            style: { fill: false, color: "#FFFFFF", weight: 6 },
          }),
          L.geoJSON(selected, {
            interactive: false,
            style: { fill: false, color: current.dark ? "#E9E5FF" : "#32249B", weight: 3 },
          }),
        ]).addTo(map);
      }
    };
    const safePadding = (selected: boolean) => {
      const base = selected ? 50 : 24;
      let left = base,
        top = base,
        right = base,
        bottom = base;
      if (current.mapMode && current.panelOpen) {
        const width = target.clientWidth,
          height = target.clientHeight;
        const side = width >= 900 || (width >= 780 && height <= 500);
        if (side) {
          const compact = width <= 1100;
          left =
            (compact ? explorerLayout.compactToolbar : explorerLayout.toolbar) +
            explorerLayout.inset +
            16;
          right =
            (compact ? explorerLayout.compactPanel : explorerLayout.panel) +
            explorerLayout.zoomReserve +
            16;
        } else {
          bottom = height * explorerLayout.sheetFraction + explorerLayout.narrowInset + 16;
          const toolbar = target
            .closest('[data-pw="explorer-workspace"]')
            ?.querySelector('[data-pw="map-mode-controls"]');
          const toolbarBottom = toolbar
            ? toolbar.getBoundingClientRect().bottom - target.getBoundingClientRect().top + 12
            : selected
              ? 240
              : 196;
          top = Math.min(toolbarBottom, Math.max(24, height - bottom - 64));
        }
      }
      return { paddingTopLeft: L.point(left, top), paddingBottomRight: L.point(right, bottom) };
    };
    fit = (animate = false) => {
      stopFlight();
      const selected = visible.has(current.selectedId) ? layers.get(current.selectedId) : undefined;
      const bounds = selected?.getBounds() ?? L.latLngBounds([]);
      if (!selected)
        for (const id of visible) {
          const layer = layers.get(id);
          if (layer) bounds.extend(layer.getBounds());
        }
      if (bounds.isValid()) {
        const options = {
          ...safePadding(Boolean(selected)),
          maxZoom: selected ? 10 : 12,
        };
        if (
          animate &&
          selected &&
          motionTokens.duration.mapFlight > 0 &&
          !reducedMotion.matches &&
          L.Browser.any3d
        ) {
          flying = true;
          target.dataset.mapMotion = "flying";
          target.dataset.mapReady = "false";
          // Los ensayos con 2 y 8 redibujados intermedios introdujeron pausas
          // y empeoraron la UX. Conservar el escalado nativo hasta terminar el vuelo.
          map.flyToBounds(bounds, {
            ...options,
            duration: motionTokens.duration.mapFlight / 1000,
          });
        } else map.fitBounds(bounds, { ...options, animate: false });
      }
    };
    const background = () => {
      target.style.background = current.dark ? "#252C39" : "#EEF0EB";
    };
    applyVisibility();
    selectOutline();
    background();
    fit();
    viewChanged();
    observer.observe(target);
    target.dataset.mapEngine = "leaflet-canvas";
    ready();
    return {
      update(next: MapState) {
        if (disposed) return;
        const maskChanged = current.visibleIds.join(",") !== next.visibleIds.join(",");
        const selectionChanged = current.selectedId !== next.selectedId;
        const layoutChanged =
          current.mapMode !== next.mapMode || current.panelOpen !== next.panelOpen;
        const panelOpening =
          next.mapMode && next.panelOpen && (!current.panelOpen || !current.mapMode);
        const refit = maskChanged || selectionChanged || current.stateFilter !== next.stateFilter;
        const repaint =
          current.scenario !== next.scenario ||
          current.dark !== next.dark ||
          current.paints !== next.paints;
        const outlineChanged =
          current.selectedId !== next.selectedId || current.dark !== next.dark || maskChanged;
        current = next;
        visible = new Set(next.visibleIds);
        cancelSelection();
        if (repaint) for (const [id, layer] of layers) layer.setStyle(style(id));
        if (maskChanged) applyVisibility();
        if (outlineChanged) selectOutline();
        background();
        if (refit) fit(selectionChanged && Boolean(current.selectedId));
        else if (layoutChanged && flying) fit(true);
        else if (panelOpening && current.selectedId) {
          const selected = layers.get(current.selectedId);
          if (selected)
            map.panInside(selected.getBounds().getCenter(), {
              ...safePadding(true),
              animate: false,
            });
        }
        ready();
      },
      zoom(delta: number) {
        stopFlight();
        map.setZoom(Math.max(3, Math.min(12, map.getZoom() + delta)), { animate: false });
      },
      reset() {
        cancelSelection();
        stopFlight();
        current = { ...current, selectedId: "" };
        selectOutline();
        if (country.isValid())
          map.fitBounds(country, { padding: [24, 24], animate: false, maxZoom: 12 });
        ready();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

export type TerritorialMapController = ReturnType<typeof createTerritorialMap>;
