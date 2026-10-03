// Display-only layout. Stored entry coordinates and backups stay untouched.
export function coreOrbit(entry, count) {
  const x = Number.isFinite(entry.x) ? entry.x - 31 : 0;
  const y = Number.isFinite(entry.y) ? entry.y : 0;
  const rotatedX = x * Math.cos(0.17) - y * Math.sin(0.17);
  const rotatedY = x * Math.sin(0.17) + y * Math.cos(0.17);
  const rawRadius = Math.hypot(rotatedX, rotatedY / 0.57);
  const limit = 14 + Math.min(56, Math.sqrt(Math.max(0, count)) * 3.6);
  return { radius: Math.max(4, limit * Math.tanh(rawRadius / limit)), phase: Math.atan2(rotatedY / 0.57, rotatedX) };
}

export function setGalacticPivot(group, extent, angle) {
  group.scale.setScalar(extent);
  group.rotation.z = angle;
  group.position.x = 31 - 31 * extent * Math.cos(angle);
  group.position.y = -31 * extent * Math.sin(angle);
}
