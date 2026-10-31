/* BALAM VISOR v6: lector de agregados públicos. Nada nominal ni credenciales. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>Number.isFinite(n)?Math.round(n).toLocaleString('es-MX'):'Sin dato';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={districts:null,ds05:null,conapo:null,loaded:false,district:'DS05',municipality:'26042',screen:'home'};
const headings={home:['Panorama general','Lectura operativa y demográfica con procedencia explícita.'],indicators:['Indicadores','Cada cifra mantiene su unidad y corte de origen.'],territory:['Territorio y población','Proyecciones CONAPO 2015–2030 por municipio.'],sources:['Fuentes y trazabilidad','Origen, límites y controles de interpretación.']};
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
  const id='26'+code;const possible=state.conapo?.doc?.municipalityNames?.[id];
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
function draw(){
 if(!state.loaded)return;
 renderHome();renderIndicators();renderTerritory();renderSources();
}
function show(tab){
 if(!headings[tab])return;
 state.screen=tab;
 for(const [key] of Object.entries(headings)){
  const node=$('panel-'+key);node.hidden=key!==tab;node.classList.toggle('active',key===tab);
 }
 document.querySelectorAll('.bottom button').forEach(btn=>{const selected=btn.dataset.screen===tab;btn.classList.toggle('selected',selected);selected?btn.setAttribute('aria-current','page'):btn.removeAttribute('aria-current')});
 $('screenTitle').textContent=headings[tab][0];$('screenSubtitle').textContent=headings[tab][1];
 document.documentElement.scrollTop=0;
}
async function load(){
 $('warning').hidden=true;$('cut').textContent='Actualizando fuentes…';state.loaded=false;
 try{
  const [districts,ds05,conapo]=await Promise.all([getJson(srcData.districts),getJson(srcData.siesa),getConapo()]);
  if(districts.districts?.length!==6||!ds05.current_filter||!ds05.municipalities?.length)throw Error('Estructura BALAM no válida');
  state.districts=districts;state.ds05=ds05;state.conapo=conapo;state.loaded=true;
  populateDistricts();draw();
 }catch(e){fail(e);$('cut').textContent='Datos no disponibles. Reintenta actualizar.'}
}
$('district').addEventListener('change',e=>{state.district=e.target.value;draw()});
$('municipality').addEventListener('change',e=>{state.municipality=e.target.value;renderTerritory()});
$('reload').addEventListener('click',load);
document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.go)));
document.querySelectorAll('[data-screen]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.screen)));
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
show('home');load();
})();