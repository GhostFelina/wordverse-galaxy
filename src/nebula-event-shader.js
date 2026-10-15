// Local, softly bounded astronomical vignettes; time is artistically compressed.
// Shares band/noise/turbulence helpers with the existing sky shader.
export const NEBULA_EVENT_GLSL = `
 vec2 d=(q-eventPosition)/eventScale;
 mat2 turn=mat2(cos(eventAngle),-sin(eventAngle),sin(eventAngle),cos(eventAngle));
 d=turn*d;
 float r=length(d),a=atan(d.y,d.x),age=clock/eventDuration;
 if(r>.76)discard;
 float cloud=turbulence(d*18.+vec2(clock*.009,-clock*.006));
 float fine=turbulence(d*65.+vec2(clock*.018,clock*.007));
 float folds=sin(a*7.+cloud*5.)*.015+sin(a*19.)*.005;
 float shape=0.,core=0.,dust=0.;
 vec3 cold=vec3(.12,.35,.85),hot=vec3(1.5,.48,.12);
 if(kind==7){ // Protostar: collapsing dusty envelope and embedded hot seed.
  float arms=pow(.5+.5*cos(a*3.+r*45.-clock*.06+cloud*3.),4.);
  shape=exp(-r*10.)*(.12+arms)*(.3+cloud);
  core=exp(-r*r/.0007)*smoothstep(.05,.7,age);
  dust=band(d.y+sin(d.x*10.)*.025,.019)*exp(-abs(d.x)*13.)*.48;
 }else if(kind==8){ // Bipolar Herbig-Haro jet with moving knots.
  float axial=abs(d.y),knot=pow(.5+.5*cos(axial*90.-clock*1.2),10.);
  shape=band(d.x+sin(d.y*12.)*.006,.007+axial*.035)*exp(-axial*5.)*smoothstep(.015,.04,axial)*(.3+knot);
  shape+=band(abs(d.x)-axial*.2,.012)*band(axial-.32,.05)*cloud*.3;
  core=exp(-r*r/.00018);cold=vec3(.12,.5,1.3);
 }else if(kind==9){ // Stellar bow shock: a swept parabolic shock front.
  float curve=d.y+.14-d.x*d.x*3.;
  shape=band(curve+cloud*.022,.012)*exp(-r*3.)*(.35+fine);
  shape+=band(curve+.035,.027)*exp(-r*5.)*cloud*.25;
  core=exp(-dot(d-vec2(0.,-.02),d-vec2(0.,-.02))/.0002);
 }else if(kind==10){ // Advancing ionization front, eroding a dark ridge.
  float front=d.x+.07*sin(d.y*10.)+cloud*.08-mix(-.1,.1,age);
  shape=band(front,.012)*exp(-d.y*d.y*12.)*(.2+fine);
  dust=smoothstep(-.02,.05,front)*(1.-smoothstep(.25,.42,r))*(.2+cloud)*.4;
  cold=vec3(.12,.55,.63);hot=vec3(1.4,.36,.12);
 }else if(kind==11){ // Radiation pressure separates curved dust lanes.
  float wave=d.y+sin(d.x*7.+clock*.035)*.055;
  shape=(band(wave-.10,.025)+band(wave+.07,.018)*.6)*exp(-d.x*d.x*13.)*(.2+fine);
  dust=band(wave,.04)*exp(-r*5.)*.4;
  cold=vec3(.35,.18,.10);hot=vec3(1.2,.65,.25);
 }else if(kind==12){ // Blue reflection light diffuses through drifting dust.
  shape=exp(-dot(d*vec2(2.,1.),d*vec2(2.,1.))*13.)*pow(cloud,2.)*.9;
  shape+=band(d.y-sin(d.x*9.)*.08,.027)*exp(-r*7.)*fine*.25;
  core=exp(-dot(d-vec2(-.08,.03),d-vec2(-.08,.03))/.00015);
  cold=vec3(.08,.26,.75);hot=vec3(.32,.73,1.5);
 }else if(kind==13){ // Molecular-cloud silhouette with a backlit irregular rim.
  float edge=r-(.23+sin(a*3.)*.04+cloud*.055);
  dust=(1.-smoothstep(-.025,.012,edge))*.72;
  shape=band(edge,.012)*(.12+fine)*.48;
  cold=vec3(.12,.1,.18);hot=vec3(.55,.26,.13);
 }else if(kind==14){ // Cometary Bok globule and photoevaporating tail.
  vec2 head=d-vec2(0.,.08);float shell=length(head*vec2(1.4,1.))-.09-cloud*.025;
  dust=(1.-smoothstep(-.008,.015,shell))*.82;
  shape=band(shell,.008)*.65+band(d.x+sin(d.y*17.)*.01,.018+max(0.,-d.y)*.09)*exp(d.y*5.)*step(d.y,0.)*smoothstep(-.4,-.3,d.y)*fine*.4;
 }else if(kind==15){ // Dense sculpted pillar with a luminous evaporating cap.
  float width=.055+.02*sin(d.y*9.)+cloud*.035;
  float edge=abs(d.x+d.y*.25)-width;
  float cap=1.-smoothstep(.13,.20,d.y);
  dust=(1.-smoothstep(-.008,.015,edge))*cap*(1.-smoothstep(.3,.48,r))*.8;
  shape=band(edge,.01)*cap*exp(-r*4.)*(.2+fine)+band(d.y-.16,.012)*band(d.x+.04,.09)*.5;
 }else if(kind==16){ // Expanding wind-blown bubble, broken by dense knots.
  float shell=r-(.22+age*.045)-folds;
  shape=band(shell,.012)*(.12+cloud*cloud)+band(shell+.025,.027)*fine*.15;
  core=exp(-r*r/.00013);cold=vec3(.05,.4,.65);hot=vec3(.4,.8,1.3);
 }else if(kind==17){ // Planetary nebula: equatorial ring and unequal bipolar lobes.
  float ellipse=length(d*vec2(1.7,.9));
  shape=band(ellipse-.21-folds,.018)*(.2+fine);
  shape+=band(length((d-vec2(0.,.16))*vec2(2.,1.))-.13,.016)*cloud*.45;
  shape+=band(length((d+vec2(0.,.14))*vec2(2.2,1.))-.12,.016)*cloud*.4;
  core=exp(-r*r/.0001);cold=vec3(.05,.55,.7);hot=vec3(1.2,.22,.14);
 }else if(kind==18){ // Supernova remnant: broken synchrotron filaments.
  float shell=r-.28-folds*2.;
  float broken=smoothstep(.3,.63,turbulence(vec2(a*3.,r*20.-clock*.015)));
  shape=band(shell,.008+fine*.009)*broken+band(shell+.045,.012)*cloud*.3;
  cold=vec3(.3,.2,.9);hot=vec3(1.5,.3,.07);
 }else if(kind==19){ // Accreting binary: two orbiting sources and a transfer stream.
  vec2 orbit=vec2(cos(clock*.25),sin(clock*.25)*.5)*.13;
  float ra=length(d-orbit),rb=length(d+orbit);
  core=exp(-ra*ra/.00025)+exp(-rb*rb/.00008)*.7;
  shape=band(ra-.05,.008)*(.25+fine)*.4;
  shape+=band(d.y-sin(d.x*17.+clock*.12)*.035,.007)*exp(-r*10.)*.3;
  cold=vec3(.1,.4,1.2);hot=vec3(1.4,.6,.16);
 }else if(kind==20){ // Classical nova: soft rise, cooling ejecta and fading core.
  float expansion=.025+age*.28;
  shape=band(r-expansion-folds,.012+age*.009)*(.2+fine)*.7;
  core=exp(-r*r/(.0004+age*.001))*exp(-age*4.);
  hot=mix(vec3(.6,.8,1.6),vec3(1.4,.24,.08),age);
 }else if(kind==21){ // Light echo: unequal expanding arcs reflected by dust sheets.
  float ring=mod(r-age*.33+.8,.16);
  float sheet=smoothstep(.31,.68,cloud);
  shape=band(ring-.08,.009)*sheet*exp(-r*3.)*.8;
  shape+=exp(-r*r*15.)*fine*.025;
  cold=vec3(.18,.4,.9);hot=vec3(.6,.82,1.4);
 }else if(kind==22){ // Magnetically aligned striations with slow Alfvén-like waves.
  float phase=d.x+sin(d.y*9.-clock*.09)*.028;
  float ridges=pow(.5+.5*sin(phase*140.+cloud*2.),12.);
  shape=ridges*exp(-dot(d*vec2(1.,.7),d*vec2(1.,.7))*20.)*(.12+fine)*.4;
  cold=vec3(.06,.35,.45);hot=vec3(.35,.8,.75);
 }
 float fade=smoothstep(0.,.08,age)*(1.-smoothstep(.83,1.,age));
 float boundary=1.-smoothstep(.57,.74,r);
 light=(mix(cold,hot,fine)*shape+vec3(1.8,1.4,.95)*core)*fade*boundary;
 alpha=min(.86,(shape*.7+core*.8+dust)*fade*boundary);
`;
