import * as THREE from 'three';
import './style.css';
import { UNIVERSE_KEY, loadUniverse, starAge, appendEvent, mergeUniverse } from './universe-data.js';

const $ = (selector) => document.querySelector(selector);
const universe = loadUniverse(localStorage);
let words = universe.words.filter(w => w.galaxyId === universe.activeGalaxyId);
let selectedId = null;
let editingId = null;
let activePanel = null;
let toastTimer;
let renderer, scene, camera, galaxyGroup, wordGroup;
const worldStars = new Map();
const starNodes = new Map();
const pointer = { x: 0, y: 0 };
const pan = { x: 0, y: 0 };
let zoom = 160;
const MIN_ZOOM = 19;
const MAX_ZOOM = 50000;
let dragging = false;
let moved = false;
let dragStart = null;
const touches = new Map();
let pinchStart = null;
let clock = 0;
let fpsFrames = 0;
let fpsLast = 0;
let lastStarAgeDay = Math.floor(Date.now() / 86400000);
let comet, cometTip, spaceComet, spaceCometDust, spaceCometIon, spaceCometComa, coreGlow, innerGlow, cloudHaze, cloudHaze2, cloudHaze3, cloudHaze4, galaxyDust, deepDust;
let galaxyGrowth = 0;
let galaxyGrowthTarget = 0;
let galaxyExtent = .1;
let galaxyExtentTarget = .1;
let birthMap;
let starCoreMap;
const births = [];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function persist() {
  try { localStorage.setItem(UNIVERSE_KEY, JSON.stringify(universe)); return true; }
  catch { showToast('Tarayıcı depolaması dolu veya kapalı. Evren yedeğini indir.'); return false; }
}
function fmtDate(date) { return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date || Date.now())); }
function showToast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200); }
function refreshCounts() {
  const activeGalaxy = universe.galaxies.find(g => g.id === universe.activeGalaxyId);
  $('#active-galaxy-name').textContent = activeGalaxy?.name || 'Galaksi';
  $('#galaxy-language').textContent = activeGalaxy?.language || 'Dil';
  $('#galaxy-name-detail').textContent = activeGalaxy?.name || 'Galaksi';
  $('#word-language-label').textContent = `${(activeGalaxy?.language || 'Dil').toLocaleUpperCase('tr')} KELİME`;
  $('#detail-language').textContent = `${(activeGalaxy?.language || 'Dil').toLocaleUpperCase('tr')} KELİME`;
  $('#word-input').placeholder = activeGalaxy?.language === 'İspanyolca' ? 'Örn. luz' : activeGalaxy?.language === 'İngilizce' ? 'Örn. luminous' : 'Yeni kelime';
  $('#example-input').placeholder = activeGalaxy?.language === 'İspanyolca' ? 'La luz de las estrellas.' : activeGalaxy?.language === 'İngilizce' ? 'The moon looked luminous tonight.' : 'Örnek bir cümle';
  $('#galaxy-count').textContent = String(universe.galaxies.length).padStart(2, '0');
  $('#star-count').textContent = String(words.length).padStart(2, '0');
  const days = new Set(words.map(w => new Date(w.createdAt).toDateString())).size;
  $('#days-count').textContent = String(days).padStart(2, '0');
  $('#demo-note').hidden = words.length > 0;
  $('#bottom-caption').textContent = words.length === 0 ? 'Boş bir kainat. İlk ışığı sen yak.' : words.length < 10 ? 'İlk ışıklar belirmeye başladı.' : 'Galaksin, öğrendikçe büyüyor.';
  $('#hero-description').textContent = words.length === 0 ? `${activeGalaxy?.name || 'Bu galaksi'} henüz boş. Öğrendiğin her yeni kelime burada bir yıldıza dönüşecek.` : 'Her yeni kelime evrenine bir ışık katıyor. Yıldızlara yaklaş, anlamlarını keşfet ve galaksinin büyümesini izle.';
  $('#hero-add').firstChild.textContent = !words.length ? 'İlk yıldızını yarat ' : 'Yeni yıldız yarat ';
  $('#next-number').textContent = String(words.length + 1).padStart(3, '0');
  if (scene) updateGalaxyGrowth();
}

function random(seed) { let n = seed >>> 0; return () => { n = (1664525 * n + 1013904223) >>> 0; return n / 4294967296; }; }
const rand = random(19483);
function pointCloud(count, galaxy = false) {
  const positions = new Float32Array(count * 3);
  const rgb = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const palette = galaxy ? [new THREE.Color('#b9cbff'), new THREE.Color('#9bafff'), new THREE.Color('#ffe4c1'), new THREE.Color('#8a9ecf'), new THREE.Color('#e9f4ff')] : [new THREE.Color('#7f91b9'), new THREE.Color('#bccce8'), new THREE.Color('#f8e9da')];
  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (galaxy) {
      const arm = i % 4;
      const radius = Math.pow(rand(), .68) * 91;
      const spread = (rand() - .5) * (.16 + radius * .011);
      const angle = arm * Math.PI / 2 + radius * .054 + spread;
      const c = Math.cos(angle), s = Math.sin(angle);
      x = 31 + radius * c + (rand() - .5) * 6;
      y = radius * s * .53 + (rand() - .5) * (2 + radius * .075);
      z = -17 + (rand() - .5) * (4 + radius * .14);
      const tilt = -.17;
      const dx = x - 31;
      x = 31 + dx * Math.cos(tilt) - y * Math.sin(tilt);
      y = dx * Math.sin(tilt) + y * Math.cos(tilt);
    } else {
      x = (rand() - .5) * 390;
      y = (rand() - .5) * 225;
      z = -65 - rand() * 75;
    }
    positions.set([x, y, z], i * 3);
    const base = palette[Math.floor(rand() * palette.length)].clone();
    const luminosity = galaxy ? .35 + rand() * .75 : .25 + rand() * .65;
    base.multiplyScalar(luminosity);
    rgb.set([base.r, base.g, base.b], i * 3);
    sizes[i] = galaxy ? (rand() < .025 ? 5 + rand() * 5 : 1.1 + rand() * 3.1) : .7 + rand() * 2.1;
    phases[i] = rand() * 6.283;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(rgb, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uRatio: { value: Math.min(devicePixelRatio, 1.7) }, uIntensity: { value: 0 } },
    vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aPhase; varying vec3 vColor; varying float vPhase; uniform float uRatio; uniform float uTime; void main(){vColor=aColor;vPhase=aPhase;vec3 p=position;p.xy+=vec2(sin(uTime*.23+aPhase),cos(uTime*.19+aPhase))*.13;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uRatio*(155.0/-mv.z),.6,18.0);}`,
    fragmentShader: `varying vec3 vColor; varying float vPhase; uniform float uTime; uniform float uIntensity; void main(){float r=length(gl_PointCoord-vec2(.5));float core=exp(-r*r*105.0);float halo=exp(-r*r*17.0)*.45;float twinkle=.84+.16*sin(uTime*1.25+vPhase);float a=(core+halo)*twinkle*uIntensity;if(a<.012)discard;gl_FragColor=vec4(vColor*a,a);}`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function glowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 2, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.05, 'rgba(255,255,255,.9)'); g.addColorStop(.15, 'rgba(255,255,255,.35)'); g.addColorStop(.48, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}
function starCoreTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.translate(128, 128);
  for (const [angle, length, width, alpha] of [[0, 96, 1.6, .48], [Math.PI / 2, 96, 1.6, .48], [Math.PI / 4, 49, .8, .2], [-Math.PI / 4, 49, .8, .2]]) {
    ctx.save(); ctx.rotate(angle); ctx.shadowColor = 'white'; ctx.shadowBlur = 13;
    const ray = ctx.createLinearGradient(-length, 0, length, 0);
    ray.addColorStop(0, 'rgba(255,255,255,0)'); ray.addColorStop(.5, `rgba(255,255,255,${alpha})`); ray.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = ray; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(length, 0); ctx.stroke(); ctx.restore();
  }
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 34);
  core.addColorStop(0, 'rgba(255,255,255,1)'); core.addColorStop(.13, 'rgba(255,255,255,.95)'); core.addColorStop(.34, 'rgba(255,255,255,.33)'); core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core; ctx.fillRect(-128, -128, 256, 256);
  return new THREE.CanvasTexture(canvas);
}
function birthTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const halo = ctx.createRadialGradient(128, 128, 57, 128, 128, 93);
  halo.addColorStop(0, 'rgba(255,255,255,0)'); halo.addColorStop(.4, 'rgba(255,255,255,.14)'); halo.addColorStop(.57, 'rgba(255,255,255,.75)'); halo.addColorStop(.7, 'rgba(255,255,255,.12)'); halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}
function nebulaTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d'); const r = random(41982);
  for (let i = 0; i < 190; i++) {
    const x = 40 + r() * 430, y = 90 + r() * 330, radius = 18 + r() * 100;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const tone = i % 4 === 0 ? '116,142,233' : i % 3 === 0 ? '81,112,203' : '122,90,190';
    g.addColorStop(0, `rgba(${tone},${.014 + r() * .027})`); g.addColorStop(1, `rgba(${tone},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
let glowMap;
function sprite(color, size, opacity = 1, map = glowMap) {
  const material = new THREE.SpriteMaterial({ map, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const mesh = new THREE.Sprite(material); mesh.scale.set(size, size, 1); return mesh;
}
function initScene() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('#universe'), antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    showToast('Bu tarayıcıda 3D çizim başlatılamadı. Donanım hızlandırmasını kontrol et.');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x02040a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 100000);
  camera.position.z = zoom;
  galaxyGroup = new THREE.Group(); scene.add(galaxyGroup);
  glowMap = glowTexture();
  starCoreMap = starCoreTexture();
  birthMap = birthTexture();
  const nebula = nebulaTexture();
  const haze = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebula, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  haze.position.set(30, 0, -35); haze.scale.set(205, 137, 1); haze.material.rotation = -.18; galaxyGroup.add(haze);
  cloudHaze = haze;
  const haze2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebula, color: 0x647fc8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  haze2.position.set(28, -3, -33); haze2.scale.set(185, 123, 1); haze2.material.rotation = .32; galaxyGroup.add(haze2);
  cloudHaze2 = haze2;
  const localCloud = nebulaTexture();
  cloudHaze3 = new THREE.Sprite(new THREE.SpriteMaterial({ map: localCloud, color: 0xb16c83, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  cloudHaze3.scale.set(116, 72, 1); cloudHaze3.position.set(6, -15, -29); cloudHaze3.material.rotation = -.4; galaxyGroup.add(cloudHaze3);
  cloudHaze4 = new THREE.Sprite(new THREE.SpriteMaterial({ map: localCloud, color: 0x8cbdeb, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  cloudHaze4.scale.set(92, 66, 1); cloudHaze4.position.set(65, 18, -30); cloudHaze4.material.rotation = .27; galaxyGroup.add(cloudHaze4);
  new THREE.TextureLoader().load('/assets/nebula-gas.png', texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    cloudHaze.material.map = texture;
    cloudHaze2.material.map = texture;
    cloudHaze.material.needsUpdate = cloudHaze2.material.needsUpdate = true;
  });
  const deep = pointCloud(1800); scene.add(deep); deepDust = deep;
  const disk = pointCloud(innerWidth < 760 ? 8200 : 15500, true); galaxyGroup.add(disk); galaxyDust = disk;
  galaxyGroup.userData.materials = [deep.material, disk.material];
  const outerCore = sprite(0x778fe0, 69, 0); outerCore.position.set(31, 0, -17); galaxyGroup.add(outerCore);
  coreGlow = outerCore;
  const innerCore = sprite(0xffdbb5, 27, 0); innerCore.position.set(31, 0, -16); galaxyGroup.add(innerCore); innerGlow = innerCore;
  wordGroup = new THREE.Group(); scene.add(wordGroup);
  const streakPoints = new Float32Array(6);
  const streakGeometry = new THREE.BufferGeometry(); streakGeometry.setAttribute('position', new THREE.BufferAttribute(streakPoints, 3));
  comet = new THREE.Line(streakGeometry, new THREE.LineBasicMaterial({ color: 0xaacaff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  comet.frustumCulled = false; scene.add(comet);
  cometTip = sprite(0xddeaff, 5, 0); scene.add(cometTip);
  spaceComet = sprite(0xf5f8ff, 3.1, 0, starCoreMap); scene.add(spaceComet);
  spaceCometComa = sprite(0xa7caff, 11, 0); scene.add(spaceCometComa);
  const makeTail = (count, blue) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const color = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const fade = Math.pow(1 - i / count, 1.3);
      color.set(blue ? [.38 * fade, .64 * fade, 1 * fade] : [1 * fade, .88 * fade, .72 * fade], i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ map: glowMap, color: 0xffffff, vertexColors: true, size: blue ? 2.4 : 3.8, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    points.frustumCulled = false; scene.add(points); return points;
  };
  spaceCometDust = makeTail(85, false);
  spaceCometIon = makeTail(38, true);
  rebuildWordStars();
  updateGalaxyGrowth();
  renderer.setAnimationLoop(animate);
}
function updateGalaxyGrowth() {
  if (!galaxyDust) return;
  const n = words.length;
  let seed = 0; for (const char of universe.activeGalaxyId) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  const variation = random(seed);
  cloudHaze3.position.set(-12 + variation() * 36, -22 + variation() * 24, -29);
  cloudHaze4.position.set(49 + variation() * 32, 3 + variation() * 28, -30);
  cloudHaze3.material.rotation = -.6 + variation() * .45;
  cloudHaze4.material.rotation = .1 + variation() * .55;
  galaxyGrowthTarget = n ? Math.min(1, Math.sqrt(n) / 5) : 0;
  galaxyExtentTarget = n ? (n <= 25 ? .15 + Math.sqrt(n) / 5 * .85 : 1 + Math.log2(n / 25) * .15) : .1;
  galaxyDust.geometry.setDrawRange(0, Math.min(galaxyDust.geometry.attributes.position.count, n * 155));
  deepDust.geometry.setDrawRange(0, Math.min(1800, Math.max(0, n - 18) * 26));
}
function spawnBirth(id) {
  const group = worldStars.get(id); if (!group || !birthMap) return;
  const word = words.find(w => w.id === id);
  const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: birthMap, color: 0xe9f3ff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.scale.set(4, 4, 1); group.add(ring);
  births.push({ ring, group, start: clock });
}
function rebuildWordStars() {
  if (!wordGroup) return;
  births.length = 0;
  for (const group of worldStars.values()) { group.traverse(obj => { if (obj.material) obj.material.dispose(); }); wordGroup.remove(group); }
  worldStars.clear();
  $('#star-layer').replaceChildren(); starNodes.clear();
  const oldestPair = words.length >= 2 ? [...words].sort((a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0) || words.indexOf(a) - words.indexOf(b)).slice(0, 2) : [];
  words.forEach((word, index) => {
    const group = new THREE.Group(); group.position.set(word.x, word.y, word.z || 18);
    const appearance = starAge(word.createdAt);
    const tint = new THREE.Color(appearance.glow);
    let hash = 0; for (const char of word.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const magnitude = .66 + hash % 100 / 100 * .62;
    const outer = sprite(tint, 24 * magnitude * appearance.size, .32);
    const inner = sprite(tint, 8 * magnitude * appearance.size, .74);
    const center = sprite(new THREE.Color(appearance.color), 4.7 * magnitude * appearance.size, 1, starCoreMap);
    const glint = hash % 6 === 0 ? sprite(new THREE.Color(appearance.color), 8, .17, starCoreMap) : null;
    const dx = word.x - 31, dy = word.y;
    const orbitX = dx * Math.cos(.17) - dy * Math.sin(.17);
    const orbitY = dx * Math.sin(.17) + dy * Math.cos(.17);
    const radius = Math.max(4, Math.hypot(orbitX, orbitY / .57));
    group.add(outer, inner, center);
    if (glint) group.add(glint);
    const cluster = index >= 2 ? Math.floor((index - 2) / 7) : -1;
    group.userData = { outer, inner, center, glint, index, radius, phase: Math.atan2(orbitY / .57, orbitX), z: word.z || 18, speed: cluster >= 0 ? .068 / (1 + cluster * .2) + (index % 3) * .0004 : .095 / (1 + radius * .024), appearanceDay: appearance.ageDays, word, binarySlot: oldestPair.findIndex(w => w.id === word.id) };
    wordGroup.add(group); worldStars.set(word.id, group);
    const button = document.createElement('button'); button.className = 'star-hit'; button.type = 'button'; button.setAttribute('aria-label', `${word.word} yıldızını aç`);
    button.addEventListener('click', () => selectWord(word.id));
    const label = document.createElement('div'); label.className = 'star-label';
    const name = document.createElement('b'); name.textContent = word.word;
    label.append(name); $('#star-layer').append(button, label);
    starNodes.set(word.id, { button, label });
  });
}
const projected = new THREE.Vector3();
function animate(ms) {
  if (!renderer) return;
  const fpsMonitor = $('#fps-monitor');
  if (!fpsMonitor.hidden) {
    fpsFrames++;
    if (ms - fpsLast >= 1000) { fpsMonitor.textContent = `FPS ${Math.round(fpsFrames * 1000 / (ms - fpsLast))}`; fpsFrames = 0; fpsLast = ms; }
  }
  clock = ms * .001;
  const drift = reducedMotion ? 0 : clock;
  const targetX = pan.x + (dragging ? 0 : pointer.x * 1.9);
  const targetY = pan.y + (dragging ? 0 : pointer.y * 1.25);
  camera.position.x += (targetX - camera.position.x) * .035;
  camera.position.y += (targetY - camera.position.y) * .035;
  camera.position.z += (zoom - camera.position.z) * .055;
  camera.lookAt(camera.position.x, camera.position.y, 0);
  galaxyGrowth += (galaxyGrowthTarget - galaxyGrowth) * .026;
  galaxyExtent += (galaxyExtentTarget - galaxyExtent) * .026;
  galaxyGroup.scale.setScalar(galaxyExtent);
  galaxyGroup.position.x = 31 * (1 - galaxyExtent);
  galaxyGroup.rotation.z = Math.sin(drift * .055) * .02;
  wordGroup.rotation.z = 0;
  cloudHaze.material.opacity = galaxyGrowth * (.3 + Math.sin(drift * .36) * .055);
  cloudHaze2.material.opacity = galaxyGrowth * (.16 + Math.cos(drift * .28) * .035);
  cloudHaze3.material.opacity = Math.max(0, galaxyGrowth - .23) * (.21 + Math.sin(drift * .2) * .02);
  cloudHaze4.material.opacity = Math.max(0, galaxyGrowth - .54) * (.2 + Math.cos(drift * .17) * .02);
  coreGlow.material.opacity = Math.max(0, galaxyGrowth - .35) * (.22 + Math.sin(drift * 1.1) * .04);
  innerGlow.material.opacity = Math.max(0, galaxyGrowth - .75) * .16;
  galaxyDust.material.uniforms.uIntensity.value = words.length ? .1 + galaxyGrowth * .34 : 0;
  deepDust.material.uniforms.uIntensity.value = words.length > 18 ? .08 + galaxyGrowth * .2 : 0;
  for (let i = births.length - 1; i >= 0; i--) {
    const birth = births[i]; const age = clock - birth.start;
    if (age > 2.3) { birth.group.remove(birth.ring); birth.ring.material.dispose(); births.splice(i, 1); continue; }
    const t = age / 2.3;
    birth.ring.scale.setScalar(4 + t * 43);
    birth.ring.material.opacity = (1 - t) * (1 - t) * .9;
  }
  const cometCycle = drift % 24;
  if (words.length && cometCycle > 16 && cometCycle < 18.4) {
    const t = (cometCycle - 16) / 2.4;
    const x = 106 - t * 142, y = 57 - t * 74;
    const a = comet.geometry.attributes.position.array;
    a.set([x + 12, y + 6, 2, x, y, 2]); comet.geometry.attributes.position.needsUpdate = true;
    comet.material.opacity = Math.sin(t * Math.PI) * .48;
    cometTip.position.set(x, y, 2); cometTip.material.opacity = Math.sin(t * Math.PI) * .78;
  } else { comet.material.opacity = 0; cometTip.material.opacity = 0; }
  const spaceCycle = drift % 52;
  const cometVisible = words.length > 2 && spaceCycle > 5 && spaceCycle < 23;
  if (cometVisible) {
    const t = (spaceCycle - 5) / 18;
    const fade = Math.min(1, t * 5, (1 - t) * 5);
    const x = 123 - t * 112, y = 33 - t * 41 + Math.sin(t * Math.PI) * 13, z = 9;
    spaceComet.position.set(x, y, z + 1); spaceCometComa.position.set(x, y, z);
    spaceComet.material.opacity = fade * .88; spaceCometComa.material.opacity = fade * .28;
    for (const [tail, count, length, spread, curve] of [[spaceCometDust, 85, 24, 5.7, 3.1], [spaceCometIon, 38, 34, 1.4, -1.1]]) {
      const positions = tail.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const q = (i + 1) / count;
        const jitter = Math.sin(i * 9.17 + drift * .7) * spread * q;
        positions.set([x + q * length, y + q * curve + jitter, z - q * 1.6], i * 3);
      }
      tail.geometry.attributes.position.needsUpdate = true;
      tail.material.opacity = fade * (tail === spaceCometDust ? .7 : .48);
    }
  } else {
    spaceComet.material.opacity = spaceCometComa.material.opacity = 0;
    spaceCometDust.material.opacity = spaceCometIon.material.opacity = 0;
  }
  for (const mat of galaxyGroup.userData.materials) mat.uniforms.uTime.value = drift;
  const today = Math.floor(Date.now() / 86400000);
  const refreshStarAge = today !== lastStarAgeDay;
  if (refreshStarAge) lastStarAgeDay = today;
  for (const [id, group] of worldStars) {
    const orbit = group.userData;
    if (orbit.binarySlot >= 0) {
      const galacticAngle = .6 + drift * .029;
      const cx = 31 + Math.cos(galacticAngle) * 14;
      const cy = Math.sin(galacticAngle) * 8;
      const binaryAngle = drift * .52 + orbit.binarySlot * Math.PI;
      const binaryRadius = orbit.binarySlot === 0 ? 5.63 : 6.37;
      group.position.set(cx + Math.cos(binaryAngle) * binaryRadius, cy + Math.sin(binaryAngle) * binaryRadius * .72, 18 + Math.sin(binaryAngle) * 1.1);
      orbit.outer.material.opacity = .39 + Math.sin(drift * 3.1 + orbit.binarySlot * 2.3) * .075;
    } else {
      const angle = orbit.phase + drift * orbit.speed;
      const wobble = Math.sin(angle * 3 + orbit.index) * orbit.radius * .018;
      const radius = orbit.radius + wobble;
      const ox = Math.cos(angle) * radius, oy = Math.sin(angle) * radius * .57;
      group.position.set(31 + ox * Math.cos(-.17) - oy * Math.sin(-.17), ox * Math.sin(-.17) + oy * Math.cos(-.17), orbit.z + Math.sin(angle * 2 + orbit.index) * .55);
      orbit.outer.material.opacity = .31 + Math.sin(drift * 1.6 + orbit.index * 2.1) * .065;
    }
    if (refreshStarAge) {
      const appearance = starAge(orbit.word.createdAt);
      orbit.appearanceDay = appearance.ageDays;
      const tint = new THREE.Color(appearance.glow);
      orbit.outer.material.color.copy(tint); orbit.inner.material.color.copy(tint);
      orbit.center.material.color.set(appearance.color);
      if (orbit.glint) orbit.glint.material.color.set(appearance.color);
    }
    if (orbit.glint) {
      orbit.glint.scale.setScalar(Math.min(42, 5 + Math.sqrt(zoom) * .3));
      orbit.glint.material.opacity = .13 + Math.sin(drift * .95 + orbit.index * 4.2) * .05;
    }
    group.getWorldPosition(projected); projected.project(camera);
    const x = (projected.x * .5 + .5) * innerWidth;
    const y = (-projected.y * .5 + .5) * innerHeight;
    const visible = projected.z < 1 && x > -80 && x < innerWidth + 80 && y > -50 && y < innerHeight + 50;
    const nodes = starNodes.get(id);
    if (!nodes) continue;
    nodes.button.style.display = nodes.label.style.display = visible ? '' : 'none';
    if (visible) { nodes.button.style.left = nodes.label.style.left = `${x}px`; nodes.button.style.top = nodes.label.style.top = `${y}px`; }
  }
  renderer.render(scene, camera);
}

function openPanel(which) {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  activePanel = which;
  $('#panel-backdrop').classList.toggle('open', !!which);
  for (const key of ['detail', 'add', 'collection', 'galaxy']) {
    const panel = $(`#${key}-panel`);
    panel.classList.toggle('open', key === which);
    panel.setAttribute('aria-hidden', String(key !== which));
    panel.inert = key !== which;
  }
  $('#explore-btn').classList.toggle('active', !which || which === 'detail' || which === 'add');
  $('#collection-btn').classList.toggle('active', which === 'collection');
  if (which === 'add') setTimeout(() => $('#word-input').focus(), 380);
  if (which === 'collection') { renderCollection(); setTimeout(() => $('#search-input').focus(), 380); }
  if (which === 'galaxy') renderGalaxies();
  document.documentElement.scrollLeft = document.body.scrollLeft = $('#app').scrollLeft = 0;
}
function closePanels() { openPanel(null); editingId = null; $('#word-form').reset(); $('#form-error').textContent = ''; }
function selectWord(id) {
  const word = words.find(w => w.id === id); if (!word) return;
  selectedId = id;
  $('#detail-number').textContent = `NO. ${String(words.indexOf(word) + 1).padStart(3, '0')}`;
  $('#detail-word').textContent = word.word;
  $('#detail-meaning').textContent = word.meaning;
  $('#detail-meaning').hidden = true;
  $('#meaning-hidden').hidden = false;
  $('#reveal-meaning').setAttribute('aria-pressed', 'false');
  $('#reveal-meaning').setAttribute('aria-label', 'Türkçe anlamı göster');
  const appearance = starAge(word.createdAt);
  $('#star-age-label').textContent = `${appearance.stage} · ${appearance.ageDays} gün`;
  $('#binary-label').hidden = worldStars.get(word.id)?.userData.binarySlot < 0;
  $('#detail-example').textContent = word.example || '';
  $('#example-wrap').hidden = !word.example;
  $('#detail-date').textContent = `Evrene katılış · ${fmtDate(word.createdAt)}`;
  $('#detail-sun').style.setProperty('--star-glow', appearance.glow);
  $('#detail-sun').style.setProperty('--star-core', appearance.color);
  for (const [starId, nodes] of starNodes) nodes.label.classList.toggle('selected', starId === id);
  openPanel('detail');
}
function createPosition(index) {
  if (index >= 2) {
    const cluster = Math.floor((index - 2) / 7);
    const slot = (index - 2) % 7;
    const seed = random((cluster + 1) * 42197);
    const radius = 22 + Math.sqrt(cluster) * 20;
    const angle = cluster * 2.399 + .7;
    const cx = Math.cos(angle) * radius, cy = Math.sin(angle) * radius * .57;
    const pattern = [[0, 0], [-4.2, 3.4], [4.6, 2.6], [-7.1, -2.3], [7.8, -2], [-2.4, -6.7], [5.1, -7.4]][slot];
    const x = cx + pattern[0] + (seed() - .5) * 1.6;
    const y = cy + pattern[1] + (seed() - .5) * 1.6;
    return { x: 31 + x * Math.cos(-.17) - y * Math.sin(-.17), y: x * Math.sin(-.17) + y * Math.cos(-.17), z: 17 + slot * .62 };
  }
  const arm = index % 4;
  const layer = Math.floor(index / 4);
  const radius = index === 0 ? 5 : 8 + Math.sqrt(layer + 1) * 10;
  const angle = arm * Math.PI / 2 + radius * .055 + index * .045;
  const rx = Math.cos(angle) * radius;
  const ry = Math.sin(angle) * radius * .57;
  const tilt = -.17;
  return { x: 31 + rx * Math.cos(tilt) - ry * Math.sin(tilt), y: rx * Math.sin(tilt) + ry * Math.cos(tilt), z: 17 + (index % 4) * 1.2 };
}
function saveWord(event) {
  event.preventDefault();
  const word = $('#word-input').value.trim();
  const meaning = $('#meaning-input').value.trim();
  const example = $('#example-input').value.trim();
  if (!word || !meaning) { $('#form-error').textContent = 'Kelime ve anlam alanlarını doldur.'; return; }
  const locale = universe.galaxies.find(g => g.id === universe.activeGalaxyId)?.language === 'İspanyolca' ? 'es' : 'en';
  const duplicate = words.some(w => w.word.toLocaleLowerCase(locale) === word.toLocaleLowerCase(locale) && w.id !== editingId);
  if (duplicate) { $('#form-error').textContent = 'Bu kelime evreninde zaten parlıyor.'; return; }
  if (editingId) {
    const editedId = editingId;
    const item = words.find(w => w.id === editedId);
    const before = item ? { ...item } : null;
    if (item) { Object.assign(item, { word, meaning, example, updatedAt: new Date().toISOString() }); appendEvent(universe, 'word.updated', item.galaxyId, item.id, before, item); }
    persist(); rebuildWordStars(); refreshCounts(); closePanels(); selectWord(editedId); showToast('Yıldızın bilgileri güncellendi.');
    return;
  }
  const position = createPosition(words.length);
  const item = { id: crypto.randomUUID(), galaxyId: universe.activeGalaxyId, word, meaning, example, createdAt: new Date().toISOString(), ...position };
  universe.words.push(item); words.push(item); appendEvent(universe, 'word.created', item.galaxyId, item.id, null, item);
  persist(); rebuildWordStars(); refreshCounts(); spawnBirth(item.id); closePanels(); selectWord(item.id);
  showToast(`“${word}” artık evreninde parlıyor.`);
}
function beginEdit() {
  const word = words.find(w => w.id === selectedId); if (!word) return;
  editingId = word.id;
  $('#next-number').textContent = String(words.indexOf(word) + 1).padStart(3, '0');
  $('#form-title').innerHTML = 'Yıldızını<br /><em>yenile.</em>';
  $('#form-copy').textContent = 'Kelimenin bilgilerini güncelle. Yıldızının doğum tarihi ve geçmişi korunur.';
  $('#word-input').value = word.word; $('#meaning-input').value = word.meaning; $('#example-input').value = word.example || '';
  $('#submit-word').firstChild.textContent = 'Değişiklikleri kaydet ';
  openPanel('add');
}
function openAdd() {
  editingId = null; $('#word-form').reset(); $('#form-error').textContent = '';
  $('#next-number').textContent = String(words.length + 1).padStart(3, '0');
  $('#form-title').innerHTML = 'Yeni bir yıldız<br /><em>doğuyor.</em>';
  $('#form-copy').textContent = 'Bugün öğrendiğin kelimeyi ekle. Evreninde ona özel bir yer açalım.';
  $('#submit-word').firstChild.textContent = 'Yıldızı evrene ekle ';
  openPanel('add');
}
function deleteSelected() {
  const word = words.find(w => w.id === selectedId); if (!word) return;
  if (!window.confirm(`“${word.word}” yıldızını evreninden kaldırmak istiyor musun?`)) return;
  appendEvent(universe, 'word.deleted', word.galaxyId, word.id, word, null);
  universe.words = universe.words.filter(w => w.id !== selectedId);
  words = words.filter(w => w.id !== selectedId);
  persist(); rebuildWordStars(); refreshCounts(); closePanels();
  showToast('Yıldız evreninden kaldırıldı.');
}
function renderCollection() {
  const query = $('#search-input').value.trim().toLocaleLowerCase('tr');
  const result = [...words].reverse().filter(w => `${w.word} ${w.meaning}`.toLocaleLowerCase('tr').includes(query));
  $('#result-count').textContent = `${result.length} YILDIZ`;
  const list = $('#collection-list'); list.replaceChildren();
  if (!result.length) { const empty = document.createElement('div'); empty.className = 'collection-empty'; empty.textContent = words.length ? 'Bu isimde bir yıldız bulunamadı.' : 'Henüz yıldızın yok. İlk kelimeni ekleyerek evrenini başlat.'; list.append(empty); return; }
  for (const word of result) {
    const row = document.createElement('button'); row.className = 'collection-item'; row.type = 'button';
    const star = document.createElement('span'); star.className = 'collection-star'; star.style.setProperty('--star-glow', starAge(word.createdAt).glow);
    const copy = document.createElement('span'); copy.className = 'collection-copy';
    const title = document.createElement('strong'); title.textContent = word.word;
    const sub = document.createElement('small'); sub.textContent = starAge(word.createdAt).stage;
    const arrow = document.createElement('span'); arrow.className = 'collection-arrow'; arrow.textContent = '↗';
    copy.append(title, sub); row.append(star, copy, arrow);
    row.addEventListener('click', () => selectWord(word.id)); list.append(row);
  }
}

function renderGalaxies() {
  const list = $('#galaxy-list'); list.replaceChildren();
  for (const galaxy of universe.galaxies) {
    const count = universe.words.filter(w => w.galaxyId === galaxy.id).length;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'galaxy-item';
    if (galaxy.id === universe.activeGalaxyId) button.classList.add('active');
    const icon = document.createElement('span'); icon.className = 'galaxy-item-icon'; icon.textContent = '✧';
    const copy = document.createElement('span'); copy.className = 'galaxy-item-copy';
    const name = document.createElement('strong'); name.textContent = galaxy.name;
    const sub = document.createElement('small'); sub.textContent = `${galaxy.language} · ${count} yıldız`;
    copy.append(name, sub); button.append(icon, copy);
    button.addEventListener('click', () => switchGalaxy(galaxy.id)); list.append(button);
  }
}

function toggleGalaxyRename(show) {
  $('#rename-galaxy-form').hidden = !show;
  if (show) {
    $('#rename-galaxy-input').value = universe.galaxies.find(g => g.id === universe.activeGalaxyId)?.name || '';
    $('#rename-galaxy-input').focus();
  }
}

function renameGalaxy(event) {
  event.preventDefault();
  const galaxy = universe.galaxies.find(g => g.id === universe.activeGalaxyId);
  const name = $('#rename-galaxy-input').value.trim();
  if (!galaxy || !name) return;
  if (name !== galaxy.name) {
    const before = { ...galaxy };
    galaxy.name = name;
    appendEvent(universe, 'galaxy.renamed', galaxy.id, null, before, galaxy);
    persist(); refreshCounts(); renderGalaxies();
    showToast('Galaksinin adı güncellendi.');
  }
  toggleGalaxyRename(false);
}

function switchGalaxy(id) {
  if (!universe.galaxies.some(g => g.id === id)) return;
  universe.activeGalaxyId = id;
  words = universe.words.filter(w => w.galaxyId === id);
  selectedId = null; editingId = null;
  toggleGalaxyRename(false);
  persist(); rebuildWordStars(); refreshCounts(); closePanels();
  const galaxy = universe.galaxies.find(g => g.id === id);
  showToast(`${galaxy.name} açıldı.`);
}

function createGalaxy(event) {
  event.preventDefault();
  const language = $('#language-input').value.trim();
  const name = $('#galaxy-name-input').value.trim() || `${language} Galaksisi`;
  if (!language) return;
  const galaxy = { id: crypto.randomUUID(), name, language, createdAt: new Date().toISOString() };
  universe.galaxies.push(galaxy);
  appendEvent(universe, 'galaxy.created', galaxy.id, null, null, galaxy);
  $('#galaxy-form').reset();
  switchGalaxy(galaxy.id);
}

function exportUniverse() {
  const backup = { ...universe, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `wordverse-yedek-${new Date().toLocaleDateString('sv-SE')}.json`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Evrenin ve işlem geçmişin indirildi.');
}

async function importUniverse(event) {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 10_000_000) throw new Error('too-large');
    const backup = JSON.parse(await file.text());
    mergeUniverse(universe, backup);
    appendEvent(universe, 'universe.imported', universe.activeGalaxyId, null, null, { fileName: file.name, galaxyCount: backup.galaxies.length, wordCount: backup.words.length });
    words = universe.words.filter(w => w.galaxyId === universe.activeGalaxyId);
    persist(); rebuildWordStars(); refreshCounts(); renderGalaxies();
    showToast('Yedek birleştirildi; mevcut kelimelerin korundu.');
  } catch { showToast('Bu dosya geçerli bir Wordverse yedeği değil.'); }
  event.target.value = '';
}

function setZoom(value, focusX, focusY) {
  const previous = zoom;
  zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
  if (focusX === undefined || focusY === undefined) return;
  const halfHeightChange = (previous - zoom) * Math.tan(THREE.MathUtils.degToRad(25));
  pan.x += (focusX / innerWidth - .5) * 2 * halfHeightChange * camera.aspect;
  pan.y += (.5 - focusY / innerHeight) * 2 * halfHeightChange;
}

function bindUI() {
  $('#universe-mode').addEventListener('click', () => {
    const button = $('#universe-mode');
    const immersive = !$('#app').classList.contains('immersive');
    if (immersive) closePanels();
    $('#app').classList.toggle('immersive', immersive);
    pan.x += immersive ? 31 : -31;
    button.setAttribute('aria-pressed', String(immersive));
    button.setAttribute('aria-label', immersive ? 'Arayüzü göster' : 'Sadece evreni göster');
  });
  for (const sel of ['#open-add', '#hero-add', '#collection-add']) $(sel).addEventListener('click', openAdd);
  $('#hero-explore').addEventListener('click', () => { $('#hero').style.opacity = '.18'; setTimeout(() => $('#hero').style.opacity = '', 2600); });
  $('#home-btn').addEventListener('click', () => { closePanels(); pan.x = pan.y = pointer.x = pointer.y = 0; zoom = 160; });
  $('#explore-btn').addEventListener('click', closePanels);
  $('#collection-btn').addEventListener('click', () => openPanel('collection'));
  $('#galaxy-switch').addEventListener('click', () => openPanel('galaxy'));
  $('#close-galaxy').addEventListener('click', closePanels);
  $('#galaxy-form').addEventListener('submit', createGalaxy);
  $('#rename-galaxy').addEventListener('click', () => toggleGalaxyRename(true));
  $('#rename-galaxy-form').addEventListener('submit', renameGalaxy);
  $('#cancel-rename-galaxy').addEventListener('click', () => toggleGalaxyRename(false));
  $('#export-universe').addEventListener('click', exportUniverse);
  $('#import-universe').addEventListener('change', importUniverse);
  $('#reveal-meaning').addEventListener('click', () => {
    const reveal = $('#detail-meaning').hidden;
    $('#detail-meaning').hidden = !reveal;
    $('#meaning-hidden').hidden = reveal;
    $('#reveal-meaning').setAttribute('aria-pressed', String(reveal));
    $('#reveal-meaning').setAttribute('aria-label', reveal ? 'Türkçe anlamı gizle' : 'Türkçe anlamı göster');
  });
  $('#close-detail').addEventListener('click', closePanels);
  $('#close-add').addEventListener('click', closePanels);
  $('#close-collection').addEventListener('click', closePanels);
  $('#panel-backdrop').addEventListener('click', closePanels);
  $('#word-form').addEventListener('submit', saveWord);
  $('#edit-word').addEventListener('click', beginEdit);
  $('#delete-word').addEventListener('click', deleteSelected);
  $('#search-input').addEventListener('input', renderCollection);
  $('#zoom-in').addEventListener('click', () => setZoom(zoom / 1.38));
  $('#zoom-out').addEventListener('click', () => setZoom(zoom * 1.38));
  $('#reset-view').addEventListener('click', () => { pan.x = pan.y = 0; zoom = 160; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanels(); if (e.key === '/' && !activePanel) { e.preventDefault(); openPanel('collection'); } if (e.shiftKey && e.key.toLowerCase() === 'f' && !activePanel) { const monitor = $('#fps-monitor'); monitor.hidden = !monitor.hidden; fpsFrames = 0; fpsLast = performance.now(); } });
  const canvas = $('#universe');
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) { const [a, b] = [...touches.values()]; pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom }; dragging = false; dragStart = null; }
    }
    if (touches.size < 2) { dragging = true; moved = false; dragStart = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }; }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    pointer.x = (e.clientX / innerWidth - .5) * 2; pointer.y = (.5 - e.clientY / innerHeight) * 2;
    if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2 && pinchStart) { const [a, b] = [...touches.values()]; const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)); setZoom(pinchStart.zoom * pinchStart.distance / distance, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
    }
    if (dragging && dragStart) { const factor = zoom / 160 * .12; pan.x = dragStart.panX - (e.clientX - dragStart.x) * factor; pan.y = dragStart.panY + (e.clientY - dragStart.y) * factor; moved ||= Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y) > 4; }
  });
  const endPointer = e => { touches.delete(e.pointerId); dragging = false; dragStart = null; pinchStart = null; };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  const onZoomWheel = e => { e.preventDefault(); setZoom(zoom * Math.exp(e.deltaY * .00145), e.clientX, e.clientY); };
  canvas.addEventListener('wheel', onZoomWheel, { passive: false });
  $('#star-layer').addEventListener('wheel', onZoomWheel, { passive: false });
  window.addEventListener('resize', () => { if (!renderer) return; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); renderer.setSize(innerWidth, innerHeight); });
}

history.scrollRestoration = 'manual';
function resetPageScroll() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  window.scrollTo(0, 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  $('#app').scrollLeft = 0;
}
resetPageScroll();
window.addEventListener('pageshow', () => { resetPageScroll(); requestAnimationFrame(resetPageScroll); setTimeout(resetPageScroll, 250); });
persist(); refreshCounts(); bindUI(); initScene();
