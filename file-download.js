(() => {
  const urls = new Set();
  // Keep the file alive while the mobile browser hands it to its download manager.
  window.rpDownloadFile = (file, filename) => {
    const owned = file instanceof Blob;
    const url = owned ? URL.createObjectURL(file) : String(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = String(filename || 'Documento').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-');
    link.style.display = 'none';
    // A body-level link is inert while a native dialog is open.
    (document.querySelector('dialog[open]') || document.body).appendChild(link);
    link.click();
    if (owned) urls.add(url);
    setTimeout(() => { link.remove(); if (owned) { URL.revokeObjectURL(url); urls.delete(url); } }, 120000);
  };
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); }
  });
})();
