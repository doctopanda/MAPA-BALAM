import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const s=createClient('https://blkvamobfcyvlimnizaf.supabase.co','sb_publishable_gbN7i3poaBv7Y772DltBgg_Mvp5gzBM');
const g=id=>document.getElementById(id), core=window.BALAM_CrumMap;
const out=L.layerGroup().addTo(core.map);
let records=[],active=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(v){g('crum-status').textContent=v;}
function controls(on){g('crum-login').hidden=on;g('crum-private').hidden=!on;g('crum-floating').hidden=!on;}
function draw(){
 out.clearLayers();const district=g('crum-district').value, inst=g('crum-institution').value,type=g('crum-type').value,term=g('crum-search').value.toLocaleLowerCase('es'),scope=g('crum-scope').value;
 const selected=new Set(core.getActiveDistricts());
 const rows=records.filter(r=>(!district||r.district_id===district)&&(!inst||r.institution===inst)&&(!type||r.type_class===type)&&(scope!=='active'||selected.has(r.district_id))&&(!term||(r.unit_label+' '+r.locality_label+' '+r.institution).toLocaleLowerCase('es').includes(term)));
 let geo=new Map(); for(const r of rows){if(!Number.isFinite(r.lat)||!Number.isFinite(r.lon))continue;let k=r.lat.toFixed(5)+','+r.lon.toFixed(5);if(!geo.has(k))geo.set(k,[]);geo.get(k).push(r);}
 if(active){if(!core.map.hasLayer(out))out.addTo(core.map);for(const ar of geo.values()){
  const a=ar[0],popup='<strong>🚑 '+ar.length+' recursos inventariados</strong><p>'+esc(a.locality_label)+'</p><ul>'+ar.slice(0,12).map(x=>'<li>'+esc(x.unit_label)+' · '+esc(x.institution)+'</li>').join('')+'</ul><small>No informa disponibilidad operativa ni GPS en vivo.</small>';
  L.circleMarker([a.lat,a.lon],{radius:Math.min(20,5+Math.sqrt(ar.length)*2.4),color:'#fff',weight:1.5,fillColor:ar.length>1?'#164a3e':'#07836d',fillOpacity:.88}).bindPopup(popup,{maxWidth:300}).addTo(out);
 }}else core.map.removeLayer(out);
 g('crum-count').textContent=rows.length.toLocaleString('es-MX');
 g('crum-places').textContent=geo.size+' ubicaciones';
 g('crum-float-count').textContent=active?rows.length+' registros filtrados':'Capa oculta';
 g('crum-summary').textContent=rows.length+' registros · '+rows.filter(r=>!r.district_id).length+' pendientes de distrito';
 g('crum-results').replaceChildren(...rows.slice(0,150).map(r=>{let tr=document.createElement('tr');[r.unit_label,r.institution,r.type_original,r.district_id||'Por validar'].forEach(v=>{let td=document.createElement('td');td.textContent=v;tr.append(td)});return tr}));
 g('crum-result-note').textContent='Mostrando '+Math.min(150,rows.length)+' de '+rows.length+' registros en tabla';
}
async function load(){
 const {data:{user},error:e}=await s.auth.getUser();if(!user||e){controls(false);status('Inicia sesión para ver el catálogo CRUM');return}
 const {data:member,error:er}=await s.from('balam_access').select('role,is_enabled').eq('user_id',user.id).maybeSingle();
 if(er||!member?.is_enabled){controls(false);status('La cuenta no tiene acceso habilitado en BALAM');return}
 let all=[];for(let i=0;i<10000;i+=500){let {data,error}=await s.from('balam_crum_assets').select('asset_key,unit_label,locality_label,institution,type_original,type_class,district_id,lat,lon').eq('present_in_latest_import',true).order('asset_key').range(i,i+499);if(error){status('Error de lectura: '+error.message);return}all.push(...data);if(data.length<500)break}
 records=all;controls(true);active=true;g('crum-toggle').checked=true;g('crum-role').textContent=member.role==='admin_maestro'?'Administrador Maestro':member.role.replaceAll('_',' ');
 let inst=g('crum-institution');inst.replaceChildren(new Option('Todas las instituciones',''));[...new Set(records.map(x=>x.institution))].sort().forEach(v=>inst.add(new Option(v,v)));
 let ty=g('crum-type');ty.replaceChildren(new Option('Todos los tipos',''));[...new Set(records.map(x=>x.type_class))].sort().forEach(v=>ty.add(new Option(v.replaceAll('_',' '),v)));
 draw();status('Conectado a Supabase · '+records.length+' unidades inventariadas');
}
g('crum-signin').addEventListener('submit',async e=>{e.preventDefault();status('Validando credenciales…');let {error}=await s.auth.signInWithPassword({email:g('crum-email').value.trim(),password:g('crum-password').value});g('crum-password').value='';if(error){status(error.message);return}await load()});
g('crum-signout').addEventListener('click',async()=>{await s.auth.signOut();records=[];active=false;out.clearLayers();controls(false);status('Sesión cerrada')});
g('crum-refresh').addEventListener('click',load);
g('crum-toggle').addEventListener('change',e=>{active=e.target.checked;draw()});
g('crum-float-toggle').addEventListener('click',()=>{active=!active;g('crum-toggle').checked=active;draw()});
g('crum-show-all-districts').addEventListener('click',()=>{core.activateAllDistricts();g('crum-scope').value='all';draw()});
g('crum-zoom').addEventListener('click',()=>{let ar=out.getLayers().map(x=>x.getLatLng());if(ar.length)core.map.fitBounds(L.latLngBounds(ar),{padding:[24,24],maxZoom:12})});
for(let id of ['crum-district','crum-institution','crum-type','crum-scope','crum-search'])g(id).addEventListener(id==='crum-search'?'input':'change',draw);
g('districtControls').addEventListener('change',()=>setTimeout(draw,0));
s.auth.onAuthStateChange(e=>{if(e==='SIGNED_OUT'){records=[];active=false;out.clearLayers();controls(false)}});
load();