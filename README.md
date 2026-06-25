# Visuales del Desierto Web

Sitio web oficial de Visuales del Desierto.

Visuales del Desierto es un estudio creativo enfocado en arte digital, videomapping, instalaciones interactivas, escena, moda, espacios comerciales e instituciones culturales.

## Estado del proyecto

Version actual de trabajo: `v1.0-base`

La base visual y tecnica del sitio contiene:

- Identidad visual oscura y minimalista.
- Logotipo oficial.
- Fuentes oficiales locales: Roboto y Roboto Mono.
- Hero generativo con particulas limitado a la portada.
- Secciones base: estudio, servicios, proyectos, obra autoral, colaboraciones y contacto.
- Responsive para desktop, tablet y mobile.
- Preparacion para portafolio real y casos de estudio.

## Estructura

```text
/
  index.html
  styles.css
  script.js
  assets/
    fonts/
    media/
    vd-oficial-v.png
  content/
    projects.example.json
  docs/
    CONTENT_GUIDE.md
    DEPLOYMENT.md
    VERSION.md
  robots.txt
  sitemap.xml
  site.webmanifest
  vercel.json
  _headers
```

## Vista local

Este sitio es estatico. Puede abrirse directamente en navegador, aunque para revisar fuentes, rutas y comportamiento es mejor usar un servidor local.

Ejemplo:

```powershell
python -m http.server 4201
```

Luego abrir:

```text
http://127.0.0.1:4201/
```

## Flujo recomendado

1. Mantener `main` como version estable.
2. Trabajar cambios en ramas por tema.
3. No modificar la base visual sin una razon clara.
4. Agregar proyectos reales desde `content/` y `assets/media/projects/`.
5. Publicar con Vercel o Cloudflare Pages.

## Ramas sugeridas

```text
main
content/projects
design/refinements
seo/setup
deploy/vercel
```
