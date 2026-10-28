/* BALAM CONAPO · proyección municipal 2015-2030. Solo agregados, archivo proporcionado por usuario. */
(()=>{
'use strict';
const URL='data/conapo/sonora_municipios_2015_2030.b64';
let dataset=null,byCode=new Map(),error=null,ready=false;
const notify=()=>window.dispatchEvent(new Event('balam:conapo-ready'));
const valid=doc=>{
 if(doc?.schema!=='balam-conapo-municipal-v1'||doc.years?.length!==16||doc.ageGroups?.length!==14||doc.profiles?.length!==72||doc.ageSnapshotYear!==2026)return false;
 const seen=new Set();
 for(const row of doc.profiles){
  const [code,trend,male,female]=row;
  if(!/^26\d{3}$/.test(code)||seen.has(code)||trend?.length!==16||male?.length!==14||female?.length!==14)return false;
  const all=[...trend,...male,...female];
  if(!all.every(n=>Number.isSafeInteger(n)&&n>=0))return false;
  if(male.reduce((a,b)=>a+b,0)+female.reduce((a,b)=>a+b,0)!==trend[2026-2015])return false;
  seen.add(code);
 }
 return true;
};
async function load(){
 try{
  if(typeof DecompressionStream!=='function')throw Error('Navegador sin descompresión de datos');
  const response=await fetch(URL,{cache:'force-cache'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const encoded=(await response.text()).trim();
  const raw=atob(encoded);
  const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  const decoded=await new Response(stream).text();
  const doc=JSON.parse(decoded);
  if(!valid(doc))throw Error('Integridad CONAPO inválida');
  dataset=doc;
  byCode=new Map(doc.profiles.map(([code,trend,male,female])=>[code,{trend,male,female}]));
  ready=true;error=null;notify();
 }catch(ex){dataset=null;ready=false;error=String(ex.message||ex);notify();}
}
window.BALAM_CONAPO={
 getMunicipality:code=>byCode.get(String(code))||null,
 getYears:()=>dataset?.years||[],
 getAgeGroups:()=>dataset?.ageGroups||[],
 getSnapshotYear:()=>dataset?.ageSnapshotYear||2026,
 getStatus:()=>({ready,error,records:byCode.size,source:dataset?.source||'Archivo CONAPO aportado para BALAM'})
};
load();
})();