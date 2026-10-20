import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveChapter } from "@/hooks/use-active-chapter";

const chapters = [{ id: "uno" }, { id: "dos" }, { id: "tres" }];
let top = 0;
let height = 3000;
let positions: Map<string, number>;
let parent: HTMLDivElement;
let frames: Map<number, FrameRequestCallback>;
let resize: () => void;
let disconnect: () => void;
let originalScroll: PropertyDescriptor | undefined;
let originalHeight: PropertyDescriptor | undefined;
let originalViewport: PropertyDescriptor | undefined;

beforeEach(() => {
  top = 0;
  height = 3000;
  positions = new Map([
    ["uno", 300],
    ["dos", 1100],
    ["tres", 2700],
  ]);
  frames = new Map();
  disconnect = vi.fn();
  originalScroll = Object.getOwnPropertyDescriptor(window, "scrollY");
  originalHeight = Object.getOwnPropertyDescriptor(document.documentElement, "scrollHeight");
  originalViewport = Object.getOwnPropertyDescriptor(window, "innerHeight");
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => top });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    get: () => height,
  });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800, writable: true });
  let sequence = 0;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = ++sequence;
    frames.set(id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => frames.delete(id));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = () => callback([], this as unknown as ResizeObserver);
      }
      observe() {}
      disconnect() {
        disconnect();
      }
    }
  );
  parent = document.createElement("div");
  for (const chapter of chapters) {
    const section = document.createElement("section");
    section.id = chapter.id;
    section.getBoundingClientRect = () =>
      new DOMRect(0, positions.get(chapter.id)! - top, 800, 200);
    section.getClientRects = () =>
      Object.assign([section.getBoundingClientRect()], {
        item: () => section.getBoundingClientRect(),
      });
    parent.append(section);
  }
  document.body.append(parent);
});

afterEach(() => {
  parent.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalScroll) Object.defineProperty(window, "scrollY", originalScroll);
  if (originalViewport) Object.defineProperty(window, "innerHeight", originalViewport);
  if (originalHeight)
    Object.defineProperty(document.documentElement, "scrollHeight", originalHeight);
  else delete (document.documentElement as { scrollHeight?: number }).scrollHeight;
});

function frame() {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  });
}
function scroll(value: number) {
  top = value;
  act(() => window.dispatchEvent(new Event("scroll")));
  frame();
}

describe("Capítulo de lectura", () => {
  it("sigue el descenso y el regreso sin cambiar URL ni foco", () => {
    const button = document.createElement("button");
    parent.prepend(button);
    button.focus();
    const url = window.location.href;
    const { result } = renderHook(() => useActiveChapter(chapters));
    frame();
    expect(result.current).toBe("uno");
    scroll(939);
    expect(result.current).toBe("uno");
    scroll(940);
    expect(result.current).toBe("dos");
    scroll(0);
    expect(result.current).toBe("uno");
    expect(window.location.href).toBe(url);
    expect(button).toHaveFocus();
  });
  it("reconoce un capítulo corto al llegar al final del documento", () => {
    const { result } = renderHook(() => useActiveChapter(chapters));
    frame();
    scroll(2200);
    expect(result.current).toBe("tres");
    scroll(1800);
    expect(result.current).toBe("dos");
  });
  it("respeta una posición de lectura restaurada al montar", () => {
    top = 1200;
    const { result } = renderHook(() => useActiveChapter(chapters));
    frame();
    expect(result.current).toBe("dos");
  });
  it("actualiza las posiciones cuando el contenido cambia de tamaño", () => {
    const { result } = renderHook(() => useActiveChapter(chapters));
    frame();
    scroll(1000);
    expect(result.current).toBe("dos");
    positions.set("dos", 1800);
    act(() => resize());
    frame();
    expect(result.current).toBe("uno");
  });
  it("agrupa los eventos de scroll en un solo frame y omite capítulos ausentes", () => {
    const withMissing = [...chapters, { id: "ausente" }];
    const { result } = renderHook(() => useActiveChapter(withMissing));
    frame();
    const before = vi.mocked(window.requestAnimationFrame).mock.calls.length;
    act(() => {
      top = 1000;
      for (let index = 0; index < 4; index++) window.dispatchEvent(new Event("scroll"));
    });
    expect(vi.mocked(window.requestAnimationFrame).mock.calls.length).toBe(before + 1);
    frame();
    expect(result.current).toBe("dos");
  });
  it("funciona sin ResizeObserver y recalcula tras resize o navegación local", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { result } = renderHook(() => useActiveChapter(chapters));
    frame();
    positions.set("dos", 600);
    top = 500;
    act(() => window.dispatchEvent(new Event("resize")));
    frame();
    expect(result.current).toBe("dos");
    top = 0;
    act(() => window.dispatchEvent(new Event("hashchange")));
    frame();
    expect(result.current).toBe("uno");
    top = 2200;
    act(() => window.dispatchEvent(new Event("pageshow")));
    frame();
    expect(result.current).toBe("tres");
  });
  it("no marca capítulos cuando ninguno existe y libera sus listeners", () => {
    const { result, unmount } = renderHook(() => useActiveChapter([{ id: "ausente" }]));
    frame();
    expect(result.current).toBeNull();
    act(() => window.dispatchEvent(new Event("scroll")));
    unmount();
    const before = vi.mocked(window.requestAnimationFrame).mock.calls.length;
    act(() => {
      resize();
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("resize"));
    });
    expect(frames.size).toBe(0);
    expect(vi.mocked(window.requestAnimationFrame).mock.calls.length).toBe(before);
    expect(disconnect).toHaveBeenCalled();
  });
});
