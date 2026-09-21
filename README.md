# Asset-Management

Sitio estático. Para servirlo localmente en Windows: `powershell -ExecutionPolicy Bypass -File serve.ps1` y abrir `http://localhost:8000`.

Los estilos Tailwind se generan antes de publicar, sin compilación en el navegador. Después de cambiar clases HTML/JavaScript o los temas de `styles/pages.json`, ejecutar:

```sh
npm ci
npm run build:styles
```

Incluir los CSS generados de `assets/styles/` en el commit. Vercel sirve estos archivos directamente. Las fuentes y Leaflet están en `assets/` con sus licencias; no requieren una descarga desde un CDN al abrir cada sección.

Con el servidor local activo y Microsoft Edge instalado, `npm test` comprueba todas las secciones, los cambios rápidos de pestaña y la navegación con una respuesta lenta. Para comprobar otro despliegue, definir `CHECK_BASE` con su URL antes de ejecutar la prueba.
