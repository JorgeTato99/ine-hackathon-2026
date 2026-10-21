# Herramientas de testing

Las versiones exactas y resueltas se encuentran en `package.json` y el lock. Este
documento describe responsabilidades para evitar duplicar un catálogo que envejezca.
Consultar el [índice de testing](README.md), la [estrategia](testing-strategy.md)
y los [perfiles y benchmarks](execution-profiles.md).

| Herramienta                             | Uso                                                        |
| --------------------------------------- | ---------------------------------------------------------- |
| Vitest + Vite + plugin React            | Ejecución y transformación de TSX.                         |
| coverage-v8                             | Cobertura con umbrales sobre código de aplicación.         |
| jsdom                                   | Entorno DOM rápido; no reproduce un navegador completo.    |
| Testing Library + user-event + jest-dom | Consultas semánticas, interacciones y aserciones de DOM.   |
| MSW                                     | Respuestas HTTP controladas para integración.              |
| vitest-fail-on-console                  | Detectar errores emitidos durante los tests.               |
| Playwright                              | Navegador Chromium de escritorio y móvil sobre producción. |
| axe                                     | Comprobaciones automáticas de accesibilidad.               |
| Storybook                               | Construcción y revisión aislada de componentes.            |

## Utilidades

- `create-test-query-client.ts`: cliente sin caché compartida ni reintentos.
- `render-with-providers.tsx`: render de componentes/hooks con QueryClient y tema.
- `msw/server.ts` y `msw/handlers.ts`: interceptores comunes y sobreescrituras por test.
- `../playwright-tests/fixtures/console-guard.ts`: fallos de consola y excepciones.

jsdom no implementa `matchMedia`; el setup define un doble mínimo para MUI. Las APIs
que requieran layout, canvas o WebGL se comprueban en navegador, sin añadir mocks
globales que pretendan demostrar geometría o interacción real.

El doble de Next en integración conserva una instantánea publicada de la
consulta. Los casos con navegación diferida retienen esa instantánea hasta la
notificación: leer directamente `location.search` desde el mock ocultaría la
pérdida de teclas de un control ligado a una transición pendiente. El navegador
comprueba escritura con teclas individuales, además de inserciones con `fill`.

Reportes generados: `coverage/`, `playwright-report/`, `test-results/` y
`storybook-static/`. Los tiempos por etapa se guardan en
`artifacts/checks/latest.json`; los benchmarks opcionales, en `artifacts/benchmarks/`.
Son locales, ignorados por Git y excluidos de Docker. La síntesis de referencia
se conserva en [benchmark-baseline.json](benchmark-baseline.json).
