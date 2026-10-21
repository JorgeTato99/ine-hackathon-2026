"use client";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import type { Dataset } from "@/types/dataset";
import { scenarioLabel, formatPercent } from "@/utils/dataset";
import { Icon } from "@/components/ui/icon";
import { ContextHelp } from "@/components/ui/context-help";
import type { QueryChange } from "./explorer-filters";

export type ScenarioPanelProps = {
  dataset: Dataset;
  scenario: string;
  second: string;
  comparing: boolean;
  onChange: QueryChange;
};
export function ExplorerScenarios({
  dataset,
  scenario,
  second,
  comparing,
  onChange,
}: ScenarioPanelProps) {
  if (!dataset.sample) {
    const info = dataset.scenarios.find((entry) => entry.id === scenario) ?? dataset.scenarios[0]!;
    const choose = (national: string, intervention: string) => {
      const first = dataset.scenarios.find(
        (entry) => entry.national === national && entry.intervention === intervention
      );
      const paired = dataset.scenarios.find(
        (entry) => entry.national === national && entry.intervention !== intervention
      );
      if (first) onChange({ escenario: first.id, segundo: paired?.id ?? "" });
    };
    const paired = dataset.scenarios.find(
      (entry) => entry.national === info.national && entry.intervention !== info.intervention
    );
    return (
      <Box component="section" aria-label="Escenarios del pronóstico" sx={{ p: 2 }}>
        <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>
          Pronóstico 2027
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 32px",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <TextField
            fullWidth
            label="Participación supuesta del país"
            size="small"
            select
            value={info.national}
            onChange={(event) => choose(event.target.value, info.intervention)}
          >
            {Object.entries(dataset.nationalLevels ?? {}).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {{
                  bajo: "Baja participación",
                  medio: "Participación media",
                  alto: "Alta participación",
                }[key] ?? key}{" "}
                · {formatPercent(value)}
              </MenuItem>
            ))}
          </TextField>
          <ContextHelp topic="national" />
        </Box>
        <TextField
          fullWidth
          label="Intervención (supuesto)"
          size="small"
          select
          value={info.intervention}
          onChange={(event) => choose(info.national, event.target.value)}
          sx={{ mt: 1.5 }}
        >
          <MenuItem value="ninguna">Sin intervención</MenuItem>
          <MenuItem value="dirigida_rojos">Con intervención supuesta</MenuItem>
        </TextField>
        <Button
          size="small"
          startIcon={<Icon name="compare" size={16} />}
          aria-pressed={comparing}
          onClick={() => onChange({ comparar: comparing ? "" : "1", segundo: paired?.id ?? "" })}
          sx={{ mt: 1 }}
        >
          Comparar sin/con intervención
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Prueba qué podría pasar con distintas cifras de participación del país. La opción con
          intervención supone acciones para promover el voto en los municipios rojos. Al comparar,
          se mantiene el mismo porcentaje nacional.
        </Typography>
        {(info.intervention !== "ninguna" || comparing) && (
          <Alert severity="info" sx={{ mt: 1.5, fontSize: 12 }}>
            <strong>Supuesto, no efecto medido.</strong> Es una cuenta hipotética, no un resultado
            comprobado ni una promesa de lo que conseguiría una campaña.
          </Alert>
        )}
      </Box>
    );
  }
  return (
    <Box component="section" aria-label="Escenarios de muestra" sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700 }}>
          Escenarios
        </Typography>
        <Typography variant="caption" color="text.secondary">
          2027 ilustrativo
        </Typography>
      </Box>
      <TextField
        fullWidth
        label={comparing ? "Escenario A" : "Escenario de muestra"}
        select
        size="small"
        value={scenario}
        onChange={(e) => onChange({ escenario: e.target.value })}
      >
        {dataset.scenarios.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {scenarioLabel(s)}
          </MenuItem>
        ))}
      </TextField>
      <Button
        size="small"
        startIcon={<Icon name="compare" size={16} />}
        aria-label={comparing ? "✓ Lectura A/B activa" : "Consultar dos escenarios A/B"}
        aria-pressed={comparing}
        onClick={() => onChange({ comparar: comparing ? "" : "1" })}
        sx={{ mt: 1 }}
      >
        {comparing ? "✓ Lectura A/B activa" : "Consultar dos escenarios"}
      </Button>
      {comparing && (
        <>
          <TextField
            fullWidth
            label="Escenario B"
            select
            size="small"
            value={second}
            onChange={(e) => onChange({ segundo: e.target.value })}
            sx={{ mt: 1 }}
          >
            {dataset.scenarios.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {scenarioLabel(s)}
              </MenuItem>
            ))}
          </TextField>
          <Alert severity="info" icon={<Icon name="info" />} sx={{ mt: 1.5, fontSize: 12 }}>
            <strong>Comparabilidad científica pendiente.</strong> No se atribuyen diferencias a una
            intervención.{" "}
            {dataset.scenarios.find((s) => s.id === scenario)?.national !==
              dataset.scenarios.find((s) => s.id === second)?.national &&
              "También cambia el contexto nacional."}
          </Alert>
        </>
      )}
    </Box>
  );
}
