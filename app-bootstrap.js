(() => {
  const root = document.documentElement;
  root.classList.add('rp-app-loading');
  let revealed = false;
  window.rpRevealApp = () => {
    if (revealed) return;
    revealed = true;
    root.classList.remove('rp-app-loading');
    root.classList.add('rp-app-ready');
  };
  window.setTimeout(window.rpRevealApp, 5000);
  document.addEventListener('DOMContentLoaded', () => {
    window.setTimeout(window.rpRevealApp, 1200);
  }, { once:true });
})();
