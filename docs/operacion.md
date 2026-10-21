# Operación y cierre de entrega

[Proyecto](../README.md) · [Arquitectura](arquitectura.md) ·
[Apartado para el reporte](producto-arquitectura.md) · [Paquete del mapa](entrega-mapa.md)

Esta guía coordina publicación y entrega. Los comandos de instalación, perfiles
de pruebas y preparación de datos se mantienen en sus documentos canónicos.
Las versiones de software, resultados científicos y cartografía se registran por
separado; una actualización de interfaz no exige regenerar el ZIP del mapa si
sus datos, dirección y avisos permanecen iguales.

## Compilar y publicar

1. Elegir un commit del repositorio y registrar su SHA, versión de software y
   resultado del CI. Comprobar que no quedan cambios de producto fuera de ese corte.
2. Preparar los datos según [resultados](../frontend/docs/resultados.md) si faltan
   los recursos preparados o cambia su publicación. Conservar originales,
   controles y manifiestos, incluida la cartografía que requiere ese proceso.
3. Instalar y comprobar el frontend siguiendo su [README](../frontend/README.md)
   y [validación](../frontend/test/README.md). La exportación está en `frontend/out/`.
4. Construir la imagen y registrar su etiqueta o digest, la versión de datos y
   el artefacto publicado. Si cambian código, dependencias o datos, recompilar;
   `--reuse-build` se reserva a una exportación vigente ya comprobada.

La web sirve archivos estáticos; Python pertenece a la preparación científica.
Los archivos publicados no contienen entornos de desarrollo ni credenciales.

### Entorno actual de revisión

La [vista pública de desarrollo](../frontend/deploy/README.md) utiliza
`dell-latitude-5420`, el proyecto `traza-civica-preview` y
`127.0.0.1:3101 → 8080`, con Cloudflare Tunnel y compilación de producción.
Su guía contiene el único comando de actualización de ese entorno. No mezclarlo
con Compose genérico ni con otros servicios del servidor.

El script de preview valida la transferencia, prepara una imagen identificada,
comprueba Nginx, `/healthz` y `/deployment.json` y conserva `current` y `previous`.
La vista es pública y lleva `noindex`; ese encabezado no establece privacidad.

### Preparación del destino definitivo

El host, dominio, continuidad de la URL, proxy/HTTPS y responsable de operación
se confirman antes de activar el destino final. La publicación actual sigue
siendo el entorno de revisión.

La alternativa genérica existente está en
[`docker-compose.prod.yaml`](../frontend/docker-compose.prod.yaml) y el
[`Dockerfile`](../frontend/Dockerfile). Desde `frontend/`:

```console
docker compose -p traza-civica -f docker-compose.prod.yaml config --quiet
docker compose -p traza-civica -f docker-compose.prod.yaml up -d --build
```

Estos comandos se reservan al host elegido; no actualizan el preview. El puerto
predeterminado es `127.0.0.1:8088 → 8080`; `FRONTEND_PORT` permite elegir otro.
Un proxy o túnel externo termina HTTPS. El Dockerfile compila con Node y sirve
la exportación mediante Nginx sin privilegios. El presupuesto de compilación
(heap máximo de 6 GiB y ocho hilos) no representa el consumo del servicio estático.
El comando compila en el host elegido: éste necesita capacidad de compilación,
además de la necesaria para servir archivos. El traslado de una imagen compilada
en otro equipo no está documentado en este procedimiento. Antes de recompilar,
conservar la imagen vigente con una etiqueta propia y registrar su digest para
que no dependa de una etiqueta reutilizada. Compose genérico no implementa el historial ni `/deployment.json` del
preview: registrar por separado la imagen y el corte desplegados.

## Comprobar identidad y recuperar

- Consultar `/healthz`, abrir mapa, tabla, ficha y comparación sin/con intervención.
  Revisar un municipio con datos y Villa de Pozos sin estimación.
- Contrastar `/data/manifest.json` con los archivos publicados y la fuente
  científica prevista. Comprobar una descarga real y su SHA-256; una respuesta
  HTTP 200 por sí sola no acredita versión, contenido ni funcionamiento de la UI.
- En preview, comprobar además `/deployment.json` y la salud del contenedor.
  Para otro destino, usar el registro de imagen/commit y controles definidos allí.
- La guía de preview documenta cómo activar `previous`. El mecanismo está
  disponible; no se ha ensayado una activación fallida ni se ha acreditado una
  recuperación ante desastre. No efectuar ese ensayo sobre el servicio compartido.
  El destino final necesita conservar una imagen y datos anteriores y su propio
  procedimiento de reversión antes de declararlo operable.

## Integrar la entrega

El [paquete del mapa](entrega-mapa.md) es una pieza del ZIP final del concurso.
La URL de su `ENLACE.txt`, LEEME y manifiesto actualmente apunta al preview.
Si se acuerda otro destino, regenerar esa pieza con `--url` y verificar otra vez
sus huellas. Ese argumento sólo cambia la dirección. Si cambian avisos o condiciones,
acordarlos con el equipo y actualizar sus fuentes antes de empaquetar. Para
ensayos utilizar otra carpeta con `--output`; el
empaquetador puede sobrescribir un ZIP de igual nombre. Conservar la versión
anterior y su SHA hasta comprobar la nueva y confirmar su apertura por el receptor.

En la nota de envío comunicar, fuera del ZIP, el nombre, tamaño y SHA-256 del
archivo efectivamente transferido, la URL elegida, el commit de software y el
corte de datos. Recalcular la huella si se regenera el paquete. Si cambia el
dominio, exportar antes las consultas personales e importarlas desde el nuevo:
el almacenamiento del navegador corresponde a cada origen.

| Pieza                                    | Responsable                                 | Estado y evidencia                                                   | Condición de cierre                                                                  |
| ---------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Web interactiva                          | Jorge                                       | Probada en preview; CI y pruebas de navegador                        | Confirmar destino/URL final y repetir comprobación allí                              |
| GPKG y base CSV/XLSX 1.3                 | Sofía: contenido; Jorge: integración        | Lectura estructural, claves, valores y procedencia contrastados      | Apertura en el SIG del receptor y acuerdo del corte final                            |
| ZIP del mapa 1.3                         | Jorge                                       | Integridad CRC y 11 archivos verificados por manifiesto; SHA externo | Mantener URL elegida o regenerar y volver a verificar si cambia                      |
| Código y guías                           | Jorge; análisis de Sofía                    | Publicados con versiones y comprobaciones                            | Fijar commit final y acceso del receptor                                             |
| Apartado de producto/arquitectura        | Jorge; revisión conjunta                    | Preparado en este directorio                                         | Integrarlo con el reporte científico y revisar su maquetación                        |
| Reporte metodológico/preventivo completo | Sofía; revisión conjunta                    | Pendiente de cierre en este flujo                                    | PDF final de 10–15 cuartillas según bases, con variables, semáforo y recomendaciones |
| Presentación ejecutiva                   | Equipo                                      | No recibida aquí para revisión                                       | Revisar archivo final, máximo 10 diapositivas y coherencia con el corte              |
| Cartas y registro                        | Ambos integrantes                           | Pendientes de comprobación documental                                | Firmas y requisitos de registro/entrega revisados fuera del repositorio público      |
| Licencia, cesión y difusión final        | Ambos; consulta al INE gestionada por Sofía | Respuesta del INE pendiente; repo público conserva avisos MIT        | Acordar tratamiento compatible con la respuesta y conservar avisos de terceros       |
| ZIP final y envío                        | Equipo                                      | Pendiente; distinto del ZIP del mapa                                 | Reunir piezas, nombre registrado del equipo/eje y comprobante de envío               |

«Probado» identifica una comprobación técnica en el entorno indicado;
«preparado» identifica material redactado o empaquetado, y «pendiente» una
decisión o archivo aún no acreditado. La matriz no certifica una entrega completa.

### Prueba del receptor

- [ ] Verificar SHA externo del ZIP transferido y descomprimir sin errores.
- [ ] Contrastar tamaños/huellas del `MANIFIESTO.json` con el contenido recibido.
- [ ] Abrir GPKG en un SIG compatible, confirmar capa y comparar la pareja del
      mismo supuesto nacional siguiendo el LEEME.
- [ ] Abrir CSV/XLSX conservando CVEGEO textual y vacíos; distinguir unidades de
      historia y pronósticos según el diccionario.
- [ ] Abrir URL elegida, consultar mapa/ficha/tabla y comprobar una descarga.
- [ ] Confirmar que reporte, presentación, base, mapa y metadatos utilizan el
      corte acordado y que las cartas firmadas se incluyen donde corresponde.
- [ ] Revisar nuevamente las [bases y requisitos](requisitos.md), canal, nombre
      del paquete y condiciones administrativas antes del envío.

Los documentos firmados y datos personales de registro se conservan fuera del
repositorio público. El nombre del producto no sustituye el del equipo registrado.
