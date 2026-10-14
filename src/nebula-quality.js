// Quantized budgets apply to motion AND settled frames. Rest never bypasses it.
export function createNebulaQuality() {
  let mode = 'auto',
    tier = 1,
    slow = 0,
    fast = 0;
  return {
    setMode(value) {
      if (['auto', 'high', 'balanced', 'low'].includes(value)) {
        mode = value;
        slow = fast = 0;
      }
    },
    sample(ms) {
      if (mode !== 'auto' || !Number.isFinite(ms) || ms <= 0) return;
      if (ms > 80) {
        tier = 0;
        slow = fast = 0;
        return;
      }
      slow = ms > 32 ? slow + 1 : 0;
      fast = ms < 19 ? fast + 1 : 0;
      if (slow >= 2) {
        tier = Math.max(0, tier - 1);
        slow = fast = 0;
      } else if (fast >= 360) {
        tier = Math.min(3, tier + 1);
        slow = fast = 0;
      }
    },
    budget(resting) {
      const index = mode === 'high' ? 3 : mode === 'balanced' ? 1 : mode === 'low' ? 0 : tier;
      const scale = [0.25, 0.5, 0.7, 1][index];
      return {
        scale: resting ? scale : scale * 0.8,
        steps: [24, 48, 80, 112][index],
        interval: [160, 100, 66, 50][index],
        tier: index,
      };
    },
  };
}
