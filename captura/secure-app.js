import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const supabase=createClient("https://blkvamobfcyvlimnizaf.supabase.co","sb_publishable_gbN7i3poaBv7Y772DltBgg_Mvp5gzBM",{
 auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}
});
const $=id=>document.getElementById(id);
const AREAS={
 enfermeria:{nombre:'Enfermería',acciones:[['DEMO_SIGNOS','Toma de signos vitales'],['DEMO_SOMATO','Somatometría'],['DEMO_CURACION','Curación']]},
 psicologia:{nombre:'Psicología',acciones:[['DEMO_VALORACION','Valoración psicológica'],['DEMO_SEGUIMIENTO','Seguimiento psicológico']]},
 promocion:{nombre:'Promoción',acciones:[['DEMO_CONSEJERIA','Consejería'],['DEMO_ORIENTACION','Orientación preventiva']]},
 medica:{nombre:'Atención médica',acciones:[['DEMO_CONSULTA','Consulta médica'],['DEMO_REFERENCIA','Referencia médica']]},
 vacunacion:{nombre:'Vacunación',acciones:[['DEMO_DOSIS','Dosis aplicada'],['DEMO_CARTILLA','Revisión de cartilla']]},
 vigilancia:{nombre:'Vigilancia epidemiológica',acciones:[['DEMO_ENTREVISTA','Entrevista epidemiológica'],['DEMO_MUESTRA','Toma de muestra']]},
 vectores:{nombre:'Vectores',acciones:[['DEMO_VISITA','Visita domiciliaria']]},
 odontologia:{nombre:'Odontología',acciones:[['DEMO_VALORACION_ODONTO','Valoración odontológica']]},
 laboratorio:{nombre:'Laboratorio',acciones:[['DEMO_MUESTRA_LAB','Toma de muestra']]},
 riesgos_sanitarios:{nombre:'Riesgos sanitarios',acciones:[['DEMO_VISITA_SANITARIA','Visita sanitaria']]}
};
let user=null,access=null,operativos=[],current=null,actions=[];
const opts=(select,values,empty='Seleccione')=>{
 select.replaceChildren();
 if(empty){const o=new Option(empty,'');select.add(o);}
 for(const [value,label] of values)select.add(new Option(label,value));
};
function say(message,isError=false){
 $(isError?'error-line':'success-line').textContent=message;
 $(isError?'success-line':'error-line').textContent='';
}
function resetPatient(){
 current=null;actions=[];
 $('person-card').textContent='Sin paciente seleccionado.';
 $('identity-ok').checked=false;opts($('patient-matches'),[],'Sin paciente seleccionado');
 $('history').textContent='Selecciona un folio autorizado.';
 renderActions();
}
function renderActions(){
 const list=$('action-list');list.replaceChildren();
 if(!actions.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Sin acciones pendientes.';list.append(empty);}
 actions.forEach((a,i)=>{
  const div=document.createElement('div');div.className='action-item';
  const b=document.createElement('b');b.textContent=AREAS[a.area].nombre+' · '+AREAS[a.area].acciones.find(x=>x[0]===a.codigo)?.[1];
  const s=document.createElement('small');s.textContent=a.cantidad+' unidad(es)';
  const t=document.createElement('div');t.append(b,s);
  const btn=document.createElement('button');btn.type='button';btn.textContent='Quitar';btn.addEventListener('click',()=>{actions.splice(i,1);renderActions();});
  div.append(t,btn);list.append(div);
 });
 $('count-people').textContent=current&&actions.length?'1':'0';
 $('count-types').textContent=String(new Set(actions.map(a=>a.area+':'+a.codigo)).size);
 $('count-units').textContent=String(actions.reduce((sum,a)=>sum+a.cantidad,0));
}
function areaActions(){
 opts($('action'),AREAS[$('area').value].acciones.map(([v,l])=>[v,l]),'');
}
function showPatient(item){
 current=item;$('identity-ok').checked=false;actions=[];renderActions();
 $('person-card').textContent=item?item.folio+' · '+item.nombre_completo+' · '+(item.sexo_registro||'Sin sexo'):'Sin paciente seleccionado.';
 if(item)history().catch(e=>say(e.message,true));
}
async function rpc(name,args){
 if(!user||!access?.is_enabled)throw Error('La sesión o autorización no está activa.');
 const {data,error}=await supabase.rpc(name,args);
 if(error)throw new Error(error.message||'Error de conexión con BALAM');
 return data;
}
async function ensureAccess(){
 const {data,error}=await supabase.from('balam_access').select('role,district_ids,is_enabled').eq('user_id',user.id).single();
 if(error||!data||!data.is_enabled)throw Error('No tienes autorización activa en BALAM.');
 if(!['admin_maestro','admin_estatal','supervisor_distrital','alimentador_distrital'].includes(data.role))
  throw Error('Tu rol no permite capturar o supervisar operativos.');
 access=data;
 const admin=['admin_maestro','admin_estatal'].includes(data.role);
 const allowed=admin?['DS01','DS02','DS03','DS04','DS05','DS06']:(data.district_ids||[]).filter(d=>/^DS0[1-6]$/.test(d));
 if(!allowed.length)throw Error('Tu usuario no tiene distritos asignados.');
 opts($('district'),allowed.map(d=>[d,d]),'');
 $('new-op-box').hidden=!admin;
 $('session-line').textContent=data.role+' · '+allowed.join(', ');
 $('auth-panel').hidden=true;$('work').hidden=false;
 await refreshOperativos();
}
async function refreshOperativos(){
 resetPatient();
 const district=$('district').value;
 const records=await rpc('balam_v7_list_operativos',{p_distrito:district});
 operativos=records||[];
 opts($('operative'),operativos.map(o=>[o.id,o.codigo+' · '+o.nombre+' ['+o.estado+']']),'Sin operativo seleccionado');
 $('operative').value=operativos.find(o=>o.estado==='activo')?.id||operativos[0]?.id||'';
 updateOperative();
}
function updateOperative(){
 resetPatient();
 const op=operativos.find(o=>o.id===$('operative').value);
 $('activate').hidden=!(['admin_maestro','admin_estatal'].includes(access?.role)&&op?.estado==='borrador');
}
async function history(){
 if(!current||!$('operative').value)return;
 const rows=await rpc('balam_v7_history',{p_operativo:$('operative').value,p_distrito:$('district').value,p_participacion:current.participacion_id});
 const box=$('history');box.replaceChildren();
 if(!rows?.length){box.textContent='Todavía no hay atenciones en este operativo.';return;}
 for(const v of rows){
  const p=document.createElement('div');p.className='history-card';
  p.textContent=(v.fecha_atencion||'Sin fecha')+' · '+AREAS[v.area]?.nombre+' · '+v.codigo_accion+' · '+v.cantidad+' unidad(es)';
  box.append(p);
 }
}
async function searchPatients(){
 const op=$('operative').value,folio=$('folio-query').value.trim();
 if(!op)throw Error('Selecciona un operativo.');
 if(!new RegExp('^BAL-'+$('district').value+'-[0-9]{8}
 const rows=await rpc('balam_v7_search_patient',{p_operativo:op,p_distrito:$('district').value,p_folio:folio});
 opts($('patient-matches'),(rows||[]).map((x,i)=>[String(i),x.folio+' · '+x.nombre_completo]),'Seleccione coincidencia');
 $('patient-matches')._rows=rows||[];
 showPatient(null);
 say((rows||[]).length+' coincidencia(s) en tu distrito.');
}
async function registerPatient(){
 const op=$('operative').value,name=$('new-name').value.trim();
 if(!op)throw Error('Selecciona un operativo activo.');
 if(!/^(PRUEBA |PACIENTE FICTICIO )/.test(name))throw Error('Solo nombres sintéticos: PRUEBA ...');
 const result=await rpc('balam_v7_register_patient',{
  p_operativo:op,p_distrito:$('district').value,p_nombre:name,
  p_fecha_nacimiento:$('birth').value||null,p_sexo:$('sex').value,p_persona_existente:null
 });
 const p=result?.[0];if(!p)throw Error('No se recibió folio del registro.');
 $('folio-query').value=p.folio;
 await searchPatients();
 const match=($('patient-matches')._rows||[]).find(x=>x.participacion_id===p.participacion_id);
 if(match){$('patient-matches').value=String(($('patient-matches')._rows||[]).indexOf(match));showPatient(match);}
 say('Paciente SINTÉTICO registrado y folio generado: '+p.folio);
}
async function createOperative(){
 const code=$('op-code').value.trim().toUpperCase();
 if(!code.startsWith('TEST-'))throw Error('La clave debe comenzar por TEST-.');
 const id=await rpc('balam_v7_create_operativo',{p_codigo:code,p_nombre:$('op-name').value.trim(),p_fecha_inicio:$('op-start').value,p_distritos:[$('district').value]});
 await refreshOperativos();$('operative').value=id;updateOperative();
 say('Operativo de prueba creado en estado borrador. Actívalo para capturar.');
}
async function activateOperative(){
 if(!$('operative').value)throw Error('Selecciona un operativo.');
 const okay=await rpc('balam_v7_activate_operativo',{p_operativo:$('operative').value});
 await refreshOperativos();say(okay?'Operativo de prueba activado.':'No se actualizó el operativo.');
}
function addAction(){
 if(!current||!$('identity-ok').checked)throw Error('Selecciona y confirma al paciente antes de añadir una acción.');
 const q=Number($('quantity').value);
 if(!Number.isSafeInteger(q)||q<1||q>999)throw Error('Cantidad inválida: utiliza enteros de 1 a 999.');
 actions.push({area:$('area').value,codigo:$('action').value,cantidad:q});renderActions();
}
async function saveVisit(){
 if(!current||!$('identity-ok').checked)throw Error('Confirma la identidad del paciente ficticio.');
 if(!$('visit-date').value||!$('operative').value)throw Error('Fecha y operativo son obligatorios.');
 if(!actions.length)throw Error('Agrega al menos una acción.');
 const id=await rpc('balam_v7_register_attention',{
  p_operativo:$('operative').value,p_distrito:$('district').value,
  p_participacion:current.participacion_id,
  p_fecha_atencion:$('visit-date').value,p_codigo_localidad:$('locality').value.trim(),
  p_acciones:actions.map(x=>({...x}))
 });
 actions=[];renderActions();$('identity-ok').checked=false;
 await history();say('Atención SINTÉTICA registrada con auditoría. ID '+id);
}
async function login(ev){
 ev.preventDefault();say('Verificando credenciales...');
 const {data,error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
 $('password').value='';
 if(error)throw Error(error.message);
 user=data.user;
 try{await ensureAccess();say('Acceso verificado. Solo se permiten datos de prueba.');}
 catch(e){await logout();throw e;}
}
async function logout(){
 await supabase.auth.signOut();user=null;access=null;operativos=[];resetPatient();
 $('work').hidden=true;$('auth-panel').hidden=false;
 $('email').value='';$('password').value='';say('Sesión cerrada.');
}
function on(id,event,fn){$(id).addEventListener(event,e=>{Promise.resolve().then(()=>fn(e)).catch(err=>say(err.message||'Error inesperado',true));});}
function start(){
 opts($('area'),Object.entries(AREAS).map(([k,v])=>[k,v.nombre]),'');
 areaActions();renderActions();
 on('login-form','submit',login);on('logout','click',logout);
 on('district','change',refreshOperativos);on('operative','change',updateOperative);
 on('refresh-op','click',refreshOperativos);
 on('create-op','click',createOperative);on('activate','click',activateOperative);
 on('search','click',searchPatients);
 on('patient-matches','change',()=>{const ix=Number($('patient-matches').value);showPatient(($('patient-matches')._rows||[])[ix]||null);});
 on('register-patient','click',registerPatient);on('area','change',areaActions);
 on('add-action','click',addAction);on('save-visit','click',saveVisit);
 on('clear-actions','click',()=>{actions=[];renderActions();say('Acciones pendientes borradas.');});
}
start();
).test(folio))throw Error('Escribe el folio completo del distrito.');
 const rows=await rpc('balam_v7_search_patient',{p_operativo:op,p_distrito:$('district').value,p_folio:folio});
 opts($('patient-matches'),(rows||[]).map((x,i)=>[String(i),x.folio+' · '+x.nombre_completo]),'Seleccione coincidencia');
 $('patient-matches')._rows=rows||[];
 showPatient(null);
 say((rows||[]).length+' coincidencia(s) en tu distrito.');
}
async function registerPatient(){
 const op=$('operative').value,name=$('new-name').value.trim();
 if(!op)throw Error('Selecciona un operativo activo.');
 if(!/^(PRUEBA |PACIENTE FICTICIO )/.test(name))throw Error('Solo nombres sintéticos: PRUEBA ...');
 const result=await rpc('balam_v7_register_patient',{
  p_operativo:op,p_distrito:$('district').value,p_nombre:name,
  p_fecha_nacimiento:$('birth').value||null,p_sexo:$('sex').value,p_persona_existente:null
 });
 const p=result?.[0];if(!p)throw Error('No se recibió folio del registro.');
 $('folio-query').value=p.folio;
 await searchPatients();
 const match=($('patient-matches')._rows||[]).find(x=>x.participacion_id===p.participacion_id);
 if(match){$('patient-matches').value=String(($('patient-matches')._rows||[]).indexOf(match));showPatient(match);}
 say('Paciente SINTÉTICO registrado y folio generado: '+p.folio);
}
async function createOperative(){
 const code=$('op-code').value.trim().toUpperCase();
 if(!code.startsWith('TEST-'))throw Error('La clave debe comenzar por TEST-.');
 const id=await rpc('balam_v7_create_operativo',{p_codigo:code,p_nombre:$('op-name').value.trim(),p_fecha_inicio:$('op-start').value,p_distritos:[$('district').value]});
 await refreshOperativos();$('operative').value=id;updateOperative();
 say('Operativo de prueba creado en estado borrador. Actívalo para capturar.');
}
async function activateOperative(){
 if(!$('operative').value)throw Error('Selecciona un operativo.');
 const okay=await rpc('balam_v7_activate_operativo',{p_operativo:$('operative').value});
 await refreshOperativos();say(okay?'Operativo de prueba activado.':'No se actualizó el operativo.');
}
function addAction(){
 if(!current||!$('identity-ok').checked)throw Error('Selecciona y confirma al paciente antes de añadir una acción.');
 const q=Number($('quantity').value);
 if(!Number.isSafeInteger(q)||q<1||q>999)throw Error('Cantidad inválida: utiliza enteros de 1 a 999.');
 actions.push({area:$('area').value,codigo:$('action').value,cantidad:q});renderActions();
}
async function saveVisit(){
 if(!current||!$('identity-ok').checked)throw Error('Confirma la identidad del paciente ficticio.');
 if(!$('visit-date').value||!$('operative').value)throw Error('Fecha y operativo son obligatorios.');
 if(!actions.length)throw Error('Agrega al menos una acción.');
 const id=await rpc('balam_v7_register_attention',{
  p_operativo:$('operative').value,p_distrito:$('district').value,
  p_participacion:current.participacion_id,
  p_fecha_atencion:$('visit-date').value,p_codigo_localidad:$('locality').value.trim(),
  p_acciones:actions.map(x=>({...x}))
 });
 actions=[];renderActions();$('identity-ok').checked=false;
 await history();say('Atención SINTÉTICA registrada con auditoría. ID '+id);
}
async function login(ev){
 ev.preventDefault();say('Verificando credenciales...');
 const {data,error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
 $('password').value='';
 if(error)throw Error(error.message);
 user=data.user;
 try{await ensureAccess();say('Acceso verificado. Solo se permiten datos de prueba.');}
 catch(e){await logout();throw e;}
}
async function logout(){
 await supabase.auth.signOut();user=null;access=null;operativos=[];resetPatient();
 $('work').hidden=true;$('auth-panel').hidden=false;
 $('email').value='';$('password').value='';say('Sesión cerrada.');
}
function on(id,event,fn){$(id).addEventListener(event,e=>{Promise.resolve().then(()=>fn(e)).catch(err=>say(err.message||'Error inesperado',true));});}
function start(){
 opts($('area'),Object.entries(AREAS).map(([k,v])=>[k,v.nombre]),'');
 areaActions();renderActions();
 on('login-form','submit',login);on('logout','click',logout);
 on('district','change',refreshOperativos);on('operative','change',updateOperative);
 on('refresh-op','click',refreshOperativos);
 on('create-op','click',createOperative);on('activate','click',activateOperative);
 on('search','click',searchPatients);
 on('patient-matches','change',()=>{const ix=Number($('patient-matches').value);showPatient(($('patient-matches')._rows||[])[ix]||null);});
 on('register-patient','click',registerPatient);on('area','change',areaActions);
 on('add-action','click',addAction);on('save-visit','click',saveVisit);
 on('clear-actions','click',()=>{actions=[];renderActions();say('Acciones pendientes borradas.');});
}
start();
