"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { PageHeader } from "@/components/ui/page-header";
import { DataStatus } from "@/components/ui/data-status";
import { Icon } from "@/components/ui/icon";
import { ChapterNav, type Chapter } from "@/components/editorial/chapter-nav";
import { colors, layout, radii } from "@/theme/tokens";
import { entranceProps } from "@/theme/entrance";
import { EntranceScope } from "@/components/motion/entrance-scope";
import { TraceRule } from "@/components/ui/trace-rule";

export function ContentPage({
  eyebrow,
  title,
  description,
  children,
  chapters,
  aside,
  action = { href: "/", label: "Abrir explorador" },
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  chapters: readonly Chapter[];
  aside: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <EntranceScope sx={{ maxWidth: layout.editorial, mx: "auto", pb: 3 }}>
      <Box
        component="header"
        className="tc-editorial-hero"
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 2, md: 3 },
          mt: { xs: 0, md: 1 },
          mb: { xs: 4, md: 6 },
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <TraceRule />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.6fr) minmax(0, 1fr)" },
            alignItems: "center",
            gap: { xs: 4, md: 5 },
            py: { xs: 3, md: 4 },
          }}
        >
          <Box {...entranceProps("hero")}>
            <PageHeader
              eyebrow={eyebrow}
              title={title}
              description={description}
              density="editorial"
            >
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
                <Button
                  component="a"
                  href={action.href}
                  variant="contained"
                  endIcon={<Icon name="arrow" size={16} />}
                >
                  {action.label}
                </Button>
                <DataStatus status="modeled" label="Datos y estimaciones" />
              </Box>
            </PageHeader>
          </Box>
          <Box
            sx={(theme) => ({
              display: { xs: "none", md: "block" },
              bgcolor: colors.light.accentSoft,
              borderRadius: radii.feature,
              p: 2.5,
              ...theme.applyStyles("dark", { bgcolor: colors.dark.accentSoft }),
            })}
          >
            {aside}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: `${layout.rail}px minmax(0,1fr)` },
          gap: { xs: 0, lg: 5, xl: 7 },
        }}
      >
        <ChapterNav chapters={chapters} />
        <Box
          sx={{
            minWidth: 0,
            "& > section": { scrollMarginTop: 24 },
            "& > section + section": { mt: { xs: 5, md: 7 } },
            "& p, & li": { maxWidth: layout.reading },
            "& .MuiAlert-message": { maxWidth: layout.reading },
          }}
        >
          {children}
        </Box>
      </Box>
      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          pt: 3,
          mt: 7,
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          justifyContent: "space-between",
          color: "text.secondary",
        }}
      >
        <Typography variant="caption">Información agregada · Sin datos personales</Typography>
        <Typography variant="caption">Traza Cívica · Cuaderno de lectura</Typography>
      </Box>
    </EntranceScope>
  );
}
