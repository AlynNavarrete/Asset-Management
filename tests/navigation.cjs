const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.CHECK_BASE || 'http://localhost:8000';
const sections = ['Home', 'Admin Vacantes', 'Calendario y Alertas', 'Calendario Anual', 'Alerta Nueva', 'Alertas Programadas', 'Directorio de Estaciones', 'Estacion', 'Detalle del Local', 'Usuarios', 'Configuracion', 'Inteligencia de Mercado'];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    // Styles, icons and core navigation must work without external CDNs.
    await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__oversizedLogo = false;
      const sample = () => {
        for (const logo of document.querySelectorAll('#rp-sidebar img')) {
          const style = getComputedStyle(logo);
          if (style.visibility !== 'hidden' && Number(style.opacity) > 0 && logo.getBoundingClientRect().width > 340) window.__oversizedLogo = true;
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    for (const section of sections) {
      const response = await page.goto(`${base}/${encodeURIComponent(section)}/code.html`, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200, section);
      await page.locator('#rp-sidebar').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const state = await page.evaluate(() => ({ hidden: getComputedStyle(document.body).visibility === 'hidden', loading: document.documentElement.classList.contains('rp-app-loading'), oversized: window.__oversizedLogo, width: document.querySelector('#rp-sidebar').getBoundingClientRect().width, runtime: !!document.querySelector('script[src*="cdn.tailwindcss.com"]'), font: document.fonts.check('16px Inter'), icons: document.fonts.check('24px "Material Symbols Outlined"') }));
      assert(!state.hidden && !state.loading && !state.oversized && !state.runtime, `${section}: ${JSON.stringify(state)}`);
      assert(state.width >= 60 && state.width <= 310 && state.font && state.icons, section);
      console.log(`PASS section: ${section}`);
    }
    await page.goto(`${base}/Admin%20Vacantes/code.html`, { waitUntil: 'domcontentloaded' });
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const view of ['available', 'approved', 'commercial', 'calculation', 'summary']) {
        await page.locator(`[data-vacancy-view="${view}"]`).click();
        await page.waitForFunction(() => !document.querySelector('#vacancies-table-card').hasAttribute('aria-busy'));
        assert.equal(await page.locator('[data-vacancy-view].is-active').getAttribute('data-vacancy-view'), view);
      }
    }
    await page.evaluate(() => { for (let i = 0; i < 30; i++) document.querySelector(`[data-vacancy-view="${i % 2 ? 'calculation' : 'available'}"]`).click(); });
    await page.locator('#vacancy-calculation-body tr').first().waitFor();
    assert.equal(await page.locator('#vacancy-calculation-body tr').count(), 42);
    assert.equal(await page.locator('.is-changing-view').count(), 0);
    console.log('PASS rapid vacancy tabs');

    await page.goto(`${base}/Home/code.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.addEventListener('click', () => setTimeout(() => sessionStorage.setItem('navigation-test-outgoing', JSON.stringify({ path: location.pathname, visible: !document.documentElement.classList.contains('rp-app-loading') && getComputedStyle(document.body).visibility !== 'hidden' })), 50), { once: true });
    });
    const target = '**/Calendario%20y%20Alertas/code.html';
    let delayed = false;
    await page.route(target, async route => {
      if (route.request().isNavigationRequest()) { delayed = true; await new Promise(resolve => setTimeout(resolve, 800)); }
      await route.continue();
    });
    await page.locator('#rp-sidebar a[href*="Calendario"]').first().click();
    await page.waitForURL('**/Calendario%20y%20Alertas/code.html', { waitUntil: 'domcontentloaded' });
    assert(delayed);
    assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('navigation-test-outgoing'))), { path: '/Home/code.html', visible: true });
    await page.unroute(target);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    assert(await page.evaluate(() => getComputedStyle(document.body).visibility !== 'hidden'));
    await page.goForward({ waitUntil: 'domcontentloaded' });
    assert(await page.evaluate(() => getComputedStyle(document.body).visibility !== 'hidden'));
    for (const section of ['Calendario Anual', 'Alerta Nueva', 'Alertas Programadas', 'Calendario y Alertas']) {
      const href = `/${encodeURIComponent(section)}/code.html`;
      await page.locator(`.rp-module-tabs a[href="${href}"]`).click();
      await page.waitForURL(`${base}${href}`, { waitUntil: 'domcontentloaded' });
      assert(await page.evaluate(() => !document.documentElement.classList.contains('rp-app-loading') && !window.__oversizedLogo));
    }
    await page.evaluate(() => { window.__sameTabCheck = true; });
    await page.locator('.rp-module-tabs a[href="/Calendario%20y%20Alertas/code.html"]').click();
    assert(await page.evaluate(() => window.__sameTabCheck));
    console.log('PASS calendar internal tabs and current-tab click without reloading');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.documentElement.classList.add('rp-dark'));
    assert(await page.locator('#rp-sidebar').isVisible());
    assert.deepEqual(errors, []);
    console.log('PASS slow navigation keeps current screen, back/forward, mobile/dark, no JS errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
