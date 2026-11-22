// ===================================================================
// Look H (Robin 22. 11.): the whole game redone in one style – sun-bleached haze, thin warm ink, soft hatching.
// Models here replace the old ones only when the 'sun' style is on (zuroda.com/h); the main game is untouched.
// build.sh pastes this file into game.js right after its first line, so it shares its scope; its functions use game.js helpers
// (part, grp, M, G, rbox, cyl, glowSprite, gearSign) only when they are called.
// ===================================================================
const HP={wall:'#f4e2c8',wallS:'#ecd6b8',trim:'#e3c6a3',clay:'#d98f6a',coral:'#e98a6c',cream:'#f8ece0',teal:'#5ea6aa',tealD:'#3f8289',
  wood:'#b08360',woodD:'#7f5c43',metal:'#aab2b6',metalD:'#7d878e',panel:'#5d84b6',panelL:'#a9c6e6',sage:'#93b998',sageD:'#729f7e',
  sand:'#ecc9a6',glass:'#ffd98a',red:'#e0573f',rock:'#d6a895',rockD:'#c08e7a',rust:'#b8735a',ink:'#6b4a40'};
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
  part(G.cyl,HP.teal,-1.7,4.1,-1.1,1.0,1.0,1.0,g);part(G.cone7,HP.tealD,-1.7,4.78,-1.1,1.1,0.36,1.1,g);
  part(G.cyl,HP.metal,2.25,5.95,-1.25,0.34,1.0,0.34,g);part(G.cyl,HP.metalD,2.25,6.47,-1.25,0.5,0.1,0.5,g);
  const lad=grp(-3.25,0,-0.9,g);for(const s of [-0.3,0.3])part(G.box,HP.woodD,0,1.8,s,0.1,3.6,0.1,lad);for(let i=0;i<7;i++)part(G.box,HP.wood,0,0.35+i*0.5,0,0.08,0.08,0.62,lad,true);
  PART_OL=0;
  for(const [x,y,z,c,s] of [[1.35,1.85,2.8,'#ffa848',3.6],[1.25,4.4,1.2,'#ffa848',2.6]]){const gs=glowSprite(c,s);gs.position.set(x,y,z);g.add(gs);}
  const gd=glowSprite('#ff9a40',5);gd.position.set(-1.3,1.0,3.0);gd.userData.g0=0.8;g.add(gd);
  return h;}

// ---------------- village buildings (look grows with the level) ----------------
function hTower(par,x,z,s){const g=grp(x,0,z,par);for(const [a,b] of [[-0.55,-0.55],[0.55,-0.55],[-0.55,0.55],[0.55,0.55]]){const l=hPost(g,a*s,b*s,2.5*s,HP.wood,0.15);l.rotation.z=a*0.05;}
  for(const y of [0.9,1.8])for(let k=0;k<2;k++){const br=part(G.box,HP.woodD,0,y*s,(k?0.55:-0.55)*s,1.1*s,0.08,0.08,g,true);}
  part(G.cyl,HP.teal,0,3.15*s,0,1.55*s,1.35*s,1.55*s,g);part(G.cyl,HP.tealD,0,3.15*s,0,1.6*s,0.12,1.6*s,g,true);part(G.cone7,HP.tealD,0,4.05*s,0,1.68*s,0.5*s,1.68*s,g);return g;}
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
