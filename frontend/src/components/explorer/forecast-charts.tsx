"use client";

import { useId } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Dataset, Municipality } from "@/types/dataset";
import { estimateFor, formatPercent } from "@/utils/dataset";
import { baselineId, historyYears, indicator, midtermYears } from "@/utils/forecast";

const groups = [
  ["historia", "Historia de participación"],
  ["calendario", "Calendario y usos y costumbres"],
  ["lista", "Lista y población"],
  ["social", "Condiciones sociales"],
  ["politica", "Competencia política"],
] as const;
export function ContributionChart({ municipality }: { municipality: Municipality }) {
  const values = groups.map(([key, label]) => ({
    label,
    value: indicator(municipality, `aporte_${key}`),
  }));
  const maximum = Math.max(1, ...values.map((item) => Math.abs(item.value ?? 0)));
  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Typography variant="caption" color="text.secondary">
        Puntos frente al país · predicción sin intervención
      </Typography>
      <Box component="dl" sx={{ m: 0, mt: 1 }}>
        {values.map(({ label, value }) => (
          <Box
            key={label}
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(60px, 1fr) 48px",
              alignItems: "center",
              gap: 1,
              py: 0.8,
            }}
          >
            <Typography component="dt" sx={{ fontSize: 13 }}>
              {label}
            </Typography>
            <Box
              aria-hidden="true"
              sx={{
                position: "relative",
                height: 16,
                background:
                  "linear-gradient(90deg, transparent calc(50% - .5px), #8895A0 50%, transparent calc(50% + .5px))",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 2,
                  height: 12,
                  left:
                    value !== null && value < 0
                      ? `${50 - (Math.abs(value) / maximum) * 50}%`
                      : "50%",
                  width: `${(Math.abs(value ?? 0) / maximum) * 50}%`,
                  bgcolor: "primary.main",
                  opacity: value !== null && value < 0 ? 1 : 0.55,
                }}
              />
            </Box>
            <Typography
              component="dd"
              sx={{ m: 0, textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums" }}
            >
              {value === null ? "Sin dato" : `${value > 0 ? "+" : ""}${value.toFixed(1)}`}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography
        component="figcaption"
        variant="caption"
        sx={{ display: "block", mt: 1, color: "text.secondary" }}
      >
        Reparto de la predicción del modelo; no son causas probadas. Las barras explican la
        predicción base, no el efecto de la intervención.
      </Typography>
    </Box>
  );
}

export function HistoryChart({
  dataset,
  municipality,
  scenario,
}: {
  dataset: Dataset;
  municipality: Municipality;
  scenario: string;
}) {
  const titleId = useId();
  const estimate = estimateFor(dataset, scenario, municipality.id);
  const years = [...historyYears, "2027"];
  const x = (index: number) => 36 + index * 48;
  const y = (value: number) => 174 - value * 145;
  const history = historyYears.map((year) =>
    municipality.historyStatus?.[year] ? null : (municipality.history[year] ?? null)
  );
  const country = years.map((year) =>
    year === "2027"
      ? (dataset.nationalLevels?.estimado ?? null)
      : (dataset.nationalHistory?.[year] ?? null)
  );
  const segments = (values: (number | null)[]) =>
    values.flatMap((value, index) =>
      value !== null && index > 0 && values[index - 1] !== null
        ? [
            <line
              key={index}
              x1={x(index - 1)}
              x2={x(index)}
              y1={y(values[index - 1]!)}
              y2={y(value)}
            />,
          ]
        : []
    );
  const base = estimateFor(dataset, baselineId, municipality.id);
  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Box
        component="svg"
        viewBox="0 0 360 210"
        role="img"
        aria-labelledby={titleId}
        sx={{
          display: "block",
          width: "100%",
          overflow: "visible",
          color: "text.secondary",
          fontSize: 10,
        }}
      >
        <title id={titleId}>
          Participación de {municipality.name} y del país de 2009 a 2024, con estimación e intervalo
          de 2027. Valores disponibles en la tabla siguiente.
        </title>
        {[0, 0.25, 0.5, 0.75, 1].map((value) => (
          <g key={value}>
            <line
              x1="32"
              x2="338"
              y1={y(value)}
              y2={y(value)}
              stroke="currentColor"
              opacity=".15"
            />
            <text x="26" y={y(value) + 3} textAnchor="end" fill="currentColor">
              {value * 100}
            </text>
          </g>
        ))}
        <g stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity=".7">
          {segments(country)}
        </g>
        <g stroke="var(--mui-palette-primary-main)" strokeWidth="2.5">
          {segments(history)}
        </g>
        {history.map((value, index) =>
          value === null ? null : (
            <circle
              key={index}
              cx={x(index)}
              cy={y(value)}
              r="3"
              fill="var(--mui-palette-primary-main)"
            />
          )
        )}
        {historyYears.map((year, index) =>
          municipality.historyStatus?.[year] ? (
            <path key={year} d={`M${x(index)} 157l5 5-5 5-5-5Z`} fill="#7C838A" />
          ) : null
        )}
        {estimate.participation !== null && (
          <g stroke="var(--mui-palette-primary-main)" strokeWidth="2">
            {estimate.lower !== null && estimate.upper !== null && (
              <>
                <line x1={x(6)} x2={x(6)} y1={y(estimate.lower)} y2={y(estimate.upper)} />
                <line x1={x(6) - 5} x2={x(6) + 5} y1={y(estimate.lower)} y2={y(estimate.lower)} />
                <line x1={x(6) - 5} x2={x(6) + 5} y1={y(estimate.upper)} y2={y(estimate.upper)} />
              </>
            )}
            <circle
              cx={x(6)}
              cy={y(estimate.participation)}
              r="4"
              fill="var(--mui-palette-background-paper)"
            />
          </g>
        )}
        {years.map((year, index) => (
          <g key={year}>
            <text x={x(index)} y="192" textAnchor="middle" fill="currentColor">
              {year}
            </text>
            {midtermYears.has(year) && (
              <text x={x(index)} y="204" textAnchor="middle" fontSize="7.5" fill="currentColor">
                intermedia
              </text>
            )}
          </g>
        ))}
      </Box>
      <Typography component="figcaption" variant="caption" color="text.secondary">
        Línea continua: municipio · discontinua: país · 2027: estimación y rango de 90 %. Rombo
        gris: sin casilla, no abstención.
      </Typography>
      <Box component="details" sx={{ mt: 1 }}>
        <Box component="summary" sx={{ cursor: "pointer", color: "primary.main", fontSize: 13 }}>
          Ver valores del historial
        </Box>
        <Box
          component="table"
          sx={{
            width: "100%",
            fontSize: 12,
            mt: 1,
            "th, td": { textAlign: "right", py: 0.5 },
            "th:first-of-type, td:first-of-type": { textAlign: "left" },
          }}
        >
          <caption>Participación municipal y nacional</caption>
          <thead>
            <tr>
              <th>Año</th>
              <th>Municipio</th>
              <th>País</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year, index) => (
              <tr key={year}>
                <th scope="row">{year}</th>
                <td>
                  {year === "2027"
                    ? formatPercent(estimate.participation)
                    : municipality.historyStatus?.[year]
                      ? "Sin casilla"
                      : formatPercent(municipality.history[year])}
                </td>
                <td>{formatPercent(country[index])}</td>
              </tr>
            ))}
          </tbody>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Predicción base de 2027: {formatPercent(base.participation)}. Las ausencias se dejan como
          huecos.
        </Typography>
      </Box>
    </Box>
  );
}
