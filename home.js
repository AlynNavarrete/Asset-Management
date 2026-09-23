document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('.rp-page-content main');
  if (!main) return;
  document.body.classList.add('home-page');
  const model=window.rpHomeData;
  const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const activityKey='rp-home-activities';
  const defaults=[
    {id:'renewal-rico',title:"Revisar renovación de Rico's",station:'La Marina',localId:'L-01',city:'Mazatlán',type:'Contrato',date:'2026-08-15',priority:'high'},
    {id:'increase-bike',title:'Aplicar incremento de Bike Line',station:'La Marina',type:'Incremento',date:'2026-09-10',priority:'medium'},
    {id:'file-marina',title:'Completar expediente de Farmacia Marina',station:'La Marina',type:'Expediente',date:'',description:'Documento fiscal pendiente',priority:'high'},
    {id:'photos-habas',title:'Actualizar fotografías de Local Habas',station:'Las Habas',type:'Vacancia',date:'2026-08-09',priority:'low',complete:true}
  ];
  let activitiesData=model.read(activityKey,defaults);
  if(!Array.isArray(activitiesData))activitiesData=defaults;
  const persist=()=>{try{localStorage.setItem(activityKey,JSON.stringify(activitiesData));return true;}catch{notify('No se pudo guardar la actividad en este navegador.');return false;}};
  const formatDate=value=>Number.isFinite(model.day(value))?new Date(value+'T00:00:00Z').toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}):'Sin fecha límite';
  const taskHref=item=>item.localId?model.localHref(item):'/Estacion/code.html?'+new URLSearchParams({station:item.station,city:item.city||''}).toString();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const visitorName = localStorage.getItem('rp-user-name') || 'Alyn';
  const dailyMessages = [
    `Disfruta tu domingo, ${visitorName}`,
    `Excelente inicio de semana, ${visitorName}`,
    `Que tengas un gran martes, ${visitorName}`,
    `Feliz miércoles, ${visitorName}`,
    `Que tengas un excelente jueves, ${visitorName}`,
    `Feliz viernes, ${visitorName}`,
    `Que disfrutes tu sábado, ${visitorName}`
  ];
  const intro = main.firstElementChild;
  if (intro) {
    intro.classList.add('home-greeting');
    const title = intro.querySelector('h2');
    const description = intro.querySelector('p');
    if (title) title.textContent = `${greeting}, ${visitorName}`;
    if (description) {
      description.textContent = dailyMessages[now.getDay()];
      const spark = document.createElement('span');
      spark.className = 'home-day-spark'; spark.textContent = '✦'; spark.setAttribute('aria-hidden','true');
      description.prepend(spark);
    }
    const orbs = document.createElement('div');
    orbs.className = 'home-greeting-orbs'; orbs.setAttribute('aria-hidden', 'true');
    orbs.innerHTML = '<i></i><i></i><i></i><i></i>';
    intro.appendChild(orbs);
  }
  const toast = document.createElement('div'); toast.className = 'home-toast'; toast.setAttribute('role','status'); document.body.appendChild(toast);
  const notify = (message) => { toast.textContent=message; toast.classList.add('visible'); window.setTimeout(()=>toast.classList.remove('visible'),2200); };
  const activityModal = document.createElement('div');
  activityModal.id = 'home-activity-modal'; activityModal.hidden = true;
  activityModal.innerHTML = `<section class="home-activity-dialog" role="dialog" aria-modal="true" aria-labelledby="home-activity-title">
    <header><div><h2 id="home-activity-title">Crear Nueva Actividad</h2><p>Registra una tarea y asigna su fecha de seguimiento.</p></div><button type="button" data-close-activity aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button></header>
    <form id="home-activity-form"><div class="home-modal-body">
      <label class="home-field home-field-wide"><span>Nombre de la actividad</span><input name="title" type="text" placeholder="Ej. Revisar renovación de contrato" required></label>
      <label class="home-field"><span>Estación</span><select name="station" required><option value="">Seleccionar estación</option><option>La Marina</option><option>Cerritos</option><option>Cardones</option><option>Victoria</option><option>Las Habas</option><option>Revolución</option></select></label>
      <label class="home-field"><span>Tipo de actividad</span><select name="type" required><option>Contrato</option><option>Incremento</option><option>Expediente</option><option>Vacancia</option><option>Mantenimiento</option></select></label>
      <label class="home-field"><span>Fecha límite</span><input name="date" type="date" required></label>
      <label class="home-field"><span>Prioridad</span><select name="priority" required><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></label>
      <label class="home-field home-field-wide"><span>Descripción</span><textarea name="description" rows="3" placeholder="Agrega indicaciones o información de seguimiento"></textarea></label>
    </div><footer><button type="button" class="home-modal-cancel" data-close-activity>Cancelar</button><button type="submit" class="home-modal-save">Guardar Actividad</button></footer></form>
  </section>`;
  document.body.appendChild(activityModal);
  const openActivityModal = () => { activityModal.hidden = false; activityModal.querySelector('input')?.focus(); };
  const closeActivityModal = () => { activityModal.hidden = true; };
  activityModal.querySelectorAll('[data-close-activity]').forEach((button) => button.addEventListener('click', closeActivityModal));
  activityModal.addEventListener('click', (event) => { if (event.target === activityModal) closeActivityModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !activityModal.hidden) closeActivityModal(); });
  const navigate = (element, href, label) => {
    element.classList.add('home-clickable'); element.tabIndex=0; element.setAttribute('role','link'); element.setAttribute('aria-label',label);
    const open=event=>{if(event.target!==element&&event.target.closest('button,a,input,select,textarea'))return;if(event.type==='keydown'&&event.target!==element)return;event.preventDefault();window.location.href=href;}; element.addEventListener('click',open); element.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')open(event);});
  };

  const routes = {
    'Renta Mensual Total':'/Directorio%20de%20Estaciones/code.html',
    'Próximos a Vencer':'/Calendario%20y%20Alertas/code.html',
    'PrÃ³ximos a Vencer':'/Calendario%20y%20Alertas/code.html',
    'Incrementos Pendientes':'/Calendario%20y%20Alertas/code.html',
    'Expedientes Incompletos':'/Admin%20Vacantes/code.html'
  };
  main.querySelectorAll('p').forEach((label)=>{const text=label.textContent.trim();if(routes[text]){const card=label.closest('.rounded-xl');if(card){card.classList.add('home-kpi-card');card.parentElement?.classList.add('home-kpi-grid');navigate(card,routes[text],`Ver detalle de ${text}`);}}});

  const vacancyTitle=[...main.querySelectorAll('h3')].find((heading)=>heading.textContent.includes('Indicador de Vacancias'));
  const vacancyCard=vacancyTitle?.closest('.home-vacancy-card'); if(vacancyCard) navigate(vacancyCard,'/Admin%20Vacantes/code.html?view=available','Ver locales disponibles');
  const buttons=[...main.querySelectorAll('button')];
  buttons.find((button)=>button.textContent.includes('Ver todas'))?.addEventListener('click',()=>window.location.href='/Calendario%20y%20Alertas/code.html');
  buttons.find((button)=>button.textContent.includes('Nuevo Tr'))?.addEventListener('click',()=>window.location.href='/Admin%20Vacantes/code.html');
  const filterButton=buttons.find((button)=>button.querySelector('.material-symbols-outlined')?.textContent.trim()==='filter_list');
  let criticalOnly=false; filterButton?.addEventListener('click',()=>{criticalOnly=!criticalOnly;const rows=filterButton.closest('.rounded-xl').querySelectorAll('tbody tr');rows.forEach((row)=>row.hidden=criticalOnly&&!row.textContent.includes('Crítico')&&!row.textContent.includes('CrÃ­tico'));notify(criticalOnly?'Mostrando contratos críticos.':'Mostrando todos los contratos.');});

  const search=document.querySelector('.rp-page-content header input'); search?.addEventListener('input',()=>{const term=search.value.trim().toLocaleLowerCase('es');main.querySelectorAll('tbody tr').forEach((row)=>row.hidden=!row.textContent.toLocaleLowerCase('es').includes(term));});
  const notification=document.querySelector('.rp-page-content header button'); notification?.addEventListener('click',()=>window.location.href='/Calendario%20y%20Alertas/code.html');
  const avatar=document.querySelector('.rp-page-content header img')?.parentElement;if(avatar)navigate(avatar,'/Usuarios/code.html','Abrir usuarios');
  main.querySelector('.home-kpi-grid')?.remove();

  const activityPanel = [...main.querySelectorAll('h3')].find((heading) => heading.textContent.includes('Actividades Pendientes'))?.closest('.rounded-xl');
  const activityBody = activityPanel?.querySelector('tbody');
  const renderActivities=()=>{
    if(!activityBody)return;
    activityBody.innerHTML=model.sortActivities(activitiesData).map(item=>`<tr data-activity-id="${safe(item.id)}" class="${item.complete?'home-task-complete':''}"><td><button class="home-task-check ${item.complete?'is-checked':''}" type="button" aria-pressed="${Boolean(item.complete)}" aria-label="${item.complete?'Marcar actividad como pendiente':'Marcar actividad como completada'}">${item.complete?'✓':''}</button></td><td><strong><a href="${safe(taskHref(item))}">${safe(item.title)}</a></strong><small>${safe(item.station)} · ${item.date?'fecha límite '+formatDate(item.date):safe(item.description||'Sin fecha límite')}</small></td><td><span class="home-priority ${['high','medium','low'].includes(item.priority)?item.priority:'low'}">${({high:'Alta',medium:'Media',low:'Baja'})[item.priority]||'Baja'}</span></td></tr>`).join('');
  };
  activityPanel?.querySelector('thead')?.remove();
  activityBody?.addEventListener('click',event=>{
    const button=event.target.closest('.home-task-check');if(!button)return;
    const item=activitiesData.find(item=>item.id===button.closest('tr').dataset.activityId);if(!item)return;
    item.complete=!item.complete;persist();renderActivities();refreshHome();
    activityBody.querySelector(`[data-activity-id="${CSS.escape(item.id)}"] button`)?.focus({preventScroll:true});
  });
  renderActivities();
  const expiryPanel=[...main.querySelectorAll('h3')].find(heading=>heading.textContent.includes('Contratos Pr'))?.closest('.rounded-xl');
  const expiryBody=expiryPanel?.querySelector('tbody');
  expiryPanel?.querySelector('thead')?.remove();
  const expiryRow=item=>`<tr><td><a href="${safe(model.localHref(item))}"><strong>${safe(item.commercialName||item.localId)}</strong><small>${safe(item.station)} · ${formatDate(item.endDate)}</small></a></td><td><b>${item.days===0?'Vence hoy':item.days===1?'1 día':item.days+' días'}</b></td></tr>`;
  const details=document.createElement('dialog');details.id='home-detail-dialog';document.body.appendChild(details);
  const openDetails=kind=>{
    const expiries=kind==='expiry',items=expiries?model.upcoming():model.sortActivities(activitiesData.filter(item=>item.type==='Expediente'&&!item.complete));
    details.innerHTML=`<header><h2>${expiries?'Contratos en próximos 180 días':'Expedientes incompletos'}</h2><button type="button" aria-label="Cerrar">×</button></header>${expiries?'':'<p>Actividades de expediente pendientes de completar. Abre la estación para consultar sus locales.</p>'}<table><tbody>${items.length?items.map(item=>expiries?expiryRow(item):`<tr><td><a href="${safe(taskHref(item))}"><strong>${safe(item.title)}</strong><small>${safe(item.station)} · ${safe(item.description||'Seguimiento pendiente')}</small></a></td></tr>`).join(''):'<tr><td>No hay pendientes en esta sección.</td></tr>'}</tbody></table>`;
    details.querySelector('button').onclick=()=>details.close();details.showModal();
  };
  details.addEventListener('click',event=>{if(event.target===details)details.close();});
  const refreshHome=()=>{
    const items=model.upcoming();
    if(expiryBody)expiryBody.innerHTML=items.slice(0,2).map(expiryRow).join('')||'<tr><td>No hay contratos por vencer en los próximos 180 días.</td></tr>';
    const count=main.querySelector('[data-summary-kind="expiry"] strong');if(count)count.textContent=items.length;
    const incomplete=main.querySelector('[data-summary-kind="documents"] strong');if(incomplete)incomplete.textContent=activitiesData.filter(item=>item.type==='Expediente'&&!item.complete).length;
  };

  const layout = main.querySelector('.home-main-grid');
  const leftColumn = layout?.children[0];
  const rightColumn = layout?.children[1];
  const activities = leftColumn?.children[0];
  const expiries = leftColumn?.children[1];
  const quickAction = rightColumn?.children[1];
  if (layout && leftColumn && rightColumn && activities && expiries && vacancyCard) {
    leftColumn.classList.add('home-activities-column');
    rightColumn.classList.add('home-summary-column');
    activities.classList.add('home-activities-panel');
    expiries.classList.add('home-expiry-panel');
    vacancyCard.classList.add('home-vacancy-panel');
    rightColumn.insertBefore(expiries, vacancyCard);
    if (quickAction) {
      quickAction.classList.add('home-quick-compact');
      const oldQuickButton = quickAction.querySelector('button');
      if (oldQuickButton) {
        const quickButton = oldQuickButton.cloneNode(true);
        oldQuickButton.replaceWith(quickButton);
        quickButton.innerHTML = '<span class="material-symbols-outlined text-sm">add</span> Nueva actividad';
        quickButton.type = 'button';
        quickButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); openActivityModal(); });
        activities.querySelector('button')?.remove();
        activities.querySelector('h3')?.parentElement?.appendChild(quickButton);
      }
      quickAction.remove();
    }
    const expiryHeading = expiries.querySelector('h3');
    if (expiryHeading) expiryHeading.textContent = 'Próximos a vencer';
    const oldExpiryButton = expiries.querySelector('button');
    if (oldExpiryButton) {
      const allButton = document.createElement('button');
      allButton.type = 'button'; allButton.className = 'home-see-all'; allButton.textContent = 'Ver todos →';
      allButton.addEventListener('click', () => openDetails('expiry'));
      oldExpiryButton.replaceWith(allButton);
    }
    const vacancyHeading = vacancyCard.querySelector('h3');
    if (vacancyHeading) vacancyHeading.textContent = 'Vacancias';
    const vacancyPaths = vacancyCard.querySelectorAll('svg path');
    vacancyPaths[1]?.setAttribute('stroke-dasharray', '79, 100');
    const vacancyCenter = vacancyCard.querySelector('svg + div > span');
    if (vacancyCenter) vacancyCenter.innerHTML = '79<span class="text-xl">%</span>';
    const legendGroups = vacancyCard.querySelectorAll(':scope > div:nth-of-type(2) > div');
    if (legendGroups[0]) legendGroups[0].innerHTML = '<div class="w-3 h-3 rounded-full bg-primary"></div><div><p class="font-semibold text-on-background">11 rentados</p><p class="text-on-surface-variant text-xs">79% del portafolio</p></div>';
    if (legendGroups[1]) legendGroups[1].innerHTML = '<div class="w-3 h-3 rounded-full bg-[#29a9df]"></div><div><p class="font-semibold text-on-background">3 disponibles</p><p class="text-on-surface-variant text-xs">21% del portafolio</p></div>';
    [legendGroups[0],legendGroups[1]].forEach((group,index)=>{if(!group)return;const link=document.createElement('a');link.href=index?'/Admin%20Vacantes/code.html?view=available':'/Directorio%20de%20Estaciones/code.html?view=table';while(group.firstChild)link.appendChild(group.firstChild);group.appendChild(link);});
  }

  if (layout && !document.querySelector('.home-portfolio-summary')) {
    const summary = document.createElement('section');
    summary.className = 'home-portfolio-summary';
    summary.innerHTML = `<div class="home-portfolio-heading"><h2>Resumen del Portafolio</h2><p>Información ejecutiva para administrar locales, contratos y oportunidades.</p></div>
      <div class="home-portfolio-cards">
        <article data-summary-route="/Directorio%20de%20Estaciones/code.html"><div><strong>14</strong><span>Locales administrados</span></div><i class="material-symbols-outlined">business</i></article>
        <article data-summary-route="/Directorio%20de%20Estaciones/code.html?view=table"><div><strong>$375,037.83</strong><span>Renta mensual sin IVA</span></div><i class="material-symbols-outlined">attach_money</i></article>
        <article data-summary-kind="expiry"><div><strong>2</strong><span>Contratos en próximos 180 días</span></div><i class="material-symbols-outlined">hourglass_top</i></article>
        <article data-summary-kind="documents"><div><strong>1</strong><span>Expedientes incompletos</span></div><i class="material-symbols-outlined">priority_high</i></article>
      </div>`;
    layout.insertAdjacentElement('afterend', summary);
    summary.querySelectorAll('[data-summary-kind]').forEach(card=>{
      card.classList.add('home-clickable');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','Ver '+card.querySelector('span').textContent);
      card.addEventListener('click',()=>openDetails(card.dataset.summaryKind));
      card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetails(card.dataset.summaryKind);}});
    });
    summary.querySelectorAll('[data-summary-route]').forEach((card) => navigate(card, card.dataset.summaryRoute, `Ver ${card.querySelector('span').textContent}`));
  }

  refreshHome();
  const refresh=()=>{const saved=model.read(activityKey,activitiesData);if(Array.isArray(saved))activitiesData=saved;renderActivities();refreshHome();};
  window.addEventListener('storage',refresh);window.addEventListener('pageshow',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(()=>{if(!document.hidden)refreshHome();},60000);
  activityModal.querySelector('#home-activity-form')?.addEventListener('submit',event=>{
    event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));
    activitiesData.push({...data,id:crypto.randomUUID(),complete:false});
    persist();renderActivities();refreshHome();event.currentTarget.reset();closeActivityModal();notify('Actividad creada correctamente.');
  });
});
