#!/usr/bin/env python3
"""Synthetic fixture for DENUE normalization. Does NOT populate public dataset."""
import importlib.util,io,csv,json
from pathlib import Path
s=importlib.util.spec_from_file_location('denue',Path(__file__).with_name('import_denue_sonora.py'))
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
fixture=[
 {"id":"TEST01","nom_estab":"Gasolinera ficticia solo QA","codigo_act":"468411","cve_ent":"26","cve_mun":"030","municipio":"Hermosillo","latitud":"29.095","longitud":"-110.96"},
 {"id":"TEST02","nom_estab":"Llantera prueba","codigo_act":"811191","cve_ent":"26","cve_mun":"057","municipio":"Navojoa","latitud":"27.07","longitud":"-109.44"},
 {"id":"TEST03","nom_estab":"Taller prueba","codigo_act":"811111","cve_ent":"26","cve_mun":"018","municipio":"Cajeme","latitud":"27.49","longitud":"-109.93"},
 {"id":"TEST04","nom_estab":"No Sonora","codigo_act":"468411","cve_ent":"25","cve_mun":"001","latitud":"25.0","longitud":"-107.0"},
 {"id":"TEST05","nom_estab":"Sin GPS","codigo_act":"468411","cve_ent":"26","cve_mun":"030","latitud":"0","longitud":"0"}
]
items,counts=m.normalize(fixture)
assert len(items)==3 and set(x['category'] for x in items.values())=={"fuel","tire","repair"}
assert items["DENUE:TEST01"]["municipality_code"]=="26030"
assert counts['invalid_location']==1 and counts['out_of_sonora']==1
out=io.StringIO();writer=csv.DictWriter(out,fieldnames=list(fixture[0]))
writer.writeheader();writer.writerows(fixture)
parsed=list(m.rows(out.getvalue().encode('utf-8-sig')))
assert len(parsed)==5
assert len(m.normalize(parsed)[0])==3
print("DENUE importer self-test OK: 3 synthetic rows normalized; 2 rejected, no output written")
