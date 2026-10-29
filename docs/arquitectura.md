# Arquitectura y alcance

## Estado y componentes

La preparación de datos, la base Python y el explorador frontend están implementados.
El frontend usa Next App Router con exportación estática, MUI y React Query en
`frontend/`, con dependencias y contenedores propios. La integración vigente consume
`resultados-1.6`: pestañas Pronóstico 2027 e Histórico, una predicción nacional
estimada y cinco escenarios (ninguna intervención y cuatro acciones supuestas),
ficha municipal y descargas. Delta con guardia se entrega precalculado por
Sofía y no se ejecuta desde el navegador.

```text
CCPC + cartografía INEGI
        |
        v
Python / Polars -> Parquet y tablas municipales -> análisis científico
                                                       |
                                                       v
                                          archivos de resultados
                                                       |
                                                       v
                                      React + cartografía preparada
                                                       |
                                                       v
                                  consulta, comparación y exportación
```

La ciencia se ejecuta antes de publicar los resultados. Las interacciones del
navegador seleccionan datos existentes; no ejecutan el modelo ni inventan nuevos
supuestos. No se requiere un backend de negocio ni una base de datos en servidor.
Nginx en contenedor sirve los archivos de la aplicación en modo producción.
Detrás del túnel HTTPS, las redirecciones relativas conservan el origen público
sin exponer el esquema HTTP ni el puerto interno 8080.

El mapa vigente utiliza Leaflet 1.9.4 con Canvas y GeoJSON preparado por el equipo.
No consulta un servicio cartográfico externo. La [documentación cartográfica](../frontend/docs/cartografia.md)
define el adaptador, las reglas de cámara y selección y las condiciones para
actualizar el renderer. La decisión sustituye la implementación inicial con OpenLayers.

El [explorador](../frontend/docs/explorador.md) comparte consulta por URL entre mapa,
tabla y modo ampliado. Filtros, ordenación y paginación seleccionan resultados
precalculados; no ejecutan el modelo ni modifican la priorización científica.

## Orden de construcción

El núcleo está implementado: semáforo, cinco escenarios, ficha municipal,
descargas y cartografía abierta GeoJSON/GPKG. La interfaz conserva el modo normal
y el ampliado con paneles minimizables. Las consultas guardadas y los filtros
avanzados se retiraron del recorrido activo al simplificarlo. EXT-ACT permanece
condicionado a una fuente territorial utilizable. Los controles de integridad
y procedencia se ejecutan desde la preparación.

## Capacidades del producto

Este es el alcance acordado. El estado implementado se detalla al inicio y en la
[guía del explorador](../frontend/docs/explorador.md). Las
[consultas personales](../frontend/docs/consultas-guardadas.md) documentan un
antecedente retirado; la [comparación de publicaciones](../frontend/docs/publicaciones.md)
sí está disponible en Datos y descargas, actualmente 1.3→1.6. EXT-ACT requiere
una fuente territorial utilizable antes de incorporarse al producto.

1. **Exploración territorial:** mapa y tabla sincronizados, búsqueda, filtros e
   historia electoral, con cobertura y ausencias visibles.
2. **Comparación de escenarios:** valores, diferencias, calidad y supuestos de una
   pareja comparable sin/con intervención; otras comparaciones sólo si son legítimas.
3. **Priorización explícita:** criterio científico, fundamento, escalones y empates,
   mostrando por separado la calidad de la estimación.
4. **Ficha municipal:** identidad, historia, resultado, semáforo, calidad, fuentes,
   versión y recomendaciones con su alcance, límites y condiciones.
5. **Consulta y exportaciones:** compartir la selección por URL y descargarla,
   conservando escenarios, motivos y versión de resultados utilizada.
6. **Transparencia y evaluación:** método, variables, supuestos, validación recibida
   y límites; conservar el pronóstico y el protocolo de evaluación futura.
7. **Calidad y versiones:** verificar claves, universos, unidades y cambios de datos
   y metadatos; usar un mismo corte en aplicación y materiales de entrega.
8. **Accesibilidad y portabilidad:** consulta por tabla y teclado, información
   comprensible sin depender sólo del color, y apertura comprobada del paquete real.

## Responsabilidades e integración

Sofía define formulación, variables, método, validación, riesgo, calidad, escenarios,
priorización y recomendaciones. Jorge implementa interfaz, cartografía, contratos,
controles, exportaciones y despliegue. Ambos revisan el significado y los materiales
de entrega. El [contrato de datos](contrato-datos.md) define el intercambio técnico.

Riesgo, calidad y prioridad son dimensiones distintas. Un empate no se resuelve
inventando una prioridad por nombre o clave. Una diferencia simulada no representa
eficacia observada. Las comparaciones históricas identifican el tipo de elección;
el tipo de elección se muestra como contexto. La referencia histórica predictora
la define el modelo de Sofía; la interfaz no impone 2021 como base.

Sofía puede responder los bloques de integración remitiendo a notebooks,
`docs/bitacora.md` y los tres archivos acordados, sin duplicar su contenido en una
ficha adicional. Para el reporte metodológico/preventivo se reservan como objetivo
editorial 1–2 cuartillas para producto y arquitectura; el resto desarrolla variables,
método, semáforo y recomendaciones, con revisión conjunta.

## Persistencia y entrega

La consulta actual se comparte por URL y exporta datos con versión. La persistencia
local y las observaciones personales pertenecen al antecedente de consultas
guardadas, no a una capacidad activa de la interfaz 1.6.

La modalidad de despliegue y el paquete de cartografía/datos se verifican en los
artefactos reales. Una compilación web no se considera compatible con doble clic
sin comprobarlo. Las herramientas y versiones vigentes del frontend están fijadas
en su manifiesto y [documentación](../frontend/README.md).

## Extensión condicionada y exclusiones

El cruce de riesgo con actividades documentadas se incorpora sólo con un registro
territorial compatible y una utilidad concreta. No disponer de registro no demuestra
desatención; sede, ámbito y periodo no son equivalentes. Su disponibilidad es externa.

Quedan fuera cuentas y mesa colaborativa propia, optimización de presupuestos,
parámetros científicos arbitrarios y generación libre de recomendaciones mediante IA.
No se promete una integración con sistemas institucionales sin acceso confirmado.
