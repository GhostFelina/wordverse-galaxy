import { Vector3 } from 'three';
import { sampleNebulaDensity } from './nebula-density.js';

// Visual extinction through the same reconstructed volume, not calibrated
// observed optical depth. Empty/thin gaps transmit more than dense gas.
export function createStarTransmission(medium) {
  const eye = new Vector3(),
    point = new Vector3();
  return (position, camera) => {
    medium.group.updateWorldMatrix(true, false);
    eye.copy(camera.position);
    medium.group.worldToLocal(eye);
    point.copy(position);
    medium.group.worldToLocal(point);
    const dx = point.x - eye.x,
      dy = point.y - eye.y,
      dz = point.z - eye.z;
    let start = 0,
      end = 1;
    for (const [a, b] of [
      [eye.x, dx],
      [eye.y, dy],
      [eye.z, dz],
    ]) {
      if (Math.abs(b) < 1e-8) {
        if (Math.abs(a) > 1) return 1;
        continue;
      }
      const u = (-1 - a) / b,
        v = (1 - a) / b;
      start = Math.max(start, Math.min(u, v));
      end = Math.min(end, Math.max(u, v));
    }
    if (end <= start) return 1;
    const length = Math.hypot(dx, dy, dz * 3.6) * (end - start),
      steps = 16;
    let depth = 0;
    for (let i = 0; i < steps; i++) {
      const t = start + ((end - start) * (i + 0.5)) / steps,
        x = eye.x + dx * t,
        y = eye.y + dy * t,
        z = eye.z + dz * t;
      depth += (sampleNebulaDensity(medium.density, x, y, z) * length) / steps;
    }
    return Math.exp(-depth * 2.2 * (medium.strength ?? 1));
  };
}
