import type { ReactNode } from "react";
import { render, renderHook, type RenderOptions } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { createTestQueryClient } from "./create-test-query-client";

const testTheme = createTheme({
  components: { MuiButtonBase: { defaultProps: { disableRipple: true } } },
});

function createWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={testTheme}>{children}</ThemeProvider>
      </QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

export function renderWithProviders(ui: ReactNode, options?: Omit<RenderOptions, "wrapper">) {
  const { Wrapper, queryClient } = createWrapper();
  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient };
}

export function renderHookWithProviders<T>(hook: () => T) {
  const { Wrapper, queryClient } = createWrapper();
  return { ...renderHook(hook, { wrapper: Wrapper }), queryClient };
}
