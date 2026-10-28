#!/usr/bin/env python3
"""Inspect official SMN municipalities drought workbook, without making risk claims."""
import json,sys,urllib.request
from clues_sonora import excel_rows
URL="https://smn.conagua.gob.mx/tools/RESOURCES/Monitor%20de%20Sequia%20en%20Mexico/MunicipiosSequia.xlsx"
r=urllib.request.Request(URL,headers={"User-Agent":"BALAM-Observatorio/0.10"})
with urllib.request.urlopen(r,timeout=85) as res: buf=res.read(22*1024*1024)
print("SOURCE_BYTES",len(buf))
for i,row in enumerate(excel_rows(buf)):
    print("ROW",i,json.dumps(row[:28],ensure_ascii=False)[:1800])
    if i>=23:break
