> **Vigente · 2026-10-24:** datos1.6 y decisiones de Jorge posteriores a D30: se conserva el modo ampliado con paneles minimizables, el morado y las ayudas de dos niveles. [Explorador](explorador.md) y [Resultados](resultados.md) definen el comportamiento actual; los avisos de retirada de modo ampliado que aparecen después son antecedentes supersedidos.

# Lenguaje y ayudas de lectura

> **Actualización 1.17.0:** las ayudas de dos niveles vuelven a todos los KPI y a conceptos de la ficha. Los textos vigentes están en reading-guide.ts; incluyen el nivel nacional estimado, no tres supuestos. Se recuperan modo ampliado, paneles minimizables y silueta, conservando datos1.6. Las referencias antiguas a otros filtros o siete vistas son antecedentes.

[Sistema de diseño](sistema-diseno.md) · [Componentes](tokens-y-componentes.md) ·
[Testing](../test/README.md). Vigente desde el sistema de diseño **1.7.0**.

La interfaz debe poder recorrerse sin formación estadística. Usamos palabras
cotidianas, una explicación visible y detalles opcionales. Esta política no
acredita comprensión real: eso requiere observar a personas de la audiencia.

## Tres niveles de información

1. **Etiqueta:** nombra lo que se puede elegir o leer. «Tema del mapa» en vez de
   «Vista de contexto»; «Estado» en vez de «Entidad federativa».
2. **Lectura visible:** explica qué significa el resultado y su límite esencial.
   El aviso «Supuesto, no efecto medido» nunca depende de abrir una ayuda.
3. **Ayuda opcional:** definición, referencia temporal y ejemplo cuando hace
   falta. Un detalle técnico puede ir en `details`, especialmente en metodología.

El vocabulario compartido está en [`reading-guide.ts`](../src/content/reading-guide.ts).
Las claves URL, nombres oficiales, columnas y valores originales se conservan.
Una etiqueta humana no autoriza a cambiar el contrato científico.

## Conceptos que no se intercambian

| Concepto            | Cómo explicarlo                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Participación       | Personas que votaron de cada 100 con dato conocido; NS queda aparte.                                                                 |
| Lista electoral     | Personas registradas para votar, también llamada lista nominal; aquí es 2024, no toda la población.                                  |
| Pronóstico          | Estimación para 2027 que depende de supuestos; no resultado observado.                                                               |
| Nivel nacional      | Participación supuesta del país; el modelo no la predice.                                                                            |
| Escala de riesgo    | Orden relativo de 0 a 100; no porcentaje de abstención.                                                                              |
| Posibilidad de rojo | Frecuencia en 2,000 simulaciones sin intervención; no probabilidad individual de abstenerse.                                         |
| Rango del 90 %      | Incertidumbre basada en errores de validación; cobertura observada 85–90 %, sin garantía futura.                                     |
| Intervención        | Cuenta hipotética, no votos conseguidos ni eficacia comprobada.                                                                      |
| Puntos porcentuales | Diferencia entre porcentajes. Ejemplo ilustrativo: 60 % a 48 % son 12 puntos menos.                                                  |
| Sin dato            | Información ausente, nunca cero. Gris no significa baja participación.                                                               |
| Sin casilla         | No se pudo votar; no atribuir el cero a una decisión voluntaria. Puede afectar parte del municipio.                                  |
| Seguridad           | La tasa de homicidios en logaritmo es predictora; el resto es contexto histórico con periodo explícito, no seguridad en tiempo real. |

Al comparar, se conserva el supuesto nacional. El filtro «Color sin intervención»
conserva el grupo original aunque el escenario activo cambie el color del mapa.
La brecha joven mostrada es de 2024; las cuentas S2/S3 de intervención usan 2021.
No fijar otra referencia temporal desde el frontend.

## Componente `ContextHelp`

[`ContextHelp`](../src/components/ui/context-help.tsx) recibe un `topic` del catálogo:

```tsx
<ContextHelp topic="position" />
```

- Icono de pregunta junto al concepto, con objetivo de 32 × 32 px y nombre
  accesible «Ayuda sobre …». Una ayuda por concepto, no por cada cifra.
- Hover o foco muestra un resumen corto en tooltip; Escape lo descarta.
- Clic, Enter, Espacio o tacto abre la explicación en un diálogo anclado.
- El diálogo tiene título, descripción, foco contenido, botón «Cerrar ayuda»,
  cierre con Escape o fuera de él y retorno al botón de origen.
- Cerrar una ayuda dentro de filtros o modo mapa conserva el contexto exterior.
  La ayuda no ejecuta una navegación ni cambia los datos.
- Se utiliza el tema MUI, ancho máximo del viewport y cuerpo de 14 px. No agregar
  animaciones propias ni modificar el movimiento del mapa.

Storybook: **Sistema de diseño/Ayudas de lectura**. Los criterios y límites de
movimiento siguen en [movimiento](movimiento.md).

## Redacción y revisión

Usar frases directas, sujetos claros y unidades junto a las cifras. Explicar
siglas en su primera aparición. Conservar términos oficiales cuando identifican
un archivo o una fuente, precedidos de su utilidad. Los ejemplos inventados se
etiquetan «ilustrativos». No inferir causas a partir de una asociación.

Las descargas se explican por su uso: CSV para tablas, GeoJSON/GPKG para programas
de mapas, JSON para reutilizar descripciones. UTF-8, `cvegeo`, `escenario_id`, EPSG
y SHA-256 se mantienen en la guía de reutilización, con contexto.

Un error debe decir qué falló, qué sigue disponible y cómo recuperarse. No exponer
errores de esquemas como única explicación. Una consulta vacía invita a quitar
filtros o cambiar la búsqueda.

Antes de aceptar un cambio, comprobar teclado, tacto, cierre/retorno de foco,
ancho de 320 px, ambos temas, ausencia/cero/sin casilla y controles científicos.
Ver [estrategia de pruebas](../test/testing-strategy.md). Axe detecta barreras
automáticas, no demuestra comprensión ni conformidad integral.

## Validación con personas

Pedir a personas sin formación estadística que busquen un municipio, expliquen
qué significa rojo, distingan el pronóstico del dato histórico, comparen una
intervención y elijan una descarga. Observar sin indicar la respuesta. Registrar
con sus palabras los errores, dudas y ayudas utilizadas; corregir y repetir.
No sustituir esta observación por una puntuación automática de legibilidad.
El [protocolo de sesiones](validacion-personas.md) y su [hoja vacía](plantilla-sesion.md)
separan tareas neutrales, controles del moderador y registro privado.

Referencias: [W3C: palabras claras](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p01-clear-words/),
[APG: tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) (patrón en desarrollo),
[MUI: Popover](https://mui.com/material-ui/react-popover/).
