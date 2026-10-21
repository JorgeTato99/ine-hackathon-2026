"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Dataset } from "@/types/dataset";
import {
  changeSavedQueries,
  readSavedQueries,
  resetSavedQueries,
  savedQueriesKey,
} from "@/services/saved-query-store";
import {
  newSavedQuery,
  parseQueryFile,
  prepareRestore,
  queryFile,
  queryLimits,
  savedQuerySummary,
  type SavedQuery,
} from "@/utils/saved-queries";
import { saveFile } from "@/utils/downloads";

export function SavedQueriesDialog({
  dataset,
  capture,
  onRestore,
  onClose,
}: {
  dataset: Dataset;
  capture: () => Record<string, string>;
  onRestore: (params: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [storage, setStorage] = useState(readSavedQueries);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [discardAction, setDiscardAction] = useState<{ run: () => void } | null>(null);
  const [pendingImport, setPendingImport] = useState<SavedQuery[] | null>(null);
  const [pendingRestore, setPendingRestore] = useState<ReturnType<typeof prepareRestore> | null>(
    null
  );
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const importButton = useRef<HTMLButtonElement>(null);
  const restoreButton = useRef<HTMLButtonElement>(null);
  const discardCancel = useRef<HTMLButtonElement>(null);
  const listTitle = useRef<HTMLHeadingElement>(null);
  const readSequence = useRef({ value: 0 });
  useEffect(() => {
    const sequence = readSequence.current;
    const refresh = (event: StorageEvent) => {
      if (event.key === savedQueriesKey || event.key === null) {
        setStorage(readSavedQueries());
        setResetting(null);
      }
    };
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      sequence.value++;
    };
  }, []);
  useEffect(() => {
    if (pendingRestore) restoreButton.current?.focus();
  }, [pendingRestore]);
  useEffect(() => {
    if (discardAction) discardCancel.current?.focus();
  }, [discardAction]);
  const original = storage.queries.find((entry) => entry.id === editing);
  const dirty = editing
    ? title !== original?.title || notes !== original?.notes
    : Boolean(title || notes);
  const requestAction = (run: () => void) => {
    if (dirty || pendingImport) setDiscardAction({ run });
    else run();
  };
  const requestClose = () => {
    if (discardAction) {
      setDiscardAction(null);
      titleInput.current?.focus();
    } else requestAction(onClose);
  };
  const fail = (error: unknown) =>
    setMessage({
      error: true,
      text: error instanceof Error ? error.message : "No pudimos completar la operación.",
    });
  const change = (transform: (queries: SavedQuery[]) => SavedQuery[], success: string) => {
    const result = changeSavedQueries(transform);
    setStorage(result);
    const error = result.status === "ok" ? result.error : result.message;
    setMessage({ error: Boolean(error), text: error ?? success });
    return !error;
  };
  const exportQueries = (queries: SavedQuery[]) => {
    saveFile("traza-civica-consultas.json", JSON.stringify(queryFile(queries)), "application/json");
  };
  const save = () => {
    try {
      if (editing) {
        const now = new Date().toISOString();
        if (
          !change((queries) => {
            if (!queries.some((entry) => entry.id === editing))
              throw new Error("La consulta ya no existe. Actualiza la lista.");
            return queries.map((entry) =>
              entry.id === editing
                ? { ...entry, title: title.trim(), notes, updatedAt: now }
                : entry
            );
          }, "Nombre y nota actualizados.")
        )
          return;
      } else {
        const entry = newSavedQuery(dataset, capture(), title, notes);
        if (!change((queries) => [...queries, entry], "Consulta guardada en este navegador."))
          return;
      }
      setEditing(null);
      setTitle("");
      setNotes("");
      // El botón se deshabilita al vaciar el título: mantener el foco dentro del diálogo.
      titleInput.current?.focus();
    } catch (error) {
      fail(error);
    }
  };
  const importFile = (file: File) => {
    const sequence = ++readSequence.current.value;
    setPendingImport(null);
    setMessage(null);
    if (file.size > queryLimits.bytes) {
      fail(new Error("El archivo supera 256 KiB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      if (sequence === readSequence.current.value) fail(new Error("No pudimos leer el archivo."));
    };
    reader.onload = () => {
      if (sequence !== readSequence.current.value) return;
      try {
        const imported = parseQueryFile(String(reader.result)).queries;
        if (!imported.length) throw new Error("El archivo no contiene consultas.");
        setPendingImport(imported);
      } catch (error) {
        fail(error);
      }
    };
    reader.readAsText(file);
  };
  const apply = (params: Record<string, string>) =>
    requestAction(() => {
      onRestore(params);
      onClose();
    });
  return (
    <Dialog
      open
      onClose={requestClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="saved-queries-title"
    >
      <DialogTitle id="saved-queries-title">Consultas guardadas</DialogTitle>
      <DialogContent dividers sx={{ overflowWrap: "anywhere" }}>
        <Stack spacing={2}>
          {discardAction && (
            <Alert severity="warning">
              Hay cambios sin guardar. Si continúas, se descartarán el borrador o la importación
              pendiente.
              <Box>
                <Button
                  ref={discardCancel}
                  onClick={() => {
                    setDiscardAction(null);
                    titleInput.current?.focus();
                  }}
                >
                  Seguir editando
                </Button>
                <Button
                  color="error"
                  onClick={() => {
                    const action = discardAction.run;
                    setDiscardAction(null);
                    action();
                  }}
                >
                  Descartar borrador y continuar
                </Button>
              </Box>
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary">
            Guarda filtros y notas personales en este navegador. Al abrir se usan los datos
            disponibles: no es una copia de resultados antiguos. Exporta un archivo para llevar tus
            consultas a otro equipo.
          </Typography>
          {storage.status !== "ok" && (
            <Alert severity="warning">
              {storage.message}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {storage.status === "corrupt" && (
                  <>
                    <Button
                      size="small"
                      onClick={() =>
                        saveFile("traza-civica-consultas-respaldo.txt", storage.raw, "text/plain")
                      }
                    >
                      Descargar respaldo ilegible
                    </Button>
                    <Button size="small" onClick={() => setResetting(storage.raw)}>
                      Reiniciar consultas
                    </Button>
                  </>
                )}
                <Button
                  size="small"
                  onClick={() => {
                    setStorage(readSavedQueries());
                    setResetting(null);
                    setMessage(null);
                    titleInput.current?.focus();
                  }}
                >
                  Actualizar lista
                </Button>
              </Box>
            </Alert>
          )}
          {resetting !== null && (
            <Alert severity="warning">
              Se borrará el contenido local ilegible. Conserva primero el respaldo si lo necesitas.
              <Box>
                <Button
                  color="error"
                  onClick={() => {
                    const result = resetSavedQueries(resetting);
                    setStorage(result.state);
                    setResetting(null);
                    setMessage({
                      error: !result.removed,
                      text: result.removed
                        ? "Almacenamiento reiniciado."
                        : "El contenido cambió o no se pudo reiniciar. No se borraron consultas nuevas.",
                    });
                    titleInput.current?.focus();
                  }}
                >
                  Confirmar reinicio
                </Button>
                <Button
                  onClick={() => {
                    setResetting(null);
                    titleInput.current?.focus();
                  }}
                >
                  Cancelar reinicio
                </Button>
              </Box>
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <Typography component="h2" variant="subtitle1" sx={{ mb: 1 }}>
              {editing ? "Editar nombre y nota" : "Guardar la consulta que estás viendo"}
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                inputRef={titleInput}
                autoFocus
                label="Nombre de la consulta"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                size="small"
                fullWidth
                required
                slotProps={{ htmlInput: { maxLength: queryLimits.title } }}
                helperText={`${title.length}/${queryLimits.title}`}
              />
              <TextField
                label="Nota personal (opcional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                size="small"
                fullWidth
                multiline
                minRows={2}
                maxRows={5}
                slotProps={{ htmlInput: { maxLength: queryLimits.notes } }}
                helperText={`${notes.length}/${queryLimits.notes} · No modifica el análisis ni las recomendaciones.`}
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={storage.status !== "ok" || !title.trim()}
                >
                  {editing ? "Guardar cambios" : "Guardar consulta actual"}
                </Button>
                {editing ? (
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setTitle("");
                      setNotes("");
                      titleInput.current?.focus();
                    }}
                  >
                    Cancelar edición
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      try {
                        exportQueries([
                          newSavedQuery(
                            dataset,
                            capture(),
                            title.trim() || "Consulta actual",
                            notes
                          ),
                        ]);
                      } catch (error) {
                        fail(error);
                      }
                    }}
                  >
                    Exportar consulta actual
                  </Button>
                )}
              </Box>
            </Stack>
          </Box>
          {message && (
            <Alert
              role={message.error ? "alert" : "status"}
              severity={message.error ? "error" : "success"}
            >
              {message.text}
            </Alert>
          )}
          {pendingRestore && (
            <Alert severity="warning">
              <Typography variant="subtitle2">Revisar antes de abrir</Typography>
              <ul>
                {pendingRestore.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <Button ref={restoreButton} onClick={() => apply(pendingRestore.params)}>
                Abrir con datos actuales
              </Button>
              <Button
                onClick={() => {
                  setPendingRestore(null);
                  listTitle.current?.focus();
                }}
              >
                Cancelar apertura
              </Button>
            </Alert>
          )}
          <Box>
            <Typography ref={listTitle} tabIndex={-1} component="h2" variant="subtitle1">
              En este navegador · {storage.queries.length}/{queryLimits.count}
            </Typography>
            {!storage.queries.length && (
              <Typography variant="body2" color="text.secondary">
                Aún no hay consultas guardadas.
              </Typography>
            )}
            <Stack component="ul" sx={{ p: 0, listStyle: "none" }} spacing={1.5}>
              {storage.queries.map((entry) => (
                <Box
                  component="li"
                  key={entry.id}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 1.5,
                    overflowWrap: "anywhere",
                  }}
                >
                  <Typography component="h3" variant="subtitle2">
                    {entry.title}
                  </Typography>
                  {(entry.resultVersion !== dataset.version ||
                    entry.sourceCommit !== (dataset.source?.commit ?? null)) && (
                    <Typography variant="caption" color="warning.main">
                      Otra publicación · revisa la procedencia antes de abrir
                    </Typography>
                  )}
                  {savedQuerySummary(entry, dataset).map((line, index) => (
                    <Typography key={index} component="p" variant="caption" color="text.secondary">
                      {line}
                    </Typography>
                  ))}
                  <Typography variant="caption" color="text.secondary" component="p">
                    {entry.resultVersion} · {new Date(entry.updatedAt).toLocaleString("es-MX")} ·
                    Fuente {entry.sourceCommit?.slice(0, 7) ?? "sin commit"}
                  </Typography>
                  {entry.notes && (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                      Nota personal: {entry.notes}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    <Button
                      size="small"
                      aria-label={`Abrir ${entry.title}`}
                      onClick={() => {
                        try {
                          const prepared = prepareRestore(entry, dataset);
                          if (prepared.warnings.length) setPendingRestore(prepared);
                          else apply(prepared.params);
                        } catch (error) {
                          fail(error);
                        }
                      }}
                    >
                      Abrir
                    </Button>
                    <Button
                      size="small"
                      aria-label={`Editar ${entry.title}`}
                      onClick={() =>
                        requestAction(() => {
                          setEditing(entry.id);
                          setTitle(entry.title);
                          setNotes(entry.notes);
                          titleInput.current?.focus();
                        })
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      aria-label={`Exportar ${entry.title}`}
                      onClick={() => exportQueries([entry])}
                    >
                      Exportar
                    </Button>
                    <Button
                      size="small"
                      aria-label={`Eliminar ${entry.title}`}
                      onClick={() => setDeleting(entry.id)}
                    >
                      Eliminar
                    </Button>
                  </Box>
                  {deleting === entry.id && (
                    <Box>
                      <Typography variant="body2">
                        ¿Eliminar esta consulta del navegador?
                      </Typography>
                      <Button
                        color="error"
                        onClick={() => {
                          if (
                            change(
                              (queries) => queries.filter((item) => item.id !== entry.id),
                              "Consulta eliminada."
                            )
                          ) {
                            setDeleting(null);
                            listTitle.current?.focus();
                            if (editing === entry.id) {
                              setEditing(null);
                              setTitle("");
                              setNotes("");
                            }
                          }
                        }}
                      >
                        Confirmar eliminación
                      </Button>
                      <Button
                        onClick={() => {
                          setDeleting(null);
                          listTitle.current?.focus();
                        }}
                      >
                        Conservar consulta
                      </Button>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button
              disabled={!storage.queries.length}
              onClick={() => exportQueries(storage.queries)}
            >
              Exportar todas
            </Button>
            <Button
              ref={importButton}
              disabled={storage.status !== "ok"}
              onClick={() => fileInput.current?.click()}
            >
              Importar consultas
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              aria-label="Archivo de consultas"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) importFile(file);
                event.target.value = "";
              }}
            />
          </Box>
          {pendingImport && (
            <Alert severity="info">
              <Typography variant="subtitle2">
                Agregar {pendingImport.length} consultas como copias
              </Typography>
              <ul>
                {pendingImport.map((entry) => (
                  <li key={entry.id}>
                    {entry.title} · {entry.resultVersion}
                  </li>
                ))}
              </ul>
              Las consultas existentes se conservarán. Los cambios de versión se revisan antes de
              abrir. Quedan {queryLimits.count - storage.queries.length} espacios libres.
              <Box>
                <Button
                  disabled={storage.queries.length + pendingImport.length > queryLimits.count}
                  onClick={() => {
                    if (
                      change(
                        (queries) => [
                          ...queries,
                          ...pendingImport.map((entry) => ({ ...entry, id: crypto.randomUUID() })),
                        ],
                        "Consultas importadas como copias."
                      )
                    ) {
                      setPendingImport(null);
                      importButton.current?.focus();
                    }
                  }}
                >
                  Agregar copias
                </Button>
                <Button
                  onClick={() => {
                    readSequence.current.value++;
                    setPendingImport(null);
                    importButton.current?.focus();
                  }}
                >
                  Cancelar importación
                </Button>
              </Box>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>Cerrar consultas</Button>
      </DialogActions>
    </Dialog>
  );
}
