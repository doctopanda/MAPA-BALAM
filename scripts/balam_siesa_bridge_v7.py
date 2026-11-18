#!/usr/bin/env python3
"""BALAM v7 • Lector OOXML SIESA V2401. Python 3.9+, solo stdlib.

scan: genera manifiesto sin contenido de celdas ni identificadores personales.
demo-export: exporta filas SOLO de un libro con marcador de prueba y contenido
             textual estrictamente sintético. No transmite archivos ni red.

NO genera reportes oficiales; NO ejecuta macros ni actualiza pivotes.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

MAIN = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
PKG = '{http://schemas.openxmlformats.org/package/2006/relationships}'
SHEETS = ('operativos','base_reporta','basemorbi','baseprob','base_emba',
          'Base_vac','Base_vec','Basered','BASELABHUM','base_psic','base_labambien',
          'base_promo','BaseVE','Base_odontologia','Base_enf','base_cofepris',
          'Base_SRyEG','base_RT')
MARKER_SHEET='_BALAM_DEMO_ONLY'
MARKER='BALAM_SYNTHETIC_V7_TEST_ONLY'
MAX_ARCHIVE_ENTRIES=2500
MAX_ARCHIVE_UNCOMPRESSED=220 * 1024 * 1024
MAX_MEMBER=75 * 1024 * 1024
MAX_ROWS_PER_SHEET=100000
MAX_CELLS_PER_ROW=500
MAX_FILE=40 * 1024 * 1024
SYNTHETIC_PREFIXES=('DEMO_', 'PRUEBA_', 'TEST_')


def digest_file(path:Path)->str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1<<20),b''):
            h.update(chunk)
    return h.hexdigest()


def safe_archive(z:zipfile.ZipFile):
    items=z.infolist()
    if len(items)>MAX_ARCHIVE_ENTRIES or sum(x.file_size for x in items)>MAX_ARCHIVE_UNCOMPRESSED:
        raise ValueError('Archivo ZIP demasiado grande para prevalidación')
    if any(x.file_size>MAX_MEMBER for x in items):
        raise ValueError('Un componente del archivo excede el límite seguro')
    if any(x.filename.startswith('/') or '..' in x.filename.split('/') for x in items):
        raise ValueError('Ruta ZIP no permitida')
    return {x.filename for x in items}


def columns_from_dictionary(path:Path):
    rows=defaultdict(dict)
    with path.open('r',encoding='utf-8-sig',newline='') as f:
        for item in csv.DictReader(f):
            name=item['hoja_origen']
            if name in SHEETS:
                pos=int(item['posicion_columna'])
                if pos<1 or pos>MAX_CELLS_PER_ROW or pos in rows[name]:
                    raise ValueError('Diccionario con columnas inválidas o duplicadas')
                rows[name][pos]=item['nombre_campo_original'].strip()
    out={}
    for sheet in SHEETS:
        obj=rows[sheet]
        if not obj or sorted(obj)!=list(range(1,len(obj)+1)):
            raise ValueError('Falta diccionario consecutivo para una hoja fuente')
        out[sheet]=[obj[i] for i in range(1,len(obj)+1)]
    return out


def column_number(addr:str)->int:
    m=re.match(r'^([A-Z]+)',addr)
    if not m:return 0
    n=0
    for ch in m.group(1):n=n*26+ord(ch)-64
    return n


def paths_for_sheets(z:zipfile.ZipFile):
    workbook=ET.fromstring(z.read('xl/workbook.xml'))
    rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    lookup={e.attrib['Id']:e.attrib['Target'] for e in rels.iter(PKG+'Relationship')
            if e.attrib.get('Type','').endswith('/worksheet')}
    result={}
    for s in workbook.iter(MAIN+'sheet'):
        target=lookup.get(s.attrib.get(RID+'id'))
        if not target:continue
        if target.startswith('/'):full=target.lstrip('/')
        elif target.startswith('xl/'):full=target
        else:full='xl/'+target
        if '..' in full.split('/') or not full.startswith('xl/worksheets/'):
            raise ValueError('Ruta de hoja no permitida')
        result[s.attrib['name']]=full
    return result


def shared_strings(z:zipfile.ZipFile,files:set):
    name='xl/sharedStrings.xml'
    if name not in files:return []
    strings=[]
    with z.open(name) as f:
        for _,node in ET.iterparse(f,events=('end',)):
            if node.tag==MAIN+'si':
                strings.append(''.join(t.text or '' for t in node.iter(MAIN+'t')))
                if len(strings)>1000000:raise ValueError('Demasiadas cadenas compartidas')
                node.clear()
    return strings


def cell_content(node,strings):
    """Raw Excel cell value. Do not silently convert dates or formula results."""
    if node.find(MAIN+'f') is not None:return None
    typ=node.attrib.get('t','')
    inline=node.find(MAIN+'is')
    if inline is not None:
        value=''.join(t.text or '' for t in inline.iter(MAIN+'t'))
        return (value,'text') if value.strip() else None
    v=node.find(MAIN+'v')
    if v is None or v.text is None:return None
    if typ=='s':
        try:value=strings[int(v.text)]
        except (ValueError,IndexError) as e:raise ValueError('Índice de cadena compartida inválido') from e
        kind='text'
    elif typ in ('str','e'):value=v.text;kind='text'
    elif typ=='b':value=v.text;kind='boolean'
    else:value=v.text;kind='raw-number'
    return (value,kind) if value.strip() else None


def sheet_rows(z:zipfile.ZipFile,member:str,strings:list):
    with z.open(member) as f:
        for _,node in ET.iterparse(f,events=('end',)):
            if node.tag!=MAIN+'row':continue
            number=int(node.attrib.get('r','0'))
            if number<1 or number>MAX_ROWS_PER_SHEET:raise ValueError('Fila fuera de límite de seguridad')
            row={}
            for cell in node.iter(MAIN+'c'):
                col=column_number(cell.attrib.get('r',''))
                if col<1 or col>MAX_CELLS_PER_ROW:continue
                val=cell_content(cell,strings)
                if val is not None:row[col]=val
            yield number,row
            node.clear()


def clean_header(value:str)->str:
    return re.sub(r'\s+',' ',value).strip()

def hash_data(sheet:str,values:list)->str:
    compact=json.dumps({'hoja':sheet,'valores':values},ensure_ascii=False,separators=(',',':'))
    return hashlib.sha256(compact.encode('utf-8')).hexdigest()


def is_synthetic(row:list)->bool:
    """Strict demo gate: all non-numeric text values carry a synthetic prefix."""
    for item in row:
        if item is None:continue
        value,kind=item
        if kind=='text' and not str(value).upper().startswith(SYNTHETIC_PREFIXES):
            return False
    return True


def process(source:Path,dictionary:Path,mode:str):
    if source.suffix.lower() not in ('.xlsx','.xlsm') or source.stat().st_size>MAX_FILE:
        raise ValueError('Tipo o tamaño de archivo incompatible')
    expected=columns_from_dictionary(dictionary)
    manifest={'version':'BALAM-SIESA-V7-LOCAL-1','modo':mode,
              'archivo_sha256':digest_file(source),'archivo_bytes':source.stat().st_size,
              'extension':source.suffix.lower().lstrip('.'),'datos_nominales_en_manifiesto':False,
              'hojas_esperadas':len(SHEETS),'columnas_diccionario':sum(map(len,expected.values())),
              'hojas':{},'limites':{'filas_max_hoja':MAX_ROWS_PER_SHEET}}
    exports=[]
    with zipfile.ZipFile(source) as z:
        files=safe_archive(z); paths=paths_for_sheets(z);strings=shared_strings(z,files)
        demo_marker=False
        if MARKER_SHEET in paths and paths[MARKER_SHEET] in files:
            for row_id,row in sheet_rows(z,paths[MARKER_SHEET],strings):
                if row_id==1 and row.get(1)==(MARKER,'text'):
                    demo_marker=True
                break
        if mode=='demo-export' and not demo_marker:
            raise ValueError('Extracción de datos bloqueada: falta marcador de libro sintético')
        for sheet in SHEETS:
            columns=expected[sheet];out={'columnas':len(columns),'encabezados_validos':False,
                'filas_candidatas':0,'filas_incompletas':0,'residuos_aislados':0,'encabezados_con_espacios_normalizados':0,
                'duplicados_contenido_en_hoja':0,'errores':[]}
            manifest['hojas'][sheet]=out
            if sheet not in paths or paths[sheet] not in files:
                out['errores'].append('HOJA_AUSENTE');continue
            seen=set();found_header=False
            for row_idx,row in sheet_rows(z,paths[sheet],strings):
                if row_idx==1:
                    given=[row.get(i,('','text'))[0] for i in range(1,len(columns)+1)]
                    extra=[k for k in row if k>len(columns)]
                    out['encabezados_validos']=([clean_header(x) for x in given]==[clean_header(x) for x in columns] and not extra)
                    out['encabezados_con_espacios_normalizados']=sum(a!=b and clean_header(a)==clean_header(b) for a,b in zip(given,columns))
                    if not out['encabezados_validos']:out['errores'].append('ENCABEZADOS_NO_COINCIDEN')
                    found_header=True;continue
                if not row:continue
                meaningful={col:v for col,v in row.items() if col<=len(columns)}
                if len(meaningful)<2:
                    out['residuos_aislados']+=1;continue
                if not out['encabezados_validos']:
                    out['filas_incompletas']+=1;continue
                values=[meaningful.get(i) for i in range(1,len(columns)+1)]
                out['filas_candidatas']+=1
                data_hash=hash_data(sheet,values)
                if data_hash in seen:out['duplicados_contenido_en_hoja']+=1
                seen.add(data_hash)
                if mode=='demo-export':
                    if not is_synthetic(values):
                        raise ValueError('Bloqueada extracción: celda textual sin prefijo sintético')
                    exports.append({'hoja':sheet,'fila_excel':row_idx,'campos':columns,
                        'valores':[v[0] if v is not None else None for v in values],
                        'tipos':[v[1] if v is not None else None for v in values],
                        'contenido_sha256':data_hash,'estado':'CANDIDATO_NO_HOMOLOGADO'})
            if not found_header:out['errores'].append('FALTA_FILA_ENCABEZADO')
        manifest['bases_presentes']=sum(s in paths for s in SHEETS)
        manifest['encabezados_correctos']=sum(x['encabezados_validos'] for x in manifest['hojas'].values())
        manifest['candidatos_totales']=sum(x['filas_candidatas'] for x in manifest['hojas'].values())
        manifest['nota']='Candidato no equivale a caso ni acción validada. No se analizan cachés de pivotes.'
        return manifest,exports


def cli():
    ap=argparse.ArgumentParser(description='BALAM v7: validar SIESA sin exponer datos')
    ap.add_argument('excel',type=Path)
    ap.add_argument('--diccionario',required=True,type=Path)
    ap.add_argument('--manifest',required=True,type=Path)
    ap.add_argument('--modo',choices=['scan','demo-export'],default='scan')
    ap.add_argument('--jsonl',type=Path,help='Solo en demo-export para libro con marcador de prueba')
    args=ap.parse_args()
    if args.modo=='demo-export' and args.jsonl is None:ap.error('--jsonl obligatorio en demo-export')
    if args.modo=='scan' and args.jsonl is not None:ap.error('--jsonl solo para demo-export')
    manifest,rows=process(args.excel,args.diccionario,args.modo)
    args.manifest.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if args.jsonl is not None:
        with args.jsonl.open('w',encoding='utf-8') as f:
            for x in rows:f.write(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
    print('OK: bases',manifest['bases_presentes'],'encabezados',manifest['encabezados_correctos'],
          'filas candidatas',manifest['candidatos_totales'], 'solo local',file=sys.stderr)

if __name__=='__main__':
    try:cli()
    except (ValueError,zipfile.BadZipFile,KeyError,ET.ParseError) as ex:
        print('ERROR DE PREVALIDACIÓN:',type(ex).__name__,str(ex),file=sys.stderr)
        sys.exit(2)