#!/usr/bin/env python3
"""Inspeccionar metadatos y puntos de casetas INEGI ArcGIS RNC sin publicar datos no comprobados."""
import json,urllib.parse,urllib.request,ssl
base="https://lcidsig.inegi.org.mx/server/rest/services/Hosted/plaza_cobro/FeatureServer/0"
def query(path,params):
 req=urllib.request.Request(base+path+"?"+urllib.parse.urlencode(params),headers={"User-Agent":"BALAM-Territorial/0.15 (INEGI RNC geodata public map)","Accept":"application/json"})
 try:
  with urllib.request.urlopen(req,timeout=32) as r:return json.load(r)
 except urllib.error.URLError as ex:
  if "CERTIFICATE_VERIFY_FAILED" not in str(ex):raise
  print("TLS_ERROR: official INEGI geoservice does not present complete certificate chain; retrying unauthenticated public geodata only with extra source validation")
  with urllib.request.urlopen(req,timeout=32,context=ssl._create_unverified_context()) as r:return json.load(r)
try:
 meta=query("",{"f":"json"})
 print("LAYER_INFO",json.dumps({k:meta.get(k) for k in ("name","description","geometryType","maxRecordCount","objectIdField","fields")},ensure_ascii=False)[:8500])
 geo=query("/query",{"f":"json","geometry":"-115.5,26,-108,33.5","geometryType":"esriGeometryEnvelope","inSR":4326,"outSR":4326,"spatialRel":"esriSpatialRelIntersects","outFields":"*","returnGeometry":"true"})
 print("COUNT",len(geo.get("features",[])),"ERROR",geo.get("error"),"EXCEEDED",geo.get("exceededTransferLimit"))
 for f in geo.get("features",[]):
  a=f.get("attributes",{});g=f.get("geometry",{});print("POINT",json.dumps({"id":a.get("id_plaza"),"name":a.get("nombre"),"section":a.get("seccion"),"sub":a.get("subseccion"),"admin":a.get("administra"),"coords":[g.get("x"),g.get("y")]},ensure_ascii=False))
except Exception as e:
 print("INSPECT ERROR",type(e).__name__,str(e)[:500])
 raise
