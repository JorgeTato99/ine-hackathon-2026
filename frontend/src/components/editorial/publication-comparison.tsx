"use client";

import { useMemo, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { normalized } from "@/utils/dataset";
import { Icon } from "@/components/ui/icon";

type Source = {
  version: string;
  generatedAtSource: string;
  source: { repository: string; commit: string; directory: string };
  files: Record<string, { bytes: number; sha256: string }>;
};
type CellChange = {
  cvegeo: string;
  name: string;
  state: string;
  scenario: string | null;
  column: string;
  kind: string;
  before: string;
  after: string;
  unitBefore: string | null;
  unitAfter: string | null;
  comparable: boolean;
  delta: string | null;
};
type Comparison = {
  generator: { script: string; schemaVersion: number };
  status: string;
  before: Source;
  after: Source;
  summary: {
    cells: number;
    municipalities: number;
    metadata: number;
    kinds: Record<string, number>;
  };
  definitionsChanged: boolean;
  conditionsChanged: string[];
  coverageIncomplete: boolean;
  scenarioCoverage: Record<
    "before" | "after",
    { scenario: string; expected: number; present: number; missing: string[] }[]
  >;
  metadataChanges: { path: string; kind: string; before: unknown; after: unknown }[];
  tables: {
    name: string;
    rowsBefore: number;
    rowsAfter: number;
    addedRows: string[][];
    removedRows: string[][];
    addedColumns: string[];
    removedColumns: string[];
    unclassifiedColumns: string[];
    coverage: { column: string; missingBefore: number | null; missingAfter: number | null }[];
    changes: CellChange[];
  }[];
};
const labels: Record<string, string> = {
  missing: "Ahora sin dato",
  available: "Ahora hay dato",
  format: "Sólo formato",
  data: "Valor distinto",
  unclassified: "Tipo por confirmar",
};
const metadataLabels: Record<string, string> = {
  added: "Se agregó",
  removed: "Se retiró",
  changed: "Cambió",
};
const rawValue = (value: string) => (value === "" ? "Sin dato" : value);

export function PublicationComparison({
  data,
  currentVersion,
  downloadHref,
  fileInfo,
}: {
  data: Comparison;
  currentVersion: string;
  downloadHref: string;
  fileInfo: { bytes: number; sha256: string };
}) {
  const [search, setSearch] = useState("");
  const [field, setField] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const changes = useMemo(
    () =>
      data.tables.flatMap((table) =>
        table.changes.map((change) => ({ ...change, table: table.name }))
      ),
    [data]
  );
  const fields = [...new Set(changes.map((change) => change.column))].sort();
  const filtered = useMemo(
    () =>
      changes.filter(
        (change) =>
          (!field || change.column === field) &&
          normalized(
            `${change.cvegeo} ${change.name} ${change.state} ${change.column} ${change.scenario ?? ""}`
          ).includes(normalized(search))
      ),
    [changes, field, search]
  );
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / size) - 1));
  const unclassified = [...new Set(data.tables.flatMap((table) => table.unclassifiedColumns))];
  const coverageRows = data.tables.flatMap((table) =>
    table.coverage
      .filter(
        (item) =>
          (item.missingBefore ?? 0) > 0 ||
          (item.missingAfter ?? 0) > 0 ||
          table.changes.some((change) => change.column === item.column) ||
          table.addedColumns.includes(item.column) ||
          table.removedColumns.includes(item.column)
      )
      .map((item) => ({ ...item, table: table.name }))
  );
  const zeroToMissing =
    changes.length > 0 &&
    changes.every(
      (change) => change.before.trim() !== "" && Number(change.before) === 0 && change.after === ""
    );
  const scenariosIdentical =
    data.before.files["escenarios_2027.csv"]?.sha256 ===
    data.after.files["escenarios_2027.csv"]?.sha256;
  return (
    <Stack spacing={2} sx={{ overflowWrap: "anywhere" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Chip variant="outlined" label={`${data.before.version} · referencia anterior`} />
        <Chip
          color="primary"
          variant="outlined"
          label={`${data.after.version}${currentVersion === data.after.version ? " · vigente" : " · referencia"}`}
        />
      </Box>
      <Typography variant="body1">
        <strong>
          {data.summary.cells} {data.summary.cells === 1 ? "celda" : "celdas"}
        </strong>{" "}
        {data.summary.cells === 1 ? "modificada" : "modificadas"} en{" "}
        <strong>
          {data.summary.municipalities}{" "}
          {data.summary.municipalities === 1 ? "municipio" : "municipios"}
        </strong>
        . También hay {data.summary.metadata} {data.summary.metadata === 1 ? "cambio" : "cambios"}{" "}
        en las explicaciones de los archivos.
      </Typography>
      {data.status === "unchanged" && (
        <Alert severity="info">No hay cambios de contenido entre estas publicaciones.</Alert>
      )}
      {data.coverageIncomplete && (
        <Alert severity="warning">
          Faltan filas para algunos municipios en un escenario. Revisa la cobertura antes de
          utilizar la comparación; una fila ausente no equivale a cero.
        </Alert>
      )}
      {unclassified.length > 0 && (
        <Alert severity="warning">
          Hay columnas con tipo por confirmar: {unclassified.join(", ")}. Se conserva su texto, sin
          interpretar un cambio de formato como una diferencia numérica.
        </Alert>
      )}
      {zeroToMissing && (
        <Alert severity="info">
          Los cambios de celda sustituyen ceros por celdas vacías. Ahora indican falta de datos: no
          significan que haya bajado la participación.
        </Alert>
      )}
      <Typography variant="body2">
        {scenariosIdentical
          ? "La tabla de escenarios es idéntica en ambos archivos, comprobada por su huella SHA-256."
          : "Los cambios de la tabla de escenarios se detallan junto con los demás."}{" "}
        El mapa utiliza {currentVersion}; esta comparación no cambia los datos que estás
        consultando.
      </Typography>
      <Button
        component="a"
        href={downloadHref}
        download
        startIcon={<Icon name="download" size={17} />}
        sx={{ alignSelf: "flex-start" }}
      >
        Descargar comparación y procedencia (JSON)
      </Button>
      <Typography variant="caption" color="text.secondary">
        Archivo de comparación · {fileInfo.bytes.toLocaleString("es-MX")} bytes · SHA-256{" "}
        {fileInfo.sha256}. Generador: {data.generator.script} · esquema{" "}
        {data.generator.schemaVersion}.
      </Typography>
      {(data.definitionsChanged || data.conditionsChanged.length > 0) && (
        <Alert severity="warning">
          Cambió una explicación o condición de los datos. Se muestran los valores originales y las
          diferencias numéricas se omiten cuando no son comparables. Una corrección de publicación
          no mide el efecto de una campaña.
        </Alert>
      )}
      <Accordion
        disableGutters
        variant="outlined"
        slotProps={{ transition: { unmountOnExit: true } }}
      >
        <AccordionSummary
          expandIcon={<Icon name="chevron" size={18} style={{ transform: "rotate(90deg)" }} />}
        >
          <Typography component="span" variant="subtitle1">
            Ver celdas modificadas ({changes.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              size="small"
              label="Buscar en los cambios"
              helperText="Municipio, clave, campo o escenario."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
            />
            <TextField
              select
              size="small"
              label="Campo modificado"
              value={field}
              onChange={(event) => {
                setField(event.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 0 }}
            >
              <MenuItem value="">Todos los campos</MenuItem>
              {fields.map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Typography role="status" variant="caption">
            {filtered.length} {filtered.length === 1 ? "celda coincide" : "celdas coinciden"} con tu
            búsqueda. Las celdas vacías se leen «Sin dato»; cero se conserva como cero.
          </Typography>
          <Box
            role="region"
            aria-label="Tabla de cambios entre publicaciones"
            tabIndex={0}
            sx={{ overflow: "auto", maxHeight: 480, border: 1, borderColor: "divider", mt: 1 }}
          >
            <Table
              stickyHeader
              size="small"
              aria-label="Celdas modificadas entre publicaciones"
              sx={{ minWidth: 640 }}
            >
              <TableHead>
                <TableRow>
                  {[
                    "Municipio y clave",
                    "Campo y unidad",
                    data.before.version,
                    data.after.version,
                    "Lectura del cambio",
                  ].map((label) => (
                    <TableCell key={label}>{label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(currentPage * size, (currentPage + 1) * size).map((change) => (
                  <TableRow
                    key={`${change.table}/${change.cvegeo}/${change.scenario}/${change.column}`}
                  >
                    <TableCell component="th" scope="row">
                      {change.name} · {change.cvegeo}
                      <Typography component="p" variant="caption">
                        {change.state}
                        {change.scenario ? ` · ${change.scenario}` : ""}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="caption" component="code">
                        {change.column}
                      </Typography>
                      <Typography component="p" variant="caption">
                        {change.unitAfter ?? change.unitBefore ?? "Sin unidad declarada"}
                      </Typography>
                      {change.unitBefore !== change.unitAfter && (
                        <Typography variant="caption">
                          Unidad anterior: {change.unitBefore ?? "No declarada"}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{rawValue(change.before)}</TableCell>
                    <TableCell>{rawValue(change.after)}</TableCell>
                    <TableCell>
                      {labels[change.kind] ?? change.kind}
                      {change.comparable && (
                        <Typography variant="caption" component="p">
                          Diferencia: {change.delta} · misma unidad
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          {!filtered.length && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              No hay celdas que coincidan con esos filtros.
            </Typography>
          )}
          <TablePagination
            component="div"
            count={filtered.length}
            page={currentPage}
            rowsPerPage={size}
            onPageChange={(_, value) => setPage(value)}
            onRowsPerPageChange={(event) => {
              setSize(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            getItemAriaLabel={(type) =>
              type === "next" ? "Página siguiente de cambios" : "Página anterior de cambios"
            }
            sx={{
              ".MuiTablePagination-toolbar": { flexWrap: "wrap", justifyContent: "flex-end", p: 0 },
            }}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion
        disableGutters
        variant="outlined"
        slotProps={{ transition: { unmountOnExit: true } }}
      >
        <AccordionSummary
          expandIcon={<Icon name="chevron" size={18} style={{ transform: "rotate(90deg)" }} />}
        >
          <Typography component="span" variant="subtitle1">
            Reglas, cobertura y procedencia
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography variant="body2">
              Se comparan todas las explicaciones de los archivos, además de las cifras. Las fechas
              siguientes se conservan como las publicó su autora, sin añadir una zona horaria.
            </Typography>
            {data.tables.map((table) => (
              <Typography variant="body2" key={table.name}>
                {table.name}: {table.rowsBefore} → {table.rowsAfter} filas; {table.addedRows.length}{" "}
                altas, {table.removedRows.length} bajas; {table.addedColumns.length} columnas
                nuevas, {table.removedColumns.length} retiradas. El JSON incluye las claves y la
                cobertura de celdas vacías por campo.
              </Typography>
            ))}
            <Typography component="h4" variant="subtitle1">
              Celdas vacías por campo
            </Typography>
            <Typography variant="body2">
              Se incluyen campos con vacíos o cambios. Los vacíos que ya existían no cuentan como
              cambios nuevos; este conteo no mide abstención. «Columna ausente» significa que el
              campo no estaba en ese archivo.
            </Typography>
            {coverageRows.length ? (
              <Box
                role="region"
                aria-label="Cobertura de celdas vacías"
                tabIndex={0}
                sx={{ overflow: "auto", maxHeight: 320 }}
              >
                <Table
                  size="small"
                  stickyHeader
                  aria-label="Celdas vacías por campo"
                  sx={{ minWidth: 520 }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Tabla · campo</TableCell>
                      <TableCell>{data.before.version}</TableCell>
                      <TableCell>{data.after.version}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {coverageRows.map((item) => (
                      <TableRow key={`${item.table}/${item.column}`}>
                        <TableCell component="th" scope="row">
                          {item.table} · {item.column}
                        </TableCell>
                        <TableCell>{item.missingBefore ?? "Columna ausente"}</TableCell>
                        <TableCell>{item.missingAfter ?? "Columna ausente"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography variant="body2">
                No hay vacíos ni cambios de cobertura que detallar.
              </Typography>
            )}
            {(["before", "after"] as const).map((side) => {
              const coverage = data.scenarioCoverage[side];
              return (
                <Box key={side}>
                  <Typography variant="body2">
                    {data[side].version}: {coverage.filter((item) => !item.missing.length).length}{" "}
                    de {coverage.length} escenarios con todos sus municipios registrados (
                    {coverage[0]?.expected ?? 0} esperados por escenario).
                  </Typography>
                  {coverage
                    .filter((item) => item.missing.length)
                    .map((item) => (
                      <Typography variant="caption" component="p" key={item.scenario}>
                        {item.scenario}: {item.present} de {item.expected}; faltan{" "}
                        {item.missing.length}. Las claves están en el JSON.
                      </Typography>
                    ))}
                </Box>
              );
            })}
            {data.metadataChanges.map((change) => (
              <Box key={change.path} sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="subtitle2">
                  {metadataLabels[change.kind]}: {change.path}
                </Typography>
                <Typography variant="body2">
                  Antes:{" "}
                  {change.kind === "added" ? "No estaba presente" : JSON.stringify(change.before)}
                </Typography>
                <Typography variant="body2">
                  Después:{" "}
                  {change.kind === "removed" ? "Ya no está presente" : JSON.stringify(change.after)}
                </Typography>
              </Box>
            ))}
            {[data.before, data.after].map((source) => (
              <Box key={source.version}>
                <Typography component="h4" variant="subtitle1">
                  {source.version} · fecha de origen {source.generatedAtSource}
                </Typography>
                <Typography variant="body2">
                  Fuente:{" "}
                  <a
                    href={`${source.source.repository}/tree/${source.source.commit}/${source.source.directory}`}
                  >
                    archivos en el commit {source.source.commit.slice(0, 7)}
                  </a>
                  .
                </Typography>
                {Object.entries(source.files).map(([name, file]) => (
                  <Typography component="p" variant="caption" key={name} sx={{ mt: 1 }}>
                    {name} · {file.bytes.toLocaleString("es-MX")} bytes · SHA-256 {file.sha256}
                  </Typography>
                ))}
              </Box>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
