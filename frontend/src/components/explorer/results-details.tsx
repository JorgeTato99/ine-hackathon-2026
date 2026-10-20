"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import type { Dataset, Municipality } from "@/types/dataset";
import { estimateFor, formatInteger, formatPercent, scenarioLabel } from "@/utils/dataset";
import {
  historicalLabel,
  indicatorBoolean,
  indicatorNumber,
  indicatorText,
  type Presentation,
} from "@/utils/indicators";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Icon } from "@/components/ui/icon";
import { municipalityDocument, saveFile } from "@/utils/downloads";
import { radii } from "@/theme/tokens";
import { EntranceScope } from "@/components/motion/entrance-scope";

const riskNames = { alto: "Rojo", medio: "Amarillo", bajo: "Verde", sin_estimacion: "Sin dato" };
export function ResultsDetails({
  dataset,
  municipality,
  scenario,
  second,
  presentation,
  contextLabel,
}: {
  dataset: Dataset;
  municipality: Municipality;
  scenario: string;
  second?: string;
  presentation: Presentation;
  contextLabel?: string | undefined;
}) {
  const item = municipality,
    result = estimateFor(dataset, scenario, item.id),
    info = dataset.scenarios.find((entry) => entry.id === scenario);
  const other = second ? estimateFor(dataset, second, item.id) : null;
  const probability = indicatorNumber(item, "probabilidad_rojo"),
    position = indicatorNumber(item, "posicion_riesgo");
  const alert = indicatorText(item, "alerta_sin_casilla");
  const intervention = estimateFor(
    dataset,
    `nac-${info?.national ?? "medio"}_int-dirigida_rojos`,
    item.id
  );
  const history = Object.entries(item.history);
  let path = "",
    continuous = false;
  history.forEach(([year, value], index) => {
    if (value === null || item.historyStatus?.[year] === "sin_casilla") {
      continuous = false;
      return;
    }
    path += `${continuous ? " L" : " M"}${15 + index * 54},${85 - value * 72}`;
    continuous = true;
  });
  const datum = (label: string, value: string) => (
    <Box key={label}>
      <Typography component="dt" variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0, overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    </Box>
  );
  const boolean = (key: string) => {
    const value = indicatorBoolean(item, key);
    return value === null ? "Sin dato" : value ? "Sí" : "No";
  };
  return (
    <EntranceScope>
      <Box
        className="tc-selection-title"
        key={item.id}
        sx={{ p: 2.5, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}
      >
        <Typography variant="overline">Ficha municipal · CVEGEO {item.id}</Typography>
        <Typography component="h2" variant="h2" sx={{ overflowWrap: "anywhere" }}>
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {item.state}
        </Typography>
      </Box>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        {!item.hasData && (
          <Alert severity="info">
            Sin datos electorales en esta entrega. La geometría de {item.name} no tiene una
            estimación y se muestra en gris.
          </Alert>
        )}
        {presentation.tab === "contexto" && (
          <Box sx={{ borderLeft: 3, borderColor: "primary.main", pl: 1.5 }}>
            <Typography variant="caption">Indicador seleccionado</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {contextLabel ?? "Sin dato"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Contexto separado del pronóstico de 2027.
            </Typography>
          </Box>
        )}
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: radii.panel, p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Participación estimada · 2027
          </Typography>
          <Typography
            sx={{
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1.3,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatPercent(result.participation)}
          </Typography>
          <Typography variant="body2">
            Intervalo del 90 %: {formatPercent(result.lower)}–{formatPercent(result.upper)}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", mt: 1 }}>
            <RiskBadge risk={result.risk} />
            <Typography variant="caption">{riskNames[result.risk]} · riesgo relativo</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {info ? scenarioLabel(info) : "Sin escenario"}
          </Typography>
        </Box>
        {info?.intervention === "dirigida_rojos" && (
          <Alert severity="info">
            <strong>Supuesto, no efecto medido.</strong> Se aplican los supuestos solo a los
            municipios rojos de referencia.
          </Alert>
        )}
        <Box
          component="dl"
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, m: 0 }}
        >
          {datum(
            "Posición de riesgo · 100 = mayor",
            position === null ? "Sin dato" : position.toFixed(1)
          )}
          {datum("Probabilidad de rojo · sin intervención", formatPercent(probability))}
          {datum("Ayuntamiento el mismo día", boolean("ayuntamiento_mismo_dia_2027"))}
          {datum("Gubernatura el mismo día", boolean("gobernador_mismo_dia_2027"))}
          {datum("Usos y costumbres", boolean("usos_y_costumbres"))}
          {datum("Lista nominal · 2024", formatInteger(item.nominal))}
        </Box>
        {probability !== null && probability >= 0.8 && (
          <Typography variant="caption" color="text.secondary">
            Probable, no seguro: la probabilidad de rojo es optimista en los extremos.
          </Typography>
        )}
        {alert && alert !== "sin antecedente" && (
          <Alert severity="warning">
            Alerta sin casilla: <strong>{alert}</strong>. Último antecedente:{" "}
            {indicatorText(item, "ultima_eleccion_sin_casilla") ?? "Sin dato"}. Va aparte del
            semáforo.
          </Alert>
        )}
        {item.baseRisk === "alto" && (
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: radii.panel }}>
            <Typography component="h3" variant="subtitle2">
              Intervención dirigida · supuestos
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supuesto, no efecto medido. Votos adicionales, no personas movilizadas observadas.
            </Typography>
            <Box component="dl" sx={{ display: "grid", gap: 1, m: "12px 0" }}>
              {datum(
                "S1 · Retener primerizos",
                formatInteger(indicatorNumber(item, "interv_votos_retener_primerizos"))
              )}
              {datum(
                "S2 · Cerrar la mitad de la brecha joven",
                formatInteger(indicatorNumber(item, "interv_votos_brecha_joven"))
              )}
              {datum(
                "S3 · Credencializar a los nuevos",
                formatInteger(indicatorNumber(item, "interv_votos_credencializar"))
              )}
              {datum(
                "Nuevas personas en la lista · S3",
                formatInteger(indicatorNumber(item, "interv_nuevos_en_lista"))
              )}
              {datum("Total de votos del supuesto", formatInteger(intervention.additionalVotes))}
            </Box>
            <Typography variant="caption">
              S3 también aumenta el denominador: sumar votos no equivale a subir el mismo número de
              puntos de participación. Los componentes vacíos permanecen sin dato.
            </Typography>
          </Box>
        )}
        {other && (
          <Box sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: radii.panel }}>
            <Typography component="h3" variant="subtitle2">
              Comparación sin/con intervención
            </Typography>
            <Typography variant="body2">
              {info?.intervention === "ninguna" ? "Con intervención" : "Sin intervención"}:{" "}
              {formatPercent(other.participation)}
            </Typography>
            <Typography variant="caption">
              Intervalo 90 %: {formatPercent(other.lower)}–{formatPercent(other.upper)} ·{" "}
              {riskNames[other.risk]}. Mismo nivel nacional. Supuesto, no efecto medido.
            </Typography>
          </Box>
        )}
        <Divider />
        <Box>
          <Typography component="h3" variant="h3">
            Participación observada
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Historia reconstruida con territorio de 2024; fuentes INE y actas oficiales. Sin casilla
            no se representa como abstención.
          </Typography>
          <Box
            component="svg"
            aria-hidden="true"
            viewBox="0 0 300 112"
            sx={{ width: "100%", color: "primary.main", mt: 1 }}
          >
            <path d="M10 49H292" stroke="currentColor" strokeOpacity=".2" strokeDasharray="3 4" />
            <path d={path} stroke="currentColor" strokeWidth="2.5" fill="none" />
            {history.map(([year, value], index) => (
              <g key={year}>
                {value !== null && !item.historyStatus?.[year] && (
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
            sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, m: 0 }}
          >
            {history.map(([year]) => datum(year, historicalLabel(item, year)))}
          </Box>
        </Box>
        {indicatorBoolean(item, "historia_completa") === false && (
          <Alert severity="info">
            Historia incompleta: faltan observaciones en alguna elección. Los vacíos no se
            sustituyen por cero.
          </Alert>
        )}
        <Divider />
        <Box>
          <Typography component="h3" variant="h3">
            Contexto del municipio
          </Typography>
          <Box component="dl" sx={{ display: "grid", gap: 1, mt: 1 }}>
            {datum(
              "Brecha joven 2024 · puntos porcentuales",
              indicatorNumber(item, "brecha_jovenes_2024") === null
                ? "Sin dato"
                : `${indicatorNumber(item, "brecha_jovenes_2024")} pp`
            )}
            {datum(
              "Homicidios 2022–2024 · por 100 mil al año",
              indicatorNumber(item, "tasa_homicidios_2022_2024")?.toLocaleString("es-MX", {
                maximumFractionDigits: 1,
              }) ?? "Sin dato"
            )}
            {datum(
              "Quién ejerce la seguridad",
              indicatorText(item, "quien_ejerce_seguridad") ?? "Sin dato"
            )}
            {datum("Policía municipal", boolean("tiene_policia_municipal"))}
            {datum(
              "Policías municipales por 10 mil habitantes",
              String(
                indicatorNumber(item, "policias_municipales_por_10mil_habitantes") ?? "Sin dato"
              )
            )}
            {datum("Justicia cívica", indicatorText(item, "justicia_civica") ?? "Sin dato")}
            {datum(
              "Cifra oculta estatal 2025 · ENVIPE 2026",
              indicatorNumber(item, "cifra_oculta_estatal_2025") === null
                ? "Sin dato"
                : `${indicatorNumber(item, "cifra_oculta_estatal_2025")}%`
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {indicatorText(item, "comparacion_homicidios_inegi_sesnsp")}. Seguridad es contexto; no
            entra al semáforo.
          </Typography>
        </Box>
        <Alert severity="info">
          El modelo ordena bien a los municipios, pero no predice el nivel nacional. El intervalo es
          ancho (de ±8 a ±15 pp); la posición es más confiable que la cifra.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<Icon name="download" />}
          onClick={() =>
            saveFile(
              `ficha-${item.id}-${dataset.version}.json`,
              JSON.stringify(municipalityDocument(dataset, item, scenario, second), null, 2),
              "application/json"
            )
          }
        >
          Descargar ficha JSON
        </Button>
        <Typography variant="caption" color="text.secondary">
          {dataset.version} · pronóstico y supuestos 2027; no resultados observados de esa elección.
        </Typography>
      </Stack>
    </EntranceScope>
  );
}
