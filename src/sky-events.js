import * as THREE from 'three';

export const SKY_EVENTS = Object.freeze({ meteor: 6, supernova: 18, blackhole: 0 });

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
        elapsed: reducedMotion && kind ? (kind === 'meteor' ? 2.6 : kind === 'supernova' ? 8 : 0) : elapsed,
        reducedMotion,
      };
    },
  };
}

const fragment = `varying vec2 uvEvent;uniform float clock;uniform int kind;uniform float aspect;
float band(float value,float width){return exp(-pow(value/width,2.));}
void main(){
 vec2 q=(uvEvent-.5)*2.;q.x*=aspect;
 vec3 light=vec3(0.);float alpha=0.;
 if(kind==1){
  float t=clamp((clock-.6)/4.4,0.,1.);
  vec2 head=mix(vec2(-aspect*.64,.62),vec2(aspect*.65,-.08),t);
  vec2 direction=normalize(vec2(aspect*1.29,-.7));vec2 d=q-head;
  float along=dot(d,direction),side=dot(d,vec2(-direction.y,direction.x));
  float tail=band(side,.004+max(0.,-along)*.007)*exp(along*7.)*step(along,0.)*smoothstep(-.65,-.48,along);
  float core=exp(-dot(d,d)*12000.);float halo=exp(-dot(d,d)*650.)*.12;
  float fade=smoothstep(0.,.13,t)*(1.-smoothstep(.82,1.,t));
  light=mix(vec3(.34,.57,1.),vec3(1.8,1.5,1.1),core)* (tail*.55+core+halo);
  alpha=min(.85,(tail+core+halo)*fade);light*=fade;
 }else if(kind==2){
  vec2 d=q-vec2(aspect*.29,.17);float r=length(d);float angle=atan(d.y,d.x);
  float rise=smoothstep(0.,3.,clock),fade=1.-smoothstep(12.,18.,clock);
  float expansion=.035+min(clock,14.)*.022;
  float wisps=.65+.35*sin(angle*17.+sin(angle*7.)*2.+r*65.);
  float shell=band(r-expansion,.015+clock*.0018)*wisps;
  float core=exp(-r*r/(.0003+.003*rise))*exp(-max(0.,clock-3.)*.35);
  float haze=exp(-r*r/(.008+clock*.004))*.09;
  alpha=min(.72,(shell*.55+core*.7+haze)*rise*fade);
  light=(mix(vec3(.25,.4,.85),vec3(.95,.34,.16),wisps)*shell*.7+vec3(1.35,1.1,.85)*core+haze*vec3(.28,.22,.5))*rise*fade;
 }else if(kind==3){
  vec2 d=q-vec2(aspect*.29,.1);float r=length(d);float angle=atan(d.y,d.x);
  float horizon=1.-smoothstep(.105,.112,r);
  float photon=band(r-.121,.004)*.62;
  vec2 disk=vec2(d.x,d.y*3.6);float dr=length(disk),da=atan(disk.y,disk.x);
  float streak=.68+.2*sin(dr*170.-da*3.+clock*.65)+.12*sin(dr*310.+da*5.-clock*.2);
  float ring=band(dr-.24,.08)*smoothstep(.13,.17,dr)*streak;
  // Illustrative bent far-side disk, not a ray-traced gravity simulation.
  float bent=band(length(vec2(d.x,d.y-.055))-.19,.012)*smoothstep(-.01,.07,d.y);
  float facing=.65+.35*smoothstep(-.28,.25,-d.x);
  float emission=(ring*(1.-horizon)+bent*(1.-horizon)*.6+photon)*facing;
  alpha=max(horizon,min(.9,emission*1.5));
  light=vec3(1.15,.49,.16)*emission+vec3(.45,.45,.64)*photon*.2;
 }
 if(alpha<.001)discard;
 // Normal alpha blending keeps the bounded core dark and avoids screen flashes.
 gl_FragColor=vec4(light/max(.001,alpha),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export function createSkyEvents({ reducedMotion = false } = {}) {
  const state = createSkyEventState({ reducedMotion });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: { clock: { value: 0 }, kind: { value: 0 }, aspect: { value: 1 } },
    vertexShader: 'varying vec2 uvEvent;void main(){uvEvent=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(geometry, material));
  let ready = false;
  return {
    setReducedMotion: (value) => state.setReducedMotion(value),
    select: (next) => state.select(next),
    snapshot: () => state.snapshot(),
    warm: async (renderer) => {
      await renderer.compileAsync(scene, camera);
      ready = true;
    },
    update(delta, aspect) {
      const snapshot = state.update(delta);
      material.uniforms.clock.value = snapshot.elapsed;
      material.uniforms.kind.value = ['meteor', 'supernova', 'blackhole'].indexOf(snapshot.kind) + 1;
      material.uniforms.aspect.value = aspect;
      return snapshot;
    },
    render(renderer) {
      if (!ready || !state.snapshot().kind) return;
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
