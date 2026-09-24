document.addEventListener('DOMContentLoaded',()=>{
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const money=(value,digits=0)=>number(value).toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:digits,maximumFractionDigits:digits});
  const pct=value=>`${value>=0?'+':''}${(value*100).toFixed(2)}%`;
  const median=values=>{const sorted=values.map(Number).sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]||0;};
  const safe=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const model=window.rpVacancyRentModel;
  const rentStore=window.rpRentCalculations;
  const readMarket=(local,station)=>{try{const value=JSON.parse(localStorage.getItem('rp-denue-analysis:'+station+':'+local)||'null');return value?.radius===800&&value.source==='DENUE'&&Array.isArray(value.counts)?value:null;}catch{return null;}};
  const readSaved=rentStore.read;
  const save=rentStore.save;
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}};
  const normalize=value=>String(value||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  const comparableSources=history=>{
    const increases=readJson('rp-rent-increase-history',[]);
    const records=[...history];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key.startsWith('rp-local-detail:')&&!key.startsWith('rp-rent-comparable:'))continue;
      const detail=readJson(key,null);if(!detail||!(Number(detail.area)>0))continue;
      const [,station,local]=key.split(':');
      if(records.some(row=>normalize(row.station)===normalize(station)&&normalize(row.local)===normalize(local)))continue;
      records.push({...detail,station,local,tenant:detail.commercialName||detail.tenant,monthlyRent:Number(detail.rent),rentM2:Number(detail.rent)/Number(detail.area)});
    }
    return records.map(record=>{
      const candidates=(Array.isArray(increases)?increases:[]).filter(item=>normalize(item.station)===normalize(record.station)&&model.validDate(item.adjustmentDate)&&item.adjustmentDate<=model.today()&&Number(item.newAmount)>0);
      const exact=candidates.filter(item=>normalize(item.localId)===normalize(record.local)&&(!item.tenant||!record.tenant||normalize(item.tenant)===normalize(record.tenant)));
      const named=candidates.filter(item=>normalize(item.tenant)===normalize(record.tenant));
      const unambiguous=new Set(named.map(item=>normalize(item.localId))).size<=1;
      const latest=(exact.length?exact:unambiguous?named:[]).sort((a,b)=>b.adjustmentDate.localeCompare(a.adjustmentDate)||String(b.capturedAt).localeCompare(String(a.capturedAt)))[0];
      const invoice=model.validDate(record.lastInvoiceDate)?record.lastInvoiceDate:'';
      const area=Number(record.area)||Number(record.monthlyRent)/Number(record.rentM2);
      const useIncrease=latest&&area>0&&(!invoice||latest.adjustmentDate>=invoice);
      const date=useIncrease?latest.adjustmentDate:invoice;
      const rentM2=useIncrease?Number(latest.newAmount)/area:Number(record.rentM2);
      return {...record,rentM2,referenceDate:date,referenceSource:useIncrease?'Aniversario de Contratos':invoice?'Última factura':'Sin registro',sourceVersion:JSON.stringify([date,rentM2,useIncrease?latest.id:null])};
    });
  };
  const defaults=(local,station,city,area,reference)=>{
    const seed=[...local].reduce((sum,char)=>sum+char.charCodeAt(0),0);
    const base=Number((reference/area).toFixed(2));let history=[];try{history=JSON.parse(localStorage.getItem('rp-former-tenants')||'[]');}catch{}
    const normalized=value=>String(value||'').trim().toLocaleLowerCase('es');
    if(!Array.isArray(history)) history=[];
    history.sort((a,b)=>String(b.endDate||'').localeCompare(String(a.endDate||'')));
    const previous=history.find(item=>normalized(item.local)===normalized(local)&&normalized(item.station)===normalized(station));
    const sources=comparableSources(history).sort((a,b)=>String(b.referenceDate).localeCompare(String(a.referenceDate))).filter((item,index,all)=>all.findIndex(row=>normalize(row.station)===normalize(item.station)&&normalize(row.local)===normalize(item.local))===index);
    const stationHistory=sources.filter(item=>Number(item.rentM2)>0&&normalized(item.station)===normalized(station));
    const cityHistory=sources.filter(item=>Number(item.rentM2)>0&&normalized(item.city)===normalized(city)&&!stationHistory.includes(item));
    const comparable=[...stationHistory,...cityHistory].slice(0,3),fallback=[Number((base*.94).toFixed(2)),base,Number((base*1.06).toFixed(2))];
    const values=fallback.map((value,index)=>Number(Number(comparable[index]?.rentM2||value).toFixed(2))),dates=fallback.map((_,index)=>String(comparable[index]?.referenceDate||''));
    const identities=Object.fromEntries([1,2,3].flatMap((i)=>{const c=comparable[i-1];return [[`compName${i}`,c?[c.local,c.station,c.tenant].filter(Boolean).join(' · '):''],[`compBusiness${i}`,c?.business||''],[`compSource${i}`,c?.referenceSource||'Sin registro'],[`compVersion${i}`,c?.sourceVersion||'']];}));
    return{...identities,previousTenant:previous?.tenant||'',previousRent:previous?.monthlyRent??'',previousExitDate:previous?.endDate||'',previousExitReason:previous?.exitReason||'',local,station,city,area,reference,comp1:values[0],comp2:values[1],comp3:values[2],compDate1:dates[0],compDate2:dates[1],compDate3:dates[2],rbComp:median(values),dateBasis:'lastInvoice',inflation:0,negotiationMargin:17,suggestedBusiness:'food',marketCounts:{food:0,health:0,retail:0,service:0},marketSource:'Sin datos',exitReason:previous?.exitReason||'Normal',localDensity:0,cityAverage:0,saturation:null,visibility:3+(seed%3),parking:2+(seed%4),internalLocation:3+((seed+1)%3),physicalState:3+((seed+2)%3)};
  };
  const calculate=model.calculate;
  const textField=(label,name,value,type='text')=>`<label><span>${label}</span><input name="${name}" type="${type}" ${type==='number'?'step="0.01" min="0"':''} value="${safe(value)}"></label>`;
  const field=(label,name,value,extra='')=>`<label><span>${label}</span><input name="${name}" type="number" ${extra.includes('step=')?'':'step="0.01"'} value="${value}" ${extra}></label>`;
  const ensureDialog=()=>{let dialog=document.getElementById('rent-calculation-dialog');if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='rent-calculation-dialog';document.body.appendChild(dialog);dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});return dialog;};
  const reportHtml=(data,result)=>{
    const impact=value=>value>0?'Positivo':value<0?'Negativo':'Neutro';
    const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?value.split('-').reverse().join('/'):'Sin registro';
    const signed=value=>`${value<0?'−':'+'}${money(Math.abs(value),2)}`;
    const adjustedBase=data.rbComp*(1+result.hist);
    // Allocate the interaction terms to DENUE and physical, matching the existing formula.
    const contributions=[data.rbComp*result.hist,adjustedBase*result.denue,adjustedBase*result.physical];
    const saturationLabel=data.saturation==null?'Sin datos por giro':data.saturation<30?'Oportunidad alta / Poca competencia':data.saturation<=60?'Oferta equilibrada':'Competencia alta / Zona saturada';
    return `<article class="rent-report-paper">
      <header><div><small>ASSET MANAGEMENT · REDPETROIL</small><h1>Reporte de Cálculo de Vacante</h1><p>Metodología de renta sugerida y rango de negociación</p></div><img src="/assets/redpetroil-logo.png" alt="RedPetroil"></header>
      <section class="rent-report-summary"><div><small>LOCAL / ESTACIÓN</small><b>${safe(data.local)} · ${safe(data.station)}</b><span>${safe(data.city)}</span></div><div><small>SUPERFICIE</small><b>${number(data.area).toLocaleString('es-MX')} m²</b><span>Ficha técnica</span></div><div class="highlight"><small>PRECIO OBJETIVO</small><b>${money(result.target,2)}</b><span>MXN/mes · ${money(result.suggestedM2,2)}/m²</span></div></section>
      <section><h2>1. Renta Base Comparable</h2><table class="rent-comparables"><thead><tr><th>Local / Estación</th><th>Giro Comercial</th><th>Fecha Últ. Factura</th><th>Renta $/m²</th></tr></thead><tbody>${[1,2,3].map(i=>`<tr><td>${safe(data[`compName${i}`]||'Sin identificar · referencia estimada')}</td><td>${safe(data[`compBusiness${i}`]||'Sin registro')}</td><td>${date(data[`compDate${i}`])}${data[`compSource${i}`]==='Aniversario de Contratos'?' *':''}</td><td>${money(data[`comp${i}`],2)}</td></tr>`).join('')}<tr class="total"><td colspan="3">RB_comp (mediana)</td><td>${money(data.rbComp,2)}/m²</td></tr></tbody></table><p class="rent-method-note">* Referencia de Aniversario de Contratos: fecha del último ajuste de renta registrado, no una factura emitida.</p></section>
      <section><h2>2. Fuentes de Datos · Contexto de Insumos</h2><div class="rent-source-grid">
        <div><h3>Historial de Contrato</h3><p><strong>Último inquilino:</strong> ${safe(data.previousTenant||'Sin registro')}</p><p><strong>Renta previa:</strong> ${data.previousRent!==''&&data.previousRent!=null?money(data.previousRent,2)+' MXN/mes':'Sin registro'}</p><p><strong>Salida:</strong> ${date(data.previousExitDate)}</p><p><strong>Motivo:</strong> ${safe(data.previousExitReason||'Sin registro')}</p></div>
        <div><h3>DENUE · INEGI</h3><p><strong>Densidad:</strong> ${data.localDensity} negocios / 800 m; promedio ciudad: ${data.cityAverage||'sin registro'}.</p><p><strong>Saturación:</strong> ${data.saturation==null?'Sin registro':data.saturation.toFixed(2)+'%'} · ${saturationLabel}.</p><p class="rent-method-note">${safe(model.categories.find(c=>c.key===data.suggestedBusiness)?.label)} · ${safe(data.marketSource)}.<br>&lt; 30%: oportunidad alta / poca competencia.<br>30%–60%: oferta equilibrada.<br>&gt; 60%: competencia alta / zona saturada.</p></div>
        <div><h3>Ficha Técnica del Local</h3><p><strong>Superficie:</strong> ${number(data.area).toLocaleString('es-MX')} m².</p><p><strong>Atributos evaluados:</strong> visibilidad, estacionamiento, ubicación interna y estado físico.</p><p>Escala: 1/5 desfavorable; 3/5 neutro; 5/5 favorable.</p></div>
      </div></section>
      <section><h2>3. Desglose de Ajustes</h2><div class="rent-factor-grid">
        <div><small>AJUSTE HISTÓRICO</small><b class="${result.hist<0?'negative':''}">${pct(result.hist)}</b><span>Inflación ${pct(result.inflationApplied)} aplicada + motivo ${pct(result.reason)} (${safe(data.exitReason)}).</span><span>Bruto: ${pct(result.histRaw)}<br>Límite: [−10%, +10%]</span><strong>Impacto: ${impact(result.hist)}</strong></div>
        <div><small>AJUSTE DENUE</small><b class="${result.denue<0?'negative':''}">${pct(result.denue)}</b><span>Densidad: ${pct(result.densityEffect)}<br>− Saturación: ${(data.saturation*.03).toFixed(2)}%</span><span>Bruto: ${pct(result.denueRaw)}<br>Límite: [−8%, +8%]</span><strong>Impacto: ${impact(result.denue)}</strong></div>
        <div><small>ESTADO FÍSICO</small><b class="${result.physical<0?'negative':''}">${pct(result.physical)}</b><span>Visibilidad ${data.visibility}/5 · estacionamiento ${data.parking}/5 · ubicación ${data.internalLocation}/5 · estado ${data.physicalState}/5.</span><span>Pesos: 2.5%, 2%, 2.5%, 3%.</span><span>Bruto: ${pct(result.physicalRaw)}<br>Límite: [−10%, +10%]</span><strong>Impacto: ${impact(result.physical)}</strong></div>
      </div><p class="rent-method-note">IPC ${number(data.inflation).toFixed(2)}%: referencias del año actual exentas; sin fechas, validar. DENUE: densidad/promedio × 5% − saturación × 3%; sin promedio, primer término = 0.</p></section>
      <section class="rent-formula"><h2>4. Cálculo Consolidado</h2><code>Renta/m² = RB_comp × (1 + Histórico) × (1 + DENUE + Físico)</code>
      <table class="rent-contributions"><caption>Aportación Monetaria por m²</caption><tbody><tr><td>Renta Base Comparables</td><td>${money(data.rbComp,2)}/m²</td></tr>${[['Histórico / Inflación',result.hist],['Mercado DENUE',result.denue],['Estado Físico',result.physical]].map(([label,value],i)=>`<tr><td>(${value<0?'−':'+'}) Ajuste ${label} (${pct(value)})</td><td>${signed(contributions[i])}/m²</td></tr>`).join('')}<tr class="total"><td>(=) Total Renta Sugerida</td><td>${money(result.suggestedM2,2)}/m² → ${money(result.target,2)} MXN/mes</td></tr></tbody></table><p class="rent-method-note">Histórico sobre RB_comp; DENUE y físico sobre la base ajustada por historial. Sin redondeos intermedios.</p></section>
      <section class="rent-output"><div><small>PRECIO MÍNIMO (PISO)</small><b>${money(result.floor,2)}</b><span>MXN/mes · Objetivo − ${number(data.negotiationMargin/2).toFixed(2)}%</span></div><div class="objective"><small>PRECIO OBJETIVO</small><b>${money(result.target,2)}</b><span>${money(result.suggestedM2,2)}/m² × ${data.area} m²</span></div><div><small>PRECIO DE SALIDA</small><b>${money(result.publication,2)}</b><span>MXN/mes · Objetivo + ${number(data.negotiationMargin/2).toFixed(2)}%</span></div></section>
      <footer><b>Rango de Negociación: ${money(result.floor,2)} — ${money(result.publication,2)} MXN/mes</b><span>${new Date().toLocaleString('es-MX')} · Margen total: ${number(data.negotiationMargin).toFixed(2)}% del objetivo. Insumos por validar; sin identidad: comparables estimados.</span></footer>
    </article>`;
  };

  const openCalculator=button=>{
    const row=button.closest('tr'),cells=row?.cells;if(!cells)return;
    const local=button.dataset.local,station=cells[1].textContent.trim(),city=cells[2].textContent.trim(),area=number(cells[4].textContent.replace(/[^\d.]/g,''),1),reference=number(cells[5].textContent.replace(/[^\d.]/g,''),0);
    const savedInputs=readSaved()[local]?.inputs;
    const data={...defaults(local,station,city,area,reference),...(savedInputs||{})};data.area=area;data.reference=reference;
    // Never reinterpret legacy contract dates as invoice dates.
    if(savedInputs?.dateBasis!=='lastInvoice'){
      const fresh=defaults(local,station,city,area,reference);
      [1,2,3].forEach(i=>{data[`compDate${i}`]=!savedInputs||savedInputs[`compName${i}`]===fresh[`compName${i}`]?fresh[`compDate${i}`]:'';});
      data.dateBasis='lastInvoice';data.inflation=0;data.localDensity=0;data.cityAverage=0;data.saturation=null;
    }
    const refreshed=defaults(local,station,city,area,reference);
    [1,2,3].forEach(i=>{
      const j=[1,2,3].find(j=>data[`compName${i}`]&&data[`compName${i}`]===refreshed[`compName${j}`]);
      if(j&&(data[`compVersion${i}`]!==refreshed[`compVersion${j}`]||(savedInputs?.dateBasis!=='lastInvoice'&&refreshed[`compSource${j}`]==='Aniversario de Contratos'))){
        data[`comp${i}`]=refreshed[`comp${j}`];
        for(const prefix of ['compDate','compSource','compVersion'])data[prefix+i]=refreshed[prefix+j];
      }
    });
    const market=readMarket(local,station);
    if(market&&(!savedInputs||!savedInputs.marketObservedAt||market.observedAt>savedInputs.marketObservedAt)){
      data.marketCounts=Object.fromEntries(model.categories.map(c=>[c.key,Number(market.counts.find(row=>row.key===c.key)?.count)||0]));
      data.localDensity=market.total;data.marketSource='DENUE consultado';data.marketObservedAt=market.observedAt;
    }
    data.marketCounts={...data.marketCounts};
    // Legacy numeric snapshots cannot be attributed to newly selected historical records.
    if(savedInputs) [1,2,3].forEach(i=>{if(!Object.prototype.hasOwnProperty.call(savedInputs,`compName${i}`)){data[`compName${i}`]='';data[`compBusiness${i}`]='';}});
    const dialog=ensureDialog();dialog.innerHTML=`<section class="rent-calculator-modal"><header><div><small>CÁLCULO DE RENTA SUGERIDA</small><h2>${safe(local)} · ${safe(station)}</h2><p>Edita las variables y revisa el reporte en tiempo real.</p></div><button type="button" data-close-calculator aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button></header><div class="rent-calculator-layout"><aside><form id="rent-calculation-form"><details class="rent-editor-section" open><summary>A · Comparables y Mercado</summary><fieldset><legend>Renta por m²</legend>${[1,2,3].map(i=>field('Comparable '+i+' ($/m²)','comp'+i,data['comp'+i],'min="0.01" required')).join('')}<label><span>Giro Comercial Sugerido</span><select name="suggestedBusiness">${model.categories.map(c=>'<option value="'+c.key+'">'+c.label+'</option>').join('')}</select></label><p class="rent-editor-note" id="rent-market-note"></p><details class="rent-editor-more"><summary>Identidad, facturas y conteos</summary>${[1,2,3].map(i=>textField('Local / estación / inquilino '+i,'compName'+i,data['compName'+i])+textField('Giro del comparable '+i,'compBusiness'+i,data['compBusiness'+i])+textField('Última factura / ajuste '+i,'compDate'+i,data['compDate'+i],'date')).join('')}${field('Negocios en radio de 800 m','localDensity',data.localDensity,'min="0" step="1" required')}${field('Promedio de negocios en la ciudad','cityAverage',data.cityAverage,'min="0" required')}${field('Negocios del giro seleccionado','businessCount',data.marketCounts[data.suggestedBusiness]||0,'min="0" step="1" required')}<p class="rent-editor-note">Saturación = negocios del giro ÷ total × 100. Registra conteos verificables; sin datos se omite este componente.</p></details></fieldset></details>
<details class="rent-editor-section"><summary>B · Historial e Inflación</summary><fieldset><legend>Referencia temporal</legend>${field('Inflación Acumulada (%)','inflation',data.inflation,'min="-100" max="100" required')}<p class="rent-editor-note" id="rent-inflation-note"></p><label><span>Motivo de Desocupación</span><select name="exitReason"><option value="Normal">Salida Normal</option><option value="Quiebra por Renta Alta">Quiebra por renta alta</option><option value="Expansión">Expansión/Traspaso</option>${!['Normal','Quiebra por Renta Alta','Expansión'].includes(data.exitReason)?'<option>'+safe(data.exitReason)+'</option>':''}</select></label><details class="rent-editor-more"><summary>Antecedente del contrato</summary>${textField('Último inquilino','previousTenant',data.previousTenant)}${textField('Renta previa mensual (MXN)','previousRent',data.previousRent,'number')}${textField('Fecha de salida','previousExitDate',data.previousExitDate,'date')}${textField('Motivo registrado','previousExitReason',data.previousExitReason)}</details></fieldset></details>
<details class="rent-editor-section"><summary>C · Estado Físico</summary><fieldset><legend>Escala de 1 a 5</legend>${[['Visibilidad','visibility'],['Estacionamiento','parking'],['Ubicación Interna','internalLocation'],['Estado Físico','physicalState']].map(([label,key])=>'<label><span>'+label+'</span><select name="'+key+'">'+[1,2,3,4,5].map(n=>'<option value="'+n+'" '+(Number(data[key])===n?'selected':'')+'>'+n+'/5'+(n===1?' · Desfavorable':n===3?' · Neutro':n===5?' · Favorable':'')+'</option>').join('')+'</select></label>').join('')}</fieldset></details>
<details class="rent-editor-section"><summary>D · Margen Comercial</summary><fieldset><legend>Rango de negociación</legend>${field('Margen de Negociación (%)','negotiationMargin',data.negotiationMargin,'min="0" max="100" required')}<p class="rent-editor-note">Diferencia entre piso y salida, como porcentaje del objetivo. Se distribuye la mitad hacia abajo y la mitad hacia arriba.</p></fieldset></details></form></aside><main id="rent-report-preview"></main></div><footer><span id="rent-calculation-saved">Cambios sin guardar</span><button type="button" data-close-calculator>Cancelar</button><button type="button" id="save-rent-calculation"><span class="material-symbols-outlined">save</span>Guardar cálculo</button><button type="button" id="approve-rent-calculation"><span class="material-symbols-outlined">task_alt</span>Aprobar Cálculo</button><button type="button" id="download-rent-calculation"><span class="material-symbols-outlined">picture_as_pdf</span>Descargar PDF</button></footer></section>`;
    const form=dialog.querySelector('form'),preview=dialog.querySelector('#rent-report-preview');form.elements.exitReason.value=data.exitReason;form.elements.suggestedBusiness.value=data.suggestedBusiness;
    form.querySelectorAll('[name^="compDate"]').forEach(input=>input.max=model.today());
    form.addEventListener('submit',event=>event.preventDefault());
    form.addEventListener('invalid',event=>{let node=event.target.parentElement;while(node&&node!==form){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}},true);
    const current=()=>{const fd=new FormData(form),comp1=number(fd.get('comp1')),comp2=number(fd.get('comp2')),comp3=number(fd.get('comp3'));return{...data,...Object.fromEntries([...fd].filter(([key])=>/^(compName|compBusiness|previous)/.test(key))),comp1,comp2,comp3,compDate1:fd.get('compDate1'),compDate2:fd.get('compDate2'),compDate3:fd.get('compDate3'),rbComp:median([comp1,comp2,comp3]),inflation:number(fd.get('inflation')),exitReason:fd.get('exitReason'),localDensity:number(fd.get('localDensity')),cityAverage:Math.max(0,number(fd.get('cityAverage'))),suggestedBusiness:fd.get('suggestedBusiness'),marketCounts:{...data.marketCounts},negotiationMargin:clamp(number(fd.get('negotiationMargin')),0,100),saturation:number(fd.get('localDensity'))>0?clamp(number(fd.get('businessCount'))/number(fd.get('localDensity'))*100,0,100):null,visibility:clamp(number(fd.get('visibility')),1,5),parking:clamp(number(fd.get('parking')),1,5),internalLocation:clamp(number(fd.get('internalLocation')),1,5),physicalState:clamp(number(fd.get('physicalState')),1,5)};};
    const status=dialog.querySelector('#rent-calculation-saved');
    const describeState=(inputs,result)=>{
      const record=readSaved()[local],snapshot={inputs,outputs:result};
      if(rentStore.isApproved(record)&&rentStore.fingerprint(record)===rentStore.fingerprint(snapshot)){
        status.textContent=`Aprobado por ${record.approval.responsible} · ${new Date(record.approval.approvedAt).toLocaleString('es-MX')}`;
      }else status.textContent=record&&rentStore.fingerprint(record)===rentStore.fingerprint(snapshot)?'Guardado · Pendiente de aprobación':'Cambios sin guardar · Pendiente de aprobación';
    };
    const update=event=>{
      if(/^compDate[123]$/.test(event?.target.name||''))data['compSource'+event.target.name.slice(-1)]='Captura manual';
      if(event?.target.name==='suggestedBusiness')form.elements.businessCount.value=data.marketCounts[form.elements.suggestedBusiness.value]||0;
      if(['businessCount','localDensity','cityAverage'].includes(event?.target.name))data.marketSource='Captura manual';
      data.marketCounts[form.elements.suggestedBusiness.value]=number(form.elements.businessCount.value);
      const allRecent=[1,2,3].every(i=>model.recent(form.elements['compDate'+i].value));
      form.elements.inflation.readOnly=allRecent;
      if(allRecent)form.elements.inflation.value='0.00';
      form.elements.businessCount.setCustomValidity(number(form.elements.businessCount.value)>number(form.elements.localDensity.value)?'El conteo del giro no puede superar el total de negocios.':'');
      const inputs=current(),result=calculate(inputs);
      form.querySelector('#rent-inflation-note').textContent=allRecent?'Facturas o ajustes del año actual: inflación 0.00% para evitar duplicar el incremento.':'IPC manual: se aplica solo a comparables sin factura/ajuste del año actual. Sin fechas, valida el período antes de capturarlo.';
      form.querySelector('#rent-market-note').textContent=(inputs.saturation==null?'Saturación sin datos':('Saturación: '+inputs.saturation.toFixed(2)+'%'))+' · '+data.marketSource;
      preview.innerHTML=reportHtml(inputs,result);describeState(inputs,result);
    };
    form.addEventListener('input',update);form.addEventListener('change',update);update();
    dialog.querySelectorAll('[data-close-calculator]').forEach(item=>item.addEventListener('click',()=>dialog.close()));
    const validSnapshot=()=>{
      if(!form.reportValidity())return null;
      const inputs=current(),outputs=calculate(inputs);
      if(!Number.isFinite(outputs.target)||outputs.target<=0){status.textContent='La renta sugerida debe ser mayor que cero.';return null;}
      return {inputs,outputs};
    };
    dialog.querySelector('#save-rent-calculation').addEventListener('click',()=>{
      const snapshot=validSnapshot();if(!snapshot)return;
      try{save(local,snapshot);describeState(snapshot.inputs,snapshot.outputs);}catch{status.textContent='No se pudo guardar el cálculo. Revisa el almacenamiento del navegador.';}
    });
    const openApproval=()=>{
      const snapshot=validSnapshot();if(!snapshot)return;
      let approvalDialog=document.getElementById('rent-approval-dialog');
      if(!approvalDialog){approvalDialog=document.createElement('dialog');approvalDialog.id='rent-approval-dialog';approvalDialog.setAttribute('aria-labelledby','rent-approval-title');document.body.appendChild(approvalDialog);approvalDialog.addEventListener('click',event=>{if(event.target===approvalDialog)approvalDialog.close();});}
      const savedVersion=JSON.stringify(readSaved()[local]||null);
      const previous=readSaved()[local]?.approval;
      let systemUsers=[];
      try{const saved=JSON.parse(localStorage.getItem('rp-system-users')||'[]');if(Array.isArray(saved))systemUsers=saved;}catch{}
      const currentName=localStorage.getItem('rp-user-name')||'Alyn';
      const currentInactive=systemUsers.some(user=>user.name===currentName&&user.status==='Inactivo');
      const responsibleNames=[...new Set([...(currentInactive?[]:[currentName]),...systemUsers.filter(user=>user.status!=='Inactivo').map(user=>user.name)].filter(name=>typeof name==='string'&&name.trim()))];
      const conformity='He revisado el cálculo de la renta sugerida, comprendo sus ajustes y estoy de acuerdo con el resultado para autorizar su aprobación.';

      approvalDialog.innerHTML=`<form class="rent-approval-form"><header><div><small>AUTORIZACIÓN DE RENTA SUGERIDA</small><h2 id="rent-approval-title">Aprobar Cálculo</h2></div><button type="button" data-close-approval aria-label="Cerrar aprobación"><span class="material-symbols-outlined">close</span></button></header><div class="rent-approval-body"><div class="rent-approval-summary"><strong>${safe(local)} · ${safe(station)}</strong><b>${money(snapshot.outputs.target,2)} MXN/mes</b><span>${money(snapshot.outputs.suggestedM2,2)}/m² · ${snapshot.inputs.area} m²</span></div><p>Se guardará y aprobará este cálculo. Si después cambian sus datos, será necesaria una nueva aprobación.</p>${previous?`<p class="rent-approval-previous">Última aprobación: ${safe(previous.responsible)} · ${new Date(previous.approvedAt).toLocaleString('es-MX')}<br>${safe(previous.declaration)}</p>`:''}<section class="rent-approval-step"><h3><span>1</span><label for="rent-approval-responsible">Responsable que firma</label></h3><p>Selecciona un usuario del sistema.</p><select id="rent-approval-responsible" name="responsible" required aria-label="Responsable que firma">${responsibleNames.length?responsibleNames.map(name=>`<option value="${safe(name)}">${safe(name)}</option>`).join(''):'<option value="">No hay usuarios activos disponibles</option>'}</select></section><section class="rent-approval-step"><h3><span>2</span>Declaración de conformidad</h3><p>Confirma que el cálculo fue revisado.</p><label class="rent-approval-consent"><input id="rent-approval-consent" name="consent" type="checkbox" required><span>${conformity}</span></label></section><p id="rent-approval-error" role="alert" hidden></p></div><footer><button type="button" data-close-approval>Cancelar</button><button type="submit">Confirmar aprobación</button></footer></form>`;
      approvalDialog.querySelectorAll('[data-close-approval]').forEach(item=>item.addEventListener('click',()=>approvalDialog.close()));
      approvalDialog.querySelector('form').addEventListener('submit',event=>{
        event.preventDefault();const fields=new FormData(event.currentTarget);
        try{
          // Another tab may have changed the saved calculation while this dialog was open.
          const now=current();if(rentStore.fingerprint({inputs:now,outputs:calculate(now)})!==rentStore.fingerprint(snapshot))throw new Error('El cálculo cambió. Cierra y revisa la renta antes de aprobar.');
          if(JSON.stringify(readSaved()[local]||null)!==savedVersion)throw new Error('El cálculo guardado cambió en otra ventana. Cierra y vuelve a abrirlo antes de aprobar.');
          if(!fields.has('consent')||!responsibleNames.includes(fields.get('responsible')))throw new Error('Selecciona un responsable y confirma la declaración de conformidad.');
          rentStore.approve(local,snapshot,{responsible:fields.get('responsible'),declaration:conformity});
          approvalDialog.close();describeState(snapshot.inputs,snapshot.outputs);
        }catch(error){const message=approvalDialog.querySelector('#rent-approval-error');message.hidden=false;message.textContent=error.message;}
      });
      approvalDialog.showModal();
    };
    dialog.querySelector('#approve-rent-calculation').addEventListener('click',openApproval);

    dialog.querySelector('#download-rent-calculation').addEventListener('click',async event=>{
      const button=event.currentTarget;
      if(button.disabled)return;
      const original=button.innerHTML;
      button.disabled=true;button.textContent='Preparando PDF…';
      try{
      const paper=preview.querySelector('.rent-report-paper');
      await document.fonts.ready;
      const footerBottom=paper.lastElementChild.getBoundingClientRect().bottom-paper.getBoundingClientRect().top;
      const available=paper.clientHeight-parseFloat(getComputedStyle(paper).paddingBottom);
      if(footerBottom>available+2){
        dialog.querySelector('#rent-calculation-saved').textContent='El texto excede una hoja carta. Abrevia los campos extensos antes de imprimir.';
        return;
      }
      await window.rpLoadRentPdf();
      const [logo,font]=await window.rpRentPdfArtwork();
      const canvas=await window.html2canvas(paper,{width:816,height:1056,scale:3,backgroundColor:'#ffffff',foreignObjectRendering:true,logging:false,
        onclone:document=>{
          const copy=document.querySelector('.rent-report-paper');
          // Capture the whole sheet independently of the editor's scroll position and modal clipping.
          document.body.appendChild(copy);
          copy.querySelectorAll('table,thead,tbody,tr,th,td,caption').forEach(element=>{element.style.height='auto';});
          copy.querySelector('img').src=logo;
          const fonts=document.createElement('style');
          fonts.textContent=`@font-face{font-family:Inter;font-style:normal;font-weight:400 800;src:url(${font}) format('woff2')}`;
          copy.prepend(fonts);
          copy.style.cssText+=';transform:none!important;position:fixed;left:0;top:0;margin:0;z-index:2147483647;box-shadow:none';
          document.querySelector('#rent-calculation-dialog')?.remove();
        }});
      const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'pt',format:'letter',compress:true});
      pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,612,792);
      const name=String(local).replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/[. ]+$/g,'').trim()||'Local';
      pdf.save(`Calculo Renta-${name}.pdf`);
      }catch(error){status.textContent='No se pudo descargar el PDF. Intenta nuevamente.';console.error('Error al generar el reporte PDF',error);}
      finally{button.disabled=false;button.innerHTML=original;}
    });dialog.showModal();
  };
  document.addEventListener('click',event=>{const button=event.target.closest('.view-calculation[data-local]');if(button)openCalculator(button);});
});
