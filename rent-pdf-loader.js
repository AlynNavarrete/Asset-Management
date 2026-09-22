(() => {
  let pending;
  const load=(src,ready)=>ready()?Promise.resolve():new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=src;
    script.onload=()=>ready()?resolve():reject(new Error('Biblioteca PDF no disponible'));
    script.onerror=()=>{script.remove();reject(new Error('No se pudo cargar '+src));};
    document.head.appendChild(script);
  });
  window.rpLoadRentPdf=()=>pending||(pending=Promise.all([
    load('/assets/vendor/pdf/jspdf.umd.min.js',()=>Boolean(window.jspdf?.jsPDF)),
    load('/assets/vendor/pdf/html2canvas.min.js',()=>Boolean(window.html2canvas))
  ]).catch(error=>{pending=null;throw error;}));
  let artwork;
  const dataUrl=async path=>{
    const response=await fetch(path);if(!response.ok)throw new Error('Recurso PDF no disponible');
    const blob=await response.blob();
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  };
  window.rpRentPdfArtwork=()=>artwork||(artwork=Promise.all([
    dataUrl('/assets/redpetroil-logo.png'),dataUrl('/assets/fonts/local-7.woff2')
  ]).catch(error=>{artwork=null;throw error;}));
})();
