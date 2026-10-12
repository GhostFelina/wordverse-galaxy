import * as THREE from 'three';
import { createWordStarSystem } from './word-star-system.js';

// One lazy, bounded preview context. It draws the production photosphere once
// per selection, with the same record seed; no extra idle animation loop.
export function mountStellarPreview(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'stellar-preview';
  canvas.setAttribute('aria-hidden', 'true');
  container.append(canvas);
  let renderer, scene, camera, stars, record;
  let frame = 0,
    generation = 0,
    started = 0,
    disposed = false;
  const cancel = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  function clear() {
    generation++;
    cancel();
    record = null;
    delete container.dataset.stellarPreview;
    delete canvas.dataset.recordId;
    delete canvas.dataset.surfaceBlend;
    renderer?.clear();
  }
  function draw(ticket) {
    frame = 0;
    if (disposed || ticket !== generation || !record || document.hidden) return;
    if (!stars.ready) {
      if (performance.now() - started < 15_000) frame = requestAnimationFrame(() => draw(ticket));
      else container.dataset.stellarPreview = 'unavailable';
      return;
    }
    // Render at 384px so the production LOD resolves its full surface, then
    // display at 170px; changing the surface thresholds would alter the scene.
    stars.update(0, camera, 384, 1, { selectedId: record.id });
    renderer.render(scene, camera);
    canvas.dataset.recordId = record.id;
    canvas.dataset.surfaceBlend = String(stars.state(record.id)?.blend);
    container.dataset.stellarPreview = 'ready';
  }
  function initialize() {
    if (renderer) return;
    const next = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    next.setPixelRatio(1);
    next.setSize(384, 384, false);
    next.setClearColor(0, 0);
    next.outputColorSpace = THREE.SRGBColorSpace;
    next.toneMapping = THREE.ACESFilmicToneMapping;
    next.toneMappingExposure = 0.85;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.05, 10);
    camera.layers.enable(2);
    camera.position.set(0, 0, 1.65);
    camera.updateMatrixWorld();
    stars = createWordStarSystem(scene, { surfaceLimit: 1 });
    renderer = next;
  }
  function show(nextRecord) {
    clear();
    if (disposed || !nextRecord || !matchMedia('(min-width:761px)').matches) return;
    record = { id: nextRecord.id, x: 0, y: 0, z: 0 };
    try {
      initialize();
      stars.setEntries([record]);
      started = performance.now();
      container.dataset.stellarPreview = 'loading';
      frame = requestAnimationFrame(() => draw(generation));
    } catch {
      container.dataset.stellarPreview = 'unavailable';
    }
  }
  const visibility = () => {
    cancel();
    if (!document.hidden && record && container.dataset.stellarPreview !== 'ready') {
      started = performance.now();
      frame = requestAnimationFrame(() => draw(generation));
    }
  };
  const lost = () => {
    cancel();
    container.dataset.stellarPreview = 'unavailable';
    delete canvas.dataset.recordId;
    delete canvas.dataset.surfaceBlend;
  };
  const restored = () => {
    if (record) show(record);
  };
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  document.addEventListener('visibilitychange', visibility);
  return {
    show,
    hide: clear,
    dispose() {
      if (disposed) return;
      clear();
      disposed = true;
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      stars?.dispose();
      renderer?.dispose();
      canvas.remove();
    },
  };
}
