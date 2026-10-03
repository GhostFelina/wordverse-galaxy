import * as THREE from 'three';
import featured from './data/catalog/galaxies.json';
import catalogRows from './data/catalog/galaxies-300.json';
import { createOverview } from './catalog-overview.js';
import { sampleGalaxy, catalogOpacity } from './catalog-shape.js';

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
    update(camera, distance = camera.position.z, exploring = false) {
      const cameraZ = distance;
      const opacity = exploring ? 1 : catalogOpacity(cameraZ);
      const far = THREE.MathUtils.smoothstep(cameraZ, 650, 1200);
      const near = exploring ? THREE.MathUtils.smoothstep(cameraZ, 45, 180) : 1;
      root.visible = opacity > 0.001;
      for (const material of materials) material.uniforms.opacity.value = opacity * (1 - far) * (0.2 + near * 0.8);
      for (const cloud of clouds) cloud.material.opacity = opacity * 0.7 * (1 - far) * near;
      return overview.update(camera, far);
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
