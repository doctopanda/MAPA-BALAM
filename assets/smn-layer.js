/* BALAM 0.9 · SMN municipal: consulta pública agregada y capas separadas de CRUM/SIESA. */
(()=>{
'use strict';
const bridge=window.BALAM_SmnMap;
const el=id=>document.getElementById(id);
const SMN_PUBLIC='https://raw.githubusercontent.com/doctopanda/MAPA-BALAM/main/data/smn/sonora_latest.json';
const WATCH={lluvia_intensa_potencial:'Lluvia prevista ≥30 mm/día',racha_fuerte:'Rachas previstas ≥60 km/h',calor_extremo:'T. máxima prevista ≥40 °C',frio:'T. mínima prevista ≤5 °C'};
const ACTION={lluvia_intensa_potencial:'Revisar rutas, drenajes y puntos propensos a anegamiento; no implica inundación confirmada.',racha_fuerte:'Verificar exposición a vientos y continuidad de traslados; no implica daños confirmados.',calor_extremo:'Reforzar vigilancia preventiva por calor en personas vulnerables.',frio:'Revisar medidas preventivas ante frío en población vulnerable.'};
const PALETTE={none:'#78b2a6',low:'#f2b36d',high:'#c94d50',rain:'#2781c0',heat:'#da7d31',wind:'#a368bc'};
let dataset=null,rows=new Map(),layer=null,enabled=false,fresh=false,loading=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,digits=0)=>Number.isFinite(n)?n.toLocaleString('es-MX',{maximumFractionDigits:digits}):'Sin dato';
const isoDay=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Hermosillo'});
function status(v){el('smn-status').textContent=v}
function currentDay(item){
 if(!item?.days?.length)return null;
 const now=isoDay();
 const selected=el('smn-day')?.value;
 return (selected&&item.days.find(d=>d.date===selected))||item.days.find(d=>d.date>=now)||item.days.at(-1);
}
function freshEnough(data){
 if(data?.status!=='ok'||!data.fetched_at)return false;
 const age=Date.now()-Date.parse(data.fetched_at);
 return Number.isFinite(age)&&age>=-900000&&age<=12*60*60*1000;
}
function getData(code){return fresh?rows.get(String(code)):null}
function getSignals(forecast){return Array.isArray(forecast?.signals)?forecast.signals.filter(s=>Object.hasOwn(WATCH,s)):[]}
function color(r){
 const f=currentDay(r),metric=el('smn-metric').value;
 if(!f)return null;
 if(metric==='watch')return getSignals(f).length>1?PALETTE.high:getSignals(f).length?PALETTE.low:null;
 if(metric==='rain')return f.rain_mm===null?null:f.rain_mm>=30?'#206ba9':f.rain_mm>=10?'#72a6d5':f.rain_mm>0?'#c4def0':'#e9f2fa';
 if(metric==='heat')return f.tmax_c===null?null:f.tmax_c>=40?'#c95339':f.tmax_c>=35?'#e8a15d':f.tmax_c>=30?'#efca8d':f.tmax_c>=25?'#e4e5a9':'#c3dce6';
 if(metric==='wind')return f.gust_kmh===null?null:f.gust_kmh>=60?'#914db3':f.gust_kmh>=40?'#c5a4db':f.gust_kmh>=20?'#e3c9ed':'#edf2f4';
 return null;
}
function clearOverlay(){if(layer){bridge.map.removeLayer(layer);layer=null;}}
function paint(){
 clearOverlay();
 const choose=el('smn-visible');
 if(!fresh||!enabled||!choose.checked){return;}
 const scope=el('smn-scope').value,selected=new Set(bridge.getActiveDistricts());
 const features=bridge.getMunicipalityFeatures();
 const filtered=features.filter(f=>{
  const code=String(f.properties?.cvegeo||f.properties?.CVEGEO||'');
  const r=rows.get(code);
  return r&&color(r)&&(scope==='all'||selected.has(r.district));
 });
 const pane='smnPane';
 layer=L.geoJSON({type:'FeatureCollection',features:filtered},{
  pane,interactive:false,style:f=>{
   const code=String(f.properties?.cvegeo||f.properties?.CVEGEO||''),r=rows.get(code);
   return {pane,color:color(r)||'#999',weight:2,fillColor:color(r)||'#999',fillOpacity:.33,opacity:.9}
  }
 }).addTo(bridge.map);
 el('smn-overlay-count').textContent=filtered.length+' municipios coloreados · '+(el('smn-day').value||'fecha actual');
}
function renderMunicipality(code){
 const target=el('smnMunicipalInfo');if(!target)return;
 const rec=getData(code);
 if(!rec){target.innerHTML='<h4>🌦️ Pronóstico SMN</h4><p class="tiny">'+(fresh?'Sin pronóstico municipal en el último corte validado.':'No hay un corte reciente verificado. Consulta los avisos oficiales.')+'</p><a target="_blank" rel="noopener noreferrer" href="https://smn.conagua.gob.mx/es/">Abrir SMN/CONAGUA ↗</a>';return;}
 const f=currentDay(rec),sig=getSignals(f);
 const tr=rec.days.map(d=>'<tr><td>'+esc(d.date)+'</td><td>'+fmt(d.tmin_c,1)+' / '+fmt(d.tmax_c,1)+' °C</td><td>'+fmt(d.rain_mm,1)+' mm</td><td>'+fmt(d.rain_probability_pct)+'%</td><td>'+fmt(d.gust_kmh)+' km/h</td></tr>').join('');
 const signs=sig.length?sig.map(s=>'<li><b>'+esc(WATCH[s])+'</b><span>'+esc(ACTION[s])+'</span></li>').join(''):'<li>No se alcanzan los umbrales exploratorios configurados para el primer día. Esto no descarta riesgos.</li>';
 const crum=window.BALAM_CrumForMunicipality?.(String(code))??null;
 target.innerHTML='<h4>🌦️ SMN/CONAGUA · '+esc(rec.name)+'</h4>'+
  '<p class="tiny">Pronóstico municipal a 3 días. Consulta: '+esc(dataset.fetched_at||'sin fecha')+'.</p>'+
  '<div class="smn-table-wrap"><table><thead><tr><th>Fecha</th><th>Mín./Máx.</th><th>Lluvia</th><th>Prob.</th><th>Rachas</th></tr></thead><tbody>'+tr+'</tbody></table></div>'+
  '<div class="smn-signals"><b>Señales de vigilancia BALAM · '+esc(f?.date||'fecha no disponible')+'</b><ul>'+signs+'</ul></div>'+
  '<p class="tiny">Criterios internos provisionales, NO alertas oficiales ni predicción de daños. Revisar avisos de SMN y Protección Civil.</p>'+
  (crum!==null?'<p class="tiny">🚑 CRUM: '+crum+' registros inventariados en este municipio (no disponibilidad operativa).</p>':'<p class="tiny">🚑 Activa sesión CRUM para consultar recursos municipales.</p>')+
  '<a href="https://smn.conagua.gob.mx/es/pronostico-del-tiempo-por-municipios" target="_blank" rel="noopener noreferrer">Pronóstico oficial ↗</a>';
}
function rerender(){paint();bridge.refreshSelectedMunicipality();}
async function load(){
 if(loading)return;
 loading=true;status('Consultando corte SMN validado…');
 try{
  const r=await fetch(SMN_PUBLIC+'?nocache='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const data=await r.json();
  if(data?.schema!=='balam-smn-municipal-v1')throw new Error('Formato incompatible');
  dataset=data;
  fresh=freshEnough(data);
  rows=new Map((data.municipalities||[]).map(x=>[x.code,x]));
  const daySelector=el('smn-day'),keep=daySelector.value;
  daySelector.replaceChildren(...(data.forecast_days||[]).map(day=>new Option(day,day)));
  if((data.forecast_days||[]).includes(keep))daySelector.value=keep;
  if(!fresh){
    enabled=false;el('smn-visible').checked=false;el('smn-visible').disabled=true;
    status('Sin pronóstico reciente validado. Se desactiva la capa hasta obtener datos actualizados.');
  }else{
    el('smn-visible').disabled=false;
    status('SMN: '+rows.size+' municipios · corte '+new Date(data.fetched_at).toLocaleString('es-MX')+'. No son avisos oficiales.');
  }
  el('smn-source').textContent=data.fetched_at?'Actualizado: '+new Date(data.fetched_at).toLocaleString('es-MX'):'Aún sin corte verificado';
  rerender();
 }catch(err){
  fresh=false;enabled=false;rows.clear();el('smn-visible').checked=false;el('smn-visible').disabled=true;
  status('No se pudo obtener un corte validado SMN ('+String(err.message).slice(0,100)+'). Consulta la fuente oficial.');
  rerender();
 }finally{loading=false}
}
el('smn-visible').addEventListener('change',e=>{enabled=e.target.checked;paint()});
el('smn-scope').addEventListener('change',paint);
el('smn-metric').addEventListener('change',paint);
el('smn-day').addEventListener('change',rerender);
el('smn-reload').addEventListener('click',load);
window.addEventListener('balam:districts-changed',paint);
window.addEventListener('balam:municipalities-ready',paint);
window.addEventListener('balam:crum-updated',()=>bridge.refreshSelectedMunicipality());
window.BALAM_Smn={renderMunicipality,getData,refresh:load};
load();
})();