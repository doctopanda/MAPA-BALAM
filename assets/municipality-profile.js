/* BALAM 0.16 · ficha municipal. Solo muestra datos con fuente y temporalidad explícita. */
(()=>{
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>typeof x==='number'&&Number.isFinite(x)?x.toLocaleString('es-MX'):'Sin dato';
const census=new Map(),localities=new Map(),agebs=new Map(),inFlight=new Map(),errors=new Map();
let selected=null;
const sources={
 census:'https://www.inegi.org.mx/servicios/catalogounico/',
 age:'https://www.inegi.org.mx/app/scitel/default?ev=12',
 localities:'https://www.inegi.org.mx/servicios/catalogounico/',
 warning:'https://proteccioncivil.sonora.gob.mx/',
 epidemiology:'https://www.gob.mx/salud/es/acciones-y-programas/direccion-general-de-epidemiologia-boletin-epidemiologico',
 cyclone:'https://smn.conagua.gob.mx/es/pronosticos/avisos/aviso-de-ciclon-tropical-en-el-oceano-pacifico'
};
const link=(url,text)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(text)+' ↗</a>';
const num=x=>{if(x===null||x===undefined||x==='')return null;const n=Number(x);return Number.isSafeInteger(n)&&n>=0?n:null};
const getRoot=()=>document.getElementById('municipalTerritory');
function parseCensus(data){
 const row=Array.isArray(data?.datos)?data.datos[0]:null;
 if(!row)return null;
 const population=num(row.pob_total),female=num(row.pob_femenina),male=num(row.pob_masculina);
 if(population===null||female===null||male===null)return null;
 return {population,female,male,source:data.metadatos?.Fuente_informacion_estadistica||'INEGI · Censo 2020'};
}
function countLocalities(data){
 // Catálogo geográfico, no conteo de localidades habitadas ni de registros SIESA.
 if(Array.isArray(data?.datos))return data.datos.length;
 if(Number.isInteger(data?.numReg)&&data.numReg>=0)return data.numReg;
 return null;
}
function currentContext(){
 const target=getRoot();
 return selected&&target&&target.dataset.code===selected.code?target:null;
}
function showMetric(name,value,note=''){
 return '<div class="municipal-stat"><span>'+esc(name)+'</span><strong>'+esc(fmt(value))+'</strong>'+(note?'<small>'+esc(note)+'</small>':'')+'</div>';
}
function ageSexChart(c){
 const total=c.female+c.male;
 const share=total>0?100*c.female/total:0;
 return '<div class="municipal-chart-title">Distribución por sexo · Censo 2020</div>'+
  '<div class="municipal-sexbar" role="img" aria-label="Mujeres '+fmt(c.female)+', hombres '+fmt(c.male)+'">'+
  '<span class="municipal-sex-female" style="width:'+share.toFixed(3)+'%"></span>'+
  '<span class="municipal-sex-male" style="width:'+(100-share).toFixed(3)+'%"></span></div>'+
  '<div class="municipal-legend"><span>● Mujeres: '+fmt(c.female)+'</span><span>● Hombres: '+fmt(c.male)+'</span></div>';
}
function agePyramid(groups){
 if(!Array.isArray(groups)||!groups.length)return '';
 const max=Math.max(1,...groups.flatMap(x=>[Number(x.female)||0,Number(x.male)||0]));
 return '<div class="municipal-chart-title">Pirámide por edad y sexo · '+esc(groups[0].year||'periodo de fuente')+'</div>'+
 '<div class="municipal-pyramid" role="img" aria-label="Pirámide por grupos de edad y sexo">'+
 groups.map(g=>{
  const m=Number(g.male)||0,f=Number(g.female)||0;
  return '<div class="municipal-pyr-row"><div class="municipal-pyr-side left" title="Hombres '+fmt(m)+'"><span style="width:'+(100*m/max)+'%"></span></div><b>'+esc(g.age)+'</b><div class="municipal-pyr-side right" title="Mujeres '+fmt(f)+'"><span style="width:'+(100*f/max)+'%"></span></div></div>';
 }).join('')+'</div><div class="municipal-legend"><span>● Hombres</span><span>● Mujeres</span></div>';
}
function render(){
 const root=currentContext();if(!root)return;
 const code=selected.code,c=census.get(code),loc=localities.get(code),a=agebs.get(code);
 const demo=window.BALAM_MunicipalAgeSex?.[code];
 let html='<div class="municipal-section-title">🧭 Radiografía territorial</div>'+
 '<div class="municipal-stats">'+
 showMetric('Población censada',c?.population,'INEGI · 2020')+
 showMetric('Localidades geoestadísticas',loc,'Catálogo INEGI · consulta en línea')+
 showMetric('AGEB identificadas',a?.total,a?('Urb. '+fmt(a.urban)+' · rur. '+fmt(a.rural)+(a.partial?' · carga parcial':'')):(errors.has('ageb:'+code)?'Servicio de polígonos no disponible':'Se cuentan al cargar la capa'))+
 '</div>';
 if(c){
  html+=ageSexChart(c);
 }else{
  html+='<p class="tiny">'+(errors.has('census:'+code)?'No se pudo consultar la población INEGI en este momento.':'Población y desglose por sexo pendientes de respuesta del servicio INEGI.')+' No se estiman a partir de otra geografía.</p>';
 }
 html+=demo?.length?agePyramid(demo):
  '<div class="municipal-pending"><b>👥 Pirámide por grupos de edad y sexo</b><p>Se habilitará al importar el desglose quinquenal municipal de INEGI/CONAPO. La población total por sexo no permite reconstruir edades reales.</p>'+
  link(sources.age,'Censo 2020 · estructura por edad')+'</div>';
 html+='<p class="tiny">Fuentes: '+link(sources.census,'INEGI · catálogo geoestadístico')+'. Las localidades son registros del catálogo, no las localidades documentadas por SIESA. Los datos censales 2020 no son proyecciones 2026.'+(errors.has('localities:'+code)?' La consulta de localidades no respondió; el número permanece sin dato.':'')+'</p>';
 root.innerHTML=html;
 renderRisk();
}
function renderRisk(){
 const root=document.getElementById('municipalRisk');
 if(!selected||!root||root.dataset.code!==selected.code)return;
 const signal=window.BALAM_Smn?.getData?.(selected.code);
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Hermosillo'});
 const f=signal?.days?.find(x=>x.date>=today)||null;
 const watch=f?.signals?.filter(x=>['lluvia_intensa_potencial','racha_fuerte','calor_extremo','frio'].includes(x))||[];
 const dictionary={lluvia_intensa_potencial:'Lluvia ≥30 mm/día',racha_fuerte:'Rachas ≥60 km/h',calor_extremo:'Temperatura ≥40 °C',frio:'Temperatura mínima ≤5 °C'};
 root.innerHTML='<div class="municipal-section-title">⚠️ Vigilancia territorial</div>'+
  (f?'<div class="municipal-riskline"><b>Señales meteorológicas BALAM · '+esc(f.date)+'</b><span>'+ (watch.length?watch.map(w=>'<strong class="municipal-riskpill">'+esc(dictionary[w])+'</strong>').join(' '):'Sin umbrales internos activados en el día consultado. Esto no descarta riesgos.')+'</span></div>':
  '<div class="municipal-riskline"><b>Pronóstico vigente</b><span>Sin corte municipal reciente verificable; consultar SMN.</span></div>')+
  '<div class="municipal-riskline"><b>🦠 Alertas epidemiológicas oficiales</b><span>Sin feed municipal de alertas integrado. Estado activo no verificable, no equivale a cero alertas.</span>'+
   link(sources.epidemiology,'Boletín epidemiológico SINAVE')+'</div>'+
  '<div class="municipal-riskline"><b>🌀 Ciclones y afectaciones</b><span>Sin vinculación geográfica validada de avisos o trayectorias activas al municipio. No se infiere seguridad.</span>'+
   link(sources.cyclone,'Avisos oficiales SMN')+'</div>'+
  '<div class="municipal-riskline"><b>🌊 Desastres y protección civil</b><span>Sin feed de alertamiento municipal verificado. Lluvia prevista no equivale a inundación confirmada.</span>'+
   link(sources.warning,'Protección Civil Sonora')+'</div>'+
  '<p class="tiny">La tabla meteorológica de 3 días y la sequía se muestran debajo con sus cortes y vigencia. Señales BALAM ≠ avisos oficiales.</p>';
}
async function fetchOnce(key,url,cache,parse){
 if(cache.has(key)||inFlight.has(url))return inFlight.get(url);
 const job=(async()=>{
  try{
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),12000);
   let r;
   try{r=await fetch(url,{signal:controller.signal,cache:'force-cache'});}finally{clearTimeout(timeout)}
   if(!r.ok)throw Error('HTTP '+r.status);
   const value=parse(await r.json());
   if(value!==null){cache.set(key,value);errors.delete((cache===census?'census:':'localities:')+key)}
   else errors.set((cache===census?'census:':'localities:')+key,'Respuesta no válida');
  }catch(err){errors.set((cache===census?'census:':'localities:')+key,String(err.message||'Sin respuesta'));}
  finally{inFlight.delete(url);render()}
 })();
 inFlight.set(url,job);
 return job;
}
function select(code,name){
 if(!/^26\d{3}$/.test(String(code)))return;
 selected={code:String(code),name:String(name||'Municipio')};
 const territory=getRoot(),risk=document.getElementById('municipalRisk');
 if(territory)territory.dataset.code=String(code);
 if(risk)risk.dataset.code=String(code);
 render();
 const mun=String(code).slice(2);
 fetchOnce(code,'https://gaia.inegi.org.mx/wscatgeo/v2/mgem/26/'+mun,census,parseCensus);
 fetchOnce(code,'https://gaia.inegi.org.mx/wscatgeo/v2/localidades/26/'+mun,localities,countLocalities);
}
function setAgeb(code,total,urban,rural,partial=false){
 if(!/^26\d{3}$/.test(String(code)))return;
 const values=[total,urban,rural];
 if(!values.every(x=>Number.isSafeInteger(x)&&x>=0))return;
 agebs.set(String(code),{total,urban,rural,partial:!!partial});errors.delete('ageb:'+code);
 render();
}
function setAgebError(code){errors.set('ageb:'+String(code),'Sin respuesta');render()}
window.BALAM_Municipal={
 select,render,renderRisk,setAgeb,setAgebError,
 getCensus:code=>census.get(String(code))||null,
 _test:{parseCensus,countLocalities}
};
window.addEventListener('balam:smn-updated',renderRisk);
})();