# Cómo escribir pruebas

Organizar cada prueba en preparación, acción y resultado. El nombre describe qué
comportamiento cambia y en qué condición. Cada caso construye sus propios datos.
Consultar la [estrategia](testing-strategy.md), las
[herramientas](testing-tools.md) y los [perfiles de ejecución](execution-profiles.md).
Volver al [índice de testing](README.md).

## Unitarias

Colocar funciones puras en `test/unit/` reflejando la responsabilidad del módulo.
Incluir particiones y límites relevantes: vacío, dato válido, ausencia, formato
inválido y fronteras numéricas cuando correspondan. No probar getters triviales ni
repetir la implementación en las expectativas.

## Integración

Utilizar `renderWithProviders` o `renderHookWithProviders` de `test-utils/`. Cada
llamada crea un QueryClient con caché propia y sin reintentos. Para probar los
proveedores de producción, montar `AppProviders` explícitamente.

Registrar respuestas con `server.use(http.get(...))`. MSW se reinicia después de
cada caso. Verificar también errores, ausencia y recuperación cuando exista lectura
de datos. Evitar `setTimeout` o pausas fijas: usar `findByRole` o `waitFor` sobre un
resultado concreto. No anular las protecciones de consola para ocultar defectos.

El tema de las utilidades desactiva ripple decorativo para no introducir tareas
pendientes. Las pruebas de cambio de tema utilizan el proveedor real, no ese doble.

## Fixtures y estados

Guardar factories pequeñas en `test-utils/factories/` cuando haya un contrato que
las justifique. Conservar claves como texto y distinguir cero de ausencia. No copiar
los escenarios ficticios como expectativas científicas definitivas.

En componentes con datos, cubrir carga, error, ausencia y éxito según su contrato.
Un test debe fallar si se rompe el comportamiento que afirma verificar; una ejecución
sin aserciones o comprobar sólo que algo se renderiza no acredita un flujo completo.

## Navegador

Los specs importan `test` y `expect` del fixture de consola. Verificar interacciones
por teclado, contexto de datos y salidas cuando existan. Para controles sobre un
mapa, mantener una ruta funcional mediante tabla que permita comprobar su significado.
