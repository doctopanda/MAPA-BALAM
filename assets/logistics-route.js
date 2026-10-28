/* BALAM 0.12 · Estimación logística y auxilio en ruta, sin datos personales. */
(()=>{
'use strict';
const e=id=>document.getElementById(id);
const bridge=window.BALAM_SmnMap, map=bridge.map;
if(!e('logistics-panel')||!bridge){return;}
const money=n=>Number(n).toLocaleString('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2});
const num=(n,d=1)=>Number(n).toLocaleString('es-MX',{maximumFractionDigits:d});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const serviceColors={fuel:'#e89824',tire:'#b8518f',repair:'#5769c1',health:'#288c65'};
const routeModel={route:null,returnRoute:null,returnLine:null};
let lastReturnRequest=0,returnAbort=null,returnGeneration=0;
let osmServiceLayer=L.layerGroup().addTo(map),poiList=[],lookupTime=0,abort=null,version=0;
let cached={key:null,items:null};
const say=(t)=>{e('logistics-status').textContent=t};
function safeFinite(id,min,max){const v=Number(e(id)?.value);return Number.isFinite(v)&&v>=min&&v<=max?v:null;}
function compute(km,kmPerLiter,price,reserve){
 const roundTrip=km*2;const liters=roundTrip/kmPerLiter;const buffered=liters*(1+reserve/100);
 return {kmOneWay:km,kmRoundtrip:roundTrip,liters,litersWithReserve:buffered,cost:buffered*price,margin:buffered-liters};
}
function present(){
 const r=routeModel.route,p=e('logistics-output');
 if(!r){p.textContent='Traza primero una ruta válida entre dos establecimientos para calcular combustible y buscar servicios.';return}
 const yieldValue=safeFinite('logistics-efficiency',2,30);
 const price=safeFinite('logistics-price',1,100);
 const reserve=safeFinite('logistics-reserve',0,100);
 if([yieldValue,price,reserve].some(v=>v===null)){p.textContent='Corrige rendimiento (2–30 km/L), precio (1–100 MXN/L) o reserva (0–100%).';return}
 const returnKm=routeModel.returnRoute?.distance/1000??null;
 const outboundKm=r.distance/1000;
 const x=compute((outboundKm+(returnKm??outboundKm))/2,yieldValue,price,reserve);
 x.kmOneWay=outboundKm;
 x.kmRoundtrip=outboundKm+(returnKm??outboundKm);
 x.liters=x.kmRoundtrip/yieldValue;
 x.litersWithReserve=x.liters*(1+reserve/100);
 x.cost=x.litersWithReserve*price;
 p.innerHTML='<div class="logistics-metrics">'+
 '<div><small>Ida</small><b>'+num(x.kmOneWay)+' km</b></div>'+
 '<div><small>'+ (returnKm!==null?'Ida y vuelta enrutadas':'Ida y vuelta estimada')+'</small><b>'+num(x.kmRoundtrip)+' km</b></div>'+
 '<div><small>Litros ida/vuelta</small><b>'+num(x.liters,2)+' L</b></div>'+
 '<div><small>Litros con reserva</small><b>'+num(x.litersWithReserve,2)+' L</b></div>'+
 '<div class="logistics-cost"><small>Costo estimado</small><b>'+money(x.cost)+'</b></div></div>'+
 '<p class="tiny">'+(returnKm!==null?'Ida '+num(outboundKm,2)+' km + regreso '+num(returnKm,2)+' km por calles':'Sin retorno enrutado: se utiliza 2 × ida')+'. Rendimiento '+num(yieldValue)+' km/L, precio '+money(price)+'/L y '+num(reserve)+'% de reserva. No considera tráfico, cierres, tiempos sanitarios o consumo medido.</p>';
}
function clearLookups(){
 version++;
 if(abort){abort.abort();abort=null}
 osmServiceLayer.clearLayers();poiList=[];
 e('logistics-list').replaceChildren();
 e('logistics-summary').textContent='Sin servicios consultados en el corredor.';
 e('logistics-query').disabled=!routeModel.route;
}
function clearReturn(){
 returnGeneration++;
 if(returnAbort){returnAbort.abort();returnAbort=null;}
 if(routeModel.returnLine){map.removeLayer(routeModel.returnLine);routeModel.returnLine=null}
 routeModel.returnRoute=null;
 e('logistics-return-status').textContent='Regreso sin enrutamiento independiente. Se estima duplicando la ida.';
}
async function routeReturn(){
 const route=routeModel.route;if(!route)return;
 const a=route.origin,b=route.destination;
 if(!Number.isFinite(a?.lat)||!Number.isFinite(a?.lon)||!Number.isFinite(b?.lat)||!Number.isFinite(b?.lon)){
  e('logistics-return-status').textContent='No hay coordenadas de ambos establecimientos para calcular el retorno.';return;
 }
 if(Date.now()-lastReturnRequest<1600){e('logistics-return-status').textContent='Respeta el intervalo mínimo entre consultas al servicio vial de pruebas.';return;}
 lastReturnRequest=Date.now();clearReturn();const token=returnGeneration;
 e('logistics-return-status').textContent='Calculando ruta independiente desde la unidad receptora hasta el origen…';
 const url='https://router.project-osrm.org/route/v1/driving/'+b.lon+','+b.lat+';'+a.lon+','+a.lat+'?overview=full&geometries=geojson&alternatives=false&steps=false';
 const controller=new AbortController();returnAbort=controller;
 const timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(url,{signal:controller.signal});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  if(token!==returnGeneration)return;
  const result=data.routes?.[0],coordinates=result?.geometry?.coordinates;
  if(data.code!=='Ok'||!Number.isFinite(result?.distance)||result.distance<=0||!Array.isArray(coordinates)||coordinates.length<2)throw Error('Sin retorno por carretera verificable');
  routeModel.returnRoute={distance:result.distance,coords:coordinates};
  routeModel.returnLine=L.polyline(coordinates.map(p=>[p[1],p[0]]),{color:'#2b76ab',weight:4,dashArray:'7,11',opacity:.85,interactive:false}).addTo(map);
  if(!e('logistics-show-return').checked)map.removeLayer(routeModel.returnLine);
  e('logistics-return-status').textContent='↩️ Regreso enrutado por separado: '+num(result.distance/1000,2)+' km; trazo azul discontinuo. Motor de demostración sin cierres ni tráfico.';
  present();
 }catch(err){if(token===returnGeneration)e('logistics-return-status').textContent='Retorno no disponible ('+String(err.message).slice(0,110)+'). Se mantiene cálculo estimado como 2 × ida.'}
 finally{clearTimeout(timer);if(returnAbort===controller)returnAbort=null}
}
function onRoute(route){
 if(!route||!Number.isFinite(route.distance)||route.distance<=0||!Array.isArray(route.coords)||route.coords.length<2)return;
 clearReturn();
 routeModel.route={distance:route.distance,coords:route.coords,origin:route.origin,destination:route.destination};
 e('logistics-return').disabled=false;
 clearLookups();present();
 window.dispatchEvent(new CustomEvent('balam:logistics-route-ready',{detail:{distance:route.distance,coords:route.coords}}));
 const n=e('logistics-panel');
 const box=n.closest('details');if(box)box.open=true;
 say('Ruta cargada. Ajusta combustible y, si lo necesitas, consulta servicios cerca del recorrido.');
}
function reset(){
 clearReturn();routeModel.route=null;e('logistics-return').disabled=true;
 clearLookups();present();say('Sin ruta actual. Los servicios anteriores se han retirado.');
 window.dispatchEvent(new Event('balam:logistics-route-cleared'));
}
function haversine(lat1,lon1,lat2,lon2){
 const r=Math.PI/180,a=Math.sin((lat2-lat1)*r/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin((lon2-lon1)*r/2)**2;
 return 12742*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function toXY(lat,lon,lat0){return [lon*111.32*Math.cos(lat0*Math.PI/180),lat*111.32]}
function nearestKm(lat,lon,coords){
 const lat0=lat;let best=Infinity;
 const p=toXY(lat,lon,lat0);
 for(let i=1;i<coords.length;i++){
  const a=toXY(coords[i-1][1],coords[i-1][0],lat0),b=toXY(coords[i][1],coords[i][0],lat0);
  const dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;
  const t=len?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len)):0;
  const d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
  best=Math.min(best,d);
 }
 return best;
}
function sampleCoords(coords,limit=24){
 if(coords.length<=limit)return coords;
 const out=[coords[0]];const n=coords.length;
 for(let i=1;i<limit-1;i++){out.push(coords[Math.round(i*(n-1)/(limit-1))])}
 out.push(coords[n-1]);
 return out;
}
function catOf(tags){return tags.amenity==='fuel'?'fuel':tags.shop==='tyres'?'tire':tags.shop==='car_repair'?'repair':null}
function checkedCats(){return new Set(['fuel','tire','repair','health'].filter(c=>e('logistics-'+c)?.checked))}
function pointIcon(cat){
 const emoji={fuel:'⛽',tire:'🛞',repair:'🔧',health:'🏥'}[cat];
 const fill=serviceColors[cat];
 return L.divIcon({className:'logistics-service-marker',html:'<div style="--service-color:'+fill+'">'+emoji+'</div>',iconSize:[34,34],iconAnchor:[17,17]});
}
function renderPoints(){
 osmServiceLayer.clearLayers();e('logistics-list').replaceChildren();
 const selected=checkedCats();
 const sorted=poiList.filter(x=>selected.has(x.category)).sort((a,b)=>a.nearKm-b.nearKm);
 const counts={fuel:0,tire:0,repair:0,health:0};
 for(const poi of sorted.slice(0,60)){
  counts[poi.category]++;
  const icon=pointIcon(poi.category);
  const pop='<b>'+esc(poi.name)+'</b><p>'+esc(poi.label)+' · aprox. '+num(poi.nearKm,2)+' km en línea recta del trazado.</p>'+
  (poi.category==='fuel'?'<p>No consta aceptación de tickets o vales. Verificar combustible, precio y medio de pago.</p>':'')+
  (poi.category==='health'?'<p>CLUES: registro administrativo. No confirma servicio de urgencias, capacidad ni atención a ambulancias.</p>':'<p>Ubicación OpenStreetMap sin verificación de apertura ni prestación actual del servicio.</p>');
  const mark=L.marker([poi.lat,poi.lon],{icon}).bindPopup(pop,{maxWidth:280}).addTo(osmServiceLayer);
  const item=document.createElement('button');item.type='button';item.className='logistics-spot';
  item.textContent={fuel:'⛽',tire:'🛞',repair:'🔧',health:'🏥'}[poi.category]+' '+poi.name+' · ~'+num(poi.nearKm,2)+' km de la ruta';
  item.onclick=()=>{map.panTo([poi.lat,poi.lon]);mark.openPopup()};
  e('logistics-list').appendChild(item);
 }
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 e('logistics-summary').textContent=total+' puntos visibles cerca de la ruta. ⛽ '+counts.fuel+' · 🛞 '+counts.tire+' · 🔧 '+counts.repair+' · 🏥 '+counts.health+'. Distancias al corredor en línea recta, no desvíos viales.';
 if(!total){e('logistics-list').textContent='No se encontraron puntos de las categorías activadas en la franja consultada. No implica que no existan servicios.'}
}
function addHealth(coords){
 const facilities=window.BALAM_Health?.getFacilities?.()||[];
 const selected=facilities.filter(f=>f.status_source==='EN OPERACION')
 .map(f=>({category:'health',name:f.name,lat:f.lat,lon:f.lon,label:'CLUES '+f.clues+' · '+f.institution,nearKm:nearestKm(f.lat,f.lon,coords),id:'clues:'+f.clues}))
 .filter(f=>f.nearKm<=2.5).sort((a,b)=>a.nearKm-b.nearKm).slice(0,60);
 return selected;
}
function parsePOIs(obj,coords){
 if(obj.remark)throw Error('Overpass respondió con datos incompletos o agotó el tiempo');
 const items=[],known=new Set();
 for(const p of obj.elements||[]){
  const tags=p.tags||{},cat=catOf(tags);
  if(!cat)continue;
  const lat=p.lat??p.center?.lat,lon=p.lon??p.center?.lon;
  if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
  const nearKm=nearestKm(lat,lon,coords);
  if(nearKm>1.8)continue;
  const id=p.type+':'+p.id;
  if(known.has(id))continue;known.add(id);
  items.push({category:cat,name:String(tags.name||tags.brand||{fuel:'Gasolinera',tire:'Llantera',repair:'Taller'}[cat]).slice(0,100),
   lat,lon,nearKm,id,label:'OpenStreetMap · '+(tags.opening_hours||'horario no documentado')});
 }
 return items;
}
function overpassQuery(coords){
 const sampled=sampleCoords(coords,22);
 const points=sampled.map(x=>x[1].toFixed(5)+','+x[0].toFixed(5)).join(',');
 // Una consulta acotada, sólo cuando el usuario lo solicita, nunca en la carga inicial.
 return '[out:json][timeout:22];('+
 'nwr(around:950,'+points+')["amenity"="fuel"];'+
 'nwr(around:950,'+points+')["shop"="tyres"];'+
 'nwr(around:950,'+points+')["shop"="car_repair"];'+
 ');out center 120;';
}
async function search(){
 const route=routeModel.route;if(!route){say('Dibuja primero una ruta');return}
 const now=Date.now();
 if(now-lookupTime<45000){say('Para cuidar el servicio público, espera 45 segundos entre consultas. Puedes cambiar filtros sin consultar de nuevo.');return}
 const current=++version;lookupTime=now;
 clearLookups();const expected=version;
 const coords=route.coords;
 say('Consultando establecimientos y servicios cercanos al trazado; puede tardar y el servidor público puede rechazar la consulta…');
 let results=addHealth(coords);
 const q=overpassQuery(coords);
 abort=new AbortController();const requestAbort=abort;const timeout=setTimeout(()=>requestAbort.abort(),25000);
 try{
  const resp=await fetch('https://overpass-api.de/api/interpreter',{
   method:'POST',mode:'cors',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
   body:'data='+encodeURIComponent(q),signal:requestAbort.signal
  });
  if(!resp.ok)throw Error('HTTP '+resp.status);
  const doc=await resp.json();
  if(version!==expected)return;
  results=results.concat(parsePOIs(doc,coords));
  say('Servicios consultados en OpenStreetMap. Presencia y horarios no verificados. No equivale a disponibilidad ni a acceso garantizado.');
 }catch(err){
  if(version!==expected)return;
  say('OpenStreetMap/Overpass no respondió: '+String(err.message).slice(0,95)+'. Solo se muestran unidades CLUES cercanas; no asumir ausencia de gasolineras o talleres.');
 }finally{clearTimeout(timeout);if(abort===requestAbort)abort=null}
 if(version!==expected)return;
 poiList=results;renderPoints();
}
for(const id of ['logistics-efficiency','logistics-price','logistics-reserve'])e(id).addEventListener('input',present);
for(const category of ['fuel','tire','repair','health'])e('logistics-'+category).addEventListener('change',renderPoints);
e('logistics-return').addEventListener('click',routeReturn);
e('logistics-show-return').addEventListener('change',ev=>{if(!routeModel.returnLine)return;if(ev.target.checked)routeModel.returnLine.addTo(map);else map.removeLayer(routeModel.returnLine)});
e('logistics-query').addEventListener('click',search);
e('logistics-clear').addEventListener('click',()=>{clearLookups();say('Servicios ocultados; la ruta y el cálculo de combustible permanecen.')});
e('logistics-query').disabled=true;
window.BALAM_Logistics={onRoute,reset,compute,getRoute:()=>routeModel.route?{...routeModel.route,returnRoute:routeModel.returnRoute}:null,_test:{nearestKm,haversine,sampleCoords,overpassQuery}};
present();
})();