# Actividades territoriales: condición de integración

[Frontend](../README.md) · [Arquitectura](../../docs/arquitectura.md) ·
[Datos científicos](resultados.md)

**EXT-ACT no está activada.** Al 21 de octubre de 2026 no se obtuvo un registro
que permita cruzar actividades y municipios con significado suficientemente
comprobado. La interfaz no presenta cobertura ficticia ni utiliza actividades
para modificar el semáforo o recomendar automáticamente una campaña.

## Qué se pudo comprobar

El [informe de organizaciones ciudadanas de 2024](https://www.ine.mx/wp-content/uploads/2024/10/Informe-OSC_DECEyEC.pdf)
recoge informes de una parte de las organizaciones acreditadas, mezcla modalidades
de acción y presenta localidades sin CVEGEO. El enlace «OSC» de su nota 8 remite,
en la consulta sin autenticación realizada, a una página de error de SharePoint,
aunque la respuesta HTTP es 200. No se pudo inspeccionar esa base. Esto no prueba
que no exista ni que el INE carezca de información más detallada.

El [diseño del PPPC 2023–2024, página 18](https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/163712/JGEor202401-17-ip-4-1.pdf)
documenta SIMSE como herramienta de seguimiento. Esa descripción acredita un
antecedente institucional, no una API ni una exportación pública municipal.
Los informes y las noticias de actuaciones son referencias, no un inventario
completo con el que medir municipios atendidos o desatendidos.

## Qué hace falta para abrir el cruce

Jorge puede integrar una exportación estática agregada si la unidad que la publica acredita
el significado y la posibilidad de reutilización. Sofía revisaría cualquier lectura
que afecte a la interpretación científica; no se le asigna conseguir un sistema
institucional ni cargar actividades manualmente.

| Campo o comprobación   | Condición mínima                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Identidad y fuente     | ID de actividad o clave de fila agregada, de origen o derivada reproduciblemente; fuente, corte y condiciones de reutilización |
| Tiempo y estado        | Fechas o periodo agregado y estado declarado: previsto, realizado, cancelado o desconocido                                     |
| Geografía              | Sede separada del territorio al que se dirige; nivel y versión geográfica; CVEGEO o equivalencia revisable                     |
| Alcance                | Modalidad, población objetivo y significado de cada cantidad; no equiparar asistentes, impresiones y personas únicas           |
| Cobertura del registro | Universo incluido, exclusiones, periodo y grado de completitud declarados                                                      |
| Calidad y privacidad   | Claves válidas, fechas coherentes, duplicados controlados y ausencia de datos personales                                       |

Un registro parcial puede ser útil si sus límites se muestran explícitamente;
no se exige un censo completo. El significado puede acreditarse con diccionario
o documentación equivalente. En agregados, declarar si las cifras corresponden
a sedes o a territorios destinatarios.

La correspondencia entre una actividad y varios territorios se conserva como
relación explícita. No repartir una cifra distrital entre municipios ni asignar
el alcance nacional a cada sede. Una localidad homónima requiere resolver entidad,
municipio y versión, no sólo parecido de nombres. Una actividad realizada en 2024
no se presenta como oferta vigente de 2027.

## Lectura prevista y límites

Un cruce válido mostraría **actividades documentadas en el registro consultado**,
con fecha, procedencia y ámbito. Una coincidencia permitiría revisar actuaciones
existentes antes de planear otra; no demostraría cobertura efectiva, coordinación,
eficacia ni causalidad. Ausencia de fila significa «sin información en este registro»;
no equivale a cero actividades, desatención ni prioridad automática.

Una sede municipal verificada podría mostrarse como lugar de realización,
aunque el territorio destinatario se desconozca, sin afirmar atención a su población.
Ante una exportación parcial, valorar primero una lista histórica con ese tipo
de vínculo, fuente y fecha, antes de una capa de cobertura.

Reabrir la decisión al disponer de una exportación y documentación que superen esas
condiciones. Una prueba con datos sintéticos sólo comprobaría el mecanismo; no
justifica publicar otra capa en el producto actual. No se requiere backend ni una
base externa para consumir un registro estático que sí resulte utilizable.
