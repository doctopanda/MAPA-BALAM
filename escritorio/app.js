/* BALAM Visor de escritorio: restauración pública de la organización v5.3.3.
   EXCLUSIVAMENTE agregados procedentes de las fuentes públicas en MAPA-BALAM.
   No contiene el almacén nominal del HTML operativo suministrado por el usuario. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(n)?Math.round(n).toLocaleString('es-MX'):'Sin dato';
const validN=n=>Number.isFinite(n),sum=(a)=>a.reduce((n,x)=>n+(Number(x)||0),0);
const TABS={
 panorama:['Panorama general','Lectura territorial y resumen de los cortes disponibles.'],
 atenciones:['Pacientes y atenciones','Unidades de atención y límites de interpretación.'],
 acciones:['Acciones','Trabajo asistencial y operativo, con unidades distintas.'],
 areas:['Áreas SIESA','Distribución de registros por módulo de captura.'],
 paquetes:['Paquetes SIESA','Exploración de los módulos documentados.'],
 tiempo:['Tiempo operativo','Cronología documentada sin inventar una serie diaria.'],
 cruces:['Cruces y contexto','Agregados municipales y denominadores demográficos.'],
 auditor:['Centro de carga','Herramienta reservada al HTML local, nunca al GitHub público.'],
 gerencia:['Gerencia y Rectoría','Síntesis de mando del eje G.'],
 operacion:['Operaciones','Actividades territoriales del eje O.'],
 logistica:['Logística','Recursos e inventarios del eje L.'],
 inteligencia:['Inteligencia en Salud','Vigilancia y análisis del eje I.'],
 programas:['Programas','Intervenciones de promoción y vacunación del eje P.'],
 cecosabi:['CECOSABI','Saneamiento territorial del eje C.'],
 administracion:['Administración','Calidad de datos y auditoría del eje A.'],
 muestras:['Muestras EBT','Registros de laboratorio protegidos.'],
 mapa:['MAPA BALAM','Exploración geográfica interoperable.'],
 graficos:['Centro Gráfico','Curvas CONAPO y lectura visual SIESA.'],
 tablas:['Centro de Tablas','Agregados municipales con fuentes explícitas.']
};
const MODS=[
['atencion_medica','Atención médica'],['enfermeria','Enfermería'],['promocion_salud','Promoción de la salud'],
['vigilancia_epidemiologica','Vigilancia epidemiológica'],['vacunacion','Vacunación'],
['vectores','Vectores'],['riesgos_sanitarios','Riesgos sanitarios'],
['salud_mental','Salud mental'],['seguimiento_localidad_desastre','Seguimiento por desastre']
];
const GO=[
 ['G','Gerencia y Rectoría','gerencia'],['O','Operaciones','operacion'],['L','Logística','logistica'],
 ['I','Inteligencia en Salud','inteligencia'],['P','Programas','programas'],['C','CECOSABI','cecosabi'],['A','Administración','administracion']
];
const state={districts:null,ds05:null,conapo:null,names:new Map(),district:'DS05',municipality:'all',tab:'panorama',ready:false};
async function readJson(url){
 const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(url+' · HTTP '+r.status);return r.json();
}
async function readConapo(){
 if(!('DecompressionStream' in window))throw Error('Navegador sin soporte de descompresión. Usa Chrome/Firefox/Safari actualizado.');
 const r=await fetch('../data/conapo/sonora_municipios_2015_2030.b64',{cache:'no-store'});
 if(!r.ok)throw Error('CONAPO · HTTP '+r.status);
 const raw=atob((await r.text()).trim());
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 const out=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).text();
 const j=JSON.parse(out);
 if(j.profiles?.length!==72||j.years?.length!==16||j.ageGroups?.length!==14)throw Error('Integridad CONAPO incorrecta');
 const items=new Map();
 for(const [code,trend,male,female] of j.profiles){
  if(!/^26\d{3}$/.test(code)||trend.length!==16||male.length!==14||female.length!==14||sum(male)+sum(female)!==trend[11])throw Error('Datos CONAPO incompatibles: '+code);
  items.set(code,{trend,male,female});
 }
 return {doc:j,items};
}
function district(){return state.districts?.districts?.find(d=>d.id===state.district)}
const hasSiesa=()=>state.ready&&state.district==='DS05';
const row=()=>hasSiesa()&&state.municipality!=='all'?state.ds05.municipalities.find(m=>m.cvegeo===state.municipality):null;
const siesaRows=()=>hasSiesa()?row()?[row()]:state.ds05.municipalities:[];
const districtPopulation=()=>{
 if(!state.conapo)return null;
 return sum((district()?.municipalities||[]).map(m=>state.conapo.items.get('26'+m)?.trend[11]||0));
};
const currentPopulation=()=>state.municipality==='all'?districtPopulation():state.conapo?.items.get(state.municipality)?.trend[11]??null;
const munName=c=>state.ds05?.municipalities?.find(m=>m.cvegeo===c)?.name||state.names.get(c)||('Municipio '+c);
const metric=(label,value,note)=>'<div class="metric"><small>'+esc(label)+'</small><b>'+fmt(value)+'</b><span>'+esc(note)+'</span></div>';
const note=(message,warning=false)=>'<div class="notice'+(warning?' warn':'')+'">'+message+'</div>';
const panel=(title,body,subtitle='')=>'<article class="panel"><div class="panel-head"><h2>'+esc(title)+'</h2><span>'+esc(subtitle)+'</span></div>'+body+'</article>';
const aggregateNotAvailable=()=>note('El distrito '+esc(state.district)+' no dispone de un corte SIESA público normalizado. No se debe interpretar la ausencia de captura como cero actividad.',true);
const scope=()=>state.municipality==='all'?esc(state.district):esc(munName(state.municipality));
const cut=()=>hasSiesa()?'SIESA · '+esc(state.ds05.cut):'Sin corte SIESA publicado';
function metricBars(rows,unit='registros',pink=false){
 const mx=Math.max(1,...rows.map(x=>Number(x.value)||0));
 return '<div class="rows">'+rows.map(x=>'<div class="bar-row"><div class="bar-name"><span>'+esc(x.label)+'</span><b>'+fmt(x.value)+' '+esc(unit)+'</b></div><div class="bar-track'+(pink?' pink':'')+'"><i style="width:'+(100*x.value/mx).toFixed(1)+'%"></i></div></div>').join('')+'</div>';
}
const metricKpis=(rows)=>'<div class="summary">'+rows.map(x=>metric(...x)).join('')+'</div>';
const operating=()=>state.ds05?.current_filter||{};
const modules=()=>MODS.map(([key,label])=>({key,label,value:sum(siesaRows().map(m=>m.modules?.[key]||0))}));
const canonicalTotal=()=>sum(siesaRows().map(m=>m.canonical_rows));
function navigationLink(tab,label){return '<button type="button" class="action secondary" data-target="'+tab+'">'+esc(label)+' ↗</button>'}
function panorama(){
 let rows=[['Población proyectada 2026',currentPopulation(),'CONAPO · población, no censo'],['Municipios del distrito',district()?.municipalities?.length,'Regionalización BALAM']];
 if(hasSiesa()){
  rows.push(['Filas canónicas SIESA',canonicalTotal(),'Registros capturados, no personas']);
  if(state.municipality==='all')rows.push(['Acciones operativas',operating().discrete_operational_actions,'Total SIESA DS05, no por municipio'],['Acciones asistenciales',operating().healthcare_actions,'Total SIESA DS05, no por municipio'],['Casos / atenciones',operating().cases_or_attentions,'Total de eventos, no personas únicas']);
  else rows.push(['Áreas con capturas',modules().filter(x=>x.value>0).length,'Nueve módulos públicos'],['Localidades documentadas',row()?.documented_localities,'Con actividad registrada']);
 }
 const main=metricKpis(rows);
 const explanation=hasSiesa()
 ?(state.municipality==='all'?'El corte público del operativo OSS HURACÁN POLO SON DS05 permite observar acciones asistenciales, acciones operativas y unidades de atención. Estos universos no son intercambiables.':'En esta selección municipal solo se muestran capturas canónicas y módulos disponibles. Los totales generales del operativo no se redistribuyen artificialmente por municipio.')
 :'Este distrito tiene proyección demográfica disponible, pero no cuenta con un corte SIESA público equivalente. La falta de datos no representa ausencia de actividad.';
 const goli='<div class="progress-dots">'+GO.map(([letter,label,tab])=>'<div class="goli-dot"><a href="#'+tab+'" data-target="'+tab+'"><b>'+letter+'</b><span>'+esc(label)+'</span></a></div>').join('')+'</div>';
 return main+'<div class="deck">'+panel('Lectura del panorama','<p>'+esc(explanation)+'</p><div class="insight">BALAM conserva la unidad analítica: persona, episodio, acción asistencial, acción operativa, registro capturado y población proyectada no son equivalentes.</div><div class="actions">'+navigationLink('atenciones','Atenciones')+navigationLink('areas','Áreas SIESA')+'</div>',cut())+panel('Áreas de captura',hasSiesa()?metricBars(modules().filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,6),'capturas'):aggregateNotAvailable(),'SIESA · fuente publicada')+'</div>'+panel('GOLIPCA · siete ejes de gestión','<p>Conservamos la organización del visor original con acceso separado a los siete componentes. Cifras solo si cuentan con una fuente pública verificable.</p>'+goli,'G · O · L · I · P · C · A');
}
function atenciones(){
 if(!hasSiesa())return aggregateNotAvailable();
 const h=state.municipality==='all';
 const rows=h?[['Casos / atenciones',operating().cases_or_attentions,'Eventos del operativo, no personas'],['Acciones asistenciales',operating().healthcare_actions,'Atención directa del operativo'],['Filas canónicas disponibles',canonicalTotal(),'Registro administrativo SIESA'],['Personas únicas',null,'No disponible en corte público']]:
 [['Filas canónicas',row()?.canonical_rows,'Módulos publicados; no personas'],['Unidades de captura acumuladas',row()?.attention_case_units_accumulated,'Campo fuente; no convertir a casos'],['Capturas de atención médica',row()?.modules.atencion_medica,'Conteos del módulo, no consultas'],['Personas únicas',null,'No disponible en corte público']];
 return metricKpis(rows)+'<div class="deck">'+panel('Interpretación clínica',note('La base pública no contiene denominadores de personas únicas. No se calculan tasas de incidencia ni se equiparan filas de captura con pacientes.')+'<div class="actions">'+navigationLink('areas','Revisar módulos')+'</div>')+panel('Municipios con registros',metricBars(state.ds05.municipalities.map(m=>({label:m.name,value:m.canonical_rows})),'filas'),'DS05 · 2026-10-12')+'</div>';
}
function acciones(){
 if(!hasSiesa())return aggregateNotAvailable();
 const rows=state.municipality==='all'?[['Acciones operativas discretas',operating().discrete_operational_actions,'Operativo DS05'],['Acciones asistenciales',operating().healthcare_actions,'Operativo DS05'],['Letrinas encaladas',state.ds05.cecosabi?.latrines_limed_total,'CECOSABI · otra fuente']]:
 [['Registros por módulo',sum(modules().map(m=>m.value)),'SIESA · municipio'],['Seguimiento por desastre',row()?.modules.seguimiento_localidad_desastre,'Registros de captura']];
 return metricKpis(rows)+'<div class="deck">'+panel('Distribución por módulo',metricBars(modules().sort((a,b)=>b.value-a.value),'capturas'),'Conteos no aditivos con operativo')+panel('Precaución metodológica',note('No sumar el saneamiento CECOSABI a las acciones SIESA ni interpretar las capturas de módulos como intervenciones discretas. Diferentes fuentes y unidades.')+'<div class="actions">'+navigationLink('cecosabi','Revisar saneamiento')+'</div>')+'</div>';
}
function areas(){if(!hasSiesa())return aggregateNotAvailable();const m=modules();return metricKpis([['Áreas con captura',m.filter(x=>x.value>0).length,'Módulos registrados'],['Filas canónicas',canonicalTotal(),'Almacén público']])+'<div class="deck">'+panel('Comparación de módulos',metricBars(m.sort((a,b)=>b.value-a.value),'capturas'))+panel('Glosario y calidad',note('Los valores son capturas de módulos del corte público. No son necesariamente personas distintas ni se suman a un total asistencial. La métrica de cada área debe verificarse contra su formato de origen.'))+'</div>';}
function paquetes(){if(!hasSiesa())return aggregateNotAvailable();return panel('Paquetes de captura SIESA','<p>La versión de escritorio conserva los nombres de los paquetes, pero muestra exclusivamente su numeralia agregada autorizada.</p><div class="package-grid">'+modules().map(x=>'<div class="package"><b>'+esc(x.label)+'</b><span>'+fmt(x.value)+' registros del módulo</span></div>').join('')+'</div>','SIESA · DS05');}
function tiempo(){return metricKpis([['Corte operativo',null,hasSiesa()?state.ds05.cut:'No publicado'],['Población proyectada',currentPopulation(),'CONAPO · 2026']])+panel('Línea temporal documentada','<div class="timeline"><div><b>Octubre 2026</b><small>Operativo SIESA DS05, único corte disponible en la versión pública.</small></div><div><b>'+esc(hasSiesa()?state.ds05.cut:'Sin corte')+'</b><small>Fecha registrada para el agregado seleccionado.</small></div></div>'+note('No se genera una curva diaria ni variaciones históricas cuando la fuente publicada no proporciona filas de tiempo comparables.'));}
function cruces(){
 const rows=(district()?.municipalities||[]).map(m=>{const code='26'+m,match=state.ds05?.municipalities?.find(x=>x.cvegeo===code);return {code,name:munName(code),population:state.conapo?.items.get(code)?.trend[11],records:hasSiesa()?match?.canonical_rows:null}});
 return panel('Cruce territorial · población y capturas','<p>Los denominadores CONAPO proceden de una proyección; las filas SIESA no son episodios incidentes. No se presenta una tasa epidemiológica sin numerador compatible.</p>'+table(rows,['Municipio','Población proyectada 2026','Filas SIESA'],x=>[x.name,fmt(x.population),fmt(x.records)]),'CONAPO · SIESA');
}
function table(rows,head,fn){return '<div class="data-table-wrap"><table class="data-table"><thead><tr>'+head.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(x=>'<tr>'+fn(x).map((v,i)=>'<td'+(i?' class="num"':'')+'>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function auditor(){return panel('Centro de carga · protegido',note('La carga, el cotejo nominal, la detección de conflictos y la exportación operativa permanecen únicamente en el archivo de escritorio local que se entrega por separado. No es seguro publicar en GitHub la versión original, pues contiene registros con nombres.',true)+'<p>Esta página no transmite ni almacena archivos operativos. Para trabajar con bases completas, abre el HTML local autorizado en tu computadora.</p>','No disponible en GitHub');}
function golipca(tab){
 if(tab==='logistica')return panel('L · Logística',note('No existe todavía un catálogo logístico autorizado y normalizado para alimentar esta sección pública. Los recursos, traslados, insumos y órdenes se mantienen fuera de GitHub hasta establecer roles y fuente validada.',true),'Pendiente');
 if(!hasSiesa())return aggregateNotAvailable();
 const op=operating(),ce=state.ds05.cecosabi;
 const area=modules(),field=k=>area.find(x=>x.key===k)?.value??0;
 if(tab==='gerencia')return metricKpis([['Municipios del distrito',district()?.municipalities?.length,'Regionalización'],['Filas SIESA disponibles',canonicalTotal(),'Registros no personas'],['Población 2026',currentPopulation(),'CONAPO · proyección']])+
 panel('G · Dirección y Rectoría','<p>Lectura de gestión con límites explícitos entre población, acción y capturas SIESA.</p>'+note('Los totales del operativo solo corresponden al corte distrital DS05 y no se asignan por municipio automáticamente.')+navigationLink('panorama','Abrir panorama'));
 if(tab==='operacion')return acciones();
 if(tab==='inteligencia')return panel('I · Inteligencia en Salud','<p>Las capturas de vigilancia, vectores y riesgos sanitarios constituyen un insumo operativo, no casos confirmados.</p>'+metricBars([['Vigilancia epidemiológica',field('vigilancia_epidemiologica')],['Vectores',field('vectores')],['Riesgos sanitarios',field('riesgos_sanitarios')]].map(([label,value])=>({label,value})),'registros'),'SIESA · capturas');
 if(tab==='programas')return panel('P · Programas',metricBars([['Promoción de la salud',field('promocion_salud')],['Vacunación',field('vacunacion')]].map(([label,value])=>({label,value})),'capturas')+note('No equivale a cobertura de población objetivo; se requiere un denominador y una definición programática validada.'),'SIESA · módulos');
 if(tab==='cecosabi'){
  const rows=ce?.rows||[];return metricKpis([['Letrinas encaladas',ce?.latrines_limed_total,'Saneamiento · '+(ce?.cut||'')],['Registros de localidad',rows.length,'Filas documentadas'],['Última variación',ce?.latest_delta,'Dato de la fuente']])+
  panel('C · CECOSABI · saneamiento',metricBars(rows.slice().sort((a,b)=>b.letrinasEncaladas-a.letrinasEncaladas).map(x=>({label:x.localidad,value:x.letrinasEncaladas})),'letrinas')+note('Las filas no se asignan automáticamente a un municipio sin una llave territorial inequívoca.'),'Corte '+(ce?.cut||''));
 }
 if(tab==='administracion')return metricKpis([['Filas canónicas',canonicalTotal(),'SIESA · almacenadas'],['Instantáneas no canónicas',state.municipality==='all'?op.uncanonical_siesa_snapshots:null,'No se suman como filas únicas']])+
 panel('A · Administración','<p>Control de calidad, usuarios, auditorías y autorizaciones permanecen en la versión local protegida. Esta página solo publica agregados disponibles.</p>'+note('La ausencia de captura o el estado pendiente no deben interpretarse como cero actividad.') );
 return '';
}
function muestras(){return panel('Muestras EBT · consulta protegida',note('La versión original incorpora información de muestreo cuyo origen debe validarse antes de publicar agregados. Este visor de GitHub no incluye archivos nominales, folios ni posibles identificadores de pacientes.',true)+'<p>Consulta el HTML local del visor operativo para trabajar con la información validada y sus fuentes.</p>','Sin publicación autorizada');}
function mapa(){return panel('Mapa territorial BALAM','<p>El mapa público de BALAM contiene los distritos de Sonora, municipios, capas de AGEB, CONAPO y herramientas territoriales.</p><div class="actions"><a class="action" href="../">🗺️ Abrir MAPA BALAM ↗</a><a class="action secondary" href="../visor/">📱 Ir a BALAM WebApp ↗</a></div>','Enlace al producto cartográfico');}
function lineChart(values,labels,title,color='#138875'){
 const max=Math.max(1,...values);
 const points=values.map((v,i)=>(35+i*590/(values.length-1)).toFixed(1)+','+(214-v/max*185).toFixed(1)).join(' ');
 return '<h3 style="margin-bottom:12px">'+esc(title)+'</h3><svg class="chart" viewBox="0 0 665 260" role="img" aria-label="'+esc(title)+'"><line x1="35" y1="214" x2="625" y2="214" stroke="#c6e1d4"/><polyline fill="none" stroke="'+color+'" stroke-width="4" stroke-linejoin="round" points="'+points+'"/>'+labels.map((l,i)=>i%3===0||i===labels.length-1?'<text class="line-label" x="'+(35+i*590/(labels.length-1)).toFixed(1)+'" y="234" text-anchor="middle">'+esc(l)+'</text>':'').join('')+'</svg>';
}
function graficos(){
 if(!state.conapo)return note('Base demográfica no disponible',true);
 const code=state.municipality==='all'?(district()?.municipalities||[]).map(m=>'26'+m):[state.municipality];
 const series=state.conapo.doc.years.map((_,i)=>sum(code.map(c=>state.conapo.items.get(c)?.trend[i]||0)));
 const dem=panel('Curva poblacional CONAPO 2015–2030',lineChart(series,state.conapo.doc.years,'Población proyectada · '+scope())+note('Proyecciones oficiales, no conteos censales. El año 2026 corresponde al índice de referencia.'),'16 años');
 const sels=state.municipality==='all'?state.conapo.items.get('26'+(district()?.municipalities||[])[0]):state.conapo.items.get(state.municipality);
 const sex=sels?panel('Estructura demográfica por sexo',lineChart(sels.male,state.conapo.doc.ageGroups,'Hombres · bandas de edad','#3295a0')+lineChart(sels.female,state.conapo.doc.ageGroups,'Mujeres · bandas de edad','#d27999')+'<p>Curvas del primer municipio disponible o municipio seleccionado; cifras proyectadas 2026.</p>','CONAPO 2026'):'';
 const siesa=hasSiesa()?panel('Áreas SIESA',metricBars(modules().sort((a,b)=>b.value-a.value),'capturas'),'DS05'):aggregateNotAvailable();
 return '<div class="deck">'+dem+sex+'</div>'+siesa;
}
function tablas(){return cruces()+ (hasSiesa()?panel('Registros municipales DS05',table(state.ds05.municipalities,['Municipio','Filas canónicas','Capturas acumuladas','Localidades documentadas'],m=>[m.name,fmt(m.canonical_rows),fmt(m.attention_case_units_accumulated),fmt(m.documented_localities)]),'Almacén público SIESA'):'');}
const ROUTES={panorama,atenciones,acciones,areas,paquetes,tiempo,cruces,auditor,gerencia:()=>golipca('gerencia'),operacion:()=>golipca('operacion'),logistica:()=>golipca('logistica'),inteligencia:()=>golipca('inteligencia'),programas:()=>golipca('programas'),cecosabi:()=>golipca('cecosabi'),administracion:()=>golipca('administracion'),muestras,mapa,graficos,tablas};
function render(){
 if(!state.ready)return;
 try{$('content').innerHTML=ROUTES[state.tab]();$('loadStatus').textContent='Ámbito: '+scope()+' · '+cut()+' · Solo datos públicos agregados.';}
 catch(e){$('content').innerHTML=note('Este módulo no pudo renderizarse. '+esc(e.message||e),true);}
}
function selectTab(tab,hash=true){
 if(!TABS[tab])return;
 state.tab=tab;
 $('pageTitle').textContent=TABS[tab][0];$('pageDescription').textContent=TABS[tab][1];
 document.querySelectorAll('#classicNav [data-tab]').forEach(btn=>{const selected=btn.dataset.tab===tab;btn.classList.toggle('active',selected);btn.setAttribute('aria-current',selected?'page':'false')});
 if(hash)history.replaceState(null,'','#'+tab);
 render();closeMenu();window.scrollTo({top:0,behavior:'instant'});
}
function populateDistricts(){
 const sel=$('district');sel.replaceChildren();
 for(const d of state.districts.districts)sel.add(new Option(d.id+' · '+d.head,d.id));
 sel.value=state.district;
}
function populateMunicipalities(){
 const d=district();const sel=$('municipality');sel.replaceChildren();
 sel.add(new Option('Todos los municipios','all'));
 for(const mun of d?.municipalities||[]){const code='26'+mun;sel.add(new Option(munName(code),code));}
 if(state.municipality!=='all'&&!(d?.municipalities||[]).some(x=>'26'+x===state.municipality))state.municipality='all';
 sel.value=state.municipality;
}
function closeMenu(){$('sidebar').classList.remove('show');$('backdrop').hidden=true}
$('openMenu').addEventListener('click',()=>{$('sidebar').classList.add('show');$('backdrop').hidden=false});
$('backdrop').addEventListener('click',closeMenu);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
document.querySelectorAll('#classicNav [data-tab]').forEach(btn=>btn.addEventListener('click',()=>selectTab(btn.dataset.tab)));
$('content').addEventListener('click',e=>{const btn=e.target.closest('[data-target]');if(btn){e.preventDefault();selectTab(btn.dataset.target)}});
$('district').addEventListener('change',e=>{state.district=e.target.value;state.municipality='all';populateMunicipalities();render()});
$('municipality').addEventListener('change',e=>{state.municipality=e.target.value;render()});
window.addEventListener('hashchange',()=>selectTab(location.hash.slice(1),false));
async function start(){
 try{
  const [districts,ds05,conapo]=await Promise.all([readJson('../data/districts.json'),readJson('../data/ds05_metrics.json'),readConapo()]);
  if(districts.districts?.length!==6||ds05.municipalities?.length!==5)throw Error('Cobertura pública no válida');
  state.districts=districts;state.ds05=ds05;state.conapo=conapo;state.ready=true;
  populateDistricts();populateMunicipalities();
  selectTab(TABS[location.hash.slice(1)]?location.hash.slice(1):'panorama',false);
  readJson('../data/smn/sonora_latest.json').then(data=>{if(Array.isArray(data.municipalities)){state.names=new Map(data.municipalities.filter(x=>x.code&&x.name).map(x=>[x.code,x.name]));populateMunicipalities();render()}}).catch(()=>{});
 }catch(e){$('loadStatus').textContent='Error al cargar las fuentes públicas: '+String(e.message||e);$('content').innerHTML=note('No se encontraron fuentes disponibles. Conéctate a internet e intenta recargar. No se presentan ceros ni estimaciones inventadas.',true);}
}
start();
})();