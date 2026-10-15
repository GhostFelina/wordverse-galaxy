// Accelerated visual age, not astronomical time or a mass-dependent simulator.
// One minute represents one visual day; records, dates and radii stay unchanged.
const phases = [
  { minute: 0, stageId: 'newborn', color: '#deedff', glow: '#a9cfff', size: 1 },
  { minute: 1, stageId: 'young', color: '#bddcff', glow: '#76b4ff', size: 1.02 },
  { minute: 7, stageId: 'mature', color: '#fff1c6', glow: '#ffcb75', size: 1.05 },
  { minute: 30, stageId: 'aging', color: '#ffc891', glow: '#ff8b44', size: 1.15 },
  { minute: 90, stageId: 'redGiant', color: '#ff8963', glow: '#e64f32', size: 1.36 },
  { minute: 365, stageId: 'whiteDwarf', color: '#c4ddff', glow: '#7cb7ef', size: 0.78 },
];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const hex = (channels) =>
  '#' +
  channels
    .map((c) =>
      Math.round(Math.max(0, Math.min(1, c)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
const smooth = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => rgb(a).map((c, i) => c + (rgb(b)[i] - c) * t);

export function stellarEvolution(createdAt, now = Date.now()) {
  const elapsed = now - Date.parse(createdAt);
  const ageMinutes = Number.isFinite(elapsed) ? Math.max(0, elapsed / 60000) : 0;
  let index = phases.findLastIndex((phase) => phase.minute <= ageMinutes);
  index = Math.max(0, index);
  const phase = phases[index],
    next = phases[index + 1] || phase;
  const fraction = next === phase ? 0 : smooth((ageMinutes - phase.minute) / (next.minute - phase.minute));
  return {
    stageId: phase.stageId,
    color: hex(mix(phase.color, next.color, fraction)),
    glow: hex(mix(phase.glow, next.glow, fraction)),
    size: phase.size,
    ageDays: Math.floor(ageMinutes / 1440),
    ageMinutes,
  };
}

export function stellarSpectrum(record, now = Date.now(), animateTone = true) {
  const appearance = stellarEvolution(record.createdAt, now);
  let seed = 2166136261;
  for (const char of record.id || '') seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const phase = (seed / 4294967296) * Math.PI * 2;
  const minute = Math.floor(appearance.ageMinutes);
  const signal = (i) => 0.65 * Math.sin(i * 1.618 + phase) + 0.35 * Math.sin(i * 0.413 + phase * 0.31);
  const tone = animateTone
    ? (signal(minute) + (signal(minute + 1) - signal(minute)) * smooth(appearance.ageMinutes - minute)) * 0.13
    : 0;
  const channels = rgb(appearance.color);
  return { ...appearance, color: hex([channels[0] + tone, channels[1], channels[2] - tone]) };
}
