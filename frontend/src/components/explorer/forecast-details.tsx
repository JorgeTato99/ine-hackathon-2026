"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import type { Dataset, Municipality } from "@/types/dataset";
import {
  estimateFor,
  formatInteger,
  formatPercent,
  formatPointDifference,
  formatProbability,
} from "@/utils/dataset";
import {
  baselineId,
  indicator,
  interventions,
  riskNames,
  hasEstimateReason,
  interventionNewRegistrants,
} from "@/utils/forecast";
import { municipalityDocument, saveFile } from "@/utils/downloads";
import { ContributionChart, HistoryChart } from "./forecast-charts";
import { ContextHelp } from "@/components/ui/context-help";
import type { HelpTopic } from "@/content/reading-guide";

export function ForecastDetails({
  dataset,
  municipality: item,
  scenario,
  historical,
}: {
  dataset: Dataset;
  municipality: Municipality;
  scenario: string;
  historical: boolean;
}) {
  const result = estimateFor(dataset, scenario, item.id);
  const base = estimateFor(dataset, baselineId, item.id);
  const probability = indicator(item, "probabilidad_rojo");
  const national = dataset.nationalLevels?.estimado;
  const intervention =
    dataset.scenarios.find((option) => option.id === scenario)?.intervention ?? "ninguna";
  const partial = hasEstimateReason(result, "intervencion_parcial");
  const sourceComparison = item.indicators?.comparacion_homicidios_inegi_sesnsp;
  const gap =
    result.participation !== null && national !== undefined
      ? (result.participation - national) * 100
      : null;
  const section = { py: 2.5, borderTop: 1, borderColor: "divider" } as const;
  const title = (value: string, topic?: HelpTopic) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        mb: 1.5,
      }}
    >
      <Typography component="h3" sx={{ fontSize: 14, fontWeight: 700 }}>
        {value}
      </Typography>
      {topic && <ContextHelp topic={topic} />}
    </Box>
  );
  const history = (
    <Box component="section" sx={section}>
      {title("Historial de participación", "historySeries")}
      <HistoryChart dataset={dataset} municipality={item} scenario={scenario} />
    </Box>
  );
  return (
    <Box sx={{ px: { xs: 2, sm: 2.5 } }}>
      {!item.hasData ? (
        <Typography sx={{ py: 3 }}>
          Este municipio tiene límites en el mapa, pero no cuenta con datos electorales en esta
          entrega. Sin dato no significa cero participación.
        </Typography>
      ) : (
        <>
          {historical && history}
          <Box
            component="section"
            sx={{
              my: 2,
              p: 2,
              bgcolor: "action.hover",
              borderLeft: "3px solid",
              borderColor: "primary.main",
              borderRadius: "0 8px 8px 0",
            }}
          >
            {title("Predicción 2027", "forecastParticipation")}
            <Typography
              sx={{
                fontSize: 34,
                fontWeight: 600,
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
                color: "primary.main",
              }}
            >
              {formatPercent(result.participation)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Rango probable (90 %): {formatPercent(result.lower)}–{formatPercent(result.upper)}
              <ContextHelp topic="interval" />
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {formatPointDifference(gap)} que el país.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
              {riskNames[result.risk]}
            </Typography>
            {(result.risk === "alto" || result.risk === "medio") && probability !== null && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Rojo sin intervención: {probability >= 0.8 ? "probable" : "incierto"} (
                {formatProbability(probability)}). No es una certeza.
                <ContextHelp topic="probability" />
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {interventions.find((option) => scenario.endsWith(`_int-${option.id}`))?.label}. El
              rango incluye la incertidumbre municipal y nacional.
            </Typography>
          </Box>
          <Box component="section" sx={section}>
            {title("¿Qué empuja esta predicción?", "contributions")}
            <ContributionChart municipality={item} />
            <Box component="ul" sx={{ pl: 2.5, mb: 0, fontSize: 13, display: "grid", gap: 1 }}>
              <li>
                Votó menos que el país en{" "}
                {formatInteger(indicator(item, "elecciones_por_debajo_del_pais"))} de 6 elecciones.
              </li>
              <li>
                {item.indicators?.ayuntamiento_mismo_dia_2027 ? "Elige" : "No elige"} ayuntamiento
                el 6 de junio de 2027
                {item.indicators?.gobernador_mismo_dia_2027 ? "; también elige gubernatura" : ""}.
              </li>
              {item.indicators?.usos_y_costumbres === true && (
                <li>Elige autoridades por usos y costumbres.</li>
              )}
              {indicator(item, "brecha_jovenes_2024") !== null && (
                <li>
                  En 2024, la participación de jóvenes de 20 a 29 años fue{" "}
                  {formatPointDifference(indicator(item, "brecha_jovenes_2024"))} respecto del
                  municipio.
                </li>
              )}
            </Box>
          </Box>
          {!historical && history}
          <Box component="section" sx={section}>
            {title("¿Qué haría la intervención?", "additionalVotes")}
            {partial && (
              <Alert severity="info" role="status" sx={{ mb: 2 }}>
                Intervención calculada solo con los datos disponibles.
                {indicator(item, "interv_votos_credencializar") === null &&
                  ["credencializacion", "combinada"].includes(intervention) && (
                    <Typography variant="caption" component="p" sx={{ mt: 0.5 }}>
                      Falta el dato de credencialización: ese componente no suma votos ni personas a
                      la lista.
                    </Typography>
                  )}
              </Alert>
            )}
            {base.risk === "alto" ? (
              <>
                <Box sx={{ overflowX: "auto" }}>
                  <Box
                    component="table"
                    sx={{
                      width: "100%",
                      fontSize: 12,
                      borderCollapse: "collapse",
                      "th, td": {
                        textAlign: "right",
                        py: 1,
                        px: 0.5,
                        borderBottom: 1,
                        borderColor: "divider",
                      },
                      "th:first-of-type": { textAlign: "left" },
                    }}
                  >
                    <caption>Cuatro intervenciones supuestas en {item.name}</caption>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Votos adicionales</th>
                        <th>Participación</th>
                        <th>¿Sale del rojo?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interventions
                        .filter((option) => option.id !== "ninguna")
                        .map((option) => {
                          const key = `nac-estimado_int-${option.id}`;
                          const value = estimateFor(dataset, key, item.id);
                          return (
                            <Box
                              component="tr"
                              key={key}
                              sx={{ bgcolor: scenario === key ? "action.selected" : "transparent" }}
                            >
                              <th scope="row">
                                {option.label}
                                {scenario === key ? " · elegida" : ""}
                                {hasEstimateReason(value, "intervencion_parcial") && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ display: "block", color: "text.secondary" }}
                                  >
                                    Intervención parcial
                                  </Typography>
                                )}
                              </th>
                              <td>{formatInteger(value.additionalVotes)}</td>
                              <td>{formatPercent(value.participation)}</td>
                              <td>
                                {value.participation === null
                                  ? "Sin dato"
                                  : value.risk === "alto"
                                    ? "No"
                                    : "Sí"}
                              </td>
                            </Box>
                          );
                        })}
                    </tbody>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                  Supuesto, no efecto medido. Se calcula municipio por municipio. Credencializar
                  suma personas a la lista y puede reducir el porcentaje aunque aumenten los votos.
                </Typography>
                {(scenario.endsWith("credencializacion") || scenario.endsWith("combinada")) && (
                  <Typography variant="caption" color="text.secondary">
                    Personas adicionales en la lista:{" "}
                    {formatInteger(interventionNewRegistrants(item, intervention, base.risk))}.
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2">
                La intervención supuesta se calcula solo en los municipios en rojo sin intervención.
              </Typography>
            )}
          </Box>
          {(item.indicators?.alerta_sin_casilla !== "sin antecedente" ||
            item.indicators?.historia_completa === false) && (
            <Box component="section" sx={section}>
              {title("Avisos")}
              {item.indicators?.alerta_sin_casilla !== "sin antecedente" && (
                <Typography variant="body2">
                  En elecciones anteriores faltaron casillas (última:{" "}
                  {String(item.indicators?.ultima_eleccion_sin_casilla ?? "sin dato")}). Ese riesgo
                  va aparte del color.
                </Typography>
              )}
              {item.indicators?.historia_completa === false && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  No tiene datos de todas las elecciones.
                </Typography>
              )}
            </Box>
          )}
          <Box component="details" sx={section}>
            <Typography
              component="summary"
              sx={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              Contexto del municipio
            </Typography>
            <Typography variant="caption" color="text.secondary">
              La tasa de homicidios, en logaritmo, forma parte del modelo. Los otros datos de
              seguridad son contexto.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Homicidios por cada 100 mil habitantes al año (2022–2024):{" "}
              {formatInteger(indicator(item, "tasa_homicidios_2022_2024"))}.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Comparación de fuentes en {item.state} (2019–2024):{" "}
              {typeof sourceComparison === "string" && sourceComparison
                ? sourceComparison
                : "Sin dato"}
              .
              <ContextHelp topic="homicideSources" />
            </Typography>
            <Typography variant="caption" color="text.secondary">
              La comparación es estatal; no mide la diferencia entre fuentes de este municipio.
            </Typography>
            <Typography variant="body2">
              Policía municipal:{" "}
              {item.indicators?.tiene_policia_municipal === null
                ? "Sin dato"
                : item.indicators?.tiene_policia_municipal
                  ? "Sí"
                  : "No"}
              .
            </Typography>
            <Typography variant="body2">
              Justicia cívica: {String(item.indicators?.justicia_civica ?? "Sin dato")}.
            </Typography>
          </Box>
        </>
      )}
      <Button
        sx={{ mb: 2 }}
        onClick={() =>
          saveFile(
            `TrazaCivica_${item.id}_${dataset.version}.json`,
            JSON.stringify(
              {
                ...municipalityDocument(dataset, item, scenario),
                interventions: interventions.map((option) => ({
                  type: option.id,
                  result: estimateFor(dataset, `nac-estimado_int-${option.id}`, item.id),
                })),
              },
              null,
              2
            ),
            "application/json"
          )
        }
      >
        Descargar ficha (JSON)
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", pb: 3 }}>
        <a href="/metodologia/">Cómo leer estos resultados</a> · {dataset.version}
      </Typography>
    </Box>
  );
}
