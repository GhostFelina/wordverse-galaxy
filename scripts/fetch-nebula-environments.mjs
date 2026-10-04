import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const targets = { orion: ['M42', 'hii-cavity'] };
const records = JSON.parse(await readFile(new URL('../src/data/nebula-images.json', import.meta.url), 'utf8'));
const output = [];
for (const record of records) {
  const [designation, morphology] = targets[record.id];
  const resolver = 'https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/SNV?' + encodeURIComponent(designation);
  const response = await fetch(resolver, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Resolver ${designation}: ${response.status}`);
  const xml = await response.text();
  const ra = Number(xml.match(/<jradeg>([^<]+)</)?.[1]),
    dec = Number(xml.match(/<jdedeg>([^<]+)</)?.[1]);
  if (!Number.isFinite(ra) || !Number.isFinite(dec)) throw new Error(`Unresolved ${designation}`);
  const params = new URLSearchParams({
    '-source': 'I/355/gaiadr3',
    '-c': `${ra} ${dec}`,
    '-c.rs': '1200',
    '-out': 'Source,RA_ICRS,DE_ICRS,Gmag,BP-RP,Plx',
    '-out.max': '96',
    '-sort': 'Gmag',
  });
  const url = 'https://vizier.cds.unistra.fr/viz-bin/asu-tsv?' + params;
  const result = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!result.ok) throw new Error(`VizieR ${designation}: ${result.status}`);
  const tsv = await result.text();
  const stars = [];
  for (const line of tsv.split('\n')) {
    const values = line
      .trim()
      .split('\t')
      .map((value) => value.trim());
    if (!/^\d{12,20}$/.test(values[0])) continue;
    const [sourceId, raDeg, decDeg, magnitude, bpRp, parallaxMas] = values;
    stars.push({
      sourceId,
      raDeg: Number(raDeg),
      decDeg: Number(decDeg),
      magnitude: Number(magnitude),
      bpRp: bpRp ? Number(bpRp) : null,
      parallaxMas: parallaxMas ? Number(parallaxMas) : null,
    });
  }
  if (!stars.length) throw new Error(`No observed field stars for ${designation}`);
  output.push({
    id: record.id,
    designation,
    morphology,
    raDeg: ra,
    decDeg: dec,
    fieldRadiusDeg: 1 / 3,
    resolver,
    catalog: 'Gaia DR3 / I/355/gaiadr3',
    catalogUrl: url,
    credit: 'ESA/Gaia/DPAC; CDS/VizieR',
    responseSha256: createHash('sha256').update(tsv).digest('hex'),
    stars,
    limitation:
      'Observed line-of-sight field sources. Membership and depth relative to the nebula are not established by this query. Visual depth is reconstructed; image WCS is not registered to this field.',
  });
  console.log(`${record.id}: ${stars.length} Gaia field sources`);
}
const field = output[0];
field.trapezium = [];
for (const name of ['theta1 Ori A', 'theta1 Ori B', 'theta1 Ori C', 'theta1 Ori D']) {
  const resolver = 'https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/SNV?' + encodeURIComponent(name);
  const response = await fetch(resolver, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Trapezium: ${response.status}`);
  const xml = await response.text(),
    raDeg = Number(xml.match(/<jradeg>([^<]+)</)?.[1]),
    decDeg = Number(xml.match(/<jdedeg>([^<]+)</)?.[1]);
  if (!Number.isFinite(raDeg) || !Number.isFinite(decDeg)) throw new Error(`Unresolved ${name}`);
  const nearest = field.stars.reduce((best, star) =>
    Math.hypot(star.raDeg - raDeg, star.decDeg - decDeg) < Math.hypot(best.raDeg - raDeg, best.decDeg - decDeg)
      ? star
      : best,
  );
  field.trapezium.push({
    name,
    raDeg,
    decDeg,
    resolver,
    responseSha256: createHash('sha256').update(xml).digest('hex'),
    gaiaSourceId: Math.hypot(nearest.raDeg - raDeg, nearest.decDeg - decDeg) < 0.0002 ? nearest.sourceId : null,
  });
}
await writeFile(
  new URL('../src/data/nebula-environments.json', import.meta.url),
  JSON.stringify(output, null, 2) + '\n',
);
