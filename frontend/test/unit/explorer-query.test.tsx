import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyExplorerQuery, useExplorerQuery } from "@/hooks/use-explorer-query";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("buscar=publicación-anterior"),
}));

beforeEach(() => window.history.replaceState(null, "", "/"));

describe("Consulta vigente e hidratación estática", () => {
  it("publica escrituras inmediatamente y una señal atrasada no sustituye la URL", () => {
    const { result, rerender, unmount } = renderHook(() => useExplorerQuery());
    act(() => {
      window.history.replaceState(null, "", "/?buscar=01001&entidad=01");
      notifyExplorerQuery();
    });
    expect(result.current.get("buscar")).toBe("01001");
    expect(result.current.get("entidad")).toBe("01");
    rerender();
    expect(result.current.get("buscar")).toBe("01001");
    act(() => {
      window.history.replaceState(null, "", "/?buscar=01002");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.get("buscar")).toBe("01002");
    act(() => {
      window.history.replaceState(null, "", "/");
      notifyExplorerQuery();
    });
    expect(result.current.has("buscar")).toBe(false);
    unmount();
  });
  it("mantiene una instantánea estable y retira las dos suscripciones al desmontar", () => {
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");
    const { result, rerender, unmount } = renderHook(() => useExplorerQuery());
    const initial = result.current;
    rerender();
    expect(result.current).toBe(initial);
    const subscriptions = added.mock.calls.filter(([type]) =>
      ["popstate", "traza:consulta"].includes(type)
    );
    expect(subscriptions).toHaveLength(2);
    unmount();
    for (const [type, listener] of subscriptions)
      expect(removed).toHaveBeenCalledWith(type, listener);
    added.mockRestore();
    removed.mockRestore();
  });
  it("usa consulta vacía durante SSR aunque el navegador tenga otra dirección", () => {
    window.history.replaceState(null, "", "/?buscar=01001");
    function Probe() {
      return <span>{useExplorerQuery().get("buscar") ?? "sin consulta"}</span>;
    }
    expect(renderToString(<Probe />)).toBe("<span>sin consulta</span>");
    const { result } = renderHook(() => useExplorerQuery());
    expect(result.current.get("buscar")).toBe("01001");
  });
});
