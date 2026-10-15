import * as THREE from 'three';
import { createNebulaDensity } from './nebula-density.js';
import { createNebulaQuality } from './nebula-quality.js';
import { nebulaVertex, nebulaFragment } from './nebula-shader.js';
import images from './data/nebula-images.json';
import { nebulaExperience } from './nebula-experiences.js';
import { layoutNebulae, ORION_DEPTH_SCALE, ORION_PRINCIPAL_Z } from './nebula-layout.js';
import { createNebulaEnvironment } from './nebula-environment.js';

export function createNebulaSystem(
  scene,
  camera,
  { loader = new THREE.TextureLoader(), compact = false, fieldStars = true, densityFactory = createNebulaDensity } = {},
) {
  const records = layoutNebulae(images, 8042026, camera.aspect);
  const geometry = new THREE.BoxGeometry(2, 2, 2),
    volumeData = densityFactory(),
    density = volumeData.density,
    quality = createNebulaQuality();
  const root = new THREE.Group();
  root.name = 'orion-volumetric-system';
  scene.add(root);
  const raycaster = new THREE.Raycaster(),
    frustum = new THREE.Frustum(),
    projection = new THREE.Matrix4();
  const sphere = new THREE.Sphere(),
    localEye = new THREE.Vector3(),
    pickBounds = new THREE.Box3();
  let disposed = false,
    loaded = 0;
  const alternateVolumes = new Map();
  let activeVolume = volumeData,
    activeExperience = 'orion',
    selectionRevision = 0;
  function pruneVolumes() {
    for (const [id, entry] of alternateVolumes) {
      if (alternateVolumes.size <= 3) break;
      if (id === activeExperience || !entry.settled) continue;
      entry.volume.dispose();
      entry.guide?.dispose();
      alternateVolumes.delete(id);
    }
  }
  let assetFailed = false;
  let highResolutionState = 'idle';
  let shaderState = 'idle';
  let lastGasFrame = 0;
  const lastGasView = new THREE.Matrix4();
  let lastCameraMotion = 0,
    lastVolumeFrame = 0,
    lastOpticalWidth = 0,
    lastLoaded = -1,
    refinedFrame = false;
  const nodes = records.map((record) => {
    const group = new THREE.Group();
    group.position.fromArray(record.position);
    group.scale.set(
      (record.radius * record.dimensions[0]) / record.dimensions[1],
      record.radius,
      record.radius * ORION_DEPTH_SCALE,
    );
    root.add(group);
    const environment = fieldStars
      ? createNebulaEnvironment(group, record.id)
      : { count: 0, brightStarCount: 0, update: () => 0, dispose() {} };
    let readyAssets = 0;
    const ready = () => {
      if (!disposed && ++readyAssets === 2) loaded++;
    };
    const texture = loader.load(
      !fieldStars ? record.starlessTexture.texture : compact ? record.texture : record.gasTexture.texture,
      ready,
      undefined,
      () => {
        assetFailed = true;
      },
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 1;
    const infrared = loader.load(record.infrared.texture, ready, undefined, () => {
      assetFailed = true;
    });
    infrared.colorSpace = THREE.SRGBColorSpace;
    infrared.anisotropy = 1;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        image: { value: texture },
        infrared: { value: infrared },
        densityMap: { value: density },
        detailMap: { value: volumeData.detail },
        eye: { value: new THREE.Vector3() },
        time: { value: 0 },
        steps: { value: 48 },
        opticalLod: { value: 0 },
        infraredLod: { value: 0 },
        principalZ: { value: record.principalLocalZ ?? ORION_PRINCIPAL_Z },
        stellarSuppression: { value: fieldStars ? 1 : 0 },
        gasDensity: { value: 0.85 },
        gasLight: { value: 1 },
        encodedHdr: { value: 0 },
        ionVeil: { value: 0 },
        gasCool: { value: new THREE.Vector3(0.055, 0.16, 0.32) },
        gasWarm: { value: new THREE.Vector3(0.56, 0.22, 0.09) },
        gasGlow: { value: 1 },
        guideEnabled: { value: 1 },
      },
      vertexShader: nebulaVertex,
      fragmentShader: nebulaFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const volume = new THREE.Mesh(geometry, material);
    volume.name = 'orion-continuous-gas';
    volume.layers.set(1);
    group.add(volume);
    return { record, group, texture, infrared, material, environment };
  });
  // Keep motion and settled buffers alive: wheel input must not dispose and
  // reallocate the full-resolution framebuffer at each start/stop.
  const motionTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, type: THREE.HalfFloatType });
  const settledTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, type: THREE.HalfFloatType });
  let target = motionTarget;
  const compositeScene = new THREE.Scene(),
    compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const compositeMaterial = new THREE.ShaderMaterial({
    uniforms: { image: { value: target.texture }, encodedHdr: { value: 0 } },
    vertexShader: 'varying vec2 imageUv;void main(){imageUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `uniform sampler2D image;uniform float encodedHdr;varying vec2 imageUv;void main(){gl_FragColor=texture2D(image,imageUv);
    gl_FragColor.rgb/=max(.00001,gl_FragColor.a);
    if(encodedHdr>.5)gl_FragColor.rgb/=max(vec3(.0001),1.-gl_FragColor.rgb);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor.rgb*=gl_FragColor.a;
    }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: true,
    premultipliedAlpha: true,
  });
  const compositeGeometry = new THREE.PlaneGeometry(2, 2);
  compositeScene.add(new THREE.Mesh(compositeGeometry, compositeMaterial));
  const savedColor = new THREE.Color(),
    size = new THREE.Vector2();
  return {
    get experience() {
      return activeExperience;
    },
    get cachedVolumes() {
      return alternateVolumes.size;
    },
    async selectExperience(name) {
      const experience = nebulaExperience(name);
      if (!experience || disposed) return false;
      const revision = ++selectionRevision;
      let next = volumeData;
      let guide = null;
      if (experience.manifest) {
        if (alternateVolumes.get(name)?.failed) {
          alternateVolumes.get(name).volume.dispose();
          alternateVolumes.get(name).guide?.dispose();
          alternateVolumes.delete(name);
        }
        if (!alternateVolumes.has(name)) {
          const entry = {
            volume: densityFactory({ manifest: experience.manifest }),
            guide: null,
            failed: false,
            settled: false,
          };
          entry.promise = Promise.all([
            entry.volume.promise,
            experience.guide
              ? (loader.loadAsync
                  ? loader.loadAsync(experience.guide)
                  : Promise.resolve(loader.load(experience.guide))
                ).then((texture) => {
                  if (disposed) {
                    texture.dispose();
                    return;
                  }
                  texture.colorSpace = THREE.SRGBColorSpace;
                  entry.guide = texture;
                })
              : Promise.resolve(),
          ])
            .catch(() => {
              entry.failed = true;
            })
            .finally(() => {
              entry.failed ||= entry.volume.failed;
              entry.settled = true;
            });
          alternateVolumes.set(name, entry);
        }
        const entry = alternateVolumes.get(name);
        // Touch the LRU only on selection; optional volumes never load at startup.
        alternateVolumes.delete(name);
        alternateVolumes.set(name, entry);
        await entry.promise;
        next = entry.volume;
        guide = entry.guide;
        if (entry.failed) {
          pruneVolumes();
          return false;
        }
      }
      if (disposed || revision !== selectionRevision || !next.ready) {
        pruneVolumes();
        return false;
      }
      for (const node of nodes) {
        node.material.uniforms.densityMap.value = next.density;
        node.material.uniforms.detailMap.value = next.detail;
        node.material.uniforms.ionVeil.value = experience.mode;
        node.material.uniforms.gasCool.value.fromArray(experience.cool);
        node.material.uniforms.gasWarm.value.fromArray(experience.warm);
        node.material.uniforms.gasGlow.value = experience.glow;
        node.material.uniforms.image.value = guide || node.texture;
        node.material.uniforms.guideEnabled.value = name === 'orion' || guide ? 1 : 0;
      }
      activeVolume = next;
      activeExperience = name;
      pruneVolumes();
      lastVolumeFrame = 0;
      lastGasFrame = 0;
      return true;
    },
    resetTiming() {
      lastGasFrame = 0;
    },
    setAppearance({ density = 0.85, light = 1 }) {
      for (const node of nodes) {
        node.material.uniforms.gasDensity.value = THREE.MathUtils.clamp(density, 0.4, 1.4);
        node.material.uniforms.gasLight.value = THREE.MathUtils.clamp(light, 0.6, 1.4);
      }
      lastVolumeFrame = 0;
    },
    setQuality(mode) {
      if (!['auto', 'high', 'balanced', 'low'].includes(mode)) return;
      quality.setMode(mode);
      lastVolumeFrame = 0;
    },
    records,
    get ready() {
      return shaderState === 'ready' && volumeData.ready;
    },
    get failed() {
      return assetFailed || volumeData.failed || shaderState === 'failed';
    },
    get refined() {
      return refinedFrame;
    },
    get gasResolution() {
      return [target.width, target.height];
    },
    render(renderer, beforeStars = () => {}) {
      if (disposed) return;
      if (shaderState === 'idle') {
        shaderState = 'compiling';
        // Preserve radiance above 1 until final display tone mapping. Older
        // WebGL devices use reversible companding rather than clipped RGBA8.
        if (!renderer.extensions.has('EXT_color_buffer_float')) {
          motionTarget.texture.type = settledTarget.texture.type = THREE.UnsignedByteType;
          compositeMaterial.uniforms.encodedHdr.value = 1;
          for (const node of nodes) node.material.uniforms.encodedHdr.value = 1;
        }
        const mask = camera.layers.mask;
        camera.layers.set(1);
        camera.layers.enable(2);
        Promise.all([
          renderer.compileAsync(scene, camera),
          renderer.compileAsync(compositeScene, compositeCamera),
          volumeData.promise,
        ])
          .then(() => {
            if (disposed) return;
            if (volumeData.failed) {
              shaderState = 'failed';
              return;
            }
            renderer.initTexture(density);
            renderer.initTexture(volumeData.detail);
            renderer.getSize(size);
            for (const [buffer, resting] of [
              [motionTarget, false],
              [settledTarget, true],
            ]) {
              const width = Math.max(1, Math.round(Math.min(1920, size.x) * quality.budget(resting).scale));
              buffer.setSize(width, Math.max(1, Math.round((width * size.y) / size.x)));
              renderer.initRenderTarget(buffer);
            }
            shaderState = 'ready';
          })
          .catch(() => {
            if (!disposed) shaderState = 'failed';
          });
        camera.layers.mask = mask;
        return;
      }
      if (shaderState !== 'ready' || !volumeData.ready) return;
      // Adapt the expensive volume independently from crisp stars and UI.
      // Respond quickly to software GPUs; restore detail on measured fast devices.
      const now = performance.now(),
        elapsed = lastGasFrame ? now - lastGasFrame : 0;
      lastGasFrame = now;
      quality.sample(elapsed);
      // Use velocity, not per-frame distance: a software GPU's longer frames
      // must not postpone refinement after the same camera gesture.
      const moved = camera.matrixWorld.elements.some(
        (value, i) =>
          Math.abs(value - lastGasView.elements[i]) / Math.max(16, elapsed) > (i >= 12 && i <= 14 ? 0.003 : 0.00001),
      );
      if (moved) lastCameraMotion = now;
      lastGasView.copy(camera.matrixWorld);
      const resting = now - lastCameraMotion > 250;
      const budget = quality.budget(resting);
      for (const node of nodes) node.material.uniforms.steps.value = budget.steps;
      renderer.getSize(size);
      const width = Math.max(1, Math.round(Math.min(1920, size.x) * budget.scale));
      const height = Math.max(1, Math.round((width * size.y) / size.x));
      const opticalWidth = nebulaExperience(activeExperience)?.guide
        ? 1536
        : !fieldStars
          ? records[0].starlessTexture.dimensions[0]
          : highResolutionState === 'ready'
            ? 8192
            : compact
              ? 2048
              : 4096;
      // Implicit derivatives are undefined in a ray loop with divergent exits.
      // Choose mip footprints explicitly, retaining finer detail inside the gas.
      for (const node of nodes) {
        const footprint = THREE.MathUtils.clamp(node.material.uniforms.eye.value.length() / 3, 0.15, 1);
        node.material.uniforms.opticalLod.value = Math.max(0, Math.log2((opticalWidth * footprint) / width));
        node.material.uniforms.infraredLod.value = Math.max(0, Math.log2((2048 * footprint) / width));
      }
      const nextTarget = resting ? settledTarget : motionTarget;
      const switched = target !== nextTarget;
      target = nextTarget;
      compositeMaterial.uniforms.image.value = target.texture;
      const resized = target.width !== width || target.height !== height;
      if (resized) target.setSize(width, height);
      renderer.getClearColor(savedColor);
      const alpha = renderer.getClearAlpha(),
        mask = camera.layers.mask;
      const previous = renderer.getRenderTarget();
      const animated = nodes.some((node) => node.material.uniforms.time.value !== 0);
      if (
        !resting ||
        switched ||
        resized ||
        !lastVolumeFrame ||
        loaded !== lastLoaded ||
        opticalWidth !== lastOpticalWidth ||
        // Budgeted gas advection is slower than the crisp star/UI pass.
        (animated && now - lastVolumeFrame > budget.interval)
      ) {
        renderer.setClearColor(0x000000, 0);
        renderer.setRenderTarget(target);
        camera.layers.set(1);
        renderer.render(scene, camera);
        camera.layers.mask = mask;
        renderer.setRenderTarget(previous);
        renderer.setClearColor(savedColor, alpha);
        lastVolumeFrame = now;
        lastOpticalWidth = opticalWidth;
        lastLoaded = loaded;
        refinedFrame = resting;
      }
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(compositeScene, compositeCamera);
      beforeStars(target.texture);
      camera.layers.set(2);
      renderer.clearDepth();
      renderer.render(scene, camera);
      camera.layers.mask = mask;
      renderer.autoClear = autoClear;
    },
    get textureResolution() {
      return !fieldStars
        ? records[0].starlessTexture.dimensions[0]
        : highResolutionState === 'ready'
          ? 8192
          : compact
            ? 2048
            : 4096;
    },
    requestHighResolution(renderer) {
      if (activeExperience !== 'orion' || !fieldStars || highResolutionState !== 'idle') return;
      if (compact || renderer.capabilities.maxTextureSize < 8192) {
        highResolutionState = 'unsupported';
        return;
      }
      highResolutionState = 'loading';
      const node = nodes[0];
      const texture = loader.load(
        node.record.highResolution.texture,
        () => {
          if (disposed) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 1;
          const previous = node.texture;
          node.texture = texture;
          if (activeExperience === 'orion') node.material.uniforms.image.value = texture;
          previous.dispose();
          highResolutionState = 'ready';
        },
        undefined,
        () => {
          texture.dispose();
          highResolutionState = 'failed';
        },
      );
    },
    get starMedium() {
      return {
        group: nodes[0].group,
        get density() {
          return activeVolume.density;
        },
        get strength() {
          return nodes[0].material.uniforms.gasDensity.value;
        },
      };
    },
    get loaded() {
      return volumeData.ready ? loaded : 0;
    },
    get fieldSourceCount() {
      return nodes.reduce((sum, node) => sum + node.environment.count, 0);
    },
    get brightStarCount() {
      return nodes.reduce((sum, node) => sum + node.environment.brightStarCount, 0);
    },
    pick(x, y) {
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      for (const { record } of nodes) {
        const [x, y, z] = record.position;
        const width = (record.radius * record.dimensions[0]) / record.dimensions[1];
        const depth = record.radius * ORION_DEPTH_SCALE;
        pickBounds.min.set(x - width, y - record.radius, z - depth);
        pickBounds.max.set(x + width, y + record.radius, z + depth);
        if (raycaster.ray.intersectBox(pickBounds, localEye)) return record;
      }
      return null;
    },
    update(seconds = 0, dpr = 1, viewportHeight = 900) {
      if (disposed) return { visible: 0, inside: null, starSize: 0 };
      camera.updateMatrixWorld();
      root.updateMatrixWorld(true);
      frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      let visible = 0,
        inside = null,
        starSize = 0;
      for (const { record, group, material, environment } of nodes) {
        sphere.center.copy(group.position);
        sphere.radius = Math.max(group.scale.x, group.scale.y, group.scale.z);
        if (frustum.intersectsSphere(sphere)) visible++;
        localEye.copy(camera.position);
        group.worldToLocal(localEye);
        material.uniforms.eye.value.copy(localEye);
        material.uniforms.time.value = seconds;
        material.uniforms.steps.value = dpr < 0.8 ? 16 : highResolutionState === 'ready' ? 32 : 24;
        starSize = Math.max(starSize, environment.update(camera, dpr, viewportHeight));
        if (Math.max(Math.abs(localEye.x), Math.abs(localEye.y), Math.abs(localEye.z)) < 1) inside = record.id;
      }
      return { visible, inside, starSize };
    },
    reframe(aspect) {
      const next = layoutNebulae(images, 8042026, aspect);
      nodes.forEach(({ record, group }, i) => {
        Object.assign(record, next[i]);
        group.position.fromArray(record.position);
        group.scale.set(
          (record.radius * record.dimensions[0]) / record.dimensions[1],
          record.radius,
          record.radius * ORION_DEPTH_SCALE,
        );
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(root);
      for (const { texture, infrared, material, environment } of nodes) {
        texture.dispose();
        infrared.dispose();

        material.dispose();
        environment.dispose();
      }
      geometry.dispose();
      volumeData.dispose();
      alternateVolumes.forEach(({ volume, guide }) => {
        volume.dispose();
        guide?.dispose();
      });
      motionTarget.dispose();
      settledTarget.dispose();
      compositeGeometry.dispose();
      compositeMaterial.dispose();
    },
  };
}
