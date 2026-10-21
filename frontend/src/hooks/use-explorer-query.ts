"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";

const queryEvent = "traza:consulta";
const snapshot = () => window.location.search;
// La exportación estática no conoce la consulta de quien abre la página.
const serverSnapshot = () => "";

function subscribe(listener: () => void) {
  window.addEventListener(queryEvent, listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener(queryEvent, listener);
    window.removeEventListener("popstate", listener);
  };
}

/** Publicar después de escribir history mantiene sincrónicos los controles. */
export function notifyExplorerQuery() {
  window.dispatchEvent(new Event(queryEvent));
}

/** URL como fuente única; Next sigue notificando navegaciones externas. */
export function useExplorerQuery() {
  // Mantener también el montaje cliente bajo Suspense del export estático.
  useSearchParams();
  const search = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => new URLSearchParams(search), [search]);
}
