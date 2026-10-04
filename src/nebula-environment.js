import * as THREE from 'three';
import fields from './data/nebula-environments.json';

export const nebulaFields = new Map(fields.map((field) => [field.id, field]));

// Catalogue angles/magnitudes are observed. Depth is deliberately reconstructed:
// a cone search establishes the line of sight, not cloud membership.
export function createNebulaEnvironment(group, id) {
  const field = nebulaFields.get(id);
  const positions = [],
    colors = [],
    brightness = [],
    prominence = [];
  for (const star of field.stars) {
    let hash = 0;
    for (const char of star.sourceId) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
    const dx = (((star.raDeg - field.raDeg + 540) % 360) - 180) * Math.cos((field.decDeg * Math.PI) / 180);
    const member = field.trapezium?.find((member) => member.gaiaSourceId === star.sourceId);
    positions.push(
      (-dx / field.fieldRadiusDeg) * 2.1,
      ((star.decDeg - field.decDeg) / field.fieldRadiusDeg) * 2.1,
      member ? 0.22 : ((hash % 10000) / 10000 - 0.5) * 1.72,
    );
    const color = new THREE.Color(
      star.bpRp === null ? '#dae4ef' : star.bpRp < 0.5 ? '#b4d2ff' : star.bpRp < 1.5 ? '#fff1d8' : '#ffc195',
    );
    colors.push(color.r, color.g, color.b);
    // Preserve the observed magnitude ordering, including the much brighter C.
    brightness.push(THREE.MathUtils.clamp(Math.pow(10, -0.15 * (star.magnitude - 10)), 0.12, 6));
    prominence.push(member ? 1 : 0);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('brightness', new THREE.Float32BufferAttribute(brightness, 1));
  geometry.setAttribute('prominence', new THREE.Float32BufferAttribute(prominence, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      fade: { value: 1 },
      dpr: { value: 1 },
      focal: { value: 900 },
      radius: { value: group.scale.y },
      featuredOnly: { value: 0 },
    },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    vertexShader: `attribute float brightness;attribute float prominence;uniform float dpr;uniform float focal;uniform float radius;varying vec3 tint;varying float intensity;varying float featured;
void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
gl_PointSize=dpr*clamp((1.2+brightness)*(1.+prominence*.65)*radius*.012*focal/max(1.,-p.z),2.+prominence*2.,26.+prominence*30.);
tint=color;intensity=clamp(brightness,.12,3.);featured=prominence;}`,
    fragmentShader: `uniform float fade;uniform float featuredOnly;varying vec3 tint;varying float intensity;varying float featured;
void main(){if((featuredOnly>.5&&featured<.5)||(featuredOnly<.5&&featured>.5))discard;
vec2 q=gl_PointCoord-.5;float r=length(q);if(r>.5)discard;
float core=exp(-r*r*(135.+featured*565.));float halo=exp(-r*r*28.)*(.22+featured*.04);
// Restrained telescope PSF, not a physical pulsation or animated flare.
float rays=(exp(-abs(q.x)*190.)+exp(-abs(q.y)*190.))*exp(-r*11.)*featured*.065;
float alpha=fade*min(1.,intensity*(core+halo+rays))*(1.-smoothstep(.38,.5,r));
vec3 emission=mix(tint,vec3(1.),core*.85)*(1.+core*(1.1+featured));
gl_FragColor=vec4(emission,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  const points = new THREE.Points(geometry, material);
  points.name = `${id}-gaia-field-sources`;
  group.add(points);
  // Separate four observed sources from the lower-resolution gas composite.
  // They use the same fixed positions; each star is drawn in exactly one pass.
  const featuredMaterial = material.clone();
  featuredMaterial.uniforms = { ...material.uniforms, featuredOnly: { value: 1 } };
  const featuredPoints = new THREE.Points(geometry, featuredMaterial);
  featuredPoints.name = `${id}-trapezium-bright-sources`;
  featuredPoints.layers.set(2);
  group.add(featuredPoints);
  return {
    count: field.stars.length,
    brightStarCount: prominence.filter(Boolean).length,
    morphology: field.morphology,
    update(camera, dpr, viewportHeight) {
      material.uniforms.dpr.value = dpr;
      material.uniforms.radius.value = group.scale.y;
      const focal = viewportHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
      material.uniforms.focal.value = focal;
      const point = new THREE.Vector3();
      let largest = 0;
      for (let i = 0; i < positions.length; i += 3) {
        point
          .set(positions[i], positions[i + 1], positions[i + 2])
          .applyMatrix4(group.matrixWorld)
          .applyMatrix4(camera.matrixWorldInverse);
        if (point.z < -camera.near)
          largest = Math.max(
            largest,
            THREE.MathUtils.clamp(
              ((1.2 + brightness[i / 3]) * (1 + prominence[i / 3] * 0.65) * group.scale.y * 0.012 * focal) / -point.z,
              2 + prominence[i / 3] * 2,
              26 + prominence[i / 3] * 30,
            ),
          );
      }
      return largest;
    },
    dispose() {
      group.remove(points);
      group.remove(featuredPoints);
      geometry.dispose();
      material.dispose();
      featuredMaterial.dispose();
    },
  };
}
