"use client";

import { useEffect, useState } from "react";

/** Sigue el capítulo en la zona de lectura sin cambiar foco, URL ni historial. */
export function useActiveChapter(chapters: readonly { id: string }[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((section): section is HTMLElement => section !== null);
    let offsets: { id: string; top: number }[] = [];
    let maxScroll = 0;
    let needsMeasurement = true;
    let frame: number | null = null;
    let previous: string | null | undefined;
    let disposed = false;

    const update = () => {
      frame = null;
      if (disposed) return;
      const scrollTop = Math.max(0, window.scrollY);
      if (needsMeasurement) {
        offsets = sections
          .filter((section) => section.getClientRects().length > 0)
          .map((section) => ({
            id: section.id,
            top: section.getBoundingClientRect().top + scrollTop,
          }));
        maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        needsMeasurement = false;
      }
      const readingLine = scrollTop + Math.min(160, Math.max(64, window.innerHeight * 0.2));
      let next = offsets[0]?.id ?? null;
      for (const section of offsets) {
        if (section.top > readingLine) break;
        next = section.id;
      }
      // Un último capítulo corto puede quedar bajo la línea de lectura al llegar al pie.
      if (maxScroll > 0 && scrollTop >= maxScroll - 2) next = offsets.at(-1)?.id ?? null;
      if (next !== previous) {
        previous = next;
        setActiveId(next);
      }
    };
    const schedule = () => {
      if (!disposed && frame === null) frame = window.requestAnimationFrame(update);
    };
    const measure = () => {
      needsMeasurement = true;
      schedule();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    sections.forEach((section) => observer?.observe(section));
    observer?.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("hashchange", measure);
    window.addEventListener("pageshow", measure);
    document.fonts?.ready.then(measure);
    schedule();
    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      window.removeEventListener("hashchange", measure);
      window.removeEventListener("pageshow", measure);
    };
  }, [chapters]);

  return activeId;
}
