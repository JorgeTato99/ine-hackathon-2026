import { explorerLayout } from "@/theme/tokens";

const center = "(100% + var(--tc-map-tools-width, 0px) - var(--tc-map-detail-width, 0px)) / 2";
export const mapDockCenter = { xs: "50%", md: `calc(${center})` };

/** Centrar los dos grupos entre los paneles laterales, con una segunda fila en ventanas pequeñas. */
export function mapDockPosition(group: "navigation" | "actions") {
  const dock = explorerLayout.mapMode.dock;
  const offset = (dock.navigationWidth - dock.actionsWidth + dock.gap) / 2;
  return {
    left: { ...mapDockCenter, lg: `calc(${center} + ${offset}px)` },
    bottom: {
      xs: group === "navigation" ? dock.bottom + dock.height + dock.gap : dock.bottom,
      lg: dock.bottom,
    },
    transform: {
      xs: "translateX(-50%)",
      lg: group === "navigation" ? `translateX(calc(-100% - ${dock.gap}px))` : "none",
    },
    width: group === "navigation" ? dock.navigationWidth : dock.actionsWidth,
    height: dock.height,
  };
}
