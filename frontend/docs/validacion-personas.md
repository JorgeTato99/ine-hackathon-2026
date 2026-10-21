# Pruebas de comprensión con personas

[Frontend](../README.md) · [Lenguaje y ayudas](lenguaje-y-ayudas.md) ·
[Explorador](explorador.md) · [Hoja de sesión](plantilla-sesion.md)

Este protocolo está preparado; **todavía no acredita sesiones con participantes**.
Las pruebas de código y las revisiones de agentes no sustituyen la observación
humana. Se evalúan comprensión y uso del producto, no la validez del modelo.

## Preparación y cuidado de participantes

Jorge coordina la prueba y las correcciones de interfaz; Sofía aclara dudas de
interpretación científica. Invitar a personas adultas sin formación estadística,
con distinta familiaridad digital y dispositivos habituales. Incluir necesidades
de acceso cuando sea posible, sin solicitar diagnósticos. Si no se consiguen esos
perfiles, registrar la limitación. Una primera ronda pequeña sirve para encontrar
problemas, no para estimar porcentajes de la población.

Utilizar una sesión de unos 35–45 minutos, con pausas y posibilidad de omitir tareas.
No convertir ese intervalo en una exigencia de velocidad. Elegir seis tareas
principales y reservar las demás para otra sesión; alternar los bloques de contexto
y escenarios entre participantes. Registrar el orden: aprendizaje y fatiga pueden
cambiar el resultado. Preferir una persona moderadora distinta de quien construyó
la vista; si no es posible, declarar ese sesgo.

Decir: «Estamos probando la herramienta, no tus conocimientos. Puedes parar,
omitir preguntas o pedir ayuda. ¿Aceptas que tomemos notas sin tu nombre?». No
continuar sin aceptación. No grabar por defecto; cualquier grabación necesita
permiso específico, finalidad, acceso y fecha de borrado acordados. No pedir voto,
preferencia política, residencia precisa ni notas personales reales. Usar P01,
P02… y guardar las hojas completadas en `temp/validacion-personas/`, ignorado por
Git. Definir quién accede y cuándo se borran antes de reclutar; por defecto,
eliminar notas individuales 30 días después de integrar las conclusiones y, en
cualquier caso, antes de 60 días desde la sesión. Explicar que puede pedir retirar
sus notas durante la sesión o al cerrarla; después, al no conservar una relación
entre identidad y pseudónimo, puede no ser posible localizar su registro.

En equipo personal de prueba, usar un perfil de navegador separado. No borrar ni
exportar consultas previas de la persona. Al terminar, eliminar sólo los archivos
y datos ficticios creados en ese perfil, con su conformidad.

## Sesión: observar antes de explicar

Preparar la URL y el estado inicial de cada tarea en la hoja reservada. Registrar
software, publicación científica, dispositivo, navegador, ancho y ayudas habituales.
La persona puede usar teclado, zoom, lector y la tabla en lugar del mapa; no se
considera fallo elegir una alternativa accesible. No enseñar los conceptos ni los
nombres de los controles antes de observar el primer intento.

Pedir que cuente qué piensa sin obligarla a hablar continuamente; con lector de pantalla ofrecer comentar al terminar cada tarea.
Leer sólo la
consigna, no la respuesta de control. Preguntar después «¿Qué entiendes aquí?» y
«¿Qué comunicarías con esta información?». Evitar preguntas que adelantan la
respuesta, como «¿Sabes que esto es hipotético?».

Acordar antes de empezar un punto orientativo de intervención por tarea (por
ejemplo, tres minutos sin avance), ajustable a las necesidades de acceso. Al
alcanzarlo ofrecer continuar, ayuda o pasar; no registrar abandono automáticamente.
Anotar cualquier ayuda: A0 sin pistas; A1 repetición literal; A2 reformulación;
A3 señalar una zona; A4 indicar una acción. Registrar también la ayuda disponible
en la propia interfaz. A0 y A1 permiten clasificar el resultado como independiente; A2 o superior
cuentan como ayuda. Las explicaciones y ayudas abiertas por la propia persona
en la interfaz forman parte del producto y no restan independencia.

## Consignas para leer a la persona

Los corchetes los completa el moderador antes de la sesión. No mostrar la sección
de controles de lectura que sigue a esta tabla.

| Tarea                      | Consigna neutral                                                                                          | Observación posterior                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| T1 Encontrar e interpretar | Encuentra [municipio, estado] y revisa qué información ofrece.                                            | ¿Qué describe la cifra que elegiste y a qué fecha corresponde? ¿Qué significa el color? ¿Cómo entiendes el rango que aparece? |
| T2 Acotar la consulta      | Necesitas revisar municipios de [estado] que cumplan [dos condiciones disponibles]. Prepara esa consulta. | ¿Qué quedó incluido? ¿Cómo volverías a revisar todo el país?                                                                  |
| T3 Historia                | Revisa Chicomuselo, Chiapas, en la historia de 2024. ¿Qué comunicarías sobre ese registro?                | Registrar sus palabras antes de explicar el caso.                                                                             |
| T4 Información ausente     | Busca Villa de Pozos, San Luis Potosí. ¿Qué puedes concluir con lo disponible?                            | ¿Qué puedes afirmar y qué no?                                                                                                 |
| T5 Escenarios              | Compara las dos situaciones de intervención disponibles manteniendo las demás condiciones.                | ¿Qué cambió, qué se mantuvo y qué permite afirmar la diferencia?                                                              |
| T6 Contexto                | Examina [tema del territorio] y explica qué muestra para [municipio].                                     | ¿Qué unidad y periodo tiene? ¿Qué puedes concluir de este tema y qué no?                                                      |
| T7 Tabla y copia           | Organiza los resultados para revisar primero [criterio] y obtén una copia para trabajar después.          | Antes de abrir el archivo: ¿qué esperas que contenga? Contrastar después.                                                     |
| T8 Retomar la consulta     | Deja preparada esta consulta para retomarla otro día y llevarla a otro navegador. Usa una nota ficticia.  | ¿Qué se guarda? ¿Qué sucedería si se publican nuevos datos?                                                                   |
| T9 Publicaciones           | Averigua qué cambió entre las publicaciones disponibles y obtén el archivo que lo describe.               | ¿Cómo explicarías este cambio a otra persona?                                                                                 |

T1, T2, T3, T4, T5 y una entre T6/T7 forman un recorrido inicial. T8/T9 y el
bloque restante se prueban en otra sesión o sustituyen tareas según el objetivo;
no se cuenta una tarea omitida como fallo. T3 evalúa interpretación; orientar
a la historia es deliberado y no prueba que se encuentre esa sección sin ayuda.
T8 se registra por pasos: guardar, recuperar y trasladar, además de la comprensión.
No declarar completado el traslado sólo porque se guardó la consulta. En T5 observar también qué entiende
si el filtro del grupo sin intervención y el color activo dejan de coincidir.

## Controles reservados al moderador

Mantener esta preparación en papel u otro dispositivo fuera de la vista de la
persona, incluso al compartir pantalla. Antes de cada sesión comprobar los casos en la publicación vigente y registrar
las cifras esperadas, escenario e identidad territorial. Fijar por tarea el
resultado mínimo observable, interpretación esperada y errores críticos antes
de observar; no copiar controles de
un corte anterior. Esta guía no sustituye esa preparación.

- Rojo representa una posición relativa de riesgo; no significa certeza, mayoría
  abstencionista ni que todas las personas del lugar se comporten igual.
- Historia describe registros anteriores. Pronóstico e intervalo expresan una
  estimación condicionada, sin garantía de un resultado futuro.
- La intervención es un supuesto, no votos conseguidos ni eficacia demostrada.
  Comparar sin/con intervención al mismo supuesto nacional. El filtro del grupo
  original puede mantenerse aunque cambie el color activo.
- «Sin casilla» no es abstención voluntaria; puede afectar parte del territorio.
  Comprobar el caso T3 en el corte de la sesión antes de presentarlo.
- Villa de Pozos, CVEGEO 24059, tiene geometría y carece de resultados en 1.3.
  Gris o vacío no equivalen a cero. Si cambia la cobertura, elegir otro caso
  documentado y registrar la sustitución.
- El contexto tiene unidad y periodo propios; no demuestra causas ni cambia el
  semáforo por el solo hecho de mostrarlo. Elegir también un caso sin dato.
- Ordenar una tabla no establece prioridad institucional. El CSV abarca toda la
  consulta filtrada, no sólo la página visible.
- Consultas conserva configuración y notas locales, no una copia de resultados;
  un corte distinto requiere advertencia. No hay sincronización de cuentas.
- Comparar publicaciones explica correcciones de registros/metadatos. No mide
  cambios electorales reales ni impacto de una campaña.

## Registrar, decidir y repetir

Copiar la [hoja vacía](plantilla-sesion.md) a la carpeta privada indicada. Registrar
por separado ejecución (independiente, con ayuda, fallo, abandono) y comprensión
(adecuada, parcial, errónea, sin evidencia). Añadir no realizada o incidencia
técnica cuando corresponda; no forzar esas situaciones a una categoría de fallo.
Anotar frase breve, obstáculo, ayuda y resultado observable, sin datos identificables.

Priorizar una interpretación científicamente engañosa, una barrera que impide una
tarea o pérdida de información aunque aparezca una sola vez. Agrupar otras dudas
por patrón, contrastarlas con el equipo y corregir la causa mínima. Volver a
probar la tarea afectada y una cercana para detectar efectos secundarios.

Informar conteos y casos (por ejemplo, «tres de cinco personas observadas»),
composición de la ronda, orden, ayudas y límites. No afirmar representatividad,
utilidad institucional, eficacia preventiva ni conformidad WCAG completa. Una
revisión técnica puede preparar el entorno; sólo una sesión real aporta evidencia
de comprensión. Registrar explícitamente las tareas y tecnologías no observadas.
