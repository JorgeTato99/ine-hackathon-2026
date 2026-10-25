"use client";

import { useEffect, useRef, type RefObject } from "react";

function visible(element: HTMLElement) {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || node.hasAttribute("inert"))
      return false;
  }
  return true;
}

/** Aísla el workspace ampliado sin convertir sus paneles en diálogos modales. */
export function useMapMode(
  active: boolean,
  container: RefObject<HTMLElement | null>,
  restoreScroll: RefObject<number>,
  onEscape: () => void,
  returnFocus?: RefObject<HTMLElement | null>
) {
  const escape = useRef(onEscape);
  const restoreFrame = useRef(0);
  useEffect(() => {
    escape.current = onEscape;
  }, [onEscape]);
  useEffect(() => {
    if (!active) return;
    cancelAnimationFrame(restoreFrame.current);
    const root = document.documentElement;
    const workspace = container.current;
    const previousScroll = restoreScroll.current;
    const origin = returnFocus?.current;
    const previousMode = root.getAttribute("data-map-mode");
    const chrome = [...document.querySelectorAll<HTMLElement>("[data-app-chrome], .skip-link")].map(
      (element) => ({
        element,
        inert: element.hasAttribute("inert"),
        hidden: element.getAttribute("aria-hidden"),
      })
    );
    // Mover el foco antes de ocultar el botón que abrió el modo.
    container.current?.focus({ preventScroll: true });
    root.setAttribute("data-map-mode", "true");
    for (const { element } of chrome) {
      element.inert = true;
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"], [role="listbox"], [role="menu"]')
      )
        return;
      event.preventDefault();
      escape.current();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (previousMode === null) root.removeAttribute("data-map-mode");
      else root.setAttribute("data-map-mode", previousMode);
      for (const { element, inert, hidden } of chrome) {
        element.inert = inert;
        if (!inert) element.removeAttribute("inert");
        if (hidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", hidden);
      }
      const fallback = () => document.querySelector<HTMLElement>('[data-pw="enter-map-mode"]');
      // El documento recupera altura después de retirar el workspace fijo.
      // Restaurar antes de ese layout puede acotar el scroll a cero en móvil.
      const restore = (remaining: number) => {
        restoreFrame.current = 0;
        // Una navegación o desmontaje no debe trasladar el foco a otra vista.
        if (!workspace?.isConnected) return;
        const trigger = origin?.isConnected && visible(origin) ? origin : fallback();
        if (!trigger?.isConnected || root.getAttribute("data-map-mode") === "true") return;
        const available = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (available < previousScroll && remaining > 0) {
          restoreFrame.current = requestAnimationFrame(() => restore(remaining - 1));
          return;
        }
        trigger.focus({ preventScroll: true });
        if (window.scrollY !== previousScroll)
          window.scrollTo({ top: previousScroll, behavior: "instant" });
      };
      restoreFrame.current = requestAnimationFrame(() => restore(4));
    };
  }, [active, container, restoreScroll, returnFocus]);
}
