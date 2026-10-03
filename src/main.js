import * as THREE from 'three';
import './style.css';
import { PLANET_TYPES, entryKind, nextPlanetType, galaxyStyle, nextGalaxyStyle, starAge, appendEvent, mergeUniverse, normalizeBackup } from './universe-data.js';
import { archiveBeforeMigration, writeUniverseMirror } from './storage-mirror.js';
import { loadLocalUniverse, persistLocalUniverse } from './local-primary.js';
import { translate, formatDate, formatUnit, localePath } from './i18n.js';
import { applyHomeTranslations, getHomeLocale } from './home-i18n.js';
import { mountAuthUI } from './auth-ui.js';
import { mountAccountSync } from './account-sync-ui.js';

const $ = (selector) => document.querySelector(selector);
const uiLocale = getHomeLocale();
const t = (key, params) => translate(uiLocale, key, params);
let archiveFailure = false;
try { await archiveBeforeMigration(localStorage); } catch { archiveFailure = true; }
let { universe, recovered: recoveredFromMirror } = await loadLocalUniverse(localStorage);
let accountSync = null;
let mirrorWrites = Promise.resolve();
let primaryWrites = Promise.resolve();
let mirrorWarningShown = false;
let words = universe.words.filter(w => w.galaxyId === universe.activeGalaxyId);
let selectedId = null;
let editingId = null;
let activePanel = null;
let toastTimer;
let renderer, scene, camera, galaxyGroup, wordGroup;
const worldStars = new Map();
const starNodes = new Map();
const DENSE_STAR_THRESHOLD = 80;
let denseStarMeshes = null;
const denseMatrix = new THREE.Matrix4();
let lastOverlayUpdate = -Infinity;
const pointer = { x: 0, y: 0 };
const pan = { x: 0, y: 0 };
let zoom = 160;
let preImmersiveZoom = null;
let focusedStarId = null;
let preFocusPan = null;
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
let drawCalls = 0;
let lastStarAgeDay = Math.floor(Date.now() / 86400000);
let meteor, meteorTip, spaceComet, coreGlow, innerGlow, cloudHaze, cloudHaze2, cloudHaze3, cloudHaze4, galaxyDust, deepDust;
const nebulaRegions = [];
let galaxyGrowth = 0;
let galaxyGrowthTarget = 0;
let galaxyExtent = .1;
let galaxyExtentTarget = .1;
let visualGalaxyId = null;
let activeVisualStyle = 'spiral';
const galaxyTextures = new Map();
const GALAXY_IMAGE = { spiral: '/assets/galaxy-dust-lanes.png', barred: '/assets/galaxy-barred-v1.png', flocculent: '/assets/galaxy-flocculent-v1.png' };
const STAR_PATTERNS = [
  [[0, 0], [-3.8, 3.4], [4.2, 3.6], [-2.2, -.3], [2.4, -.8], [-4.8, -5.8], [5.2, -5.3]],
  [[-7, 2.8], [-3.4, -.8], [0, 2.4], [3.5, -1.1], [7, 2.5], [-1.8, -5.3], [4.8, -5.2]],
  [[-2.9, 2.9], [2.4, 3.6], [-4.8, -.5], [0, 0], [4.9, -.8], [-1.9, -4.9], [2.2, -4.1]],
  [[0, 5.4], [-4.4, 1.8], [4.3, 1.4], [0, -2.1], [-6.3, -3.7], [5.6, -4.8], [1.4, -6.9]],
];
let birthMap;
let starCoreMap;
let planetGeometry, ringGeometry;
const MEANING_LANGUAGES = new Set(['tr', 'en', 'es']);
const languageDisplay = value => value === 'İngilizce' || value === 'English' ? t('names.language.en') : value === 'İspanyolca' || value === 'Spanish' ? t('names.language.es') : value === 'Türkçe' || value === 'Turkish' ? t('names.language.tr') : value || t('message.languageFallback');
const galaxyDisplay = galaxy => galaxy?.id === 'galaxy-english' && galaxy.name === 'İngilizce Galaksisi' ? t('names.defaultGalaxy.english') : galaxy?.id === 'galaxy-spanish' && galaxy.name === 'İspanyolca Galaksisi' ? t('names.defaultGalaxy.spanish') : galaxy?.name || t('message.galaxyFallback');
const meaningLanguageLabel = galaxy => t('panel.meaningOf', { language: t(`names.language.${MEANING_LANGUAGES.has(galaxy?.meaningLanguage) ? galaxy.meaningLanguage : 'tr'}`).toLocaleUpperCase(uiLocale) });
const typeLabel = (galaxy, kind = 'word') => t(kind === 'conjunction' ? 'panel.conjunctionType' : 'panel.wordType', { language: languageDisplay(galaxy?.language).toLocaleUpperCase(uiLocale) });
const starStageLabel = appearance => t(`names.stage.${appearance.stageId}`);
const planetMaps = new Map();
const births = [];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function persist() {
  if (accountSync?.persist(universe)) return true;
  try {
    const serialized = JSON.stringify(universe);
    const { localSaved, writePrimary } = persistLocalUniverse(universe, localStorage);
    primaryWrites = primaryWrites.catch(() => {}).then(writePrimary).catch(() => {
      if (!mirrorWarningShown) { mirrorWarningShown = true; showToast(t('message.mirrorError')); }
    });
    mirrorWrites = mirrorWrites.catch(() => {}).then(() => writeUniverseMirror(JSON.parse(serialized))).catch(() => {
      if (!mirrorWarningShown) { mirrorWarningShown = true; showToast(t('message.mirrorError')); }
    });
    return localSaved;
  }
  catch { showToast(t('status.storageError')); return false; }
}
function fmtDate(date) { return formatDate(uiLocale, date || Date.now()); }
function showToast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200); }
function refreshCounts() {
  const activeGalaxy = universe.galaxies.find(g => g.id === universe.activeGalaxyId);
  $('#active-galaxy-name').textContent = galaxyDisplay(activeGalaxy);
  $('#galaxy-language').textContent = languageDisplay(activeGalaxy?.language);
  $('#galaxy-name-detail').textContent = galaxyDisplay(activeGalaxy);
  $('#meaning-language-current').value = activeGalaxy?.meaningLanguage || 'tr';
  $('#form-meaning-language').textContent = meaningLanguageLabel(activeGalaxy);
  $('#detail-meaning-language').textContent = meaningLanguageLabel(activeGalaxy);
  $('#reveal-meaning').setAttribute('aria-label', t('message.revealMeaning', { label: meaningLanguageLabel(activeGalaxy) }));
  $('#word-language-label').textContent = typeLabel(activeGalaxy);
  $('#detail-language').textContent = typeLabel(activeGalaxy);
  $('#word-input').placeholder = activeGalaxy?.language === 'İspanyolca' ? t('message.wordPlaceholderSpanish') : activeGalaxy?.language === 'İngilizce' ? t('panel.wordPlaceholder') : t('message.wordPlaceholderOther');
  $('#meaning-input').placeholder = t(`panel.meaningPlaceholder${{ tr: 'Tr', en: 'En', es: 'Es' }[activeGalaxy?.meaningLanguage] || 'Tr'}`);
  $('#example-input').placeholder = activeGalaxy?.language === 'İspanyolca' ? t('message.examplePlaceholderSpanish') : activeGalaxy?.language === 'İngilizce' ? t('panel.examplePlaceholder') : t('message.examplePlaceholderOther');
  $('#galaxy-count').textContent = String(universe.galaxies.length).padStart(2, '0');
  $('#star-count').textContent = String(words.filter(w => entryKind(w) === 'word').length).padStart(2, '0');
  $('#planet-count').textContent = String(words.filter(w => entryKind(w) === 'conjunction').length).padStart(2, '0');
  const days = new Set(words.map(w => new Date(w.createdAt).toDateString())).size;
  $('#days-count').textContent = String(days).padStart(2, '0');
  $('#demo-note').hidden = words.length > 0;
  $('#bottom-caption').textContent = t(words.length === 0 ? 'home.emptyCaption' : words.length < 10 ? 'home.earlyCaption' : 'home.growingCaption');
  $('#hero-description').textContent = words.length === 0 ? t('hero.empty', { galaxy: galaxyDisplay(activeGalaxy) }) : t('hero.filled');
  $('#hero-add').firstChild.textContent = `${t(words.length ? 'action.addWord' : 'action.addFirst')} `;
  $('#next-number').textContent = String(words.length + 1).padStart(3, '0');
  if (scene) updateGalaxyGrowth();
}

function random(seed) { let n = seed >>> 0; return () => { n = (1664525 * n + 1013904223) >>> 0; return n / 4294967296; }; }
function hashText(value) { let hash = 0; for (const char of String(value ?? 'empty-universe')) hash = (hash * 31 + char.charCodeAt(0)) >>> 0; return hash; }
function pointCloud(count, galaxy = false, style = 'spiral', seed = 19483) {
  const rand = random(seed);
  const positions = new Float32Array(count * 3);
  const rgb = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const palette = galaxy ? (style === 'barred' ? ['#b8caff', '#e2d5bd', '#f5d6a6', '#d1d9f3', '#b9c5e7'] : style === 'flocculent' ? ['#d2dcf3', '#acc9f5', '#e8d8c2', '#b5bce6', '#f3e6d2'] : ['#b9cbff', '#9bafff', '#ffe4c1', '#8a9ecf', '#e9f4ff']).map(color => new THREE.Color(color)) : [new THREE.Color('#7f91b9'), new THREE.Color('#bccce8'), new THREE.Color('#f8e9da')];
  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (galaxy) {
      const arms = style === 'flocculent' ? 6 : style === 'barred' ? 2 : 4;
      const arm = i % arms;
      const radius = Math.pow(rand(), style === 'flocculent' ? .78 : .68) * 91;
      const spread = (rand() - .5) * (style === 'flocculent' ? .42 + radius * .015 : .16 + radius * .011);
      const angle = arm * Math.PI * 2 / arms + radius * (style === 'flocculent' ? .04 : .054) + spread + (style === 'flocculent' ? Math.sin(radius * .19 + arm * 2.1) * .18 : 0);
      const c = Math.cos(angle), s = Math.sin(angle);
      x = 31 + radius * c + (rand() - .5) * 6;
      y = radius * s * .53 + (rand() - .5) * (2 + radius * .075);
      if (style === 'barred' && radius < 30 && i % 3 === 0) { x = 31 + (rand() - .5) * 65; y = (rand() - .5) * 8 + (x - 31) * .14; }
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
    vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aPhase; varying vec3 vColor; varying float vPhase; uniform float uRatio; uniform float uTime; void main(){vColor=aColor;vPhase=aPhase;vec3 p=position;${galaxy ? 'vec2 q=p.xy-vec2(31.0,0.0);float r=length(q);float a=uTime*(.004+.024/(1.0+r*.04));p.xy=vec2(31.0,0.0)+mat2(cos(a),-sin(a),sin(a),cos(a))*q;' : 'p.xy+=vec2(sin(uTime*.11+aPhase),cos(uTime*.09+aPhase))*.18;'}vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uRatio*(155.0/-mv.z),.6,18.0);}`,
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
function cometTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const randomDust = random(62731);
  const headX = 94, headY = 119;
  // The broad dust tail bends gently; the fainter blue ion tail stays narrow and straight.
  const dust = ctx.createLinearGradient(headX, 0, 744, 0);
  dust.addColorStop(0, 'rgba(237,228,207,.56)'); dust.addColorStop(.23, 'rgba(197,190,177,.21)'); dust.addColorStop(1, 'rgba(135,147,162,0)');
  ctx.fillStyle = dust;
  ctx.beginPath(); ctx.moveTo(headX, headY - 10); ctx.bezierCurveTo(270, 68, 510, 104, 744, 90); ctx.bezierCurveTo(480, 190, 270, 147, headX, headY + 12); ctx.fill();
  for (let i = 0; i < 440; i++) {
    const t = randomDust();
    const x = headX + t * 640;
    const centerY = headY - 17 * Math.sin(t * Math.PI * .75) + 10 * t * t;
    const spread = (4 + t * 44) * (randomDust() + randomDust() - 1);
    const alpha = (1 - t) * (.035 + randomDust() * .14);
    ctx.fillStyle = `rgba(242,225,199,${alpha})`;
    ctx.fillRect(x, centerY + spread, 1 + randomDust() * 2, 1 + randomDust() * 2);
  }
  const ion = ctx.createLinearGradient(headX, 0, 768, 0);
  ion.addColorStop(0, 'rgba(167,209,255,.34)'); ion.addColorStop(.37, 'rgba(119,174,236,.12)'); ion.addColorStop(1, 'rgba(95,142,206,0)');
  ctx.strokeStyle = ion; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(headX + 6, headY); ctx.lineTo(760, headY + 36); ctx.stroke();
  const coma = ctx.createRadialGradient(headX, headY, 1, headX, headY, 53);
  coma.addColorStop(0, 'rgba(252,250,239,.88)'); coma.addColorStop(.14, 'rgba(231,239,233,.51)'); coma.addColorStop(.52, 'rgba(191,216,220,.13)'); coma.addColorStop(1, 'rgba(160,191,217,0)');
  ctx.fillStyle = coma; ctx.fillRect(headX - 54, headY - 54, 108, 108);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
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
  core.addColorStop(0, 'rgba(255,255,255,1)'); core.addColorStop(.11, 'rgba(255,255,255,1)'); core.addColorStop(.25, 'rgba(255,255,255,.64)'); core.addColorStop(.53, 'rgba(255,255,255,.13)'); core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core; ctx.fillRect(-128, -128, 256, 256);
  for (const [radius, alpha] of [[28, .105], [42, .042], [60, .018]]) {
    ctx.strokeStyle = `rgba(225,238,255,${alpha})`;
    ctx.lineWidth = radius === 28 ? 1.5 : 1;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}
function planetType(word) {
  if (PLANET_TYPES.includes(word.planetType)) return word.planetType;
  let hash = 0; for (const char of word.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PLANET_TYPES[hash % PLANET_TYPES.length];
}
function planetMap(type) {
  if (!planetMaps.has(type)) {
    const ready = { value: 0 };
    const texture = new THREE.TextureLoader().load(`/assets/planets/${type}.jpg`, () => { ready.value = 1; });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    planetMaps.set(type, { texture, ready });
  }
  return planetMaps.get(type);
}
function makePlanet(type) {
  if (!planetGeometry) planetGeometry = new THREE.SphereGeometry(1, 32, 24);
  if (!ringGeometry) ringGeometry = new THREE.RingGeometry(1.52, 2.45, 72, 1);
  const ringed = type === 'saturn' || type === 'uranus';
  const { texture, ready } = planetMap(type);
  const baseColors = { mercury: '#a29d96', venus: '#cfb896', earth: '#9bb9d0', mars: '#b27656', jupiter: '#b5a18b', saturn: '#bfb5a2', uranus: '#a6c9ce', neptune: '#648bbd' };
  const color = new THREE.Color(baseColors[type]);
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uMap: { value: texture }, uReady: ready, uLight: { value: new THREE.Vector3(-.55, .38, 1.25) } },
    vertexShader: 'varying vec3 vNormal;varying vec2 vUv;void main(){vNormal=normal;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform vec3 uColor;uniform sampler2D uMap;uniform float uReady;uniform vec3 uLight;varying vec3 vNormal;varying vec2 vUv;void main(){vec3 n=normalize(vNormal);float day=max(0.0,dot(n,normalize(uLight)));float shade=.22+.9*pow(day,.72);vec3 albedo=mix(uColor,texture2D(uMap,vUv).rgb,uReady);float rim=pow(1.0-max(0.0,n.z),3.0)*.16*day;vec3 c=albedo*shade+vec3(.2,.32,.42)*rim;gl_FragColor=vec4(c,1.0);}',
  });
  const orbit = new THREE.Group();
  const body = new THREE.Mesh(planetGeometry, material);
  const radius = ({ jupiter: .94, saturn: .87, uranus: .76, neptune: .76, earth: .74, venus: .72, mars: .68, mercury: .62 })[type];
  body.scale.setScalar(radius); orbit.add(body);
  if (ringed) {
    const ring = new THREE.Mesh(ringGeometry, new THREE.ShaderMaterial({
      vertexShader: 'varying vec2 vRing;void main(){vRing=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'varying vec2 vRing;void main(){float r=length(vRing);float bands=.5+.5*sin(r*46.0);float gap=smoothstep(.025,.085,abs(r-1.94));float edge=smoothstep(1.52,1.7,r)*(1.0-smoothstep(2.25,2.45,r));float alpha=(.11+bands*.17)*gap*edge;gl_FragColor=vec4(vec3(.58,.54,.49),alpha);}',
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
    }));
    ring.scale.setScalar(radius); ring.rotation.set(1.13, -.18, -.3); orbit.add(ring);
  }
  const reflectedLight = sprite(color, 5.5, .32);
  reflectedLight.position.z = -.18;
  orbit.add(reflectedLight);
  orbit.userData.orbitRadius = ringed ? 6.6 : 5.8;
  orbit.userData.orbitSpeed = ringed ? .16 : .21;
  orbit.userData.type = type;
  return orbit;
}
function birthTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const halo = ctx.createRadialGradient(128, 128, 57, 128, 128, 93);
  halo.addColorStop(0, 'rgba(255,255,255,0)'); halo.addColorStop(.4, 'rgba(255,255,255,.14)'); halo.addColorStop(.57, 'rgba(255,255,255,.75)'); halo.addColorStop(.7, 'rgba(255,255,255,.12)'); halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}
function nebulaTexture(seed = 41982) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d'); const r = random(seed);
  for (let i = 0; i < 190; i++) {
    const x = 40 + r() * 430, y = 90 + r() * 330, radius = 18 + r() * 100;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const tone = i % 4 === 0 ? '116,142,233' : i % 3 === 0 ? '81,112,203' : '122,90,190';
    g.addColorStop(0, `rgba(${tone},${.014 + r() * .027})`); g.addColorStop(1, `rgba(${tone},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function galaxyTexture(style) {
  if (!galaxyTextures.has(style)) {
    const texture = new THREE.TextureLoader().load(GALAXY_IMAGE[style]);
    texture.colorSpace = THREE.SRGBColorSpace;
    galaxyTextures.set(style, texture);
  }
  return galaxyTextures.get(style);
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
    showToast(t('message.webglError'));
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
  planetGeometry = new THREE.SphereGeometry(1, 32, 24);
  ringGeometry = new THREE.RingGeometry(1.52, 2.45, 72, 1);
  birthMap = birthTexture();
  const nebula = nebulaTexture();
  const haze = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebula, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  haze.position.set(30, 0, -35); haze.scale.set(244, 153, 1); haze.material.rotation = -.18; galaxyGroup.add(haze);
  cloudHaze = haze;
  const haze2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebula, color: 0x647fc8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  haze2.position.set(28, -3, -33); haze2.scale.set(201, 130, 1); haze2.material.rotation = .32; galaxyGroup.add(haze2);
  cloudHaze2 = haze2;
  const localCloud = nebulaTexture(91573);
  cloudHaze3 = new THREE.Sprite(new THREE.SpriteMaterial({ map: localCloud, color: 0xb16c83, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  cloudHaze3.scale.set(116, 72, 1); cloudHaze3.position.set(6, -15, -29); cloudHaze3.material.rotation = -.4; galaxyGroup.add(cloudHaze3);
  cloudHaze4 = new THREE.Sprite(new THREE.SpriteMaterial({ map: localCloud, color: 0x8cbdeb, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  cloudHaze4.scale.set(92, 66, 1); cloudHaze4.position.set(65, 18, -30); cloudHaze4.material.rotation = .27; galaxyGroup.add(cloudHaze4);
  for (let i = 0; i < 3; i++) {
    const tint = [0x8db9df, 0xc17f8d, 0xafa4d1][i];
    const region = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebulaTexture(107219 + i * 1949), color: tint, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    region.position.z = -28 + i;
    region.scale.set(46 + i * 9, 31 + i * 7, 1);
    galaxyGroup.add(region); nebulaRegions.push(region);
  }
  new THREE.TextureLoader().load('/assets/nebula-gas.png', texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    cloudHaze2.material.map = texture;
    cloudHaze2.material.needsUpdate = true;
  });
  const deep = pointCloud(1800); scene.add(deep); deepDust = deep;
  const activeStyle = galaxyStyle(universe.galaxies.find(g => g.id === universe.activeGalaxyId));
  const disk = pointCloud(innerWidth < 760 ? 8200 : 15500, true, activeStyle, hashText(universe.activeGalaxyId)); galaxyGroup.add(disk); galaxyDust = disk;
  galaxyGroup.userData.materials = [deep.material, disk.material];
  const outerCore = sprite(0x778fe0, 69, 0); outerCore.position.set(31, 0, -17); galaxyGroup.add(outerCore);
  coreGlow = outerCore;
  const innerCore = sprite(0xffdbb5, 27, 0); innerCore.position.set(31, 0, -16); galaxyGroup.add(innerCore); innerGlow = innerCore;
  wordGroup = new THREE.Group(); scene.add(wordGroup);
  const streakPoints = new Float32Array(6);
  const streakGeometry = new THREE.BufferGeometry(); streakGeometry.setAttribute('position', new THREE.BufferAttribute(streakPoints, 3));
  meteor = new THREE.Line(streakGeometry, new THREE.LineBasicMaterial({ color: 0xaacaff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  meteor.frustumCulled = false; scene.add(meteor);
  meteorTip = sprite(0xddeaff, 5, 0); scene.add(meteorTip);
  spaceComet = new THREE.Sprite(new THREE.SpriteMaterial({ map: cometTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  spaceComet.frustumCulled = false; scene.add(spaceComet);
  rebuildWordStars();
  updateGalaxyGrowth();
  renderer.setAnimationLoop(animate);
}
function updateGalaxyGrowth() {
  if (!galaxyDust) return;
  const n = words.length;
  const seed = hashText(universe.activeGalaxyId);
  const variation = random(seed);
  const style = galaxyStyle(universe.galaxies.find(g => g.id === universe.activeGalaxyId));
  if (visualGalaxyId !== universe.activeGalaxyId) {
    visualGalaxyId = universe.activeGalaxyId;
    activeVisualStyle = style;
    const replacement = pointCloud(galaxyDust.geometry.attributes.position.count, true, style, seed);
    galaxyDust.geometry.dispose(); galaxyDust.geometry = replacement.geometry; replacement.material.dispose();
    cloudHaze.material.map = galaxyTexture(style); cloudHaze.material.needsUpdate = true;
    cloudHaze.material.color.set(style === 'barred' ? '#d7c5b2' : style === 'flocculent' ? '#c6d3e8' : '#ffffff');
    cloudHaze2.material.color.set(style === 'barred' ? '#a3859b' : style === 'flocculent' ? '#829ac3' : '#647fc8');
    coreGlow.material.color.set(style === 'barred' ? '#c6a6a4' : style === 'flocculent' ? '#a6b1d3' : '#778fe0');
    innerGlow.material.color.set(style === 'barred' ? '#ffe0b8' : style === 'flocculent' ? '#ffe5c6' : '#ffdbb5');
  }
  cloudHaze.scale.set(244 * (.9 + variation() * .2), 153 * (.9 + variation() * .16), 1);
  cloudHaze.material.rotation = -.3 + variation() * .6;
  cloudHaze2.scale.set(192 + variation() * 28, 125 + variation() * 21, 1);
  cloudHaze2.material.rotation = -.45 + variation() * .9;
  cloudHaze3.position.set(-12 + variation() * 36, -22 + variation() * 24, -29);
  cloudHaze4.position.set(49 + variation() * 32, 3 + variation() * 28, -30);
  cloudHaze3.material.rotation = -.6 + variation() * .45;
  cloudHaze4.material.rotation = .1 + variation() * .55;
  for (let i = 0; i < nebulaRegions.length; i++) {
    const region = nebulaRegions[i];
    const angle = variation() * Math.PI * 2;
    const radius = 24 + variation() * 43;
    region.position.set(31 + Math.cos(angle) * radius, Math.sin(angle) * radius * .58, -28 + i);
    region.material.rotation = variation() * Math.PI;
    region.scale.set(40 + variation() * 31, 27 + variation() * 20, 1);
  }
  galaxyGrowthTarget = n ? Math.min(1, Math.sqrt(n) / 5) : 0;
  galaxyExtentTarget = n ? (n <= 25 ? .25 + Math.sqrt(n) / 5 * .75 : 1 + Math.log2(n / 25) * .15) : .1;
  if (!n) { galaxyGrowth = 0; galaxyExtent = galaxyExtentTarget; }
  galaxyDust.geometry.setDrawRange(0, Math.min(galaxyDust.geometry.attributes.position.count, n * 190));
  deepDust.geometry.setDrawRange(0, Math.min(1800, Math.max(0, n - 1) * 50));
}
function spawnBirth(id) {
  const group = worldStars.get(id); if (!group || !birthMap) return;
  const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: birthMap, color: 0xe9f3ff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.scale.set(4, 4, 1); group.add(ring);
  births.push({ ring, group, start: clock });
}
function rebuildWordStars() {
  if (!wordGroup) return;
  births.length = 0;
  for (const group of worldStars.values()) { group.traverse(obj => { if (obj.material) obj.material.dispose(); }); wordGroup.remove(group); }
  if (denseStarMeshes) {
    for (const mesh of Object.values(denseStarMeshes)) { wordGroup.remove(mesh); mesh.material.dispose(); mesh.dispose?.(); }
    denseStarMeshes.outer.geometry.dispose();
    denseStarMeshes = null;
  }
  worldStars.clear();
  $('#star-layer').replaceChildren(); starNodes.clear();
  lastOverlayUpdate = -Infinity;
  if (words.length > DENSE_STAR_THRESHOLD) {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const layer = (map, opacity) => {
      const material = new THREE.MeshBasicMaterial({ map, color: 0xffffff, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const mesh = new THREE.InstancedMesh(geometry, material, words.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      wordGroup.add(mesh);
      return mesh;
    };
    denseStarMeshes = { outer: layer(glowMap, .32), inner: layer(glowMap, .74), center: layer(starCoreMap, 1) };
  }
  const oldestStars = words.filter(w => entryKind(w) === 'word');
  const starOrdinals = new Map(oldestStars.map((star, ordinal) => [star.id, ordinal]));
  const oldestPair = oldestStars.length >= 2 ? [...oldestStars].sort((a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0) || starOrdinals.get(a.id) - starOrdinals.get(b.id)).slice(0, 2) : [];
  words.forEach((word, index) => {
    const group = new THREE.Group(); group.position.set(word.x, word.y, word.z || 18);
    const isPlanet = entryKind(word) === 'conjunction';
    const appearance = starAge(word.createdAt);
    const tint = new THREE.Color(appearance.glow);
    let hash = 0; for (const char of word.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const magnitude = .66 + hash % 100 / 100 * .62;
    const outer = denseStarMeshes || isPlanet ? null : sprite(tint, 24 * magnitude * appearance.size, .32);
    const inner = denseStarMeshes || isPlanet ? null : sprite(tint, 8 * magnitude * appearance.size, .74);
    const center = denseStarMeshes || isPlanet ? null : sprite(new THREE.Color(appearance.color), 4.7 * magnitude * appearance.size, 1, starCoreMap);
    const glint = !denseStarMeshes && !isPlanet && hash % 6 === 0 ? sprite(new THREE.Color(appearance.color), 8, .17, starCoreMap) : null;
    const dx = word.x - 31, dy = word.y;
    const orbitX = dx * Math.cos(.17) - dy * Math.sin(.17);
    const orbitY = dx * Math.sin(.17) + dy * Math.cos(.17);
    const radius = Math.max(4, Math.hypot(orbitX, orbitY / .57));
    if (outer) group.add(outer, inner, center);
    if (glint) group.add(glint);
    const planet = isPlanet ? makePlanet(planetType(word)) : null;
    if (planet) { planet.scale.setScalar(2.25); group.add(planet); }
    if (denseStarMeshes && !isPlanet) {
      denseStarMeshes.outer.setColorAt(index, tint);
      denseStarMeshes.inner.setColorAt(index, tint);
      denseStarMeshes.center.setColorAt(index, new THREE.Color(appearance.color));
    }
    const stellarIndex = starOrdinals.get(word.id) ?? -1;
    const cluster = stellarIndex >= 2 ? Math.floor((stellarIndex - 2) / 7) : -1;
    group.userData = { outer, inner, center, glint, planet, isPlanet, index, magnitude, appearanceSize: appearance.size, radius, phase: Math.atan2(orbitY / .57, orbitX), z: word.z || 18, speed: cluster >= 0 ? .068 / (1 + cluster * .2) + (index % 3) * .0004 : .095 / (1 + radius * .024), appearanceDay: appearance.ageDays, word, binarySlot: isPlanet ? -1 : oldestPair.findIndex(w => w.id === word.id) };
    wordGroup.add(group); worldStars.set(word.id, group);
    const button = document.createElement('button'); button.className = 'star-hit'; button.type = 'button'; button.setAttribute('aria-label', t(isPlanet ? 'message.openPlanet' : 'message.openStar', { word: word.word }));
    button.addEventListener('click', () => selectWord(word.id));
    const label = document.createElement('div'); label.className = 'star-label';
    const name = document.createElement('b'); name.textContent = word.word;
    label.append(name); $('#star-layer').append(button, label);
    starNodes.set(word.id, { button, label });
  });
  if (denseStarMeshes) for (const mesh of Object.values(denseStarMeshes)) mesh.instanceColor.needsUpdate = true;
}
const projected = new THREE.Vector3();
function animate(ms) {
  if (!renderer) return;
  const fpsMonitor = $('#fps-monitor');
  if (!fpsMonitor.hidden) {
    fpsFrames++;
    if (ms - fpsLast >= 1000) { fpsMonitor.textContent = `FPS ${Math.round(fpsFrames * 1000 / (ms - fpsLast))} · ${t('message.drawCalls', { count: drawCalls })}`; fpsFrames = 0; fpsLast = ms; }
  }
  clock = ms * .001;
  const drift = reducedMotion ? 0 : clock;
  const focusedStar = focusedStarId ? worldStars.get(focusedStarId) : null;
  const targetX = focusedStar ? focusedStar.position.x : pan.x + (dragging ? 0 : pointer.x * 1.9);
  const targetY = focusedStar ? focusedStar.position.y : pan.y + (dragging ? 0 : pointer.y * 1.25);
  camera.position.x += (targetX - camera.position.x) * .035;
  camera.position.y += (targetY - camera.position.y) * .035;
  camera.position.z += (zoom - camera.position.z) * .055;
  camera.lookAt(camera.position.x, camera.position.y, 0);
  galaxyGrowth += (galaxyGrowthTarget - galaxyGrowth) * .026;
  galaxyExtent += (galaxyExtentTarget - galaxyExtent) * .026;
  galaxyGroup.scale.setScalar(galaxyExtent);
  galaxyGroup.position.x = 31 * (1 - galaxyExtent);
  galaxyGroup.rotation.z = drift * .004 + Math.sin(drift * .055) * .012;
  wordGroup.rotation.z = 0;
  cloudHaze.material.opacity = galaxyGrowth ? Math.min(activeVisualStyle === 'spiral' ? .62 : .48, .11 + galaxyGrowth * .7) * (.96 + Math.sin(drift * .19) * .04) : 0;
  cloudHaze2.material.opacity = galaxyGrowth * (.19 + Math.cos(drift * .28) * .025);
  cloudHaze3.material.opacity = Math.max(0, galaxyGrowth - .23) * (.21 + Math.sin(drift * .2) * .02);
  cloudHaze4.material.opacity = Math.max(0, galaxyGrowth - .54) * (.2 + Math.cos(drift * .17) * .02);
  for (let i = 0; i < nebulaRegions.length; i++) nebulaRegions[i].material.opacity = Math.max(0, Math.min(1, (words.length - 4 - i * 7) / 8)) * (.07 + Math.sin(drift * .12 + i) * .01);
  coreGlow.material.opacity = Math.max(0, galaxyGrowth - .35) * (.22 + Math.sin(drift * 1.1) * .04);
  innerGlow.material.opacity = Math.max(0, galaxyGrowth - .75) * .16;
  galaxyDust.material.uniforms.uIntensity.value = words.length ? .17 + galaxyGrowth * .43 : 0;
  deepDust.material.uniforms.uIntensity.value = words.length > 1 ? .035 + galaxyGrowth * .11 : 0;
  for (let i = births.length - 1; i >= 0; i--) {
    const birth = births[i]; const age = clock - birth.start;
    if (age > 2.3) { birth.group.remove(birth.ring); birth.ring.material.dispose(); births.splice(i, 1); continue; }
    const t = age / 2.3;
    birth.ring.scale.setScalar(4 + t * 43);
    birth.ring.material.opacity = (1 - t) * (1 - t) * .9;
  }
  const meteorCycle = drift % 24;
  if (words.length && meteorCycle > 16 && meteorCycle < 16.72) {
    const t = (meteorCycle - 16) / .72;
    const cycle = Math.floor(drift / 24);
    const halfHeight = (camera.position.z - 2) * Math.tan(THREE.MathUtils.degToRad(25));
    const halfWidth = halfHeight * camera.aspect;
    const side = cycle % 2 ? -1 : 1;
    const x = camera.position.x + side * (.78 - t * .64) * halfWidth;
    const y = camera.position.y + (.7 - t * .48) * halfHeight;
    const a = meteor.geometry.attributes.position.array;
    a.set([x + side * halfWidth * .16, y + halfHeight * .12, 2, x, y, 2]); meteor.geometry.attributes.position.needsUpdate = true;
    meteor.material.opacity = Math.sin(t * Math.PI) * .58;
    meteorTip.position.set(x, y, 2); meteorTip.scale.setScalar(Math.max(1.8, halfHeight * .035)); meteorTip.material.opacity = Math.sin(t * Math.PI) * .82;
  } else { meteor.material.opacity = 0; meteorTip.material.opacity = 0; }
  const cometCycle = drift % 61;
  if (words.length > 2 && cometCycle > 29 && cometCycle < 43) {
    const t = (cometCycle - 29) / 14;
    const halfHeight = (camera.position.z - 3) * Math.tan(THREE.MathUtils.degToRad(25));
    const halfWidth = halfHeight * camera.aspect;
    spaceComet.scale.set(halfWidth * .64, halfHeight * .22, 1);
    spaceComet.position.set(camera.position.x + halfWidth * (.77 - t * .48), camera.position.y + halfHeight * (-.48 + t * .12), 3);
    spaceComet.material.opacity = Math.min(1, t * 7, (1 - t) * 7) * .65;
  } else spaceComet.material.opacity = 0;
  for (const mat of galaxyGroup.userData.materials) mat.uniforms.uTime.value = drift;
  const today = Math.floor(Date.now() / 86400000);
  const refreshStarAge = today !== lastStarAgeDay;
  if (refreshStarAge) lastStarAgeDay = today;
  const updateOverlays = !denseStarMeshes || ms - lastOverlayUpdate >= 33;
  if (updateOverlays) lastOverlayUpdate = ms;
  for (const [id, group] of worldStars) {
    const orbit = group.userData;
    if (orbit.binarySlot >= 0) {
      const galacticAngle = .6 + drift * .029;
      const sparseSpread = 1 + Math.max(0, 15 - words.length) / 14 * .8;
      const cx = 31 + Math.cos(galacticAngle) * 14 * sparseSpread;
      const cy = Math.sin(galacticAngle) * 8 * sparseSpread;
      const binaryAngle = drift * .52 + orbit.binarySlot * Math.PI;
      const binaryRadius = orbit.binarySlot === 0 ? 5.63 : 6.37;
      group.position.set(cx + Math.cos(binaryAngle) * binaryRadius, cy + Math.sin(binaryAngle) * binaryRadius * .72, 18 + Math.sin(binaryAngle) * 1.1);
      if (orbit.outer) orbit.outer.material.opacity = .39 + Math.sin(drift * 3.1 + orbit.binarySlot * 2.3) * .075;
    } else {
      const angle = orbit.phase + drift * orbit.speed;
      const wobble = Math.sin(angle * 3 + orbit.index) * orbit.radius * .018;
      const sparseSpread = 1 + Math.max(0, 15 - words.length) / 14 * .8;
      const radius = (orbit.radius + wobble) * sparseSpread;
      const ox = Math.cos(angle) * radius, oy = Math.sin(angle) * radius * .57;
      group.position.set(31 + ox * Math.cos(-.17) - oy * Math.sin(-.17), ox * Math.sin(-.17) + oy * Math.cos(-.17), orbit.z + Math.sin(angle * 2 + orbit.index) * .55);
      if (orbit.outer) orbit.outer.material.opacity = .31 + Math.sin(drift * 1.6 + orbit.index * 2.1) * .065;
    }
    if (refreshStarAge && !orbit.isPlanet) {
      const appearance = starAge(orbit.word.createdAt);
      orbit.appearanceDay = appearance.ageDays;
      orbit.appearanceSize = appearance.size;
      const tint = new THREE.Color(appearance.glow);
      if (denseStarMeshes) {
        denseStarMeshes.outer.setColorAt(orbit.index, tint);
        denseStarMeshes.inner.setColorAt(orbit.index, tint);
        denseStarMeshes.center.setColorAt(orbit.index, new THREE.Color(appearance.color));
      } else {
        orbit.outer.material.color.copy(tint); orbit.inner.material.color.copy(tint);
        orbit.center.material.color.set(appearance.color);
      }
      if (orbit.glint) orbit.glint.material.color.set(appearance.color);
    }
    if (denseStarMeshes) {
      if (orbit.isPlanet) {
        denseMatrix.makeScale(0, 0, 0).setPosition(group.position);
        for (const mesh of Object.values(denseStarMeshes)) mesh.setMatrixAt(orbit.index, denseMatrix);
      } else {
      const scale = orbit.magnitude * orbit.appearanceSize;
      const binaryPulse = orbit.binarySlot >= 0 ? 1.12 + Math.sin(drift * 3.1 + orbit.binarySlot * 2.3) * .12 : 1 + Math.sin(drift * 1.6 + orbit.index * 2.1) * .035;
      for (const [mesh, size] of [[denseStarMeshes.outer, 24 * scale * binaryPulse], [denseStarMeshes.inner, 8 * scale], [denseStarMeshes.center, 4.7 * scale]]) {
        denseMatrix.makeScale(size, size, 1).setPosition(group.position);
        mesh.setMatrixAt(orbit.index, denseMatrix);
      }
      }
    }
    if (orbit.glint) {
      orbit.glint.scale.setScalar(Math.min(42, 5 + Math.sqrt(zoom) * .3));
      orbit.glint.material.opacity = .13 + Math.sin(drift * .95 + orbit.index * 4.2) * .05;
    }
    if (orbit.planet) {
      const body = orbit.planet;
      body.position.set(0, 0, 0);
      body.children[0].rotation.y = drift * .035;
      body.children[0].material.uniforms.uLight.value.set(-.55, .38, 1.25).normalize();
      body.children[body.children.length - 1].material.opacity = zoom > 350 ? .46 : .2;
    }
    if (!updateOverlays) continue;
    group.getWorldPosition(projected); projected.project(camera);
    const x = (projected.x * .5 + .5) * innerWidth;
    const y = (-projected.y * .5 + .5) * innerHeight;
    const visible = projected.z < 1 && x > -80 && x < innerWidth + 80 && y > -50 && y < innerHeight + 50;
    const nodes = starNodes.get(id);
    if (!nodes) continue;
    nodes.button.style.display = nodes.label.style.display = visible ? '' : 'none';
    if (visible) { nodes.button.style.left = nodes.label.style.left = `${x}px`; nodes.button.style.top = nodes.label.style.top = `${y}px`; }
  }
  if (denseStarMeshes) for (const mesh of Object.values(denseStarMeshes)) { mesh.instanceMatrix.needsUpdate = true; if (refreshStarAge) mesh.instanceColor.needsUpdate = true; }
  renderer.render(scene, camera);
  drawCalls = renderer.info.render.calls;
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
  const isPlanet = entryKind(word) === 'conjunction';
  selectedId = id;
  $('#object-record-label').textContent = t(isPlanet ? 'panel.recordPlanet' : 'panel.recordStar');
  $('#object-stage-label').textContent = t(isPlanet ? 'panel.planetAge' : 'panel.starStage');
  $('#detail-language').textContent = typeLabel(universe.galaxies.find(g => g.id === word.galaxyId), isPlanet ? 'conjunction' : 'word');
  const meaningLabel = meaningLanguageLabel(universe.galaxies.find(g => g.id === word.galaxyId));
  $('#detail-meaning-language').textContent = meaningLabel;
  $('#focus-star').firstChild.textContent = `${t(isPlanet ? 'panel.focusPlanet' : 'panel.focusStar')} `;
  $('#delete-word').textContent = t(isPlanet ? 'panel.removePlanet' : 'panel.removeStar');
  $('#detail-sun').classList.toggle('planet', isPlanet);
  $('#detail-number').textContent = t('message.numberLabel', { number: String(words.indexOf(word) + 1).padStart(3, '0') });
  $('#detail-word').textContent = word.word;
  $('#detail-meaning').textContent = word.meaning;
  $('#detail-meaning').hidden = true;
  $('#meaning-hidden').hidden = false;
  $('#reveal-meaning').setAttribute('aria-pressed', 'false');
  $('#reveal-meaning').setAttribute('aria-label', t('message.revealMeaning', { label: meaningLabel }));
  const appearance = starAge(word.createdAt);
  $('#star-age-label').textContent = isPlanet ? t('message.planetAge', { planet: t(`names.planet.${planetType(word)}`), age: formatUnit(uiLocale, 'day', appearance.ageDays) }) : t('message.starAge', { stage: starStageLabel(appearance), age: formatUnit(uiLocale, 'day', appearance.ageDays) });
  $('#binary-label').hidden = worldStars.get(word.id)?.userData.binarySlot < 0;
  $('#detail-example').textContent = word.example || '';
  $('#example-wrap').hidden = !word.example;
  $('#detail-date').textContent = t('message.joined', { date: fmtDate(word.createdAt) });
  $('#detail-sun').style.setProperty('--star-glow', appearance.glow);
  $('#detail-sun').style.setProperty('--star-core', appearance.color);
  for (const [starId, nodes] of starNodes) nodes.label.classList.toggle('selected', starId === id);
  openPanel('detail');
}
function focusStar() {
  if (!worldStars.has(selectedId)) return;
  preFocusPan = { ...pan };
  closePanels();
  if (!$('#app').classList.contains('immersive')) $('#universe-mode').click();
  focusedStarId = selectedId;
  zoom = 36;
}
function createPosition(index, variation = .5, kind = 'word') {
  if (kind === 'conjunction') {
    const radius = 17 + Math.sqrt(words.length + 1) * 7 + variation * 8;
    const angle = variation * Math.PI * 2 + words.length * 2.399;
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius * .57;
    return { x: 31 + x * Math.cos(-.17) - y * Math.sin(-.17), y: x * Math.sin(-.17) + y * Math.cos(-.17), z: 17 + variation * 3 };
  }
  if (index >= 2) {
    const cluster = Math.floor((index - 2) / 7);
    const slot = (index - 2) % 7;
    const seed = random((cluster + 1) * 42197 + slot * 7919);
    const radius = 22 + Math.sqrt(cluster) * 20;
    const angle = cluster * 2.399 + .7;
    const cx = Math.cos(angle) * radius, cy = Math.sin(angle) * radius * .57;
    const galaxySeed = hashText(universe.activeGalaxyId);
    const pattern = STAR_PATTERNS[(cluster + galaxySeed) % STAR_PATTERNS.length][slot];
    const rotation = cluster * 2.399 + (galaxySeed % 31) * .014;
    const px = pattern[0] * Math.cos(rotation) - pattern[1] * Math.sin(rotation);
    const py = pattern[0] * Math.sin(rotation) + pattern[1] * Math.cos(rotation);
    const x = cx + px + (seed() - .5) * 2.4 + (variation - .5) * 5;
    const y = cy + py + (seed() - .5) * 2.4 + (variation - .5) * 3;
    return { x: 31 + x * Math.cos(-.17) - y * Math.sin(-.17), y: x * Math.sin(-.17) + y * Math.cos(-.17), z: 17 + slot * .62 };
  }
  const arm = index % 4;
  const layer = Math.floor(index / 4);
  const radius = index === 0 ? 10 + variation * 9 : 15 + variation * 9 + Math.sqrt(layer + 1) * 3;
  const angle = arm * Math.PI / 2 + radius * .055 + index * .045 + (variation - .5) * 1.5;
  const rx = Math.cos(angle) * radius;
  const ry = Math.sin(angle) * radius * .57;
  const tilt = -.17;
  return { x: 31 + rx * Math.cos(tilt) - ry * Math.sin(tilt), y: rx * Math.sin(tilt) + ry * Math.cos(tilt), z: 17 + (index % 4) * 1.2 };
}
function saveWord(event) {
  event.preventDefault();
  if (!universe.galaxies.some(g => g.id === universe.activeGalaxyId)) { openPanel('galaxy'); showToast(t('sync.createGalaxy')); return; }
  const kind = $('#word-form input[name="kind"]:checked')?.value === 'conjunction' ? 'conjunction' : 'word';
  const word = $('#word-input').value.trim();
  const meaning = $('#meaning-input').value.trim();
  const example = $('#example-input').value.trim();
  if (!word || !meaning) { $('#form-error').textContent = t('message.requiredFields'); return; }
  const locale = universe.galaxies.find(g => g.id === universe.activeGalaxyId)?.language === 'İspanyolca' ? 'es' : 'en';
  const duplicate = words.some(w => w.word.toLocaleLowerCase(locale) === word.toLocaleLowerCase(locale) && w.id !== editingId);
  if (duplicate) { $('#form-error').textContent = t('message.duplicateWord'); return; }
  if (editingId) {
    const editedId = editingId;
    const item = words.find(w => w.id === editedId);
    const before = item ? { ...item } : null;
    if (item) { Object.assign(item, { word, meaning, example, kind, planetType: kind === 'conjunction' ? (entryKind(item) === 'conjunction' ? planetType(item) : nextPlanetType(universe.words, item.galaxyId)) : undefined, updatedAt: new Date().toISOString() }); appendEvent(universe, 'word.updated', item.galaxyId, item.id, before, item); }
    persist(); rebuildWordStars(); refreshCounts(); closePanels(); selectWord(editedId); showToast(t('message.wordUpdated'));
    return;
  }
  const position = createPosition(kind === 'word' ? words.filter(w => entryKind(w) === 'word').length : words.length, Math.random(), kind);
  const item = { id: crypto.randomUUID(), galaxyId: universe.activeGalaxyId, word, meaning, example, kind, createdAt: new Date().toISOString(), ...position };
  if (kind === 'conjunction') item.planetType = nextPlanetType(universe.words, item.galaxyId);
  universe.words.push(item); words.push(item); appendEvent(universe, 'word.created', item.galaxyId, item.id, null, item);
  persist(); rebuildWordStars(); refreshCounts(); spawnBirth(item.id); closePanels(); selectWord(item.id);
  showToast(t(kind === 'conjunction' ? 'message.planetAdded' : 'message.starAdded', { word }));
}
function setFormTitle(isPlanet, editing) {
  const prefix = editing ? 'edit' : 'new';
  const kind = isPlanet ? 'Planet' : 'Star';
  const title = $('#form-title');
  const em = document.createElement('em');
  em.textContent = t(`panel.${prefix}${kind}Second`);
  title.replaceChildren(t(`panel.${prefix}${kind}First`), document.createElement('br'), em);
}
function updateEntryKindForm() {
  const isPlanet = $('#word-form input[name="kind"]:checked')?.value === 'conjunction';
  $('#word-language-label').textContent = typeLabel(universe.galaxies.find(g => g.id === universe.activeGalaxyId), isPlanet ? 'conjunction' : 'word');
  setFormTitle(isPlanet, !!editingId);
  $('#form-copy').textContent = t(editingId ? 'panel.editCopy' : isPlanet ? 'panel.newPlanetCopy' : 'panel.newStarCopy');
  $('#submit-word').firstChild.textContent = `${t(editingId ? 'panel.saveChanges' : isPlanet ? 'panel.addPlanet' : 'panel.addStar')} `;
}
function beginEdit() {
  const word = words.find(w => w.id === selectedId); if (!word) return;
  editingId = word.id;
  $('#next-number').textContent = String(words.indexOf(word) + 1).padStart(3, '0');
  $('#word-input').value = word.word; $('#meaning-input').value = word.meaning; $('#example-input').value = word.example || '';
  $(`#word-form input[name="kind"][value="${entryKind(word)}"]`).checked = true;
  updateEntryKindForm();
  openPanel('add');
}
function openAdd() {
  if (!universe.galaxies.some(g => g.id === universe.activeGalaxyId)) { renderGalaxies(); openPanel('galaxy'); showToast(t('sync.createGalaxy')); return; }
  editingId = null; $('#word-form').reset(); $('#form-error').textContent = '';
  $('#next-number').textContent = String(words.length + 1).padStart(3, '0');
  updateEntryKindForm();
  openPanel('add');
}
function deleteSelected() {
  const word = words.find(w => w.id === selectedId); if (!word) return;
  if (!window.confirm(t(entryKind(word) === 'conjunction' ? 'message.removePlanetConfirm' : 'message.removeStarConfirm', { word: word.word }))) return;
  appendEvent(universe, 'word.deleted', word.galaxyId, word.id, word, null);
  universe.words = universe.words.filter(w => w.id !== selectedId);
  words = words.filter(w => w.id !== selectedId);
  persist(); rebuildWordStars(); refreshCounts(); closePanels();
  showToast(t('message.wordRemoved'));
}
function renderCollection() {
  const query = $('#search-input').value.trim().toLocaleLowerCase(uiLocale);
  const result = [...words].reverse().filter(w => `${w.word} ${w.meaning}`.toLocaleLowerCase(uiLocale).includes(query));
  $('#result-count').textContent = formatUnit(uiLocale, 'entry', result.length, { uppercase: true });
  const list = $('#collection-list'); list.replaceChildren();
  if (!result.length) { const empty = document.createElement('div'); empty.className = 'collection-empty'; empty.textContent = t(words.length ? 'message.emptySearch' : 'message.emptyCollection'); list.append(empty); return; }
  for (const word of result) {
    const row = document.createElement('button'); row.className = 'collection-item'; row.type = 'button';
    const star = document.createElement('span'); star.className = `collection-star${entryKind(word) === 'conjunction' ? ' planet' : ''}`; star.style.setProperty('--star-glow', starAge(word.createdAt).glow);
    const copy = document.createElement('span'); copy.className = 'collection-copy';
    const title = document.createElement('strong'); title.textContent = word.word;
    const sub = document.createElement('small'); sub.textContent = entryKind(word) === 'conjunction' ? t('message.planetCollection', { planet: t(`names.planet.${planetType(word)}`) }) : starStageLabel(starAge(word.createdAt));
    const arrow = document.createElement('span'); arrow.className = 'collection-arrow'; arrow.textContent = '↗';
    copy.append(title, sub); row.append(star, copy, arrow);
    row.addEventListener('click', () => selectWord(word.id)); list.append(row);
  }
}

function renderGalaxies() {
  const list = $('#galaxy-list'); list.replaceChildren();
  for (const galaxy of universe.galaxies) {
    const galaxyWords = universe.words.filter(w => w.galaxyId === galaxy.id);
    const starCount = galaxyWords.filter(w => entryKind(w) === 'word').length;
    const planetCount = galaxyWords.length - starCount;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'galaxy-item';
    if (galaxy.id === universe.activeGalaxyId) button.classList.add('active');
    const icon = document.createElement('span'); icon.className = 'galaxy-item-icon'; icon.textContent = '✧';
    const copy = document.createElement('span'); copy.className = 'galaxy-item-copy';
    const name = document.createElement('strong'); name.textContent = galaxyDisplay(galaxy);
    const sub = document.createElement('small'); sub.textContent = t('message.galaxyRow', { language: languageDisplay(galaxy.language), style: t(`names.galaxyStyle.${galaxyStyle(galaxy)}`), stars: formatUnit(uiLocale, 'star', starCount), planets: formatUnit(uiLocale, 'planet', planetCount) });
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
    showToast(t('message.galaxyRenamed'));
  }
  toggleGalaxyRename(false);
}

function updateMeaningLanguage(event) {
  const galaxy = universe.galaxies.find(g => g.id === universe.activeGalaxyId);
  if (!galaxy || !MEANING_LANGUAGES.has(event.target.value) || galaxy.meaningLanguage === event.target.value) return;
  const before = { ...galaxy };
  galaxy.meaningLanguage = event.target.value;
  appendEvent(universe, 'galaxy.meaningLanguageChanged', galaxy.id, null, before, galaxy);
  persist(); refreshCounts();
  showToast(t('message.meaningLanguageUpdated'));
}

function switchGalaxy(id) {
  if (!universe.galaxies.some(g => g.id === id)) return;
  universe.activeGalaxyId = id;
  words = universe.words.filter(w => w.galaxyId === id);
  selectedId = null; editingId = null;
  toggleGalaxyRename(false);
  persist(); rebuildWordStars(); refreshCounts(); closePanels();
  const galaxy = universe.galaxies.find(g => g.id === id);
  showToast(t('message.galaxyOpened', { galaxy: galaxyDisplay(galaxy) }));
}

function createGalaxy(event) {
  event.preventDefault();
  const language = $('#language-input').value.trim();
  const name = $('#galaxy-name-input').value.trim() || t('message.newGalaxyName', { language });
  if (!language) return;
  const meaningLanguage = $('#meaning-language-input').value;
  const galaxy = { id: crypto.randomUUID(), name, language, meaningLanguage, visualStyle: nextGalaxyStyle(universe.galaxies), createdAt: new Date().toISOString() };
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
  showToast(t('message.exported'));
}

async function importUniverse(event) {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 10_000_000) throw new Error('too-large');
    const backup = normalizeBackup(JSON.parse(await file.text()));
    mergeUniverse(universe, backup);
    appendEvent(universe, 'universe.imported', universe.activeGalaxyId, null, null, { fileName: file.name, galaxyCount: backup.galaxies.length, wordCount: backup.words.length });
    words = universe.words.filter(w => w.galaxyId === universe.activeGalaxyId);
    persist(); rebuildWordStars(); refreshCounts(); renderGalaxies();
    showToast(t('message.imported'));
  } catch { showToast(t('message.invalidBackup')); }
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
function zoomOnGalaxy(value) {
  if (!words.length || !camera) { setZoom(value); return; }
  projected.set(31, 0, 0).project(camera);
  const x = (projected.x * .5 + .5) * innerWidth;
  const y = (-projected.y * .5 + .5) * innerHeight;
  if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) setZoom(value);
  else setZoom(value, x, y);
}

function bindUI() {
  $('#ui-language').addEventListener('change', (event) => {
    const nextLocale = event.target.value;
    location.assign(localePath(nextLocale));
  });
  $('#universe-mode').addEventListener('click', () => {
    const button = $('#universe-mode');
    const immersive = !$('#app').classList.contains('immersive');
    if (immersive) { closePanels(); preImmersiveZoom = zoom; if (words.length > 0 && words.length < 25) zoom = Math.min(zoom, words.length < 10 ? 72 : 105); }
    else if (preImmersiveZoom !== null) { zoom = preImmersiveZoom; preImmersiveZoom = null; }
    $('#app').classList.toggle('immersive', immersive);
    pan.x += immersive ? 31 : -31;
    if (!immersive && focusedStarId) { focusedStarId = null; if (preFocusPan) { pan.x = preFocusPan.x; pan.y = preFocusPan.y; preFocusPan = null; } }
    button.setAttribute('aria-pressed', String(immersive));
    button.setAttribute('aria-label', t(immersive ? 'home.showInterface' : 'home.universeOnly'));
  });
  for (const sel of ['#open-add', '#hero-add', '#collection-add']) $(sel).addEventListener('click', openAdd);
  $('#hero-explore').addEventListener('click', () => { $('#hero').style.opacity = '.18'; setTimeout(() => $('#hero').style.opacity = '', 2600); });
  $('#home-btn').addEventListener('click', () => { closePanels(); focusedStarId = null; preFocusPan = null; pan.x = pan.y = pointer.x = pointer.y = 0; zoom = 160; });
  $('#explore-btn').addEventListener('click', closePanels);
  $('#collection-btn').addEventListener('click', () => openPanel('collection'));
  $('#galaxy-switch').addEventListener('click', () => openPanel('galaxy'));
  $('#close-galaxy').addEventListener('click', closePanels);
  $('#galaxy-form').addEventListener('submit', createGalaxy);
  $('#rename-galaxy').addEventListener('click', () => toggleGalaxyRename(true));
  $('#rename-galaxy-form').addEventListener('submit', renameGalaxy);
  $('#meaning-language-current').addEventListener('change', updateMeaningLanguage);
  $('#cancel-rename-galaxy').addEventListener('click', () => toggleGalaxyRename(false));
  $('#export-universe').addEventListener('click', exportUniverse);
  $('#import-universe').addEventListener('change', importUniverse);
  $('#reveal-meaning').addEventListener('click', () => {
    const reveal = $('#detail-meaning').hidden;
    $('#detail-meaning').hidden = !reveal;
    $('#meaning-hidden').hidden = reveal;
    $('#reveal-meaning').setAttribute('aria-pressed', String(reveal));
    const meaningLabel = meaningLanguageLabel(universe.galaxies.find(g => g.id === universe.activeGalaxyId));
    $('#reveal-meaning').setAttribute('aria-label', t(reveal ? 'message.hideMeaning' : 'message.revealMeaning', { label: meaningLabel }));
  });
  $('#close-detail').addEventListener('click', closePanels);
  $('#focus-star').addEventListener('click', focusStar);
  $('#close-add').addEventListener('click', closePanels);
  $('#close-collection').addEventListener('click', closePanels);
  $('#panel-backdrop').addEventListener('click', closePanels);
  $('#word-form').addEventListener('submit', saveWord);
  $('#word-form').addEventListener('change', event => { if (event.target.name === 'kind') updateEntryKindForm(); });
  $('#edit-word').addEventListener('click', beginEdit);
  $('#delete-word').addEventListener('click', deleteSelected);
  $('#search-input').addEventListener('input', renderCollection);
  $('#zoom-in').addEventListener('click', () => zoomOnGalaxy(zoom / 1.38));
  $('#zoom-out').addEventListener('click', () => zoomOnGalaxy(zoom * 1.38));
  $('#reset-view').addEventListener('click', () => { focusedStarId = null; preFocusPan = null; pan.x = $('#app').classList.contains('immersive') ? 31 : 0; pan.y = 0; zoom = 160; });
  document.addEventListener('keydown', e => { if ($('#account-dialog')?.open) return; if (e.key === 'Escape') { if (activePanel) closePanels(); else if ($('#app').classList.contains('immersive')) $('#universe-mode').click(); } if (e.key === '/' && !activePanel) { e.preventDefault(); openPanel('collection'); } if (e.shiftKey && e.key.toLowerCase() === 'f' && !activePanel) { const monitor = $('#fps-monitor'); monitor.hidden = !monitor.hidden; fpsFrames = 0; fpsLast = performance.now(); } });
  const canvas = $('#universe');
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) { const [a, b] = [...touches.values()]; pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom }; dragging = false; dragStart = null; }
    }
    if (touches.size < 2) { if (focusedStarId) { focusedStarId = null; preFocusPan = null; pan.x = camera.position.x; pan.y = camera.position.y; } dragging = true; moved = false; dragStart = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }; }
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
  window.scrollTo(0, 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  $('#app').scrollLeft = 0;
}
resetPageScroll();
window.addEventListener('pageshow', () => { resetPageScroll(); requestAnimationFrame(resetPageScroll); setTimeout(resetPageScroll, 250); });
applyHomeTranslations(uiLocale);
persist(); refreshCounts(); bindUI(); initScene();
accountSync = mountAccountSync({
  locale: uiLocale,
  getUniverse: () => universe,
  beforeSwitch: closePanels,
  notify: showToast,
  replaceUniverse: next => {
    universe = next;
    words = universe.words.filter(w => w.galaxyId === universe.activeGalaxyId);
    if (!words.some(w => w.id === selectedId)) selectedId = null;
    if (!words.some(w => w.id === editingId)) {
      editingId = null;
      if (activePanel === 'add') updateEntryKindForm();
    }
    rebuildWordStars(); refreshCounts(); renderGalaxies();
    if (activePanel === 'collection') renderCollection();
    if (activePanel === 'detail' && !selectedId) closePanels();
  },
});
mountAuthUI({ locale: uiLocale, beforeOpen: closePanels, onSession: accountSync.onSession, onSync: accountSync.open });
if (recoveredFromMirror) showToast(t('message.recovered'));
if (archiveFailure) showToast(t('status.archiveError'));
