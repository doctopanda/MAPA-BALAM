/* BALAM 0.10 smoke validation: no browser, no external deps. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const files=['assets/smn-layer.js','assets/drought-layer.js','assets/health-network.js','assets/logistics-route.js','assets/support-catalog.js','assets/travel-budget.js','assets/toll-route-detection.js','assets/denue-services.js','assets/crum-layer.js'];
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
assert(logistics.includes('No consta aceptación de tickets')&&html.includes('solamente las fichas institucionales verificadas'),'No inventar convenio ticket');
const calc=logistics.match(/function compute\([\s\S]*?\n\}/);
assert(calc,'Falta fórmula logística');
const values=vm.runInNewContext(calc[0]+'\ncompute(120,8,25,15)',{});
assert(values.kmRoundtrip===240,'Ida y vuelta incorrecta');
assert(values.liters===30,'Rendimiento incorrecto');
assert(Math.abs(values.litersWithReserve-34.5)<1e-9,'Reserva incorrecta');
assert(Math.abs(values.cost-862.5)<1e-9,'Costo incorrecto');
const src=fs.readFileSync('assets/logistics-route.js','utf8');
assert(html.includes('id="logistics-return"')&&html.includes('id="logistics-show-return"'),'Controles de retorno real faltantes');
assert(src.includes('async function routeReturn()')&&src.includes('const url=')&&src.includes('b.lon+\',\'+b.lat'),'Regreso OSRM independiente falta');
assert(src.includes('outboundKm+(returnKm??outboundKm)'),'Ida+regreso no se suma correctamente');
const support=fs.readFileSync('assets/support-catalog.js','utf8');
const sql=fs.readFileSync('sql/013_route_support_sites_rls.sql','utf8');
for(const id of ['support-catalog','support-admin','support-form','support-f-name','support-f-kind','support-f-ticket','support-f-status','support-f-evidence','support-near-list'])assert(html.includes('id="'+id+'"'),'Formulario catálogo ausente: '+id);
assert(support.includes('window.BALAM_SupabaseClient')&&support.includes('balam_access'),'Sin sesión BALAM');
assert(support.includes("role!=='admin_maestro'")&&support.includes('supabase.from(\'balam_route_support_sites\')'),'Editor Maestro no protegido en UI');
assert(sql.includes('enable row level security')&&sql.includes('balam_private.is_master()')&&sql.includes('balam_route_support_audit'),'Falta protección RLS y bitácora');
assert(src.includes('balam:logistics-route-ready')&&support.includes('balam:logistics-route-ready'),'Falta conectar la ruta a proveedores institucionales');
console.log('BALAM v0.13 QA PASS: retorno independiente y catálogo RLS estructurados');
console.log('BALAM LOGISTICS QA PASS',JSON.stringify({idaKm:120,retornoKm:240,litros:30,conReservaL:34.5,costoMXN:862.5}));

assert(clues.facilities.every(f=>/^26\d{3}$/.test(f.municipality_code)&&f.lat>26&&f.lat<33.5&&f.lon>-115.5&&f.lon< -108));
assert(drought.status==='ok'&&drought.municipalities_count===72&&drought.municipalities.length===72);
assert(drought.municipalities.every(x=>x.category===null||/^D[0-4]$/.test(x.category)));
assert(forecast.status==='ok'&&forecast.municipalities.length===72);
assert(!html.includes('sb_secret_')&&!html.includes('service_role'));
const stats={clues:clues.facility_count,clues_levels:clues.facilities.reduce((o,x)=>(o[x.level||'pending']=(o[x.level||'pending']||0)+1,o),{}),drought_cut:drought.source_cut,drought_categories:drought.categories,forecast_municipalities:forecast.municipalities.length};
console.log('BALAM 0.12 QA PASS',JSON.stringify(stats));

const tariff=JSON.parse(fs.readFileSync('data/capufe/sonora_tarifas_2026.json','utf8'));
assert(tariff.schema==='balam-capufe-sonora-v1'&&tariff.status==='verified_official_tariff_extract');
assert(tariff.valid_from==='2026-04-13'&&tariff.plazas.length===7,'Fuente oficial CAPUFE incompleta');
assert(new Set(tariff.plazas.map(x=>x.id)).size===7,'Duplicación de casetas');
const fund=tariff.plazas.find(x=>x.id==='fundicion');
const esperanza=tariff.plazas.find(x=>x.id==='esperanza');
assert(fund.A===114&&fund.B2===194&&fund.C2===191,'Tarifa Fundición 2026 incorrecta');
assert(esperanza.A===114&&esperanza.C2===190,'Tarifa Esperanza 2026 incorrecta');
for(const p of tariff.plazas)assert(['A','B2','C2'].every(k=>Number.isFinite(p[k])&&p[k]>0),'Tarifas incompletas '+p.name);
const denue=JSON.parse(fs.readFileSync('data/denue/sonora_route_services.json','utf8'));
assert(denue.schema==='balam-denue-sonora-route-v1','Esquema DENUE incompatible');
assert(['awaiting_official_source','validated_official_import'].includes(denue.status),'Estado DENUE inválido');
assert(denue.status!=='awaiting_official_source'||denue.facilities.length===0,'DENUE no debe inventar filas');
const budgetJs=fs.readFileSync('assets/travel-budget.js','utf8'),denueJs=fs.readFileSync('assets/denue-services.js','utf8');
for(const id of ['budget-panel','budget-vehicle-class','budget-viaticos-enabled','budget-food','budget-lodging','budget-other','budget-toll-list','budget-result','budget-download','denue-panel','denue-status','denue-visible'])
 assert(html.includes('id="'+id+'"'),'Control BALAM 0.14 faltante: '+id);
assert(budgetJs.includes('data/capufe/sonora_tarifas_2026.json')&&budgetJs.includes("val('budget-out-'"),'Toll inputs must not be auto-assigned');
assert(budgetJs.includes('includeViaticos?food+lodging+other:0'),'Viáticos opcionales no condicionados');
assert(budgetJs.includes('balam:logistics-return-ready')&&src.includes('balam:logistics-return-ready'),'Ruta de regreso no actualiza presupuesto');
assert(denueJs.includes("doc.status!=='validated_official_import'"),'Falta bloquear DENUE sin fuente oficial');
const fn=budgetJs.match(/function sumBudget\([\s\S]*?\n\}/);
assert(fn,'No se encontró función pura de presupuesto');
const demo=vm.runInNewContext(fn[0]+"\nsumBudget({outKm:120,returnKm:117,kmPerLiter:8,price:25,reserve:15,tollOut:114,tollBack:114,includeViaticos:true,food:220,lodging:0,other:70})",{});
assert(demo.kmTotal===237&&demo.tolls===228&&demo.viatics===290,'Presupuesto desglosado incorrecto');
assert(Math.abs(demo.fuel-851.71875)<0.0001,'Combustible de ruta real incorrecto');
assert(Math.abs(demo.total-1369.71875)<0.0001,'Presupuesto total incorrecto');
const noViatics=vm.runInNewContext(fn[0]+"\nsumBudget({outKm:120,returnKm:117,kmPerLiter:8,price:25,reserve:15,tollOut:114,tollBack:114,includeViaticos:false,food:220,lodging:0,other:70})",{});
assert(noViatics.viatics===0&&Math.abs(noViatics.total-1079.71875)<0.0001,'Toggle de viáticos incorrecto');
console.log('BALAM 0.14 QA PASS CAPUFE tarifas oficiales y viáticos',JSON.stringify({fundicion:fund.A,retornoKm:237,viaticos:290,total:demo.total}));


const rnc=JSON.parse(fs.readFileSync('data/rnc/sonora_plazas_cobro.json','utf8'));
assert(rnc.schema==='balam-rnc-toll-plazas-v1'&&rnc.status==='public_geodata_verified_sample');
assert(rnc.record_count===26&&rnc.plaza_count===15&&rnc.plazas.length===15,'No corresponde a extracción revisada del servicio INEGI');
assert(rnc.plazas.reduce((s,p)=>s+p.points.length,0)===26,'Se perdieron los puntos direccionales RNC');
assert(new Set(rnc.plazas.map(p=>p.id)).size===15,'Duplicados de casetas geográficas');
assert(rnc.plazas.every(p=>p.points.every(x=>Number.isFinite(x.lon)&&Number.isFinite(x.lat)&&x.lat>=26&&x.lat<=33.5&&x.lon>=-115.5&&x.lon<=-108)),'Puntos fuera del marco geográfico de Sonora');
const rncIds=rnc.plazas.flatMap(p=>p.points.map(x=>x.rnc_id));
assert(new Set(rncIds).size===26,'IDs RNC duplicados, posible cobro doble');
const fundRnc=rnc.plazas.find(p=>p.id==='fundicion');
assert(fundRnc.capufe_tariff_id==='fundicion'&&fundRnc.points.length===2&&Math.abs(fundRnc.points[0].lon-(-109.719823478))<1e-6,'Caseta Fundición no concuerda con punto oficial');
assert(rnc.plazas.find(x=>x.id==='obregon_esperanza_hornos').capufe_tariff_id===null,'No vincular tarifa LICO a plaza sin correspondencia inequívoca');
for(const p of rnc.plazas)assert(!p.capufe_tariff_id||tariff.plazas.some(t=>t.id===p.capufe_tariff_id),'Tarifa vinculada sin ficha oficial CAPUFE');
const tollCode=fs.readFileSync('assets/toll-route-detection.js','utf8');
for(const id of ['toll-route-panel','toll-route-list','toll-route-visible','toll-show-all','toll-route-count','toll-route-status'])assert(html.includes('id="'+id+'"'),'Falta control de casetas geográficas: '+id);
assert(tollCode.includes('data/rnc/sonora_plazas_cobro.json')&&tollCode.includes("setCrossing(p.capufe_tariff_id,dir,next)"),'Conexión a CAPUFE no implementada');
assert(tollCode.includes("confidence(match.km)!=='posible_cruce'"),'No se bloquean cobros por mero acercamiento de ruta');
assert(tollCode.includes('if(!match')&&tollCode.includes('tariffData(p)'), 'No se restringe selección a plazas verificadas');
assert(tollCode.includes('balam:logistics-return-ready')&&tollCode.includes('balam:logistics-route-ready'),'No se actualiza al cambiar dirección de ruta');
const nameOfFn=tollCode.match(/function measurePoint\([\s\S]*?\n\}/);
assert(nameOfFn,'No se encontró cálculo de proximidad sobre polilínea');
const testPoint=vm.runInNewContext(nameOfFn[0]+"\nmeasurePoint([-109.719823478,27.320597333],[[-109.8,27.3],[-109.719823478,27.320597333],[-109.6,27.36]])");
assert(testPoint.km<1e-9,'Caseta RNC exacta no cayó sobre la polilínea');
const offPoint=vm.runInNewContext(nameOfFn[0]+"\nmeasurePoint([-113,29],[[-109.8,27.3],[-109.719823478,27.320597333],[-109.6,27.36]])");
assert(offPoint.km>1,'Caseta lejana no se discrimina');
console.log('BALAM 0.15 GEO-TOLLS QA PASS',{rncFeatures:rnc.record_count,groupedPlazas:rnc.plaza_count,priced:rnc.plazas.filter(p=>p.capufe_tariff_id).length});


const road=JSON.parse(fs.readFileSync('data/road-services/sonora_osm_latest.json','utf8'));
assert(road.schema==='balam-road-support-osm-v1','Esquema de apoyos carreteros incorrecto');
assert(['awaiting_public_snapshot','validated_public_snapshot'].includes(road.status),'Estado de catálogo offline no explícito');
if(road.status==='validated_public_snapshot'){
 assert(road.record_count===road.facilities.length&&road.record_count>=30,'Corte OSM incompleto');
 assert(road.counts.fuel>=8&&road.counts.repair>=3,'Faltan clases mínimas de servicios');
 assert(road.facilities.every(x=>/^26\d{3}$/.test(x.municipality_code)&&['fuel','tire','repair'].includes(x.category)&&x.lat>26&&x.lat<33.5&&x.lon> -115.5&&x.lon< -108),'Establecimientos fuera de Sonora o categorías inválidas');
}
assert(logistics.includes('sonora_osm_latest.json')&&logistics.includes('pointsFromCatalog(coords)'),'No se consultan servicios en catálogo local');
assert(logistics.includes("['fuel','tire','repair','health'].flatMap"),'CLUES podrían ocultar gasolineras');
assert(html.includes('id="logistics-catalog-status"'),'Falta estado visible de catálogo offline');
console.log('BALAM 0.16 ROAD CACHE QA PASS',JSON.stringify({status:road.status,count:road.record_count}));
