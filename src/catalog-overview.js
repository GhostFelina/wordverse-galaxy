import * as THREE from 'three';
import { drawCatalogPreview } from './catalog-layer.js';

const styles = ['spiral', 'barred', 'elliptical', 'lenticular', 'edge-on', 'irregular', 'starburst', 'grand-design'];

export function createOverview(scene, records) {
  const atlas = document.createElement('canvas');
  atlas.width = 2048;
  atlas.height = 1024;
  const context = atlas.getContext('2d');
  const tile = document.createElement('canvas');
  tile.width = tile.height = 256;
  for (let index = 0; index < styles.length * 4; index++) {
    drawCatalogPreview(
      tile,
      { seed: 901 + index, morphology: styles[index % styles.length], inclination: 0.8, rotation: 0 },
      { transparent: true },
    );
    context.drawImage(tile, (index % 8) * 256, Math.floor(index / 8) * 256);
  }
  const texture = new THREE.CanvasTexture(atlas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.PlaneGeometry(2, 2);
  geometry.setAttribute(
    'atlasIndex',
    new THREE.InstancedBufferAttribute(
      new Float32Array(records.map((record) => styles.indexOf(record.morphology) + (record.seed % 4) * 8)),
      1,
    ),
  );
  const material = new THREE.ShaderMaterial({
    uniforms: { atlas: { value: texture }, opacity: { value: 0 } },
    vertexShader: `attribute float atlasIndex;
      varying vec2 tileUV;
      void main() {
        vec2 offset = vec2(mod(atlasIndex, 8.0), 3.0 - floor(atlasIndex / 8.0));
        tileUV = (uv + offset) / vec2(8.0, 4.0);
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform sampler2D atlas;
      uniform float opacity;
      varying vec2 tileUV;
      void main() {
        vec4 cloud = texture2D(atlas, tileUV);
        gl_FragColor = vec4(cloud.rgb, cloud.a * opacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, records.length);
  mesh.name = '300-real-catalog-galaxies';
  mesh.frustumCulled = false;
  const transform = new THREE.Object3D();
  records.forEach((record, index) => {
    transform.position.fromArray(record.scenePosition);
    transform.rotation.z = record.rotation;
    const size = 33 + Math.min(25, Math.sqrt(record.majorArcmin || 3) * 5);
    transform.scale.set(size, size * Math.max(0.35, record.inclination), 1);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  });
  scene.add(mesh);
  const position = new THREE.Vector3();
  let shown = false;
  let worldScale = 1;
  return {
    update(camera, opacity) {
      const scale = Math.max(1, camera.position.z / Math.max(1750, 2400 / camera.aspect));
      worldScale = scale;
      mesh.scale.setScalar(scale);
      material.uniforms.opacity.value = opacity;
      mesh.visible = opacity > 0.001;
      shown = mesh.visible;
      if (!mesh.visible) return 0;
      let visible = 0;
      for (const record of records) {
        position.fromArray(record.scenePosition).multiplyScalar(scale).project(camera);
        if (Math.abs(position.x) < 1 && Math.abs(position.y) < 1 && position.z > -1 && position.z < 1) visible++;
      }
      return visible;
    },
    pick(camera, x, y, width, height) {
      if (!shown) return null;
      let nearest = null,
        best = 22;
      for (const record of records) {
        position.fromArray(record.scenePosition).multiplyScalar(worldScale).project(camera);
        if (position.z < -1 || position.z > 1) continue;
        const distance = Math.hypot((position.x * 0.5 + 0.5) * width - x, (0.5 - position.y * 0.5) * height - y);
        if (distance < best) {
          best = distance;
          nearest = record;
        }
      }
      return nearest;
    },
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
