import type { Metadata } from "next";
import type { ReactNode } from "react";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { modeStorageKey } from "@/theme/settings";
import brandAssets from "@/content/brand-assets.json";
import "@/theme/fonts.css";
// El estilo debe estar listo antes de escribir; el código del mapa sigue diferido.
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://traza-civica.jorgetato.com/"),
  title: { default: "Traza Cívica · Participación y territorio", template: "%s · Traza Cívica" },
  description: "Análisis territorial de participación ciudadana y escenarios de abstención.",
  openGraph: {
    type: "website",
    locale: "es_MX",
    title: "Traza Cívica · Participación y territorio",
    description: "Historia de participación y escenarios municipales para 2027.",
    images: [
      {
        url: brandAssets.social.src,
        width: brandAssets.social.width,
        height: brandAssets.social.height,
        alt: "Traza Cívica · Participación y territorio",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: [brandAssets.social.src] },
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
