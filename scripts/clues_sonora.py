#!/usr/bin/env python3
"""Official CLUES monthly export -> public geographic Sonora health-facility index.
Source URL confirmed on gobi.salud.gob.mx/Bases_Clues.html.
Standard library only. Fail closed on unknown header/schema.
"""
import argparse
import datetime as dt
import io
import json
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INPUT="https://gobi.salud.gob.mx/historico_clues/ESTABLECIMIENTO_SALUD_202609.xlsx?v=1.1"
TARGET=ROOT/"data/health/sonora_latest.json"
DISTRICTS=ROOT/"data/districts.json"
WEATHER=ROOT/"data/smn/sonora_latest.json"
NS="{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
MAX_MB=40

def norm(s):
    s=unicodedata.normalize("NFKD",str(s or "")).encode("ascii","ignore").decode().upper()
    return re.sub(r"\s+"," ",re.sub(r"[^A-Z0-9 ]"," ",s)).strip()

def cell_value(c,strings):
    typ=c.get("t")
    if typ=="inlineStr":
        return "".join((x.text or "") for x in c.iter(NS+"t"))
    v=c.find(NS+"v")
    if v is None:return ""
    if typ=="s":
        try:return strings[int(v.text)]
        except (TypeError,ValueError,IndexError):return ""
    return v.text or ""

def excel_rows(raw):
    z=zipfile.ZipFile(io.BytesIO(raw))
    strings=[]
    if "xl/sharedStrings.xml" in z.namelist():
        with z.open("xl/sharedStrings.xml") as stream:
            for event,node in ET.iterparse(stream,events=("end",)):
                if node.tag==NS+"si":
                    strings.append("".join((v.text or "") for v in node.iter(NS+"t")))
                    node.clear()
    sheets=sorted([x for x in z.namelist() if re.fullmatch(r"xl/worksheets/sheet\d+\.xml",x)],key=lambda x:int(re.search(r"sheet(\d+)",x).group(1)))
    for sheet in sheets:
        with z.open(sheet) as stream:
            for _,row in ET.iterparse(stream,events=("end",)):
                if row.tag!=NS+"row":continue
                values={}
                for c in row.findall(NS+"c"):
                    a=re.match(r"[A-Z]+",c.get("r",""))
                    if not a:continue
                    idx=0
                    for char in a.group():idx=idx*26+ord(char)-64
                    values[idx-1]=cell_value(c,strings)
                if values:
                    yield [values.get(i,"") for i in range(max(values)+1)]
                row.clear()

def field_index(head,fragments):
    for frag in fragments:
        for idx,value in enumerate(head):
            if norm(value)==frag:return idx
    for frag in fragments:
        for idx,value in enumerate(head):
            if frag in norm(value):return idx
    return None

def choose_header(rows):
    inspected=[]
    for row in rows:
        inspected.append(row)
        hdr=[norm(x) for x in row]
        idx=field_index(hdr,["CLUES","CLAVE UNICA DE ESTABLECIMIENTOS DE SALUD","CLAVE UNICA"])
        if idx is not None and any("NOMBRE" in x and ("UNIDAD" in x or "ESTABLECIMIENTO" in x) for x in hdr):
            return hdr,rows
        if len(inspected)>=35:
            sample=[" | ".join(norm(x) for x in r[:20])[:350] for r in inspected[:12]]
            raise ValueError("Encabezado CLUES no encontrado. Primeras filas: "+str(sample))
    raise ValueError("Sin encabezado de catálogo")

def read(row,i):
    return str(row[i] if i is not None and i<len(row) else "").strip()

def num(v):
    try:return float(str(v).replace(",","."))
    except (ValueError,TypeError):return None

def level(v):
    t=norm(v)
    if re.search(r"\bPRIMER\b|\bPRIMERO\b|\b1\b",t):return "1"
    if re.search(r"\bSEGUNDO\b|\b2\b",t):return "2"
    if re.search(r"\bTERCER\b|\bTERCERO\b|\b3\b",t):return "3"
    return None

def parse(raw):
    rows=iter(excel_rows(raw))
    header,body=choose_header(rows)
    columns={
      "clues":field_index(header,["CLUES","CLAVE UNICA DE ESTABLECIMIENTOS DE SALUD"]),
      "name":field_index(header,["NOMBRE DE LA UNIDAD","NOMBRE DE ESTABLECIMIENTO","NOMBRE DE LA UNIDAD MEDICA"]),
      "institution":field_index(header,["NOMBRE DE INSTITUCION","INSTITUCION","INSTITUCION A LA QUE PERTENECE"]),
      "state":field_index(header,["ENTIDAD FEDERATIVA","NOMBRE DE ENTIDAD","NOMBRE ESTADO","ENTIDAD"]),
      "state_code":field_index(header,["CLAVE ENTIDAD","CVE ENTIDAD","ID ENTIDAD","CLAVE DE LA ENTIDAD"]),
      "mun":field_index(header,["CLAVE MUNICIPIO","CVE MUNICIPIO","ID MUNICIPIO"]),
      "mun_name":field_index(header,["NOMBRE DEL MUNICIPIO","NOMBRE MUNICIPIO","MUNICIPIO"]),
      "lat":field_index(header,["LATITUD","COORDENADA LATITUD"]),
      "lon":field_index(header,["LONGITUD","COORDENADA LONGITUD"]),
      "level":field_index(header,["NIVEL DE ATENCION","NIVEL ATENCION"]),
      "status":field_index(header,["ESTATUS FUNCIONAL","ESTATUS DE OPERACION","ESTATUS"]),
      "kind":field_index(header,["TIPO DE ESTABLECIMIENTO","TIPOLOGIA"]),
    }
    print("FIELD_MAPPING",json.dumps({k:header[v] if v is not None else None for k,v in columns.items()},ensure_ascii=False))
    print("HEADER",json.dumps(header[:60],ensure_ascii=False))
    mandatory=["clues","name","institution","lat","lon"]
    if any(columns[k] is None for k in mandatory):
        raise ValueError("Falta una o más columnas obligatorias de CLUES: "+", ".join(k for k in mandatory if columns[k] is None))
    if columns["state"] is None and columns["state_code"] is None:
        raise ValueError("No se identificó columna de estado/entidad")
    cfg=json.loads(DISTRICTS.read_text(encoding="utf-8"))
    districts={c:d["id"] for d in cfg["districts"] for c in d["municipalities"]}
    weather=json.loads(WEATHER.read_text(encoding="utf-8"))
    by_name={norm(item["name"]):item["code"][-3:] for item in weather["municipalities"]}
    names_by_code={item["code"][-3:]:item["name"] for item in weather["municipalities"]}
    found={}
    counters={"non_sonora":0,"invalid_geolocation":0,"unknown_municipality":0,"duplicates":0}
    for row in body:
        state=norm(read(row,columns["state"]))
        scode=read(row,columns["state_code"])
        is_sonora=state=="SONORA" or (not state and scode.isdigit() and int(scode)==26)
        if not is_sonora:
            counters["non_sonora"]+=1;continue
        clues=read(row,columns["clues"]).upper().replace(" ","")
        if not re.fullmatch(r"[A-Z0-9]{5,18}",clues):continue
        lat,lon=num(read(row,columns["lat"])),num(read(row,columns["lon"]))
        if lat is None or lon is None or not (26<lat<33.5 and -115.5<lon<-108):
            counters["invalid_geolocation"]+=1;continue
        mun=read(row,columns["mun"])
        if mun.isdigit():mun=mun.zfill(3)
        else:mun=by_name.get(norm(read(row,columns["mun_name"])),"")
        if mun not in districts:
            counters["unknown_municipality"]+=1;continue
        facility={
            "clues":clues,"name":read(row,columns["name"])[:180],
            "institution":read(row,columns["institution"])[:100],
            "level":level(read(row,columns["level"])),
            "level_source":read(row,columns["level"])[:90],
            "status_source":read(row,columns["status"])[:90],
            "type":read(row,columns["kind"])[:120],
            "municipality_code":"26"+mun,
            "municipality_name":names_by_code.get(mun,read(row,columns["mun_name"]) or "Municipio "+mun),
            "district":districts[mun],
            "lat":round(lat,6),"lon":round(lon,6)
        }
        if clues in found:counters["duplicates"]+=1
        found[clues]=facility
    if len(found)<150 or len(found)>7000:
        raise ValueError(f"CLUES cobertura sonora fuera de rango esperado: {len(found)}, counters={counters}")
    output={
        "schema":"balam-clues-sonora-v1",
        "status":"ok",
        "source":"Catálogo CLUES oficial 2026-09 (DGIS / Salud)",
        "source_url":INPUT.split("?")[0],
        "source_cut":"2026-09",
        "created_at":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "facility_count":len(found),
        "unclassified_level_count":sum(not r["level"] for r in found.values()),
        "quality":counters,
        "disclaimer":"La presencia en CLUES no acredita operación en tiempo real, camas disponibles, especialidad resolutiva ni aceptación de referencias. Nivel no informado aparece sin clasificar.",
        "facilities":sorted(found.values(),key=lambda r:r["clues"])
    }
    return output

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--inspect",action="store_true")
    args=parser.parse_args()
    url=INPUT
    req=urllib.request.Request(url,headers={"User-Agent":"BALAM/0.10 (https://github.com/doctopanda/MAPA-BALAM)","Accept":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
    with urllib.request.urlopen(req,timeout=80) as resp:
        raw=resp.read((MAX_MB+1)*1024*1024)
    if len(raw)>MAX_MB*1024*1024:raise RuntimeError("CLUES XLSX demasiado grande")
    out=parse(raw)
    print("CLUES SONORA",out["facility_count"],"units",out["quality"],"unclassified",out["unclassified_level_count"])
    if not args.inspect:
        TARGET.parent.mkdir(parents=True,exist_ok=True)
        temp=TARGET.with_suffix(".tmp")
        temp.write_text(json.dumps(out,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
        temp.replace(TARGET)

if __name__=="__main__":main()
