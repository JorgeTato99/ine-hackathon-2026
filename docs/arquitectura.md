# Arquitectura y alcance

## Estado y componentes

La preparación de datos y la base Python están implementadas. El modelo definitivo
y la aplicación se incorporarán conforme avance el proyecto. Las capacidades de
esta sección describen el producto por construir, no funcionalidades ya verificadas.

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
Un servidor HTTP en contenedor puede servir los archivos de la aplicación.

## Capacidades del producto

1. **Exploración territorial:** mapa y tabla sincronizados, búsqueda, filtros e
   historia electoral, con cobertura y ausencias visibles.
2. **Comparación de escenarios:** valores, diferencias, calidad y supuestos de una
   pareja comparable sin/con intervención; otras comparaciones sólo si son legítimas.
3. **Priorización explícita:** criterio científico, fundamento, escalones y empates,
   mostrando por separado la calidad de la estimación.
4. **Ficha municipal:** identidad, historia, resultado, semáforo, calidad, fuentes,
   versión y recomendaciones con su alcance, límites y condiciones.
5. **Consultas y exportaciones:** guardar, recuperar y transferir selección,
   escenarios y observaciones, conservando la versión de resultados utilizada.
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
la interpretación de 2027 debe considerar el ciclo de elecciones intermedias.

## Persistencia y entrega

Las consultas se guardan localmente y se transfieren mediante archivos o enlaces,
sin sincronización multiusuario. Una consulta anterior no se aplica silenciosamente
a un corte nuevo. Las observaciones personales se diferencian del contenido científico.

La modalidad de despliegue y el paquete de cartografía/datos se verifican en los
artefactos reales. Una compilación web no se considera compatible con doble clic
sin comprobarlo. Las herramientas y versiones concretas de frontend se elegirán
y verificarán al implementar.

## Extensión condicionada y exclusiones

El cruce de riesgo con actividades documentadas se incorpora sólo con un registro
territorial compatible y una utilidad concreta. No disponer de registro no demuestra
desatención; sede, ámbito y periodo no son equivalentes. Su disponibilidad es externa.

Quedan fuera cuentas y mesa colaborativa propia, optimización de presupuestos,
parámetros científicos arbitrarios y generación libre de recomendaciones mediante IA.
No se promete una integración con sistemas institucionales sin acceso confirmado.
