# Maestros de identidad

Cuatro PNG generados en GPT y seleccionados/comprimidos por Jorge el 21 de
octubre de 2026. Se conservan tal como fueron entregados; no se sirven como
imágenes de interfaz. Las ilustraciones son conceptuales, sin datos científicos.

| Maestro           | Original recibido                        | Uso                    |
| ----------------- | ---------------------------------------- | ---------------------- |
| `symbol.png`      | Emblema Índigo de Ruta Zigzag.png        | Símbolo monocromático  |
| `banner.png`      | Mapa abstracto de rutas índigo.png       | Arte de la marca       |
| `methodology.png` | Flujo de mapas y búsqueda de datos.png   | Recorrido metodológico |
| `downloads.png`   | Carpeta digital con mapas y descarga.png | Uso de archivos        |

`npm run assets:brand` genera las variantes de `public/brand/generated/`,
las referencias de `src/content/brand-assets.json` y el manifiesto local
`manifest.json`. El build comprueba integridad; no vuelve a codificar imágenes.
El proceso usa Sharp en desarrollo, con concurrencia acotada. No añade un
optimizador en ejecución ni requiere las carpetas temporales para reproducirse.

La [guía de recursos](../../docs/identidad-y-recursos.md) documenta tamaños,
carga, integración, accesibilidad y tratamiento del símbolo. El manifiesto
conserva huellas de maestros/variantes y comparación de bytes entre formatos.
