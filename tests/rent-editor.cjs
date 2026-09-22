const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.CHECK_BASE || 'http://localhost:8000';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const year = new Date().getFullYear();
      localStorage.setItem('rp-former-tenants', JSON.stringify([1, 2, 3].map(i => ({ id: `c${i}`, local: `L-0${i}`, station: 'La Marina', city: 'Mazatlán', tenant: `Comparable ${i}`, business: 'Farmacia', area: 100, monthlyRent: i * 10000, rentM2: i * 100, startDate: '2020-01-01', lastInvoiceDate: `${year}-01-01`, endDate: `${year}-08-0${4-i}` }))));
      localStorage.setItem('rp-rent-increase-history', JSON.stringify([{ id: 'increase1', station: 'La Marina', localId: 'L-01', tenant: 'Comparable 1', newAmount: 15000, adjustmentDate: `${year}-02-01`, capturedAt: `${year}-02-01T12:00:00Z` }]));
      localStorage.setItem('rp-denue-analysis:La Marina:LAM-01', JSON.stringify({ source: 'DENUE', radius: 800, observedAt: `${year}-08-01`, total: 20, counts: [{ key: 'food', count: 10 }, { key: 'health', count: 5 }, { key: 'retail', count: 3 }, { key: 'service', count: 2 }] }));
    });
    await page.goto(base + '/Admin%20Vacantes/code.html?view=calculation', { waitUntil: 'domcontentloaded' });
    await page.locator('.view-calculation').first().click();
    const form = page.locator('#rent-calculation-form'), paper = page.locator('.rent-report-paper');
    assert.equal(await form.locator('.rent-editor-section').count(), 4);
    assert.deepEqual(await paper.locator('.rent-source-grid h3').allTextContents(), ['Historial de Contrato', 'DENUE · INEGI', 'Ficha Técnica del Local']);
    const aligned = await paper.evaluate(e => [...e.querySelectorAll('.rent-source-grid > div')].every((card, i) => Math.abs(card.getBoundingClientRect().x - e.querySelectorAll('.rent-factor-grid > div')[i].getBoundingClientRect().x) < 1));
    assert(aligned, 'Source cards must align vertically with adjustment cards');
    assert((await paper.innerText()).includes('Fecha Últ. Factura'));
    assert.equal(await form.locator('[name=comp1]').inputValue(), '150');
    assert.equal(await form.locator('[name=compDate1]').inputValue(), `${new Date().getFullYear()}-02-01`);
    assert((await paper.innerText()).includes('no una factura emitida'));
    assert.equal(await form.locator('[name=inflation]').inputValue(), '0.00');
    assert(await form.locator('[name=inflation]').evaluate(e => e.readOnly));
    await form.locator('[name=suggestedBusiness]').selectOption('health');
    assert((await form.locator('#rent-market-note').innerText()).includes('25.00%'));
    await form.locator('.rent-editor-more > summary').first().click();
    await form.locator('[name=compDate2]').fill(`${new Date().getFullYear()-1}-01-01`);
    await form.locator('.rent-editor-section > summary').nth(1).click();
    await form.locator('[name=inflation]').fill('5');
    await form.locator('[name=exitReason]').selectOption('Quiebra por Renta Alta');
    await form.locator('.rent-editor-section > summary').nth(2).click();
    await form.locator('[name=visibility]').selectOption('5');
    await form.locator('.rent-editor-section > summary').nth(3).click();
    await form.locator('[name=negotiationMargin]').fill('20');
    await page.locator('#save-rent-calculation').click();
    const saved = await page.evaluate(() => window.rpRentCalculations.read()['LAM-01']);
    assert.equal(saved.inputs.saturation, 25);
    assert.equal(saved.inputs.marketCounts.health, 5);
    assert(Math.abs(saved.outputs.inflationApplied - .05) < 1e-9);
    assert(Math.abs(saved.outputs.hist) < 1e-9);
    assert(Math.abs((saved.outputs.publication - saved.outputs.floor) / saved.outputs.target - .2) < 1e-9);
    await page.evaluate(() => document.fonts.ready);
    const geometry = await paper.evaluate(e => ({ height: e.clientHeight, bottom: e.lastElementChild.getBoundingClientRect().bottom - e.getBoundingClientRect().top, padding: parseFloat(getComputedStyle(e).paddingBottom) }));
    assert(geometry.bottom <= geometry.height - geometry.padding + 2, JSON.stringify(geometry));
    await page.emulateMedia({ media: 'print' });
    await paper.screenshot({ path: '.cache/rent-audit-report.png' });
    await page.emulateMedia({ media: 'screen' });
    await page.locator('#rent-calculation-dialog').screenshot({ path: '.cache/rent-audit-editor.png' });
    for (const width of [1600, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ media: 'print' });
      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 1);
      assert(pdf.toString('latin1').includes('612 792'));
      await page.emulateMedia({ media: 'screen' });
    }
    await page.setViewportSize({ width: 1600, height: 1100 });
    await page.locator('[data-close-calculator]').first().click();
    await page.locator('.view-calculation').first().click();
    assert.equal(await form.locator('[name=negotiationMargin]').inputValue(), '20');
    assert.equal(await form.locator('[name=inflation]').inputValue(), '5');
    assert((await page.locator('#rent-calculation-saved').innerText()).startsWith('Guardado'));
    // A new anniversary amount must refresh a saved comparable on reopening.
    await page.locator('[data-close-calculator]').first().click();
    await page.evaluate(() => { const rows = JSON.parse(localStorage.getItem('rp-rent-increase-history')); rows[0].newAmount = 16000; localStorage.setItem('rp-rent-increase-history', JSON.stringify(rows)); });
    await page.locator('.view-calculation').first().click();
    assert.equal(await form.locator('[name=comp1]').inputValue(), '160');
    assert((await page.locator('#rent-calculation-saved').innerText()).startsWith('Cambios sin guardar'));
    await page.locator('[data-close-calculator]').first().click();
    await page.evaluate(() => {
      const former = JSON.parse(localStorage.getItem('rp-former-tenants')); former.forEach(row => delete row.lastInvoiceDate);
      localStorage.setItem('rp-former-tenants', JSON.stringify(former)); localStorage.removeItem('rp-rent-increase-history');
      const record = window.rpRentCalculations.read()['LAM-01']; delete record.inputs.dateBasis;
      record.inputs.inflation = 8; record.inputs.compDate1 = '2020-01-01';
      localStorage.setItem('rp-vacancy-rent-calculations', JSON.stringify({ 'LAM-01': record }));
    });
    await page.locator('.view-calculation').first().click();
    assert.equal(await form.locator('[name=compDate1]').inputValue(), '');
    assert.equal(await form.locator('[name=inflation]').inputValue(), '0');
    await page.locator('[data-close-calculator]').first().click();
    await page.evaluate(() => {
      localStorage.removeItem('rp-vacancy-rent-calculations'); localStorage.removeItem('rp-former-tenants');
      localStorage.setItem('rp-local-detail:La Marina:L-05', JSON.stringify({ area: 100, rent: 20000, commercialName: 'Local activo', city: 'Mazatlán', business: 'Servicios' }));
      localStorage.setItem('rp-rent-increase-history', JSON.stringify([{ station: 'La Marina', localId: 'L-05', newAmount: 22000, adjustmentDate: new Date().getFullYear() + '-01-01' }]));
    });
    await page.locator('.view-calculation').first().click();
    assert.equal(await form.locator('[name=comp1]').inputValue(), '220');
    assert((await paper.innerText()).includes('Local activo'));
    assert.deepEqual(errors, []);
    console.log('PASS card alignment, anniversary reference, inflation protection, business saturation, live controls, persistence, source refresh and one-page Letter PDF');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
