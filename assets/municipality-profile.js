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

function municipalSelector(code){
 const features=window.BALAM_SmnMap?.getMunicipalityFeatures?.()||[];
 const entries=[...new Map(features.map(f=>{
  const p=f.properties||{},id=String(p.cvegeo||p.CVEGEO||''),name=String(p.nom_agem||p.NOM_AGEM||p.nombre||p.NOMBRE||id);
  return [id,{id,name}];
 })).values()].filter(x=>/^26\d{3}$/.test(x.id)).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 return '<label class="municipal-selector" for="municipalGoto">🔁 Cambiar de municipio'+
 '<select id="municipalGoto" aria-label="Seleccionar municipio de Sonora">'+
 entries.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===code?' selected':'')+'>'+esc(x.name)+'</option>').join('')+
 '</select></label>';
}
function seriesLine(values,opt={}){
 const a=values.map(Number),vmin=0,vmax=Math.max(1,...a),height=83,left=25,right=284;
 const pts=a.map((v,i)=>[left+(right-left)*i/(a.length-1),98-height*(v-vmin)/(vmax-vmin)]);
 const path=pts.map(p=>p.map(x=>x.toFixed(1)).join(',')).join(' ');
 const col=opt.color||'#318775';
 return '<polyline points="'+path+'" fill="none" stroke="'+col+'" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>';
}
function trendChart(row){
 const vals=row.trend,year2026=vals[2026-2015],top=Math.max(...vals);
 let html='<div class="municipal-chart-title">Evolución poblacional proyectada · 2015–2030</div>'+
 '<svg class="municipal-curve" viewBox="0 0 305 124" role="img" aria-label="Proyección anual de población municipal de 2015 a 2030">'+
 '<line x1="25" y1="100" x2="284" y2="100" stroke="#c8ddd7" stroke-width="1"/>'+
 '<line x1="25" y1="14" x2="25" y2="100" stroke="#c8ddd7" stroke-width="1"/>'+
 seriesLine(vals)+
 '<text x="3" y="18" font-size="9" fill="#477266">'+esc(fmt(top))+'</text>'+
 '<text x="25" y="116" font-size="10" fill="#477266">2015</text>'+
 '<text x="191" y="116" font-size="10" fill="#477266">2026</text>'+
 '<text x="259" y="116" font-size="10" fill="#477266">2030</text>'+
 '</svg>'+
 '<div class="municipal-trend-summary"><span>2026: <b>'+fmt(year2026)+'</b></span><span>2030: <b>'+fmt(vals.at(-1))+'</b></span></div>';
 return html;
}
function ageCurve(groups){
 const male=groups.map(x=>x.male),female=groups.map(x=>x.female);
 const ymax=Math.max(1,...male,...female),left=25,right=284,ht=74;
 const points=vals=>vals.map((v,i)=>[
  left+(right-left)*i/(vals.length-1),92-ht*v/ymax
 ]).map(p=>p.map(x=>x.toFixed(1)).join(',')).join(' ');
 return '<div class="municipal-chart-title">Curva poblacional por edad y sexo · 2026</div>'+
 '<svg class="municipal-curve" viewBox="0 0 305 120" role="img" aria-label="Curva quinquenal masculina y femenina de población 2026">'+
 '<line x1="25" x2="284" y1="94" y2="94" stroke="#c8ddd7"/>'+
 '<polyline points="'+points(male)+'" fill="none" stroke="#438c98" stroke-width="2.7"/>'+
 '<polyline points="'+points(female)+'" fill="none" stroke="#be7699" stroke-width="2.7"/>'+
 '<text x="0" y="15" font-size="9" fill="#53766e">'+esc(fmt(ymax))+'</text>'+
 groups.map((g,i)=>i%3===0||i===groups.length-1?'<text x="'+(25+(259)*i/(groups.length-1)).toFixed(0)+'" y="108" text-anchor="middle" font-size="8" fill="#52756c">'+esc(g.age)+'</text>':'').join('')+
 '</svg><div class="municipal-legend"><span>● Mujeres</span><span>● Hombres</span></div>';
}
function conapoGroups(row){
 const ages=window.BALAM_CONAPO?.getAgeGroups?.()||[];
 return ages.map((age,i)=>({age,year:'2026',male:row.male[i],female:row.female[i]}));
}
function render(){
 const root=currentContext();if(!root)return;
 const code=selected.code,c=census.get(code),loc=localities.get(code),a=agebs.get(code);
 const conapo=window.BALAM_CONAPO?.getMunicipality?.(code);
 const projection=conapo?conapo.trend[2026-2015]:null;
 let html=municipalSelector(code)+
 '<div class="municipal-section-title">🧭 Radiografía territorial</div>'+
 '<div class="municipal-stats">'+
 showMetric('Población proyectada 2026',projection,'CONAPO · municipal · proyección')+
 showMetric('Población censada 2020',c?.population,'INEGI · Censo 2020')+
 showMetric('Localidades geoestadísticas',loc,'Catálogo INEGI · consulta en línea')+
 showMetric('AGEB identificadas',a?.total,a?('Urb. '+fmt(a.urban)+' · rur. '+fmt(a.rural)+(a.partial?' · carga parcial':'')):(errors.has('ageb:'+code)?'Servicio de polígonos no disponible':'Se cuentan al cargar la capa'))+
 '</div>';
 if(conapo){
  const groups=conapoGroups(conapo);
  const male=conapo.male.reduce((sum,v)=>sum+v,0),female=conapo.female.reduce((sum,v)=>sum+v,0);
  html+='<p class="tiny"><b>CONAPO 2026:</b> mujeres '+fmt(female)+' · hombres '+fmt(male)+'. Total '+fmt(male+female)+' (la suma coincide con la serie anual).</p>';
  html+=trendChart(conapo)+ageCurve(groups)+agePyramid([...groups].reverse());
 }else{
  const st=window.BALAM_CONAPO?.getStatus?.();
  html+='<div class="municipal-pending"><b>📊 Proyecciones por edad y sexo</b><p>'+
   esc(st?.error?'No se pudo cargar la base local CONAPO: '+st.error:'Cargando proyecciones CONAPO municipales 2015–2030…')+'</p></div>';
 }
 if(c){html+=ageSexChart(c);}
 else html+='<p class="tiny">'+(errors.has('census:'+code)?'No se pudo consultar la población censal INEGI.':'Población censal INEGI pendiente de consulta.')+' La proyección CONAPO permanece identificada por separado.</p>';
 html+='<p class="tiny"><b>Procedencia CONAPO:</b> archivo municipal aportado «Sonora.ProyeccionesPoblacionMunicipales2015-2030». Proyección por grupos quinquenales, 65 años y más como grupo abierto. No confundir con censo ni con datos de regiones. '+
  link(sources.census,'Catálogo geográfico INEGI')+'. Localidades son registros geoestadísticos, no localidades documentadas por SIESA.'+
  (errors.has('localities:'+code)?' La consulta de localidades no respondió.':'')+'</p>';
 root.innerHTML=html;
 const selector=root.querySelector('#municipalGoto');
 if(selector)selector.addEventListener('change',ev=>window.BALAM_SmnMap?.selectMunicipality?.(ev.target.value));
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
window.addEventListener('balam:conapo-ready',render);
})();