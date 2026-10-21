import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ContextHelp } from "@/components/ui/context-help";
import { AppProviders } from "@/components/providers/app-providers";

describe("Ayudas de lectura", () => {
  it("muestra un resumen al enfocar y abre la explicación con Enter", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <ContextHelp topic="position" />
      </AppProviders>
    );
    const trigger = screen.getByRole("button", { name: "Ayuda sobre escala de riesgo" });
    await user.tab();
    expect(trigger).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "no es un porcentaje de abstención"
    );
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("dialog", { name: "Escala de riesgo" })).toHaveTextContent(
      "20 %"
    );
    expect(screen.getByRole("button", { name: "Cerrar ayuda" })).toHaveFocus();
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });
  it("permite clic, cierre explícito y vista breve al apuntar", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <ContextHelp topic="roll" />
      </AppProviders>
    );
    const trigger = screen.getByRole("button", { name: "Ayuda sobre lista electoral" });
    await user.hover(trigger);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("lista nominal");
    await user.click(trigger);
    expect(await screen.findByRole("dialog", { name: "Lista electoral" })).toHaveTextContent(
      "No es toda la población"
    );
    await user.click(screen.getByRole("button", { name: "Cerrar ayuda" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
