# Consultas personales

[Explorador](explorador.md) · [Frontend](../README.md) · [Datos](resultados.md)

El botón «Consultas» de la cabecera y el marcador del modo mapa abren el mismo
gestor. Guarda los filtros efectivos, municipio, escenarios, pestaña/indicador,
orden y página de tabla, modo y vista de regreso. Un título y una nota personal
permiten recordar la lectura. Editar esos textos no modifica la consulta ni el
análisis científico. El borrado requiere confirmación.

Cada tarjeta resume territorio, vista y escenario; «Otra publicación» señala un
cambio de versión o fuente. El diálogo pide confirmar antes de descartar un
borrador al cerrar o recuperar otra consulta.

Se conserva la versión de resultados y el commit de su fuente científica. Al
recuperar se reemplaza toda la consulta, sin mezclar filtros posteriores. Si el
corte, escenario o territorio ya no coincide, se explica el cambio antes de
«Abrir con datos actuales». No se archiva el modelo ni se reproducen resultados
antiguos: los valores se calculan con los archivos que publica el sitio actual.

## Almacenamiento e intercambio

- Hasta 50 consultas por navegador; título de 80 caracteres y nota de 1,000.
- `localStorage`, clave `traza-civica.consultas.v1`. No hay cuenta ni nube; borrar
  los datos del navegador elimina estas consultas. No guardar información sensible.
- El archivo `traza-civica-consultas.json` contiene sólo consultas, notas y
  procedencia: `format: traza-civica.consultas`, `schemaVersion: 1`, `queries`.
- Importar muestra primero los nombres y pide agregar copias con IDs nuevos;
  nunca sobrescribe registros existentes. Si una entrada es inválida o el total
  supera el límite, se rechaza el archivo completo. Máximo 256 KiB UTF-8.
- La validación comprueba claves permitidas, tipos, fechas y límites. Los textos
  se muestran escapados por React y nunca se usan como HTML o destinos externos.

Si el almacenamiento está bloqueado o lleno, no se anuncia éxito y se conserva
la copia anterior. Se puede exportar la consulta actual sin guardarla. Si el
contenido local es ilegible, se ofrece descargarlo como respaldo y reiniciarlo
explícitamente; no se sustituye silenciosamente por una lista vacía.
Un reinicio pendiente se cancela si cambia el contenido y sólo borra el mismo
texto ilegible que se había confirmado. Llegar a 50 consultas no bloquea el
almacenamiento: se informa el límite para eliminar o exportar antes de agregar.

Cada cambio relee el almacenamiento y las otras pestañas actualizan su lista con
el evento `storage`. No se garantiza una transacción entre escrituras exactamente
simultáneas de dos pestañas. Para compartir entre equipos, exportar e importar.

## Verificación

Pruebas de validación/persistencia: `test/unit/saved-queries.test.ts`.
Flujos del diálogo: `test/integration/saved-queries.test.tsx` y explorador.
Navegador real: `playwright-tests/2-explorer/consultas.spec.ts`, con producción
estática, importación/exportación, regreso tabla/mapa, teclado, 320 px y axe.
