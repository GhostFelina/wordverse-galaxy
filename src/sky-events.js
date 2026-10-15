import * as THREE from 'three';
import { createSkyPlacement } from './sky-event-placement.js';
import { BLACK_HOLE_GLSL } from './blackhole-shader.js';
import { NEBULA_EVENT_GLSL } from './nebula-event-shader.js';
import { SKY_EVENTS } from './sky-event-catalog.js';
export { SKY_EVENTS } from './sky-event-catalog.js';

// Ephemeral presentation state. It never touches learning records or storage.
export function createSkyEventState({ reducedMotion = false } = {}) {
  let kind = null,
    elapsed = 0;
  return {
    setReducedMotion(value) {
      reducedMotion = !!value;
    },

    select(next) {
      kind = Object.hasOwn(SKY_EVENTS, next) ? next : null;
      elapsed = 0;
    },
    update(delta = 0) {
      if (kind && !reducedMotion) elapsed += Math.min(0.1, Math.max(0, Number.isFinite(delta) ? delta : 0));
      if (kind && SKY_EVENTS[kind] && elapsed >= SKY_EVENTS[kind]) kind = null;
      return this.snapshot();
    },
    snapshot() {
      return {
        kind,
        elapsed:
          reducedMotion && kind
            ? kind === 'meteor'
              ? 2.6
              : kind === 'supernova'
                ? 8
                : kind === 'kilonova'
                  ? 13
                  : kind === 'comet'
                    ? 12
                    : kind === 'pulsar'
                      ? 9
                      : SKY_EVENTS[kind] * 0.45
            : elapsed,
        reducedMotion,
      };
    },
  };
}

const fragment = `varying vec2 uvEvent;uniform float envelope;uniform float clock;uniform int kind;uniform float aspect;uniform vec2 blackholePosition;uniform float blackholeScale;uniform vec2 eventPosition;uniform float eventScale;uniform float eventAngle;uniform float eventDuration;uniform sampler2D backgroundImage;uniform float backgroundAvailable;uniform float inspection;
float band(float value,float width){return exp(-pow(value/width,2.));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
float turbulence(vec2 p){float sum=0.,weight=.5;mat2 turn=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){sum+=noise(p)*weight;p=turn*p*2.07+3.1;weight*=.5;}return sum;}
void main(){
 vec2 q=(uvEvent-.5)*2.;q.x*=aspect;
 vec3 light=vec3(0.);float alpha=0.;
 if(kind==1){
  float t=clamp((clock-.6)/4.4,0.,1.);
  vec2 direction=vec2(cos(eventAngle-.35),sin(eventAngle-.35));
  vec2 head=eventPosition+direction*mix(-.55,.55,t);vec2 d=q-head;
  float along=dot(d,direction),side=dot(d,vec2(-direction.y,direction.x));
  float ribbon=side+sin(along*26.+clock*.3)*.002*max(0.,-along);
  float tail=band(ribbon,.003+max(0.,-along)*.009)*exp(along*6.)*step(along,0.)*smoothstep(-.8,-.58,along);
  float vapor=band(ribbon,.018+max(0.,-along)*.016)*exp(along*5.)*step(along,0.)*smoothstep(-.9,-.65,along)*.08;
  float core=exp(-dot(d,d)*16000.);float halo=exp(-dot(d,d)*450.)*.12;
  float fade=smoothstep(0.,.13,t)*(1.-smoothstep(.82,1.,t));
  light=mix(vec3(.19,.48,1.2),vec3(3.6,2.2,.85),core)* (tail*.8+core+halo)+vec3(.48,.14,.12)*vapor;
  alpha=min(.92,(tail+core+halo+vapor)*fade);light*=fade;
 }else if(kind==2){
  vec2 d=(q-eventPosition)/eventScale;float r=length(d);float angle=atan(d.y,d.x);
  float rise=smoothstep(0.,3.,clock),fade=1.-smoothstep(12.,18.,clock);
  float expansion=.035+min(clock,14.)*.022;
  if(r>.9)discard;
  float turbulent=turbulence(d*18.+vec2(clock*.006,0.));
  float folds=.014*sin(angle*7.+sin(angle*3.)*2.)+.009*sin(angle*19.+turbulent*3.);
  float wisps=.35+.65*turbulence(vec2(angle*8.,r*45.-clock*.025));
  float shell=band(r-expansion-folds,.009+clock*.0013)*(.3+wisps*1.2);
  float inner=band(r-expansion*.76-folds*.7,.018+clock*.001)*wisps*.42;
  float filaments=pow(max(0.,sin(angle*31.+turbulent*9.+r*36.)),8.)*band(r-expansion*.85,.04)*.3;
  float core=exp(-r*r/(.0003+.003*rise))*exp(-max(0.,clock-3.)*.35);
  float haze=exp(-r*r/(.008+clock*.004))*.08*(.3+turbulent);
  alpha=min(.85,(shell*.72+inner+filaments+core*.7+haze)*rise*fade);
  light=(mix(vec3(.16,.45,1.4),vec3(2.4,.36,.055),wisps)*shell+vec3(.55,.24,1.1)*(inner+filaments)+vec3(2.7,1.6,.7)*core+haze*vec3(.28,.22,.5))*rise*fade;
 }else if(kind==3){
  ${BLACK_HOLE_GLSL}
 }else if(kind==4){
  vec2 d=(q-eventPosition)/eventScale;float r=length(d);
  if(r>.76)discard;
  // A compressed inspiral, merger and ejecta sequence, kept far from the UI.
  // Personal word stars never become either binary in this illustration.
  float merger=smoothstep(7.7,9.2,clock);
  float orbitRadius=mix(.145,.008,smoothstep(0.,8.7,clock));
  float angle=clock*.65+clock*clock*.12;
  vec2 orbit=vec2(cos(angle),sin(angle)*.48)*orbitRadius;
  float a=length(d-orbit),b=length(d+orbit);
  float binary=(exp(-a*a/.00014)+exp(-b*b/.00014))*(1.-merger);
  float halos=(exp(-a*a/.0015)+exp(-b*b/.0015))*.075*(1.-merger);
  float spiralPhase=atan(d.y,d.x)*2.+r*56.-angle*2.;
  float streams=pow(max(0.,sin(spiralPhase)),8.)*band(r-orbitRadius,.025)*.06*(1.-merger);
  float age=max(0.,clock-8.4),expansion=.022+age*.027;
  float fog=turbulence(d*22.+vec2(clock*.003,0.));
  float folds=.013*sin(atan(d.y,d.x)*7.+fog*5.);
  float wisps=.25+.75*turbulence(vec2(atan(d.y,d.x)*5.,r*32.-age*.04));
  float shell=band(r-expansion-folds,.014+age*.002)*(.18+fog)*wisps*merger;
  float ejecta=exp(-r*r/(.002+age*.006))*pow(.15+fog,2.)*merger*.48;
  float cooling=smoothstep(1.,10.,age);
  vec3 debris=mix(vec3(.12,.58,1.4),vec3(1.5,.18,.025),cooling);
  float remnant=exp(-r*r/.0003)*merger*exp(-age*.18);
  float jets=band(d.x+sin(d.y*12.)*.002,.007+abs(d.y)*.026)*exp(-abs(d.y)*7.)*smoothstep(.022,.06,abs(d.y))*merger*exp(-age*.28)*.06;
  float waves=band(r-fract(clock*.1)*.62,.004)*smoothstep(.05,.22,r)*(1.-smoothstep(.4,.64,r))*(1.-merger)*.02;
  float fade=smoothstep(0.,1.2,clock)*(1.-smoothstep(17.,22.,clock));
  light=(vec3(.45,1.2,2.8)*(binary+halos+streams)+debris*(shell+ejecta)+vec3(2.8,1.7,.8)*remnant+vec3(.3,.8,1.3)*(jets+waves))*fade;
  alpha=min(.9,(binary+halos+streams+shell*.8+ejecta+remnant*.8+jets+waves)*fade);
 }else if(kind==5){
  vec2 travel=vec2(cos(eventAngle),sin(eventAngle));
  vec2 head=eventPosition+travel*(clock/24.-.5)*.38;
  vec2 delta=(q-head)/eventScale;
  float along=dot(delta,travel),side=dot(delta,vec2(-travel.y,travel.x));
  float behind=max(0.,-along),r=length(delta);
  float dust=band(side+behind*behind*.18,.009+behind*.13)*exp(-behind*5.)*step(along,0.)*smoothstep(.58,.35,behind);
  float fibers=.5+.5*turbulence(vec2(along*25.,side*70.-clock*.025));
  float ion=band(side-behind*.11,.004+behind*.018)*exp(-behind*3.6)*step(along,0.)*smoothstep(.65,.45,behind);
  float nucleus=exp(-r*r/.00007),coma=exp(-r*r/.0017)*.17;
  float fade=smoothstep(0.,2.,clock)*(1.-smoothstep(20.,24.,clock));
  light=(vec3(2.1,2.4,2.8)*nucleus+vec3(.26,.65,.52)*coma+vec3(.9,.53,.22)*dust*fibers*.35+vec3(.13,.4,1.2)*ion*.28)*fade;
  alpha=min(.8,(nucleus+coma+dust*fibers*.25+ion*.22)*fade);
 }else if(kind==6){
  vec2 d=(q-eventPosition)/eventScale;float r=length(d);
  if(r>.5)discard;
  float rotation=eventAngle+clock*.3;
  vec2 axis=vec2(cos(rotation),sin(rotation));float along=dot(d,axis),side=dot(d,vec2(-axis.y,axis.x));
  float pulse=.68+.32*pow(.5+.5*sin(clock*4.1),2.);
  float nucleus=exp(-r*r/.00006),halo=exp(-r*r/.001)*.085;
  float jets=band(side,.004+abs(along)*.035)*exp(-abs(along)*12.)*smoothstep(.015,.04,abs(along))*pulse*.18;
  float magnetosphere=band(r-.075,.005)*(.25+.75*pow(abs(dot(normalize(d+vec2(.00001)),axis)),4.))*.025;
  float fade=smoothstep(0.,2.,clock)*(1.-smoothstep(24.,28.,clock));
  light=(vec3(.65,1.5,2.8)*(nucleus+halo+jets)+vec3(.18,.48,.9)*magnetosphere)*fade;
  alpha=min(.82,(nucleus+halo+jets+magnetosphere)*fade);
 }
 if(kind>=7){${NEBULA_EVENT_GLSL}}
 alpha*=envelope;light*=envelope;
 if(alpha<.001)discard;
 // Normal alpha blending keeps the bounded core dark and avoids screen flashes.
 gl_FragColor=vec4(light/max(.001,alpha),alpha);
 if(kind!=3){
 #include <tonemapping_fragment>
 }
 #include <colorspace_fragment>
}`;

export function createSkyEvents({ reducedMotion = false, random = Math.random } = {}) {
  const state = createSkyEventState({ reducedMotion });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      clock: { value: 0 },
      envelope: { value: 1 },
      kind: { value: 0 },
      aspect: { value: 1 },
      blackholePosition: { value: new THREE.Vector2(0.66, 0.4) },
      blackholeScale: { value: 0.48 },
      eventPosition: { value: new THREE.Vector2() },
      eventScale: { value: 0.84 },
      eventAngle: { value: 0 },
      eventDuration: { value: 30 },
      backgroundImage: { value: null },
      backgroundAvailable: { value: 0 },
      inspection: { value: 0 },
    },
    vertexShader: 'varying vec2 uvEvent;void main(){uvEvent=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(geometry, material));
  let ready = false;
  const anchor = new THREE.Vector3(),
    projected = new THREE.Vector3();
  let anchored = false;
  let anchorDistance = 18000;
  let inspection = false;
  let placement = { center: [0.4, 0.4], scale: 0.84, angle: 0 };
  return {
    setReducedMotion: (value) => state.setReducedMotion(value),
    select(next, { wide = false, reposition = true, distance = 18000 } = {}) {
      state.select(next);
      inspection = false;
      if (state.snapshot().kind && reposition)
        placement = createSkyPlacement({ random, wide, previous: placement.center });
      anchored = false;
      anchorDistance = THREE.MathUtils.clamp(distance, 180, 18000);
    },
    inspectBlackHole(value = true) {
      inspection = state.snapshot().kind === 'blackhole' && !!value;
    },
    snapshot: () => ({ ...state.snapshot(), inspection, placement: { ...placement, center: [...placement.center] } }),
    warm: async (renderer) => {
      await renderer.compileAsync(scene, camera);
      ready = true;
    },
    update(delta, aspect, sceneCamera, envelope = 1) {
      const snapshot = state.update(delta);
      material.uniforms.clock.value = snapshot.elapsed;
      material.uniforms.envelope.value = THREE.MathUtils.clamp(envelope, 0, 1);
      material.uniforms.kind.value = Object.keys(SKY_EVENTS).indexOf(snapshot.kind) + 1;
      material.uniforms.aspect.value = aspect;
      material.uniforms.inspection.value = inspection ? 1 : 0;
      material.uniforms.eventScale.value = placement.scale;
      material.uniforms.eventAngle.value = placement.angle;
      material.uniforms.eventDuration.value = SKY_EVENTS[snapshot.kind] || 45;
      if (snapshot.kind && sceneCamera) {
        const tangent = Math.tan(THREE.MathUtils.degToRad(sceneCamera.fov / 2));
        if (!anchored) {
          anchor.set(
            sceneCamera.position.x + anchorDistance * tangent * aspect * placement.center[0],
            sceneCamera.position.y + anchorDistance * tangent * placement.center[1],
            sceneCamera.position.z - anchorDistance,
          );
          anchored = true;
        }
        projected.copy(anchor).project(sceneCamera);
        material.uniforms.eventPosition.value.set(projected.x * aspect, projected.y);
        material.uniforms.blackholePosition.value.set(projected.x * aspect, projected.y);
        material.uniforms.blackholeScale.value = THREE.MathUtils.clamp(
          (0.24 * placement.scale * 18000) / Math.max(100, sceneCamera.position.z - anchor.z),
          0.14,
          0.28,
        );
        if (anchorDistance < 18000)
          material.uniforms.eventScale.value =
            placement.scale *
            THREE.MathUtils.clamp(anchorDistance / Math.max(100, sceneCamera.position.z - anchor.z), 0.5, 1.5);
      } else {
        material.uniforms.eventPosition.value.set(aspect * placement.center[0], placement.center[1]);
        material.uniforms.blackholePosition.value.copy(material.uniforms.eventPosition.value);
      }
      if (snapshot.kind === 'blackhole' && inspection) {
        material.uniforms.blackholePosition.value.set(0, 0.08);
        material.uniforms.blackholeScale.value = Math.min(1.15, aspect * 1.45);
      }
      return { ...snapshot, inspection, placement: { ...placement, center: [...placement.center] } };
    },
    render(renderer, background) {
      if (!ready || !state.snapshot().kind) return;
      material.uniforms.backgroundImage.value = background || null;
      material.uniforms.backgroundAvailable.value = background ? 1 : 0;
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      try {
        renderer.render(scene, camera);
      } finally {
        renderer.autoClear = autoClear;
      }
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
