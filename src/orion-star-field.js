import { Vector3 } from 'three';
import { wordStarPosition } from './word-star-system.js';
import { ORION_DEPTH_SCALE } from './nebula-layout.js';

// A reversible presentation frame. Stored coordinates and pairwise directions
// survive unchanged; no random relocation, migration or cross-galaxy records.
export function createOrionStarField(entries, nebula) {
  const low = new Vector3(Infinity, Infinity, Infinity),
    high = low.clone().negate();
  for (const entry of entries) {
    const position = wordStarPosition(entry);
    low.min(position);
    high.max(position);
  }
  const origin = entries.length ? low.clone().add(high).multiplyScalar(0.5) : new Vector3();
  const span = entries.length ? high.clone().sub(low) : new Vector3();
  const width = (nebula.radius * nebula.dimensions[0]) / nebula.dimensions[1];
  const limits = [width * 0.95, nebula.radius * 0.85, nebula.radius * ORION_DEPTH_SCALE * 1.1];
  const scale = Math.min(8, ...span.toArray().map((length, i) => (length > 0 ? limits[i] / length : 8)));
  const center = new Vector3(...nebula.position);
  return {
    scale,
    position(entry) {
      return wordStarPosition(entry).sub(origin).multiplyScalar(scale).add(center);
    },
    stored(position) {
      return position.clone().sub(center).divideScalar(scale).add(origin);
    },
  };
}
