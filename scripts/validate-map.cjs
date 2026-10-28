/* BALAM 0.10 smoke validation: no browser, no external deps. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const files=['assets/smn-layer.js','assets/drought-layer.js','assets/health-network.js','assets/logistics-route.js','assets/crum-layer.js'];
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
assert(clues.facilities.every(f=>typeof f.municipality_name==='string'&&f.municipality_name.length>=2),'CLUES: municipios deben tener nombre');
const healthJs=fs.readFileSync('assets/health-network.js','utf8');
const crumJs=fs.readFileSync('assets/crum-layer.js','utf8');
assert(healthJs.includes("x==='1'?'2':x==='2'?'3':null"),'Regla 1-2 y 2-3 no implementada');
assert(healthJs.includes("f.status_source==='EN OPERACION'"),'Filtrado por estatus faltante');
assert(healthJs.includes("m.on('click',()=>selectOnMap(f))"),'Selección de establecimientos sobre mapa ausente');
assert(healthJs.includes('jaguarIcon()')&&healthJs.includes('assets/brand/jaguar-pin-ruta-balam.webp'),'Pin del jaguar en ruta faltante');
assert(fs.existsSync('assets/brand/jaguar-pin-ruta-balam.webp'),'Archivo visual del pin no existe');
assert(fs.readFileSync('assets/brand/jaguar-pin-ruta-balam.webp').slice(0,4).toString()==='RIFF','Pin no es WebP valido');
assert(!healthJs.includes('balam-jaguar-clip'),'Persistió el cuadro recortado antiguo');
assert(healthJs.includes('health-house-icon'),'Casitas por nivel ausentes');
assert(crumJs.includes('ambulanceIcon(ar.length)'),'Iconos de ambulancia CRUM ausentes');

const logistics=fs.readFileSync('assets/logistics-route.js','utf8');
for(const id of ['logistics-panel','logistics-efficiency','logistics-price','logistics-reserve','logistics-output','logistics-query','logistics-fuel','logistics-tire','logistics-repair','logistics-health','logistics-status','logistics-summary','logistics-list'])assert(html.includes('id="'+id+'"'),'Falta control logístico '+id);
assert(healthJs.includes('BALAM_Logistics?.onRoute')&&healthJs.includes('BALAM_Logistics?.reset'),'Ruta sin integración logística');
assert(logistics.includes("e('logistics-query').addEventListener('click',search)"),'Overpass no es a petición');
assert(logistics.includes("method:'POST'")&&logistics.includes('overpass-api.de/api/interpreter'),'Servicios de ayuda no preparados');
assert(logistics.includes('BALAM_Health?.getFacilities'),'Capa de unidades CLUES en ruta faltante');
assert(logistics.includes('No consta aceptación de tickets')&&html.includes('aún sin catálogo institucional verificado'),'No inventar convenio ticket');
const calc=logistics.match(/function compute\([\s\S]*?\n\}/);
assert(calc,'Falta fórmula logística');
const values=vm.runInNewContext(calc[0]+'\ncompute(120,8,25,15)',{});
assert(values.kmRoundtrip===240,'Ida y vuelta incorrecta');
assert(values.liters===30,'Rendimiento incorrecto');
assert(Math.abs(values.litersWithReserve-34.5)<1e-9,'Reserva incorrecta');
assert(Math.abs(values.cost-862.5)<1e-9,'Costo incorrecto');
console.log('BALAM LOGISTICS QA PASS',JSON.stringify({idaKm:120,retornoKm:240,litros:30,conReservaL:34.5,costoMXN:862.5}));

assert(clues.facilities.every(f=>/^26\d{3}$/.test(f.municipality_code)&&f.lat>26&&f.lat<33.5&&f.lon>-115.5&&f.lon< -108));
assert(drought.status==='ok'&&drought.municipalities_count===72&&drought.municipalities.length===72);
assert(drought.municipalities.every(x=>x.category===null||/^D[0-4]$/.test(x.category)));
assert(forecast.status==='ok'&&forecast.municipalities.length===72);
assert(!html.includes('sb_secret_')&&!html.includes('service_role'));
const stats={clues:clues.facility_count,clues_levels:clues.facilities.reduce((o,x)=>(o[x.level||'pending']=(o[x.level||'pending']||0)+1,o),{}),drought_cut:drought.source_cut,drought_categories:drought.categories,forecast_municipalities:forecast.municipalities.length};
console.log('BALAM 0.12 QA PASS',JSON.stringify(stats));