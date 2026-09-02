document.addEventListener('DOMContentLoaded', () => {
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
  body.innerHTML = anniversaryStations.map((station, index) => {
    const date = new Date(2026, 8, 10 + (index * 18), 12);
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const displayDate = date.toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' }).replace('.', '');
    const rent = 14000 + ((index * 3745) % 52000);
    const tenant = anniversaryTenants[index % anniversaryTenants.length];
    const statusId = `${station}|${tenant}|${isoDate}`;
    const complete = savedContractStatuses[statusId] ?? (index > 0 && index % 4 === 1);
    return `<tr class="${index >= 5 ? 'extra-row' : ''}" data-date="${isoDate}" data-rent="${rent}" data-station="${station}" data-local-id="${anniversaryLocalIds[index%anniversaryLocalIds.length]}" data-status-id="${statusId}"><td><strong>${tenant}</strong><small>${station}</small></td><td>${displayDate}</td><td>${rent.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2})}<small>sin IVA</small></td><td><button type="button" class="status status-toggle ${complete ? 'done' : 'pending'}" aria-pressed="${complete}">${complete ? 'Hecho' : 'Pendiente'}</button></td></tr>`;
  }).join('');
  const increaseDialog=document.getElementById('rent-increase-dialog'),increaseForm=document.getElementById('rent-increase-form'),increaseContract=document.getElementById('rent-increase-contract'),increasePrevious=document.getElementById('rent-increase-previous'),increaseVariation=document.getElementById('rent-increase-variation');let pendingIncreaseRow=null;
  const statusByDate=row=>{const button=row.querySelector('.status-toggle'),complete=button.classList.contains('done'),today=new Date();today.setHours(0,0,0,0);const adjustment=new Date(`${row.dataset.date}T00:00:00`),days=Math.ceil((adjustment-today)/86400000);button.classList.remove('status-future','status-warning','status-urgent','status-complete');if(complete){button.classList.add('status-complete');button.title='Incremento actualizado';return;}button.classList.add(days<=15?'status-urgent':days<=45?'status-warning':'status-future');button.title=days<0?`Actualización vencida hace ${Math.abs(days)} días`:days===0?'La actualización corresponde a hoy':`Faltan ${days} días para actualizar`;};
  const setContractStatus=(row,complete)=>{const button=row.querySelector('.status-toggle');button.classList.toggle('done',complete);button.classList.toggle('pending',!complete);button.textContent=complete?'Hecho':'Pendiente';button.setAttribute('aria-pressed',String(complete));savedContractStatuses[row.dataset.statusId]=complete;localStorage.setItem(contractStatusKey,JSON.stringify(savedContractStatuses));statusByDate(row);};
  const todayIso=()=>{const date=new Date(),offset=date.getTimezoneOffset();return new Date(date.getTime()-offset*60000).toISOString().slice(0,10);};
  const updateIncreaseVariation=()=>{const previous=Number(pendingIncreaseRow?.dataset.rent||0),next=Number(increaseForm.elements.newAmount.value||0),variation=previous&&next?(next/previous-1)*100:0;increaseVariation.textContent=`${variation>=0?'+':''}${variation.toFixed(2)}%`;increaseVariation.classList.toggle('negative',variation<0);};
  const openIncreaseDialog=row=>{pendingIncreaseRow=row;const tenant=row.querySelector('strong').textContent.trim(),station=row.dataset.station,previous=Number(row.dataset.rent);increaseContract.textContent=`${tenant} · Estación ${station}`;increasePrevious.textContent=previous.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2});increaseForm.reset();increaseForm.elements.adjustmentDate.value=todayIso();increaseForm.elements.newAmount.value=previous.toFixed(2);updateIncreaseVariation();increaseDialog.showModal();setTimeout(()=>increaseForm.elements.inpc.focus(),50);};
  body.querySelectorAll('tr').forEach(statusByDate);
  body.addEventListener('click',event=>{const button=event.target.closest('.status-toggle');if(!button)return;const row=button.closest('tr');if(button.classList.contains('pending')){openIncreaseDialog(row);return;}if(!window.confirm('¿Quieres deshacer este incremento?\n\nSe eliminará la información capturada (INPC, monto nuevo y fecha de ajuste) del historial económico del local.'))return;const history=(()=>{try{return JSON.parse(localStorage.getItem(rentHistoryKey)||'[]');}catch{return[];}})(),removed=history.filter(item=>item.statusId===row.dataset.statusId).sort((a,b)=>String(b.capturedAt).localeCompare(String(a.capturedAt))),remaining=history.filter(item=>item.statusId!==row.dataset.statusId);localStorage.setItem(rentHistoryKey,JSON.stringify(remaining));if(removed.length){const restored=Number(removed[0].previousAmount);row.dataset.rent=String(restored);row.cells[2].innerHTML=`${restored.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2})}<small>sin IVA</small>`;}setContractStatus(row,false);notify(removed.length?'Incremento eliminado; el monto anterior fue restaurado.':'El incremento volvió a estatus Pendiente.');});
  increaseForm.elements.newAmount.addEventListener('input',updateIncreaseVariation);document.querySelectorAll('[data-close-increase]').forEach(button=>button.addEventListener('click',()=>increaseDialog.close()));increaseDialog.addEventListener('click',event=>{if(event.target===increaseDialog)increaseDialog.close();});
  increaseForm.addEventListener('submit',event=>{event.preventDefault();if(!pendingIncreaseRow)return;const tenant=pendingIncreaseRow.querySelector('strong').textContent.trim(),station=pendingIncreaseRow.dataset.station,localId=pendingIncreaseRow.dataset.localId||'',previous=Number(pendingIncreaseRow.dataset.rent),newAmount=Number(increaseForm.elements.newAmount.value),inpc=Number(increaseForm.elements.inpc.value),adjustmentDate=increaseForm.elements.adjustmentDate.value;if(!inpc||!newAmount||!adjustmentDate){notify('Completa el índice INPC, monto nuevo y fecha de ajuste.');return;}const history=(()=>{try{return JSON.parse(localStorage.getItem(rentHistoryKey)||'[]');}catch{return[];}})(),record={id:`${pendingIncreaseRow.dataset.statusId}|${adjustmentDate}`,statusId:pendingIncreaseRow.dataset.statusId,tenant,station,localId,year:new Date(`${adjustmentDate}T12:00:00`).getFullYear(),adjustmentDate,inpc:Number(inpc.toFixed(3)),previousAmount:previous,newAmount,capturedAt:new Date().toISOString(),capturedBy:localStorage.getItem('rp-current-user-name')||'Alyn'};const withoutCurrent=history.filter(item=>item.id!==record.id);withoutCurrent.push(record);localStorage.setItem(rentHistoryKey,JSON.stringify(withoutCurrent));pendingIncreaseRow.dataset.rent=String(newAmount);const rentCell=pendingIncreaseRow.cells[2];rentCell.innerHTML=`${newAmount.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2})}<small>sin IVA</small>`;setContractStatus(pendingIncreaseRow,true);increaseDialog.close();notify(`Incremento de ${tenant} registrado y vinculado a Condiciones Económicas.`);pendingIncreaseRow=null;});

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
    const formattedExpiry=item.date.toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
    const safeName=`${item.contract}-${item.station}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
    const documentHtml=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Contrato ${item.contract}</title><style>body{max-width:760px;margin:48px auto;padding:0 28px;color:#172033;font:16px/1.55 Arial,sans-serif}header{padding-bottom:18px;border-bottom:3px solid #167fc7}h1{margin:0 0 5px;color:#101f78}dl{display:grid;grid-template-columns:170px 1fr;margin-top:30px}dt,dd{padding:12px;border-bottom:1px solid #dce4ee}dt{font-weight:bold}dd{margin:0}.note{margin-top:32px;padding:16px;border-radius:10px;background:#eef6fc;color:#40506a}</style></head><body><header><h1>Contrato de Arrendamiento</h1><div>Asset Management · RedPetroil</div></header><dl><dt>Local / contrato</dt><dd>${item.contract}</dd><dt>Estación</dt><dd>${item.station}</dd><dt>Fecha de vencimiento</dt><dd>${formattedExpiry}</dd><dt>Días restantes</dt><dd>${item.days}</dd></dl><p class="note">Documento generado desde el sistema de administración de activos.</p></body></html>`;
    const blob=new Blob([documentHtml],{type:'text/html;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`Contrato-${safeName}.html`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),1000);notify(`Contrato de ${item.contract} descargado.`);
  };
  const updateExpiryVisibility = (range) => {
    const visible=upcomingContracts.filter(item=>item.days>=0&&item.days<=Number(range));
    expiryBody.innerHTML=visible.map((item,index)=>`<tr><td><strong>${item.contract}</strong><small>${item.station}</small></td><td>${item.date.toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}).replace('.','')}</td><td><span class="expiry-days${item.days<=30?' urgent':''}">${item.days===0?'Vence hoy':`${item.days} días`}</span></td><td><button class="expiry-download" type="button" data-expiry-index="${upcomingContracts.indexOf(item)}"><span class="material-symbols-outlined">download</span>Descargar</button></td></tr>`).join('');
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
    const date = new Date(`${startDateInput.value}T12:00:00`);
    date.setMonth(date.getMonth() + Number(durationInput.value));
    endDateInput.value = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  };
  startDateInput.addEventListener('change', calculateEndDate); durationInput.addEventListener('input', calculateEndDate);
  pdfInput.addEventListener('change', () => {
    const file=pdfInput.files[0];
    if (file && file.type !== 'application/pdf' && !file.name.toLocaleLowerCase('es').endsWith('.pdf')) { pdfInput.value=''; pdfName.textContent='Selecciona únicamente archivos PDF'; pdfName.classList.add('is-error'); return; }
    pdfName.classList.remove('is-error'); pdfName.textContent=file ? `${file.name} · ${(file.size/1048576).toFixed(2)} MB` : 'Ningún archivo seleccionado';
  });
  document.getElementById('add-contract').addEventListener('click', () => dialog.showModal());
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  contractForm.addEventListener('submit', (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget); const date = new Date(`${data.get('date')}T12:00:00`); const rent = Number(data.get('rent')); const pdf=pdfInput.files[0];
    if (!endDateInput.value || !pdf) { notify('Completa la duración y selecciona el PDF.'); return; }
    const row = document.createElement('tr'); row.dataset.date = data.get('date'); row.dataset.rent = rent; row.dataset.station=data.get('station'); row.dataset.localId=data.get('contractId'); row.dataset.statusId=`${data.get('station')}|${data.get('contract')}|${data.get('date')}`;
    const pdfUrl=URL.createObjectURL(pdf);
    row.innerHTML = `<td><strong></strong><small></small><button type="button" class="contract-pdf-download"><span class="material-symbols-outlined">picture_as_pdf</span>PDF</button></td><td>${date.toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'})}</td><td>${rent.toLocaleString('es-MX',{style:'currency',currency:'MXN'})}<small>sin IVA</small></td><td><button type="button" class="status status-toggle pending" aria-pressed="false">Pendiente</button></td>`;
    row.querySelector('strong').textContent=data.get('contract'); row.querySelector('small').textContent=`${data.get('tenant')} · ${data.get('station')}`;
    row.querySelector('.contract-pdf-download').addEventListener('click',()=>{const link=document.createElement('a');link.href=pdfUrl;link.download=pdf.name;link.click();});
    body.appendChild(row); statusByDate(row); event.currentTarget.reset(); endDateInput.value=''; pdfName.textContent='Ningún archivo seleccionado'; dialog.close(); notify(`Contrato ${data.get('contractId')} guardado con su PDF.`);
  });
});
