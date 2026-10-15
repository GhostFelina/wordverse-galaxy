// Original bounded strong-field illustration. Visual reference:
// NASA SVS13326, Goddard/Jeremy Schnittman. Not a calibrated Kerr solver.
export const BLACK_HOLE_GLSL = `
vec2 d=(q-blackholePosition)/blackholeScale;
float screenRadius=length(d);
if(screenRadius>.9){
 if(inspection>.5){gl_FragColor=vec4(0.,0.,0.,1.);return;}
 discard;
}
vec3 origin=vec3(0.,1.45,9.);
vec3 forward=normalize(-origin),right=vec3(1.,0.,0.),up=normalize(cross(right,forward));
vec3 direction=normalize(forward+right*d.x*.72+up*d.y*.72);
vec3 position=origin,radiance=vec3(0.);float throughput=1.,captured=0.;
float momentum2=dot(cross(position,direction),cross(position,direction));
for(int j=0;j<176;j++){
 float distanceToHole=length(position);
 if(distanceToHole<.505){captured=1.;break;}
 if(distanceToHole>18.)break;
 float stride=clamp(distanceToHole*.058,.016,.32);
 vec3 previous=position;
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
   float angle=atan(hit.z,hit.x),omega=2.65/pow(radius,1.5);
   float phase=angle-clock*omega;
   // Differentially sheared eddies and fine luminous gas lanes.
   vec2 flow=vec2(phase*3.2+log(radius)*2.7,radius*5.5);
   float eddies=turbulence(flow+vec2(sin(phase*2.)*.28,clock*.016));
   float fine=turbulence(flow*3.7+vec2(clock*.08,eddies*.8));
   float streaks=pow(.5+.5*sin(radius*43.+eddies*5.+phase*2.),2.);
   float structure=.24+eddies*.76+fine*.28+streaks*.17;
   float boundary=smoothstep(1.52,1.83,radius)*(1.-smoothstep(3.25,4.5,radius));
   float heat=pow(1.52/radius,.78);
   float beta=sqrt(.25/radius),doppler=1./(1.-beta*cos(angle)*.92);
   float redshift=sqrt(max(.05,1.-.5/radius));
   float temperature=clamp(heat*redshift*doppler,0.,1.25);
   vec3 color=mix(vec3(1.45,.095,.018),vec3(2.3,1.16,.38),smoothstep(.25,.9,temperature));
   color=mix(color,vec3(2.6,2.04,1.22),smoothstep(.9,1.25,temperature)*.48);
   float tau=boundary*(.24+structure*.38)*clamp(.24/max(.08,abs(direction.y)),.65,2.1);
   float opacity=1.-exp(-tau);
   float emission=pow(heat,2.1)*structure*pow(doppler,2.4)*.95;
   radiance+=color*emission*opacity*throughput;
   throughput*=1.-opacity;
  }
 }
}
// Restrained unresolved scattering preserves the dark central shadow.
float skirt=band(d.y+.018,.025+abs(d.x)*.035)*exp(-d.x*d.x/.16)*smoothstep(.205,.235,screenRadius);
float corona=exp(-screenRadius*8.)*smoothstep(.205,.25,screenRadius)*.035;
radiance+=vec3(.66,.20,.035)*(skirt*.06+corona);
#ifdef TONE_MAPPING
radiance=toneMapping(radiance);
#endif
float lensMask=(1.-smoothstep(.5,.9,screenRadius))*backgroundAvailable;
vec2 escaped=vec2(dot(direction,right),dot(direction,up))/max(.12,dot(direction,forward))/.72;
vec2 shift=clamp(escaped-d,vec2(-.65),vec2(.65))*lensMask*envelope;
vec2 warped=(blackholePosition+(d+shift)*blackholeScale)/vec2(aspect,1.)*.5+.5;
vec4 backdrop=texture2D(backgroundImage,clamp(warped,vec2(.001),vec2(.999)));
vec3 backdropColor=backdrop.rgb/max(.00001,backdrop.a);
#ifdef TONE_MAPPING
backdropColor=toneMapping(backdropColor);
#endif
float diskOpacity=clamp(max(radiance.r,max(radiance.g,radiance.b))*1.15,0.,.96);
float cover=max(captured,max(diskOpacity,lensMask*backdrop.a));
// The explicit inspection uses a dark observing backdrop. Keeping a bright
// nearby cloud at full radiance would swamp the thin, lensed accretion flow.
if(inspection>.5){backdropColor*=.0015*(1.-smoothstep(.4,.85,screenRadius));cover=1.;}
light=(radiance+backdropColor*(1.-diskOpacity)*(1.-captured))*cover;
alpha=cover;
`;
