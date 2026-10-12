import * as THREE from 'three';
import { stellarSpectrum } from './stellar-evolution.js';

// One visual family for learning records. Coordinates remain in the record;
// surface structure is procedural, not a photograph of an identified star.
export const WORD_STAR_RADIUS = 0.45;
export function wordStarPosition(entry) {
  return new THREE.Vector3(
    Number.isFinite(entry.x) ? entry.x : 31,
    Number.isFinite(entry.y) ? entry.y : 0,
    Number.isFinite(entry.z) ? entry.z : 18,
  );
}
export function stellarDetailBlend(diameter) {
  return THREE.MathUtils.smoothstep(diameter, 130, 260);
}
const surfaceVertex = `varying vec3 sphere;varying vec3 worldNormal;varying vec3 worldPosition;
void main(){sphere=position;worldNormal=normalize(mat3(modelMatrix)*normal);
worldPosition=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPosition,1.);}`;
const surfaceFragment = `precision highp sampler3D;uniform sampler3D granulation;uniform float time;uniform float seed;uniform float blend;uniform float emphasis;uniform float transmission;uniform vec3 stellarColor;
varying vec3 sphere;varying vec3 worldNormal;varying vec3 worldPosition;
void main(){vec3 n=normalize(sphere);float angle=time*.004;
n=mat3(cos(angle),0.,-sin(angle),0.,1.,0.,sin(angle),0.,cos(angle))*n;
float mu=max(0.,dot(normalize(worldNormal),normalize(cameraPosition-worldPosition)));
float limb=.16+.84*pow(mu,.65);
float footprint=length(fwidth(n))*32.;float resolved=1.-smoothstep(.4,1.2,footprint);
float granule=texture(granulation,(n*32.+vec3(sin(n.y*14.),sin(n.z*14.),sin(n.x*14.))*.65+seed+time*.012)/16.).r;
// Several convection scales soften the cached cell boundaries. Dark lanes
// stay luminous, rather than looking like cracks on a solid porcelain ball.
float broad=texture(granulation,(n*7.3+vec3(seed*.37,time*.001,seed*.19))/16.).r;
float secondary=texture(granulation,(n*23.7+vec3(2.8,seed*.13,6.1))/16.).r;
float cell=smoothstep(.17,.84,granule);
float fine=texture(granulation,(n*96.+vec3(seed*.11,3.4,8.7))/16.).r;
float fineResolved=1.-smoothstep(.25,.75,length(fwidth(n))*96.);
float convection=mix(.8,.38+1.65*cell*cell+.12*secondary,resolved);
convection*=mix(1.,.8+.4*fine,fineResolved);
float thermal=.63+.55*broad+.075*sin(n.x*9.1+n.y*7.3+seed)*sin(n.z*8.7-time*.04);
float activity=texture(granulation,(n*3.1+vec3(seed*.41,2.1,seed*.29))/16.).r;
float spots=1.-.24*smoothstep(.64,.85,activity)*smoothstep(.15,.6,broad);
vec3 temperature=mix(stellarColor*.38,mix(stellarColor,vec3(1.),.035)*2.15,.12+.88*cell);
vec3 emission=temperature*convection*thermal*limb*spots*(1.+emphasis*.065);
gl_FragColor=vec4(emission*transmission,blend);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

export function createWordStarSystem(parent, { surfaceLimit = 24 } = {}) {
  const granulation = new THREE.Data3DTexture(new Uint8Array(128 ** 3).fill(200), 128, 128, 128);
  granulation.format = THREE.RedFormat;
  granulation.type = THREE.UnsignedByteType;
  granulation.minFilter = granulation.magFilter = THREE.LinearFilter;
  granulation.wrapS = granulation.wrapT = granulation.wrapR = THREE.RepeatWrapping;
  granulation.unpackAlignment = 1;
  granulation.needsUpdate = true;
  let textureReady = typeof window === 'undefined';
  if (!textureReady)
    fetch('/assets/stars/granulation-128.bin')
      .then((r) => {
        if (!r.ok) throw new Error('Granulation load failed');
        return r.arrayBuffer();
      })
      .then((data) => {
        if (disposed) return;
        granulation.image.data = new Uint8Array(data);
        granulation.needsUpdate = true;
        textureReady = true;
      })
      .catch((error) => {
        if (!disposed) console.error(error);
      });
  const root = new THREE.Group();
  root.name = 'learning-word-stars';
  parent.add(root);
  const geometry = new THREE.BufferGeometry();
  const pointMaterial = new THREE.ShaderMaterial({
    uniforms: {
      focal: { value: 900 },
      dpr: { value: 1 },
      time: { value: 0 },
      selected: { value: -1 },
      hovered: { value: -1 },
      birth: { value: -1 },
      birthStrength: { value: 0 },
      birthProgress: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 starColor;varying vec3 ageColor;attribute float ordinal;attribute float lightPhase;attribute float detail;uniform float focal;uniform float dpr;uniform float selected;uniform float hovered;uniform float birth;uniform float birthStrength;uniform float birthProgress;attribute float transmission;attribute float extended;varying float gasTransmission;varying float phase;varying float formation;varying float formationAge;
varying float resolved;varying float emphasis;varying float diameter;varying float span;
void main(){ageColor=starColor;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
gasTransmission=transmission*(1.-extended);phase=lightPhase;diameter=p.z<0. ? .9*focal/max(.1,-p.z) : 0.;resolved=detail;
formation=ordinal==birth ? birthStrength : 0.;formationAge=birthProgress;
emphasis=ordinal==selected ? 1. : (ordinal==hovered ? .6 : 0.);emphasis+=formation*.65;
span=clamp(diameter*1.65+24.+formation*55.,5.,128.);gl_PointSize=span*dpr;}`,
    fragmentShader: `varying vec3 ageColor;uniform float time;varying float gasTransmission;varying float phase;varying float resolved;varying float emphasis;varying float diameter;varying float span;varying float formation;varying float formationAge;
void main(){vec2 q=(gl_PointCoord-.5)*2.;float r=length(q);if(r>1.)discard;
// Slow independent scintillation belongs to unresolved distant optics. The
// core stays visible, and modulation fades before the photosphere resolves.
float distant=1.-smoothstep(3.,18.,diameter);
float shimmer=.62*sin(time*(.68+.07*sin(phase))+phase)+.38*sin(time*1.19+phase*2.37);
float brilliance=1.+distant*shimmer*.21;
float sigma=max(.13,diameter/span*.44);float diamondRadius=mix(r,abs(q.x)+abs(q.y),.65);float core=exp(-pow(diamondRadius/sigma,4.));
float halo=exp(-r*r/(.11+distant*shimmer*.012))*.055;
float diamond=exp(-(abs(q.x)+abs(q.y))*16.)*.5;
float rayWidth=max(1.8/span,.002);float spike=(exp(-pow(q.x/rayWidth,2.))+exp(-pow(q.y/rayWidth,2.)))*exp(-r*2.8)*.55*(1.-resolved)*(1.+distant*shimmer*.3);
float birthRing=exp(-pow((r-(.2+.6*formationAge))/.065,2.))*formation*.13;
float glow=((core+diamond)*(1.-resolved)+halo+spike+birthRing+exp(-r*r/.19)*formation*.13)*(1.-smoothstep(.8,1.,r));
vec3 light=mix(mix(ageColor*1.6,mix(ageColor,vec3(1.),.12)*3.4,core),vec3(3.2,1.9,.7),formation*.25);
gl_FragColor=vec4(light,glow*(1.+emphasis*.3)*brilliance*gasTransmission);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  const points = new THREE.Points(geometry, pointMaterial);
  points.name = 'word-star-cores-and-optics';
  points.layers.set(2);
  points.renderOrder = 1;
  points.frustumCulled = false;
  root.add(points);
  const surfaceGeometry = new THREE.SphereGeometry(1, 64, 40);
  const surfaces = [];
  const optics = [];
  const opticsGeometry = new THREE.PlaneGeometry(1, 1);
  const states = new Map();
  let entries = [],
    disposed = false,
    detailCount = 0;
  let lastAgeUpdate = -Infinity;
  const view = new THREE.Vector3();
  function releaseSurfaces() {
    for (const mesh of optics) {
      root.remove(mesh);
      mesh.material.dispose();
    }
    optics.length = 0;
    for (const mesh of surfaces) {
      root.remove(mesh, mesh.userData.corona);
      mesh.material.dispose();
      mesh.userData.corona.material.dispose();
    }
    surfaces.length = 0;
  }
  return {
    root,
    get ready() {
      return textureReady;
    },
    setEntries(next, { positionOf = wordStarPosition } = {}) {
      entries = next;
      lastAgeUpdate = -Infinity;
      states.clear();
      const positions = new Float32Array(entries.length * 3);
      entries.forEach((entry, i) => {
        const position = positionOf(entry);
        position.toArray(positions, i * 3);
        let seed = 2166136261;
        for (const char of entry.id) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
        const phase = (seed / 4294967296) * Math.PI * 2;
        states.set(entry.id, { index: i, position, phase, color: new THREE.Color(), diameter: 0, blend: 0 });
      });
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute(
        'ordinal',
        new THREE.Float32BufferAttribute(
          entries.map((_, i) => i),
          1,
        ),
      );
      geometry.setAttribute('detail', new THREE.BufferAttribute(new Float32Array(entries.length), 1));
      geometry.setAttribute('starColor', new THREE.BufferAttribute(new Float32Array(entries.length * 3), 3));
      geometry.setAttribute(
        'lightPhase',
        new THREE.Float32BufferAttribute(
          entries.map((entry) => states.get(entry.id).phase),
          1,
        ),
      );
      geometry.setAttribute('extended', new THREE.BufferAttribute(new Float32Array(entries.length), 1));
      geometry.setAttribute('transmission', new THREE.BufferAttribute(new Float32Array(entries.length).fill(1), 1));
      releaseSurfaces();
      for (let i = 0; i < Math.min(surfaceLimit, entries.length); i++) {
        const material = new THREE.ShaderMaterial({
          uniforms: {
            granulation: { value: granulation },
            time: { value: 0 },
            seed: { value: 0 },
            blend: { value: 0 },
            emphasis: { value: 0 },
            transmission: { value: 1 },
            stellarColor: { value: new THREE.Color() },
          },
          vertexShader: surfaceVertex,
          fragmentShader: surfaceFragment,
          transparent: true,
          depthWrite: true,
        });
        const mesh = new THREE.Mesh(surfaceGeometry, material);
        mesh.name = 'word-star-photosphere';
        mesh.layers.set(2);
        mesh.scale.setScalar(WORD_STAR_RADIUS);
        mesh.visible = false;
        mesh.renderOrder = 2;
        const corona = new THREE.Mesh(
          surfaceGeometry,
          new THREE.ShaderMaterial({
            uniforms: {
              blend: material.uniforms.blend,
              transmission: material.uniforms.transmission,
              time: material.uniforms.time,
              seed: material.uniforms.seed,
              stellarColor: material.uniforms.stellarColor,
            },
            vertexShader: `varying vec2 coronaUv;varying float viewDistance;void main(){coronaUv=uv;vec4 p=modelViewMatrix*vec4(0.,0.,0.,1.);viewDistance=length(p.xyz);p.xy+=position.xy;gl_Position=projectionMatrix*p;}`,
            fragmentShader: `uniform vec3 stellarColor;uniform float blend;uniform float transmission;uniform float time;uniform float seed;varying vec2 coronaUv;varying float viewDistance;
void main(){vec2 q=(coronaUv-.5)*2.;float r=length(q);if(r>1.)discard;
// Perspective silhouette of the shared sphere; a tapered billboard has no
// hard outer shell and retains a continuous glow during close approaches.
float ratio=.45/max(.4501,viewDistance);float edge=.5/sqrt(max(.08,1.-ratio*ratio));
float height=(r-edge)/max(.07,1.-edge);if(height<-.04)discard;
float a=atan(q.y,q.x);float flow=.55+.3*sin(a*13.+seed+sin(a*5.)*1.8)+.15*sin(a*29.-time*.07);
float glow=exp(-max(0.,height)*7.)*(1.-smoothstep(.7,1.,r));
float stream=pow(max(0.,flow),3.)*exp(-max(0.,height)*3.8);
float spicule=exp(-pow((height-.08-flow*.055)/.035,2.))*flow;
gl_FragColor=vec4(stellarColor*3.,(.12*glow+.045*stream+.085*spicule)*blend*transmission);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        corona.name = 'word-star-corona';
        corona.layers.set(2);
        corona.renderOrder = 3;
        corona.geometry = opticsGeometry;
        corona.scale.setScalar(WORD_STAR_RADIUS * 4);
        corona.visible = false;
        mesh.userData.corona = corona;
        root.add(corona);
        root.add(mesh);
        surfaces.push(mesh);
      }
      for (let i = 0; i < Math.min(surfaceLimit, entries.length); i++) {
        const material = new THREE.ShaderMaterial({
          uniforms: {
            granulation: { value: granulation },
            time: { value: 0 },
            focal: { value: 900 },
            pixelSpan: { value: 32 },
            bodyDiameter: { value: 0 },
            surfaceBlend: { value: 0 },
            gain: { value: 0 },
            lightPhase: { value: 0 },
            attenuation: { value: 1 },
            birthPulse: { value: 0 },
            birthAge: { value: 0 },
            stellarColor: { value: new THREE.Color() },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexShader: `uniform vec3 stellarColor;varying vec3 ageColor;uniform float focal;uniform float pixelSpan;uniform float bodyDiameter;uniform float surfaceBlend;uniform float gain;uniform float lightPhase;uniform float attenuation;uniform float birthPulse;uniform float birthAge;varying float formation;varying float formationAge;
          varying vec2 vUv;varying float resolved;varying float emphasis;varying float diameter;varying float span;varying float gasTransmission;varying float phase;
          void main(){ageColor=stellarColor;vUv=uv;resolved=surfaceBlend;emphasis=gain;diameter=bodyDiameter;span=pixelSpan;gasTransmission=attenuation;phase=lightPhase;formation=birthPulse;formationAge=birthAge;
          vec4 p=modelViewMatrix*vec4(0.,0.,0.,1.);p.xy+=(uv-.5)*pixelSpan*max(.1,-p.z)/focal;gl_Position=projectionMatrix*p;}`,
          fragmentShader: 'varying vec2 vUv;' + pointMaterial.fragmentShader.replace('gl_PointCoord', 'vUv'),
        });
        const mesh = new THREE.Mesh(opticsGeometry, material);
        mesh.name = 'word-star-optical-rays';
        mesh.layers.set(2);
        mesh.renderOrder = 1;
        mesh.frustumCulled = false;
        mesh.visible = false;
        root.add(mesh);
        optics.push(mesh);
      }
    },
    state: (id) => states.get(id),
    get detailCount() {
      return detailCount;
    },
    get pointCount() {
      return entries.length - detailCount;
    },
    update(
      seconds,
      camera,
      height,
      dpr,
      {
        selectedId = null,
        hoveredId = null,
        birthId = null,
        birthStrength = 0,
        birthProgress = 0,
        now = Date.now(),
        reducedMotion = false,
        transmission = () => 1,
      } = {},
    ) {
      if (disposed) return;
      if (Math.abs(now - lastAgeUpdate) >= 1000) {
        lastAgeUpdate = now;
        const colors = geometry.getAttribute('starColor');
        for (const entry of entries) {
          const state = states.get(entry.id);
          state.color.set(stellarSpectrum(entry, now, !reducedMotion).color);
          colors.setXYZ(state.index, state.color.r, state.color.g, state.color.b);
        }
        colors.needsUpdate = true;
      }
      root.updateMatrixWorld(true);
      const focal = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      Object.assign(pointMaterial.uniforms.focal, { value: focal });
      pointMaterial.uniforms.dpr.value = dpr;
      pointMaterial.uniforms.time.value = seconds;
      pointMaterial.uniforms.selected.value = states.get(selectedId)?.index ?? -1;
      pointMaterial.uniforms.hovered.value = states.get(hoveredId)?.index ?? -1;
      pointMaterial.uniforms.birth.value = states.get(birthId)?.index ?? -1;
      pointMaterial.uniforms.birthStrength.value = birthStrength;
      pointMaterial.uniforms.birthProgress.value = birthProgress;
      const candidates = [];
      const opticalCandidates = [];
      for (const entry of entries) {
        const state = states.get(entry.id);
        state.transmission = transmission(state.position, entry.id);
        geometry.getAttribute('transmission').setX(state.index, state.transmission);
        view.copy(state.position).applyMatrix4(root.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
        state.diameter = view.z < -camera.near ? (WORD_STAR_RADIUS * 2 * focal) / -view.z : 0;
        state.blend = 0;
        geometry.getAttribute('extended').setX(state.index, 0);
        const inView =
          Math.abs(view.x) <
            -view.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect + WORD_STAR_RADIUS &&
          Math.abs(view.y) < -view.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + WORD_STAR_RADIUS;
        if (state.diameter > 8 && inView) opticalCandidates.push({ entry, state });
        if (state.diameter > 130 && inView) candidates.push({ entry, state });
      }
      candidates.sort(
        (a, b) =>
          Number(b.entry.id === selectedId) - Number(a.entry.id === selectedId) || b.state.diameter - a.state.diameter,
      );
      detailCount = Math.min(candidates.length, surfaces.length);
      for (let i = 0; i < surfaces.length; i++) {
        const mesh = surfaces[i],
          candidate = candidates[i];
        mesh.visible = Boolean(candidate);
        mesh.userData.corona.visible = mesh.visible;
        if (!candidate) continue;
        const { entry, state } = candidate;
        state.blend = stellarDetailBlend(state.diameter);
        mesh.position.copy(state.position);
        mesh.userData.corona.position.copy(state.position);
        let seed = 0;
        for (const char of entry.id) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) >>> 0;
        mesh.material.uniforms.seed.value = seed % 100;
        mesh.material.uniforms.time.value = seconds;
        mesh.material.uniforms.stellarColor.value.copy(state.color);
        mesh.material.uniforms.blend.value = state.blend;
        mesh.material.uniforms.transmission.value = state.transmission;
        mesh.material.uniforms.emphasis.value = entry.id === selectedId ? 1 : entry.id === hoveredId ? 0.6 : 0;
        mesh.material.depthWrite = state.blend === 1;
      }

      opticalCandidates.sort(
        (a, b) =>
          Number(b.entry.id === selectedId) - Number(a.entry.id === selectedId) || b.state.diameter - a.state.diameter,
      );
      for (let i = 0; i < optics.length; i++) {
        const mesh = optics[i],
          candidate = opticalCandidates[i];
        mesh.visible = Boolean(candidate);
        if (!candidate) continue;
        const { entry, state } = candidate;
        mesh.position.copy(state.position);
        if (state.blend === 1) {
          mesh.visible = false;
          geometry.getAttribute('extended').setX(state.index, 1);
          continue;
        }
        const u = mesh.material.uniforms;
        u.time.value = seconds;
        u.stellarColor.value.copy(state.color);
        u.focal.value = focal;
        u.pixelSpan.value = Math.min(900, state.diameter * 4 + 32);
        u.bodyDiameter.value = state.diameter;
        u.surfaceBlend.value = state.blend;
        u.gain.value = entry.id === selectedId ? 1 : entry.id === hoveredId ? 0.6 : 0;
        u.lightPhase.value = state.phase;
        u.attenuation.value = state.transmission;
        u.birthPulse.value = entry.id === birthId ? birthStrength : 0;
        u.birthAge.value = birthProgress;
        geometry.getAttribute('extended').setX(state.index, 1);
      }
      geometry.getAttribute('extended').needsUpdate = true;
      const detail = geometry.getAttribute('detail');
      for (const state of states.values()) detail.setX(state.index, state.blend);
      detail.needsUpdate = true;
      geometry.getAttribute('transmission').needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      parent.remove(root);
      releaseSurfaces();
      granulation.dispose();
      surfaceGeometry.dispose();
      opticsGeometry.dispose();
      geometry.dispose();
      pointMaterial.dispose();
    },
  };
}
