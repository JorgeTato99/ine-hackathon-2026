"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BrandMark } from "@/components/ui/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { brand, layout, typeScale } from "@/theme/tokens";
import { SiteFooter } from "./site-footer";

const destinations = [
  ["/", "Explorar"],
  ["/metodologia/", "Metodología"],
  ["/datos/", "Datos y descargas"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Box
        component="header"
        data-app-chrome="header"
        sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
      >
        <Box
          sx={{
            maxWidth: layout.app,
            mx: "auto",
            px: { xs: 2, md: 4 },
            minHeight: pathname === "/" ? 64 : 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: pathname === "/" ? 1 : 2,
            flexWrap: "wrap",
            py: pathname === "/" ? 1 : 1.5,
          }}
        >
          <Box
            component="a"
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              color: "primary.main",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <BrandMark />
            <Box>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  color: "text.primary",
                  ...typeScale.wordmark,
                }}
              >
                {brand.name}
              </Typography>
              <Typography
                component="span"
                sx={{ fontSize: 11, color: "text.secondary", letterSpacing: ".025em" }}
              >
                {brand.descriptor}
              </Typography>
            </Box>
          </Box>
          <Box
            component="nav"
            aria-label="Principal"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, md: 3 },
              order: { xs: 3, md: 0 },
              width: { xs: "100%", md: "auto" },
              overflowX: "auto",
              pb: { xs: 0.5, md: 0 },
            }}
          >
            {destinations.map(([href, label]) => {
              const active = pathname === href || (href !== "/" && pathname === href.slice(0, -1));
              return (
                <Box
                  key={href}
                  component="a"
                  href={href}
                  aria-current={active ? "page" : undefined}
                  sx={{
                    px: 1,
                    py: pathname === "/" ? 0.75 : 1,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    color: active ? "primary.main" : "text.secondary",
                    fontWeight: active ? 700 : 400,
                    textDecoration: "none",
                    borderBottom: 2,
                    borderColor: active ? "primary.main" : "transparent",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {label}
                </Box>
              );
            })}
          </Box>
          <ThemeToggle />
        </Box>
      </Box>
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: layout.app,
          mx: "auto",
          p: { xs: 2, md: 4 },
          ...(pathname === "/" ? { py: { xs: 1.5, md: 2 } } : {}),
          outline: "none",
        }}
      >
        {children}
      </Box>
      <SiteFooter />
    </Box>
  );
}
