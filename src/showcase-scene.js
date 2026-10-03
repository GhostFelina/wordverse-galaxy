import { createPremiumBodies } from './premium-bodies.js';

export function createShowcaseScene(scene, camera) {
  const bodies = createPremiumBodies(scene, { kind: 'star', radius: 10 });
  let disposed = false;
  return {
    update(seconds, viewportHeight, pixelRatio) {
      if (disposed) return;
      bodies.update(seconds, camera, viewportHeight, pixelRatio);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      bodies.dispose();
    },
  };
}
