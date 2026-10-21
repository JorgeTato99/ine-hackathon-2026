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

## Organización y reglas

- `0-smoke/`: explorador territorial, selección geométrica real, ficha, escenarios,
  tema, navegación, GeoPackage y accesibilidad inicial.
  `mapa-leaflet.spec.ts` añade cámara estable entre escenarios, teclado, desmontaje,
  doble clic y colores/tramas renderizados. Usa una fixture gráfica controlada,
  separada de la comprobación de clic sobre la geometría municipal real.
  `workspace.spec.ts` comprueba superficie inicial, orden/paginación y CSV completo,
  Canvas retenido sin volver a descargar geometría, foco/Escape, paneles y
  accesibilidad del modo mapa. Los paneles móviles de filtros y escenarios se
  abren y cierran explícitamente antes de continuar el recorrido.
- `1-editorial/`: índice local, identidad de descargas, 320 px en claro/oscuro,
  accesibilidad de ambas páginas, movimiento reducido y lectura sin JavaScript.
  El índice se comprueba también al bajar y regresar, entrar por ancla, usar teclado
  y alcanzar el último capítulo, sin que el scroll reescriba la URL.
  Las entradas se comprueban en carga y viewport, una sola vez, con texto visible,
  anclas estables y degradación sin observer o con movimiento reducido.
- `fixtures/console-guard.ts`: `test` y `expect` que todos los specs importan.
- `0-smoke/vuelo-municipal.spec.ts`: trayectoria gradual de 800 ms sin
  redibujados intermedios del Canvas, reserva para paneles, movimiento reducido,
  interrupción por zoom y selección al volver a México.
- Cada caso es autónomo, sin sesiones o autenticación heredadas.
- Selectores: rol, etiqueta, texto y finalmente `data-pw`.
- `console.error` y `pageerror` hacen fallar la prueba.
- Escritorio y móvil utilizan contextos aislados. Los perfiles `eficiente` y
  `ligero` permiten un worker; `rapido`, hasta dos, acotados al hardware disponible.
  Las trazas y capturas se conservan en fallos; el video está desactivado para
  reducir carga. Para depurar: `test:e2e:ui` y `test:e2e:report`.

La CI instala Chromium con sus dependencias y ejecuta estos mismos casos. Los
reportes no se versionan. Las pruebas acreditan el comportamiento implementado,
incluido el clic sobre geometría; no validan el modelo, la eficacia de intervención
ni la comprensión por usuarios. Las capturas de QA muestran el estado final del
movimiento y se complementan con las pruebas temporales.

En un contenedor que ya incluya Chromium se puede indicar su ruta con
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; si no se define, se usa el navegador de
Playwright. Registrar la versión cuando se utilice un binario del sistema.
