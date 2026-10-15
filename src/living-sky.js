// Session-only direction. Randomness never receives record data or persists.
import { SKY_EVENTS } from './sky-event-catalog.js';
const durations = { ...SKY_EVENTS, blackhole: 45 };
export function createLivingSky({ random = Math.random } = {}) {
  const sample = () => Math.max(0, Math.min(0.999999, Number(random()) || 0));
  let enabled = true,
    remaining = 12 + sample() * 10,
    active = null,
    age = 0,
    previous = null,
    bag = [];
  function nextKind() {
    if (!bag.length) {
      bag = Object.keys(durations);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(sample() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    let index = bag.findIndex((kind) => kind !== previous);
    if (index < 0) {
      bag.unshift('blackhole');
      index = 0;
    }
    const [kind] = bag.splice(index, 1);
    previous = kind;
    return kind;
  }
  const gap = () => 45 + sample() * 60;
  return {
    get enabled() {
      return enabled;
    },
    get active() {
      return active;
    },
    get envelope() {
      if (!active) return 1;
      const duration = durations[active],
        fadeIn = Math.min(1, age / 1.5),
        fadeOut = Math.min(1, (duration - age) / 2);
      const value = Math.max(0, Math.min(fadeIn, fadeOut));
      return value * value * (3 - 2 * value);
    },
    setEnabled(value) {
      enabled = !!value;
      active = null;
      age = 0;
      remaining = enabled ? 12 + sample() * 10 : gap();
    },
    manual(kind) {
      active = null;
      age = 0;
      remaining = 90;
      if (!kind) enabled = false;
    },
    reset() {
      active = null;
      age = 0;
      previous = null;
      bag = [];
      remaining = 12 + sample() * 10;
    },
    tick(delta, kind = null, busy = false) {
      if (!enabled) return null;
      delta = Math.min(0.1, Math.max(0, Number.isFinite(delta) ? delta : 0));
      if (active) {
        if (kind !== active) {
          active = null;
          age = 0;
          remaining = gap();
          return null;
        }
        age += delta;
        if (age >= durations[active]) {
          active = null;
          age = 0;
          remaining = gap();
          return { kind: null };
        }
        return null;
      }
      if (busy || kind) return null;
      remaining -= delta;
      if (remaining > 1e-8) return null;
      active = nextKind();
      age = 0;
      return { kind: active };
    },
  };
}
