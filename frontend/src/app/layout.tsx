import type { Metadata } from "next";
import type { ReactNode } from "react";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { modeStorageKey } from "@/theme/settings";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Traza Cívica · Participación y territorio", template: "%s · Traza Cívica" },
  description: "Análisis territorial de participación ciudadana y escenarios de abstención.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript
          attribute="class"
          defaultMode="light"
          modeStorageKey={modeStorageKey}
        />
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        <AppRouterCacheProvider>
          <AppProviders>
            <AppShell>{children}</AppShell>
          </AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
