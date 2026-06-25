# Guia De Despliegue

El sitio es estatico: HTML, CSS, JavaScript y assets.

## Opcion recomendada

GitHub + Vercel.

Ventajas:

- Gratis para empezar.
- Despliegue automatico desde GitHub.
- Previews por rama.
- Conexion sencilla con dominio propio.
- HTTPS automatico.

## Alternativa fuerte

GitHub + Cloudflare Pages.

Ventajas:

- Gratis.
- Muy buen rendimiento.
- Facil de combinar con DNS de Cloudflare.
- Util si se quiere activar Email Routing para recibir correo con dominio propio.

## Dominio

Dominio objetivo:

```text
visualesdeldesierto.com
```

Cuando el sitio este publicado, se debe conectar:

```text
visualesdeldesierto.com
www.visualesdeldesierto.com
```

## Correo

Correo actual:

```text
visualesdeldesierto@icloud.com
```

Correo futuro recomendado:

```text
hola@visualesdeldesierto.com
```

Para recibir correos sin pagar buzon, una opcion es usar Cloudflare Email Routing y reenviar al correo de iCloud.

## Checklist antes de publicar

- Revisar que no haya textos provisionales.
- Revisar responsive.
- Revisar consola sin errores.
- Confirmar contacto correcto.
- Confirmar imagen OG.
- Confirmar favicon.
- Confirmar metadata SEO.
- Confirmar que el logo oficial carga.
- Confirmar que las fuentes locales cargan.
- Confirmar `robots.txt`.
- Confirmar `sitemap.xml`.
- Confirmar `site.webmanifest`.
- Confirmar headers/cache segun hosting.

## Archivos de publicacion incluidos

```text
robots.txt
sitemap.xml
site.webmanifest
vercel.json
_headers
assets/icons/
assets/social/og-image.png
```

`vercel.json` prepara headers y cache para Vercel.

`_headers` prepara headers y cache para Cloudflare Pages.

Si se elige solo una plataforma, se puede conservar el archivo de la otra como referencia o retirarlo antes del deploy final.

La imagen Open Graph actual es una version base con el logotipo oficial. Cuando exista el portafolio real, conviene reemplazarla por una composicion con foto o still de una instalacion destacada.

## Pasos recomendados en Vercel

1. Crear repositorio en GitHub.
2. Subir todos los archivos del proyecto.
3. Entrar a Vercel.
4. Importar el repositorio.
5. Framework preset: Other.
6. Build command: dejar vacio.
7. Output directory: dejar vacio o usar raiz del proyecto.
8. Deploy.
9. Agregar dominio `visualesdeldesierto.com`.
10. Agregar tambien `www.visualesdeldesierto.com`.
11. Configurar DNS segun indique Vercel.

## Pasos recomendados en Cloudflare Pages

1. Crear repositorio en GitHub.
2. Subir todos los archivos del proyecto.
3. Entrar a Cloudflare Pages.
4. Conectar el repositorio.
5. Framework preset: None.
6. Build command: dejar vacio.
7. Output directory: `/`.
8. Deploy.
9. Conectar dominio.
10. Configurar Email Routing si se quiere usar correo con dominio.
