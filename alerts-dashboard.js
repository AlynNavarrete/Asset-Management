document.addEventListener('DOMContentLoaded', () => {
  const model=window.rpRentIncrease;
  const money=value=>Number(value).toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2});
  const readHistory=()=>{try{const value=JSON.parse(localStorage.getItem('rp-rent-increase-history')||'[]');return Array.isArray(value)?value:[];}catch{return [];}};
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  const body = document.getElementById('contracts-body');
  const card = document.querySelector('.contracts-card');
  const search = document.getElementById('contract-search') || document.getElementById('rp-global-search');
  const toast = document.getElementById('toast');
  const notify = (message) => {
    toast.textContent = message; toast.classList.add('visible');
    window.setTimeout(() => toast.classList.remove('visible'), 2200);
  };

  const anniversaryStations = [
    'La Marina','Cerritos','Cardones','Victorica','Munich Estadio','Flores Magón','Colosio','Sábalo','Aeropuerto','La Urraca','12 de Mayo','Foresta','Urbi Villa','El Habal','Las Habas','Conchi','Juan Carrasco','Grijalva UAS','Concordia','Rosario','Escuinapa','Malecón','Madero','Patria','Bellavista','Revolución · Culiacán','Revolución · Guasave','Cuauhtemoc','Pericos','La Colorada','Gobernador Curiel'
  ];
  const anniversaryTenants = ['Rico’s','Farmacia Moderna','Restaurante','OXXO','Kiosko','Tienda especializada','Oficinas','Estacionamiento'];
  const anniversaryLocalIds = ['L-01','L-02','L-03','L-01','L-02','L-03','L-04','L-05'];
  const contractStatusKey = 'rp-contract-anniversary-statuses';
  const rentHistoryKey = 'rp-rent-increase-history';
  const savedContractStatuses = (()=>{try{return JSON.parse(localStorage.getItem(contractStatusKey)||'{}');}catch{return {};}})();
  const initialHistory=readHistory();
  body.innerHTML = anniversaryStations.map((station, index) => {
    const date = new Date(2026, 8, 10 + (index * 18), 12);
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const displayDate = model.displayDate(isoDate);
    let rent = 14000 + ((index * 3745) % 52000);
    const tenant = anniversaryTenants[index % anniversaryTenants.length];
    const statusId = `${station}|${tenant}|${isoDate}`;
    const savedIncrease=initialHistory.filter(item=>item.statusId===statusId).sort((a,b)=>String(b.capturedAt).localeCompare(String(a.capturedAt)))[0];
    if(savedIncrease&&Number.isFinite(Number(savedIncrease.newAmount)))rent=Number(savedIncrease.newAmount);
    const complete = savedContractStatuses[statusId] ?? (index > 0 && index % 4 === 1);
    return `<tr class="${index >= 5 ? 'extra-row' : ''}" data-date="${isoDate}" data-rent="${rent}" data-station="${station}" data-local-id="${anniversaryLocalIds[index%anniversaryLocalIds.length]}" data-status-id="${statusId}"><td><strong>${tenant}</strong><small>${station}</small></td><td>${displayDate}</td><td>${rent.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2})}<small>sin IVA</small></td><td><button type="button" class="status status-toggle ${complete ? 'done' : 'pending'}" aria-pressed="${complete}">${complete ? 'Hecho' : 'Pendiente'}</button></td></tr>`;
  }).join('');
  const increaseDialog=document.getElementById('rent-increase-dialog'),increaseForm=document.getElementById('rent-increase-form'),increaseContract=document.getElementById('rent-increase-contract'),increasePrevious=document.getElementById('rent-increase-previous'),increaseVariation=document.getElementById('rent-increase-variation');let pendingIncreaseRow=null;
  const statusByDate=row=>{const button=row.querySelector('.status-toggle'),complete=button.classList.contains('done'),today=new Date();today.setHours(0,0,0,0);const adjustment=new Date(`${row.dataset.date}T00:00:00`),days=Math.ceil((adjustment-today)/86400000);button.classList.remove('status-future','status-warning','status-urgent','status-complete');if(complete){button.classList.add('status-complete');button.title='Incremento actualizado';return;}button.classList.add(days<=15?'status-urgent':days<=45?'status-warning':'status-future');button.title=days<0?`Actualización vencida hace ${Math.abs(days)} días`:days===0?'La actualización corresponde a hoy':`Faltan ${days} días para actualizar`;};
  const setContractStatus=(row,complete)=>{const button=row.querySelector('.status-toggle');button.classList.toggle('done',complete);button.classList.toggle('pending',!complete);button.textContent=complete?'Hecho':'Pendiente';button.setAttribute('aria-pressed',String(complete));savedContractStatuses[row.dataset.statusId]=complete;localStorage.setItem(contractStatusKey,JSON.stringify(savedContractStatuses));statusByDate(row);};
  const todayIso=()=>{const date=new Date(),offset=date.getTimezoneOffset();return new Date(date.getTime()-offset*60000).toISOString().slice(0,10);};
  const fields=increaseForm.elements;
  ['previousMonth','currentMonth'].forEach(name=>{fields[name].innerHTML=model.months.map((month,i)=>`<option value="${String(i+1).padStart(2,'0')}">${month}</option>`).join('');});
  const period=prefix=>`${fields[prefix+'Year'].value}-${fields[prefix+'Month'].value}`;
  const updateIncreaseVariation=()=>{
    const result=model.calculate(Number(pendingIncreaseRow?.dataset.rent),Number(fields.inpcPrevious.value),Number(fields.inpcCurrent.value));
    const prior=period('previous'),current=period('current'),max=todayIso().slice(0,7);
    const validPeriod=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(value)&&Number(value.slice(0,4))>=1900;
    const periodError=!validPeriod(prior)||!validPeriod(current)?'Selecciona mes y año para ambos índices.':prior>=current?'El período actual debe ser posterior al anterior.':current>max?'El período actual no puede estar en el futuro.':'';
    fields.currentYear.setCustomValidity(periodError);
    const error=document.getElementById('rent-increase-error');error.hidden=!periodError;error.textContent=periodError;
    fields.newAmount.value=result?result.amount.toFixed(2):'';
    document.getElementById('rent-increase-new').textContent=result?money(result.amount):'—';
    const variation=result?Number(result.variationPercent.toFixed(2)):null;
    increaseVariation.textContent=variation===null?'—':`${variation>=0?'+':''}${variation.toFixed(2)}%`;
    increaseVariation.classList.toggle('negative',variation!==null&&variation<0);
    increaseForm.querySelector('button[type="submit"]').disabled=!result||Boolean(periodError);
    return result;
  };
  const openIncreaseDialog=row=>{
    pendingIncreaseRow=row;
    increaseContract.textContent=`${row.querySelector('strong').textContent.trim()} · Estación ${row.dataset.station}`;
    increasePrevious.textContent=money(row.dataset.rent);increaseForm.reset();
    fields.adjustmentDate.value=model.displayDate(todayIso());
    const month=new Date();month.setDate(1);month.setMonth(month.getMonth()-1);
    fields.currentMonth.value=fields.previousMonth.value=String(month.getMonth()+1).padStart(2,'0');
    fields.currentYear.value=month.getFullYear();fields.previousYear.value=month.getFullYear()-1;
    fields.currentYear.max=fields.previousYear.max=new Date().getFullYear();
    updateIncreaseVariation();increaseDialog.showModal();fields.inpcPrevious.focus();
  };
  body.querySelectorAll('tr').forEach(statusByDate);
  body.addEventListener('click',event=>{const button=event.target.closest('.status-toggle');if(!button)return;const row=button.closest('tr');if(button.classList.contains('pending')){openIncreaseDialog(row);return;}if(!window.confirm('¿Quieres deshacer este incremento?\n\nSe eliminará la información capturada (INPC, monto nuevo y fecha de ajuste) del historial económico del local.'))return;const history=(()=>{try{return JSON.parse(localStorage.getItem(rentHistoryKey)||'[]');}catch{return[];}})(),removed=history.filter(item=>item.statusId===row.dataset.statusId).sort((a,b)=>String(b.capturedAt).localeCompare(String(a.capturedAt))),remaining=history.filter(item=>item.statusId!==row.dataset.statusId);localStorage.setItem(rentHistoryKey,JSON.stringify(remaining));if(removed.length){const restored=Number(removed[0].previousAmount);row.dataset.rent=String(restored);row.cells[2].innerHTML=`${restored.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2})}<small>sin IVA</small>`;}setContractStatus(row,false);notify(removed.length?'Incremento eliminado; el monto anterior fue restaurado.':'El incremento volvió a estatus Pendiente.');});
  increaseForm.addEventListener('input',updateIncreaseVariation);increaseForm.addEventListener('change',updateIncreaseVariation);document.querySelectorAll('[data-close-increase]').forEach(button=>button.addEventListener('click',()=>increaseDialog.close()));increaseDialog.addEventListener('click',event=>{if(event.target===increaseDialog)increaseDialog.close();});
  increaseForm.addEventListener('submit',event=>{
    event.preventDefault();if(!pendingIncreaseRow)return;
    const result=updateIncreaseVariation();if(!result||!increaseForm.reportValidity())return;
    const tenant=pendingIncreaseRow.querySelector('strong').textContent.trim(),station=pendingIncreaseRow.dataset.station,localId=pendingIncreaseRow.dataset.localId||'',previous=Number(pendingIncreaseRow.dataset.rent),adjustmentDate=model.isoDate(fields.adjustmentDate.value);
    if(!adjustmentDate)return;
    const record={id:`${pendingIncreaseRow.dataset.statusId}|${adjustmentDate}`,statusId:pendingIncreaseRow.dataset.statusId,tenant,station,localId,year:Number(adjustmentDate.slice(0,4)),adjustmentDate,inpc:Number(fields.inpcCurrent.value),inpcPrevious:Number(fields.inpcPrevious.value),inpcCurrent:Number(fields.inpcCurrent.value),inpcPreviousPeriod:period('previous'),inpcCurrentPeriod:period('current'),variationPercent:result.variationPercent,previousAmount:previous,newAmount:result.amount,capturedAt:new Date().toISOString(),capturedBy:localStorage.getItem('rp-current-user-name')||localStorage.getItem('rp-user-name')||'Alyn'};
    try{const history=readHistory().filter(item=>item.id!==record.id);history.push(record);localStorage.setItem(rentHistoryKey,JSON.stringify(history));}
    catch{notify('No se pudo guardar el incremento. Revisa el almacenamiento del navegador.');return;}
    pendingIncreaseRow.dataset.rent=String(result.amount);pendingIncreaseRow.cells[2].innerHTML=money(result.amount)+'<small>sin IVA</small>';
    setContractStatus(pendingIncreaseRow,true);increaseDialog.close();notify(`Incremento de ${tenant} registrado y vinculado a Condiciones Económicas.`);pendingIncreaseRow=null;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryBody = document.getElementById('expiry-body');
  const upcomingContracts = [
    {contract:'Rico’s',station:'La Marina',expiry:'2026-09-30'},
    {contract:'Farmacia Moderna',station:'Cerritos',expiry:'2026-10-18'},
    {contract:'Restaurante',station:'Cardones',expiry:'2026-11-05'},
    {contract:'OXXO',station:'Victorica',expiry:'2026-11-28'},
    {contract:'Kiosko',station:'Munich Estadio',expiry:'2026-12-15'},
    {contract:'Tienda especializada',station:'Flores Magón',expiry:'2027-01-12'},
    {contract:'Oficinas',station:'Colosio',expiry:'2027-02-08'}
  ].map(item=>{const date=new Date(`${item.expiry}T00:00:00`);return{...item,date,days:Math.ceil((date-today)/86400000)};});
  const downloadContract = (item) => {
    const formattedExpiry=model.displayDate(item.expiry);
    const safeName=`${item.contract}-${item.station}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
    const documentHtml=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Contrato ${item.contract}</title><style>body{max-width:760px;margin:48px auto;padding:0 28px;color:#172033;font:16px/1.55 Arial,sans-serif}header{padding-bottom:18px;border-bottom:3px solid #167fc7}h1{margin:0 0 5px;color:#101f78}dl{display:grid;grid-template-columns:170px 1fr;margin-top:30px}dt,dd{padding:12px;border-bottom:1px solid #dce4ee}dt{font-weight:bold}dd{margin:0}.note{margin-top:32px;padding:16px;border-radius:10px;background:#eef6fc;color:#40506a}@media(max-width:600px){body{margin:20px auto;padding:0 16px}h1{font-size:25px}dl{grid-template-columns:1fr}dt{padding-bottom:0;border:0}dd{padding-top:4px;overflow-wrap:anywhere}}</style></head><body><header><h1>Contrato de Arrendamiento</h1><div>Asset Management · RedPetroil</div></header><dl><dt>Local / contrato</dt><dd>${item.contract}</dd><dt>Estación</dt><dd>${item.station}</dd><dt>Fecha de vencimiento</dt><dd>${formattedExpiry}</dd><dt>Días restantes</dt><dd>${item.days}</dd></dl><p class="note">Documento generado desde el sistema de administración de activos.</p></body></html>`;
    const blob=new Blob([documentHtml],{type:'text/html;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`Contrato-${safeName}.html`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),1000);notify(`Contrato de ${item.contract} descargado.`);
  };
  const updateExpiryVisibility = (range) => {
    const visible=upcomingContracts.filter(item=>item.days>=0&&item.days<=Number(range));
    expiryBody.innerHTML=visible.map((item,index)=>`<tr><td><strong>${item.contract}</strong><small>${item.station}</small></td><td>${model.displayDate(item.expiry)}</td><td><span class="expiry-days${item.days<=30?' urgent':''}">${item.days===0?'Vence hoy':`${item.days} días`}</span></td><td><button class="expiry-download" type="button" data-expiry-index="${upcomingContracts.indexOf(item)}"><span class="material-symbols-outlined">download</span>Descargar</button></td></tr>`).join('');
    document.getElementById('expiry-empty').hidden=visible.length>0;
  };

  document.getElementById('notifications-button')?.addEventListener('click', () => notify('Tienes 1 vencimiento próximo por revisar.'));
  document.getElementById('expiry-range').addEventListener('change', (event) => {
    updateExpiryVisibility(event.target.value);
  });
  updateExpiryVisibility(document.getElementById('expiry-range').value);
  expiryBody.addEventListener('click',event=>{const button=event.target.closest('[data-expiry-index]');if(button)downloadContract(upcomingContracts[Number(button.dataset.expiryIndex)]);});
  const updateContractVisibility = () => {
    const term = search.value.trim().toLocaleLowerCase('es');
    const expanded = card.classList.contains('showing-all');
    let matches = 0;
    body.querySelectorAll('tr').forEach((row) => {
      const matchesSearch = !term || row.textContent.toLocaleLowerCase('es').includes(term);
      const visible = matchesSearch;
      row.style.display = visible ? 'table-row' : 'none';
      if (visible) matches++;
    });
    document.getElementById('no-results').hidden = matches > 0;
  };
  search.addEventListener('input', updateContractVisibility);
  updateContractVisibility();
  document.getElementById('sort-contracts').addEventListener('change', (event) => {
    const rows = [...body.querySelectorAll('tr')];
    rows.sort((a, b) => event.target.value === 'name'
      ? a.querySelector('strong').textContent.localeCompare(b.querySelector('strong').textContent, 'es')
      : event.target.value === 'rent' ? Number(b.dataset.rent) - Number(a.dataset.rent)
      : a.dataset.date.localeCompare(b.dataset.date));
    rows.forEach((row) => body.appendChild(row));
  });

  const dialog = document.getElementById('contract-dialog');
  const contractForm = document.getElementById('contract-form');
  const stationSelect = document.getElementById('contract-station');
  const startDateInput = document.getElementById('contract-start-date');
  const durationInput = document.getElementById('contract-duration');
  const endDateInput = document.getElementById('contract-end-date');
  const pdfInput = document.getElementById('contract-pdf');
  const pdfName = document.getElementById('contract-pdf-name');
  const stations = ['La Marina','Cerritos','Cardones','Victorica','Munich Estadio','Flores Magón','Colosio','Sábalo','Aeropuerto','La Urraca','12 de Mayo','Foresta','Urbi Villa','El Habal','Las Habas','Conchi','Juan Carrasco','Grijalva UAS','Concordia','Rosario','Escuinapa','Malecón','Madero','Patria','Bellavista','Revolución · Culiacán','Revolución · Guasave','Cuauhtemoc','Pericos','La Colorada','Gobernador Curiel'];
  stationSelect.innerHTML += stations.map((station) => `<option value="${station}">${station}</option>`).join('');
  const calculateEndDate = () => {
    if (!startDateInput.value || !durationInput.value) { endDateInput.value=''; return; }
    const iso=model.isoDate(startDateInput.value);
    startDateInput.setCustomValidity(iso?'':'Escribe una fecha válida en formato DD/MM/AAAA.');
    if(!iso){endDateInput.value='';return;}
    const date = new Date(`${iso}T12:00:00`);
    const initialDay=date.getDate();date.setDate(1);
    date.setMonth(date.getMonth() + Number(durationInput.value));
    date.setDate(Math.min(initialDay,new Date(date.getFullYear(),date.getMonth()+1,0).getDate()));
    endDateInput.value = model.displayDate(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`);
  };
  startDateInput.addEventListener('input', calculateEndDate);startDateInput.addEventListener('change', calculateEndDate); durationInput.addEventListener('input', calculateEndDate);
  pdfInput.addEventListener('change', () => {
    const file=pdfInput.files[0];
    if (file && file.type !== 'application/pdf' && !file.name.toLocaleLowerCase('es').endsWith('.pdf')) { pdfInput.value=''; pdfName.textContent='Selecciona únicamente archivos PDF'; pdfName.classList.add('is-error'); return; }
    pdfName.classList.remove('is-error'); pdfName.textContent=file ? `${file.name} · ${(file.size/1048576).toFixed(2)} MB` : 'Ningún archivo seleccionado';
  });
  document.getElementById('add-contract').addEventListener('click', () => dialog.showModal());
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  contractForm.addEventListener('submit', (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget); const expiryIso=model.isoDate(data.get('date')); const date = new Date(`${expiryIso}T12:00:00`); const rent = Number(data.get('rent')); const pdf=pdfInput.files[0];
    if (!endDateInput.value || !pdf) { notify('Completa la duración y selecciona el PDF.'); return; }
    const row = document.createElement('tr'); row.dataset.date = expiryIso; row.dataset.rent = rent; row.dataset.station=data.get('station'); row.dataset.localId=data.get('contractId'); row.dataset.statusId=`${data.get('station')}|${data.get('contract')}|${expiryIso}`;
    const pdfUrl=URL.createObjectURL(pdf);
    row.innerHTML = `<td><strong></strong><small></small><button type="button" class="contract-pdf-download"><span class="material-symbols-outlined">picture_as_pdf</span>PDF</button></td><td>${model.displayDate(expiryIso)}</td><td>${rent.toLocaleString('es-MX',{style:'currency',currency:'MXN'})}<small>sin IVA</small></td><td><button type="button" class="status status-toggle pending" aria-pressed="false">Pendiente</button></td>`;
    row.querySelector('strong').textContent=data.get('contract'); row.querySelector('small').textContent=`${data.get('tenant')} · ${data.get('station')}`;
    row.querySelector('.contract-pdf-download').addEventListener('click',()=>{const link=document.createElement('a');link.href=pdfUrl;link.download=pdf.name;link.click();});
    body.appendChild(row); statusByDate(row); event.currentTarget.reset(); endDateInput.value=''; pdfName.textContent='Ningún archivo seleccionado'; dialog.close(); notify(`Contrato ${data.get('contractId')} guardado con su PDF.`);
  });
});
