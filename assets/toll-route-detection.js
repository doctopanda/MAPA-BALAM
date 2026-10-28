/* BALAM 0.15 | Casetas geolocalizadas INEGI RNC, candidatos geográficos sobre ruta OSRM. */
(()=>{
'use strict';
const e=id=>document.getElementById(id), map=window.BALAM_SmnMap?.map;
if(!map||!e('toll-route-panel'))return;
const url='data/rnc/sonora_plazas_cobro.json';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v).toLocaleString('es-MX',{maximumFractionDigits:2});
const rup=n=>Number(n).toLocaleString('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
let plazas=[],model=null,confirmed=new Map(),nearCache=[];
const pane=map.createPane('tollRoutePane');pane.style.zIndex=730;
let markers=L.layerGroup().addTo(map);
const confidence=d=>d<=0.23?'posible_cruce':d<=0.65?'cercana':'fuera';
function measurePoint(point,coords){
 if(!Array.isArray(coords)||coords.length<2)return {km:Infinity,atKm:0};
 const [x,y]=point,mx=111.32*Math.cos(y*Math.PI/180),my=111.32;
 const px=x*mx,py=y*my;let best=Infinity,at=0,total=0;
 for(let i=1;i<coords.length;i++){
  const a=coords[i-1],b=coords[i],ax=a[0]*mx,ay=a[1]*my,bx=b[0]*mx,by=b[1]*my;
  const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy,len=Math.sqrt(len2);
  const t=len2?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len2)):0;
  const distance=Math.hypot(px-ax-dx*t,py-ay-dy*t);
  if(distance<best){best=distance;at=total+t*len}
  total+=len;
 }
 return {km:best,atKm:at};
}
function nearPlaza(plaza,coords){
 let nearest={km:Infinity,atKm:0};
 if(!coords)return nearest;
 for(const point of plaza.points){
  const r=measurePoint([point.lon,point.lat],coords);
  if(r.km<nearest.km)nearest=r;
 }
 return nearest;
}
const routeNow=()=>window.BALAM_Logistics?.getRoute?.()||null;
function roleOf(x){
 if(x.out?.km<=.23||x.back?.km<=.23)return 'posible';
 if(x.out?.km<=.65||x.back?.km<=.65)return 'cercana';
 return 'fuera';
}
function refresh(){
 const r=routeNow(),out=r?.coords,back=r?.returnRoute?.coords;
 nearCache=plazas.map(plaza=>({plaza,out:out?nearPlaza(plaza,out):null,back:back?nearPlaza(plaza,back):null}))
 .filter(x=>e('toll-show-all').checked||roleOf(x)!=='fuera');
 nearCache.sort((a,b)=>Math.min(a.out?.atKm??Infinity,a.back?.atKm??Infinity)-Math.min(b.out?.atKm??Infinity,b.back?.atKm??Infinity));
 render();
}
function tariffData(p){return p.capufe_tariff_id?window.BALAM_TravelBudget?.getTariff?.(p.capufe_tariff_id):null}
function makeButton(text,onClick,disabled=false){
 const b=document.createElement('button');b.type='button';b.className='toll-map-action';b.textContent=text;b.disabled=disabled;b.onclick=onClick;return b;
}
function crossingCount(p,dir){
 return Number(p.capufe_tariff_id?window.BALAM_TravelBudget?.getCount(p.capufe_tariff_id,dir):window.BALAM_TravelBudget?.getGeoCount(p.id,dir))||0;
}
function confirm(x,dir){
 const r=routeNow();if(!r)return;
 const match=dir==='out'?x.out:x.back;
 if(!match||match.km>.65)return;
 const p=x.plaza,tariff=tariffData(p),next=crossingCount(p,dir)?0:1;
 const done=tariff?
  window.BALAM_TravelBudget?.setCrossing(p.capufe_tariff_id,dir,next):
  window.BALAM_TravelBudget?.setGeoCrossing(p.id,dir,next,p.name);
 if(!done)return;
 if(next){confirmed.set(p.id+':'+dir,true)}else confirmed.delete(p.id+':'+dir);
 const needsPrice=!tariff&&window.BALAM_TravelBudget?.getGeoTariff(p.id)===null;
 e('toll-route-status').textContent=(next?'Añadida':'Retirada')+' '+p.name+' '+(dir==='out'?'de ida':'de regreso')+'. '+
  (next&&needsPrice?'Tarifa manual pendiente: ingrésala en la tarjeta. ':'')+
  (match.km>.23?'Caseta cercana, confirma paso real.':'Verifica el cruce real.');
 refresh();
}
function popup(x){
 const p=x.plaza;const box=document.createElement('div');box.className='toll-map-popup';
 const title=document.createElement('b');title.textContent='🛣️ '+p.name;box.append(title);
 const info=document.createElement('p');info.textContent='INEGI RNC · '+p.administration+' · '+p.section;box.append(info);
 const distance=document.createElement('p');distance.textContent=
  'Ida: '+(x.out?fmt(x.out.km*1000)+' m del itinerario':'sin ruta')+
  ' · Regreso: '+(x.back?fmt(x.back.km*1000)+' m':'sin ruta');box.append(distance);
 const price=tariffData(p),manual=window.BALAM_TravelBudget?.getGeoTariff(p.id);
 const priceEl=document.createElement('p');priceEl.textContent=price?
  'Tarifa CAPUFE 2026 '+rup(price.amount)+' por cruce ('+window.BALAM_TravelBudget.getVehicleClass()+').':
  (manual!==null?'Tarifa manual de '+rup(manual)+' por cruce, pendiente de verificación.':
   'Sin tarifa oficial vinculada. Confirma el paso y captura el precio manual en la lista.');
 box.append(priceEl);
 if(x.out?.km<=.65)box.append(makeButton(crossingCount(p,'out')?'✓ Ida incluida · quitar':'Confirmar ida',()=>confirm(x,'out')));
 if(x.back?.km<=.65)box.append(makeButton(crossingCount(p,'back')?'✓ Regreso incluido · quitar':'Confirmar regreso',()=>confirm(x,'back')));
 const foot=document.createElement('p');foot.className='tiny';foot.textContent='La proximidad al trazado NO confirma paso o cobro. Revisar el itinerario, sentido y posibles libramientos paralelos.';box.append(foot);
 return box;
}
function getIcon(match,priced){
 const label=match?'🛣️':'📍';
 const size=match?41:32;
 return L.divIcon({className:'balam-toll-icon',html:'<div class="'+(match?'toll-pin-match':'toll-pin-other')+'">'+label+(priced?'<small>$</small>':'')+'</div>',iconSize:[size,size],iconAnchor:[size/2,size/2]});
}
function render(){
 markers.clearLayers();
 const list=e('toll-route-list');list.replaceChildren();
 const r=routeNow();
 if(!plazas.length){
  e('toll-route-status').textContent='Aún no se cargó un catálogo geográfico RNC confiable. Casetas manuales CAPUFE siguen disponibles.';
  e('toll-route-count').textContent='0 casetas geolocalizadas';
  return;
 }
 const active=nearCache.filter(x=>roleOf(x)==='posible');
 const adjacent=nearCache.filter(x=>roleOf(x)==='cercana');
 e('toll-route-count').textContent=plazas.length+' plazas oficiales (26 puntos de carril), '+active.length+' posibles cruces y '+adjacent.length+' plazas cercanas en esta ruta.';
 const shown=e('toll-route-visible').checked;
 for(const x of nearCache){
  const p=x.plaza,possible=roleOf(x)==='posible',near=roleOf(x)!=='fuera';
  const tariff=tariffData(p),manual=window.BALAM_TravelBudget?.getGeoTariff(p.id);
  if(shown){
   const loc=p.points.reduce((acc,pt)=>({lon:acc.lon+pt.lon/p.points.length,lat:acc.lat+pt.lat/p.points.length}),{lon:0,lat:0});
   const icon=getIcon(possible,!!tariff);
   L.marker([loc.lat,loc.lon],{icon,pane:'tollRoutePane',title:p.name+' · INEGI RNC'}).bindPopup(popup(x),{maxWidth:330}).addTo(markers);
  }
  if(!near)continue;
  const card=document.createElement('div');card.className='toll-route-row';
  const b=document.createElement('b');b.textContent='🛣️ '+p.name;card.append(b);
  const line=document.createElement('small');
  line.textContent=(possible?'POSIBLE CRUCE':'CERCANA, NO CONFIRMADA')+
   ' · '+p.section+' · '+(tariff?'CAPUFE '+rup(tariff.amount)+' por cruce':manual!==null?'Tarifa manual '+rup(manual)+' por cruce (sin verificar)':'Tarifa pendiente · captura manual');card.append(line);
  const dist=document.createElement('small');dist.textContent=
   'Ida: '+(x.out?fmt(x.out.km*1000)+' m':'sin ruta')+
   ' · Regreso: '+(x.back?fmt(x.back.km*1000)+' m':'sin ruta de retorno');card.append(dist);
  const actions=document.createElement('div');actions.className='toll-route-actions';
  for(const [dir,label] of [['out','Ida'],['back','Regreso']]){
   const found=dir==='out'?x.out:x.back;
   const matched=found?.km<=.65;
   const n=crossingCount(p,dir);
   const button=makeButton(n?'✓ '+label+' incluida · quitar':'Confirmar '+label,()=>confirm(x,dir),!matched);
   actions.append(button);
  }
  card.append(actions);
  if(!tariff){
   const priceLabel=document.createElement('label');priceLabel.className='toll-price-label';
   priceLabel.textContent='Tarifa por cruce (MXN) · captura manual no verificada';
   const input=document.createElement('input');input.type='number';input.min='0';input.max='100000';
   input.step='.01';input.inputMode='decimal';input.placeholder='Ej. 150.00';
   input.value=manual===null?'':String(manual);
   input.disabled=!['A','B2','C2'].includes(window.BALAM_TravelBudget?.getVehicleClass?.());
   input.setAttribute('aria-label','Tarifa manual '+p.name);
   input.addEventListener('change',()=>{
    const raw=input.value.trim(),amount=raw===''?null:Number(raw);
    if(!window.BALAM_TravelBudget?.setGeoTariff(p.id,amount,p.name))
     e('toll-route-status').textContent='Tarifa inválida. Selecciona clase vehicular y captura un monto no negativo para '+p.name+'.';
   });
   priceLabel.append(input);card.append(priceLabel);
   const hint=document.createElement('small');hint.textContent='No es tarifa oficial CAPUFE. Verificar con concesionaria antes de autorizar traslado.';card.append(hint);
  }
  list.append(card);
 }
 if(!r){
  e('toll-route-status').textContent='Casetas INEGI cargadas. Dibuja una ruta para identificar posibles cruces; no se agregan peajes sin confirmación.';
 }else{
  e('toll-route-status').textContent='Geolocalización RNC: '+active.length+' posibles cruces. Puedes seleccionar varias casetas de ida y regreso, cada una independientemente. Las próximas hasta 650 m requieren confirmar el cruce real. '+(r.returnRoute?'Retorno enrutado.':'Falta calcular el regreso independiente.')+
  ' Si no aparecen, verifica que tu ruta pase por una carretera de cuota.';
 }
 if(r&&!list.children.length)list.textContent='No hay plazas RNC cerca de la ruta calculada. Esto no demuestra ausencia de peajes: puede ser un libramiento, un tramo sin caseta registrada o un catálogo incompleto.';
}
function resetCrossings(){
 window.BALAM_TravelBudget?.clearAllTolls?.();confirmed.clear();
}
async function load(){
 try{
  const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);
  const src=await response.json();
  if(src.schema!=='balam-rnc-toll-plazas-v1'||src.status!=='public_geodata_verified_sample'||src.record_count!==26||src.plaza_count!==15||src.plazas?.length!==15)throw Error('Catálogo RNC incompleto');
  for(const p of src.plazas){
   if(!p.id||!p.name||!Array.isArray(p.points)||!p.points.length||p.points.some(x=>!Number.isFinite(x.lat)||!Number.isFinite(x.lon)||x.lat<26||x.lat>33.5||x.lon< -115.5||x.lon> -108))throw Error('Plaza con coordenadas fuera de límites');
  }
  plazas=src.plazas;e('toll-route-visible').disabled=false;
  e('toll-route-source').textContent='INEGI RNC · '+src.record_count+' puntos geográficos agrupados en '+src.plaza_count+' plazas, datos del servicio 2023–2024. Tarifas CAPUFE 2026 por categoría, cuando corresponde.';
  refresh();
 }catch(err){plazas=[];e('toll-route-visible').checked=false;e('toll-route-visible').disabled=true;
  e('toll-route-source').textContent='No fue posible leer puntos RNC validados ('+String(err.message).slice(0,120)+'). Puedes seleccionar casetas CAPUFE manualmente.';refresh()}
}
e('toll-route-visible').addEventListener('change',render);
e('toll-show-all').addEventListener('change',refresh);
e('toll-reload').addEventListener('click',load);
window.addEventListener('balam:logistics-route-ready',()=>{resetCrossings();refresh()});
window.addEventListener('balam:logistics-return-ready',refresh);
window.addEventListener('balam:logistics-route-cleared',()=>{resetCrossings();refresh()});
window.addEventListener('balam:capufe-ready',refresh);
window.addEventListener('balam:capufe-class-updated',refresh);
window.addEventListener('balam:budget-tolls-updated',refresh);
window.addEventListener('balam:budget-tolls-cleared',refresh);
window.BALAM_Tolls={refresh,getPlazas:()=>plazas.map(p=>({...p})),_test:{measurePoint,nearPlaza,confidence}};
load();
})();