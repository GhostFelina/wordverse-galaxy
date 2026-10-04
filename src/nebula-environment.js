import * as THREE from 'three';
import fields from './data/nebula-environments.json';

export const nebulaFields = new Map(fields.map((field) => [field.id, field]));

// Catalogue angles/magnitudes are observed. Depth is deliberately reconstructed:
// a cone search establishes the line of sight, not cloud membership.
export function createNebulaEnvironment(group, id) {
  const field = nebulaFields.get(id);
  const positions = [],
    colors = [],
    brightness = [];
  for (const star of field.stars) {
    let hash = 0;
    for (const char of star.sourceId) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
    const dx = (((star.raDeg - field.raDeg + 540) % 360) - 180) * Math.cos((field.decDeg * Math.PI) / 180);
    positions.push(
      (-dx / field.fieldRadiusDeg) * 2.1,
      ((star.decDeg - field.decDeg) / field.fieldRadiusDeg) * 2.1,
      field.trapezium?.some((member) => member.gaiaSourceId === star.sourceId) ? 0 : ((hash % 10000) / 10000 - 0.5) * 5,
    );
    const color = new THREE.Color(
      star.bpRp === null ? '#dae4ef' : star.bpRp < 0.5 ? '#b4d2ff' : star.bpRp < 1.5 ? '#fff1d8' : '#ffc195',
    );
    colors.push(color.r, color.g, color.b);
    brightness.push(THREE.MathUtils.clamp(Math.pow(10, -0.15 * (star.magnitude - 10)), 0.12, 2));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('brightness', new THREE.Float32BufferAttribute(brightness, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { fade: { value: 1 }, dpr: { value: 1 }, focal: { value: 900 }, radius: { value: group.scale.y } },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    vertexShader: `attribute float brightness;uniform float dpr;uniform float focal;uniform float radius;varying vec3 tint;varying float intensity;
void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
gl_PointSize=dpr*clamp((1.2+brightness)*radius*.009*focal/max(1.,-p.z),1.5,18.);tint=color;intensity=clamp(brightness,.12,1.);}`,
    fragmentShader: `uniform float fade;varying vec3 tint;varying float intensity;
void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;
float core=exp(-r*r*85.);float halo=exp(-r*r*18.)*.26;
gl_FragColor=vec4(tint*(1.+core*.8),fade*intensity*min(1.,core+halo));
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  const points = new THREE.Points(geometry, material);
  points.name = `${id}-gaia-field-sources`;
  group.add(points);
  return {
    count: field.stars.length,
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
            THREE.MathUtils.clamp(((1.2 + brightness[i / 3]) * group.scale.y * 0.009 * focal) / -point.z, 1.5, 18),
          );
      }
      return largest;
    },
    dispose() {
      group.remove(points);
      geometry.dispose();
      material.dispose();
    },
  };
}
