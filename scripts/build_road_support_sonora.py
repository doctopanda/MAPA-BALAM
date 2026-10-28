#!/usr/bin/env python3
"""Generate independently cached OSM fuel, tyres and repair POIs inside Sonora municipal polygons."""
import json, argparse, re, datetime as dt
from pathlib import Path
def in_ring(x,y,ring):
    inside=False
    prev=ring[-1]
    for pt in ring:
        a,b=pt; c,d=prev
        if ((b>y)!=(d>y)) and x < (c-a)*(y-b)/(d-b)+a:inside=not inside
        prev=pt
    return inside
def inside_poly(x,y,poly):
    if not poly or not poly[0]:return False
    outer=poly[0]
    if not in_ring(x,y,outer):return False
    return not any(in_ring(x,y,hole) for hole in poly[1:])
def masks(path):
    src=json.loads(path.read_text(encoding='utf-8-sig'))
    records=[]
    for ft in src['features']:
        p=ft.get('properties') or {}
        c=str(p.get('CVEGEO') or p.get('CVE_GEO') or p.get('cvegeo') or p.get('CVE_MUN') or '')
        if len(c)==3:c='26'+c
        if not re.fullmatch('26[0-9]{3}',c):continue
        name=str(p.get('NOMGEO') or p.get('NOM_MUN') or p.get('NOMBRE') or '')
        g=ft.get('geometry') or {}
        v=g.get('coordinates') or []
        ps=v if g.get('type')=='MultiPolygon' else [v] if g.get('type')=='Polygon' else []
        for poly in ps:
            if not poly or not poly[0]:continue
            outer=poly[0]; xs=[p[0] for p in outer];ys=[p[1] for p in outer]
            records.append((c,name,poly,(min(xs),min(ys),max(xs),max(ys))))
    assert len({r[0] for r in records})>=65,'Sonora municipal boundaries missing'
    return records
def locate(x,y,m):
    for c,name,poly,b in m:
        if b[0]<=x<=b[2] and b[1]<=y<=b[3] and inside_poly(x,y,poly):return c,name
    return None,None
def points(v):
    if isinstance(v,list):
        if len(v)>=2 and all(isinstance(x,(float,int)) for x in v[:2]):
            yield v[0],v[1]
        else:
            for z in v:yield from points(z)
def coordinates(geo):
    if geo.get('type')=='Point':return geo.get('coordinates')
    a=list(points(geo.get('coordinates') or []))
    if a:return [sum(x for x,y in a)/len(a),sum(y for x,y in a)/len(a)]
def main():
    p=argparse.ArgumentParser()
    p.add_argument('--geojsonseq',required=True,type=Path)
    p.add_argument('--municipios',required=True,type=Path)
    p.add_argument('--out',type=Path,default=Path('data/road-services/sonora_osm_latest.json'))
    a=p.parse_args()
    mm=masks(a.municipios)
    docs={};errors={'outside_municipal_boundaries':0,'invalid':0}
    with a.geojsonseq.open(encoding='utf-8',errors='replace') as fd:
        for line in fd:
            try:f=json.loads(line)
            except ValueError:continue
            tags=f.get('properties') or {}
            cat='fuel' if tags.get('amenity')=='fuel' else 'tire' if tags.get('shop')=='tyres' else 'repair' if tags.get('shop')=='car_repair' else None
            if cat is None:continue
            pt=coordinates(f.get('geometry') or {})
            if not pt or len(pt)<2 or not (-115.5<pt[0]<-108 and 26<pt[1]<33.5):
                errors['invalid']+=1;continue
            code,name=locate(*pt,mm)
            if not code:errors['outside_municipal_boundaries']+=1;continue
            key=str(f.get('id') or tags.get('@id') or tags.get('id') or '')
            if not key:errors['invalid']+=1;continue
            docs['OSM:'+key]={
                'id':'OSM:'+key,'category':cat,
                'name':str(tags.get('name:es') or tags.get('name') or tags.get('brand') or {'fuel':'Gasolinera sin nombre','tire':'Llantera sin nombre','repair':'Taller sin nombre'}[cat])[:130],
                'lat':round(pt[1],6),'lon':round(pt[0],6),'municipality_code':code,'municipality_name':name,
                'opening_hours':str(tags.get('opening_hours') or '')[:140]
            }
    items=list(docs.values())
    count={cat:sum(1 for x in items if x['category']==cat) for cat in ('fuel','tire','repair')}
    print('CATALOG DEBUG',{ 'inside':len(items),'categories':count,'excluded':errors,'polygon_count':len(mm) },flush=True)
    assert len(items)>=30 and count['fuel']>=8 and count['repair']>=3, 'Extract incomplete; refusing to overwrite: '+str(count)
    obj={
        'schema':'balam-road-support-osm-v1','status':'validated_public_snapshot',
        'source':'OpenStreetMap via Geofabrik Mexico extract, geofenced by Sonora municipality polygons',
        'source_url':'https://download.geofabrik.de/north-america/mexico.html',
        'boundary_url':'https://raw.githubusercontent.com/MacWilliXD/INEGI-geojson/main/geojson_descargas/AGEM_26.geojson',
        'attribution':'© OpenStreetMap contributors, ODbL 1.0',
        'generated_at':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
        'counts':count,'record_count':len(items),'excluded':errors,
        'disclaimer':'OSM points are not verified open-now businesses, gasoline inventory, roadside access, or ticket agreements. DENUE is separate.',
        'facilities':sorted(items,key=lambda x:(x['municipality_code'],x['category'],x['id']))
    }
    a.out.parent.mkdir(parents=True,exist_ok=True)
    tmp=a.out.with_suffix('.tmp')
    tmp.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    tmp.replace(a.out)
    print('BALAM ROAD SERVICES BUILT',str(count),'total',len(items))
if __name__=='__main__':main()
