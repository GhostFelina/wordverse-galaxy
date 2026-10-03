import * as THREE from 'three';

// Stream a deterministic artistic star field around the camera; no catalog claims.
// Adjacent cells keep their world positions when the visible window advances.
export function createCosmicField(scene, compact = false) {
  const cellSize = 600;
  const perCell = compact ? 240 : 600;
  const count = 27 * perCell;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float size; varying vec3 tint; varying float fade;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        tint = color;
        fade = (1.0-smoothstep(300.0,550.0,length(view.xyz))) * smoothstep(1.0,20.0,-view.z);
        gl_PointSize = clamp(size * 400.0/max(10.0,-view.z),2.0,22.0);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `varying vec3 tint; varying float fade;
      void main() { float r = length(gl_PointCoord-0.5); if (r>0.5) discard;
        gl_FragColor = vec4(tint, exp(-r*r*24.0)*fade*0.8); }`,
  });
  const field = new THREE.Points(geometry, material);
  field.name = 'continuous-cosmic-star-field';
  field.frustumCulled = false;
  scene.add(field);
  // Stars occupy a fixed world volume. No camera-following sky or background image.
  const skyCount = compact ? 9000 : 24000;
  const skyPositions = new Float32Array(skyCount * 3);
  const skyColors = new Float32Array(skyCount * 3);
  const skySizes = new Float32Array(skyCount);
  let skySeed = 781239;
  const skyRand = () => (skySeed = (Math.imul(skySeed, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < skyCount; i++) {
    const azimuth = skyRand() * Math.PI * 2;
    const height = skyRand() * 2 - 1;
    const ring = Math.sqrt(1 - height * height);
    const radius = 800 + Math.cbrt(skyRand()) * 58000;
    skyPositions.set([Math.cos(azimuth) * ring * radius, height * radius, Math.sin(azimuth) * ring * radius], i * 3);
    skyColors.set(skyRand() > 0.68 ? [1, 0.85, 0.67] : [0.7, 0.84, 1], i * 3);
    skySizes[i] = skyRand() > 0.992 ? 12 + skyRand() * 20 : 1 + skyRand() * 4;
  }
  const skyGeometry = new THREE.BufferGeometry();
  skyGeometry.setAttribute('position', new THREE.BufferAttribute(skyPositions, 3));
  skyGeometry.setAttribute('color', new THREE.BufferAttribute(skyColors, 3));
  skyGeometry.setAttribute('size', new THREE.BufferAttribute(skySizes, 1));
  const skyMaterial = new THREE.ShaderMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float size; varying vec3 tint; varying float visibility; void main() { vec4 view=modelViewMatrix*vec4(position,1.0); tint=color; visibility=smoothstep(20.0,150.0,-view.z); gl_PointSize=clamp(size*1900.0/max(20.0,-view.z),.7,38.0); gl_Position=projectionMatrix*view; }`,
    fragmentShader: `varying vec3 tint; varying float visibility; void main() { float r=length(gl_PointCoord-0.5); if(r>0.5) discard; gl_FragColor=vec4(tint,exp(-r*r*24.0)*visibility*.6); }`,
  });
  const sky = new THREE.Points(skyGeometry, skyMaterial);
  sky.frustumCulled = false;
  sky.name = 'world-volume-distant-stars';
  scene.add(sky);
  let previous = '';
  return {
    capacity: count + skyCount,
    update(camera) {
      // Both meshes keep fixed world positions; only the bounded streaming window advances.
      const cx = Math.floor(camera.position.x / cellSize);
      const cy = Math.floor(camera.position.y / cellSize);
      const cz = Math.floor(camera.position.z / cellSize);
      const key = `${cx},${cy},${cz}`;
      if (key === previous) return;
      previous = key;
      let index = 0;
      for (let x = cx - 1; x <= cx + 1; x++)
        for (let y = cy - 1; y <= cy + 1; y++)
          for (let z = cz - 1; z <= cz + 1; z++) {
            let seed = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791) ^ 70331) >>> 0;
            const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
            for (let i = 0; i < perCell; i++, index++) {
              positions.set([(x + rand()) * cellSize, (y + rand()) * cellSize, (z + rand()) * cellSize], index * 3);
              const warm = rand() > 0.65;
              colors.set(warm ? [1, 0.8, 0.59] : [0.65, 0.82, 1], index * 3);
              sizes[index] = 0.6 + rand() * 1.9;
            }
          }
      for (const attribute of Object.values(geometry.attributes)) attribute.needsUpdate = true;
    },
    dispose() {
      scene.remove(field);
      scene.remove(sky);
      skyGeometry.dispose();
      skyMaterial.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
