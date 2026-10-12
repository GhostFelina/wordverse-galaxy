import * as THREE from 'three';

export const SKY_EVENTS = Object.freeze({ meteor: 6, supernova: 18, blackhole: 0, kilonova: 22 });

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
                  : 0
            : elapsed,
        reducedMotion,
      };
    },
  };
}

const fragment = `varying vec2 uvEvent;uniform float envelope;uniform float clock;uniform int kind;uniform float aspect;uniform vec2 blackholePosition;uniform float blackholeScale;
float band(float value,float width){return exp(-pow(value/width,2.));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
float turbulence(vec2 p){float sum=0.,weight=.5;mat2 turn=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){sum+=noise(p)*weight;p=turn*p*2.07+3.1;weight*=.5;}return sum;}
void main(){
 vec2 q=(uvEvent-.5)*2.;q.x*=aspect;
 vec3 light=vec3(0.);float alpha=0.;
 if(kind==1){
  float t=clamp((clock-.6)/4.4,0.,1.);
  vec2 head=mix(vec2(-aspect*.64,.62),vec2(aspect*.65,-.08),t);
  vec2 direction=normalize(vec2(aspect*1.29,-.7));vec2 d=q-head;
  float along=dot(d,direction),side=dot(d,vec2(-direction.y,direction.x));
  float ribbon=side+sin(along*26.+clock*.3)*.002*max(0.,-along);
  float tail=band(ribbon,.003+max(0.,-along)*.009)*exp(along*6.)*step(along,0.)*smoothstep(-.8,-.58,along);
  float vapor=band(ribbon,.018+max(0.,-along)*.016)*exp(along*5.)*step(along,0.)*smoothstep(-.9,-.65,along)*.08;
  float core=exp(-dot(d,d)*16000.);float halo=exp(-dot(d,d)*450.)*.12;
  float fade=smoothstep(0.,.13,t)*(1.-smoothstep(.82,1.,t));
  light=mix(vec3(.19,.48,1.2),vec3(3.6,2.2,.85),core)* (tail*.8+core+halo)+vec3(.48,.14,.12)*vapor;
  alpha=min(.92,(tail+core+halo+vapor)*fade);light*=fade;
 }else if(kind==2){
  vec2 d=q-vec2(aspect*.29,.17);float r=length(d);float angle=atan(d.y,d.x);
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
  // A distant accent in the upper sky, with a small apparent angular size.
  vec2 d=(q-blackholePosition)/blackholeScale;float r=length(d);
  if(r>.72)discard;
  float horizon=1.-smoothstep(.105,.112,r);
  float photon=(band(r-.116,.0026)*.24+band(r-.12,.009)*.055)*(.6+.4*smoothstep(.12,-.12,d.x));
  vec2 disk=vec2(d.x,d.y*4.4);float dr=length(disk),da=atan(disk.y,disk.x);
  float eddies=turbulence(vec2(dr*54.,da*9.-clock*.035));
  float streak=.3+.7*pow(.5+.5*sin(dr*230.+eddies*6.-da*2.-clock*.28),2.);
  float ring=band(dr-.23,.11)*smoothstep(.126,.16,dr)*(.4+streak*.6)*(.5+eddies);
  // Polar turbulent emission and a layered bent far-side image. This is an
  // artistic projection, not a gravitational ray tracer or background lens.
  float arc=length(vec2(d.x,d.y*.9-.036));
  float arcNoise=turbulence(vec2(arc*90.,atan(d.y,d.x)*7.-clock*.025));
  float bent=(band(arc-.162,.009)+band(arc-.187,.012)*.33)*smoothstep(-.006,.055,d.y)*(.3+arcNoise);
  float under=band(length(vec2(d.x,d.y*1.6+.018))-.138,.004)*smoothstep(.005,-.04,d.y)*.28;
  float facing=.38+1.2*smoothstep(.32,-.28,d.x);
  float emission=(ring+bent*.95+under)*(1.-horizon)*facing;
  float bloom=(band(dr-.23,.19)*.025+band(arc-.19,.047)*.03)*(.5+eddies)*(1.-horizon);
  float temperature=smoothstep(.12,.4,dr);
  vec3 plasma=mix(vec3(3.1,1.45,.4),vec3(1.25,.22,.026),temperature);
  alpha=max(horizon,min(.97,emission*2.1+photon+bloom));
  light=plasma*emission+vec3(.8,.6,.3)*bent*(1.-horizon)*facing+vec3(2.5,1.3,.48)*photon+vec3(1.1,.25,.065)*bloom;
 }else if(kind==4){
  vec2 d=q-vec2(-aspect*.54,.48);float r=length(d);
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
 }
 alpha*=envelope;light*=envelope;
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
    uniforms: {
      clock: { value: 0 },
      envelope: { value: 1 },
      kind: { value: 0 },
      aspect: { value: 1 },
      blackholePosition: { value: new THREE.Vector2(0.66, 0.4) },
      blackholeScale: { value: 0.48 },
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
  return {
    setReducedMotion: (value) => state.setReducedMotion(value),
    select(next) {
      state.select(next);
      anchored = false;
    },
    snapshot: () => state.snapshot(),
    warm: async (renderer) => {
      await renderer.compileAsync(scene, camera);
      ready = true;
    },
    update(delta, aspect, sceneCamera, envelope = 1) {
      const snapshot = state.update(delta);
      material.uniforms.clock.value = snapshot.elapsed;
      material.uniforms.envelope.value = THREE.MathUtils.clamp(envelope, 0, 1);
      material.uniforms.kind.value = ['meteor', 'supernova', 'blackhole', 'kilonova'].indexOf(snapshot.kind) + 1;
      material.uniforms.aspect.value = aspect;
      if (snapshot.kind === 'blackhole' && sceneCamera) {
        const tangent = Math.tan(THREE.MathUtils.degToRad(sceneCamera.fov / 2));
        if (!anchored) {
          anchor.set(
            sceneCamera.position.x + 18000 * tangent * aspect * 0.66,
            sceneCamera.position.y + 18000 * tangent * 0.4,
            sceneCamera.position.z - 18000,
          );
          anchored = true;
        }
        projected.copy(anchor).project(sceneCamera);
        material.uniforms.blackholePosition.value.set(projected.x * aspect, projected.y);
        material.uniforms.blackholeScale.value = THREE.MathUtils.clamp(
          (0.48 * 18000) / Math.max(100, sceneCamera.position.z - anchor.z),
          0.28,
          0.58,
        );
      } else material.uniforms.blackholePosition.value.set(aspect * 0.66, 0.4);
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
