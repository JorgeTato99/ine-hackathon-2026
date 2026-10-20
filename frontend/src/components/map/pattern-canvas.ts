import * as L from "leaflet";
import { riskTokens } from "@/theme/tokens";

type CanvasInternals = L.Canvas & {
  _fillStroke(context: CanvasRenderingContext2D, layer: L.Path): void;
};

/** Adaptación acotada a Leaflet 1.9.4; fillColor conserva un color CSS válido. */
export function createPatternCanvas(): L.Canvas {
  const patterns = new Map<string, CanvasPattern>();
  for (const [risk, token] of Object.entries(riskTokens)) {
    if (risk === "bajo") continue;
    const tile = document.createElement("canvas");
    tile.width = tile.height = 10;
    const context = tile.getContext("2d");
    if (!context) throw new Error("Canvas no está disponible. La tabla sigue disponible.");
    context.fillStyle = token.map;
    context.fillRect(0, 0, 10, 10);
    context.strokeStyle = "#36415266";
    context.fillStyle = "#36415288";
    context.lineWidth = 0.8;
    if (risk === "medio") {
      context.beginPath();
      context.arc(5, 5, 1, 0, Math.PI * 2);
      context.fill();
    } else {
      context.beginPath();
      context.moveTo(0, 10);
      context.lineTo(10, 0);
      if (risk === "sin_estimacion") {
        context.moveTo(0, 0);
        context.lineTo(10, 10);
      }
      context.stroke();
    }
    const pattern = context.createPattern(tile, "repeat");
    if (!pattern) throw new Error("No se pudieron dibujar las tramas. La tabla sigue disponible.");
    patterns.set(token.map, pattern);
  }

  // Hook interno de la versión fijada. Se adapta sólo el relleno; Leaflet
  // conserva geometría, detección de clics y trazos de borde.
  const nativeCanvas = L.Canvas.prototype as CanvasInternals;
  if (typeof nativeCanvas._fillStroke !== "function")
    throw new Error("Renderer Canvas incompatible. La tabla sigue disponible.");
  const PatternCanvas = L.Canvas.extend({
    _fillStroke(this: L.Canvas, context: CanvasRenderingContext2D, layer: L.Path) {
      const options = layer.options;
      const fill = options.fill;
      if (fill) {
        const color = options.fillColor ?? options.color ?? "#3388ff";
        context.globalAlpha = options.fillOpacity ?? 0.2;
        context.fillStyle = patterns.get(color) ?? color;
        context.fill(options.fillRule === "nonzero" ? "nonzero" : "evenodd");
      }
      try {
        options.fill = false;
        nativeCanvas._fillStroke.call(this, context, layer);
      } finally {
        if (fill === undefined) delete options.fill;
        else options.fill = fill;
      }
    },
  }) as typeof L.Canvas;
  return new PatternCanvas({ padding: 0.5 });
}
