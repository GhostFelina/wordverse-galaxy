import { mkdir, writeFile } from 'node:fs/promises';
// Original periodic3D photosphere granulation: cache the costly Voronoi field.
//128^3 samples,16 cells per axis,8 voxels per cell. No photographic source.
const size = 128,
  period = 16,
  centers = new Float32Array(period ** 3 * 3);
const fract = (x) => x - Math.floor(x),
  wrap = (x) => ((x % period) + period) % period;
for (let z = 0; z < period; z++)
  for (let y = 0; y < period; y++)
    for (let x = 0; x < period; x++) {
      let a = fract(x * 0.1031),
        b = fract(y * 0.103),
        c = fract(z * 0.0973);
      const d = a * (b + 19.19) + b * (c + 19.19) + c * (a + 19.19);
      a += d;
      b += d;
      c += d;
      const i = 3 * (x + period * (y + period * z));
      centers[i] = fract((a + b) * c);
      centers[i + 1] = fract(2 * a * b);
      centers[i + 2] = fract((a + b) * a);
    }
const data = new Uint8Array(size ** 3);
for (let z = 0; z < size; z++)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / 8,
        py = (y + 0.5) / 8,
        pz = (z + 0.5) / 8,
        bx = Math.floor(px),
        by = Math.floor(py),
        bz = Math.floor(pz),
        fx = fract(px),
        fy = fract(py),
        fz = fract(pz);
      let nearest = 8,
        second = 8;
      for (let dz = -1; dz <= 1; dz++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const k = 3 * (wrap(bx + dx) + period * (wrap(by + dy) + period * wrap(bz + dz))),
              ax = dx + 0.2 + 0.6 * centers[k] - fx,
              ay = dy + 0.2 + 0.6 * centers[k + 1] - fy,
              az = dz + 0.2 + 0.6 * centers[k + 2] - fz,
              d = ax * ax + ay * ay + az * az;
            if (d < nearest) {
              second = nearest;
              nearest = d;
            } else second = Math.min(second, d);
          }
      const gap = Math.sqrt(second) - Math.sqrt(nearest),
        t = Math.max(0, Math.min(1, (gap - 0.008) / (0.13 - 0.008)));
      data[x + size * (y + size * z)] = Math.round(255 * t * t * (3 - 2 * t));
    }
await mkdir('public/assets/stars', { recursive: true });
await writeFile('public/assets/stars/granulation-128.bin', data);
console.log('Prepared original128³ periodic stellar granulation,2097152bytes.');
