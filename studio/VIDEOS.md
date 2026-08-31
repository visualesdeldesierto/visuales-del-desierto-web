# Videos por proyecto

1. Conserva o pega el primer enlace en **Video principal de Vimeo**.
2. En **Videos adicionales de Vimeo**, añade un elemento por video.
3. Pega el enlace y, si quieres, escribe un título corto para distinguir cada pieza.
4. Arrastra los elementos para ordenar los videos adicionales. El principal siempre va primero.
5. Pulsa **Publicar**. En la web aparecerá **Ver videos (N)** cuando haya más de uno.

La lista adicional también funciona sin video principal. Los enlaces repetidos se muestran una sola vez. Para videos no listados conserva el enlace completo, incluido su código privado. Vimeo debe permitir incrustar el video en el dominio del sitio.

La ventana permite usar Anterior/Siguiente, los números o las flechas del teclado cuando el foco está fuera del reproductor de Vimeo. En móvil se puede deslizar sobre la franja indicada debajo del reproductor. Se carga un solo video a la vez y se detiene al cambiar o cerrar.

## Desarrollo

- Pruebas del sitio: `node --test tests/video-gallery.test.cjs` desde la raíz del repositorio.
- Generar Studio: `sanity build` desde `studio`.
- Abrir el Studio compilado: `python serve-studio.py` desde `studio`.
- El servidor usa el puerto 3334, admite las rutas internas y evita caché local. No depende de la carpeta `dist` como directorio de trabajo, para permitir regenerarla.
