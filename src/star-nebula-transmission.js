import { Vector3 } from 'three';

// Visual extinction through the same reconstructed volume, not calibrated
// observed optical depth. Empty/thin gaps transmit more than dense gas.
export function createStarTransmission(medium) {
  const eye = new Vector3(),
    point = new Vector3();
  const data = medium.density.image.data,
    size = medium.density.image.width;
  function cloud(x, y, z) {
    const wrap = (v) => ((Math.floor((v - Math.floor(v)) * size) % size) + size) % size;
    return data[wrap(x * 0.36 + 0.17) + size * (wrap(y * 0.36 + 0.31) + size * wrap(z * 0.36 + 0.53))] / 255;
  }
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
    const length = Math.hypot(dx, dy, dz) * (end - start),
      steps = 16;
    let depth = 0;
    for (let i = 0; i < steps; i++) {
      const t = start + ((end - start) * (i + 0.5)) / steps,
        x = eye.x + dx * t,
        y = eye.y + dy * t,
        z = eye.z + dz * t;
      const n = cloud(x * 1.6, y * 1.6, z * 1.6),
        fine = cloud(x * 4.8 + 5.3, y * 4.8 + 1.7, z * 4.8 + 9);
      const valley =
        -0.42 +
        0.34 * (x + 0.18 * Math.sin(z * 2)) ** 2 +
        0.16 * z +
        0.12 * Math.sin(z * 3 + x * 2) +
        0.22 * (n - 0.5) +
        0.08 * (fine - 0.5);
      const wall = Math.exp(-(((y - valley) / 0.12) ** 2)),
        feather = Math.max(0, 1 - Math.hypot(x, y));
      const dust = Math.max(0, cloud(x * 3.9 + 7, y * 3.9 + 3, z * 3.9 + 2) - 0.48);
      depth += ((wall * (0.25 + 1.1 * n * n) + dust * 2) * feather * length) / steps;
    }
    return Math.exp(-depth * 2.2);
  };
}
