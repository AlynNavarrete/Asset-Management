document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('dark-mode-toggle');
  const toast = document.getElementById('settings-toast');
  const notify = (message) => { toast.textContent = message; toast.classList.add('visible'); window.setTimeout(() => toast.classList.remove('visible'), 2000); };
  themeToggle.checked = document.documentElement.classList.contains('rp-dark');
  themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    localStorage.setItem('rp-theme', theme);
    document.documentElement.classList.toggle('rp-dark', theme === 'dark');
    notify(theme === 'dark' ? 'Modo noche activado.' : 'Modo claro activado.');
  });

  document.querySelectorAll('[data-setting]').forEach((control) => {
    const saved = localStorage.getItem(`rp-${control.dataset.setting}`);
    if (saved !== null) control.checked = saved === 'true';
    control.addEventListener('change', () => {
      localStorage.setItem(`rp-${control.dataset.setting}`, control.checked);
      notify('Preferencia guardada.');
    });
  });
  document.querySelectorAll('[data-channel]').forEach((button) => {
    const key = `rp-channel-${button.dataset.channel}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const active = saved === 'true'; button.classList.toggle('active', active); button.classList.toggle('pending', !active);
      button.textContent = active ? 'Activo' : 'Pendiente';
    }
    button.addEventListener('click', () => {
      const active = button.classList.toggle('active'); button.classList.toggle('pending', !active);
      button.textContent = active ? 'Activo' : 'Pendiente'; localStorage.setItem(key, active); notify('Canal actualizado.');
    });
  });
  document.getElementById('settings-notifications')?.addEventListener('click', () => notify('Tienes 4 notificaciones de configuración.'));
});
