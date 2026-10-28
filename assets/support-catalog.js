/* BALAM 0.13 · Catálogo privado de proveedores de auxilio, tickets y verificación RLS. */
(()=>{
'use strict';
const el=id=>document.getElementById(id),map=window.BALAM_SmnMap?.map;
if(!el('support-catalog')||!map)return;
const icons={fuel:'⛽',tire:'🛞',repair:'🔧',roadside_assistance:'🛟'};
const label={fuel:'Gasolinera',tire:'Llantera',repair:'Taller',roadside_assistance:'Auxilio carretero'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lng=()=>window.BALAM_Logistics?.getRoute?.()||null;
let sites=[],role=null,supabase=null,busy=false,loggedIn=false;
const layer=L.layerGroup().addTo(map);
const setStatus=t=>{el('support-status').textContent=t};
function distanceToRoute(lat,lon,coords){
 if(!coords?.length)return Infinity;
 const lat0=lat,r=Math.PI/180,mx=111.32*Math.cos(lat0*r);
 const p=[lon*mx,lat*111.32];let min=Infinity;
 for(let i=1;i<coords.length;i++){
  const a=[coords[i-1][0]*mx,coords[i-1][1]*111.32],b=[coords[i][0]*mx,coords[i][1]*111.32];
  const dx=b[0]-a[0],dy=b[1]-a[1],size=dx*dx+dy*dy;
  const t=size?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/size)):0;
  min=Math.min(min,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy));
 }
 return min;
}
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Hermosillo'});
const validTicket=x=>x.kind==='fuel'&&x.ticket_status==='accepted'&&x.validation_status==='verified'&&x.ticket_valid_until&&x.ticket_valid_until>=today();
function sanitizedContact(x){
 return [x.phone?'Teléfono informado: '+esc(x.phone):'Teléfono: no documentado',
 x.operating_hours?'Horario informado: '+esc(x.operating_hours):'Horario: no documentado'].join('<br>');
}
function render(){
 layer.clearLayers();el('support-near-list').replaceChildren();el('support-saved-list').replaceChildren();
 const r=lng(),verified=sites.filter(x=>x.validation_status==='verified'&&x.is_active);
 const close=r?verified.map(s=>({...s,nearKm:distanceToRoute(Number(s.lat),Number(s.lon),r.coords)})).filter(s=>s.nearKm<=4).sort((a,b)=>a.nearKm-b.nearKm):[];
 let visible=0;
 for(const site of close.slice(0,80)){
   if(!el('support-visible').checked)break;
   const icon=L.divIcon({className:'support-site-icon',html:'<div>'+icons[site.kind]+'</div>',iconSize:[38,38],iconAnchor:[19,19]});
   const popup='<b>'+esc(site.name)+'</b><p>'+esc(label[site.kind])+' · aprox. '+site.nearKm.toFixed(2)+' km en línea recta del recorrido</p>'+
     '<p>'+sanitizedContact(site)+'</p>'+
     (validTicket(site)?'<p class="support-badge">✅ Ticket/convenio verificado; vigencia hasta '+esc(site.ticket_valid_until)+'</p><p>Programa: '+esc(site.ticket_program)+'</p>':'<p>No hay aceptación vigente de tickets acreditada.</p>')+
     '<small>Registro institucional BALAM validado; verificar apertura y capacidad real antes del traslado.</small>';
   const marker=L.marker([Number(site.lat),Number(site.lon)],{icon}).bindPopup(popup,{maxWidth:300}).addTo(layer);
   const card=document.createElement('button');card.type='button';card.className='logistics-spot';
   card.textContent=icons[site.kind]+' '+site.name+(validTicket(site)?' · TICKET ✅':'')+' · '+site.nearKm.toFixed(2)+' km del trazado';
   card.addEventListener('click',()=>{map.panTo([Number(site.lat),Number(site.lon)]);marker.openPopup()});
   el('support-near-list').append(card);visible++;
 }
 el('support-near-summary').textContent=!loggedIn?'Inicia sesión para consultar proveedores validados.':!r?
 'Traza una ruta para localizar proveedores institucionales verificados.':
 visible+' proveedores verificados visibles a ≤4 km en línea recta de la ruta. No equivale a acceso vial real.';
 if(role==='admin_maestro'){
   for(const site of sites.slice(0,100)){
     const wrap=document.createElement('div');wrap.className='support-card';
     const bold=document.createElement('b');bold.textContent=icons[site.kind]+' '+site.name;
     const small=document.createElement('small');
     small.textContent=label[site.kind]+' · '+site.validation_status+' · '+(site.is_active?'Activa':'Inactiva')+(validTicket(site)?' · Ticket vigente':'');
     const button=document.createElement('button');button.type='button';button.textContent='Editar ficha';
     button.onclick=()=>{loadForm(site);el('support-admin').open=true;el('support-admin').scrollIntoView({block:'nearest',behavior:'smooth'})};
     wrap.append(bold,small,button);el('support-saved-list').append(wrap);
   }
 }
}
function emptyForm(){
 el('support-form').reset();
 el('support-f-id').value='';
 el('support-f-status').value='draft';
 el('support-f-ticket').value='unverified';
 el('support-f-active').checked=true;
 el('support-form-message').textContent='Nueva ficha sin publicar; documenta evidencia antes de validarla.';
}
function loadForm(x){
 const keys={id:'site_id',kind:'kind',name:'name',lat:'lat',lon:'lon',
 district:'district_id',municipality:'municipality_code',address:'address_text',
 phone:'phone',hours:'operating_hours',details:'service_details',
 ticket:'ticket_status',program:'ticket_program','ticket-until':'ticket_valid_until',
 status:'validation_status',evidence:'verification_evidence'};
 for(const [f,k] of Object.entries(keys))el('support-f-'+f).value=x[k]??'';
 el('support-f-active').checked=!!x.is_active;
 el('support-form-message').textContent='Editando '+x.name+' · '+x.site_id;
}
function readForm(){
 const id=el('support-f-id').value;
 const val=id=>el('support-f-'+id).value.trim();
 const kind=val('kind'),ticket_status=kind==='fuel'?val('ticket'):'unverified';
 const data={
  kind,name:val('name'),lat:Number(val('lat')),lon:Number(val('lon')),
  district_id:val('district')||null,municipality_code:val('municipality')||null,
  address_text:val('address')||null,phone:val('phone')||null,
  operating_hours:val('hours')||null,service_details:val('details')||null,
  ticket_status,ticket_program:kind==='fuel'?val('program')||null:null,
  ticket_valid_until:kind==='fuel'?val('ticket-until')||null:null,
  validation_status:val('status'),verification_evidence:val('evidence')||null,
  is_active:el('support-f-active').checked
 };
 if(data.name.length<3||!Number.isFinite(data.lat)||!Number.isFinite(data.lon)||
 data.lat<26||data.lat>33.5||data.lon< -115.5||data.lon> -108)throw Error('Nombre y coordenadas Sonora válidas son obligatorios.');
 if(data.municipality_code&&!/^26\d{3}$/.test(data.municipality_code))throw Error('Municipio debe tener clave 26xxx.');
 if(data.validation_status==='verified'&&!data.verification_evidence)throw Error('No se puede publicar sin evidencia documental.');
 if(data.ticket_status==='accepted'&&(!data.ticket_program||!data.ticket_valid_until||
 data.ticket_valid_until<today()||data.validation_status!=='verified'))throw Error('Ticket requiere convenio, vigencia futura, evidencia y estado validado.');
 return {id,data};
}
async function save(ev){
 ev.preventDefault();
 if(role!=='admin_maestro'||!supabase)return;
 const status=el('support-form-message');if(busy)return;
 let form;try{form=readForm()}catch(err){status.textContent=err.message;return}
 busy=true;el('support-save').disabled=true;
 status.textContent='Guardando ficha institucional con RLS y bitácora…';
 try{
  const q=form.id?supabase.from('balam_route_support_sites').update(form.data).eq('site_id',form.id):
    supabase.from('balam_route_support_sites').insert(form.data);
  const {data,error}=await q.select('site_id').single();
  if(error)throw Error(error.message);
  status.textContent='Ficha '+data.site_id+' guardada; historial registrado.';
  await reload();loadForm(sites.find(x=>x.site_id===data.site_id)||{...form.data,site_id:data.site_id});
 }catch(err){status.textContent='No se pudo guardar: '+String(err.message).slice(0,200)}
 finally{busy=false;el('support-save').disabled=false}
}
async function reload(){
 supabase=window.BALAM_SupabaseClient||null;
 if(!supabase){setStatus('El conector CRUM/Supabase aún no está listo.');return}
 const {data:{user},error:userError}=await supabase.auth.getUser();
 if(!user||userError){sites=[];loggedIn=false;role=null;el('support-admin').hidden=true;render();setStatus('Inicia sesión desde Catálogo CRUM para ver proveedores institucionales.');return}
 const {data:member,error:memberError}=await supabase.from('balam_access').select('role,is_enabled').eq('user_id',user.id).maybeSingle();
 if(memberError||!member?.is_enabled){sites=[];loggedIn=false;role=null;el('support-admin').hidden=true;render();setStatus('Usuario sin acceso BALAM habilitado.');return}
 role=member.role;loggedIn=true;
 const {data,error}=await supabase.from('balam_route_support_sites').select(
 'site_id,kind,name,lat,lon,municipality_code,district_id,address_text,phone,operating_hours,service_details,ticket_status,ticket_program,ticket_valid_until,validation_status,verification_evidence,is_active,created_at,updated_at'
 ).order('updated_at',{ascending:false}).limit(1000);
 if(error){sites=[];setStatus('Error catálogo: '+error.message);render();return}
 sites=data||[];
 el('support-admin').hidden=role!=='admin_maestro';
 setStatus('BALAM autorizado · '+sites.filter(s=>s.validation_status==='verified'&&s.is_active).length+
 ' puntos validados'+(role==='admin_maestro'?' · '+sites.length+' registros visibles al Maestro':'')+'. Sin proveedor verificado no se atribuyen convenios.');
 render();
}
el('support-visible').addEventListener('change',render);
el('support-refresh').addEventListener('click',reload);
el('support-form').addEventListener('submit',save);
el('support-new').addEventListener('click',emptyForm);
window.addEventListener('balam:logistics-route-ready',render);
window.addEventListener('balam:logistics-route-cleared',render);
window.addEventListener('balam:auth-updated',reload);
window.BALAM_SupportCatalog={reload,getSites:()=>sites.filter(x=>x.validation_status==='verified'&&x.is_active)};
emptyForm();reload();
})();