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

  const exportButton = document.getElementById('export-app-backup');
  const importButton = document.getElementById('import-app-backup');
  const backupInput = document.getElementById('app-backup-file');
  const backupStatus = document.getElementById('backup-status');
  const backupFormat = 'redpetroil-asset-management-backup';
  const snapshot = () => {
    const data = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key !== null) data[key] = localStorage.getItem(key);
    }
    return { format:backupFormat, version:1, exportedAt:new Date().toISOString(), origin:window.location.origin, itemCount:Object.keys(data).length, data };
  };
  const safeName = (value) => value.replace(/[^a-z0-9.-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const downloadSnapshot = (prefix = 'respaldo') => {
    const backup = snapshot();
    const stamp = backup.exportedAt.replace(/[:.]/g, '-');
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type:'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}-asset-management-${safeName(location.hostname || 'local')}-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    backupStatus.textContent = `${backup.itemCount} registros respaldados · ${new Date(backup.exportedAt).toLocaleString('es-MX')}`;
    return backup;
  };
  const validBackup = (backup) => backup && backup.format === backupFormat && backup.version === 1 && backup.data && typeof backup.data === 'object' && !Array.isArray(backup.data) && Object.values(backup.data).every((value) => typeof value === 'string' || value === null);
  backupStatus.textContent = `${localStorage.length} registros disponibles en ${location.hostname || 'este navegador'}`;
  exportButton?.addEventListener('click', () => {
    const backup = downloadSnapshot();
    notify(`Respaldo listo: ${backup.itemCount} registros exportados.`);
  });
  importButton?.addEventListener('click', () => backupInput?.click());
  backupInput?.addEventListener('change', async () => {
    const file = backupInput.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (!validBackup(backup)) throw new Error('El archivo no es un respaldo válido de Asset Management.');
      const total = Object.keys(backup.data).length;
      const source = backup.origin || 'origen desconocido';
      const exported = backup.exportedAt ? new Date(backup.exportedAt).toLocaleString('es-MX') : 'fecha desconocida';
      if (!window.confirm(`Se restaurarán ${total} registros.\n\nOrigen: ${source}\nRespaldo: ${exported}\n\nAntes de continuar se descargará una copia preventiva de los datos actuales. ¿Deseas continuar?`)) return;
      downloadSnapshot('respaldo-previo-a-restaurar');
      localStorage.clear();
      Object.entries(backup.data).forEach(([key, value]) => {
        if (value !== null) localStorage.setItem(key, value);
      });
      window.alert(`Listo. Se restauraron ${total} registros correctamente.`);
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No fue posible leer el respaldo seleccionado.');
    } finally {
      backupInput.value = '';
    }
  });
});
