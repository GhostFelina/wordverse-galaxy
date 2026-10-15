import * as THREE from 'three';

// One bounded, original gas volume. Source identity is real; gas shape is artistic.
export function createNebulaVolume(scene) {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: { eye: { value: new THREE.Vector3() }, kind: { value: 0 }, seed: { value: 0 } },
    vertexShader: `varying vec3 localPosition; void main(){localPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform vec3 eye; uniform float kind; uniform float seed; varying vec3 localPosition;
      float hash(vec3 p){p=fract((p+seed*.01)*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float fbm(vec3 p){return .57*noise(p)+.28*noise(p*2.03+7.1)+.15*noise(p*4.11+13.7);}
      void main(){
        vec3 ray=normalize(localPosition-eye);vec3 safe=sign(ray+vec3(.000001))*max(abs(ray),vec3(.000001));
        vec3 a=(-vec3(1.0)-eye)/safe,b=(vec3(1.0)-eye)/safe;
        vec3 low=min(a,b),high=max(a,b);float start=max(0.0,max(low.x,max(low.y,low.z))),end=min(high.x,min(high.y,high.z));
        if(end<=start)discard;float stepSize=(end-start)/12.0;vec4 accumulated=vec4(0.0);
        for(int i=0;i<12;i++){
          vec3 p=eye+ray*(start+(float(i)+.5)*stepSize);float edge=1.0-smoothstep(.72,1.0,length(p*vec3(.9,1.05,.9)));
          float turbulent=fbm(p*4.3);float fine=fbm(p*12.0);float density=edge*max(0.0,turbulent-.28)*1.35;
          if(kind>0.5&&kind<1.5){float shell=exp(-pow((length(p*vec3(1.0,1.15,1.1))-.58)/.11,2.0));density=shell*(.3+.7*fine)*.9;}
          if(kind>1.5&&kind<2.5)density=edge*pow(1.0-abs(fine*2.0-1.0),7.0)*.65;
          float dust=smoothstep(.45,.7,fbm(p*7.0+vec3(8.0,2.0,3.0)));density*=1.0-.72*dust;
          vec3 cool=vec3(.15,.36,.58),warm=vec3(.67,.3,.2);
          vec3 color=mix(cool,warm,smoothstep(.32,.72,turbulent));
          if(kind>2.5)color=mix(vec3(.12,.25,.45),vec3(.42,.63,.76),fine);
          float alpha=1.0-exp(-density*stepSize*2.7);
          accumulated.rgb+=(1.0-accumulated.a)*color*alpha;accumulated.a+=(1.0-accumulated.a)*alpha;
        }
        if(accumulated.a<.004)discard;gl_FragColor=vec4(accumulated.rgb/max(.001,accumulated.a),accumulated.a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  mesh.name = 'near-nebula-gas-volume';
  scene.add(mesh);
  let active = null;
  return {
    clear() {
      active = null;
      mesh.visible = false;
    },
    focus(record) {
      active = record;
      mesh.position.fromArray(record.scenePosition);
      const size = 32 + Math.min(64, Math.sqrt(record.majorArcmin ?? 3) * 7);
      mesh.scale.set(size, size * 0.85, size * 0.65);
      material.uniforms.kind.value =
        record.kind === 'planetary'
          ? 1
          : record.kind === 'supernova-remnant'
            ? 2
            : record.kind === 'reflection'
              ? 3
              : 0;
      material.uniforms.seed.value = record.seed;
    },
    update(camera) {
      mesh.visible = !!active && camera.position.distanceTo(mesh.position) < 400;
      if (mesh.visible) material.uniforms.eye.value.copy(camera.position).sub(mesh.position).divide(mesh.scale);
      return mesh.visible;
    },
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}
