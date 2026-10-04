import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import images from './data/nebula-images.json';
import { layoutNebulae, ORION_DEPTH_SCALE, ORION_PRINCIPAL_Z } from './nebula-layout.js';
import { createNebulaEnvironment } from './nebula-environment.js';

// A deterministic, coherent density field, sampled on the GPU instead of
// repeatedly evaluating expensive procedural octaves for every ray step.
function createDensityTexture() {
  const size = 96,
    data = new Uint8Array(size ** 3),
    noise = new ImprovedNoise();
  // A closed coordinate loop makes each axis periodic. RepeatWrapping on
  // ordinary nonperiodic noise exposed straight seams through the gas.
  const sine = Array.from({ length: size }, (_, i) => Math.sin((i / size) * Math.PI * 2));
  const cosine = Array.from({ length: size }, (_, i) => Math.cos((i / size) * Math.PI * 2));
  let index = 0;
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const px = sine[x] + cosine[y],
          py = sine[y] + cosine[z],
          pz = sine[z] + cosine[x];
        const a = noise.noise(px * 0.73 + 19.4, py * 0.73 + 7.1, pz * 0.73 + 31.8);
        const b = noise.noise(px * 2.04 + 8.7, py * 2.04 + 42.6, pz * 2.04 + 3.2);
        data[index++] = Math.round(THREE.MathUtils.clamp(0.5 + a * 0.65 + b * 0.23, 0, 1) * 255);
      }
  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RedFormat;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = texture.wrapR = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
const vertex = `varying vec3 localPosition;
void main(){localPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment = `precision highp sampler3D;
uniform sampler2D image;uniform sampler2D infrared;uniform sampler3D densityMap;
uniform vec3 eye;uniform float time;uniform int steps;uniform float opticalLod;uniform float infraredLod;uniform float principalZ;varying vec3 localPosition;
float cloud(vec3 p){return texture(densityMap,p*.36+vec3(.17,.31,.53)).r;}
float erfApprox(float v){float v2=v*v;return sign(v)*sqrt(max(0.,1.-exp(-v2*(1.2732395+.147*v2)/(1.+.147*v2))));}
void main(){
 vec3 ray=normalize(localPosition-eye);
 vec3 safe=sign(ray+vec3(.000001))*max(abs(ray),vec3(.000001));
 vec3 a=(-vec3(1.)-eye)/safe,b=(vec3(1.)-eye)/safe;
 vec3 low=min(a,b),high=max(a,b);
 float start=max(0.,max(low.x,max(low.y,low.z))),end=min(high.x,min(high.y,high.z));
 if(end<=start)discard;
 float stride=(end-start)/float(steps);
 // Stable midpoint sampling avoids visible screen-space grain inside thin walls.
 float jitter=.5;
 // Sample telescope guidance once at the principal ionization surface rather
 // than stretching every photographed feature through the entire ray.
 float guideDistance=(principalZ-eye.z)/safe.z;
 vec3 guidePosition=guideDistance>0. ? eye+ray*guideDistance : vec3(0.);
 vec2 uv=clamp(guidePosition.xy*.5+.5,vec2(.001),vec2(.999));
 vec3 observed=textureLod(image,uv,opticalLod).rgb;
 vec3 diffuse=textureLod(image,uv,opticalLod+4.).rgb;
 float sharpLum=max(observed.r,max(observed.g,observed.b));
 float lum=max(diffuse.r,max(diffuse.g,diffuse.b));
 float saturation=sharpLum-min(observed.r,min(observed.g,observed.b));
 float stellarPeak=smoothstep(.06,.25,sharpLum-lum)*(1.-smoothstep(.07,.3,saturation));
 observed=mix(observed,diffuse,stellarPeak);
 vec3 macroColor=mix(textureLod(image,uv,opticalLod+8.).rgb,textureLod(infrared,uv,infraredLod+7.).rgb,.16);
 vec4 sum=vec4(0.);
 for(int i=0;i<48;i++){
  if(i>=steps)break;
  vec3 p=eye+ray*(start+(float(i)+jitter)*stride);
  float n=cloud(p*1.6+vec3(time*.0006,.008*sin(time*.035),time*.00025));
  float fine=cloud(p*4.8+vec3(5.3,1.7,9.));
  float feather=1.-smoothstep(.72,1.,length(p.xy)+.05*(n-.5));
  feather*=1.-smoothstep(.87,1.,abs(p.z));
  // Open cavity facing the observer; ionization wall and dusty back layer.

  float filament=pow(1.-abs(fine*2.-1.),2.);
  float valley=-.42+.34*pow(p.x+.18*sin(p.z*2.),2.)+.16*p.z+.12*sin(p.z*3.+p.x*2.)+.22*(n-.5)+.08*(fine-.5);
  float wall=exp(-pow((p.y-valley)/.12,2.));
  float folds=exp(-pow((p.y-valley-.08*sin(p.z*5.+p.x*3.)-.15)/.10,2.))*.26;
  float skirt=exp(-pow((p.y-valley+.08)/.18,2.))*.08;
  float veil=exp(-pow((p.y-.48-.05*sin(p.z*3.))/ .12,2.))*.016;
  // Keep telescope detail aligned in XY; projecting a photo onto XZ produced
  // stretched radial streaks along the long flight walls.
  // The deep medium uses diffuse colour, avoiding extrusion of photographed
  // stars into long rays. Observed fine detail belongs to the ionization ridge.
  float warm=smoothstep(-.8,.8,p.x+.45*p.z+(.5-n)*.4);
  vec3 gasColor=mix(macroColor,mix(vec3(.19,.16,.29),vec3(.48,.23,.16),warm),.38);
  float gas=smoothstep(.006,.24,max(gasColor.r,max(gasColor.g,gasColor.b)))*feather;
  gas*=(wall*1.2+folds+skirt+veil)*(.25+1.1*n*n)*(.5+.7*filament);
  float dust=smoothstep(.48,.7,cloud(p*3.9+vec3(7.,3.,2.)))*(1.-smoothstep(.04,.2,lum));
  float offset=p.z-principalZ;
  float halfStep=abs(ray.z*stride)*.5;
  float ridge=0.;
  if(abs(offset)<.22+halfStep){
    ridge=halfStep>.0001 ? .055*.8862269*(erfApprox((offset+halfStep)/.055)-erfApprox((offset-halfStep)/.055))/(2.*halfStep) : exp(-pow(offset/.055,2.));
  }
  float backing=ridge*smoothstep(.006,.23,max(observed.r,max(observed.g,observed.b)))*feather;
  float opening=(1.-smoothstep(.25,.65,abs(p.x)))*smoothstep(valley+.1,valley+.3,p.y);
  backing*=1.-opening;
  gas+=backing*2.5;
  gasColor=mix(gasColor,observed,clamp(backing*2.5/(gas+.001),0.,1.));
  float extinction=gas*(2.5+dust*2.2);
  float opacity=1.-exp(-extinction*stride);
  vec3 tint=mix(gasColor,gasColor*vec3(1.1,.89,.8),(1.-smoothstep(-.7,.4,p.z))*.2);
  float scatter=clamp(.85+(cloud(p*1.6+vec3(0.,.12,.04))-n)*2.5,.55,1.15);
  vec3 light=tint*(3.1+wall*.3)*scatter*(1.-dust*.6);
  sum.rgb+=(1.-sum.a)*light*opacity;
  sum.a+=(1.-sum.a)*opacity;
  if(sum.a>.985)break;
 }
 if(sum.a<.001)discard;
 gl_FragColor=vec4(sum.rgb/max(.001,sum.a),sum.a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export function createNebulaSystem(
  scene,
  camera,
  { loader = new THREE.TextureLoader(), compact = false, fieldStars = true } = {},
) {
  const records = layoutNebulae(images, 8042026, camera.aspect);
  const geometry = new THREE.BoxGeometry(2, 2, 2),
    density = createDensityTexture();
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
  let highResolutionState = 'idle';
  let shaderState = 'idle';
  let gasScale = 0.55,
    lastGasFrame = 0,
    slowGasFrames = 0,
    fastGasFrames = 0;
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
    const texture = loader.load(compact ? record.texture : record.gasTexture.texture, ready);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 1;
    const infrared = loader.load(record.infrared.texture, ready);
    infrared.colorSpace = THREE.SRGBColorSpace;
    infrared.anisotropy = 1;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        image: { value: texture },
        infrared: { value: infrared },
        densityMap: { value: density },
        eye: { value: new THREE.Vector3() },
        time: { value: 0 },
        steps: { value: 48 },
        opticalLod: { value: 0 },
        infraredLod: { value: 0 },
        principalZ: { value: ORION_PRINCIPAL_Z },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
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
  const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const compositeScene = new THREE.Scene(),
    compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const compositeMaterial = new THREE.ShaderMaterial({
    uniforms: { image: { value: target.texture } },
    vertexShader: 'varying vec2 imageUv;void main(){imageUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `uniform sampler2D image;varying vec2 imageUv;void main(){gl_FragColor=texture2D(image,imageUv);
    gl_FragColor.rgb/=max(.00001,gl_FragColor.a);
    #include <colorspace_fragment>
    gl_FragColor.rgb*=gl_FragColor.a;
    }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    premultipliedAlpha: true,
  });
  const compositeGeometry = new THREE.PlaneGeometry(2, 2);
  compositeScene.add(new THREE.Mesh(compositeGeometry, compositeMaterial));
  const savedColor = new THREE.Color(),
    size = new THREE.Vector2();
  return {
    records,
    get ready() {
      return shaderState === 'ready';
    },
    get refined() {
      return refinedFrame;
    },
    get gasResolution() {
      return [target.width, target.height];
    },
    render(renderer) {
      if (disposed) return;
      if (shaderState === 'idle') {
        shaderState = 'compiling';
        const mask = camera.layers.mask;
        camera.layers.set(1);
        camera.layers.enable(2);
        renderer
          .compileAsync(scene, camera)
          .then(() => {
            if (!disposed) shaderState = 'ready';
          })
          .catch(() => {
            if (!disposed) shaderState = 'failed';
          });
        camera.layers.mask = mask;
        return;
      }
      if (shaderState !== 'ready') return;
      // Adapt the expensive volume independently from crisp stars and UI.
      // Respond quickly to software GPUs; restore detail on measured fast devices.
      const now = performance.now(),
        elapsed = lastGasFrame ? now - lastGasFrame : 0;
      lastGasFrame = now;
      slowGasFrames = elapsed > 120 ? slowGasFrames + 1 : 0;
      fastGasFrames = elapsed > 0 && elapsed < 24 ? fastGasFrames + 1 : 0;
      if (slowGasFrames >= 2) {
        gasScale = Math.max(0.25, gasScale * 0.65);
        slowGasFrames = 0;
      }
      if (fastGasFrames >= 180) {
        gasScale = Math.min(1, gasScale + 0.1);
        fastGasFrames = 0;
      }
      // Use velocity, not per-frame distance: a software GPU's longer frames
      // must not postpone refinement after the same camera gesture.
      const moved = camera.matrixWorld.elements.some(
        (value, i) =>
          Math.abs(value - lastGasView.elements[i]) / Math.max(16, elapsed) > (i >= 12 && i <= 14 ? 0.003 : 0.00001),
      );
      if (moved) lastCameraMotion = now;
      lastGasView.copy(camera.matrixWorld);
      const resting = now - lastCameraMotion > 250;
      for (const node of nodes) {
        if (resting) node.material.uniforms.steps.value = 32;
        else if (gasScale < 0.4) node.material.uniforms.steps.value = 16;
      }
      renderer.getSize(size);
      // Refine a settled camera to viewport resolution. Cache that detailed
      // volume between slow gas updates; stars and UI remain separate passes.
      const width = Math.min(
        1920,
        Math.round(size.x * (resting ? 1 : Math.min(renderer.getPixelRatio(), 1) * gasScale)),
      );
      const height = Math.max(1, Math.round((width * size.y) / size.x));
      const opticalWidth = highResolutionState === 'ready' ? 8192 : compact ? 2048 : 4096;
      // Implicit derivatives are undefined in a ray loop with divergent exits.
      // Choose mip footprints explicitly, retaining finer detail inside the gas.
      for (const node of nodes) {
        const footprint = THREE.MathUtils.clamp(node.material.uniforms.eye.value.length() / 3, 0.15, 1);
        node.material.uniforms.opticalLod.value = Math.max(0, Math.log2((opticalWidth * footprint) / width));
        node.material.uniforms.infraredLod.value = Math.max(0, Math.log2((2048 * footprint) / width));
      }
      const resized = target.width !== width || target.height !== height;
      if (resized) target.setSize(width, height);
      renderer.getClearColor(savedColor);
      const alpha = renderer.getClearAlpha(),
        mask = camera.layers.mask;
      const previous = renderer.getRenderTarget();
      const animated = nodes.some((node) => node.material.uniforms.time.value !== 0);
      if (
        !resting ||
        resized ||
        !lastVolumeFrame ||
        loaded !== lastLoaded ||
        opticalWidth !== lastOpticalWidth ||
        // Full-resolution raymarch advection is too costly on software GPUs.
        // Keep the refined frame there; navigation and stars remain responsive.
        (animated && gasScale >= 0.65 && now - lastVolumeFrame > 250)
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
      camera.layers.set(2);
      renderer.clearDepth();
      renderer.render(scene, camera);
      camera.layers.mask = mask;
      renderer.autoClear = autoClear;
    },
    get textureResolution() {
      return highResolutionState === 'ready' ? 8192 : compact ? 2048 : 4096;
    },
    requestHighResolution(renderer) {
      if (highResolutionState !== 'idle') return;
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
          node.material.uniforms.image.value = texture;
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
    get loaded() {
      return loaded;
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
      density.dispose();
      target.dispose();
      compositeGeometry.dispose();
      compositeMaterial.dispose();
    },
  };
}
