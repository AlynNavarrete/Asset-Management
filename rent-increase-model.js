(function(root){
  const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const isoDate=value=>{
    const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value||'');if(!match)return '';
    const iso=`${match[3]}-${match[2]}-${match[1]}`,date=new Date(iso+'T12:00:00Z');
    return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:'';
  };
  const displayDate=iso=>/^\d{4}-\d{2}-\d{2}$/.test(iso||'')?iso.split('-').reverse().join('/'):'—';
  const calculate=(rent,previous,current)=>{
    if(![rent,previous,current].every(value=>Number.isFinite(value)&&value>0))return null;
    const ratio=current/previous,amount=Math.round((rent*ratio+Number.EPSILON)*100)/100;
    return Number.isFinite(amount)&&amount>0?{amount,variationPercent:(ratio-1)*100}:null;
  };
  const periodLabel=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(value||'')?`${months[Number(value.slice(5))-1]} ${value.slice(0,4)}`:'Sin registro';
  const api={months,isoDate,displayDate,calculate,periodLabel};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.rpRentIncrease=api;
})(typeof window==='undefined'?globalThis:window);
