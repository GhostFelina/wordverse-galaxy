import * as THREE from 'three';

export const nebulaRecords = [
  {
    id: 'M42',
    kind: 'emission',
    scenePosition: [-160, 85, -80],
    size: [190, 140],
    source: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-42/',
  },
  {
    id: 'M57',
    kind: 'planetary',
    scenePosition: [225, -95, -155],
    size: [95, 78],
    source: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-57/',
  },
  {
    id: 'M1',
    kind: 'supernova-remnant',
    scenePosition: [-70, -145, -240],
    size: [130, 105],
    source: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-1/',
  },
];

// Original false-color nebula studies; fixed artistic world placement, not photos.
function nebulaMap(kind) {
  const size = 256;
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = (x - size / 2) / (size / 2),
        ny = (y - size / 2) / (size / 2);
      const r = Math.hypot(nx, ny),
        a = Math.atan2(ny, nx);
      const noise = 0.6 + 0.2 * Math.sin(nx * 19 + Math.sin(ny * 14)) + 0.12 * Math.cos(ny * 29 + nx * 17);
      let glow;
      if (kind === 'planetary')
        glow =
          Math.exp(-(((r - 0.58) / 0.1) ** 2)) * (0.72 + 0.28 * Math.sin(a * 11) ** 2) + 0.07 * Math.exp(-r * r * 8);
      else if (kind === 'supernova-remnant')
        glow = Math.max(0, 1 - r * r) ** 2 * (0.12 + 0.88 * Math.sin(a * 17 + r * 34 + Math.sin(a * 7)) ** 12);
      else
        glow = Math.max(0, 1 - r * r) ** 2 * noise * (0.45 + 0.55 * Math.sin(nx * 8 - ny * 6 + Math.sin(ny * 5)) ** 2);
      const warm = kind === 'supernova-remnant' || r > 0.5;
      rgba.set(
        warm
          ? [231, 117, 93, Math.round(Math.min(1, glow) * 190)]
          : [93, 174, 231, Math.round(Math.min(1, glow) * 170)],
        (y * size + x) * 4,
      );
    }
  const map = new THREE.DataTexture(rgba, size, size);
  map.colorSpace = THREE.SRGBColorSpace;
  map.minFilter = map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return map;
}

export function createSpaceDetails(scene, compact = false) {
  const nebulae = nebulaRecords.map((record) => {
    const group = new THREE.Group();
    group.position.fromArray(record.scenePosition);
    const map = nebulaMap(record.kind);
    for (let i = 0; i < 3; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      sprite.scale.set(record.size[0] * (1 - i * 0.09), record.size[1] * (1 - i * 0.09), 1);
      sprite.position.z = -i * 9;
      sprite.material.rotation = i * 0.06;
      group.add(sprite);
    }
    group.name = `nebula-${record.id}`;
    scene.add(group);
    return group;
  });
  const region = new THREE.Group();
  region.position.set(31, 0, 0);
  scene.add(region);
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i),
      y = vertices.getY(i),
      z = vertices.getZ(i);
    const rough = 0.85 + 0.18 * Math.sin(x * 13 + y * 17 + z * 23);
    vertices.setXYZ(i, x * rough, y * rough, z * rough);
  }
  geometry.computeVertexNormals();
  const material = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0 } },
    transparent: true,
    vertexShader: `varying vec3 n; void main() { n=normalize(normalMatrix*mat3(instanceMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float opacity; varying vec3 n; void main() { float light=0.24+0.76*max(0.0,dot(normalize(n),normalize(vec3(-0.5,0.7,1.0)))); gl_FragColor=vec4(vec3(0.34,0.31,0.27)*light,opacity); }`,
  });
  const count = compact ? 12 : 28;
  const rocks = new THREE.InstancedMesh(geometry, material, count);
  region.add(rocks);
  const transform = new THREE.Object3D();
  let seed = 9327;
  const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  function populate(nextSeed = 9327) {
    seed = nextSeed >>> 0;
    for (let i = 0; i < count; i++) {
      transform.position.set((rand() - 0.5) * 150, (rand() - 0.5) * 100, -40 + rand() * 65);
      transform.rotation.set(rand() * 6, rand() * 6, rand() * 6);
      const size = 0.35 + rand() * 0.95;
      transform.scale.set(size * (0.7 + rand()), size * (0.6 + rand() * 0.6), size);
      transform.updateMatrix();
      rocks.setMatrixAt(i, transform.matrix);
    }
    rocks.instanceMatrix.needsUpdate = true;
  }
  populate();
  return {
    focus(record) {
      region.position.fromArray(record.scenePosition);
      populate(record.seed);
    },
    home(seed) {
      region.position.set(31, 0, 0);
      populate(seed);
    },
    update(camera) {
      for (const group of nebulae) {
        const distance = camera.position.distanceTo(group.position);
        const opacity =
          (1 - THREE.MathUtils.smoothstep(distance, 450, 1300)) * THREE.MathUtils.smoothstep(distance, 10, 55);
        group.visible = opacity > 0.001 && camera.position.z > group.position.z - 70;
        group.children.forEach((sprite, index) => (sprite.material.opacity = opacity * (index === 0 ? 0.56 : 0.19)));
      }
      const distance = camera.position.distanceTo(region.position);
      material.uniforms.opacity.value = 1 - THREE.MathUtils.smoothstep(distance, 85, 280);
      region.visible = material.uniforms.opacity.value > 0.001;
    },
    dispose() {
      for (const group of nebulae) {
        scene.remove(group);
        group.children[0].material.map.dispose();
        group.children.forEach((child) => child.material.dispose());
      }
      scene.remove(region);
      geometry.dispose();
      material.dispose();
    },
  };
}
