/* BALAM 0.14 · presupuesto integrado: combustible, peajes CAPUFE y viáticos manuales. */
(()=>{
'use strict';
const e=id=>document.getElementById(id);
if(!e('budget-panel'))return;
const DATA_URL='data/capufe/sonora_tarifas_2026.json';
const fmt=n=>Number(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
const money=n=>'$'+fmt(n);
const state={capufe:null,route:null,ready:false};
function val(id,min=0,max=1000000){
 const raw=e(id)?.value;
 if(raw===undefined||raw===null||String(raw).trim()==='')return null;
 const v=Number(raw);return Number.isFinite(v)&&v>=min&&v<=max?v:null;
}
function sumBudget({outKm,returnKm,kmPerLiter,price,reserve,tollOut,tollBack,includeViaticos,food,lodging,other}){
 const kmTotal=outKm+(returnKm===null?outKm:returnKm);
 const liters=kmTotal/kmPerLiter*(1+reserve/100);
 const fuel=liters*price;
 const tolls=tollOut+tollBack;
 const viatics=includeViaticos?food+lodging+other:0;
 return {kmTotal,liters,fuel,tollOut,tollBack,tolls,viatics,total:fuel+tolls+viatics,estimatedReturn:returnKm===null};
}
function getRoute(){
 const r=window.BALAM_Logistics?.getRoute?.();
 if(!r||!Number.isFinite(r.distance)||r.distance<=0)return null;
 return r;
}
function status(t){e('budget-status').textContent=t}
function controlsValid(){
 const yieldVal=val('logistics-efficiency',2,30),price=val('logistics-price',1,100),reserve=val('logistics-reserve',0,100);
 return yieldVal===null||price===null||reserve===null?null:{yieldVal,price,reserve};
}
function selectedTolls(){
 const vehicle=e('budget-vehicle-class').value;
 let tollOut=0,tollBack=0,count=0;
 if(!state.capufe)return {error:'No se pudo validar la fuente de tarifas CAPUFE. Consulta el PDF oficial; no se mostrará un total que omita casetas por error.'};
 for(const plaza of state.capufe.plazas){
  const out=val('budget-out-'+plaza.id,0,2),back=val('budget-back-'+plaza.id,0,2);
  if(out===null||back===null||!Number.isInteger(out)||!Number.isInteger(back))return {error:'Cantidad de cruces inválida en '+plaza.name};
  if(!out&&!back)continue;
  if(!['A','B2','C2'].includes(vehicle))return {error:'Selecciona la clase de peaje en CAPUFE antes de agregar casetas.'};
  const tariff=Number(plaza[vehicle]);
  if(!Number.isFinite(tariff)||tariff<0)return {error:'Tarifa sin validar para '+plaza.name};
  tollOut+=out*tariff;tollBack+=back*tariff;count+=out+back;
 }
 return {tollOut,tollBack,count,error:null};
}
function computeCurrent(){
 const r=getRoute();if(!r)return {error:'Traza una ruta vial entre dos unidades para obtener el presupuesto.'};
 const v=controlsValid();if(!v)return {error:'Revisa el rendimiento, precio o reserva de combustible.'};
 const toll=selectedTolls();if(toll.error)return {error:toll.error};
 const active=e('budget-viaticos-enabled').checked;
 const food=val('budget-food',0,100000),lodging=val('budget-lodging',0,100000),other=val('budget-other',0,100000);
 if(active&&[food,lodging,other].some(x=>x===null))return {error:'Ingresa importes válidos de viáticos (0 si no aplica).'};
 const returnKm=r.returnRoute?.distance/1000??null;
 const values=sumBudget({outKm:r.distance/1000,returnKm,kmPerLiter:v.yieldVal,price:v.price,reserve:v.reserve,
 tollOut:toll.tollOut,tollBack:toll.tollBack,includeViaticos:active,food:food??0,lodging:lodging??0,other:other??0});
 return {values,tollCount:toll.count,vehicle:e('budget-vehicle-class').value,origin:r.origin?.name||'Origen',destination:r.destination?.name||'Destino',includesViaticos:active};
}
function row(k,v,desc=''){return '<div class="budget-cost-row"><span>'+k+(desc?'<small>'+desc+'</small>':'')+'</span><strong>'+money(v)+'</strong></div>'}
function render(){
 const result=computeCurrent(),out=e('budget-result');
 if(result.error){out.textContent=result.error;e('budget-download').disabled=true;return}
 const x=result.values;e('budget-download').disabled=false;
 out.innerHTML='<p class="tiny">Traslado: '+String(result.origin).replace(/&/g,'&amp;').replace(/</g,'&lt;')+' → '+String(result.destination).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</p>'+
 row('Combustible estimado',x.fuel,fmt(x.kmTotal)+' km de trayecto total · '+fmt(x.liters)+' L con reserva')+
 row('Casetas de ida',x.tollOut)+row('Casetas de regreso',x.tollBack)+
 row('Viáticos'+(result.includesViaticos?' (incluidos)':' (no incluidos)'),x.viatics)+
 '<div class="budget-grand-total"><span>Presupuesto total estimado</span><b>'+money(x.total)+'</b></div>'+
 '<p class="tiny">Cruces de caseta seleccionados manualmente: '+result.tollCount+'. '+(x.estimatedReturn?'La distancia de regreso se estima como igual a la ida.':'Regreso calculado por separado en motor vial.')+
 ' Los precios CAPUFE son tarifas publicadas por clase; NO se detectaron automáticamente las casetas cruzadas.</p>';
}
function addSource(){
 if(!state.capufe)return;
 const box=e('budget-toll-list');
 const previous=new Map([...box.querySelectorAll('select')].map(x=>[x.id,x.value]));
 box.replaceChildren();
 const clazz=e('budget-vehicle-class').value;
 for(const plaza of state.capufe.plazas){
  const div=document.createElement('div');div.className='budget-toll-row';
  const h=document.createElement('div');h.className='budget-toll-name';
  const b=document.createElement('b');b.textContent=plaza.name;
  const sm=document.createElement('small');sm.textContent=plaza.segment+' · '+(clazz?money(plaza[clazz])+' por cruce':'selecciona clase vehicular');
  h.append(b,sm);
  div.append(h);
  for(const [label,dir] of [['Ida','out'],['Regreso','back']]){
    const wrap=document.createElement('label');wrap.textContent=label+' ';
    const ctrl=document.createElement('select');ctrl.id='budget-'+dir+'-'+plaza.id;
    ctrl.setAttribute('aria-label',plaza.name+' cruces '+label);
    for(const n of [0,1,2])ctrl.add(new Option(String(n),String(n)));
    if(previous.has(ctrl.id))ctrl.value=previous.get(ctrl.id);
    ctrl.addEventListener('change',render);
    wrap.append(ctrl);div.append(wrap);
  }
  box.append(div);
 }
 render();
}
async function loadTariffs(){
 try{
 const response=await fetch(DATA_URL,{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);
 const data=await response.json();
 if(data.schema!=='balam-capufe-sonora-v1'||data.status!=='verified_official_tariff_extract'||data.plazas?.length!==7)throw Error('Corte o estructura tarifaria sin validar');
 state.capufe=data;addSource();window.dispatchEvent(new Event('balam:capufe-ready'));
 e('budget-capufe-status').textContent='CAPUFE Red FONADIN 2026 · tarifas con IVA vigentes desde '+data.valid_from+' · 7 plazas/tramos de Sonora en catálogo.';
 }catch(err){
 state.capufe=null;e('budget-toll-list').textContent='No hay fuente CAPUFE verificable. El presupuesto conserva combustible y viáticos, sin atribuir tarifas.';
 e('budget-capufe-status').textContent='Error consultando tarifas oficiales: '+String(err.message).slice(0,100);
 render();
 }
}
function toggleViatics(){
 const active=e('budget-viaticos-enabled').checked;
 e('budget-viaticos-fields').hidden=!active;
 render();
}
function exportCsv(){
 const r=computeCurrent();if(r.error)return;
 const x=r.values;
 const rows=[
 ['BALAM v0.14','Presupuesto estimado de traslado'],
 ['Origen',r.origin],['Destino',r.destination],
 ['Kilómetros de ida',String(getRoute().distance/1000)],
 ['Kilómetros de regreso',x.estimatedReturn?'estimados = ida':String(getRoute().returnRoute.distance/1000)],
 ['Kilómetros totales',String(x.kmTotal)],
 ['Combustible litros con reserva',String(x.liters)],
 ['Combustible MXN',String(x.fuel)],
 ['Casetas ida MXN',String(x.tollOut)],
 ['Casetas regreso MXN',String(x.tollBack)],
 ['Viáticos opcionales MXN',String(x.viatics)],
 ['TOTAL MXN',String(x.total)],
 ['Tarifa CAPUFE','vigencia 2026-04-13'],
 ['Casetas','selección manual; no detección automática'],
 ['Tipo de vehículo peaje',r.vehicle||'sin seleccionar'],
 ['Fuente CAPUFE',state.capufe?.source_url||'sin fuente'],
 ['Nota','Presupuesto orientativo, sin validación de Finanzas ni disponibilidad actual; no apto despacho clínico']
 ];
 const csv='\uFEFF'+rows.map(cols=>cols.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
 a.download='BALAM_presupuesto_traslado_'+new Date().toISOString().slice(0,10)+'.csv';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function onRoute(){
 state.route=getRoute();status(state.route?'Ruta cargada; captura casetas reales y activa viáticos si corresponde.':'Primero dibuja una ruta.');
 render();
}
e('budget-vehicle-class').addEventListener('change',()=>{addSource();window.dispatchEvent(new Event('balam:capufe-class-updated'))});
e('budget-viaticos-enabled').addEventListener('change',toggleViatics);
for(const id of ['budget-food','budget-lodging','budget-other','logistics-efficiency','logistics-price','logistics-reserve'])e(id).addEventListener('input',render);
e('budget-download').addEventListener('click',exportCsv);
window.addEventListener('balam:logistics-route-ready',onRoute);
window.addEventListener('balam:logistics-return-ready',onRoute);
window.addEventListener('balam:logistics-route-cleared',onRoute);
function setCrossing(plazaId,dir,count){
 if(!state.capufe||!state.capufe.plazas.some(p=>p.id===plazaId)||!['out','back'].includes(dir)||!Number.isInteger(count)||count<0||count>2)return false;
 const field=e('budget-'+dir+'-'+plazaId);if(!field)return false;
 field.value=String(count);render();window.dispatchEvent(new CustomEvent('balam:budget-tolls-updated',{detail:{plazaId,dir,count}}));return true;
}
function clearAllTolls(){
 for(const field of e('budget-toll-list').querySelectorAll('select'))field.value='0';
 render();window.dispatchEvent(new Event('balam:budget-tolls-cleared'));
}
window.BALAM_TravelBudget={sumBudget,calculate:computeCurrent,
 getVehicleClass:()=>e('budget-vehicle-class').value,
 getTariff:(id)=>{const p=state.capufe?.plazas.find(x=>x.id===id);const v=e('budget-vehicle-class').value;return p&&v&&Number.isFinite(p[v])?{amount:p[v],name:p.name,valid_from:state.capufe.valid_from}:null;},
 setCrossing,clearAllTolls,getCount:(id,dir)=>Number(e('budget-'+dir+'-'+id)?.value||0)};
toggleViatics();loadTariffs();onRoute();
})();