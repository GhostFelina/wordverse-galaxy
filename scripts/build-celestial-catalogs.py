"""Build source-backed nebula, asteroid and historical fireball subsets.
Python 3 standard library. OpenNGC adaptation CC BY-SA 4.0; importer MIT.
JPL requests are sequential, cached, version-checked; never called by the browser.
"""
import csv
import hashlib
import io
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'src/data/catalog'
REVISION = '75ca7ff090e1d0081a5b08be70eb3bc45ccd9e06'
OPENNGC = f'https://raw.githubusercontent.com/mattiaverga/OpenNGC/{REVISION}/database_files/NGC.csv'
JPL_FIELDS = 'spkid,pdes,name,full_name,diameter,albedo,H,rot_per,a,e,i,om,w,ma,epoch,class,spec_B'
ASTEROIDS = 'https://ssd-api.jpl.nasa.gov/sbdb_query.api?' + urlencode({'sb-kind':'a','sb-ns':'n','fields':JPL_FIELDS,'sb-class':'MBA','sort':'-diameter','limit':1001})
FIREBALLS = 'https://ssd-api.jpl.nasa.gov/fireball.api?limit=1200&vel-comp=true'
USER_AGENT = 'Wordverse/1.14.0 (+https://github.com/GhostFelina/wordverse-galaxy/issues)'


def cached(name, url):
    path = ROOT / '.git' / name
    if path.exists():
        return path.read_bytes()
    data = urlopen(Request(url,headers={'User-Agent':USER_AGENT}),timeout=60).read()
    path.write_bytes(data)
    return data


def angle(value, ra=False):
    parts=[float(part) for part in value.lstrip('+-').split(':')]
    deg=parts[0]+parts[1]/60+parts[2]/3600
    return deg*(15 if ra else -1 if value.startswith('-') else 1)


def number(value):
    return float(value) if value not in (None,'') else None


def write(name, records, source, raw, license, changes, version=None):
    assert len(records)==len({record['id'] for record in records}), 'Duplicate catalog identity'
    (OUTPUT/name).write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return {'file':name,'count':len(records),'source':source,'sha256':hashlib.sha256(raw).hexdigest(),'license':license,'changes':changes,'apiVersion':version}


manifest=[]
raw=cached('OpenNGC.csv',OPENNGC)
rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8')),delimiter=';'))
styles={'PN':'planetary','Neb':'nebula','HII':'hii','RfN':'reflection','SNR':'supernova-remnant','EmN':'emission'}
valid=[row for row in rows if (row['Type'] in styles or row['Name']=='NGC1976') and row['RA'] and row['Dec']]
# Round-robin preserves morphological variety, without counting clusters/duplicates as nebulae.
buckets=[[row for row in valid if row['Type']==kind] for kind in styles]
selected=[]
required=['NGC1976','NGC6720','NGC1952']
for identifier in required:
    selected.append(next(row for row in valid if row['Name']==identifier))
while len(selected)<200:
    progress=False
    for bucket in buckets:
        if bucket:
            row=bucket.pop(0)
            if row not in selected:
                selected.append(row);progress=True
            if len(selected)==200:break
    assert progress, 'Insufficient real nebula records'
nebulae=[]
for index,row in enumerate(selected):
    ra,dec=angle(row['RA'],True),angle(row['Dec'])
    nebulae.append({'id':row['Name'],'messier':f"M{int(row['M'])}" if row['M'] else None,'kind':styles.get(row['Type'],'cluster-nebula'),'catalogType':row['Type'],'raDeg':round(ra,7),'decDeg':round(dec,7),'epoch':'J2000','majorArcmin':number(row['MajAx']),'minorArcmin':number(row['MinAx']),'positionAngleDeg':number(row['PosAng']),'distanceLy':None,'seed':index+20001,'scenePosition':[round((ra/360-.5)*2200,3),round(math.sin(math.radians(dec))*650,3),-120-(index%13)*25],'source':f'https://github.com/mattiaverga/OpenNGC/blob/{REVISION}/database_files/NGC.csv','dataSources':row['Sources'],'license':'CC-BY-SA-4.0','renderKind':'artistic-morphology'})
manifest.append(write('nebulae-200.json',nebulae,OPENNGC,raw,'CC-BY-SA-4.0','200 unique nebula types; J2000 degree conversion; morphology grouping and artistic depth/placement. Missing distances remain null.'))

raw=cached('asteroid-mainbelt-snapshot.json',ASTEROIDS)
payload=json.loads(raw)
assert payload['signature']['version']=='1.0', 'Review changed JPL Query API version'
asteroids=[]
for index,values in enumerate(payload['data']):
    row=dict(zip(payload['fields'],values))
    if row['pdes']=='1':continue
    asteroids.append({'id':str(row['spkid']),'designation':row['pdes'],'name':row['name'],'fullName':row['full_name'].strip(),'kind':'asteroid','diameterKm':number(row['diameter']),'albedo':number(row['albedo']),'absoluteMagnitude':number(row['H']),'rotationPeriodHours':number(row['rot_per']),'semimajorAxisAu':number(row['a']),'eccentricity':number(row['e']),'inclinationDeg':number(row['i']),'ascendingNodeDeg':number(row['om']),'argumentPerihelionDeg':number(row['w']),'meanAnomalyDeg':number(row['ma']),'epochJdTdb':number(row['epoch']),'orbitClass':row['class'],'spectralType':row['spec_B'],'seed':index+30001,'source':f"https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr={row['spkid']}",'renderKind':'artistic-shape-physical-parameters'})
assert len(asteroids)==1000
assert all(row['diameterKm'] is not None and row['diameterKm']>0 for row in asteroids)
manifest.append(write('asteroids-1000.json',asteroids,ASTEROIDS,raw,'NASA/JPL factual catalog data; attribution and source terms','1000 numbered main-belt asteroids, excluding dwarf planet Ceres, sorted by measured/reported diameter; field renaming and numeric conversion; no invented shapes or missing physical values.',payload['signature']['version']))

raw=cached('fireball-snapshot.json',FIREBALLS)
payload=json.loads(raw)
assert payload['signature']['version']=='1.2', 'Review changed JPL Fireball API version'
fireballs=[]
seen=set()
for values in payload['data']:
    row=dict(zip(payload['fields'],values))
    identifier='fireball-'+row['date'].replace(' ','T').replace(':','')
    if identifier in seen:continue
    seen.add(identifier)
    lat,lon=number(row['lat']),number(row['lon'])
    components=[number(row.get(field)) for field in ['vx','vy','vz']]
    fireballs.append({'id':identifier,'dateUtc':row['date'].replace(' ','T')+'Z','radiatedEnergyJoules':number(row['energy'])*1e10,'impactEnergyKt':number(row['impact-e']),'latitudeDeg':None if lat is None else lat*(-1 if row['lat-dir']=='S' else 1),'longitudeDeg':None if lon is None else lon*(-1 if row['lon-dir']=='W' else 1),'altitudeKm':number(row['alt']),'entryVelocityKmS':None if any(value is None for value in components) else math.sqrt(sum(value*value for value in components)),'entryVelocityComponentsKmS':components,'source':'https://cneos.jpl.nasa.gov/fireballs/','renderKind':'artistic-historical-atmospheric-event'})
    if len(fireballs)==1000:break
assert len(fireballs)==1000, 'Insufficient distinct observed fireball events'
manifest.append(write('fireballs-1000.json',fireballs,FIREBALLS,raw,'NASA/JPL factual observation data; attribution and source terms','1000 distinct historical atmospheric fireballs; UTC/signed coordinate conversion; energy units converted to joules; unknown measurements remain null. Not live events.',payload['signature']['version']))
(OUTPUT/'expansion-provenance.json').write_text(json.dumps({'retrievedAtUtc':datetime.now(timezone.utc).isoformat(),'openNgcRevision':REVISION,'datasets':manifest},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Saved 200 real nebulae, 1000 numbered small bodies, 1000 observed atmospheric fireballs.')
