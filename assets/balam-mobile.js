/* BALAM Mobile v0.18: navegación táctil accesible sin duplicar mapa ni datos. */
(()=>{
'use strict';
const mq=window.matchMedia('(max-width:900px)');
const aside=document.querySelector('.shell aside');
const shell=document.querySelector('.shell');
if(!aside||!shell)return;
const bar=document.createElement('nav');
bar.id='balamMobileBar';bar.setAttribute('aria-label','Navegación móvil BALAM');
const tabs=[['map','🗺️','Mapa'],['detail','📍','Municipio'],['layers','☷','Capas']];
for(const [id,icon,name] of tabs){
 const b=document.createElement('button');b.type='button';b.dataset.mobileTab=id;
 b.innerHTML='<span aria-hidden="true">'+icon+'</span>'+name;
 b.setAttribute('aria-label',name);bar.append(b);
}
shell.append(bar);
const heading=document.createElement('div');heading.id='balamMobileHeading';
heading.innerHTML='<span id="balamMobileTitle">Municipio</span><button id="balamMobileClose" type="button" aria-label="Cerrar panel">✕</button>';
aside.prepend(heading);
let current='map';
function activate(tab){
 if(!mq.matches)return;
 current=tab;
 document.body.classList.toggle('balam-mobile-sheet',tab!=='map');
 document.body.classList.toggle('balam-mobile-detail',tab==='detail');
 bar.querySelectorAll('button').forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.mobileTab===tab)));
 document.getElementById('balamMobileTitle').textContent=tab==='detail'?'📍 Ficha del municipio':'☷ Capas y herramientas';
 if(tab==='detail'){
  const fold=document.getElementById('detail')?.closest('details');
  if(fold)fold.open=true;
 }
 aside.scrollTop=0;
 const map=window.BALAM_SmnMap?.map;
 if(map)requestAnimationFrame(()=>map.invalidateSize({pan:false}));
}
bar.addEventListener('click',ev=>{
 const btn=ev.target.closest('button[data-mobile-tab]');
 if(btn)activate(btn.dataset.mobileTab);
});
document.getElementById('balamMobileClose').addEventListener('click',()=>activate('map'));
window.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&mq.matches&&current!=='map')activate('map')});
document.getElementById('map')?.addEventListener('click',ev=>{
 if(!mq.matches)return;
 if(ev.target.closest('.leaflet-interactive')||ev.target.closest('.leaflet-marker-icon')){
  // La ficha se abre tras la selección municipal en el motor de Leaflet.
  requestAnimationFrame(()=>{
   const d=document.getElementById('detail');
   if(d?.querySelector('.detail-title')?.textContent!=='Elige un municipio activo')activate('detail');
  });
 }
});
window.BALAM_Mobile={open:activate,getTab:()=>current};
if(mq.addEventListener)mq.addEventListener('change',()=>{if(!mq.matches){document.body.classList.remove('balam-mobile-sheet','balam-mobile-detail')}else activate('map')});
activate('map');
})();
