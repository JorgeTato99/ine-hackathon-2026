import { act, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { EntranceScope } from "@/components/motion/entrance-scope";
import { entranceProps } from "@/theme/entrance";

class ObserverMock {
  static instances: ObserverMock[] = [];
  observe = vi.fn<(target: Element) => void>();
  unobserve = vi.fn<(target: Element) => void>();
  disconnect = vi.fn<() => void>();
  constructor(readonly callback: IntersectionObserverCallback) {
    ObserverMock.instances.push(this);
  }
  enter(targets: Element[], intersecting = true) {
    this.callback(
      targets.map(
        (target) => ({ target, isIntersecting: intersecting }) as IntersectionObserverEntry
      ),
      this as unknown as IntersectionObserver
    );
  }
}
let reduced = false;
let change: () => void;

function Example({ preset = "item" }: { preset?: "item" | "card" }) {
  return (
    <EntranceScope>
      <div {...entranceProps("hero")} data-pw="hero">
        <button>Acción de cabecera</button>
      </div>
      <h2 {...entranceProps("heading")} data-pw="heading">
        Sección
      </h2>
      <div data-entrance-group>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} {...entranceProps(preset)} data-pw={`item-${index}`}>
            <button>Recurso {index}</button>
          </div>
        ))}
      </div>
    </EntranceScope>
  );
}
beforeEach(() => {
  reduced = false;
  ObserverMock.instances = [];
  vi.stubGlobal("IntersectionObserver", ObserverMock);
  vi.spyOn(window, "matchMedia").mockReturnValue({
    get matches() {
      return reduced;
    },
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn((_type, callback) => {
      change = callback as () => void;
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Entradas editoriales", () => {
  it("usa un observer, conserva el contenido y entra una vez al aparecer", () => {
    render(<Example />);
    const target = screen.getByTestId("heading");
    const observer = ObserverMock.instances[0]!;
    expect(ObserverMock.instances).toHaveLength(1);
    expect(observer.observe).toHaveBeenCalledTimes(5);
    expect(observer.observe).not.toHaveBeenCalledWith(screen.getByTestId("hero"));
    expect(target).toBeVisible();
    expect(target).not.toHaveAttribute("data-entrance-state");
    act(() => observer.enter([target], false));
    expect(target).not.toHaveAttribute("data-entrance-state");
    act(() => observer.enter([target]));
    expect(target).toHaveAttribute("data-entrance-state", "entered");
    expect(observer.unobserve).toHaveBeenCalledWith(target);
    const before = observer.unobserve.mock.calls.length;
    act(() => observer.enter([target]));
    expect(observer.unobserve.mock.calls.length).toBe(before);
  });
  it.each(["item", "card"] as const)(
    "ordena %s por DOM y limita la secuencia a 120ms",
    (preset) => {
      render(<Example preset={preset} />);
      const items = [0, 1, 2, 3].map((index) => screen.getByTestId(`item-${index}`));
      act(() => ObserverMock.instances[0]!.enter([...items].reverse()));
      expect(items.map((item) => item.style.getPropertyValue("--tc-entrance-delay"))).toEqual([
        "0ms",
        "60ms",
        "120ms",
        "120ms",
      ]);
    }
  );
  it("no retrasa un elemento que llega solo en otra posición de scroll", () => {
    render(<Example />);
    const observer = ObserverMock.instances[0]!;
    const second = screen.getByTestId("item-1"),
      third = screen.getByTestId("item-2");
    act(() => observer.enter([second]));
    act(() => observer.enter([third]));
    expect(second.style.getPropertyValue("--tc-entrance-delay")).toBe("0ms");
    expect(third.style.getPropertyValue("--tc-entrance-delay")).toBe("0ms");
  });
  it("asienta el contenedor de una acción enfocada sin mover el foco", () => {
    render(<Example />);
    const action = screen.getByRole("button", { name: "Recurso 0" });
    act(() => action.focus());
    const item = screen.getByTestId("item-0");
    expect(item).toHaveAttribute("data-entrance-state", "settled");
    act(() => ObserverMock.instances[0]!.enter([item]));
    expect(item).toHaveAttribute("data-entrance-state", "settled");
    expect(action).toHaveFocus();
  });
  it("respeta movimiento reducido desde el inicio sin observar objetivos", () => {
    reduced = true;
    render(<Example />);
    expect(ObserverMock.instances).toHaveLength(0);
    expect(screen.getByTestId("hero")).toHaveAttribute("data-entrance-state", "settled");
    expect(screen.getByTestId("heading")).toHaveAttribute("data-entrance-state", "settled");
  });
  it("no anima un objetivo que ya tenía foco cuando se registró", () => {
    render(
      <EntranceScope>
        <div {...entranceProps("item")} data-pw="focused">
          <button
            ref={(element) => {
              element?.focus();
            }}
          >
            Acción inicial
          </button>
        </div>
      </EntranceScope>
    );
    const target = screen.getByTestId("focused");
    act(() => ObserverMock.instances[0]!.enter([target]));
    expect(target).toHaveAttribute("data-entrance-state", "settled");
    expect(screen.getByRole("button", { name: "Acción inicial" })).toHaveFocus();
  });
  it("asienta todos los objetivos al reducir movimiento y no los repite al restaurarlo", () => {
    render(<Example />);
    const observer = ObserverMock.instances[0]!;
    act(() => observer.enter([screen.getByTestId("heading")]));
    act(() => {
      reduced = true;
      change();
    });
    expect(observer.disconnect).toHaveBeenCalled();
    expect(screen.getByTestId("item-3")).toHaveAttribute("data-entrance-state", "settled");
    act(() => {
      reduced = false;
      change();
      observer.enter([screen.getByTestId("item-3")]);
    });
    expect(screen.getByTestId("item-3")).toHaveAttribute("data-entrance-state", "settled");
  });
  it("mantiene estáticas las entradas de viewport si falta IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Example />);
    expect(screen.getByTestId("heading")).toHaveAttribute("data-entrance-state", "settled");
    expect(screen.getByTestId("hero")).not.toHaveAttribute("data-entrance-state");
    expect(screen.getByText("Sección")).toBeVisible();
  });
  it("libera el observer e ignora entregas pendientes después del desmontaje", () => {
    const { unmount } = render(<Example />);
    const target = screen.getByTestId("heading"),
      observer = ObserverMock.instances[0]!;
    unmount();
    act(() => {
      observer.enter([target]);
      reduced = true;
      change();
    });
    expect(observer.disconnect).toHaveBeenCalled();
    expect(target).not.toHaveAttribute("data-entrance-state");
  });
});
