document.addEventListener('DOMContentLoaded', () => {
  const selectorCard = document.querySelector('.new-alert-selector');
  const formCard = document.querySelector('.new-alert-form');
  const previewCard = document.querySelector('.new-alert-preview');
  if (!selectorCard || !formCard || !previewCard) return;

  const stations = [
    ['La Marina','Mazatlán'],['Cerritos','Mazatlán'],['Cardones','Mazatlán'],['Victorica','Mazatlán'],['Munich Estadio','Mazatlán'],['Flores Magón','Mazatlán'],['Colosio','Mazatlán'],['Sábalo','Mazatlán'],['Aeropuerto','Mazatlán'],['La Urraca','Mazatlán'],['12 de Mayo','Mazatlán'],['Foresta','Mazatlán'],['Urbi Villa','Mazatlán'],['El Habal','Mazatlán'],['Las Habas','Mazatlán'],['Conchi','Mazatlán'],['Juan Carrasco','Mazatlán'],['Grijalva UAS','Mazatlán'],['Concordia','Concordia'],['Rosario','Rosario'],['Escuinapa','Escuinapa'],['Malecón','Culiacán'],['Madero','Culiacán'],['Patria','Culiacán'],['Bellavista','Culiacán'],['Revolución','Culiacán'],['Revolución','Guasave'],['Cuauhtemoc','Guasave'],['Pericos','Mocorito'],['La Colorada','Hermosillo, Sonora'],['Gobernador Curiel','Tlaquepaque, Jalisco']
  ];
  const tenants = ['Oxxo','Kiosko','Farmacia Moderna','Restaurantes','Tiendas especializadas','Oficinas','Estacionamiento'];
  const contracts = stations.map(([station, city], index) => {
    const tenant = index === 0 ? 'Restaurantes' : tenants[index % tenants.length];
    const local = index === 0 ? 'Rico’s' : `${tenant} ${String(index + 1).padStart(2,'0')}`;
    const expiry = index === 0 ? '2026-09-30' : `${2026 + (index % 4)}-${String((index % 12) + 1).padStart(2,'0')}-${String(10 + (index % 18)).padStart(2,'0')}`;
    return { id:`CTR-${String(8800 + index).padStart(4,'0')}`, local, tenant, station, city, expiry };
  });

  const search = selectorCard.querySelector('input[type="text"]');
  const selectorFilters = [...selectorCard.querySelectorAll('select')];
  const stationFilter = selectorFilters[0];
  const cityFilter = selectorFilters[1];
  const list = selectorCard.querySelector('.flex-1.overflow-y-auto');
  const cities = [...new Set(stations.map(([, city]) => city))];
  stationFilter.innerHTML = `<option value="">Todas las estaciones</option>${stations.map(([station, city]) => `<option value="${station}">${station} · ${city}</option>`).join('')}`;
  cityFilter.innerHTML = `<option value="">Todos los municipios</option>${cities.map((city) => `<option value="${city}">${city}</option>`).join('')}`;
  search.placeholder = 'Buscar local, contrato, inquilino o estación...';

  const formSelects = [...formCard.querySelectorAll('select')];
  const alertType = formSelects[0];
  const priority = formSelects[1];
  const titleInput = formCard.querySelector('input[type="text"]');
  const description = formCard.querySelector('textarea');
  const dateInput = formCard.querySelector('input[type="date"]');
  alertType.innerHTML = '<option>Vencimiento de Contrato</option><option>Alerta Preventiva (60 días)</option><option>Pago Mensual</option><option>Aniversario de Contrato</option><option>Incremento de Renta</option>';
  priority.innerHTML = '<option value="high">Alta (Roja)</option><option value="medium">Media (Amarilla)</option><option value="low">Baja (Azul)</option>';

  let selected = contracts[0];
  const normalize = (value) => value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const toDate = (value) => new Date(`${value}T00:00:00`);
  const formatDate = (value) => toDate(value).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
  const daysUntil = (value) => { const today = new Date(); today.setHours(0,0,0,0); return Math.ceil((toDate(value)-today)/86400000); };
  const isoOffset = (value, days) => { const date=toDate(value); date.setDate(date.getDate()+days); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };

  const templates = {
    'Vencimiento de Contrato': { priority:'high', subject:'Vencimiento de contrato', description:(c,d)=>`Iniciar la renovación del contrato de ${c.local} en la estación ${c.station}. Faltan ${d} días para su vencimiento; revisar renta, vigencia y documentación contractual.`, send:(c)=>c.expiry },
    'Alerta Preventiva (60 días)': { priority:'medium', subject:'Alerta preventiva', description:(c)=>`Preparar con 60 días de anticipación la revisión del contrato de ${c.local}. Confirmar condiciones de renovación, incremento de renta y expediente del inquilino.`, send:(c)=>isoOffset(c.expiry,-60) },
    'Pago Mensual': { priority:'medium', subject:'Pago mensual', description:(c)=>`Verificar el pago mensual de ${c.local} en la estación ${c.station}. Confirmar recepción, aplicación e identificación del comprobante correspondiente.`, send:()=>new Date().toISOString().slice(0,10) },
    'Aniversario de Contrato': { priority:'low', subject:'Aniversario de contrato', description:(c)=>`Revisar el aniversario contractual de ${c.local}, validar la vigencia de obligaciones y documentar cualquier actualización aplicable.`, send:(c)=>c.expiry },
    'Incremento de Renta': { priority:'high', subject:'Incremento de renta', description:(c)=>`Calcular y validar el incremento de renta de ${c.local} conforme a las condiciones pactadas y notificar al área responsable.`, send:(c)=>isoOffset(c.expiry,-30) }
  };

  const setPriorityColor = () => {
    priority.classList.remove('priority-high','priority-medium','priority-low');
    priority.classList.add(`priority-${priority.value}`);
  };
  const updateAutomation = () => {
    const type = alertType.value; const template = templates[type]; const remaining = daysUntil(selected.expiry);
    priority.value = template.priority; setPriorityColor();
    dateInput.value = template.send(selected);
    titleInput.value = `${template.subject}: ${selected.local} · ${selected.station}`;
    description.value = template.description(selected, remaining);
    const level = priority.options[priority.selectedIndex].textContent;
    previewCard.querySelector('div:last-child').innerHTML = `<div class="new-alert-email-meta"><strong>De:</strong> Asset Management RedPetroil &lt;no-reply@redpetroil.com&gt;<br><strong>Para:</strong> alyn@redpetroil.com; legal@redpetroil.com<br><strong>Asunto:</strong> [${level.split(' ')[0].toUpperCase()}] ${titleInput.value}</div><div class="new-alert-email-body"><p>Estimado equipo,</p><p>Se genera una alerta de <strong>${type}</strong> para el contrato <strong>${selected.id}</strong>, correspondiente a <strong>${selected.local}</strong> (${selected.tenant}) en la estación <strong>${selected.station}</strong>, ${selected.city}.</p><div class="new-alert-email-alert priority-${priority.value}">${type === 'Alerta Preventiva (60 días)' ? `Aviso programado 60 días antes del vencimiento del ${formatDate(selected.expiry)}.` : type === 'Vencimiento de Contrato' ? `${remaining >= 0 ? `Faltan ${remaining} días` : `Vencido hace ${Math.abs(remaining)} días`} para el vencimiento (${formatDate(selected.expiry)}).` : `Fecha programada: ${formatDate(dateInput.value)}.`}</div><p><em>Notas de gestión:</em> ${description.value}</p><a href="/Detalle%20del%20Local/code.html?station=${encodeURIComponent(selected.station)}&city=${encodeURIComponent(selected.city)}&local=${encodeURIComponent(selected.local)}">Ver expediente en el sistema</a></div>`;
  };

  const renderContracts = () => {
    const term=normalize(search.value.trim());
    const filtered=contracts.filter((c)=>(!term||normalize(`${c.local} ${c.id} ${c.tenant} ${c.station} ${c.city}`).includes(term))&&(!stationFilter.value||c.station===stationFilter.value)&&(!cityFilter.value||c.city===cityFilter.value));
    list.innerHTML=filtered.map((c)=>`<button type="button" class="new-contract-item ${c.id===selected.id?'is-selected':''}" data-contract-id="${c.id}"><span><strong>${c.local}</strong><small>${c.tenant} · ${c.id}</small><small>${c.station} · ${c.city}</small></span><span><b>${daysUntil(c.expiry)} días</b><small>${formatDate(c.expiry)}</small></span></button>`).join('') || '<p class="new-contract-empty">No se encontraron contratos.</p>';
  };
  list.addEventListener('click',(event)=>{const button=event.target.closest('[data-contract-id]');if(!button)return;selected=contracts.find((c)=>c.id===button.dataset.contractId);renderContracts();updateAutomation();});
  [search].forEach((control)=>control.addEventListener('input',renderContracts));
  [stationFilter,cityFilter].forEach((control)=>control.addEventListener('change',renderContracts));
  alertType.addEventListener('change',updateAutomation);
  priority.addEventListener('change',setPriorityColor);
  const saveButton=[...document.querySelectorAll('button')].find(button=>button.textContent.trim().includes('Guardar y Activar'));
  saveButton?.addEventListener('click',event=>{event.preventDefault();const key='rp-scheduled-alerts',saved=(()=>{try{return JSON.parse(localStorage.getItem(key)||'[]');}catch{return [];}})(),alert={id:`ALT-${Date.now()}`,type:alertType.value,local:selected.local,contractId:selected.id,station:selected.station,city:selected.city,scheduledDate:dateInput.value,recipients:['Alyn Ximena Reyes Navarrete','Área Legal'],recipientEmails:['alyn@redpetroil.com','legal@redpetroil.com'],priority:priority.value,title:titleInput.value,description:description.value,emailHtml:previewCard.querySelector('div:last-child').innerHTML,createdBy:localStorage.getItem('rp-user-name')||'Alyn',createdAt:new Date().toISOString()};saved.unshift(alert);localStorage.setItem(key,JSON.stringify(saved));window.location.href='/Alertas%20Programadas/code.html?created=1';});
  renderContracts(); updateAutomation();
});
