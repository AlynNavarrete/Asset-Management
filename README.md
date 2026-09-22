# Asset-Management

Sitio estático. Para servirlo localmente en Windows: `powershell -ExecutionPolicy Bypass -File serve.ps1` y abrir `http://localhost:8000`.

Los estilos Tailwind se generan antes de publicar, sin compilación en el navegador. Después de cambiar clases HTML/JavaScript o los temas de `styles/pages.json`, ejecutar:

```sh
npm ci
npm run build:styles
```

Incluir los CSS generados de `assets/styles/` en el commit. Vercel sirve estos archivos directamente. Las fuentes y Leaflet están en `assets/` con sus licencias; no requieren una descarga desde un CDN al abrir cada sección.

Con el servidor local activo y Microsoft Edge instalado, `npm test` comprueba todas las secciones, los cambios rápidos de pestaña y la navegación con una respuesta lenta. Para comprobar otro despliegue, definir `CHECK_BASE` con su URL antes de ejecutar la prueba.

`npm run test:rent` comprueba el modelo de renta, la edición y el PDF carta. El editor usa `rp-rent-increase-history` (Aniversarios), `rp-local-detail:*` y `rp-former-tenants`. Al consultar Detalle del local también se guarda una referencia ligera de superficie y renta en `rp-rent-comparable:*`, incluso si no se edita el perfil. Las fechas de ajuste se identifican con un asterisco en el reporte: no se presentan como facturas emitidas. `lastInvoiceDate` es opcional en Historial de Inquilinos y en la salida del inquilino; una fecha de contrato anterior nunca se migra a este campo.

El IPC capturado normaliza cada comparable, exceptuando referencias del año actual, antes de obtener la mediana ajustada. No se descarga un IPC oficial. El margen comercial expresa `(salida − piso) / objetivo × 100`, repartido por mitades alrededor del objetivo. Los cálculos anteriores conservan su registro hasta que se guarde la nueva versión; los cambios requieren nueva aprobación.

Inteligencia de Mercado guarda solo resultados reales de DENUE dentro de 800 m en `rp-denue-analysis:<estación>:<local>`. El selector usa sus cuatro categorías comerciales y calcula `conteo del giro / total × 100`. Sin observaciones, se permite capturar conteos manualmente; los puntos estimados del mapa no se incorporan al cálculo. El promedio de la ciudad es un insumo manual independiente; sin él se omite el componente de densidad. Todos estos registros siguen almacenándose en el navegador.
