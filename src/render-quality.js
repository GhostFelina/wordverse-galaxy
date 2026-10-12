// Measured frame time, not viewport width, controls render resolution.
export function createRenderQuality({ maximum = 1.7, onChange = () => {} } = {}) {
  maximum = Math.max(0.1, Number.isFinite(maximum) ? maximum : 1.7);
  let mode = 'auto';
  let ratio = maximum;
  let slow = 0;
  let fast = 0;
  return {
    get ratio() {
      return ratio;
    },
    get mode() {
      return mode;
    },
    setMode(value) {
      if (!['auto', 'high', 'balanced', 'low'].includes(value)) return;
      mode = value;
      slow = fast = 0;
      ratio = Math.min(maximum, { auto: maximum, high: maximum, balanced: 1, low: 0.75 }[mode]);
      onChange(ratio);
    },
    resetTiming() {
      slow = fast = 0;
    },
    sample(milliseconds) {
      if (mode !== 'auto' || !Number.isFinite(milliseconds) || milliseconds <= 0) return ratio;
      slow = milliseconds > 45 ? slow + 1 : 0;
      fast = milliseconds < 20 ? fast + 1 : 0;
      const next =
        slow >= 8
          ? Math.max(Math.min(0.6, maximum), ratio * 0.75)
          : fast >= 240
            ? Math.min(maximum, ratio + 0.1)
            : ratio;
      if (next !== ratio) {
        ratio = next;
        slow = fast = 0;
        onChange(ratio);
      }
      return ratio;
    },
  };
}
