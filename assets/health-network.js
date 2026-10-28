/* BALAM 0.11 | CLUES: edificios por nivel y selección de rutas en el mapa. */
(()=>{
'use strict';
const URL='https://raw.githubusercontent.com/doctopanda/MAPA-BALAM/main/data/health/sonora_latest.json';
const bridge=window.BALAM_SmnMap, map=bridge.map, el=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-MX',{maximumFractionDigits:1});
const palette={'1':'#168066','2':'#2769c5','3':'#873ab3',other:'#687583'};
const sizes={'1':27,'2':35,'3':44,other:25};
const originColor='#ee8a2d',targetColor='#2eaad1';
let all=[],loaded=false,origin=null,destination=null,routeLine=null,jaguar=null,anim=null,lastRouteCall=0,requestToken=0,routeAbort=null;
let geoNames=new Map(),drawn=L.layerGroup().addTo(map),markers=new Map();
const fPane=map.createPane('facilityPane');fPane.style.zIndex=645;
const linePane=map.createPane('routePane');linePane.style.zIndex=475;linePane.style.pointerEvents='none';
const catIcon=map.createPane('referralJaguarPane');catIcon.style.zIndex=705;
const status=t=>el('health-status').textContent=t;
const levelName=f=>f.level==='1'?'Primer nivel':f.level==='2'?'Segundo nivel':f.level==='3'?'Tercer nivel':'Nivel no clasificado';
const isOperating=f=>f.status_source==='EN OPERACION';
const levelNext=x=>x==='1'?'2':x==='2'?'3':null;
function getNames(){
 geoNames=new Map(bridge.getMunicipalityFeatures().map(f=>{
   const p=f.properties||{},code=String(p.cvegeo||p.CVEGEO||'');
   const name=String(p.nom_agem||p.NOM_AGEM||p.nombre||p.NOMBRE||'').trim();
   return [code,name];
 }).filter(x=>/^26\d{3}$/.test(x[0])&&x[1]));
}
function nameOf(code){return geoNames.get(String(code))||all.find(f=>f.municipality_code===String(code))?.municipality_name||String(code)}
function scope(){
 const ds=el('health-district').value,mun=el('health-municipality').value,inst=el('health-institution').value,lvl=el('health-level').value,st=el('health-status-filter').value;
 const active=el('health-scope').value==='active'?new Set(bridge.getActiveDistricts()):null;
 return all.filter(f=>(!ds||f.district===ds)&&(!mun||f.municipality_code===mun)&&(!inst||f.institution===inst)&&(!lvl||(lvl==='other'?!f.level:f.level===lvl))&&(!st||f.status_source===st)&&(!active||active.has(f.district)));
}
function optionSelect(id,items,label,display=x=>x){
 const ctrl=el(id),previous=ctrl.value;
 ctrl.replaceChildren(new Option(label,''));
 [...new Set(items.filter(Boolean))].sort((a,b)=>String(display(a)).localeCompare(String(display(b)),'es',{sensitivity:'base'})).forEach(v=>ctrl.add(new Option(display(v),v)));
 if([...ctrl.options].some(o=>o.value===previous))ctrl.value=previous;
}
function fillRouteSelects(){
 const orig=el('route-origin'),dest=el('route-destination');
 const prevOrig=origin?.clues||orig.value, prevDest=destination?.clues||dest.value;
 const available=scope().filter(isOperating);
 const origins=origin&&!available.some(f=>f.clues===origin.clues)?[origin,...available]:available;
 orig.replaceChildren(new Option('Seleccionar unidad de origen…',''));
 origins.sort((a,b)=>a.name.localeCompare(b.name,'es')).forEach(f=>orig.add(new Option(f.name+' · '+levelName(f)+' · '+f.clues,f.clues)));
 if([...orig.options].some(o=>o.value===prevOrig))orig.value=prevOrig;
 let targets=[];
 if(origin&&levelNext(origin.level)){
   targets=all.filter(f=>f.clues!==origin.clues&&isOperating(f)&&f.level===levelNext(origin.level));
 }else if(!origin){
   targets=available;
 }
 dest.replaceChildren(new Option(origin?'Seleccionar unidad receptora elegible…':'Primero selecciona una unidad origen…',''));
 targets.sort((a,b)=>a.name.localeCompare(b.name,'es')).forEach(f=>dest.add(new Option(f.name+' · '+nameOf(f.municipality_code)+' · '+f.clues,f.clues)));
 if([...dest.options].some(o=>o.value===prevDest))dest.value=prevDest;
}
function eligibleTargets(){
 if(!origin||!levelNext(origin.level)||!isOperating(origin))return[];
 return all.filter(f=>f.clues!==origin.clues&&isOperating(f)&&f.level===levelNext(origin.level));
}
function summary(){
 const note=el('health-referral-selection');
 if(!origin){
   note.textContent='1. Selecciona una casita en el mapa o en el campo de origen. BALAM destacará los destinos del siguiente nivel.';
   return;
 }
 if(!isOperating(origin)){
   note.textContent='Origen '+origin.clues+' no está marcado EN OPERACION. No se habilitan referencias automáticas.';
   return;
 }
 const next=levelNext(origin.level),possible=eligibleTargets();
 if(!next){note.textContent='Origen: '+origin.name+'. No hay un nivel superior definido por esta regla preliminar.';return;}
 note.textContent='Origen: '+origin.name+' ('+levelName(origin)+'). '+possible.length+' posibles destinos de nivel '+next+' en Sonora según CLUES. '+(destination?'Destino seleccionado: '+destination.name+'. Pulsa Dibujar ruta vial.':'Haz clic en una casita destacada para seleccionar destino.');
}
function houseIcon(f,kind='normal'){
 const size=sizes[f.level]||sizes.other, color=palette[f.level]||palette.other;
 const fill=kind==='origin'?originColor:kind==='target'?targetColor:color;
 const halo=kind==='eligible'?'health-eligible':kind==='origin'?'health-origin':kind==='target'?'health-target':'';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 44 44" aria-hidden="true">'+
  '<path d="M5 19 L22 5 L39 19" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'+
  '<path d="M9 19 L22 8 L35 19 V39 H9 Z" fill="'+fill+'" stroke="white" stroke-width="3.5" stroke-linejoin="round"/>'+
  '<path d="M22 20 V31 M16.5 25.5 H27.5" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>'+
  '<path d="M18 38 V34 H26 V38" fill="none" stroke="white" stroke-width="2"/></svg>';
 const sizeMarker=size+(kind==='eligible'?13:9);
 return L.divIcon({className:'health-house-icon '+halo,html:'<div class="health-house-symbol" style="--health-color:'+fill+';width:'+size+'px;height:'+size+'px">'+svg+'</div>',
   iconSize:[sizeMarker,sizeMarker],iconAnchor:[sizeMarker/2,sizeMarker/2],popupAnchor:[0,-size/2]});
}
function popup(f,kind){
 return '<div class="health-popup"><b>'+esc(f.name)+'</b><p>CLUES: '+esc(f.clues)+'</p>'+
 '<p>Institución: '+esc(f.institution)+' · '+levelName(f)+'</p>'+
 '<p>Municipio: '+esc(nameOf(f.municipality_code))+' · '+esc(f.district)+'</p>'+
 '<p>Estatus registrado: '+esc(f.status_source||'Sin verificar')+'</p>'+
 (kind==='eligible'?'<b>Destino de siguiente nivel, selección exploratoria</b>':kind==='origin'?'<b>Origen seleccionado</b>':kind==='target'?'<b>Destino seleccionado</b>':'<small>Haz clic para elegir como origen.</small>')+
 '<p class="health-popup-disclaimer">La elegibilidad por nivel no confirma servicios, camas, derechohabiencia ni aceptación de pacientes.</p></div>';
}
function paint(){
 drawn.clearLayers();markers.clear();
 if(!loaded||!el('health-visible').checked){el('health-count').textContent='Capa apagada';return;}
 const visible=scope(),candidates=eligibleTargets(),cSet=new Set(candidates.map(f=>f.clues));
 let source=origin?[origin,...candidates]:visible;
 if(destination&&!source.some(f=>f.clues===destination.clues))source.push(destination);
 source=[...new Map(source.map(f=>[f.clues,f])).values()];
 for(const f of source){
  let kind=origin&&f.clues===origin.clues?'origin':destination&&f.clues===destination.clues?'target':origin&&cSet.has(f.clues)?'eligible':'normal';
  const m=L.marker([f.lat,f.lon],{pane:'facilityPane',icon:houseIcon(f,kind),riseOnHover:true,
   title:f.name+' · '+levelName(f)+(kind==='eligible'?' · Destino elegible por nivel':'')});
  m.bindPopup(popup(f,kind),{maxWidth:320});
  m.on('click',()=>selectOnMap(f));
  m.addTo(drawn);
  markers.set(f.clues,m);
 }
 el('health-count').textContent=origin
   ?fmt(candidates.length)+' posibles destinos de nivel '+levelNext(origin.level)+' · origen resaltado'
   :fmt(source.length)+' establecimientos visibles';
}
function clearRoute(){
 requestToken++;
 if(routeAbort){routeAbort.abort();routeAbort=null;}
 if(routeLine){map.removeLayer(routeLine);routeLine=null;}
 if(jaguar){map.removeLayer(jaguar);jaguar=null;}
 if(anim){cancelAnimationFrame(anim);anim=null;}
 el('route-status').textContent='Ruta sin trazar. Selecciona dos establecimientos.';
}
function selectOrigin(f){
 clearRoute();origin=f;destination=null;
 const panel=el('health-panel')?.closest('details');if(panel)panel.open=true;
 const box=document.querySelector('.health-route-box');if(box)box.open=true;
 el('health-visible').checked=true;
 fillRouteSelects();summary();paint();
}
function selectDestination(f){
 if(!origin||!eligibleTargets().some(x=>x.clues===f.clues)){
  el('route-status').textContent='El destino no cumple la regla preliminar de siguiente nivel y estatus EN OPERACION.';return;
 }
 clearRoute();destination=f;
 fillRouteSelects();summary();paint();
 el('route-status').textContent='Destino elegido: '+f.name+'. Para trazar ruta, marca autorización del servicio de pruebas y pulsa Dibujar ruta vial.';
 const marker=markers.get(f.clues);if(marker)marker.openPopup();
}
function selectOnMap(f){
 if(!origin){selectOrigin(f);return;}
 if(f.clues===origin.clues){summary();return;}
 if(eligibleTargets().some(x=>x.clues===f.clues)){selectDestination(f);return;}
 el('route-status').textContent='Origen seleccionado. Solo puedes elegir los destinos destacados del siguiente nivel, o restablecer la selección.';
}
function resetSelection(){
 origin=null;destination=null;clearRoute();fillRouteSelects();summary();paint();
}
function filters(){
 getNames();
 const ds=el('health-district').value;
 optionSelect('health-municipality',all.filter(f=>!ds||f.district===ds).map(f=>f.municipality_code),'Todos los municipios',code=>nameOf(code)+' ('+code+')');
 optionSelect('health-institution',all.filter(f=>!ds||f.district===ds).map(f=>f.institution),'Todas las instituciones');
 fillRouteSelects();summary();paint();
}
function onOriginSelect(){
 const f=all.find(x=>x.clues===el('route-origin').value);
 if(!f){resetSelection();return;}
 selectOrigin(f);
}
function onDestinationSelect(){
 const f=all.find(x=>x.clues===el('route-destination').value);
 if(f)selectDestination(f);
 else{destination=null;clearRoute();summary();paint();}
}
function jaguarIcon(){
 // Marcador oficial aportado para las rutas: silueta completa, fondo transparente.
 // El ancla coincide con la punta del pin para que el jaguar siga las carreteras.
 return L.divIcon({
   className:'balam-moving-jaguar',
   html:'<img class="balam-jaguar-pin" src="assets/brand/jaguar-pin-ruta-balam.webp" alt="Pin del jaguar BALAM" draggable="false">',
   iconSize:[82,86], iconAnchor:[41,79], popupAnchor:[0,-72]
 });
}
function animate(coords){
 if(anim)cancelAnimationFrame(anim);
 if(jaguar)map.removeLayer(jaguar);
 const points=coords.map(x=>L.latLng(x[1],x[0]));
 const lengths=[];let distance=0;
 for(let i=1;i<points.length;i++){distance+=points[i-1].distanceTo(points[i]);lengths.push(distance);}
 if(!distance)return;
 jaguar=L.marker(points[0],{pane:'referralJaguarPane',icon:jaguarIcon(),keyboard:false,interactive:false}).addTo(map);
 const begin=performance.now(),duration=Math.min(40000,Math.max(9000,distance/13));
 function frame(now){
  if(!jaguar)return;
  const pos=distance*((now-begin)%duration)/duration;
  let i=lengths.findIndex(x=>x>=pos);if(i<0)i=lengths.length-1;
  const prior=i?lengths[i-1]:0,t=(pos-prior)/(lengths[i]-prior||1);
  const a=points[i],b=points[i+1],lat=a.lat+(b.lat-a.lat)*t,lng=a.lng+(b.lng-a.lng)*t;
  jaguar.setLatLng([lat,lng]);
  anim=requestAnimationFrame(frame);
 }
 anim=requestAnimationFrame(frame);
}
async function route(){
 if(!loaded||!origin||!destination){el('route-status').textContent='Primero selecciona un origen y un destino elegible.';return;}
 if(!eligibleTargets().some(f=>f.clues===destination.clues)){el('route-status').textContent='Destino no cumple los niveles y estatus requeridos.';return;}
 if(!el('route-demo-consent').checked){el('route-status').textContent='Autoriza la consulta puntual al servicio vial de pruebas.';return;}
 if(Date.now()-lastRouteCall<1500){el('route-status').textContent='Servicio de pruebas: evita consultas consecutivas rápidas.';return;}
 lastRouteCall=Date.now();clearRoute();const token=requestToken;
 const a=origin,b=destination;
 el('route-status').textContent='Calculando ruta vial entre establecimientos, sin transmitir datos personales…';
 const url='https://router.project-osrm.org/route/v1/driving/'+a.lon+','+a.lat+';'+b.lon+','+b.lat+'?overview=full&geometries=geojson&alternatives=false&steps=false';
 const ctrl=new AbortController();routeAbort=ctrl;
 let timer;
 try{
  timer=setTimeout(()=>ctrl.abort(),18000);
  const response=await fetch(url,{signal:ctrl.signal});
  if(!response.ok)throw Error('Servicio vial HTTP '+response.status);
  const answer=await response.json();
  if(token!==requestToken)return;
  const road=answer.routes?.[0],coords=road?.geometry?.coordinates;
  if(answer.code!=='Ok'||!Array.isArray(coords)||coords.length<2||!Number.isFinite(road.distance)||road.distance<=0)throw Error('Sin ruta vial verificable');
  routeLine=L.polyline(coords.map(p=>[p[1],p[0]]),{pane:'routePane',color:'#e44a31',weight:6,opacity:.85}).addTo(map);
  map.fitBounds(routeLine.getBounds(),{padding:[45,45],maxZoom:12});
  animate(coords);
  el('route-status').textContent='Ruta vial exploratoria: '+fmt(road.distance/1000)+' km · '+fmt(road.duration/60)+' min estimados. El jaguar indica dirección planificada, NO traslado real. No se verifican cierres viales, camas ni aceptación.';
 }catch(err){
  if(token===requestToken)el('route-status').textContent='Ruta no disponible: '+String(err.message).slice(0,110)+'. No se dibuja una línea artificial.';
 }finally{clearTimeout(timer);if(routeAbort===ctrl)routeAbort=null;}
}
async function load(){
 status('Leyendo CLUES oficial…');
 try{
  const response=await fetch(URL+'?v='+new Date().getUTCDate(),{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const doc=await response.json();
  if(doc.schema!=='balam-clues-sonora-v1'||doc.status!=='ok'||doc.facility_count!==doc.facilities?.length||doc.facility_count<150)throw Error('No hay catálogo CLUES verificable');
  all=doc.facilities.filter(f=>/^26\d{3}$/.test(f.municipality_code)&&Number.isFinite(f.lat)&&Number.isFinite(f.lon));
  loaded=true;el('health-visible').disabled=false;
  status('CLUES '+doc.source_cut+' · '+fmt(all.length)+' establecimientos; símbolos por nivel. No equivale a capacidad actual.');
  getNames();filters();window.dispatchEvent(new Event('balam:health-updated'));
 }catch(err){
  all=[];loaded=false;resetSelection();el('health-visible').checked=false;el('health-visible').disabled=true;
  status('No se cargó el catálogo: '+String(err.message).slice(0,120));window.dispatchEvent(new Event('balam:health-updated'));
 }
}
el('health-visible').addEventListener('change',paint);
el('health-scope').addEventListener('change',filters);
for(const id of ['health-district','health-institution','health-municipality','health-level','health-status-filter']){
 el(id).addEventListener('change',id==='health-district'?filters:()=>{fillRouteSelects();paint();});
}
el('route-origin').addEventListener('change',onOriginSelect);
el('route-destination').addEventListener('change',onDestinationSelect);
el('route-go').addEventListener('click',route);
el('route-clear').addEventListener('click',clearRoute);
el('route-reset-selection').addEventListener('click',resetSelection);
el('health-reload').addEventListener('click',load);
window.addEventListener('balam:districts-changed',()=>{fillRouteSelects();paint()});
window.addEventListener('balam:municipalities-ready',filters);
window.BALAM_Health={refresh:load,getFacilities:()=>[...all],getMunicipalityCount:code=>loaded?all.filter(f=>f.municipality_code===String(code)).length:null};
load();
})();