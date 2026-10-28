#!/usr/bin/env python3
"""SMN Monitor de Sequía: 72 municipios Sonora, último corte fechado.
No inferir 'no sequía' de una celda vacía sin explicitar esa semántica.
"""
import datetime as dt
import json
import os
import re
import urllib.request
from pathlib import Path
from clues_sonora import excel_rows
ROOT=Path(__file__).resolve().parents[1]
SRC="https://smn.conagua.gob.mx/tools/RESOURCES/Monitor%20de%20Sequia%20en%20Mexico/MunicipiosSequia.xlsx"
OUT=ROOT/"data/smn/sonora_drought_latest.json"
CATEGORIES={"D0":"Anormalmente seco","D1":"Sequía moderada","D2":"Sequía severa","D3":"Sequía extrema","D4":"Sequía excepcional"}
def main():
 req=urllib.request.Request(SRC,headers={"User-Agent":"BALAM-Sonora/0.10 (https://github.com/doctopanda/MAPA-BALAM)"})
 with urllib.request.urlopen(req,timeout=90) as r:raw=r.read(18_000_001)
 if len(raw)>18_000_000:raise RuntimeError("XLSX de sequía mayor al límite")
 rows=iter(excel_rows(raw))
 header=next(rows)
 options=[]
 for i,v in enumerate(header):
  try:
   n=int(float(str(v)))
   if n<39000 or n>60000:continue
   date=(dt.datetime(1899,12,30)+dt.timedelta(days=n)).date()
   if date<=dt.datetime.now(dt.timezone.utc).date():options.append((date,i))
  except (ValueError,TypeError,OverflowError):pass
 if not options:raise ValueError("No se detectó fecha Excel válida")
 cut,col=max(options)
 if (dt.datetime.now(dt.timezone.utc).date()-cut).days>50:
  raise ValueError("El monitor municipal está demasiado antiguo: "+str(cut))
 mapping={}
 for row in rows:
  if len(row)<4 or str(row[1]).zfill(2)!="26":continue
  code=str(row[2]).strip().zfill(3)
  if not re.fullmatch(r"\d{3}",code):continue
  key="26"+code
  category=(str(row[col]).strip().upper() if len(row)>col else "")
  if category and category not in CATEGORIES:
   raise ValueError(f"Categoría desconocida: {category} en {key}")
  mapping[key]={"code":key,"name":str(row[3]).strip(),
    "category":category if category else None,
    "description":CATEGORIES.get(category,"Sin categoría D0–D4 registrada en el corte"),
    "has_reported_drought":category in {"D1","D2","D3","D4"}}
 if len(mapping)!=72:raise ValueError("No hay 72 municipios de Sonora: "+str(len(mapping)))
 counts={k:sum(x["category"]==k for x in mapping.values()) for k in CATEGORIES}
 counts["sin_categoria"]=sum(x["category"] is None for x in mapping.values())
 snapshot={"schema":"balam-smn-drought-v1","status":"ok","source":"SMN / Monitor de Sequía en México",
 "source_url":SRC,"source_cut":cut.isoformat(),"extracted_at":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
 "municipalities_count":72,"categories":counts,
 "interpretation":"D0 = anormalmente seco; D1–D4 = sequía; sin categoría = no aparece categoría en corte para ese municipio (no sustituye análisis de vulnerabilidad).",
 "caution":"Monitor quincenal; no es pronóstico de precipitación ni riesgo hidrológico inmediato.",
 "municipalities":sorted(mapping.values(),key=lambda x:x["code"])}
 OUT.parent.mkdir(parents=True,exist_ok=True)
 tmp=OUT.with_suffix(".tmp")
 tmp.write_text(json.dumps(snapshot,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
 tmp.replace(OUT)
 print("SMN SEQUIA",cut,counts,"municipios",len(mapping),"bytes",len(raw))
if __name__=="__main__":main()
