"use client";

import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";
import Button from "@mui/material/Button";
import type { Dataset, Municipality } from "@/types/dataset";
import { estimateFor, formatPercent } from "@/utils/dataset";
import {
  boundedPage,
  pageSizes,
  sortLabels,
  type SortColumn,
  type TableState,
} from "@/utils/explorer-table";
import { RiskBadge } from "@/components/ui/risk-badge";
import type { MapPaint } from "@/utils/indicators";

const columns = ["municipio", "cvegeo", "entidad", "participacion", "riesgo", "registro"] as const;
export function MunicipalityTable({
  dataset,
  items,
  selected,
  scenario,
  state,
  onSelect,
  onSort,
  onPage,
  onPageSize,
  context,
  contextTitle,
}: {
  dataset: Dataset;
  items: Municipality[];
  selected: string;
  scenario: string;
  state: TableState;
  onSelect: (id: string) => void;
  onSort: (column: SortColumn) => void;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  context?: Record<string, MapPaint> | undefined;
  contextTitle?: string | undefined;
}) {
  const page = boundedPage(state.page, items.length, state.pageSize);
  const activeColumns: readonly SortColumn[] = context
    ? ["municipio", "cvegeo", "entidad", "indicador"]
    : columns;
  const labels = {
    ...sortLabels,
    ...(!dataset.sample
      ? { participacion: "Participación estimada · 2027", riesgo: "Riesgo relativo" }
      : {}),
    indicador: contextTitle ?? sortLabels.indicador,
  };
  return (
    <Box>
      <TablePagination
        component="div"
        count={items.length}
        page={page}
        rowsPerPage={state.pageSize}
        rowsPerPageOptions={[...pageSizes]}
        onPageChange={(_, value) => onPage(value)}
        onRowsPerPageChange={(e) => onPageSize(Number(e.target.value))}
        showFirstButton
        showLastButton
        labelRowsPerPage="Filas por página"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        getItemAriaLabel={(type) =>
          ({
            first: "Primera página",
            last: "Última página",
            next: "Página siguiente",
            previous: "Página anterior",
          })[type]
        }
        slotProps={{ select: { inputProps: { "aria-label": "Filas por página" } } }}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          ".MuiTablePagination-toolbar": { flexWrap: "wrap", px: 1, minHeight: 52 },
          ".MuiTablePagination-spacer": { display: "none" },
          ".MuiTablePagination-selectLabel": { fontSize: 12 },
          ".MuiTablePagination-displayedRows": { ml: "auto", fontSize: 12 },
        }}
      />
      <TableContainer
        sx={{ overflow: "auto", maxHeight: "clamp(280px, calc(100dvh - 390px), 620px)" }}
        tabIndex={0}
        aria-label="Área desplazable de resultados municipales"
      >
        <Table
          size="small"
          stickyHeader
          aria-label={
            dataset.sample ? "Resultados municipales de muestra" : "Resultados municipales"
          }
          sx={{ minWidth: 760, "& th, & td": { px: 1.25 } }}
        >
          <caption
            style={{ textAlign: "left", padding: "8px 12px", captionSide: "bottom", fontSize: 12 }}
          >
            {dataset.sample
              ? "2027: ejemplos, no resultados finales."
              : context
                ? contextTitle + ". Contexto separado del pronóstico."
                : "2027: pronóstico condicionado al escenario, no resultados observados."}{" "}
            El CSV exporta toda la consulta filtrada, no sólo esta página.
          </caption>
          <TableHead>
            <TableRow>
              {activeColumns.map((column) => (
                <TableCell
                  key={column}
                  align={column === "participacion" ? "right" : "left"}
                  sortDirection={state.column === column ? state.direction : false}
                  sx={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  <TableSortLabel
                    active={state.column === column}
                    direction={state.column === column ? state.direction : "asc"}
                    onClick={() => onSort(column)}
                    aria-label={`Ordenar por ${labels[column]}`}
                  >
                    {labels[column]}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.slice(page * state.pageSize, (page + 1) * state.pageSize).map((item) => {
              const result = estimateFor(dataset, scenario, item.id);
              return (
                <TableRow
                  key={item.id}
                  selected={selected === item.id}
                  hover
                  aria-selected={selected === item.id}
                >
                  <TableCell sx={{ minWidth: 160, maxWidth: 240 }}>
                    <Button
                      onClick={() => onSelect(item.id)}
                      sx={{
                        textAlign: "left",
                        justifyContent: "flex-start",
                        p: 0.5,
                        minWidth: 0,
                        lineHeight: 1.3,
                        fontWeight: 500,
                      }}
                    >
                      {item.name}
                      {selected === item.id && <span aria-hidden="true"> ✓</span>}
                    </Button>
                    {!item.hasGeometry && (
                      <Box sx={{ fontSize: 11, color: "text.secondary" }}>Sin geometría</Box>
                    )}
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
                  >
                    {item.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{item.state}</TableCell>
                  {context ? (
                    <TableCell sx={{ fontSize: 13, minWidth: 150 }}>
                      {context[item.id]?.label ?? "Sin dato"}
                    </TableCell>
                  ) : (
                    <>
                      <TableCell
                        align="right"
                        sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatPercent(result.participation)}
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={result.risk} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {result.state.replaceAll("_", " ")}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {!items.length && (
        <Box role="status" sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
          No hay municipios con estos filtros. Prueba otro nombre o restablece la selección.
        </Box>
      )}
    </Box>
  );
}
