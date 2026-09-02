const savedRpTheme = localStorage.getItem('rp-theme') || 'light';
document.documentElement.classList.toggle('rp-dark', savedRpTheme === 'dark');

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = localStorage.getItem('rp-user-name') || 'Alyn';
  if (!localStorage.getItem('rp-user-name')) localStorage.setItem('rp-user-name', currentUser);
  document.querySelectorAll('img[alt*="Executive User"]').forEach((image) => {
    image.alt = `Foto de perfil de ${currentUser}`;
    image.title = currentUser;
  });
  document.querySelectorAll('.user-name, .settings-user > span').forEach((label) => label.textContent = currentUser);
  document.querySelectorAll('p, span, div').forEach((element) => {
    if (element.children.length) return;
    const value = element.textContent.trim();
    if (value === 'Executive User') element.textContent = currentUser;
    if (value === 'J. Director') element.textContent = currentUser;
    if (value === 'EU' || value === 'US') element.textContent = 'AL';
  });
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/sidebar.css?v=20260820-market-intelligence';
  document.head.appendChild(style);

  const currentPath = decodeURIComponent(window.location.pathname).toLowerCase();
  if (currentPath.includes('calendario anual')) document.body.classList.add('calendar-annual-page');
  if (currentPath.includes('alerta nueva')) document.body.classList.add('new-alert-page');
  const query = new URLSearchParams(window.location.search);
  const selectedStation = query.get('station');
  const selectedCity = query.get('city');
  const items = [
    { label: 'Inicio', icon: 'home', href: '/Home/code.html', match: '/home/' },
    { label: 'Estaciones', icon: 'location_city', href: '/Directorio%20de%20Estaciones/code.html', match: ['directorio de estaciones', '/estacion/', 'detalle del local'] },
    { label: 'Calendario y Alertas', icon: 'calendar_month', href: '/Calendario%20y%20Alertas/code.html', match: ['calendario y alertas', 'calendario anual', 'alerta nueva', 'alertas programadas'] },
    { label: 'Administración de Vacantes', icon: 'domain_disabled', href: '/Admin%20Vacantes/code.html', match: ['admin vacantes','inteligencia de mercado','calculo de vacantes'] },
    { label: 'Usuarios', icon: 'group', href: '/Usuarios/code.html', match: '/usuarios/' }
  ];

  // Warm the static pages while the browser is idle so changing modules does
  // not wait for the next HTML document to start downloading.
  const prefetchMainRoutes = () => items.forEach(({ href }) => {
    if (href === window.location.pathname) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = 'document';
    document.head.appendChild(link);
  });
  if ('requestIdleCallback' in window) window.requestIdleCallback(prefetchMainRoutes, { timeout: 1800 });
  else window.setTimeout(prefetchMainRoutes, 600);

  const matches = (rule) => (Array.isArray(rule) ? rule : [rule]).some((part) => currentPath.includes(part));
  const menu = items.map((item) => `
    <a class="rp-nav-item ${matches(item.match) ? 'is-active' : ''}" href="${item.href}" title="${item.label}">
      <span class="material-symbols-outlined rp-nav-icon">${item.icon}</span>
      <span class="rp-nav-label">${item.label}</span>
    </a>`).join('');

  const sidebar = document.createElement('aside');
  sidebar.id = 'rp-sidebar';
  sidebar.setAttribute('aria-label', 'Navegación principal');
  sidebar.innerHTML = `
    <div class="rp-brand">
      <img src="/assets/redpetroil-logo.png" alt="Redpetroil" class="rp-logo">
      <img src="/assets/redpetroil-icon.png" alt="" class="rp-logo-mini" aria-hidden="true">
      <div class="rp-product-name">Asset Management</div>
    </div>
    <nav class="rp-menu">${menu}</nav>
    <div class="rp-footer">
      <a class="rp-nav-item ${currentPath.includes('/configuracion/') ? 'is-active' : ''}" href="/Configuracion/code.html" title="Configuración">
        <span class="material-symbols-outlined rp-nav-icon">settings</span><span class="rp-nav-label">Configuración</span>
      </a>
      <a class="rp-nav-item" href="#" data-action="logout" title="Cerrar sesión">
        <span class="material-symbols-outlined rp-nav-icon">logout</span><span class="rp-nav-label">Cerrar sesión</span>
      </a>
    </div>`;

  const oldSidebar = Array.from(document.body.children).find((element) =>
    (element.tagName === 'NAV' || element.tagName === 'ASIDE') && element.querySelector('a')
  );
  if (oldSidebar) oldSidebar.remove();

  const content = document.body.firstElementChild;
  if (content) content.classList.add('rp-page-content');
  document.body.insertBefore(sidebar, content);

  sidebar.querySelector('[data-action="logout"]').addEventListener('click', (event) => {
    event.preventDefault();
    localStorage.removeItem('rp-authenticated');
    window.location.href = '/Login/code.html';
  });

  const pageContent = document.querySelector('.rp-page-content');
  if (pageContent) {
    const oldTopbar = [...pageContent.children].find((element) => element.tagName === 'HEADER');
    if (oldTopbar) oldTopbar.remove();
    const topbar = document.createElement('header');
    topbar.id = 'rp-topbar';
    topbar.innerHTML = `
      <span class="rp-topbar-orbs" aria-hidden="true"><i></i><i></i><i></i></span>
      <label class="rp-topbar-search">
        <span class="material-symbols-outlined">search</span>
        <input id="rp-global-search" type="search" placeholder="Buscar estaciones, locales, contratos..." aria-label="Buscar en la página" autocomplete="off" aria-controls="rp-search-results" aria-expanded="false">
      </label>
      <section id="rp-search-results" class="rp-search-results" aria-label="Resultados de búsqueda" hidden></section>
      <div class="rp-topbar-actions">
        <button id="rp-notifications" class="rp-topbar-icon" type="button" aria-label="Ver notificaciones">
          <span class="material-symbols-outlined">notifications</span><i></i>
        </button>
        <section id="rp-notifications-menu" aria-label="Notificaciones" hidden>
          <header><div><strong>Notificaciones</strong><small>3 pendientes</small></div><button type="button" data-mark-read>Marcar como leídas</button></header>
          <div class="rp-notification-list">
            <a href="/Calendario%20Anual/code.html" class="is-unread"><span class="material-symbols-outlined">event_busy</span><div><strong>Vencimiento de Rico’s</strong><p>El contrato vence el 30 de septiembre de 2026.</p><small>Calendario · Alta</small></div></a>
            <a href="/Calendario%20Anual/code.html" class="is-unread"><span class="material-symbols-outlined">notifications_active</span><div><strong>Alerta preventiva programada</strong><p>Aviso de Rico’s configurado 60 días antes.</p><small>1 de agosto de 2026</small></div></a>
            <a href="/Admin%20Vacantes/code.html" class="is-unread"><span class="material-symbols-outlined">domain_disabled</span><div><strong>Locales disponibles</strong><p>Hay 42 vacantes registradas para seguimiento.</p><small>Administración de Vacantes</small></div></a>
          </div>
          <a class="rp-notifications-all" href="/Calendario%20y%20Alertas/code.html">Ver todas las alertas <span class="material-symbols-outlined">arrow_forward</span></a>
        </section>
        <span class="rp-topbar-divider" aria-hidden="true"></span>
        <div class="rp-profile">
          <button id="rp-profile-button" type="button" aria-haspopup="menu" aria-expanded="false">
            <span class="rp-avatar">AL</span><span class="rp-profile-name">${currentUser}</span><span class="material-symbols-outlined">expand_more</span>
          </button>
          <div id="rp-profile-menu" role="menu" hidden>
            <div><strong>${currentUser}</strong><small>AlynNavarrete</small></div>
            <a href="/Configuracion/code.html" role="menuitem"><span class="material-symbols-outlined">settings</span>Configuración</a>
            <button type="button" role="menuitem" data-profile-logout><span class="material-symbols-outlined">logout</span>Cerrar sesión</button>
          </div>
        </div>
      </div>`;
    pageContent.insertBefore(topbar, pageContent.firstChild);

    const profileButton = topbar.querySelector('#rp-profile-button');
    const profileMenu = topbar.querySelector('#rp-profile-menu');
    const notificationsButton = topbar.querySelector('#rp-notifications');
    const notificationsMenu = topbar.querySelector('#rp-notifications-menu');
    const closeProfile = () => { profileMenu.hidden = true; profileButton.setAttribute('aria-expanded', 'false'); };
    const closeNotifications = () => { notificationsMenu.hidden = true; notificationsButton.setAttribute('aria-expanded','false'); };
    profileButton.addEventListener('click', (event) => {
      event.stopPropagation(); const open = profileMenu.hidden; profileMenu.hidden = !open; profileButton.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (event) => { if (!topbar.querySelector('.rp-profile').contains(event.target)) closeProfile(); if (!notificationsMenu.contains(event.target) && !notificationsButton.contains(event.target)) closeNotifications(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeProfile(); closeNotifications(); } });
    topbar.querySelector('[data-profile-logout]').addEventListener('click', () => {
      localStorage.removeItem('rp-authenticated'); window.location.href = '/Login/code.html';
    });
    notificationsButton.setAttribute('aria-haspopup','true'); notificationsButton.setAttribute('aria-expanded','false');
    notificationsButton.addEventListener('click', (event) => { event.stopPropagation(); const open=notificationsMenu.hidden; closeProfile(); notificationsMenu.hidden=!open; notificationsButton.setAttribute('aria-expanded',String(open)); });
    notificationsMenu.querySelector('[data-mark-read]').addEventListener('click', () => { notificationsMenu.querySelectorAll('.is-unread').forEach((item)=>item.classList.remove('is-unread')); notificationsButton.classList.add('has-no-unread'); notificationsMenu.querySelector('header small').textContent='Sin pendientes'; });
    const globalSearch=topbar.querySelector('#rp-global-search'),searchResults=topbar.querySelector('#rp-search-results');
    const normalizeSearch = (value) => String(value).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const stationCatalog=[['La Marina','Mazatlán'],['Cerritos','Mazatlán'],['Cardones','Mazatlán'],['Victorica','Mazatlán'],['Munich Estadio','Mazatlán'],['Flores Magón','Mazatlán'],['Colosio','Mazatlán'],['Sábalo','Mazatlán'],['Aeropuerto','Mazatlán'],['La Urraca','Mazatlán'],['12 de Mayo','Mazatlán'],['Foresta','Mazatlán'],['Urbi Villa','Mazatlán'],['El Habal','Mazatlán'],['Las Habas','Mazatlán'],['Conchi','Mazatlán'],['Juan Carrasco','Mazatlán'],['Grijalva UAS','Mazatlán'],['Concordia','Concordia'],['Rosario','Rosario'],['Escuinapa','Escuinapa'],['Malecón','Culiacán'],['Madero','Culiacán'],['Patria','Culiacán'],['Bellavista','Culiacán'],['Revolución','Culiacán'],['Revolución','Guasave'],['Cuauhtemoc','Guasave'],['Pericos','Mocorito'],['La Colorada','Hermosillo, Sonora'],['Gobernador Curiel','Tlaquepaque, Jalisco']];
    const searchCatalog=[
      {title:'Directorio de Estaciones',meta:'Estaciones · vista general',icon:'location_city',href:'/Directorio%20de%20Estaciones/code.html',terms:'directorio estaciones ciudades marcas'},
      {title:'Locales disponibles',meta:'Administración de Vacantes',icon:'domain_disabled',href:'/Admin%20Vacantes/code.html?view=available',terms:'vacantes renta superficie disponibles'},
      {title:'Propuestas aprobadas',meta:'Seguimiento comercial',icon:'verified',href:'/Admin%20Vacantes/code.html?view=approved',terms:'propuestas aprobadas prospectos seguimiento'},
      {title:'Calendario y Alertas',meta:'Contratos y vencimientos',icon:'calendar_month',href:'/Calendario%20y%20Alertas/code.html',terms:'calendario alertas contratos vencimientos aniversarios'},
      {title:'Rico’s · La Marina',meta:'Contrato · próximo vencimiento',icon:'description',href:'/Calendario%20y%20Alertas/code.html',terms:'ricos rico la marina contrato vencimiento'},
      {title:'OXXO Revolución',meta:'Contrato · 31 dic 2026',icon:'description',href:'/Calendario%20y%20Alertas/code.html',terms:'oxxo revolucion contrato'},
      {title:'Administración de Usuarios',meta:'Usuarios y responsables',icon:'group',href:'/Usuarios/code.html',terms:'usuarios responsables alyn ana rodriguez'},
      {title:'Configuración',meta:'Preferencias y modo oscuro',icon:'settings',href:'/Configuracion/code.html',terms:'configuracion ajustes modo noche oscuro'}
    ];
    stationCatalog.forEach(([station,city])=>searchCatalog.push({title:`Estación ${station}`,meta:city,icon:'local_gas_station',href:`/Estacion/code.html?station=${encodeURIComponent(station)}&city=${encodeURIComponent(city)}`,terms:`${station} ${city} estación`}));
    const closeSearchResults=()=>{searchResults.hidden=true;globalSearch.setAttribute('aria-expanded','false');};
    const showSearchResults=(term)=>{if(!term){closeSearchResults();return;}const matches=searchCatalog.filter(item=>normalizeSearch(`${item.title} ${item.meta} ${item.terms}`).includes(term)).slice(0,8);searchResults.innerHTML=matches.length?matches.map(item=>`<a href="${item.href}"><span class="material-symbols-outlined">${item.icon}</span><span><strong>${item.title}</strong><small>${item.meta}</small></span><span class="material-symbols-outlined">arrow_forward</span></a>`).join(''):`<div class="rp-search-empty"><span class="material-symbols-outlined">search_off</span><strong>Sin coincidencias</strong><small>Prueba con una estación, ciudad, local o contrato.</small></div>`;searchResults.hidden=false;globalSearch.setAttribute('aria-expanded','true');};
    globalSearch.addEventListener('input', (event) => {
      const term = normalizeSearch(event.target.value.trim());
      const targets = pageContent.querySelectorAll('tbody tr, [data-station-card], [data-station-row], [data-summary-route], [data-search-item]');
      targets.forEach((target) => target.hidden = Boolean(term) && !normalizeSearch(`${target.dataset.searchText || ''} ${target.textContent}`).includes(term));
      window.dispatchEvent(new CustomEvent('rp:global-search', { detail:{ term } }));
      showSearchResults(term);
    });
    globalSearch.addEventListener('focus',()=>showSearchResults(normalizeSearch(globalSearch.value.trim())));
    globalSearch.addEventListener('keydown',(event)=>{if(event.key==='Enter'){const first=searchResults.querySelector('a');if(first){event.preventDefault();location.href=first.href;}}if(event.key==='Escape')closeSearchResults();});
    document.addEventListener('click',(event)=>{if(!event.target.closest('.rp-topbar-search')&&!searchResults.contains(event.target))closeSearchResults();});
  }

  document.querySelectorAll('.rp-page-content a[href="#"]').forEach((link) => {
    const label = link.textContent.replace(/\s+/g, ' ').trim();
    const route = items.find((item) => label === item.label || label.endsWith(item.label));
    if (route) link.href = route.href;
    if (label === 'Estación Las Habas' || label === 'EstaciÃ³n Las Habas') link.href = '/Estacion/code.html';
  });

  const makeNavigable = (element, destination, accessibleName) => {
    element.classList.add('rp-linked-item');
    element.setAttribute('role', 'link');
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', accessibleName);
    element.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, select')) return;
      window.location.href = destination;
    });
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.location.href = destination;
      }
    });
  };

  const isCalendarModule = ['calendario y alertas', 'calendario anual', 'alerta nueva', 'alertas programadas']
    .some((part) => currentPath.includes(part));
  if (isCalendarModule) {
    const tabs = document.createElement('nav');
    tabs.className = 'rp-module-tabs';
    tabs.setAttribute('aria-label', 'Secciones de Calendario y Alertas');
    const moduleTabs = [
      ['Resumen', '/Calendario%20y%20Alertas/code.html', 'calendario y alertas'],
      ['Calendario anual', '/Calendario%20Anual/code.html', 'calendario anual'],
      ['Nueva alerta', '/Alerta%20Nueva/code.html', 'alerta nueva'],
      ['Alertas programadas', '/Alertas%20Programadas/code.html', 'alertas programadas']
    ];
    tabs.innerHTML = moduleTabs.map(([label, href, match]) =>
      `<a href="${href}" class="${currentPath.includes(match) ? 'is-active' : ''}">${label}</a>`
    ).join('');
    const modulePage = document.querySelector('.rp-page-content');
    const sharedTopbar = modulePage?.querySelector(':scope > #rp-topbar');
    if (modulePage && sharedTopbar) sharedTopbar.insertAdjacentElement('afterend', tabs);
  }

  if (currentPath.includes('calendario anual')) {
    const stationCatalog = [
      ['La Marina','Mazatlán'],['Cerritos','Mazatlán'],['Cardones','Mazatlán'],['Victorica','Mazatlán'],['Munich Estadio','Mazatlán'],['Flores Magón','Mazatlán'],['Colosio','Mazatlán'],['Sábalo','Mazatlán'],['Aeropuerto','Mazatlán'],['La Urraca','Mazatlán'],['12 de Mayo','Mazatlán'],['Foresta','Mazatlán'],['Urbi Villa','Mazatlán'],['El Habal','Mazatlán'],['Las Habas','Mazatlán'],['Conchi','Mazatlán'],['Juan Carrasco','Mazatlán'],['Grijalva UAS','Mazatlán'],['Concordia','Concordia'],['Rosario','Rosario'],['Escuinapa','Escuinapa'],['Malecón','Culiacán'],['Madero','Culiacán'],['Patria','Culiacán'],['Bellavista','Culiacán'],['Revolución','Culiacán'],['Revolución','Guasave'],['Cuauhtemoc','Guasave'],['Pericos','Mocorito'],['La Colorada','Hermosillo, Sonora'],['Gobernador Curiel','Tlaquepaque, Jalisco']
    ];
    const tenantCatalog = ['Oxxo','Kiosko','Farmacia Moderna','Restaurantes','Tiendas especializadas','Oficinas','Estacionamiento'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const startYear = 2026;
    const endYear = 2041;
    const responsibleCatalog=(()=>{let users=[];try{users=JSON.parse(localStorage.getItem('rp-system-users')||'[]');}catch{}const names=[localStorage.getItem('rp-user-name')||'Alyn','Ana Rodríguez',...users.filter(user=>user.status!=='Inactivo').map(user=>user.name)].filter(Boolean);return[...new Set(names)];})();
    const events = {
      '0-12': { color: '#eab308', type: 'Aniversario', local: 'Rico’s', tenant:'Restaurantes', station: 'La Marina', city:'Mazatlán', responsible:responsibleCatalog[0] },
      '2-18': { color: '#0050cb', type: 'Revisión documental', local: 'Farmacia Moderna', tenant:'Farmacia Moderna', station: 'Cerritos', city:'Mazatlán', responsible:responsibleCatalog[1%responsibleCatalog.length] },
      '4-22': { color: '#eab308', type: 'Aniversario', local: 'Kiosko', tenant:'Kiosko', station: 'Munich Estadio', city:'Mazatlán', responsible:responsibleCatalog[2%responsibleCatalog.length] },
      '7-1': { color: '#0050cb', type: 'Alerta preventiva · 60 días antes', local: 'Rico’s', tenant:'Restaurantes', station: 'La Marina', city:'Mazatlán', responsible:responsibleCatalog[0] },
      '7-17': { color: '#0050cb', type: 'Seguimiento de renovación', local: 'Oficinas', tenant:'Oficinas', station: 'Colosio', city:'Mazatlán', responsible:responsibleCatalog[1%responsibleCatalog.length] },
      '8-30': { color: '#ba1a1a', type: 'Vencimiento', local: 'Rico’s', tenant:'Restaurantes', station: 'La Marina', city:'Mazatlán', responsible:responsibleCatalog[0] },
      '9-18': { color: '#ba1a1a', type: 'Vencimiento', local: 'Farmacia Moderna', tenant:'Farmacia Moderna', station: 'Cerritos', city:'Mazatlán', responsible:responsibleCatalog[1%responsibleCatalog.length] },
      '10-21': { color: '#eab308', type: 'Aniversario', local: 'OXXO', tenant:'Oxxo', station: 'Victorica', city:'Mazatlán', responsible:responsibleCatalog[2%responsibleCatalog.length] }
    };
    const calendarGrid = document.querySelector('.rp-page-content .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4');

    const renderCalendar = (year) => {
      if (!calendarGrid) return;
      calendarGrid.innerHTML = monthNames.map((month, monthIndex) => {
        const firstDay = new Date(year, monthIndex, 1).getDay();
        const mondayOffset = (firstDay + 6) % 7;
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const blanks = '<div aria-hidden="true"></div>'.repeat(mondayOffset);
        const days = Array.from({ length: daysInMonth }, (_, dayIndex) => {
          const day = dayIndex + 1;
          const event = year === startYear ? events[`${monthIndex}-${day}`] : null;
          const date = `${day} de ${month} de ${year}`;
          const eventClass = event?.type === 'Vencimiento' ? ' rp-contract-expiry-day' : '';
          return `<button type="button" class="rp-calendar-day${eventClass}" aria-label="${date}${event ? `, ${event.type}, ${event.local}, estación ${event.station}` : ''}">
            <span>${day}</span>${event ? `<span class="rp-event-marker" data-search-item data-search-text="${event.local} ${event.tenant} ${event.station} ${event.city} ${event.type} ${event.responsible}" data-tenant="${event.tenant}" data-station="${event.station}" data-city="${event.city}" data-responsible="${event.responsible}" aria-hidden="true">
              <span class="rp-event-dot" style="background:${event.color}" aria-hidden="true"></span>
              <span class="rp-event-tooltip" role="tooltip">
                <strong>${event.local}</strong>
                <span><b>Inquilino:</b> ${event.tenant}</span>
                <span><b>Estación:</b> ${event.station}</span>
                <span><b>Ciudad:</b> ${event.city}</span>
                <span><b>Tipo:</b> ${event.type}</span>
                <span><b>Responsable:</b> ${event.responsible}</span>
              </span>
            </span>` : ''}
          </button>`;
        }).join('');
        return `<section class="rp-month" aria-labelledby="month-${monthIndex}">
          <header><h3 id="month-${monthIndex}">${month}</h3></header>
          <div class="rp-month-grid">
            ${weekDays.map((day) => `<div class="rp-weekday">${day}</div>`).join('')}
            ${blanks}${days}
          </div>
        </section>`;
      }).join('');
      const subtitle = document.querySelector('.rp-page-content h2 + p');
      if (subtitle) subtitle.textContent = `Vista de vencimientos y alertas comerciales ${year}`;
    };

    if (calendarGrid) {
      const filters = document.querySelector('.rp-page-content h2')?.closest('.flex.flex-col')?.querySelector('.flex.flex-wrap');
      const catalogSelects = filters ? [...filters.querySelectorAll('select')] : [];
      const tenantFilter = catalogSelects[0];
      const cityFilter = catalogSelects[1];
      const responsibleFilter = catalogSelects[2];
      const cityCatalog = [...new Set(stationCatalog.map(([, city]) => city))];
      if (tenantFilter) { tenantFilter.setAttribute('aria-label','Filtrar por inquilino'); tenantFilter.innerHTML = `<option value="">Todos los Inquilinos</option>${tenantCatalog.map((tenant) => `<option value="${tenant}">${tenant}</option>`).join('')}`; }
      if (cityFilter) cityFilter.innerHTML = `<option value="">Todas las Ciudades</option>${cityCatalog.map((city) => `<option value="${city}">${city}</option>`).join('')}`;
      if (responsibleFilter) { responsibleFilter.setAttribute('aria-label','Filtrar por responsable'); responsibleFilter.innerHTML = `<option value="">Todos los responsables</option>${responsibleCatalog.map(name=>`<option value="${name}">${name}</option>`).join('')}`; }
      const applyCalendarFilters = () => {
        const normalize = (value) => value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const searchTerm = normalize(document.getElementById('rp-global-search')?.value.trim() || '');
        document.querySelectorAll('.rp-event-marker').forEach((marker) => {
          const matchesSearch = !searchTerm || normalize(marker.dataset.searchText || '').includes(searchTerm);
          const matchesTenant = !tenantFilter?.value || marker.dataset.tenant === tenantFilter.value;
          const matchesCity = !cityFilter?.value || marker.dataset.city === cityFilter.value;
          const matchesResponsible = !responsibleFilter?.value || marker.dataset.responsible === responsibleFilter.value;
          const visible=matchesSearch && matchesTenant && matchesCity && matchesResponsible;marker.hidden=!visible;marker.closest('.rp-calendar-day')?.classList.toggle('rp-event-filtered-out',!visible);
        });
      };
      [tenantFilter, cityFilter, responsibleFilter].forEach((select) => select?.addEventListener('change', applyCalendarFilters));
      window.addEventListener('rp:global-search', applyCalendarFilters);
      if (filters && !document.getElementById('rp-year-select')) {
        const yearWrapper = document.createElement('div');
        yearWrapper.className = 'relative';
        yearWrapper.innerHTML = `<label class="sr-only" for="rp-year-select">Seleccionar año</label>
          <select id="rp-year-select" class="appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-4 pr-10 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm">
            ${Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index)
              .map((year) => `<option value="${year}">${year}</option>`).join('')}
          </select>
          <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-sm">arrow_drop_down</span>`;
        filters.prepend(yearWrapper);
        yearWrapper.querySelector('select').addEventListener('change', (event) => {
          renderCalendar(Number(event.target.value));
          applyCalendarFilters();
        });
      }
      renderCalendar(startYear);
      applyCalendarFilters();
      calendarGrid.addEventListener('click',event=>{const day=event.target.closest('.rp-calendar-day');if(!day?.querySelector('.rp-event-marker'))return;calendarGrid.querySelectorAll('.rp-calendar-day.is-open').forEach(item=>{if(item!==day)item.classList.remove('is-open');});day.classList.toggle('is-open');});
    }
  }

  if (currentPath.includes('directorio de estaciones')) {
    const stations = [
      ['La Marina', 'Mazatlán'], ['Cerritos', 'Mazatlán'], ['Cardones', 'Mazatlán'],
      ['Victorica', 'Mazatlán'], ['Munich Estadio', 'Mazatlán'], ['Flores Magón', 'Mazatlán'],
      ['Colosio', 'Mazatlán'], ['Sábalo', 'Mazatlán'], ['Aeropuerto', 'Mazatlán'],
      ['La Urraca', 'Mazatlán'], ['12 de Mayo', 'Mazatlán'], ['Foresta', 'Mazatlán'],
      ['Urbi Villa', 'Mazatlán'], ['El Habal', 'Mazatlán'], ['Las Habas', 'Mazatlán'],
      ['Conchi', 'Mazatlán'], ['Juan Carrasco', 'Mazatlán'], ['Grijalva UAS', 'Mazatlán'],
      ['Concordia', 'Concordia'], ['Rosario', 'Rosario'], ['Escuinapa', 'Escuinapa'],
      ['Malecón', 'Culiacán'], ['Madero', 'Culiacán'], ['Patria', 'Culiacán'],
      ['Bellavista', 'Culiacán'], ['Revolución', 'Culiacán'], ['Revolución', 'Guasave'],
      ['Cuauhtemoc', 'Guasave'], ['Pericos', 'Mocorito'], ['La Colorada', 'Hermosillo, Sonora'],
      ['Gobernador Curiel', 'Tlaquepaque, Jalisco']
    ];
    const grid = document.querySelector('[data-stations-grid]');
    if (grid) {
      const stationImages = [...grid.querySelectorAll('[style*="background-image"]')]
        .map((image) => image.style.backgroundImage.slice(5, -2));
      grid.innerHTML = stations.map(([name, city]) => {
        const image = stationImages[stations.indexOf(stations.find((station) => station[0] === name && station[1] === city)) % stationImages.length];
        return `
          <article data-station-card data-station="${name}" data-city="${city}" class="bg-surface-container-lowest rounded-xl shadow-level-1 overflow-hidden border border-outline-variant/30 flex flex-col group hover:border-primary/50 transition-all">
            <div class="rp-station-card-heading">
              <div><h3>${name}</h3><span>${city}</span></div><span class="material-symbols-outlined">chevron_right</span>
            </div>
            <div class="rp-station-photo" style="background-image:url('${image}')" role="img" aria-label="Fotografía de la estación ${name}"></div>
            <div class="rp-station-stats">
              <span><b>—</b> locales</span><span><i></i><b>—</b> disponibles</span>
            </div>
          </article>`;
      }).join('');

      const table = document.createElement('div');
      table.id = 'stations-table-container'; table.className = 'rp-stations-table-wrap'; table.style.display = 'none';
      const money = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
      table.innerHTML = `<table class="rp-stations-table"><thead><tr><th>Estación</th><th>Ciudad</th><th>Marca</th><th>Locales</th><th>Disponibles</th><th class="rp-money-column">Ingreso Total</th><th class="rp-money-column">Costo m² Promedio</th><th></th></tr></thead><tbody>
        ${stations.map(([name, city], index) => {
          const totalIncome = 118000 + ((index * 37450) % 465000);
          const averageSquareMeterCost = 245 + ((index * 37) % 390);
          return `<tr data-station-row data-station="${name}" data-city="${city}"><td><strong>${name}</strong></td><td>${city}</td><td>Sin asignar</td><td>—</td><td><span class="rp-available-dot"></span>—</td><td class="rp-money-value"><strong>${money.format(totalIncome)}</strong><small>mensual</small></td><td class="rp-money-value"><strong>${money.format(averageSquareMeterCost)}</strong><small>por m²</small></td><td><span class="material-symbols-outlined">chevron_right</span></td></tr>`;
        }).join('')}
      </tbody></table>`;
      grid.insertAdjacentElement('afterend', table);
    }

    document.querySelectorAll('[data-station-card]').forEach((card) => {
      const name = card.dataset.station;
      makeNavigable(card, `/Estacion/code.html?station=${encodeURIComponent(name)}&city=${encodeURIComponent(card.dataset.city)}`, `Abrir estación ${name}`);
    });
    document.querySelectorAll('[data-station-row]').forEach((row) => {
      const name = row.dataset.station;
      makeNavigable(row, `/Estacion/code.html?station=${encodeURIComponent(name)}&city=${encodeURIComponent(row.dataset.city)}`, `Abrir estación ${name}`);
    });

    const gridButton = document.getElementById('stations-grid-view');
    const tableButton = document.getElementById('stations-table-view');
    const tableContainer = document.getElementById('stations-table-container');
    const exportButton = document.createElement('button');
    exportButton.id = 'export-stations-report';
    exportButton.type = 'button';
    exportButton.className = 'rp-stations-export';
    exportButton.innerHTML = '<span class="material-symbols-outlined">download</span>Exportar reporte';
    exportButton.hidden = true;
    tableButton?.parentElement?.insertAdjacentElement('beforebegin', exportButton);

    exportButton.addEventListener('click', () => {
      const table = tableContainer?.querySelector('table');
      if (!table) return;
      const exportTable = table.cloneNode(true);
      const exportRows = [...exportTable.querySelectorAll('tr')];
      [...table.querySelectorAll('tr')].forEach((row, index) => {
        if (row.hidden) exportRows[index]?.remove();
      });
      exportTable.querySelectorAll('tr').forEach((row) => row.lastElementChild?.remove());
      exportTable.querySelectorAll('.material-symbols-outlined').forEach((icon) => icon.remove());
      const workbook = `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#172033}table{border-collapse:collapse;width:100%}th{padding:11px 14px;color:#fff;background:#155e9e;border:1px solid #0d477b;text-align:left;font-weight:700}td{padding:10px 14px;border:1px solid #ccd7e4;vertical-align:middle}tbody tr:nth-child(even){background:#eef5fb}td:nth-child(6),td:nth-child(7),th:nth-child(6),th:nth-child(7){text-align:right}strong{font-weight:700}small{display:block;color:#64748b;margin-top:2px}</style></head><body>${exportTable.outerHTML}</body></html>`;
      const blob = new Blob([`\ufeff${workbook}`], { type:'application/vnd.ms-excel;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `directorio-estaciones-${new Date().toISOString().slice(0,10)}.xls`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      link.remove();
    });
    const setStationView = (view) => {
      const showGrid = view === 'grid';
      grid.style.display = showGrid ? 'grid' : 'none';
      tableContainer.style.display = showGrid ? 'none' : 'block';
      exportButton.hidden = showGrid;
      gridButton.setAttribute('aria-pressed', showGrid); tableButton.setAttribute('aria-pressed', !showGrid);
      gridButton.classList.toggle('rp-view-active', showGrid); tableButton.classList.toggle('rp-view-active', !showGrid);
      localStorage.setItem('rp-stations-view', view);
    };
    gridButton?.addEventListener('click', () => setStationView('grid'));
    tableButton?.addEventListener('click', () => setStationView('table'));
    if (grid && tableContainer) setStationView(localStorage.getItem('rp-stations-view') || 'grid');

    const searchInput = document.getElementById('station-search');
    const cityFilter = document.getElementById('station-city-filter');
    const normalize = (value) => value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filterStations = () => {
      const term = normalize(searchInput?.value.trim() || '');
      const city = normalize(cityFilter?.value || '');
      let visibleCount = 0;
      document.querySelectorAll('[data-station-card]').forEach((card) => {
        const searchable = normalize(`${card.dataset.station} ${card.dataset.city}`);
        const visible = (!term || searchable.includes(term)) && (!city || normalize(card.dataset.city) === city);
        card.hidden = !visible;
        card.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
      });
      document.querySelectorAll('[data-station-row]').forEach((row) => {
        const searchable = normalize(`${row.dataset.station} ${row.dataset.city}`);
        const visible = (!term || searchable.includes(term)) && (!city || normalize(row.dataset.city) === city);
        row.hidden = !visible;
        row.style.display = visible ? '' : 'none';
      });
      let empty = document.getElementById('station-filter-empty');
      if (!empty && grid) {
        empty = document.createElement('p'); empty.id = 'station-filter-empty'; empty.className = 'rp-filter-empty';
        empty.textContent = 'No se encontraron estaciones con estos filtros.';
        grid.insertAdjacentElement('afterend', empty);
      }
      if (empty) empty.hidden = visibleCount > 0;
    };
    searchInput?.addEventListener('input', filterStations);
    cityFilter?.addEventListener('change', filterStations);
  }

  if (currentPath.includes('/estacion/')) {
    const stationMapButton = document.getElementById('station-map-button');
    const mapStation = selectedStation || 'Las Habas';
    const mapCity = selectedCity || 'Mazatlán';
    const exactStationMaps = {
      'Urbi Villa|Mazatlán': 'https://www.google.com/maps/place/Redpetroil+Urbivilla/@23.2118715,-106.4041578,14z/data=!4m6!3m5!1s0x869f53d7a52eb323:0xc63c4c615774c964!8m2!3d23.2231986!4d-106.3733595!16s%2Fg%2F11j90_w1jr?entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D'
    };
    const stationMapUrl = exactStationMaps[`${mapStation}|${mapCity}`] ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Redpetroil ${mapStation}, ${mapCity}`)}`;
    if (stationMapButton) {
      stationMapButton.setAttribute('aria-label', `Abrir estación ${mapStation} en Google Maps`);
      stationMapButton.addEventListener('click', () => window.open(stationMapUrl, '_blank', 'noopener,noreferrer'));
    }
    if (selectedStation) {
      document.title = `Estación ${selectedStation} - Asset Management Comercial`;
      document.querySelectorAll('h2, h3, a, span, p').forEach((element) => {
        const text = element.textContent.trim();
        if (text === 'Estación Las Habas' || text === 'EstaciÃ³n Las Habas') element.textContent = `Estación ${selectedStation}`;
      });
      if (selectedCity) {
        const cityLabels = { 'Mazatlán':'Mazatlán, Sinaloa', 'Culiacán':'Culiacán, Sinaloa', 'Guasave':'Guasave, Sinaloa', 'Mocorito':'Mocorito, Sinaloa', 'Concordia':'Concordia, Sinaloa', 'Rosario':'Rosario, Sinaloa', 'Escuinapa':'Escuinapa, Sinaloa' };
        const location = cityLabels[selectedCity] || selectedCity;
        document.querySelectorAll('p').forEach((element) => {
          if (element.textContent.trim() === 'Mazatlán, Sinaloa') element.textContent = location;
        });
      }
    }
    document.querySelectorAll('.rp-page-content tbody tr').forEach((row) => {
      const local = row.querySelector('td')?.textContent.trim();
      if (!local) return;
      const stationParam = selectedStation ? `?station=${encodeURIComponent(selectedStation)}&city=${encodeURIComponent(selectedCity || '')}&local=${encodeURIComponent(local)}` : '';
      makeNavigable(row, `/Detalle%20del%20Local/code.html${stationParam}`, `Abrir detalle del local ${local}`);
    });
  }

  if (currentPath.includes('detalle del local') && selectedStation) {
    document.title = `${query.get('local') || 'Detalle del local'} · Estación ${selectedStation}`;
    document.querySelectorAll('.rp-page-content a, .rp-page-content span, .rp-page-content p').forEach((element) => {
      const text = element.textContent.trim();
      if (text === 'Estación Las Habas' || text === 'EstaciÃ³n Las Habas') element.textContent = `Estación ${selectedStation}`;
      if (text === 'Estación Las Habas, Local 3' || text === 'EstaciÃ³n Las Habas, Local 3') element.textContent = `Estación ${selectedStation}, ${query.get('local') || 'Local 3'}`;
    });
  }

  const stationSection = currentPath.includes('directorio de estaciones') ||
    currentPath.includes('/estacion/') || currentPath.includes('detalle del local');
  const fixedDashboard = document.body.classList.contains('alerts-page') || currentPath.includes('/home/') || currentPath === '/' || currentPath.includes('calendario anual') || currentPath.includes('alerta nueva') || currentPath.includes('/configuracion/') || currentPath.includes('inteligencia de mercado');
  if (!stationSection && !fixedDashboard) {
    const fitPageToViewport = () => {
      const page = document.querySelector('.rp-page-content');
      if (!page) return;
      const overflowAreas = [...page.querySelectorAll('[class*="overflow-y-auto"]')]
        .filter((element) => element.offsetParent !== null);
      let area = overflowAreas.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
      if (page.classList.contains('settings-shell')) area = page.querySelector('.settings-grid');
      if (!area) area = page.querySelector('main') || page;

      area.style.zoom = '1';
      area.style.width = '';
      const top = area.getBoundingClientRect().top;
      const availableHeight = Math.max(320, window.innerHeight - top - 10);
      const naturalHeight = area.scrollHeight;
      const scale = Math.min(1, availableHeight / Math.max(naturalHeight, 1));
      page.classList.add('rp-screen-fixed');
      area.classList.add('rp-fit-content');
      area.style.setProperty('--rp-fit-scale', scale.toFixed(3));
      area.style.zoom = scale.toFixed(3);
      area.style.width = `${(100 / scale).toFixed(2)}%`;
    };
    window.setTimeout(fitPageToViewport, 120);
    window.addEventListener('resize', fitPageToViewport);
  }
});
