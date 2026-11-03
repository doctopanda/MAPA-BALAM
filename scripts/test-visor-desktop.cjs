/* BALAM dual visor: smoke de escritorio con datos públicos reales. */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync('escritorio/index.html','utf8');
const src=fs.readFileSync('escritorio/app.js','utf8');
const elements=new Map();
class ClassList{
 constructor(){this.values=new Set()}
 add(x){this.values.add(x)}
 remove(x){this.values.delete(x)}
 toggle(x,on){if(on===undefined)on=!this.values.has(x);on?this.values.add(x):this.values.delete(x)}
 contains(x){return this.values.has(x)}
}
class Node{
 constructor(id,data={}){this.id=id;this.dataset=data;this.textContent='';this.innerHTML='';this.value='';this.hidden=false;this.children=[];this.attrs={};this.listeners={};this.classList=new ClassList()}
 addEventListener(t,cb){this.listeners[t]=cb}
 replaceChildren(...v){this.children=v;this.value=v[0]?.value||''}
 add(x){this.children.push(x);if(!this.value)this.value=x.value}
 setAttribute(k,v){this.attrs[k]=v}
}
for(const m of html.matchAll(/id="([a-zA-Z][a-zA-Z0-9-]*)"/g))elements.set(m[1],new Node(m[1]));
const nav=[...html.matchAll(/data-tab="([^"]+)"/g)].map(m=>new Node('nav-button',{tab:m[1]}));
const listeners={};
const doc={getElementById:id=>elements.get(id),querySelectorAll:q=>q==='#classicNav [data-tab]'?nav:[],addEventListener:(name,cb)=>listeners[name]=cb};
const callbacks={};
const fetcher=async url=>{
 const file=path.normalize(String(url).replace(/^\.\.\//,''));
 if(file.startsWith('..')||file.startsWith('http'))throw Error('unsafe mock URL '+url);
 return new Response(fs.readFileSync(file),{status:200});
};
const windowMock={DecompressionStream,scrollTo:()=>{},addEventListener:(t,cb)=>callbacks[t]=cb};
const loc={hash:'',href:'https://doctopanda.github.io/MAPA-BALAM/escritorio/',protocol:'https:'};
vm.runInNewContext(src,{document:doc,window:windowMock,location:loc,history:{replaceState:()=>{}},fetch:fetcher,DecompressionStream,Blob,Response,Uint8Array,atob,Option:function(label,value){this.label=label;this.value=value}}, {filename:'escritorio/app.js'});
const e=id=>{assert(elements.has(id),'missing DOM id '+id);return elements.get(id)};
async function main(){
 for(let i=0;i<40&&!e('content').innerHTML;i++)await new Promise(ok=>setTimeout(ok,30));
 assert(e('content').innerHTML.includes('13,116'),'Public panorama DS05 missing');
 assert(e('content').innerHTML.includes('CONAPO'),'Missing demographic sources');
 assert(nav.length===19,'Original desktop module menu incomplete');
 assert(html.includes('href="../visor/"'),'No desktop-to-webapp link');
 nav.find(x=>x.dataset.tab==='cecosabi').listeners.click();
 assert(e('pageTitle').textContent==='CECOSABI','CECOSABI module routing broken');
 assert(e('content').innerHTML.includes('977'),'CECOSABI real saneamiento missing');
 nav.find(x=>x.dataset.tab==='inteligencia').listeners.click();
 assert(e('content').innerHTML.includes('Vigilancia epidemiológica'),'Inteligencia modules missing');
 nav.find(x=>x.dataset.tab==='tablas').listeners.click();
 assert(e('content').innerHTML.includes('Navojoa'),'Public municipal table missing');
 e('district').listeners.change({target:{value:'DS01'}});
 assert(e('loadStatus').textContent.includes('Sin corte SIESA publicado'),'Non-DS05 data must remain unavailable');
 nav.find(x=>x.dataset.tab==='acciones').listeners.click();
 assert(e('content').innerHTML.includes('no dispone de un corte'),'No-cut unit warning absent');
 nav.find(x=>x.dataset.tab==='auditor').listeners.click();
 assert(e('content').innerHTML.includes('HTML local'),'Protected local audit notice missing');
 console.log('BALAM DESKTOP PUBLIC QA PASS',{classicSections:nav.length,districts:6,data:'public-aggregates'});
}
main().catch(error=>{console.error(error);process.exitCode=1});
