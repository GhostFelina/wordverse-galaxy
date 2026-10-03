import { createPremiumBodies } from './premium-bodies.js';
import { createNebulaVolume } from './nebula-volume.js';

export function createShowcaseScene(scene, camera) {
  const bodies = createPremiumBodies(scene);
  const gas = createNebulaVolume(scene);
  gas.focus({ scenePosition: [-20, 14, -110], kind: 'emission', seed: 4204, majorArcmin: 8 });
  let disposed = false;
  return {
    update(seconds, viewportHeight, pixelRatio) {
      if (disposed) return;
      bodies.update(seconds, camera, viewportHeight, pixelRatio);
      gas.update(camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      bodies.dispose();
      gas.dispose();
    },
  };
}
