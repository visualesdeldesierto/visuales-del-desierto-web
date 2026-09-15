# Portales — Portal 01

Experiencia WebAR oculta de Visuales del Desierto.

## Acceso

- Ruta prevista: `https://visualesdeldesierto.com/portales`
- No agregar enlaces desde portada, navegación ni pie de página.
- No incluir la ruta en `sitemap.xml`.
- El QR físico es el punto de descubrimiento.
- `noindex`, `nofollow`, `noarchive` y `nosnippet` están definidos en HTML, Vercel y `_headers`.

## Portal 01

- Referencia activa: `portales/assets/targets/portal-01-cactus-target.png`
- Objetivo activo: `portales/assets/targets/portal-01-cactus.mind`, índice 0
- Respaldo: mariposa en `portal-01-target.png` y `portal-01.mind`
- Video: `portales/assets/video/portal-01-web.mp4`
- MindAR 1.2.5 + A-Frame 1.2.0

El cactus compilado contiene 4,786 puntos de coincidencia y 124 puntos de seguimiento. El video es H.264 High, 960 × 540, 30 fps, yuv420p, sin audio, 20 s, 3.75 MB y faststart.

## Estado de validación

- QR, cámara, detección, reproducción, pérdida, pausa y recuperación validados en iPhone.
- Flujo funcional en varios Android; el rendimiento varía según el dispositivo.
- La prueba impresa está pendiente.
- El QR permanece separado del objetivo durante el prototipo.

## Vista previa Vercel

- Rama: `feature/portales-prototipo`
- Vista previa HTTPS: desplegada.
- Se habilitó un enlace compartible sin almacenar su token en el repositorio.
- Producción continúa sin publicar `/portales`.
- No fusionar a `main` hasta validar el cactus y la lámina impresa.