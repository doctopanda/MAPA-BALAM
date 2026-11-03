/* BALAM VISOR v6: lector de agregados públicos. Nada nominal ni credenciales. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const VIEW_KEY='balam-visor-view-preference-v1';
const compactMedia=typeof window.matchMedia==='function'?window.matchMedia('(max-width: 699px)'):null;
let viewPreference=null;
try{
 const stored=window.localStorage?.getItem(VIEW_KEY);
 if(stored==='mobile'||stored==='desktop')viewPreference=stored;
}catch(_){}
function activeView(){return viewPreference||((compactMedia?.matches??true)?'mobile':'desktop')}
function updateView(){
 const mode=activeView();
 document.body.dataset.layout=mode;
 const toggle=document.getElementById('viewToggle');
 toggle.setAttribute('aria-pressed',String(mode==='desktop'));
 toggle.setAttribute('aria-label',mode==='desktop'?'Cambiar a vista móvil':'Cambiar a vista de escritorio');
 toggle.setAttribute('title',mode==='desktop'?'Cambiar a vista móvil':'Cambiar a vista de escritorio');
 $('viewToggleIcon').textContent=mode==='desktop'?'📱':'💻';
 $('viewToggleText').textContent=mode==='desktop'?'Vista móvil':'Vista escritorio';
 $('viewHint').hidden=!(mode==='desktop'&&(compactMedia?.matches??false));
}
function toggleView(){
 viewPreference=activeView()==='mobile'?'desktop':'mobile';
 try{window.localStorage?.setItem(VIEW_KEY,viewPreference)}catch(_){}
 updateView();
}

const fmt=n=>Number.isFinite(n)?Math.round(n).toLocaleString('es-MX'):'Sin dato';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={districts:null,ds05:null,conapo:null,names:new Map(),loaded:false,district:'DS05',municipality:'26042',siesaMunicipality:'26042',goli:'G',screen:'home'};
const headings={home:['Panorama general','Lectura operativa y demográfica con procedencia explícita.'],indicators:['SIESA · Indicadores','Atenciones, acciones y módulos del corte público.'],golipca:['GOLIPCA','Siete ejes de gestión articulados desde datos verificables.'],modules:['Módulos BALAM','Explora las herramientas y su disponibilidad.'],territory:['Territorio y población','Proyecciones CONAPO 2015–2030 por municipio.'],sources:['Fuentes y trazabilidad','Origen, límites y controles de interpretación.']};
const srcData={districts:'../data/districts.json',siesa:'../data/ds05_metrics.json',conapo:'../data/conapo/sonora_municipios_2015_2030.b64'};
const fail=e=>{$('warning').hidden=false;$('warning').textContent='No se pudieron cargar todos los datos: '+String(e.message||e)+'. Intenta actualizar. No se muestran cifras aproximadas.'};
async function getJson(url){
 const res=await fetch(url,{cache:'no-store'});
 if(!res.ok)throw Error('HTTP '+res.status+' · '+url);
 return res.json();
}
async function getConapo(){
 if(!('DecompressionStream' in window))throw Error('Este navegador no admite descompresión CONAPO. Usa Safari/Chrome actualizado.');
 const res=await fetch(srcData.conapo,{cache:'no-store'});if(!res.ok)throw Error('CONAPO HTTP '+res.status);
 const encoded=(await res.text()).trim(),bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
 const doc=JSON.parse(await new Response(stream).text());
 if(doc.schema!=='balam-conapo-municipal-v1'||doc.profiles?.length!==72||doc.ageGroups?.length!==14||doc.years?.length!==16)throw Error('CONAPO: esquema incompatible');
 const map=new Map();
 for(const row of doc.profiles){
  const [code,trend,male,female]=row;
  if(!/^26\d{3}$/.test(code)||trend?.length!==16||male?.length!==14||female?.length!==14||
     ![...trend,...male,...female].every(Number.isSafeInteger)||
     trend[11]!==male.reduce((a,v)=>a+v,0)+female.reduce((a,v)=>a+v,0))throw Error('CONAPO: datos inconsistentes para '+code);
  map.set(code,{trend,male,female});
 }
 return {doc,map};
}
const cell=(label,n,source)=>'<div class="kpi"><span>'+esc(label)+'</span><strong>'+fmt(n)+'</strong><small>'+esc(source)+'</small></div>';
const noData='<div class="sheet"><h2>Sin corte operativo publicado</h2><p>Este distrito tiene cartografía y población CONAPO, pero no dispone de un corte SIESA público normalizado en el repositorio. No es cero actividad.</p></div>';
function districtObj(){return state.districts?.districts?.find(x=>x.id===state.district)}
function isDS05(){return state.district==='DS05'&&!!state.ds05}
function populateDistricts(){
 const select=$('district');select.replaceChildren();
 for(const d of state.districts.districts){const o=new Option(d.id+' · '+d.head,d.id);select.add(o)}
 select.value=state.district;
}
function populationDistrict(){
 const codes=districtObj()?.municipalities||[];
 return state.conapo?codes.reduce((sum,m)=>sum+(state.conapo.map.get('26'+m)?.trend[11]||0),0):null;
}
function renderHome(){
 const district=districtObj(),s=state.ds05?.current_filter;
 $('cut').textContent=isDS05()?'SIESA · corte '+state.ds05.cut+' · '+s.operative:'CONAPO · 2026 · SIESA: sin corte municipal publicado';
 const rows=[
  cell('Población proyectada 2026',populationDistrict(),'CONAPO · '+state.district),
  cell('Municipios del distrito',district?.municipalities?.length,'Regionalización BALAM')
 ];
 if(isDS05())rows.push(cell('Casos / atenciones documentadas',s.cases_or_attentions,'SIESA · no personas únicas'),cell('Acciones asistenciales',s.healthcare_actions,'SIESA · corte '+state.ds05.cut),cell('Acciones operativas discretas',s.discrete_operational_actions,'SIESA · corte '+state.ds05.cut),cell('Localidades del operativo',s.localities,'SIESA · corte '+state.ds05.cut));
 $('kpis').innerHTML=rows.join('');
 $('overviewText').textContent=isDS05()?'El distrito '+state.district+' dispone de un corte operativo público documentado. Los conteos de acciones, atenciones y localidades pertenecen a universos diferentes. Para cambiar de distrito, utiliza el selector superior.':'El distrito '+state.district+' cuenta con proyecciones demográficas CONAPO, pero los indicadores operativos de SIESA permanecen sin corte público normalizado. La ausencia de captura no equivale a cero.';
 const url=new URL('../',location.href);url.searchParams.set('ds',state.district);$('quickMap').href=url.href;
}
function bar(label,value,max,unit){
 if(!Number.isFinite(value))return '';
 const ratio=max>0?100*value/max:0;
 return '<div class="bar-row"><div class="bar-head"><span>'+esc(label)+'</span><b>'+fmt(value)+' '+esc(unit||'')+'</b></div><div class="track"><i style="width:'+ratio.toFixed(2)+'%"></i></div></div>';
}
function renderIndicators(){
 const s=state.ds05?.current_filter;
 $('indicatorCut').textContent=isDS05()?'SIESA · '+state.ds05.cut:'Sin corte';
 if(!isDS05()){$('indicatorBars').innerHTML=noData;$('municipalityBars').innerHTML='';return}
 const metrics=[['Acciones operativas discretas',s.discrete_operational_actions],['Acciones asistenciales',s.healthcare_actions],['Casos / atenciones',s.cases_or_attentions]];
 const max=Math.max(...metrics.map(x=>x[1]));
 $('indicatorBars').innerHTML=metrics.map(([a,b])=>bar(a,b,max,'')).join('');
 const mun=state.ds05.municipalities;
 const mx=Math.max(1,...mun.map(x=>x.canonical_rows));
 $('municipalityBars').innerHTML=mun.map(x=>bar(x.name,x.canonical_rows,mx,'filas')).join('');
}
const polyline=(values,x0,y0,w,h,max)=>{
 return values.map((v,i)=>[x0+w*i/(values.length-1),y0+h-(v/max)*h].map(v=>v.toFixed(1)).join(',')).join(' ');
};
function lineChart(series,years,colors,title,unit){
 const max=Math.max(1,...series.flatMap(s=>s.values));
 const paths=series.map((s,i)=>'<polyline fill="none" stroke="'+colors[i]+'" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="'+polyline(s.values,28,15,300,100,max)+'"/>').join('');
 const label=years.map((y,i)=>(i%5===0||i===years.length-1)?'<text x="'+(28+300*i/(years.length-1)).toFixed(0)+'" y="135" font-size="10" text-anchor="middle" fill="#688278">'+esc(y)+'</text>':'').join('');
 return '<h3 class="viz-title">'+esc(title)+'</h3><svg class="linechart" viewBox="0 0 350 150" role="img" aria-label="'+esc(title)+'"><line x1="28" y1="115" x2="328" y2="115" stroke="#bfd9cc"/><line x1="28" y1="15" x2="28" y2="115" stroke="#bfd9cc"/>'+paths+label+'<text x="4" y="13" font-size="9" fill="#54766a">'+fmt(max)+'</text></svg><div class="chart-legend">'+series.map((s,i)=>'<span style="color:'+colors[i]+'">● '+esc(s.name)+'</span>').join('')+'</div><p class="foot">'+esc(unit)+'</p>';
}
function pyramid(male,female,ages){
 const max=Math.max(1,...male,...female);
 return '<h3 class="viz-title">Pirámide de población por sexo y edad · 2026</h3><div class="chart-legend"><span class="male">● Hombres</span><span class="female">● Mujeres</span></div><div class="pyramid">'+ages.map((age,i)=>'<div class="pyr"><div class="left" title="Hombres: '+fmt(male[i])+'"><i style="width:'+(100*male[i]/max).toFixed(2)+'%"></i></div><span>'+esc(age)+'</span><div class="right" title="Mujeres: '+fmt(female[i])+'"><i style="width:'+(100*female[i]/max).toFixed(2)+'%"></i></div></div>').join('')+'</div>';
}
function municipalityList(){
 const d=districtObj(),names=new Map(state.ds05?.municipalities?.map(m=>[m.cvegeo,m.name])||[]);
 const select=$('municipality');select.replaceChildren();
 for(const code of (d?.municipalities||[])){
  const id='26'+code;const possible=state.names.get(id);
  const label=names.get(id)||possible||'Municipio '+id;
  select.add(new Option(label+' · '+id,id));
 }
 if(!(d?.municipalities||[]).some(m=>'26'+m===state.municipality))state.municipality='26'+(d.municipalities[0]||'001');
 select.value=state.municipality;
}
function renderTerritory(){
 municipalityList();
 const doc=state.conapo?.doc,row=state.conapo?.map.get(state.municipality);
 const code=state.municipality,year=2026,idx=11;
 const url=new URL('../',location.href);url.searchParams.set('ds',state.district);$('mapMunicipality').href=url.href;
 if(!row){$('municipalKpis').innerHTML=cell('Población CONAPO',null,'Sin fuente');$('municipalCharts').innerHTML='<p>Sin proyección disponible.</p>';return}
 const male=row.male.reduce((a,b)=>a+b,0),female=row.female.reduce((a,b)=>a+b,0);
 $('municipalKpis').innerHTML=cell('Población '+year,row.trend[idx],'CONAPO · proyección')+cell('Mujeres',female,'CONAPO 2026')+cell('Hombres',male,'CONAPO 2026')+cell('Variación 2015–2030',row.trend[15]-row.trend[0],'Personas · proyección');
 $('municipalCharts').innerHTML=lineChart([{name:'Total',values:row.trend}],doc.years,['#318775'],'Evolución anual 2015–2030','Proyección municipal, no censo')+
 lineChart([{name:'Hombres',values:row.male},{name:'Mujeres',values:row.female}],doc.ageGroups,['#438c98','#be7699'],'Curva por grupos de edad y sexo · 2026','Grupos quinquenales de la fuente')+
 pyramid(row.male,row.female,doc.ageGroups)+
 '<p class="note">Fuente CONAPO municipal aportada al proyecto. La población de 2026 es una proyección, no el Censo 2020. El último grupo de edad puede ser abierto.</p>';
}
function renderSources(){
 $('sourcesList').innerHTML='<div class="source-item"><b>Proyecciones CONAPO municipales</b><small>2015–2030 · población total, sexo y 14 grupos de edad de 2026. 72 municipios. Archivo aportado al proyecto.</small></div>'+
 '<div class="source-item"><b>Regionalización de distritos BALAM</b><small>72 municipios agrupados en seis distritos de salud. Fuente: data/districts.json.</small></div>'+
 '<div class="source-item"><b>SIESA · operativo OSS HURACÁN POLO DS05</b><small>Último corte publicado '+esc(state.ds05?.cut||'sin fecha')+'. Fuente: data/ds05_metrics.json. No extrapolar a otros distritos.</small></div>'+
 '<div class="source-item"><b>Mapa territorial</b><small>Polígonos y capas publicados en MAPA-BALAM. La ficha pública del visor no contiene información personal.</small></div>';
}
const GOLI=[
{id:'G',name:'Gerencia y Rectoría',brief:'Lectura de mando: actividad publicada, alcance territorial y límites del corte operativo.',source:'SIESA · corte operativo publicado',fields:[['Casos / atenciones','cases_or_attentions'],['Acciones asistenciales','healthcare_actions'],['Acciones operativas','discrete_operational_actions']]},
{id:'O',name:'Operaciones',brief:'Acciones de campo y localidades documentadas. Las cifras de operación no equivalen a personas atendidas.',source:'SIESA · corte operativo publicado',fields:[['Acciones operativas','discrete_operational_actions'],['Localidades documentadas','localities']]},
{id:'L',name:'Logística',brief:'Recursos, traslados, insumos y abastecimiento. Requiere corte logístico normalizado, no se infiere a partir de actuaciones clínicas.',source:'Fuente logística aún no conectada',fields:[]},
{id:'I',name:'Inteligencia en Salud',brief:'Vigilancia epidemiológica por capturas canónicas y contexto demográfico. Los registros no representan casos confirmados.',source:'SIESA · módulos territoriales del corte público',fields:[]},
{id:'P',name:'Programas',brief:'Promoción, vacunación y actividades de programas. No se presentan coberturas sin población objetivo y denominador compatibles.',source:'SIESA · módulos territoriales del corte público',fields:[]},
{id:'C',name:'CECOSABI',brief:'Saneamiento y seguimiento territorial documentado. Sin atribución municipal automática cuando no existe llave geográfica válida.',source:'CECOSABI · archivo público de saneamiento',fields:[]},
{id:'A',name:'Administración',brief:'Registro, auditoría, calidad de captura, permisos y recursos. Los expedientes y la administración protegida no se exponen en GitHub.',source:'Corte de captura SIESA; auditoría autenticada pendiente',fields:[]}
];
const MODS=[
{id:'golipca',glyph:'◉',title:'GOLIPCA',desc:'Gestión integral en siete ejes',state:'público'},
{id:'indicators',glyph:'▥',title:'SIESA',desc:'Indicadores y módulos capturados',state:'corte DS05'},
{id:'territory',glyph:'⌖',title:'CONAPO',desc:'Demografía, edad y sexo',state:'72 municipios'},
{id:'map',glyph:'▧',title:'MAPA BALAM',desc:'Polígonos, AGEB y herramientas',state:'publicado'},
{id:'crum',glyph:'✚',title:'CRUM',desc:'Inventario con acceso autenticado',state:'restringido'},
{id:'cecosabi',glyph:'⚗',title:'CECOSABI',desc:'Saneamiento territorial disponible',state:'corte DS05',goli:'C'},
{id:'intel',glyph:'◎',title:'INTELIGENCIA',desc:'Vigilancia y análisis epidemiológico',state:'parcial',goli:'I'},
{id:'sources',glyph:'◈',title:'FUENTES',desc:'Fechas y reglas de trazabilidad',state:'público'},
{id:'laboratory',glyph:'◌',title:'MUESTRAS EBT',desc:'Nominales y resultados no publicados',state:'protegido'}
];
const PUBLIC_SIESA_MODULES=[
['atencion_medica','Atención médica'],['enfermeria','Enfermería'],
['promocion_salud','Promoción de la salud'],['vigilancia_epidemiologica','Vigilancia epidemiológica'],
['vacunacion','Vacunación'],['vectores','Vectores'],['riesgos_sanitarios','Riesgos sanitarios'],
['salud_mental','Salud mental'],['seguimiento_localidad_desastre','Seguimiento por desastre']
];
const totalModule=key=>(state.ds05?.municipalities||[]).reduce((acc,m)=>acc+(Number(m.modules?.[key])||0),0);
function metricTile(label,value,source){return cell(label,value,source)}
function activeSource(){return isDS05()&&!!state.ds05?.current_filter}
function moduleSums(){return PUBLIC_SIESA_MODULES.map(([key,label])=>({key,label,value:totalModule(key)}))}
function actionLink(tab,label){return '<button class="text-button" type="button" data-go="'+esc(tab)+'">'+esc(label||'Ver detalle')+' ↗</button>'}
function renderHomeExtras(){
 const s=state.ds05?.current_filter, ds=state.district;
 const pop=populationDistrict();
 $('homeInsights').innerHTML=
  '<div class="insight-item"><b>Distrito activo</b><span>'+esc(ds+' · '+(districtObj()?.head||''))+'</span></div>'+
  '<div class="insight-item"><b>Demografía</b><span>CONAPO 2026 · '+fmt(pop)+' habitantes proyectados</span></div>'+
  '<div class="insight-item"><b>Operación</b><span>'+(activeSource()?'SIESA '+esc(state.ds05.cut)+' · operativo específico':'Sin corte SIESA publicado; no significa cero actividad')+'</span></div>'+
  '<div class="insight-item"><b>Consulta</b><span>Datos agregados · sin expedientes personales</span></div>';
 if(!activeSource()){
  $('homeOperations').innerHTML='<p class="empty-state">El distrito no tiene un corte SIESA público comparable. Puedes explorar su población y territorio.</p>';
 }else{
  const sums=moduleSums().sort((a,b)=>b.value-a.value);
  const mx=Math.max(1,...sums.map(x=>x.value));
  $('homeOperations').innerHTML=sums.slice(0,5).map(x=>bar(x.label,x.value,mx,'capturas')).join('')+
   '<p class="note">Registros por módulo, no personas únicas ni acciones discretas. Corte '+esc(state.ds05.cut)+'.</p>';
 }
 const ids=[['G','Gerencia'],['O','Operaciones'],['L','Logística'],['I','Inteligencia'],['P','Programas'],['C','CECOSABI'],['A','Administración']];
 $('homeGolipca').innerHTML=ids.map(([id,label])=>'<button type="button" data-goli="'+id+'" class="goli-pill"><b>'+id+'</b><span>'+esc(label)+'</span></button>').join('');
}
function renderSiesaArea(){
 const selector=$('siesaMunicipality'),all=state.ds05?.municipalities||[];
 const prev=state.siesaMunicipality;
 selector.replaceChildren(new Option('Todos los municipios DS05','ALL'));
 for(const m of all)selector.add(new Option(m.name,m.cvegeo));
 if(prev!=='ALL'&&!all.some(x=>x.cvegeo===prev))state.siesaMunicipality='ALL';
 selector.value=state.siesaMunicipality;
 if(!activeSource()){
  selector.disabled=true;
  $('siesaAreaKpis').innerHTML='';
  $('siesaAreaBars').innerHTML='<p class="empty-state">Sin datos SIESA por municipio para este distrito.</p>';
  return;
 }
 selector.disabled=false;
 const mun=all.find(x=>x.cvegeo===state.siesaMunicipality),mods=PUBLIC_SIESA_MODULES.map(([key,label])=>({label,value:mun?(Number(mun.modules?.[key])||0):totalModule(key)}));
 const cap=mun?mun.canonical_rows:all.reduce((n,x)=>n+x.canonical_rows,0);
 const loc=mun?mun.documented_localities:null;
 $('siesaAreaKpis').innerHTML=metricTile('Filas canónicas',cap,'Almacén público SIESA')+
  metricTile('Áreas de captura',mods.filter(x=>x.value>0).length,'Módulos con registros')+
  metricTile('Localidades documentadas',loc,'No sumar entre municipios')+
  metricTile('Módulos presentes',mods.filter(x=>x.value>0).length,'SIESA · '+state.ds05.cut);
 const max=Math.max(1,...mods.map(x=>x.value));
 $('siesaAreaBars').innerHTML=mods.sort((a,b)=>b.value-a.value).map(x=>bar(x.label,x.value,max,'registros')).join('');
}
function renderGolipca(){
 const g=GOLI.find(x=>x.id===state.goli)||GOLI[0];
 $('goliSelector').innerHTML=GOLI.map(x=>'<button type="button" data-goli="'+x.id+'" class="'+(g.id===x.id?'active':'')+'" aria-pressed="'+(g.id===x.id)+'"><b>'+x.id+'</b><small>'+esc(x.name)+'</small></button>').join('');
 $('goliTitle').textContent=g.id+' · '+g.name;
 $('goliDescription').textContent=g.brief;
 const avail=activeSource();
 $('goliKpis').innerHTML='';$('goliBars').innerHTML='';
 $('goliStatus').textContent=avail&&g.id!=='L'?'DS05 · '+state.ds05.cut:'Sin corte específico';
 $('goliSource').textContent='Procedencia: '+g.source+'. '+(avail?'Corte territorial DS05, 12/10/2026.':'No extrapolar cifras SIESA a este distrito.');
 if(!avail){$('goliBars').innerHTML='<p class="empty-state">No hay corte público para este distrito y eje. GOLIPCA conserva su estructura, pero no genera datos artificiales.</p>';return}
 const s=state.ds05.current_filter,ce=state.ds05.cecosabi;
 if(g.fields.length){$('goliKpis').innerHTML=g.fields.map(([label,key])=>metricTile(label,s[key],'SIESA · DS05')).join('')}
 if(g.id==='I'||g.id==='P'){
  const keys=g.id==='I'?['vigilancia_epidemiologica','vectores','riesgos_sanitarios']:['promocion_salud','vacunacion'];
  const v=keys.map(key=>({label:PUBLIC_SIESA_MODULES.find(x=>x[0]===key)[1],value:totalModule(key)})),mx=Math.max(1,...v.map(x=>x.value));
  $('goliKpis').innerHTML=metricTile('Registros en módulos',v.reduce((a,b)=>a+b.value,0),'Suma de capturas, no personas')+
  metricTile('Municipios con datos',state.ds05.municipalities.filter(m=>keys.some(k=>m.modules?.[k]>0)).length,'SIESA · DS05');
  $('goliBars').innerHTML=v.map(x=>bar(x.label,x.value,mx,'registros')).join('');
 }else if(g.id==='C'){
  const rows=ce?.rows||[];
  $('goliKpis').innerHTML=metricTile('Letrinas encaladas',ce?.latrines_limed_total,'CECOSABI · '+(ce?.cut||''))+
   metricTile('Registros de localidades',rows.length,'Sin atribución municipal automática')+
   metricTile('Última variación reportada',ce?.latest_delta,'Dato del archivo CECOSABI');
  const mx=Math.max(1,...rows.map(x=>x.letrinasEncaladas));
  $('goliBars').innerHTML=rows.slice().sort((a,b)=>b.letrinasEncaladas-a.letrinasEncaladas).map(x=>bar(x.localidad,x.letrinasEncaladas,mx,'letrinas')).join('');
  $('goliSource').textContent='Fuente CECOSABI · '+(ce?.cut||state.ds05.cut)+'. '+(ce?.note||'No se asigna geográficamente sin validación.');
 }else if(g.id==='A'){
  const total=(state.ds05.municipalities||[]).reduce((n,m)=>n+m.canonical_rows,0);
  $('goliKpis').innerHTML=metricTile('Filas canónicas disponibles',total,'No personas')+
   metricTile('Instantáneas no canónicas',s.uncanonical_siesa_snapshots,'No sumar como capturas únicas')+
   metricTile('Municipios con registros',state.ds05.municipalities.length,'DS05');
  $('goliBars').innerHTML='<p class="empty-state">Gestión administrativa, usuarios y bitácora: reservados al entorno autenticado.</p>';
 }else if(g.id==='L'){
  $('goliBars').innerHTML='<p class="empty-state">Todavía no se ha publicado una fuente logística autorizada. No confundimos traslados, insumos ni inventarios con acciones SIESA.</p>';
 }else if(g.id==='O'){
  $('goliKpis').innerHTML+=metricTile('Letrinas encaladas (fuente separada)',ce?.latrines_limed_total,'CECOSABI · saneamiento');
  $('goliBars').innerHTML='<p class="note">El saneamiento es una fuente distinta de las acciones operativas SIESA. No sumar ambas cifras.</p>';
 }
}
function renderModules(){
 $('modulesGrid').innerHTML=MODS.map(x=>{
  const link=x.id==='map'?'../':x.id==='crum'?'../crum.html':null;
  const attr=link?'href="'+link+'" rel="noopener"':'type="button" data-module="'+x.id+'"';
  const tag=link?'a':'button';
  return '<'+tag+' class="module-card" '+attr+'><span class="module-glyph">'+x.glyph+'</span><span class="module-body"><strong>'+esc(x.title)+'</strong><small>'+esc(x.desc)+'</small></span><span class="module-state">'+esc(x.state)+'</span></'+tag+'>';
 }).join('');
}

function draw(){
 if(!state.loaded)return;
 renderHome();renderHomeExtras();renderIndicators();renderSiesaArea();renderGolipca();renderModules();renderTerritory();renderSources();
}
function show(tab){
 if(!headings[tab])return;
 state.screen=tab;
 for(const [key] of Object.entries(headings)){
  const node=$('panel-'+key);node.hidden=key!==tab;node.classList.toggle('active',key===tab);
 }
 document.querySelectorAll('.topic-strip button[data-go]').forEach(btn=>btn.classList.toggle('active',btn.dataset.go===tab));
 document.querySelectorAll('.bottom button').forEach(btn=>{const selected=btn.dataset.screen===tab;btn.classList.toggle('selected',selected);selected?btn.setAttribute('aria-current','page'):btn.removeAttribute('aria-current')});
 $('screenTitle').textContent=headings[tab][0];$('screenSubtitle').textContent=headings[tab][1];
 window.scrollTo({top:0,behavior:'instant'});
}
async function load(){
 $('warning').hidden=true;$('cut').textContent='Actualizando fuentes…';state.loaded=false;
 try{
  const [districts,ds05,conapo]=await Promise.all([getJson(srcData.districts),getJson(srcData.siesa),getConapo()]);
  if(districts.districts?.length!==6||!ds05.current_filter||!ds05.municipalities?.length)throw Error('Estructura BALAM no válida');
  state.districts=districts;state.ds05=ds05;state.conapo=conapo;state.loaded=true;
  populateDistricts();draw();
  getJson('../data/smn/sonora_latest.json').then(doc=>{
   if(!Array.isArray(doc.municipalities))return;
   state.names=new Map(doc.municipalities.filter(x=>/^26\d{3}$/.test(x.code)&&x.name).map(x=>[x.code,x.name]));
   if(state.loaded)renderTerritory();
  }).catch(()=>{});
 }catch(e){fail(e);$('cut').textContent='Datos no disponibles. Reintenta actualizar.'}
}
$('viewToggle').addEventListener('click',toggleView);
compactMedia?.addEventListener?.('change',updateView);
updateView();
$('district').addEventListener('change',e=>{state.district=e.target.value;draw()});
$('municipality').addEventListener('change',e=>{state.municipality=e.target.value;renderTerritory()});
$('siesaMunicipality').addEventListener('change',e=>{state.siesaMunicipality=e.target.value;renderSiesaArea()});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-goli]');
 if(b){state.goli=b.dataset.goli;show('golipca');renderGolipca();return}
 const m=e.target.closest('[data-module]');if(!m)return;
 const id=m.dataset.module;
 if(id==='cecosabi'||id==='intel'){state.goli=id==='cecosabi'?'C':'I';show('golipca');renderGolipca()}
 else if(headings[id])show(id);
 else {show('sources')}
});
$('reload').addEventListener('click',load);
document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.go)));
document.querySelectorAll('[data-screen]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.screen)));
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
show('home');load();
})();