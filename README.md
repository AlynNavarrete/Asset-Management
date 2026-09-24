# Asset-Management

Inicio ordena las actividades por pendiente/completada, prioridad y fecha; las conserva en `rp-home-activities`. `home-data.js` reúne los vencimientos iniciales y las fichas guardadas (`rp-local-detail:*`), usando días de calendario locales, con renovación al recuperar foco y cada minuto. Las tarjetas de vencimientos y expedientes abren el detalle de sus listas; los expedientes pendientes corresponden a actividades de tipo Expediente no completadas. `?view=table` fuerza la vista de tabla del Directorio. Verificar con `node tests/home-links.cjs`.

El botón **Descargar PDF** del cálculo de renta genera directamente `Calculo Renta-<local>.pdf`, en una hoja carta. La descarga conserva el diseño como imagen de alta resolución, con logo y fuente incorporados. `node tests/rent-download.cjs` verifica el nombre, la descarga sin impresión y el tamaño de página; admite `CHECK_BASE` para probar Vercel.

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

Los incrementos de renta en Calendario y Alertas capturan INPC anterior/actual y sus períodos (mes y año). La renta se calcula como monto anterior × índice actual / índice anterior, redondeada a centavos; la variación proviene del cociente de índices. Se validan índices positivos y períodos cronológicos. Las fechas de esta vista se muestran/capturan en DD/MM/AAAA y se almacenan en ISO. El historial conserva ambos índices y períodos y los muestra en Condiciones Económicas del local, manteniendo compatibilidad con registros antiguos. Verificación: `node tests/rent-increase.cjs` (Edge).

La hoja compartida `responsive.css` adapta las vistas a tablet y teléfono (hasta 1050 px): menú táctil desplegable con cierre por Escape/fondo, tarjetas apiladas, tablas desplazables y formularios contenidos en la pantalla. Los reportes conservan su tamaño de impresión. Prueba: `node tests/responsive.cjs` en 360, 390, 768 y 1024 px; regresión de escritorio: `node tests/navigation.cjs`.

Vistas de documentos móviles: `document-preview.js/css` conserva las dimensiones de las hojas de renta y propuestas, con ajuste al ancho y zoom. Las capturas para descargar PDF se realizan sin el zoom visual. Inteligencia de Mercado y planos PDF usan un visor paginado local (Mozilla PDF.js 6.3.289, licencia en `assets/vendor/pdfjs/LICENSE`) en lugar de depender del PDF incrustado de Safari. El visor carga la biblioteca sólo cuando se abre un PDF, muestra una página por vez y permite navegar todas las páginas y ampliar hasta 4×. Las descargas conservan el archivo completo. Bibliotecas jsPDF/html2canvas locales; no requieren CDN.

Validación: `node tests/document-preview.cjs`, luego `node tests/mobile-pdf-exports.cjs` y `node tests/document-files.cjs` (este último utiliza el PDF de prueba generado por el primero). Incluye reporte de mercado de 3 páginas, propuestas originales/editadas/aprobadas, reportes de local y estación, renta y plano multipágina. Las fichas de documentos del expediente preexistentes siguen siendo registros de metadatos, no copias del documento original.
