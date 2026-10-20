"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Icon } from "@/components/ui/icon";
import type { Dataset, Municipality } from "@/types/dataset";
import {
  estimateFor,
  formatPercent,
  formatInteger,
  knownHistory,
  scenarioLabel,
} from "@/utils/dataset";
import { municipalityDocument, saveFile } from "@/utils/downloads";
import { colors, radii } from "@/theme/tokens";
import { EntranceScope } from "@/components/motion/entrance-scope";
import { LocationGuide } from "./location-guide";

export function MunicipalityDetails({
  dataset,
  municipality,
  scenario,
  second,
  compactEmpty = false,
  hideHeadingLabel = false,
}: {
  dataset: Dataset;
  municipality: Municipality | undefined;
  scenario: string;
  second?: string;
  compactEmpty?: boolean;
  hideHeadingLabel?: boolean;
}) {
  if (!municipality)
    return (
      <EntranceScope>
        <Stack
          spacing={compactEmpty ? 1.25 : 2}
          sx={{ p: compactEmpty ? 2 : 3, minHeight: compactEmpty ? 0 : 420 }}
        >
          {!hideHeadingLabel && (
            <Typography variant="overline" color="primary.main">
              Ficha municipal
            </Typography>
          )}
          <Box sx={compactEmpty ? { maxWidth: 140, mx: "auto", width: "100%" } : {}}>
            <LocationGuide />
          </Box>
          <Typography component="h2" variant="h2" sx={compactEmpty ? { fontSize: 20 } : {}}>
            Cada municipio tiene una historia
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Selecciona un territorio en el mapa o búscalo por nombre o clave. Aquí podrás consultar
            su historia, {dataset.sample ? "resultado de muestra" : "pronóstico e indicadores"} y
            condiciones de lectura.
          </Typography>
          <Box sx={{ borderLeft: 3, borderColor: "primary.main", pl: 2 }}>
            <Typography variant="caption" color="text.secondary">
              El riesgo, el estado de la estimación y la prioridad son dimensiones diferentes.
            </Typography>
          </Box>
          <Button
            component="a"
            href="/metodologia/"
            size="small"
            endIcon={<Icon name="arrow" size={16} />}
            sx={{ alignSelf: "flex-start", p: 0 }}
          >
            Cómo leer los resultados
          </Button>
        </Stack>
      </EntranceScope>
    );
  const result = estimateFor(dataset, scenario, municipality.id);
  const secondInfo = dataset.scenarios.find((item) => item.id === second);
  const secondResult = second ? estimateFor(dataset, second, municipality.id) : undefined;
  const history = knownHistory(municipality);
  let path = "",
    continuous = false;
  history.forEach(({ value }, index) => {
    if (value === null) {
      continuous = false;
      return;
    }
    const x = 15 + index * 54,
      y = 85 - value * 72;
    path += `${continuous ? " L" : " M"}${x},${y}`;
    continuous = true;
  });
  const scenarioInfo = dataset.scenarios.find((item) => item.id === scenario);
  return (
    <EntranceScope>
      <Box
        sx={(theme) => ({
          p: 2.5,
          bgcolor: colors.light.accentSoft,
          borderBottom: 1,
          borderColor: "divider",
          ...theme.applyStyles("dark", { bgcolor: colors.dark.accentSoft }),
        })}
      >
        {!hideHeadingLabel && (
          <Typography variant="overline" color="primary.main" sx={{ display: "block", mb: 1 }}>
            Ficha municipal
          </Typography>
        )}
        <Box key={municipality.id} className="tc-selection-title">
          <Typography variant="caption" color="text.secondary">
            CVEGEO {municipality.id}
          </Typography>
          <Typography component="h2" variant="h2" sx={{ overflowWrap: "anywhere" }}>
            {municipality.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {municipality.state}
          </Typography>
        </Box>
      </Box>
      <Stack spacing={2.5} sx={{ p: 2.5 }}>
        {!municipality.hasData && (
          <Alert severity="info">
            Sin registro en la muestra. La presencia de una geometría no implica que exista una
            estimación.
          </Alert>
        )}
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: radii.panel,
            p: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Participación 2027 · ejemplo
          </Typography>
          <Typography
            sx={{
              fontSize: 36,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.3,
            }}
          >
            {formatPercent(result.participation)}
          </Typography>
          <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <RiskBadge risk={result.risk} />
            <Typography variant="caption" color="text.secondary">
              Riesgo ilustrativo
            </Typography>
          </Box>
        </Box>
        <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: radii.panel }}>
          <Typography variant="overline" color="text.secondary">
            Condiciones del resultado
          </Typography>
          <Typography variant="body2">
            {scenarioInfo ? scenarioLabel(scenarioInfo) : "Sin escenario"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Estado del registro: <strong>{result.state.replaceAll("_", " ")}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Este estado no acredita calidad alta ni validación del modelo.
          </Typography>
          {result.reason && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Motivo: {result.reason.replaceAll("_", " ").replaceAll("|", "; ")}
            </Typography>
          )}
          {result.lower !== null && result.upper !== null && (
            <Typography variant="body2">
              Intervalo recibido: {formatPercent(result.lower)}–{formatPercent(result.upper)}
            </Typography>
          )}
        </Box>
        {secondInfo && secondResult && (
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              border: 1,
              borderColor: "divider",
              borderRadius: radii.panel,
              p: 2,
            }}
          >
            <Box
              aria-hidden="true"
              className="tc-comparison-rule"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                bgcolor: "primary.main",
              }}
            />
            <Typography variant="overline" color="text.secondary">
              Segunda lectura · ejemplo
            </Typography>
            <Typography sx={{ fontSize: 26, fontWeight: 700 }}>
              {formatPercent(secondResult.participation)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {scenarioLabel(secondInfo)}
            </Typography>
            <Box sx={{ my: 1 }}>
              <RiskBadge risk={secondResult.risk} />
            </Box>
            <Typography variant="body2">
              Estado del registro: {secondResult.state.replaceAll("_", " ")}
            </Typography>
            {secondResult.reason && (
              <Typography variant="body2">
                Motivo: {secondResult.reason.replaceAll("_", " ")}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 1 }}>
              Comparabilidad pendiente. No se atribuye una diferencia al supuesto de intervención.
            </Typography>
          </Box>
        )}
        <Divider />
        <Box>
          <Typography component="h3" variant="h3" gutterBottom>
            Participación observada
          </Typography>
          <Typography variant="caption" color="text.secondary">
            SV / (SV + NV) · Las series no acreditan límites constantes.
          </Typography>
          <Box
            component="svg"
            aria-hidden="true"
            viewBox="0 0 300 112"
            sx={{ width: "100%", color: "primary.main", mt: 1 }}
          >
            <path d="M10 49H292" stroke="currentColor" strokeOpacity=".2" strokeDasharray="3 4" />
            <path d={path} stroke="currentColor" strokeWidth="2.5" fill="none" />
            {history.map(({ year, value }, index) => (
              <g key={year}>
                {value !== null && (
                  <circle cx={15 + index * 54} cy={85 - value * 72} r={3.5} fill="currentColor" />
                )}
                <text
                  x={15 + index * 54}
                  y="105"
                  fontSize="10"
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {year.slice(2)}
                </text>
              </g>
            ))}
          </Box>
          <Box
            component="dl"
            sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, m: 0 }}
          >
            {history.map(({ year, value }) => (
              <Box key={year}>
                <Typography component="dt" variant="caption" color="text.secondary">
                  {year}
                </Typography>
                <Typography
                  component="dd"
                  variant="body2"
                  sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}
                >
                  {formatPercent(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        {municipality.historyIssue && (
          <Alert severity="warning" sx={{ fontSize: 12 }}>
            {municipality.historyIssue}
          </Alert>
        )}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Lista nominal 2024
          </Typography>
          <Typography variant="body2">{formatInteger(municipality.nominal)}</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Icon name="download" />}
          onClick={() =>
            saveFile(
              `ficha-${municipality.id}-${dataset.version}.json`,
              JSON.stringify(
                municipalityDocument(dataset, municipality, scenario, second),
                null,
                2
              ),
              "application/json"
            )
          }
        >
          Descargar ficha JSON
        </Button>
        <Typography variant="caption" color="text.secondary">
          {dataset.version} · 2027 ilustrativo · Fuente histórica: INE, CCPC. La referencia
          predictora se definirá con el modelo.
        </Typography>
      </Stack>
    </EntranceScope>
  );
}
