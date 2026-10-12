// Bounded strong-field ray integration for a thin emissive disk. This is an
// artistic Schwarzschild-like approximation, not a calibrated Kerr solver.
export const BLACK_HOLE_GLSL = `
vec2 d=(q-blackholePosition)/blackholeScale;
float screenRadius=length(d);if(screenRadius>.9)discard;
vec3 origin=vec3(0.,1.65,9.);
vec3 forward=normalize(-origin),right=vec3(1.,0.,0.),up=normalize(cross(right,forward));
vec3 direction=normalize(forward+right*d.x*.72+up*d.y*.72);
vec3 position=origin,radiance=vec3(0.);float throughput=1.,captured=0.;
float momentum2=dot(cross(position,direction),cross(position,direction));
for(int j=0;j<144;j++){
 float distanceToHole=length(position);
 if(distanceToHole<.51){captured=1.;break;}
 if(distanceToHole>18.)break;
 float stride=clamp(distanceToHole*.065,.018,.36);
 vec3 previous=position;
 // The inverse-fifth-power term bends trajectories most strongly near the
 // critical curve. Adaptive integration confines cost to the tiny accent.
 vec3 acceleration=-.75*momentum2*position/pow(max(.5,distanceToHole),5.);
 vec3 midpointDirection=normalize(direction+acceleration*stride*.5);
 vec3 midpoint=position+midpointDirection*stride*.5;
 vec3 midpointAcceleration=-.75*momentum2*midpoint/pow(max(.5,length(midpoint)),5.);
 position+=midpointDirection*stride;
 direction=normalize(direction+midpointAcceleration*stride);
 if(previous.y*position.y<0.){
  vec3 hit=mix(previous,position,previous.y/(previous.y-position.y));
  float radius=length(hit.xz);
  if(radius>1.52&&radius<4.5){
   float angle=atan(hit.z,hit.x),omega=2.8/pow(radius,1.5);
   float phase=angle-clock*omega;
   vec2 eddy=vec2(cos(phase),sin(phase))*(radius*2.2);
   float filaments=turbulence(eddy+vec2(log(radius)*5.,radius*1.2));
   float rings=.92+.08*sin(radius*19.+filaments*3.);
   float boundary=smoothstep(1.52,1.75,radius)*(1.-smoothstep(3.4,4.5,radius));
   float heat=pow(1.52/radius,.75);
   float beta=sqrt(.25/radius),beaming=pow(1./(1.-beta*cos(angle)*.92),2.4);
   vec3 temperature=mix(vec3(1.4,.012,.003),vec3(2.7,.12,.012),heat);
   float emission=boundary*pow(heat,2.)*(.75+filaments*.55)*rings*beaming*1.35;
   radiance+=temperature*emission*throughput;
   throughput*=.56;
  }
 }
}
// Fine critical-curve light complements the integrated back-side disk image.
float critical=band(screenRadius-.202,.0025)*.025;
radiance+=vec3(1.4,.85,.32)*critical;
// A faint unresolved scattering skirt softens the distant disk without filling
// its captured shadow. Its energy stays below the integrated emissive image.
float skirt=band(d.y+.025,.027)*exp(-d.x*d.x/.12)*smoothstep(.20,.24,screenRadius);
radiance+=vec3(.45,.024,.002)*skirt;
#ifdef TONE_MAPPING
radiance=toneMapping(radiance);
#endif
float lensMask=(1.-smoothstep(.5,.9,screenRadius))*backgroundAvailable;
vec2 escaped=vec2(dot(direction,right),dot(direction,up))/max(.12,dot(direction,forward))/.72;
vec2 shift=clamp(escaped-d,vec2(-.65),vec2(.65))*lensMask*envelope;
vec2 warped=(blackholePosition+(d+shift)*blackholeScale)/vec2(aspect,1.)*.5+.5;
vec4 backdrop=texture2D(backgroundImage,clamp(warped,vec2(.001),vec2(.999)));
vec3 backdropColor=backdrop.rgb/max(.00001,backdrop.a);
float diskOpacity=clamp(max(radiance.r,max(radiance.g,radiance.b))*1.4,0.,.92);
float cover=max(captured,max(diskOpacity,lensMask*backdrop.a));
light=(radiance+backdropColor*(1.-diskOpacity)*(1.-captured))*cover;
alpha=cover;
`;
