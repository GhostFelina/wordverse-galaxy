import * as THREE from 'three';

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
  return THREE.MathUtils.smoothstep(diameter, 8, 24);
}
const surfaceVertex = `varying vec3 sphere;varying vec3 worldNormal;varying vec3 worldPosition;
void main(){sphere=position;worldNormal=normalize(mat3(modelMatrix)*normal);
worldPosition=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPosition,1.);}`;
const surfaceFragment = `uniform float time;uniform float seed;uniform float blend;uniform float emphasis;
varying vec3 sphere;varying vec3 worldNormal;varying vec3 worldPosition;
vec3 hash3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yzx+19.19);return fract((p.xxy+p.yxx)*p.zyx);}
float cells(vec3 p){vec3 base=floor(p),f=fract(p);float nearest=8.,second=8.;
for(int z=-1;z<=1;z++)for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
vec3 offset=vec3(float(x),float(y),float(z));vec3 center=hash3(base+offset);
vec3 delta=offset+.2+.6*center-f;float d=dot(delta,delta);if(d<nearest){second=nearest;nearest=d;}else{second=min(second,d);}}return sqrt(second)-sqrt(nearest);}
void main(){vec3 n=normalize(sphere);float angle=time*.004;
n=mat3(cos(angle),0.,-sin(angle),0.,1.,0.,sin(angle),0.,cos(angle))*n;
float mu=max(0.,dot(normalize(worldNormal),normalize(cameraPosition-worldPosition)));
float limb=.24+.76*pow(mu,.6);
float footprint=length(fwidth(n))*45.;float resolved=1.-smoothstep(.4,1.2,footprint);
float granule=cells(n*45.+vec3(sin(n.y*18.),sin(n.z*18.),sin(n.x*18.))*.35+seed+time*.006);
float convection=mix(.78,.42+.65*smoothstep(.008,.13,granule),resolved);
float spots=1.-.1*smoothstep(.98,.998,dot(n,normalize(vec3(.35,.4,.72))));
vec3 hot=vec3(2.1,1.85,1.5)*convection;
vec3 emission=hot*limb*spots*(1.+emphasis*.065);
gl_FragColor=vec4(emission,blend);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

export function createWordStarSystem(parent, { surfaceLimit = 24 } = {}) {
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
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float ordinal;attribute float detail;uniform float focal;uniform float dpr;uniform float selected;uniform float hovered;uniform float birth;uniform float birthStrength;
varying float resolved;varying float emphasis;varying float diameter;varying float span;
void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
diameter=p.z<0. ? .9*focal/max(.1,-p.z) : 0.;resolved=detail;
emphasis=ordinal==selected ? 1. : (ordinal==hovered ? .6 : 0.);emphasis+=ordinal==birth ? birthStrength*.4 : 0.;
span=clamp(diameter*1.65+24.,5.,128.);gl_PointSize=span*dpr;}`,
    fragmentShader: `uniform float time;varying float resolved;varying float emphasis;varying float diameter;varying float span;
void main(){vec2 q=(gl_PointCoord-.5)*2.;float r=length(q);if(r>1.)discard;
float sigma=max(.13,diameter/span*.44);float core=exp(-r*r/(sigma*sigma));
float halo=exp(-r*r/.11)*.055;
float diamond=exp(-(abs(q.x)+abs(q.y))*16.)*.5;
float spike=(exp(-abs(q.x)*28.)+exp(-abs(q.y)*28.))*exp(-r*2.8)*.35*(1.-resolved);
float glow=((core+diamond)*(1.-resolved)+halo+spike)*(1.-smoothstep(.8,1.,r));
vec3 light=mix(vec3(1.22,1.22,1.8),vec3(3.5,3.2,2.9),core);
gl_FragColor=vec4(light,glow*(1.+emphasis*.3)*(.96+.04*cos(time*1.3)));
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
  const states = new Map();
  let entries = [],
    disposed = false,
    detailCount = 0;
  const view = new THREE.Vector3();
  function releaseSurfaces() {
    for (const mesh of surfaces) {
      root.remove(mesh, mesh.userData.corona);
      mesh.material.dispose();
      mesh.userData.corona.material.dispose();
    }
    surfaces.length = 0;
  }
  return {
    root,
    setEntries(next) {
      entries = next;
      states.clear();
      const positions = new Float32Array(entries.length * 3);
      entries.forEach((entry, i) => {
        const position = wordStarPosition(entry);
        position.toArray(positions, i * 3);
        states.set(entry.id, { index: i, position, diameter: 0, blend: 0 });
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
      releaseSurfaces();
      for (let i = 0; i < Math.min(surfaceLimit, entries.length); i++) {
        const material = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 }, seed: { value: 0 }, blend: { value: 0 }, emphasis: { value: 0 } },
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
            uniforms: { blend: material.uniforms.blend },
            vertexShader: surfaceVertex,
            fragmentShader: `uniform float blend;varying vec3 worldNormal;varying vec3 worldPosition;
void main(){float facing=abs(dot(normalize(worldNormal),normalize(cameraPosition-worldPosition)));
gl_FragColor=vec4(vec3(1.3,1.55,1.7),pow(1.-facing,3.)*facing*.3*blend);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
          }),
        );
        corona.name = 'word-star-corona';
        corona.layers.set(2);
        corona.renderOrder = 3;
        corona.scale.setScalar(WORD_STAR_RADIUS * 1.06);
        corona.visible = false;
        mesh.userData.corona = corona;
        root.add(corona);
        root.add(mesh);
        surfaces.push(mesh);
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
      { selectedId = null, hoveredId = null, birthId = null, birthStrength = 0 } = {},
    ) {
      if (disposed) return;
      root.updateMatrixWorld(true);
      const focal = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      Object.assign(pointMaterial.uniforms.focal, { value: focal });
      pointMaterial.uniforms.dpr.value = dpr;
      pointMaterial.uniforms.time.value = seconds;
      pointMaterial.uniforms.selected.value = states.get(selectedId)?.index ?? -1;
      pointMaterial.uniforms.hovered.value = states.get(hoveredId)?.index ?? -1;
      pointMaterial.uniforms.birth.value = states.get(birthId)?.index ?? -1;
      pointMaterial.uniforms.birthStrength.value = birthStrength;
      const candidates = [];
      for (const entry of entries) {
        const state = states.get(entry.id);
        view.copy(state.position).applyMatrix4(root.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
        state.diameter = view.z < -camera.near ? (WORD_STAR_RADIUS * 2 * focal) / -view.z : 0;
        state.blend = 0;
        const inView =
          Math.abs(view.x) <
            -view.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect + WORD_STAR_RADIUS &&
          Math.abs(view.y) < -view.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + WORD_STAR_RADIUS;
        if (state.diameter > 8 && inView) candidates.push({ entry, state });
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
        mesh.material.uniforms.blend.value = state.blend;
        mesh.material.uniforms.emphasis.value = entry.id === selectedId ? 1 : entry.id === hoveredId ? 0.6 : 0;
        mesh.material.depthWrite = state.blend === 1;
      }
      const detail = geometry.getAttribute('detail');
      for (const state of states.values()) detail.setX(state.index, state.blend);
      detail.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      parent.remove(root);
      releaseSurfaces();
      surfaceGeometry.dispose();
      geometry.dispose();
      pointMaterial.dispose();
    },
  };
}
