// Kepler position at each record's published epoch. Display scale is artistic.
export function asteroidPosition(record, scale = 90) {
  const rad = Math.PI / 180;
  const mean = record.meanAnomalyDeg * rad;
  let eccentric = mean;
  for (let i = 0; i < 12; i++)
    eccentric -=
      (eccentric - record.eccentricity * Math.sin(eccentric) - mean) / (1 - record.eccentricity * Math.cos(eccentric));
  const x = record.semimajorAxisAu * (Math.cos(eccentric) - record.eccentricity);
  const y = record.semimajorAxisAu * Math.sqrt(1 - record.eccentricity ** 2) * Math.sin(eccentric);
  const w = record.argumentPerihelionDeg * rad,
    n = record.ascendingNodeDeg * rad,
    inc = record.inclinationDeg * rad;
  const u = x * Math.cos(w) - y * Math.sin(w),
    v = x * Math.sin(w) + y * Math.cos(w);
  return [
    31 + scale * (u * Math.cos(n) - v * Math.sin(n) * Math.cos(inc)),
    scale * v * Math.sin(inc),
    scale * (u * Math.sin(n) + v * Math.cos(n) * Math.cos(inc)) - 330,
  ];
}
