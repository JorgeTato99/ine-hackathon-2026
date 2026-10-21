"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import type { Dataset, Municipality } from "@/types/dataset";
import {
  estimateFor,
  formatInteger,
  formatPercent,
  formatPointDifference,
  scenarioLabel,
} from "@/utils/dataset";
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
import { ContextHelp } from "@/components/ui/context-help";
import { boothLabels, type HelpTopic } from "@/content/reading-guide";

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
  const datum = (label: string, value: string, help?: HelpTopic) => (
    <Box key={label}>
      <Typography component="dt" variant="caption" color="text.secondary">
        {label}
        {help && <ContextHelp topic={help} />}
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
        <Typography variant="overline">Ficha municipal · Clave {item.id}</Typography>
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
            Sin datos electorales en esta entrega. {item.name} tiene límites disponibles en el mapa,
            pero no una estimación. Se muestra en gris; no significa que su participación sea cero.
          </Alert>
        )}
        {presentation.tab === "contexto" && (
          <Box sx={{ borderLeft: 3, borderColor: "primary.main", pl: 1.5 }}>
            <Typography variant="caption">Dato del tema elegido</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {contextLabel ?? "Sin dato"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Este dato describe el municipio; se consulta por separado de la estimación de 2027.
            </Typography>
          </Box>
        )}
        {item.hasData && (
          <>
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
                Rango estimado (90 %): {formatPercent(result.lower)}–{formatPercent(result.upper)}
                <ContextHelp topic="interval" />
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", mt: 1 }}>
                <RiskBadge risk={result.risk} />
                <Typography variant="caption">
                  {riskNames[result.risk]} · comparación entre municipios
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {info ? scenarioLabel(info) : "Sin escenario"}
              </Typography>
            </Box>
            {info?.intervention === "dirigida_rojos" && (
              <Alert severity="info">
                <strong>Supuesto, no efecto medido.</strong> La cuenta se aplica solo a los
                municipios que estaban en rojo sin intervención. No muestra votos conseguidos por
                una campaña.
              </Alert>
            )}
            <Box
              component="dl"
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, m: 0 }}
            >
              {datum(
                "Escala de riesgo · de 0 a 100",
                position === null ? "Sin dato" : position.toFixed(1),
                "position"
              )}
              {datum(
                "Posibilidad de rojo · sin intervención",
                formatPercent(probability),
                "probability"
              )}
              {datum("Elige ayuntamiento el 6 de junio", boolean("ayuntamiento_mismo_dia_2027"))}
              {datum("Elige gubernatura el 6 de junio", boolean("gobernador_mismo_dia_2027"))}
              {datum("Autoridades por usos y costumbres", boolean("usos_y_costumbres"), "customs")}
              {datum("Personas en lista electoral · 2024", formatInteger(item.nominal), "roll")}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Un número más alto en la escala indica mayor riesgo respecto de otros municipios. No
              es el porcentaje de personas que dejará de votar.
            </Typography>
            {probability !== null && probability >= 0.8 && (
              <Typography variant="caption" color="text.secondary">
                Probable, no seguro: con 80 % o más, el modelo puede mostrar más certeza de la que
                realmente tiene.
              </Typography>
            )}
          </>
        )}
        {alert && alert !== "sin antecedente" && (
          <Alert severity="warning">
            Falta de casillas antes: <strong>{boothLabels[alert] ?? alert}</strong>. Última elección
            registrada: {indicatorText(item, "ultima_eleccion_sin_casilla") ?? "Sin dato"}. Va
            aparte del semáforo. Puede afectar solo a parte del municipio; no anuncia que vaya a
            ocurrir en 2027.
          </Alert>
        )}
        {item.baseRisk === "alto" && (
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: radii.panel }}>
            <Typography component="h3" variant="subtitle2">
              Cómo se calcula la intervención supuesta
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supuesto, no efecto medido. Votos adicionales, no personas movilizadas observadas.
            </Typography>
            <Box component="dl" sx={{ display: "grid", gap: 1, m: "12px 0" }}>
              {datum(
                "S1 · Votos por mantener la participación de la generación de 18 a 20 años de 2024",
                formatInteger(indicatorNumber(item, "interv_votos_retener_primerizos"))
              )}
              {datum(
                "S2 · Votos por reducir a la mitad la diferencia de participación joven",
                formatInteger(indicatorNumber(item, "interv_votos_brecha_joven"))
              )}
              {datum(
                "S3 · Votos por incorporar nuevos votantes a la lista",
                formatInteger(indicatorNumber(item, "interv_votos_credencializar"))
              )}
              {datum(
                "Personas que S3 agrega a la lista electoral",
                formatInteger(indicatorNumber(item, "interv_nuevos_en_lista"))
              )}
              {datum("Total de votos del supuesto", formatInteger(intervention.additionalVotes))}
            </Box>
            <Typography variant="caption">
              S2 usa la diferencia de participación joven de 2021; S3 usa la participación de ese
              mismo año. En S3 crecen tanto los votos como la lista de personas registradas: el
              porcentaje no crece en la misma medida que los votos. Un dato vacío no se reemplaza
              por cero.
            </Typography>
          </Box>
        )}
        {other && item.hasData && (
          <Box sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: radii.panel }}>
            <Typography component="h3" variant="subtitle2">
              Comparación sin/con intervención
            </Typography>
            <Typography variant="body2">
              {info?.intervention === "ninguna" ? "Con intervención" : "Sin intervención"}:{" "}
              {formatPercent(other.participation)}
            </Typography>
            <Typography variant="caption">
              Rango estimado (90 %): {formatPercent(other.lower)}–{formatPercent(other.upper)} ·{" "}
              {riskNames[other.risk]}. Se conserva el supuesto de participación del país. Supuesto,
              no efecto medido.
            </Typography>
          </Box>
        )}
        <Divider />
        <Box>
          <Typography component="h3" variant="h3">
            Participación observada
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Se usaron los límites municipales de 2024 para reunir la historia, con datos del INE y
            actas oficiales. El gráfico muestra la evolución; los porcentajes se leen debajo. Sin
            casilla no significa que la gente decidiera no votar.
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
                  {year}
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
            Faltan datos de alguna elección. Esos espacios no significan cero participación.
          </Alert>
        )}
        <Divider />
        {item.hasData && (
          <Box>
            <Typography component="h3" variant="h3">
              Otros datos del municipio
            </Typography>
            <Box component="dl" sx={{ display: "grid", gap: 1, mt: 1 }}>
              {datum(
                "Participación de 20 a 29 años frente al municipio · 2024",
                formatPointDifference(indicatorNumber(item, "brecha_jovenes_2024")),
                "gap"
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
              {datum(
                "Autoridad de justicia cívica",
                indicatorText(item, "justicia_civica") ?? "Sin dato",
                "civic"
              )}
              {datum(
                "Delitos no denunciados o sin carpeta · estado, 2025",
                indicatorNumber(item, "cifra_oculta_estatal_2025") === null
                  ? "Sin dato"
                  : `${indicatorNumber(item, "cifra_oculta_estatal_2025")}%`,
                "unreported"
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Homicidios del estado: {indicatorText(item, "comparacion_homicidios_inegi_sesnsp")}.
              Estos datos históricos de seguridad no cambian el semáforo ni describen la situación
              en tiempo real.
            </Typography>
          </Box>
        )}
        {item.hasData && (
          <Alert severity="info">
            La cifra exacta es incierta. El modelo sirve mejor para comparar municipios que para
            saber el porcentaje preciso que votará. La participación total del país se plantea como
            supuesto y no es una predicción del modelo.
          </Alert>
        )}
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
          Descargar ficha (JSON)
        </Button>
        <Typography variant="caption" color="text.secondary">
          {dataset.version} · JSON permite reutilizar esta ficha con otras herramientas. Los datos
          de 2027 son estimaciones y supuestos, no resultados observados.
        </Typography>
      </Stack>
    </EntranceScope>
  );
}
