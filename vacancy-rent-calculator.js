document.addEventListener('DOMContentLoaded',()=>{
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const money=(value,digits=0)=>number(value).toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:digits,maximumFractionDigits:digits});
  const pct=value=>`${value>=0?'+':''}${(value*100).toFixed(2)}%`;
  const median=values=>{const sorted=values.map(Number).sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]||0;};
  const safe=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const rentStore=window.rpRentCalculations;
  const readSaved=rentStore.read;
  const save=rentStore.save;
  const defaults=(local,station,city,area,reference)=>{
    const seed=[...local].reduce((sum,char)=>sum+char.charCodeAt(0),0);
    const base=Number((reference/area).toFixed(2));let history=[];try{history=JSON.parse(localStorage.getItem('rp-former-tenants')||'[]');}catch{}
    const normalized=value=>String(value||'').trim().toLocaleLowerCase('es');
    if(!Array.isArray(history)) history=[];
    history.sort((a,b)=>String(b.endDate||'').localeCompare(String(a.endDate||'')));
    const previous=history.find(item=>normalized(item.local)===normalized(local)&&normalized(item.station)===normalized(station));
    const stationHistory=history.filter(item=>Number(item.rentM2)>0&&normalized(item.station)===normalized(station));
    const cityHistory=history.filter(item=>Number(item.rentM2)>0&&normalized(item.city)===normalized(city)&&!stationHistory.some(saved=>saved.id===item.id));
    const comparable=[...stationHistory,...cityHistory].slice(0,3),fallback=[Number((base*.94).toFixed(2)),base,Number((base*1.06).toFixed(2))];
    const values=fallback.map((value,index)=>Number(comparable[index]?.rentM2||value)),dates=fallback.map((_,index)=>String(comparable[index]?.startDate||'').slice(0,10));
    const identities=Object.fromEntries([1,2,3].flatMap((i)=>{const c=comparable[i-1];return [[`compName${i}`,c?[c.local,c.station,c.tenant].filter(Boolean).join(' · '):''],[`compBusiness${i}`,c?.business||'']];}));
    return{...identities,previousTenant:previous?.tenant||'',previousRent:previous?.monthlyRent??'',previousExitDate:previous?.endDate||'',previousExitReason:previous?.exitReason||'',local,station,city,area,reference,comp1:values[0],comp2:values[1],comp3:values[2],compDate1:dates[0],compDate2:dates[1],compDate3:dates[2],rbComp:median(values),inflation:Number((4.1+(seed%24)/10).toFixed(1)),exitReason:previous?.exitReason||'Normal',localDensity:22+(seed%19),cityAverage:27+(seed%12),saturation:28+(seed%38),visibility:3+(seed%3),parking:2+(seed%4),internalLocation:3+((seed+1)%3),physicalState:3+((seed+2)%3)};
  };
  const calculate=data=>{
    const reason={"Quiebra por Renta Alta":-.05,'Normal':0,'Expansión':.03}[data.exitReason]||0;
    const histRaw=data.inflation/100+reason,hist=clamp(histRaw,-.10,.10);
    const denueRaw=(data.localDensity/Math.max(data.cityAverage,1)*.05)-(data.saturation/100*.03),denue=clamp(denueRaw,-.08,.08);
    const physicalRaw=(data.visibility-3)*.025+(data.parking-3)*.02+(data.internalLocation-3)*.025+(data.physicalState-3)*.03,physical=clamp(physicalRaw,-.10,.10);
    const suggestedM2=data.rbComp*(1+hist)*(1+denue+physical),target=suggestedM2*data.area,floor=target*.90,publication=target*1.07;
    return{reason,histRaw,hist,denueRaw,denue,physicalRaw,physical,suggestedM2,target,floor,publication};
  };
  const textField=(label,name,value,type='text')=>`<label><span>${label}</span><input name="${name}" type="${type}" ${type==='number'?'step="0.01" min="0"':''} value="${safe(value)}"></label>`;
  const field=(label,name,value,extra='')=>`<label><span>${label}</span><input name="${name}" type="number" step="0.01" value="${value}" ${extra}></label>`;
  const ensureDialog=()=>{let dialog=document.getElementById('rent-calculation-dialog');if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='rent-calculation-dialog';document.body.appendChild(dialog);dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});return dialog;};
  const reportHtml=(data,result)=>{
    const impact=value=>value>0?'Positivo':value<0?'Negativo':'Neutro';
    const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?value.split('-').reverse().join('/'):'Sin registro';
    const signed=value=>`${value<0?'−':'+'}${money(Math.abs(value),2)}`;
    const adjustedBase=data.rbComp*(1+result.hist);
    // Allocate the interaction terms to DENUE and physical, matching the existing formula.
    const contributions=[data.rbComp*result.hist,adjustedBase*result.denue,adjustedBase*result.physical];
    const saturationLabel=data.saturation<30?'Oportunidad alta / Poca competencia':data.saturation<=60?'Oferta equilibrada':'Competencia alta / Zona saturada';
    return `<article class="rent-report-paper">
      <header><div><small>ASSET MANAGEMENT · REDPETROIL</small><h1>Reporte de Cálculo de Vacante</h1><p>Metodología de renta sugerida y rango de negociación</p></div><img src="/assets/redpetroil-logo.png" alt="RedPetroil"></header>
      <section class="rent-report-summary"><div><small>LOCAL / ESTACIÓN</small><b>${safe(data.local)} · ${safe(data.station)}</b><span>${safe(data.city)}</span></div><div><small>SUPERFICIE</small><b>${number(data.area).toLocaleString('es-MX')} m²</b><span>Ficha técnica</span></div><div class="highlight"><small>PRECIO OBJETIVO</small><b>${money(result.target,2)}</b><span>MXN/mes · ${money(result.suggestedM2,2)}/m²</span></div></section>
      <section><h2>1. Renta Base Comparable</h2><table class="rent-comparables"><thead><tr><th>Local / Estación</th><th>Giro Comercial</th><th>Fecha de Contrato</th><th>Renta $/m²</th></tr></thead><tbody>${[1,2,3].map(i=>`<tr><td>${safe(data[`compName${i}`]||'Sin identificar · referencia estimada')}</td><td>${safe(data[`compBusiness${i}`]||'Sin registro')}</td><td>${date(data[`compDate${i}`])}</td><td>${money(data[`comp${i}`],2)}</td></tr>`).join('')}<tr class="total"><td colspan="3">RB_comp (mediana)</td><td>${money(data.rbComp,2)}/m²</td></tr></tbody></table></section>
      <section><h2>2. Fuentes de Datos · Contexto de Insumos</h2><div class="rent-source-grid">
        <div><h3>Historial de Contrato</h3><p><strong>Último inquilino:</strong> ${safe(data.previousTenant||'Sin registro')}</p><p><strong>Renta previa:</strong> ${data.previousRent!==''&&data.previousRent!=null?money(data.previousRent,2)+' MXN/mes':'Sin registro'}</p><p><strong>Salida:</strong> ${date(data.previousExitDate)}</p><p><strong>Motivo:</strong> ${safe(data.previousExitReason||'Sin registro')}</p></div>
        <div><h3>Ficha Técnica del Local</h3><p><strong>Superficie:</strong> ${number(data.area).toLocaleString('es-MX')} m².</p><p><strong>Atributos evaluados:</strong> visibilidad, estacionamiento, ubicación interna y estado físico.</p><p>Escala: 1/5 desfavorable; 3/5 neutro; 5/5 favorable.</p></div>
        <div><h3>DENUE · INEGI</h3><p><strong>Densidad:</strong> ${data.localDensity} negocios en 800 m de radio; promedio ciudad: ${data.cityAverage}.</p><p><strong>Saturación:</strong> ${data.saturation}% · ${saturationLabel}.</p><p class="rent-method-note">&lt; 30%: oportunidad alta / poca competencia.<br>30%–60%: oferta equilibrada.<br>&gt; 60%: competencia alta / zona saturada.</p></div>
      </div></section>
      <section><h2>3. Desglose de Ajustes</h2><div class="rent-factor-grid">
        <div><small>AJUSTE HISTÓRICO</small><b class="${result.hist<0?'negative':''}">${pct(result.hist)}</b><span>Inflación ${pct(data.inflation/100)} + motivo ${pct(result.reason)} (${safe(data.exitReason)}).</span><span>Bruto: ${pct(result.histRaw)}<br>Límite: [−10%, +10%]</span><strong>Impacto: ${impact(result.hist)}</strong></div>
        <div><small>AJUSTE DENUE</small><b class="${result.denue<0?'negative':''}">${pct(result.denue)}</b><span>Densidad: ${pct(data.localDensity/data.cityAverage*.05)}<br>− Saturación: ${(data.saturation*.03).toFixed(2)}%</span><span>Bruto: ${pct(result.denueRaw)}<br>Límite: [−8%, +8%]</span><strong>Impacto: ${impact(result.denue)}</strong></div>
        <div><small>ESTADO FÍSICO</small><b class="${result.physical<0?'negative':''}">${pct(result.physical)}</b><span>Visibilidad ${data.visibility}/5 · estacionamiento ${data.parking}/5 · ubicación ${data.internalLocation}/5 · estado ${data.physicalState}/5.</span><span>Bruto: ${pct(result.physicalRaw)}<br>Límite: [−10%, +10%]</span><strong>Impacto: ${impact(result.physical)}</strong></div>
      </div><p class="rent-method-note">DENUE: (densidad / promedio) × 5% − saturación × 3%. Físico: Σ(nota − 3) × peso: 2.5%, 2%, 2.5%, 3%.</p></section>
      <section class="rent-formula"><h2>4. Cálculo Consolidado</h2><code>Renta/m² = RB_comp × (1 + Histórico) × (1 + DENUE + Físico)</code>
      <table class="rent-contributions"><caption>Aportación Monetaria por m²</caption><tbody><tr><td>Renta Base Comparables</td><td>${money(data.rbComp,2)}/m²</td></tr>${[['Histórico / Inflación',result.hist],['Mercado DENUE',result.denue],['Estado Físico',result.physical]].map(([label,value],i)=>`<tr><td>(${value<0?'−':'+'}) Ajuste ${label} (${pct(value)})</td><td>${signed(contributions[i])}/m²</td></tr>`).join('')}<tr class="total"><td>(=) Total Renta Sugerida</td><td>${money(result.suggestedM2,2)}/m² → ${money(result.target,2)} MXN/mes</td></tr></tbody></table><p class="rent-method-note">Histórico sobre RB_comp; DENUE y físico sobre la base ajustada por historial. Sin redondeos intermedios.</p></section>
      <section class="rent-output"><div><small>PRECIO MÍNIMO (PISO)</small><b>${money(result.floor,2)}</b><span>MXN/mes · Objetivo × 0.90</span></div><div class="objective"><small>PRECIO OBJETIVO</small><b>${money(result.target,2)}</b><span>${money(result.suggestedM2,2)}/m² × ${data.area} m²</span></div><div><small>PRECIO DE SALIDA</small><b>${money(result.publication,2)}</b><span>MXN/mes · Objetivo × 1.07</span></div></section>
      <footer><b>Rango de Negociación: ${money(result.floor,2)} — ${money(result.publication,2)} MXN/mes</b><span>${new Date().toLocaleString('es-MX')} · Insumos editables por validar. DENUE sin API conectada. Comparables sin identidad: estimados, no contratos verificados.</span></footer>
    </article>`;
  };

  const openCalculator=button=>{
    const row=button.closest('tr'),cells=row?.cells;if(!cells)return;
    const local=button.dataset.local,station=cells[1].textContent.trim(),city=cells[2].textContent.trim(),area=number(cells[4].textContent.replace(/[^\d.]/g,''),1),reference=number(cells[5].textContent.replace(/[^\d.]/g,''),0);
    const savedInputs=readSaved()[local]?.inputs;
    const data={...defaults(local,station,city,area,reference),...(savedInputs||{})};data.area=area;data.reference=reference;
    // Legacy numeric snapshots cannot be attributed to newly selected historical records.
    if(savedInputs) [1,2,3].forEach(i=>{if(!Object.prototype.hasOwnProperty.call(savedInputs,`compName${i}`)){data[`compName${i}`]='';data[`compBusiness${i}`]='';}});
    const dialog=ensureDialog();dialog.innerHTML=`<section class="rent-calculator-modal"><header><div><small>CÁLCULO DE RENTA SUGERIDA</small><h2>${safe(local)} · ${safe(station)}</h2><p>Edita las variables y revisa el reporte en tiempo real.</p></div><button type="button" data-close-calculator aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button></header><div class="rent-calculator-layout"><aside><form id="rent-calculation-form"><fieldset><legend>Renta base e historial</legend>${field('Superficie del local (m²)','area',data.area,'readonly')}${field('Comparable 1 ($/m²)','comp1',data.comp1,'min="0"')}${field('Comparable 2 ($/m²)','comp2',data.comp2,'min="0"')}${field('Comparable 3 ($/m²)','comp3',data.comp3,'min="0"')}<label><span>Fecha comparable 1</span><input name="compDate1" type="date" value="${data.compDate1}"></label><label><span>Fecha comparable 2</span><input name="compDate2" type="date" value="${data.compDate2}"></label><label><span>Fecha comparable 3</span><input name="compDate3" type="date" value="${data.compDate3}"></label>${[1,2,3].map(i=>textField(`Local / estación / inquilino ${i}`,`compName${i}`,data[`compName${i}`])+textField(`Giro comercial ${i}`,`compBusiness${i}`,data[`compBusiness${i}`])).join('')}${textField('Último inquilino','previousTenant',data.previousTenant)}${textField('Renta previa mensual (MXN)','previousRent',data.previousRent,'number')}${textField('Fecha de salida','previousExitDate',data.previousExitDate,'date')}${textField('Motivo de desocupación registrado','previousExitReason',data.previousExitReason)}${field('Inflación acumulada (%)','inflation',data.inflation)}<label><span>Motivo aplicado al ajuste</span><select name="exitReason"><option>Quiebra por Renta Alta</option><option>Normal</option><option>Expansión</option><option>Incumplimiento</option><option>Reubicación</option><option>Fin de contrato</option><option>Otro</option></select></label></fieldset><fieldset><legend>DENUE · radio de 800 m</legend>${field('Densidad comercial local','localDensity',data.localDensity,'min="0"')}${field('Promedio de la ciudad','cityAverage',data.cityAverage,'min="1"')}${field('Saturación del giro (%)','saturation',data.saturation,'min="0" max="100"')}</fieldset><fieldset><legend>Inspección técnica · escala 1 a 5</legend>${field('Visibilidad · peso 2.5%','visibility',data.visibility,'min="1" max="5" step="1"')}${field('Estacionamiento · peso 2.0%','parking',data.parking,'min="1" max="5" step="1"')}${field('Ubicación interna · peso 2.5%','internalLocation',data.internalLocation,'min="1" max="5" step="1"')}${field('Estado físico · peso 3.0%','physicalState',data.physicalState,'min="1" max="5" step="1"')}</fieldset></form></aside><main id="rent-report-preview"></main></div><footer><span id="rent-calculation-saved">Cambios sin guardar</span><button type="button" data-close-calculator>Cancelar</button><button type="button" id="save-rent-calculation"><span class="material-symbols-outlined">save</span>Guardar cálculo</button><button type="button" id="approve-rent-calculation"><span class="material-symbols-outlined">task_alt</span>Aprobar Cálculo</button><button type="button" id="download-rent-calculation"><span class="material-symbols-outlined">picture_as_pdf</span>Imprimir / Guardar PDF</button></footer></section>`;
    const form=dialog.querySelector('form'),preview=dialog.querySelector('#rent-report-preview');form.elements.exitReason.value=data.exitReason;
    const current=()=>{const fd=new FormData(form),comp1=number(fd.get('comp1')),comp2=number(fd.get('comp2')),comp3=number(fd.get('comp3'));return{...data,...Object.fromEntries([...fd].filter(([key])=>/^(compName|compBusiness|previous)/.test(key))),comp1,comp2,comp3,compDate1:fd.get('compDate1'),compDate2:fd.get('compDate2'),compDate3:fd.get('compDate3'),rbComp:median([comp1,comp2,comp3]),inflation:number(fd.get('inflation')),exitReason:fd.get('exitReason'),localDensity:number(fd.get('localDensity')),cityAverage:Math.max(1,number(fd.get('cityAverage'),1)),saturation:clamp(number(fd.get('saturation')),0,100),visibility:clamp(number(fd.get('visibility')),1,5),parking:clamp(number(fd.get('parking')),1,5),internalLocation:clamp(number(fd.get('internalLocation')),1,5),physicalState:clamp(number(fd.get('physicalState')),1,5)};};
    const status=dialog.querySelector('#rent-calculation-saved');
    const describeState=(inputs,result)=>{
      const record=readSaved()[local],snapshot={inputs,outputs:result};
      if(rentStore.isApproved(record)&&rentStore.fingerprint(record)===rentStore.fingerprint(snapshot)){
        status.textContent=`Aprobado por ${record.approval.responsible} · ${new Date(record.approval.approvedAt).toLocaleString('es-MX')}`;
      }else status.textContent=record&&rentStore.fingerprint(record)===rentStore.fingerprint(snapshot)?'Guardado · Pendiente de aprobación':'Cambios sin guardar · Pendiente de aprobación';
    };
    const update=()=>{const inputs=current(),result=calculate(inputs);preview.innerHTML=reportHtml(inputs,result);describeState(inputs,result);};
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
      approvalDialog.innerHTML=`<form class="rent-approval-form"><header><div><small>AUTORIZACIÓN DE RENTA SUGERIDA</small><h2 id="rent-approval-title">Aprobar Cálculo</h2></div><button type="button" data-close-approval aria-label="Cerrar aprobación"><span class="material-symbols-outlined">close</span></button></header><div class="rent-approval-body"><div class="rent-approval-summary"><strong>${safe(local)} · ${safe(station)}</strong><b>${money(snapshot.outputs.target,2)} MXN/mes</b><span>${money(snapshot.outputs.suggestedM2,2)}/m² · ${snapshot.inputs.area} m²</span></div><p>Se guardará y aprobará este cálculo. Si después cambian sus datos, será necesaria una nueva aprobación.</p>${previous?`<p class="rent-approval-previous">Última aprobación: ${safe(previous.responsible)} · ${new Date(previous.approvedAt).toLocaleString('es-MX')}<br>${safe(previous.declaration)}</p>`:''}<label for="rent-approval-responsible">Responsable de Aprobación<input id="rent-approval-responsible" name="responsible" required maxlength="120" autocomplete="name" placeholder="Nombre completo del responsable"></label><label for="rent-approval-declaration">Declaración de Conformidad<textarea id="rent-approval-declaration" name="declaration" required maxlength="2000" rows="4" placeholder="Declaro que he revisado el cálculo y estoy conforme con la renta sugerida."></textarea></label><p id="rent-approval-error" role="alert" hidden></p></div><footer><button type="button" data-close-approval>Cancelar</button><button type="submit">Confirmar aprobación</button></footer></form>`;
      approvalDialog.querySelectorAll('[data-close-approval]').forEach(item=>item.addEventListener('click',()=>approvalDialog.close()));
      approvalDialog.querySelector('form').addEventListener('submit',event=>{
        event.preventDefault();const fields=new FormData(event.currentTarget);
        try{
          // Another tab may have changed the saved calculation while this dialog was open.
          const now=current();if(rentStore.fingerprint({inputs:now,outputs:calculate(now)})!==rentStore.fingerprint(snapshot))throw new Error('El cálculo cambió. Cierra y revisa la renta antes de aprobar.');
          if(JSON.stringify(readSaved()[local]||null)!==savedVersion)throw new Error('El cálculo guardado cambió en otra ventana. Cierra y vuelve a abrirlo antes de aprobar.');
          rentStore.approve(local,snapshot,{responsible:fields.get('responsible'),declaration:fields.get('declaration')});
          approvalDialog.close();describeState(snapshot.inputs,snapshot.outputs);
        }catch(error){const message=approvalDialog.querySelector('#rent-approval-error');message.hidden=false;message.textContent=error.message;}
      });
      approvalDialog.showModal();
    };
    dialog.querySelector('#approve-rent-calculation').addEventListener('click',openApproval);

    dialog.querySelector('#download-rent-calculation').addEventListener('click',async()=>{
      const paper=preview.querySelector('.rent-report-paper');
      await document.fonts.ready;
      const footerBottom=paper.lastElementChild.getBoundingClientRect().bottom-paper.getBoundingClientRect().top;
      const available=paper.clientHeight-parseFloat(getComputedStyle(paper).paddingBottom);
      if(footerBottom>available+2){
        dialog.querySelector('#rent-calculation-saved').textContent='El texto excede una hoja carta. Abrevia los campos extensos antes de imprimir.';
        return;
      }
      // Native print retains searchable text, embedded fonts and exact Letter page geometry.
      window.print();
    });dialog.showModal();if(button.classList.contains('approve-calculation'))openApproval();
  };
  document.addEventListener('click',event=>{const button=event.target.closest('.view-calculation[data-local],.approve-calculation[data-local]');if(button)openCalculator(button);});
});
