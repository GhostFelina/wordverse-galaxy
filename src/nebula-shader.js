export const nebulaVertex = `varying vec3 localPosition;
void main(){localPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

export const nebulaFragment = `precision highp sampler3D;
uniform sampler2D image;uniform sampler3D densityMap;uniform sampler3D detailMap;
uniform vec3 eye;uniform float time;uniform int steps;uniform float opticalLod;uniform float principalZ;uniform float stellarSuppression;uniform float gasDensity;uniform float gasLight;uniform float encodedHdr;
uniform float ionVeil;uniform float guideEnabled;
uniform vec3 gasCool;uniform vec3 gasWarm;uniform float gasGlow;
varying vec3 localPosition;
void main(){
 vec3 ray=normalize(localPosition-eye);
 vec3 safe=sign(ray+vec3(.000001))*max(abs(ray),vec3(.000001));
 vec3 a=(-vec3(1.)-eye)/safe,b=(vec3(1.)-eye)/safe;
 vec3 low=min(a,b),high=max(a,b);
 float start=max(0.,max(low.x,max(low.y,low.z))),end=min(high.x,min(high.y,high.z));
 if(end<=start)discard;
 vec3 metric=vec3(1.,1.,3.6);
 float stride=8./float(steps)/length(ray*metric);
 float jitter=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
 float guideDistance=(principalZ-eye.z)/safe.z;
 vec3 guidePosition=eye+ray*max(0.,guideDistance);
 vec2 uv=clamp(guidePosition.xy*.5+.5,vec2(.001),vec2(.999));
 float guideCoverage=(1.-smoothstep(.84,1.,max(abs(guidePosition.x),abs(guidePosition.y))))*step(0.,guideDistance)*guideEnabled;
 vec3 observed=textureLod(image,uv,opticalLod).rgb;
 vec3 diffuse=textureLod(image,uv,opticalLod+4.).rgb;
 float peak=smoothstep(.025,.14,max(observed.r,max(observed.g,observed.b))-max(diffuse.r,max(diffuse.g,diffuse.b)));
 observed=mix(observed,diffuse,peak*stellarSuppression);
 // The reference contributes a feathered front emission layer, never a wall
 // projected down the full flight. The finite volume provides interior color.
 float immersion=1.-smoothstep(principalZ+.025,1.12,eye.z);
 float detailLod=clamp(log2(max(1.,stride*length(ray*metric)*64.*.6))-2.,0.,1.1);
 float densityLod=max(0.,log2(max(1.,stride*64.))-.6);
 vec4 sum=vec4(0.);
 for(int i=0;i<192;i++){
  float distance=start+(float(i)+.5+.025*(jitter-.5))*stride;
  if(distance>end)break;
  vec3 p=eye+ray*distance;
  vec3 advection=vec3(sin(time*.018)*.002,time*.00022,sin(time*.013)*.0009);
  if(ionVeil>.5)advection=vec3(sin(time*.075+p.z*2.8)*.009,sin(time*.055+p.x*3.)*.008,sin(time*.04)*.003);
  vec4 field=textureLod(densityMap,clamp(p*.5+.5+advection,vec3(0.),vec3(1.)),densityLod);
  if(field.r<.025 && (immersion>.99 || guideCoverage<.01 || abs(p.z-principalZ)>.16))continue;
  vec3 detailUV=(p*metric)*1.3+vec3(.17,.31,.53)+advection;
  float detail=textureLod(detailMap,detailUV,detailLod).r;
  float filament=0.;
  if(ionVeil>.5){
   float fine=textureLod(detailMap,detailUV*2.7+vec3(.31,.17,.73),detailLod).r;
   filament=pow(clamp(1.-abs(fine-.52)*3.4,0.,1.),3.);
   detail=mix(detail,fine,.22);
  }
  float erosion=.035+1.8*pow(smoothstep(.3,.72,detail),2.);
  if(ionVeil>.5)erosion=.14+1.8*pow(smoothstep(.28,.76,detail),1.7)+filament*.2;
  float density=field.r*field.r*2.5*erosion;
  float dust=field.b;
  float warm=field.a;
  vec3 color=mix(gasCool,gasWarm,warm);
  color=mix(color,vec3(.36,.22,.32),smoothstep(.32,.75,detail)*.2);
  if(ionVeil>.5){
   color=mix(gasCool,gasWarm,smoothstep(.35,.93,warm));
   vec3 rim=ionVeil>3.5?mix(gasCool,gasWarm,.6)*1.5:ionVeil<1.5?vec3(.43,.61,.59):ionVeil<2.5?vec3(1.1,.52,.15):vec3(.32,.66,1.);
   color=mix(color,rim,smoothstep(.58,.83,detail)*filament*.32);
  }
  float lighting=.16+field.g*.84;
  float ridge=abs(p.z-principalZ)<.16 ? exp(-pow((p.z-principalZ)/.05,2.)) : 0.;
  float photo=ridge*guideCoverage*(1.-immersion)*1.45;
  float photoLum=max(observed.r,max(observed.g,observed.b));
  photo*=smoothstep(.008,.18,photoLum);
  float total=(density+photo)*gasDensity;
  // Colored dust absorbs the far side; open pores retain black space.
  float opacity=1.-exp(-total*(2.2+dust*1.7)*stride*length(ray*metric));
  vec3 photoColor=mix(vec3(dot(observed,vec3(.2126,.7152,.0722))),observed,.76);
  vec3 emission=mix(color*(1.6+field.g*.9)*lighting*(1.-dust*.58),photoColor*2.7,photo/max(.0001,density+photo))*gasLight;
  emission*=gasGlow;
  if(ionVeil>.5)emission*=.8+filament*.55;
  sum.rgb+=(1.-sum.a)*emission*opacity;
  sum.a+=(1.-sum.a)*opacity;
  if(sum.a>.985)break;
 }
 if(sum.a<.001)discard;
 gl_FragColor=vec4(sum.rgb/max(.001,sum.a),sum.a);
 if(encodedHdr>.5)gl_FragColor.rgb/=1.+gl_FragColor.rgb;
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
