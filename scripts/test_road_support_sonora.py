#!/usr/bin/env python3
"""Regression for RFC8142 record separator and source IDs; no invented records are published."""
import importlib.util,json,tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location("road_builder",Path(__file__).with_name("build_road_support_sonora.py"))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
assert m.in_ring(-110.9,29.1,[[-111,29],[-110,29],[-110,30],[-111,30],[-111,29]])
assert not m.in_ring(-112,29,[[-111,29],[-110,29],[-110,30],[-111,30],[-111,29]])
mask=[('26030','Hermosillo',[[[-111,29],[-110,29],[-110,30],[-111,30],[-111,29]]],(-111,29,-110,30))]
with tempfile.TemporaryDirectory() as t:
 path=Path(t)/'municipios.geojson'
 features=[]
 for i in range(72):
  lat=27+(i//12)*.5;lon=-115+(i%12)*.5
  ring=[[lon,lat],[lon+.2,lat],[lon+.2,lat+.2],[lon,lat+.2],[lon,lat]]
  features.append({'type':'Feature','properties':{'CVEGEO':'26'+str(i+1).zfill(3),'NOMGEO':'M'+str(i)},
  'geometry':{'type':'Polygon','coordinates':[ring]}})
 path.write_text(json.dumps({'type':'FeatureCollection','features':features}))
 assert len(set(x[0] for x in m.masks(path)))==72
 assert m.locate(-110.9,29.1,mask)==('26030','Hermosillo')
 line='\x1e'+json.dumps({'type':'Feature','geometry':{'type':'Point','coordinates':[-110.9,29.1]},'properties':{'amenity':'fuel','@fid':'n12345','name':'Prueba'}})+'\n'
 f=json.loads(line.lstrip('\x1e\ufeff').strip())
 assert f['properties']['@fid']=='n12345'
 assert m.coordinates(f['geometry'])==[-110.9,29.1]
print('BALAM offline OSM parser regression PASS')
