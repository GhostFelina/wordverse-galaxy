"""Optional reproducible refresh: uv run --with pillow python scripts/fetch-nebula-assets.py.
Bundled Orion imagery needs no runtime network, Python, secret or NASA key.
"""
import hashlib
import html
import io
import json
from pathlib import Path
import re
import urllib.request
from PIL import Image, ImageFilter
Image.MAX_IMAGE_PIXELS = 150000000
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/nebulae'

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Wordverse Orion asset refresh'})
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()

def bundle(raw, name, median=False, size=2048):
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    im.thumbnail((size, size), Image.Resampling.LANCZOS)
    if median:
        im = im.filter(ImageFilter.MedianFilter(3))
    out = DEST / f'{name}.webp'
    im.save(out, 'WEBP', quality=94, method=6)
    return {'texture': f'/assets/nebulae/{name}.webp', 'dimensions': list(im.size),
            'sha256': hashlib.sha256(out.read_bytes()).hexdigest()}

if __name__ == '__main__':
    DEST.mkdir(parents=True, exist_ok=True)
    source = 'https://esahubble.org/images/heic0601a/'
    page = get(source).decode('utf-8')
    match = re.search(r'<div class="credit">(.*?)</div>', page, re.S)
    credit = html.unescape(re.sub('<[^>]+>', '', match.group(1))).strip()
    optical_url = 'https://esahubble.org/media/archives/images/publicationtiff10k/heic0601a.tif'
    raw = get(optical_url)
    record = {'id': 'orion', 'nameTr': 'Orion Nebulası', 'name': 'Orion Nebula (M42)',
              'priority': True, 'band': 'optical + infrared', 'imageId': 'heic0601a',
              'sourceTitle': "Hubble's sharpest view of the Orion Nebula", 'source': source,
              'download': optical_url, 'credit': credit,
              'license': 'https://esahubble.org/public/copyright/',
              'observationNote': 'Observed colour-mapped telescope imagery; reconstructed depth is illustrative.',
              'sourceSha256': hashlib.sha256(raw).hexdigest(), **bundle(raw, 'orion')}
    record['gasTexture'] = {**bundle(raw, 'orion-gas', True, 4096),
        'processing': '3-pixel median filtering of the credited Hubble image; gas colour guide, not a new observation.'}
    record['highResolutionSource'] = {'download': optical_url, 'dimensions': [10000, 10000], 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'credit': credit, 'license': record['license']}
    record['highResolution'] = {**bundle(raw, 'orion-8k', True, 8192), 'processing': 'Downsampled from observed 10K TIFF; 3-pixel median gas guide. No generated detail or upscaling.'}
    ir_url = 'https://svs.gsfc.nasa.gov/vis/a030000/a030900/a030959/STScI-H-Orion_IR_3840x2160.png'
    ir = get(ir_url)
    record['infrared'] = {**bundle(ir, 'orion-ir'), 'source': 'https://svs.gsfc.nasa.gov/30959/',
        'download': ir_url, 'credit': 'NASA/Spitzer/JPL-Caltech', 'band': 'infrared',
        'sourceSha256': hashlib.sha256(ir).hexdigest(),
        'license': 'https://www.nasa.gov/nasa-brand-center/images-and-media/'}
    (ROOT / 'src/data/nebula-images.json').write_text(json.dumps([record], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Orion optical, infrared and gas colour guide refreshed with hashes and credits.')
