# Perfiles de testing y presupuesto del build

Navegación: [índice de testing](README.md), [frontend](../README.md) y
[desarrollo del proyecto](../../docs/desarrollo.md).

El perfil predeterminado es `eficiente`. Se eligió midiendo la batería real en
Windows, incluyendo tiempo, CPU de los procesos hijos y memoria; no se dedujo
del número de núcleos de la máquina.

| Perfil                       | Workers Vitest y cobertura | Workers E2E | Baterías en testing completo |
| ---------------------------- | -------------------------: | ----------: | ---------------------------- |
| `ligero`                     |                          1 |           1 | en serie                     |
| `eficiente` (predeterminado) |                          2 |           1 | en paralelo                  |
| `rapido`                     |                          2 |           2 | en paralelo                  |

Los workers se acotan a los núcleos disponibles menos uno, con un mínimo de uno.
Los valores viven en [execution-profile.ts](../scripts/execution-profile.ts).
En testing completo, las dos baterías son Vitest con cobertura y Playwright.
Comparten solo archivos de aplicación de lectura; sus resultados y entornos están
separados. El compilado termina antes de iniciarlas.

## Comandos

| Comando                      | Para qué sirve                                                    |
| ---------------------------- | ----------------------------------------------------------------- |
| `npm test`                   | Vitest sin cobertura; una ejecución.                              |
| `npm run test:unit`          | Vitest en modo watch.                                             |
| `npm run test:unit:coverage` | Vitest con cobertura.                                             |
| `npm run test:e2e`           | Build actualizado y después E2E.                                  |
| `npm run test:e2e:run`       | E2E reutilizando explícitamente el build disponible.              |
| `npm run test:all`           | Un build y ambas baterías con perfil eficiente.                   |
| `npm run test:all:run`       | Reutiliza explícitamente una exportación vigente, sin compilar.   |
| `npm run test:all:ligero`    | El mismo conjunto con menor concurrencia.                         |
| `npm run test:all:rapido`    | El mismo conjunto priorizando duración.                           |
| `npm run check`              | Tipos, lint, formato y cobertura; sin build de producción ni E2E. |
| `npm run validate`           | Tipos, lint, formato, build, Storybook y ambas baterías.          |

`TEST_PROFILE` cambia el perfil de los comandos individuales. El orquestador
también acepta `--profile=ligero|eficiente|rapido`, por ejemplo:

```console
npm run validate -- --profile=ligero
```

Los scripts de testing fijan dos threads nativos, heap Node de 3 GiB por proceso
salvo override explícito. `ligero` reduce la prioridad; `eficiente` y `rapido`
conservan prioridad normal, como en la calibración de concurrencia. El límite de
workers también se aplica al modo watch. Estos son
controles de concurrencia y del heap Node, no un límite agregado de RAM o CPU del
sistema operativo. Los procesos de Chromium tienen su propio consumo nativo.

Usar `test:all:run` solo cuando el build esté actualizado; `test:all` lo renueva siempre.

La rutina no repite pruebas primero sin cobertura y luego con ella. El modo
completo construye una vez para evitar comprobar una exportación anterior.
Las etapas previas paran al primer error; si dos baterías ya están en paralelo,
ambas terminan y cualquier fallo hace fallar el comando. Los tiempos por tarea y
el tiempo conjunto de testing se guardan en `artifacts/checks/latest.json`.
ESLint usa caché de contenido para evitar revisar de nuevo archivos intactos.

## Qué se midió

La calibración siguiente corresponde al esqueleto del 18 de octubre. La batería
territorial y editorial del 19 de octubre es mayor; mantiene estos límites de
concurrencia, pero sus duraciones no deben compararse como si fueran la misma
carga. Las verificaciones actuales guardan sus propios tiempos en `artifacts/checks/`.

18 de octubre de 2026, Windows 11, Node 24.18.0, 24 núcleos lógicos. Batería:
dos archivos Vitest, tres pruebas y seis ejecuciones E2E (escritorio/móvil).
Vitest y E2E individual: cinco muestras por punto tras calentamiento. Planificación
conjunta: tres muestras por punto, intercaladas y con orden alternado.

| Perfil completo | Mediana de testing, sin build | Núcleos medios | Pico de memoria comprometida |
| --------------- | ----------------------------: | -------------: | ---------------------------: |
| `ligero`        |                       24.40 s |           1.10 |                    0.700 GiB |
| `eficiente`     |                       13.17 s |           2.24 |                    1.275 GiB |
| `rapido`        |                       11.54 s |           2.95 |                    1.552 GiB |

El criterio eficiente elige el menor consumo de CPU dentro de 1.3 veces el menor
tiempo observado. En diferencias inferiores a un segundo se prefieren menos
workers. Dos workers de Vitest dieron mejor resultado tanto con cobertura como
sin ella. En E2E, seis workers no mejoraron de forma útil a dos y consumieron
mucho más. La planificación conjunta justificó los dos carriles del perfil
eficiente; la ejecución en serie se conserva en ligero.

La CPU procede del Job Object de Windows: incluye los hijos que ya finalizaron.
La memoria es el pico de compromiso del conjunto, no RSS ni memoria de toda la
máquina. No comparar directamente con cifras de cgroup Linux que incluyan caché.
Se rechazaron fallos, skips, retries recuperados y cambios de cobertura. La primera
prueba de carga detectó una transición visual aún activa al lanzar Axe: se corrigió
la espera del test, conservando las comprobaciones de contraste y accesibilidad.

La síntesis está en [benchmark-baseline.json](benchmark-baseline.json). Son valores
provisionales del esqueleto actual: recalibrar al incorporar mapa y nuevas baterías,
cambiar el entorno o modificar de forma importante el número de pruebas.

### Comandos reales y reporters habituales

Otra comparación, con cinco muestras por perfil, incluyó los scripts npm reales,
sus reporters normales y la prioridad final. Se usó `npm run test:all:run` para
reutilizar explícitamente la misma exportación y excluir el build del reloj.

| Perfil      | Comando completo sin compilar | Fase de testing | Núcleos medios del comando | Pico comprometido |
| ----------- | ----------------------------: | --------------: | -------------------------: | ----------------: |
| `ligero`    |                       30.69 s |         29.39 s |                       1.08 |         0.863 GiB |
| `eficiente` |                       16.57 s |         14.98 s |                       2.13 |         1.565 GiB |
| `rapido`    |                       15.30 s |         13.90 s |                       2.84 |         1.749 GiB |

La diferencia respecto a las ejecuciones directas incluye el orquestador, npm y
la generación de reportes. El modo predeterminado conserva el mejor equilibrio
en esa comparación práctica. El primer barrido de comandos reales tuvo un timeout
durante una pausa simultánea de ambas baterías; quedó separado y documentado,
sin utilizarlo para las cifras de esta repetición final.

## Build independiente

`BUILD_WORKERS` es independiente de `TEST_PROFILE`. Por defecto permite hasta
ocho workers, acotados al hardware, ocho threads nativos y heap Node de 6 GiB si
no existe un override. `BUILD_NODE_OPTIONS` permite dar opciones específicas al
compilador; las opciones Node explícitas del entorno se respetan.

En esta máquina, la mediana pasó de 32.58 s con presupuesto de dos workers a
25.25 s con ocho. Se priorizó duración para esta operación menos frecuente;
el criterio de ahorro de recursos del testing no reduce el presupuesto del build.
Los lanzadores de Next y Storybook usan el mismo presupuesto de compilación.

## Configuración ejecutable

- [Perfiles y límites de workers](../scripts/execution-profile.ts).
- [Prioridad, threads y memoria de Node](../scripts/execution-environment.ts).
- [Presupuesto de compilación](../scripts/build-budget.ts) y
  [lanzador de Next y Storybook](../scripts/build.mjs).
- [Orquestación y registro de tiempos](../scripts/check.mjs) y
  [lanzador de pruebas](../scripts/test.mjs).
- [Vitest y cobertura](../vitest.config.mts),
  [Playwright](../playwright.config.ts) y [comandos npm](../package.json).

## Volver a calibrar

La herramienta es opcional: usa Python estándar a través de uv, sin instalar las
dependencias científicas del proyecto. El frontend y sus pruebas siguen usando
Node; Python solo se necesita para medir. Desde `frontend/`:

```console
npm run test:bench -- --battery coverage --workers 1,2 --expected-tests 3 --repetitions 5 --output artifacts/benchmarks/coverage
npm run build
npm run test:bench:profiles -- --expected-unit 3 --expected-e2e 6 --repetitions 3 --output artifacts/benchmarks/combined
```

Actualizar los conteos esperados al añadir casos. `--battery` admite `unit`,
`coverage`, `e2e` y `build`; el benchmark conserva datos crudos, reportes y huellas
del código. El comparador de perfiles exige una exportación actualizada y deja
su build fuera de la medición. No ejecutar otras tareas pesadas durante la toma
de muestras. Los artefactos se guardan en carpetas ignoradas por Git.

Los lanzadores de medición usan `uv --no-config --no-project` para evitar heredar
la configuración y el requisito de versión del proyecto científico; no cambian
esa configuración ni actualizan el uv global. Solo requieren Python 3.14.

En Linux, la medición requiere un contenedor exclusivo con `BENCHMARK_CGROUP=1`;
esa contabilidad incluye caché y se presenta por separado de Windows.

Referencias: [workers de Vitest](https://main.vitest.dev/config/maxworkers),
[paralelismo de Playwright](https://playwright.dev/docs/test-parallel) y
[memoria de Next](https://nextjs.org/docs/app/guides/memory-usage).
