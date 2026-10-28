/* BALAM 0.14 · Capa oficial DENUE para servicios junto al recorrido. */
(()=>{
'use strict';
const E=id=>document.getElementById(id);
if(!E('denue-panel'))return;
const map=window.BALAM_SmnMap.map,URL='data/denue/sonora_route_services.json';
const layer=L.layerGroup().addTo(map);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds={fuel:'⛽',tire:'🛞',repair:'🔧'};
let facilities=[],source=null,loaded=false;
function distance(lat,lon,coords){
 if(!coords||coords.length<2)return Infinity;
 let best=Infinity;const x=lon*111.32*Math.cos(lat*Math.PI/180),y=lat*111.32;
 for(let i=1;i<coords.length;i++){
  const a=[coords[i-1][0]*111.32*Math.cos(lat*Math.PI/180),coords[i-1][1]*111.32];
  const b=[coords[i][0]*111.32*Math.cos(lat*Math.PI/180),coords[i][1]*111.32];
  const dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;
  const t=len?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/len)):0;
  best=Math.min(best,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));
 }return best;
}
function paint(){
 layer.clearLayers();E('denue-near-list').replaceChildren();
 if(!loaded){E('denue-near-count').textContent='No hay carga DENUE oficial validada.';return}
 const route=window.BALAM_Logistics?.getRoute?.(),shown=E('denue-visible').checked;
 if(!route||!shown){E('denue-near-count').textContent=route?'Capa DENUE apagada.':'Dibuja una ruta para buscar establecimientos DENUE.';return}
 const kindsOn=new Set(['fuel','tire','repair'].filter(k=>E('denue-'+k).checked));
 const near=facilities.map(f=>({...f,distance:distance(f.lat,f.lon,route.coords)})).filter(f=>kindsOn.has(f.category)&&f.distance<=2.5).sort((a,b)=>a.distance-b.distance).slice(0,120);
 for(const f of near){
  const icon=L.divIcon({className:'logistics-service-marker',html:'<div class="denue-icon">'+kinds[f.category]+'</div>',iconSize:[34,34],iconAnchor:[17,17]});
  const mark=L.marker([f.lat,f.lon],{icon}).bindPopup(
   '<b>'+esc(f.name)+'</b><p>DENUE · SCIAN '+esc(f.scian)+'</p><p>'+esc(f.address||'Dirección no documentada')+'</p>'+
   '<p>'+f.distance.toFixed(2)+' km en línea recta del recorrido</p><p>No se ha verificado horario, operación, existencia de combustible, asistencia ni aceptación de tickets.</p>'
  ).addTo(layer);
  const b=document.createElement('button');b.type='button';b.className='logistics-spot';
  b.textContent=kinds[f.category]+' '+f.name+' · '+f.distance.toFixed(2)+' km de ruta · DENUE';
  b.onclick=()=>{map.panTo([f.lat,f.lon]);mark.openPopup()};E('denue-near-list').append(b);
 }
 E('denue-near-count').textContent=near.length+' establecimientos DENUE a ≤2.5 km del trazado en línea recta; no implica desvío accesible.';
}
async function load(){
 E('denue-status').textContent='Leyendo directorio DENUE…';
 try{
  const r=await fetch(URL,{cache:'no-cache'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const doc=await r.json();
  if(doc.schema!=='balam-denue-sonora-route-v1'||doc.status!=='validated_official_import'||!Array.isArray(doc.facilities)||!doc.facilities.length)throw Error('Exportación oficial pendiente; no hay establecimientos DENUE verificados en BALAM.');
  facilities=doc.facilities.filter(x=>/^26\d{3}$/.test(x.municipality_code)&&Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&['fuel','tire','repair'].includes(x.category));
  if(facilities.length!==doc.facilities.length)throw Error('Registros oficiales con datos inconsistentes');
  loaded=true;source=doc;E('denue-visible').disabled=false;
  E('denue-status').textContent=facilities.length+' establecimientos DENUE normalizados de Sonora · corte '+doc.source_cut+'. La apertura y operación no están verificadas.';
  paint();
 }catch(err){
  loaded=false;source=null;facilities=[];E('denue-visible').checked=false;E('denue-visible').disabled=true;
  E('denue-status').textContent=String(err.message).slice(0,180)+' OpenStreetMap permanece como alternativa independiente.';
  paint();
 }
}
for(const id of ['denue-visible','denue-fuel','denue-tire','denue-repair'])E(id).addEventListener('change',paint);
E('denue-reload').addEventListener('click',load);
window.addEventListener('balam:logistics-route-ready',paint);
window.addEventListener('balam:logistics-route-cleared',paint);
window.BALAM_DenueServices={reload:load,getItems:()=>facilities.slice()};
load();
})();