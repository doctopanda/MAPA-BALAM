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
let activeLot=null,activeFileHash=null;
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
 opts($('corr-action'),[],'Seleccionar acción');
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
 $('admin-review').hidden=!admin;
 $('session-line').textContent=data.role+' · '+allowed.join(', ');
 $('auth-panel').hidden=true;$('work').hidden=false;
 await refreshOperativos();
}
async function refreshOperativos(){
 resetPatient();activeLot=null;activeFileHash=null;
 $('siesa-index-summary').textContent='Selecciona y registra la huella del archivo primero.';
 const district=$('district').value;
 const records=await rpc('balam_v7_list_operativos',{p_distrito:district});
 operativos=records||[];
 opts($('operative'),operativos.map(o=>[o.id,o.codigo+' · '+o.nombre+' ['+o.estado+']']),'Sin operativo seleccionado');
 $('operative').value=operativos.find(o=>o.estado==='activo')?.id||operativos[0]?.id||'';
 updateOperative();
 await refreshCorrections();await refreshLotes();
}
function updateOperative(){
 resetPatient();
 const op=operativos.find(o=>o.id===$('operative').value);
 $('activate').hidden=!(['admin_maestro','admin_estatal'].includes(access?.role)&&op?.estado==='borrador');
}
async function history(){
 if(!current||!$('operative').value)return;
 const rows=await rpc('balam_v7_history_items',{p_operativo:$('operative').value,p_distrito:$('district').value,p_participacion:current.participacion_id});
 const box=$('history');box.replaceChildren();
 opts($('corr-action'),(rows||[]).map(v=>[v.accion_id,v.fecha_atencion+' · '+(AREAS[v.area]?.nombre||v.area)+' · '+v.codigo_accion+' · '+v.cantidad]),'Seleccionar acción');
 if(!rows?.length){box.textContent='Todavía no hay atenciones en este operativo.';return;}
 for(const v of rows){
  const p=document.createElement('div');p.className='history-card';
  p.textContent=(v.fecha_atencion||'Sin fecha')+' · '+(AREAS[v.area]?.nombre||v.area)+' · '+v.codigo_accion+' · '+v.cantidad+' unidad(es)';
  box.append(p);
 }
}
async function searchPatients(){
 const op=$('operative').value,folio=$('folio-query').value.trim();
 if(!op)throw Error('Selecciona un operativo.');
 if(!new RegExp('^BAL-'+$('district').value+'-[0-9]{8}$').test(folio))
  throw Error('Escribe el folio completo del distrito.');
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
async function refreshCorrections(){
 if(!$('district').value||!user)return;
 const rows=await rpc('balam_v7_list_corrections',{p_distrito:$('district').value});
 const box=$('correction-list');box.replaceChildren();
 if(!rows?.length){box.textContent='No hay solicitudes registradas para este distrito.';}
 for(const v of rows||[]){
  const p=document.createElement('div');p.className='history-card';
  p.textContent=v.estado.toUpperCase()+' · '+v.motivo_codigo+' · '+v.cantidad_anterior+' → '+v.cantidad_propuesta;
  box.append(p);
 }
 const admin=['admin_maestro','admin_estatal'].includes(access?.role);
 $('admin-review').hidden=!admin;
 opts($('correction-pending'),(rows||[]).filter(x=>x.estado==='pendiente')
 .map(x=>[x.id,x.motivo_codigo+' · '+x.cantidad_anterior+' → '+x.cantidad_propuesta]),'Sin solicitudes pendientes');
}
async function requestCorrection(){
 const id=$('corr-action').value,qty=Number($('corr-quantity').value);
 if(!current||!id)throw Error('Selecciona una acción existente del paciente.');
 if(!Number.isSafeInteger(qty)||qty<1||qty>999999)throw Error('Indica una cantidad válida.');
 const result=await rpc('balam_v7_request_correction',{
 p_accion:id,p_cantidad:qty,p_motivo:$('corr-reason').value
 });
 await refreshCorrections();
 say('Solicitud enviada para revisión administrativa. Folio de control: '+result);
}
async function resolveCorrection(){
 if(!['admin_maestro','admin_estatal'].includes(access?.role))throw Error('Sin permiso de aprobación.');
 const id=$('correction-pending').value;
 if(!id)throw Error('Selecciona una solicitud pendiente.');
 const approved=$('correction-decision').value==='aprobada';
 await rpc('balam_v7_resolve_correction',{p_solicitud:id,p_aprobar:approved});
 await refreshCorrections();await history();
 say(approved?'Corrección aprobada y registrada.':'Corrección rechazada y registrada.');
}
async function precheckFile(){
 const file=$('siesa-file').files?.[0];
 if(!file)throw Error('Selecciona un Excel SIESA.');
 if(!$('operative').value)throw Error('Selecciona un operativo de prueba activo.');
 const ext=file.name.split('.').pop()?.toLowerCase();
 if(!['xlsx','xlsm'].includes(ext)||file.size<1||file.size>36700160)
  throw Error('Solo archivos XLSX o XLSM de hasta 35 MB.');
 if(!crypto?.subtle)throw Error('Este navegador requiere HTTPS para calcular SHA-256.');
 say('Calculando huella local del archivo; no se enviará su contenido.');
 const hashbuf=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
 const digest=Array.from(new Uint8Array(hashbuf)).map(v=>v.toString(16).padStart(2,'0')).join('');
 const response=await rpc('balam_v7_precheck_siesa',{
  p_operativo:$('operative').value,p_distrito:$('district').value,
  p_sha256:digest,p_bytes:file.size,p_extension:ext
 });
 const result=response?.[0];
 if(!result)throw Error('No fue posible identificar el archivo.');
 activeLot=result.lote_id;activeFileHash=digest;
 await refreshLotes();
 say(result.registrado_ahora?'Huella registrada sin contenido ni filas.':'El archivo ya tenía una huella registrada; no se duplicó el lote.');
}
async function refreshLotes(){
 if(!$('operative').value||!$('district').value)return;
 const rows=await rpc('balam_v7_list_siesa_lotes',{p_distrito:$('district').value,p_operativo:$('operative').value});
 const box=$('siesa-import-list');box.replaceChildren();
 if(!rows?.length){box.textContent='Ningún archivo de prueba identificado.';return;}
 for(const x of rows){
  const p=document.createElement('div');p.className='history-card';
  p.textContent=x.alias_archivo+' · '+x.estado+' · '+x.filas_importadas+' filas incorporadas';
  box.append(p);
 }
}
async function sendSiesaRowIndex(){
 if(!activeLot||!activeFileHash)throw Error('Primero identifica el archivo XLSX/XLSM del que proviene este índice.');
 const file=$('siesa-index-file').files?.[0];
 if(!file||file.size>1024*1024)throw Error('Selecciona un JSON de índice de hasta 1 MB.');
 const parsed=JSON.parse(await file.text());
 if(parsed?.tipo!=='BALAM_SIESA_INDICE_SINTETICO_V7')throw Error('Índice de prueba incompatible.');
 if(parsed.archivo_sha256!==activeFileHash)throw Error('La huella del índice no coincide con el archivo Excel.');
 const rows=parsed.filas;
 if(!Array.isArray(rows)||rows.length<1||rows.length>5000||parsed.total!==rows.length)
  throw Error('El índice debe contener de 1 a 5000 filas candidatas.');
 const allowed=['hoja','fila_excel','contenido_sha256','celdas_no_vacias'];
 for(const x of rows){
  if(!x||typeof x!=='object'||Array.isArray(x)||
     Object.keys(x).length!==4||!Object.keys(x).every(k=>allowed.includes(k)))
    throw Error('El índice contiene un campo no autorizado; no debe incluir nombres ni datos clínicos.');
 }
 let nuevos=0,repetidos=0;
 for(let i=0;i<rows.length;i+=100){
  const res=await rpc('balam_v7_index_siesa_rows',{p_lote:activeLot,p_rows:rows.slice(i,i+100)});
  nuevos+=res?.[0]?.nuevas||0;repetidos+=res?.[0]?.ya_conocidas||0;
 }
 const summary=await rpc('balam_v7_index_siesa_summary',{p_lote:activeLot});
 const v=summary?.[0];
 $('siesa-index-summary').textContent=
  'Huellas indexadas: '+(v?.filas_indexadas??0)+
  ' · Contenidos repetidos: '+(v?.contenidos_repetidos??0)+
  ' · Filas IMPORTADAS: '+(v?.filas_importadas??0)+
  '. No se almacenaron valores de las celdas.';
 say('Índice de prueba recibido: '+nuevos+' huellas nuevas, '+repetidos+' ya conocidas.');
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
 on('request-correction','click',requestCorrection);
 on('resolve-correction','click',resolveCorrection);
 on('refresh-corrections','click',refreshCorrections);
 on('precheck-file','click',precheckFile);
 on('refresh-lotes','click',refreshLotes);
 on('send-row-index','click',sendSiesaRowIndex);
}
start();
