(() => {
  const root = document.documentElement;
  try { root.classList.toggle('rp-dark',localStorage.getItem('rp-theme')==='dark'); } catch {}
  root.classList.add('rp-app-loading');
  window.rpRevealApp = () => {
    root.classList.remove('rp-app-loading');
    root.classList.add('rp-app-ready');
  };
  // Finish the synchronous module setup before showing the already-styled document.
  document.addEventListener('DOMContentLoaded', () => queueMicrotask(window.rpRevealApp), {once:true});
  // A page restored by Back/Forward must never retain a loading mask.
  window.addEventListener('pageshow', window.rpRevealApp);
})();
