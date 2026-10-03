import * as THREE from 'three';
import featured from './data/catalog/galaxies.json';
import catalogRows from './data/catalog/galaxies-300.json';
import { createOverview } from './catalog-overview.js';
import { sampleGalaxy } from './catalog-shape.js';

export const catalogRecords = catalogRows.map((row) => {
  const known = featured.find((record) => record.id === row.messier);
  return known ? { ...row, ...known, scenePosition: row.scenePosition, catalogId: row.id } : row;
});
export const galaxies = catalogRecords.filter((record) => record.nameKey);

export function overviewZoom(aspect) {
  return Math.max(1750, 2400 / aspect);
}

export function createCatalogLayer(scene, { compact = false } = {}) {
  const root = new THREE.Group();
  root.name = 'background-catalog';
  const materials = [];
  const clouds = [];
  const overview = createOverview(scene, catalogRecords);
  function addRecord(record) {
    const { positions, colors, sizes } = sampleGalaxy(record, compact ? 2800 : 6500);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('pointSize', new THREE.BufferAttribute(sizes, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 } },
      vertexShader: `attribute float pointSize;
        varying vec3 tint;
        void main() {
          tint = color;
          vec4 view = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(pointSize * 850.0 / max(1.0, -view.z), 1.0, 14.0);
          gl_Position = projectionMatrix * view;
        }`,
      fragmentShader: `uniform float opacity;
        varying vec3 tint;
        void main() {
          float r = length(gl_PointCoord - vec2(0.5));
          if (r > 0.5) discard;
          float glow = exp(-r * r * 20.0);
          gl_FragColor = vec4(tint, glow * opacity * 0.65);
        }`,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    material.userData.position = [...record.scenePosition];
    materials.push(material);
    const stars = new THREE.Points(geometry, material);
    stars.position.fromArray(record.scenePosition);
    root.add(stars);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    drawCatalogPreview(canvas, record, { transparent: true });
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const haze = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    haze.position.copy(stars.position);
    haze.position.z -= 2;
    haze.scale.set(180, 180, 1);
    root.add(haze);
    clouds.push(haze);
    return [stars, haze];
  }
  for (const record of galaxies) addRecord(record);
  let extra = [];
  scene.add(root);
  return {
    pick: (...args) => overview.pick(...args),
    focus(record) {
      for (const child of extra) {
        root.remove(child);
        child.geometry?.dispose();
        child.material.map?.dispose();
        child.material.dispose();
        const index = child.isSprite ? clouds.indexOf(child) : materials.indexOf(child.material);
        if (index >= 0) (child.isSprite ? clouds : materials).splice(index, 1);
      }
      extra = record.nameKey ? [] : addRecord(record);
    },
    update(camera) {
      root.visible = true;
      for (const material of materials) {
        const position = material.userData.position;
        const depth = camera.position.z - position[2];
        const lateral = Math.hypot(camera.position.x - position[0], camera.position.y - position[1]);
        const far = THREE.MathUtils.smoothstep(Math.hypot(depth, lateral), 650, 1200);
        const near = THREE.MathUtils.smoothstep(depth, 45, 180);
        material.uniforms.opacity.value = depth > 0 ? (1 - far) * (0.2 + near * 0.8) : 0;
        material.visible = material.uniforms.opacity.value > 0.001;
      }
      for (const cloud of clouds) {
        const depth = camera.position.z - cloud.position.z;
        const lateral = Math.hypot(camera.position.x - cloud.position.x, camera.position.y - cloud.position.y);
        cloud.material.opacity =
          depth > 0
            ? 0.7 *
              (1 - THREE.MathUtils.smoothstep(Math.hypot(depth, lateral), 650, 1200)) *
              THREE.MathUtils.smoothstep(depth, 45, 180)
            : 0;
        cloud.visible = cloud.material.opacity > 0.001;
      }
      return overview.update(camera, 1);
    },
    dispose() {
      overview.dispose();
      scene.remove(root);
      for (const child of root.children) {
        child.geometry?.dispose();
        child.material.map?.dispose();
        child.material.dispose();
      }
    },
  };
}

export function drawCatalogPreview(canvas, record, { transparent = false } = {}) {
  const context = canvas.getContext('2d');
  const { positions, colors } = sampleGalaxy(record, 3600);
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  if (!transparent) {
    context.fillStyle = '#030711';
    context.fillRect(0, 0, width, height);
  }
  context.globalCompositeOperation = 'lighter';
  const scale = Math.min(width / 180, height / 180);
  for (let i = 0; i < positions.length / 3; i++) {
    const x = width / 2 + positions[i * 3] * scale;
    const y = height / 2 - positions[i * 3 + 1] * scale;
    const color = colors.subarray(i * 3, i * 3 + 3);
    context.fillStyle = `rgba(${Math.round(color[0] * 255)},${Math.round(color[1] * 255)},${Math.round(color[2] * 255)},0.42)`;
    context.fillRect(x, y, 1.2, 1.2);
  }
  context.filter = transparent ? 'blur(3px)' : 'blur(1.5px)';
  context.globalAlpha = 0.55;
  context.drawImage(canvas, 0, 0);
  context.filter = 'none';
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
}
