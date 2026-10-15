import { Vector3 } from 'three';

export function placeWordStar(
  camera,
  records,
  { random = Math.random, width = 1440, height = 900, backZ = -1600 } = {},
) {
  camera.updateMatrixWorld();
  const ray = new Vector3(),
    candidate = new Vector3(),
    projected = new Vector3();
  for (let i = 0; i < 160; i++) {
    const x = -0.18 + random() * 0.92,
      y = -0.56 + random() * 1.12;
    // Different foreground/interior/background depths, independent of count.
    const z =
      random() < 0.35
        ? Math.min(camera.position.z - 160, backZ - random() * 400)
        : camera.position.z - 100 - random() * 1100;
    ray.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
    candidate.copy(camera.position).addScaledVector(ray, (z - camera.position.z) / ray.z);
    const separated = records.every((record) => {
      projected.set(record.x ?? 31, record.y ?? 0, record.z ?? 18).project(camera);
      return (
        projected.z > 1 ||
        projected.z < -1 ||
        Math.hypot(((projected.x - x) * width) / 2, ((projected.y - y) * height) / 2) > 42
      );
    });
    if (separated || i === 159) return { x: candidate.x, y: candidate.y, z: candidate.z };
  }
}
export function starApproach(distance, farDistance, radius = 0.45) {
  const near = radius * 1.35;
  return Math.max(
    0,
    Math.min(
      1,
      Math.log(Math.max(near, farDistance) / Math.max(near, distance)) /
        Math.log(Math.max(near + 0.01, farDistance) / near),
    ),
  );
}
