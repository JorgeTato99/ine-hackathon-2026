# Frontend

Base del explorador territorial: Next App Router, React, TypeScript estricto, MUI
y React Query. Se publica como archivos estáticos y funciona sin API ni entorno
Python. **Traza Cívica** incorpora mapa municipal, tabla, filtros, ficha, escenarios
precalculados y descargas. Los resultados proceden del análisis de Sofía: 2027 se
presenta como pronóstico y la intervención como supuesto, no efecto medido.

Vista compartida de desarrollo: **[traza-civica.jorgetato.com](https://traza-civica.jorgetato.com/)**,
siempre con exportación de producción servida por Nginx.

- [Sistema de diseño e identidad](docs/sistema-diseno.md).
- [Tokens, componentes y variantes vigentes](docs/tokens-y-componentes.md).
- [Movimiento y animaciones accesibles](docs/movimiento.md).
- [Cartografía, fuentes y preparación](docs/cartografia.md).
- [Explorador, filtros, tabla y modo mapa](docs/explorador.md).
- [Consultas personales e intercambio de archivos](docs/consultas-guardadas.md).
- [Comparación de publicaciones y procedencia](docs/publicaciones.md).
- [Resultados científicos, recepción y controles](docs/resultados.md).
- [Vista pública de desarrollo y actualizaciones](deploy/README.md).
- [Historial de cambios del proyecto](../CHANGELOG.md): registrar cada actualización
  visible en `Unreleased` antes de publicar la vista de desarrollo.

Las versiones son independientes: el software se registra en
[`package.json`](package.json), el diseño en su catálogo y los datos en el
[`manifiesto de publicación`](public/data/manifest.json). Consultar esas fuentes
evita confundir una actualización de interfaz con un nuevo resultado del modelo.

## Empezar

Desde esta carpeta, con Node 24 y npm 11:

```console
npm ci
npm run dev
```

El lock está versionado. Usar `npm ci` para reproducirlo; las actualizaciones de
dependencias modifican manifiesto y lock juntos. La base se comprobó en Windows
nativo y en Linux con Docker. Las dependencias del host y las de los contenedores
se mantienen separadas.

Desarrollo: `http://127.0.0.1:3100`. Las versiones directas están fijadas en
`package.json`; la versión de referencia de npm es 11.19.1. TypeScript permanece en 6.0.3 por compatibilidad con el parser
de ESLint; no se desactivan validaciones para instalar TypeScript 7. ESLint permanece
en 9.39.5 por el rango admitido por los plugins de Next. La instalación exige peers
compatibles. Las imágenes Docker están fijadas por digest.

## Comprobaciones

```console
npm run check
```

`check` ejecuta tipos, lint, formato y cobertura, con el perfil `eficiente` por
defecto. `validate` añade build y Storybook antes de ejecutar cobertura y E2E en
dos carriles. Guarda tiempos por etapa y del testing conjunto; propaga cualquier
fallo. Los [perfiles medidos](test/execution-profiles.md) ofrecen también los modos
`ligero` y `rapido`. `npm run test:all` ejecuta solo build y ambas baterías.
`test:all:run` permite reutilizar explícitamente una exportación vigente cuando
solo se modificaron pruebas.
`test:e2e:run` necesita el build existente; `test:e2e` lo construye primero. Para
escribir componentes de forma aislada: `npm run storybook` en el puerto 6006.

Para una comprobación completa en lugar de la rutina anterior:

```console
npx playwright install chromium
npm run validate
```

El workflow `Frontend` de GitHub Actions comprueba los cambios de esta aplicación.
Su primera ejecución remota ocurrirá cuando se publiquen los cambios.

## Producción y Docker

Los contenedores instalan dependencias desde `package-lock.json`.

```console
npm run build
npm run serve
```

La salida está en `out/` y la vista previa en `http://127.0.0.1:4173`. Se necesita
un servidor HTTP; no se promete apertura por doble clic. El contenedor de producción
sirve esa misma salida con Nginx sin privilegios, sin proceso Next en runtime:

```console
npm run docker:prod:up
npm run docker:prod:down
npm run docker:dev:up
npm run docker:dev:down
```

Producción publica por defecto `127.0.0.1:8088`; desarrollo, `127.0.0.1:3100` con
recarga. Los puertos pueden cambiarse mediante `FRONTEND_PORT` y `FRONTEND_DEV_PORT`.
El servicio de desarrollo dispone de 4 CPU y 8 GiB de memoria. El compilado usa
su propio presupuesto (`BUILD_WORKERS`, hasta ocho por defecto), independiente
del perfil de testing.
Los volúmenes de desarrollo mantienen dependencias Linux separadas de las del host;
si cambia el lock, hay que reconstruir y renovar esos volúmenes de dependencias.

## Organización

El mapa usa **Leaflet 1.9.4 con Canvas y GeoJSON propio**, sin proveedor externo
ni claves. La [decisión cartográfica](docs/cartografia.md) documenta cámara,
selección, tramas, mantenimiento y validación. OpenLayers no forma parte del
runtime vigente.

```text
src/app/            Rutas y layout
src/components/     Proveedores y UI reutilizable
src/theme/          Tema y preferencias visuales
src/services/       Lectura y caché de datos
src/hooks/          Hooks que necesite la aplicación
src/types/          Tipos del frontend
src/utils/          Funciones puras
test/               Unitarias, integración y utilidades
playwright-tests/   E2E contra salida de producción
.storybook/         Desarrollo aislado de componentes
```

La muestra original se conserva en `../data/samples/muestra-0.3/`. `public/data/`
contiene recursos de interfaz, copias de los originales y un manifiesto de
huellas/procedencia. El [contrato](../docs/contrato-datos.md) gobierna la integración.
Todo lo que entre en `public/` será descargable; no colocar información confidencial.

La navegación entre páginas usa enlaces HTML para que la exportación estática
funcione sin reglas especiales de enrutamiento de segmentos React en el servidor.

Los hooks pertenecen al Git de la raíz; npm no instala Husky ni cambia `core.hooksPath`.
La política de pruebas comienza en [test/README](test/README.md). Se conserva el aviso
MIT de las piezas base reutilizadas en [LICENSE](LICENSE).

## Dependencias de herramientas

`serve` utiliza un override de `compression` a 1.8.2 para incorporar su parche de
seguridad. La auditoría del 18 de octubre de 2026 también detectó un aviso de
`braces` en la cadena de ESLint, [todavía sin versión corregida](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
Este aviso pertenece a las herramientas de desarrollo; el sitio exportado sirve
archivos estáticos. Revisarlo al actualizar `eslint-config-next` y sus dependencias.

La política de [lenguaje y ayudas de lectura](docs/lenguaje-y-ayudas.md) forma parte
del sistema de diseño: define explicaciones visibles, ayudas por teclado y tacto,
y el protocolo para comprobar comprensión con personas.

La [validación con personas](docs/validacion-personas.md) dispone de protocolo y
[hoja de sesión vacía](docs/plantilla-sesion.md); su preparación no implica sesiones
humanas realizadas.
