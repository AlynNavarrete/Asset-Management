document.addEventListener('DOMContentLoaded',()=>{
  const button=document.getElementById('download-market-pdf');
  if(!button)return;
  const toDataUrl=async(url)=>{if(!url)return'';try{const response=await fetch(url,{mode:'cors'});if(!response.ok)return'';const blob=await response.blob();return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>resolve('');reader.readAsDataURL(blob);});}catch(error){return'';}};
  const capture=async(element)=>{if(!window.html2canvas||!element)return'';try{return(await window.html2canvas(element,{useCORS:true,allowTaint:false,scale:1.35,logging:false})).toDataURL('image/jpeg',.84);}catch(error){return'';}};
  button.addEventListener('click',async()=>{
    const c=window.marketReportContext;
    if(!c||!window.jspdf?.jsPDF){window.print();return;}
    const {data,radiusLabel,points,liveDenue,counts,predominant,share,baseScores,mixedProspects,actualM2,zoneM2,suggestedM2,suggestedRent}=c;
    const toast=document.getElementById('market-toast');
    if(toast){toast.textContent='Generando reporte vertical detallado…';toast.classList.add('visible');}
    const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'letter'});
    const C={navy:[17,49,91],blue:[38,117,168],cyan:[70,183,216],pale:[239,243,248],ink:[27,39,56],muted:[91,106,125],gold:[247,178,34],green:[76,174,144],line:[210,220,231]};
    const money=value=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(value);
    const today=new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'});
    const [logo,photo,mapImage]=await Promise.all([toDataUrl('/assets/redpetroil-icon.png'),toDataUrl(data.photo),capture(document.getElementById('denue-map'))]);
    const pageWidth=pdf.internal.pageSize.getWidth(),pageHeight=pdf.internal.pageSize.getHeight(),right=pageWidth-12;
    const header=(page,title)=>{pdf.setFillColor(248,250,252);pdf.rect(0,0,pageWidth,pageHeight,'F');if(logo)pdf.addImage(logo,'PNG',12,8,15,15);pdf.setTextColor(...C.ink);pdf.setFont('helvetica','bold');pdf.setFontSize(13);pdf.text('INTELIGENCIA DE MERCADO',32,14);pdf.setFontSize(7.5);pdf.setTextColor(...C.blue);pdf.text('POTENCIAL COMERCIAL · REDPETROIL',32,20);pdf.setTextColor(...C.muted);pdf.setFont('helvetica','normal');pdf.text(`${data.local} · ${data.station}`,right-55,12);pdf.text(`Página ${page} de 3 · ${today}`,right-55,18);pdf.setDrawColor(...C.line);pdf.line(12,27,right,27);pdf.setTextColor(...C.ink);pdf.setFont('helvetica','bold');pdf.setFontSize(16);pdf.text(title,12,38);};
    const section=(number,title,y)=>{pdf.setFillColor(...C.navy);pdf.roundedRect(12,y,186,9,2,2,'F');pdf.setTextColor(255);pdf.setFont('helvetica','bold');pdf.setFontSize(8.5);pdf.text(`${number}. ${title}`,16,y+6);};
    const label=(text,x,y)=>{pdf.setTextColor(...C.muted);pdf.setFont('helvetica','bold');pdf.setFontSize(6);pdf.text(text.toUpperCase(),x,y);};
    const value=(text,x,y,size=10)=>{pdf.setTextColor(...C.ink);pdf.setFont('helvetica','bold');pdf.setFontSize(size);pdf.text(String(text),x,y);};
    const footer=()=>{const y=pageHeight-10;pdf.setDrawColor(...C.line);pdf.line(12,y-4,right,y-4);pdf.setTextColor(...C.muted);pdf.setFont('helvetica','normal');pdf.setFontSize(7);pdf.text('Documento de apoyo comercial. Los resultados deben validarse antes de formalizar una propuesta.',12,y);};
    const parking=data.parking||Math.max(2,Math.round(data.area/30));
    const address=data.address||`Estación RedPetroil ${data.station}, ${data.city}`;
    const estimatedM2=Math.round(suggestedRent/data.area);

    header(1,'Resumen ejecutivo y ubicación');
    section(1,'FICHA DEL LOCAL VACANTE',45);
    pdf.setFillColor(255);pdf.roundedRect(12,58,186,61,2,2,'F');pdf.setDrawColor(...C.line);pdf.roundedRect(12,58,186,61,2,2,'S');
    if(photo)pdf.addImage(photo,'JPEG',16,62,58,43,undefined,'FAST');else{pdf.setFillColor(228,235,243);pdf.roundedRect(16,62,58,43,2,2,'F');pdf.setTextColor(...C.muted);pdf.setFontSize(8);pdf.text('Fotografía del local',45,84,{align:'center'});}
    value(`${data.local} · ${data.station}`,81,67,13);label('Estatus',81,75);value(data.status,81,81,8.5);label('Municipio',121,75);value(data.city,121,81,8.5);
    label('Superficie',81,91);value(`${data.area.toLocaleString('es-MX')} m²`,81,98);label('Renta estimada',121,91);value(money(suggestedRent),121,98);label('Renta estimada por m²',164,91);value(`${money(estimatedM2)}/m²`,164,98,8.5);
    label('Cajones asignados',81,108);value(`${parking} ${data.parking?'asignados':'estimados'}`,81,114,8);label('Coordenadas',135,108);value(`${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`,135,114,7.2);
    label('Dirección del local',16,111);pdf.setTextColor(...C.ink);pdf.setFont('helvetica','normal');pdf.setFontSize(6.5);pdf.text(pdf.splitTextToSize(address,55),16,116);
    section(2,'MAPA Y RADIO ANALIZADO',123);
    if(mapImage)pdf.addImage(mapImage,'JPEG',12,136,118,65,undefined,'FAST');else{pdf.setFillColor(30,47,68);pdf.roundedRect(12,136,118,65,2,2,'F');pdf.setDrawColor(...C.cyan);pdf.circle(71,168,25,'S');pdf.setFillColor(...C.blue);pdf.circle(71,168,4,'F');}
    const metricCards=[['Radio',radiusLabel],['Densidad',`${points.length} negocios`],['Competencia',document.getElementById('competition-label')?.textContent||'Media'],['Giro predominante',predominant.label],['Participación',`${share}% del entorno`]];
    metricCards.forEach(([name,val],index)=>{const y=136+index*13;pdf.setFillColor(...C.pale);pdf.roundedRect(135,y,63,10.5,2,2,'F');label(name,139,y+3.8);pdf.setTextColor(...C.ink);pdf.setFont('helvetica','bold');pdf.setFontSize(String(val).length>20?7:8.5);pdf.text(pdf.splitTextToSize(String(val),55),139,y+8.2);});
    section(3,'LECTURA EJECUTIVA DEL ENTORNO',207);
    pdf.setTextColor(...C.ink);pdf.setFont('helvetica','normal');pdf.setFontSize(8);const executive=`El radio de ${radiusLabel} concentra ${points.length} establecimientos. ${predominant.label} representa ${share}% de la actividad identificada. La mezcla comercial, el flujo asociado a la estación ${data.station} y la superficie de ${data.area.toLocaleString('es-MX')} m² favorecen conceptos de compra recurrente y permanencia corta. El nivel de competencia es ${String(document.getElementById('competition-label')?.textContent||'medio').toLowerCase()}.`;pdf.text(pdf.splitTextToSize(executive,178),16,222);
    pdf.setFillColor(...C.pale);pdf.roundedRect(12,243,186,19,2,2,'F');label('Fuente y alcance',16,249);pdf.setFont('helvetica','normal');pdf.setFontSize(7);pdf.setTextColor(...C.muted);pdf.text(pdf.splitTextToSize(liveDenue?'Establecimientos consultados mediante DENUE INEGI. Se muestran los contactos publicados por la fuente.':'Vista estimada para demostración. Configure el token DENUE para consultar teléfonos y correos oficiales.',178),16,255);footer();

    pdf.addPage();header(2,'Análisis comercial y compatibilidad');
    section(4,'DESGLOSE DE ACTIVIDAD ECONÓMICA · DENUE',45);
    pdf.setFillColor(...C.navy);pdf.rect(12,58,186,9,'F');pdf.setTextColor(255);pdf.setFont('helvetica','bold');pdf.setFontSize(7);pdf.text('Categoría comercial',17,64);pdf.text('Negocios',121,64);pdf.text('Participación',159,64);
    counts.forEach((item,index)=>{const y=67+index*11;pdf.setFillColor(index%2?248:237,index%2?250:242,index%2?252:247);pdf.rect(12,y,186,11,'F');pdf.setTextColor(...C.ink);pdf.setFont('helvetica','normal');pdf.setFontSize(7.5);pdf.text(item.label,17,y+7);pdf.text(String(item.count),126,y+7);pdf.text(`${Math.round(item.count/Math.max(points.length,1)*100)}%`,169,y+7);});
    pdf.setFillColor(...C.pale);pdf.roundedRect(12,116,186,25,2,2,'F');label('Interpretación',16,123);pdf.setTextColor(...C.ink);pdf.setFont('helvetica','normal');pdf.setFontSize(7);pdf.text(pdf.splitTextToSize(`La categoría dominante es ${predominant.label.toLowerCase()}. Las oportunidades deben priorizar giros complementarios que eleven la frecuencia de visita sin duplicar en exceso la oferta inmediata.`,178),16,130);
    section(5,'SCORE DE AFINIDAD',149);
    baseScores.forEach((item,index)=>{const y=164+index*26;pdf.setTextColor(...C.ink);pdf.setFont('helvetica','bold');pdf.setFontSize(8.5);pdf.text(`${item[0]} · ${item[2]}%`,16,y);pdf.setFillColor(220,227,235);pdf.roundedRect(16,y+4,82,4,2,2,'F');pdf.setFillColor(...C.blue);pdf.roundedRect(16,y+4,.82*item[2],4,2,2,'F');pdf.setFont('helvetica','normal');pdf.setFontSize(6.6);pdf.setTextColor(...C.muted);pdf.text(pdf.splitTextToSize(item[3],92),104,y);});
    footer();

    pdf.addPage();header(3,'Prospectos, valuación y recomendaciones');
    section(6,'INQUILINOS POTENCIALES · SISTEMA + DENUE',45);
    mixedProspects.slice(0,8).forEach((prospect,index)=>{const col=index<4?0:1,row=index%4,x=12+col*94,y=59+row*21;pdf.setFillColor(255);pdf.roundedRect(x,y,90,17,2,2,'F');pdf.setDrawColor(...C.line);pdf.roundedRect(x,y,90,17,2,2,'S');pdf.setTextColor(...C.ink);pdf.setFont('helvetica','bold');pdf.setFontSize(8);pdf.text(pdf.splitTextToSize(prospect.name,57),x+4,y+5.5);pdf.setFillColor(...(prospect.source==='Sistema'?C.gold:C.cyan));pdf.roundedRect(x+68,y+2.5,18,5.5,3,3,'F');pdf.setTextColor(...C.ink);pdf.setFontSize(5.5);pdf.text(prospect.source==='Sistema'?'SISTEMA':'DENUE',x+77,y+6.2,{align:'center'});const contacts=[prospect.phone,prospect.email,prospect.website].filter(Boolean).join(' · ')||'Contacto no publicado';pdf.setTextColor(...C.muted);pdf.setFont('helvetica','normal');pdf.setFontSize(6.6);pdf.text(pdf.splitTextToSize(`${prospect.detail} · Afinidad ${prospect.score}% · ${contacts}`,82),x+4,y+11.5);});
    section(7,'VALUACIÓN COMERCIAL',148);
    const chart=[['Zona',zoneM2,C.blue],['Actual',actualM2,C.gold],['Estimado',suggestedM2,C.green]],max=Math.max(...chart.map(item=>item[1]));
    let savedCalculation={};try{savedCalculation=JSON.parse(localStorage.getItem('rp-vacancy-rent-calculations')||'{}')[data.local]||{};}catch{}const calculation=savedCalculation.outputs||{},rangeMin=Number(calculation.floor)||Math.round(suggestedRent*.90),rangeMax=Number(calculation.publication)||Math.round(suggestedRent*1.07);
    pdf.setTextColor(...C.ink);pdf.setFont('helvetica','bold');pdf.setFontSize(8);pdf.text('Comparación de mercado ($/m²)',18,163);
    chart.forEach(([name,val,color],index)=>{const x=25+index*27,h=31*(val/max);pdf.setFillColor(...color);pdf.rect(x,202-h,16,h,'F');pdf.setTextColor(...C.ink);pdf.setFont('helvetica','bold');pdf.setFontSize(7.5);pdf.text(`$${val}`,x+8,166,{align:'center'});pdf.setFont('helvetica','normal');pdf.setFontSize(7);pdf.text(name,x+8,209,{align:'center'});});
    pdf.setFillColor(255,247,225);pdf.roundedRect(112,159,86,48,3,3,'F');pdf.setDrawColor(...C.gold);pdf.roundedRect(112,159,86,48,3,3,'S');label('Renta mensual estimada',119,169);pdf.setTextColor(...C.ink);pdf.setFont('helvetica','bold');pdf.setFontSize(17);pdf.text(`${money(suggestedRent)} MXN`,155,183,{align:'center'});pdf.setFontSize(8);pdf.text(`${money(estimatedM2)} por m²`,155,191,{align:'center'});pdf.setTextColor(...C.blue);pdf.text(`Rango: ${money(rangeMin)} — ${money(rangeMax)}`,155,199,{align:'center'});
    section(8,'RECOMENDACIONES Y SIGUIENTES PASOS',216);
    const actions=[`Contactar primero a ${mixedProspects.slice(0,2).map(item=>item.name).join(' y ')}.`,`Preparar propuesta con renta estimada de ${money(suggestedRent)} y condiciones negociables.`,`Validar en campo flujo, accesos, visibilidad y ${parking} cajones antes de presentar el local.`,`Actualizar el análisis DENUE al cambiar el radio o recibir nuevos prospectos.`];
    pdf.setTextColor(...C.ink);pdf.setFont('helvetica','normal');pdf.setFontSize(7.5);actions.forEach((action,index)=>pdf.text(`${index+1}. ${action}`,17,231+index*7));footer();
    const fileName=`Reporte-Inteligencia-Detallado-${data.local}.pdf`,blob=pdf.output('blob'),url=URL.createObjectURL(blob);let dialog=document.getElementById('market-report-preview');if(!dialog){dialog=document.createElement('dialog');dialog.id='market-report-preview';document.body.appendChild(dialog);}dialog.innerHTML=`<section class="market-report-preview-panel"><header><div><small>Vista previa · formato carta</small><h2>Reporte de Inteligencia de Mercado · ${data.local}</h2></div><button type="button" data-close-market-report aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button></header><iframe title="Vista previa del reporte de inteligencia" src="${url}"></iframe><footer><button type="button" data-close-market-report>Cerrar</button><button type="button" data-save-market-report><span class="material-symbols-outlined">download</span> Descargar PDF</button></footer></section>`;dialog.querySelectorAll('[data-close-market-report]').forEach(item=>item.addEventListener('click',()=>dialog.close()));dialog.querySelector('[data-save-market-report]').addEventListener('click',()=>{const link=document.createElement('a');link.href=url;link.download=fileName;link.click();});dialog.addEventListener('close',()=>setTimeout(()=>URL.revokeObjectURL(url),500),{once:true});dialog.showModal();
    if(toast){toast.textContent='Reporte listo para revisar.';setTimeout(()=>toast.classList.remove('visible'),2400);}
  });
});
