// One ordered source for shader IDs, the director and translated controls.
// These are compressed artistic depictions of astronomical processes.
export const SKY_EVENT_CATALOG = Object.freeze(
  [
    ['meteor', 6],
    ['supernova', 18],
    ['blackhole', 0],
    ['kilonova', 22],
    ['comet', 24],
    ['pulsar', 28],
    ['protostar', 32],
    ['jet', 28],
    ['bowshock', 30],
    ['ionfront', 32],
    ['dustwave', 30],
    ['reflection', 34],
    ['darkcloud', 34],
    ['globule', 32],
    ['pillar', 34],
    ['windbubble', 32],
    ['planetary', 34],
    ['remnant', 32],
    ['binary', 30],
    ['nova', 24],
    ['lightEcho', 30],
    ['magnetic', 32],
  ].map(([id, duration]) => Object.freeze({ id, duration })),
);
export const SKY_EVENTS = Object.freeze(
  Object.fromEntries(SKY_EVENT_CATALOG.map(({ id, duration }) => [id, duration])),
);
