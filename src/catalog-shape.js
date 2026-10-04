// Original, seeded morphology studies. Coordinates are an artistic scene layout,
// not astrometry or a simulation of individual observed stars.
export function sampleGalaxy(record, count = 3600) {
  let state = record.seed >>> 0;
  const rand = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const cos = Math.cos(record.rotation);
  const sin = Math.sin(record.rotation);
  for (let i = 0; i < count; i++) {
    const core = rand() < (record.morphology === 'elliptical' ? 1 : record.morphology === 'edge-on' ? 0.45 : 0.23);
    const radius = core
      ? Math.pow(rand(), 1.5) * (record.morphology === 'elliptical' ? 68 : 36)
      : 7 + Math.pow(rand(), 0.85) * 71;
    let angle = rand() * Math.PI * 2;
    if (!core && i % 4 !== 0 && ['spiral', 'grand-design'].includes(record.morphology)) {
      angle =
        (i % 2) * Math.PI + radius * 0.069 + (rand() - 0.5) * (record.morphology === 'grand-design' ? 0.65 : 0.95);
    }
    let x = Math.cos(angle) * radius;
    let y = Math.sin(angle) * radius * (core ? Math.max(record.inclination, 0.58) : record.inclination);
    const z = (rand() - 0.5) * (core ? 8 : 3);
    if (!core && record.morphology === 'barred' && radius < 32) {
      x = (rand() - 0.5) * 62;
      y *= 0.18;
    }
    if (!core && record.morphology === 'lenticular') {
      y *= 0.55;
    }
    if (record.morphology === 'irregular') {
      x += Math.sin(y * 0.09) * 16;
      y += Math.cos(x * 0.11) * 9;
    }
    const lane = !core && ['edge-on', 'starburst'].includes(record.morphology) && Math.abs(y) < 2.8;
    let color = core ? [1, 0.78 + rand() * 0.14, 0.55 + rand() * 0.16] : [0.5 + rand() * 0.3, 0.67 + rand() * 0.2, 1];
    if (record.morphology === 'starburst' && i % 5 === 0) {
      // Warm ionized-gas outflow perpendicular to the stellar disk.
      x *= 0.19;
      y = (rand() < 0.5 ? -1 : 1) * (8 + rand() * 43) * (0.6 + Math.abs(x) / 15);
      color = [1, 0.23 + rand() * 0.2, 0.28];
    }
    if (!core && i % 19 === 0 && record.morphology === 'grand-design') color = [1, 0.43, 0.68];
    positions.set([x * cos - y * sin, x * sin + y * cos, z], i * 3);
    colors.set(
      color.map((channel) => channel * (lane ? 0.1 : 1)),
      i * 3,
    );
    sizes[i] = core ? 1.1 + rand() * 1.6 : 0.6 + rand() * 1.5;
  }
  return { positions, colors, sizes };
}

export function catalogOpacity(cameraZ) {
  const value = Math.max(0, Math.min(1, (cameraZ - 170) / 190));
  return value * value * (3 - 2 * value);
}
