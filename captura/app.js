"use strict";
// BALAM v7 · prototipo de captura con datos ficticios.
// SEGURIDAD: no hay fetch, cookies, localStorage, Supabase ni persistencia.
const operativos=[
  {id:"OP-DEMO-POLO",label:"OP-DEMO-POLO · Operativo de ejemplo"},
  {id:"OP-DEMO-BRIGADA",label:"OP-DEMO-BRIGADA · Brigada de ejemplo"}
];
const pacientes=[
  {id:"P-DEMO-001",op:"OP-DEMO-POLO",folio:"DEMO-DS05-0001",nombre:"Paciente ficticio A",edad:34,sexo:"Femenino",municipio:"Navojoa"},
  {id:"P-DEMO-002",op:"OP-DEMO-POLO",folio:"DEMO-DS05-0002",nombre:"Paciente ficticio B",edad:52,sexo:"Masculino",municipio:"Etchojoa"},
  {id:"P-DEMO-003",op:"OP-DEMO-BRIGADA",folio:"DEMO-DS05-0003",nombre:"Paciente ficticio C",edad:25,sexo:"Femenino",municipio:"Huatabampo"}
];
const catalogo={
  enfermeria:{label:"Enfermería",acciones:[["signos","Toma de signos vitales"],["somatometria","Somatometría"],["curacion","Curación"],["orientacion","Orientación de enfermería"]]},
  psicologia:{label:"Psicología",acciones:[["valoracion","Valoración psicológica"],["breve","Intervención breve"],["seguimiento","Seguimiento psicológico"],["referencia","Referencia psicológica"]]},
  promocion:{label:"Promoción de la salud",acciones:[["consejeria","Consejería individual"],["prevencion","Orientación preventiva"],["material","Entrega de material"],["educacion","Sesión educativa"]]},
  medica:{label:"Atención médica",acciones:[["consulta","Consulta médica"],["seguimiento","Seguimiento clínico"],["referencia","Referencia médica"]]},
  vacunacion:{label:"Vacunación",acciones:[["aplicacion","Dosis aplicada"],["revision","Revisión de cartilla"],["orientacion","Orientación sobre vacunación"]]},
  vigilancia:{label:"Vigilancia epidemiológica",acciones:[["entrevista","Entrevista epidemiológica"],["muestra","Toma de muestra"],["seguimiento","Seguimiento de caso"]]},
  vectores:{label:"Vectores",acciones:[["orientacion","Orientación preventiva"],["visita","Visita domiciliaria"]]}
};
const historial=new Map([
  ["P-DEMO-001",[{fecha:"2026-11-17",localidad:"Navojoa",acciones:[{area:"enfermeria",accion:"signos",cantidad:1}]}]]
]);
const $=id=>document.getElementById(id);
const estado={pendientes:[],siguiente:0};
const fila=(texto,valor)=>{const o=document.createElement("option");o.value=valor;o.textContent=texto;return o};
const pacienteActual=()=>pacientes.find(p=>p.id===$("patient").value&&p.op===$("operative").value);
function mensaje(texto,tipo=""){const el=$("message");el.textContent=texto;el.className="message "+tipo}
function vaciar(node){node.replaceChildren()}
function renderOperativos(){
  const el=$("operative");vaciar(el);
  operativos.forEach(o=>el.append(fila(o.label,o.id)));
  el.addEventListener("change",()=>{cambiarOperativo()});
}
function cambiarOperativo(){
  const el=$("patient");vaciar(el);
  pacientes.filter(p=>p.op===$("operative").value).forEach(p=>el.append(fila(p.folio+" · "+p.nombre,p.id)));
  $("identity-ok").checked=false;
  estado.pendientes=[];
  renderPersona();renderPendientes();renderHistorial();mensaje("");
}
function renderPersona(){
  const p=pacienteActual(),box=$("person-card");vaciar(box);
  if(!p){box.textContent="No existen pacientes ficticios para este operativo.";return;}
  const b=document.createElement("b");b.textContent=p.nombre+" · "+p.folio;box.append(b);
  const line=document.createElement("small");line.textContent=p.edad+" años · "+p.sexo+" · "+p.municipio;box.append(line);
  const tags=document.createElement("div");tags.className="tags";
  ["Datos generales recuperados","Operativo "+p.op,"Distrito DS05"].forEach(s=>{const t=document.createElement("span");t.className="tag";t.textContent=s;tags.append(t)});
  box.append(tags);
}
function renderAreas(){
  const a=$("area");vaciar(a);
  Object.entries(catalogo).forEach(([id,x])=>a.append(fila(x.label,id)));
  a.addEventListener("change",renderAcciones);renderAcciones();
}
function renderAcciones(){
  const a=$("action");vaciar(a);
  catalogo[$("area").value].acciones.forEach(([id,label])=>a.append(fila(label,id)));
}
function nombreAccion(item){return catalogo[item.area].acciones.find(x=>x[0]===item.accion)?.[1]||"Acción desconocida"}
function renderPendientes(){
  const box=$("action-list");vaciar(box);
  if(!estado.pendientes.length){const p=document.createElement("div");p.className="empty";p.textContent="No has agregado acciones a esta atención.";box.append(p)}
  estado.pendientes.forEach(x=>{
    const item=document.createElement("div");item.className="action-item";
    const t=document.createElement("div"),b=document.createElement("b"),s=document.createElement("small");
    b.textContent=nombreAccion(x);s.textContent=catalogo[x.area].label+" · "+x.cantidad+" unidad(es)";
    t.append(b,s);
    const remove=document.createElement("button");remove.type="button";remove.textContent="Quitar";
    remove.setAttribute("aria-label","Quitar "+nombreAccion(x));
    remove.addEventListener("click",()=>{estado.pendientes=estado.pendientes.filter(a=>a.id!==x.id);renderPendientes()});
    item.append(t,remove);box.append(item);
  });
  $("unique-count").textContent=estado.pendientes.length&&pacienteActual()?"1":"0";
  $("types-count").textContent=String(new Set(estado.pendientes.map(a=>a.area+":"+a.accion)).size);
  $("units-count").textContent=String(estado.pendientes.reduce((sum,a)=>sum+a.cantidad,0));
}
function agregar(){
  if(!pacienteActual()){mensaje("Selecciona un paciente del operativo.","error");return}
  if(!$("identity-ok").checked){mensaje("Confirma la identidad del paciente antes de agregar acciones.","error");return}
  const q=Number($("quantity").value);
  if(!Number.isSafeInteger(q)||q<1||q>999){mensaje("La cantidad debe ser un entero de 1 a 999.","error");return}
  estado.pendientes.push({id:++estado.siguiente,area:$("area").value,accion:$("action").value,cantidad:q});
  renderPendientes();mensaje("Acción añadida a la atención de prueba.","ok");
}
function renderHistorial(){
  const box=$("history");vaciar(box);
  const p=pacienteActual();
  if(!p)return;
  const visitas=historial.get(p.id)||[];
  if(!visitas.length){const e=document.createElement("div");e.className="empty";e.textContent="Todavía no hay atenciones ficticias para este paciente.";box.append(e);return}
  visitas.forEach(v=>{
    const card=document.createElement("article");card.className="history-card";
    const b=document.createElement("b");b.textContent=v.fecha+" · "+v.localidad;
    const sm=document.createElement("small");sm.textContent="Atención de demostración · "+v.acciones.reduce((n,x)=>n+x.cantidad,0)+" unidades";
    const ul=document.createElement("ul");
    v.acciones.forEach(a=>{const li=document.createElement("li");li.textContent=catalogo[a.area].label+" · "+nombreAccion(a)+" × "+a.cantidad;ul.append(li)});
    card.append(b,sm,ul);box.append(card);
  });
}
function guardar(){
  const p=pacienteActual();
  if(!p||!$("identity-ok").checked){mensaje("Primero confirma el paciente correcto.","error");return}
  if(!$("visit-date").value||!$("locality").value){mensaje("Completa fecha y localidad.","error");return}
  if(!estado.pendientes.length){mensaje("Agrega una o varias acciones.","error");return}
  const visitas=historial.get(p.id)||[];
  visitas.unshift({fecha:$("visit-date").value,localidad:$("locality").value,acciones:estado.pendientes.map(x=>({area:x.area,accion:x.accion,cantidad:x.cantidad}))});
  historial.set(p.id,visitas);
  estado.pendientes=[];$("identity-ok").checked=false;
  renderPendientes();renderHistorial();
  mensaje("Atención añadida SOLAMENTE a la memoria temporal de esta pestaña. No se guardó ningún dato en Supabase.","ok");
}
function simularOperativo(){
  const n=operativos.length+1;
  const id="OP-DEMO-NUEVO-"+n;
  operativos.push({id,label:id+" · Nuevo operativo ficticio"});
  renderOperativos();
  $("operative").value=id;
  cambiarOperativo();
  mensaje("Operativo creado SOLO para esta demostración en memoria.","ok");
}
function simularPaciente(){
  const op=$("operative").value;
  if(!op){mensaje("Selecciona un operativo primero.","error");return}
  const n=pacientes.length+1;
  const id="P-DEMO-"+String(n).padStart(3,"0");
  pacientes.push({id,op,folio:"DEMO-DS05-"+String(n).padStart(4,"0"),nombre:"Paciente ficticio "+n,edad:30,sexo:"No especificado",municipio:"Navojoa"});
  cambiarOperativo();
  $("patient").value=id;
  renderPersona();
  mensaje("Paciente sintético generado. En producción requerirá formulario y validación de identidad.","ok");
}
function iniciar(){
  renderOperativos();renderAreas();
  $("new-operative").addEventListener("click",simularOperativo);
  $("new-person").addEventListener("click",simularPaciente);
  $("patient").addEventListener("change",()=>{$("identity-ok").checked=false;estado.pendientes=[];renderPersona();renderPendientes();renderHistorial();mensaje("")});
  $("visit-date").value="2026-11-18";
  $("add-action").addEventListener("click",agregar);
  $("save").addEventListener("click",guardar);
  $("clear").addEventListener("click",()=>{estado.pendientes=[];renderPendientes();mensaje("Lista de acciones vaciada.")});
  cambiarOperativo();
}
document.addEventListener("DOMContentLoaded",iniciar);