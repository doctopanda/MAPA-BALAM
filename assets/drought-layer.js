/* SMN Monitor de Sequía: separado de pronóstico. Datos oficiales quincenales. */
(()=>{
'use strict';
const URL='https://raw.githubusercontent.com/doctopanda/MAPA-BALAM/main/data/smn/sonora_drought_latest.json';
const bridge=window.BALAM_SmnMap;
const el=id=>document.getElementById(id);
const fill={D0:'#ceb55b',D1:'#dfa153',D2:'#d57439',D3:'#b93e34',D4:'#81243a'};
let data=null,rows=new Map(),layer=null;
function status(t){el('drought-status').textContent=t}
function remove(){if(layer){bridge.map.removeLayer(layer);layer=null}}
function draw(){
 remove();
 if(!data||!el('drought-visible').checked)return;
 const selected=new Set(bridge.getActiveDistricts());
 const scope=el('drought-scope').value;
 const features=bridge.getMunicipalityFeatures().filter(f=>{
  const p=f.properties||{},c=String(p.cvegeo||p.CVEGEO||'');
  const d=rows.get(c);
  return d&&d.category&&fill[d.category]&&(scope==='all'||selected.has(bridge.getDistrictForMunicipality(c)));
 });
 if(!bridge.map.getPane('droughtPane')){
  const pane=bridge.map.createPane('droughtPane');pane.style.zIndex=418;pane.style.pointerEvents='none';
 }
 layer=L.geoJSON({type:'FeatureCollection',features},{pane:'droughtPane',interactive:false,style:f=>{
  const p=f.properties||{},r=rows.get(String(p.cvegeo||p.CVEGEO||''));
  return {pane:'droughtPane',color:fill[r.category],weight:3,fillColor:fill[r.category],fillOpacity:.68,opacity:.95};
 }}).addTo(bridge.map);
 el('drought-count').textContent=features.length+' municipios con categoría D0–D4 en esta vista';
}
function renderMunicipality(code){
 const target=el('smnDroughtInfo');if(!target)return;
 const d=rows.get(String(code));
 if(!data||!d){target.innerHTML='<b>Sequía</b><p>Sin corte oficial validado en BALAM. No inferir situación actual.</p>';return}
 const tag=d.category?d.category+' · '+d.description:'Sin categoría D0–D4 registrada en el corte';
 target.innerHTML='<b>Sequía · Monitor SMN</b><p><strong>'+tag+'</strong> · corte '+data.source_cut+'</p><p class="tiny">Evaluación quincenal, distinta del pronóstico de lluvia. D0 no equivale a sequía D1–D4.</p>';
}
async function load(){
 status('Consultando corte quincenal de sequía…');
 try{
  const r=await fetch(URL+'?v='+new Date().getUTCDate(),{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const d=await r.json();
  if(d.schema!=='balam-smn-drought-v1'||d.status!=='ok'||d.municipalities?.length!==72)throw Error('Corte incompleto');
  const cut=Date.parse(d.source_cut+'T00:00:00Z'),days=(Date.now()-cut)/86400000;
  if(!Number.isFinite(days)||days>50||days<0)throw Error('Corte oficial fuera de vigencia del producto');
  data=d;rows=new Map(d.municipalities.map(v=>[v.code,v]));
  el('drought-visible').disabled=false;
  const cat=d.categories;
  el('drought-sonora-summary').textContent='Sonora '+d.source_cut+' · '+(cat.D1+cat.D2+cat.D3+cat.D4)+' municipios con sequía D1–D4 · '+cat.D0+' anormalmente seco D0 · '+cat.sin_categoria+' sin categoría D0–D4.';
  status('Monitor SMN validado · '+d.source_cut+'. Actualización quincenal, no pronóstico de riesgo inmediato.');
  draw();bridge.refreshSelectedMunicipality();
 }catch(e){
  rows.clear();data=null;el('drought-visible').disabled=true;el('drought-visible').checked=false;
  el('drought-sonora-summary').textContent='No hay corte de sequía municipal verificable.';
  status('Sequía: '+String(e.message).slice(0,120));remove();bridge.refreshSelectedMunicipality();
 }
}
el('drought-visible').addEventListener('change',e=>{
 if(e.target.checked){
  const w=el('smn-visible');if(w?.checked){w.checked=false;w.dispatchEvent(new Event('change'))}
 }
 draw();
});
el('drought-scope').addEventListener('change',draw);
el('drought-refresh').addEventListener('click',load);
window.addEventListener('balam:municipalities-ready',draw);
window.addEventListener('balam:districts-changed',draw);
window.BALAM_Drought={renderMunicipality,refresh:load};
load();
})();