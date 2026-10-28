/* BALAM 0.10 smoke validation: no browser, no external deps. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const files=['assets/smn-layer.js','assets/drought-layer.js','assets/health-network.js','assets/crum-layer.js'];
const html=fs.readFileSync('index.html','utf8');
for(const [i,script] of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/ig)].entries()){
 if(!/\bsrc=/.test(script[1]))new vm.Script(script[2],{filename:'index inline '+i});
}
for(const path of files){let src=fs.readFileSync(path,'utf8');if(src.startsWith('import '))src=src.slice(src.indexOf('\n')+1);new vm.Script(src,{filename:path})}
for(const id of ['smn-panel','smn-sonora-summary','smnDroughtInfo','drought-visible','health-panel','health-visible','health-status-filter','health-level','route-origin','route-destination','route-go','route-demo-consent','smnMunicipalInfo']){
 if(id==='smnDroughtInfo')assert(fs.readFileSync('assets/smn-layer.js','utf8').includes(id),'missing dynamic '+id);else if(id==='smnMunicipalInfo')assert(html.includes(id),'missing dynamic '+id);
 else assert(html.includes('id="'+id+'"'),'missing '+id);
}
const clues=JSON.parse(fs.readFileSync('data/health/sonora_latest.json','utf8'));
const drought=JSON.parse(fs.readFileSync('data/smn/sonora_drought_latest.json','utf8'));
const forecast=JSON.parse(fs.readFileSync('data/smn/sonora_latest.json','utf8'));
assert(clues.status==='ok'&&clues.facility_count===clues.facilities.length&&clues.facility_count>=150);
assert(new Set(clues.facilities.map(x=>x.clues)).size===clues.facility_count);
assert(clues.facilities.every(f=>/^26\d{3}$/.test(f.municipality_code)&&f.lat>26&&f.lat<33.5&&f.lon>-115.5&&f.lon< -108));
assert(drought.status==='ok'&&drought.municipalities_count===72&&drought.municipalities.length===72);
assert(drought.municipalities.every(x=>x.category===null||/^D[0-4]$/.test(x.category)));
assert(forecast.status==='ok'&&forecast.municipalities.length===72);
assert(!html.includes('sb_secret_')&&!html.includes('service_role'));
const stats={clues:clues.facility_count,clues_levels:clues.facilities.reduce((o,x)=>(o[x.level||'pending']=(o[x.level||'pending']||0)+1,o),{}),drought_cut:drought.source_cut,drought_categories:drought.categories,forecast_municipalities:forecast.municipalities.length};
console.log('BALAM 0.10 QA PASS',JSON.stringify(stats));