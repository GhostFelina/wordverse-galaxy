// Measured frame time, not viewport width, controls render resolution.
export function createRenderQuality({ maximum = 1.7, onChange = () => {} } = {}) {
  let ratio = maximum;
  let slow = 0;
  let fast = 0;
  return {
    sample(milliseconds) {
      slow = milliseconds > 45 ? slow + 1 : 0;
      fast = milliseconds < 20 ? fast + 1 : 0;
      const next = slow >= 8 ? Math.max(0.6, ratio * 0.75) : fast >= 240 ? Math.min(maximum, ratio + 0.1) : ratio;
      if (next !== ratio) {
        ratio = next;
        slow = fast = 0;
        onChange(ratio);
      }
      return ratio;
    },
  };
}
