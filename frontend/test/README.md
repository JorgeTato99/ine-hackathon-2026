# Pruebas del frontend

Volver al [frontend](../README.md) o a la
[guía de desarrollo del proyecto](../../docs/desarrollo.md).

- [Estrategia y reglas](testing-strategy.md).
- [Guía para escribir pruebas](testing-guidelines.md).
- [Herramientas y utilidades](testing-tools.md).
- [Operación E2E](../playwright-tests/README.md).
- [Perfiles y uso de recursos](execution-profiles.md).

```console
npm run test:unit
npm run test:unit:run
npm run test:unit:coverage
npm run test:e2e
```

Los comandos usan `eficiente` por defecto. Para comprobar ambas baterías con un
build actualizado: `npm run test:all`. Para incluir tipos, lint, formato y
Storybook: `npm run validate`. Los otros perfiles, los recursos y las mediciones
se describen en [perfiles y uso de recursos](execution-profiles.md).

`unit/` recibe funciones puras; `integration/`, componentes y hooks con sus
proveedores. `test-utils/` contiene renderizadores, caché aislada y MSW; `factories/`
queda disponible para fixtures propios del INE. No contiene los casos ni datos del
proyecto de referencia. La batería territorial comprueba el adaptador, ausencia y
ceros, incidencias históricas, filtros, lectura A/B, descargas y estados de error.
E2E usa la exportación de producción, geometría real y clic con recepción de eventos
en el mapa, además de móvil, navegación, tema, GeoPackage y accesibilidad automática.
El renderer Canvas imperativo se verifica en navegador; su exclusión del denominador
unitario es explícita y no reduce los umbrales del resto de la lógica.

La identidad y el mapa se describen en [sistema de diseño](../docs/sistema-diseno.md)
y [cartografía](../docs/cartografia.md). Las mediciones previas de recursos del
esqueleto siguen siendo históricas; no representan el costo de esta batería ampliada.

Las páginas informativas añaden comprobaciones de índice, archivos identificables,
integridad de descarga, 320 px en los dos temas, movimiento reducido y lectura sin
JavaScript. Consultar también [movimiento](../docs/movimiento.md).
