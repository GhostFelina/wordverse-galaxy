import * as THREE from 'three';
import volume from './data/nebula-density.json';

export function createNebulaDensity({ load = typeof window === 'undefined' ? null : loadCompressed } = {}) {
  const textures = volume.assets.map((asset, index) => {
    const texture = new THREE.Data3DTexture(new Uint8Array(index === 0 ? [0, 255, 0, 128] : [128]), 1, 1, 1);
    texture.format = index === 0 ? THREE.RGBAFormat : THREE.RedFormat;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.wrapS = texture.wrapT = texture.wrapR = index === 0 ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    return texture;
  });
  let disposed = false,
    ready = !load,
    failed = false;
  const promise = load
    ? Promise.all(
        volume.assets.map(async (asset, index) => {
          const data = await load(asset.texture);
          if (data.byteLength !== asset.bytes) throw new Error('Invalid nebula volume length');
          if (disposed) return;
          const [width, height, depth] = asset.dimensions;
          textures[index].image = { data: new Uint8Array(data), width, height, depth };
          textures[index].needsUpdate = true;
        }),
      )
        .then(() => {
          if (!disposed) ready = true;
        })
        .catch(() => {
          if (!disposed) failed = true;
        })
    : Promise.resolve();
  return {
    density: textures[0],
    detail: textures[1],
    promise,
    get ready() {
      return ready;
    },
    get failed() {
      return failed;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      textures.forEach((t) => t.dispose());
    },
  };
}
async function loadCompressed(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Nebula volume unavailable');
  return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}

// The CPU samples the same finite field used by the shader, including after load.
export function sampleNebulaDensity(texture, x, y, z) {
  if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) >= 1) return 0;
  const { data, width: size } = texture.image;
  const axes = [x, y, z].map((v) => (v * 0.5 + 0.5) * (size - 1));
  const [ix, iy, iz] = axes.map(Math.floor),
    [fx, fy, fz] = axes.map((v, i) => v - [ix, iy, iz][i]);
  let sum = 0;
  for (let k = 0; k < 2; k++)
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < 2; i++) {
        const index =
          (Math.min(size - 1, ix + i) + size * (Math.min(size - 1, iy + j) + size * Math.min(size - 1, iz + k))) * 4;
        const value = data[index] / 255;
        sum += value * (i ? fx : 1 - fx) * (j ? fy : 1 - fy) * (k ? fz : 1 - fz);
      }
  return sum * sum * 2.5;
}
