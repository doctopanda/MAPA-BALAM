/* BALAM Visor v6.1: smoke test interactivo sobre DOM sintético y fuentes reales locales. */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync('visor/index.html','utf8');
const source=fs.readFileSync('visor/app.js','utf8');
const map=new Map(),listeners=new Map();
class ClassList{
 constructor(){this.tags=new Set()}
 toggle(name,yes){if(yes===undefined)yes=!this.tags.has(name);yes?this.tags.add(name):this.tags.delete(name);return yes}
}
class Node{
 constructor(id,dataset={}){this.id=id;this.dataset=dataset;this.hidden=false;this.disabled=false;this.value='';this.innerHTML='';this.textContent='';this.children=[];this.listeners={};this.attributes={};this.classList=new ClassList()}
 replaceChildren(...nodes){this.children=[...nodes];this.value=nodes[0]?.value||''}
 add(node){this.children.push(node);if(!this.value)this.value=node.value}
 addEventListener(name,cb){this.listeners[name]=cb}
 setAttribute(k,v){this.attributes[k]=v}
 removeAttribute(k){delete this.attributes[k]}
 closest(){return null}
}
const ids=[...html.matchAll(/id="([A-Za-z][A-Za-z0-9-]*)"/g)].map(x=>x[1]);
for(const id of ids)map.set(id,new Node(id));
const bottom=[...html.matchAll(/<button[^>]+data-screen="([^"]+)"/g)].map(x=>new Node('button',{screen:x[1]}));
const topics=[...html.matchAll(/<button[^>]+data-go="([^"]+)"/g)].map(x=>new Node('button',{go:x[1]}));
const doc={
 getElementById:id=>map.get(id)||null,
 querySelectorAll:query=>query==='.bottom button'?bottom:query==='.topic-strip button[data-go]'?topics:query==='[data-go]'?topics:query==='[data-screen]'?bottom:[],
 addEventListener:(type,cb)=>listeners.set(type,cb),
 documentElement:{scrollTop:0}
};
const fakeFetch=async url=>{
 let p=String(url).replace(/^\.\.\//,'');
 p=path.normalize(p);
 if(p.startsWith('http')||p.includes('..'))throw Error('Unsafe test fetch '+url);
 const bytes=fs.readFileSync(p);
 return new Response(bytes,{status:200,headers:{'content-type':p.endsWith('.json')?'application/json':'text/plain'}});
};
const sandbox={document:doc,window:{DecompressionStream,scrollTo:()=>{}},
 location:{href:'https://doctopanda.github.io/MAPA-BALAM/visor/',protocol:'https:'},
 navigator:{},URL,Option:function(label,value){this.label=label;this.value=value},
 fetch:fakeFetch,DecompressionStream,Blob,Response,Uint8Array,atob,console};
vm.runInNewContext(source,sandbox,{filename:'visor/app.js'});
const n=id=>{assert(map.has(id),'Missing HTML id '+id);return map.get(id)};
async function check(){
 for(let i=0;i<30&&!n('kpis').innerHTML;i++)await new Promise(resolve=>setTimeout(resolve,40));
 assert(n('warning').hidden,'Unexpected data loading error: '+n('warning').textContent);
 assert(n('kpis').innerHTML.includes('13,116'),'DS05 KPIs were not rendered');
 assert(n('homeInsights').innerHTML.includes('2026'),'Missing contextual insight cards');
 assert(n('homeOperations').innerHTML.includes('Atención médica'),'Missing SIESA operational summaries');
 assert(n('homeGolipca').innerHTML.includes('CECOSABI'),'No GOLIPCA navigation');
 assert(n('modulesGrid').innerHTML.includes('MUESTRAS EBT'),'Missing module catalog');
 assert(n('siesaAreaBars').innerHTML.includes('Vigilancia epidemiológica'),'SIESA area chart missing');
 assert(n('municipalCharts').innerHTML.includes('Pirámide'),'CONAPO demographic chart missing');
 assert(bottom.length===5&&bottom.some(b=>b.dataset.screen==='golipca'),'Five navigation tabs required');
 bottom.find(b=>b.dataset.screen==='golipca').listeners.click();
 assert(!n('panel-golipca').hidden&&n('panel-home').hidden,'Mobile navigation failed');
 listeners.get('click')({target:{closest:sel=>sel==='[data-goli]'?{dataset:{goli:'C'}}:null}});
 assert(n('goliTitle').textContent.includes('CECOSABI'),'GOLIPCA C tab not opened');
 assert(n('goliKpis').innerHTML.includes('977'),'Real CECOSABI public data missing');
 listeners.get('click')({target:{closest:sel=>sel==='[data-goli]'?{dataset:{goli:'I'}}:null}});
 assert(n('goliBars').innerHTML.includes('Vigilancia'),'Inteligencia eje missing');
 n('district').listeners.change({target:{value:'DS01'}});
 assert(n('indicatorBars').innerHTML.includes('Sin corte'),'Non-DS05 should not invent SIESA cuts');
 assert(n('goliBars').innerHTML.includes('No hay corte público'),'Non-DS05 GOLIPCA needs no-data');
 assert(n('kpis').innerHTML.includes('Población'),'District CONAPO cards missing');
 bottom.find(b=>b.dataset.screen==='modules').listeners.click();
 assert(!n('panel-modules').hidden&&n('panel-golipca').hidden,'Module tab failed');
 console.log('BALAM VISOR v6.1 INTERACTIVE QA PASS',{tabs:bottom.length,golipca:7,publicCut:'DS05 · 2026-10-12'});
}
check().catch(e=>{console.error(e);process.exitCode=1});
