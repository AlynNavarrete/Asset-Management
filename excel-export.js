(() => {
  let loading;
  const load = () => window.ExcelJS ? Promise.resolve() : loading || (loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/assets/vendor/exceljs/exceljs.min.js';
    script.onload = () => window.ExcelJS ? resolve() : reject(new Error('Excel no disponible'));
    script.onerror = () => { loading = null; script.remove(); reject(new Error('No se pudo cargar Excel')); };
    document.head.appendChild(script);
  }));
  window.rpExportWorkbook = async (table, filename, title, button) => {
    if (button?.disabled) return;
    if (button) button.disabled = true;
    try {
      await load();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Asset Management · RedPetroil';
      const sheet = workbook.addWorksheet(title, { views: [{ state: 'frozen', ySplit: 1 }] });
      const rows = [...table.rows];
      const headers = [...(rows[0]?.cells || [])].map(cell => cell.textContent.trim());
      rows.forEach((row, index) => {
        const cells = [...row.cells];
        const values = cells.map(cell => {
          const copy = cell.cloneNode(true);
          copy.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
          copy.querySelectorAll('small').forEach(node => node.before(document.createTextNode('\n')));
          const text = copy.textContent.replace(/[\t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
          return text;
        });
        const excelRow = sheet.addRow(values);
        excelRow.height = index === 0 ? 30 : 42;
        excelRow.eachCell((cell, column) => {
          const text = values[column - 1], header = headers[column - 1] || '';
          // Explicit numeric columns only: IDs, dates, phones and formula-like text remain literal strings.
          const numeric = /^(?:\$\s*)?(-?[\d,]+(?:\.\d+)?)\s*(?:MXN|m²|m2)?$/i.exec(text);
          if (index > 0 && numeric && /renta|superficie|meses/i.test(header)) {
            cell.value = Number(numeric[1].replace(/,/g, ''));
            cell.numFmt = /renta/i.test(header) ? '"$"#,##0.00' : /superficie/i.test(header) ? '#,##0.00" m²"' : '#,##0.##';
          }
          const link = cells[column - 1]?.querySelector('a[href]');
          if (index > 0 && link && /^https?:\/\//i.test(link.href)) cell.value = { text, hyperlink: link.href };
          cell.font = { name: 'Calibri', size: 11, bold: index === 0, color: { argb: index === 0 ? 'FFFFFFFF' : 'FF172033' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index === 0 ? 'FF155E9E' : index % 2 ? 'FFFFFFFF' : 'FFEEF5FB' } };
          cell.alignment = { vertical: 'middle', wrapText: true };
        });
      });
      sheet.columns.forEach((column, index) => { column.width = /local|estaci[oó]n|prospecto/i.test(headers[index] || '') ? 26 : 22; });
      if (headers.length) sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
      const buffer = await workbook.xlsx.writeBuffer();
      window.rpDownloadFile(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
    } catch (error) {
      console.error('Exportación Excel', error);
      alert('No se pudo generar el archivo Excel. Intenta descargarlo nuevamente.');
    } finally { if (button) button.disabled = false; }
  };
})();
