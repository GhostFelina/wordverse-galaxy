import * as THREE from 'three';

// Original procedural surfaces. These are artistic bodies, not observed photos.
const noise = `
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .55*noise3(p)+.27*noise3(p*2.03+7.)+.12*noise3(p*4.11)+.06*noise3(p*8.19);}`;
const vertex = `varying vec3 local;varying vec3 worldNormal;varying vec3 worldPosition;
void main(){local=position;worldNormal=normalize(mat3(modelMatrix)*normal);
worldPosition=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPosition,1.);}`;

export function createPremiumBodies(scene, options = {}) {
  const root = new THREE.Group();
  root.name = 'ephemeral-showcase-bodies';
  const geometry = options.geometry ?? new THREE.SphereGeometry(1, 64, 40);
  const stellar = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      detailBlend: { value: 1 },
      tint: { value: new THREE.Color(options.color ?? '#ffffff') },
      seed: { value: options.seed ?? 0 },
    },
    vertexShader: vertex,
    transparent: true,
    fragmentShader: `uniform float time;uniform float detailBlend;uniform vec3 tint;uniform float seed;varying vec3 local;varying vec3 worldNormal;varying vec3 worldPosition;${noise}
void main(){vec3 n=normalize(local);vec3 eye=normalize(cameraPosition-worldPosition);
 float mu=max(0.,dot(normalize(worldNormal),eye));float limb=.08+.92*pow(mu,.7);
 float cells=noise3(n*85.+vec3(time*.013,seed,0));float granulation=.7+.3*smoothstep(.18,.72,cells);
 float activity=fbm(n*8.+vec3(0,time*.006,0));float spots=1.-.45*smoothstep(.63,.76,activity);
 vec3 color=mix(vec3(1.8,.45,.045),vec3(2.8,1.25,.32),granulation)*limb*spots*tint;
 gl_FragColor=vec4(color,detailBlend);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`,
  });
  const star = new THREE.Mesh(geometry, stellar);
  star.name = 'showcase-star-surface';
  star.position.set(-18, 9, -18);
  star.scale.setScalar(10);
  root.add(star);
  const coronaMaterial = new THREE.ShaderMaterial({
    uniforms: { time: stellar.uniforms.time, detailBlend: stellar.uniforms.detailBlend },
    vertexShader: vertex,
    fragmentShader: `uniform float time;uniform float detailBlend;varying vec3 local;varying vec3 worldNormal;varying vec3 worldPosition;${noise}
void main(){float facing=abs(dot(normalize(worldNormal),normalize(cameraPosition-worldPosition)));
 float irregular=.35+.65*fbm(normalize(local)*9.+vec3(0,time*.008,0));
 float alpha=pow(1.-facing,3.)*facing*.28*irregular*detailBlend;gl_FragColor=vec4(vec3(1.9,.6,.1),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
  const corona = new THREE.Mesh(geometry, coronaMaterial);
  corona.position.copy(star.position);
  corona.scale.setScalar(10.7);
  root.add(corona);
  const palettes = {
    mercury: ['#55504a', '#a79e8c', 0],
    venus: ['#a96b28', '#ead099', 0],
    earth: ['#124b5c', '#506b36', 1],
    mars: ['#6e291b', '#bc6e42', 0],
    jupiter: ['#765642', '#d8c5a1', 2],
    saturn: ['#968158', '#dfd3a8', 2],
    uranus: ['#326f7b', '#96c9cb', 2],
    neptune: ['#183764', '#4b85be', 2],
  };
  const palette = palettes[options.planetType] ?? ['#124b5c', '#506b36', 1];
  const planetMaterial = new THREE.ShaderMaterial({
    uniforms: {
      lightPosition: { value: star.position.clone() },
      detailBlend: { value: 1 },
      seed: { value: options.seed ?? 0 },
      surface: { value: palette[2] },
      lowColor: { value: new THREE.Color(palette[0]) },
      highColor: { value: new THREE.Color(palette[1]) },
    },
    transparent: true,
    vertexShader: vertex,
    fragmentShader: `uniform vec3 lightPosition;uniform float detailBlend;uniform float seed;uniform float surface;uniform vec3 lowColor;uniform vec3 highColor;varying vec3 local;varying vec3 worldNormal;varying vec3 worldPosition;${noise}
void main(){vec3 p=normalize(local);float bands=fbm(p*9.+vec3(3.,7.+seed,1.));float detail=fbm(p*65.+seed);
 float continent=smoothstep(.47,.58,bands);
 float pattern=surface>1.5 ? .5+.5*sin(p.y*38.+bands*5.) : (surface>.5 ? continent : bands);
 vec3 albedo=mix(lowColor,highColor,pattern)*(.8+.2*detail);
 float clouds=smoothstep(.53,.7,fbm(p*17.+vec3(8,seed,0)));
 if(surface>.5 && surface<1.5) albedo=mix(albedo,vec3(.62,.66,.63),clouds*.65);
 float day=max(0.,dot(normalize(worldNormal),normalize(lightPosition-worldPosition)));
 vec3 color=albedo*(.015+2.3*day);gl_FragColor=vec4(color,detailBlend);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`,
  });
  const planet = new THREE.Mesh(geometry, planetMaterial);
  planet.name = 'showcase-planet-terminator';
  planet.position.set(21, -5, 3);
  planet.scale.setScalar(8);
  root.add(planet);
  // Fixed small CSS-pixel impostors keep subpixel bodies legible without large halos.
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
  const makePoint = (body, color, size) => {
    const material = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(color) }, alpha: { value: 0 }, size: { value: size } },
      vertexShader:
        'uniform float size;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size;}',
      fragmentShader: `uniform vec3 color;uniform float alpha;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;gl_FragColor=vec4(color,alpha*(1.-smoothstep(.15,.5,r)));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
      transparent: true,
      depthWrite: false,
    });
    const point = new THREE.Points(pointGeometry, material);
    point.name = `${body.name}-distant-point`;
    point.position.copy(body.position);
    root.add(point);
    return { body, point, size };
  };
  let distant = [makePoint(star, options.color ?? '#ffd3a0', 2.2), makePoint(planet, '#a3b3bb', 1.8)];
  const starPointMaterial = distant[0].point.material;
  const planetPointMaterial = distant[1].point.material;
  if (options.kind) {
    root.name = 'personal-premium-body';
    const isStar = options.kind === 'star';
    const body = isStar ? star : planet;
    body.position.set(0, 0, 0);
    body.scale.setScalar(options.radius ?? 2.35);
    corona.position.copy(star.position);
    corona.scale.setScalar(body.scale.x * 1.07);
    const removed = distant.find(({ body: candidate }) => candidate !== body);
    root.remove(removed.body, removed.point);
    if (!isStar) root.remove(corona);
    distant = distant.filter(({ body: candidate }) => candidate === body);
    distant[0].point.position.copy(body.position);
    planetMaterial.uniforms.lightPosition.value.set(15, 30, 80);
  }
  const viewPosition = new THREE.Vector3();
  scene.add(root);
  let disposed = false;
  return {
    root,
    star,
    planet,
    visibleDetailCount: () => distant.filter(({ body }) => body.visible).length,
    visiblePointCount: () => distant.filter(({ point }) => point.visible).length,
    update(seconds, camera, viewportHeight = 1080, pixelRatio = 1) {
      if (disposed) return;
      stellar.uniforms.time.value = seconds;
      planet.rotation.y = seconds * 0.025;
      if (camera) {
        camera.updateMatrixWorld();
        root.updateMatrixWorld(true);
        for (const { body, point, size } of distant) {
          body.getWorldPosition(viewPosition).applyMatrix4(camera.matrixWorldInverse);
          const diameter =
            viewPosition.z < 0
              ? (body.scale.x * viewportHeight * camera.projectionMatrix.elements[5]) / -viewPosition.z
              : 0;
          const blend = THREE.MathUtils.smoothstep(diameter, 2, 7);
          body.material.uniforms.detailBlend.value = blend;
          body.material.depthWrite = blend === 1;
          body.visible = blend > 0;
          point.material.uniforms.alpha.value = 1 - blend;
          point.material.uniforms.size.value = size * pixelRatio;
          point.visible = viewPosition.z < 0 && blend < 1;
        }
        corona.visible = options.kind !== 'planet' && star.visible;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(root);
      if (!options.geometry) geometry.dispose();
      stellar.dispose();
      coronaMaterial.dispose();
      planetMaterial.dispose();
      pointGeometry.dispose();
      // Removed impostors still own materials; release both, including single-body adapters.
      starPointMaterial.dispose();
      planetPointMaterial.dispose();
    },
  };
}
