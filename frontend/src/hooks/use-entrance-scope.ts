"use client";

import { useEffect, useRef } from "react";
import { motionTokens } from "@/theme/tokens";

/** Observa entradas editoriales una vez; el contenido nunca depende de esta mejora para ser visible. */
export function useEntranceScope() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const targets = [...scope.querySelectorAll<HTMLElement>("[data-entrance]")];
    const order = new Map(targets.map((target, index) => [target, index]));
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;
    let disposed = false;

    const settle = (target: HTMLElement) => {
      target.dataset.entranceState = "settled";
      observer?.unobserve(target);
    };
    const reduce = () => {
      if (disposed || !preference.matches) return;
      scope.dataset.entranceReduced = "true";
      targets.forEach(settle);
      observer?.disconnect();
    };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Node)
        for (const target of targets) if (target.contains(event.target)) settle(target);
    };

    if (preference.matches) reduce();
    else if (typeof IntersectionObserver === "undefined")
      targets.filter((target) => target.dataset.entrance !== "hero").forEach(settle);
    else {
      observer = new IntersectionObserver(
        (entries) => {
          if (disposed || preference.matches) return;
          const groups = new Map<Element, number>();
          const incoming = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
              (a, b) =>
                (order.get(a.target as HTMLElement) ?? 0) -
                (order.get(b.target as HTMLElement) ?? 0)
            );
          for (const entry of incoming) {
            const target = entry.target as HTMLElement;
            if (target.dataset.entranceState) continue;
            if (target.contains(document.activeElement)) {
              settle(target);
              continue;
            }
            const group =
              target.dataset.entrance === "item" || target.dataset.entrance === "card"
                ? target.closest("[data-entrance-group]")
                : null;
            const index = group ? (groups.get(group) ?? 0) : 0;
            if (group) groups.set(group, index + 1);
            target.style.setProperty(
              "--tc-entrance-delay",
              `${Math.min(index * motionTokens.stagger.step, motionTokens.stagger.max)}ms`
            );
            target.dataset.entranceState = "entered";
            observer?.unobserve(target);
          }
        },
        { threshold: 0, rootMargin: "0px 0px -24px 0px" }
      );
      for (const target of targets)
        if (target.dataset.entrance !== "hero") observer.observe(target);
    }
    preference.addEventListener("change", reduce);
    scope.addEventListener("focusin", focus);
    return () => {
      disposed = true;
      observer?.disconnect();
      preference.removeEventListener("change", reduce);
      scope.removeEventListener("focusin", focus);
    };
  }, []);

  return root;
}
