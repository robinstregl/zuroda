// ===================================================================
// Look H (Robin 22. 11.): the whole game redone in one style – sun-bleached haze, thin warm ink, soft hatching.
// Models here replace the old ones only when the 'sun' style is on (zuroda.com/h); the main game is untouched.
// build.sh pastes this file into game.js right after its first line, so it shares its scope; its functions use game.js helpers
// (part, grp, M, G, rbox, cyl, glowSprite, gearSign) only when they are called.
// ===================================================================
// palette taken from the look-H reference picture: near-white walls, pale blue-teal, coral, pink rock, periwinkle panels, light wood
const HP={wall:'#fcf4ec',wallS:'#f6eadf',trim:'#f8ecdf',clay:'#dba58a',coral:'#f4a590',cream:'#fef8f1',teal:'#8ec0cb',tealD:'#6aa3b0',
  wood:'#c79877',woodD:'#a17c63',metal:'#c3ccd4',metalD:'#8e9aa8',panel:'#9daddf',panelL:'#cdd7f4',sage:'#b4d3b4',sageD:'#98c09f',
  sand:'#f3dcc6',glass:'#fff1b8',red:'#f0554a',rock:'#f3b8ac',rockD:'#e7a79b',rust:'#cf8f78',ink:'#6f4a3e',tank:'#c7dde8',tankD:'#afcdd7',slate:'#56607a'};
function hGlass(){return M(HP.glass,{emissive:'#ffb84a',emissiveIntensity:0.5});}
function hPost(par,x,z,h,c,r){return part(G.cyl6,c||HP.wood,x,h/2,z,r||0.16,h,r||0.16,par);}
// a slab roof with a parapet: the shape every adobe building here shares
function hBlock(par,x,y,z,w,h,d,col,trim){part(rbox(w,h,d,Math.min(0.22,h*0.12)),col||HP.wall,x,y+h/2,z,1,1,1,par);part(rbox(w+0.34,0.36,d+0.34,0.1),trim||HP.trim,x,y+h+0.1,z,1,1,1,par);}
function hVigas(par,x0,x1,y,z,n){for(let i=0;i<n;i++){const v=part(G.cyl6,HP.woodD,x0+(x1-x0)*i/Math.max(1,n-1),y,z,0.16,0.55,0.16,par);v.rotation.x=Math.PI/2;}}
function hWindow(par,x,y,z,ry,w,h){const g=grp(x,y,z,par);g.rotation.y=ry||0;w=w||0.95;h=h||0.85;part(rbox(w+0.2,h+0.2,0.12,0.06),HP.teal,0,0,0,1,1,1,g);part(G.box,hGlass(),0,0,0.06,w,h,0.04,g,true);part(G.box,HP.tealD,0,0,0.085,0.07,h,0.03,g,true);return g;}
function hAwning(par,x,y,z,w,d,ry){const g=grp(x,y,z,par);g.rotation.y=ry||0;const c=part(G.box,HP.coral,0,0,d/2,w,0.08,d,g);c.rotation.x=0.3;
  for(let i=-1;i<=1;i+=2){const st=part(G.box,HP.cream,i*w/4,0.004,d/2,w/6,0.085,d,g,true);st.rotation.x=0.3;}
  for(const s of [-1,1])part(G.cyl6,HP.wood,s*(w/2-0.1),-y/2+0.05-Math.sin(0.3)*d*0.5,d-0.05,0.09,y-0.1,0.09,g);return g;}
function hPots(par,x,z){part(G.cyl,HP.clay,x,0.35,z,0.62,0.7,0.62,par);part(G.cone5,HP.sage,x,0.95,z,0.48,0.7,0.48,par);part(G.cyl,HP.sand,x+0.62,0.3,z-0.42,0.5,0.6,0.5,par);part(G.cyl,HP.teal,x+0.28,0.25,z+0.52,0.44,0.5,0.44,par);}
function hBarrel(par,x,z,c){part(G.cyl,c||HP.wood,x,0.5,z,0.75,1.0,0.75,par);part(G.cyl,HP.woodD,x,0.82,z,0.79,0.08,0.79,par,true);part(G.cyl,HP.woodD,x,0.2,z,0.79,0.08,0.79,par,true);}
function hCrate(par,x,z,y,ry){const c=part(rbox(0.8,0.8,0.8,0.05),HP.wood,x,(y||0)+0.4,z,1,1,1,par);c.rotation.y=ry||0;return c;}

// ---------------- home ----------------
function makeHouseH(){const h=grp(),g=grp(0,0,0,h);g.rotation.y=-0.42;PART_OL=0.012;
  hBlock(g,0,0,0,6.2,3.3,4.6);hBlock(g,1.25,3.6,-0.55,2.9,1.6,2.6,HP.wallS);
  hVigas(g,-2.6,2.6,3.0,2.45,7);
  part(rbox(1.5,2.35,0.1,0.06),HP.trim,-1.3,1.17,2.31,1,1,1,g);part(rbox(1.15,2.05,0.16,0.08),HP.tealD,-1.3,1.03,2.36,1,1,1,g);part(G.sph,M(HP.metal),-0.92,1.05,2.46,0.12,0.12,0.12,g,true);
  part(rbox(2.4,0.18,1.1,0.06),HP.trim,-1.3,0.09,2.9,1,1,1,g);part(G.box,HP.coral,-1.3,0.02,3.9,1.5,0.02,0.85,g,true);
  hWindow(g,1.35,1.85,2.33,0);hWindow(g,3.13,1.8,0.4,Math.PI/2,0.8,0.75);hWindow(g,1.25,4.4,0.77,0,0.75,0.6);
  hAwning(g,-1.3,2.62,2.3,2.1,1.25);
  hPots(g,2.3,3.0);
  part(G.cyl,HP.tank,-1.7,4.1,-1.1,1.0,1.0,1.0,g);part(G.cone7,HP.tankD,-1.7,4.78,-1.1,1.1,0.36,1.1,g);
  part(G.cyl,HP.metal,2.25,5.95,-1.25,0.34,1.0,0.34,g);part(G.cyl,HP.metalD,2.25,6.47,-1.25,0.5,0.1,0.5,g);
  const lad=grp(-3.25,0,-0.9,g);for(const s of [-0.3,0.3])part(G.box,HP.woodD,0,1.8,s,0.1,3.6,0.1,lad);for(let i=0;i<7;i++)part(G.box,HP.wood,0,0.35+i*0.5,0,0.08,0.08,0.62,lad,true);
  PART_OL=0;
  for(const [x,y,z,c,s] of [[1.35,1.85,2.8,'#ffa848',3.6],[1.25,4.4,1.2,'#ffa848',2.6]]){const gs=glowSprite(c,s);gs.position.set(x,y,z);g.add(gs);}
  const gd=glowSprite('#ff9a40',5);gd.position.set(-1.3,1.0,3.0);gd.userData.g0=0.8;g.add(gd);
  return h;}

// ---------------- village buildings (look grows with the level) ----------------
function hTower(par,x,z,s){const g=grp(x,0,z,par);for(const [a,b] of [[-0.55,-0.55],[0.55,-0.55],[-0.55,0.55],[0.55,0.55]]){const l=hPost(g,a*s,b*s,2.5*s,HP.wood,0.15);l.rotation.z=a*0.05;}
  for(const y of [0.9,1.8])for(let k=0;k<2;k++){const br=part(G.box,HP.woodD,0,y*s,(k?0.55:-0.55)*s,1.1*s,0.08,0.08,g,true);}
  part(G.cyl,HP.tank,0,3.15*s,0,1.55*s,1.35*s,1.55*s,g);part(G.cyl,HP.tankD,0,3.15*s,0,1.6*s,0.12,1.6*s,g,true);part(G.cone7,HP.tankD,0,4.05*s,0,1.68*s,0.5*s,1.68*s,g);return g;}
function makeBuildingH(k,lvl){const g=grp();g.userData.anim={};PART_OL=0.012;const L=Math.max(1,lvl|0);
  switch(k){
    case 'cerpadlo':{hBlock(g,-1.1,0,0.2,3.0,2.0,2.4);part(rbox(0.9,1.5,0.12,0.06),HP.tealD,-1.5,0.75,1.42,1,1,1,g);hWindow(g,-0.35,1.25,1.43,0,0.6,0.55);
      const pos=[[1.7,-0.2],[3.4,-1.5],[1.2,-2.4]],n=1+(L>=4)+(L>=8);for(let i=0;i<n;i++)hTower(g,pos[i][0],pos[i][1],i?0.85:1);
      const pp=part(G.cyl6,HP.metalD,0.3,2.2,-0.1,0.16,1.9,0.16,g);pp.rotation.z=Math.PI/2;part(G.cyl6,HP.metalD,0.3+0.95,2.75,-0.1,0.16,1.1,0.16,g);
      part(G.cyl,HP.metal,-2.5,0.45,1.5,0.5,0.9,0.5,g);part(G.box,HP.metalD,-2.5,0.98,1.75,0.1,0.1,0.55,g);
      for(let i=0;i<Math.min(L,5);i++)hBarrel(g,-2.9+(i%3)*0.85,-1.3-Math.floor(i/3)*0.85,i%2?HP.wood:HP.teal);
      g.userData.anim.drop=part(G.sph,M(HP.teal),-2.5,1,1.98,0.22,0.3,0.22,g,true);break;}
    case 'solar':{const n=Math.min(9,Math.max(2,L*2-(L>4?L-4:0)));
      for(let i=0;i<n;i++){const px=-2.6+(i%3)*2.6,pz=-1.8+Math.floor(i/3)*2.1;const r=grp(px,0,pz,g);
        hPost(r,-0.8,0,0.85,HP.metalD,0.1);hPost(r,0.8,0,0.85,HP.metalD,0.1);const pn=grp(0,0.95,0,r);pn.rotation.x=-0.5;
        part(rbox(2.25,0.1,1.45,0.03),HP.metal,0,0,0,1,1,1,pn);part(G.box,HP.panel,0,0.04,0,2.1,0.05,1.3,pn,true);
        for(let j=-1;j<=1;j++)part(G.box,HP.panelL,j*0.7,0.07,0,0.03,0.02,1.3,pn,true);part(G.box,HP.panelL,0,0.07,0,2.1,0.02,0.03,pn,true);}
      const bx=grp(3.2,0,1.6,g);part(rbox(1.2,1.4,0.9,0.08),HP.metal,0,0.7,0,1,1,1,bx);part(G.box,M('#7fe0a0',{emissive:'#40c070',emissiveIntensity:0.8}),0.3,1.1,0.46,0.18,0.12,0.04,bx,true);
      part(G.box,HP.metalD,-0.15,0.6,0.46,0.5,0.7,0.03,bx,true);break;}
    case 'dilna':{hBlock(g,0,0,0,4.8,2.6,3.6);
      const dr=grp(0.5,0,1.81,g);part(rbox(2.4,2.0,0.12,0.05),HP.metalD,0,1.0,0,1,1,1,dr);for(let i=0;i<6;i++)part(G.box,HP.metal,0,0.25+i*0.32,0.07,2.3,0.1,0.03,dr,true);
      hAwning(g,0.5,2.35,1.8,2.9,1.0);hWindow(g,-1.55,1.6,1.82,0,0.7,0.6);
      g.userData.anim.gear=gearSign(g,-1.55,3.15,1.95,0.5);
      part(G.cyl,HP.metal,1.6,3.6,-1.0,0.4,1.4,0.4,g);part(G.cyl,HP.metalD,1.6,4.33,-1.0,0.55,0.1,0.55,g);g.userData.anim.chimney=new T.Vector3(1.6,4.45,-1.0);
      const wb=grp(-3.3,0,0.9,g);part(rbox(1.5,0.14,0.8,0.04),HP.wood,0,0.9,0,1,1,1,wb);for(const s of [-0.6,0.6])part(G.box,HP.woodD,s,0.45,0,0.1,0.9,0.7,wb);part(G.cyl,HP.metal,0.3,1.08,0,0.4,0.22,0.4,wb);
      for(let i=0;i<Math.min(L+1,7);i++)hCrate(g,2.9+(i%2)*0.85,0.9-Math.floor(i/2)*0.85,(i>=4?0.8:0),i*0.4);break;}
    case 'dron':{part(G.cyl,HP.sand,0,0.1,0,3.8,0.2,3.8,g);part(G.cyl,HP.cream,0,0.21,0,3.2,0.03,3.2,g,true);
      for(const [w,d] of [[0.3,1.4],[1.0,0.3]])part(G.box,HP.coral,0,0.24,0,w,0.02,d,g,true);
      hBlock(g,-3.0,0,-0.6,1.7,1.5,1.5,HP.wallS);hWindow(g,-3.0,0.9,0.16,0,0.6,0.45);
      hPost(g,2.2,-0.8,2.8,HP.metalD,0.13);const dish=part(G.half,HP.metal,2.2,3.0,-0.8,1.5,0.55,1.5,g);dish.rotation.x=-1.1;
      const d=grp(0,3,0,g);part(rbox(1.1,0.38,0.8,0.12),HP.cream,0,0,0,1,1,1,d);part(G.box,HP.coral,0,0.0,0,1.12,0.12,0.82,d,true);
      part(G.sph,M('#ffd36e',{emissive:'#ffb020',emissiveIntensity:1}),0,-0.12,0.42,0.2,0.2,0.2,d,true);const rot=[];
      for(const [x,z] of [[-0.75,-0.55],[0.75,-0.55],[-0.75,0.55],[0.75,0.55]]){const a=part(G.box,HP.metalD,x/2,0.1,z/2,Math.hypot(x,z),0.06,0.08,d,true);a.rotation.y=-Math.atan2(z,x);
        const rr=part(G.box,HP.ink,x,0.2,z,0.8,0.02,0.1,d,true);rot.push(rr);part(G.cyl,HP.metalD,x,0.14,z,0.14,0.1,0.14,d,true);}
      g.userData.anim.drone=d;g.userData.anim.rotors=rot;break;}
    case 'radio':{const H=8.6,B=1.35,Tt=0.15;const legs=[[-1,-1],[1,-1],[-1,1],[1,1]];
      for(const [a,b] of legs){const p0=new T.Vector3(a*B,0,b*B),p1=new T.Vector3(a*Tt,H,b*Tt),m=new T.Mesh(cyl(0.07,0.11,p0.distanceTo(p1),6),M(HP.rust));
        m.position.copy(p0).add(p1).multiplyScalar(0.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),p1.clone().sub(p0).normalize());m.castShadow=true;g.add(m);}
      for(let y=1.2;y<H-0.5;y+=1.5){const w=B+(Tt-B)*(y/H);for(let s=0;s<4;s++){const br=part(G.box,HP.rust,0,y,0,w*2,0.07,0.07,g,true);br.rotation.y=s*Math.PI/2;br.position.set(s===1?w:s===3?-w:0,y,s===0?w:s===2?-w:0);if(s%2)br.rotation.y=Math.PI/2;else br.rotation.y=0;}}
      const li=part(G.sph,M(HP.red,{emissive:'#ff3a1a',emissiveIntensity:1}),0,H+0.25,0,0.5,0.5,0.5,g,true);g.userData.anim.light=li;
      const dish=part(G.half,HP.metal,0.5,5.4,0.4,1.4,0.55,1.4,g);dish.rotation.x=-1.2;
      hBlock(g,-2.9,0,0.9,2.1,1.4,1.7,HP.wallS);part(rbox(0.7,1.1,0.1,0.05),HP.tealD,-2.9,0.55,1.76,1,1,1,g);hPost(g,-2.2,1.4,1.0,HP.metalD,0.06);break;}
    default:{PART_OL=0;return null;}
  }
  PART_OL=0;return g;}
function makeRuinH(k){const g=grp();PART_OL=0.012;const r=mulberry32(k.length*99);
  part(rbox(1.7,1.5,0.45,0.1),HP.wallS,-1.4,0.75,0,1,1,1,g).rotation.y=0.1;part(rbox(0.45,0.95,1.4,0.1),HP.wallS,-2.05,0.47,0.8,1,1,1,g);
  part(rbox(1.9,1.0,0.45,0.1),HP.wallS,1.3,0.5,-0.2,1,1,1,g).rotation.y=-0.15;part(rbox(0.45,1.8,1.0,0.1),HP.wallS,2.15,0.9,0.5,1,1,1,g);
  part(G.box,HP.trim,0,0.08,0.2,5,0.16,2.6,g);
  for(let i=0;i<6;i++)part(G.dode,i%2?HP.wallS:HP.trim,-1.6+r()*3.4,0.2,-0.6+r()*1.8,0.4+r()*0.3,0.3,0.4+r()*0.3,g);
  const v=part(G.cyl6,HP.woodD,0.3,0.35,0.7,0.16,1.6,0.16,g);v.rotation.set(0.2,0,1.3);PART_OL=0;return g;}

// ---------------- camps out in the desert ----------------
function makeCampH(built){const g=grp();PART_OL=0.012;
  for(let i=0;i<8;i++){const a=i/8*6.283;part(G.dode,i%2?HP.rock:HP.rockD,Math.cos(a)*0.7,0.12,Math.sin(a)*0.7+0.4,0.36,0.26,0.32,g);}
  if(built){part(G.cone5,M('#ffb050',{emissive:'#ff8a30',emissiveIntensity:0.9}),0,0.35,0.4,0.5,0.6,0.5,g,true);const gs=glowSprite('#ffa848',4.5);gs.position.set(0,0.6,0.4);gs.userData.g0=0.9;g.add(gs);
    const tent=part(G.roof,HP.coral,-0.4,0,-2.0,2.6,1.9,2.4,g);tent.rotation.y=0.2;part(G.box,HP.cream,-0.35,1.0,-0.78,0.25,1.9,0.06,g,true).rotation.y=0.2;
    part(G.box,HP.ink,-0.32,0.5,-0.8,0.55,1.0,0.05,g,true).rotation.y=0.2;
    hPost(g,1.6,-1.3,2.8,HP.woodD,0.08);const fl=part(G.box,HP.teal,2.05,2.5,-1.3,0.9,0.55,0.04,g);g.userData.flag=fl;
    hCrate(g,1.4,0.5,0,0.3);part(G.cyl,HP.teal,-1.6,0.45,0.6,0.6,0.9,0.6,g);}
  else{const p=hPost(g,1.2,-0.8,1.0,HP.woodD,0.08);p.rotation.z=0.5;part(G.box,HP.cream,1.3,0.9,-0.8,0.9,0.5,0.05,g).rotation.z=0.4;
    const st=part(G.box,HP.rust,-0.6,0.12,-1.0,1.6,0.06,0.12,g);st.rotation.y=0.6;}
  PART_OL=0;return g;}

// ---------------- greenery & rocks ----------------
function makePalmH(s){const p=grp();let px=0,py=0;PART_OL=0.012;
  for(let i=0;i<6;i++){const seg=part(G.cyl6,i%2?HP.wood:'#9d7352',px,py+0.4*s,0,0.42*s,0.82*s,0.42*s,p);seg.rotation.z=-0.07*i;px+=0.07*s*i;py+=0.78*s;}
  const top=grp(px,py,0,p);
  // fronds: a long leaf bent in two pieces so it arches and droops, like the palms in the look-H mock-up
  const lf=new T.ConeGeometry(0.55,1.6,4);lf.translate(0,0.8,0);
  for(let i=0;i<9;i++){const h=grp(0,0,0,top);h.rotation.y=i/9*Math.PI*2+(i%2)*0.2;const c=i%2?HP.sage:HP.sageD;
    const a=grp(0,0,0,h);a.rotation.z=-1.2-(i%3)*0.12;part(lf,c,0,0,0,s*1.3,s,s*0.42,a);const b=grp(0,1.45*s,0,a);b.rotation.z=-0.55;part(lf,c,0,0,0,s*1.1,s*0.95,s*0.38,b);}
  part(G.sph,HP.woodD,0,0,0,0.5*s,0.4*s,0.5*s,top);PART_OL=0;p.userData.top=top;return p;}
function makeRockH(s,i){const g=grp();PART_OL=0.012;const r=mulberry32((i||1)*31+7);
  const a=part(G.dode,r()<0.5?HP.rock:HP.rockD,0,0,0,1.6*s,(0.9+r()*0.5)*s,1.3*s,g);a.rotation.y=r()*6;
  if(r()<0.6){const b=part(G.dode,HP.rockD,0.9*s,-0.1*s,0.5*s,0.7*s,0.5*s,0.6*s,g);b.rotation.y=r()*6;}PART_OL=0;return g;}
// ---------------- desert obstacles & water ----------------
function makeBoulderH(rad,seed){const g=grp();PART_OL=0.012;const r=mulberry32((seed|0)*13+5);const n=2+Math.floor(r()*2);
  for(let i=0;i<n;i++){const k=rad*(i?0.45+r()*0.25:1);const a=r()*6.28,d=i?rad*0.75:0;
    const m=part(i%2?G.dode:G.ico,i%2?HP.rockD:HP.rock,Math.cos(a)*d,k*0.42,Math.sin(a)*d,k*1.9,k*(1.0+r()*0.35),k*1.6,g);m.rotation.y=r()*6;}
  PART_OL=0;return g;}
function makePuddleH(r){const g=grp();const k=S;
  const st=new T.Mesh(G.disc24,new T.MeshBasicMaterial({color:C('#e3b996'),transparent:true,opacity:0.45,depthWrite:false}));st.scale.set(r*3.3*k,1,r*2.4*k);st.position.y=0.04;g.add(st);
  part(G.disc24,HP.cream,0,0.06,0,r*2.3*k,1,r*1.65*k,g,true);
  const w=part(G.disc24,M(HP.teal),0,0.08,0,r*2*k,1,r*1.4*k,g,true);w.receiveShadow=true;
  part(G.disc24,M('#cfeef0'),-r*0.35*k,0.1,-r*0.22*k,r*0.8*k,1,r*0.28*k,g,true);return g;}

// ===================================================================
// Ink pass (22. 11.): the scene is drawn into a texture and the pen lines are added on top in one full-screen step.
// With the orthographic camera the depth of any flat face changes evenly across the screen, so wherever that evenness
// breaks there is an outer edge or a fold between two faces – exactly where a draughtsman would put a line.
// One thin, even, warm line on everything (houses, wrecks, robots, Zuro, the wanderer), no doubled outline meshes.
// ===================================================================
const HINK={rt:null,w:0,h:0,sc:null,cam:null,mat:null,col:'#6f4a3e',px:1.05,on:true};
function inkInit(){if(HINK.sc)return;HINK.cam=new T.OrthographicCamera(-1,1,1,-1,0,1);HINK.sc=new T.Scene();
  HINK.mat=new T.ShaderMaterial({depthTest:false,depthWrite:false,
    uniforms:{tC:{value:null},tD:{value:null},uPx:{value:new T.Vector2(1,1)},uK:{value:1},uR:{value:1},uInk:{value:new T.Color(HINK.col)},uA:{value:0.92},uFog:{value:new T.Vector3(0,1,0)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader:`precision highp float;varying vec2 vUv;uniform sampler2D tC;uniform sampler2D tD;uniform vec2 uPx;uniform float uK;uniform float uR;uniform vec3 uInk;uniform float uA;uniform vec3 uFog;
float D(vec2 o){return texture2D(tD,vUv+o*uPx).x;}
void main(){vec4 c=texture2D(tC,vUv);float r=uR;float d0=D(vec2(0.0));
 float l=D(vec2(-r,0.0)),rr=D(vec2(r,0.0)),u=D(vec2(0.0,r)),dn=D(vec2(0.0,-r));
 float q=r*0.7071;float a=D(vec2(-q,-q)),b=D(vec2(q,q)),e=D(vec2(-q,q)),f=D(vec2(q,-q));
 // how sharply the slope of the surface changes here: 0 on any flat face, large on a fold between two faces or at an outer edge
 float fold=max(max(abs(l+rr-2.0*d0),abs(u+dn-2.0*d0)),max(abs(a+b-2.0*d0),abs(e+f-2.0*d0)))*uK/r;
 float sens=c.a;float line=smoothstep(mix(1.7,0.30,sens),mix(2.8,0.60,sens),fold);
 float fogk=1.0-smoothstep(uFog.x,uFog.y,d0)*uFog.z;
 c.rgb=mix(c.rgb,c.rgb*uInk*(0.55+0.45*dot(c.rgb,vec3(0.333))),line*uA*fogk);
 gl_FragColor=vec4(c.rgb,1.0);}`});
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));g.setAttribute('uv',new T.BufferAttribute(new Float32Array([0,0,2,0,0,2]),2));
  const m=new T.Mesh(g,HINK.mat);m.frustumCulled=false;HINK.sc.add(m);}
// draws `scene` with the pen lines to whatever `ren` currently targets (its canvas); `st` keeps one set of buffers per renderer
function inkRender(ren,scene,camera,st){st=st||HINK;inkInit();const _inkV=HINK.v||(HINK.v=new T.Vector2());ren.getDrawingBufferSize(_inkV);const w=Math.max(2,Math.round(_inkV.x)),h=Math.max(2,Math.round(_inkV.y));
  if(!st.rt||st.w!==w||st.h!==h){if(st.rt){st.rt.depthTexture.dispose();st.rt.dispose();}
    const dt=new T.DepthTexture(w,h);dt.type=T.UnsignedIntType;dt.minFilter=dt.magFilter=T.NearestFilter;
    st.rt=new T.WebGLRenderTarget(w,h,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat,depthBuffer:true,stencilBuffer:false,depthTexture:dt});
    st.rt.texture.encoding=T.sRGBEncoding;st.rt.texture.generateMipmaps=false;st.w=w;st.h=h;}
  ren.setRenderTarget(st.rt);ren.render(scene,camera);ren.setRenderTarget(null);
  const U=HINK.mat.uniforms,pr=ren.getPixelRatio();U.tC.value=st.rt.texture;U.tD.value=st.rt.depthTexture;U.uPx.value.set(1/w,1/h);
  // depth step -> slope: (depth range in world units) / (world units per device pixel)
  const wpp=camera.isOrthographicCamera?(camera.top-camera.bottom)/camera.zoom/h:0.02;U.uK.value=(camera.far-camera.near)/wpp;
  U.uR.value=Math.max(1,Math.round(HINK.px*pr*0.5));
  // the wider the view, the smaller everything is on screen – the pen gets lighter so small things do not drown in ink
  U.uA.value=camera.isOrthographicCamera?0.92*Math.min(1,Math.max(0.5,Math.sqrt(13/((camera.right-camera.left)/camera.zoom)))):0.92;
  const fg=scene.fog;if(fg&&camera.isOrthographicCamera){U.uFog.value.set((fg.near-camera.near)/(camera.far-camera.near),(fg.far-camera.near)/(camera.far-camera.near),0.85);}else U.uFog.value.set(0,1,0);
  ren.render(HINK.sc,HINK.cam);}

// ===================================================================
// The wanderer in look H (22. 11.): drawn again for this style. Robin: the old head, the goggles and the hair looked generic.
// At game size a character is three or four colour shapes, so the head is built from a few big clear forms:
// a tousled mop of dark hair, a simple face (two dark eyes, brows, a small mouth) and one signature piece in the coral
// of the village awnings. Three versions to choose from (?hero=1|2|3): 1 scarf, 2 headband (the default), 3 desert headwrap.
// The body keeps the skeleton and all animations; pockets, buckles and other tiny parts are left out (they only made noise).
// ===================================================================
const HH={skin:'#eec3a6',hair:'#51342b',hairHi:'#6a463a',shirt:'#fdf3e3',vest:'#6cb2ba',pants:'#73809b',wraps:'#f4e6d4',shoe:'#b08467',boot:'#b98a6b',
  belt:'#93695a',scarf:'#f2957f',scarfD:'#e58470',wrap:'#fdf2e4',pack:'#e0b898',packD:'#c99b7a',glove:'#c99b7a',eye:'#3b2620'};
const HFH={};
let HERO_VAR=(()=>{let v=0;try{v=+(new URLSearchParams(location.search).get('hero')||localStorage.getItem('zuroda_hero')||0);}catch(e){}return v>=1&&v<=3?Math.round(v):2;})();
// face: two tall dark eyes with a small light, short brows, a little mouth, soft cheeks – readable even when the head is 30 px wide
function heroFaceH(expr){return faceTex((g,w,h)=>{const ex=[w*0.34,w*0.66],ey=h*0.52,ink=HH.eye;g.lineCap='round';g.lineJoin='round';
  g.fillStyle='rgba(240,128,108,0.30)';g.beginPath();g.ellipse(w*0.2,h*0.7,22,13,0,0,6.283);g.ellipse(w*0.8,h*0.7,22,13,0,0,6.283);g.fill();
  const brow=(dy,tilt)=>{g.strokeStyle=HH.hair;g.lineWidth=8;for(const [i,x] of ex.entries()){const s=i?1:-1;g.beginPath();g.moveTo(x-s*17,ey-44+dy+tilt);g.quadraticCurveTo(x,ey-52+dy,x+s*17,ey-45+dy-tilt*0.3);g.stroke();}};
  const eye=(x,dx,sq)=>{g.fillStyle=ink;g.beginPath();g.ellipse(x+dx,ey+(sq?6:0),15,sq?13:22,0,0,6.283);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x+dx+5,ey-(sq?0:8),4.6,0,6.283);g.fill();
    if(sq){g.strokeStyle=ink;g.lineWidth=6;g.beginPath();g.moveTo(x+dx-19,ey-6);g.lineTo(x+dx+19,ey-6);g.stroke();}};
  const mouth=(k)=>{g.strokeStyle=ink;g.lineWidth=5.5;g.beginPath();g.moveTo(w/2-13,h*0.78);g.quadraticCurveTo(w/2,h*0.78+k,w/2+13,h*0.78);g.stroke();};
  if(expr==='idle'||expr==='look'){const dx=expr==='look'?7:0;for(const x of ex)eye(x,dx,0);mouth(9);}
  if(expr==='blink'){g.strokeStyle=ink;g.lineWidth=6.5;for(const x of ex){g.beginPath();g.moveTo(x-16,ey);g.quadraticCurveTo(x,ey+11,x+16,ey);g.stroke();}mouth(9);}
  if(expr==='happy'){g.strokeStyle=ink;g.lineWidth=7.5;for(const x of ex){g.beginPath();g.moveTo(x-17,ey+8);g.quadraticCurveTo(x,ey-17,x+17,ey+8);g.stroke();}
    g.fillStyle=ink;g.beginPath();g.moveTo(w/2-19,h*0.74);g.quadraticCurveTo(w/2,h*0.74+32,w/2+19,h*0.74);g.closePath();g.fill();g.fillStyle='#f08a78';g.beginPath();g.ellipse(w/2,h*0.74+15,8,5,0,0,6.283);g.fill();}
  if(expr==='tired'){for(const x of ex)eye(x,0,1);brow(5,-7);mouth(-6);
    g.fillStyle='#9fd3e0';g.beginPath();g.moveTo(w*0.88,h*0.26);g.quadraticCurveTo(w*0.925,h*0.4,w*0.88,h*0.44);g.quadraticCurveTo(w*0.835,h*0.4,w*0.88,h*0.26);g.fill();}
  if(expr==='ko'){g.strokeStyle=ink;g.lineWidth=7;for(const x of ex){g.beginPath();g.moveTo(x-13,ey-13);g.lineTo(x+13,ey+13);g.moveTo(x+13,ey-13);g.lineTo(x-13,ey+13);g.stroke();}brow(0,-4);g.lineWidth=5.5;g.beginPath();g.ellipse(w/2,h*0.8,8,6,0,0,6.283);g.stroke();}
},300,230);}
function buildHeadH(H,gear,head,neck){H.head=head;const R=HD_R,V=HERO_VAR,Y=HD_C;
  {const hm=mk(hdShape(new T.SphereGeometry(R,28,20),R),HH.skin,head,{p:[0,Y,0]});hm.receiveShadow=false;}
  for(const s of [-1,1]){const e=mk(sph(0.07,14,10),HH.skin,head,{p:[s*0.34,Y-0.03,-0.02]});e.scale.set(0.45,0.82,0.7);}
  const fg=hdShape(new T.SphereGeometry(R*1.006,30,22,Math.PI/2-0.95,1.9,Math.PI/2-0.75,1.48),R*1.006);
  H.faceMat=MAT({map:H.F.idle,transparent:true,depthWrite:false});H.faceMat.userData.char=1;const face=new T.Mesh(fg,H.faceMat);face.position.y=Y;face.renderOrder=2;head.add(face);
  const CL=G.hclump||(G.hclump=new T.SphereGeometry(1,12,9)),TF=G.htuft||(G.htuft=(()=>{const g=new T.ConeGeometry(0.5,1,6,1);g.translate(0,0.5,0);return g;})());
  const clump=(col,x,y,z,sx,sy,sz,rx,ry,rz)=>{const m=mk(CL,col,head,{p:[x,Y+y,z],r:[rx||0,ry||0,rz||0]});m.scale.set(sx,sy,sz);return m;};
  const tuft=(col,x,y,z,w,l,d,rx,ry,rz)=>{const m=mk(TF,col,head,{p:[x,Y+y,z],r:[rx||0,ry||0,rz||0]});m.scale.set(w,l,d);return m;};
  const HC=HH.hair,HI=HH.hairHi;
  if(V!==3){
    // the mop: a cap that sits back on the head, big soft clumps over it, a fringe swept to one side and a cowlick on the crown
    {const cg=hdShape(new T.SphereGeometry(R*1.06,26,14,0,Math.PI*2,0,Math.PI*0.55),R*1.06);mk(cg,HC,head,{p:[0,Y+0.006,-0.02],r:[-0.42,0,0]});}
    clump(HC,0,0.27,-0.06,0.27,0.17,0.27,0.1);clump(HC,-0.19,0.2,-0.1,0.19,0.17,0.22,0,0,0.5);clump(HC,0.2,0.2,-0.09,0.19,0.17,0.22,0,0,-0.5);
    clump(HC,0,0.08,-0.27,0.25,0.22,0.16);
    clump(HC,-0.07,0.27,0.19,0.25,0.105,0.15,0.25,0,-0.3);clump(HC,0.19,0.23,0.15,0.13,0.11,0.13,0.2,0,-0.5);clump(HC,-0.24,0.2,0.1,0.11,0.13,0.13,0,0,0.3);
    tuft(HC,0.04,0.38,-0.1,0.14,0.2,0.12,-0.45,0,-0.35);tuft(HC,-0.07,0.37,-0.16,0.13,0.16,0.11,-0.8,0,0.45);
  }
  if(V===1&&neck){// coral scarf: a thick loop lying on the shoulders under the big head, a knot on the side and two tails down the back
    const s1=mk(tor(0.215,0.1,10,26),HH.scarf,neck,{p:[0,-0.1,0.0],r:[Math.PI/2,0,0]});s1.scale.set(1.08,0.95,0.8);
    const kn=mk(sph(0.085,12,9),HH.scarfD,neck,{p:[-0.2,-0.11,0.2]});kn.scale.set(1,0.9,0.9);
    const t1=cgrp(neck,[-0.1,-0.14,-0.24],[0.3,0.2,0.12]);mk(rbox(0.14,0.36,0.045,0.02),HH.scarf,t1,{p:[0,-0.17,0]});
    const t2=cgrp(neck,[0.05,-0.14,-0.25],[0.45,-0.15,-0.1]);mk(rbox(0.13,0.27,0.045,0.02),HH.scarfD,t2,{p:[0,-0.13,0]});H.scarf=t1;}
  if(V===2){// coral headband tied at the back
    const b=mk(tor(0.338,0.05,8,40),HH.scarf,head,{p:[0,Y+0.12,-0.015],r:[Math.PI/2-0.16,0,0]});b.scale.set(1,1,1.25);
    mk(sph(0.06,10,8),HH.scarfD,head,{p:[0.05,Y+0.07,-0.36]});
    const t1=cgrp(head,[0.09,Y+0.06,-0.37],[0.75,0,-0.25]);mk(rbox(0.09,0.3,0.035,0.016),HH.scarf,t1,{p:[0,-0.14,0]});
    const t2=cgrp(head,[0.0,Y+0.06,-0.38],[1.0,0,0.2]);mk(rbox(0.085,0.22,0.035,0.016),HH.scarfD,t2,{p:[0,-0.1,0]});}
  if(V===3){// desert headwrap: light cloth wound round the head in two turns with a coral stripe, one end hanging down; only the fringe shows
    {const cg=hdShape(new T.SphereGeometry(R*1.07,26,14,0,Math.PI*2,0,Math.PI*0.56),R*1.07);mk(cg,HH.wrap,head,{p:[0,Y+0.01,-0.02],r:[-0.36,0,0]});}
    const w1=mk(tor(0.33,0.085,10,40),HH.wrap,head,{p:[0,Y+0.13,-0.02],r:[Math.PI/2-0.22,0,0.12]});w1.scale.set(1,1,1.15);
    const w2=mk(tor(0.26,0.09,10,36),'#f6e6d2',head,{p:[0,Y+0.25,-0.04],r:[Math.PI/2+0.2,0,-0.18]});w2.scale.set(1,1,1.1);
    clump(HH.wrap,0,0.32,-0.05,0.2,0.1,0.2);
    const st=mk(tor(0.345,0.03,8,40),HH.scarf,head,{p:[0,Y+0.075,-0.02],r:[Math.PI/2-0.22,0,0.12]});st.scale.set(1,1,1.2);
    const tl=cgrp(head,[-0.3,Y+0.02,-0.12],[0.12,0,0.12]);mk(rbox(0.13,0.36,0.05,0.022),HH.wrap,tl,{p:[0,-0.17,0]});mk(rbox(0.135,0.05,0.055,0.02),HH.scarf,tl,{p:[0,-0.3,0]});
    clump(HC,-0.05,0.17,0.26,0.17,0.07,0.09,0.3,0,-0.25);clump(HC,0.15,0.14,0.23,0.09,0.07,0.08,0.2,0,-0.4);}
}
// a simple pack for look H: one rounded bag with a darker flap; the big one carries a bedroll
function buildBackH(par,type,H){const SZ={bundle:[0.4,0.4,0.2],satchel:[0.44,0.46,0.23],pack:[0.48,0.54,0.26]}[type]||[0.44,0.46,0.23];const [w,h,d]=SZ;
  const pk=cgrp(par,[0,-0.05,-0.29-d/2]);H.pack=pk;mk(rbox(w,h,d,0.07),HH.pack,pk);mk(rbox(w*1.04,h*0.36,d*1.06,0.05),HH.packD,pk,{p:[0,h*0.33,0]});
  if(type==='pack'){mk(cyl(0.1,0.1,w*1.2,12),HH.wrap,pk,{p:[0,h/2+0.1,0],r:[0,0,Math.PI/2]});}
  return pk;}

// colours of the older models (wrecks, scrap, robots, crates …) brought into the look-H range: very dark tones are lifted so nothing
// reads as a black blob on the bleached ground, strong colours are calmed a little. Reds, golds and lights keep their punch.
const HMAP={'#2f2c2a':'#5d6076','#3a3836':'#5d6076','#2b3436':'#56607a','#3a3430':'#6b6672','#3a2a20':'#7a5a4e','#5d6470':'#7f8aa0','#5d6168':'#8c95a6','#4a4e55':'#6f788c','#3a3e44':'#5f677c',
  '#6d7279':'#99a2b0','#7d8188':'#aab3bf','#8b8f96':'#b7bfca','#9aa0a6':'#c5ccd5','#6f9a96':'#9cc7c4','#5f8682':'#86b5b2','#c8643c':'#ee9b82','#b84a3a':'#ea7f6c','#c0432f':'#ea6f5c',
  '#d6cfbf':'#f6efe6','#4d7392':'#8fb0cf','#e8e0c8':'#fdf6ea','#8a5a34':'#c79877','#a06a3c':'#d6a988','#8f5e36':'#cfa181','#3f8a5a':'#8fc7a2','#d9a441':'#f0c468','#3f6fb0':'#8fa9dc'};
function hCol(c){if(typeof c!=='string')return c;const k=c.toLowerCase();if(HMAP[k])return HMAP[k];const q={h:0,s:0,l:0},t=new T.Color(k);t.getHSL(q);
  const u=Math.min(1,Math.max(0,(0.75-q.l)/0.5)),sm=u*u*(3-2*u);q.l=q.l+0.24*(1-q.l)*sm;q.s*=(q.h<0.06||q.h>0.94||(q.h>0.1&&q.h<0.16))?0.95:0.82;t.setHSL(q.h,q.s,q.l);return '#'+t.getHexString();}

// ---------------- small pictures of game models in look H (portraits on the Home page, building pictures) ----------------
// own little renderer, orthographic camera, plain daylight, the same pen lines as the game; fill(sc) puts the models in and says what to frame
function hSnap(w,h,fill,pr){let r2=null;try{pr=pr||2;r2=new T.WebGLRenderer({antialias:false,alpha:false,preserveDrawingBuffer:true});r2.setPixelRatio(pr);r2.setSize(w,h);r2.outputEncoding=T.sRGBEncoding;r2.shadowMap.enabled=true;r2.shadowMap.type=T.PCFShadowMap;
    const sc=new T.Scene();sc.background=C('#fbeee2');const sun=setupLights(sc);const v=fill(sc);if(!v){r2.dispose();return null;}
    const gm=MAT({color:C('#fef4ea')}),gd=new T.Mesh(new T.PlaneGeometry(240,240),gm);gd.rotation.x=-Math.PI/2;gd.position.y=-0.001;gd.receiveShadow=true;sc.add(gd);
    sun.position.set(v.c.x-9,v.c.y+24,v.c.z+13);sun.target.position.copy(v.c);const s=sun.shadow.camera,e=Math.max(4,v.half*2.4);s.left=-e;s.right=e;s.top=e;s.bottom=-e;s.near=1;s.far=80;s.updateProjectionMatrix();sun.shadow.mapSize.set(1024,1024);
    const cam=new T.OrthographicCamera(-v.half*w/h,v.half*w/h,v.half,-v.half,1,200),az=v.az===undefined?0.5:v.az,el=v.el===undefined?0.5:v.el;
    cam.position.set(v.c.x+Math.sin(az)*Math.cos(el)*80,v.c.y+Math.sin(el)*80,v.c.z+Math.cos(az)*Math.cos(el)*80);cam.lookAt(v.c);cam.updateMatrixWorld();
    const keep=[HU.lit.value.clone(),HU.shade.value.clone(),HU.sunL.value,HU.pr.value];
    HU.lit.value.setRGB(1.03,1.0,0.97);HU.shade.value.setRGB(1.03*0.5,0.43,0.97*0.47);HU.sunL.value=(sun.color.r+sun.color.g+sun.color.b)/3*sun.intensity;HU.pr.value=pr;
    const st={};inkRender(r2,sc,cam,st);const url=r2.domElement.toDataURL('image/png');
    HU.lit.value.copy(keep[0]);HU.shade.value.copy(keep[1]);HU.sunL.value=keep[2];HU.pr.value=keep[3];
    if(st.rt){st.rt.depthTexture.dispose();st.rt.dispose();}r2.dispose();r2.forceContextLoss&&r2.forceContextLoss();return url;}
  catch(e){try{r2&&r2.dispose();}catch(_){}console.warn('hSnap',e);return null;}}
function hSnapChars(kind,w,h){return hSnap(w,h,sc=>{
  if(kind==='dog'){if(!WOLT)return null;const D=makeDog(dogGear());D.root.rotation.y=-0.35;sc.add(D.root);return {c:new T.Vector3(0,0.8,0),half:1.15,az:0.25,el:0.3};}
  if(kind==='trio'){if(!WOLT)return null;const b=makeHero(heroGear()),D=makeDog(dogGear());b.root.position.set(-0.6,0,0);b.root.rotation.y=0.3;D.root.position.set(0.85,0,0.35);D.root.rotation.y=-0.4;sc.add(b.root,D.root);return {c:new T.Vector3(0.05,1.2,0),half:1.8,az:0.1,el:0.32};}
  const H=makeHero(heroGear());H.root.rotation.y=0.3;sc.add(H.root);return {c:new T.Vector3(0,1.45,0),half:1.72,az:0.1,el:0.3};});}
function hSnapBld(k,lvl){return hSnap(300,230,sc=>{const g=lvl?makeBuilding(k,lvl):makeRuin(k);sc.add(g);const bb=new T.Box3().setFromObject(g),c=bb.getCenter(new T.Vector3()),sz=bb.getSize(new T.Vector3());
  return {c,half:Math.max(sz.x*0.42,sz.z*0.42,sz.y*0.62)+0.9,az:0.62,el:0.58};});}
