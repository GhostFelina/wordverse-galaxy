// Presentation-only sky locations. No record positions are used or changed.
export function createSkyPlacement({ random = Math.random, wide = false, previous } = {}) {
  const sample = () => Math.max(0, Math.min(0.999999, Number(random()) || 0));
  const zones = wide
    ? [
        [-0.52, 0.42],
        [0.5, 0.4],
        [-0.48, -0.18],
        [0.48, -0.18],
        [0, 0.5],
      ]
    : [
        [0.34, 0.42],
        [0.53, -0.05],
        [0.1, 0.58],
        [0.5, 0.55],
      ];
  let index = Math.floor(sample() * zones.length);
  if (previous) {
    for (let i = 0; i < zones.length; i++) {
      if (Math.hypot(zones[index][0] - previous[0], zones[index][1] - previous[1]) > 0.25) break;
      index = (index + 1) % zones.length;
    }
  }
  const center = [zones[index][0] + (sample() - 0.5) * 0.08, zones[index][1] + (sample() - 0.5) * 0.08];
  return { center, scale: 0.72 + sample() * 0.22, angle: -0.55 + sample() * 1.1 };
}
