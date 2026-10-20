"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createQueryClient } from "@/services/react-query/create-query-client";
import { modeStorageKey } from "@/theme/settings";
import { theme } from "@/theme/theme";

export function AppProviders({ children }: { children: ReactNode }) {
  // Una instancia por árbol evita compartir caché entre renders de servidor o pruebas.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme} defaultMode="light" modeStorageKey={modeStorageKey}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
