# Comparar publicaciones científicas

[Frontend](../README.md) · [Resultados](resultados.md) · [Datos y descargas](https://traza-civica.jorgetato.com/datos/#publicaciones)

La sección «Cambios entre publicaciones» de Datos compara los originales 1.2 y
1.3, sin cambiar el corte del mapa. Calcula 105 celdas corregidas en 15 municipios:
siete campos pasan de cero a vacío; `brecha_jovenes_2024` ya estaba vacía. Los
escenarios son idénticos por SHA-256. También muestra cuatro cambios de metadatos.
Es una corrección del registro, no un cambio electoral ni un efecto de campaña.

La tabla permite buscar municipio, clave o campo, seleccionar campo y paginar.
Conserva los valores originales; «Sin dato» representa una celda vacía y cero
sigue siendo cero. El detalle de reglas y procedencia incluye cobertura, fechas
de origen sin añadir zona horaria, commits, tamaños y huellas de los originales.
Una tabla adicional muestra vacíos por campo antes y después, incluidos los que
ya existían. El archivo auxiliar tiene tamaño y SHA-256 propios junto a su
descarga; esa huella se calcula durante el build sobre los bytes que se publican.

## Reproducir

Desde la raíz del repositorio, con Git y el entorno del proyecto:

```console
uv run python -m scripts.compare_publications --before data/processed/mapa/resultados-1.2 --before-commit ac8dc3cdbb06b5a0d5ddd63b67bee9a43def9821 --after data/processed/mapa/resultados-1.3 --after-commit f25d9c2709d2a93179c7ee2d6d2df985d418d6ca --output frontend/public/data/publicaciones/resultados-1.2__resultados-1.3.json
```

Se necesitan esos objetos Git; en un checkout superficial, obtener primero los
commits del origen. El comando verifica los bytes contra cada blob Git y falla
si faltan archivos, hay duplicados, claves inválidas, filas desplazadas o valores
no finitos. Sólo escribe el JSON auxiliar; no ejecuta la publicación del mapa ni
reescribe originales, dataset, SIG, `release.json` o manifiesto de entrega.
Sólo acepta destinos `.json` dentro de `frontend/public/data/publicaciones/`,
comprobando la ruta resuelta antes de leer fuentes. La sustitución del auxiliar
es atómica: un error de escritura conserva el archivo anterior.

La salida es determinista, UTF-8/LF, `schemaVersion: 1`: procedencia por corte,
resumen, tablas alineadas por claves, altas/bajas, columnas, cobertura de vacíos,
cambios de celda y diferencias recursivas de metadatos. No duplica geometrías ni
predicciones intactas. Se descarga completa aunque la tabla esté filtrada.

## Interpretación y límites

- Municipios se alinean por CVEGEO de cinco caracteres y escenarios por
  CVEGEO + ID de escenario; reordenar filas no crea cambios de contenido.
- Vacío, cero, dato nuevo y formato numérico se distinguen. Los números se
  comparan con `Decimal`; los valores crudos se conservan en el archivo.
- Unidades se resuelven por clave exacta, entrada agrupada y patrón, en ese
  orden. Una unidad ambigua se rechaza. Una columna desconocida se conserva como
  texto sin interpretar, se identifica como tipo por confirmar y genera un aviso;
  un nuevo tipo requiere actualizar su catálogo. Los números no aceptan espacios,
  separadores de miles ni guiones bajos; las claves usan cinco dígitos ASCII.
- Se comparan todos los metadatos. Cambios de definiciones bloquean las restas
  numéricas de forma conservadora; tampoco se restan escenarios con año o
  condiciones distintos, celdas vacías, formatos equivalentes o unidades ausentes.
- El comparador no explica por qué cambió una cifra. Los metadatos de Sofía son
  la explicación de origen; el detalle se muestra sin inventar causas.
- La cobertura por escenario informa municipios esperados, registrados y claves
  faltantes en cada corte. Dos archivos idénticos pueden estar igualmente
  incompletos: «sin cambios» no certifica cobertura total ni calidad científica.
- El JSON auxiliar contiene su propio inventario de huellas. Se mantiene separado
  del manifiesto y ZIP científico 1.3, cuyos originales siguen intactos.

Para otra pareja se prepara un nuevo archivo verificado y se actualiza la sección.
No es un importador arbitrario ni un archivo histórico de todos los mapas. Si el
mapa publica un corte posterior, se identifica el par como referencia y muestra
la versión vigente; no presenta el corte anterior como actual.

Pruebas: `tests/test_publications.py`, integración de Datos y
`playwright-tests/2-explorer/publicaciones.spec.ts`. El CI puede reproducir el
contenido desde los originales y contrastar el JSON; la verificación Git completa
se ejecuta durante la preparación, cuando los commits están disponibles.
