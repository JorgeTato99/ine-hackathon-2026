"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Icon } from "@/components/ui/icon";
import { EntranceScope } from "@/components/motion/entrance-scope";
import { entranceProps } from "@/theme/entrance";
import { colors, radii, typeScale } from "@/theme/tokens";
import { ConsultationGuide } from "./consultation-guide";

export function ExplorerHeader({
  onMapMode,
  mapDisabled = false,
  sample = true,
}: {
  onMapMode?: () => void;
  mapDisabled?: boolean;
  sample?: boolean;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <>
      <EntranceScope>
        <Box
          component="header"
          className="tc-explorer-hero"
          sx={(theme) => ({
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            bgcolor: colors.light.accentSoft,
            borderRadius: radii.panel,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            ...theme.applyStyles("dark", { bgcolor: colors.dark.accentSoft }),
          })}
        >
          <Box {...entranceProps("hero")} sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={typeScale.compactTitle}>
              El territorio, en contexto
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                México · Escala municipal · Historia 2009–2024
              </Box>
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                Municipios · Historia 2009–2024
              </Box>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
            <Button
              size="small"
              aria-label="Ayuda: cómo explorar el territorio"
              onClick={() => setHelpOpen(true)}
              startIcon={<Icon name="info" size={17} />}
              sx={{ flexShrink: 0 }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Cómo explorar
              </Box>
            </Button>
            {onMapMode && (
              <Button
                data-pw="enter-map-mode"
                size="small"
                aria-label="Entrar al modo mapa"
                disabled={mapDisabled}
                onClick={onMapMode}
                startIcon={<Icon name="expand" size={17} />}
                sx={{
                  minWidth: { xs: 32, sm: 64 },
                  ".MuiButton-startIcon": { mr: { xs: 0, sm: 1 } },
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  Modo mapa
                </Box>
              </Button>
            )}
          </Box>
        </Box>
      </EntranceScope>
      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="explorer-help-title"
      >
        <DialogTitle id="explorer-help-title">Cómo explorar el territorio</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Localiza un municipio, recorre su historia y consulta escenarios de participación. El
            mapa y la tabla comparten filtros y selección.
          </Typography>
          <ConsultationGuide />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            La historia 2009–2024 procede de los datos recibidos.{" "}
            {sample
              ? "Los escenarios y el semáforo de 2027 son ilustrativos."
              : "2027 es un pronóstico condicionado al nivel nacional; la intervención es un supuesto, no un efecto medido."}{" "}
            Riesgo, disponibilidad del dato y prioridad son dimensiones distintas.
          </Typography>
          <Button component="a" href="/metodologia/" size="small" sx={{ mt: 1 }}>
            Consultar metodología y límites
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)} autoFocus>
            Cerrar ayuda
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
