const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.CHECK_BASE || 'http://localhost:8000';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === new URL(base).origin) return route.continue();
      if (url.hostname === 'www.inegi.org.mx') return route.fulfill({ json: [
        { Nombre: 'Comida 1', Clase_actividad: 'Restaurante', Latitud: 23.2232, Longitud: -106.37336 },
        { Nombre: 'Comida 2', Clase_actividad: 'Cafetería', Latitud: 23.2242, Longitud: -106.37336 },
        { Nombre: 'Salud', Clase_actividad: 'Farmacia', Latitud: 23.2222, Longitud: -106.37336 },
        { Nombre: 'Fuera de 800m', Clase_actividad: 'Servicios', Latitud: 23.2322, Longitud: -106.37336 }
      ] });
      return route.abort();
    });
    await page.goto(base + '/Home/code.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('rp-denue-token', 'isolated-test-token'));
    await page.goto(base + '/Inteligencia%20de%20Mercado/code.html?local=LAM-01&station=La%20Marina', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => localStorage.getItem('rp-denue-analysis:La Marina:LAM-01'));
    const observed = await page.evaluate(() => JSON.parse(localStorage.getItem('rp-denue-analysis:La Marina:LAM-01')));
    assert.equal(observed.total, 3); assert.equal(observed.radius, 800);
    assert.equal(observed.counts.find(c => c.key === 'food').count, 2);
    assert.equal(observed.counts.find(c => c.key === 'service').count, 0);
    await page.evaluate(() => localStorage.removeItem('rp-denue-token'));
    await page.goto(base + '/Inteligencia%20de%20Mercado/code.html?local=NO-DATA&station=La%20Marina', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#denue-state').textContent.includes('Vista estimada'));
    assert.equal(await page.evaluate(() => localStorage.getItem('rp-denue-analysis:La Marina:NO-DATA')), null);
    await page.goto(base + '/Directorio%20de%20Estaciones/code.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#former-tenants-card button').click();
    const form = page.locator('#former-tenant-form');
    await form.locator('[name=tenant]').fill('Inquilino de prueba');
    await form.locator('[name=station]').selectOption('La Marina');
    await form.locator('[name=local]').fill('L-01');
    await form.locator('[name=area]').fill('100');
    await form.locator('[name=monthlyRent]').fill('22000');
    await form.locator('[name=lastInvoiceDate]').fill(new Date().getFullYear() + '-01-15');
    await form.locator('[name=exitReason]').selectOption('Normal');
    await form.locator('button[type=submit]').click();
    const former = await page.evaluate(() => JSON.parse(localStorage.getItem('rp-former-tenants'))[0]);
    assert.equal(former.lastInvoiceDate, new Date().getFullYear() + '-01-15');
    assert.equal(former.rentM2, 220);
    await page.goto(base + '/Detalle%20del%20Local/code.html?station=La%20Marina&local=L-06', { waitUntil: 'domcontentloaded' });
    const detail = await page.evaluate(() => JSON.parse(localStorage.getItem('rp-rent-comparable:La Marina:L-06')));
    assert(detail.area > 0 && detail.rent > 0);
    assert.deepEqual(errors, []);
    console.log('PASS DENUE 800m filtering, category counts, no demo data imported, and last invoice registration');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
