# Vista pública durante el desarrollo

Este entorno permite revisar cada iteración con Sofía. Siempre sirve una
**compilación de producción**, aunque su finalidad sea el desarrollo. No es la
infraestructura de entrega definitiva.

| Elemento                    | Valor                               |
| --------------------------- | ----------------------------------- |
| URL                         | https://traza-civica.jorgetato.com/ |
| Alias SSH                   | `dell-latitude-5420`                |
| Servicio del túnel          | `http://localhost:3101`             |
| Puerto publicado por Docker | `127.0.0.1:3101:8080`               |
| Proyecto Compose            | `traza-civica-preview`              |
| Directorio remoto           | `~/projects/traza-civica-preview/`  |

## Actualizar

Desde `frontend/`, con Node, OpenSSH y tar disponibles:

```console
npm run deploy:preview
```

El comando compila con `next build` y exporta archivos estáticos. Copia únicamente
la exportación, configuración Nginx, licencia y archivos de despliegue a un
artefacto local en `artifacts/preview/`. No transfiere el repositorio, `.env`,
credenciales, datos de investigación ni dependencias de desarrollo.

Sube el artefacto mediante SSH, comprueba SHA-256 y crea una imagen Nginx de
producción con etiqueta única. Valida su configuración, sustituye el contenedor y
comprueba `/healthz` y la identidad de la versión. El servidor no compila React,
no instala npm y no mantiene un servidor Next en ejecución.

Solo para reutilizar una exportación vigente que ya fue construida y comprobada:

```console
npm run deploy:preview -- --reuse-build
```

El alias se puede sustituir mediante `PREVIEW_SSH_HOST`; el puerto y directorio
pertenecen a este entorno. La primera publicación se hizo el 19 de octubre de
2026 con el build que pasó la batería territorial local.

## Operación y reversión

Las publicaciones se conservan en `releases/<id>/`, los archivos recibidos en
`incoming/`, y los enlaces `current` y `previous` identifican versiones. Un bloqueo
`flock` serializa activaciones. Si falla una activación y existe una versión
anterior, el script intenta restaurarla y devuelve el error. No se ha simulado
un fallo de despliegue en este entorno.

Para volver a la publicación anterior:

```console
ssh dell-latitude-5420 'bash "$HOME/projects/traza-civica-preview/previous/activate.sh"'
```

El contenedor reinicia con Docker, tiene filesystem de solo lectura, usuario sin
privilegios, 128 MiB de memoria y máximo de una CPU. Nginx comprime JSON/GeoJSON y
sirve fuentes y recursos locales. Las respuestas de esta vista añaden
`X-Robots-Tag: noindex, nofollow, noarchive`; sigue siendo pública, sin autenticación.

La sustitución Compose puede producir un corte breve; no se promete continuidad
sin interrupciones. Este flujo no instala un watcher, cron ni un despliegue
automático desde GitHub. Se ejecuta al publicar cada iteración y es independiente
del otro proyecto del servidor.

`/deployment.json` identifica versión, momento de empaquetado y modo
`production-static`. Las versiones antiguas se conservan para reversión; su
limpieza se hará de manera explícita. No se ejecutan limpiezas globales de Docker.

Volver a [frontend](../README.md), [diseño](../docs/sistema-diseno.md) o
[cartografía](../docs/cartografia.md).
