"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import { riskTokens } from "@/theme/tokens";
import { Icon } from "@/components/ui/icon";
import { ContextHelp } from "@/components/ui/context-help";
import { entranceProps } from "@/theme/entrance";
import {
  advancedFilterCount,
  nominalRangeError,
  type AdvancedFilters,
} from "@/utils/explorer-filters";
import type { ContextFilters } from "@/utils/indicators";

export type QueryChange = (changes: Record<string, string>) => void;
export type ExplorerFiltersProps = {
  search: string;
  state: string;
  risk: string;
  advanced: AdvancedFilters;
  states: [string, string][];
  mobile: boolean;
  count: number;
  onChange: QueryChange;
  floating?: boolean;
  onClose?: () => void;
  sample?: boolean;
  contextFilters?: ContextFilters | undefined;
};
const reset = {
  buscar: "",
  entidad: "",
  riesgo: "",
  historia: "",
  cartografia: "",
  ln_min: "",
  ln_max: "",
  tamano: "",
  ayuntamiento: "",
  costumbres: "",
  alerta: "",
};
const referenceRiskLabels = {
  alto: "Rojo",
  medio: "Amarillo",
  bajo: "Verde",
  sin_estimacion: "Sin dato",
};
const filterValueLabels: Record<string, string> = {
  pequeno: "Menos de 5 mil",
  medio: "5 mil a menos de 20 mil",
  grande: "20 mil a menos de 100 mil",
  mayor: "100 mil o más",
  si: "Sí",
  no: "No",
  con: "Con antecedente",
  sin: "Sin antecedente",
};

export function ExplorerFilters({
  search,
  state,
  risk,
  advanced,
  states,
  mobile,
  count,
  onChange,
  floating = false,
  onClose,
  sample = true,
  contextFilters,
}: ExplorerFiltersProps) {
  const [open, setOpen] = useState(false);
  const resetButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const removeFilter = (changes: Record<string, string>) => {
    (floating ? resetButton.current : searchInput.current)?.focus({ preventScroll: true });
    onChange(changes);
  };
  const extraCount =
    advancedFilterCount(advanced) +
    (contextFilters ? Object.values(contextFilters).filter(Boolean).length : 0);
  const error = nominalRangeError(advanced);
  const stateField = (
    <TextField
      label="Estado"
      select
      size="small"
      slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
      value={state}
      onChange={(e) => onChange({ entidad: e.target.value })}
    >
      <MenuItem value="">Todos los estados</MenuItem>
      {states.map(([id, name]) => (
        <MenuItem key={id} value={id}>
          {name}
        </MenuItem>
      ))}
    </TextField>
  );
  const riskField = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: sample ? "1fr" : "minmax(0, 1fr) 32px",
        gap: 0.5,
        alignItems: "center",
      }}
    >
      <TextField
        label={sample ? "Riesgo ilustrativo" : "Color sin intervención"}
        select
        size="small"
        slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
        value={risk}
        onChange={(e) => onChange({ riesgo: e.target.value })}
      >
        <MenuItem value="">Todos los niveles</MenuItem>
        {Object.entries(riskTokens).map(([id, token]) => (
          <MenuItem key={id} value={id}>
            {sample ? token.label : referenceRiskLabels[id as keyof typeof riskTokens]}
          </MenuItem>
        ))}
      </TextField>
      {!sample && <ContextHelp topic="baseline" />}
    </Box>
  );
  const active: { key: string; label: string; remove: Record<string, string> }[] = [];
  if (contextFilters)
    for (const [key, value] of Object.entries(contextFilters))
      if (value)
        active.push({
          key,
          label: `${{ tamano: "Tamaño", ayuntamiento: "Ayuntamiento 2027", costumbres: "Usos y costumbres", alerta: "Sin casilla" }[key as keyof ContextFilters]}: ${filterValueLabels[value] ?? value}`,
          remove: { [key]: "" },
        });
  if (search.trim())
    active.push({ key: "search", label: `Búsqueda: ${search.trim()}`, remove: { buscar: "" } });
  if (state)
    active.push({
      key: "state",
      label: states.find((s) => s[0] === state)?.[1] ?? state,
      remove: { entidad: "" },
    });
  if (risk)
    active.push({
      key: "risk",
      label: sample
        ? `Riesgo: ${riskTokens[risk as keyof typeof riskTokens].label}`
        : `Color sin intervención: ${referenceRiskLabels[risk as keyof typeof riskTokens]}`,
      remove: { riesgo: "" },
    });
  if (advanced.history)
    active.push({
      key: "history",
      label: `Historia: ${{ completa: "seis elecciones", parcial: "parcial", ausente: "sin registros" }[advanced.history]}`,
      remove: { historia: "" },
    });
  if (advanced.geometry)
    active.push({
      key: "geometry",
      label: advanced.geometry === "con" ? "Con límites disponibles" : "Sin límites disponibles",
      remove: { cartografia: "" },
    });
  if (advanced.minimum !== "" || advanced.maximum !== "")
    active.push({
      key: "nominal",
      label: `Lista electoral: ${advanced.minimum || "0"}–${advanced.maximum || "sin límite"}`,
      remove: { ln_min: "", ln_max: "" },
    });
  const extendedFields = (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: floating ? "1fr" : { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          pt: 0.5,
        }}
      >
        {(mobile || floating) && (
          <>
            {stateField}
            {riskField}
          </>
        )}
        {contextFilters && (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 32px",
                gap: 0.5,
                alignItems: "center",
              }}
            >
              <TextField
                label="Tamaño de la lista electoral"
                size="small"
                select
                value={contextFilters.tamano}
                onChange={(event) => onChange({ tamano: event.target.value })}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
              >
                {[
                  ["", "Todos los tamaños"],
                  ["pequeno", "Menos de 5 mil"],
                  ["medio", "5 mil a menos de 20 mil"],
                  ["grande", "20 mil a menos de 100 mil"],
                  ["mayor", "100 mil o más"],
                ].map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <ContextHelp topic="roll" />
            </Box>
            <TextField
              label="Elección municipal en 2027"
              size="small"
              select
              value={contextFilters.ayuntamiento}
              onChange={(event) => onChange({ ayuntamiento: event.target.value })}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
            >
              {[
                ["", "Todos"],
                ["si", "Sí elige ese día"],
                ["no", "No elige ese día"],
              ].map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 32px",
                gap: 0.5,
                alignItems: "center",
              }}
            >
              <TextField
                label="Usos y costumbres"
                size="small"
                select
                value={contextFilters.costumbres}
                onChange={(event) => onChange({ costumbres: event.target.value })}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
              >
                {[
                  ["", "Todos"],
                  ["si", "Sí"],
                  ["no", "No"],
                ].map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <ContextHelp topic="customs" />
            </Box>
            <TextField
              label="Falta de casillas antes"
              size="small"
              select
              value={contextFilters.alerta}
              onChange={(event) => onChange({ alerta: event.target.value })}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
            >
              {[
                ["", "Todos"],
                ["con", "Con antecedente"],
                ["sin", "Sin antecedente"],
              ].map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </>
        )}
        <TextField
          label="Datos de elecciones anteriores"
          select
          size="small"
          value={advanced.history}
          slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          onChange={(e) => onChange({ historia: e.target.value })}
        >
          <MenuItem value="">Con o sin datos anteriores</MenuItem>
          <MenuItem value="completa">Datos en las seis elecciones</MenuItem>
          <MenuItem value="parcial">Faltan datos en alguna elección</MenuItem>
          <MenuItem value="ausente">Sin registros históricos</MenuItem>
        </TextField>
        <TextField
          label="Ubicación en el mapa"
          select
          size="small"
          value={advanced.geometry}
          slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          onChange={(e) => onChange({ cartografia: e.target.value })}
        >
          <MenuItem value="">Con o sin límites disponibles</MenuItem>
          <MenuItem value="con">Con límites disponibles</MenuItem>
          <MenuItem value="sin">Sin límites disponibles</MenuItem>
        </TextField>
        <TextField
          label="Lista electoral 2024 · mínimo"
          size="small"
          value={advanced.minimum}
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
          error={Boolean(error)}
          onChange={(e) => onChange({ ln_min: e.target.value })}
        />
        <TextField
          label="Lista electoral 2024 · máximo"
          size="small"
          value={advanced.maximum}
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
          error={Boolean(error)}
          onChange={(e) => onChange({ ln_max: e.target.value })}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        La elección municipal se refiere al 6 de junio de 2027. Los filtros de datos anteriores y
        ubicación indican qué información está disponible, no qué tan precisa es la estimación. La
        lista electoral cuenta personas registradas para votar en 2024. Los límites mínimo y máximo
        también se incluyen; los municipios sin ese dato quedan fuera al usarlos.
      </Typography>
      {error && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
    </>
  );
  const activeChips = active.length > 0 && (
    <Box
      role="group"
      aria-label="Filtros activos"
      sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center", mt: 1.25 }}
    >
      {active.map((chip) => (
        <Chip
          key={chip.key}
          size="small"
          label={chip.label}
          aria-label={`Quitar filtro: ${chip.label}`}
          variant="outlined"
          onClick={() => removeFilter(chip.remove)}
          onDelete={() => removeFilter(chip.remove)}
          sx={{
            maxWidth: "100%",
            ".MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
          }}
        />
      ))}
      {mobile && !floating && (
        <Button size="small" onClick={() => onChange(reset)}>
          Restablecer
        </Button>
      )}
    </Box>
  );
  if (floating)
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: "1 1 auto" }}>
        <Box
          sx={{ p: 2, pt: 0.75, overflowY: "auto", overscrollBehavior: "contain", minHeight: 0 }}
        >
          {activeChips}
          <Box sx={{ mt: active.length ? 2 : 0.5 }}>{extendedFields}</Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            p: 1.5,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            flexShrink: 0,
          }}
        >
          <Button ref={resetButton} onClick={() => onChange(reset)}>
            Restablecer
          </Button>
          <Box sx={{ display: "flex", alignItems: "flex-end", flexDirection: "column", gap: 0.25 }}>
            <Typography variant="caption" role="status" aria-live="polite">
              {count.toLocaleString("es-MX")} {count === 1 ? "municipio" : "municipios"}
            </Typography>
            <Button variant="contained" onClick={onClose}>
              Ver resultados
            </Button>
          </Box>
        </Box>
      </Box>
    );
  return (
    <>
      <Paper
        component="section"
        aria-label="Filtros de consulta"
        variant="outlined"
        {...entranceProps("card")}
        sx={{ p: 1.5 }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr) auto",
              md: "minmax(200px, 1.4fr) minmax(150px, 1fr) minmax(180px, .85fr) auto auto",
            },
            gap: 1.25,
            alignItems: "center",
          }}
        >
          <TextField
            label="Buscar municipio o clave"
            inputRef={searchInput}
            placeholder="Ej. Aguascalientes o 01001"
            type="search"
            size="small"
            value={search}
            onChange={(e) => onChange({ buscar: e.target.value })}
          />
          {!mobile && stateField}
          {!mobile && riskField}
          <Button
            size="small"
            startIcon={<Icon name="filter" size={17} />}
            aria-label={`${mobile ? "Filtros" : "Más filtros"}${extraCount > 0 ? ` · ${extraCount}` : ""}`}
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            {mobile ? "Filtros" : "Más filtros"}
            {extraCount > 0 ? ` · ${extraCount}` : ""}
          </Button>
          <Button
            size="small"
            onClick={() => onChange(reset)}
            startIcon={<Icon name="reset" size={16} />}
            sx={{ display: { xs: "none", md: "inline-flex" } }}
          >
            Restablecer
          </Button>
        </Box>
        {activeChips}
        {error && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </Paper>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="advanced-filters-title"
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1, sm: 4 },
              width: { xs: "calc(100% - 16px)", sm: "100%" },
              maxHeight: "90dvh",
            },
          },
        }}
      >
        <DialogTitle id="advanced-filters-title">
          {mobile ? "Filtros de consulta" : "Más filtros"}
        </DialogTitle>
        <DialogContent dividers>{extendedFields}</DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
          <Button onClick={() => onChange(reset)}>Restablecer</Button>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
            <Typography variant="caption" role="status" aria-live="polite">
              {count.toLocaleString("es-MX")} {count === 1 ? "municipio" : "municipios"}
            </Typography>
            <Button variant="contained" aria-label="Ver resultados" onClick={() => setOpen(false)}>
              Ver resultados
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}
