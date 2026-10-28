#!/usr/bin/env python3
"""Convertir CSV/ZIP oficial DENUE Sonora a índice ligero de servicios de ruta.

Uso:
  python scripts/import_denue_sonora.py --source /carpeta/denue_sonora_2026.zip
Requiere el archivo descargado oficialmente. No solicita token ni inventa filas.
"""
import argparse,csv,datetime as dt,io,json,re,unicodedata,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data/denue/sonora_route_services.json"
CODES={"468411":"fuel","811191":"tire","811111":"repair","811112":"repair","811116":"repair","468213":"tire"}
def norm(s):
 return re.sub(r"[^a-z0-9]","",unicodedata.normalize("NFKD",str(s)).encode("ascii","ignore").decode().lower())
def get(row,aliases):
 for a in aliases:
  key=norm(a)
  for k,v in row.items():
   if norm(k)==key:return str(v or "").strip()
 return ""
def number(s):
 try:return float(str(s).replace(",","."))
 except (TypeError,ValueError):return None
def source_files(path):
 if path.suffix.lower()==".zip":
  with zipfile.ZipFile(path) as z:
   for name in z.namelist():
    if name.lower().endswith(".csv") and not name.startswith("__MACOSX"):
     data=z.read(name)
     if len(data)>300_000_000:raise ValueError("CSV demasiado grande")
     yield name,data
 else:
  yield path.name,path.read_bytes()
def rows(data):
 for enc in ("utf-8-sig","cp1252","latin-1"):
  try:txt=data.decode(enc);break
  except UnicodeDecodeError:continue
 head=txt[:5000]
 dialect=csv.Sniffer().sniff(head,delimiters=",;|\t") if any(c in head for c in ",;|\t") else csv.excel
 return csv.DictReader(io.StringIO(txt),dialect=dialect)
def normalize(data):
 codes=set(),None
 items={}
 counters={"out_of_sonora":0,"invalid_location":0,"not_target_sciAN":0,"missing_id":0,"invalid_municipality":0}
 for row in data:
  scian=get(row,["codigo_act","codigo_actividad","scian","codigo_scian","id_clase_actividad"]).replace(".0","")
  if scian not in CODES:counters["not_target_sciAN"]+=1;continue
  ent=get(row,["cve_ent","cve_entidad","entidad_clave","clave_entidad","cveent"])
  ename=get(row,["entidad","nombre_entidad","nom_entidad","estado"])
  mun=get(row,["cve_mun","cve_municipio","clave_municipio","cvemun"])
  if mun.isdigit():mun=mun.zfill(3)
  if not (ent in ("26","026") or norm(ename)=="sonora"):
   counters["out_of_sonora"]+=1;continue
  if not re.fullmatch(r"\d{3}",mun or ""):counters["invalid_municipality"]+=1;continue
  ident=get(row,["id","id_establecimiento","id_estab","identificador"])
  if not ident:counters["missing_id"]+=1;continue
  lat=number(get(row,["latitud","lat","latitud_establecimiento"]))
  lon=number(get(row,["longitud","lon","lng","longitud_establecimiento"]))
  if lat is None or lon is None or not(26<lat<33.5 and -115.5<lon<-108):
   counters["invalid_location"]+=1;continue
  name=get(row,["nom_estab","nombre_establecimiento","nombre_unidad_economica","nombre"])
  if not name:name="Establecimiento sin nombre publicado"
  item={"id":"DENUE:"+str(ident),"source":"DENUE","name":name[:140],"category":CODES[scian],"scian":scian,
  "municipality_code":"26"+mun,"municipality":get(row,["municipio","nom_mun","nombre_municipio"])[:100],
  "address":" ".join(filter(None,[get(row,["tipo_vial","tipo_vialidad"]),get(row,["nom_vial","nombre_vialidad"]),get(row,["numero_ext","num_ext"])]))[:180],
  "phone":get(row,["telefono","tel"])[:90],"lat":round(lat,6),"lon":round(lon,6)}
  items[item["id"]]=item
 return items,counters
def main():
 p=argparse.ArgumentParser();p.add_argument("--source",required=True,type=Path);p.add_argument("--out",type=Path,default=OUT)
 args=p.parse_args()
 if not args.source.is_file():raise SystemExit("No existe fuente oficial: "+str(args.source))
 found={};total=0;files=0;issues=[]
 for filename,raw in source_files(args.source):
  files+=1
  try:items,stats=normalize(rows(raw))
  except Exception as exc:raise RuntimeError("No se pudo leer "+filename+": "+str(exc)) from exc
  total+=sum(stats.values())+len(items)
  found.update(items);issues.append({"filename":filename,"parsed":len(items),"excluded":stats})
 if not found:raise SystemExit("CERO filas DENUE válidas. Revisar que el archivo sea exportación 2026, que incluya Sonora y encabezados correctos. No se sobrescribe catálogo.")
 result={"schema":"balam-denue-sonora-route-v1","status":"validated_official_import","source":"INEGI DENUE · carga de exportación oficial","source_url":"https://www.inegi.org.mx/app/descarga/?ti=6",
 "source_cut":"2026-05","extracted_at":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
 "source_filename":args.source.name,"counts":{c:sum(r["category"]==c for r in found.values()) for c in ("fuel","tire","repair")},
 "quality":{"processed_files":files,"input_rows_estimate":total,"details":issues},
 "disclaimer":"Directorios administrativos, no confirman operación actual, existencias, apertura, acceso vial, tickets ni convenio.",
 "facilities":sorted(found.values(),key=lambda r:r["id"])}
 args.out.parent.mkdir(parents=True,exist_ok=True)
 tmp=args.out.with_suffix(".tmp");tmp.write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
 tmp.replace(args.out)
 print("DENUE OK",len(found),result["counts"],"salida",args.out)
if __name__=="__main__":main()
