"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Dataset, Municipality } from "@/types/dataset";
import { estimateFor, formatInteger, formatPercent, formatPointDifference } from "@/utils/dataset";
import { baselineId, forecastTotals, historicalClass, riskNames } from "@/utils/forecast";
import { ContextHelp } from "@/components/ui/context-help";
import type { HelpTopic } from "@/content/reading-guide";

export function ForecastSummary({
  dataset,
  rows,
  selected,
  scenario,
  historical,
  year,
  compact = false,
}: {
  dataset: Dataset;
  rows: Municipality[];
  selected: Municipality | undefined;
  scenario: string;
  historical: boolean;
  year: string;
  compact?: boolean;
}) {
  const totals = forecastTotals(dataset, rows, scenario);
  const base = forecastTotals(dataset, rows, baselineId);
  const result = selected ? estimateFor(dataset, scenario, selected.id) : null;
  const hasIntervention = !scenario.endsWith("_int-ninguna");
  const national = dataset.nationalLevels?.estimado;
  const weightedHistory = rows.reduce(
    (value, item) => {
      const history = item.history[year];
      if (
        history !== null &&
        history !== undefined &&
        item.nominal !== null &&
        !item.historyStatus?.[year]
      ) {
        value.votes += history * item.nominal;
        value.list += item.nominal;
      }
      return value;
    },
    { votes: 0, list: 0 }
  );
  const cards = historical
    ? [
        {
          label: `País · ${year}`,
          value: formatPercent(dataset.nationalHistory?.[year]),
          detail: "Participación observada",
        },
        {
          label: selected ? `${selected.name} · ${year}` : "Territorio seleccionado",
          value: selected
            ? selected.historyStatus?.[year]
              ? "Sin casilla"
              : formatPercent(selected.history[year])
            : formatPercent(
                weightedHistory.list ? weightedHistory.votes / weightedHistory.list : null
              ),
          detail: selected ? "Participación observada" : "Referencia ponderada con lista de 2024",
        },
        {
          label: "Municipios bajo 40 %",
          value: formatInteger(rows.filter((item) => historicalClass(item, year) === "0").length),
          detail: "Sin contar la falta de casillas",
        },
        {
          label: "Sin casilla",
          value: formatInteger(
            rows.filter((item) => historicalClass(item, year) === "sin_casilla").length
          ),
          detail: "No equivale a abstención",
        },
      ]
    : [
        {
          label: "Participación esperada",
          value: formatPercent(totals.participation),
          detail:
            selected && result?.participation !== null
              ? `Rango 90 %: ${formatPercent(result?.lower)}–${formatPercent(result?.upper)}`
              : hasIntervention && totals.participation !== null && base.participation !== null
                ? `${formatPointDifference((totals.participation - base.participation) * 100)} frente a ninguna`
                : "Estimación para 2027",
        },
        {
          label: selected ? "Color del municipio" : "Municipios en rojo",
          value: selected ? riskNames[result!.risk]! : formatInteger(totals.red),
          detail: hasIntervention
            ? `${totals.exits} ${totals.exits === 1 ? "sale" : "salen"} del rojo en este territorio`
            : selected
              ? "Comparación entre municipios"
              : "Mayor riesgo relativo",
        },
        {
          label: selected ? "Frente al país" : "Personas en rojo",
          value: selected
            ? formatPointDifference(
                result!.participation !== null && national !== undefined
                  ? (result!.participation - national) * 100
                  : null
              )
            : formatInteger(totals.redPeople),
          detail: selected
            ? "Referencia nacional: 51.4 %"
            : hasIntervention
              ? `${formatInteger(totals.redPeople - base.redPeople)} frente a ninguna · lista 2024`
              : "Personas registradas en 2024",
        },
        {
          label: "Personas en la lista",
          value: selected && !selected.hasData ? "Sin dato" : formatInteger(totals.nominal),
          detail: hasIntervention
            ? `${formatInteger(totals.nominal - base.nominal)} adicionales bajo el supuesto`
            : "Lista electoral de 2024",
        },
      ];
  const topics: HelpTopic[] = historical
    ? ["historyNational", "historyTerritory", "historyLow", "boothHistory"]
    : [
        "forecastParticipation",
        selected ? "trafficLight" : "redCount",
        selected ? "countryGap" : "redPeople",
        "currentRoll",
      ];
  return (
    <Box
      data-pw="forecast-summary"
      aria-label="Cifras del territorio"
      sx={{
        position: compact ? "relative" : "sticky",
        top: 0,
        zIndex: 5,
        bgcolor: "background.paper",
        borderTop: 1,
        borderBottom: 1,
        borderColor: "divider",
        containerType: compact ? "inline-size" : undefined,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: compact
            ? "repeat(2, minmax(0, 1fr))"
            : { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
          ...(compact
            ? {
                "@container (min-width: 600px)": {
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                },
              }
            : {}),
        }}
      >
        {cards.map((card, index) => (
          <Box
            key={card.label}
            sx={{
              px: compact ? 1.25 : { xs: 1.5, md: 2.5 },
              py: { xs: 1.2, md: 1 },
              minWidth: 0,
              borderRight: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 0.5,
              }}
            >
              <Typography sx={{ fontSize: { xs: 11, md: 12 }, color: "text.secondary" }}>
                {card.label}
              </Typography>
              <ContextHelp topic={topics[index]!} />
            </Box>
            <Typography
              data-pw="summary-value"
              sx={{
                fontVariantNumeric: "tabular-nums",
                fontWeight: 600,
                fontSize: compact ? 20 : selected ? { xs: 18, md: 22 } : { xs: 23, md: 28 },
                lineHeight: 1.2,
                my: 0.5,
                overflowWrap: "anywhere",
              }}
            >
              {card.value}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{card.detail}</Typography>
          </Box>
        ))}
      </Box>
      {!historical && hasIntervention && (
        <Typography
          role="status"
          sx={{ px: 2, py: 0.75, borderTop: 1, borderColor: "divider", fontSize: 12 }}
        >
          <strong>{formatInteger(totals.additional)} votos adicionales</strong> · Supuesto, no
          efecto medido. <ContextHelp topic="additionalVotes" />
          {totals.partialInterventions > 0 && (
            <Box component="span" sx={{ display: "block", mt: 0.5 }}>
              {formatInteger(totals.partialInterventions)}{" "}
              {totals.partialInterventions === 1
                ? "municipio con intervención calculada"
                : "municipios con intervención calculada"}{" "}
              solo con los datos disponibles.
            </Box>
          )}
        </Typography>
      )}
    </Box>
  );
}
