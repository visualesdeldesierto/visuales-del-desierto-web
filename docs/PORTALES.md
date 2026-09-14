# Portales — Portal 01

Experiencia WebAR oculta de Visuales del Desierto.

## Acceso

- Ruta prevista: `https://visualesdeldesierto.com/portales`
- No agregar enlaces desde portada, navegación ni pie de página.
- No incluir la ruta en `sitemap.xml`.
- El QR físico es el punto de descubrimiento.
- `noindex`, `nofollow`, `noarchive` y `nosnippet` están definidos en HTML, Vercel y `_headers`.

La URL es pública, no secreta: una persona que la conozca puede abrirla directamente.

## Portal 01

- Referencia: `portales/assets/targets/portal-01-target.png`
- Objetivo MindAR: `portales/assets/targets/portal-01.mind`, índice 0
- Video: `portales/assets/video/portal-01-web.mp4`
- MindAR 1.2.5 + A-Frame 1.2.0

El video es H.264 High, 960 × 540, 30 fps, yuv420p, sin audio, 20 s, 3.75 MB y faststart.

## Estado

Integración local en la rama `feature/portales-prototipo`. No publicar antes de revisar una vista previa HTTPS y probar cámara/seguimiento en iPhone y Android.

## Vista previa Vercel

- Rama remota: `feature/portales-prototipo`
- Despliegue: exitoso
- URL: `https://visuales-del-desierto-web-git-feat-66c2e8-visuales-del-desierto.vercel.app/portales`
- Estado actual: protegida por inicio de sesión de Vercel; todavía no es adecuada para un QR público.
- Producción: `https://visualesdeldesierto.com/portales` continúa respondiendo 404.

Antes de probar con teléfonos hay que crear un enlace compartible de Vercel o autorizar un cambio limitado en la protección de esta vista previa. No fusionar a `main` para resolver este bloqueo.