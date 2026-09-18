(() => {
  const key = 'rp-vacancy-rent-calculations';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = () => { try { const value=JSON.parse(localStorage.getItem(key)||'{}');return value && typeof value==='object' && !Array.isArray(value) ? value : {}; } catch { return {}; } };
  const fingerprint = data => JSON.stringify(['inputs','outputs'].map(section=>Object.entries(data?.[section]||{}).sort(([a],[b])=>a.localeCompare(b)).map(([name,value])=>[name,String(value??'')])));
  const isApproved = record => Boolean(record?.approval?.responsible && record.approval.declaration && record.approval.fingerprint===fingerprint(record));
  const write = (local, data, approval) => {
    const all=read(), previous=all[local], now=new Date().toISOString();
    const unchanged=previous && fingerprint(previous)===fingerprint(data);
    const history=[...(previous?.approvalHistory||[])];
    if(previous?.approval && (!unchanged || approval)) history.push({...previous.approval,supersededAt:now,reason:unchanged?'Nueva aprobación':'Cálculo modificado'});
    const record={...data,updatedAt:now,approvalHistory:history,approval:approval?{...approval,approvedAt:now,fingerprint:fingerprint(data)}:unchanged?previous.approval:null};
    all[local]=record;
    localStorage.setItem(key,JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('rp:rent-calculation-changed',{detail:{local}}));
    return record;
  };
  const approve = (local,data,approval) => {
    const responsible=String(approval.responsible||'').trim(),declaration=String(approval.declaration||'').trim();
    if(!responsible || !declaration) throw new Error('Completa el responsable y la declaración de conformidad.');
    if(!Number.isFinite(data.outputs?.target) || data.outputs.target<=0) throw new Error('La renta sugerida debe ser mayor que cero.');
    return write(local,data,{responsible,declaration});
  };
  const renderRent = (local, fallback) => {
    const record=read()[local],approved=isApproved(record);
    const label=approved?`Renta aprobada por ${record.approval.responsible} · ${new Date(record.approval.approvedAt).toLocaleString('es-MX')}`:'Renta pendiente de aprobación';
    const value=Number.isFinite(record?.outputs?.target)?record.outputs.target:fallback;
    if(!Number.isFinite(value))return '<span class="rent-calculation-placeholder">Pendiente de cálculo</span>';
    const amount=Number.isFinite(value)?value.toLocaleString('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:record?2:0,maximumFractionDigits:record?2:0}):'Pendiente de cálculo';
    return `<span class="rent-approval-value"><span class="rent-approval-dot ${approved?'is-approved':'is-pending'}" role="img" aria-label="${escape(label)}" title="${escape(label)}" tabindex="0"></span><span>${amount}</span></span>`;
  };
  window.rpRentCalculations={key,read,fingerprint,isApproved,save:write,approve,renderRent};
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null)window.dispatchEvent(new CustomEvent('rp:rent-calculation-changed'));});
})();
