(() => {
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}};
  const day=value=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return NaN;
    const time=Date.parse(value+'T00:00:00Z');
    return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value?time/86400000:NaN;
  };
  const profiles=()=>{
    const records=[
      {station:'La Marina',city:'Mazatlán',localId:'L-01',commercialName:"Rico's",endDate:'2026-10-01'},
      {station:'Revolución',city:'Culiacán',localId:'L-01',commercialName:'OXXO Revolución',endDate:'2026-12-31'}
    ];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith('rp-local-detail:'))continue;
      const saved=read(key,null);if(!saved||typeof saved!=='object'||Array.isArray(saved))continue;
      const [,station,localId]=key.split(':');
      const index=records.findIndex(item=>item.station===station&&item.localId===localId);
      const record={...(index>=0?records[index]:{}),...saved,station,localId};
      if(index>=0)records[index]=record;else records.push(record);
    }
    return records;
  };
  const upcoming=(now=new Date())=>{
    const today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000;
    return profiles().map(item=>({...item,days:day(item.endDate)-today})).filter(item=>Number.isFinite(item.days)&&item.days>=0&&item.days<=180&&!/vacante|disponible/i.test(item.status||'')).sort((a,b)=>a.days-b.days||String(a.commercialName).localeCompare(String(b.commercialName),'es'));
  };
  const localHref=item=>'/Detalle%20del%20Local/code.html?'+new URLSearchParams({station:item.station,city:item.city||'',local:item.localId}).toString();
  const sortActivities=items=>[...items].sort((a,b)=>Number(Boolean(a.complete))-Number(Boolean(b.complete))||({high:0,medium:1,low:2}[a.priority]??2)-({high:0,medium:1,low:2}[b.priority]??2)||((Number.isFinite(day(a.date))?day(a.date):Infinity)-(Number.isFinite(day(b.date))?day(b.date):Infinity))||String(a.id).localeCompare(String(b.id)));
  window.rpHomeData={read,day,profiles,upcoming,localHref,sortActivities};
})();
