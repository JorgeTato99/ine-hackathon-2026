# Estrategia de testing

Esta política aplica al frontend. El análisis científico y Python tienen controles
propios. La configuración ejecutable es la referencia para comandos y porcentajes.
Consultar el [índice de testing](README.md) y los
[perfiles y recursos medidos](execution-profiles.md) para ejecutar esta política.

## Capas

| Capa          | Herramienta                  | Objetivo                                                        |
| ------------- | ---------------------------- | --------------------------------------------------------------- |
| Unitaria      | Vitest                       | Transformaciones puras y casos límite.                          |
| Integración   | Vitest, Testing Library, MSW | Componentes, proveedores y lectura de datos con red controlada. |
| E2E           | Playwright                   | Recorridos reales sobre la exportación estática de producción.  |
| Accesibilidad | axe y revisión de teclado    | Detección automática más comprobación del recorrido.            |

No se necesita backend. Los E2E consumen los archivos reales de `out/`;
no sustituyen el build por mocks. Las pruebas de integración interceptan HTTP
mediante MSW y fallan ante peticiones no declaradas.

## Reglas

- Verificar comportamiento observable y resultados, no detalles privados del componente.
- Preferir `getByRole`, `getByLabelText` y texto. `data-pw` es el último recurso.
- No usar clases de MUI, posiciones frágiles o snapshots grandes como aprobación.
- Cada prueba dispone de caché y datos aislados; no depende del orden de ejecución.
- `console.error` y excepciones no controladas hacen fallar las pruebas. Los warnings
  se revisan, pero no bloquean por defecto. No hay allowlists heredadas.
- No simular hooks de React Query para evitar ejercer la integración: simular la red.
- Usar fixtures explícitos e identificados como tales, sin personas ni efectos electorales inventados.

## Cobertura

Vitest mide `src/` completo: 90 % en líneas, sentencias y funciones, y 80 % en ramas.
No se heredan porcentajes de la aplicación anterior. Se excluyen declaraciones,
historias de Storybook, el layout que integra el runtime de Next y el renderer
Canvas imperativo (`src/components/map/`: conexión React, adaptador Leaflet y
relleno de tramas). Los tres módulos necesitan layout, Canvas y eventos reales;
se verifican en E2E sobre producción, con selección por geometría, cámara,
desmontaje y píxeles de colores/tramas. El validador puro de identidad y cobertura
permanece dentro de Vitest y sus umbrales. Una exclusión nueva debe tener motivo documentado.

La cobertura E2E no se suma para inflar el porcentaje de Vitest. Las pruebas de la
interfaz solo acreditan su comportamiento; no acreditan el modelo ni utilidad
institucional. Axe no sustituye revisión manual de accesibilidad.

## CI y aceptación

La CI comprueba lint, formato, tipos, cobertura, build estático, Storybook y E2E.
Los casos comprueban datos y ausencia, filtros/selección, escenarios de muestra,
descargas con procedencia, mapa real, tema persistente, aislamiento de caché,
teclado, consola, móvil y accesibilidad automática. Las páginas informativas se
prueban también a 320 px, en ambos temas y sin JavaScript; el movimiento se
comprueba con la preferencia reducida. Los flujos nuevos requieren sus propios
escenarios y resultados esperados.
