const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.CHECK_BASE || 'http://localhost:8000';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/Mexico_City' });
    await page.clock.install({ time: new Date('2026-09-22T12:00:00Z') });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/Home/code.html', { waitUntil: 'domcontentloaded' });
    const rows = page.locator('.home-activities-panel tbody tr');
    assert.deepEqual(await rows.locator('.home-priority').allTextContents(), ['Alta', 'Alta', 'Media', 'Baja']);
    assert.deepEqual(await page.locator('.home-expiry-panel tbody b').allTextContents(), ['9 días', '100 días']);
    // An overdue lower-priority task must remain below a future high-priority task.
    await page.getByRole('button', { name: 'Nueva actividad' }).click();
    const form = page.locator('#home-activity-form');
    await form.locator('[name=title]').fill('Prioridad alta futura');
    await form.locator('[name=station]').selectOption('Cerritos');
    await form.locator('[name=date]').fill('2026-12-01');
    await form.locator('[name=priority]').selectOption('high');
    await form.locator('button[type=submit]').click();
    assert((await rows.nth(1).innerText()).includes('Prioridad alta futura'));
    const taskId = await rows.nth(1).getAttribute('data-activity-id');
    await rows.nth(1).locator('button').press('Space');
    assert(page.url().includes('/Home/'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert(await page.locator(`[data-activity-id="${taskId}"]`).evaluate(e => e.classList.contains('home-task-complete')));
    await page.locator('[data-summary-kind=documents]').click();
    assert((await page.locator('#home-detail-dialog').innerText()).includes('Farmacia Marina'));
    await page.locator('#home-detail-dialog button').click();
    await page.locator('[data-summary-kind=expiry]').press('Enter');
    assert.equal(await page.locator('#home-detail-dialog tbody tr').count(), 2);
    await page.locator('#home-detail-dialog button').click();
    await page.locator('.home-expiry-panel a').first().click({ noWaitAfter: true });
    await page.waitForURL('**/Detalle%20del%20Local/code.html?**', { waitUntil: 'domcontentloaded' });
    const url = new URL(page.url()); assert.equal(url.searchParams.get('station'), 'La Marina'); assert.equal(url.searchParams.get('local'), 'L-01');
    assert((await page.locator('main').innerText()).includes("Rico's"));
    await page.goto(base + '/Home/code.html', { waitUntil: 'domcontentloaded' });
    // Profile edits feed the countdown and an expired contract is removed from upcoming.
    await page.evaluate(() => localStorage.setItem('rp-local-detail:La Marina:L-01', JSON.stringify({ commercialName: "Rico's", endDate: '2026-09-22', city: 'Mazatlán', status: 'Activo' })));
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('.home-expiry-panel b').first().innerText(), 'Vence hoy');
    await page.clock.fastForward(24 * 60 * 60 * 1000);
    assert.equal(await page.locator('.home-expiry-panel tbody tr').count(), 1);
    assert.equal(await page.locator('.home-expiry-panel b').innerText(), '99 días');
    await page.evaluate(() => localStorage.setItem('rp-stations-view', 'grid'));
    await page.locator('[data-summary-route*="view=table"]').click({ noWaitAfter: true });
    await page.waitForURL('**/Directorio%20de%20Estaciones/code.html?view=table', { waitUntil: 'domcontentloaded' });
    assert(await page.locator('#stations-table-container').isVisible());
    assert.equal(await page.locator('[data-stations-grid]').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS priority/date order, persistent completion, correct local links, live countdown, summary details and forced directory table');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
