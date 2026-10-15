import { createLivingSky } from './living-sky.js';
import { createOrionStarField } from './orion-star-field.js';
import { placeWordStar, starApproach } from './word-star-placement.js';
import { stellarSpectrum } from './stellar-evolution.js';
import { createStarTransmission } from './star-nebula-transmission.js';
import * as THREE from 'three';
import './style.css';
import './product-polish.css';
import './scene-loading.css';
import { createRenderQuality } from './render-quality.js';
import { worldUnitsPerPixel, pinchRatio, isEditingTarget, nebulaCruiseStep, cameraDamping } from './camera-input.js';
import { createSkyEvents } from './sky-events.js';
import { mountSoundscape } from './soundscape-ui.js';
import { mountSkyEventsUI, mountNebulaNavigation } from './sky-events-ui.js';
import { mountSceneControls } from './scene-controls.js';
import { mountRecallUI } from './recall-ui.js';
import { mountWordCard } from './word-card.js';
import { mountStellarPreview } from './stellar-preview.js';
import { mountCollectionAtlas, queryAtlas } from './collection-atlas.js';
import { mountGraphicsFallback } from './graphics-fallback.js';
import { createWordStarSystem, wordStarPosition, WORD_STAR_RADIUS } from './word-star-system.js';
import { createNebulaSystem } from './nebula-system.js';
import { mountNebulaUI } from './nebula-ui.js';
import { nebulaBackPlane } from './nebula-layout.js';
import { createExperienceMode } from './experience-mode.js';
import { mountExperienceUI } from './experience-ui.js';
import { PLANET_TYPES, entryKind, nextPlanetType, galaxyStyle, nextGalaxyStyle, starAge, appendEvent, mergeUniverse, normalizeBackup } from './universe-data.js';
import { archiveBeforeMigration, writeUniverseMirror } from './storage-mirror.js';
import { loadLocalUniverse, persistLocalUniverse } from './local-primary.js';
import { translate, formatDate, formatUnit } from './i18n.js';
import { applyHomeTranslations, getHomeLocale } from './home-i18n.js';
import { mountProfileUI, profileSessionListener } from './profile-ui.js';
import { getSupabaseClient } from './supabase-client.js';
import { mountAuthUI } from './auth-ui.js';
import { mountAccountSync } from './account-sync-ui.js';
import './home-design.css';
import './learning-design.css';
import './ion-veil.css';
import './exploration-design.css';
import { createConstellationPaths } from './constellation-paths.js';
import { visibleLabelIds, recentRecords } from './word-exploration.js';
import { mountObservatory, mountRecordNavigation } from './observatory-ui.js';
import { polishInterfaceIcons, icon } from './interface-icons.js';

const $ = (selector) => document.querySelector(selector);
const stellarPreview = mountStellarPreview($('.detail-visual'));
const uiLocale = getHomeLocale();
const wordCard = mountWordCard({ locale: uiLocale, preview: stellarPreview,
  getRecord: () => experience.snapshot().ready ? words.find(w => w.id === selectedId) : null,
});
// Begin the locked SDK chunk before IDB and heavy scene initialization.
getSupabaseClient().catch(() => {});
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
let panelReturnTarget = null;
let toastTimer;
let renderer, scene, camera, wordGroup;
const worldStars = new Map();
const starNodes = new Map();
let wordStarSystem;
let constellationPaths, observatoryUI, recordNavigation;
let starPathsEnabled = false, starLabelMode = 'hover';
let gasAppearance = { density:.85, light:1 };
let detailSequence = [], atlasSequence = [], detailFromAtlas = false;
let hoveredStarId = null;
let explorationField = null;
const displayStarPosition = entry => explorationField ? explorationField.position(entry) : wordStarPosition(entry);
function leaveOrionField() { nebulaSystem?.selectExperience('orion'); if (!explorationField) return; explorationField = null; transmissionCache.clear(); rebuildWordStars(); }
let starTransmission;
let transmissionFrame = 0;
let lastWheelDirection = 0;
const transmissionCache = new Map();
let lastOverlayUpdate = -Infinity;
let lastCameraMs = 0;
let lastSceneReport = 0;
const pointer = { x: 0, y: 0 };
const pan = { x: 0, y: 0 };
let zoom = 160;
let catalogDepth = 0;
let nebulaSystem, nebulaUI, travelingNebula = null;
let renderQuality;
let skyEvents, skyEventsUI, nebulaNavigation, soundscape;
let lastSoundUpdate = 0;
let livingSky;
let catalogReady = false;
let pendingGuestWrites = 0;
let sceneWakeAt = 0;
let experienceUI;
let recallUI;
let collectionAtlas;
let graphicsFallback;
let experienceKey = '';
const experience = createExperienceMode({ guestCount: universe.words.length, onChange: applyExperience });
function syncRenderLoop() {
  lastCameraMs = 0;
  renderQuality?.resetTiming();
  nebulaSystem?.resetTiming();
  renderer?.setAnimationLoop(catalogReady && graphicsFallback?.available && experience.snapshot().ready && !pendingGuestWrites && (!activePanel || activePanel === 'detail') ? animate : null);
}
window.addEventListener('load', syncRenderLoop, { once: true });
function applyExperience(state) {
  const app = $('#app');
  app.dataset.experience = state.mode || 'initializing';
  app.dataset.contentReady = String(state.ready);
  $('#universe').dataset.experience = state.mode || 'initializing';
  experienceUI?.update(state);
  graphicsFallback?.refresh();
  recallUI?.refresh();
  observatoryUI?.refresh();
  syncRenderLoop();
  const key = `${state.mode}:${state.ownerId}:${state.ready}`;
  if (key === experienceKey) return;
  experienceKey = key;
  detailSequence = []; atlasSequence = []; recordNavigation?.update([], null);
  stellarPreview.hide();
  wordCard.invalidate();
  livingSky?.reset();
  skyEvents?.select(null); skyEventsUI?.update({ kind: null });
  soundscape?.event(null); soundscape?.update({});
  leaveOrionField();
  travelingNebula = null; catalogDepth = 0; zoom = 160; pan.x = pan.y = 0;
  collectionAtlas?.reset();
  recallUI?.invalidate();
  // Clear the previous identity immediately; allow rapid UI transitions to settle
  // before compiling a scene that may already have been replaced.
  renderer?.clear();
  app.dataset.sceneState = 'loading';
  sceneWakeAt = performance.now() + 150;
  focusedStarId = selectedId = null;
  closePanels();
  
  rebuildWordStars();
}

let preImmersiveZoom = null;
let focusedStarId = null;
let preFocusPan = null;
const MIN_ZOOM = 19;
const MAX_ZOOM = 160;
let dragging = false;
let moved = false;
let dragStart = null;
const touches = new Map();
let pinchStart = null;
let clock = 0;
let fpsFrames = 0;
let fpsLast = 0;
let drawCalls = 0;
const MEANING_LANGUAGES = new Set(['tr', 'en', 'es']);
const languageDisplay = value => value === 'İngilizce' || value === 'English' ? t('names.language.en') : value === 'İspanyolca' || value === 'Spanish' ? t('names.language.es') : value === 'Türkçe' || value === 'Turkish' ? t('names.language.tr') : value || t('message.languageFallback');
const galaxyDisplay = galaxy => galaxy?.id === 'galaxy-english' && galaxy.name === 'İngilizce Galaksisi' ? t('names.defaultGalaxy.english') : galaxy?.id === 'galaxy-spanish' && galaxy.name === 'İspanyolca Galaksisi' ? t('names.defaultGalaxy.spanish') : galaxy?.name || t('message.galaxyFallback');
const meaningLanguageLabel = galaxy => t('panel.meaningOf', { language: t(`names.language.${MEANING_LANGUAGES.has(galaxy?.meaningLanguage) ? galaxy.meaningLanguage : 'tr'}`).toLocaleUpperCase(uiLocale) });
const typeLabel = (galaxy, kind = 'word') => t(kind === 'conjunction' ? 'panel.conjunctionType' : 'panel.wordType', { language: languageDisplay(galaxy?.language).toLocaleUpperCase(uiLocale) });
const starStageLabel = appearance => t(`names.stage.${appearance.stageId}`);
const births = [];
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;
let motionMode = 'system';
let lastAgeLabelUpdate = 0;
function applyMotionMode(mode) { motionMode = mode; reducedMotion = mode === 'reduced' || (mode === 'system' && motionPreference.matches); skyEvents?.setReducedMotion(reducedMotion); pointer.x = pointer.y = 0; }
motionPreference.addEventListener('change', () => applyMotionMode(motionMode));

function persist(onDurable) {
  if (accountSync?.persist(universe, onDurable)) return true;
  try {
    const serialized = JSON.stringify(universe);
    const { localSaved, writePrimary } = persistLocalUniverse(universe, localStorage);
    pendingGuestWrites++;
    syncRenderLoop();
    const identity = experience.snapshot();
    const galaxyId = universe.activeGalaxyId;
    const saved = universe;
    const notifyDurable = () => {
      const current = experience.snapshot();
      if (saved === universe && current.mode === identity.mode && current.ownerId === identity.ownerId && universe.activeGalaxyId === galaxyId) onDurable?.();
    };
    primaryWrites = primaryWrites.catch(() => {}).then(writePrimary).then(() => { if (!localSaved) notifyDurable(); }).catch(() => {
      if (!mirrorWarningShown) { mirrorWarningShown = true; showToast(t('message.mirrorError')); }
    }).finally(() => { pendingGuestWrites--; syncRenderLoop(); });
    mirrorWrites = mirrorWrites.catch(() => {}).then(() => writeUniverseMirror(JSON.parse(serialized))).catch(() => {
      if (!mirrorWarningShown) { mirrorWarningShown = true; showToast(t('message.mirrorError')); }
    });
    if (localSaved) queueMicrotask(notifyDurable);
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
  recallUI?.refresh();
  observatoryUI?.refresh();
  $('#next-number').textContent = String(words.length + 1).padStart(3, '0');
}

function planetType(word) {
  if (PLANET_TYPES.includes(word.planetType)) return word.planetType;
  let hash = 0; for (const char of word.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PLANET_TYPES[hash % PLANET_TYPES.length];
}
function initScene() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('#universe'), antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch {
    graphicsFallback.setAvailable(false);
    if (!matchMedia('(min-width:761px)').matches) showToast(t('message.webglError'));
    return;
  }
  $('#universe').addEventListener('webglcontextlost', () => {
    if ($('#app').classList.contains('immersive')) $('#universe-mode').click();
    graphicsFallback.setAvailable(false);
    stellarPreview.hide();
    syncRenderLoop();
  });
  $('#universe').addEventListener('webglcontextrestored', () => {
    graphicsFallback.setAvailable(true);
    lastCameraMs = 0;
    syncRenderLoop();
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderQuality = createRenderQuality({ maximum: Math.min(devicePixelRatio, 1.7), onChange: ratio => {
    renderer.setPixelRatio(ratio);
    $('#universe').dataset.renderDpr = String(ratio);
  } });
  mountSceneControls({ locale: uiLocale, onMotion: applyMotionMode, onQuality: mode => { renderQuality.setMode(mode); nebulaSystem?.setQuality(mode); $('#universe').dataset.qualityMode = mode; }, onStars: preferences => { starPathsEnabled = preferences.paths === 'on'; starLabelMode = preferences.labels; $('#app').dataset.starLabels = starLabelMode; }, onNebula: preferences => {gasAppearance=preferences;nebulaSystem?.setAppearance(preferences);transmissionCache.clear();} });
  soundscape = mountSoundscape({ locale: uiLocale, container: document.querySelector('.scene-controls-content') });
  livingSky = createLivingSky();
  skyEvents = createSkyEvents({ reducedMotion });
  skyEvents.warm(renderer).catch(() => { /* Optional sky illustrations may be unavailable. */ });
  skyEventsUI = mountSkyEventsUI({ locale: uiLocale, reducedMotion,
    container: document.querySelector('.scene-controls-content'),
    onLiveChange(enabled) { const automatic = !!livingSky.active; livingSky.setEnabled(enabled); if (!enabled && automatic) { skyEvents.select(null); soundscape.event(null); } skyEventsUI.update({...skyEvents.snapshot(),living:enabled}); },
    onSelect(kind) { livingSky.manual(kind); skyEvents.select(kind,skyPlacementOptions()); skyEventsUI.update(skyEvents.snapshot()); playSkySound(kind); soundscape.update({ depth: travelingNebula ? Math.min(1, Math.max(0,(MAX_ZOOM-camera.position.z)/(MAX_ZOOM-nebulaBackPlane(nebulaSystem.records[0])-MIN_ZOOM))) : 0, focused: !!focusedStarId, event: kind }); },
  });
  nebulaNavigation = mountNebulaNavigation({ locale: uiLocale,
    async onPreview(name) {
      if (!nebulaSystem?.ready || !(await nebulaSystem.selectExperience(name))) return false;
      transmissionCache.clear();
      nebulaUI.focused(name === 'orion' ? null : { name: t('sky.nebulaNames.' + name), nameTr: t('sky.nebulaNames.' + name), credit: t('sky.artistic') });
      return true;
    },
    async onEnter(name = 'orion') {
      if (!nebulaSystem?.ready || !(await nebulaSystem.selectExperience(name))) return false;
      closePanels();
      if (!$('#app').classList.contains('immersive')) $('#universe-mode').click();
      travelToNebula(nebulaSystem.records[0]);
      transmissionCache.clear();
      if (name !== 'orion') {
        const record = nebulaSystem.records[0];
        zoom = record.frontZ + record.radius * .7 - catalogDepth;
        nebulaUI.focused({ ...record, name: t('sky.nebulaNames.' + name), nameTr: t('sky.nebulaNames.' + name), credit: t('sky.artistic') });
      }
      $('#universe').focus({ preventScroll: true });
      return true;
    },
    onDepth(fraction) { if(travelingNebula) { focusedStarId = selectedId = null; catalogDepth = nebulaBackPlane(nebulaSystem.records[0]); setZoom(MAX_ZOOM-catalogDepth-fraction*(MAX_ZOOM-catalogDepth-MIN_ZOOM)); } },
    onReturn() { $('#home-btn').click(); },
  });
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 100000);
  camera.position.z = zoom;
  nebulaSystem = createNebulaSystem(scene, camera, { compact: innerWidth < 760, fieldStars: false });
  nebulaSystem.setQuality(renderQuality.mode);
  nebulaSystem.setAppearance(gasAppearance);
  nebulaUI = mountNebulaUI({ locale: uiLocale, records: nebulaSystem.records, beforeOpen: closePanels,
    onFocus(record) { nebulaSystem.selectExperience('orion'); travelToNebula(record); zoom = Math.min(zoom, 160 - catalogDepth); },
    onOverview() { closePanels(); focusedStarId = selectedId = null; travelingNebula = null; leaveOrionField(); nebulaUI.focused(null); nebulaSystem.reframe(camera.aspect); catalogDepth = 0; zoom = 160; pan.x = pan.y = pointer.x = pointer.y = 0; },
  });
  $('#universe').dataset.sceneMode = 'orion-and-stars';
  $('#universe').dataset.backgroundStars = '0';
  $('#universe').dataset.wheelSpeed = '0.3';
  starTransmission = createStarTransmission(nebulaSystem.starMedium);
  $('#universe').dataset.maxCameraZ = String(MAX_ZOOM);
  for (const key of ['galaxies', 'nebulae', 'asteroids', 'fireballs']) $('#universe').dataset[key] = '0';
  $('#universe').dataset.nebulae = String(nebulaSystem.records.length);
  $('#universe').dataset.celestialStage = '0';
  catalogReady = true;
  syncRenderLoop();
  $('#universe').dataset.starCapacity = '0';
  wordGroup = new THREE.Group(); scene.add(wordGroup);
  wordStarSystem = createWordStarSystem(wordGroup);
  constellationPaths = createConstellationPaths(wordGroup);
  rebuildWordStars();
  // Start the GPU loop after catalog initialization to avoid starving cold module loads.
}
function soundPosition(id) {
  const position = worldStars.get(id)?.position;
  return position && camera ? [Math.max(-8,Math.min(8,(position.x-camera.position.x)/100)),Math.max(-8,Math.min(8,(position.y-camera.position.y)/100)),Math.max(-16,Math.min(-.2,(position.z-camera.position.z)/100))] : undefined;
}
function playSkySound(kind) { const center = skyEvents.snapshot().placement.center; soundscape.event(kind,[center[0]*8,center[1]*4,-6]); }
function skyPlacementOptions() { return { wide: $('#app').classList.contains('immersive'), distance: travelingNebula ? Math.max(600,nebulaSystem.records[0].radius*2) : 18000 }; }
function spawnBirth(id) {
  if (worldStars.has(id) && !reducedMotion) births.push({ id, start: clock });
}
function rebuildWordStars() {
  if (!wordGroup || !wordStarSystem) return;
  births.length = 0;
  hoveredStarId = null;
  for (const group of worldStars.values()) wordGroup.remove(group);
  worldStars.clear();
  $('#star-layer').replaceChildren(); starNodes.clear();
  lastOverlayUpdate = -Infinity;
  const policy = experience.snapshot();
  const visibleWords = policy.ready && policy.mode !== 'showcase-demo' ? words.filter(word => entryKind(word) === 'word') : [];
  wordStarSystem.setEntries(visibleWords, { positionOf: displayStarPosition });
  constellationPaths?.setRecords(visibleWords, displayStarPosition);
  visibleWords.forEach(word => {
    const group = new THREE.Group(); group.position.copy(displayStarPosition(word));
    group.userData = { word, binarySlot: -1 };
    wordGroup.add(group); worldStars.set(word.id, group);
    const button = document.createElement('button'); button.className = 'star-hit'; button.type = 'button';
    button.dataset.wordId = word.id;
    button.setAttribute('aria-label', t('message.openStar', { word: word.word }));
    button.addEventListener('click', () => selectWord(word.id));
    button.addEventListener('pointerenter', () => { hoveredStarId = word.id; });
    button.addEventListener('pointerleave', () => { if (hoveredStarId === word.id) hoveredStarId = null; });
    button.addEventListener('focus', () => { hoveredStarId = word.id; });
    button.addEventListener('blur', () => { hoveredStarId = null; });
    const label = document.createElement('div'); label.className = 'star-label';
    const name = document.createElement('b'); name.textContent = word.word;
    label.append(name); $('#star-layer').append(button, label);
    starNodes.set(word.id, { button, label });
  });
  $('#universe').dataset.personalRenderer = 'premium-surface';
  $('#universe').dataset.wordStarSystem = 'shared-photosphere-v1';
  $('#universe').dataset.orionWordField = String(!!explorationField);
  $('#universe').dataset.orionWordCount = String(explorationField ? visibleWords.length : 0);
  transmissionCache.clear();
}
const projected = new THREE.Vector3();
function animate(ms) {
  if (document.hidden) { lastCameraMs = 0; nebulaSystem?.resetTiming(); return; }
  if (document.querySelector('dialog[open]')) { lastCameraMs = 0; nebulaSystem?.resetTiming(); sceneWakeAt = performance.now() + 150; return; }
  if (performance.now() < sceneWakeAt) return;
  if (!renderer) return;
  if (nebulaSystem.failed) { graphicsFallback.setAvailable(false); syncRenderLoop(); return; }
  // Compile every scene material (including close stellar LODs) before the first
  // visible draw. The static opening remains visible while the GPU warms up.
  if (!nebulaSystem.ready) {
    nebulaSystem.render(renderer);
    return;
  }
  const fpsMonitor = $('#fps-monitor');
  if (!fpsMonitor.hidden) {
    fpsFrames++;
    if (ms - fpsLast >= 1000) { fpsMonitor.textContent = `FPS ${Math.round(fpsFrames * 1000 / (ms - fpsLast))} · ${t('message.drawCalls', { count: drawCalls })}`; fpsFrames = 0; fpsLast = ms; }
  }
  clock = ms * .001;
  const drift = reducedMotion ? 0 : clock;
  if (ms - lastAgeLabelUpdate > 10000 && activePanel === 'detail') {
    lastAgeLabelUpdate = ms;
    const record = words.find(word => word.id === selectedId);
    if (record && entryKind(record) === 'word') {
      const appearance = stellarSpectrum(record, Date.now(), !reducedMotion);
      $('#star-age-label').textContent = t('message.starAge', { stage: starStageLabel(appearance), age: formatUnit(uiLocale, 'day', appearance.ageDays) });
      $('#detail-sun').style.setProperty('--star-core', appearance.color);
      $('#detail-sun').style.setProperty('--star-glow', appearance.glow);
    }
  }
  const focusedStar = focusedStarId ? worldStars.get(focusedStarId) : null;
  const targetX = focusedStar ? focusedStar.position.x : pan.x + (dragging || reducedMotion ? 0 : pointer.x * 1.9);
  const targetY = focusedStar ? focusedStar.position.y : pan.y + (dragging || reducedMotion ? 0 : pointer.y * 1.25);
  const cameraDelta = lastCameraMs ? Math.min(1000, ms-lastCameraMs) : 16.67;
  lastCameraMs = ms;
  renderQuality.sample(cameraDelta);
  const planeDamping = cameraDamping(cameraDelta);
  const zoomDamping = planeDamping;
  camera.position.x += (targetX-camera.position.x)*planeDamping;
  camera.position.y += (targetY-camera.position.y)*planeDamping;
  camera.position.z += (zoom+catalogDepth-camera.position.z)*zoomDamping;
  camera.lookAt(camera.position.x, camera.position.y, camera.position.z - 100);
  camera.updateMatrixWorld();
  const nebulaStatus = nebulaSystem.update(drift,renderer.getPixelRatio(),innerHeight);
  $('#universe').dataset.nebulaReady = String(nebulaSystem.ready);
  $('#universe').dataset.nebulaTextureResolution = String(nebulaSystem.textureResolution);
  if (travelingNebula && Math.abs(camera.position.z - nebulaSystem.records[0].position[2]) < nebulaSystem.records[0].radius * 4) nebulaSystem.requestHighResolution(renderer);
  $('#universe').dataset.nebulaStarSize = String(nebulaStatus.starSize);
  $('#universe').dataset.nebulaWidth = String(nebulaSystem.records[0].overview.extentX);
  $('#universe').dataset.nebulaFieldSources = String(nebulaSystem.fieldSourceCount);
  $('#universe').dataset.nebulaBrightStars = String(nebulaSystem.brightStarCount);
  $('#universe').dataset.nebulaTravelLength = String(nebulaSystem.records[0].travelLength);
  $('#universe').dataset.nebulaFrontZ = String(nebulaSystem.records[0].frontZ);
  $('#universe').dataset.nebulaBackZ = String(nebulaSystem.records[0].frontZ - nebulaSystem.records[0].travelLength);
  $('#universe').dataset.nebulaLoaded = String(nebulaSystem.loaded);
  $('#universe').dataset.visibleNebulae = String(nebulaStatus.visible);
  $('#universe').dataset.insideNebula = nebulaStatus.inside ?? '';
  $('#universe').dataset.cameraX = String(camera.position.x);
  $('#universe').dataset.cameraY = String(camera.position.y);
  const visibleGalaxies = 0;
  const policy = experience.snapshot();
  wordGroup.visible = policy.ready && policy.mode !== 'showcase-demo' && camera.position.z < 90000;
  wordGroup.rotation.z = 0;
  if (ms - lastSceneReport > 100) { lastSceneReport = ms; $('#universe').dataset.cameraZ = String(camera.position.z); $('#universe').dataset.visibleGalaxies = String(visibleGalaxies); }
  for (let i = births.length - 1; i >= 0; i--) if (clock - births[i].start > 1.4) births.splice(i, 1);
  const birth = births.at(-1);
  if(ms-transmissionFrame>150) { transmissionCache.clear();transmissionFrame=ms; }
  wordStarSystem.update(drift, camera, innerHeight, renderer.getPixelRatio(), {
    reducedMotion,
    selectedId, hoveredId: hoveredStarId, birthId: birth?.id,
    transmission(position,id) { if(!transmissionCache.has(id)) transmissionCache.set(id,starTransmission(position,camera));return transmissionCache.get(id); },
    birthStrength: birth ? Math.sin(Math.PI * Math.min(1, (clock - birth.start) / 1.4)) : 0,
    birthProgress: birth ? Math.min(1, (clock-birth.start)/1.4) : 0,
  });
  const updateOverlays = words.length <= 80 || ms - lastOverlayUpdate >= 33;
  if (updateOverlays) lastOverlayUpdate = ms;
  const labelCandidates = [];
  const immersive = $('#app').classList.contains('immersive');
  for (const [id, group] of worldStars) {
    if (!updateOverlays) continue;
    group.getWorldPosition(projected); projected.project(camera);
    const x = (projected.x * .5 + .5) * innerWidth;
    const y = (-projected.y * .5 + .5) * innerHeight;
    const visible = projected.z > -1 && projected.z < 1 && x > -80 && x < innerWidth + 80 && y > -50 && y < innerHeight + 50;
    const nodes = starNodes.get(id);
    if (!nodes) continue;
    nodes.button.style.display = nodes.label.style.display = visible ? '' : 'none';
    const diameter = wordStarSystem.state(id)?.diameter || 0;
    const hitSize = Math.min(72, Math.max(22, diameter));
    nodes.button.style.width = nodes.button.style.height = `${hitSize}px`;
    nodes.button.dataset.diameter = diameter.toFixed(2);
    if (visible) { nodes.button.style.left = nodes.label.style.left = `${x}px`; nodes.button.style.top = nodes.label.style.top = `${y}px`; }
    if (visible && y > 110 && y < innerHeight - 140 && (immersive || x > Math.min(660,innerWidth*.52))) labelCandidates.push({ id, x, y, depth: projected.z, word: group.userData.word.word, priority: id === hoveredStarId || id === selectedId });
  }
  if (updateOverlays && starLabelMode === 'all') { const visible = visibleLabelIds(labelCandidates,{width:innerWidth,height:innerHeight}); for(const [id,nodes] of starNodes) nodes.label.dataset.labelVisible = String(visible.has(id)); }
  const paths = constellationPaths.update({ enabled: starPathsEnabled && wordGroup.visible, focused: !!focusedStarId });
  $('#universe').dataset.starPaths = String(paths.visible);
  $('#universe').dataset.starPathCount = String(paths.edges);
  $('#universe').dataset.starLabels = starLabelMode;
  $('#universe').dataset.personalDetails = String(wordStarSystem.detailCount);
  $('#universe').dataset.personalPoints = String(wordStarSystem.pointCount);
  $('#universe').dataset.focusedWord = focusedStarId || '';
  $('#universe').dataset.selectedWord = selectedId || '';
  $('#universe').dataset.cameraTargetZ = String(zoom+catalogDepth);
  const target = focusedStarId ? worldStars.get(focusedStarId) : null;
  $('#universe').dataset.starApproach = target ? starApproach(camera.position.z-target.position.z,MAX_ZOOM-target.position.z).toFixed(3) : '0';
  renderer.render(scene, camera);
  const directed = livingSky.tick(cameraDelta*.001,skyEvents.snapshot().kind,!!activePanel || !!focusedStarId || reducedMotion);
  if (directed) { skyEvents.select(directed.kind,skyPlacementOptions()); playSkySound(directed.kind); }
  const skyState = skyEvents.update(cameraDelta*.001, camera.aspect, camera, livingSky.envelope);
  // Sky accents retain their own dark cores; personal stars are drawn last.
  nebulaSystem.render(renderer, background => skyEvents.render(renderer,background));
  skyEventsUI.update({...skyState,living:livingSky.enabled});
  $('#universe').dataset.livingSky = String(livingSky.enabled);
  $('#universe').dataset.skyOrigin = livingSky.active ? 'automatic' : 'manual';
  $('#universe').dataset.skyEvent = skyState.kind || '';
  $('#universe').dataset.skyEventTime = String(skyState.elapsed);
  $('#universe').dataset.skyPosition = skyState.placement.center.map(value=>value.toFixed(3)).join(',');
  $('#universe').dataset.motion = reducedMotion ? 'reduced' : 'full';
  if (ms-lastSoundUpdate>180) {
    lastSoundUpdate=ms;
    soundscape.update({ depth: travelingNebula ? Math.min(1,Math.max(0,(MAX_ZOOM-camera.position.z)/(MAX_ZOOM-nebulaBackPlane(nebulaSystem.records[0])-MIN_ZOOM))) : 0, focused: !!focusedStarId, event: skyState.kind });
  }
  $('#universe').dataset.nebulaFlight = String(!!travelingNebula);
  $('#universe').dataset.nebulaExperience = nebulaSystem.experience;
  nebulaNavigation.update(!!travelingNebula, (MAX_ZOOM-camera.position.z)/(MAX_ZOOM-nebulaBackPlane(nebulaSystem.records[0])-MIN_ZOOM), nebulaSystem.experience);
  if (nebulaSystem.loaded) $('#app').dataset.sceneState = 'ready';
  $('#universe').dataset.nebulaRefined = String(nebulaSystem.refined);
  $('#universe').dataset.nebulaGasResolution = nebulaSystem.gasResolution.join('x');
  drawCalls = renderer.info.render.calls;
}

function openPanel(which) {
  if (which !== 'detail') { stellarPreview.hide(); wordCard.invalidate(); }
  if (!activePanel && which) panelReturnTarget = document.activeElement;
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  activePanel = which;
  syncRenderLoop();
  $('#panel-backdrop').classList.toggle('open', !!which);
  for (const key of ['detail', 'add', 'collection', 'galaxy']) {
    const panel = $(`#${key}-panel`);
    panel.classList.toggle('open', key === which);
    panel.setAttribute('aria-hidden', String(key !== which));
    panel.inert = key !== which;
  }
  $('#explore-btn').classList.toggle('active', !which || which === 'detail' || which === 'add');
  $('#collection-btn').classList.toggle('active', which === 'collection');
  const focusPanel = selector => setTimeout(() => { if (activePanel === which && !$(`#${which}-panel`).contains(document.activeElement)) $(selector)?.focus({ preventScroll: true }); }, 380);
  if (which === 'add') focusPanel('#word-input');
  if (which === 'collection') { renderCollection(); focusPanel('#search-input'); }
  if (which === 'galaxy') { renderGalaxies(); focusPanel('#close-galaxy'); }
  if (which === 'detail') focusPanel('#close-detail');
  if (!which) {
    const target = panelReturnTarget;
    panelReturnTarget = null;
    if (target instanceof HTMLElement && target.isConnected && target.getClientRects().length && !target.closest('[inert]')) target.focus({ preventScroll: true });
  }
  document.documentElement.scrollLeft = document.body.scrollLeft = $('#app').scrollLeft = 0;
}
function closePanels() { openPanel(null); editingId = null; $('#word-form').reset(); $('#form-error').textContent = ''; }
function selectWord(id, keepNavigation = false) {
  wordCard.invalidate();
  const word = words.find(w => w.id === id); if (!word || !experience.snapshot().ready) return;
  if (!keepNavigation) { detailFromAtlas = activePanel === 'collection'; detailSequence = (detailFromAtlas ? atlasSequence : recentRecords(words).map(w=>w.id)); }
  detailSequence = detailSequence.filter(key=>words.some(w=>w.id===key));
  recordNavigation?.update(detailSequence.map(key=>words.find(w=>w.id===key)),id);
  $('#detail-atlas-back').hidden = !detailFromAtlas;
  const isPlanet = entryKind(word) === 'conjunction';
  wordCard.setEnabled(!isPlanet);
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
  const appearance = stellarSpectrum(word, Date.now(), !reducedMotion);
  $('#star-age-label').title = t('message.visualAgeHint');
  $('#star-age-label').textContent = isPlanet ? t('message.planetAge', { planet: t(`names.planet.${planetType(word)}`), age: formatUnit(uiLocale, 'day', appearance.ageDays) }) : t('message.starAge', { stage: starStageLabel(appearance), age: formatUnit(uiLocale, 'day', appearance.ageDays) });
  $('#binary-label').hidden = worldStars.get(word.id)?.userData.binarySlot < 0;
  $('#detail-example').textContent = word.example || '';
  $('#example-wrap').hidden = !word.example;
  $('#detail-date').textContent = t('message.joined', { date: fmtDate(word.createdAt) });
  $('#detail-sun').style.setProperty('--star-glow', appearance.glow);
  $('#detail-sun').style.setProperty('--star-core', appearance.color);
  for (const [starId, nodes] of starNodes) nodes.label.classList.toggle('selected', starId === id);
  openPanel('detail');
  if (isPlanet) stellarPreview.hide(); else stellarPreview.show(word);
}
function focusStar() {
  if (!explorationField) { travelingNebula = null; leaveOrionField(); nebulaUI?.focused(null); }
  catalogDepth = 0;
  if (!worldStars.has(selectedId)) return;
  preFocusPan = { ...pan };
  closePanels();
  if (!$('#app').classList.contains('immersive')) $('#universe-mode').click();
  focusedStarId = selectedId;
  const position = worldStars.get(selectedId).position;
  catalogDepth = position.z - 200;
  zoom = position.z + WORD_STAR_RADIUS * 7 - catalogDepth;
}
function createPosition(index, variation = .5, kind = 'word') {
  if (kind === 'word' && camera) {
    const positions = explorationField ? words.map(word => ({...word, ...Object.fromEntries(['x','y','z'].map((axis,i) => [axis,displayStarPosition(word).toArray()[i]]))})) : words;
    const placed = placeWordStar(camera, positions, { width:innerWidth, height:innerHeight, backZ:nebulaSystem.records[0].position[2]-nebulaSystem.records[0].radius*3.6 });
    if (!explorationField) return placed;
    const stored = explorationField.stored(new THREE.Vector3(placed.x,placed.y,placed.z));
    return { x:stored.x,y:stored.y,z:stored.z };
  }
  // Existing coordinates are never re-laid out. New objects get a spacious
  // persisted position with an explicit minimum distance from current entries.
  for (let attempt = 0; attempt < 128; attempt++) {
    const slot = index + attempt, angle = slot * 2.399963 + variation * .5;
    const radius = 12 + Math.sqrt(slot + 1) * (kind === 'word' ? 10 : 12);
    const candidate = { x: 31 + Math.cos(angle) * radius, y: Math.sin(angle) * radius * .72, z: 18 + (slot % 5) * 2 };
    if (words.every(word => wordStarPosition(word).distanceTo(new THREE.Vector3(candidate.x,candidate.y,candidate.z)) >= 10)) return candidate;
  }
  return { x: 31 + (index + 129) * 10, y: 0, z: 18 };
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
    const identity = experience.snapshot(), stamp = item?.updatedAt;
    persist(() => {
      const current = experience.snapshot(), updated = words.find(w => w.id === editedId);
      if (current.mode === identity.mode && current.ownerId === identity.ownerId && updated && updated.updatedAt === stamp && entryKind(updated) === 'word') soundscape?.action('edit',soundPosition(editedId));
    }); rebuildWordStars(); refreshCounts(); closePanels(); selectWord(editedId); showToast(t('message.wordUpdated'));
    return;
  }
  const position = createPosition(kind === 'word' ? words.filter(w => entryKind(w) === 'word').length : words.length, Math.random(), kind);
  const item = { id: crypto.randomUUID(), galaxyId: universe.activeGalaxyId, word, meaning, example, kind, createdAt: new Date().toISOString(), ...position };
  if (kind === 'conjunction') item.planetType = nextPlanetType(universe.words, item.galaxyId);
  universe.words.push(item); words.push(item); appendEvent(universe, 'word.created', item.galaxyId, item.id, null, item);
  const identity = experience.snapshot();
  persist(() => {
    const current = experience.snapshot();
    if (current.mode !== identity.mode || current.ownerId !== identity.ownerId || !words.some(w => w.id === item.id)) return;
    spawnBirth(item.id);
    if (kind === 'word') {
      soundscape?.birth(soundPosition(item.id));
    }
  });
  rebuildWordStars(); refreshCounts(); closePanels(); selectWord(item.id);
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
  const cuePosition = soundPosition(word.id), galaxyId = universe.activeGalaxyId;
  appendEvent(universe, 'word.deleted', word.galaxyId, word.id, word, null);
  universe.words = universe.words.filter(w => w.id !== selectedId);
  words = words.filter(w => w.id !== selectedId);
  const identity = experience.snapshot();
  persist(() => {
    const current = experience.snapshot();
    if (current.mode === identity.mode && current.ownerId === identity.ownerId && universe.activeGalaxyId === galaxyId && !words.some(w => w.id === word.id) && entryKind(word) === 'word') soundscape?.action('remove',cuePosition);
  }); rebuildWordStars(); refreshCounts(); closePanels();
  showToast(t('message.wordRemoved'));
}
function renderCollection() {
  const query = $('#search-input').value.trim().toLocaleLowerCase(uiLocale);
  const desktop = matchMedia('(min-width:761px)').matches;
  const result = desktop && collectionAtlas ? queryAtlas(words, collectionAtlas.state()) : [...words].reverse().filter(w => `${w.word} ${w.meaning}`.toLocaleLowerCase(uiLocale).includes(query));
  atlasSequence = result.map(word=>word.id);
  collectionAtlas?.update(words);
  $('#result-count').textContent = formatUnit(uiLocale, 'entry', result.length, { uppercase: true });
  const list = $('#collection-list'); list.replaceChildren();
  if (!result.length) { const empty = document.createElement('div'); empty.className = 'collection-empty'; empty.textContent = t(words.length ? 'message.emptySearch' : 'message.emptyCollection'); if (desktop) collectionAtlas?.appendEmptyAction(empty); list.append(empty); return; }
  for (const word of result) {
    const row = document.createElement('button'); row.className = 'collection-item'; row.type = 'button';
    row.dataset.recordId = word.id;
    const star = document.createElement('span'); star.className = `collection-star${entryKind(word) === 'conjunction' ? ' planet' : ''}`; star.style.setProperty('--star-glow', starAge(word.createdAt).glow);
    const copy = document.createElement('span'); copy.className = 'collection-copy';
    const title = document.createElement('strong'); title.textContent = word.word;
    const sub = document.createElement('small'); sub.textContent = entryKind(word) === 'conjunction' ? t('message.planetCollection', { planet: t(`names.planet.${planetType(word)}`) }) : starStageLabel(starAge(word.createdAt));
    const arrow = document.createElement('span'); arrow.className = 'collection-arrow'; arrow.append(icon('arrow'));
    copy.append(title, sub); row.append(star, copy, arrow);
    if (desktop) {
      const date = document.createElement('time'); date.className = 'atlas-date';
      const timestamp = Date.parse(word.createdAt);
      if (Number.isFinite(timestamp)) { date.dateTime = new Date(timestamp).toISOString(); date.textContent = formatDate(uiLocale, timestamp, { day: 'numeric', month: 'short', year: 'numeric' }); }
      else date.textContent = t('atlas.noDate');
      row.insertBefore(date, arrow);
    }
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
  recallUI?.invalidate();
  collectionAtlas?.reset();
  travelingNebula = null; leaveOrionField(); nebulaUI?.focused(null); nebulaSystem?.reframe(camera.aspect);
  catalogDepth = 0;
  pan.x = pan.y = pointer.x = pointer.y = 0;
  zoom = 160;
  $('#app').classList.remove('catalog-exploring');
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
  zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM - catalogDepth, value));
  if (focusX === undefined || focusY === undefined) return;
  const halfHeightChange = (previous - zoom) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  pan.x += (focusX / innerWidth - .5) * 2 * halfHeightChange * camera.aspect;
  pan.y += (.5 - focusY / innerHeight) * 2 * halfHeightChange;
}
function travelToNebula(record, keepPosition = false) {
  if (livingSky?.active) { livingSky.reset(); skyEvents.select(null); soundscape.event(null); skyEventsUI.update({kind:null}); }
  selectedId = null;
  const absoluteZ = zoom + catalogDepth;
  focusedStarId = null; preFocusPan = null;
  travelingNebula = record.id;
  if (!explorationField) { explorationField = createOrionStarField(words.filter(word => entryKind(word) === 'word'), record); rebuildWordStars(); }
  catalogDepth = nebulaBackPlane(record);
  zoom = absoluteZ - catalogDepth;
  if (!keepPosition) { pan.x = record.position[0]; pan.y = record.position[1]; pointer.x = pointer.y = 0; }
  nebulaUI.focused(record);
}
function zoomWordTarget(factor) {
  const chosen=worldStars.get(selectedId);if(!chosen)return false;
  const absolute=zoom+catalogDepth;
  if(!focusedStarId)preFocusPan={...pan};
  if (!explorationField) { travelingNebula=null;nebulaUI?.focused(null); } focusedStarId=selectedId;
  catalogDepth=chosen.position.z-200;
  // Keep the surface boundary safe after subtracting and re-adding catalogDepth.
  const near=WORD_STAR_RADIUS*1.35 + Number.EPSILON*Math.max(1,Math.abs(catalogDepth),Math.abs(chosen.position.z))*4,far=Math.max(near,MAX_ZOOM-chosen.position.z);
  const distance=Math.max(near,Math.min(far,(absolute-chosen.position.z)*factor));
  setZoom(chosen.position.z+distance-catalogDepth);return true;
}
function zoomOnGalaxy(value) {
  if(zoomWordTarget(value/zoom))return;
  if (travelingNebula) { setZoom(zoom+nebulaCruiseStep(value<zoom?-120:120,MAX_ZOOM-catalogDepth-MIN_ZOOM)); return; }
  if (catalogDepth !== 0 || zoom > 650) { setZoom(value); return; }
  if (!words.length || !camera) { setZoom(value); return; }
  projected.set(31, 0, 0).project(camera);
  const x = (projected.x * .5 + .5) * innerWidth;
  const y = (-projected.y * .5 + .5) * innerHeight;
  if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) setZoom(value);
  else setZoom(value, x, y);
}

function bindUI() {
  $('#universe-mode').addEventListener('click', () => {
    if (!graphicsFallback.available) return;
    const button = $('#universe-mode');
    const immersive = !$('#app').classList.contains('immersive');
    if (immersive) { closePanels(); preImmersiveZoom = zoom + catalogDepth; if (!nebulaSystem && words.length > 0 && words.length < 25) zoom = Math.min(zoom, words.length < 10 ? 72 : 105); }
    else if (preImmersiveZoom !== null) { zoom = preImmersiveZoom; catalogDepth = 0; travelingNebula = null; leaveOrionField(); nebulaUI?.focused(null); preImmersiveZoom = null; }
    $('#app').classList.toggle('immersive', immersive);
    pan.x += immersive ? 31 : -31;
    if (!immersive && focusedStarId) { focusedStarId = null; if (preFocusPan) { pan.x = preFocusPan.x; pan.y = preFocusPan.y; preFocusPan = null; } }
    button.setAttribute('aria-pressed', String(immersive));
    button.setAttribute('aria-label', t(immersive ? 'home.showInterface' : 'home.universeOnly'));
  });
  for (const sel of ['#open-add', '#hero-add', '#collection-add']) $(sel).addEventListener('click', openAdd);
  $('#hero-explore').addEventListener('click', () => { if (!$('#app').classList.contains('immersive')) $('#universe-mode').click(); $('#universe').focus({ preventScroll: true }); });
  $('#home-btn').addEventListener('click', () => {  $('#app').classList.remove('catalog-exploring'); travelingNebula = null; leaveOrionField(); nebulaUI?.focused(null); nebulaSystem?.reframe(camera.aspect); catalogDepth = 0; closePanels(); focusedStarId = selectedId = null; preFocusPan = null; pan.x = pan.y = pointer.x = pointer.y = 0; zoom = 160; });
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
  $('#reset-view').addEventListener('click', () => {  $('#app').classList.remove('catalog-exploring'); travelingNebula = null; leaveOrionField(); nebulaUI?.focused(null); nebulaSystem?.reframe(camera.aspect); catalogDepth = 0; focusedStarId = selectedId = null; preFocusPan = null; pan.x = $('#app').classList.contains('immersive') ? 31 : 0; pan.y = 0; zoom = 160; });
  document.addEventListener('keydown', e => {
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'Tab' && activePanel) {
      const panel = $(`#${activePanel}-panel`);
      const targets = [...panel.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(node => !node.disabled && !node.hidden && node.getClientRects().length && !node.closest('[inert]'));
      const first = targets[0], last = targets.at(-1);
      if (first && (!panel.contains(document.activeElement) || (e.shiftKey ? document.activeElement === first : document.activeElement === last))) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      return;
    }
    if (e.key === 'Escape') { if (activePanel) closePanels(); else if(selectedId && camera) { pan.x=camera.position.x;pan.y=camera.position.y;pointer.x=pointer.y=0;preFocusPan=null;selectedId=focusedStarId=null; } else if ($('#app').classList.contains('immersive')) $('#universe-mode').click(); return; }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k' && (!isEditingTarget(e.target) || e.target === $('#search-input')) && (!activePanel || activePanel === 'collection')) {
      e.preventDefault();
      if (activePanel === 'collection') { $('#search-input').focus(); return; }
      const state = experience.snapshot();
      if ((!state.ready || state.mode === 'showcase-demo') && !experience.enterGuest()) return;
      openPanel('collection');
      return;
    }
    if (isEditingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (activePanel === 'detail' && ['ArrowLeft','ArrowRight'].includes(e.key) && !$('#record-navigation').hidden) { e.preventDefault(); $(e.key==='ArrowLeft'?'#previous-record':'#next-record').click(); return; }
    if (e.key === '/' && !activePanel) { e.preventDefault(); const state = experience.snapshot(); if ((!state.ready || state.mode === 'showcase-demo') && !experience.enterGuest()) return; openPanel('collection'); }
    if (e.shiftKey && e.key.toLowerCase() === 'f' && !activePanel) { const monitor = $('#fps-monitor'); monitor.hidden = !monitor.hidden; fpsFrames = 0; fpsLast = performance.now(); }
    // Camera keys belong to the canvas; arrow keys elsewhere retain native UI behavior.
    if (e.target !== $('#universe') || activePanel || !camera || !graphicsFallback.available) return;
    if (['+', '=', '-', '_'].includes(e.key)) { e.preventDefault(); zoomOnGalaxy(zoom * (['+', '='].includes(e.key) ? 1 / 1.15 : 1.15)); }
    if (e.key === 'Home') { e.preventDefault(); $('#reset-view').click(); }
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (directions[e.key]) {
      e.preventDefault();
      if (focusedStarId) { focusedStarId = null; preFocusPan = null; pan.x = camera.position.x; pan.y = camera.position.y; }
      const distance = Math.max(1, camera.position.z - (worldStars.get(selectedId)?.position.z ?? catalogDepth));
      const step = worldUnitsPerPixel(distance, camera.fov, innerHeight) * 48;
      pan.x += directions[e.key][0] * step; pan.y += directions[e.key][1] * step; pointer.x = pointer.y = 0;
    }
  });
  const canvas = $('#universe');
  canvas.addEventListener('pointerdown', e => {
    if (!camera || !graphicsFallback.available || (e.pointerType === 'mouse' && e.button !== 0)) return;
    canvas.focus({ preventScroll: true });
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) { const [a, b] = [...touches.values()]; pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y) }; dragging = false; dragStart = null; }
    }
    if (touches.size < 2) { dragging = true; moved = false; dragStart = { x: e.clientX, y: e.clientY }; }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    pointer.x = (e.clientX / innerWidth - .5) * 2; pointer.y = (.5 - e.clientY / innerHeight) * 2;
    if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2 && pinchStart) { const [a, b] = [...touches.values()]; const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)); const factor = pinchRatio(pinchStart.distance, distance); if (!zoomWordTarget(factor)) setZoom(zoom * factor, (a.x + b.x) / 2, (a.y + b.y) / 2); pinchStart.distance = distance; moved = true; pointer.x = pointer.y = 0; return; }
    }
    if (dragging && dragStart) {
      const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
      if (!moved && Math.abs(dx) + Math.abs(dy) <= 4) return;
      if (!moved && focusedStarId) { focusedStarId = null; preFocusPan = null; pan.x = camera.position.x; pan.y = camera.position.y; }
      const distance = Math.max(1, camera.position.z - (worldStars.get(selectedId)?.position.z ?? catalogDepth));
      const factor = worldUnitsPerPixel(distance, camera.fov, innerHeight);
      pan.x -= dx * factor; pan.y += dy * factor; dragStart = { x: e.clientX, y: e.clientY }; moved = true;
    }
  });
  const endPointer = e => {
    touches.delete(e.pointerId); dragging = false; dragStart = null; pinchStart = null;
    pointer.x = pointer.y = 0;
    // Continuing with the remaining finger starts a fresh gesture without a jump.
    if (e.type === 'pointerup' && touches.size === 1) { const point = [...touches.values()][0]; dragging = true; dragStart = { ...point }; }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('lostpointercapture', e => { if (touches.has(e.pointerId)) endPointer(e); });
  const onZoomWheel = e => {
    if (!camera || !graphicsFallback.available || !e.deltaY) return;
    if (e.target.closest('button,a,input,textarea,select,dialog,.controls,.side-panel,.scene-controls,.scene-dock,.sky-launcher,.nebula-navigation') && !e.target.closest('.star-hit')) return;
    e.preventDefault();
    const raw=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
    const delta=Math.max(-180,Math.min(180,raw))*.3;
    const direction=Math.sign(delta);
    if((lastWheelDirection && direction!==lastWheelDirection) || (Math.abs(zoom+catalogDepth-camera.position.z)>.2 && Math.sign(zoom+catalogDepth-camera.position.z)!==direction)) {
      zoom=Math.max(MIN_ZOOM,camera.position.z-catalogDepth);
      if (!focusedStarId && !travelingNebula) {
        // Reverse the current pose, including its cursor anchor, rather than
        // retaining the unfinished pan from the previous zoom destination.
        pan.x = camera.position.x; pan.y = camera.position.y;
        pointer.x = pointer.y = 0;
      }
    }
    lastWheelDirection=direction;
    const wheelStar = e.target.closest('.star-hit')?.dataset.wordId;
    if (wheelStar && worldStars.has(wheelStar)) selectedId = wheelStar;
    if(worldStars.has(selectedId)) {
      if(activePanel)closePanels();
      zoomWordTarget(Math.exp(delta*.00145));return;
    }
    // Nebula flight is an explicit selection. A plain wheel gesture must never
    // switch depth scales or re-center on a different object under the pointer.
    if(travelingNebula) {
      setZoom(zoom+nebulaCruiseStep(delta,MAX_ZOOM-catalogDepth-MIN_ZOOM));
    } else setZoom(zoom*Math.exp(delta*.00145),e.clientX,e.clientY);
  };
  $('#app').addEventListener('wheel', onZoomWheel, { passive: false });
  window.addEventListener('resize', () => { if (!renderer) return; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (!travelingNebula) nebulaSystem?.reframe(camera.aspect); renderer.setPixelRatio(renderQuality.ratio); renderer.setSize(innerWidth, innerHeight); });
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
polishInterfaceIcons();
observatoryUI = mountObservatory({ locale: uiLocale, getRecords: ()=>words, isReady: ()=>experience.snapshot().ready && experience.snapshot().mode !== 'showcase-demo', getSelectedId: ()=>selectedId, onSelect: id=>selectWord(id) });
recordNavigation = mountRecordNavigation({locale:uiLocale,onSelect:id=>selectWord(id,true)});
collectionAtlas = mountCollectionAtlas({ locale: uiLocale, onChange: () => { if (activePanel === 'collection') renderCollection(); }, onBack: () => openPanel('collection') });
graphicsFallback = mountGraphicsFallback({ locale: uiLocale, onAtlas: () => $('#collection-btn').click() });
persist(); refreshCounts(); bindUI();
let profileUI;
accountSync = mountAccountSync({
  locale: uiLocale,
  getUniverse: () => universe,
  beforeSwitch: () => { closePanels(); profileUI?.close(); recallUI?.invalidate(); },
  notify: showToast,
  replaceUniverse: (next, context) => {
    if (next.activeGalaxyId !== universe.activeGalaxyId) collectionAtlas?.reset();
    universe = next;
    words = universe.words.filter(w => w.galaxyId === universe.activeGalaxyId);
    if (!words.some(w => w.id === selectedId)) selectedId = null;
    if (!words.some(w => w.id === editingId)) {
      editingId = null;
      if (activePanel === 'add') updateEntryKindForm();
    }
    if (context?.ownerId) experience.contentReady(context.ownerId);
    else experience.guestEntries(next.words.length);
    rebuildWordStars(); refreshCounts(); renderGalaxies();
    if (activePanel === 'collection') renderCollection();
    if (activePanel === 'detail' && !selectedId) closePanels();
  },
});
profileUI = mountProfileUI({ locale: uiLocale, getUniverse: () => universe, beforeOpen: closePanels });
recallUI = mountRecallUI({ locale: uiLocale, getRecords: () => words,
  getIdentity: () => { const state = experience.snapshot(); return state.ready && state.mode !== 'showcase-demo' ? `${state.mode}:${state.ownerId || 'guest'}:${universe.activeGalaxyId}` : null; },
  beforeOpen: closePanels,
});
const handleSession = profileSessionListener(profileUI, accountSync.onSession);
experienceUI = mountExperienceUI({ locale: uiLocale,
  onGuest: () => experience.enterGuest(), onDemo: () => experience.enterDemo(),
  onSignin: () => $('#open-account').click(), onExplore: () => $('#explore-btn').click(),
});
// Domain actions explicitly leave public preview; scene-only exploration never writes records.
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('#open-add,#hero-add,#collection-add,#collection-btn,#galaxy-switch') : null;
  if (!target) return;
  const state = experience.snapshot();
  if (!state.ready && !experience.enterGuest()) { event.preventDefault(); event.stopImmediatePropagation(); return; }
  if (state.mode === 'showcase-demo') experience.enterGuest();
}, true);
mountAuthUI({ locale: uiLocale, beforeOpen: closePanels,
  onGuest: () => experience.enterGuest(),
  onIdentity: session => experience.session(session?.user?.id),
  onSession: handleSession,
  onSync: accountSync.open,
  onProfile: () => { experience.enterGuest(); profileUI.open(); },
});
applyExperience(experience.snapshot());
recallUI.refresh();
// Let identity/UI initialization run before expensive GPU preparation.
requestAnimationFrame(() => { initScene(); syncRenderLoop(); });
if (recoveredFromMirror) showToast(t('message.recovered'));
if (archiveFailure) showToast(t('status.archiveError'));
