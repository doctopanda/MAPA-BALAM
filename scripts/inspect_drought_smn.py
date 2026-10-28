#!/usr/bin/env python3
"""Inspect official SMN municipalities drought workbook, without making risk claims."""
import json,sys,urllib.request
from clues_sonora import excel_rows
URL="https://smn.conagua.gob.mx/tools/RESOURCES/Monitor%20de%20Sequia%20en%20Mexico/MunicipiosSequia.xlsx"
r=urllib.request.Request(URL,headers={"User-Agent":"BALAM-Observatorio/0.10"})
with urllib.request.urlopen(r,timeout=85) as res: buf=res.read(22*1024*1024)
print("SOURCE_BYTES",len(buf))
for i,row in enumerate(excel_rows(buf)):
    if i==0:print("HEADER_END",len(row),json.dumps(row[-16:],ensure_ascii=False))
    if str(row[1] if len(row)>1 else "").zfill(2)=="26":
        print("SONORA",i,"cols",len(row),"municipio",row[3],"latest",json.dumps(row[-16:],ensure_ascii=False))
    if i>2200:break
