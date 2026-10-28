/* BALAM | Red institucional CLUES y planeación de rutas sobre calles. */
(()=>{
'use strict';
const URL='https://raw.githubusercontent.com/doctopanda/MAPA-BALAM/main/data/health/sonora_latest.json';
const bridge=window.BALAM_SmnMap, el=id=>document.getElementById(id);
const map=bridge.map;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const same=(a,b)=>String(a??'')===String(b??'');
const fmt=n=>Number(n).toLocaleString('es-MX',{maximumFractionDigits:1});
const src={
  '1':'#21876d','2':'#456db4','3':'#9856ba','other':'#888e9b'
};
let all=[],loaded=false,layer=L.layerGroup(),line=null,moving=null,raf=null;
let lastDemo=0;
const geoPane=map.createPane('facilityPane');geoPane.style.zIndex=465;geoPane.style.pointerEvents='auto';
const routePane=map.createPane('routePane');routePane.style.zIndex=479;routePane.style.pointerEvents='none';
const markerLayer=L.layerGroup().addTo(map);
function status(t){el('health-status').textContent=t}
function scope(){
 const ds=el('health-district').value,mun=el('health-municipality').value,institution=el('health-institution').value,level=el('health-level').value,operational=el('health-status-filter').value;
 const act=el('health-scope').value==='active'?new Set(bridge.getActiveDistricts()):null;
 return all.filter(x=>(!ds||x.district===ds)&&(!mun||x.municipality_code===mun)&&(!institution||x.institution===institution)&&(!level||(level==='other'?!x.level:x.level===level))&&(!operational||x.status_source===operational)&&(!act||act.has(x.district)));
}
function optionSelect(id,items,label,render=x=>x){
 const e=el(id),prev=e.value;e.replaceChildren(new Option(label,''));
 [...new Set(items.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'es')).forEach(v=>e.add(new Option(render(v),v)));
 if([...e.options].some(o=>o.value===prev))e.value=prev;
}
function clearRoute(){
 if(line){map.removeLayer(line);line=null}
 if(moving){map.removeLayer(moving);moving=null}
 if(raf)cancelAnimationFrame(raf);raf=null;
 el('route-status').textContent='Ruta sin trazar. Selecciona dos establecimientos.';
}
function facilityName(f){return f.name+' · '+f.institution+(f.level?' · Nivel '+f.level:' · Nivel por validar')}
function fillRouteSelects(){
 const visible=scope().sort((a,b)=>a.name.localeCompare(b.name,'es'));
 for(const id of ['route-origin','route-destination']){
  const e=el(id),prev=e.value;e.replaceChildren(new Option('Seleccionar establecimiento…',''));
  visible.forEach(f=>e.add(new Option(f.name+' · '+f.clues+' · '+f.level+'º',f.clues)));
  if([...e.options].some(o=>o.value===prev))e.value=prev;
 }
}
function paint(){
 markerLayer.clearLayers();
 const show=el('health-visible').checked;
 if(!show||!loaded){el('health-count').textContent='Capa apagada';return}
 let results=scope();
 if(results.length>5000){status('Demasiados establecimientos: ajusta el distrito o municipio');return}
 for(const f of results){
  const radius=f.level==='3'?8:f.level==='2'?6.5:5;
  const popup='<b>'+esc(f.name)+'</b><p>CLUES: '+esc(f.clues)+'</p><p>Institución: '+esc(f.institution)+'</p>'+
   '<p>Nivel: '+esc(f.level||'No clasificado desde fuente')+'</p>'+
   '<small>'+esc(f.status_source||'Estatus sin verificar')+'<br>El catálogo NO confirma camas ni capacidad resolutiva.</small>';
  L.circleMarker([f.lat,f.lon],{pane:'facilityPane',radius,color:'#fff',weight:1.4,fillColor:src[f.level]||src.other,fillOpacity:.96})
   .bindPopup(popup,{maxWidth:310}).addTo(markerLayer);
 }
 el('health-count').textContent=fmt(results.length)+' establecimientos visibles';
}
function filters(){
 const ds=el('health-district').value;
 optionSelect('health-municipality',all.filter(x=>!ds||x.district===ds).map(x=>x.municipality_code),'Todos los municipios',v=>{
  const m=window.BALAM_MunicipalityNames?.[v];return m?m+' ('+v+')':v
 });
 optionSelect('health-institution',all.filter(x=>(!ds||x.district===ds)).map(x=>x.institution),'Todas las instituciones');
 fillRouteSelects();paint();
}
function pointFrom(i){return all.find(x=>x.clues===i)}
function animateRoute(coords){
 if(raf)cancelAnimationFrame(raf);if(moving)map.removeLayer(moving);
 const ll=coords.map(c=>L.latLng(c[1],c[0]));if(ll.length<2)return;
 let lengths=[],dist=0;
 for(let i=1;i<ll.length;i++){dist+=ll[i-1].distanceTo(ll[i]);lengths.push(dist)}
 moving=L.marker(ll[0],{icon:L.divIcon({className:'',html:'<div class="health-route-arrow">➤</div>',iconSize:[30,30],iconAnchor:[15,15]})}).addTo(map);
 const start=performance.now(),duration=Math.max(7000,Math.min(30000,dist/15)),total=dist;
 function frame(t){
  const fraction=((t-start)%duration)/duration,target=total*fraction;
  let idx=lengths.findIndex(v=>v>=target);if(idx<0)idx=lengths.length-1;
  const prior=idx?lengths[idx-1]:0,sublength=lengths[idx]-prior||1;
  const m=(target-prior)/sublength;
  const p1=ll[idx],p2=ll[idx+1];
  const lat=p1.lat+(p2.lat-p1.lat)*m,lng=p1.lng+(p2.lng-p1.lng)*m;
  moving.setLatLng([lat,lng]);
  const dy=p2.lat-p1.lat,dx=p2.lng-p1.lng,angle=Math.atan2(dy,dx)*180/Math.PI;
  const div=moving.getElement()?.querySelector('.health-route-arrow');if(div)div.style.transform='rotate('+(-angle)+'deg)';
  raf=requestAnimationFrame(frame);
 }
 raf=requestAnimationFrame(frame);
}
async function route(){
 if(!loaded){status('No hay catálogo CLUES validado');return}
 const a=pointFrom(el('route-origin').value),b=pointFrom(el('route-destination').value);
 if(!a||!b||same(a.clues,b.clues)){el('route-status').textContent='Elige dos establecimientos diferentes y verificados';return}
 if(!el('route-demo-consent').checked){el('route-status').textContent='Confirma la consulta puntual a un servidor público de pruebas (no operativo)';return}
 if(Date.now()-lastDemo<1500){el('route-status').textContent='Espera al menos 1.5 segundos entre solicitudes';return}
 lastDemo=Date.now();clearRoute();
 el('route-status').textContent='Calculando ruta vial de prueba, sin pacientes ni datos personales…';
 const u='https://router.project-osrm.org/route/v1/driving/'+a.lon+','+a.lat+';'+b.lon+','+b.lat+'?overview=full&geometries=geojson&alternatives=false&steps=false';
 try{
  const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),20000);
  let r;try{r=await fetch(u,{signal:ctl.signal})}finally{clearTimeout(timeout)}
  if(!r.ok)throw Error('Servicio vial HTTP '+r.status);
  const data=await r.json();
  const road=data.routes?.[0],coords=road?.geometry?.coordinates;
  if(data.code!=='Ok'||!Array.isArray(coords)||coords.length<2||!Number.isFinite(road.distance)||road.distance<=0)throw Error('No hay una ruta vial verificable');
  line=L.polyline(coords.map(x=>[x[1],x[0]]),{pane:'routePane',color:'#ed6142',weight:6,opacity:.9}).addTo(map);
  map.fitBounds(line.getBounds(),{padding:[36,36],maxZoom:12});
  animateRoute(coords);
  el('route-status').textContent='Ruta exploratoria: '+fmt(road.distance/1000)+' km · aprox. '+fmt(road.duration/60)+' min. El servicio NO incorpora cierres de camino, tráfico, inundación, ni disponibilidad de destino. No utilizar para despacho clínico.';
 }catch(e){el('route-status').textContent='No se trazó ruta verificable: '+String(e.message).slice(0,130)+'. El proveedor de pruebas puede bloquear solicitudes.'}
}
async function load(){
 status('Leyendo fuente institucional CLUES…');
 try{
  const r=await fetch(URL+'?v='+new Date().getUTCDate(),{cache:'no-cache'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const doc=await r.json();
  if(doc.schema!=='balam-clues-sonora-v1'||doc.status!=='ok'||doc.facility_count!==doc.facilities?.length||doc.facility_count<150)throw Error('Aún no hay catálogo Sonora verificado');
  all=doc.facilities.filter(x=>/^26\d{3}$/.test(x.municipality_code)&&Number.isFinite(x.lat)&&Number.isFinite(x.lon));
  loaded=true;el('health-visible').disabled=false;window.dispatchEvent(new Event('balam:health-updated'));
  optionSelect('health-institution',all.map(x=>x.institution),'Todas las instituciones');
  status('CLUES · '+fmt(all.length)+' establecimientos institucionales · corte '+doc.source_cut+'. No implica disponibilidad en tiempo real.');
  filters();
 }catch(e){loaded=false;all=[];el('health-visible').checked=false;el('health-visible').disabled=true;window.dispatchEvent(new Event('balam:health-updated'));status('Capa CLUES pendiente: '+String(e.message).slice(0,130)+'. No se inventaron establecimientos.')}
}
el('health-visible').addEventListener('change',paint);
el('health-scope').addEventListener('change',()=>{fillRouteSelects();paint()});
for(const id of ['health-district','health-institution','health-municipality','health-level','health-status-filter']){
 el(id).addEventListener('change',id==='health-district'?filters:()=>{fillRouteSelects();paint()});
}
el('health-reload').addEventListener('click',load);
el('route-go').addEventListener('click',route);
el('route-clear').addEventListener('click',clearRoute);
window.addEventListener('balam:districts-changed',()=>{fillRouteSelects();paint()});
window.BALAM_Health={refresh:load,getFacilities:()=>[...all],getMunicipalityCount:code=>loaded?all.filter(f=>f.municipality_code===String(code)).length:null};
load();
})();