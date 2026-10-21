"use client";

import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { contextViews, peopleGroups, type Presentation, type LegendItem } from "@/utils/indicators";
import { contextGuides } from "@/content/reading-guide";

export function ResultsViews({
  presentation,
  onChange,
  compact = false,
}: {
  presentation: Presentation;
  onChange: (changes: Record<string, string>) => void;
  compact?: boolean;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      {compact ? (
        <ButtonGroup fullWidth size="small" aria-label="Contenido territorial">
          <Button
            aria-pressed={presentation.tab === "pronostico"}
            variant={presentation.tab === "pronostico" ? "contained" : "outlined"}
            onClick={() => onChange({ pestana: "" })}
          >
            Pronóstico
          </Button>
          <Button
            aria-pressed={presentation.tab === "contexto"}
            variant={presentation.tab === "contexto" ? "contained" : "outlined"}
            onClick={() => onChange({ pestana: "contexto" })}
          >
            Datos del territorio
          </Button>
        </ButtonGroup>
      ) : (
        <Tabs
          value={presentation.tab}
          onChange={(_event, value: Presentation["tab"]) =>
            onChange({ pestana: value === "pronostico" ? "" : value })
          }
          aria-label="Contenido territorial"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, py: 1, fontSize: 13 } }}
        >
          <Tab
            id="tab-pronostico"
            aria-controls="territorial-content"
            value="pronostico"
            label="Pronóstico 2027"
          />
          <Tab
            id="tab-contexto"
            aria-controls="territorial-content"
            value="contexto"
            label="Datos del territorio"
          />
        </Tabs>
      )}
      {presentation.tab === "contexto" && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: compact
              ? "1fr"
              : { xs: "minmax(0, 1fr)", sm: "minmax(0, 1fr) minmax(0, 1fr)" },
            gap: 1,
            mt: 1,
          }}
        >
          <TextField
            label="Tema del mapa"
            select
            size="small"
            value={presentation.view}
            onChange={(event) => onChange({ indicador: event.target.value })}
          >
            {Object.entries(contextViews).map(([key, label]) => (
              <MenuItem key={key} value={key} sx={{ whiteSpace: "normal" }}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          {presentation.view === "personas" && (
            <TextField
              label="Grupo de personas"
              select
              size="small"
              value={presentation.group}
              onChange={(event) => onChange({ grupo: event.target.value })}
            >
              {Object.entries(peopleGroups).map(([key, label]) => (
                <MenuItem key={key} value={key} sx={{ whiteSpace: "normal" }}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          )}
          {presentation.view === "seguridad" && (
            <TextField
              label="Indicador de seguridad"
              select
              size="small"
              value={presentation.security}
              onChange={(event) => onChange({ seguridad: event.target.value })}
            >
              {[
                ["homicidios", "Homicidios por cada 100 mil habitantes"],
                ["institucion", "Quién ejerce la seguridad"],
                ["policia", "Policía municipal"],
              ].map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          )}
          {presentation.view === "historia" && (
            <TextField
              label="Año de la elección"
              select
              size="small"
              value={presentation.year}
              onChange={(event) => onChange({ anio: event.target.value })}
            >
              {[2009, 2012, 2015, 2018, 2021, 2024].map((year) => (
                <MenuItem key={year} value={String(year)}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>
      )}
      {presentation.tab === "contexto" && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {contextGuides[presentation.view].summary}
        </Typography>
      )}
    </Box>
  );
}

export function ResultsCards({
  cards,
  count,
  withData,
  compact = false,
}: {
  cards: { label: string; value: string; detail?: string | undefined }[];
  count: number;
  withData: number;
  compact?: boolean;
}) {
  return (
    <Box sx={{ minWidth: 0, maxWidth: "100%" }}>
      <Box
        role="region"
        aria-label="Resumen de los municipios seleccionados"
        tabIndex={0}
        sx={{
          display: "grid",
          gridAutoFlow: compact ? "row" : "column",
          gridTemplateColumns: compact ? "repeat(2, minmax(0, 1fr))" : undefined,
          minWidth: 0,
          maxWidth: "100%",
          gridAutoColumns: compact ? undefined : "minmax(155px, 1fr)",
          gap: 1,
          overflowX: "auto",
          maxHeight: compact ? 245 : undefined,
          pb: 0.5,
          "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
        }}
      >
        {cards.map((card) => (
          <Box
            key={card.label}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1.5,
              bgcolor: "background.paper",
              px: 1.5,
              py: 0.75,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: 12, display: "block" }}
            >
              {card.label}
            </Typography>
            <Typography
              sx={{
                fontSize: compact ? 18 : 20,
                fontWeight: 700,
                lineHeight: 1.35,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {card.value}
            </Typography>
            {card.detail && (
              <Typography variant="caption" color="text.secondary">
                {card.detail}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
      {count > withData && (
        <Typography variant="caption" color="text.secondary">
          {count - withData}{" "}
          {count - withData === 1 ? "municipio sin datos" : "municipios sin datos"}. Las cifras
          corresponden a los {withData.toLocaleString("es-MX")} que sí tienen información.
        </Typography>
      )}
    </Box>
  );
}

export function ResultsLegend({
  title,
  description,
  entries,
  compact = false,
}: {
  title: string;
  description: string;
  entries: LegendItem[];
  compact?: boolean;
}) {
  return (
    <Box
      role="region"
      tabIndex={compact ? 0 : undefined}
      aria-label={`Leyenda: ${title}`}
      sx={{
        px: 1.5,
        py: 1,
        borderTop: compact ? 0 : 1,
        borderColor: "divider",
        maxHeight: compact ? 180 : "none",
        overflowY: "auto",
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: -2,
        },
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, my: 0.75 }}>
        {entries.map((entry) => (
          <Box key={entry.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                width: 12,
                height: 12,
                bgcolor: entry.color,
                border: "1px solid #6D7480",
                borderRadius: 0.3,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" sx={{ fontSize: 11 }}>
              {entry.label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, display: "block" }}>
        {description}
      </Typography>
    </Box>
  );
}
