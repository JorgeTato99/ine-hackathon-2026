# E2E con Playwright

Los casos verifican la exportación estática; no requieren API, cuentas ni Python.
La política se encuentra en [testing-strategy](../test/testing-strategy.md).
Los [perfiles de ejecución](../test/execution-profiles.md) documentan los workers,
el uso de recursos y la coordinación con Vitest. Volver al
[índice de testing](../test/README.md) o al [frontend](../README.md).

```console
npx playwright install chromium
npm run test:e2e
```

Para reutilizar un build: `npm run build` y `npm run test:e2e:run`. Playwright inicia
`npm run serve` en `127.0.0.1:4173` y lo detiene al terminar; no reutiliza servidores
ajenos. `PLAYWRIGHT_BASE_URL` permite indicar explícitamente otro servidor, por
ejemplo el contenedor local; en ese modo Playwright no lo inicia ni lo detiene.

## Organización vigente · D30

- `0-smoke/forecast.spec.ts`: cifras, cinco acciones, controles retirados, enlace antiguo,
  regreso a México, movimiento reducido, ventana corta, teclado, contraste y 320 px.
- `1-editorial/`: se conserva la batería de índice, entradas, composiciones, lectura sin
  JavaScript y descargas, adaptada a seis capítulos y diez recursos de la versión 1.5.
- `2-explorer/forecast-navigation.spec.ts`: estado/municipio, leyenda, tabla, orden,
  paginación y cambio de año/pestaña.
- `3-results/forecast-results.spec.ts`: Tijuana, factores, intervalos, histórico,
  intervenciones, vacíos, Villa de Pozos y descarga con SHA-256.
- `fixtures/console-guard.ts` rechaza errores de consola o de ejecución.

Los casos corren en escritorio Chromium y Pixel 7, con un trabajador en el perfil
eficiente. El diseño anterior dejó de ser el contrato de UI: sus specs se conservaron
en `temp/migracion-resultados-1.5/pruebas-anteriores/` y se sustituyeron por estos
recorridos; no se usan skips para ocultar fallos. Las pruebas del modelo científico
no forman parte de esta batería.
