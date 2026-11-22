
(() => {
'use strict';
// ================= utils =================
let FF='Jost, "Century Gothic", system-ui, sans-serif';
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const easeInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const smooth=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash3(s,x,y){let h=Math.imul(x|0,0x27d4eb2d)^Math.imul(y|0,0x165667b1)^Math.imul(s|0,0x9e3779b1);h=Math.imul(h^(h>>>15),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);return (h^(h>>>16))>>>0;}
const M_PER_U=0.1;// metres per game unit – matches the wanderer's size (Robin 19. 11.)
const fmtMeters=m=>m<1000?Math.round(m)+' m':(m/1000).toFixed(m<10000?2:1)+' km';
const fmtM=u=>fmtMeters(u*M_PER_U);
const fmtL=l=>Math.max(0,l).toFixed(1);
const BOT=location.hash==='#bot';
const $=id=>document.getElementById(id);
const onPressLater=[];
const S=0.1; // 2D game units -> 3D units

// ================= data =================
// ===== economy (Robin 20. 11. evening): every building has 10 levels, costs grow ~×1.45 per level, gold scrap from level 3, circuits from level 5, building stays instant =====
const r5=v=>v<20?Math.round(v):Math.round(v/5)*5;
// sc = scrap base, g = growth, c = gold per level, x = circuits per level, e0/eg = energy, eff = text for level n
function mkLv(o){return Array.from({length:10},(_,i)=>({s:r5(o.sc*Math.pow(o.g,i)),c:o.c[i]||0,x:o.x[i]||0,en:i<2?0:Math.round(o.e0*Math.pow(o.eg,i)),get eff(){return o.eff(i+1);}}));}
const BLD={
  // village layout (Robin 20. 11.): a small settlement that grew along a road
  cerpadlo:{name:'Water Pump',x:-74,y:-66,rot:0.35,col:'#5aa9b8',desc:'An old pump robot. It pumps water from deep underground into your well – more and faster with every level.',
    lv:mkLv({sc:10,g:1.5,c:[0,0,1,2,3,4,6,8,11,15],x:[0,0,0,0,1,2,3,4,6,8],e0:6,eg:1.38,eff:n=>'Well refills '+wellRateOf(n)+' L/min, holds '+wellCapOf(n)+' L'}),bot:[-26,10]},
  solar:{name:'Solar Field',x:-122,y:96,rot:0.45,col:'#3d4f74',desc:'Panels catching the sun again. They charge the village battery – every repair, upgrade and drone flight runs on that energy.',
    lv:mkLv({sc:18,g:1.45,c:[0,0,1,2,3,5,7,9,12,16],x:[0,0,0,0,1,2,3,5,7,9],e0:0,eg:1,eff:n=>'+'+energyRateOf(n)+' energy/min · battery '+energyCapOf(n)}),bot:[38,12],botCol:'#e0b04c'},
  dilna:{name:'Workshop',x:96,y:-42,rot:-0.3,col:'#c8643c',desc:'The workshop robot turns scrap into gear for your journeys. Every level lets it make better gear.',
    lv:mkLv({sc:24,g:1.45,c:[0,0,1,2,3,4,6,8,10,13],x:[0,0,0,0,1,2,3,4,6,8],e0:10,eg:1.36,eff:n=>wsUnlockText(n)}),bot:[-30,12]},
  dron:{name:'Scout Drone',x:58,y:-150,rot:-0.2,col:'#7a5a8c',desc:'Send the drone out to scout the desert. It flies to a spot you pick on the map and maps the area around it.',
    lv:mkLv({sc:40,g:1.42,c:[2,3,4,5,7,9,11,14,18,22],x:[0,0,0,1,2,3,4,6,8,10],e0:15,eg:1.3,eff:n=>'Scouts up to '+fmtM(DRONE.range[n])+' from the village, maps '+fmtM(DRONE.r[n])+' around the spot'}),bot:null},
  radio:{name:'Radio Tower',x:-108,y:-186,rot:0.25,col:'#c0532f',desc:'A huge old transmitter on the edge of the village. Getting it to work will take a long time – but then you might hear someone out there.',
    lv:mkLv({sc:400,g:1.3,c:[12,15,19,24,30,37,46,57,70,86],x:[3,4,5,7,9,11,14,17,21,25],e0:120,eg:1.15,eff:n=>n===1?'Picks up a signal – and shows you which way it comes from':n<=7?'Clearer signal – you can hear message '+n+' of 7':n===8?'Shows roughly how far away the signal is':n===9?'Hears every whisper on the band':'Locks onto the source of the signal'}),bot:[26,12]},
};
const DRONE={range:[0,3200,4500,6000,7600,9200,11000,13000,15000,17500,20000],r:[0,900,1050,1200,1350,1500,1650,1800,1950,2100,2300],cost:[0,8,9,10,11,12,13,14,15,16,18]};
// paths of the village (3D units): a main road from the desert, branches and narrow trails – drawn as curved ribbons
const VPATHS=[
  {w:2.0,p:[[0.3,27],[0.9,21],[-0.6,15],[-0.2,10],[0,4.5]]},
  {w:1.15,p:[[0.2,4.6],[3.2,2.6],[6.2,-0.2],[8.6,-1.6]]},
  {w:1.1,p:[[-0.6,4.4],[-3.4,2.4],[-5.6,-1.6],[-6.6,-4.6]]},
  {w:1.05,p:[[-0.5,14.2],[-3.8,13.6],[-7.4,12.2],[-10.4,10.6]]},
  {w:0.75,p:[[-7,-6.2],[-8.6,-10],[-9.2,-14],[-10.2,-17]]},
  {w:0.8,p:[[9,-3.4],[8.8,-7.6],[7.4,-11.2],[6.2,-13.6]]},
];
const BAG=[14,22,30,40,52,66,82,100,120,145,175];
// gear (Robin 20. 11. evening): few items, each with 10 levels; the Workshop level caps the gear level (w = n)
const IG=[0,0,1,2,3,4,6,8,10,13],IX=[0,0,0,0,1,2,3,4,6,8];
function mkGear(sc,e0,eff){return Array.from({length:10},(_,i)=>({s:r5(sc*Math.pow(1.45,i)),c:IG[i],x:IX[i],en:i<2?0:Math.round(e0*Math.pow(1.33,i)),w:i+1,get eff(){return eff(i+1);}}));}
const HAMMER_NEED={2:1,0:3,1:5,3:7};// wreck kind → hammer level
const hammerDmg=l=>l?1+Math.floor((l-1)/3):0,hammerYield=l=>1+0.06*Math.max(0,l-1);
const SLING={range:l=>95+l*8,dmg:l=>l<5?1:l<9?2:3,cd:l=>0.85-l*0.045};
const bootsMul=l=>1+0.02*l;
const CRAFT={
  kladivo:{icon:'hammer',name:'Hammer',lv:mkGear(10,4,n=>{const top=n>=7?'planes':n>=5?'helicopters':n>=3?'cars':'motorbikes';const nw=[1,3,5,7].includes(n);return (nw?'NEW – ':'')+'Takes apart wrecks up to '+top+' · hits robots for '+hammerDmg(n)+(n>1?' · +'+Math.round((hammerYield(n)-1)*100)+' % from wrecks':'')+'.';})},
  batoh:{icon:'pack',name:'Backpack',lv:mkGear(16,6,n=>'Holds '+BAG[n]+' · carries '+(2+n)+' bottles.')},
  cutora:{icon:'canteen',name:'Canteen',lv:mkGear(14,5,n=>'+'+fmtL(canteenOf(n))+' L of water on your belt.')},
  boty:{icon:'boots',name:'Boots',lv:mkGear(16,6,n=>'You walk '+Math.round((bootsMul(n)-1)*100)+' % faster – same water per metre.')},
  prak:{icon:'sling',name:'Slingshot',lv:mkGear(30,8,n=>'Range '+fmtM(SLING.range(n))+' · hits for '+SLING.dmg(n)+' · 1 {scrap} per shot.')},
  kompas:{icon:'compass',name:'Compass',lv:[{s:24,c:1,en:6,w:2,eff:'Shows the way home – and to the nearest known water.'}]},
};
const canteenOf=l=>[0,0.5,1,1.5,2,2.5,3,3.6,4.2,5,6][l|0];
function wsUnlockText(n){const u=[];for(const k in CRAFT)CRAFT[k].lv.forEach((l,i)=>{if(l.w===n)u.push(CRAFT[k].name+(CRAFT[k].lv.length>1?' '+ROMAN[i+1]:''));});return u.length?'Can make: '+u.join(', '):'Faster, cleaner work – needed for the next gear';}
const ROMAN=['','I','II','III','IV','V','VI','VII','VIII','IX','X'];
const gearLv=k=>SV.craft[k]|0;
// wrecks: kind 0 car, 1 helicopter, 2 motorbike → hammer level needed and loot
const WRECK={2:{name:'Old motorbike',need:1,s:[4,6],g:0.3},0:{name:'Old car',need:3,s:[7,10],g:1},1:{name:'Crashed helicopter',need:5,s:[11,15],g:2},3:{name:'Crashed plane',need:7,s:[22,30],g:3,chip:0.6}};
// camps: built once, then a one-click trip from home (costs well water)
// camps: the places Robin marked on the map (20. 11.). No arrows point to them – the player has to find them.
const CAMPS=[
  {id:'c1',name:'Shore Camp',x:-2990,y:1830,trip:3},{id:'c2',name:'Red Mesa Camp',x:5335,y:-4740,trip:5},
  {id:'c3',name:'Far Dunes Camp',x:3410,y:8300,trip:6},{id:'c4',name:'Salt Lake Camp',x:-4400,y:-9930,trip:7}];
// ---- the sea (Robin 20. 11.): a coastline to the south-west, so the world can't grow in every direction ----
const COAST_CP=[[-30000,-26000],[-14471,-10025],[-6471,-2025],[-5360,-914],[-5434,568],[-4989,2544],[-3507,4520],[-1531,5508],[-420,6496],[198,7484],[568,9460],[1927,11066],[3656,12054],[17656,20054],[40000,33000]];
let COAST=null,COAST_SIGN=1;
function coastPts(){if(COAST)return COAST;const P=COAST_CP,out=[];
  for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];
    for(let k=0;k<8;k++){const t=k/8,t2=t*t,t3=t2*t;const f=(a,b,c,d)=>0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);out.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
  out.push(P[P.length-1]);COAST=out;COAST_SIGN=1;COAST_SIGN=coastRaw(0,0).side>0?1:-1;return COAST;}
function coastRaw(x,y){const P=COAST;let bd=1e18,best=null;for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy;let t=((x-a[0])*dx+(y-a[1])*dy)/l2;t=t<0?0:t>1?1:t;
  const qx=a[0]+dx*t,qy=a[1]+dy*t,d2=(x-qx)*(x-qx)+(y-qy)*(y-qy);if(d2<bd){bd=d2;best={qx,qy,side:Math.sign(dx*(y-a[1])-dy*(x-a[0]))||1};}}best.d=Math.sqrt(bd);return best;}
// signed distance to the shore: >0 on land, <0 in the sea; n = unit vector pointing inland
function coastSD(x,y){coastPts();const r=coastRaw(x,y),land=r.side*COAST_SIGN>0,d=r.d||0.001;const nx=(x-r.qx)/d,ny=(y-r.qy)/d;return land?{d,nx,ny}:{d:-d,nx:-nx,ny:-ny};}
const CAMP_COST=12;
const DECOR={kvetiny:{icon:'{flowers}',name:'Flowers',s:2},lampa:{icon:'{lamp}',name:'Lamp',s:3},lavicka:{icon:'{bench}',name:'Bench',s:4},palma:{icon:'{palm}',name:'Palm',s:6}};
const MSGS=['…hello? …is anyone there? …all I hear is static…','…if you can hear this… you are not alone… I repeat, you are not alone…','…every evening I switch on the transmitter… and wait…',
  '…northeast… past the salt flats… there is water here…','…I saw a light on the horizon… was that you?…','…the road is long… but it can be walked…','…I\'ll wait. I promise.'];
const LORE=['Diary scrap: “The wells dried up one after another. Nobody knew why.”','Diary scrap: “The robots stayed. We went north.”','Diary scrap: “Whoever finds this, don\'t give up.”'];
const SIG={x:9000,y:-16000};
const STARTERS=[{x:250,y:-190},{x:-290,y:-250},{x:110,y:-430},{x:-420,y:120}];
const CH=240,W=360;

// ================= save =================
const SAVE_KEY='daleko3_save';
function freshSave(){return {v:1,eco:2,seed:(Math.random()*4294967295)>>>0,scrap:0,cores:0,chips:0,bottles:0,b:{cerpadlo:0,solar:0,dilna:0,dron:0,radio:0},energy:30,scout:null,
  craft:{},decor:[],taken:[],bags:[],exp:0,best:0,msg:0,lore:0,scrapT:{},meters:0,name:'Wanderer',tod:0.12,zoom:14,mscale:1,seen:{},lastPath:null,well:24,wellAt:Date.now(),camps:{},fetch:null,caches:[]};}
function loadSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.v===1){s.takenSet=new Set(s.taken||[]);s.scrapT=s.scrapT||{};s.meters=s.meters||0;s.name=s.name||'Wanderer';if(s.tod===undefined)s.tod=0.12;s.zoom=clamp(s.zoom||14,10,18);
    if(!s.eco){s.eco=2;s.well=24;s.wellAt=Date.now();s.camps={};s.fetch=null;}// older save → new water economy
    s.camps=s.camps||{};if(s.well===undefined)s.well=24;
    if(!s.mscale){s.meters=Math.round((s.meters||0)/5);s.mscale=1;}// old saves counted 0.5 m per unit
    if(!s.seen)s.seen={};
    if(s.bottles===undefined){s.bottles=s.melons>0?1:0;delete s.melons;if(s.b)delete s.b.sklenik;}// greenhouse & melons are gone → bottles
    if(s.b&&s.b.sklad!==undefined){s.craft=s.craft||{};if(s.b.sklad)s.craft.batoh=Math.max(s.craft.batoh|0,s.b.sklad);delete s.b.sklad;}// Cargo Bot → backpack item
    if(s.energy===undefined){s.energy=12;s.scout=null;}
    if(s.chips===undefined)s.chips=0;
    if(s.craft){delete s.craft.bryle;}if(!s.caches)s.caches=[];
    {const mins=Math.max(0,(Date.now()-(s.wellAt||Date.now()))/60000);s.well=Math.min(wellCapOf(s.b.cerpadlo),s.well+mins*wellRateOf(s.b.cerpadlo));s.energy=Math.min(energyCapOf(s.b.solar),s.energy+mins*energyRateOf(s.b.solar));}
    return s;}}catch(e){}
  const f=freshSave();f.takenSet=new Set();return f;}
let SV=loadSave();const hadSave=SV.exp>0;
function save(){try{SV.wellAt=Date.now();for(const id in SV.scrapT)if(SV.exp-SV.scrapT[id]>=8)delete SV.scrapT[id];const o=Object.assign({},SV,{taken:[...SV.takenSet]});delete o.takenSet;localStorage.setItem(SAVE_KEY,JSON.stringify(o));}catch(e){}}
// ---- water economy (Robin 19. 11.): the well is the main currency ----
function wellCapOf(l){return [24,40,55,72,92,115,140,170,205,245,290][l|0];}
function wellRateOf(l){return [0.6,1,1.3,1.7,2.1,2.6,3.1,3.7,4.3,5,5.8][l|0];}// litres per minute
const wellCap=()=>wellCapOf(SV.b.cerpadlo),wellRate=()=>wellRateOf(SV.b.cerpadlo);
const FLASK=2;
const canteenCap=()=>canteenOf(gearLv('cutora'));
const waterCap=()=>FLASK+canteenCap();
const fillAmount=()=>Math.min(waterCap(),Math.floor(SV.well*10)/10);
const BOTTLE=0.5;// litres per bottle
const bottleMax=()=>2+gearLv('batoh');// the backpack decides how many bottles you can carry
const bottleCost=()=>6+4*(SV.bottles||0);
const bottleFill=()=>Math.min(SV.bottles||0,Math.floor(Math.max(0,SV.well-fillAmount())/BOTTLE));
function tickWell(dt){SV.well=Math.min(wellCap(),SV.well+wellRate()*dt/60);SV.energy=Math.min(energyCap(),(SV.energy||0)+energyRate()*dt/60);}
// ---- energy (Robin 20. 11.): the village currency – the Solar Field charges a battery, repairs, upgrades, crafting and drone flights spend it
function energyRateOf(l){return [0,1.5,2.2,3,4,5,6.5,8,10,12,15][l|0];}
function energyCapOf(l){return [20,40,60,85,115,150,190,240,300,370,450][l|0];}
const energyRate=()=>energyRateOf(SV.b.solar),energyCap=()=>energyCapOf(SV.b.solar);
const bagCap=()=>BAG[gearLv('batoh')]+Math.floor((lvOf(SV.meters||0,n=>heroReq(n),30)-1)/3);
function nextLv(k){return BLD[k].lv[SV.b[k]]||null;}
function canRepair(k){const n=nextLv(k);if(!n)return false;return canPay(n);}
function totalLevels(){let t=0;for(const k in SV.b)t+=SV.b[k];return t;}

// ================= audio =================
let AC=null,master=null,muted=false;try{muted=localStorage.getItem('daleko_mute')==='1';}catch(e){}
const muteBtn=$('mute');if(muted)muteBtn.classList.add('off');muteBtn.innerHTML=icSvg('sound','on')+icSvg('mute','offi');{const bm=$('bMelon');const cnt=bm.querySelector('small');bm.innerHTML=icSvg('bottle');if(cnt)bm.appendChild(cnt);}
function initAudio(){if(AC){if(AC.state==='suspended')AC.resume().catch(()=>{});return;}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=muted?0:0.6;master.connect(AC.destination);}catch(e){AC=null;}loadSnd();}
// real sounds (Kenney audio packs, CC0 – Robin 20. 11.); the synth tones stay as a fallback while files load or if they fail
const SND={hit:['impactPlate_heavy_000','impactPlate_heavy_001','impactPlate_heavy_002'],boom:['explosionCrunch_000','explosionCrunch_001'],zap:['zapThreeToneDown'],thud:['lowFrequency_explosion_000'],alarm:['threeTone1'],
  repair:['impactMining_000','impactMining_001'],levelup:['jingles_PIZZI12'],home:['jingles_STEEL13'],fail:['jingles_STEEL07'],coins:['handleCoins']};
const SBUF={};let sndLoading=false;
function loadSnd(){if(sndLoading||!AC)return;sndLoading=true;for(const n of new Set(Object.values(SND).flat()))fetch('sfx/'+n+'.mp3').then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((res,rej)=>AC.decodeAudioData(b,res,rej))).then(buf=>{SBUF[n]=buf;}).catch(()=>{});}
function ps(key,vol,rate,delay){if(!AC||!master)return false;const L=SND[key];if(!L)return false;const b=SBUF[L[Math.floor(Math.random()*L.length)]];if(!b)return false;
  const s=AC.createBufferSource();s.buffer=b;s.playbackRate.value=rate||(0.93+Math.random()*0.14);const g=AC.createGain();g.gain.value=vol==null?0.8:vol;s.connect(g);g.connect(master);s.start(AC.currentTime+(delay||0));return true;}
function tone(f,t0,dur,vol,type,f2){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur*0.6);g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);o.connect(g);g.connect(master);o.start(t0);o.stop(t0+dur+0.05);}
const now=()=>AC?AC.currentTime:0;
const sfx={
  clink(){const t=now();tone(1500+Math.random()*300,t,0.12,0.06,'triangle',1100);tone(2300,t+0.03,0.08,0.03,'sine');},
  core(){const t=now();[659,784,988,1319].forEach((f,i)=>tone(f,t+i*0.09,0.8,0.08,'sine'));},
  drink(){const t=now();tone(820,t,0.22,0.1,'sine',380);},
  zap(){if(ps('zap',0.5,1)){ps('thud',0.5,1,0.05);return;}const t=now();tone(880,t,0.25,0.08,'sawtooth',120);tone(70,t,0.3,0.15,'sine');},
  alarm(){if(ps('alarm',0.35,1))return;const t=now();tone(1046,t,0.09,0.07,'square');tone(1046,t+0.14,0.09,0.07,'square');tone(784,t+0.28,0.16,0.07,'square');},
  sling(){const t=now();tone(320,t,0.12,0.06,'triangle',900);},
  bark(){const t=now();tone(520,t,0.07,0.07,'square',300);tone(560,t+0.12,0.07,0.06,'square',320);},
  repair(){if(ps('repair',0.45)){ps('levelup',0.35,1,0.3);return;}const t=now();[0,0.12,0.24].forEach(d=>tone(180+Math.random()*40,t+d,0.08,0.12,'square',90));[523,659,784].forEach((f,i)=>tone(f,t+0.4+i*0.1,0.9,0.08,'triangle'));},
  home(){if(ps('home',0.35,1))return;const t=now();[392,494,587,784].forEach((f,i)=>tone(f,t+i*0.12,1.4,0.07,'sine'));},
  fail(){if(ps('fail',0.35,1))return;const t=now();[440,392,330,262].forEach((f,i)=>tone(f,t+i*0.2,1.2,0.07,'triangle'));},
  place(){const t=now();tone(600,t,0.15,0.08,'sine',900);},
  crate(){if(ps('coins',0.45))return;const t=now();tone(300,t,0.1,0.1,'square',200);[523,784].forEach((f,i)=>tone(f,t+0.1+i*0.08,0.5,0.07,'triangle'));},
  hit(){if(ps('hit',0.45))return;this.clink();},
  boom(){if(ps('boom',0.5))return;this.core();},
  ui(k){},
  thrust(){},
  vanish(){const t=now();tone(1200,t,0.6,0.05,'sine',300);},
  step(){if(Math.random()<0.5)return;const t=now();tone(150+Math.random()*60,t,0.05,0.012,'triangle');},
};
muteBtn.addEventListener('click',e=>{e.stopPropagation();muted=!muted;try{localStorage.setItem('daleko_mute',muted?'1':'0');}catch(_){}muteBtn.classList.toggle('off',muted);initAudio();
  if(master)master.gain.setTargetAtTime(muted?0:0.6,AC.currentTime,0.05);});

// ================= renderer / overlay =================
// ================= render styles =================
const STYLES={
 main:    {name:'Clean toon',px:0,mat:'toon',grad:[105,182,255],ol:1.5,olc:'#3a2a20',sh:'pcf',cam:'ortho',haze:0},
 brawl:   {name:'Brawl-like',px:0,mat:'toon',grad:[118,160,205,240,255],gradSmooth:1,ol:0,sh:'pcfsoft',cam:'ortho',haze:0,brawl:1,chunky:1,hemiK:1.08,sunK:0.94,css:'saturate(1.08) contrast(1.05)'},
 retro:   {name:'Retro pixel',px:260,mat:'toon',grad:[100,178,255],ol:0.9,sh:'basic',cam:'ortho',q:1},
 hd2d:    {name:'HD-2D diorama',px:340,mat:'toon',grad:[95,170,255],ol:1,sh:'basic',cam:'persp',fov:28,tilt:4,css:'saturate(1.22) contrast(1.08)'},
 toon:    {name:'Clean toon',px:0,mat:'toon',grad:[100,178,255],ol:1.5,sh:'pcf',cam:'ortho'},
 lowpoly: {name:'Low-poly 3D',px:0,mat:'flat',ol:0,sh:'pcfsoft',cam:'persp',fov:38},
 mini:    {name:'Tilt-shift miniature',px:0,mat:'soft',ol:0,sh:'pcfsoft',cam:'persp',fov:24,el:0.12,tilt:7,css:'saturate(1.35) contrast(1.08) brightness(1.03)',hemiI:0.75},
 pastel:  {name:'Flat pastel',px:0,mat:'lambert',ol:0,sh:'none',cam:'ortho',css:'saturate(0.6) brightness(1.14) hue-rotate(-18deg) contrast(0.94)',bg:'#f6d6cc',hemiI:0.85,sunI:0.7},
 paint:   {name:'Hand-painted',px:0,mat:'toon',grad:[150,205,255],ol:1.6,olc:'#6a3e26',sh:'pcfsoft',cam:'ortho',svg:'wc',paper:0.65,css:'saturate(0.85) brightness(1.05)'},
 ink:     {name:'Ink & paper',px:0,mat:'toon',grad:[120,255],ol:2.6,olc:'#1c1410',sh:'basic',cam:'ortho',paper:0.55,css:'contrast(1.12) saturate(0.95) sepia(0.12)'},
 dusk:    {name:'Golden hour',px:0,mat:'toon',grad:[90,170,255],ol:1.5,olc:'#3a1f30',sh:'pcf',cam:'ortho',sun:[-45,11,-4],sunC:'#ffb878',sunI:1.15,hemi:['#ffd2b0','#5a4a7a'],hemiI:0.55,bg:'#e8a88a',css:'saturate(0.95)'},
 night:   {name:'Moonlit night',px:0,mat:'toon',grad:[80,165,255],ol:1.5,olc:'#0a0c1a',sh:'pcf',cam:'ortho',sun:[-18,40,-12],sunC:'#c8d6ff',sunI:0.75,hemi:['#8094d0','#202444'],hemiI:0.55,bg:'#38406a',tint:['#5a6fb8',0.6],css:'contrast(1.12) saturate(1.25) brightness(1.1)'},
 duotone: {name:'Duotone print',px:0,mat:'toon',grad:[110,190,255],ol:2,olc:'#2b1d33',sh:'basic',cam:'ortho',svg:'duo',paper:0.45},
 // look H (Robin 22. 11.): sun-bleached haze + thin warm ink and soft hatching in the shadows
 sun:     {name:'Sun-bleached ink',px:0,mat:'toon',grad:[0,255],ol:0,olc:'#8a5f4c',sh:'pcf',cam:'ortho',haze:1,chunky:1,sunink:1,bg:'#f6dcc6',hemiK:1.18,sunK:0.66},
 sketch:  {name:'Pencil sketch',px:0,mat:'toon',grad:[150,255],ol:2,olc:'#2a2420',sh:'basic',cam:'ortho',paper:0.7,css:'grayscale(0.82) sepia(0.25) contrast(1.15) brightness(1.08)'},
};
// one art style for the whole game: Brawl-like (Robin, 19. 11.)
const STN=(window.FORCE_STYLE)||(new URLSearchParams(location.search).get('s'))||'sun';const ST=STYLES[STN]||STYLES.sun;// look H is the game (Robin 22. 11.: "dej vše na hlavní doménu"); the old look: ?s=brawl
if(/notex/.test(location.hash))ST.tex=false;
if(ST.sunink){document.body.classList.add('lookH');// the UI of look H is the wanderer's notebook (src/notebook.css): handwriting on canvas too, and the pencil joystick
  FF='"Shantell Sans", "Comic Sans MS", "Chalkboard SE", cursive';try{document.fonts.load('600 13px "Shantell Sans"');document.fonts.load('700 13px "Shantell Sans"');}catch(_){}
  const J=document.getElementById('joy');if(J)J.innerHTML=hJoySvg();}// compare: open with #notex for the untextured look


const T=window.THREE;
const stage=$('stage'),canvas=$('c'),ov=$('o'),ctx=ov.getContext('2d');
let cw=0,ch=0,dpr=1;
const TOUCH=matchMedia('(pointer:coarse)').matches;
const R=new T.WebGLRenderer({canvas,antialias:!ST.px&&!TOUCH,powerPreference:'high-performance'});
// dynamic resolution (iPhone run was ~50 fps with uneven frames): render scale drops if frames are slow, creeps back up when there is headroom
let RQ=0,RQmax=2,fpsAcc=0,fpsN=0,fpsT=0,fastT=0;
R.shadowMap.enabled=ST.sh!=='none';R.shadowMap.type={basic:T.BasicShadowMap,pcf:T.PCFShadowMap,pcfsoft:TOUCH?T.PCFShadowMap:T.PCFSoftShadowMap,none:T.BasicShadowMap}[ST.sh];R.outputEncoding=T.sRGBEncoding;
const cam=ST.cam==='persp'?new T.PerspectiveCamera(ST.fov,0.56,1,900):new T.OrthographicCamera(-1,1,1,-1,1,600);let ASP=0.56,PXW=0.1,CAMDIST=120,VH=800;
if(!ST.px)canvas.style.imageRendering='auto';
if(ST.css)canvas.style.filter=ST.css;
if(ST.svg){const d=document.createElement('div');d.innerHTML='<svg width="0" height="0" style="position:absolute"><filter id="wc" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="0.9" result="b"/><feComposite in="b" in2="d" operator="arithmetic" k1="0" k2="0.6" k3="0.4" k4="0"/></filter><filter id="duo"><feColorMatrix type="matrix" values="0.3 0.55 0.15 0 0  0.3 0.55 0.15 0 0  0.3 0.55 0.15 0 0  0 0 0 1 0"/><feComponentTransfer><feFuncR type="table" tableValues="0.12 0.74 0.98"/><feFuncG type="table" tableValues="0.07 0.36 0.88"/><feFuncB type="table" tableValues="0.16 0.26 0.68"/></feComponentTransfer></filter></svg>';document.body.appendChild(d);canvas.style.filter='url(#'+ST.svg+') '+(ST.css||'');}
if(ST.tilt){for(const top of [1,0]){const d=document.createElement('div');d.style.cssText=`position:absolute;left:0;right:0;${top?'top:0':'bottom:0'};height:${ST.tiltH||'38%'};pointer-events:none;backdrop-filter:blur(${ST.tilt}px);-webkit-backdrop-filter:blur(${ST.tilt}px);-webkit-mask-image:linear-gradient(${top?'to bottom':'to top'},#000 10%,transparent);mask-image:linear-gradient(${top?'to bottom':'to top'},#000 10%,transparent)`;canvas.insertAdjacentElement('afterend',d);}}
if(ST.tint){const d=document.createElement('div');d.style.cssText=`position:absolute;inset:0;pointer-events:none;background:${ST.tint[0]};mix-blend-mode:multiply;opacity:${ST.tint[1]}`;canvas.insertAdjacentElement('afterend',d);}
const HAZE=document.createElement('div');HAZE.style.cssText='position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:0;background:'+(ST.sunink?'linear-gradient(to bottom,#f6d8c4 0%,rgba(246,216,196,0.4) 26%,rgba(246,216,196,0) 55%,rgba(255,246,238,0.25) 100%)':'linear-gradient(to bottom,#a88a68 0%,rgba(168,138,104,0.35) 45%,rgba(168,138,104,0) 85%)')+'';if(ST.haze)canvas.insertAdjacentElement('afterend',HAZE);
const TINT=document.createElement('div');TINT.style.cssText='position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;opacity:0';canvas.insertAdjacentElement('afterend',TINT);
// look H: shallow depth of field at the top and bottom of the screen (tilt-shift), drawn by the browser over the canvas
if(ST.sunink){for(const k of ['tsTop','tsBot']){const d=document.createElement('div');d.className='ts '+k;canvas.insertAdjacentElement('afterend',d);}}
// glow texture computed per pixel – a canvas gradient gets dithered by some browsers (Chrome on Mac),
// which showed up as coloured dots in the light around the hero (Robin, 20. 11.)
function radialTex(n,rgb,fall){const c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),id=g.createImageData(n,n),h=(n-1)/2;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const r=Math.min(1,Math.hypot(x-h,y-h)/h),o=(y*n+x)*4;id.data[o]=rgb[0];id.data[o+1]=rgb[1];id.data[o+2]=rgb[2];id.data[o+3]=Math.round(255*fall(r));}
  g.putImageData(id,0,0);const t=new THREE.CanvasTexture(c);return t;}
const GLOWTEX=radialTex(128,[255,255,255],r=>r<0.35?1-0.55*(r/0.35):0.45*Math.pow(1-(r-0.35)/0.65,1.6));
const GLOWS=new Set(),EMIS=[];
function glowPool(col,sc){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:GLOWTEX,color:new THREE.Color(col),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:0}));m.rotation.x=-Math.PI/2;m.scale.set(sc,sc,1);m.renderOrder=1;m.userData.g0=1;GLOWS.add(m);return m;}
function glowSprite(col,sc){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOWTEX,color:new THREE.Color(col),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:0}));m.scale.setScalar(sc);m.userData.g0=1;GLOWS.add(m);return m;}
if(ST.paper){const pc=document.createElement('canvas');pc.width=pc.height=256;const g=pc.getContext('2d');const id=g.createImageData(256,256);
  for(let i=0;i<id.data.length;i+=4){const x=(i/4)%256,y=(i/4)>>8;const v=225+Math.random()*30-12*Math.max(0,Math.sin(x*0.09+y*0.03)*Math.sin(y*0.11-x*0.02));id.data[i]=v;id.data[i+1]=v*0.97;id.data[i+2]=v*0.9;id.data[i+3]=255;}g.putImageData(id,0,0);
  const d=document.createElement('div');d.style.cssText=`position:absolute;inset:0;pointer-events:none;background:url(${pc.toDataURL()});mix-blend-mode:multiply;opacity:${ST.paper}`;canvas.insertAdjacentElement('afterend',d);}
const OUT_W={value:0.08};
// framed on desktop (backdrop + side panels), full screen on phones; on phones use the visual viewport so the canvas is never stretched
function resize(){const vv=window.visualViewport,vw=innerWidth,full=Math.round(vv?vv.height:innerHeight);
  const framed=vw>=760&&vw>full*0.9,B=document.body.classList;B.toggle('framed',framed);B.toggle('wide',framed&&vw>=1180&&full>=560);
  const vh=framed?Math.max(420,full-48):full,sw=Math.min(vw,Math.round(vh*0.5625));stage.style.width=sw+'px';stage.style.height=vh+'px';dpr=Math.min(2,window.devicePixelRatio||1);RQmax=TOUCH?Math.min(dpr,1.75):(ST.sunink?Math.max(dpr,2):dpr);if(!RQ||RQ>RQmax)RQ=RQmax;
  VH=vh;R.setPixelRatio(ST.px?Math.min(ST.px,sw*dpr)/sw:RQ);R.setSize(sw,vh,false);cw=Math.round(sw*dpr);ch=Math.round(vh*dpr);ov.width=cw;ov.height=ch;ASP=sw/vh;}
addEventListener('resize',resize);if(window.visualViewport)visualViewport.addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,250));resize();
const grainC=document.createElement('canvas');grainC.width=grainC.height=180;
(()=>{const g=grainC.getContext('2d'),id=g.createImageData(180,180);for(let i=0;i<id.data.length;i+=4){const v=Math.random()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=Math.random()<0.5?14:0;}g.putImageData(id,0,0);})();
const grain=ctx.createPattern(grainC,'repeat');

const C=h=>new T.Color(h).convertSRGBToLinear();
const matCache={};
const TOON=(()=>{const gr=ST.grad||[100,178,255];const d=new Uint8Array(gr);const t=new T.DataTexture(d,gr.length,1,T.LuminanceFormat);t.minFilter=t.magFilter=ST.gradSmooth?T.LinearFilter:T.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;})();
const PATS={'#c4875a':5,'#b97a50':5,'#7f6046':2,'#d6cfbf':3,'#4d7392':3,'#e6d2ad':1,'#dcc7a3':1,'#8f5b36':2,'#5d4632':2,'#5d4a3a':2,'#6e5a48':2,'#7d6a58':2,'#86765a':2,'#9c8a6a':2,'#b07a48':2,'#8a7a5c':2,
  '#8b8f96':3,'#7d8188':3,'#5d6168':3,'#6f8f9a':3,'#a0623c':3,'#b98a62':5,'#3d4f74':7,'#efe2c4':8,'#c8643c':9};
function patOf(c){if(typeof c!=='string')return 9;c=c.toLowerCase();if(PATS[c]!==undefined)return PATS[c];const q={};new T.Color(c).getHSL(q);const h=q.h,s=q.s,l=q.l;
  if(s<0.12)return l>0.78?1:3;if(h>0.2&&h<0.47)return 9;if(h>0.5&&h<0.75)return s>0.4?9:3;if(h<0.15||h>0.94){if(l>0.7)return 1;if(l<0.4)return 2;return 5;}return 9;}
function M(c,o){if(ST.sunink&&typeof c==='string'&&!HPSET.has(c))c=hCol(c);const key=c+JSON.stringify(o||{});if(matCache[key])return matCache[key];o=Object.assign({},o||{});if(o.emissive)o.emissive=C(o.emissive);
  const pat=o.pat!==undefined?o.pat:(o.emissive||o.transparent?0:patOf(c));delete o.pat;
  const m=MAT(Object.assign({color:C(c)},o));m.userData.pat=pat;if(o.emissive){m.userData.e0=o.emissiveIntensity===undefined?1:o.emissiveIntensity;EMIS.push(m);}matCache[key]=m;return m;}
const HPSET=new Set(Object.values(HP));
const RIM={value:new T.Color(0,0,0)};
// ---- Brawl-like shading: painted top light, cool saturated undersides, light edge highlight (no dark outlines), soft gloss on characters ----
const BR_EDGE={value:new T.Color(0,0,0)};
let BLOBTEX=null;function blobShadow(par,r){if(!ST.brawl)return;if(!BLOBTEX){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');BLOBTEX=radialTex(64,[40,24,40],r=>r<0.55?0.55-0.17*(r/0.55):0.38*(1-(r-0.55)/0.45));}
  const m=new T.Mesh(G.disc24,new T.MeshBasicMaterial({map:BLOBTEX,transparent:true,depthWrite:false,fog:false}));m.scale.setScalar(r*2);m.position.y=0.03;m.renderOrder=1;par.add(m);return m;}
const PAT_GLSL=`uniform float uPat;varying vec3 vOP;varying vec3 vON;
float ph1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float pvn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(ph1(i),ph1(i+vec2(1,0)),f.x),mix(ph1(i+vec2(0,1)),ph1(i+vec2(1,1)),f.x),f.y);}
float pfb(vec2 p){return 0.5*pvn(p)+0.3*pvn(p*2.1+3.1)+0.2*pvn(p*4.3+7.7);}
vec3 texPat(vec3 c){vec3 an=abs(vON);vec2 uv;bool top=an.y>an.x&&an.y>an.z;if(top)uv=vOP.xz;else if(an.x>an.z)uv=vec2(vOP.z,vOP.y);else uv=vOP.xy;
 int k=int(uPat+0.5);float dirt=0.94+0.1*pfb(uv*1.3+17.0);
 if(k==1){float m=0.94+0.1*pfb(uv*2.6)-step(0.94,ph1(floor(uv*22.0)))*0.07;
   vec2 b=uv*vec2(3.4,7.0);b.x+=0.5*mod(floor(b.y),2.0);vec2 fb=fract(b);float mort=step(0.07,fb.x)*step(0.12,fb.y);
   vec3 brick=vec3(0.44,0.15,0.08)*(0.8+0.4*ph1(floor(b)));float pt=smoothstep(0.6,0.64,pfb(uv*0.7+11.0));
   c=mix(c*m,mix(c*0.5,brick,mort),pt);}
 else if(k==2){float w=0.28;float pl=floor(uv.y/w);float f=fract(uv.y/w);float seam=smoothstep(0.0,0.07,f)*smoothstep(1.0,0.93,f);
   float gr=0.9+0.1*sin(uv.x*13.0+pfb(uv*vec2(0.8,7.0))*7.0+pl*3.7);float tone=0.84+0.22*ph1(vec2(pl,3.0));
   float knot=1.0-0.25*smoothstep(0.06,0.0,length(fract(vec2(uv.x*0.7+pl*0.37,f))-vec2(0.5)));c*=mix(0.55,1.0,seam)*gr*tone*knot;}
 else if(k==3){vec2 g=fract(uv/0.85);float e=min(min(g.x,1.0-g.x),min(g.y,1.0-g.y));float m=mix(0.68,1.0,smoothstep(0.0,0.035,e));
   vec2 rv=fract(uv/0.85*4.0)-0.5;float riv=(e<0.07)?smoothstep(0.16,0.1,length(rv)):0.0;m*=0.92+0.1*pvn(vec2(uv.x*7.0,uv.y*0.5))+riv*0.25;
   float r=smoothstep(0.52,0.74,pfb(uv*1.4+5.0));c=mix(c*m,vec3(0.33,0.11,0.035)*(0.75+0.5*pfb(uv*7.0)),r*0.75);}
 else if(k==5){float n=pfb(uv*1.5);float m=0.8+0.32*n;float cr=abs(pvn(uv*2.2+4.0)-0.5);m*=mix(0.72,1.0,smoothstep(0.0,0.03,cr));
   m*=0.93+0.07*sin(uv.y*10.0+n*4.0);c*=m;}
 else if(k==6){float rh=0.3;float row=floor(uv.y/rh);float f=fract(uv.y/rh);float u=uv.x/0.46+0.5*mod(row,2.0);float g=fract(u);
   c*=(0.7+0.32*f)*(0.88+0.18*ph1(vec2(row,floor(u))))*mix(0.62,1.0,smoothstep(0.0,0.06,g)*smoothstep(1.0,0.94,g));}
 else if(k==7){vec2 g=fract(uv/0.24);float ln=step(0.07,g.x)*step(0.07,g.y);c=mix(vec3(0.5,0.55,0.62)*0.55,c*(0.75+0.5*smoothstep(0.0,1.0,g.y)),ln);}
 else if(k==8){c*=(0.93+0.04*sin(uv.x*90.0)+0.04*sin(uv.y*90.0))*(0.9+0.12*pfb(uv*1.8));}
 else{c*=dirt*(0.95+0.06*pvn(uv*9.0));}
 return c;}
`;
function brawlify(m,isChar){if(!ST.brawl||!m.isMeshToonMaterial)return m;const lum=m.color?(0.3*m.color.r+0.59*m.color.g+0.11*m.color.b):0.5;const top=m.vertexColors?0.0:0.16*Math.max(0,Math.min(1,(0.62-lum)/0.3));
  m.userData.brChar=isChar?1:0;
  m.onBeforeCompile=sh=>{sh.uniforms.uRim=RIM;sh.uniforms.uEdge=BR_EDGE;sh.uniforms.uBr={value:new T.Vector4(top,m.vertexColors?0.25:0.55,isChar?0.16:0.0,isChar?1.0:0.0)};
    const pat=(!isChar&&!m.map&&!m.vertexColors&&ST.tex!==false)?(m.userData.pat||0):0;sh.uniforms.uPat={value:pat};
    if(pat){sh.vertexShader='varying vec3 vOP;varying vec3 vON;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvOP=transformed*vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));vON=objectNormal;');
      sh.fragmentShader=PAT_GLSL+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=texPat(diffuseColor.rgb);');}
    sh.fragmentShader='uniform vec3 uRim;uniform vec3 uEdge;uniform vec4 uBr;\n'+sh.fragmentShader.replace('#include <dithering_fragment>',
`{vec3 wn=normalize((vec4(normal,0.0)*viewMatrix).xyz);vec3 Vd=normalize(vViewPosition);vec3 c=gl_FragColor.rgb;
 c*=1.0+uBr.x*smoothstep(0.35,0.92,wn.y);
 float dn=smoothstep(0.15,-0.75,wn.y);c=mix(c,c*vec3(0.78,0.78,1.0),dn*(uBr.y+0.15*uBr.w));
 float fr=1.0-clamp(dot(normal,Vd),0.0,1.0);float e=smoothstep(0.52,0.82,fr);
 c+=uEdge*e*(1.0-uBr.w)+(uRim*0.75+uEdge*0.35)*e*uBr.w;
 #if NUM_DIR_LIGHTS>0
 vec3 Hh=normalize(directionalLights[0].direction+Vd);float sp=smoothstep(0.91,0.98,dot(normal,Hh));c+=directionalLights[0].color*sp*uBr.z;
 #endif
 gl_FragColor.rgb=c;}
#include <dithering_fragment>`);};
  m.customProgramCacheKey=()=>'br'+(isChar?1:0)+(m.vertexColors?'v':'')+((!isChar&&!m.map&&!m.vertexColors&&m.userData.pat)?'p':'');return m;}
function rimify(m){if(ST.sunink){m.userData.char=1;return m;}if(!m.isMeshToonMaterial)return m;if(ST.brawl)return brawlify(m,1);m.onBeforeCompile=sh=>{sh.uniforms.uRim=RIM;sh.fragmentShader='uniform vec3 uRim;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','{float rr=1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0);gl_FragColor.rgb+=uRim*smoothstep(0.5,0.72,rr);}\n#include <dithering_fragment>');};m.customProgramCacheKey=()=>'rim';return m;}
function TMR(c){const k='R|'+c;return matCache[k]||(matCache[k]=rimify(MAT({color:C(c)})));}
function MAT(o){o=Object.assign({},o);const k=ST.mat;
  if(k==='flat')return new T.MeshStandardMaterial(Object.assign({flatShading:true,roughness:0.92,metalness:0},o));
  delete o.flatShading;
  if(k==='soft')return new T.MeshStandardMaterial(Object.assign({roughness:0.82,metalness:0},o));
  delete o.roughness;delete o.metalness;
  if(k==='lambert')return new T.MeshLambertMaterial(o);
  if(ST.sunink)return sunify(new T.MeshToonMaterial(Object.assign({gradientMap:TOON},o)));
  return brawlify(new T.MeshToonMaterial(Object.assign({gradientMap:TOON},o)),0);}
// look H shading (22. 11.): two flat tones like in a hand-coloured drawing. A face is either in the sun (near white light, tops a touch brighter than
// sunlit walls) or in shade (one grey-mauve tone for both unlit sides and cast shadows, with thin diagonal hatching). Shadow edges come out crisp.
// Colours are only nudged toward the palette; the ground is bleached almost white so everything on it reads clearly.
const PEACH={value:C('#f6e2cf')};
const HU={ground:{value:C('#fdf2e9')},lit:{value:new T.Color(1,1,1)},shade:{value:new T.Color(0.5,0.43,0.47)},sunL:{value:1},pr:{value:2}};
function sunify(m){m.onBeforeCompile=sh=>{const gr=!!(m.map&&m.vertexColors),ch=m.userData.char?1:0;
  sh.uniforms.uPeach=PEACH;sh.uniforms.uGround=HU.ground;sh.uniforms.uLit=HU.lit;sh.uniforms.uShade=HU.shade;sh.uniforms.uSunL=HU.sunL;sh.uniforms.uPR=HU.pr;
  if(gr){sh.vertexShader='varying vec3 vWP;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='varying vec3 vWP;\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n{float w=sin(vWP.x*0.11+sin(vWP.z*0.07)*2.3+vWP.z*0.035);float c=smoothstep(0.82,0.97,w);diffuseColor.rgb*=0.95+0.05*w;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,0.98,0.95),c*0.35);}');}
  sh.fragmentShader='uniform vec3 uPeach;uniform vec3 uGround;uniform vec3 uLit;uniform vec3 uShade;uniform float uSunL;uniform float uPR;\n'+sh.fragmentShader
  .replace('#include <color_fragment>','#include <color_fragment>\n{float lum=dot(diffuseColor.rgb,vec3(.3,.59,.11));'+(gr?'diffuseColor.rgb=mix(diffuseColor.rgb,uGround,0.55);':ch?'':'diffuseColor.rgb=mix(diffuseColor.rgb,uPeach,0.06+0.14*(1.0-smoothstep(0.02,0.25,lum)));')+'}')
  .replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
`vec3 alb=diffuseColor.rgb;float kL=clamp(dot(reflectedLight.directDiffuse,vec3(1.0))/max(1e-4,dot(alb,vec3(1.0))*uSunL),0.0,1.0);
 float lit=smoothstep(0.40,0.60,kL);vec3 wn=normalize((vec4(normal,0.0)*viewMatrix).xyz);
 vec3 lc=uLit*mix(vec3(0.91,0.81,0.84),vec3(1.0),smoothstep(0.25,0.85,wn.y));
 vec3 sc=uShade*${ch?'vec3(1.30,1.36,1.34)':'vec3(1.0)'};
 float hs=${gr?'4.6':'4.0'}*uPR;float hv=abs(fract((gl_FragCoord.x-gl_FragCoord.y)/hs)-0.5)*hs;float hatch=1.0-smoothstep(0.3*uPR,0.3*uPR+1.0,hv);
 vec3 outgoingLight=alb*mix(sc*(1.0-hatch*${ch?'0.0':'0.14'}),lc,lit)+totalEmissiveRadiance;`);
  // alpha tells the ink pass how eagerly to draw fold lines here: characters only get their outlines and big overlaps, not every facet
  if(!m.transparent)sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.a='+(ch?'0.22':gr?'0.3':'1.0')+';');};
  m.customProgramCacheKey=()=>'sun3'+(m.vertexColors?'v':'')+(m.map?'m':'')+(m.userData.char?'c':'')+(m.transparent?'t':'');return m;}
const TM=M;
const OUTC=C(ST.olc||'#3a261a'),omc={};
function OL(th){const k=(th/0.014).toFixed(3);if(omc[k])return omc[k];
  return omc[k]=new T.ShaderMaterial({side:T.BackSide,uniforms:{uW:OUT_W,uK:{value:+k},uC:{value:OUTC}},
    vertexShader:'uniform float uW;uniform float uK;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 n=normalize(normalMatrix*normal);mv.xyz+=n*uW*uK;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 uC;void main(){gl_FragColor=vec4(uC,1.0);}'});}
let PART_OL=0;
function mk(geo,col,par,o){o=o||{};const m=new T.Mesh(geo,typeof col==='string'?TMR(col):col);m.castShadow=o.shadow!==false;m.receiveShadow=true;
  if(o.ol!==0&&ST.ol){const ol=new T.Mesh(geo,OL(o.ol||0.014));ol.castShadow=false;ol.receiveShadow=false;m.add(ol);}
  if(o.p)m.position.set(o.p[0],o.p[1],o.p[2]);if(o.r)m.rotation.set(o.r[0],o.r[1],o.r[2]);if(par)par.add(m);return m;}
function cgrp(par,p,r){const g=new T.Group();if(p)g.position.set(p[0],p[1],p[2]);if(r)g.rotation.set(r[0],r[1],r[2]);if(par)par.add(g);return g;}
const G={};
G.box=new T.BoxGeometry(1,1,1);G.cyl=new T.CylinderGeometry(0.5,0.5,1,8);G.cyl6=new T.CylinderGeometry(0.5,0.5,1,6);G.cyl4=new T.CylinderGeometry(0.5,0.5,1,4);
G.cone5=new T.ConeGeometry(0.5,1,5);G.cone7=new T.ConeGeometry(0.5,1,7);G.cone3=new T.ConeGeometry(0.5,1,3);G.ico=new T.IcosahedronGeometry(0.5,0);G.sph=new T.SphereGeometry(0.5,8,6);
G.dode=new T.DodecahedronGeometry(0.5,0);G.oct=new T.OctahedronGeometry(0.5,0);
G.disc=new T.CircleGeometry(0.5,9);G.disc.rotateX(-Math.PI/2);G.disc16=new T.CircleGeometry(0.5,16);G.disc16.rotateX(-Math.PI/2);
G.ring=new T.RingGeometry(0.42,0.5,24);G.ring.rotateX(-Math.PI/2);
G.disc96=new T.CircleGeometry(0.5,96);G.disc96.rotateX(-Math.PI/2);G.ring96=new T.RingGeometry(0.494,0.5,96,1);G.ring96.rotateX(-Math.PI/2);G.disc24=new T.CircleGeometry(0.5,24);G.disc24.rotateX(-Math.PI/2);
const SAND=ST.sunink?'#f9dec3':'#d0aa70',PLAZA=ST.sunink?'#fbe6d2':'#dcc08c',DUSTC='#ad9ca4';
G.dome=new T.SphereGeometry(0.5,10,6,0,Math.PI*2,0,Math.PI/2);G.half=new T.SphereGeometry(0.5,8,4,0,Math.PI*2,0,Math.PI/2);
G.domeEdges=new T.EdgesGeometry(G.dome);
G.roof=(()=>{const s=new T.Shape();s.moveTo(-0.5,0);s.lineTo(0.5,0);s.lineTo(0,1);s.closePath();const e=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false});e.translate(0,0,-0.5);return e;})();
function part(geo,mat,x,y,z,sx,sy,sz,par,noShadow){const m=new T.Mesh(geo,typeof mat==='string'?(geo===G.roof?M(mat,{pat:6}):M(mat)):mat);m.position.set(x,y,z);m.scale.set(sx,sy===undefined?sx:sy,sz===undefined?sx:sz);
  if(!noShadow){m.castShadow=true;m.receiveShadow=true;if(ST.ol&&!(m.material.transparent)&&!m.material.isMeshBasicMaterial){const o=new T.Mesh(geo,OL(PART_OL||0.012));m.add(o);}}if(par)par.add(m);return m;}
function grp(x,y,z,par){const g=new T.Group();g.position.set(x||0,y||0,z||0);if(par)par.add(g);return g;}
const toV=(x,y,h)=>new T.Vector3(x*S,h||0,y*S);
const _v=new T.Vector3();
function proj(x3,y3,z3){_v.set(x3,y3,z3).project(cam);return {x:(_v.x*0.5+0.5)*cw,y:(-_v.y*0.5+0.5)*ch,z:_v.z,on:_v.z<1&&Math.abs(_v.x)<1.05&&Math.abs(_v.y)<1.05};}
function setupLights(scene){
  const hm=ST.hemi||['#fff1d8','#9c7048'];const hemi=new T.HemisphereLight(C(hm[0]),C(hm[1]),ST.hemiI||0.62);scene.add(hemi);
  const sun=new T.DirectionalLight(C(ST.sunC||'#ffeccc'),ST.sunI||0.98);sun.castShadow=ST.sh!=='none';sun.shadow.mapSize.set(ST.px||TOUCH?1024:2048,ST.px||TOUCH?1024:2048);
  const sc=sun.shadow.camera;sc.left=-38;sc.right=38;sc.top=38;sc.bottom=-38;sc.near=1;sc.far=160;sun.shadow.bias=-0.0012;sun.shadow.normalBias=0.03;
  sun.userData.hemi=hemi;scene.add(sun);scene.add(sun.target);return sun;
}
function placeSun(sun,x,z){x=Math.round(x/8)*8;z=Math.round(z/8)*8;const so=ST.sun||DAY.off;sun.position.set(x+so[0],so[1],z+so[2]);sun.target.position.set(x,0,z);}
// ================= day cycle =================
const DAYLEN=360;
const DK=[
 [0.000,{sun:'#ffb98a',sI:0.7, off:[40,12,14], sky:'#e2c8dc',gnd:'#7a5e7e',hI:0.56,bg:'#ebc4a6',tint:'#c890a8',tO:0.10,rim:'#ffd0b0',rI:0.34,em:0.7,gl:0.3,n:0.15}],
 [0.090,{sun:'#ffeccc',sI:1.0, off:[26,34,18], sky:'#f1e2e6',gnd:'#8a6a72',hI:0.62,bg:'#efd3a0',tint:'#ffffff',tO:0,  rim:'#fff0d0',rI:0.28,em:0.35,gl:0,n:0}],
 [0.340,{sun:'#fff2dc',sI:1.05,off:[-8,44,16], sky:'#f1e4ea',gnd:'#8a6a74',hI:0.64,bg:'#f1d6a4',tint:'#ffffff',tO:0,  rim:'#fff0d0',rI:0.26,em:0.35,gl:0,n:0}],
 [0.550,{sun:'#ffb878',sI:1.15,off:[-45,12,-2],sky:'#ffd2b0',gnd:'#5a4a7a',hI:0.56,bg:'#eaac8c',tint:'#ff9a6a',tO:0.07,rim:'#ffc890',rI:0.42,em:0.6,gl:0.15,n:0}],
 [0.630,{sun:'#ff8a8a',sI:0.55,off:[-48,6,0],  sky:'#b8a0d0',gnd:'#3a3060',hI:0.5, bg:'#c08ca4',tint:'#a07ac8',tO:0.2,rim:'#d8b8ff',rI:0.36,em:1.0,gl:0.7,n:0.4}],
 [0.665,{sun:'#9a8ac0',sI:0.12,off:[-48,5,0],  sky:'#8a88c4',gnd:'#262848',hI:0.52,bg:'#555a88',tint:'#5a6fb8',tO:0.42,rim:'#b0c4ff',rI:0.4, em:1.25,gl:1,n:0.85}],
 [0.700,{sun:'#c8d6ff',sI:0.7, off:[-18,40,-12],sky:'#8094d0',gnd:'#202444',hI:0.56,bg:'#3a426c',tint:'#5a6fb8',tO:0.55,rim:'#a8c0ff',rI:0.45,em:1.3,gl:1,n:1}],
 [0.900,{sun:'#c8d6ff',sI:0.7, off:[10,40,-12], sky:'#8094d0',gnd:'#202444',hI:0.56,bg:'#3a426c',tint:'#5a6fb8',tO:0.55,rim:'#a8c0ff',rI:0.45,em:1.3,gl:1,n:1}],
 [0.945,{sun:'#c0b0f0',sI:0.15,off:[20,40,-12], sky:'#9088c8',gnd:'#2c2a50',hI:0.52,bg:'#6a6898',tint:'#6a6ab0',tO:0.38,rim:'#c0b8ff',rI:0.38,em:1.1,gl:0.85,n:0.7}],
 [0.970,{sun:'#d8a8c0',sI:0.3, off:[44,6,14],  sky:'#b8a4d0',gnd:'#4a3e68',hI:0.52,bg:'#b294aa',tint:'#9a80b8',tO:0.22,rim:'#e0c0e0',rI:0.34,em:0.9,gl:0.6,n:0.35}],
];
// look H keeps the paper feel around the clock: dusk is a dusty rose, night a pale periwinkle sheet under a cool moon (no dark overlay, the pen lines stay readable)
const DKH=DK.map(([t,k])=>[t,Object.assign({},k,{tO:0},({
  0:    {sun:'#ffd2b0',sI:0.85,sky:'#f3e2e4',hI:0.66,bg:'#f3d2c0'},
  0.55: {sun:'#ffc898',sI:1.1, sky:'#ffe2d0',hI:0.6, bg:'#f2c6a8'},
  0.63: {sun:'#ffb0a0',sI:0.7, sky:'#e6cfe0',hI:0.75,bg:'#eac0bc'},
  0.665:{sun:'#b8b4e8',sI:0.35,sky:'#b6b4e4',hI:0.78,bg:'#a9a3c6'},
  0.7:  {sun:'#dfe6ff',sI:0.45,sky:'#9fb0f0',hI:0.75,bg:'#a4abcf'},
  0.9:  {sun:'#dfe6ff',sI:0.45,sky:'#9fb0f0',hI:0.75,bg:'#a4abcf'},
  0.945:{sun:'#d6c4f0',sI:0.35,sky:'#c0b4e0',hI:0.76,bg:'#b4a8c8'},
  0.97: {sun:'#ffc4b8',sI:0.6, sky:'#ead6e0',hI:0.72,bg:'#e4c2c2'}})[t]||{})]);
const DKD=DK;
const _ca=new T.Color(),_cb=new T.Color();
const DAY={off:[-22,40,18],n:0,haze:'242,226,190',sky:new T.Color(),gnd:new T.Color(),sun:new T.Color(),bg:new T.Color(),rim:new T.Color()};
function dayEval(t){const DK=ST.sunink?DKH:DKD;t=((t%1)+1)%1;let i=DK.length-1;for(let k=0;k<DK.length;k++)if(DK[k][0]<=t)i=k;
  const a=DK[i],b=DK[(i+1)%DK.length];const t1=b[0]<=a[0]?b[0]+1:b[0];let f=(t-a[0])/(t1-a[0]);f=f*f*(3-2*f);const A=a[1],B=b[1];const L=(x,y)=>x+(y-x)*f;
  const col=(ka,out)=>{_ca.set(A[ka]);_cb.set(B[ka]);out.copy(_ca).lerp(_cb,f);return out;};
  const r={sI:L(A.sI,B.sI),hI:L(A.hI,B.hI),tO:L(A.tO,B.tO),rI:L(A.rI,B.rI),em:L(A.em,B.em),gl:L(A.gl,B.gl),n:L(A.n,B.n),off:[0,1,2].map(j=>L(A.off[j],B.off[j]))};
  r.sun=col('sun',new T.Color());r.sky=col('sky',new T.Color());r.gnd=col('gnd',new T.Color());r.bg=col('bg',new T.Color());r.rim=col('rim',new T.Color());r.tint=col('tint',new T.Color());return r;}
let dayIcon='';
function applyDay(scn,sun){if(!scn||!sun)return;const d=dayEval(SV.tod||0);DAY.off=d.off;DAY.n=d.n;
  const lin=c=>c.clone().convertSRGBToLinear();
  sun.color.copy(lin(d.sun));sun.intensity=d.sI*0.8*(ST.sunK||1);const h=sun.userData.hemi;if(h){h.color.copy(lin(d.sky));h.groundColor.copy(lin(d.gnd));h.intensity=d.hI*0.85*(ST.hemiK||1);}
  if(ST.sunink){const L=HU.lit.value;L.copy(sun.color).multiplyScalar(sun.intensity);const hc=h?h.color:sun.color,hi=h?h.intensity:0;L.r=(L.r+hc.r*hi)*0.92;L.g=(L.g+hc.g*hi)*1.01;L.b=(L.b+hc.b*hi)*1.045;
    HU.shade.value.setRGB(L.r*0.50,L.g*0.43,L.b*0.47);HU.sunL.value=Math.max(0.02,(sun.color.r+sun.color.g+sun.color.b)/3*sun.intensity);HU.pr.value=R.getPixelRatio();}
  const bg=lin(d.bg);if(ST.sunink)bg.lerp(C(ST.bg),0.85*(1-d.n));
  if(ST.sunink){const hb=bg.clone().convertLinearToSRGB();DAY.haze=Math.round(hb.r*255)+','+Math.round(hb.g*255)+','+Math.round(hb.b*255);if(DAY.haze!==DAY.hz0){DAY.hz0=DAY.haze;document.body.style.setProperty('--hfade',DAY.haze);}}// the edge of sight fades into the same peach haze as the distance
  if(scn.background)scn.background.copy(bg);if(scn.fog)scn.fog.color.copy(bg);
  if(!ST.sunink)DAY.haze=Math.round(d.bg.r*255)+','+Math.round(d.bg.g*255)+','+Math.round(d.bg.b*255);
  RIM.value.copy(lin(d.rim)).multiplyScalar(d.rI);BR_EDGE.value.copy(lin(d.rim)).multiplyScalar(0.10+0.12*d.n);
  TINT.style.background='#'+d.tint.getHexString();TINT.style.opacity=d.tO.toFixed(3);HAZE.style.opacity=((ST.sunink?0.42:0.34)*(1-d.n)).toFixed(3);
  for(const m of EMIS)m.emissiveIntensity=m.userData.e0*d.em;
  for(const g of GLOWS)g.material.opacity=d.gl*(g.userData.g0||1);
  const t=SV.tod||0;const ic=t<0.07||t>0.955?'dawn':t<0.58?'sun':t<0.66?'dusk':'moon';if(ic!==dayIcon){dayIcon=ic;const e=$('rT');if(e)e.innerHTML=icSvg(ic)+' ';}}
// ortho camera with pixel snapping
const CAMD=120;const _r=new T.Vector3(),_u=new T.Vector3();
function orthoView(tx,tz,width,el){const H=width/ASP;el+=ST.el||0;
  if(cam.isPerspectiveCamera){const d=(H/2)/Math.tan(cam.fov*Math.PI/360);cam.aspect=ASP;cam.near=Math.max(1,d*0.2);cam.far=d*6;cam.updateProjectionMatrix();CAMDIST=d;
    cam.position.set(tx,Math.sin(el)*d,tz+Math.cos(el)*d);}
  else{cam.left=-width/2;cam.right=width/2;cam.top=H/2;cam.bottom=-H/2;cam.updateProjectionMatrix();CAMDIST=CAMD;cam.position.set(tx,Math.sin(el)*CAMD,tz+Math.cos(el)*CAMD);}
  cam.lookAt(tx,0,tz);cam.updateMatrixWorld();
  PXW=H/Math.max(1,R.domElement.height);OUT_W.value=ST.px?PXW*ST.ol:(H/VH)*ST.ol;if(!ST.px)return;
  _r.setFromMatrixColumn(cam.matrixWorld,0);_u.setFromMatrixColumn(cam.matrixWorld,1);snapPx(cam.position);cam.updateMatrixWorld();}
function snapPx(p){if(!ST.px)return;const dx=p.dot(_r),dy=p.dot(_u);p.addScaledVector(_r,Math.round(dx/PXW)*PXW-dx).addScaledVector(_u,Math.round(dy/PXW)*PXW-dy);}
const TQ=()=>ST.q?Math.floor(tNow*12)/12:tNow;


// ================= models =================
const P={wall:'#e6d2ad',wall2:'#dcc7a3',wood:'#8f5b36',dark:'#5d4632',metal:'#8b8f96',rust:'#a0623c',sand:'#e4c591'};
const TEX={};
function canTex(key,w,h,draw,rep){if(TEX[key])return TEX[key];const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;if(rep)t.repeat.set(rep[0],rep[1]);t.anisotropy=4;return TEX[key]=t;}
function roofTex(){return canTex('roof',256,256,(g,w,h)=>{g.fillStyle='#b4593b';g.fillRect(0,0,w,h);const rows=4,cols=6,rw=w/rows,ch=h/cols;
  for(let r=0;r<rows;r++){const x0=r*rw;const off=(r%2)*ch/2;g.fillStyle=r%2?'#bd6242':'#ab5236';g.fillRect(x0,0,rw,h);
    for(let k=-1;k<=cols;k++){const y=k*ch+off;g.fillStyle='rgba(255,220,190,0.16)';g.beginPath();g.ellipse(x0+rw*0.62,y+ch/2,rw*0.3,ch*0.36,0,0,6.283);g.fill();
      g.strokeStyle='rgba(70,28,16,0.55)';g.lineWidth=3;g.beginPath();g.moveTo(x0,y);g.lineTo(x0+rw*0.92,y);g.stroke();}
    g.fillStyle='rgba(70,28,16,0.45)';g.fillRect(x0+rw-5,0,5,h);}
},[1,1]);}
function plasterTex(){return canTex('plaster',256,256,(g,w,h)=>{g.fillStyle='#ead6b4';g.fillRect(0,0,w,h);const r=mulberry32(5);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${r()<0.5?'150,110,70':'255,245,225'},${0.05+r()*0.08})`;g.fillRect(r()*w,r()*h,1+r()*3,1+r()*3);}
  g.strokeStyle='rgba(120,85,55,0.25)';g.lineWidth=1.5;for(let i=0;i<3;i++){let x=r()*w,y=r()*h;g.beginPath();g.moveTo(x,y);for(let k=0;k<5;k++){x+=(r()-0.5)*30;y+=r()*18;g.lineTo(x,y);}g.stroke();}
  g.fillStyle='rgba(150,110,70,0.12)';g.fillRect(0,h*0.86,w,h*0.14);},[1,1]);}
function plankTex(key,base,n){return canTex(key,256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);const r=mulberry32(n*13);const ph=h/n;
  for(let i=0;i<n;i++){g.fillStyle=`rgba(255,235,200,${0.04+r()*0.08})`;g.fillRect(0,i*ph,w,ph);g.fillStyle='rgba(50,28,14,0.55)';g.fillRect(0,i*ph,w,3);
    g.strokeStyle='rgba(60,35,18,0.18)';g.lineWidth=1;for(let k=0;k<3;k++){const y=i*ph+6+r()*(ph-10);g.beginPath();g.moveTo(0,y);g.bezierCurveTo(w*0.3,y+(r()-0.5)*6,w*0.6,y+(r()-0.5)*6,w,y);g.stroke();}
    g.fillStyle='rgba(40,25,15,0.6)';for(const x of [w*0.05,w*0.95]){g.beginPath();g.arc(x,i*ph+ph/2,2.5,0,6.283);g.fill();}}},[1,1]);}
function makeHouse(){if(ST.sunink)return makeHouseH();PART_OL=0.014;
  const h=grp();part(G.box,MAT({color:0xffffff,map:plasterTex()}),0,1.6,0,6.4,3.2,4.6,h);
  const roofM=MAT({color:0xffffff,map:roofTex()});part(G.roof,roofM,0,3.2,0,7.2,2.2,5.4,h);
  part(G.box,MAT({color:0xffffff,map:plankTex('door','#6a4a34',5)}),0,0.95,2.32,1.1,1.9,0.12,h);const win=M('#ffd98a',{emissive:'#ffb84a',emissiveIntensity:0.5});
  part(G.box,win,-2,1.9,2.32,1,0.85,0.12,h);part(G.box,win,2,1.9,2.32,1,0.85,0.12,h);
  part(G.box,'#c8643c',0,2.75,2.7,2.8,0.12,1,h);part(G.box,MAT({color:0xffffff,map:plankTex('porch','#9a6a44',4)}),0,0.1,3.2,7,0.2,1.6,h);
  part(G.cyl,'#9a9ea5',2.3,4.2,-1,0.5,1.3,0.5,h);PART_OL=0;
  for(const gx of [-1.6,1.6]){const gs=glowSprite('#ffa848',3.6);gs.position.set(gx,1.6,2.7);h.add(gs);}const gd=glowSprite('#ff9a40',5);gd.position.set(0,1.0,3.0);gd.userData.g0=0.8;h.add(gd);
  return h;
}
function makeBot(col,s){if(ST.sunink)return makeBotH(col,s);
  const b=grp();const body=grp(0,1.1*s,0,b);
  part(G.ico,M(col,{roughness:0.6,metalness:0.15}),0,0,0,1.2*s,1.2*s,1.2*s,body);
  const eye=part(G.cyl,'#fff8ea',0,0.05*s,0.52*s,0.6*s,0.08,0.6*s,body);eye.rotation.x=Math.PI/2;
  const pup=part(G.cyl,'#3a2a20',0.04*s,0.05*s,0.58*s,0.28*s,0.06,0.28*s,body);pup.rotation.x=Math.PI/2;
  part(G.cyl4,P.dark,0,0.75*s,0,0.06,0.5*s,0.06,body);
  const tip=part(G.sph,new T.MeshStandardMaterial({color:C('#ffd36e'),emissive:C('#ffb020'),emissiveIntensity:0.8}),0,1.02*s,0,0.2*s,0.2*s,0.2*s,body);
  const sh=part(G.disc,new T.MeshBasicMaterial({color:C('#6e4628'),transparent:true,opacity:0.18,depthWrite:false}),0,0.04,0,1.1*s,1,1.1*s,b,true);
  return {g:b,body,tip,pup,s,ph:Math.random()*6};
}
function animBot(o,t){o.body.position.y=1.1*o.s+Math.sin(t*3+o.ph)*0.15;o.body.rotation.z=Math.sin(t*2+o.ph)*0.08;o.tip.material.emissiveIntensity=Math.sin(t*4+o.ph)>0?1:0.15;o.pup.position.x=Math.sin(t*0.7+o.ph)*0.08*o.s;}
function makeWalker(){
  const w=grp();
  const robe=part(G.cone7,'#c8643c',0,0.95,0,1.24,1.5,1.24,w);
  part(G.sph,'#f1dfc0',0,1.82,0,0.68,0.68,0.68,w);part(G.sph,'#ddc49b',0,1.84,-0.1,0.6,0.6,0.6,w);
  part(G.box,P.dark,0,1.84,0.31,0.22,0.08,0.05,w);
  const scarf=part(G.box,'#f1dfc0',0.1,1.62,-0.5,0.14,0.06,0.7,w);
  const pack=grp(0,1.2,-0.42,w);part(G.box,P.wood,0,0,0,0.5,0.6,0.32,pack);part(G.box,'#6e4426',0,0.32,0,0.52,0.06,0.34,pack);
  const lg=new T.CylinderGeometry(0.07,0.07,0.45,5);lg.translate(0,-0.2,0);
  const legL=part(lg,P.dark,-0.16,0.42,0,1,1,1,w),legR=part(lg,P.dark,0.16,0.42,0,1,1,1,w);
  return {g:w,robe,scarf,pack,legL,legR};
}
function makePalm(s){if(ST.sunink)return makePalmH(s);
  const p=grp();let px=0,py=0;
  for(let i=0;i<5;i++){const seg=part(G.cyl6,'#8a6440',px,py+0.45*s,0,0.4*s,0.9*s,0.4*s,p);seg.rotation.z=-0.08*i;px+=0.08*s*i;py+=0.85*s;}
  const top=grp(px,py,0,p);
  const lfG=new T.ConeGeometry(0.42,2.6,3);lfG.translate(0,1.3,0);
  for(let i=0;i<7;i++){const holder=grp(0,0,0,top);holder.rotation.y=i/7*Math.PI*2;const lf=part(lfG,i%2?'#6f8f4f':'#7fa05a',0,0,0,s,s,s,holder);lf.rotation.z=-1.9;}
  p.userData.top=top;return p;
}
function makeCactus(h,dry){if(ST.sunink)return makeCactusH(h,dry);
  const c=grp();PART_OL=0.012;const m=M(dry?'#a6906a':'#7f9c6a');
  part(G.cyl,m,0,h/2,0,0.88,h,0.88,c);part(G.half,m,0,h,0,0.88,0.88,0.88,c);
  part(G.cyl6,m,-0.75,h*0.6,0,0.5,1,0.5,c);part(G.cyl6,m,0.7,h*0.45+0.2,0,0.5,0.9,0.5,c);
  const a1=part(G.cyl6,m,-0.42,h*0.6-0.4,0,0.5,0.8,0.5,c);a1.rotation.z=Math.PI/2;const a2=part(G.cyl6,m,0.38,h*0.45-0.15,0,0.5,0.7,0.5,c);a2.rotation.z=Math.PI/2;
  if(!dry)part(G.sph,'#e9a0b0',0,h+0.35,0,0.32,0.32,0.32,c);PART_OL=0;
  return c;
}
function makeRock(r,seed){if(ST.sunink)return makeRockH(r*0.9,seed);const m=part(G.sph,'#b98a62',0,r*0.15,0,r*2,r*1.1,r*1.7);m.rotation.y=seed;return m;}
function makeLamp(){if(ST.sunink)return makeLampH();const l=grp();part(G.cyl4,'#5d4a3a',0,1,0,0.12,2,0.12,l);part(G.sph,M('#ffd98a',{emissive:'#ffb84a',emissiveIntensity:0.9}),0,2.1,0,0.4,0.4,0.4,l);part(G.box,'#5d4a3a',0,2.4,0,0.5,0.08,0.5,l);const gs=glowSprite('#ffb050',5.2);gs.position.set(0,2.1,0);l.add(gs);return l;}
function makeBench(){if(ST.sunink)return makeBenchH();const b=grp();part(G.box,P.wood,0,0.45,0,1.8,0.12,0.6,b);part(G.box,P.wood,0,0.8,-0.25,1.8,0.4,0.08,b);
  for(const x of [-0.75,0.75])part(G.box,P.dark,x,0.22,0,0.12,0.45,0.5,b);return b;}
function makeFlowers(){if(ST.sunink)return makeFlowersH();const f=grp();const cols=['#e9a0b0','#f3d06b','#fff3e0','#e07a5f','#b9a0e0'];
  for(let i=0;i<6;i++){const a=i*1.1,r=0.25+(i%3)*0.15;part(G.cyl4,'#6f8f4f',Math.cos(a)*r,0.2,Math.sin(a)*r,0.04,0.4,0.04,f);part(G.ico,cols[i%5],Math.cos(a)*r,0.45,Math.sin(a)*r,0.22,0.22,0.22,f);}return f;}
function makeScrap(v,seed){
  const g=grp();PART_OL=0.01;const rng=mulberry32((seed|0)+7);const kind=Math.abs(Math.floor(seed))%4;const k=(0.85+Math.min(v,6)*0.05)*(ST.sunink?1.3:1);const G2=grp(0,0,0,g);G2.scale.setScalar(k);
  if(kind===0){// pipes and a bent plate
    for(let i=0;i<3;i++){const p=part(G.cyl,i===1?P.rust:'#8b8f96',(i-1)*0.32,0.11,(rng()-0.5)*0.4,0.18,1.1+rng()*0.4,0.18,G2);p.rotation.set(Math.PI/2,0,0.2+rng()*0.5);}
    const pl=part(G.box,'#6d7279',0.15,0.08,0.45,0.9,0.05,0.55,G2);pl.rotation.set(0.25,0.4,0.15);part(G.box,P.rust,0.1,0.11,0.42,0.3,0.06,0.2,G2).rotation.y=0.4;}
  else if(kind===1){// big gear, bolts and a nut
    const gr=grp(0,0.09,0,G2);gr.rotation.set(0.12,0,0.08);part(G.cyl,'#7d8188',0,0,0,0.9,0.14,0.9,gr);part(G.cyl,'#4a4e55',0,0.01,0,0.3,0.16,0.3,gr);
    for(let i=0;i<10;i++){const a=i/10*6.283;part(G.box,'#7d8188',Math.cos(a)*0.5,0,Math.sin(a)*0.5,0.16,0.13,0.14,gr).rotation.y=-a;}
    for(let i=0;i<3;i++){const b=grp(0.6+i*0.16,0.06,-0.25+i*0.22,G2);b.rotation.set(Math.PI/2,0,rng()*3);part(G.cyl,'#9aa0a6',0,0,0,0.07,0.32,0.07,b);part(G.cyl6,'#6d7279',0,0.17,0,0.14,0.07,0.14,b);}
    part(G.cyl6,P.rust,-0.55,0.05,0.35,0.22,0.1,0.22,G2);}
  else if(kind===2){// broken electronics box with circuit board and wires
    const bx=part(G.box,'#5d6470',0,0.2,0,0.8,0.4,0.55,G2);bx.rotation.set(0,0.3,0.25);
    const pcb=part(G.box,'#3f8a5a',0.5,0.05,0.35,0.5,0.03,0.36,G2);pcb.rotation.y=0.6;for(let i=0;i<3;i++)part(G.box,'#d9a441',0.42+i*0.08,0.08,0.32+i*0.05,0.06,0.04,0.12,G2).rotation.y=0.6;
    for(const [c,dx] of [['#c0432f',0],['#3f6fb0',0.12]]){const w=part(new T.TorusGeometry(0.22,0.025,6,12,Math.PI*1.2),c,-0.3+dx,0.05,0.35,1,1,1,G2);w.rotation.set(Math.PI/2,0,dx*8);}
    part(G.cyl,'#9aa0a6',-0.1,0.55,-0.05,0.04,0.4,0.04,G2).rotation.z=0.6;}
  else{// tyre, coil spring and a rod
    const t=part(new T.TorusGeometry(0.38,0.14,10,20),'#3a3836',0,0.14,0,1,1,1,G2);t.rotation.x=Math.PI/2+0.08;part(G.cyl,'#7d8188',0,0.14,0,0.42,0.16,0.42,G2);
    for(let i=0;i<5;i++)part(new T.TorusGeometry(0.11,0.025,6,14),'#9aa0a6',0.62,0.06+i*0.07,0.25,1,1,1,G2).rotation.x=Math.PI/2;
    const rd=part(G.cyl,P.rust,-0.5,0.06,0.4,0.08,1.0,0.08,G2);rd.rotation.set(Math.PI/2,0,0.9);}
  PART_OL=0;return g;
}
function makeWreck(kind){if(ST.sunink)return makeWreckH(kind);
  const g=grp();PART_OL=0.012;const W=grp(0,0,0,g);
  if(kind===0){// old rounded car, half sunk, one wheel missing
    W.rotation.set(0.05,0,0.07);const body='#6f9a96',rust=P.rust;
    part(G.box,body,0,0.62,0,3.8,0.7,1.8,W);part(G.cyl,body,1.55,0.62,0,0.7,1.8,0.7,W).rotation.x=Math.PI/2;part(G.cyl,body,-1.55,0.62,0,0.7,1.8,0.7,W).rotation.x=Math.PI/2;
    part(G.box,body,-0.2,1.25,0,2.0,0.7,1.6,W);part(G.half,body,-0.2,1.55,0,2.0,0.35,1.6,W);
    part(G.box,'#2b3436',0.62,1.28,0,0.08,0.5,1.4,W).rotation.z=-0.5;part(G.box,'#2b3436',-0.2,1.3,0.81,1.5,0.4,0.04,W);part(G.box,'#2b3436',-0.2,1.3,-0.81,1.5,0.4,0.04,W);
    part(G.box,rust,0.6,0.95,0.6,0.9,0.05,0.5,W).rotation.y=0.3;part(G.box,rust,-1.3,0.7,0.91,0.8,0.35,0.03,W);part(G.box,rust,1.2,0.4,-0.91,0.6,0.3,0.03,W);
    for(const [x,z,ok] of [[1.25,0.95,1],[1.25,-0.95,1],[-1.25,0.95,1],[-1.25,-0.95,0]]){part(G.half,'#5f8682',x,0.62,z,0.95,0.55,0.4,W);if(ok){const wh=part(G.cyl,'#2f2c2a',x,0.32,z,0.62,0.22,0.62,W);wh.rotation.x=Math.PI/2;part(G.cyl,'#9aa0a6',x,0.32,z*1.06,0.28,0.04,0.28,W).rotation.x=Math.PI/2;}}
    for(const z of [-0.55,0.55])part(G.sph,'#e8e0c8',1.92,0.75,z,0.22,0.22,0.12,W);part(G.box,'#9aa0a6',1.95,0.45,0,0.12,0.14,1.7,W);}
  else if(kind===1){// crashed helicopter, tipped on its side with broken rotor
    W.rotation.set(0,0.2,0.32);const hull='#c8643c',grey='#7d8188';
    part(G.sph,hull,0.4,1.1,0,2.6,1.7,1.7,W);part(G.sph,'#2b3436',1.25,1.25,0,0.9,0.9,1.3,W);
    const tb=part(G.cyl,hull,-1.9,1.25,0,0.5,2.8,0.5,W);tb.rotation.z=Math.PI/2;part(G.cone5,hull,-3.3,1.25,0,0.45,0.6,0.45,W).rotation.z=Math.PI/2;
    part(G.box,hull,-3.35,1.75,0,0.6,0.9,0.08,W).rotation.z=-0.3;part(G.box,'#e8e0c8',0.4,1.15,0.86,1.4,0.12,0.02,W);
    for(const z of [-0.75,0.75])part(G.cyl,grey,0.4,0.15,z,0.08,2.6,0.08,W).rotation.z=Math.PI/2;
    part(G.cyl,grey,0.4,2.05,0,0.25,0.3,0.25,W);const r1=part(G.box,grey,0.4,2.22,0,3.4,0.05,0.24,W);r1.rotation.set(0,0.4,0.05);const r2=part(G.box,grey,0.4,2.22,0,1.6,0.05,0.24,W);r2.rotation.set(0,2.1,-0.1);
    const lost=part(G.box,grey,-0.6,0.05,1.9,2.6,0.05,0.24,g);lost.rotation.y=0.9;}
  else if(kind===3){// big crashed plane, broken in two, one wing torn off (Robin 20. 11.)
    W.rotation.set(0,0,0.06);const body='#d6cfbf',str='#4d7392',grey='#7d8188';
    const f1=part(G.cyl,body,1.6,1.15,0,1.15,4.6,1.15,W);f1.rotation.z=Math.PI/2;part(G.sph,body,3.9,1.15,0,1.15,1.1,1.15,W);
    part(G.box,'#2b3436',4.35,1.55,0,0.5,0.32,1.3,W).rotation.z=-0.5;for(let i=0;i<5;i++)for(const z of [-1.08,1.08])part(G.box,'#2b3436',2.6-i*0.8,1.5,z,0.32,0.26,0.05,W);
    part(G.box,str,1.6,1.0,1.12,4.6,0.18,0.06,W);part(G.box,str,1.6,1.0,-1.12,4.6,0.18,0.06,W);
    const T2=grp(-2.6,0,0.25,W);T2.rotation.y=0.35;T2.rotation.z=-0.08;const f2=part(G.cyl,body,-1.3,1.05,0,1.05,3.4,1.05,T2);f2.rotation.z=Math.PI/2;part(G.cone5,body,-3.4,1.25,0,0.9,1.2,0.9,T2).rotation.z=Math.PI/2;
    part(G.box,body,-3.5,2.5,0,1.5,2.0,0.14,T2).rotation.z=-0.35;part(G.box,str,-3.65,2.9,0,0.9,0.5,0.16,T2).rotation.z=-0.35;part(G.box,body,-3.5,1.4,0,0.9,0.1,3.0,T2);
    part(G.box,str,-1.3,0.9,1.02,3.4,0.16,0.06,T2);part(G.cyl,'#3a3836',0,1.05,0,1.0,0.2,1.0,T2).rotation.z=Math.PI/2;
    const wg=part(G.box,body,1.4,0.7,2.9,2.0,0.18,4.2,W);wg.rotation.set(0.05,0.12,0);part(G.cyl,grey,1.9,0.55,3.0,0.5,1.3,0.5,W).rotation.z=Math.PI/2;part(G.box,P.rust,1.2,0.8,4.4,1.2,0.05,0.9,W).rotation.y=0.2;
    const lost=part(G.box,body,0.2,0.1,-4.6,1.8,0.16,3.4,g);lost.rotation.set(0.12,-0.6,0.05);part(G.cyl,grey,0.6,0.35,-3.2,0.45,1.1,0.45,g).rotation.set(0,0.4,Math.PI/2+0.2);}
  else{// old motorbike lying on its side
    W.rotation.set(-1.38,0.5,0);W.position.y=0.42;const red='#b84a3a',chrome='#9aa0a6';
    for(const x of [-0.85,0.85]){const t=part(new T.TorusGeometry(0.42,0.12,8,18),'#2f2c2a',x,0.5,0,1,1,1,W);part(G.cyl,chrome,x,0.5,0,0.3,0.06,0.3,W).rotation.x=Math.PI/2;}
    const fr=part(G.cyl,'#3a3430',0,0.85,0,0.09,1.6,0.09,W);fr.rotation.z=Math.PI/2;part(G.cyl,'#3a3430',0.6,0.7,0,0.08,0.7,0.08,W).rotation.z=0.6;
    part(G.sph,red,0.2,1.05,0,0.6,0.32,0.36,W);part(G.box,'#3a2a20',-0.35,1.02,0,0.7,0.12,0.3,W);part(G.box,red,-0.85,0.95,0,0.5,0.06,0.3,W);
    part(G.cyl,chrome,0.75,1.25,0,0.05,0.7,0.05,W).rotation.x=Math.PI/2;part(G.sph,'#e8e0c8',0.95,1.1,0,0.14,0.14,0.14,W);
    part(G.cyl,chrome,-0.4,0.45,0.2,0.08,0.9,0.08,W).rotation.z=Math.PI/2;part(G.box,'#5d6168',0,0.55,0,0.4,0.3,0.3,W);}
  PART_OL=0;const sand=part(G.disc,ST.sunink?M('#fffaf3',{depthWrite:false,pat:0}):P.sand,0,ST.sunink?0.03:0.18,0,kind===2?3:kind===3?7.5:4.8,1,kind===2?2.2:kind===3?5.5:3,g,!!ST.sunink);if(ST.sunink){sand.receiveShadow=true;sand.renderOrder=1;}
  return g;
}
function makeCrate(){const g=grp();PART_OL=0.012;const W=1.5,D=1.0,Hh=0.72;
  part(G.box,'#8a5a34',0,Hh/2,0,W,Hh,D,g);part(G.box,'#a06a3c',0,Hh*0.55,0,W*1.005,0.08,D*1.005,g);
  const lidG=new T.CylinderGeometry(D/2,D/2,W,24,1,false,0,Math.PI);lidG.rotateZ(Math.PI/2);
  const lid=part(lidG,'#8f5e36',0,Hh,0,1,1,1,g);
  const capG=new T.CylinderGeometry(D/2+0.02,D/2+0.02,0.1,24,1,false,0,Math.PI);capG.rotateZ(Math.PI/2);
  for(const x of [-W/2+0.12,W/2-0.12]){part(capG,'#5d6168',x,Hh,0,1,1,1,g);part(G.box,'#5d6168',x,Hh/2,0,0.1,Hh+0.01,D+0.03,g);}
  part(capG,'#5d6168',0,Hh,0,1,1,1,g).scale.set(1,1,1);
  part(G.box,'#5d6168',0,Hh/2,0,0.1,Hh+0.01,D+0.03,g);
  part(G.box,'#d9a441',0,Hh-0.02,D/2+0.03,0.22,0.26,0.05,g);part(G.cyl,'#3a3430',0,Hh-0.05,D/2+0.06,0.06,0.03,0.06,g).rotation.x=Math.PI/2;
  for(const x of [-W/2+0.02,W/2-0.02])for(const z of [-D/2+0.02,D/2-0.02])part(G.box,'#5d6168',x,0.06,z,0.14,0.12,0.14,g);
  const sp=part(G.oct,M('#fff3c4',{emissive:'#ffe08a',emissiveIntensity:1}),0.5,1.9,0.2,0.3,0.45,0.3,g,true);g.userData.spark=sp;PART_OL=0;return g;}
function makePuddle(r){if(ST.sunink)return makePuddleH(r);const g=grp();part(G.disc,new T.MeshStandardMaterial({color:C('#c69b6a'),transparent:true,opacity:0.5,depthWrite:false}),0,0.05,0,r*3.2*S,1,r*2.2*S,g,true);
  const w=part(G.disc,M('#57a6b6',{roughness:0.25,metalness:0.1}),0,0.08,0,r*2*S,1,r*1.4*S,g,true);w.receiveShadow=true;
  part(G.disc,M('#bfe6ec',{roughness:0.2}),-r*0.3*S,0.1,-r*0.2*S,r*0.8*S,1,r*0.3*S,g,true);return g;}
function makeDrone(R3,A){if(ST.sunink)return makeDroneH(R3,A);R3=R3||9.2;A=A||0.5;const g=grp();const body=grp(0,1.6,0,g);part(G.cyl,'#5d6470',0,0,0,2,0.4,2,body);part(G.half,'#8b8f96',0,0.2,0,1.2,0.7,1.2,body);
  const eye=part(G.sph,new T.MeshStandardMaterial({color:C('#ff5a3a'),emissive:C('#ff3010'),emissiveIntensity:1}),0.95,0,0,0.35,0.35,0.35,body);
  for(const a of [0.785,2.356,3.927,5.497]){part(G.box,'#4a4e55',Math.cos(a)*1.2,0.1,Math.sin(a)*1.2,0.5,0.06,0.12,body).rotation.y=-a;}
  const shadow=part(G.disc,new T.MeshBasicMaterial({color:C('#6e4628'),transparent:true,opacity:0.18,depthWrite:false}),0,0.06,0,1.8,1,1.8,g,true);
  const coneG=new T.CircleGeometry(R3,16,-A,2*A);coneG.rotateX(-Math.PI/2);
  const cone=new T.Mesh(coneG,new T.MeshBasicMaterial({color:C('#e65a3c'),transparent:true,opacity:0.26,depthWrite:false,depthTest:false,side:T.DoubleSide}));cone.renderOrder=5;cone.position.y=0.12;
  return {g,body,eye,cone};}
// seeker: a low four-legged ground robot with a red scanner slit (Robin 20. 11.: not a humanoid)
function makeSeeker(R3,A){if(ST.sunink)return makeSeekerH(R3,A);const g=grp();const body=grp(0,0,0,g);PART_OL=0.012;const hull='#5d6470',dark='#3a3e44';
  part(G.box,hull,0,1.05,0,1.9,0.62,1.45,body);part(G.half,'#7d8188',-0.1,1.36,0,1.5,0.5,1.2,body);
  part(G.box,dark,0.98,1.05,0,0.12,0.42,1.12,body);const eye=part(G.box,new T.MeshStandardMaterial({color:C('#ff5a3a'),emissive:C('#ff3010'),emissiveIntensity:1}),1.05,1.07,0,0.06,0.13,0.92,body);
  for(const z of [-0.74,0.74])part(G.box,'#c0432f',0,1.2,z,1.5,0.12,0.04,body);
  part(G.cyl,dark,-0.55,1.95,0.32,0.04,0.7,0.04,body);part(G.sph,new T.MeshStandardMaterial({color:C('#ff6a4a'),emissive:C('#ff3010'),emissiveIntensity:0.8}),-0.55,2.32,0.32,0.09,0.09,0.09,body,true);
  const legs=[];for(const [sx,sz] of [[0.62,0.72],[-0.62,0.72],[0.62,-0.72],[-0.62,-0.72]]){const L=grp(sx,0.95,sz,body);L.rotation.x=sz>0?-0.55:0.55;part(G.cyl,dark,0,-0.42,0,0.1,0.85,0.1,L);part(G.box,hull,0,-0.86,0,0.3,0.12,0.36,L);legs.push(L);}
  PART_OL=0;part(G.disc,new T.MeshBasicMaterial({color:C('#6e4628'),transparent:true,opacity:0.2,depthWrite:false}),0,0.06,0,1.7,1,1.5,g,true);
  const coneG=new T.CircleGeometry(R3,16,-A,2*A);coneG.rotateX(-Math.PI/2);
  const cone=new T.Mesh(coneG,new T.MeshBasicMaterial({color:C('#e65a3c'),transparent:true,opacity:0.26,depthWrite:false,depthTest:false,side:T.DoubleSide}));cone.renderOrder=5;cone.position.y=0.12;
  return {g,body,eye,cone,legs};}
// gold scrap (replaces the old abstract core – Robin 19. 11.)
// gold scrap = the same cog as normal scrap, just golden, lying on the ground (Robin 20. 11.: no spinning diamond)
function makeGoldCog(k){const g=grp();PART_OL=0.01;const gm=M('#f2c14e',{emissive:'#b8862a',emissiveIntensity:0.3,roughness:0.35,metalness:0.45});const G2=grp(0,0,0,g);G2.scale.setScalar(k||1);
  const gr=grp(0,0.09,0,G2);gr.rotation.set(0.14,0.5,0.1);part(G.cyl,gm,0,0,0,0.9,0.14,0.9,gr);part(G.cyl,M('#a8782a'),0,0.01,0,0.3,0.16,0.3,gr);
  for(let i=0;i<10;i++){const a=i/10*6.283;part(G.box,gm,Math.cos(a)*0.5,0,Math.sin(a)*0.5,0.16,0.13,0.14,gr).rotation.y=-a;}
  const g2=grp(0.62,0.06,0.3,G2);g2.rotation.set(0.3,1.2,-0.2);part(G.cyl,gm,0,0,0,0.5,0.1,0.5,g2);for(let i=0;i<8;i++){const a=i/8*6.283;part(G.box,gm,Math.cos(a)*0.28,0,Math.sin(a)*0.28,0.1,0.09,0.09,g2).rotation.y=-a;}
  part(G.cyl6,gm,-0.5,0.05,0.35,0.2,0.1,0.2,G2);
  const sp=part(G.oct,new T.MeshBasicMaterial({color:C('#fff6d2'),transparent:true,opacity:0}),0.2,0.32,-0.1,0.09,0.16,0.09,G2,true);g.userData.sp=sp;
  PART_OL=0;return g;}
function makeCore(){const g=makeGoldCog(1.35);return g;}
function makeBag(type){const g=grp();type=type||(typeof heroGear==='function'?heroGear().back:'bundle')||'bundle';
  const hold=grp(0,0,0,g);const inner=cgrp(hold);if(ST.sunink)buildBackH(inner,type,{});else buildBack(inner,type,{},true);inner.position.set(0,0,0.36);inner.children.forEach(c=>{});
  hold.rotation.set(-1.25,0.5,0.12);hold.scale.setScalar(3.2);hold.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(hold);hold.position.y=-bb.min.y-0.12;
  const ring=part(G.ring,new T.MeshBasicMaterial({color:C('#c8643c'),transparent:true,opacity:0.7,depthWrite:false}),0,0.06,0,2.4,1,2.4,g,true);g.userData.ring=ring;return g;}

// building models by level
function makeRuin(k){if(ST.sunink)return makeRuinH(k);
  const g=grp();PART_OL=0.012;const r=mulberry32(k.length*99);
  part(G.box,'#b8a48a',-1.4,0.7,0,1.6,1.4,0.4,g).rotation.y=0.1;part(G.box,'#b8a48a',-2,0.45,0.8,0.4,0.9,1.4,g);
  part(G.box,'#b8a48a',1.3,0.5,-0.2,1.8,1,0.4,g).rotation.y=-0.15;part(G.box,'#b8a48a',2.1,0.9,0.5,0.4,1.8,1,g);
  part(G.box,'#a8937a',0,0.08,0.2,5,0.16,2.6,g);
  part(G.box,'#9d8a72',0.2,0.3,0.6,0.7,0.45,0.6,g).rotation.y=0.4;PART_OL=0;
  return g;
}
function makeBuilding(k,lvl,vr){
  if(ST.sunink){const h=makeBuildingH(k,lvl);if(h)return h;}
  vr=vr||BSEL[k];if(vr&&vr!=='0'&&typeof BVAR!=='undefined'&&BVAR[k]&&BVAR[k][vr]){PART_OL=0.012;const g=BVAR[k][vr](lvl);PART_OL=0;g.userData.anim=g.userData.anim||{};return g;}
  const g=grp();g.userData.anim={};PART_OL=0.012;
  switch(k==='dilna'?'sklad':k){// Robin 20. 11.: the workshop gets the Cargo Bot building
    case 'cerpadlo':{part(G.box,P.wall2,-0.8,0.95,0,3,1.9,2.4,g);part(G.box,'#6f8f9a',-0.8,2,0,3.4,0.25,2.8,g);
      for(let i=0;i<Math.min(lvl,6);i++){const row=Math.floor(i/3),q=i%3,tx=1.6+q*1.3+row*0.6,tz=-0.5+q*0.5-row*1.6,th=2.4+row*0.7;part(G.cyl,M('#57a6b6',{roughness:0.55}),tx,th/2+1.1,tz,1.24,th,1.24,g);part(G.cyl,'#8fc6cf',tx,th+1.15,tz,1.32,0.12,1.32,g);
        for(const [sx,sz] of [[-0.4,-0.4],[0.4,-0.4],[-0.4,0.4],[0.4,0.4]])part(G.cyl4,P.dark,tx+sx,0.55,tz+sz,0.1,1.1,0.1,g);}
      part(G.cyl6,'#6e5a48',0.6,1.3,0,0.2,0.2,1.6,g).rotation.z=Math.PI/2;
      g.userData.anim.drop=part(G.sph,M('#57a6b6'),-1.8,1,1.3,0.22,0.3,0.22,g,true);break;}
    case 'sklad':{part(G.box,P.wall2,0,1,0,4.6,2,3.4,g);part(G.box,'#8a7a5c',0,2.1,0,5,0.25,3.8,g);part(G.box,'#9c8a6a',0,0.8,1.72,2.4,1.6,0.08,g);
      for(let i=0;i<4;i++)part(G.box,'#86765a',0,0.3+i*0.35,1.77,2.4,0.05,0.04,g,true);
      for(let i=0;i<lvl+1;i++){const cx=3+(i%2)*0.9,cy=0.4+Math.floor(i/2)*0.82;part(G.box,'#b07a48',cx,cy,0.6-(i%3)*0.4,0.8,0.8,0.8,g).rotation.y=i*0.3;}break;}
    case 'solar':{const n=[0,2,4,6,8,9][lvl];for(let i=0;i<n;i++){const px=-2.6+(i%3)*2.6,pz=-1.8+Math.floor(i/3)*2.0;part(G.cyl4,P.dark,px,0.45,pz,0.12,0.9,0.12,g);
        const pn=part(G.box,M('#3d4f74',{roughness:0.35,metalness:0.35}),px,0.95,pz,2.2,0.08,1.4,g);pn.rotation.x=-0.5;}break;}
    case 'dilna':{part(G.box,P.wall2,0,1.2,0,4.6,2.4,3.4,g);part(G.roof,'#c8643c',0,2.4,0,5.2,1.6,4,g);part(G.cyl6,'#7d6a58',1.3,3.4,-0.7,0.8,1.8,0.8,g);
      part(G.box,P.dark,0.6,0.8,1.72,1.4,1.6,0.12,g);const gear=part(G.cyl,M(P.metal,{roughness:0.5,metalness:0.3}),-1.4,1.3,1.76,0.9,0.15,0.9,g);gear.rotation.x=Math.PI/2;
      g.userData.anim.gear=gear;g.userData.anim.chimney=new T.Vector3(1.3,4.4,-0.7);
      part(G.box,P.wood,-2.9,0.5,1,1.2,1,0.7,g);part(G.cyl,'#7d8188',-2.9,1.1,1,0.5,0.2,0.5,g);break;}
    case 'sklenik':{const r=lvl>1?3.2:2.6;part(G.cyl,'#7d8f50',0,0.15,0,r*2.05,0.3,r*2.05,g);part(G.cyl,P.wood,0,0.08,0,r*2.15,0.16,r*2.15,g);
      for(let i=0;i<10;i++){const a=i*2.4,rr=0.5+((i*37)%10)/10*(r-1);part(i%3?G.cone5:G.ico,i%2?'#6f8f4f':'#88a85f',Math.cos(a)*rr,0.8,Math.sin(a)*rr,i%3?0.8:1,i%3?1.2+(i%2)*0.4:1,i%3?0.8:1,g);}
      for(let i=0;i<5;i++){const a=i*1.5;part(G.sph,'#e07a5f',Math.cos(a)*1.1,1.1,Math.sin(a)*1.1,0.32,0.32,0.32,g);}
      const dm=new T.Mesh(G.dome,new T.MeshStandardMaterial({color:C('#cfeef2'),transparent:true,opacity:0.3,roughness:0.15,metalness:0.1,flatShading:true,depthWrite:false}));dm.scale.setScalar(r*2);dm.position.y=0.3;g.add(dm);
      const ed=new T.LineSegments(G.domeEdges,new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.7}));ed.scale.setScalar(r*2);ed.position.y=0.3;g.add(ed);break;}
    case 'dron':{part(G.cyl,'#b9a48a',0,0.1,0,3.6,0.2,3.6,g);part(G.ring,new T.MeshBasicMaterial({color:C('#e0b04c')}),0,0.22,0,2.6,1,2.6,g,true);
      part(G.cyl4,'#8b8f96',1.9,1.3,-0.6,0.15,2.6,0.15,g);const dish=part(G.half,M(P.metal,{metalness:0.3,roughness:0.5}),1.9,2.7,-0.6,1.6,0.6,1.6,g);dish.rotation.x=-1.1;
      const dr=grp(0,3,0,g);part(G.box,'#7a5a8c',0,0,0,1.2,0.4,0.8,dr);part(G.box,'#4a3424',0,0.2,0,2,0.06,0.12,dr);part(G.box,'#4a3424',0,0.2,0,0.12,0.06,1.6,dr);
      part(G.sph,M('#ffd36e',{emissive:'#ffb020',emissiveIntensity:1}),0,-0.2,0.35,0.18,0.18,0.18,dr);g.userData.anim.drone=dr;break;}
    case 'radio':{const tw=new T.Mesh(new T.CylinderGeometry(0.12,1.3,8.5,4,6,true),new T.MeshBasicMaterial({color:C('#6e5a48'),wireframe:true}));tw.position.y=4.25;g.add(tw);
      const li=part(G.sph,new T.MeshStandardMaterial({color:C('#ff6a4a'),emissive:C('#ff3a1a'),emissiveIntensity:1}),0,8.7,0,0.5,0.5,0.5,g,true);g.userData.anim.light=li;
      part(G.box,P.wall2,-2.6,0.65,0.6,2,1.3,1.6,g);part(G.box,'#7d6a58',-2.6,1.37,0.6,2.3,0.15,1.9,g);
      const dish=part(G.half,M(P.metal,{metalness:0.3,roughness:0.5}),0.4,5.2,0.3,1.4,0.55,1.4,g);dish.rotation.x=-1.2;break;}
  }
  PART_OL=0;return g;
}

// ================= building & bot design variants (catalog picks, Robin 19. 11.) =================
// BSEL = the variant the game actually uses; '0' = original model in makeBuilding.
const BSEL={dilna:'0',dron:'A'};
function corrTex(col,horiz){return canTex('corr'+col+(horiz?'h':''),64,64,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);
  for(let i=0;i<8;i++){const p=i*8;g.fillStyle='rgba(255,240,215,0.22)';horiz?g.fillRect(0,p,w,3):g.fillRect(p,0,3,h);g.fillStyle='rgba(40,20,10,0.22)';horiz?g.fillRect(0,p+5,w,2):g.fillRect(p+5,0,2,h);}},[horiz?1:6,horiz?8:1]);}
function stripeTex(a,b,n){return canTex('stripe'+a+b+n,128,16,(g,w,h)=>{for(let i=0;i<n;i++){g.fillStyle=i%2?b:a;g.fillRect(i*w/n,0,w/n+1,h);}},[1,1]);}
function texM(t,ds){const m=MAT({color:0xffffff,map:t,side:ds?T.DoubleSide:T.FrontSide});return rimify(m);}
function glassM(){return new T.MeshStandardMaterial({color:C('#cfeef2'),transparent:true,opacity:0.28,roughness:0.15,metalness:0.1,depthWrite:false,side:T.DoubleSide});}
function triGeo(a,b,c){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...a,...b,...c],3));g.computeVertexNormals();return g;}
function halfCyl(seg){const g=new T.CylinderGeometry(1,1,1,seg||24,1,true,0,Math.PI);g.rotateZ(Math.PI/2);return g;}// arch over x axis, radius 1, length 1
function plantsIn(g,cx,cz,w,d,n,seed,melons){const r=mulberry32(seed);for(let i=0;i<n;i++){const x=cx+(r()-0.5)*w,z=cz+(r()-0.5)*d,ic=r()<0.4;
    part(ic?G.ico:G.cone5,r()<0.5?'#6f8f4f':'#88a85f',x,ic?0.55:0.65,z,ic?0.7:0.55,ic?0.6:0.9+r()*0.5,ic?0.7:0.55,g);}
  for(let i=0;i<(melons||0);i++){const x=cx+(r()-0.5)*w*0.9,z=cz+(r()-0.5)*d*0.9;part(G.sph,'#6f9a4a',x,0.32,z,0.42,0.36,0.36,g).rotation.y=r()*3;part(G.sph,'#88b05a',x+0.05,0.38,z+0.05,0.18,0.1,0.18,g,true);}}
function workbench(g,x,z,ry,w){const b=grp(x,0,z,g);b.rotation.y=ry||0;w=w||2.4;part(G.box,P.wood,0,0.9,0,w,0.12,0.75,b);for(const sx of [-1,1])for(const sz of [-1,1])part(G.box,P.dark,sx*(w/2-0.12),0.42,sz*0.28,0.1,0.85,0.1,b);
  part(G.box,'#5d6168',-w/2+0.35,1.06,0,0.3,0.2,0.24,b);part(G.box,'#7d8590',0.2,0.99,0.05,0.5,0.06,0.12,b).rotation.y=0.4;part(G.cyl,'#9aa0a6',0.7,1.0,-0.1,0.16,0.08,0.16,b);return b;}
function anvil(g,x,z){const a=grp(x,0,z,g);part(G.cyl6,'#6e5a48',0,0.3,0,0.6,0.6,0.6,a);part(G.box,'#4a4e55',0,0.68,0,0.9,0.16,0.4,a);part(G.box,'#4a4e55',0,0.8,0,1.1,0.12,0.36,a);part(G.cone5,'#4a4e55',0.68,0.8,0,0.24,0.4,0.24,a).rotation.z=-Math.PI/2;return a;}
function gearSign(g,x,y,z,r){const gr=grp(x,y,z,g);const w=grp(0,0,0,gr);w.rotation.x=Math.PI/2;part(G.cyl,M(P.metal,{roughness:0.5,metalness:0.3}),0,0,0,r*2,0.15,r*2,w);part(G.cyl,'#4a4e55',0,0.02,0,r*0.7,0.17,r*0.7,w);
  for(let i=0;i<8;i++){const a=i/8*6.283;part(G.box,M(P.metal,{roughness:0.5,metalness:0.3}),Math.cos(a)*r*1.05,0,Math.sin(a)*r*1.05,r*0.36,0.14,r*0.3,w).rotation.y=-a;}return w;}
const BVAR={
 dilna:{
  A:(lvl)=>{// shipping container workshop
    const g=grp();g.userData.anim={};const col='#c8643c',cm=texM(corrTex(col));const L=5,H=2.4,D=2.3;
    part(G.box,cm,0,H/2,-D/2+0.04,L,H,0.08,g);for(const s of [-1,1])part(G.box,cm,s*(L/2-0.04),H/2,0,0.08,H,D,g);
    part(G.box,'#a85234',0,H+0.05,0,L+0.12,0.12,D+0.1,g);part(G.box,'#6e5a48',0,0.07,0,L,0.14,D,g);
    for(const s of [-1,1])part(G.box,'#8a4428',s*(L/2),H/2,D/2,0.14,H,0.14,g);
    const aw=part(G.box,cm,0,H+0.32,D/2+0.55,L,0.06,1.3,g);aw.rotation.x=-0.42;for(const s of [-1,1])part(G.cyl4,P.dark,s*(L/2-0.3),H*0.6+0.4,D/2+0.95,0.08,1.6,0.08,g);
    workbench(g,-0.6,-0.5,0,2.6);for(let i=0;i<5;i++)part(G.box,i%2?'#7d8590':P.wood,-1.8+i*0.55,1.75,-D/2+0.12,0.12,0.5+((i*3)%4)*0.08,0.06,g);
    part(G.cyl,'#5d6168',1.6,0.5,-0.5,0.6,1.0,0.6,g);part(G.cyl,'#7d8590',1.6,1.02,-0.5,0.62,0.06,0.62,g);
    anvil(g,1.6,1.9);part(G.box,P.wood,-2.0,0.35,1.8,0.8,0.7,0.7,g);
    const pipe=part(G.cyl,'#7d6a58',-1.9,H+0.7,-0.6,0.36,1.3,0.36,g);part(G.cyl,'#5d4a3a',-1.9,H+1.38,-0.6,0.5,0.1,0.5,g);g.userData.anim.chimney=new T.Vector3(-1.9,H+1.5,-0.6);
    g.userData.anim.gear=gearSign(g,1.2,H+0.75,0.2,0.55);part(G.cyl4,P.dark,1.2,H+0.3,0.2,0.08,0.5,0.08,g);
    if(lvl>=2){part(G.cyl4,'#5d6168',2.1,H+1.0,-0.7,0.14,2.0,0.14,g);const bm=part(G.box,'#e0b04c',1.3,H+1.9,-0.2,2.0,0.14,0.14,g);bm.rotation.z=0.25;part(G.cyl,'#3a3430',0.5,H+1.1,0.15,0.02,1.4,0.02,g,true);part(G.box,'#5d6168',0.5,H+0.38,0.15,0.2,0.12,0.12,g);}
    if(lvl>=3){part(G.box,'#5a8a95',2.9,0.6,0.4,1.0,1.2,1.6,g);part(G.box,'#7d8590',2.9,1.25,0.4,1.05,0.08,1.65,g);}
    return g;},
  B:(lvl)=>{// arched metal hangar (Quonset)
    const g=grp();g.userData.anim={};const R=1.95,L=4.6;const in_=grp(0,0,0,g);in_.rotation.y=Math.PI/2;
    const arch=new T.Mesh(halfCyl(28),texM(corrTex('#9aa0a6',true),true));arch.scale.set(L,R,R);arch.castShadow=arch.receiveShadow=true;in_.add(arch);
    const endG=new T.CircleGeometry(1,28,0,Math.PI);
    for(const sx of [-1,1]){const e=new T.Mesh(endG,TMR(sx<0?'#c8643c':'#a85234'));e.scale.setScalar(R);e.position.x=sx*L/2;e.rotation.y=sx<0?-Math.PI/2:Math.PI/2;e.castShadow=true;in_.add(e);}
    part(G.box,'#6e4426',0,0.95,L/2+0.04,1.7,1.9,0.08,g);part(G.box,'#8a5a34',0,0.95,L/2+0.09,0.08,1.9,0.04,g);for(const s of [-1,1])part(G.box,'#4a3424',s*0.9,0.98,L/2+0.06,0.12,2.0,0.12,g);
    const win=M('#ffd98a',{emissive:'#ffb84a',emissiveIntensity:0.5});for(const s of [-1,1])part(G.cyl,win,s*1.35,1.2,L/2+0.05,0.4,0.06,0.4,g).rotation.x=Math.PI/2;
    for(const z of [-1.2,0.4])part(G.box,'#cfeef2',0,R+0.02,z,0.9,0.06,0.7,g);
    part(G.cyl,'#7d6a58',0.9,R+0.6,-1.4,0.36,1.4,0.36,g);part(G.cyl,'#5d4a3a',0.9,R+1.33,-1.4,0.5,0.1,0.5,g);g.userData.anim.chimney=new T.Vector3(0.9,R+1.45,-1.4);
    g.userData.anim.gear=gearSign(g,0,2.35,L/2+0.1,0.42);
    workbench(g,2.6,0.8,Math.PI/2,1.8);part(G.cyl,'#a0623c',-2.5,0.5,1.4,0.7,1.0,0.7,g);part(G.cyl,'#8b5034',-2.5,1.02,1.4,0.72,0.06,0.72,g);
    if(lvl>=2)anvil(g,-1.6,L/2+1.2);if(lvl>=3){part(G.box,P.wood,2.6,0.35,-1.3,0.8,0.7,0.7,g);part(G.box,P.wood,2.5,1.05,-1.3,0.7,0.7,0.6,g);}
    return g;},
  C:(lvl)=>{// open-air workshop under a striped canvas
    const g=grp();g.userData.anim={};
    for(const [x,z,h] of [[-2.3,1.4,2.7],[2.3,1.4,2.7],[-2.3,-1.4,2.3],[2.3,-1.4,2.3]])part(G.cyl6,P.wood,x,h/2,z,0.18,h,0.18,g);
    const cv=part(G.box,texM(stripeTex('#c8643c','#efe2c4',8),true),0,2.55,0,5.0,0.05,3.2,g);cv.rotation.x=0.14;
    for(let i=0;i<9;i++)part(G.cone3,i%2?'#efe2c4':'#c8643c',-2.2+i*0.55,2.62,1.72,0.3,0.28,0.06,g).rotation.z=Math.PI;
    workbench(g,-0.4,-0.6,0,2.8);anvil(g,1.4,0.7);
    const ra=grp(-1.6,0,0.6,g);part(G.cyl,'#e0b04c',0,0.2,0,0.8,0.4,0.8,ra);const ar=grp(0,0.4,0,ra);part(G.cyl,'#e0b04c',0,0.5,0,0.24,1.0,0.24,ar);
    const fa=grp(0,1.0,0,ar);fa.rotation.z=-1.1;part(G.sph,'#4a4e55',0,0,0,0.3,0.3,0.3,fa);part(G.cyl,'#e0b04c',0,0.4,0,0.2,0.8,0.2,fa);for(const s of [-1,1])part(G.box,'#4a4e55',s*0.08,0.85,0,0.06,0.22,0.1,fa);
    g.userData.anim.gear=ar;
    const fg=grp(2.0,0,-0.9,g);part(G.box,'#8a7a6a',0,0.5,0,1.0,1.0,0.9,fg);part(G.box,M('#ff9a40',{emissive:'#ff7a20',emissiveIntensity:0.9}),0,0.55,0.46,0.5,0.32,0.04,fg);part(G.cyl,'#7d6a58',0,1.6,0,0.3,1.4,0.3,fg);g.userData.anim.chimney=new T.Vector3(2.0,2.4,-0.9);
    const ps=gearSign(g,2.3,3.05,1.4,0.42);
    part(G.box,P.wood,-2.9,0.35,-0.3,0.7,0.7,0.7,g);part(G.box,'#5a8a95',-2.9,0.3,0.7,0.6,0.6,0.6,g);
    if(lvl>=2){const l=grp(0,2.3,0,g);part(G.cyl4,'#3a3430',0,0.12,0,0.02,0.3,0.02,l);part(G.sph,M('#ffd98a',{emissive:'#ffb84a',emissiveIntensity:0.9}),0,-0.1,0,0.28,0.28,0.28,l);}
    if(lvl>=3)part(G.box,'#7d8590',0.6,0.25,1.6,1.2,0.5,0.5,g);
    return g;}},
 sklenik:{
  A:(lvl)=>{// classic glass greenhouse with a pitched roof
    const g=grp();const L=5,D=3.4,Hw=1.7,Hr=2.8,gm=glassM(),fr='#f3ece0';
    part(G.box,'#b98a62',0,0.2,0,L+0.2,0.4,D+0.2,g);
    for(const [x,z,w,d] of [[0,D/2,L,0.04],[0,-D/2,L,0.04],[L/2,0,0.04,D],[-L/2,0,0.04,D]]){const m=new T.Mesh(G.box,gm);m.position.set(x,0.4+Hw/2,z);m.scale.set(w,Hw,d);g.add(m);}
    const sl=Math.hypot(D/2,Hr-Hw-0.4),an=Math.atan2(Hr-Hw-0.4,D/2);
    for(const s of [-1,1]){const m=new T.Mesh(G.box,gm);m.position.set(0,0.4+Hw+(Hr-Hw-0.4)/2,s*D/4);m.scale.set(L,0.03,sl);m.rotation.x=s*an;g.add(m);
      const t=new T.Mesh(triGeo([s*L/2,0.4+Hw,-D/2],[s*L/2,0.4+Hw,D/2],[s*L/2,Hr,0]),gm);g.add(t);}
    for(let i=0;i<=4;i++){const x=-L/2+i*L/4;for(const z of [-D/2,D/2])part(G.box,fr,x,0.4+Hw/2,z,0.08,Hw,0.08,g);
      for(const s of [-1,1]){const r=part(G.box,fr,x,0.4+Hw+(Hr-Hw-0.4)/2,s*D/4,0.07,0.07,sl,g);r.rotation.x=s*an;}}
    for(const s of [-1,1]){part(G.box,fr,s*L/2,0.4+Hw/2,0,0.08,Hw,0.08,g);part(G.box,fr,0,0.4+Hw,s*D/2,L,0.08,0.08,g);}part(G.box,fr,0,Hr,0,L+0.1,0.1,0.1,g);
    part(G.box,fr,0,0.4+0.85,D/2+0.02,0.9,1.7,0.06,g).material=M('#e9dcc4');
    for(const z of [-0.8,0.8]){part(G.box,P.wood,0,0.55,z,L-0.8,0.3,1.0,g);plantsIn(g,0,z,L-1.2,0.8,lvl>1?8:5,z>0?3:9,lvl);}
    return g;},
  B:(lvl)=>{// plastic tunnel greenhouse with hoops
    const g=grp();const L=5.4,R=1.7;const sh=new T.Mesh(halfCyl(24),glassM());sh.scale.set(L,R,R);g.add(sh);
    for(let i=0;i<=5;i++){const h=part(new T.TorusGeometry(R,0.05,6,24,Math.PI),'#f3ece0',-L/2+i*L/5,0,0,1,1,1,g);h.rotation.y=Math.PI/2;}
    part(G.box,'#f3ece0',0,R,0,L,0.06,0.06,g);
    const endG=new T.CircleGeometry(1,24,0,Math.PI);for(const s of [-1,1]){const e=new T.Mesh(endG,glassM());e.scale.setScalar(R);e.position.x=s*L/2;e.rotation.y=Math.PI/2;g.add(e);}
    part(G.box,'#e9dcc4',L/2+0.02,0.85,0,0.06,1.7,0.9,g);
    part(G.box,'#a68f78',0,0.04,0,L,0.08,2*R,g,true).receiveShadow=true;
    for(const z of [-0.85,0,0.85]){part(G.box,'#8a6a48',0,0.1,z,L-0.6,0.12,0.5,g);plantsIn(g,0,z,L-1,0.4,4+lvl,Math.round(z*10)+20,1+lvl);}
    return g;},
  C:(lvl)=>{// old bus turned into a greenhouse
    const g=grp();const W=g;const bus=grp(0,0,0,g);bus.rotation.set(0,0.12,0.04);const y='#d9a441',gm=glassM();
    mk(rbox(5.6,1.5,2.2,0.32),y,bus,{p:[0,1.15,0]});mk(rbox(5.62,0.3,2.22,0.1),'#c8643c',bus,{p:[0,0.75,0]});mk(rbox(5.4,0.2,2.0,0.08),'#efe2c4',bus,{p:[0,1.98,0]});
    for(const s of [-1,1])for(let i=0;i<5;i++){const m=new T.Mesh(G.box,gm);m.position.set(-2.1+i*0.95,1.45,s*1.11);m.scale.set(0.8,0.6,0.04);bus.add(m);part(G.box,'#3a3430',-2.1+i*0.95,1.45,s*1.12,0.84,0.05,0.03,bus,true);}
    const ws=new T.Mesh(G.box,gm);ws.position.set(2.81,1.45,0);ws.scale.set(0.04,0.65,1.8);bus.add(ws);
    for(const z of [-0.65,0.65])part(G.sph,'#e8e0c8',2.82,0.95,z,0.12,0.22,0.22,bus);part(G.box,'#9aa0a6',2.85,0.55,0,0.12,0.18,2.1,bus);
    for(const [x,z] of [[1.8,1.0],[1.8,-1.0],[-1.7,1.0],[-1.7,-1.0]]){const w=part(G.cyl,'#2f2c2a',x,0.32,z,0.7,0.24,0.7,bus);w.rotation.x=Math.PI/2;}
    plantsIn(bus,0,0,4.6,1.6,lvl>1?14:9,41,0);for(let i=0;i<6+lvl*2;i++){const x=-2.2+i*0.7,z=((i*7)%5-2)*0.35;part(i%2?G.ico:G.cone5,i%3?'#7fa05a':'#6f8f4f',x,2.25+(i%3)*0.2,z,0.7,0.9+(i%2)*0.4,0.7,bus);}
    for(let i=0;i<3;i++)part(G.cone3,'#88a85f',-2.4+i*0.2,1.2,1.15,0.3,0.7,0.1,bus).rotation.x=0.6;
    const bed=grp(0,0,2.1,g);part(G.box,P.wood,0,0.18,0,3.0,0.36,0.9,bed);plantsIn(bed,0,0,2.6,0.6,3,7,1+lvl);
    part(G.cyl,'#57a6b6',-3.4,0.55,0.8,0.8,1.1,0.8,g);part(G.cyl,'#8fc6cf',-3.4,1.12,0.8,0.82,0.06,0.82,g);
    return g;},
  D:(lvl)=>{// raised garden beds under shade sails
    const g=grp();
    for(const z of [-1.1,0,1.1]){part(G.box,P.wood,0,0.22,z,4.2,0.44,0.8,g);part(G.box,'#7a5a3c',0,0.43,z,4.0,0.04,0.65,g,true);plantsIn(g,0,z,3.8,0.5,4+lvl,Math.round(z*7)+50,1+lvl);}
    const posts=[[-2.6,1.7,2.8],[2.6,1.7,2.4],[2.6,-1.7,3.0],[-2.6,-1.7,2.4]];for(const [x,z,h] of posts)part(G.cyl6,P.wood,x,h/2,z,0.16,h,0.16,g);
    const sA=new T.Mesh(triGeo([-2.6,2.8,1.7],[2.6,2.4,1.7],[2.6,3.0,-1.7]),rimify(MAT({color:C('#c8643c'),side:T.DoubleSide})));sA.castShadow=true;g.add(sA);
    const sB=new T.Mesh(triGeo([-2.6,2.5,1.5],[2.4,2.85,-1.7],[-2.6,2.3,-1.7]),rimify(MAT({color:C('#efe2c4'),side:T.DoubleSide})));sB.castShadow=true;g.add(sB);
    part(G.cyl,'#57a6b6',3.2,0.6,0.2,0.8,1.2,0.8,g);part(G.cyl,'#8fc6cf',3.2,1.22,0.2,0.82,0.06,0.82,g);
    for(const z of [-1.1,0,1.1]){const p=part(G.cyl,'#4a4e55',0.4,0.5,z,0.05,4.6,0.05,g,true);p.rotation.z=Math.PI/2;}
    return g;}},
 dron:{
  A:(lvl)=>{// quadcopter on a landing pad (now in the game – "flying gift" fix)
    const g=grp();g.userData.anim={};part(G.cyl,'#b9a48a',0,0.1,0,3.6,0.2,3.6,g);part(G.cyl,'#8a7a6a',0,0.21,0,3.0,0.04,3.0,g,true);
    for(const [x,z,w,d] of [[-0.45,0,0.16,1.3],[0.45,0,0.16,1.3],[0,0,0.9,0.16]])part(G.box,'#e0b04c',x,0.235,z,w,0.02,d,g,true);
    for(let i=0;i<8;i++){const a=i/8*6.283;part(G.sph,M('#ffd36e',{emissive:'#ffb020',emissiveIntensity:0.8}),Math.cos(a)*1.65,0.24,Math.sin(a)*1.65,0.12,0.08,0.12,g,true);}
    part(G.cyl4,'#8b8f96',1.9,1.3,-0.6,0.15,2.6,0.15,g);const dish=part(G.half,M(P.metal,{metalness:0.3,roughness:0.5}),1.9,2.7,-0.6,1.4,0.5,1.4,g);dish.rotation.x=-1.1;
    part(G.box,'#5d6168',1.9,0.45,-0.6,0.6,0.5,0.4,g);part(G.sph,M('#7fe07f',{emissive:'#40c040',emissiveIntensity:1}),1.9,0.55,-0.39,0.1,0.1,0.06,g,true);
    const mkQuad=(par,col)=>{const dr=grp(0,0,0,par);const rot=[];mk(rbox(0.9,0.32,0.9,0.14),col,dr);mk(rbox(0.6,0.12,0.6,0.06),'#e8e0c8',dr,{p:[0,0.2,0]});
      for(const a of [0.785,2.356,3.927,5.497]){const c=Math.cos(a),s=Math.sin(a);mk(cyl(0.05,0.05,0.85,8),'#4a4e55',dr,{p:[c*0.6,0.04,s*0.6],r:[0,-a,Math.PI/2]});
        mk(cyl(0.1,0.1,0.16,12),'#3a3430',dr,{p:[c*1.0,0.1,s*1.0]});mk(tor(0.36,0.03,6,24),col,dr,{p:[c*1.0,0.18,s*1.0],r:[Math.PI/2,0,0]});
        const rb=cgrp(dr,[c*1.0,0.21,s*1.0]);mk(rbox(0.66,0.02,0.09,0.01),'#2f2c2a',rb,{ol:0});rot.push(rb);}
      mk(sph(0.14),'#3a3430',dr,{p:[0,-0.24,0.18]});mk(cyl(0.07,0.07,0.05,12),M('#5fd1e8',{emissive:'#2fa8c8',emissiveIntensity:0.8}),dr,{p:[0,-0.26,0.31],r:[Math.PI/2,0,0]});
      for(const s of [-1,1]){mk(cyl(0.03,0.03,0.8,6),'#4a4e55',dr,{p:[s*0.32,-0.42,0],r:[Math.PI/2,0,0]});for(const z of [-0.25,0.25])mk(cyl(0.025,0.025,0.3,6),'#4a4e55',dr,{p:[s*0.3,-0.28,z],r:[0,0,s*0.2]});}
      mk(sph(0.06),M('#ff6a4a',{emissive:'#ff3a1a',emissiveIntensity:1}),dr,{p:[0,0.05,0.46]});return {dr,rot};};
    const q=mkQuad(g,'#7a5a8c');q.dr.position.set(0,3,0);g.userData.anim.drone=q.dr;g.userData.anim.rotors=q.rot;
    if(lvl>=3){const q2=mkQuad(g,'#5a8a95');q2.dr.position.set(-0.4,0.68,0.5);q2.dr.scale.setScalar(0.8);g.userData.anim.rotors=q.rot;}
    return g;},
  B:(lvl)=>{// fixed-wing glider drone on a launch rail
    const g=grp();part(G.cyl,'#b9a48a',0,0.1,0,3.8,0.2,3.0,g);
    const rail=grp(-0.2,0,0,g);for(const x of [-1.2,0.9]){const h=x<0?0.5:1.3;for(const z of [-0.3,0.3])part(G.cyl4,P.dark,x,h/2+0.1,z,0.1,h,0.1,rail);}
    const bm=part(G.box,'#8b8f96',0,1.0,0,3.0,0.14,0.3,rail);bm.rotation.z=0.27;
    const gl=grp(0.15,1.32,0,rail);gl.rotation.z=0.27;mk(sph(0.3),'#7a5a8c',gl).scale.set(3.2,1,1);mk(rbox(0.5,0.05,3.0,0.02),'#e8e0c8',gl,{p:[0.1,0.12,0]});
    mk(cyl(0.04,0.04,1.2,6),'#4a4e55',gl,{p:[-1.1,0.05,0],r:[0,0,Math.PI/2]});for(const s of [-1,1])mk(rbox(0.3,0.03,0.5,0.01),'#7a5a8c',gl,{p:[-1.6,0.18,s*0.18],r:[s*0.6,0,0]});
    mk(rbox(0.04,0.5,0.1,0.01),'#2f2c2a',gl,{p:[-1.72,0.05,0]});mk(sph(0.12),M('#5fd1e8',{emissive:'#2fa8c8',emissiveIntensity:0.8}),gl,{p:[0.8,-0.1,0]});
    part(G.cyl4,'#8b8f96',1.6,1.4,-1.0,0.1,2.8,0.1,g);const ws=grp(1.6,2.6,-1.0,g);ws.rotation.set(0,0.6,0);for(let i=0;i<3;i++){const c=part(G.cyl,i%2?'#efe2c4':'#e0743f',0.3+i*0.32,0,0,0.38-i*0.06,0.32,0.38-i*0.06,ws);c.rotation.z=Math.PI/2;}
    part(G.box,'#5d6168',1.5,0.4,0.9,0.7,0.5,0.5,g);if(lvl>=2){const d=part(G.half,M(P.metal,{metalness:0.3,roughness:0.5}),-1.6,1.0,-1.0,1.0,0.4,1.0,g);d.rotation.x=-1.1;part(G.cyl4,'#8b8f96',-1.6,0.5,-1.0,0.1,0.9,0.1,g);}
    return g;},
  C:(lvl)=>{// tethered scout balloon with a camera pod
    const g=grp();g.userData.anim={};part(G.cyl,'#b9a48a',0,0.1,0,3.4,0.2,3.4,g);
    const wn=grp(0,0.2,0.6,g);for(const s of [-1,1])part(G.box,'#5d6168',s*0.55,0.4,0,0.1,0.8,0.6,wn);const dr=part(G.cyl,'#a0623c',0,0.6,0,0.7,1.0,0.7,wn);dr.rotation.z=Math.PI/2;
    const bl=grp(0.4,5.2,0,g);mk(sph(0.6),'#7a5a8c',bl).scale.set(3.4,1.6,1.6);mk(tor(0.62,0.05,6,24),'#e8e0c8',bl,{r:[0,Math.PI/2,0]}).scale.set(1,1.6,1.6);
    for(const [ry,rx] of [[0,0],[0,Math.PI/2],[0,-Math.PI/2]])mk(rbox(0.5,0.5,0.05,0.04),'#e0b04c',bl,{p:[-1.8,rx?0:0.4,rx>0?0.4:rx<0?-0.4:0],r:[rx?Math.PI/2:0,0,0]});
    mk(rbox(0.5,0.3,0.36,0.08),'#5d6168',bl,{p:[0.2,-1.0,0]});mk(sph(0.1),M('#5fd1e8',{emissive:'#2fa8c8',emissiveIntensity:0.8}),bl,{p:[0.4,-1.15,0.12]});
    const t=part(G.cyl,'#3a3430',0.2,2.9,0.3,0.03,4.6,0.03,g,true);t.rotation.z=0.06;
    part(G.box,P.wall2,-1.2,0.6,-0.8,1.4,1.0,1.1,g);part(G.box,'#7a5a8c',-1.2,1.15,-0.8,1.6,0.12,1.3,g);
    g.userData.anim.balloon=bl;return g;}}
};
const BOTV={
 A:(col)=>{// tracked worker
   const b=grp(),body=grp(0,0,0,b);for(const s of [-1,1]){mk(rbox(0.34,0.4,1.05,0.17),'#3a3836',body,{p:[s*0.48,0.21,0]});for(const z of [-0.33,0,0.33])mk(cyl(0.12,0.12,0.36,12),'#6d7279',body,{p:[s*0.48,0.21,z],r:[0,0,Math.PI/2]});}
   mk(rbox(0.8,0.66,0.78,0.22),col,body,{p:[0,0.78,0]});mk(rbox(0.5,0.32,0.06,0.06),'#e8e0c8',body,{p:[0,0.72,0.4]});
   const hd=cgrp(body,[0,1.25,0]);mk(sph(0.3),'#e8e0c8',hd);for(const s of [-1,1]){const a=cgrp(body,[s*0.46,0.88,0.05],[0,0,s*0.35]);mk(caps(0.06,0.055,0.42),'#6d7279',a);for(const k of [-1,1])mk(rbox(0.04,0.14,0.08,0.02),'#4a4e55',a,{p:[k*0.04,-0.46,0.02]});}
   return {b,body,hd,eyeZ:0.27};},
 B:(col)=>{// tin-can hover bot with a rotor
   const b=grp(),body=grp(0,0,0,b);mk(cyl(0.42,0.42,0.8,24),col,body,{p:[0,1.4,0]});for(const y of [1.0,1.8])mk(tor(0.42,0.04,6,24),'#4a4e55',body,{p:[0,y,0],r:[Math.PI/2,0,0]});
   mk(cyl(0.04,0.04,0.3,8),'#4a4e55',body,{p:[0,1.95,0]});const rt=cgrp(body,[0,2.1,0]);mk(cyl(0.08,0.08,0.06,12),'#3a3430',rt);for(const a of [0,Math.PI/2])mk(rbox(1.4,0.02,0.14,0.01),'#e8e0c8',rt,{r:[0,a,0]});
   for(const s of [-1,1]){const a=cgrp(body,[s*0.44,1.15,0],[0,0,s*0.2]);mk(caps(0.04,0.035,0.4),'#6d7279',a);mk(sph(0.06),'#4a4e55',a,{p:[0,-0.42,0]});}
   return {b,body,hd:cgrp(body,[0,1.45,0]),eyeZ:0.42,rot:rt};},
 C:(col)=>{// crab bot with four legs and eye stalks
   const b=grp(),body=grp(0,0,0,b);mk(new T.SphereGeometry(0.58,24,12,0,Math.PI*2,0,Math.PI/2),col,body,{p:[0,0.62,0]});mk(cyl(0.6,0.55,0.16,24),'#4a4e55',body,{p:[0,0.56,0]});
   for(const a of [0.6,2.54,3.74,5.68]){const hp=cgrp(body,[Math.cos(a)*0.5,0.6,Math.sin(a)*0.5],[0,-a,0]);mk(cyl(0.05,0.05,0.5,8),'#6d7279',hp,{p:[0.2,0.15,0],r:[0,0,-0.927]});
     mk(sph(0.07),'#4a4e55',hp,{p:[0.4,0.3,0]});mk(cyl(0.045,0.035,0.92,8),'#6d7279',hp,{p:[0.5,-0.15,0],r:[0,0,-2.923]});mk(sph(0.06),'#3a3430',hp,{p:[0.6,-0.58,0]});}
   const hd=cgrp(body,[0,1.2,0.15]);for(const s of [-1,1]){mk(cyl(0.03,0.03,0.4,6),'#4a4e55',body,{p:[s*0.18,1.0,0.15],r:[0,0,-s*0.2]});mk(sph(0.13),'#fff8ea',body,{p:[s*0.22,1.22,0.15]});mk(sph(0.06),'#3a2a20',body,{p:[s*0.22,1.23,0.26]});}
   return {b,body,hd,eyeZ:-1};},
 D:(col)=>{// lantern bot with a glowing chest window
   const b=grp(),body=grp(0,0,0,b);mk(caps(0.42,0.42,1.2),col,body,{p:[0,1.65,0]});const win=M('#ffd98a',{emissive:'#ffb84a',emissiveIntensity:1.0});
   mk(rbox(0.48,0.5,0.12,0.08),win,body,{p:[0,1.0,0.36]});for(const x of [-0.08,0.08])mk(rbox(0.03,0.5,0.14,0.01),'#4a3424',body,{p:[x,1.0,0.37],ol:0});
   mk(tor(0.18,0.035,6,16,Math.PI),'#4a3424',body,{p:[0,1.7,0]});for(const s of [-1,1]){mk(caps(0.1,0.09,0.32),'#4a4e55',body,{p:[s*0.2,0.4,0]});mk(rbox(0.2,0.1,0.28,0.04),'#3a3430',body,{p:[s*0.2,0.06,0.04]});
     const a=cgrp(body,[s*0.42,1.25,0],[0,0,s*0.25]);mk(caps(0.06,0.05,0.4),'#4a4e55',a);mk(sph(0.08),col,a,{p:[0,-0.42,0]});}
   const gs=glowSprite('#ffb050',2.6);gs.position.set(0,1.0,0.5);body.add(gs);return {b,body,hd:cgrp(body,[0,1.43,0]),eyeZ:0.4,small:1};},
 E:(col)=>{// TV-head bot on bird legs
   const b=grp(),body=grp(0,0,0,b);mk(rbox(0.95,0.75,0.6,0.14),col,body,{p:[0,1.55,0]});mk(rbox(0.75,0.55,0.05,0.09),'#1d1a18',body,{p:[0,1.55,0.3]});
   const em=M('#ffe2b8',{emissive:'#ffb060',emissiveIntensity:1});for(const s of [-1,1])mk(rbox(0.12,0.2,0.03,0.05),em,body,{p:[s*0.16,1.58,0.33],ol:0});mk(rbox(0.2,0.04,0.03,0.02),em,body,{p:[0,1.42,0.33],ol:0});
   for(const s of [-1,1]){mk(cyl(0.015,0.015,0.5,6),'#3a3430',body,{p:[s*0.15,2.1,0],r:[0,0,-s*0.4]});mk(sph(0.05),'#e0743f',body,{p:[s*0.25,2.33,0]});
     mk(cyl(0.05,0.045,0.55,8),'#6d7279',body,{p:[s*0.22,0.95,-0.08],r:[-0.3,0,0]});mk(sph(0.07),'#4a4e55',body,{p:[s*0.22,0.7,-0.16]});mk(cyl(0.04,0.035,0.62,8),'#6d7279',body,{p:[s*0.22,0.38,-0.06],r:[0.35,0,0]});
     for(const r of [-0.45,0,0.45])mk(rbox(0.05,0.04,0.24,0.015),'#3a3430',body,{p:[s*0.22+Math.sin(r)*0.1,0.04,0.06+Math.cos(r)*0.08],r:[0,r,0]});}
   return {b,body,hd:null,eyeZ:-1};}
};
function makeBotV(v,col,s){const o=BOTV[v](col);o.b.scale.setScalar(s||1);
  if(o.hd&&o.eyeZ>0){const e=mk(cyl(o.small?0.08:0.16,o.small?0.08:0.16,0.04,16),'#fff8ea',o.hd,{p:[0,0,o.eyeZ],r:[Math.PI/2,0,0]});if(o.small){e.position.x=-0.12;mk(cyl(0.08,0.08,0.04,16),'#fff8ea',o.hd,{p:[0.12,0,o.eyeZ],r:[Math.PI/2,0,0]});mk(sph(0.04),'#3a2a20',o.hd,{p:[-0.12,0,o.eyeZ+0.03]});mk(sph(0.04),'#3a2a20',o.hd,{p:[0.12,0,o.eyeZ+0.03]});}
    else mk(cyl(0.075,0.075,0.05,16),'#3a2a20',o.hd,{p:[0.02,0,o.eyeZ+0.02],r:[Math.PI/2,0,0]});}
  if(ST.chunky)blobShadow(o.b,0.7);return o.b;}

// ================= characters (from the character lab) =================
// ---------- geometry helpers ----------
const gcache={};
function rbox(w,h,d,r,s){w=w>1e-4?w:1e-4;h=h>1e-4?h:1e-4;d=d>1e-4?d:1e-4;r=r>0?r:0;const key='rb'+[w,h,d,r].join('_');if(gcache[key])return gcache[key];s=s||12;
  const g=new T.BoxGeometry(1,1,1,s,s,s),p=g.attributes.position,n=g.attributes.normal;const hw=w/2,hh=h/2,hd=d/2;r=Math.min(r,hw,hh,hd);
  const iw=hw-r,ih=hh-r,id=hd-r,kx=iw/hw,ky=ih/hh,kz=id/hd;
  const f=(u,k)=>{const a=Math.abs(u)*2;const m=a<0.5?a/0.5*k:k+(a-0.5)/0.5*(1-k);return Math.sign(u)*m;};
  for(let i=0;i<p.count;i++){const x=f(p.getX(i),kx)*hw,y=f(p.getY(i),ky)*hh,z=f(p.getZ(i),kz)*hd;const cx=clamp(x,-iw,iw),cy=clamp(y,-ih,ih),cz=clamp(z,-id,id);
    let nx=x-cx,ny=y-cy,nz=z-cz,l=Math.hypot(nx,ny,nz);if(l<1e-6){nx=n.getX(i);ny=n.getY(i);nz=n.getZ(i);l=1;}nx/=l;ny/=l;nz/=l;p.setXYZ(i,cx+nx*r,cy+ny*r,cz+nz*r);n.setXYZ(i,nx,ny,nz);}
  return gcache[key]=g;}
function caps(r1,r2,len,seg){const key='cp'+[r1,r2,len].join('_');if(gcache[key])return gcache[key];const pts=[],N=6;
  for(let i=0;i<=N;i++){const a=-Math.PI/2+i/N*Math.PI/2;pts.push(new T.Vector2(Math.cos(a)*r2+1e-4,-len+r2+Math.sin(a)*r2));}
  for(let i=0;i<=N;i++){const a=i/N*Math.PI/2;pts.push(new T.Vector2(Math.cos(a)*r1+1e-4,-r1+Math.sin(a)*r1));}
  return gcache[key]=new T.LatheGeometry(pts,seg||14);}
function lathe(pts,seg){return new T.LatheGeometry(pts.map(p=>new T.Vector2(p[0],p[1])),seg||18);}
const sph=(r,w,h)=>{const k='s'+r;return gcache[k]||(gcache[k]=new T.SphereGeometry(r,w||20,h||14));};
const tor=(R,r,rs,ts,arc)=>new T.TorusGeometry(R,r,rs||8,ts||24,arc||Math.PI*2);
const cyl=(rt,rb,h,s)=>new T.CylinderGeometry(rt,rb,h,s||20);

// ---------- faces (canvas textures) ----------
function faceTex(draw,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;}
const INK='#2e2018';
function heroFace(expr,fem){return faceTex((g,w,h)=>{
  const ex=[w*0.34,w*0.66],ey=h*0.5;
  g.fillStyle='rgba(232,120,110,0.28)';g.beginPath();g.ellipse(w*0.25,h*0.66,22,12,0,0,6.283);g.ellipse(w*0.75,h*0.66,22,12,0,0,6.283);g.fill();
  g.strokeStyle=INK;g.fillStyle=INK;g.lineCap='round';g.lineWidth=7;
  const brow=(dy,tilt)=>{for(const [i,x] of ex.entries()){const s=i?1:-1;g.beginPath();g.moveTo(x-18,ey-46+dy+tilt*s*-1);g.lineTo(x+18,ey-46+dy+tilt*s);g.stroke();}};
  g.fillStyle='rgba(160,82,52,0.55)';for(const [fx,fy] of [[-34,8],[-24,14],[-40,18],[-28,24],[34,8],[24,14],[40,18],[28,24]]){g.beginPath();g.arc(w/2+fx*1.9,h*0.6+fy*0.8,2.6,0,6.283);g.fill();}g.fillStyle=INK;
  if(expr==='idle'||expr==='look'){const lx=expr==='look'?5:0;for(const x of ex){g.fillStyle='#fbf6ee';g.beginPath();g.ellipse(x,ey,33,39,0,0,6.283);g.fill();g.strokeStyle=INK;g.lineWidth=4;g.stroke();
      g.fillStyle=INK;g.beginPath();g.ellipse(x+lx,ey+4,21,27,0,0,6.283);g.fill();g.fillStyle='#6a4a32';g.beginPath();g.ellipse(x+lx,ey+9,12,15,0,0,6.283);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x+lx+8,ey-9,7.5,0,6.283);g.fill();g.fillStyle=INK;
      if(fem){g.lineWidth=5;const s=x<w/2?-1:1;for(const k of [0,1]){g.beginPath();g.moveTo(x+s*(22+k*7),ey-28+k*8);g.lineTo(x+s*(34+k*8),ey-39+k*6);g.stroke();}}}g.strokeStyle=INK;g.lineWidth=7;
    brow(0,0);g.lineWidth=6;g.beginPath();g.arc(w/2,h*0.72,14,0.2,Math.PI-0.2);g.stroke();}
  if(expr==='blink'){for(const x of ex){g.beginPath();g.arc(x,ey-4,15,0.25,Math.PI-0.25);g.stroke();}brow(4,0);g.lineWidth=6;g.beginPath();g.arc(w/2,h*0.72,14,0.2,Math.PI-0.2);g.stroke();}
  if(expr==='happy'){for(const x of ex){g.beginPath();g.arc(x,ey+8,15,Math.PI+0.3,-0.3);g.stroke();}brow(-6,0);
    g.beginPath();g.moveTo(w/2-20,h*0.68);g.quadraticCurveTo(w/2,h*0.68+34,w/2+20,h*0.68);g.closePath();g.fill();g.fillStyle='#d9675e';g.beginPath();g.ellipse(w/2,h*0.68+14,9,6,0,0,6.283);g.fill();}
  if(expr==='tired'){for(const x of ex){g.beginPath();g.ellipse(x,ey+4,13,13,0,0,Math.PI);g.fill();g.lineWidth=6;g.beginPath();g.moveTo(x-17,ey+2);g.lineTo(x+17,ey+2);g.stroke();}
    brow(2,-7);g.lineWidth=6;g.beginPath();g.moveTo(w/2-14,h*0.76);g.quadraticCurveTo(w/2-5,h*0.72,w/2,h*0.76);g.quadraticCurveTo(w/2+5,h*0.8,w/2+14,h*0.76);g.stroke();
    g.fillStyle='#8fd0e0';g.beginPath();g.moveTo(w*0.86,h*0.3);g.quadraticCurveTo(w*0.9,h*0.4,w*0.86,h*0.44);g.quadraticCurveTo(w*0.82,h*0.4,w*0.86,h*0.3);g.fill();}
  if(expr==='ko'){g.lineWidth=7;for(const x of ex){g.beginPath();g.arc(x,ey-8,14,0.4,Math.PI-0.4);g.stroke();}g.lineWidth=6;g.beginPath();g.moveTo(w/2-10,h*0.76);g.lineTo(w/2+10,h*0.76);g.stroke();}
},300,230);}
function dogFace(expr){return faceTex((g,w,h)=>{
  const bgr=g.createLinearGradient(0,0,0,h);bgr.addColorStop(0,'#26336a');bgr.addColorStop(1,'#141c3e');g.fillStyle=bgr;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,0.12)';g.beginPath();g.ellipse(w*0.7,h*0.18,36,10,-0.3,0,6.283);g.fill();
  g.shadowColor='#ff9a30';g.shadowBlur=24;g.fillStyle='#ffc070';g.strokeStyle='#ffc070';g.lineCap='round';g.lineJoin='round';
  const ex=[w*0.32,w*0.68],ey=h*0.42;
  const rr=(x,y,ww,hh,r)=>{g.beginPath();g.moveTo(x-ww/2+r,y-hh/2);g.arcTo(x+ww/2,y-hh/2,x+ww/2,y+hh/2,r);g.arcTo(x+ww/2,y+hh/2,x-ww/2,y+hh/2,r);g.arcTo(x-ww/2,y+hh/2,x-ww/2,y-hh/2,r);g.arcTo(x-ww/2,y-hh/2,x+ww/2,y-hh/2,r);g.closePath();g.fill();};
  const ring=(x,y)=>{g.beginPath();g.arc(x,y,25,0,6.283);g.fill();g.shadowBlur=0;g.fillStyle='#ffe9c4';g.beginPath();g.arc(x,y,12,0,6.283);g.fill();g.fillStyle='#ffc070';g.shadowBlur=24;};
  if(expr==='idle')for(const x of ex)ring(x,ey);
  if(expr==='look')for(const x of ex)ring(x+12,ey);
  if(expr==='blink')for(const x of ex)rr(x,ey+6,46,10,5);
  if(expr==='happy'){g.lineWidth=14;for(const x of ex){g.beginPath();g.moveTo(x-22,ey+12);g.lineTo(x,ey-14);g.lineTo(x+22,ey+12);g.stroke();}}
  if(expr==='worried'){for(const [i,x] of ex.entries()){rr(x,ey+8,38,44,15);}g.lineWidth=9;g.beginPath();g.moveTo(ex[0]-22,ey-28);g.lineTo(ex[0]+16,ey-40);g.moveTo(ex[1]+22,ey-28);g.lineTo(ex[1]-16,ey-40);g.stroke();}
  if(expr==='grab'){g.lineWidth=13;g.beginPath();g.moveTo(ex[0]-20,ey-20);g.lineTo(ex[0]+16,ey);g.lineTo(ex[0]-20,ey+20);g.moveTo(ex[1]+20,ey-20);g.lineTo(ex[1]-16,ey);g.lineTo(ex[1]+20,ey+20);g.stroke();}
  if(expr==='love')for(const x of ex){g.beginPath();g.moveTo(x,ey+24);g.bezierCurveTo(x-34,ey,x-22,ey-30,x,ey-12);g.bezierCurveTo(x+22,ey-30,x+34,ey,x,ey+24);g.fill();}
},256,160);}
window.__HF=()=>[HF,HFF];const HF={},HFF={},HF4={},DF={};['idle','blink','happy','tired','ko','look'].forEach(e=>{HF[e]=heroFace(e);HFF[e]=heroFace(e,true);});['idle','blink','happy','worried','grab','love','look'].forEach(e=>DF[e]=dogFace(e));

// ---------- palette ----------
const SKIN='#ebbb98',HAIR='#45301f',TUNIC='#efe6d2',TUNIC2='#d8ccb2',PANTS='#8e9b94',SHOE='#77705f',BELT='#9a5236',GOLD='#cfa74e',TERRA='#c8643c',LEATHER='#8f4f31',WRAP='#ddd2bb',SACK='#b3a481',SACK2='#7d5a3c';
const STEEL='#5b7d97',STEEL2='#4c6a82',CREAM='#ece3cf',CREAM2='#f6f1e6',JOINT='#4a3e36',ACC='#e0743f';

// ---------- hats (no cowboy hat – Robin 19. 11.) ----------
const HATS=['boonie','conehat','shemagh'];
function addHat(head,type){
  if(type==='boonie'){// soft desert sun hat with a neck flap
    const h=cgrp(head,[0,0.5,0],[-0.06,0,0]);const c='#b9a27a',c2='#8f7a56';
    mk(lathe([[0.31,0.0],[0.3,0.1],[0.25,0.19],[0.12,0.23],[0.001,0.235]],28),c,h);
    mk(cyl(0.5,0.5,0.035,32),c,h,{p:[0,0.0,0]});mk(cyl(0.53,0.5,0.03,32),c2,h,{p:[0,-0.03,0],ol:0.006});
    mk(cyl(0.312,0.314,0.06,28),'#6e5a3e',h,{p:[0,0.05,0],ol:0.006});
    const fl=cgrp(h,[0,-0.02,-0.36],[0.35,0,0]);mk(rbox(0.56,0.34,0.025,0.012),c,fl,{p:[0,-0.17,0]});
    for(const s of [-1,1])mk(cyl(0.008,0.008,0.4,6),'#5a4632',h,{p:[s*0.3,-0.2,0.05],r:[0,0,s*0.12],ol:0});}
  if(type==='conehat'){// woven conical sun hat
    const h=cgrp(head,[0,0.6,0],[-0.05,0,0]);
    mk(new T.ConeGeometry(0.66,0.34,32,1,true),TM('#d9b56a',{side:T.DoubleSide}),h,{p:[0,0.06,0]});
    for(const [r,y] of [[0.5,-0.04],[0.32,0.05],[0.16,0.14]])mk(tor(r,0.01,4,40),'#b8914a',h,{p:[0,y,0],r:[Math.PI/2,0,0],ol:0});
    mk(cyl(0.03,0.03,0.04,10),'#b8914a',h,{p:[0,0.23,0],ol:0});
    for(const s of [-1,1])mk(cyl(0.008,0.008,0.42,6),'#c0432f',h,{p:[s*0.29,-0.25,0.04],r:[0,0,s*0.1],ol:0});}
  if(type==='shemagh'){// wrapped head scarf with a tail
    const c='#e8dcc0',c2='#c8643c';
    mk(new T.SphereGeometry(0.36,24,16,0,Math.PI*2,0,Math.PI*0.62),c,head,{p:[0,0.31,-0.03],r:[-0.78,0,0]});
    mk(tor(0.33,0.045,8,32),c,head,{p:[0,0.52,-0.02],r:[Math.PI/2+0.5,0,0],ol:0.008});
    mk(tor(0.33,0.014,4,32),c2,head,{p:[0,0.485,-0.0],r:[Math.PI/2+0.5,0,0],ol:0});
    const tl=cgrp(head,[0.04,0.32,-0.3],[0.25,0.15,0]);mk(rbox(0.22,0.42,0.04,0.02),c,tl,{p:[0,-0.2,0]});mk(rbox(0.22,0.03,0.045,0.01),c2,tl,{p:[0,-0.36,0],ol:0});}
}
// ===================== HERO =====================
// two wanderers from Robin's turnaround sheets (20. 11.) – the player picks one; Zuro is the same for both
const HVAR={m:{tunic:'#e4dac6',tunic2:'#cdbfa3',sleeve:'#e4dac6',pants:'#5d5b47',belt:'#6b3f26',buckle:'#d39a3c',hair:'#5c3621',shoe:'#6e3a28'},
            f:{tunic:'#c9684b',tunic2:'#ad5236',sleeve:'#dccfb5',pants:'#3c4559',belt:'#5e2b22',buckle:'#8d9299',hair:'#7d4f30',shoe:'#6e3a28'}};
// the big stylised head with face, hair and headgear – shared by the code-built hero and the skinned (mannequin) hero
function buildHeroHead(H,gear,V,FEM,head,neck){H.head=head;const CL=new T.SphereGeometry(1,12,9);
  const clump=(par,col,x,y,z,sx,sy,sz,rx,ry,rz)=>{const m=mk(CL,col,par,{p:[x,y,z],r:[rx||0,ry||0,rz||0],ol:0.008});m.scale.set(sx,sy,sz);return m;};
  const HR=0.33;{const hm=mk(sph(HR,24,18),SKIN,head,{p:[0,0.3,0],ol:0.016});hm.receiveShadow=false;hm.scale.set(1,0.97,0.97);}
  for(const s of [-1,1]){const e=mk(sph(0.06),SKIN,head,{p:[s*0.315,0.28,-0.02],ol:0.008});e.scale.set(0.55,1,0.8);}
  mk(sph(0.042),'#f0b392',head,{p:[0,0.25,0.325],ol:0.006});
  const fg=new T.SphereGeometry(HR*1.006,28,20,Math.PI/2-0.95,1.9,Math.PI/2-0.75,1.48);
  H.faceMat=MAT({map:H.F.idle,transparent:true,depthWrite:false});const face=new T.Mesh(fg,H.faceMat);face.position.y=0.3;face.renderOrder=2;head.add(face);
  // hair: a cap plus a few big sculpted clumps
  const hair=cgrp(head,[0,0.3,0]);H.hair=hair;const HC=V.hair;
  if(gear.head!=='hood'&&gear.head!=='shemagh'){
    mk(new T.SphereGeometry(HR*1.08,24,16,0,Math.PI*2,0,Math.PI*0.5),HC,hair,{p:[0,0.0,-0.03],r:[-0.36,0,0]});
    if(FEM){// wavy shoulder-length hair with a side-swept fringe
      clump(hair,HC,0,0.06,-0.12,0.36,0.34,0.3);
      for(const s of [-1,1]){clump(hair,HC,s*0.27,-0.08,-0.04,0.1,0.26,0.17,0.05,0,s*0.12);clump(hair,HC,s*0.24,-0.26,-0.08,0.11,0.17,0.15,0.2,0,-s*0.25);clump(hair,HC,s*0.17,-0.2,-0.22,0.13,0.22,0.12,0.15,0,s*0.2);}
      clump(hair,HC,0,-0.18,-0.28,0.19,0.24,0.12,0.25,0,0);clump(hair,HC,-0.1,-0.34,-0.24,0.1,0.13,0.09,0.4,0,0.4);clump(hair,HC,0.11,-0.34,-0.24,0.1,0.13,0.09,0.4,0,-0.4);
      for(const [x,rz,l] of [[-0.17,0.5,0.15],[-0.07,0.35,0.16],[0.04,0.25,0.15],[0.14,0.1,0.13],[0.22,-0.2,0.12]])clump(hair,HC,x,0.17,0.25-Math.abs(x)*0.3,0.065,l,0.05,-0.45,0,rz);
    } else {// short messy hair: fringe clumps and a few spikes
      for(const [x,rz,l] of [[-0.16,0.7,0.12],[-0.06,0.45,0.13],[0.05,0.2,0.12],[0.15,-0.3,0.11]])clump(hair,HC,x,0.2,0.24-Math.abs(x)*0.3,0.06,l,0.05,-0.7,0,rz);
      clump(hair,HC,0.04,0.3,0.06,0.07,0.12,0.07,-1.0,0,-0.3);clump(hair,HC,-0.1,0.29,0.0,0.07,0.12,0.07,-1.1,0,0.4);clump(hair,HC,0.13,0.27,-0.04,0.065,0.11,0.065,-1.2,0,-0.6);
      for(const s of [-1,1])clump(hair,HC,s*0.27,0.08,-0.02,0.07,0.13,0.12,0,0,s*0.2);
      clump(hair,HC,0,0.04,-0.27,0.2,0.18,0.12,0.25,0,0);clump(hair,HC,0,-0.07,-0.27,0.14,0.1,0.08,0.2,0,0);}
  }
  // ===== items =====
  if(gear.head==='hood'){mk(sph(0.37,24,18),TERRA,head,{p:[0,0.33,-0.08],ol:0.016});mk(tor(0.27,0.06,8,24),'#b5562f',head,{p:[0,0.33,0.1],ol:0.012});
    mk(rbox(0.42,0.3,0.2,0.09),TERRA,head,{p:[0,0.06,-0.22]});mk(new T.ConeGeometry(0.06,0.18,10),HAIR,head,{p:[0.02,0.52,0.24],r:[-1.0,0,0.2],ol:0.01});}
  if(HATS.includes(gear.head))addHat(head,gear.head);
  if(gear.head==='cap'){mk(new T.SphereGeometry(HR*1.08,24,16,0,Math.PI*2,0,Math.PI*0.5),'#3d6f7a',head,{p:[0,0.32,0],r:[-0.12,0,0]});
    mk(rbox(0.36,0.035,0.2,0.015),'#2f5862',head,{p:[0,0.4,0.3],r:[0.25,0,0],ol:0.01});mk(sph(0.04),GOLD,head,{p:[0,0.69,-0.02],ol:0.006});}
  if(gear.eyes==='goggles'){const gy=HATS.includes(gear.head)?0.47:0.5;mk(tor(HR*1.04,0.025,6,32),'#4a3424',head,{p:[0,gy,0],r:[Math.PI/2+0.25,0,0],ol:0.006});
    for(const s of [-1,1]){const f=cgrp(head,[s*0.11,gy+0.03,0.29],[-0.35,s*0.18,0]);mk(cyl(0.085,0.085,0.07,20),'#7a5a3a',f,{r:[Math.PI/2,0,0]});
      mk(cyl(0.065,0.065,0.02,20),TM('#7fd0dc',{emissive:'#3a8fa0',emissiveIntensity:0.25}),f,{p:[0,0,0.035],r:[Math.PI/2,0,0],ol:0});}}
  if(gear.neck==='scarf'){mk(tor(0.13,0.06,10,24),'#e6cfa0',neck,{p:[0,0.0,0.01],r:[Math.PI/2,0,0],ol:0.012});const tl=cgrp(neck,[0.08,-0.02,0.1]);H.scarf=tl;
    mk(caps(0.05,0.045,0.32),'#e6cfa0',tl,{r:[0.25,0,0.15],ol:0.01});mk(tor(0.045,0.012,6,12),TERRA,tl,{p:[0.03,-0.26,0.06],r:[Math.PI/2,0,0],ol:0});}
}

// ===== skinned hero (Robin 21. 11.): body = Quaternius mannequin with a real skeleton, painted in the hero's outfit colours;
// our own big head, hair, backpack and hammer ride on its bones; animations play on the skeleton as they were made =====
const SKC={},SKA={},SK_NB=65;
function d64(b,TA){const s2=atob(b),u=new Uint8Array(s2.length);for(let i=0;i<s2.length;i++)u[i]=s2.charCodeAt(i);return new TA(u.buffer);}
// ===== the wanderer v4 (Robin 21. 11.: one hero, a man, made again from scratch) =====
// The mannequin is re-proportioned before use: [length of the bone's offset from its parent, girth along the bone, girth across it].
// Shorter sturdier legs, broad shoulders and chest, big hands and feet, short neck – the chunky Brawl build – while the animations stay untouched.
const SK_PROP={pelvis:[1,1,1.2],spine_01:[1,1,1.22],spine_02:[0.95,1,1.28],spine_03:[0.95,1,1.32],neck_01:[0.85,0.7,1.35],Head:[0.5,1,1],
  clavicle:[1,1,1.22],upperarm:[1.25,0.9,1.42],lowerarm:[0.9,0.9,1.4],hand:[0.9,1.38,1.38],finger1:[1.32,1.22,1.38],finger:[1.2,1.22,1.38],
  thigh:[1.16,0.8,1.36],calf:[0.8,0.82,1.4],foot:[0.82,1.34,1.34],ball:[1.28,1.28,1.36],ball_leaf:[1.28,1,1]};
// outfit colours of the new wanderer: cream shirt with rolled sleeves, teal work vest, slate trousers, leg wraps, leather shoes, brass goggles
const HV4={shirt:'#efe2c4',vest:'#2e7377',vestD:'#235a5d',pants:'#434b5e',pantsD:'#363d4d',wraps:'#e4d6b6',shoe:'#5a3826',boot:'#7a4e2e',sole:'#3a2619',
  belt:'#3d2618',buckle:'#d8a640',hair:'#3a2316',hairHi:'#57361f',brass:'#c9963d',lens:'#ffb24a',strap:'#4a3324'};
function skBase(){if(SKC.m)return SKC.m;if(typeof HERO_DATA==='undefined'||!HERO_DATA.m)return null;const D=HERO_DATA.m;
  const q=d64(D.p,Int16Array),pos0=new Float32Array(q.length);for(let i=0;i<q.length;i++)pos0[i]=q[i]/32767*D.s;
  const J=d64(D.j,Uint8Array),W=Float32Array.from(d64(D.w,Uint8Array),v=>v/255),idx=d64(D.i,Uint16Array),nv=pos0.length/3;
  // --- re-proportion the skeleton and bake the new shape into the vertices
  const bones=D.bones.map(d=>{const b=new T.Bone();b.position.fromArray(d.t);b.quaternion.fromArray(d.r);b.scale.fromArray(d.s);return b;});
  const top=new T.Object3D();D.bones.forEach((d,i)=>d.p>=0?bones[d.p].add(bones[i]):top.add(bones[i]));top.updateMatrixWorld(true);
  const wp=()=>bones.map(b=>new T.Vector3().setFromMatrixPosition(b.matrixWorld)),o0=wp();
  const kids=D.bones.map(()=>[]);D.bones.forEach((d,i)=>{if(d.p>=0)kids[d.p].push(i);});
  const key=n=>{n=n.replace(/_[lr]$/,'');if(/^(index|middle|ring|pinky|thumb)_01/.test(n))return 'finger1';if(/^(index|middle|ring|pinky|thumb)/.test(n))return 'finger';return n;};
  const PR=D.bones.map(d=>SK_PROP[key(d.n)]||[1,1,1]);
  const ax=D.bones.map((d,i)=>{let c=kids[i].find(k=>/middle_01|^calf|^lowerarm|^hand_|^foot|^ball|^spine|^neck|^Head|^upperarm/.test(D.bones[k].n));if(c===undefined)c=kids[i][0];
    const v=c!==undefined?o0[c].clone().sub(o0[i]):(d.p>=0?o0[i].clone().sub(o0[d.p]):new T.Vector3(0,1,0));return v.lengthSq()>1e-10?v.normalize():new T.Vector3(0,1,0);});
  bones.forEach((b,i)=>{if(i>1)b.position.multiplyScalar(PR[i][0]);});top.updateMatrixWorld(true);const o1=wp();
  const pos=new Float32Array(pos0.length),v=new T.Vector3(),dd=new T.Vector3();
  for(let i=0;i<nv;i++){let x=0,y=0,z=0,ws=0;v.fromArray(pos0,i*3);for(let k=0;k<4;k++){const w=W[i*4+k];if(!w)continue;const j=J[i*4+k],P=PR[j],a=ax[j];
      dd.copy(v).sub(o0[j]);const al=dd.dot(a);dd.addScaledVector(a,-al).multiplyScalar(P[2]).addScaledVector(a,al*P[1]).add(o1[j]);x+=dd.x*w;y+=dd.y*w;z+=dd.z*w;ws+=w;}
    pos[i*3]=x/ws;pos[i*3+1]=y/ws;pos[i*3+2]=z/ws;}
  // feet back on the ground: lower the pelvis by what the legs lost
  let minY=1e9;for(let i=1;i<pos.length;i+=3)minY=Math.min(minY,pos[i]);
  const pw0=o1[1].y,pw=o1[1].clone();pw.y-=minY;bones[0].worldToLocal(pw);bones[1].position.copy(pw);for(let i=1;i<pos.length;i+=3)pos[i]-=minY;top.updateMatrixWorld(true);
  const hipK=(pw0-minY)/o0[1].y,ibm=bones.map(b=>b.matrixWorld.clone().invert());
  const defs=D.bones.map((d,i)=>({n:d.n,p:d.p,t:bones[i].position.toArray(),r:d.r,s:d.s}));
  // --- outfit zones, decided on the original T-pose: 0 skin, 1 shirt, 2 sleeve, 3 trousers, 4 wraps, 5 shoe, 6 hand
  const zone=(x,y,z)=>{const a=Math.abs(x);if(y>1.27&&a>0.2)return a>0.72?6:(a<0.53?2:0);if(y>1.5&&a<0.12)return 0;if(y>=0.88&&!(a<0.075&&y<0.94))return 1;if(y>=0.33)return 3;if(y>=0.115)return 4;return 5;};
  const vz=new Uint8Array(nv);for(let i=0;i<nv;i++)vz[i]=zone(pos0[i*3],pos0[i*3+1],pos0[i*3+2]);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(Array.from(J),4));
  geo.setAttribute('skinWeight',new T.BufferAttribute(W,4));geo.setIndex(new T.BufferAttribute(idx,1));
  // normals averaged over vertices that share a position (UV seams), so the cloth can be puffed up without cracks
  const smoothN=g=>{g.computeVertexNormals();const P=g.attributes.position.array,nA=g.attributes.normal.array,km=new Map(),n=P.length/3;
    for(let i=0;i<n;i++){const k=Math.round(P[i*3]*2000)+','+Math.round(P[i*3+1]*2000)+','+Math.round(P[i*3+2]*2000);let e=km.get(k);if(!e)km.set(k,e=[]);e.push(i);}
    km.forEach(e=>{if(e.length<2)return;let x=0,y=0,z=0;for(const i of e){x+=nA[i*3];y+=nA[i*3+1];z+=nA[i*3+2];}const l=Math.hypot(x,y,z)||1;for(const i of e){nA[i*3]=x/l;nA[i*3+1]=y/l;nA[i*3+2]=z/l;}});g.attributes.normal.needsUpdate=true;};
  smoothN(geo);{const nA=geo.attributes.normal.array,PUFF=[0.008,0.026,0.024,0.026,0.026,0.022,0.008];for(let i=0;i<nv;i++){const k=PUFF[vz[i]];for(let j=0;j<3;j++)pos[i*3+j]+=nA[i*3+j]*k;}}
  smoothN(geo);
  // one colour per triangle so the outfit borders stay crisp
  const geoF=geo.toNonIndexed(),tp=new Uint8Array(idx.length);
  for(let t=0;t<idx.length;t+=3){let x=0,y=0,z=0;for(let j=0;j<3;j++){const i=idx[t+j];x+=pos0[i*3];y+=pos0[i*3+1];z+=pos0[i*3+2];}tp[t]=tp[t+1]=tp[t+2]=zone(x/3,y/3,z/3);}
  // the work vest: a second skin over the shirt, open at the front with a V neck
  const vIdx=[];for(let t=0;t<idx.length;t+=3){let x=0,y=0,z=0;for(let j=0;j<3;j++){const i=idx[t+j];x+=pos0[i*3];y+=pos0[i*3+1];z+=pos0[i*3+2];}x/=3;y/=3;z/=3;const a=Math.abs(x);
    if(zone(x,y,z)===1&&y>0.9&&y<1.5&&!(z>0&&a<0.016+(y>1.17?(y-1.17)*0.5:0)))vIdx.push(idx[t],idx[t+1],idx[t+2]);}
  const vp=new Float32Array(pos),nA=geo.attributes.normal.array;for(let i=0;i<nv;i++)for(let j=0;j<3;j++)vp[i*3+j]+=nA[i*3+j]*0.026;
  const vest=new T.BufferGeometry();vest.setAttribute('position',new T.BufferAttribute(vp,3));vest.setAttribute('skinIndex',geo.attributes.skinIndex);vest.setAttribute('skinWeight',geo.attributes.skinWeight);
  vest.setIndex(vIdx);vest.setAttribute('normal',new T.BufferAttribute(nA.slice(),3));
  // bounding box of the finished body over vertices picked on the original T-pose (to place belts, pockets and cuffs)
  const box=f=>{const b=new T.Box3();for(let i=0;i<nv;i++)if(f(pos0[i*3],pos0[i*3+1],pos0[i*3+2]))b.expandByPoint(v.fromArray(pos,i*3));return b;};
  return SKC.m={geo:geoF,part:tp,vest,ibm,bones:defs,hipK,box};}
let SKOL=null;function skOL(){return SKOL||(SKOL=new T.ShaderMaterial({side:T.BackSide,skinning:true,uniforms:{uW:OUT_W,uK:{value:0.6},uC:{value:OUTC}},
  vertexShader:'#include <common>\n#include <skinning_pars_vertex>\nuniform float uW;uniform float uK;void main(){\n#include <skinbase_vertex>\n#include <beginnormal_vertex>\n#include <skinnormal_vertex>\n#include <begin_vertex>\n#include <skinning_vertex>\nvec4 mv=modelViewMatrix*vec4(transformed,1.0);vec3 n=normalize(normalMatrix*objectNormal);mv.xyz+=n*uW*uK;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;void main(){gl_FragColor=vec4(uC,1.0);}'}));}
function makeSkBody(colors,vestCol){const B=skBase();if(!B)return null;const geo=B.geo.clone(),n=B.part.length,col=new Float32Array(n*3);
  for(let i=0;i<n;i++){const c=colors[B.part[i]];col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}geo.setAttribute('color',new T.BufferAttribute(col,3));
  const bones=B.bones.map(d=>{const b=new T.Bone();b.name=d.n;b.position.fromArray(d.t);b.quaternion.fromArray(d.r);b.scale.fromArray(d.s);return b;});
  B.bones.forEach((d,i)=>{if(d.p>=0)bones[d.p].add(bones[i]);});
  const mat=rimify(MAT({vertexColors:true,skinning:true}));mat.userData.pat=0;
  const mesh=new T.SkinnedMesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
  B.bones.forEach((d,i)=>{if(d.p<0)mesh.add(bones[i]);});mesh.bind(new T.Skeleton(bones,B.ibm),new T.Matrix4());
  const skin=(g,m,sh)=>{const s=new T.SkinnedMesh(g,m);s.frustumCulled=false;s.castShadow=!!sh;s.receiveShadow=!!sh;s.bind(mesh.skeleton,mesh.bindMatrix);mesh.add(s);return s;};
  if(ST.ol)skin(geo,skOL());
  if(vestCol){const vm=rimify(MAT({color:C(vestCol),skinning:true,side:T.DoubleSide}));vm.userData.pat=0;skin(B.vest,vm,true);if(ST.ol)skin(B.vest,skOL());}
  const by={};bones.forEach(b=>by[b.name]=b);const upper=bones.map(b=>/^(spine|neck|Head|clavicle|upperarm|lowerarm|hand|thumb|index|middle|ring|pinky)/.test(b.name));
  return {mesh,bones,by,rest:B.bones,upper,hipK:B.hipK,B};}
// an attachment point on a bone that starts upright in model space (so code-built parts keep their usual orientation)
function boneAnchor(sk,name,pos){const b=sk.by[name];sk.mesh.updateMatrixWorld(true);const bw=b.matrixWorld.clone();
  const tgt=new T.Matrix4().makeTranslation(...(pos||[bw.elements[12],bw.elements[13],bw.elements[14]]));
  const loc=bw.invert().multiply(tgt);const a=new T.Object3D();loc.decompose(a.position,a.quaternion,a.scale);b.add(a);return a;}
function skClip(k){if(SKA[k])return SKA[k];const D=typeof HERO_DATA!=='undefined'&&HERO_DATA.anims[k];if(!D)return null;
  const tr=D.tr.map(([bi,n,b])=>({bi,n,q:Float32Array.from(d64(b,Int16Array),v=>v/32767)}));const pos=D.pos?Float32Array.from(d64(D.pos,Int16Array),v=>v/16383):null;
  return SKA[k]={fps:D.fps,n:D.n,loop:D.loop,dur:D.loop?D.n/D.fps:(D.n-1)/D.fps,tr,pos};}
function skSample(sk,c,t,out){let f=t*c.fps;if(c.loop){f%=c.n;if(f<0)f+=c.n;}else f=clamp(f,0,c.n-1);const i0=Math.floor(f),i1=c.loop?(i0+1)%c.n:Math.min(c.n-1,i0+1),k=f-i0;
  for(let b=0;b<SK_NB;b++){const r=sk.rest[b].r;out[b*4]=r[0];out[b*4+1]=r[1];out[b*4+2]=r[2];out[b*4+3]=r[3];}
  for(const T_ of c.tr){const o=T_.bi*4,q=T_.q;if(T_.n===1){for(let j=0;j<4;j++)out[o+j]=q[j];continue;}const a=i0*4,bb=i1*4;let d=0;for(let j=0;j<4;j++)d+=q[a+j]*q[bb+j];const sg=d<0?-1:1;for(let j=0;j<4;j++)out[o+j]=q[a+j]*(1-k)+q[bb+j]*sg*k;}
  const P0=SK_NB*4,pv=sk.rest[1].t;if(c.pos){const a=i0*3,bb=i1*3,hk=sk.hipK||1;for(let j=0;j<3;j++)out[P0+j]=(c.pos[a+j]*(1-k)+c.pos[bb+j]*k)*hk;}else{out[P0]=pv[0];out[P0+1]=pv[1];out[P0+2]=pv[2];}return out;}
function skBlend(sk,a,b,k,upper){if(k<=0)return;for(let i=0;i<SK_NB;i++){if(upper&&!sk.upper[i])continue;const kk=upper&&/^spine|^neck/.test(sk.bones[i].name)?k*0.5:k;const o=i*4;let d=0;for(let j=0;j<4;j++)d+=a[o+j]*b[o+j];const sg=d<0?-1:1;for(let j=0;j<4;j++)a[o+j]=a[o+j]*(1-kk)+b[o+j]*sg*kk;}
  if(!upper){const P0=SK_NB*4;for(let j=0;j<3;j++)a[P0+j]=a[P0+j]*(1-k)+b[P0+j]*k;}}
function skApply(sk,p){for(let i=0;i<SK_NB;i++){const o=i*4,l=Math.hypot(p[o],p[o+1],p[o+2],p[o+3])||1;sk.bones[i].quaternion.set(p[o]/l,p[o+1]/l,p[o+2]/l,p[o+3]/l);}const P0=SK_NB*4;sk.bones[1].position.set(p[P0],p[P0+1],p[P0+2]);}
function skPose(H,t,walk,ph){const sk=H.sk,base=walk?'walk':(H.idleK||'idle'),c=skClip(base)||skClip('idle');const L=SK_NB*4+3;
  const dt=Math.max(0,Math.min(0.1,t-(H._t===undefined?t:H._t)));H._t=t;const P=H._pose||(H._pose=new Float32Array(L)),Tm=H._tmp||(H._tmp=new Float32Array(L));
  skSample(sk,c,walk?(((ph/(2*Math.PI))%1+1)%1)*c.dur:t,P);
  if(H._base!==base){if(H._last){H._from=H._from||new Float32Array(L);H._from.set(H._last);H._fade=1;}H._base=base;}
  if(H._fade>0){H._fade=Math.max(0,H._fade-dt/0.22);Tm.set(H._from);skBlend(sk,Tm,P,1-H._fade,false);P.set(Tm);}
  let tool=base==='fix';
  if(H.one){const oc=skClip(H.one.k),el=(t-H.one.t0)*H.one.sp;if(!oc||el>=oc.dur)H.one=null;else{skSample(sk,oc,el,Tm);const w=Math.min(1,el/0.06,(oc.dur-el)/0.1);skBlend(sk,P,Tm,w,H.one.k!=='yes');if(H.one.k==='smash')tool=true;}}
  toolInHand(H,tool);H._last=H._last||new Float32Array(L);H._last.set(P);skApply(sk,P);}
// ---- head v4: rounder skull with a broader jaw, sculpted nose and ears, swept-up quiff, brass goggles pushed up on the forehead
const HD_R=0.34,HD_C=0.3;
function hdShape(g,R){const p=g.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const t=v.y/R;
    v.x*=1+0.07*Math.max(0,1-((t+0.3)/0.9)**2);v.z*=v.z>0?0.92:0.97;if(t<-0.45)v.z+=0.04*R*(-t-0.45);v.y*=0.98;p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;}
function buildHead4(H,gear,head,neck){H.head=head;const R=HD_R,CL=new T.SphereGeometry(1,14,10);
  const clump=(col,x,y,z,sx,sy,sz,rx,ry,rz,ol)=>{const m=mk(CL,col,head,{p:[x,y,z],r:[rx||0,ry||0,rz||0],ol:ol===undefined?0.008:ol});m.scale.set(sx,sy,sz);return m;};
  {const hm=mk(hdShape(new T.SphereGeometry(R,28,20),R),SKIN,head,{p:[0,HD_C,0],ol:0.016});hm.receiveShadow=false;}
  for(const s of [-1,1]){const e=mk(sph(0.07,14,10),SKIN,head,{p:[s*0.352,HD_C-0.01,-0.03],r:[0,s*0.35,0],ol:0.008});e.scale.set(0.42,0.85,0.7);
    const ei=mk(sph(0.04,10,8),'#d99a78',head,{p:[s*0.366,HD_C-0.01,-0.022],r:[0,s*0.35,0],ol:0});ei.scale.set(0.3,0.7,0.55);}
  {const n=mk(sph(0.052,14,10),'#efb08e',head,{p:[0,HD_C-0.035,R*0.915],ol:0.006});n.scale.set(0.95,0.78,0.85);}
  const fg=hdShape(new T.SphereGeometry(R*1.006,30,22,Math.PI/2-0.95,1.9,Math.PI/2-0.75,1.48),R*1.006);
  H.faceMat=MAT({map:H.F.idle,transparent:true,depthWrite:false});const face=new T.Mesh(fg,H.faceMat);face.position.y=HD_C;face.renderOrder=2;head.add(face);
  // hair: a cap tilted back (high hairline in front, down to the nape behind) and a swept-up quiff of big clumps
  const HC=HV4.hair,HH=HV4.hairHi;
  {const cg=hdShape(new T.SphereGeometry(R*1.045,28,14,0,Math.PI*2,0,Math.PI*0.52),R*1.045);mk(cg,HC,head,{p:[0,HD_C+0.004,-0.01],r:[-0.48,0,0],ol:0.012});}
  // tapered locks swept up and back behind the goggles, a short fringe under them, short at the nape
  const LK=lathe([[0,0],[0.42,0.06],[0.6,0.3],[0.52,0.62],[0.28,0.88],[0,1.04]],14);
  const lock=(col,x,y,z,w,l,d,rx,rz,ry)=>{const g=cgrp(head,[x,HD_C+y,z],[rx,ry||0,rz]);const m=mk(LK,col,g,{ol:0.008});m.scale.set(w,l,d);return m;};
  lock(HC,-0.12,0.25,0.12,0.13,0.26,0.1,-0.85,0.4);lock(HH,0.01,0.28,0.12,0.14,0.3,0.1,-0.9,0.05);lock(HC,0.13,0.25,0.11,0.13,0.26,0.1,-0.85,-0.4);
  lock(HC,-0.07,0.31,-0.05,0.13,0.24,0.1,-1.35,0.25);lock(HH,0.08,0.31,-0.06,0.13,0.24,0.1,-1.35,-0.25);
  lock(HC,-0.23,0.2,0.02,0.11,0.2,0.09,-1.0,0.9);lock(HC,0.23,0.2,0.02,0.11,0.2,0.09,-1.0,-0.9);
  for(const s of [-1,1])lock(HC,s*0.33,0.16,0.06,0.04,0.11,0.045,Math.PI,s*0.1);
  // goggles: a leather strap hugging the head on a tilted plane and two brass cups with amber lenses pushed up on the forehead
  mk(tor(0.31,0.022,8,48),'#8a5a34',head,{p:[0,HD_C+0.2,-0.057],r:[1.292,0,0],ol:0.006});
  const gg=cgrp(head,[0,HD_C+0.3,0.235],[-0.9,0,0]);
  for(const s of [-1,1]){mk(cyl(0.088,0.096,0.075,22),HV4.brass,gg,{p:[s*0.102,0,0],r:[Math.PI/2,0,0],ol:0.008});
    mk(cyl(0.068,0.068,0.02,22),TM(HV4.lens,{emissive:'#ff9a2a',emissiveIntensity:0.35}),gg,{p:[s*0.102,0,0.036],r:[Math.PI/2,0,0],ol:0});
    mk(sph(0.019,8,6),'#fff4dc',gg,{p:[s*0.102+0.024,0.025,0.046],ol:0});}
  mk(rbox(0.06,0.032,0.05,0.012),HV4.brass,gg,{p:[0,0.004,-0.006],ol:0.006});
  if(gear.neck==='scarf'&&neck){mk(tor(0.15,0.065,10,24),'#e6cfa0',neck,{p:[0,0.0,0.01],r:[Math.PI/2,0,0],ol:0.012});}}
// face v4: big eyes with a thick upper lash line, heavy brows, a confident lopsided smile
function heroFace4(expr){return faceTex((g,w,h)=>{
  const ex=[w*0.335,w*0.665],ey=h*0.5,ink=INK;g.lineCap='round';g.lineJoin='round';
  g.fillStyle='rgba(232,118,100,0.26)';g.beginPath();g.ellipse(w*0.2,h*0.67,24,13,0,0,6.283);g.ellipse(w*0.8,h*0.67,24,13,0,0,6.283);g.fill();
  const brow=(dy,tilt,arch)=>{g.fillStyle='#3a2316';for(const [i,x] of ex.entries()){const s=i?1:-1;g.beginPath();
      g.moveTo(x-s*24,ey-44+dy+tilt);g.quadraticCurveTo(x,ey-62+dy-(arch||0),x+s*27,ey-50+dy-tilt*0.4);g.quadraticCurveTo(x+s*2,ey-50+dy-(arch||0)*0.6,x-s*24,ey-36+dy+tilt);g.fill();}};
  const eye=(x,lx,ly,lid)=>{g.save();g.beginPath();g.ellipse(x,ey,31,38,0,0,6.283);g.fillStyle='#fdf8f0';g.fill();g.clip();
    g.fillStyle='#4e2f1c';g.beginPath();g.ellipse(x+lx,ey+5+ly,21,26,0,0,6.283);g.fill();g.fillStyle='#7a4b2a';g.beginPath();g.ellipse(x+lx,ey+12+ly,15,15,0,0,6.283);g.fill();
    g.fillStyle=ink;g.beginPath();g.ellipse(x+lx,ey+5+ly,10,13,0,0,6.283);g.fill();
    if(lid){g.fillStyle=SKIN;g.fillRect(x-40,ey-50,80,50*lid+12);}
    g.restore();g.fillStyle='#fff';g.beginPath();g.arc(x+lx+9,ey-7+ly+(lid?16:0),7,0,6.283);g.fill();g.beginPath();g.arc(x+lx-7,ey+15+ly,3.5,0,6.283);g.fill();
    g.strokeStyle=ink;g.lineWidth=3.5;g.beginPath();g.ellipse(x,ey,31,38,0,Math.PI*0.15,Math.PI*0.85);g.stroke();
    const s=x<w/2?-1:1,ly2=lid?ey-38+76*lid*0.5:ey-38;g.lineWidth=8;g.beginPath();
    if(lid){g.moveTo(x-32,ly2+6);g.lineTo(x+32,ly2+6);}else g.ellipse(x,ey,31,38,0,Math.PI*1.08,Math.PI*1.92);g.stroke();
    g.lineWidth=6;g.beginPath();g.moveTo(x+s*27,(lid?ly2+6:ey-20));g.lineTo(x+s*38,(lid?ly2:ey-28));g.stroke();};
  const smile=()=>{g.strokeStyle=ink;g.lineWidth=6.5;g.beginPath();g.moveTo(w/2-20,h*0.75);g.quadraticCurveTo(w/2+2,h*0.81,w/2+22,h*0.72);g.stroke();g.lineWidth=4;g.beginPath();g.moveTo(w/2+20,h*0.705);g.lineTo(w/2+26,h*0.73);g.stroke();};
  if(expr==='idle'||expr==='look'){const lx=expr==='look'?7:0;for(const x of ex)eye(x,lx,0,0);brow(0,1,3);smile();}
  if(expr==='blink'){g.strokeStyle=ink;g.lineWidth=7;for(const x of ex){g.beginPath();g.moveTo(x-28,ey+2);g.quadraticCurveTo(x,ey+16,x+28,ey+2);g.stroke();const s=x<w/2?-1:1;g.lineWidth=5;g.beginPath();g.moveTo(x+s*27,ey+3);g.lineTo(x+s*37,ey-4);g.stroke();g.lineWidth=7;}brow(6,4,0);smile();}
  if(expr==='happy'){g.strokeStyle=ink;g.lineWidth=8;for(const x of ex){g.beginPath();g.moveTo(x-26,ey+10);g.quadraticCurveTo(x,ey-22,x+26,ey+10);g.stroke();}brow(-8,0,6);
    g.fillStyle=ink;g.beginPath();g.moveTo(w/2-26,h*0.68);g.quadraticCurveTo(w/2,h*0.68+44,w/2+26,h*0.68);g.closePath();g.fill();g.fillStyle='#fff';g.fillRect(w/2-17,h*0.68+1,34,7);g.fillStyle='#d9675e';g.beginPath();g.ellipse(w/2,h*0.68+22,11,7,0,0,6.283);g.fill();}
  if(expr==='tired'){for(const x of ex)eye(x,0,4,0.62);brow(4,-9,0);g.strokeStyle=ink;g.lineWidth=6;g.beginPath();g.moveTo(w/2-16,h*0.77);g.quadraticCurveTo(w/2-6,h*0.73,w/2,h*0.77);g.quadraticCurveTo(w/2+6,h*0.81,w/2+16,h*0.77);g.stroke();
    g.fillStyle='#8fd0e0';g.beginPath();g.moveTo(w*0.88,h*0.28);g.quadraticCurveTo(w*0.92,h*0.4,w*0.88,h*0.44);g.quadraticCurveTo(w*0.84,h*0.4,w*0.88,h*0.28);g.fill();}
  if(expr==='ko'){g.strokeStyle=ink;g.lineWidth=8;for(const x of ex){g.beginPath();g.moveTo(x-16,ey-16);g.lineTo(x+16,ey+16);g.moveTo(x+16,ey-16);g.lineTo(x-16,ey+16);g.stroke();}brow(0,-4,0);g.lineWidth=6;g.beginPath();g.ellipse(w/2,h*0.77,10,7,0,0,6.283);g.stroke();}
},300,230);}
function makeHeroSk(gear){const boots=gear.feet==='boots',glov=gear.hands==='gloves';
  const LH=!!ST.sunink,pal=(LH?[HH.skin,HH.shirt,HH.shirt,HH.pants,boots?HH.boot:HH.wraps,boots?HH.boot:HH.shoe,glov?HH.glove:HH.skin]:[SKIN,HV4.shirt,HV4.shirt,HV4.pants,boots?HV4.boot:HV4.wraps,boots?HV4.boot:HV4.shoe,glov?LEATHER:SKIN]).map(c=>C(c));
  const sk=makeSkBody(pal,LH?HH.vest:HV4.vest);if(!sk)return null;const B=sk.B,V3=()=>new T.Vector3();
  if(!HF4.idle)['idle','blink','happy','tired','ko','look'].forEach(e=>{HF4[e]=heroFace4(e);});if(LH&&!HFH.idle)['idle','blink','happy','tired','ko','look'].forEach(e=>{HFH[e]=heroFaceH(e);});
  const H={sk};const root=cgrp();H.root=root;H.F=LH?HFH:HF4;root.add(sk.mesh);
  // stand-ins for the old joint groups (some effects still nudge them); they are not drawn
  const dummy=()=>new T.Object3D();H.hips=dummy();H.spine=dummy();H.chest=dummy();H.neck=dummy();H.sh=[dummy(),dummy()];H.el=[dummy(),dummy()];H.leg=[dummy(),dummy()];H.knee=[dummy(),dummy()];H.foot=[dummy(),dummy()];
  const neckA=boneAnchor(sk,'neck_01'),headA=boneAnchor(sk,'Head');const head=cgrp(headA,[0,-0.09,0.03]);(LH?buildHeadH:buildHead4)(H,gear,head,neckA);
  H.hand=[boneAnchor(sk,'hand_r'),boneAnchor(sk,'hand_l')];
  // belt with a brass buckle and a pouch
  const wb=B.box((x,y)=>y>0.905&&y<0.975&&Math.abs(x)<0.2),wc=wb.getCenter(V3()),ws=wb.getSize(V3());
  const pelA=boneAnchor(sk,'pelvis',[wc.x,wc.y,wc.z]);{const band=mk(cyl(1,1,0.075,30),LH?HH.belt:HV4.belt,pelA,{ol:0.008});band.scale.set(ws.x/2+0.014,1,ws.z/2+0.014);}
  if(!LH){mk(rbox(0.11,0.09,0.03,0.016),HV4.buckle,pelA,{p:[0,0,ws.z/2+0.024],ol:0.006});mk(rbox(0.06,0.045,0.02,0.01),HV4.belt,pelA,{p:[0,0,ws.z/2+0.034],ol:0});
  {const pu=cgrp(pelA,[ws.x/2*0.82,-0.08,ws.z/2*0.45],[0,0.7,0]);mk(rbox(0.12,0.13,0.07,0.025),HV4.strap,pu,{ol:0.008});mk(rbox(0.125,0.05,0.075,0.02),'#5c4030',pu,{p:[0,0.05,0.004],ol:0.006});mk(sph(0.012,8,6),HV4.brass,pu,{p:[0,0.035,0.04],ol:0});}}
  // vest chest pockets
  const cb=B.box((x,y,z)=>y>1.24&&y<1.32&&z>0&&Math.abs(x)<0.14),cc=cb.getCenter(V3());
  const chA=boneAnchor(sk,'spine_03',[0,cc.y,0]);
  if(!LH)for(const s of [-1,1]){const pk=cgrp(chA,[s*0.1,-0.02,cb.max.z+0.03],[0,s*0.3,0]);mk(rbox(0.1,0.09,0.024,0.012),HV4.vestD,pk,{ol:0.006});mk(rbox(0.106,0.035,0.03,0.012),HV4.vest,pk,{p:[0,0.04,0.004],ol:0.006});mk(sph(0.011,8,6),HV4.brass,pk,{p:[0,0.03,0.02],ol:0});}
  // backpack hangs off the upper back
  const bb=B.box((x,y,z)=>y>1.2&&y<1.4&&z<0&&Math.abs(x)<0.14);
  const backA=boneAnchor(sk,'spine_03',[0,bb.getCenter(V3()).y,bb.min.z-0.026+0.26]);if(gear.back){if(LH)buildBackH(backA,gear.back,H);else buildBack(backA,gear.back,H,false);}
  // rolled-up sleeves, cargo pockets, glove cuffs and boot tops
  if(!LH)for(const s of [-1,1]){const side=s>0?'l':'r';
    const rb=B.box((x,y)=>y>1.27&&s*x>0.51&&s*x<0.55),rc=rb.getCenter(V3()),rs=rb.getSize(V3());
    const ra=boneAnchor(sk,'lowerarm_'+side,[rc.x,rc.y,rc.z]);mk(tor(Math.max(rs.y,rs.z)/2+0.006,0.034,8,22),HV4.shirt,ra,{r:[0,Math.PI/2,0],ol:0.008});
    if(glov){const gb=B.box((x,y)=>y>1.27&&s*x>0.71&&s*x<0.735),gc=gb.getCenter(V3()),gs=gb.getSize(V3());const ga=boneAnchor(sk,'hand_'+side,[gc.x,gc.y,gc.z]);mk(tor(Math.max(gs.y,gs.z)/2+0.008,0.03,8,20),'#6e4426',ga,{r:[0,Math.PI/2,0],ol:0.006});}
    const tb=B.box((x,y)=>y>0.5&&y<0.68&&s*x>0.03),tc=tb.getCenter(V3());const sx=s>0?tb.max.x:tb.min.x;
    const ta=boneAnchor(sk,'thigh_'+side,[sx,tc.y,tc.z+0.01]);mk(rbox(0.035,0.13,0.12,0.015),HV4.pantsD,ta,{p:[s*0.004,0,0],ol:0.006});mk(rbox(0.04,0.04,0.125,0.014),HV4.pants,ta,{p:[s*0.006,0.055,0],ol:0.006});
    const kb=B.box((x,y)=>y>0.29&&y<0.34&&s*x>0.03),kc=kb.getCenter(V3()),ks=kb.getSize(V3());const ka=boneAnchor(sk,'calf_'+side,[kc.x,kc.y,kc.z]);
    if(boots){mk(tor(Math.max(ks.x,ks.z)/2+0.01,0.035,8,22),'#5c3a22',ka,{r:[Math.PI/2,0,0],ol:0.008});}
    else mk(tor(Math.max(ks.x,ks.z)/2,0.022,6,20),HV4.wraps,ka,{r:[Math.PI/2,0,0],ol:0.006});
  }
  if(gear.tool==='hammer'){H.hammer=addHammer(pelA,[-(ws.x/2+0.05),-0.04,0.03],[0.15,0,0.25],0.9);H.hammerPar=pelA;H.hammerP=H.hammer.position.clone();H.hammerR=H.hammer.rotation.clone();}
  if(ST.chunky){head.scale.setScalar(LH?1.34:1.22);root.scale.setScalar(LH?1.2:1.06);blobShadow(root,0.62);}
  skPose(H,0,false,0);return H;}
function makeHero(gear){if(typeof HERO_DATA!=='undefined'&&!window.OLDHERO){const h=makeHeroSk(gear);if(h)return h;}
  // v3 (Robin 20. 11.): clean tapered limbs without swollen joints, chunky sculpted hair clumps, a real backpack
  const SX=(SV&&SV.sex)==='f'?'f':'m',V=HVAR[SX],FEM=SX==='f';
  const H={};const root=cgrp();H.root=root;H.F=FEM?HFF:HF;
  const hips=cgrp(root,[0,0.9,0]);H.hips=hips;
  const CL=new T.SphereGeometry(1,12,9);
  const clump=(par,col,x,y,z,sx,sy,sz,rx,ry,rz)=>{const m=mk(CL,col,par,{p:[x,y,z],r:[rx||0,ry||0,rz||0],ol:0.008});m.scale.set(sx,sy,sz);return m;};
  // legs: pants to below the knee, wrapped shins, sandals
  H.leg=[];H.knee=[];H.foot=[];
  for(const s of [-1,1]){const lp=cgrp(hips,[s*0.12,-0.02,0]);mk(caps(0.135,0.115,0.44),V.pants,lp);
    const kn=cgrp(lp,[0,-0.42,0]);mk(caps(0.115,0.086,0.2),V.pants,kn);
    mk(caps(0.084,0.07,0.27),WRAP,kn,{p:[0,-0.13,0],ol:0.008});for(const y of [-0.22,-0.31])mk(tor(0.079,0.01,5,16),'#cdbf9f',kn,{p:[0,y,0],r:[Math.PI/2+0.15,0,0],ol:0});
    const ft=cgrp(kn,[0,-0.42,0]);
    if(gear.feet==='boots'){mk(rbox(0.17,0.2,0.27,0.07),'#7a4e2e',ft,{p:[0,0.0,0.04]});mk(rbox(0.18,0.05,0.29,0.025),'#4e3220',ft,{p:[0,-0.09,0.05],ol:0.008});}
    else{mk(rbox(0.15,0.04,0.27,0.02),V.shoe,ft,{p:[0,-0.09,0.05]});mk(rbox(0.12,0.06,0.23,0.03),SKIN,ft,{p:[0,-0.05,0.05],ol:0.006});
      mk(rbox(0.16,0.03,0.05,0.012),V.shoe,ft,{p:[0,-0.03,0.1],ol:0.004});mk(rbox(0.16,0.03,0.05,0.012),V.shoe,ft,{p:[0,-0.02,-0.03],ol:0.004});}
    H.leg.push(lp);H.knee.push(kn);H.foot.push(ft);}
  // torso: tunic with a flared hem, belt with a square buckle
  const spine=cgrp(hips,[0,0,0]);H.spine=spine;
  const waist=FEM?0.26:0.28;
  mk(lathe([[0.001,-0.1],[0.34,-0.1],[0.33,0.0],[waist+0.02,0.14],[waist,0.3],[0.29,0.47],[0.27,0.58],[0.15,0.66],[0.001,0.67]],24),V.tunic,spine);
  mk(cyl(waist+0.025,waist+0.03,0.09,24),V.belt,spine,{p:[0,0.13,0],ol:0.008});
  mk(rbox(0.13,0.11,0.03,0.02),V.buckle,spine,{p:[0,0.13,waist+0.03],ol:0.006});mk(rbox(0.07,0.045,0.035,0.01),V.belt,spine,{p:[0,0.13,waist+0.035],ol:0});
  mk(rbox(0.18,0.04,0.035,0.016),V.tunic2,spine,{p:[0,0.6,0.21],r:[0.45,0,0],ol:0.006});
  const chest=cgrp(spine,[0,0.45,0]);H.chest=chest;
  // arms: sleeve tapers from the shoulder, bell sleeve at the forearm, mitten hands
  H.sh=[];H.el=[];H.hand=[];
  for(const s of [-1,1]){const sh=cgrp(chest,[s*0.29,0.12,0]);mk(sph(0.098),FEM?V.tunic:V.sleeve,sh,{ol:0.008});mk(caps(0.095,0.075,0.3),V.sleeve,sh);
    if(FEM)mk(cyl(0.104,0.124,0.15,14),V.tunic,sh,{p:[0,-0.07,0],ol:0.008});
    const el=cgrp(sh,[0,-0.29,0]);mk(caps(0.062,0.052,0.25),SKIN,el,{p:[0,-0.01,0]});mk(cyl(0.078,0.112,0.17,14),V.sleeve,el,{p:[0,-0.07,0],ol:0.008});
    const hd=cgrp(el,[0,-0.28,0]);
    if(gear.hands==='gloves'){mk(rbox(0.095,0.12,0.07,0.032),LEATHER,hd,{p:[0,-0.02,0]});mk(cyl(0.062,0.062,0.04,12),'#6e4426',hd,{p:[0,0.05,0],ol:0.006});mk(caps(0.028,0.024,0.07),LEATHER,hd,{p:[s*-0.045,0.02,0.03],r:[0.2,0,s*0.6],ol:0.006});}
    else{mk(rbox(0.085,0.11,0.065,0.03),SKIN,hd,{p:[0,-0.02,0]});mk(caps(0.025,0.021,0.065),SKIN,hd,{p:[s*-0.04,0.02,0.03],r:[0.2,0,s*0.6],ol:0.006});}
    sh.rotation.z=s*0.08;H.sh.push(sh);H.el.push(el);H.hand.push(hd);}
  // neck & head
  const neck=cgrp(chest,[0,0.2,0]);H.neck=neck;mk(cyl(0.065,0.075,0.12,12),SKIN,neck,{p:[0,0.04,0]});
  const head=cgrp(neck,[0,0.1,0]);buildHeroHead(H,gear,V,FEM,head,neck);
  if(gear.body==='poncho'){mk(lathe([[0.58,0.2],[0.56,0.24],[0.42,0.48],[0.18,0.7],[0.001,0.72]],28),'#c25f3a',spine);
    for(let i=0;i<14;i++){const a=i/14*Math.PI*2;mk(rbox(0.06,0.08,0.03,0.012),'#efe2c4',spine,{p:[Math.cos(a)*0.57,0.17,Math.sin(a)*0.57],r:[0,-a+Math.PI/2,0],ol:0.006});}
    mk(tor(0.48,0.025,6,32),'#efe2c4',spine,{p:[0,0.33,0],r:[Math.PI/2,0,0],ol:0.006});}
  if(gear.body==='cloak'){const cl=cgrp(chest,[0,0.2,-0.2]);H.cloak=cl;mk(rbox(0.66,1.16,0.05,0.025),'#7a3f2a',cl,{p:[0,-0.56,0]});mk(rbox(0.66,0.06,0.06,0.02),GOLD,cl,{p:[0,-1.12,0.0],ol:0.008});
    mk(tor(0.17,0.04,8,20),'#7a3f2a',neck,{p:[0,-0.04,0],r:[Math.PI/2,0,0],ol:0.01});mk(sph(0.05),GOLD,neck,{p:[0,-0.04,0.17],ol:0.006});}
  if(gear.back)buildBack(chest,gear.back,H,false);
  if(gear.tool==='hammer'){H.hammer=addHammer(spine,[-0.3,0.03,0.08],[0.15,0,0.25],0.9);H.hammerPar=spine;H.hammerP=H.hammer.position.clone();H.hammerR=H.hammer.rotation.clone();}
  if(ST.chunky){H.head.scale.setScalar(1.28);H.head.position.y+=0.03;for(const hd of H.hand)hd.scale.setScalar(1.25);for(const ft of H.foot)ft.scale.set(1.2,1.15,1.2);H.root.scale.setScalar(0.94);blobShadow(H.root,0.62);}
  return H;
}

// a real backpack: top flap with two buckle straps and two front pockets; bigger with each Backpack level, bedroll + lantern at the top level
function buildBack(chest,type,H,loose){
  const SZ={bundle:[0.4,0.42,0.2],satchel:[0.42,0.46,0.22],pack:[0.46,0.54,0.25]}[type]||[0.42,0.46,0.22];
  const [w,h,d]=SZ,CAN='#9c7a50',DK='#74552f',big=type==='pack';
  const pk=cgrp(chest,[0,-0.05,-0.29-d/2]);H.pack=pk;
  mk(rbox(w,h,d,0.06),CAN,pk);
  mk(rbox(w*1.03,0.07,d*1.06,0.03),DK,pk,{p:[0,h/2-0.01,0],ol:0.008});
  mk(rbox(w*0.88,h*0.34,0.03,0.02),DK,pk,{p:[0,h/2-h*0.17,-d/2-0.012],ol:0.006});
  for(const s of [-1,1]){mk(rbox(0.035,h*0.46,0.012,0.006),'#5a3d22',pk,{p:[s*w*0.22,h*0.12,-d/2-0.03],ol:0});mk(rbox(0.05,0.034,0.016,0.006),GOLD,pk,{p:[s*w*0.22,h*0.02,-d/2-0.034],ol:0});
    mk(rbox(w*0.38,h*0.3,0.07,0.025),'#8a6a44',pk,{p:[s*w*0.24,-h*0.24,-d/2-0.032],ol:0.006});mk(rbox(w*0.39,0.05,0.078,0.018),DK,pk,{p:[s*w*0.24,-h*0.1,-d/2-0.034],ol:0.004});}
  if(!loose)for(const s of [-1,1]){mk(tor(0.17,0.022,6,20,Math.PI*1.1),'#5a3d22',chest,{p:[s*0.16,0.06,-0.08],r:[0,Math.PI/2,Math.PI*0.95],ol:0.006});
    mk(rbox(0.045,0.3,0.02,0.01),'#5a3d22',chest,{p:[s*0.15,-0.06,0.265],r:[-0.12,0,0],ol:0});}
  if(big){mk(cyl(0.1,0.1,w*1.25,14),'#c9b48a',pk,{p:[0,h/2+0.1,0],r:[0,0,Math.PI/2]});for(const s of [-1,1])mk(tor(0.105,0.018,6,16),'#5a3d22',pk,{p:[s*0.16,h/2+0.1,0],r:[0,Math.PI/2,0],ol:0});
    const lan=cgrp(pk,[w/2+0.05,0.0,0]);H.lantern=lan;mk(cyl(0.012,0.012,0.12,6),'#4a3424',lan,{p:[0,0.06,0],ol:0});mk(cyl(0.07,0.07,0.04,12),'#4a3424',lan,{p:[0,-0.01,0],ol:0.006});
    mk(cyl(0.06,0.06,0.12,12),TM('#ffe2a0',{emissive:'#ffb84a',emissiveIntensity:0.9}),lan,{p:[0,-0.09,0],ol:0.006});mk(cyl(0.07,0.07,0.03,12),'#4a3424',lan,{p:[0,-0.16,0],ol:0.006});}
  return pk;
}
function addHammer(par,p,r,sc){const h=cgrp(par,p,r);h.scale.setScalar(sc||1);mk(cyl(0.022,0.026,0.42,10),'#8a5a34',h,{p:[0,-0.08,0],ol:0.006});
  mk(rbox(0.2,0.08,0.08,0.02),'#7d8590',h,{p:[0,0.14,0],ol:0.008});mk(rbox(0.05,0.085,0.085,0.015),'#5d6168',h,{p:[-0.11,0.14,0],ol:0.006});mk(cyl(0.03,0.03,0.05,10),'#4a3424',h,{p:[0,-0.27,0],ol:0.004});return h;}
function makeHammer(){const g=grp();const h=addHammer(g,[0,0.06,0],[Math.PI/2,0,0.3],4);return g;}

// ===================== WOLT (Blender model) =====================
let WOLT=null;
const ZURO_COL=[[/^(helmet_rear|ear_outer|chest_plate|stripe|boot_|pawb_|clamp)/,'#b8322b'],[/^ear_inner/,'#8a2420'],[/^(torso_rear|saddle|module$|module_cap|tail_stub)/,'#b8322b'],
  [/^(torso_front|belly|helmet_front|thigh_|upper_|paw_|kcap_|yoke)/,'#ebe6dc'],[/^(muzzle)/,'#e9dcc2'],[/^visor/,'#1c2654'],[/^(module_screen|module_mark)/,'#b8322b']];
function prepWolt(sc){const cache={};const ms=[];sc.traverse(o=>{if(o.isMesh)ms.push(o);});
  ms.forEach(o=>{const src=o.material;const nm=src.name||'';
    if(nm==='screen'){o.userData.screen=true;return;}
    if(!cache[nm]){let m;
      if(src.emissive&&src.emissive.getHex()&&src.emissiveIntensity>0){m=MAT({color:src.color.clone(),emissive:src.emissive.clone(),emissiveIntensity:0.9});m.userData.e0=0.9;EMIS.push(m);}
      else m=rimify(MAT({color:src.color.clone()}));
      cache[nm]=m;}
    o.material=cache[nm];o.castShadow=true;o.receiveShadow=false;
    {const hit=ZURO_COL.find(([re])=>re.test(o.name));if(hit){const k='z'+hit[1];cache[k]=cache[k]||rimify(MAT({color:C(hit[1])}));o.material=cache[k];}}
    if(/^(tail_fluff|muzzle)$/.test(o.name))o.visible=false;// cleaner face: no fluffy beard (Robin 20. 11.)
    if(ST.ol&&!/^(toe_|kcap_|slot_|antenna|hose_ring|neck_ring|bolt_|module_mark|jointcap)/.test(o.name)){const ol=new T.Mesh(o.geometry,OL(0.012));ol.castShadow=false;ol.receiveShadow=false;o.add(ol);}});
  return sc;}
(function loadWolt(){try{if(!window.WOLT_GLB||!T.GLTFLoader)return;const bin=Uint8Array.from(atob(window.WOLT_GLB),c=>c.charCodeAt(0));
  new T.GLTFLoader().parse(bin.buffer,'',g=>{WOLT=prepWolt(g.scene);setTimeout(refreshPortraits,0);if(BS.heroG&&scene!=='exp')rebuildBaseChars();if(scene==='exp'&&X&&X.dog&&!X.end){const old=X.dog;X.dog=makeDog(dogGear());X.dog.root.rotation.order='YXZ';X.scene.remove(old.root);X.scene.add(X.dog.root);}},e=>console.warn('wolt glb',e));}catch(e){console.warn(e);}})();
const WOLT_SCALE=1.28;
function makeDogGLB(dgear){const D={};const root=new T.Group();D.root=root;const m=WOLT.clone(true);m.scale.setScalar(WOLT_SCALE*(ST.sunink?1.1:1));root.add(m);
  const by=n=>m.getObjectByName(n);
  D.body=by('body');D.neck=by('neck');D.head=by('head');D.tail=by('tail');
  {const sn=new T.Mesh(rbox(0.3,0.17,0.2,0.07),rimify(MAT({color:C('#e9dcc2')})));sn.position.set(0,-0.005,0.205);sn.castShadow=true;D.head.add(sn);}
  {const sp=new T.Mesh(new T.ConeGeometry(0.055,0.26,5),rimify(MAT({color:C('#b8322b')})));sp.position.set(0,0.13,0);sp.castShadow=true;D.tail.add(sp);m.traverse(o=>{if(o.name==='tail_glow'||(o.isSprite))o.visible=false;});}D.tail2=new T.Object3D();D.by=D.body.position.y;D.bs=0.5;D.tx0=0.7;
  D.hip=[['hip_FL',0],['hip_FR',Math.PI],['hip_BL',Math.PI],['hip_BR',0]].map(([n,ph])=>({g:by(n),ph}));
  D.knee=['knee_FL','knee_FR','knee_BL','knee_BR'].map(by);
  D.ear=['ear_L','ear_R'].map(by);D.ear.forEach(e=>{e.userData.q0=e.quaternion.clone();});
  D.faceMat=new T.MeshBasicMaterial({map:DF.idle,side:T.DoubleSide});m.traverse(o=>{if(o.isMesh&&o.userData.screen)o.material=D.faceMat;});
  if(ST.chunky){D.head.scale.multiplyScalar(1.16);for(const k of D.knee)if(k)k.scale.multiplyScalar(1.06);blobShadow(root,0.75);}
  // gear that changes the look
  if(dgear.lamp){const l=cgrp(D.head,[0.0,0.37,0.03]);mk(cyl(0.05,0.045,0.06,14),'#4a3424',l,{r:[Math.PI/2,0,0]});mk(cyl(0.04,0.04,0.015,14),TM('#fff3c4',{emissive:'#ffe08a',emissiveIntensity:1.3}),l,{p:[0,0,0.035],r:[Math.PI/2,0,0],ol:0});}
  if(dgear.module==='solar'){const sp=cgrp(D.body,[0,0.155,-0.15],[0,0,0]);mk(rbox(0.26,0.03,0.22,0.012),'#3d4f74',sp,{ol:0.008});for(let i=-1;i<=1;i++)mk(rbox(0.004,0.032,0.2,0.002),'#7f9ad0',sp,{p:[i*0.065,0.001,0],ol:0});}
  if(dgear.bags){for(const s of [-1,1]){mk(rbox(0.08,0.15,0.22,0.035),LEATHER,D.body,{p:[s*0.19,-0.03,-0.1]});mk(rbox(0.085,0.045,0.225,0.02),'#7f4f2c',D.body,{p:[s*0.19,0.04,-0.1],ol:0.006});}}
  return D;}
function makeDog(dgear){if(WOLT)return makeDogGLB(dgear);
  const D={};const root=cgrp();D.root=root;
  const body=cgrp(root,[0,0.66,0]);D.body=body;
  mk(rbox(0.56,0.46,0.98,0.2),CREAM,body);
  mk(rbox(0.46,0.1,0.78,0.05),CREAM2,body,{p:[0,-0.21,0.02],ol:0.01});
  mk(rbox(0.575,0.475,0.09,0.2),ACC,body,{p:[0,0,-0.1],ol:0});
  mk(rbox(0.5,0.1,0.42,0.05),STEEL,body,{p:[0,0.22,-0.2],ol:0.008});mk(rbox(0.5,0.2,0.2,0.07),STEEL,body,{p:[0,0.12,0.42],ol:0.008});
  for(const s of [-1,1]){for(const z of [0.3])mk(cyl(0.03,0.03,0.02,12),'#7a6656',body,{p:[s*0.285,-0.02,z],r:[0,0,Math.PI/2],ol:0});}
  // legs
  D.hip=[];D.knee=[];const LP=[[-0.19,0.36,0],[0.19,0.36,Math.PI],[-0.19,-0.34,Math.PI],[0.19,-0.34,0]];
  for(const [x,z,ph] of LP){const hip=cgrp(body,[x,-0.16,z]);mk(sph(0.1),STEEL2,hip);mk(caps(0.095,0.085,0.25),CREAM,hip,{p:[0,-0.01,0]});
    const kn=cgrp(hip,[0,-0.24,0]);mk(sph(0.07),JOINT,kn);mk(caps(0.068,0.062,0.22),STEEL,kn);
    const pw=cgrp(kn,[0,-0.22,0.02]);
    if(dgear.paws==='boots'){mk(rbox(0.16,0.11,0.21,0.05),ACC,pw,{p:[0,-0.0,0.02]});mk(rbox(0.17,0.04,0.22,0.02),'#4a3424',pw,{p:[0,-0.05,0.02],ol:0.006});}
    else{mk(rbox(0.16,0.09,0.2,0.04),STEEL2,pw,{p:[0,-0.01,0.02]});for(const t of [-0.045,0,0.045])mk(sph(0.028),'#3a4450',pw,{p:[t,-0.02,0.12],ol:0});}
    D.hip.push({g:hip,ph});D.knee.push(kn);}
  // neck & head
  const neck=cgrp(body,[0,0.12,0.44]);D.neck=neck;mk(cyl(0.12,0.14,0.2,14),STEEL,neck,{p:[0,0.04,0]});mk(tor(0.13,0.025,6,18),JOINT,neck,{p:[0,0.12,0],r:[Math.PI/2,0,0],ol:0});
  const head=cgrp(neck,[0,0.24,0.12]);D.head=head;head.scale.setScalar(ST.chunky?1.36:1.18);
  mk(rbox(0.56,0.5,0.5,0.2),CREAM,head,{ol:0.016});
  mk(rbox(0.5,0.08,0.4,0.035),STEEL,head,{p:[0,0.24,-0.04],ol:0.008});
  mk(rbox(0.22,0.26,0.2,0.06),STEEL,head,{p:[-0.2,-0.02,-0.24],ol:0.01});mk(rbox(0.08,0.05,0.02,0.01),ACC,head,{p:[-0.2,0.02,-0.345],ol:0});
  mk(rbox(0.48,0.34,0.05,0.12),'#1d1a18',head,{p:[0,0.05,0.24],ol:0.01});
  D.faceMat=new T.MeshBasicMaterial({map:DF.idle,transparent:false});const fp=new T.Mesh(new T.PlaneGeometry(0.4,0.25),D.faceMat);fp.position.set(0,0.05,0.268);head.add(fp);
  // fluffy terrier muzzle
  for(const [x,y,z,r] of [[0,-0.15,0.24,0.13],[-0.11,-0.17,0.2,0.1],[0.11,-0.17,0.2,0.1],[0,-0.22,0.18,0.1],[-0.06,-0.1,0.3,0.075],[0.06,-0.1,0.3,0.075]])mk(sph(r),CREAM2,head,{p:[x,y,z],ol:0.008});
  mk(sph(0.05),'#2a2420',head,{p:[0,-0.08,0.37],ol:0});
  {const an=cgrp(head,[-0.18,0.27,0.0]);mk(cyl(0.01,0.01,0.28,6),'#3a3430',an,{p:[0,0.14,0],r:[0,0,0.15],ol:0});mk(sph(0.022),'#3a3430',an,{p:[-0.02,0.28,0],ol:0});}
  // ears
  D.ear=[];const es=new T.Shape();es.moveTo(-0.09,0);es.quadraticCurveTo(-0.07,0.2,0,0.27);es.quadraticCurveTo(0.07,0.2,0.09,0);es.closePath();
  const eg=new T.ExtrudeGeometry(es,{depth:0.04,bevelEnabled:true,bevelThickness:0.015,bevelSize:0.015,bevelSegments:3,curveSegments:10});eg.translate(0,0,-0.02);eg.computeVertexNormals();
  const ei=new T.ShapeGeometry(es);
  for(const s of [-1,1]){const ep=cgrp(head,[s*0.24,0.16,-0.04],s>0?[0.15,0,-2.55]:[0,0,0.4]);ep.scale.set(1.1,1.1,1.1);mk(eg,STEEL,ep,{ol:0.01});const inn=mk(ei,ACC,ep,{p:[0,0.03,0.04],ol:0});inn.scale.set(0.6,0.65,1);D.ear.push(ep);}
  // tail
  const tail=cgrp(body,[0,0.12,-0.48],[-0.7,0,0]);D.tail=tail;mk(caps(0.035,0.03,0.22),JOINT,tail,{r:[Math.PI,0,0]});const t2=cgrp(tail,[0,0.22,0],[0.35,0,0]);D.tail2=t2;mk(caps(0.03,0.026,0.18),JOINT,t2,{r:[Math.PI,0,0]});
  {const tm=TM('#fff3dc',{emissive:'#ffcf8a',emissiveIntensity:0.8});for(const [x,y,z,r] of [[0,0.22,0,0.1],[0.05,0.27,0.02,0.07],[-0.05,0.27,-0.02,0.07],[0,0.31,0,0.06]])mk(sph(r),tm,t2,{p:[x,y,z],ol:0.008});const tg=glowSprite('#ffd090',1.4);tg.userData.g0=0.6;tg.position.set(0,0.26,0);t2.add(tg);}
  // ===== items =====
  if(dgear.collar){mk(tor(0.17,0.045,8,28),'#c0432f',neck,{p:[0,0.0,0.06],r:[Math.PI/2-0.45,0,0],ol:0.012});const tg=cgrp(neck,[0,-0.1,0.24]);D.tag=tg;mk(cyl(0.05,0.05,0.015,16),GOLD,tg,{r:[Math.PI/2,0,0],ol:0.006});}
  if(dgear.lamp){mk(rbox(0.5,0.05,0.05,0.02),'#4a3424',head,{p:[0,0.14,0.0],ol:0.006});const l=cgrp(head,[0.0,0.26,0.12],[-0.3,0,0]);mk(cyl(0.07,0.06,0.09,16),'#4a3424',l,{r:[Math.PI/2,0,0]});
    mk(cyl(0.055,0.055,0.02,16),TM('#fff3c4',{emissive:'#ffe08a',emissiveIntensity:1.3}),l,{p:[0,0,0.05],r:[Math.PI/2,0,0],ol:0});}
  if(dgear.module==='antenna'){const a=cgrp(body,[-0.12,0.24,-0.28]);D.ant=a;mk(cyl(0.05,0.06,0.06,12),JOINT,a);mk(cyl(0.012,0.012,0.42,6),'#4a3424',a,{p:[0,0.24,0],ol:0.005});
    mk(sph(0.035),TM('#ff8a5c',{emissive:'#ff5a2a',emissiveIntensity:1}),a,{p:[0,0.46,0],ol:0.006});const dsh=cgrp(a,[0,0.28,0]);D.dish=dsh;mk(new T.SphereGeometry(0.12,16,8,0,Math.PI*2,0,Math.PI/2.4),TM('#b9bfc6',{side:T.DoubleSide}),dsh,{r:[-1.2,0,0],ol:0});mk(cyl(0.012,0.012,0.08,6),'#4a3424',dsh,{p:[0,-0.03,0.03],r:[-1.2,0,0],ol:0});}
  if(dgear.module==='solar'){const sp=cgrp(body,[0,0.27,-0.08],[0.08,0,0]);mk(rbox(0.46,0.05,0.5,0.02),'#3d4f74',sp,{ol:0.008});for(let i=-1;i<=1;i++)mk(rbox(0.005,0.052,0.48,0.002),'#7f9ad0',sp,{p:[i*0.115,0.002,0],ol:0});
    mk(rbox(0.44,0.052,0.005,0.002),'#7f9ad0',sp,{p:[0,0.002,0],ol:0});}
  if(dgear.bags){for(const s of [-1,1]){mk(rbox(0.15,0.26,0.4,0.06),LEATHER,body,{p:[s*0.34,-0.02,-0.06]});mk(rbox(0.155,0.08,0.41,0.03),'#7f4f2c',body,{p:[s*0.34,0.1,-0.06],ol:0.006});
    mk(rbox(0.03,0.05,0.04,0.01),GOLD,body,{p:[s*0.42,0.06,-0.06],ol:0.004});}mk(rbox(0.72,0.04,0.12,0.015),'#6e4426',body,{p:[0,0.21,-0.06],ol:0.006});}
  return D;
}


// ===== motion-capture animations (Quaternius Universal Animation Library, CC0 – retargeted by tools/retarget.py) =====
const ANIM={},AF=61;
function animClip(k){let c=ANIM[k];if(c)return c;const D=typeof ANIM_DATA!=='undefined'&&ANIM_DATA[k];if(!D)return null;const b=atob(D.d),a=new Float32Array(b.length);
  for(let i=0;i<b.length;i++){let v=b.charCodeAt(i);if(v>127)v-=256;a[i]=v/127;}c={fps:D.fps,n:D.n,loop:D.loop,a,dur:D.loop?D.n/D.fps:(D.n-1)/D.fps};ANIM[k]=c;return c;}
function sampleClip(c,t,out){let f=t*c.fps;if(c.loop){f%=c.n;if(f<0)f+=c.n;}else f=clamp(f,0,c.n-1);const i0=Math.floor(f),i1=c.loop?(i0+1)%c.n:Math.min(c.n-1,i0+1),k=f-i0,a=c.a;
  for(let j=0;j<AF;j++)out[j]=a[i0*AF+j]*(1-k)+a[i1*AF+j]*k;return out;}
const QIDX=[0,5,9];for(let j=13;j<AF;j+=4)QIDX.push(j);
// blend b into a (k = weight of b); quaternions are sign-aligned first. upperOnly leaves hips and legs alone.
function blendInto(a,b,k,upperOnly){if(k<=0)return;for(const i of QIDX){if(upperOnly&&(i===0||i>=37))continue;const kk=upperOnly&&(i===5||i===9)?k*0.5:k;const d=a[i]*b[i]+a[i+1]*b[i+1]+a[i+2]*b[i+2]+a[i+3]*b[i+3],sg=d<0?-1:1;
    for(let j=0;j<4;j++)a[i+j]=a[i+j]*(1-kk)+b[i+j]*sg*kk;}if(!upperOnly)a[4]=a[4]*(1-k)+b[4]*k;}
function applyPose(H,p){const q=(o,i)=>{const x=p[i],y=p[i+1],z=p[i+2],w=p[i+3],l=Math.hypot(x,y,z,w)||1;o.quaternion.set(x/l,y/l,z/l,w/l);};
  q(H.hips,0);H.hips.position.y=0.93+p[4]*0.93;q(H.spine,5);H.chest.quaternion.set(0,0,0,1);q(H.neck,9);H.head.quaternion.set(0,0,0,1);
  const J=[H.sh,H.el,H.hand,H.leg,H.knee,H.foot];for(let ji=0;ji<6;ji++)for(let s=0;s<2;s++)q(J[ji][s],13+(ji*2+s)*4);}
// one-shot action on top of the base loop (upper body only while walking)
function heroPlay(H,k,speed){if(!H||!(H.sk?skClip(k):animClip(k)))return;H.one={k,t0:H._t||0,sp:speed||1};}
function toolInHand(H,on){const h=H.hammer;if(!h||H._toolHand===on)return;H._toolHand=on;
  if(on){H.hand[0].add(h);h.position.set(0,-0.06,0.04);h.rotation.set(Math.PI/2,0,0);}else{H.hammerPar.add(h);h.position.copy(H.hammerP);h.rotation.copy(H.hammerR);}}
function animPose(H,t,walk,ph){const base=walk?'walk':(H.idleK||'idle'),c=animClip(base);if(!c)return false;
  const dt=Math.max(0,Math.min(0.1,t-(H._t===undefined?t:H._t)));H._t=t;
  const P=H._pose||(H._pose=new Float32Array(AF)),T=H._tmp||(H._tmp=new Float32Array(AF));
  sampleClip(c,walk?(((ph/(2*Math.PI))%1+1)%1)*c.dur:t,P);
  if(H._base!==base){if(H._last){H._from=H._from||new Float32Array(AF);H._from.set(H._last);H._fade=1;}H._base=base;}
  if(H._fade>0){H._fade=Math.max(0,H._fade-dt/0.2);T.set(H._from);blendInto(T,P,1-H._fade,false);P.set(T);}
  let tool=base==='fix';
  if(H.one){const oc=animClip(H.one.k),el=(t-H.one.t0)*H.one.sp;if(el>=oc.dur){H.one=null;}else{sampleClip(oc,el,T);const w=Math.min(1,el/0.06,(oc.dur-el)/0.1);blendInto(P,T,w,H.one.k!=='yes');if(H.one.k==='smash')tool=true;}}
  toolInHand(H,tool);
  H._last=H._last||new Float32Array(AF);H._last.set(P);applyPose(H,P);return true;}
function heroPose(H,t,walk,phIn){
  const ph=phIn!==undefined?phIn:t*7.5;if(H.sk){skPose(H,t,walk,ph);return;}
  if(animPose(H,t,walk,ph)){}
  else if(walk){const s=Math.sin(ph),c=Math.cos(ph);
    H.leg[0].rotation.x=-s*0.55;H.leg[1].rotation.x=s*0.55;
    H.knee[0].rotation.x=Math.max(0,c)*0.95+0.05;H.knee[1].rotation.x=Math.max(0,-c)*0.95+0.05;
    H.foot[0].rotation.x=-H.leg[0].rotation.x*0.4-H.knee[0].rotation.x*0.6+0.1;H.foot[1].rotation.x=-H.leg[1].rotation.x*0.4-H.knee[1].rotation.x*0.6+0.1;
    H.hips.position.y=0.93-0.03+0.03*Math.cos(ph*2);H.hips.rotation.y=s*0.08;
    H.chest.rotation.y=-s*0.14;H.chest.rotation.x=0.06;
    H.sh[0].rotation.x=s*0.55;H.sh[1].rotation.x=-s*0.55;H.el[0].rotation.x=-0.35-Math.max(0,s)*0.35;H.el[1].rotation.x=-0.35-Math.max(0,-s)*0.35;
    H.head.rotation.y=s*0.06;H.head.rotation.x=-0.04;}
  else{const b=Math.sin(t*1.7);
    for(let i=0;i<2;i++){H.leg[i].rotation.x=0;H.knee[i].rotation.x=0.04;H.foot[i].rotation.x=-0.02;}
    H.hips.position.y=0.93+b*0.006;H.hips.rotation.y=0;H.chest.rotation.x=b*0.015;H.chest.rotation.y=Math.sin(t*0.4)*0.05;
    H.sh[0].rotation.x=b*0.04;H.sh[1].rotation.x=-b*0.04;H.el[0].rotation.x=-0.12;H.el[1].rotation.x=-0.12;
    H.head.rotation.y=Math.sin(t*0.45)*0.5*smooth01(Math.sin(t*0.3));H.head.rotation.x=Math.sin(t*0.7)*0.05;}
  if(H.scarf)H.scarf.rotation.z=Math.sin(t*(walk?7:2.5))*0.25+0.1;
  if(H.lantern)H.lantern.rotation.z=Math.sin(t*(walk?7.5:2))*0.3;
  if(H.cloak)H.cloak.rotation.x=(walk?0.28:0.06)+Math.sin(t*(walk?7:1.8))*0.05;
  if(H.pack)H.pack.position.y=(walk?Math.abs(Math.sin(ph))*0.015:0);
}
function smooth01(x){return x*Math.abs(x);}
function dogPose(D,t,mode,ph){
  // mode: idle | trot | back | grab
  if(mode==='trot'||mode==='back'){for(let i=0;i<4;i++){const h=D.hip[i],s=Math.sin(ph+h.ph);h.g.rotation.x=-s*0.55;D.knee[i].rotation.x=Math.max(0,Math.cos(ph+h.ph))*0.8*(mode==='back'?-0.6:1);}
    D.body.position.y=(D.by||0.66)+Math.abs(Math.sin(ph))*0.03*(D.bs||1);D.body.rotation.x=Math.sin(ph*2)*0.02;D.tail.rotation.y=Math.sin(t*12)*0.5;D.tail.rotation.x=-0.8+(D.tx0||0);D.head.rotation.x=Math.sin(ph*2)*0.05;D.head.rotation.z=0;}
  else{for(let i=0;i<4;i++){D.hip[i].g.rotation.x=0;D.knee[i].rotation.x=0;}D.body.position.y=(D.by||0.66)+Math.sin(t*2)*0.006*(D.bs||1);D.body.rotation.x=0;
    D.tail.rotation.y=Math.sin(t*(mode==='grab'?14:7))*(mode==='grab'?0.3:0.55);D.tail.rotation.x=-0.7+(D.tx0||0)+Math.sin(t*0.9)*0.08;
    if(mode==='idle'){const cyc=t%9;const sniff=cyc>5.5&&cyc<7.3;D.neck.rotation.x=lerp(D.neck.rotation.x,sniff?0.75:0,0.06);D.head.rotation.x=sniff?Math.sin(t*20)*0.05:Math.sin(t*0.7)*0.04;
      const tilt=cyc>2&&cyc<3.6;D.head.rotation.z=lerp(D.head.rotation.z,tilt?0.32:0,0.08);D.head.rotation.y=Math.sin(t*0.37)*0.35;}}
  D.tail2.rotation.x=0.35+Math.sin(t*6)*0.12;
  D.ear.forEach((e,i)=>{const f=(t*1.3+i*0.7)%4<0.12;if(e.userData.q0){e.quaternion.copy(e.userData.q0);if(f)e.rotateZ((i?1:-1)*0.35);}else e.rotation.x=f?-0.5:0;});
  if(D.dish)D.dish.rotation.y=t*1.6;if(D.tag)D.tag.rotation.x=Math.sin(t*(mode==='idle'?2:9))*0.3;
}
function blinkFace(H,D,t,base,dbase){if(H){const F=H.F||HF,b=(t%3.7)<0.13;H.faceMat.map=b&&base!=='ko'?F.blink:F[base];}
  if(D){const b=(t%4.3)<0.12;D.faceMat.map=b&&dbase!=='grab'&&dbase!=='love'?DF.blink:DF[dbase];}}


function heroGear(){return {head:null,eyes:null,neck:null,body:null,
  back:gearLv('batoh')>=2?'pack':(gearLv('batoh')>=1?'satchel':'bundle'),feet:SV.craft.boty?'boots':null,hands:SV.b.dilna?'gloves':null,tool:SV.craft.kladivo?'hammer':null};}
// Zuro has no gear – he looks the same the whole game (Robin, 19. 11.)
function dogGear(){return {};}
const QS=Math.PI/4,qph=p=>ST.q?Math.round(p/QS)*QS:p;
const heroReq=n=>60*Math.pow(n-1,1.7),dogReq=n=>120*Math.pow(n-1,1.7);// metres walked (rescaled with the real metre scale)
function lvOf(m,req,max){let l=1;while(l<max&&m>=req(l+1))l++;return l;}
const heroLv=()=>lvOf(SV.meters||0,heroReq,30),dogLv=()=>lvOf(SV.meters||0,dogReq,15);
const heroWaterMul=()=>1-0.015*(heroLv()-1),heroSpeedMul=()=>1+0.006*(heroLv()-1),rescueLoss=()=>(50-(dogLv()-1)*2.2)/100;
// terrain height for the desert (3D units)
// the walkable desert is completely flat (Robin 19. 11.: dunes broke the look – buried bodies, tilted and cut objects).
// Craters and sunken rocky canyons (Robin 19. 11.) are the only dips – and they can't be entered, so nothing ever stands on a slope.
const OBST=new Map();
function obstOf(cx,cy){const k=cx+','+cy;let o=OBST.get(k);if(o)return o;o=[];
  const ox=cx*CH,oy=cy*CH,mx=ox+CH/2,my=oy+CH/2,dist=Math.hypot(mx,my);
  const nearCamp=CAMPS.some(cp=>cp.x>ox-70&&cp.x<ox+CH+70&&cp.y>oy-70&&cp.y<oy+CH+70)||STARTERS.some(q=>q.x>ox-40&&q.x<ox+CH+40&&q.y>oy-40&&q.y<oy+CH+40);
  if(dist>330&&!nearCamp&&coastSD(mx,my).d>220){const r=mulberry32(hash3((SV.seed^0x5bd1e995)>>>0,cx,cy));const bio=biomeAt(mx,my);
    // Robin 20. 11.: fewer holes, but bigger and irregular – built from overlapping lobes / a bent chain, so you really have to walk around
    if(r()<(bio===2?0.38:0.2)){const ccx=mx+(r()-0.5)*24,ccy=my+(r()-0.5)*24,fit=(x,y,rr)=>Math.max(Math.abs(x-mx),Math.abs(y-my))+rr<112;
      if(r()<(bio===2?0.65:0.4)){// bent canyon: 3–4 segments
        const n=3+Math.floor(r()*2);let a=r()*Math.PI*2,seg=[],x=0,y=0;const pts=[[0,0]];for(let i=0;i<n;i++){a+=(r()-0.5)*1.3;const L=30+r()*16;x+=Math.cos(a)*L;y+=Math.sin(a)*L;pts.push([x,y]);}
        const cxm=pts.reduce((s,q)=>s+q[0],0)/pts.length,cym=pts.reduce((s,q)=>s+q[1],0)/pts.length;
        for(let i=0;i<n;i++){const w=17+r()*10;const x0=ccx+pts[i][0]-cxm,y0=ccy+pts[i][1]-cym,x1=ccx+pts[i+1][0]-cxm,y1=ccy+pts[i+1][1]-cym;if(fit(x0,y0,w)&&fit(x1,y1,w))seg.push({t:'canyon',x0,y0,x1,y1,r:w,D:2.8});}
        o.push(...seg);}
      else{// crater blob: a main pit with 2–3 bulges
        const R=38+r()*22;const D=2.0+R/50;o.push({t:'crater',x0:ccx,y0:ccy,x1:ccx,y1:ccy,r:R,D});const nl=2+Math.floor(r()*2);
        for(let i=0;i<nl;i++){const a=r()*Math.PI*2,d=R*(0.5+r()*0.3),rr=R*(0.5+r()*0.25),a2=a+(r()-0.5)*1.2,e=r()<0.5?rr*0.6:0;
          const x0=ccx+Math.cos(a)*d,y0=ccy+Math.sin(a)*d,x1=x0+Math.cos(a2)*e,y1=y0+Math.sin(a2)*e;if(fit(x0,y0,rr)&&fit(x1,y1,rr))o.push({t:'crater',x0,y0,x1,y1,r:rr,D});}}}}
  // solid desert props (Robin 20. 11.): dead trees and big rocks you have to walk around – real obstacles, unlike the old rocks
  if(dist>230&&!nearCamp&&coastSD(mx,my).d>140){const r=mulberry32(hash3((SV.seed^0x2c1b3c6d)>>>0,cx,cy));const bio=biomeAt(mx,my);
    const nT=bio===0?(r()<0.55?1+Math.floor(r()*2):0):bio===3?(r()<0.3?1:0):bio===2?(r()<0.25?1:0):0;
    const nR=bio===2?1+Math.floor(r()*3):bio===1?(r()<0.25?1:0):(r()<0.45?1:0);
    const put=(t,rr)=>{for(let tr=0;tr<6;tr++){const x=ox+30+r()*(CH-60),y=oy+30+r()*(CH-60);if(Math.hypot(x,y)<200)continue;
        if(o.some(q=>segPt(x,y,q).d<q.r+rr+28))continue;o.push({t,solid:1,x0:x,y0:y,x1:x,y1:y,r:rr,D:0,sd:Math.floor(r()*1e6)});return;}};
    for(let i=0;i<nT;i++)put('tree',6+r()*3);for(let i=0;i<nR;i++)put('rock',9+r()*7);}
  OBST.set(k,o);return o;}
function segPt(px,py,o){const dx=o.x1-o.x0,dy=o.y1-o.y0,l2=dx*dx+dy*dy;let t=l2?((px-o.x0)*dx+(py-o.y0)*dy)/l2:0;t=t<0?0:t>1?1:t;const qx=o.x0+dx*t,qy=o.y0+dy*t;return {x:qx,y:qy,d:Math.hypot(px-qx,py-qy)};}
function obstNear(px,py,fn){const cx=Math.floor(px/CH),cy=Math.floor(py/CH);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)for(const o of obstOf(cx+i,cy+j))fn(o);}
function Hd(x,z){const px=x/S,py=z/S;const os=obstOf(Math.floor(px/CH),Math.floor(py/CH));if(!os.length)return 0;let h=0;
  for(const o of os){const d=segPt(px,py,o).d;if(d<o.r){const k=smooth(o.r,o.r-13,d);h=Math.min(h,-o.D*k);}}return h;}
// keep a walker out of craters/canyons and slide around them (so tapping across one walks around it)
function blockObst(P,dir,step,isX){let hit=false;
  {const cs=coastSD(P.x,P.y);if(cs.d<6){hit=true;P.x+=cs.nx*(6-cs.d);P.y+=cs.ny*(6-cs.d);if(dir&&step>0){const tx=-cs.ny,ty=cs.nx,dt=tx*dir.x+ty*dir.y,dn=cs.nx*dir.x+cs.ny*dir.y;if(dn<0){const sg=dt>=0?1:-1;P.x+=tx*sg*step*(-dn)*0.95;P.y+=ty*sg*step*(-dn)*0.95;}}}}obstNear(P.x,P.y,o=>{const q=segPt(P.x,P.y,o),R=o.r+5;if(q.d<R){hit=true;const nx=q.d>0.01?(P.x-q.x)/q.d:1,ny=q.d>0.01?(P.y-q.y)/q.d:0;P.x=q.x+nx*R;P.y=q.y+ny*R;
  if(dir&&step>0){const tx=-ny,ty=nx,dt=tx*dir.x+ty*dir.y,dn=nx*dir.x+ny*dir.y;let sg;if(isX&&X.slideOb===o&&X.slide)sg=X.slide;else{sg=Math.abs(dt)>0.05?(dt>0?1:-1):1;if(isX){X.slide=sg;X.slideOb=o;}}if(isX)X.slideT=X.t;if(dn<0){P.x+=tx*sg*step*(-dn)*0.95;P.y+=ty*sg*step*(-dn)*0.95;}}}});return hit;}
// tap targets (Robin 20. 11.): you can't walk into a crater, canyon or the sea – a tap there means "go to its edge"
function walkable(x,y){if(coastSD(x,y).d<9)return false;let ok=true;obstNear(x,y,o=>{if(ok&&segPt(x,y,o).d<o.r+7)ok=false;});return ok;}
function fixDest(p){if(!p||!X)return null;if(walkable(p.x,p.y))return p;const dx=X.x-p.x,dy=X.y-p.y,L=Math.hypot(dx,dy);if(L<1)return null;
  for(let t=5;t<L;t+=5){const x=p.x+dx/L*t,y=p.y+dy/L*t;if(walkable(x,y))return Math.hypot(X.x-x,X.y-y)<10?null:{x,y};}return null;}
// ---- biomes: every direction leads somewhere (2D game units) ----
const BIOME_COL=ST.sunink?['#f9dec3','#dff6fc','#f2b6a6','#d2d3d4']:['#d0aa70','#ebe3d3','#c4906a','#b3a596'];// sand, salt flats (north), red rocks (east), old town (west)
const BIOME_NAME=['Dunes','Salt Flats','Red Rocks','Old Town'];
function biomeW(x,y){const d=Math.hypot(x,y);const f=smooth(600,1300,d);if(f<=0)return [1,0,0,0];const a=Math.atan2(y,x);
  const w=c=>Math.pow(Math.max(0,Math.cos(a-c)),3);const ws=w(Math.PI/2),wn=w(-Math.PI/2),we=w(0),ww=w(Math.PI),sum=ws+wn+we+ww||1;
  return [1-f*(wn+we+ww)/sum,f*wn/sum,f*we/sum,f*ww/sum];}
function biomeAt(x,y){const w=biomeW(x,y);let bi=0;for(let i=1;i<4;i++)if(w[i]>w[bi])bi=i;return w[bi]>0.45?bi:0;}
// tileable sand texture (wind ripples + specks), multiplied with the biome colour
function sandTex(){if(ST.sunink)return canTex('sandH',256,256,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);const r=mulberry32(77);
  for(let row=0;row<6;row++){const y0=row*43+10,k=1+(row%3),ph=r()*6.283;g.lineWidth=1.4;g.strokeStyle='rgba(150,100,80,0.16)';g.beginPath();
    for(let x=0;x<=w;x+=4){const y=y0+Math.sin(x/w*6.283*k+ph)*6;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
  for(let i=0;i<120;i++){const x=r()*w,y=r()*h;g.fillStyle=`rgba(150,105,80,${0.06+r()*0.08})`;for(const ox of [-w,0,w])for(const oy of [-h,0,h]){g.beginPath();g.arc(x+ox,y+oy,0.9,0,6.283);g.fill();}}
},[1,1]);
  return canTex('sand',256,256,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);const r=mulberry32(77);
  for(let row=0;row<8;row++){const y0=row*32+8;const k=1+(row%3);const ph=r()*6.283;
    g.lineWidth=3;g.strokeStyle='rgba(150,105,60,0.13)';g.beginPath();for(let x=0;x<=w;x+=4){const y=y0+Math.sin(x/w*6.283*k+ph)*5;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
    g.lineWidth=2;g.strokeStyle='rgba(255,250,240,0.55)';g.beginPath();for(let x=0;x<=w;x+=4){const y=y0-3+Math.sin(x/w*6.283*k+ph)*5;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
  for(let i=0;i<420;i++){const x=r()*w,y=r()*h,s=0.8+r()*1.8,dk=r()<0.6;g.fillStyle=dk?`rgba(120,80,45,${0.12+r()*0.15})`:`rgba(255,255,255,${0.3+r()*0.4})`;
    for(const ox of [-w,0,w])for(const oy of [-h,0,h]){g.beginPath();g.arc(x+ox,y+oy,s,0,6.283);g.fill();}}
},[1,1]);}
const SAND_TILE=7;// world units per texture tile
function worldUV(geo){const p=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/SAND_TILE,p.getZ(i)/SAND_TILE);uv.needsUpdate=true;}
// biome props
function makeSaltCrystals(seed){const g=grp();const r=mulberry32(seed|0);const n=3+Math.floor(r()*3);
  for(let i=0;i<n;i++){const s=0.25+r()*0.45;const m=part(G.oct,i%2?'#f8f6f2':'#e6f1f2',(r()-0.5)*1.2,s*0.7,(r()-0.5)*1.0,s*0.8,s*1.6,s*0.8,g);m.rotation.set(r()*0.4,r()*3,r()*0.4);}return g;}
function makeBrine(rr){const g=grp();part(G.disc24,M('#f3efe6'),0,0.02,0,rr*2.3,1,rr*1.6,g,true);const w=part(G.disc24,M('#cfe9ea',{roughness:0.15,metalness:0.1}),0,0.04,0,rr*1.9,1,rr*1.25,g,true);w.receiveShadow=true;
  part(G.disc24,M('#f4fbfb'),-rr*0.25,0.05,-rr*0.15,rr*0.7,1,rr*0.25,g,true);return g;}
function makeBoulder(s,seed){if(ST.sunink)return makeBoulderH(s,seed);const g=grp();const r=mulberry32((seed|0)+3);const n=2+Math.floor(r()*2);let y=0;
  for(let i=0;i<n;i++){const k=s*(1-i*0.28);const m=part(G.sph,i%2?'#b06c45':'#c58456',(r()-0.5)*s*0.5,y+k*0.45,(r()-0.5)*s*0.4,k*2.1,k*1.1,k*1.7,g);m.rotation.y=r()*3;y+=k*0.85;}return g;}
// dead tree: a bare, twisted trunk with forked branches (game-made, wood texture from the pattern shader)
// props from the Stylized Nature MegaKit (Quaternius, CC0): geometry only, painted with the game's own toon materials
const NGEO={};
function natGeo(k){if(NGEO[k])return NGEO[k];if(typeof NATURE==='undefined'||!NATURE[k])return null;const D=NATURE[k];const dec=b=>{const s2=atob(b),u=new Uint8Array(s2.length);for(let i=0;i<s2.length;i++)u[i]=s2.charCodeAt(i);return u.buffer;};
  const q=new Int16Array(dec(D.p)),ix=new Uint16Array(dec(D.i)),pos=new Float32Array(q.length);for(let i=0;i<q.length;i++)pos[i]=q[i]/32767*D.s;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(new T.BufferAttribute(ix,1));g.computeVertexNormals();g.computeBoundingBox();NGEO[k]=g;return g;}
function makeNatRock(rad,seed){if(ST.sunink)return makeBoulderH(rad*0.85,seed);const k='rock'+(1+seed%3),geo=natGeo(k);if(!geo)return makeBoulder(rad,seed);const g=grp();PART_OL=0.012;const sc=rad/1.25;
  part(geo,seed%2?'#c4875a':'#b97a50',0,0,0,sc,sc*(0.8+(seed%5)*0.08),sc,g);PART_OL=0;return g;}
function makeNatTree(s,seed){if(ST.sunink)return makeDeadTree(s*0.9,seed);const geo=natGeo(seed%2?'tree1':'tree3');if(!geo)return makeDeadTree(s,seed);const g=grp();PART_OL=0;const sc=0.3*s;part(geo,'#7f6046',0,0,0,sc,sc,sc,g);return g;}
function makeDeadTree(s,seed){if(!G.limb){G.limb=new T.CylinderGeometry(0.3,0.5,1,7);G.limb.translate(0,0.5,0);}
  const g=grp();const r=mulberry32((seed|0)+17);PART_OL=0.012;const col=ST.sunink?(r()<0.5?'#a07a5c':'#8c6a50'):(r()<0.5?'#7a5a3a':'#86684a');const T0=grp(0,0,0,g);T0.scale.setScalar(s);T0.rotation.set((r()-0.5)*0.25,0,(r()-0.5)*0.25);
  const br=(par,len,rad,d)=>{part(G.limb,col,0,0,0,rad*2,len,rad*2,par);if(d<=0)return;const top=grp(0,len*0.9,0,par);const n=(d===3?2:1)+(r()<0.45?1:0);
    for(let i=0;i<n;i++){const c=grp(0,0,0,top);c.rotation.set((r()-0.5)*0.9,r()*6.28,(i%2?-1:1)*(0.45+r()*0.55));br(c,len*(0.5+r()*0.25),rad*0.6,d-1);}};
  part(G.cone5,col,0,0.35,0,1.0,0.7,1.0,T0);br(T0,2.2+r()*0.8,0.3,3);
  for(let i=0;i<3;i++){const a=i*2.1+r(),rt=grp(Math.cos(a)*0.25,0.05,Math.sin(a)*0.25,T0);rt.rotation.set(0,-a,1.25);part(G.limb,col,0,0,0,0.22,0.7,0.22,rt);}
  PART_OL=0;return g;}
function makeRubble(seed){const g=grp();const r=mulberry32((seed|0)+9);
  const sl=part(G.box,'#aaa296',0,0.25,0,2.4,0.3,1.6,g);sl.rotation.set(0.12,r()*3,0.18);
  const pl=part(G.cyl,'#b8b0a2',1.2,0.8,-0.4,0.6,1.6,0.6,g);pl.rotation.z=0.08;part(G.box,'#9a9286',1.2,1.65,-0.4,0.75,0.12,0.75,g);
  for(let i=0;i<3;i++){const rb=part(G.cyl,'#5d4a3a',-0.6+i*0.3,0.6,0.2,0.05,0.9,0.05,g);rb.rotation.set(0.3*(i-1),0,0.5-i*0.3);}
  part(G.box,'#b8b0a2',-1.1,0.18,0.7,0.7,0.36,0.5,g).rotation.y=0.5;return g;}
function makeCamp(built){if(ST.sunink)return makeCampH(built);const g=grp();
  for(let i=0;i<8;i++){const a=i/8*6.283;part(G.sph,'#8a7a6a',Math.cos(a)*0.7,0.12,Math.sin(a)*0.7+0.4,0.36,0.24,0.32,g);}
  if(built){part(G.cone5,'#e0743f',0,0.35,0.4,0.5,0.6,0.5,g).material=M('#ffb050',{emissive:'#ff8a30',emissiveIntensity:0.9});const gs=glowSprite('#ffa848',4.5);gs.position.set(0,0.6,0.4);gs.userData.g0=0.9;g.add(gs);
    const tent=new T.Mesh(G.roof,TMR('#c8643c'));tent.scale.set(2.6,1.9,2.4);tent.position.set(-0.4,0,-2.0);tent.rotation.y=0.2;tent.castShadow=true;g.add(tent);
    part(G.box,'#3a2a20',-0.4+0.06,0.55,-0.8,0.55,1.0,0.05,g);
    part(G.cyl4,'#5d4a3a',1.6,1.4,-1.3,0.08,2.8,0.08,g);const fl=part(G.box,'#57a6b6',2.05,2.5,-1.3,0.9,0.55,0.04,g);g.userData.flag=fl;
    part(G.box,P.wood,1.4,0.3,0.4,0.8,0.6,0.6,g);part(G.cyl,'#57a6b6',-1.6,0.45,0.6,0.6,0.9,0.6,g);}
  else{const p=part(G.cyl4,'#5d4a3a',1.2,0.5,-0.8,0.08,1.0,0.08,g);p.rotation.z=0.5;part(G.box,'#efe2c4',1.3,0.9,-0.8,0.9,0.5,0.05,g).rotation.z=0.4;
    const st=part(G.box,'#a0623c',-0.6,0.12,-1.0,1.6,0.06,0.12,g);st.rotation.y=0.6;}
  return g;}

// ================= global state =================
let scene3=null,tNow=0,scene='title';
const kb={u:0,d:0,l:0,r:0};
let X=null;let toastT=0;
const B={decorSel:null,decorMode:false,sel:null};
function toast(ic,nm,tx){$('tIc').innerHTML=icx(ic);$('tNm').textContent=nm;$('tTx').innerHTML=icx(tx||'');$('toast').classList.add('on');toastT=2.6;}
const camT=new T.Vector3(),camPos=new T.Vector3();

// particles (shared across scenes, re-parented)
const parts=[];
function burst3(scn,x3,y3,z3,col,n,spd){for(let i=0;i<n;i++){const m=new T.Mesh(G.ico,M(col));const s=0.18+Math.random()*0.16;m.scale.setScalar(s);m.position.set(x3,y3,z3);scn.add(m);
  const a=Math.random()*6.283,v=spd*(0.4+Math.random()*0.6);parts.push({m,scn,vx:Math.cos(a)*v,vy:2+Math.random()*spd,vz:Math.sin(a)*v,life:0,max:0.6+Math.random()*0.5,s});}}
function updParts(dt){for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life+=dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;p.vy-=(p.g===undefined?9:p.g)*dt;p.vx*=0.95;p.vz*=0.95;
  p.m.scale.setScalar(p.s*(1-p.life/p.max));if(p.life>p.max||p.m.position.y<-1){p.scn.remove(p.m);parts.splice(i,1);}}}
function puff(scn,x3,y3,z3,n){for(let i=0;i<(n||2);i++){const m=new T.Mesh(G.ico,DUSTM);const s=0.16+Math.random()*0.16;m.scale.setScalar(s);m.position.set(x3+(Math.random()-0.5)*0.3,y3,z3+(Math.random()-0.5)*0.3);scn.add(m);
  const a=Math.random()*6.283;parts.push({m,scn,vx:Math.cos(a)*0.5,vy:0.5+Math.random()*0.4,vz:Math.sin(a)*0.5,life:0,max:0.55+Math.random()*0.35,s,g:0});}}
const DUSTM=new T.MeshBasicMaterial({color:new T.Color('#f3e2c0'),transparent:true,opacity:0.75,depthWrite:false});
// blowing sand wisps
function makeWisps(sc,n){const arr=[];const mat=new T.MeshBasicMaterial({color:new T.Color('#fff4dc'),transparent:true,opacity:0.5,depthWrite:false,fog:false});
  for(let i=0;i<n;i++){const m=new T.Mesh(G.box,mat);m.scale.set(0.5+Math.random()*0.9,0.025,0.025);m.userData={sp:5+Math.random()*5,ph:Math.random()*6.28,y0:0.15+Math.random()*0.7,init:false};sc.add(m);arr.push(m);}arr.mat=mat;return arr;}
function updWisps(arr,dt,cx,cz,w){if(!arr)return;const hw=w/2+3,hd=(w/ASP)/Math.sin(0.9)*0.6+3;const gust=0.5+0.5*Math.sin(tNow*0.23)*Math.sin(tNow*0.11+1);arr.mat.opacity=0.06+0.24*gust;
  for(const m of arr){const u=m.userData;if(!u.init||m.position.x>cx+hw||m.position.x<cx-hw-1||Math.abs(m.position.z-cz)>hd){m.position.set(u.init?cx-hw:cx+(Math.random()*2-1)*hw,0,cz+(Math.random()*2-1)*hd);u.init=true;}
    m.position.x+=u.sp*(0.5+gust)*dt;m.position.z+=Math.sin(tNow*1.3+u.ph)*0.3*dt;m.position.y=u.y0+Math.sin(tNow*2.1+u.ph)*0.12+(m.position.x>-1e9?0:0);}}
const floaters=[];// {x3,y3,z3,t,c,b}
function float3(x3,y3,z3,t,c){floaters.push({x3,y3,z3,t,c,b:tNow});}

// ===================================================================
// ============================ BASE =================================
// ===================================================================
const BS={scene:null,sun:null,bld:{},bots:{},house:null,hero:null,dog:null,gInst:null,flowerPrefix:[],decor:null,smoke:[],palms:[],clickables:[],decorRing:null};
function buildBase(){
  const sc=new T.Scene();sc.background=C(ST.bg||'#efd3a0');sc.fog=new T.Fog(C(ST.bg||'#efd3a0'),120,260);
  BS.scene=sc;BS.sun=setupLights(sc);placeSun(BS.sun,0,0);BS.wisps=makeWisps(sc,6);
  // ground
  const geo=new T.PlaneGeometry(200,220,80,88);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++)pos.setY(i,-0.02);
  geo.computeVertexNormals();worldUV(geo);
  // oasis: soft, irregular transition from sand to a lighter, slightly greener ground (no hard edge)
  {const cs=new Float32Array(pos.count*3),cS=C(SAND),cP=C(PLAZA),cG=C('#c9c487'),tmp=new T.Color();
   for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);const a=Math.atan2(z-1,x);
     const wob=0.07*Math.sin(a*3+0.6)+0.05*Math.sin(a*5-1.1)+0.03*Math.sin(a*9+2.0);
     const e=Math.hypot(x/16.8,(z-1)/25.8)-wob;
     const k=1-smooth(0.78,1.18,e);const g=(1-smooth(0.15,0.75,e))*0.55;
     tmp.copy(cS).lerp(cP,k).lerp(cG,g*k);cs[i*3]=tmp.r;cs[i*3+1]=tmp.g;cs[i*3+2]=tmp.b;}
   geo.setAttribute('color',new T.BufferAttribute(cs,3));}
  const ground=new T.Mesh(geo,MAT({vertexColors:true,map:sandTex()}));ground.receiveShadow=true;sc.add(ground);
  // paths
  const pathM=ST.sunink?M('#fff9f1',{pat:9,depthWrite:false}):M('#efd9b0',{pat:9});
  VPATHS.forEach((vp,pi)=>{const cv=new T.CatmullRomCurve3(vp.p.map(q=>new T.Vector3(q[0],0,q[1])),false,'centripetal');const n=Math.max(12,Math.round(cv.getLength()*2.2));
    const P=cv.getSpacedPoints(n),pos=[],idx=[];const rr=mulberry32(77+pi*13);
    for(let i=0;i<=n;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(n,i+1)];let dx=b.x-a.x,dz=b.z-a.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
      const t=i/n,taper=Math.min(1,0.55+Math.min(t,1-t)*4),w=vp.w*0.5*taper*(0.9+rr()*0.2);
      pos.push(P[i].x-dz*w,0.024+pi*0.0015,P[i].z+dx*w,P[i].x+dz*w,0.024+pi*0.0015,P[i].z-dx*w);if(i<n){const o=i*2;idx.push(o,o+2,o+1,o+1,o+2,o+3);}}
    const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(pos,3));gg.setIndex(idx);gg.computeVertexNormals();
    const m=new T.Mesh(gg,pathM);m.receiveShadow=true;if(ST.sunink)m.renderOrder=1;sc.add(m);});
  // greens (instanced)
  const r=mulberry32(12345);
  const arr=[];for(let i=0;i<190;i++){const a=r()*6.283,d=Math.pow(r(),0.62)*1.12;const sh=d>0.9?0.6:1;arr.push({x:Math.cos(a)*d*15.5,z:1+Math.sin(a)*d*24.5,rx:(0.9+r()*1.6)*sh,rz:(0.5+r()*0.8)*sh,c:r()});}
  arr.sort((a,b)=>Math.hypot(a.x,a.z-1)-Math.hypot(b.x,b.z-1));
  const N=arr.length,wm=()=>MAT({color:0xffffff});
  const discs=new T.InstancedMesh(G.disc24,wm(),N);discs.receiveShadow=true;
  const blades=new T.InstancedMesh(G.cone3,wm(),N*3);blades.castShadow=true;
  const flowers=new T.InstancedMesh(G.ico,wm(),N);
  const o3=new T.Object3D();let fi=0;BS.flowerPrefix=[];
  const cA=C(ST.sunink?'#eaefd2':'#a3ad6a'),cB=C(ST.sunink?'#e3ecd0':'#a3ad6a'),bA=C(ST.sunink?'#b4d3b4':'#8a9a58'),bB=C(ST.sunink?'#a5cba9':'#8a9a58'),fl=[C('#e9a0b0'),C('#f3d06b'),C('#fff3e0')];
  arr.forEach((q,i)=>{o3.position.set(q.x,0.03,q.z);o3.rotation.set(0,0,0);o3.scale.set(q.rx*2,1,q.rz*2);o3.updateMatrix();discs.setMatrixAt(i,o3.matrix);discs.setColorAt(i,q.c<0.5?cA:cB);
    for(let k=0;k<3;k++){o3.position.set(q.x+(k-1)*q.rx*0.5,0.24,q.z+(k%2-0.5)*q.rz*0.6);o3.scale.set(0.18,0.45,0.18);o3.updateMatrix();blades.setMatrixAt(i*3+k,o3.matrix);blades.setColorAt(i*3+k,q.c<0.5?bA:bB);}
    if(q.c>0.8){o3.position.set(q.x+q.rx*0.3,0.34,q.z);o3.scale.set(0.24,0.24,0.24);o3.updateMatrix();flowers.setMatrixAt(fi,o3.matrix);flowers.setColorAt(fi,fl[fi%3]);fi++;}
    BS.flowerPrefix[i]=fi;});
  if(ST.sunink){[discs,blades,flowers].forEach((m,i)=>{m.material.depthWrite=false;m.renderOrder=1+i;m.castShadow=false;});}
  [discs,blades,flowers].forEach(m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.count=0;sc.add(m);});
  BS.gInst={discs,blades,flowers,N};

  // house + pip
  BS.house=makeHouse();sc.add(BS.house);BS.house.userData.house=true;BS.clickables.push(BS.house);
  BS.heroG=grp(0,0,0,sc);BS.dogG=grp(0,0,0,sc);
  // outer palms/cacti/rocks
  for(const [x,z,s] of [[-4.2,8.6,0.9],[15.8,-6.5,0.8],[-14,-1.2,0.85],[5,13.5,0.75],[2.5,-9,0.7]]){const p=makePalm(s);p.position.set(x,0,z);sc.add(p);BS.palms.push(p.userData.top);}
  for(const [x,z,h] of [[-21,-5,2.4],[22,-16,2.1],[20,20,2.6],[-19,22,2],[-27,10,2.3],[26,6,2],[0,-30,2.2]]){const c=makeCactus(h);c.position.set(x,Math.max(0,0),z);sc.add(c);}
  for(let i=0;i<16;i++){const a=i*2.17,d=21+(i*13)%14;const m=makeRock(0.5+((i*7)%5)*0.2,i);m.position.set(Math.cos(a)*d,0.15,1+Math.sin(a)*d*1.25);sc.add(m);}
  // smoke
  const smM=new T.MeshBasicMaterial({color:C('#e6ddd2'),transparent:true,opacity:0.7,depthWrite:false});
  for(let i=0;i<10;i++){const s=new T.Mesh(G.ico,smM.clone());s.userData.t=i/10;s.visible=false;sc.add(s);BS.smoke.push(s);}
  // decor ring (shown in decor mode)
  BS.decorRing=part(G.ring,new T.MeshBasicMaterial({color:C('#c8643c'),transparent:true,opacity:0.55,depthWrite:false}),0,0.08,1,33,1,51.6,sc,true);BS.decorRing.visible=false;
  BS.decor=grp(0,0,0,sc);
  for(const k in BLD) rebuildBuilding(k);
  rebuildDecor();
}
function rebuildBuilding(k){
  const sc=BS.scene,b=BLD[k],lvl=SV.b[k];
  if(BS.bld[k]){sc.remove(BS.bld[k]);BS.clickables=BS.clickables.filter(o=>o!==BS.bld[k]);}
  if(BS.bots[k]){sc.remove(BS.bots[k].g);delete BS.bots[k];}
  const g=lvl?makeBuilding(k,lvl):makeRuin(k);g.position.set(b.x*S,0,b.y*S);g.rotation.y=b.rot||0;g.userData.bk=k;sc.add(g);BS.bld[k]=g;BS.clickables.push(g);
  if(!lvl){const ring=part(G.ring,new T.MeshBasicMaterial({color:C('#c8643c'),transparent:true,opacity:0.8,depthWrite:false}),0,0.1,0,7,1,4.4,g,true);g.userData.ring=ring;}
  if(lvl&&b.bot){const o=makeBot(b.botCol||b.col,0.9);const ca=Math.cos(b.rot||0),sa=Math.sin(b.rot||0),ox=b.bot[0]*ca+b.bot[1]*sa,oz=-b.bot[0]*sa+b.bot[1]*ca;o.g.position.set((b.x+ox)*S,0,(b.y+oz)*S);sc.add(o.g);BS.bots[k]=o;}
}
function rebuildBaseChars(){
  while(BS.heroG.children.length)BS.heroG.remove(BS.heroG.children[0]);while(BS.dogG.children.length)BS.dogG.remove(BS.dogG.children[0]);
  BS.hero=makeHero(heroGear());BS.hero.root.position.set(-0.8,0,6.5);BS.hero.root.rotation.y=0.25;BS.hero.root.scale.setScalar(1.3);BS.heroG.add(BS.hero.root);
  if(SV.fetch){BS.dog=null;return;}
  BS.dog=makeDog(dogGear());BS.dog.root.position.set(1.7,0,6.8);BS.dog.root.rotation.y=-0.6;BS.dog.root.scale.setScalar(1.3);BS.dogG.add(BS.dog.root);
}
function rebuildDecor(){
  const g=BS.decor;while(g.children.length)g.remove(g.children[0]);
  for(const o of SV.decor){let m;if(o.t==='kvetiny')m=makeFlowers();else if(o.t==='lampa')m=makeLamp();else if(o.t==='lavicka')m=makeBench();else{m=makePalm(0.7);}
    m.position.set(o.x*S,0,o.y*S);m.rotation.y=(o.x*7+o.y*3)%6;g.add(m);}
}
function enterBase(){
  scene='base';scene3=BS.scene;
  $('bhud').classList.remove('hidden');$('bbar').classList.remove('hidden');$('mute').classList.remove('hidden');
  $('xhud').classList.add('hidden');$('bMelon').classList.add('hidden');$('bSling').classList.add('hidden');$('bDrop').classList.add('hidden');$('sum').classList.add('hidden');$('decorBar').classList.add('hidden');
  B.decorMode=false;BS.decorRing.visible=false;for(const k in BLD)rebuildBuilding(k);rebuildDecor();rebuildBaseChars();refreshBaseUI();
  if(X){disposeExp();X=null;}
}
document.querySelectorAll('.wic[data-ic],#bDrop [data-ic],#bSling [data-ic]').forEach(e=>{e.innerHTML=icSvg(e.dataset.ic);});
$('bMap').innerHTML=icSvg('map');$('xMap').innerHTML=icSvg('map');
const zSay=t=>ST.sunink?'<span class="zh">'+icSvg('paw')+'</span><span class="zt">'+icx(t)+'</span>':icx(t);
function refreshBaseUI(){
  $('rS').textContent=SV.scrap;$('rC').textContent=SV.cores;$('rX').textContent=SV.chips||0;
  $('rE').textContent=Math.floor(SV.energy||0)+'/'+energyCap();$('eFill').style.width=(clamp((SV.energy||0)/energyCap(),0,1)*100).toFixed(1)+'%';
  $('rM').style.display='none';
  $('rLv').innerHTML=icx('{hero} '+heroLv()+' &nbsp;{paw} '+dogLv());$('rWalk').textContent=Math.round(SV.meters||0).toLocaleString('en').replace(/,/g,' ')+' m walked';
  // Zuro speaks the hint
  let h='';const fill=fillAmount();
  if(SV.fetch)h='I\'m out fetching your lost bag! Back soon.';
  else if(SV.exp===0)h='Fill your flask at the well and let\'s find scrap! If you run dry, I\'ll drag you home.';
  else if(fill<1)h='The well is almost dry. Let\'s wait a little – the pump is working.';
  else if(SV.bags.length&&dogLv()>=3)h='Your lost bag is still out there. Want me to fetch it?';
  else if(totalLevels()===0)h=canRepair('cerpadlo')?'Tap the ruined Water Pump – it will fill the well faster.':'We need '+BLD.cerpadlo.lv[0].s+' {scrap} to fix the Water Pump. Back to the desert!';
  else if(SV.exp<5&&canRepairAny())h='We can repair something! Tap a ruin with an orange ring.';
  else if((SV.energy||0)<6&&SV.b.solar===0&&!canRepair('solar'))h='The battery is almost empty. Repair the Solar Field to charge it.';
  else if(SV.b.dilna&&!gearLv('kladivo'))h='Make a Hammer in the Workshop – then we can take wrecks apart.';
  else{const nb=bottleFill();h='The well holds '+Math.floor(SV.well)+' L. Shall I fill your flask'+(canteenCap()?' and canteen':'')+(nb?' and '+nb+' bottle'+(nb>1?'s':''):'')+'? That\'s '+fmtL(fill+nb*BOTTLE)+' L.';}
  $('hint').innerHTML=zSay(h);
  const anyCamp=CAMPS.some(c=>SV.camps[c.id]);
  const go=$('bGo');go.disabled=!!SV.fetch||fill<0.5;
  go.innerHTML=SV.fetch?'Zuro is out…':(anyCamp?'Choose on the map':'Fill up &amp; go')+`<small>${anyCamp?'home or a camp':fmtL(fill+bottleFill()*BOTTLE)+' L from the well'}</small>`;
  const fb=$('bFetch');const canF=SV.bags.length&&dogLv()>=3&&!SV.fetch;fb.style.display=canF?'':'none';fb.innerHTML=icx('{paw} Fetch bag<small>3 L</small>');
  updWellUI(true);
}
let _wellKey='';
function updWellUI(force){const cap=wellCap(),w=SV.well;const k=Math.floor(w*10)+'|'+cap+'|'+Math.floor(SV.energy||0);if(!force&&k===_wellKey)return;_wellKey=k;
  $('wellFill').style.width=(clamp(w/cap,0,1)*100).toFixed(1)+'%';$('rE').textContent=Math.floor(SV.energy||0)+'/'+energyCap();$('eFill').style.width=(clamp((SV.energy||0)/energyCap(),0,1)*100).toFixed(1)+'%';$('wellTxt').textContent=Math.floor(w)+'/'+cap+' L';$('wellRate').innerHTML=icx('{water} well +'+wellRate()+' L/min');}
function sendWolt(){if(!SV.bags.length||dogLv()<3||SV.fetch)return;if(SV.well<3){toast('{water}','Not enough water','Zuro needs 3 L for the trip.');return;}
  SV.well-=3;let bi=0;SV.bags.forEach((b,i)=>{if(b.s+b.c*3>SV.bags[bi].s+SV.bags[bi].c*3)bi=i;});const b=SV.bags.splice(bi,1)[0];
  const keep=Math.min(1,0.6+0.03*dogLv());const dur=(25+Math.hypot(b.x,b.y)/40)*1000/(window.SPD||1);
  SV.fetch={until:Date.now()+dur,dur,s:Math.round(b.s*keep),c:Math.round(b.c*keep),k:Math.round((b.k||0)*keep)};save();rebuildBaseChars();refreshBaseUI();
  toast('{paw}','Zuro is on his way','He brings back about '+Math.round(keep*100)+' % of the bag.');}
function checkScout(){if(SV.scout&&Date.now()>=SV.scout.until){const m=SV.scout;SV.scout=null;markSeen(m.x,m.y,m.r);save();
    toast('{drone}','The drone is back','It mapped the area around the spot you picked. Have a look at the map.');if(B.sel==='dron')openBuilding('dron',true);}}
function startScout(x,y){const l=SV.b.dron,c=DRONE.cost[l];if(!l||SV.scout||(SV.energy||0)<c)return false;const d=Math.hypot(x,y);if(d>DRONE.range[l])return false;
  SV.energy-=c;sfx.thrust();const secs=(25+d/120)/(window.SPD||1);SV.scout={x,y,r:DRONE.r[l],start:Date.now(),until:Date.now()+secs*1000};save();refreshBaseUI();
  toast('{drone}','Drone on its way','Back in about '+Math.round(secs)+' s.');return true;}
function checkFetch(){if(SV.fetch&&Date.now()>=SV.fetch.until){const f=SV.fetch;SV.fetch=null;SV.scrap+=f.s;SV.cores+=f.c;SV.chips=(SV.chips||0)+(f.k||0);save();
  toast('{paw}','Zuro is back!','He brought '+f.s+' {scrap}'+(f.c?' and '+f.c+' {core}':'')+' from your lost bag.');if(scene==='base'){rebuildBaseChars();refreshBaseUI();}}}
function openGoSheet(){let h='<h2>Where to?</h2><div class="lv">Well: '+Math.floor(SV.well)+' / '+wellCap()+' L</div>';
  const fill=fillAmount();h+=`<div class="crow"><div class="ic">{home}</div><div class="tx"><b>From home</b><br>Fill up ${fmtL(fill)} L and walk out of the village.</div><button class="btn" data-act="go" data-k="">Go</button></div>`;
  for(const cp of CAMPS){if(!SV.camps[cp.id])continue;const ok=SV.well>=cp.trip+0.5;
    h+=`<div class="crow"><div class="ic">{desert}</div><div class="tx"><b>${cp.name}</b><br>${BIOME_NAME[biomeAt(cp.x,cp.y)]} · trip ${cp.trip} L + fill up</div><button class="btn" data-act="go" data-k="${cp.id}" ${ok?'':'disabled'}>${cp.trip} L</button></div>`;}
  openSheet(h);}
function canRepairAny(){for(const k in BLD)if(canRepair(k))return true;return false;}
// building pictures rendered from the game's own models (cached per level)
const BIMG={};
function snapBld(k,lvl){const key=k+lvl;if(BIMG[key])return BIMG[key];if(ST.sunink)return BIMG[key]=hSnapBld(k,lvl)||'';try{const w=300,h=230,r2=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r2.setPixelRatio(1);r2.setSize(w,h);r2.outputEncoding=T.sRGBEncoding;
  const sc=new T.Scene();setupLights(sc);const g=lvl?makeBuilding(k,lvl):makeRuin(k);g.rotation.y=-0.55;sc.add(g);const bb=new T.Box3().setFromObject(g),c=bb.getCenter(new T.Vector3()),sz=bb.getSize(new T.Vector3());
  const cam=new T.PerspectiveCamera(28,w/h,0.1,200),d=Math.max(sz.x,sz.y*1.4,sz.z)/(2*Math.tan(14*Math.PI/180))*1.25;cam.position.set(c.x+d*0.55,c.y+d*0.5,c.z+d*0.67);cam.lookAt(c);
  r2.render(sc,cam);const u=r2.domElement.toDataURL('image/png');r2.dispose();r2.forceContextLoss&&r2.forceContextLoss();return BIMG[key]=u;}catch(e){return '';}}
const TIER=['Not crafted','Basic','Sturdy','Fine','Masterwork','Legendary'];
const tierOf=l=>l?Math.min(5,Math.ceil(l/2)):0;
const pips=(l,n)=>'<span class="pips">'+Array.from({length:n},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')+'</span>';
const costChips=(n,cnt)=>{const ch=[];if(n.s)ch.push(`<span class="cc ${SV.scrap>=n.s?'':'no'}">{scrap} ${n.s}</span>`);if(n.c)ch.push(`<span class="cc ${SV.cores>=n.c?'':'no'}">{core} ${n.c}</span>`);if(n.x)ch.push(`<span class="cc ${(SV.chips||0)>=n.x?'':'no'}">{chip} ${n.x}</span>`);if(n.en)ch.push(`<span class="cc ${(SV.energy||0)>=n.en?'':'no'}">{energy} ${n.en}</span>`);if(n.w&&(SV.b.dilna|0)<n.w)ch.push(`<span class="cc no">Workshop ${n.w}</span>`);return ch.join('');};
function canPay(n){return SV.scrap>=(n.s||0)&&SV.cores>=(n.c||0)&&(SV.chips||0)>=(n.x||0)&&(SV.energy||0)>=(n.en||0)&&(!n.w||(SV.b.dilna|0)>=n.w);}
const pay=n=>{SV.scrap-=n.s||0;SV.cores-=n.c||0;SV.chips=(SV.chips||0)-(n.x||0);SV.energy-=n.en||0;};
const BOTTLE_COST=()=>({s:bottleCost(),c:0,en:0}),SMELT_COST={s:30,c:0,en:5};
function workshopGrid(){
  const sel=B.wsel||'kladivo';let h='<div class="sect">Gear</div><div class="igrid">';
  for(const ck in CRAFT){const c=CRAFT[ck],gl=gearLv(ck);
    h+=`<button class="it t${tierOf(gl)}${sel===ck?' sel':''}" data-act="pick" data-k="${ck}"><span class="ii t${tierOf(gl)}">{${c.icon}}</span>${gl?`<span class="rb">${ROMAN[gl]}</span>`:''}<span class="in">${c.name}</span>${pips(gl,c.lv.length)}</button>`;}
  h+=`<button class="it t1${sel==='bottle'?' sel':''}" data-act="pick" data-k="bottle"><span class="ii t1">{bottle}</span><span class="rb">${SV.bottles||0}/${bottleMax()}</span><span class="in">Water bottle</span></button>`;
  h+=`<button class="it t0 rec${sel==='smelt'?' sel':''}" data-act="pick" data-k="smelt"><span class="ii t3">{core}</span><span class="in">Melt scrap</span></button></div>`;
  // detail of the selected tile
  let d='';
  if(CRAFT[sel]){const c=CRAFT[sel],gl=gearLv(sel),nx=c.lv[gl],multi=c.lv.length>1;
    d+=`<div class="dt"><span class="ii big t${tierOf(gl)}">{${c.icon}}</span><div><div class="tier t${tierOf(gl)}">${gl?TIER[tierOf(gl)]+(multi?' · '+ROMAN[gl]:''):TIER[0]}</div><h3>${c.name}</h3></div></div>`;
    if(gl)d+=`<div class="eff"><span class="lbl">now</span>${c.lv[gl-1].eff}</div>`;
    if(nx){d+=`<div class="eff next"><span class="lbl">${gl?'level '+ROMAN[gl+1]:'craft'}</span>${nx.eff}</div><div class="costs">${costChips(nx)}</div><button class="btn primary full" data-act="craft" data-k="${sel}" ${canPay(nx)?'':'disabled'}>${gl?'Upgrade to '+ROMAN[gl+1]:'Craft'}</button>`;}
    else d+=`<div class="eff"><span class="lbl">max</span>Fully upgraded {check}</div>`;}
  else if(sel==='bottle'){const n=BOTTLE_COST(),full=(SV.bottles||0)>=bottleMax();
    d+=`<div class="dt"><span class="ii big t1">{bottle}</span><div><div class="tier t1">${SV.bottles||0} / ${bottleMax()} carried</div><h3>Water bottle</h3></div></div><div class="eff">0.5 L each. Filled at the well before every trip – drink it out there whenever you need. A bigger backpack carries more.</div>`;
    d+=full?`<div class="eff"><span class="lbl">full</span>Upgrade the backpack to carry more.</div>`:`<div class="costs">${costChips(n)}</div><button class="btn primary full" data-act="bottle" ${canPay(n)?'':'disabled'}>Make a bottle</button>`;}
  else{const n=SMELT_COST;d+=`<div class="dt"><span class="ii big t3">{core}</span><div><div class="tier t3">Recipe</div><h3>Melt down scrap</h3></div></div><div class="eff">Turns a pile of scrap into one gold scrap. Expensive, but certain.</div><div class="costs">${costChips(n)}</div><button class="btn primary full" data-act="smelt" ${canPay(n)?'':'disabled'}>Melt</button>`;}
  return h+`<div class="detail">${d}</div>`;}
function openBuilding(k,keepScroll){
  const b=BLD[k],lvl=SV.b[k],n=nextLv(k);
  let h=(ST.sunink?`<div class="hroom"><img src="${(k==='dilna'&&lvl>0?hRoom('work'):hScene(k,lvl))||''}" alt=""></div><div class="bhead">`:`<div class="bhead"><div class="bimg"><img src="${snapBld(k,lvl)}" alt=""></div>`)+(ST.sunink?`<div class="bht"><h2>${b.name}</h2><div class="blv"><div class="kick">${lvl===0?'ruin':'level '+lvl+' of '+b.lv.length}</div>${pips(lvl,b.lv.length)}</div></div></div>`:`<div class="bht"><div class="kick">${lvl===0?'ruin':'level '+lvl+' of '+b.lv.length}</div><h2>${b.name}</h2>${pips(lvl,b.lv.length)}</div></div>`)+`<p class="bdesc">${b.desc}</p>`;
  // what the building does right now
  if(k==='cerpadlo')h+=`<div class="stat"><span>{water}</span><div><b>${Math.floor(SV.well)} / ${wellCap()} L</b> in the well<br><small>refills ${wellRate()} L/min</small></div></div>`;
  if(k==='solar')h+=`<div class="stat"><span>{energy}</span><div><b>${Math.floor(SV.energy||0)} / ${energyCap()}</b> in the battery<br><small>${energyRate()?'charges '+energyRate()+' energy/min':'not charging – repair the panels'}</small></div></div>`;
  if(k==='dron'&&lvl>0){if(SV.scout){const r=Math.max(0,Math.ceil((SV.scout.until-Date.now())/1000));h+=`<div class="stat"><span>{drone}</span><div><b>The drone is out</b><br><small>back in ${Math.floor(r/60)}:${String(r%60).padStart(2,'0')}</small></div></div>`;}
    else h+=`<div class="stat"><span>{drone}</span><div><b>Ready to fly</b><br><small>range ${fmtM(DRONE.range[lvl])} · maps ${fmtM(DRONE.r[lvl])} around the spot</small></div></div><button class="btn primary full" data-act="scout" ${(SV.energy||0)>=DRONE.cost[lvl]?'':'disabled'}>Send the drone · ${DRONE.cost[lvl]} {energy}</button>`;}
  if(k==='radio'&&lvl>0)h+=`<div class="msg">${MSGS[Math.max(0,Math.min(SV.msg,MSGS.length)-1)]||MSGS[0]}</div><p class="bdesc">On expeditions you can now see where the signal comes from. It is terribly far away.</p>`;
  if(k==='dilna'&&lvl>0)h+=workshopGrid();
  // repair / upgrade
  if(n)h+=`<div class="sect">${lvl===0?'Repair':'Next level'}</div><div class="upc"><div class="eff">${n.eff}</div><div class="costs">${costChips(n)}</div><button class="btn ${k==='dilna'&&lvl>0?'':'primary'} full" data-act="repair" data-k="${k}" ${canRepair(k)?'':'disabled'}>${lvl===0?'Repair':'Upgrade to level '+(lvl+1)}</button></div>`;
  else h+=`<div class="sect">Level</div><div class="upc"><div class="eff">Fully upgraded {check}</div></div>`;
  const sc=document.querySelector('#sheet .sh-in'),top=keepScroll&&sc?sc.scrollTop:0;
  openSheet(h,true);B.sel=k;if(sc)sc.scrollTop=top;
}
function openHouse(){
  openSheet((ST.sunink?`<div class="hroom"><img src="${hRoom('home')||''}" alt=""></div>`:'')+`<div class="kick" style="margin-bottom:6px">your home</div><div class="portraits"><figure><img src="${PORTRAIT[SV.sex==='f'?'f':'m']||''}" alt=""><figcaption>${SV.name||'Wanderer'} · Lv ${heroLv()}</figcaption></figure><figure><img src="${PORTRAIT.dog||''}" alt=""><figcaption>Zuro · Lv ${dogLv()}</figcaption></figure></div><h2>Home</h2><div class="lv">Expeditions: ${SV.exp} · farthest: ${fmtM(SV.best)}</div><p>This is where you and Zuro live. Zuro always brings you back.</p>
  <div class="eff"><b>${SV.name||'Wanderer'}</b> · level ${heroLv()}/30 &nbsp; · &nbsp; <b>Zuro</b> · level ${dogLv()}/15<br>Walked together: ${fmtMeters(SV.meters||0)} · Rescue keeps ${100-Math.round(rescueLoss()*100)} % of the load</div><div class="eff">Flask <b>${FLASK} L</b>${canteenCap()?' + canteen <b>'+canteenCap()+' L</b>':''} · Well <b>${Math.floor(SV.well)} / ${wellCap()} L</b> (+${wellRate()} L/min) · Backpack <b>${bagCap()}</b><br>Gear: ${Object.keys(SV.craft).filter(k=>CRAFT[k]&&gearLv(k)).map(k=>'{'+CRAFT[k].icon+'}'+(CRAFT[k].lv.length>1?' '+ROMAN[gearLv(k)]:'')).join(' &nbsp;')||'—'} · Camps found: ${CAMPS.filter(c=>SV.camps[c.id]).length}<br>Bottles: {bottle} ${SV.bottles||0} / ${bottleMax()} (${BOTTLE} L each)</div>
  <button class="btn full" data-act="reset" style="margin-top:8px">Start over completely</button>`,true);
}
function openSheet(h,page){if($('sheet').classList.contains('hidden'))sfx.ui('open');$('shBody').innerHTML=icx(h);$('sheet').classList.toggle('page',!!page);$('sheet').classList.remove('hidden');}
function closeSheet(){if(!$('sheet').classList.contains('hidden'))sfx.ui('close');$('sheet').classList.add('hidden');B.sel=null;}
$('shX').addEventListener('click',closeSheet);
$('shBody').addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');if(!t||t.disabled)return;const act=t.dataset.act,k=t.dataset.k;
  if(act==='repair')doRepair(k);
  if(act==='pick'){sfx.ui('select');B.wsel=k;openBuilding('dilna',true);}
  if(act==='craft'){const c=CRAFT[k],gl=gearLv(k),nx=c.lv[gl];if(nx&&canPay(nx)){pay(nx);SV.craft[k]=gl+1;save();sfx.repair();toast('{'+c.icon+'}',c.name+(c.lv.length>1?' '+ROMAN[gl+1]:''),nx.eff);refreshBaseUI();openBuilding('dilna',true);if(k==='kladivo'||k==='batoh')rebuildBaseChars();}}
  if(act==='scout'){closeSheet();openMap('scout');}
  if(act==='go'){startExpedition(k||null);}
  if(act==='fetch'){sendWolt();}
  if(act==='bottle'){const n=BOTTLE_COST();if((SV.bottles||0)<bottleMax()&&canPay(n)){pay(n);SV.bottles=(SV.bottles||0)+1;save();sfx.repair();toast('{bottle}','Water bottle','You can carry '+SV.bottles+' / '+bottleMax()+'. It gets filled at the well.');refreshBaseUI();openBuilding('dilna',true);}}
  if(act==='smelt'&&canPay(SMELT_COST)){pay(SMELT_COST);SV.cores++;save();sfx.core();toast('{core}','Gold scrap melted','The workshop robot hums happily.');refreshBaseUI();openBuilding('dilna',true);}
  if(act==='reset'){if(t.dataset.confirm){try{localStorage.removeItem(SAVE_KEY);}catch(_){}SV=freshSave();OBST.clear();SV.takenSet=new Set();save();closeSheet();enterBase();}
    else{t.dataset.confirm='1';t.textContent='Sure? Tap again – this erases all progress';}}
});
function doRepair(k){
  if(!canRepair(k))return;const n=nextLv(k);pay(n);SV.b[k]++;save();sfx.repair();
  const b=BLD[k];rebuildBuilding(k);const g=BS.bld[k];g.scale.setScalar(0.01);g.userData.pop=0;
  burst3(BS.scene,b.x*S,1.5,b.y*S,'#e0b04c',18,5);burst3(BS.scene,b.x*S,1.5,b.y*S,b.col,14,4);
  toast('{wrench}',b.name+(SV.b[k]===1?' repaired!':' upgraded!'),n.eff);refreshBaseUI();openBuilding(k,true);
  if(k==='radio'&&SV.b.radio===1&&SV.msg===0){SV.msg=1;save();setTimeout(()=>{if(B.sel==='radio')openBuilding('radio');toast('{radio}','A signal!','Somewhere far away, someone is alive.');},900);}
}
function renderDecorChips(){const el=$('dchips');el.innerHTML='';for(const k in DECOR){const d=DECOR[k];const b=document.createElement('button');b.className='chip'+(B.decorSel===k?' sel':'');b.innerHTML=icx(`<b>${d.icon}</b>${d.s} {scrap}`);
  b.addEventListener('click',()=>{B.decorSel=k;renderDecorChips();});el.appendChild(b);}}
$('bDecor').addEventListener('click',()=>{closeSheet();B.decorMode=true;B.decorSel=B.decorSel||'kvetiny';renderDecorChips();$('bbar').classList.add('hidden');$('decorBar').classList.remove('hidden');BS.decorRing.visible=true;});
$('bDecorDone').addEventListener('click',()=>{B.decorMode=false;BS.decorRing.visible=false;$('decorBar').classList.add('hidden');$('bbar').classList.remove('hidden');refreshBaseUI();});
function inVillage(x,y){return (x*x)/(165*165)+((y-10)*(y-10))/(255*255)<1;}
function placeDecor(x,y){
  const d=DECOR[B.decorSel];if(!d)return;
  if(SV.scrap<d.s){toast('{scrap}','Not enough scrap','This decoration costs '+d.s+' {scrap}.');return;}
  if(!inVillage(x,y)){toast('{desert}','Outside the village','You can only decorate inside the village.');return;}
  if(Math.abs(x)<40&&y>-30&&y<38)return;
  for(const k in BLD){if(Math.hypot(x-BLD[k].x,y-BLD[k].y)<42)return;}
  for(const o of SV.decor){if(Math.hypot(o.x-x,o.y-y)<12)return;}
  SV.scrap-=d.s;SV.decor.push({t:B.decorSel,x:Math.round(x),y:Math.round(y)});save();sfx.place();rebuildDecor();
  burst3(BS.scene,x*S,0.8,y*S,'#e0b04c',8,3);refreshBaseUI();
}
function baseCamera(){
  const w=ST.sunink?33:36;const H=w/ASP;const el=ST.sunink?0.80:0.95;const tz=1+(H/Math.sin(el))*0.04;
  if(window.__cam)orthoView(window.__cam[0],window.__cam[1],window.__cam[2],window.__cam[3]||el);else if(scene==='title'&&ST.sunink)orthoView(0.4,4.6,15,0.66);else orthoView(0,tz,w,el);placeSun(BS.sun,0,0);if(ST.sunink){BS.scene.fog.near=CAMDIST+4;BS.scene.fog.far=CAMDIST+90;}else{BS.scene.fog.near=CAMDIST+60;BS.scene.fog.far=CAMDIST+160;}
}
function droneMini(){const g=grp();part(G.box,'#3a3430',0,0,0,0.9,0.25,0.9,g);part(G.box,'#b8322b',0,0.16,0,0.5,0.12,0.5,g);
  for(const [x,z] of [[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]]){part(G.cyl,'#5d6168',x,0.05,z,0.08,0.18,0.08,g);const r=part(G.box,'#c9c2b4',x,0.15,z,0.9,0.02,0.1,g);r.userData.rotor=1;}
  const l=part(G.sph,TM('#ffe08a',{emissive:'#ffb84a',emissiveIntensity:1}),0,-0.15,0.42,0.12,0.08,0.12,g,true);return g;}
function updDroneFly(){const m=SV.scout,b=BLD.dron;if(!BS.scene)return;
  if(!m){if(BS.fly){BS.scene.remove(BS.fly);BS.fly=null;}return;}
  if(!BS.fly||BS.fly.parent!==BS.scene){BS.fly=droneMini();BS.scene.add(BS.fly);}
  const now=Date.now(),T0=4500,out=now-m.start,back=m.until-now,a=Math.atan2(m.x-b.x,m.y-b.y);let k=-1;
  if(out<T0)k=out/T0;else if(back<T0)k=back/T0;
  BS.fly.visible=k>=0;if(k<0)return;const e=k*k,bx=b.x*S,bz=b.y*S;
  BS.fly.position.set(bx+Math.sin(a)*e*60,3+Math.min(1,k*3)*4+e*10,bz+Math.cos(a)*e*60);BS.fly.rotation.y=a;
  BS.fly.children.forEach(c=>{if(c.userData.rotor)c.rotation.y+=0.9;});}
function updateBase(dt){
  applyDay(BS.scene,BS.sun);baseCamera();updWisps(BS.wisps,dt,0,2,29);updDroneFly();
  const t=tNow;
  const tq=TQ();
  if(BS.hero&&window._cheer){window._cheer=0;heroPlay(BS.hero,'yes',1);}
  if(BS.hero){BS.hero.idleK=Math.floor(tq/9)%3===2?'fold':'idle';heroPose(BS.hero,tq,false);blinkFace(BS.hero,BS.dog,tq,Math.floor(tq/5)%4===3?'happy':'idle',Math.floor(tq/4)%3===2?'happy':'idle');if(BS.dog)dogPose(BS.dog,tq,'idle',0);}
  for(const k in BS.bots){animBot(BS.bots[k],tq);BS.bots[k].g.rotation.y=Math.sin(t*0.4+k.length)*0.6;}
  for(const p of BS.palms)p.rotation.z=Math.sin(t*0.9+p.parent.position.x)*0.05;
  const gi=BS.gInst,ng=Math.min(gi.N,4+totalLevels()*9+(SV.b.sklenik?22:0)+SV.decor.length*2);gi.discs.count=ng;gi.blades.count=ng*3;gi.flowers.count=ng?BS.flowerPrefix[ng-1]:0;
  for(const k in BS.bld){const g=BS.bld[k],a=g.userData.anim;
    if(g.userData.pop!==undefined){g.userData.pop+=dt*2.2;const p=g.userData.pop;const s=p>=1?1:1+Math.sin(p*Math.PI)*0.25*(1-p)+ (p<1?(p-1):0)*0+0;g.scale.setScalar(p>=1?1:clamp(p*1.15,0.01,1.15));if(p>=1.2){g.scale.setScalar(1);delete g.userData.pop;}}
    if(g.userData.ring){const ok=canRepair(k);g.userData.ring.visible=ok;if(ok){const s=1+Math.sin(t*4)*0.06;g.userData.ring.scale.set(7*s,1,4.4*s);}}
    if(!a)continue;
    if(a.drop){const dp=(t*1.1)%1;a.drop.position.y=1.3-dp*1.2;a.drop.visible=dp<0.92;}
    if(a.gear)a.gear.rotation.y=t*2;
    if(a.drone)a.drone.visible=!(k==='dron'&&SV.scout);// the drone leaves its pad while it scouts (Robin 20. 11.)
    if(a.drone&&a.drone.visible){a.drone.position.set(Math.sin(t*0.7)*1.6,3+Math.sin(t*2)*0.3,Math.cos(t*0.5)*0.8);a.drone.rotation.y=t*0.8;}
    if(a.rotors)for(const r of a.rotors)r.rotation.y=t*31;
    if(a.balloon){a.balloon.position.y=5.2+Math.sin(t*0.8)*0.15;a.balloon.rotation.y=Math.sin(t*0.3)*0.2;}
    if(a.light){const on=Math.sin(t*3)>0;a.light.material.emissiveIntensity=on?1.4:0.1;}
  }
  const sm=SV.b.dilna>0;const ch0=BS.bld.dilna&&BS.bld.dilna.userData.anim&&BS.bld.dilna.userData.anim.chimney;
  for(const p of BS.smoke){p.visible=sm&&!!ch0;if(!p.visible)continue;p.userData.t=(p.userData.t+dt/3)%1;const k=p.userData.t;
    p.position.set(BLD.dilna.x*S+ch0.x+k*1.6,ch0.y+k*4,BLD.dilna.y*S+ch0.z-k*0.5);p.scale.setScalar(0.6+k*1.8);p.material.opacity=0.7*(1-k);}
  if(BOT&&scene==='base')botBase(dt);
}
function drawBaseOverlay(){
  // no names or labels in the village – only a small pulsing marker where something can be repaired or upgraded (Robin 20. 11.)
  for(const k in BLD){const b=BLD[k],lvl=SV.b[k],n=nextLv(k);if(!n||!canRepair(k))continue;
    const q=proj(b.x*S,lvl?5:3,b.y*S);if(!q.on)continue;const pu=0.5+0.5*Math.sin(tNow*4);ctx.fillStyle=ST.sunink?`rgba(255,250,243,${0.9+0.1*pu})`:`rgba(29,26,24,${0.8+0.2*pu})`;ctx.beginPath();ctx.arc(q.x,q.y-pu*3*dpr,11*dpr,0,6.283);ctx.fill();
    ctx.strokeStyle=ST.sunink?'rgba(90,61,52,0.9)':'rgba(255,211,110,0.95)';ctx.lineWidth=(ST.sunink?1.5:2)*dpr;ctx.stroke();{const iz=14*dpr,im=ICIMG[lvl?'levelup':'wrench'];if(im&&im.complete)ctx.drawImage(im,q.x-iz/2,q.y-pu*3*dpr-iz/2,iz,iz);}}
}

// ===================================================================
// ========================= EXPEDITION ==============================
// ===================================================================
// ===== enemies (Robin 20. 11.): guard drones circle gold scrap, seekers patrol the far desert. Fair detection: a cone you can see,
// a '?' that fills up before the '!' – and if they get you, you're knocked out and Zuro drags you home (same as running dry).
const FOE={drone:{hp:3,R:62,A:0.42,tDet:0.85,chip:1},bot:{hp:4,R:78,A:0.5,tDet:0.7,chip:1}};
const foeDead=id=>SV.scrapT[id]!==undefined&&SV.exp-SV.scrapT[id]<8;
function newFoe(type,id,x,y,o){const F=FOE[type];return Object.assign({type,id,x,y,dir:0,hp:F.hp,hpMax:F.hp,R:F.R,A:F.A,tDet:F.tDet,stun:0,alert:0,chase:0,cool:0},o);}
function genChunk(cx,cy,noMesh){
  const rng=mulberry32(hash3(SV.seed,cx,cy));
  const ox=cx*CH,oy=cy*CH,dist=Math.hypot(ox+CH/2,oy+CH/2);
  const bio=biomeAt(ox+CH/2,oy+CH/2);// 0 dunes, 1 salt flats, 2 red rocks, 3 old town
  const Pp=m=>{m=m||0;return {x:ox+m+rng()*(CH-2*m),y:oy+m+rng()*(CH-2*m)};};
  const id=(t,i)=>cx+','+cy+','+t+i;const tk=s=>SV.takenSet.has(s);
  const c={cx,cy,bio,rocks:[],scrap:[],wrecks:[],crates:[],waters:[],cacti:[],fata:[],dust:[],ruins:[],props:[],camps:[],foes:[]};
  // rocks removed from the landscape (Robin 20. 11.: they did nothing and you walked through them)
  // biome props
  if(bio===1){const n=2+Math.floor(rng()*4);for(let i=0;i<n;i++)c.props.push({...Pp(),t:'salt',sd:rng()*999});if(rng()<0.6)c.props.push({...Pp(30),t:'brine',r:14+rng()*10});}
  if(bio===3){const n=1+Math.floor(rng()*3);for(let i=0;i<n;i++)c.props.push({...Pp(20),t:'rubble',sd:rng()*999});}
  // scrap – denser than before so a longer trip is worth it (Robin 19. 11.)
  // Robin 20. 11.: a bit less scrap – sparse near home, more value further out
  const ns=Math.max(1,(dist<420?2+Math.floor(rng()*2):3+Math.floor(rng()*2))+(bio===3?1:0)-(bio===1?1:0));
  for(let i=0;i<ns;i++){const p=Pp(),v=1+Math.floor(rng()*(1.6+dist/700)),sid=id('s',i),ph=rng()*6,tt=SV.scrapT[sid];if(tt===undefined||SV.exp-tt>=6)c.scrap.push({id:sid,...p,v,ph});}
  // wrecks: motorbikes near home, cars further, helicopters far away
  if(dist>200&&rng()<(bio===3?0.55:0.32)){const p=Pp(30),sid=id('w',0),wt=SV.scrapT[sid];const q=rng()+Math.min(0.5,dist/4000);
    let kind=q<0.6?2:q<0.95?0:1;if(dist>1600&&rng()<0.22)kind=3;const W=WRECK[kind];const v=W.s[0]+Math.floor(rng()*(W.s[1]-W.s[0]+1));let gold=Math.floor(W.g)+(rng()<W.g%1?1:0);if(kind===1&&rng()<0.5)gold++;
    if(!tk(sid)&&(wt===undefined||SV.exp-wt>=8))c.wrecks.push({id:sid,...p,v,gold,kind,ph:rng()*6});}
  if(dist>160&&rng()<0.28){const p=Pp(20),sid=id('c',0),ph=rng()*6;if(!tk(sid))c.crates.push({id:sid,...p,ph});}
  // puddles are rare now (Robin 20. 11.) – but worth more, and the drone/map shows them so you can plan a route
  if(rng()<(bio===1?0.04:0.09)){const p=Pp(),wid=id('p',0);c.waters.push({id:wid,...p,r:12+rng()*4,v:0.8,ph:rng()*6,taken:SV.scrapT[wid]!==undefined&&SV.exp-SV.scrapT[wid]<4});}
  // cacti removed from the desert (Robin 20. 11.: the dead trees and rocks do that job now); rng call kept so the rest of the chunk stays put
  rng();
  // mirages removed (Robin 20. 11.)
  // dead zones removed (Robin 20. 11.)
  if(dist>380&&rng()<(bio===3?0.3:0.15)){const p=Pp(60),walls=[];const nwl=4+Math.floor(rng()*3);
    for(let i=0;i<nwl;i++){const a=i/nwl*6.283+rng()*0.4,rr=34+rng()*10;walls.push({x:p.x+Math.cos(a)*rr,y:p.y+Math.sin(a)*rr*0.8,w:14+rng()*12,h:8+rng()*6});}
    const sid=id('r',0);const ru={x:p.x,y:p.y,walls,core:tk(sid)?null:{id:sid,x:p.x,y:p.y}};c.ruins.push(ru);
    const fid=id('d',0),a0=rng()*6.28,sp0=0.55+rng()*0.25;if(!foeDead(fid))c.foes.push(newFoe('drone',fid,p.x,p.y,{cx:p.x,cy:p.y,r:62,a:a0,spd:sp0,ruin:ru}));}
  // seekers: ground robots patrolling far out in the desert (Robin 20. 11.)
  if(dist>520&&rng()<(bio===3?0.3:bio===2?0.22:0.13)){const p=Pp(50),a=rng()*Math.PI,L=40+rng()*30,fid=id('b',0);
    if(!foeDead(fid))c.foes.push(newFoe('bot',fid,p.x,p.y,{wp:[{x:p.x-Math.cos(a)*L,y:p.y-Math.sin(a)*L},{x:p.x+Math.cos(a)*L,y:p.y+Math.sin(a)*L}],i:1,pause:0,dir:a}));}
  STARTERS.forEach((q,i)=>{if(q.x>=ox&&q.x<ox+CH&&q.y>=oy&&q.y<oy+CH){const sid='k'+i;if(!tk(sid))c.crates.push({id:sid,x:q.x,y:q.y,ph:i,core:i<2});}});
  for(const cp of CAMPS)if(cp.x>=ox&&cp.x<ox+CH&&cp.y>=oy&&cp.y<oy+CH)c.camps.push(cp);
  c.obst=obstOf(cx,cy);

  const clear=(o,m)=>!c.obst.some(ob=>segPt(o.x,o.y,ob).d<ob.r+(m||10))&&coastSD(o.x,o.y).d>(m||10)+14;
  c.ruins=c.ruins.filter(r=>clear(r,70));
  c.foes=c.foes.filter(f=>f.ruin?c.ruins.includes(f.ruin):(f.wp.every(w=>walkable(w.x,w.y)&&Math.hypot(w.x,w.y)>300&&!CAMPS.some(cp=>Math.hypot(w.x-cp.x,w.y-cp.y)<90))));
  const far=o=>Math.hypot(o.x,o.y)>95;const offCamp=o=>!CAMPS.some(cp=>Math.hypot(o.x-cp.x,o.y-cp.y)<40);
  for(const k of ['scrap','cacti','waters','rocks','crates','props','wrecks','fata','dust'])c[k]=c[k].filter(o=>far(o)&&offCamp(o)&&(o.rim||clear(o,k==='wrecks'?(o.kind===3?80:40):k==='dust'?0:12)));
  if(!noMesh)buildChunkMeshes(c);
  return c;
}
function H2(x,y){return Hd(x*S,y*S);}
function buildChunkMeshes(c){
  const g=grp(0,0,0,X.scene);c.g=g;
  const size=CH*S,ox=c.cx*size,oz=c.cy*size;
  const hasOb=c.obst&&c.obst.some(o=>o.D>0);const shore=coastSD(c.cx*CH+CH/2,c.cy*CH+CH/2).d;const SEG=hasOb||Math.abs(shore)<CH*1.0?72:24,geo=new T.PlaneGeometry(size,size,SEG,SEG);geo.rotateX(-Math.PI/2);geo.translate(ox+size/2,0,oz+size/2);
  const pos=geo.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,Hd(pos.getX(i),pos.getZ(i)));
  const gn=geo;const gp=gn.attributes.position;const cols=new Float32Array(gp.count*3);
  const BC=BIOME_COL.map(C),dust=C(DUSTC),home=C(PLAZA),OB_WALL=C('#8e6648'),OB_FLOOR=C('#a88663'),WET=C(ST.sunink?'#d7b497':'#b88f5c'),FOAM=C(ST.sunink?'#ffffff':'#f4f8f2'),SHAL=C(ST.sunink?'#73d1e2':'#6fc2c6'),DEEP=C(ST.sunink?'#089bbf':'#2f7f95');
  const nearSea=coastSD(c.cx*CH+CH/2,c.cy*CH+CH/2).d<CH*1.2;
  for(let i=0;i<gp.count;i++){const x=gp.getX(i),z=gp.getZ(i);const bw=biomeW(x/S,z/S);let col=new T.Color(0,0,0);for(let b=0;b<4;b++)if(bw[b]>0){col.r+=BC[b].r*bw[b];col.g+=BC[b].g*bw[b];col.b+=BC[b].b*bw[b];}
    for(const d of c.dust){const q=Math.hypot(x-d.x*S,z-d.y*S)/(d.r*S);if(q<1)col.lerp(dust,1-smooth(0.72,1,q));}
    const r=Math.hypot(x,z);if(r<9.5)col.lerp(home,1-smooth(8.2,9.2,r));
    if(nearSea){const cs=coastSD(x/S,z/S).d;if(cs<34){const sand=col.clone();if(cs>10)col.lerp(WET,(34-cs)/24*0.7);else{const wet=sand.clone().lerp(WET,0.7),water=SHAL.clone().lerp(DEEP,smooth(-14,-170,cs));const foam=1-smooth(2,9,Math.abs(cs+2));col.copy(cs>-2?wet:water).lerp(wet,cs>-2?0:smooth(-12,-2,cs)*0).lerp(FOAM,foam*0.9);if(cs<=-2&&cs>-12)col.lerp(SHAL,0.0);}}}
    if(hasOb){const h=Hd(x,z);if(h<0)col.lerp(OB_WALL,Math.min(1,-h/1.1)*0.6).lerp(OB_FLOOR,smooth(1.6,2.6,-h)*0.5);}
    cols[i*3]=col.r;cols[i*3+1]=col.g;cols[i*3+2]=col.b;}
  gn.setAttribute('color',new T.BufferAttribute(cols,3));gn.computeVertexNormals();worldUV(gn);
  // smooth normals across chunk seams: use analytic normal from the height field
  {const nr=gn.attributes.normal,e=0.25;for(let i=0;i<gp.count;i++){const x=gp.getX(i),z=gp.getZ(i);const dx=Hd(x+e,z)-Hd(x-e,z),dz=Hd(x,z+e)-Hd(x,z-e);const v=new T.Vector3(-dx,2*e,-dz).normalize();nr.setXYZ(i,v.x,v.y,v.z);}nr.needsUpdate=true;}
  const gm=new T.Mesh(gn,X.groundMat);gm.receiveShadow=true;gm.castShadow=!!hasOb;g.add(gm);c.ground=gm;
  const at=(m,x,y)=>{m.position.set(x*S,H2(x,y),y*S);g.add(m);return m;};
  for(const o of c.obst)if(o.solid){const m=o.t==='tree'?makeNatTree(1.15+(o.r-6)*0.18,o.sd):makeNatRock(o.r*S,o.sd);m.rotation.y=(o.sd%628)/100;at(m,o.x0,o.y0);}
  for(const r of c.rocks)at(r.big?makeBoulder(r.r*S*0.9,r.x):makeRock(r.r*S*1.2,r.x),r.x,r.y);
  for(const p of c.props){if(p.t==='salt')at(makeSaltCrystals(p.sd),p.x,p.y);else if(p.t==='brine')at(makeBrine(p.r*S),p.x,p.y);else if(p.t==='rubble'){const m=at(makeRubble(p.sd),p.x,p.y);m.rotation.y=p.sd;}}
  for(const cp of c.camps){cp.m=at(makeCamp(!!SV.camps[cp.id]),cp.x,cp.y);}
  for(const s of c.scrap){s.m=at(makeScrap(s.v,s.ph*1000),s.x,s.y);}
  for(const k of c.cacti){k.m=at(makeCactus(k.h*S*1.3,false),k.x,k.y);}
  for(const w of c.wrecks){w.m=at(makeWreck(w.kind),w.x,w.y);w.m.rotation.y=w.ph||w.x;if(w.gold>0){w.glow=makeGoldCog(0.75);w.glow.position.set(1.9,0,1.4);w.m.add(w.glow);}}
  for(const k of c.crates){k.m=at(makeCrate(),k.x,k.y);k.m.rotation.y=k.ph;}
  for(const w of c.waters){w.m=at(makePuddle(w.r),w.x,w.y);}
  for(const f of c.fata){f.m=at(makePuddle(f.r),f.x,f.y);if(0){f.m.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=0.18;}});}}
  for(const r of c.ruins){const h=H2(r.x,r.y);const floor=part(G.disc24,ST.sunink?M('#fffaf3',{depthWrite:false,pat:0}):'#c4b096',r.x*S,h+(ST.sunink?0.03:0.05),r.y*S,10,1,8,g,true);floor.receiveShadow=true;if(ST.sunink)floor.renderOrder=1;
    if(ST.sunink)for(const w of r.walls){const rd=v=>Math.max(0.3,Math.round(v*20)/20),hh=rd(1.5+((w.x*7)%10)/8),ww=rd(w.w*S),dd=rd(w.h*S),y0=H2(w.x,w.y);part(rbox(ww,hh,dd,0.09),((w.x*3)%10)<3?HP.wallS:HP.wall,w.x*S,y0+hh/2,w.y*S,1,1,1,g);part(rbox(rd(ww+0.14),0.16,rd(dd+0.14),0.05),HP.trim,w.x*S,y0+hh,w.y*S,1,1,1,g);}
    else for(const w of r.walls){const m=part(G.box,'#a68f78',w.x*S,H2(w.x,w.y)+0.9,w.y*S,w.w*S,1.8+((w.x*7)%10)/10,w.h*S,g);part(G.box,'#bba58c',w.x*S,H2(w.x,w.y)+1.85+((w.x*7)%10)/20,w.y*S,w.w*S+0.1,0.15,w.h*S+0.1,g);}
    if(r.core){r.cm=makeCore();r.cm.position.set(r.x*S,h,r.y*S);g.add(r.cm);}
}
  for(const f of c.foes){const m=f.type==='drone'?makeDrone(f.R*S,f.A):makeSeeker(f.R*S,f.A);m.g.position.set(f.x*S,0,f.y*S);g.add(m.g);g.add(m.cone);f.m=m;}
}
function disposeChunk(c){X.scene.remove(c.g);if(c.ground)c.ground.geometry.dispose();}
function xchunk(cx,cy){const k=cx+','+cy;let c=X.chunks.get(k);if(!c){c=genChunk(cx,cy);X.chunks.set(k,c);}return c;}
function forX(x0,y0,x1,y1,fn,noCreate){const a=Math.floor(x0/CH),b=Math.floor(x1/CH),c0=Math.floor(y0/CH),d=Math.floor(y1/CH);
  for(let cy=c0;cy<=d;cy++)for(let cx=a;cx<=b;cx++){if(noCreate){const c=X.chunks.get(cx+','+cy);if(c)fn(c);}else fn(xchunk(cx,cy));}}
function removeObj(c,o){if(o.m){o.m.parent&&o.m.parent.remove(o.m);o.m=null;}}

function buildExpScene(){
  const sc=new T.Scene();sc.background=C(ST.bg||'#efd3a0');sc.fog=new T.Fog(C(ST.bg||'#efd3a0'),60,140);
  X.scene=sc;X.sun=setupLights(sc);X.groundMat=MAT({vertexColors:true,map:sandTex()});X.wisps=makeWisps(sc,10);X.hglow=glowPool('#ff9a40',9);X.hglow.userData.g0=0.5;sc.add(X.hglow);
  // home mini village at origin
  const hg=grp(0,0,0,sc);const h=makeHouse();h.scale.setScalar(0.62);hg.add(h);
  // (no fence around home – the village is an open oasis)
  let i=0;for(const k in BLD){if(!SV.b[k])continue;const a=-2.5+i*0.72;i++;const bx=Math.cos(a)*5.2,bz=Math.sin(a)*4;
    if(ST.sunink){const b=makeBuilding(k,SV.b[k]);b.scale.setScalar(0.34);b.position.set(bx*1.15,0,bz*1.15);b.rotation.y=BLD[k].rot||0;hg.add(b);}
    else{part(G.box,P.wall2,bx,0.5,bz,1.4,1,1.1,hg);part(G.box,BLD[k].col,bx,1.08,bz,1.6,0.16,1.3,hg);}}
  // hero + Zuro
  X.hero=makeHero(heroGear());X.hero.root.rotation.order='YXZ';sc.add(X.hero.root);
  X.dog=makeDog(dogGear());X.dog.root.rotation.order='YXZ';sc.add(X.dog.root);
  X.destM=part(G.ring,new T.MeshBasicMaterial({color:C('#c8643c'),transparent:true,opacity:0.8,depthWrite:false}),0,0,0,1.6,1,1.6,sc,true);X.destM.visible=false;
  X.wreckRing=part(G.ring,new T.MeshBasicMaterial({color:C('#c8643c'),transparent:true,opacity:0.9,depthWrite:false}),0,0,0,3,1,3,sc,true);X.wreckRing.visible=false;
  // footprints
  const fpG=new T.CircleGeometry(0.5,16);fpG.rotateX(-Math.PI/2);
  X.foot=new T.InstancedMesh(fpG,new T.MeshBasicMaterial({color:C('#b58d5c'),transparent:true,opacity:0.28,depthWrite:false}),500);X.foot.count=0;X.footI=0;sc.add(X.foot);
  // bags
  X.bagMeshes=[];for(const b of SV.bags){const m=makeBag();m.position.set(b.x*S,H2(b.x,b.y),b.y*S);sc.add(m);b._m=m;X.bagMeshes.push(m);}
}
function disposeExp(){if(!X||!X.scene)return;for(const c of X.chunks.values())disposeChunk(c);X.scene=null;}

function startExpedition(campId){
  const cp=campId?CAMPS.find(c=>c.id===campId&&SV.camps[c.id]):null;const trip=cp?cp.trip:0;
  if(SV.fetch){toast('{paw}','Zuro is still out','He is fetching your lost bag. Wait until he is back.');return;}
  if(SV.well<trip+0.5){toast('{water}','The well is almost dry','Wait a moment – the pump is refilling it.');return;}
  SV.well-=trip;const fill=Math.min(waterCap(),Math.floor(SV.well*10)/10);SV.well-=fill;const nb=Math.min(SV.bottles||0,Math.floor(SV.well/BOTTLE));SV.well-=nb*BOTTLE;save();
  ZOOM=viewW();closeSheet();initAudio();
  const sx=cp?cp.x:0,sy=cp?cp.y+34:105;
  X={t:0,x:sx,y:sy,start:{x:sx,y:sy},camp:cp,dest:null,water:fill,cap:waterCap(),scrap:0,cores:0,chips:0,shots:[],cacheM:{},slingCd:0,smashCd:0,foeWarn:{},face:1,walkPh:0,moving:false,vx:0,vy:1,
    path:[{x:sx,y:sy}],pathAcc:0,footAcc:0,events:[],maxD:0,end:null,endT:0,hitCd:0,fullCd:0,chunks:new Map(),
    leftHome:false,inDust:false,bottles:nb,lore:null,camStart:null,botT:0,botDir:Math.atan2(sy,sx||0.001)+(Math.random()-0.5)*2.5,
    walked:0,face:Math.PI,dx:sx+12,dy:sy+15,dface:Math.PI,dmoving:false,dph:0,lv0:[heroLv(),dogLv()],dis:null};
  buildExpScene();scene='exp';scene3=X.scene;
  forX(X.x-CH*2,X.y-CH*2,X.x+CH*2,X.y+CH*2,()=>{});
  camT.set(sx*S,0,sy*S+1.5);
  if(cp){X.intro={t:0};const lg=new T.BufferGeometry().setFromPoints([new T.Vector3(0,0.3,0),new T.Vector3(cp.x*S,0.3,cp.y*S)]);
    const ln=new T.Line(lg,new T.LineDashedMaterial({color:C('#c8643c'),dashSize:2,gapSize:1.2,transparent:true,opacity:0.9,depthTest:false}));ln.computeLineDistances();ln.renderOrder=10;X.scene.add(ln);X.introLine=ln;
    toast('{home}','Off to '+cp.name,'The trip took '+trip+' L of well water.');}
  $('bhud').classList.add('hidden');$('bbar').classList.add('hidden');$('decorBar').classList.add('hidden');$('sum').classList.add('hidden');
  $('xhud').classList.remove('hidden');updateMelonBtn();X._act='';
}
function updCombatBtns(){const b=$('bSling'),show=false;
  b.classList.add('hidden');
  const d=$('bDrop'),sd=scene==='exp'&&X&&!X.end&&X.bottles>0&&Math.hypot(X.x,X.y)>140;d.classList.toggle('hidden',!sd);}
function updateMelonBtn(){const b=$('bMelon');if(scene==='exp'&&X&&!X.end&&X.bottles>0){b.classList.remove('hidden');$('mCnt').textContent=X.bottles;}else b.classList.add('hidden');}
$('bSling').addEventListener('click',e=>{e.stopPropagation();slingShoot();});
onPressLater.push(()=>onPress($('bDrop'),()=>dropCache()));
onPressLater.push(()=>onPress($('bMelon'),()=>{if(!X||X.end||X.bottles<=0)return;if(X.cap-X.water<0.15){xText('Flask is full','#3f8fa1');return;}X.bottles--;X.water=Math.min(X.cap,X.water+BOTTLE);sfx.drink();heroPlay(X.hero,'drink',1.5);xText('+0.5 L {bottle}','#3f8fa1');updateMelonBtn();}));
function xText(t,c){float3(X.x*S,H2(X.x,X.y)+3.2,X.y*S,t,c);}
function xBurst(x,y,col,n,s){burst3(X.scene,x*S,H2(x,y)+0.6,y*S,col,n,(s||80)/22);}
const weight=()=>X.scrap+X.cores*2+(X.chips||0);
const room=()=>Math.max(0,bagCap()-weight());
function fullMsg(){if(X.fullCd<=0){xText('Backpack full','#c0532f');X.fullCd=1.5;}}
// fixed exploration view: wider than before; Haze Goggles and the Scout Drone widen it further
function viewW(){return ST.sunink?16:17.5;}
function sightR(){return 220*((ST.sunink?ZOOM*1.094:ZOOM)/14)*(1-0.28*DAY.n);}

const WATER_PER_U=0.00042;// litres per game unit walked (≈ 2.4 km per litre out and back… with weight and heat less)
function safePoint(){let best={x:0,y:0,d:Math.hypot(X.x,X.y)};for(const cp of CAMPS)if(SV.camps[cp.id]){const d=Math.hypot(X.x-cp.x,X.y-cp.y);if(d<best.d)best={x:cp.x,y:cp.y,d};}return best;}
const slingReady=()=>{const l=gearLv('prak'),f=X.foeNear;return l&&f&&!f.dead&&X.foeNearD<=SLING.range(l);};
function xAction(){if(!X||X.end||X.intro)return;
  if(X.nearFoe&&gearLv('kladivo')){smash();return;}
  if(slingReady()){slingShoot();return;}
  if(X.nearWreck&&!X.dis){const W=WRECK[X.nearWreck.kind];if(gearLv('kladivo')<W.need){xText('Needs {hammer} Hammer '+ROMAN[W.need],'#c8643c');return;}if(room()<=0){fullMsg();return;}X.dis={w:X.nearWreck,c:X.nearWreckC,t:0};X.dest=null;sfx.clink();return;}
  if(X.nearCamp&&!SV.camps[X.nearCamp.id]){const cp=X.nearCamp;if(X.scrap<CAMP_COST){xText('Need '+CAMP_COST+' {scrap}','#c0532f');return;}
    X.scrap-=CAMP_COST;SV.camps[cp.id]=1;save();sfx.repair();xBurst(cp.x,cp.y,'#e0b04c',20,100);
    if(cp.m&&cp.m.parent){const par=cp.m.parent,pos=cp.m.position.clone();par.remove(cp.m);cp.m=makeCamp(true);cp.m.position.copy(pos);par.add(cp.m);}
    toast('{home}',cp.name+' built!','From home you can now travel here in one tap ('+cp.trip+' L from the well).');X.events.push({x:cp.x,y:cp.y,t:'camp'});}
}
function finishDismantle(){const w=X.dis.w,c=X.dis.c;let tg=0;
  // better hammer = more out of every wreck (Robin 20. 11.): more scrap, a chance of extra gold, planes may hold circuits
  if(!w.boost){w.boost=1;const hl=gearLv('kladivo');w.v=Math.ceil(w.v*hammerYield(hl));if(Math.random()<0.07*(hl-1))w.gold++;w.chips=(WRECK[w.kind].chip&&Math.random()<WRECK[w.kind].chip+0.03*hl)?1+(Math.random()<0.25?1:0):0;}
  let tx=0;while(w.chips>0&&room()>=1){w.chips--;X.chips++;tx++;}while(w.gold>0&&room()>=2){w.gold--;X.cores++;tg++;}
  const ts=Math.min(room(),w.v);X.scrap+=ts;w.v-=ts;sfx.clink();if(tg)sfx.core();xBurst(w.x,w.y,'#a0623c',16,95);if(tg)xBurst(w.x,w.y,'#f2c14e',12,90);
  if(ts||tg||tx){xText((ts?'+'+ts+' {scrap}':'')+(tg?'  +'+tg+' {core}':'')+(tx?'  +'+tx+' {chip}':''),'#5d6168');X.events.push({x:w.x,y:w.y,t:'wreck'});}
  if(w.gold<=0&&w.glow){w.glow.parent&&w.glow.parent.remove(w.glow);w.glow=null;}
  if(w.v<=0&&w.gold<=0&&!(w.chips>0)){const i=c.wrecks.indexOf(w);if(i>=0)c.wrecks.splice(i,1);SV.scrapT[w.id]=SV.exp;removeObj(c,w);X.nearWreck=null;}
  else if(room()<=0)xText('Backpack full – the rest stays here','#c0532f');}
function autopilotX(dt){
  const sp=safePoint(),hd=sp.d,wr=weight()/bagCap();
  const per=(WATER_PER_U*(1+0.6*wr))*(X.inDust&&!SV.craft.maska?2:1);const need=hd*per*1.35+0.1;
  if(X.nearWreck&&!X.dis&&gearLv('kladivo')>=WRECK[X.nearWreck.kind].need&&room()>0)xAction();
  if(X.nearCamp&&!SV.camps[X.nearCamp.id]&&X.scrap>=CAMP_COST+4)xAction();
  if(X.dis){X.dest=null;return;}
  if(X.water<need&&X.bottles>0&&X.water<X.cap*0.3){X.bottles--;X.water=Math.min(X.cap,X.water+BOTTLE);updateMelonBtn();}
  if(X.water<need||room()<=0){X.dest={x:sp.x,y:sp.y};return;}
  const sr=sightR();let tgt=null,bd=1e9;
  forX(X.x-sr*2,X.y-sr*2,X.x+sr*2,X.y+sr*2,c=>{for(const k of c.crates){if(Math.hypot(k.x,k.y)<180)continue;const d=Math.hypot(k.x-X.x,k.y-X.y);if(d<sr*2&&d*0.45<bd){bd=d*0.45;tgt=k;}}});
  forX(X.x-sr,X.y-sr,X.x+sr,X.y+sr,c=>{
    const con=(o,w)=>{if(Math.hypot(o.x,o.y)<180)return;const d=Math.hypot(o.x-X.x,o.y-X.y);if(d<sr&&d*w<bd){bd=d*w;tgt=o;}};
    for(const s of c.scrap)con(s,1);for(const w of c.wrecks)if(gearLv('kladivo')>=WRECK[w.kind].need)con(w,0.7);for(const k of c.crates)con(k,0.8);for(const cp of c.camps)if(!SV.camps[cp.id]&&X.scrap>=CAMP_COST+4)con(cp,0.5);
    if(X.water/X.cap<0.6){for(const w of c.waters)if(!w.taken)con(w,0.5);}
    for(const r of c.ruins)if(r.core)con(r.core,0.7);for(const b of SV.bags)con(b,0.4);for(const d of (X.drops||[]))con(d,1.5);});
  if(tgt){X.dest={x:tgt.x,y:tgt.y};}
  else{X.botT-=dt;if(X.botT<=0){X.botT=2+Math.random()*2;const out=Math.atan2(X.y,X.x);X.botDir=lerp(X.botDir,out,0.4)+(Math.random()-0.5)*1.2;}X.dest={x:X.x+Math.cos(X.botDir)*100,y:X.y+Math.sin(X.botDir)*100};}
  forX(X.x-160,X.y-160,X.x+160,X.y+160,c=>{for(const f of c.foes){if(f.dead||f.stun>0)continue;const dx=X.x-f.x,dy=X.y-f.y,dd=Math.hypot(dx,dy);if(dd<f.R+30&&X.dest){X.dest.x+=dx/dd*110;X.dest.y+=dy/dd*110;}}},true);
  if(X.foeNear&&!X.foeNear.dead&&X.scrap>4)slingShoot();if(X.nearFoe&&gearLv('kladivo')&&(X.nearFoe.stun>0||X.nearFoe.alert<0.3))smash();
}

function foeSees(f){if(X.end||X.intro)return 0;const dx=X.x-f.x,dy=X.y-f.y,d=Math.hypot(dx,dy);if(d>f.R)return 0;let ad=Math.atan2(dy,dx)-f.dir;ad=Math.atan2(Math.sin(ad),Math.cos(ad));if(Math.abs(ad)>f.A)return 0;return d<f.R*0.5?1.8:1;}
function foeMove(f,ang,step){const P={x:f.x+Math.cos(ang)*step,y:f.y+Math.sin(ang)*step};blockObst(P,{x:Math.cos(ang),y:Math.sin(ang)},step,false);f.x=P.x;f.y=P.y;}
function updFoes(dt){X.nearFoe=null;X.foeNear=null;let nfd=1e9,fnd=1e9;X.slingCd=Math.max(0,X.slingCd-dt);X.smashCd=Math.max(0,X.smashCd-dt);
  forX(X.x-340,X.y-340,X.x+340,X.y+340,c=>{for(const f of c.foes){if(f.dead)continue;const dd=Math.hypot(X.x-f.x,X.y-f.y);
    if(dd<fnd){fnd=dd;X.foeNear=f;X.foeNearD=dd;}if(dd<24&&dd<nfd){nfd=dd;X.nearFoe=f;}
    if(dd<230&&!X.foeWarn[f.id]){X.foeWarn[f.id]=1;sfx.bark&&sfx.bark();xText(f.type==='drone'?'Woof! A guard drone nearby…':'Woof! A seeker robot – careful…','#b2402a');}
    f.hitT=Math.max(0,(f.hitT||0)-dt);
    if(f.stun>0){f.stun-=dt;if(f.stun<=0&&f.aware){f.aware=0;if(f.type==='bot'){f.chase=4.5;f.alert=1;}else f.alert=Math.max(f.alert,0.6);}continue;}
    if(f.type==='drone'){f.a+=f.spd*dt;f.x=f.cx+Math.cos(f.a)*f.r;f.y=f.cy+Math.sin(f.a)*f.r*0.8;f.dir=f.a+Math.PI/2+Math.sin(X.t*1.4+f.cx)*0.7;}
    else{f.cool=Math.max(0,f.cool-dt);
      if(f.chase>0){f.chase-=dt;f.dir=Math.atan2(X.y-f.y,X.x-f.x);foeMove(f,f.dir,56*dt);if(dd>200||f.chase<=0){f.chase=0;f.alert=0.3;f.cool=2.5;xText('…it lost you','#7a6a5a');}}
      else if(f.pause>0){f.pause-=dt;f.dir+=Math.sin(X.t*1.6+f.x)*dt*1.4;}
      else{const w=f.wp[f.i],dx=w.x-f.x,dy=w.y-f.y,dw=Math.hypot(dx,dy);if(dw<5){f.i=1-f.i;f.pause=1.5;}else{const a=Math.atan2(dy,dx);f.dir=a+Math.sin(X.t*1.7+f.y)*0.3;foeMove(f,a,24*dt);}}}
    if(X.end)continue;
    const see=foeSees(f);
    if(see&&!(f.cool>0))f.alert=Math.min(1,f.alert+dt/f.tDet*see);else if(!(f.chase>0))f.alert=Math.max(0,f.alert-dt*0.45);
    if(f.alert>=1){if(f.type==='drone'){knockout(f,'A guard drone zapped you.');return;}if(!(f.chase>0)){f.chase=4.5;sfx.alarm();}}
    if(f.type==='bot'&&f.chase>0&&dd<13){knockout(f,'A seeker robot caught you.');return;}}},true);}
function knockout(f,msg){if(X.end)return;X.ko=msg+' Zuro dragged you home.';X.dest=null;sfx.zap();xBurst(X.x,X.y,'#ff6a4a',24,130);X.zapLine={x0:f.x,y0:f.y,t:X.t};endExp('thirst');}
function hitFoe(f,dmg,src){if(f.dead)return;f.hp-=dmg;f.stun=src==='hammer'?1.1:1.3;f.hitT=0.3;f.aware=1;f.alert=Math.max(f.alert,0.5);xBurst(f.x,f.y,'#ffd36e',10,90);sfx.hit();
  if(f.hp<=0)killFoe(f);else xText(f.type==='drone'?'Hit! It wobbles…':'Hit! It\'s stunned…','#9a6a14');}
function killFoe(f){f.dead=true;SV.scrapT[f.id]=SV.exp;xBurst(f.x,f.y,'#ff6a4a',22,140);xBurst(f.x,f.y,'#8b8f96',18,110);sfx.boom();
  const n=FOE[f.type].chip+(f.type==='bot'&&Math.random()<0.4?1:0);dropChip(f.x,f.y,n);dropChip(f.x,f.y,1+(Math.random()<0.5?1:0),'scrap');xText('Destroyed! A circuit and some scrap fell out','#2f7a52');X.events.push({x:f.x,y:f.y,t:'chip'});}
// circuits fall on the ground where the robot broke – you have to walk over and pick them up (Robin 20. 11.)
function makeScrapDrop(n){const g=grp();const m=makeScrap(n,Math.floor(Math.random()*999));m.scale.setScalar(0.8);g.add(m);g.userData.b=m;g.userData.ring=part(G.ring,new T.MeshBasicMaterial({color:C('#c8b89a'),transparent:true,opacity:0.6,depthWrite:false}),0,0.06,0,1.4,1,1.4,g,true);return g;}
function makeChipDrop(){const g=grp();PART_OL=0.01;const b=grp(0,0.12,0,g);b.rotation.set(0.15,0.6,0.1);part(G.box,'#3f8a5a',0,0,0,0.9,0.1,0.9,b);part(G.box,'#2b3436',0,0.07,0,0.42,0.06,0.42,b);
  for(let i=0;i<4;i++)for(const sd of [-1,1]){part(G.box,'#d9a441',-0.3+i*0.2,0,sd*0.5,0.07,0.05,0.14,b);part(G.box,'#d9a441',sd*0.5,0,-0.3+i*0.2,0.14,0.05,0.07,b);}PART_OL=0;
  g.userData.ring=part(G.ring,new T.MeshBasicMaterial({color:C('#7ee0a8'),transparent:true,opacity:0.8,depthWrite:false}),0,0.06,0,1.6,1,1.6,g,true);g.userData.b=b;return g;}
function dropChip(x,y,n,kind){const a=Math.random()*6.28,d=X.drops||(X.drops=[]);const sc=kind==='scrap';const o={x:x+Math.cos(a)*(sc?11:6),y:y+Math.sin(a)*(sc?11:6),n,kind:sc?'scrap':'chip',m:sc?makeScrapDrop(n):makeChipDrop(),t:X.t};o.m.position.set(o.x*S,H2(o.x,o.y),o.y*S);X.scene.add(o.m);d.push(o);}
function updDrops(){const D=X.drops;if(!D)return;for(let i=D.length-1;i>=0;i--){const o=D[i];const k=1.6*(1+Math.sin(X.t*4+i)*0.12);o.m.userData.ring.scale.set(k,1,k);if(o.kind!=='scrap')o.m.userData.b.position.y=0.12+Math.abs(Math.sin(X.t*3+i))*0.15;
  if(X.end||Math.hypot(o.x-X.x,o.y-X.y)>14)continue;if(room()<1){if(X.fullCd<=0){fullMsg();X.fullCd=2;}continue;}const t=Math.min(o.n,room());o.n-=t;
  if(o.kind==='scrap'){X.scrap+=t;sfx.clink();xText('+'+t+' {scrap}','#5d6168');}else{X.chips+=t;sfx.core();xText('+'+t+' {chip} circuit','#2f7a52');}
  if(o.n<=0){X.scene.remove(o.m);D.splice(i,1);}}}
function slingShoot(){const l=gearLv('prak'),f=X.foeNear;if(!l||!f||f.dead||X.end)return false;if(X.slingCd>0)return false;const d=Math.hypot(f.x-X.x,f.y-X.y);if(d>SLING.range(l))return false;
  if(X.scrap<1){xText('No scrap left to shoot','#c0532f');return false;}X.scrap--;X.slingCd=SLING.cd(l);X.face=Math.atan2(f.x-X.x,f.y-X.y);heroPlay(X.hero,'throw',1.9);
  const m=part(G.sph,'#8b8f96',X.x*S,1.2,X.y*S,0.16,0.16,0.16,X.scene,true);X.shots.push({f,x0:X.x,y0:X.y,t:0,dur:Math.max(0.12,d/430),m,dmg:SLING.dmg(l)});sfx.sling();return true;}
function updShots(dt){for(let i=X.shots.length-1;i>=0;i--){const s=X.shots[i];s.t+=dt;const k=Math.min(1,s.t/s.dur),x=lerp(s.x0,s.f.x,k),y=lerp(s.y0,s.f.y,k);
  s.m.position.set(x*S,H2(x,y)+1.2+Math.sin(k*Math.PI)*1.1,y*S);if(k>=1){X.scene.remove(s.m);X.shots.splice(i,1);if(!s.f.dead)hitFoe(s.f,s.dmg,'sling');}}}
function smash(){const f=X.nearFoe,l=gearLv('kladivo');if(!f||f.dead||!l||X.smashCd>0||X.end)return false;X.smashCd=0.45;X.face=Math.atan2(f.x-X.x,f.y-X.y);X.dest=null;X.smashT=X.t;heroPlay(X.hero,'smash',1);hitFoe(f,hammerDmg(l),'hammer');return true;}
// water caches (Robin 20. 11.): leave a full bottle in the desert, it stays on the map – walk bottle to bottle to get further
function makeCacheBottle(){const g=grp();PART_OL=0.012;const gl=new T.MeshStandardMaterial({color:C('#7cc3cf'),transparent:true,opacity:0.85,roughness:0.2});
  const b=grp(0,0,0,g);b.rotation.z=0.12;part(G.cyl,gl,0,0.45,0,0.32,0.9,0.32,b);part(G.cyl,gl,0,1.0,0,0.14,0.22,0.14,b);part(G.cyl,'#c0432f',0,1.16,0,0.16,0.1,0.16,b);part(G.box,'#e8e0c8',0,0.45,0.3,0.36,0.3,0.03,b);
  part(G.cyl,'#7a5a3a',0.6,0.7,0.2,0.04,1.4,0.04,g);part(G.box,'#e8873a',0.82,1.25,0.2,0.4,0.24,0.03,g);PART_OL=0;
  g.userData.ring=part(G.ring,new T.MeshBasicMaterial({color:C('#57a6b6'),transparent:true,opacity:0.7,depthWrite:false}),0,0.06,0,1.8,1,1.8,g,true);return g;}
function dropCache(){if(!X||X.end||X.bottles<=0)return;X.bottles--;SV.bottles=Math.max(0,(SV.bottles||0)-1);const k={id:'q'+Date.now().toString(36),x:Math.round(X.x+Math.sin(X.face)*6),y:Math.round(X.y+Math.cos(X.face)*6),v:BOTTLE};
  SV.caches.push(k);X.cacheHold=k.id;save();sfx.clink();xText('Bottle left here – it\'s on your map','#3f8fa1');updateMelonBtn();}
function updCaches(dt){if(!SV.caches)return;for(let i=SV.caches.length-1;i>=0;i--){const k=SV.caches[i],d=Math.hypot(k.x-X.x,k.y-X.y);
  if(d<420&&!X.cacheM[k.id]){const m=makeCacheBottle();m.position.set(k.x*S,H2(k.x,k.y),k.y*S);X.scene.add(m);X.cacheM[k.id]=m;}
  const m=X.cacheM[k.id];if(m){const s2=1.8*(1+Math.sin(X.t*3)*0.1);m.userData.ring.scale.set(s2,1,s2);}
  if(X.cacheHold===k.id){if(d>30)X.cacheHold=null;continue;}
  if(d<14&&X.water<X.cap-0.05&&!X.end){const a=Math.min(k.v,X.cap-X.water);k.v-=a;X.water+=a;sfx.drink();xText('+'+fmtL(a)+' L from your bottle','#3f8fa1');
    if(k.v<=0.01){SV.caches.splice(i,1);SV.bottles=(SV.bottles||0)+1;if(m){X.scene.remove(m);delete X.cacheM[k.id];}xText('Empty bottle back in your pack','#3f8fa1');}save();}}}
function updateExp(dt){
  X.t+=dt;
  if(X.end){updateExpCam(dt);animExp(dt);return;}
  if(X.intro){X.intro.t+=dt;if(X.intro.t>2.6){X.intro=null;if(X.introLine){X.scene.remove(X.introLine);X.introLine=null;}}else{updateExpCam(dt);animExp(dt);return;}}
  X.fullCd=Math.max(0,X.fullCd-dt);X.hitCd=Math.max(0,X.hitCd-dt);
  if(BOT)autopilotX(dt);
  let mx=kb.r-kb.l,my=kb.d-kb.u,joyK=1;
  if(JOY&&JOY.on){const dx=JOY.x-JOY.x0,dy=JOY.y-JOY.y0,L=Math.hypot(dx,dy);if(L>8){mx=dx/L;my=dy/L;joyK=clamp(L/42,0.4,1);}}
  if(mx||my)X.dest=null;else if(X.dest){mx=X.dest.x-X.x;my=X.dest.y-X.y;const dd=Math.hypot(mx,my);if(dd<4){X.dest=null;mx=my=0;}
    else if(!BOT){const D=X.dest;if(D._b===undefined||dd<D._b-3){D._b=dd;D._t=X.t;}else if(X.t-D._t>2.2&&!ptr){X.dest=null;mx=my=0;}}}
  const ml=Math.hypot(mx,my),wr=weight()/bagCap();
  const spd=(X.dis?0:78)*joyK*bootsMul(gearLv('boty'))*heroSpeedMul()*(1-0.32*Math.min(1.3,wr));
  let moved=0;
  if(ml>0.001){const vx=mx/ml*spd,vy=my/ml*spd;const ox=X.x,oy=X.y;X.x+=vx*dt;X.y+=vy*dt;
    forX(X.x-80,X.y-80,X.x+80,X.y+80,c=>{for(const r of c.ruins)for(const w of r.walls){const nx=clamp(X.x,w.x-w.w/2,w.x+w.w/2),ny=clamp(X.y,w.y-w.h/2,w.y+w.h/2);const dx=X.x-nx,dy=X.y-ny,d=Math.hypot(dx,dy);
      if(d<6){if(d>0.01){X.x=nx+dx/d*6;X.y=ny+dy/d*6;}else{X.x=ox;X.y=oy;}}}});
    {const P={x:X.x,y:X.y};if(blockObst(P,{x:mx/ml,y:my/ml},spd*dt,true)){X.x=P.x;X.y=P.y;}else if(X.slideOb&&X.t-(X.slideT||0)>0.8)X.slideOb=null;}
    moved=Math.hypot(X.x-ox,X.y-oy);X.moving=true;X.vx=lerp(X.vx,vx,0.25);X.vy=lerp(X.vy,vy,0.25);{const tg=Math.atan2(X.vx,X.vy);let da=tg-X.face;da=Math.atan2(Math.sin(da),Math.cos(da));X.face+=da*0.3;}
    const pp=X.walkPh;X.walkPh+=dt*spd*0.13;if(Math.floor(pp/Math.PI)!==Math.floor(X.walkPh/Math.PI))sfx.step();}
  else X.moving=false;
  X.walked+=moved;X.footAcc+=moved;if(X.footAcc>9){X.footAcc=0;addFoot();}
  X.pathAcc+=moved;if(X.pathAcc>16){X.pathAcc=0;X.path.push({x:X.x,y:X.y});markSeen(X.x,X.y,sightR()*0.8);}
  X.inDust=false;forX(X.x-CH,X.y-CH,X.x+CH,X.y+CH,c=>{for(const z of c.dust)if(Math.hypot(z.x-X.x,z.y-X.y)<z.r)X.inDust=true;});
  const dustM=X.inDust&&!SV.craft.maska?2:1;
  X.nearWreck=null;X.nearWreckC=null;X.nearCamp=null;let nwd=1e9;
  X.water-=(0.002*dt+WATER_PER_U*moved)*(1+0.6*wr)*dustM*heroWaterMul()*(1-0.25*DAY.n);
  forX(X.x-CH,X.y-CH,X.x+CH,X.y+CH,c=>{
    for(let i=c.scrap.length-1;i>=0;i--){const s=c.scrap[i];if(Math.hypot(s.x-X.x,s.y-X.y)<14){const r=room();if(r<=0){fullMsg();continue;}
      const take=Math.min(r,s.v);X.scrap+=take;s.v-=take;xBurst(s.x,s.y,'#8b8f96',8,70);sfx.clink();xText('+'+take+' {scrap}','#5d6168');
      if(s.v<=0){c.scrap.splice(i,1);SV.scrapT[s.id]=SV.exp;removeObj(c,s);}}}
    for(const w of c.wrecks){const d=Math.hypot(w.x-X.x,w.y-X.y);if(d<(w.kind===3?55:28)&&d<nwd){nwd=d;X.nearWreck=w;X.nearWreckC=c;}}
    for(const cp of c.camps){if(Math.hypot(cp.x-X.x,cp.y-X.y)<38)X.nearCamp=cp;if(cp.m&&cp.m.userData.flag)cp.m.userData.flag.rotation.y=Math.sin(X.t*3+cp.x)*0.25;}
    for(let i=c.crates.length-1;i>=0;i--){const k=c.crates[i];if(Math.hypot(k.x-X.x,k.y-X.y)<16){c.crates.splice(i,1);SV.takenSet.add(k.id);removeObj(c,k);openCrate(k);}}
    for(const w of c.waters){if(w.taken)continue;if(Math.hypot(w.x-X.x,w.y-X.y)<w.r+8&&X.water<X.cap-0.05){const a=Math.min(w.v,X.cap-X.water);w.v-=a;X.water+=a;xBurst(w.x,w.y,'#7cc3cf',12,80);sfx.drink();xText('+'+fmtL(a)+' L','#3f8fa1');if(w.v>0.05)continue;w.taken=true;if(w.id)SV.scrapT[w.id]=SV.exp;
      if(w.m){w.m.children[1].visible=false;w.m.children[2].visible=false;}}}
    // cacti are just part of the desert now – no water (Robin 20. 11.)
    for(const f of c.fata){if(f.gone)continue;if(Math.hypot(f.x-X.x,f.y-X.y)<55){f.gone=true;f.goneT=X.t;sfx.vanish();xText('A mirage…','#8a6a4a');}}
    for(const r of c.ruins){
      if(r.core&&Math.hypot(r.core.x-X.x,r.core.y-X.y)<15){if(room()>=2){const n=room()>=4?2:1;X.cores+=n;SV.takenSet.add(r.core.id);r.core=null;if(r.cm){r.cm.parent.remove(r.cm);r.cm=null;}sfx.core();xBurst(X.x,X.y,'#f2c14e',20,110);xText('+'+n+' {core} gold scrap!','#9a6a14');X.events.push({x:X.x,y:X.y,t:'core'});}else fullMsg();}
    }
  });
  for(let i=SV.bags.length-1;i>=0;i--){const b=SV.bags[i];if(Math.hypot(b.x-X.x,b.y-X.y)<16){X.scrap+=b.s;X.cores+=b.c;X.chips+=(b.k||0);if(b._m)X.scene.remove(b._m);SV.bags.splice(i,1);sfx.core();xText('Lost bag found! +'+b.s+' {scrap}'+(b.c?' +'+b.c+' {core}':''),'#8f5b36');save();}}
  updFoes(dt);updShots(dt);updCaches(dt);updDrops();
  if(X.dis){if(X.nearWreck!==X.dis.w)X.dis=null;else{X.dis.t+=dt;if(X.dis.t>=1.3){finishDismantle();X.dis=null;}}}
  const hd=Math.hypot(X.x,X.y);if(hd>X.maxD)X.maxD=hd;if(X.camp?Math.hypot(X.x-X.start.x,X.y-X.start.y)>130:hd>130)X.leftHome=true;
  if(X.leftHome){if(hd<78)endExp('home');else for(const cp of CAMPS)if(SV.camps[cp.id]&&Math.hypot(X.x-cp.x,X.y-cp.y)<34){endExp('camp',cp);break;}}
  if(!X.end&&X.water<=0){X.water=0;endExp('thirst');}
  // Zuro follows
  {const back=X.face+Math.PI;const tx=X.x+Math.sin(back)*16+Math.cos(back)*9,ty=X.y+Math.cos(back)*16-Math.sin(back)*9;
   const ddx=tx-X.dx,ddy=ty-X.dy,dd=Math.hypot(ddx,ddy);const dsp=Math.min(dd*3,95);
   if(dd>3){X.dx+=ddx/dd*dsp*dt;X.dy+=ddy/dd*dsp*dt;{const P={x:X.dx,y:X.dy};if(blockObst(P,{x:ddx/dd,y:ddy/dd},dsp*dt,false)){X.dx=P.x;X.dy=P.y;}}X.dface=Math.atan2(ddx,ddy);X.dmoving=dsp>8;X.dph+=dt*dsp*0.16;X.dfoot=(X.dfoot||0)+dsp*dt;if(X.dfoot>16){X.dfoot=0;puff(X.scene,X.dx*S,H2(X.dx,X.dy)+0.06,X.dy*S,1);}}else{X.dmoving=false;const lf=Math.atan2(X.x-X.dx,X.y-X.dy);let da=lf-X.dface;da=Math.atan2(Math.sin(da),Math.cos(da));X.dface+=da*0.05;}}
  // make sure surroundings exist
  forX(X.x-CH*1.5,X.y-CH*2.4,X.x+CH*1.5,X.y+CH*1.1,()=>{});
  updateExpCam(dt);animExp(dt);
}
function addFoot(){const a=Math.atan2(X.vy,X.vx);const sd=(X.footI%2?3:-3);const fx=X.x+Math.cos(a+1.57)*sd,fy=X.y+Math.sin(a+1.57)*sd;if(X.footI%2)puff(X.scene,fx*S,H2(fx,fy)+0.08,fy*S,2);
  const o=new T.Object3D();o.position.set(fx*S,H2(fx,fy)+0.04,fy*S);o.rotation.y=-a;o.scale.set(0.5,1,0.28);o.updateMatrix();
  X.foot.setMatrixAt(X.footI%500,o.matrix);X.footI++;X.foot.count=Math.min(500,X.footI);X.foot.instanceMatrix.needsUpdate=true;}
function openCrate(k){
  sfx.crate();xBurst(k.x,k.y,'#e0b04c',16,100);X.events.push({x:k.x,y:k.y,t:'crate'});
  if(k.core){X.cores++;toast('{core}','Gold scrap!','Rare old parts. Robots need them to wake up.');sfx.core();return;}
  const dist=Math.hypot(k.x,k.y),r=Math.random();
  if(r<0.4){const n=4+Math.floor(Math.random()*5);const t=Math.min(room(),n);X.scrap+=t;toast('{chest}','Crate of scrap','+'+t+' {scrap}'+(t<n?' (no room for more)':''));}
  else if(r<0.58){X.water=Math.min(X.cap,X.water+0.5);toast('{bottle}','A sealed old bottle','You drank it right away. +0.5 L of water.');}
  else if(r<0.72&&dist>200){if(room()>=2){X.cores++;toast('{core}','Gold scrap!','Rare old parts.');sfx.core();}else toast('{core}','Gold scrap… but your backpack is full','You have to leave it here.');}
  else if(r<0.88){const l=LORE[SV.lore%LORE.length];SV.lore++;X.lore=l;toast('{scroll}','Diary scrap',l.replace('Diary scrap: ',''));}
  else toast('{empty}','Empty crate','Nothing this time.');
}
function endExp(type,cp){
  X.end=type;X.endCamp=cp||null;{const P=X.path,st=Math.max(1,Math.ceil(P.length/160));SV.lastPath=P.filter((p,i)=>i%st===0||i===P.length-1).map(p=>[Math.round(p.x),Math.round(p.y)]);}if(X.introLine){X.scene.remove(X.introLine);X.introLine=null;}$('xact').classList.add('hidden');X.endT=X.t;X.path.push({x:X.x,y:X.y});X.camStartT=camT.clone();X.camStartD=X.camD||40;
  $('xhud').classList.add('hidden');updateMelonBtn();$('bSling').classList.add('hidden');$('bDrop').classList.add('hidden');X.destM.visible=false;X.wreckRing.visible=false;
  if(type==='thirst'){const lf=rescueLoss();const ls=Math.ceil(X.scrap*lf),lc=X.cores?Math.max(0,Math.round(X.cores*lf)):0;const lx=X.chips?Math.max(0,Math.round(X.chips*lf)):0;X.lostS=ls;X.lostC=lc;X.lostX=lx;X.lossPct=Math.round(lf*100);X.scrap-=ls;X.cores-=lc;X.chips-=lx;
    if(ls||lc||lx)SV.bags.push({x:Math.round(X.x),y:Math.round(X.y),s:ls,c:lc,k:lx});sfx.fail();
    X.rs={hx:X.x*S,hz:X.y*S,face:X.x>0?-Math.PI/2:Math.PI/2,dx0:X.dx*S,dz0:X.dy*S,dface0:X.dface};}
  else{sfx.home();window._cheer=1;X.back=Math.round(X.water*10)/10;SV.well=Math.min(wellCap(),SV.well+X.water);}
  SV.scrap+=X.scrap;SV.cores+=X.cores;SV.chips=(SV.chips||0)+(X.chips||0);SV.exp++;if(X.maxD>SV.best){SV.best=X.maxD;X.record=true;}
  X.addM=Math.round(X.walked*M_PER_U);SV.meters=(SV.meters||0)+X.addM;X.lv1=[heroLv(),dogLv()];
  X.msg=null;if(SV.b.radio&&SV.msg<Math.min(MSGS.length,SV.b.radio)){X.msg=MSGS[SV.msg];SV.msg++;}
  save();
  // journey line
  const pts=X.path.map(p=>new T.Vector3(p.x*S,H2(p.x,p.y)+0.25,p.y*S));
  const lg=new T.BufferGeometry().setFromPoints(pts);const line=new T.Line(lg,new T.LineDashedMaterial({color:C('#c8643c'),dashSize:1.2,gapSize:0.8,transparent:true,opacity:0,depthTest:false}));
  line.computeLineDistances();line.renderOrder=10;X.scene.add(line);X.line=line;
  X.marks=[];for(const e of X.events){const m=part(G.sph,new T.MeshBasicMaterial({color:C(e.t==='core'?'#f2c14e':e.t==='crate'?'#e0b04c':e.t==='camp'?'#57a6b6':'#8b8f96'),depthTest:false,transparent:true,opacity:0}),e.x*S,H2(e.x,e.y)+0.4,e.y*S,1,1,1,X.scene,true);m.renderOrder=11;X.marks.push(m);}
}
function showSummary(){
  X.shown=true;
  let h=`<h3>Expedition ${SV.exp}</h3><div class="big">${X.end==='home'?'You made it home':X.end==='camp'?'You made it to '+X.endCamp.name:'Zuro dragged you home'}</div>${X.ko?'<div class="info">'+X.ko+'</div>':''}`;
  h+=`<div class="gain">+${X.scrap} {scrap}${X.cores?' &nbsp; +'+X.cores+' {core}':''}${X.chips?' &nbsp; +'+X.chips+' {chip}':''}</div>`;
  if(X.end==='thirst'&&(X.lostS||X.lostC||X.lostX))h+=`<div class="lost">Zuro could only save part of the load (${X.lossPct} % left in the sand): ${X.lostS} {scrap}${X.lostC?' '+X.lostC+' {core}':''}${X.lostX?' '+X.lostX+' {chip}':''}. You can go back for the bag.</div>`;
  h+=`<div class="info">Walked together: +${X.addM} m${X.back?' · '+fmtL(X.back)+' L poured back into the well':''}</div>`;
  if(X.lv1[0]>X.lv0[0])h+=`<div class="gain" style="font-size:16px">{levelup} ${SV.name||'Wanderer'} reached level ${X.lv1[0]}!</div>`;
  if(X.lv1[1]>X.lv0[1])h+=`<div class="gain" style="font-size:16px">{levelup} Zuro reached level ${X.lv1[1]}!</div>`;
  h+=`<div class="info">Farthest: ${fmtM(X.maxD)}${X.record?' · new record!':''}</div>`;
  if(X.lore)h+=`<div class="msg">${X.lore}</div>`;
  if(X.msg)h+=`<div class="msg">{radio} ${X.msg}</div>`;
  h+=`<button class="btn primary" id="bHome" style="min-width:220px">Home</button>`;
  $('sumBody').innerHTML=icx(h);$('sum').classList.remove('hidden');
  $('bHome').addEventListener('click',()=>enterBase());
  if(BOT)setTimeout(()=>{if(scene==='exp')enterBase();},700);
}
const EL=ST.sunink?0.72:0.88;let ZOOM=ST.sunink?16:14;const ZMIN=ST.sunink?10:10,ZMAX=ST.sunink?19:18;
function setCam(tx,tz,w,el){orthoView(tx,tz,w,el);X.camD=(w/ASP)/Math.sin(el)*0.55;if(ST.sunink){X.scene.fog.near=CAMDIST-4;X.scene.fog.far=CAMDIST+44+w*1.6;}else{X.scene.fog.near=CAMDIST+20;X.scene.fog.far=CAMDIST+90+w*1.5;}}
function updateExpCam(dt){
  const d0=ZOOM;
  if(X.intro&&X.camp){const k=easeInOut(clamp((X.intro.t-0.3)/2.0,0,1));const cx0=X.camp.x*S/2,cz0=X.camp.y*S/2+4,w0=Math.max(40,Math.hypot(X.camp.x,X.camp.y)*S*1.3);
    const tx=X.x*S,tz=X.y*S+1.5;camT.set(lerp(cx0,tx,k),0,lerp(cz0,tz,k));setCam(camT.x,camT.z,lerp(w0,d0,k),lerp(EL+0.3,EL,k));placeSun(X.sun,camT.x,camT.z);if(X.introLine)X.introLine.material.opacity=0.9*(1-k*k);return;}
  if(!X.end){let lx=0,lz=0;if(X.dest&&X.moving){const dx=X.dest.x-X.x,dy=X.dest.y-X.y,d=Math.hypot(dx,dy)||1;lx=dx/d*2.4;lz=dy/d*2.4;}
    camT.x=lerp(camT.x,X.x*S+lx,0.08);camT.z=lerp(camT.z,X.y*S+lz+1.5,0.08);setCam(camT.x,camT.z,d0,EL);
    placeSun(X.sun,camT.x,camT.z);return;}
  const el0=X.t-X.endT,ZS=X.end==='thirst'?5.6:1;const el=el0-(ZS-1);
  if(el<1){if(X.end==='thirst'&&X.rs){camT.x=lerp(camT.x,X.rs.hx+Math.sin(X.rs.face)*1.5,0.05);camT.z=lerp(camT.z,X.rs.hz+Math.cos(X.rs.face)*1.5+1.2,0.05);}
    X.zw=X.end==='thirst'?lerp(d0,11,easeInOut(clamp(el0/1.4,0,1))):d0;setCam(camT.x,camT.z,X.zw,EL);placeSun(X.sun,camT.x,camT.z);X.camStartT=camT.clone();return;}
  // no zoom-out over the whole map at the end (Robin 20. 11.: it gave places away and far chunks weren't loaded) – stay with the wanderer
  const cx=X.camStartT.x,cz=X.camStartT.z;setCam(cx,cz,X.zw||d0,EL);placeSun(X.sun,cx,cz);
  if(X.line)X.line.material.opacity=0;for(const m of X.marks)m.material.opacity=0;
  if(el>0.6&&!X.shown)showSummary();
}
function animExp(dt){
  const t=tNow;
  const tq=TQ();
  const H=X.hero,D=X.dog,h=H2(X.x,X.y);
  if(X.end==='thirst'&&X.rs){animRescue(X.t-X.endT,tq);}
  else{
    H.root.position.set(X.x*S,h,X.y*S);H.root.rotation.set(0,X.face,0);
    H.idleK=X.dis?'fix':'idle';heroPose(H,tq,X.moving&&!X.dis,qph(X.walkPh));
    blinkFace(H,D,tq,X.water/X.cap<0.25?'tired':(Math.floor(tq/6)%5===4?'happy':'idle'),X.dmoving?'idle':(Math.floor(tq/4)%4===3?'happy':'look'));
    D.root.position.set(X.dx*S,H2(X.dx,X.dy),X.dy*S);D.root.rotation.set(0,X.dface,0);
    dogPose(D,tq,X.dmoving?'trot':'idle',qph(X.dph));
    if(X.end==='home'||X.end==='camp'){const v=X.t-X.endT<1.2;H.root.visible=v;D.root.visible=v;}
  }
  snapPx(H.root.position);snapPx(D.root.position);
  X.hglow.position.set(H.root.position.x,0.06,H.root.position.z+0.3);X.hglow.visible=H.root.visible;
  updWisps(X.wisps,dt,camT.x,camT.z,X.zw||ZOOM);
  // dest marker
  if(X.dest&&!X.end&&!BOT){X.destM.visible=true;const pu=1+Math.sin(t*6)*0.12;X.destM.position.set(X.dest.x*S,H2(X.dest.x,X.dest.y)+0.08,X.dest.y*S);X.destM.scale.set(1.6*pu,1,1.6*pu);}else X.destM.visible=false;
  // wreck progress ring
  if(X.dis&&!X.end){const wr=X.dis.w;X.wreckRing.visible=true;X.wreckRing.position.set(wr.x*S,0.12,wr.y*S);const s=1+X.dis.t/1.3*2.4;X.wreckRing.scale.set(s,1,s);}else X.wreckRing.visible=false;
  // chunk objects (+ cull far chunks)
  const cullR=(X.camD||40)*0.95+14;
  for(const c of X.chunks.values()){
    const ccx=(c.cx+0.5)*CH*S,ccz=(c.cy+0.5)*CH*S;c.g.visible=!!X.end||Math.hypot(ccx-camT.x,(ccz-camT.z)*0.8)<cullR;if(!c.g.visible)continue;
    for(const k of c.crates)if(k.m&&k.m.userData.spark){const sp=k.m.userData.spark;sp.position.y=1.9+Math.sin(t*2+k.ph)*0.2;sp.rotation.y=t*2;sp.visible=Math.sin(t*2.2+k.ph)>0;}
    for(const f of c.fata){if(f.gone&&f.m){const a=clamp(1-(X.t-f.goneT)/0.8,0,1);if(a<=0){f.m.parent&&f.m.parent.remove(f.m);f.m=null;}else{f.m.scale.set(1+(1-a)*0.6,1,1+(1-a)*0.6);f.m.position.x+=Math.sin(t*40)*0.01;
      f.m.traverse(o=>{if(o.material&&!o.userData.cl){o.material=o.material.clone();o.material.transparent=true;o.userData.cl=1;}if(o.material)o.material.opacity=a;});}}}
    for(const f of c.foes){const m=f.m;if(!m)continue;if(f.dead){m.cone.visible=false;if(!m.broken){m.broken=1;const hh=H2(f.x,f.y);m.g.position.set(f.x*S,hh,f.y*S);m.body.rotation.set(0,-f.dir,f.type==='drone'?0.5:1.15);m.body.position.y=f.type==='drone'?-1.2:-0.25;m.eye.material.emissiveIntensity=0;m.eye.material.color.set('#3a2a20');if(m.legs)m.legs.forEach(L=>{L.rotation.z=0.6;});}continue;}const hh=H2(f.x,f.y);m.g.position.set(f.x*S,hh,f.y*S);
      const wob=f.stun>0?Math.sin(t*22)*0.25:0;
      if(f.type==='drone'){m.body.position.y=1.6+Math.sin(t*3+f.cx)*0.15-(f.stun>0?0.5:0);}
      else{const mv=f.stun>0?0:f.chase>0?16:f.pause>0?0:8;m.body.position.y=mv?Math.abs(Math.sin(t*mv+f.x))*0.07:0;m.legs.forEach((L,k)=>{L.rotation.z=mv?Math.sin(t*mv+k*1.6)*0.35:0;});}
      m.body.rotation.set(wob,-f.dir,wob*0.6);
      m.cone.position.set(f.x*S,hh+0.12,f.y*S);m.cone.rotation.y=-f.dir;m.cone.visible=f.stun<=0&&!X.end;
      const al=f.chase>0?1:f.alert;m.cone.material.opacity=0.16+al*0.32;m.cone.material.color.setRGB(0.9,0.42-al*0.3,0.24-al*0.18);
      m.eye.material.emissiveIntensity=f.stun>0?0:1+al*1.5+(f.hitT>0?2:0);}
    for(const r of c.ruins){
      if(r.cm&&r.cm.userData.sp){const sp=r.cm.userData.sp;sp.material.opacity=Math.max(0,Math.sin(t*2.2+r.x)*1.4-0.6);sp.rotation.y=t*3;}}
    for(const wr of c.wrecks)if(wr.glow){const sp=wr.glow.userData.sp;sp.material.opacity=Math.max(0,Math.sin(t*2.2+wr.x)*1.4-0.6);sp.rotation.y=t*3;}
  }
  for(const b of SV.bags)if(b._m&&b._m.userData.ring){const s=2.4*(1+Math.sin(t*3)*0.1);b._m.userData.ring.scale.set(s,1,s);}
}
function animRescue(el,tq){
  const H=X.hero,D=X.dog,rs=X.rs;const fx=Math.sin(rs.face),fz=Math.cos(rs.face);const gh=p=>Hd(p.x,p.z);
  let hx=rs.hx,hz=rs.hz,lie=0,lift=0,dX,dZ,dRot,mode='idle',dph=0,hf='tired',df='worried';
  H.root.rotation.order='YXZ';
  if(el<0.8){const k=el/0.8;heroPose(H,tq,true,qph(el*7));H.chest.rotation.x=0.25*k;H.head.rotation.x=0.25*k;
    const cur=H.root.rotation.y;let da=rs.face-cur;da=Math.atan2(Math.sin(da),Math.cos(da));H.root.rotation.y=cur+da*0.15;dX=rs.dx0;dZ=rs.dz0;dRot=rs.dface0;}
  else if(el<1.4){const k=easeInOut(clamp((el-0.8)/0.6,0,1));heroPose(H,tq,false);H.root.rotation.y=rs.face;lie=k*1.47;lift=k*0.27;H.sh[0].rotation.x=-k*2.3;H.sh[1].rotation.x=-k*2.1;hf='ko';dX=rs.dx0;dZ=rs.dz0;dRot=rs.dface0;
    if(k>0.95&&!X.thud){X.thud=1;burst3(X.scene,hx+fx*1.5,gh({x:hx,z:hz})+0.3,hz+fz*1.5,'#e8d2a6',12,3);}}
  else{heroPose(H,tq,false);H.root.rotation.y=rs.face;lie=1.47;lift=0.27;hf='ko';H.sh[0].rotation.x=-0.2;H.sh[1].rotation.x=-0.15;H.head.rotation.y=0.6;
    const gx=rs.hx+fx*2.85,gz=rs.hz+fz*2.85;
    if(el<2.6){const k=easeInOut(clamp((el-1.4)/1.2,0,1));dX=lerp(rs.dx0,gx,k);dZ=lerp(rs.dz0,gz,k);const tg=Math.atan2(gx-rs.dx0,gz-rs.dz0);dRot=k<0.8?tg:lerp(tg,rs.face+Math.PI,(k-0.8)/0.2);mode='trot';dph=el*13;}
    else if(el<3.1){dX=gx;dZ=gz;dRot=rs.face+Math.PI;mode='grab';df='grab';D.neck.rotation.x=lerp(0,0.8,clamp((el-2.6)/0.4,0,1));}
    else{const pull=Math.min(el-3.1,2.5)*0.65;dX=gx+fx*pull;dZ=gz+fz*pull;dRot=rs.face+Math.PI;mode=el<5.6?'back':'idle';dph=-el*9;df=el<5.6?'grab':'love';D.neck.rotation.x=el<5.6?0.8:0.3;hx+=fx*pull;hz+=fz*pull;
      if(el<5.6&&Math.random()<0.15)burst3(X.scene,hx,gh({x:hx,z:hz})+0.1,hz,'#e8d2a6',1,1);}}
  H.root.position.set(hx,gh({x:hx,z:hz})+lift,hz);H.root.rotation.x=lie;
  D.root.position.set(dX,gh({x:dX,z:dZ}),dZ);D.root.rotation.set(0,dRot,0);
  dogPose(D,tq,mode,qph(dph));blinkFace(H,D,tq,hf,df);
}
function drawExpOverlay(){
  const sr=sightR();
  const wh=H2(X.x,X.y);const c0=proj(X.x*S,wh,X.y*S),c1=proj((X.x+sr)*S,wh,X.y*S),c2=proj(X.x*S,wh,(X.y+sr)*S);
  const rx=Math.abs(c1.x-c0.x),ry=Math.abs(c2.y-c0.y);
  const el=X.end?X.t-X.endT:0,hz=1-(X.end?clamp((el-1)/1.2,0,1):0);
  if(hz>0.01&&rx>2){const col=X.inDust?'190,178,190':DAY.haze;ctx.save();ctx.translate(c0.x,c0.y);ctx.scale(1,Math.max(0.4,ry/rx));
    const g=ctx.createRadialGradient(0,0,rx*0.62,0,0,rx*1.05);g.addColorStop(0,`rgba(${col},0)`);g.addColorStop(1,`rgba(${col},${0.95*hz})`);
    ctx.fillStyle=g;ctx.fillRect(-cw*2,-ch*4,cw*4,ch*8);ctx.restore();}
  if(!X.end){
    const hr=0;
    if(hr)forX(X.x-hr,X.y-hr,X.x+hr,X.y+hr,c=>{const mark=(o,ic)=>{const d=Math.hypot(o.x-X.x,o.y-X.y);if(d<sr*0.85||d>hr)return;const p=proj(o.x*S,H2(o.x,o.y),o.y*S);if(!p.on)return;
        ctx.globalAlpha=0.9;ctx.fillStyle='#fff8ea';ctx.beginPath();ctx.arc(p.x,p.y,10*dpr,0,6.283);ctx.fill();{const n=ic.replace(/[{}]/g,''),im=ICIMG[n],iz=14*dpr;if(im&&im.complete)ctx.drawImage(im,p.x-iz/2,p.y-iz/2,iz,iz);}ctx.globalAlpha=1;};
      for(const k of c.crates)mark(k,'{chest}');for(const w of c.wrecks)mark(w,'{cog}');for(const r of c.ruins)if(r.core)mark(r.core,'{core}');},true);
    else forX(X.x-sr*2,X.y-sr*2,X.x+sr*2,X.y+sr*2,c=>{for(const k of c.crates){const d=Math.hypot(k.x-X.x,k.y-X.y);if(d<sr*0.85||d>sr*2)continue;const tw=Math.max(0,Math.sin(tNow*2.2+k.ph));if(tw<0.3)continue;
      const p=proj(k.x*S,H2(k.x,k.y)+1.5,k.y*S);if(!p.on)continue;star4(p.x,p.y,tw*5*dpr,`rgba(255,230,150,${tw})`);}},true);
    forX(X.x-340,X.y-340,X.x+340,X.y+340,c=>{for(const f of c.foes){if(f.dead)continue;const d=Math.hypot(f.x-X.x,f.y-X.y);if(d>330)continue;
      const p=proj(f.x*S,H2(f.x,f.y)+(f.type==='drone'?3.4:2.9),f.y*S);
      if(!p.on||p.x<0||p.x>cw||p.y<0||p.y>ch){if(d<240)edgeArrow(f.x,f.y,'robot','#e8453a');continue;}
      const al=f.chase>0?1:f.alert;
      if(f.stun>0){ctx.font=`700 ${14*dpr}px ${FF}`;ctx.textAlign='center';ctx.fillStyle='#ffd36e';for(let k=0;k<3;k++){const a=tNow*5+k*2.1;ctx.fillText('✦',p.x+Math.cos(a)*14*dpr,p.y+Math.sin(a)*5*dpr);}}
      else if(al>0.02){const r=11*dpr;ctx.fillStyle='rgba(29,26,24,0.85)';ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.283);ctx.fill();ctx.strokeStyle=al>=1?'#ff5a3a':'#ffd36e';ctx.lineWidth=3*dpr;ctx.beginPath();ctx.arc(p.x,p.y,r,-Math.PI/2,-Math.PI/2+6.283*Math.min(1,al));ctx.stroke();
        ctx.font=`800 ${14*dpr}px ${FF}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=al>=1?'#ff5a3a':'#ffd36e';ctx.fillText(al>=1?'!':'?',p.x,p.y+1*dpr);ctx.textBaseline='alphabetic';}
      if(f.hp<f.hpMax){const w=7*dpr,gx=p.x-(f.hpMax*w)/2;for(let k=0;k<f.hpMax;k++){ctx.fillStyle=k<f.hp?'#ff6e5a':'rgba(29,26,24,0.6)';ctx.fillRect(gx+k*w+1,p.y-22*dpr,w-2,4*dpr);}}}},true);
    for(const b of SV.bags)edgeArrow(b.x,b.y,'lost bag','#8f5b36');
    if(SV.craft.kompas)edgeArrow(0,0,'home','#c8643c');
    if(SV.b.radio)edgeArrow(SIG.x,SIG.y,'signal','#7a5a8c');
    if(SV.craft.kompas){let best=null,bd=1400;forX(X.x-1400,X.y-1400,X.x+1400,X.y+1400,c=>{for(const w of c.waters){if(w.taken)continue;const d=Math.hypot(w.x-X.x,w.y-X.y);if(d<bd){bd=d;best=w;}}for(const k of SV.caches){const d=Math.hypot(k.x-X.x,k.y-X.y);if(d<bd){bd=d;best=k;}}},true);
      if(best&&bd>40){const a=Math.atan2(best.y-X.y,best.x-X.x);const p=proj((X.x+Math.cos(a)*30)*S,wh+0.3,(X.y+Math.sin(a)*30)*S),q=proj(X.x*S,wh+0.3,X.y*S);const sa=Math.atan2(p.y-q.y,p.x-q.x);
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(sa);ctx.fillStyle='rgba(63,143,161,0.9)';ctx.beginPath();ctx.moveTo(8*dpr,0);ctx.lineTo(-5*dpr,-5*dpr);ctx.lineTo(-2*dpr,0);ctx.lineTo(-5*dpr,5*dpr);ctx.closePath();ctx.fill();ctx.restore();}}
    const r=X.water/X.cap;if(r<0.25){const a=(0.25-r)/0.25*(0.35+0.15*Math.sin(tNow*7));const vg=ctx.createRadialGradient(cw/2,ch/2,Math.min(cw,ch)*0.3,cw/2,ch/2,Math.max(cw,ch)*0.75);
      vg.addColorStop(0,'rgba(170,60,30,0)');vg.addColorStop(1,`rgba(170,60,30,${a})`);ctx.fillStyle=vg;ctx.fillRect(0,0,cw,ch);}
  }
}
function star4(sx,sy,s,col){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(sx,sy-s*1.6);ctx.lineTo(sx+s*0.35,sy-s*0.35);ctx.lineTo(sx+s*1.6,sy);ctx.lineTo(sx+s*0.35,sy+s*0.35);
  ctx.lineTo(sx,sy+s*1.6);ctx.lineTo(sx-s*0.35,sy+s*0.35);ctx.lineTo(sx-s*1.6,sy);ctx.lineTo(sx-s*0.35,sy-s*0.35);ctx.closePath();ctx.fill();}
function edgeArrow(tx,ty,label,col){
  const wp=proj(X.x*S,0,X.y*S);
  // direction on screen: project a point along the ground direction from the walker
  const dx=tx-X.x,dy=ty-X.y,dl=Math.hypot(dx,dy)||1;const far=Math.min(dl,4000);
  const tp=proj((X.x+dx/dl*far)*S,0,(X.y+dy/dl*far)*S);
  const m=34*dpr,x0=m,x1=cw-m,y0=(scene==='exp'?142:118)*dpr,y1=ch-80*dpr;
  if(tp.on&&tp.x>x0&&tp.x<x1&&tp.y>y0&&tp.y<y1&&dl<1200)return;
  let ddx=tp.x-wp.x,ddy=tp.y-wp.y;if(tp.z>1){ddx=-ddx;ddy=-ddy;}const a=Math.atan2(ddy,ddx),cx=cw/2,cy=ch/2,ux=Math.cos(a),uy=Math.sin(a);
  const tx2=ux>0?(x1-cx)/ux:ux<0?(x0-cx)/ux:1e9,ty2=uy>0?(y1-cy)/uy:uy<0?(y0-cy)/uy:1e9;const t=Math.min(tx2,ty2);const px=cx+ux*t,py=cy+uy*t;
  ctx.save();ctx.translate(px,py);ctx.fillStyle='rgba(255,248,232,0.92)';ctx.beginPath();ctx.arc(0,0,15*dpr,0,6.283);ctx.fill();
  ctx.rotate(a);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(9*dpr,0);ctx.lineTo(-5*dpr,-6*dpr);ctx.lineTo(-2*dpr,0);ctx.lineTo(-5*dpr,6*dpr);ctx.closePath();ctx.fill();ctx.restore();
  ctx.font=`600 ${10*dpr}px ${FF}`;ctx.textAlign='center';ctx.fillStyle=col;ctx.fillText(label,px,py+(py>ch/2?-20*dpr:28*dpr));
}
const _dc={};function DW(id,p,v){const k=id+p;if(_dc[k]===v)return;_dc[k]=v;$(id).style[p]=v;}function DT(id,v){v=String(v);if(_dc[id]===v)return;_dc[id]=v;$(id).textContent=v;}
function updExpHUD(){const cap=X.cap,can=canteenCap(),w=clamp(X.water,0,cap);
  // thin horizontal bar: canteen (reserve) on the left, flask on the right – the flask is drunk first
  const cW=Math.min(w,can)/cap*100,fW=Math.max(w-can,0)/cap*100;DW('wfC','width',cW.toFixed(1)+'%');DW('wf','left',(can/cap*100).toFixed(1)+'%');DW('wf','width',fW.toFixed(1)+'%');
  DW('wdiv','left',(can/cap*100).toFixed(1)+'%');DW('wdiv','display',can?'':'none');
  DT('wt',fmtL(w)+' L');$('wt').classList.toggle('low',w/cap<0.25);
  DT('xd',fmtM(Math.hypot(X.x,X.y)));const wgt=weight();DT('xbag',wgt+'/'+bagCap());$('xbag').classList.toggle('warn',wgt>=bagCap());DT('xgold',X.cores);DT('xchip',X.chips||0);
  // context action (Zuro bubble + button)
  let st='',txt='',btn='',dis=false;
  if(X.intro){}
  else if(X.nearFoe&&gearLv('kladivo')){const f=X.nearFoe;st='f'+f.id+(X.smashCd>0);txt=f.stun>0?'It\'s stunned – hit it again!':f.alert<0.3?'It hasn\'t seen you. Hit it from behind!':'Careful, it sees you!';btn='{hammer} Smash';dis=X.smashCd>0;}
  else if(slingReady()){const f=X.foeNear;st='s'+f.id+(X.slingCd>0)+(X.scrap<1);txt=X.scrap<1?'No scrap left to shoot!':f.stun>0?'It\'s stunned – again!':'Shoot it with the slingshot!';btn='{sling} Shoot · 1 {scrap}';dis=X.slingCd>0||X.scrap<1;}
  else if(X.dis){st='dis';txt='Clang, clang… taking it apart!';btn='{hammer} Working…';dis=true;}
  else if(X.nearWreck){const W=WRECK[X.nearWreck.kind],hl=gearLv('kladivo');st='w'+X.nearWreck.id+hl+room();
    if(hl>=W.need){txt='Woof! '+W.name+'. Your {hammer} Hammer '+ROMAN[hl]+' can take it apart.';btn='{hammer} Dismantle';dis=room()<=0;if(dis)txt='Your backpack is full – nothing more fits.';}
    else{txt=W.name+'. We need {hammer} Hammer '+ROMAN[W.need]+' from the Workshop.';btn='{hammer} Needs Hammer '+ROMAN[W.need];dis=true;}}
  else if(X.nearCamp&&!SV.camps[X.nearCamp.id]){st='c'+X.nearCamp.id+(X.scrap>=CAMP_COST);txt='A good spot for '+X.nearCamp.name+'. Build it and you can travel here from home.';btn='{home} Build camp · '+CAMP_COST+' {scrap}';dis=X.scrap<CAMP_COST;}
  updCombatBtns();
  if(st!==X._act){X._act=st;const el=$('xact');if(!st)el.classList.add('hidden');else{el.classList.remove('hidden');$('xactTxt').innerHTML=zSay(txt);const b=$('bAct'),m=btn.match(/^\{(\w+)\}\s*(.*)$/);b.innerHTML=icx(m?`<span class="ai">{${m[1]}}</span><small>${m[2]}</small>`:`<small>${btn}</small>`);b.disabled=dis;}}}
function drawFloaters(){
  ctx.textAlign='center';ctx.font=`600 ${13*dpr}px ${FF}`;
  for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];const e=tNow-f.b;if(e>1.4){floaters.splice(i,1);continue;}const p=proj(f.x3,f.y3+e*1.2,f.z3);if(p.z>1)continue;
    ctx.globalAlpha=clamp(1.4-e,0,1);ctx.fillStyle=f.c;drawRich(ctx,f.t,p.x,p.y,13*dpr,'rgba(255,248,232,0.95)');}
  ctx.globalAlpha=1;
}

// ================= bot (testing only) =================
let botWait=0;
function botBase(dt){
  botWait-=dt;if(botWait>0)return;botWait=0.25;
  if(SV.fetch)return;
  const order=['cerpadlo','solar','dilna','solar','cerpadlo','dilna','dron','solar','cerpadlo','dilna','radio'];
  if(SV.b.dilna&&(SV.bottles||0)<2&&SV.scrap>=bottleCost()+20){SV.scrap-=bottleCost();SV.bottles=(SV.bottles||0)+1;save();return;}
  for(const k of order){if(canRepair(k)){doRepair(k);closeSheet();return;}}
  if(SV.b.dilna&&SV.scrap>=70&&SV.cores<2){SV.scrap-=30;SV.cores++;save();return;}
  for(const ck of ['kladivo','batoh','cutora','prak','boty','kompas']){const nx=CRAFT[ck].lv[gearLv(ck)];if(SV.b.dilna&&nx&&SV.scrap>=nx.s+10&&canPay(nx)){pay(nx);SV.craft[ck]=gearLv(ck)+1;save();return;}}
  if(SV.b.dron&&!SV.scout&&(SV.energy||0)>=DRONE.cost[SV.b.dron]+20){const a=Math.random()*6.283;startScout(Math.cos(a)*DRONE.range[SV.b.dron]*0.7,Math.sin(a)*DRONE.range[SV.b.dron]*0.7);}
  if(SV.bags.length&&dogLv()>=3&&SV.well>=3+waterCap()){sendWolt();return;}
  if(fillAmount()<Math.min(waterCap(),2))return;// wait for the well
  const camps=CAMPS.filter(c=>SV.camps[c.id]&&SV.well>=c.trip+waterCap());
  if(camps.length&&Math.random()<0.5)startExpedition(camps[Math.floor(Math.random()*camps.length)].id);else startExpedition();
}
// ================= MAP (Robin 20. 11.): a paper map the wanderer draws as he explores =================
// Unexplored land stays blank paper; explored land gets a watercolour wash per territory, craters are inked in,
// home, camps, lost bags and the last trip are drawn on top. Camps are chosen here instead of a list.
const MC=120;// map cell size (game units) – fog of war resolution
function markSeen(x,y,r){if(!SV.seen)SV.seen={};const R=Math.ceil(r/MC)+1,ci=Math.floor(x/MC),cj=Math.floor(y/MC);
  for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const cx=(ci+i+0.5)*MC,cy=(cj+j+0.5)*MC;if(Math.hypot(cx-x,cy-y)<=r)SV.seen[(ci+i)+','+(cj+j)]=1;}}
const isSeen=(x,y)=>!!(SV.seen&&SV.seen[Math.floor(x/MC)+','+Math.floor(y/MC)]);
const MAPC=ST.sunink?['#fff8ee','#eaf2f3','#f9d6c9','#ece4dc']:['#a07c46','#7d9298','#a05a3e','#7a7266'];// watercolour per territory
const MT=ST.sunink?{sea:'178,216,226',deep:'150,198,212',coast:'#5a9fb0',disc:'rgba(255,250,243,0.96)',wreck:'#d1962a',wreckNo:'rgba(90,61,52,0.4)',gold:'#e0554a',water:'#5a9fb0',roof:'#f2957f',wall:'#fffaf3',bag:'#d0483c',trip:'rgba(224,112,92,0.95)',dim:'rgba(90,61,52,0.6)',drone:'#c98a1e',droneF:'rgba(213,154,46,0.10)',sig:'#8f6cc0',cS:'#fffaf3'}
  :{sea:'40,112,124',deep:'26,74,88',coast:'#8fe0ee',disc:'rgba(29,26,24,0.88)',wreck:'#ffd36e',wreckNo:'rgba(255,226,184,0.55)',gold:'#ff6e5a',water:'#8fe0ee',roof:'#c8643c',wall:'#ffe2b8',bag:'#b2402a',trip:'rgba(255,154,106,0.9)',dim:'rgba(255,226,184,0.7)',drone:'#ffd36e',droneF:'rgba(255,211,110,0.05)',sig:'#c9a7e8',cS:'#1d1a18'};
const MV={open:false,mode:'base',cx:0,cy:0,sc:0.3,sel:null};
let paperPat=null;
function paperPattern(g){if(paperPat)return paperPat;const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d');p.fillStyle='#f1e4c6';p.fillRect(0,0,256,256);
  const r=mulberry32(5);for(let i=0;i<1800;i++){p.fillStyle=`rgba(${r()<0.5?'120,85,50':'255,250,235'},${0.04+r()*0.06})`;const x=r()*256,y=r()*256;p.fillRect(x,y,1+r()*2,1+r()*2);}
  for(let i=0;i<40;i++){p.strokeStyle=`rgba(140,100,60,${0.05+r()*0.05})`;p.lineWidth=0.6;p.beginPath();const x=r()*256,y=r()*256;p.moveTo(x,y);p.lineTo(x+(r()-0.5)*40,y+(r()-0.5)*12);p.stroke();}
  paperPat=g.createPattern(c,'repeat');return paperPat;}
function capsulePath(g,a,b,c2,d,r){const ang=Math.atan2(d-b,c2-a);g.beginPath();g.arc(a,b,r,ang+Math.PI/2,ang+Math.PI*1.5);g.arc(c2,d,r,ang-Math.PI/2,ang+Math.PI/2);g.closePath();}
function mixBiome(x,y){const cs=coastSD(x,y).d;if(cs<0)return cs>-150?MT.sea:MT.deep;const w=biomeW(x,y);let r=0,gg=0,b=0;MAPC.forEach((h,i)=>{const c=C(h);r+=c.r*w[i];gg+=c.g*w[i];b+=c.b*w[i];});return `${Math.round(r*255)},${Math.round(gg*255)},${Math.round(b*255)}`;}
const MINK=ST.sunink?'#4a3530':'#ffe2b8';
function drawMap(){const cv=$('mapc'),g=cv.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);const W=cv.clientWidth*dpr,H=cv.clientHeight*dpr;if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  const sc=MV.sc*dpr,toS=(x,y)=>[W/2+(x-MV.cx)*sc,H/2+(y-MV.cy)*sc];MV.hits=[];
  g.fillStyle=ST.sunink?'#f1dcc9':'#1d1a18';g.fillRect(0,0,W,H);
  if(ST.sunink){// unexplored land: fine diagonal hatching on the paper
    g.strokeStyle='rgba(90,61,52,0.085)';g.lineWidth=1*dpr;g.beginPath();const st=7*dpr,off=((MV.cx+MV.cy)*sc)%st;for(let x=-H-off;x<W;x+=st){g.moveTo(x,H);g.lineTo(x+H,0);}g.stroke();}
  {const step=MC*sc*2;if(step>14){g.strokeStyle=ST.sunink?'rgba(74,53,48,0.07)':'rgba(255,226,184,0.05)';g.lineWidth=1;const ox=(W/2-MV.cx*sc)%step,oy=(H/2-MV.cy*sc)%step;g.beginPath();for(let x=ox;x<W;x+=step){g.moveTo(x,0);g.lineTo(x,H);}for(let y=oy;y<H;y+=step){g.moveTo(0,y);g.lineTo(W,y);}g.stroke();}}
  // fog of war: watercolour blobs on explored cells
  const x0=MV.cx-W/2/sc,x1=MV.cx+W/2/sc,y0=MV.cy-H/2/sc,y1=MV.cy+H/2/sc;
  {const i0=Math.floor(x0/MC)-2,i1=Math.floor(x1/MC)+2,j0=Math.floor(y0/MC)-2,j1=Math.floor(y1/MC)+2,w=i1-i0+1,h=j1-j0+1;
   const oc=MV.oc||(MV.oc=document.createElement('canvas'));oc.width=w;oc.height=h;const og=oc.getContext('2d'),id=og.createImageData(w,h);
   for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){if(!SV.seen[i+','+j])continue;const c=mixBiome((i+0.5)*MC,(j+0.5)*MC).split(',').map(Number),o=((j-j0)*w+(i-i0))*4;id.data[o]=c[0];id.data[o+1]=c[1];id.data[o+2]=c[2];id.data[o+3]=ST.sunink?255:235;}
   og.putImageData(id,0,0);g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';const [sx,sy]=toS(i0*MC,j0*MC);
   // drawn twice (sharp + soft) so the edge fades like watercolour on paper
   if(!ST.sunink){g.globalAlpha=0.55;g.drawImage(oc,sx-MC*sc*0.5,sy-MC*sc*0.5,(w+1)*MC*sc,(h+1)*MC*sc);}g.globalAlpha=ST.sunink?1:0.85;g.drawImage(oc,sx,sy,w*MC*sc,h*MC*sc);g.restore();}
  // inked coastline with little wave strokes (only where explored)
  {const P=coastPts();g.strokeStyle=MT.coast;g.lineWidth=1.8*dpr;for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];if(!isSeen((a[0]+b[0])/2,(a[1]+b[1])/2))continue;const [ax,ay]=toS(a[0],a[1]),[bx,by]=toS(b[0],b[1]);g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.stroke();
    const n=coastSD((a[0]+b[0])/2,(a[1]+b[1])/2);const wx=(ax+bx)/2-n.nx*10*dpr,wy=(ay+by)/2-n.ny*10*dpr;g.lineWidth=1.2*dpr;g.beginPath();g.moveTo(wx-5*dpr,wy);g.quadraticCurveTo(wx-2.5*dpr,wy-3*dpr,wx,wy);g.quadraticCurveTo(wx+2.5*dpr,wy+3*dpr,wx+5*dpr,wy);g.stroke();g.lineWidth=1.8*dpr;}}
  const FULL=MV.mode==='view'||MV.mode==='exp',F=SV.mapF||{water:1},NEAR=sc>=0.09*dpr;
  // discoveries: only on the explorer's map, filtered (Robin 20. 11.: too many dots) – wrecks and gold only when zoomed in
  let budget={n:6},pend=false;
  if(FULL){const ico=(n,sx,sy,r,ring)=>{g.fillStyle=MT.disc;g.beginPath();g.arc(sx,sy,r,0,6.283);g.fill();g.lineWidth=1.6*dpr;g.strokeStyle=ring||MINK;g.stroke();const im=ICIMG[n],iz=r*1.45;if(im&&im.complete)g.drawImage(im,sx-iz/2,sy-iz/2,iz,iz);};
   const R0=11*dpr,on=(sx,sy)=>sx>-20&&sx<W+20&&sy>-20&&sy<H+20;
   for(let cy=Math.floor(y0/CH)-1;cy<=Math.floor(y1/CH)+1;cy++)for(let cx=Math.floor(x0/CH)-1;cx<=Math.floor(x1/CH)+1;cx++){
     const ox=cx*CH,oy=cy*CH;if(!(isSeen(ox+60,oy+60)||isSeen(ox+180,oy+60)||isSeen(ox+60,oy+180)||isSeen(ox+180,oy+180)))continue;const c=mapChunk(cx,cy,budget);if(!c){pend=true;continue;}
     if(F.water)for(const w of c.waters){if(w.taken||!isSeen(w.x,w.y))continue;const [sx,sy]=toS(w.x,w.y);if(!on(sx,sy))continue;if(sc>=0.07*dpr)ico('water',sx,sy,R0*0.85,MT.water);else{g.fillStyle=MT.water;g.beginPath();g.arc(sx,sy,3*dpr,0,6.283);g.fill();}MV.hits.push({x:sx,y:sy,t:'poi',k:'water',o:w});}
     if(F.wreck)for(const w of c.wrecks){if(!isSeen(w.x,w.y))continue;const [sx,sy]=toS(w.x,w.y);if(!on(sx,sy))continue;if(!NEAR){g.fillStyle=MT.wreck;g.fillRect(sx-2.5*dpr,sy-2.5*dpr,5*dpr,5*dpr);MV.hits.push({x:sx,y:sy,t:'poi',k:'wreck',o:w});continue;}const ok=gearLv('kladivo')>=WRECK[w.kind].need;ico('cog',sx,sy,R0*(w.kind===3?1.25:w.kind===1?1.1:1),ok?MT.wreck:MT.wreckNo);MV.hits.push({x:sx,y:sy,t:'poi',k:'wreck',o:w});}
     if(F.gold)for(const r of c.ruins){if(!r.core||!isSeen(r.x,r.y))continue;const [sx,sy]=toS(r.x,r.y);if(!on(sx,sy))continue;if(!NEAR){g.fillStyle=MT.gold;g.beginPath();g.arc(sx,sy,3*dpr,0,6.283);g.fill();MV.hits.push({x:sx,y:sy,t:'poi',k:'gold',o:r});continue;}ico('core',sx,sy,R0,MT.gold);MV.hits.push({x:sx,y:sy,t:'poi',k:'gold',o:r});}
     // chests stay off the map – they'd clutter it (they sparkle in the desert instead)
     }
   if(F.water)for(const k of (SV.caches||[])){const [sx,sy]=toS(k.x,k.y);ico('bottle',sx,sy,R0*0.9,MT.water);MV.hits.push({x:sx,y:sy,t:'poi',k:'cache',o:k});}}
  if(pend&&MV.rd)setTimeout(MV.rd,16);
  // planned route (tap anywhere to check if your water reaches)
  if(FULL&&MV.plan){const P=MV.plan,[ax,ay]=toS(P.sx,P.sy),[bx,by]=toS(P.tx,P.ty),[hx,hy]=toS(0,0);g.setLineDash([7*dpr,5*dpr]);g.lineWidth=2.6*dpr;g.strokeStyle=P.col;g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.stroke();
    if(P.sx||P.sy){g.globalAlpha=0.55;g.beginPath();g.moveTo(bx,by);g.lineTo(hx,hy);g.stroke();g.globalAlpha=1;}g.setLineDash([]);g.fillStyle=P.col;g.beginPath();g.arc(bx,by,5*dpr,0,6.283);g.fill();}
  // last trip (dashed ink)
  if(FULL&&SV.lastPath&&SV.lastPath.length>1){g.setLineDash([5*dpr,4*dpr]);g.lineWidth=1.8*dpr;g.strokeStyle=MT.trip;g.beginPath();SV.lastPath.forEach((p,i)=>{const [sx,sy]=toS(p[0],p[1]);i?g.lineTo(sx,sy):g.moveTo(sx,sy);});g.stroke();g.setLineDash([]);}
  const label=(t,sx,sy,col,b)=>{g.font=`${b?'600 ':''}${12*dpr}px ${FF}`;g.textAlign='center';g.textBaseline='top';g.lineWidth=3.5*dpr;g.strokeStyle=ST.sunink?'rgba(255,247,238,0.92)':'rgba(29,26,24,0.92)';g.strokeText(t,sx,sy);g.shadowColor=ST.sunink?'rgba(255,247,238,0)':'rgba(255,176,96,0.6)';g.shadowBlur=6*dpr;g.fillStyle=col||MINK;g.fillText(t,sx,sy);g.shadowBlur=0;};
  // home
  {const [sx,sy]=toS(0,0),s=11*dpr;g.fillStyle=MT.roof;g.strokeStyle=MINK;g.lineWidth=1.8*dpr;g.beginPath();g.moveTo(sx-s,sy);g.lineTo(sx,sy-s);g.lineTo(sx+s,sy);g.closePath();g.fill();g.stroke();
   g.fillStyle=MT.wall;g.fillRect(sx-s*0.75,sy,s*1.5,s*0.9);g.strokeRect(sx-s*0.75,sy,s*1.5,s*0.9);label('Home',sx,sy+s+3*dpr,MINK,1);MV.hits.push({x:sx,y:sy,t:'home'});}
  // camps
  for(const cp of CAMPS){const built=!!SV.camps[cp.id],seen=isSeen(cp.x,cp.y);if(!built&&(!seen||MV.mode==='go'))continue;const [sx,sy]=toS(cp.x,cp.y),s=10*dpr;
    g.beginPath();g.moveTo(sx-s,sy+s*0.6);g.lineTo(sx,sy-s);g.lineTo(sx+s,sy+s*0.6);g.closePath();g.lineWidth=1.8*dpr;g.strokeStyle=MINK;
    if(built){g.fillStyle=MT.roof;g.fill();g.stroke();g.beginPath();g.moveTo(sx,sy-s);g.lineTo(sx,sy-s*1.9);g.stroke();g.fillStyle='#57a6b6';g.fillRect(sx,sy-s*1.9,s*0.8,s*0.5);label(cp.name,sx,sy+s,MINK,1);}
    else{g.setLineDash([3*dpr,3*dpr]);g.stroke();g.setLineDash([]);label('camp site',sx,sy+s,MT.dim);}
    MV.hits.push({x:sx,y:sy,t:'camp',cp});}
  // lost bags
  if(FULL)for(const b of SV.bags){const [sx,sy]=toS(b.x,b.y),s=6*dpr;g.strokeStyle=MT.bag;g.lineWidth=2.6*dpr;g.beginPath();g.moveTo(sx-s,sy-s);g.lineTo(sx+s,sy+s);g.moveTo(sx+s,sy-s);g.lineTo(sx-s,sy+s);g.stroke();label('lost bag',sx,sy+s+2*dpr,MT.bag);}
  // you (on an expedition)
  if(MV.mode==='exp'&&X){const [sx,sy]=toS(X.x,X.y),fa=Math.atan2(Math.cos(X.face),Math.sin(X.face)),cr=34*dpr;
    const cg=g.createRadialGradient(sx,sy,0,sx,sy,cr);cg.addColorStop(0,'rgba(232,69,58,0.55)');cg.addColorStop(1,'rgba(232,69,58,0)');g.fillStyle=cg;g.beginPath();g.moveTo(sx,sy);g.arc(sx,sy,cr,fa-0.5,fa+0.5);g.closePath();g.fill();
    g.fillStyle='#e8453a';g.strokeStyle=MT.wall;g.lineWidth=2.2*dpr;g.beginPath();g.arc(sx,sy,6*dpr,0,6.283);g.fill();g.stroke();}
  // drone: where it is mapping right now / where it can fly
  if(SV.scout&&MV.mode!=='go'){const [sx,sy]=toS(SV.scout.x,SV.scout.y);g.setLineDash([4*dpr,4*dpr]);g.strokeStyle=MT.drone;g.lineWidth=1.6*dpr;g.beginPath();g.arc(sx,sy,SV.scout.r*sc,0,6.283);g.stroke();g.setLineDash([]);label('drone is mapping…',sx,sy,MT.drone,1);}
  if(MV.mode==='scout'&&SV.b.dron){const [hx,hy]=toS(0,0),R=DRONE.range[SV.b.dron]*sc;g.fillStyle=MT.droneF;g.strokeStyle=MT.drone;g.lineWidth=1.6*dpr;g.setLineDash([6*dpr,5*dpr]);g.beginPath();g.arc(hx,hy,R,0,6.283);g.fill();g.stroke();g.setLineDash([]);
    if(MV.pick){const [px,py]=toS(MV.pick.x,MV.pick.y);g.fillStyle=ST.sunink?'rgba(213,154,46,0.2)':'rgba(255,211,110,0.16)';g.strokeStyle=MT.drone;g.lineWidth=2*dpr;g.beginPath();g.arc(px,py,DRONE.r[SV.b.dron]*sc,0,6.283);g.fill();g.stroke();
      g.beginPath();g.moveTo(px-6*dpr,py);g.lineTo(px+6*dpr,py);g.moveTo(px,py-6*dpr);g.lineTo(px,py+6*dpr);g.stroke();}}
  // signal direction at the paper edge
  if(SV.b.radio&&MV.mode!=='go'){const a=Math.atan2(SIG.y-MV.cy,SIG.x-MV.cx),m=34*dpr;let ex=W/2+Math.cos(a)*W,ey=H/2+Math.sin(a)*H;const k=Math.min((W/2-m)/Math.abs(ex-W/2||1),(H/2-m)/Math.abs(ey-H/2||1));ex=W/2+(ex-W/2)*k;ey=clamp(H/2+(ey-H/2)*k,150*dpr,H-140*dpr);
    g.save();g.translate(ex,ey);g.rotate(a);g.fillStyle=MT.sig;g.beginPath();g.moveTo(12*dpr,0);g.lineTo(-6*dpr,-7*dpr);g.lineTo(-6*dpr,7*dpr);g.closePath();g.fill();g.restore();label('faint signal',ex,ey+10*dpr,MT.sig,1);}
  // compass rose
  {const cx=W-38*dpr,cy=H-118*dpr,s=16*dpr;g.strokeStyle=MINK;g.lineWidth=1.2*dpr;g.beginPath();g.arc(cx,cy,s*1.1,0,6.283);g.stroke();
   g.fillStyle=MINK;g.beginPath();g.moveTo(cx,cy-s*1.5);g.lineTo(cx+s*0.32,cy);g.lineTo(cx-s*0.32,cy);g.closePath();g.fill();g.fillStyle=MT.cS;g.beginPath();g.moveTo(cx,cy+s*1.5);g.lineTo(cx+s*0.32,cy);g.lineTo(cx-s*0.32,cy);g.closePath();g.fill();g.stroke();
   g.font=`600 ${11*dpr}px ${FF}`;g.textAlign='center';g.textBaseline='bottom';g.fillStyle=MINK;g.fillText('N',cx,cy-s*1.55);}
  // scale bar
  {let m=10;for(const v of [10,20,50,100,200,500,1000]){m=v;if(v/M_PER_U*MV.sc>=70)break;}const px=m/M_PER_U*sc,x=18*dpr,y=H-104*dpr;
   g.strokeStyle=MINK;g.lineWidth=2*dpr;g.beginPath();g.moveTo(x,y-4*dpr);g.lineTo(x,y);g.lineTo(x+px,y);g.lineTo(x+px,y-4*dpr);g.stroke();g.font=`italic ${11*dpr}px ${FF}`;g.textAlign='left';g.textBaseline='bottom';g.fillStyle=MINK;g.fillText(fmtMeters(m),x,y-6*dpr);}
  // worn paper edge
  const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,ST.sunink?'rgba(150,96,70,0.2)':'rgba(0,0,0,0.45)');g.fillStyle=vg;g.fillRect(0,0,W,H);
}
function openMap(mode){sfx.ui('open');MV.open=true;MV.mode=mode;MV.sel=null;const cx=mode==='exp'&&X?X.x:0,cy=mode==='exp'&&X?X.y:0;MV.cx=cx;MV.cy=cy;
  let R=600;if(mode!=='go')for(const k in SV.seen){const [i,j]=k.split(',').map(Number);R=Math.max(R,Math.hypot((i+0.5)*MC-cx,(j+0.5)*MC-cy)+MC);}for(const cp of CAMPS)if(SV.camps[cp.id])R=Math.max(R,Math.hypot(cp.x-cx,cp.y-cy)+200);if(mode==='scout'&&SV.b.dron)R=DRONE.range[SV.b.dron]*1.12;
  const cv=$('mapc');$('mapv').classList.remove('hidden');MV.sc=clamp(Math.min(cv.clientWidth,cv.clientHeight-120)/(2*R),0.04,1.2);
  MV.pick=null;MV.plan=null;MAPD.clear();$('mapTitle').textContent=mode==='go'?'Where to?':mode==='scout'?'Pick a spot to scout':'Map';syncMapFil();$('mcard').classList.add('hidden');drawMap();}
const MAPD=new Map();
function mapChunk(cx,cy,budget){const k=cx+','+cy;if(X&&X.chunks&&X.chunks.has(k)&&scene==='exp')return X.chunks.get(k);let c=MAPD.get(k);if(!c){if(budget&&budget.n--<=0)return null;c=genChunk(cx,cy,true);MAPD.set(k,c);}return c;}
// route planning (Robin 20. 11.): the map knows how much water you can carry and what water you know of on the way
function planTo(tx,ty){const ex=MV.mode==='exp'&&X&&!X.end,sx=ex?X.x:0,sy=ex?X.y:0;const d=Math.hypot(tx-sx,ty-sy),back=Math.hypot(tx,ty);
  const needT=d*WATER_PER_U*1.1,needB=back*WATER_PER_U*1.35;const have=ex?X.water+X.bottles*BOTTLE:fillAmount()+bottleFill()*BOTTLE;
  const segD=(px,py,ax,ay,bx,by)=>segPt(px,py,{x0:ax,y0:ay,x1:bx,y1:by}).d;let extra=0,n=0;
  const src=[];for(const k of (SV.caches||[]))src.push({x:k.x,y:k.y,v:k.v});
  for(const h of (MV.hits||[]))if(h.t==='poi'&&h.k==='water')src.push({x:h.o.x,y:h.o.y,v:h.o.v});
  for(const q of src){if(segD(q.x,q.y,sx,sy,tx,ty)<55||segD(q.x,q.y,tx,ty,0,0)<55){extra+=q.v;n++;}}
  const tot=have+extra,ok2=tot>=needT+needB,ok1=tot>=needT;
  return {sx,sy,tx,ty,d,needT,needB,have,extra,n,ok1,ok2,col:ok2?'#7ee0a8':ok1?'#ffd36e':'#ff6e5a',
    verdict:ok2?'You make it there and back':ok1?'You get there – but not back':'Too far – you\'d run dry on the way'};}
function planText(P){return fmtM(P.d)+(P.sx||P.sy?' from you':' from home')+' · needs ~'+fmtL(P.needT+P.needB)+' L there and back<br>You carry '+fmtL(P.have)+' L'+(P.n?' + '+fmtL(P.extra)+' L known water on the way ('+P.n+')':'')+'<br><small>Holes and robots can make the way longer.</small>';}
function closeMap(){MV.open=false;$('mapv').classList.add('hidden');}
function mapSelect(h){MV.sel=h;const c=$('mcard');if(!h){c.classList.add('hidden');if(MV.plan){MV.plan=null;drawMap();}return;}let t='',sub='',btn='',ok=true;
  if(h.t==='plan'||h.t==='poi'){const o=h.t==='poi'?h.o:h;const P=planTo(o.x,o.y);MV.plan=P;drawMap();
    if(h.t==='plan')t=P.verdict;else if(h.k==='wreck'){const W=WRECK[o.kind];t=W.name;sub=(gearLv('kladivo')>=W.need?'Your hammer can take it apart. ':'Needs {hammer} Hammer '+ROMAN[W.need]+'. ');}
    else if(h.k==='water'){t='Water puddle';sub='About '+fmtL(o.v)+' L. ';}else if(h.k==='gold'){t='Gold scrap';sub='Guarded by a drone. ';}else if(h.k==='chest'){t='Old chest';sub='Who knows what\'s inside. ';}else if(h.k==='cache'){t='Your bottle';sub=fmtL(o.v)+' L waiting for you. ';}
    sub+='<b style="color:'+P.col+'">'+(h.t==='poi'?P.verdict:'')+'</b>'+(h.t==='poi'?'<br>':'')+planText(P);
    $('mcT').textContent=t;$('mcS').innerHTML=icx(sub);$('mcB').style.display='none';c.classList.remove('hidden');return;}
  if(h.t==='scout'){const l=SV.b.dron,d=Math.hypot(MV.pick.x,MV.pick.y),inR=d<=DRONE.range[l],c2=DRONE.cost[l];t=inR?'Scout this area':'Too far for the drone';
    sub=fmtM(d)+' from home'+(inR?' · maps '+fmtM(DRONE.r[l])+' around it':' · range '+fmtM(DRONE.range[l])+'. Upgrade the drone to fly further.');btn='Send the drone · '+c2+' {energy}';ok=inR&&!SV.scout&&(SV.energy||0)>=c2;
    $('mcT').textContent=t;$('mcS').innerHTML=icx(sub);const b=$('mcB');b.style.display='';b.innerHTML=icx(btn);b.disabled=!ok;c.classList.remove('hidden');return;}
  if(h.t==='home'){t='Home';sub='Your village in the oasis. Well: '+Math.floor(SV.well)+' / '+wellCap()+' L';if(MV.mode==='go'){btn='Fill up &amp; go · '+fmtL(fillAmount())+' L';ok=fillAmount()>=0.5;}}
  else{const cp=h.cp;t=SV.camps[cp.id]?cp.name:'Camp site';sub=BIOME_NAME[biomeAt(cp.x,cp.y)]+' · '+fmtM(Math.hypot(cp.x,cp.y))+' from home';
    if(!SV.camps[cp.id])sub+='<br>Walk there and build the camp for '+CAMP_COST+' {scrap}.';
    else if(MV.mode==='go'){btn='Travel · '+cp.trip+' L + fill up';ok=SV.well>=cp.trip+0.5;if(!ok)sub+='<br>Not enough water in the well yet.';}}
  $('mcT').textContent=t;$('mcS').innerHTML=icx(sub);const b=$('mcB');b.style.display=btn?'':'none';b.innerHTML=btn;b.disabled=!ok;c.classList.remove('hidden');}
(function(){const cv=()=>$('mapc');let P=new Map(),drag=null,pin=null,moved=0;
  document.addEventListener('DOMContentLoaded',()=>{});
  const el=document.getElementById('mapc');
  const rd=()=>{if(!MV._raf)MV._raf=requestAnimationFrame(()=>{MV._raf=0;if(MV.open)drawMap();});};MV.rd=rd;
  const mid=a=>({x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2});
  const startPin=()=>{const a=[...P.values()],m=mid(a),r=el.getBoundingClientRect();pin={d:Math.max(20,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)),sc:MV.sc,m,wx:MV.cx+(m.x-r.left-r.width/2)/MV.sc,wy:MV.cy+(m.y-r.top-r.height/2)/MV.sc};drag=null;};
  el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}P.set(e.pointerId,{x:e.clientX,y:e.clientY});if(P.size===1){moved=0;drag={x:e.clientX,y:e.clientY,cx:MV.cx,cy:MV.cy};}if(P.size===2){moved=99;startPin();}});
  el.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;P.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pin&&P.size>=2){const a=[...P.values()],m=mid(a),r=el.getBoundingClientRect();MV.sc=clamp(pin.sc*Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)/pin.d,0.04,1.2);MV.cx=pin.wx-(m.x-r.left-r.width/2)/MV.sc;MV.cy=pin.wy-(m.y-r.top-r.height/2)/MV.sc;rd();}
    else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved=Math.max(moved,Math.hypot(dx,dy));MV.cx=drag.cx-dx/MV.sc;MV.cy=drag.cy-dy/MV.sc;rd();}});
  const up=e=>{if(!P.has(e.pointerId))return;P.delete(e.pointerId);if(P.size===2)startPin();if(P.size===1){pin=null;const q=[...P.values()][0];drag={x:q.x,y:q.y,cx:MV.cx,cy:MV.cy};}
    if(P.size===0){if(moved<6){const dpr=Math.min(2,window.devicePixelRatio||1),r=el.getBoundingClientRect(),x=(e.clientX-r.left)*dpr,y=(e.clientY-r.top)*dpr;
      if(MV.mode==='scout'){const W=el.clientWidth*dpr,H=el.clientHeight*dpr,sc=MV.sc*dpr,wx=MV.cx+(x-W/2)/sc,wy=MV.cy+(y-H/2)/sc;MV.pick={x:wx,y:wy};drawMap();mapSelect({t:'scout'});}
      else{let best=null,bd=30*dpr;for(const h of MV.hits){const d=Math.hypot(h.x-x,h.y-y);if(d<bd){bd=d;best=h;}}
        if(!best&&(MV.mode==='view'||MV.mode==='exp')){const W=el.clientWidth*dpr,H=el.clientHeight*dpr,sc=MV.sc*dpr;best={t:'plan',x:MV.cx+(x-W/2)/sc,y:MV.cy+(y-H/2)/sc};}mapSelect(best);}}drag=null;}};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('wheel',e=>{e.preventDefault();const r=el.getBoundingClientRect(),ox=e.clientX-r.left-r.width/2,oy=e.clientY-r.top-r.height/2,wx=MV.cx+ox/MV.sc,wy=MV.cy+oy/MV.sc;MV.sc=clamp(MV.sc*Math.exp(-e.deltaY*0.0015),0.04,1.2);MV.cx=wx-ox/MV.sc;MV.cy=wy-oy/MV.sc;rd();},{passive:false});
  $('mapX').addEventListener('click',closeMap);
  $('mcB').addEventListener('click',()=>{const h=MV.sel;if(h&&h.t==='scout'&&MV.pick){if(startScout(MV.pick.x,MV.pick.y)){closeMap();openBuilding('dron');}return;}if(!h||MV.mode!=='go')return;closeMap();if(h.t==='home')startExpedition();else startExpedition(h.cp.id);});
  window.addEventListener('resize',()=>{if(MV.open)drawMap();});
})();

// ================= input =================
const ray=new T.Raycaster(),ndc=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();
function setNdc(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,cam);}
function groundPoint(e,h){setNdc(e);plane.constant=-(h||0);if(!ray.ray.intersectPlane(plane,hit))return null;return {x:hit.x/S,y:hit.z/S};}
let ptr=false;const PTRS=new Map();let pinch=null;
// floating joystick (Robin 20. 11.): put a thumb anywhere and drag to walk; a quick tap still walks to that spot
let JOY=null;const joyEl=()=>$('joy');
function joyShow(on){const j=joyEl();if(!j)return;if(!on){j.classList.add('hidden');return;}const r=stage.getBoundingClientRect();j.classList.remove('hidden');j.style.left=(JOY.x0-r.left)+'px';j.style.top=(JOY.y0-r.top)+'px';joyKnob();}
function joyKnob(){const j=joyEl(),k=j&&j.querySelector('i');if(!k)return;let dx=JOY.x-JOY.x0,dy=JOY.y-JOY.y0;const L=Math.hypot(dx,dy),M=46;if(L>M){dx*=M/L;dy*=M/L;}k.style.transform=`translate(${dx}px,${dy}px)`;
  const ln=j.querySelector('.jl');if(ln){const l=Math.min(L,M),e=Math.max(0,l-28);ln.setAttribute('x2',(85+(l?dx/l*e:0)).toFixed(1));ln.setAttribute('y2',(85+(l?dy/l*e:0)).toFixed(1));ln.style.opacity=e>5?1:0;}}
const pdist=()=>{const v=[...PTRS.values()];return Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y)||1;};
canvas.addEventListener('wheel',e=>{if(scene==='exp')e.preventDefault();},{passive:false});// no manual zoom – the view is fixed
canvas.addEventListener('pointerdown',e=>{
  PTRS.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(PTRS.size===2&&scene==='exp'){ptr=false;if(X&&!X.end)X.dest=null;return;}
  if(PTRS.size>2)return;
  if(scene==='exp'&&X&&!X.end){if(!JOY)JOY={id:e.pointerId,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,t0:performance.now(),on:false};return;}
  if(scene==='base'){
    if(B.decorMode){const p=groundPoint(e,0);if(p)placeDecor(p.x,p.y);return;}
    setNdc(e);const hits=ray.intersectObjects(BS.clickables,true);
    for(const h of hits){let o=h.object;while(o&&!o.userData.bk&&!o.userData.house)o=o.parent;if(o){if(o.userData.house){openHouse();return;}openBuilding(o.userData.bk);return;}}
    const p=groundPoint(e,0);if(p){for(const k in BLD){const b=BLD[k];if(Math.hypot(p.x-b.x,p.y-b.y)<38){openBuilding(k);return;}}}
    closeSheet();
  }
});
addEventListener('pointermove',e=>{if(PTRS.has(e.pointerId))PTRS.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch&&PTRS.size===2){ZOOM=clamp(pinch.z*pinch.d/pdist(),ZMIN,ZMAX);SV.zoom=ZOOM;return;}if(JOY&&e.pointerId===JOY.id){JOY.x=e.clientX;JOY.y=e.clientY;if(!JOY.on&&Math.hypot(JOY.x-JOY.x0,JOY.y-JOY.y0)>12){JOY.on=true;joyShow(true);if(X)X.dest=null;}if(JOY.on)joyKnob();}});
function joyEnd(e,tap){if(!JOY||e.pointerId!==JOY.id)return;if(tap&&!JOY.on&&performance.now()-JOY.t0<450&&scene==='exp'&&X&&!X.end){const p=groundPoint({clientX:JOY.x0,clientY:JOY.y0},H2(X.x,X.y));if(p)X.dest=fixDest(p);}JOY=null;joyShow(false);}
addEventListener('pointerup',e=>{joyEnd(e,true);ptr=false;PTRS.delete(e.pointerId);if(PTRS.size<2)pinch=null;});addEventListener('pointercancel',e=>{joyEnd(e,false);ptr=false;PTRS.delete(e.pointerId);if(PTRS.size<2)pinch=null;});
const KM={ArrowUp:'u',w:'u',W:'u',ArrowDown:'d',s:'d',S:'d',ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r'};
addEventListener('keydown',e=>{if(KM[e.key]){kb[KM[e.key]]=1;if(scene==='exp')e.preventDefault();}});
addEventListener('keyup',e=>{if(KM[e.key])kb[KM[e.key]]=0;});
// two maps (Robin 20. 11.): 'go' = clean departure map (home + your camps only), 'view'/'exp' = the explorer's map with filters
$('bGo').addEventListener('click',()=>{if(CAMPS.some(c=>SV.camps[c.id]))openMap('go');else startExpedition();});
$('bMap').addEventListener('click',()=>openMap('view'));
document.querySelectorAll('#mfil button').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const f=b.dataset.f;SV.mapF=SV.mapF||{water:1};SV.mapF[f]=SV.mapF[f]?0:1;save();syncMapFil();mapSelect(null);drawMap();}));
function syncMapFil(){const F=SV.mapF||{water:1};document.querySelectorAll('#mfil button').forEach(b=>b.classList.toggle('on',!!F[b.dataset.f]));$('mfil').classList.toggle('hidden',!(MV.mode==='view'||MV.mode==='exp'));}
$('xMap').addEventListener('click',e=>{e.stopPropagation();if(X&&!X.end&&!X.intro)openMap('exp');});
$('bFetch').addEventListener('click',sendWolt);
const onPress=(el,fn)=>{el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!el.disabled)fn(e);});el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});};
onPress($('bAct'),()=>xAction());onPressLater.forEach(f=>f());
// no browser zoom inside the game (Robin 21. 11.: rapid taps on the slingshot zoomed the page on iPhone)
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
{let lastTE=0;document.addEventListener('touchend',e=>{const n=e.timeStamp;if(n-lastTE<380&&!e.target.closest('input,textarea,select'))e.preventDefault();lastTE=n;},{passive:false});}
document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1)e.preventDefault();},{passive:false});

// ================= title & loop =================
buildBase();scene3=BS.scene;
// portraits rendered from the game's own models (Robin 20. 11.: everything in the game's style, no outside pictures)
const PORTRAIT={};
function snapChars(kind,w,h){if(ST.sunink)return hSnapChars(kind,w,h);try{const r2=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r2.setPixelRatio(1);r2.setSize(w,h);r2.outputEncoding=T.sRGBEncoding;r2.shadowMap.enabled=true;r2.shadowMap.type=T.PCFSoftShadowMap;
    const sc=new T.Scene();setupLights(sc);const keep=SV.sex;let cam;
    const hero=sx=>{SV.sex=sx;const H=makeHero(heroGear());SV.sex=keep;return H;};
    if(kind==='f'||kind==='m'){const H=hero(kind);H.root.rotation.y=0.38;sc.add(H.root);cam=new T.PerspectiveCamera(26,w/h,0.1,50);cam.position.set(0.9,1.95,4.6);cam.lookAt(0,1.5,0);}
    else if(kind==='dog'){if(!WOLT)return null;const D=makeDog(dogGear());D.root.rotation.y=-0.5;sc.add(D.root);cam=new T.PerspectiveCamera(26,w/h,0.1,50);cam.position.set(0.6,1.3,4.0);cam.lookAt(0,0.62,0);}
    else{if(!WOLT)return null;const b=hero('m'),D=makeDog(dogGear());b.root.position.set(-0.45,0,0);b.root.rotation.y=0.35;D.root.position.set(0.75,0,0.55);D.root.rotation.y=-0.35;sc.add(b.root,D.root);
      cam=new T.PerspectiveCamera(28,w/h,0.1,60);cam.position.set(0,1.6,7.6);cam.lookAt(0,1.05,0);}
    const fl=new T.Mesh(new T.CircleGeometry(3,32),new T.ShadowMaterial({opacity:0.28}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;sc.add(fl);
    r2.render(sc,cam);const url=r2.domElement.toDataURL('image/png');r2.dispose();r2.forceContextLoss&&r2.forceContextLoss();return url;}catch(e){return null;}}
function refreshPortraits(){for(const [k,w,h] of [['m',360,400],['dog',360,400],['trio',540,600]]){if(!PORTRAIT[k]){const u=snapChars(k,w,h);if(u)PORTRAIT[k]=u;}}
  document.querySelectorAll('img[data-portrait]').forEach(im=>{const k=(im.dataset.portrait==='hero'||im.dataset.portrait==='f')?'m':im.dataset.portrait;if(PORTRAIT[k]){im.src=PORTRAIT[k];im.style.visibility='';}});}
window.__portrait=k=>PORTRAIT[k];window.__snap=(k,w,h)=>snapChars(k,w,h);
window.__animSnap=(k,t,ry,sx,zm,gx)=>{try{const w=220,h=300,r2=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r2.setSize(w,h);r2.outputEncoding=T.sRGBEncoding;const sc=new T.Scene();setupLights(sc);
  const keep=SV.sex;SV.sex=sx||'f';const H=makeHero(Object.assign(heroGear(),{tool:'hammer'},gx||{}));SV.sex=keep;H.root.rotation.y=ry||0;sc.add(H.root);if(H.sk){const P=new Float32Array(SK_NB*4+3);skSample(H.sk,skClip(k),t,P);skApply(H.sk,P);}else{const c=animClip(k);const P=new Float32Array(AF);sampleClip(c,t,P);applyPose(H,P);}if(k==='smash'||k==='fix')toolInHand(H,true);
  const cam=new T.PerspectiveCamera(30,w/h,0.1,50);if(zm){cam.position.set(0,2.0,2.3);cam.lookAt(0,1.62,0);}else{cam.position.set(0,1.6,5.2);cam.lookAt(0,1.0,0);}r2.render(sc,cam);const u=r2.domElement.toDataURL('image/png');r2.dispose();return u;}catch(e){return 'ERR '+e;}};
SV.sex='m';
(function buildTitle(){const el=$('tbtns');el.innerHTML='';
  // one wanderer only (Robin 21. 11.); no pictures on the title – the live village is the picture (22. 11.)
  const inp=document.createElement('input');inp.maxLength=14;inp.value=SV.name||'Wanderer';inp.placeholder='Your name';inp.setAttribute('aria-label','Your wanderer’s name');
  const lab=document.createElement('div');lab.className='lab';lab.textContent='Your wanderer’s name';
  const b=document.createElement('button');b.className='btn primary';b.textContent=hadSave?'Continue':'Start';
  b.addEventListener('click',()=>{SV.name=(inp.value||'Wanderer').trim().slice(0,14)||'Wanderer';SV.sex='m';save();initAudio();$('title').classList.add('hidden');enterBase();});
  el.appendChild(lab);el.appendChild(inp);el.appendChild(b);})();
if(BOT){$('title').classList.add('hidden');enterBase();}
let last=performance.now();
// debug: turnaround of both wanderers and Zuro (window.__charSheet())
let CSHEET=null;
window.__charSheet=()=>{const sc=new T.Scene();sc.background=C('#2a2420');setupLights(sc);const keep=SV.sex;const row=(z,mkf,sx)=>{for(let i=0;i<4;i++){const o=mkf();o.root.position.set((i-1.5)*2.3,z,0);o.root.rotation.y=[0,-Math.PI/2,Math.PI,0.6][i];o.root.scale.setScalar(sx);sc.add(o.root);}};
  SV.sex='m';row(1.9,()=>makeHero(heroGear()),1);SV.sex=keep;row(-1.4,()=>makeDog(dogGear()),1.15);
  const cam=new T.OrthographicCamera(-5,5,5*innerHeight/Math.max(1,stage.clientWidth),-5*innerHeight/Math.max(1,stage.clientWidth),0.1,100);cam.position.set(0,2.6,14);cam.lookAt(0,1.0,0);CSHEET={sc,cam};ov.style.display='none';};
function placeMute(){const p=scene==='exp'?$('xhud'):$('bhud'),m=$('mute');if(!p||!m||p.classList.contains('hidden'))return;const pr=p.querySelector('.wpanel');if(!pr)return;const b=pr.getBoundingClientRect().bottom-stage.getBoundingClientRect().top;const t=Math.round(b+(ST.sunink?16:10))+'px';if(m.style.top!==t){m.style.top=t;stage.style.setProperty('--hudb',Math.round(b)+'px');}const xm=$('xMap');if(xm&&xm.style.top!==t)xm.style.top=t;}
let muteT=0;
function frame(nowT){
  if(window.CATALOG)return;
  const rdt=(nowT-last)/1000,dt=Math.min(0.05,rdt);last=nowT;tNow+=dt;
  if(!ST.px&&!window.FIXQ&&rdt>0&&rdt<0.25&&!document.hidden){fpsAcc+=rdt;fpsN++;fpsT+=rdt;if(fpsT>2){const f=fpsN/fpsAcc;fpsAcc=fpsN=fpsT=0;
    if(f<54&&RQ>1){RQ=Math.max(1,RQ-0.25);R.setPixelRatio(RQ);R.setSize(stage.clientWidth,VH,false);fastT=0;}else if(f>58.5&&RQ<RQmax){fastT+=2;if(fastT>=8){RQ=Math.min(RQmax,RQ+0.25);R.setPixelRatio(RQ);R.setSize(stage.clientWidth,VH,false);fastT=0;}}else fastT=0;}}
  if(CSHEET){if(ST.sunink)inkRender(R,CSHEET.sc,CSHEET.cam);else R.render(CSHEET.sc,CSHEET.cam);requestAnimationFrame(frame);return;}
  if(scene!=='title'&&!(scene==='exp'&&X&&X.end))SV.tod=((SV.tod||0)+dt*(scene==='exp'?(window.SPD||1):1)/DAYLEN)%1;
  if(scene==='exp'&&X)applyDay(X.scene,X.sun);
  if(scene!=='title'){tickWell(dt*(window.SPD||1));checkFetch();checkScout();if(scene==='base'){updWellUI();if(SV.fetch){const r=Math.max(0,Math.ceil((SV.fetch.until-Date.now())/1000));const t2='Zuro is out… '+Math.floor(r/60)+':'+String(r%60).padStart(2,'0');if($('bGo').dataset.t!==t2){$('bGo').dataset.t=t2;$('bGo').innerHTML=t2;}}}}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on');}
  updParts(dt);if((muteT-=dt)<=0){muteT=0.5;placeMute();}
  if(scene==='exp'&&!MV.open){for(let q=0;q<(window.SPD||1)&&scene==='exp';q++)updateExp(dt);}
  else updateBase(dt);
  if(ST.sunink)inkRender(R,scene3,cam);else R.render(scene3,cam);
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cw,ch);
  if(scene==='exp'&&X){drawExpOverlay();
    if(!X.end)updExpHUD();}
  else if(scene!=='exp'&&scene!=='title')drawBaseOverlay();
  drawFloaters();
  requestAnimationFrame(frame);
}
window.__dbg={makeScrap,makeWreck,makeCrate,makeDrone,makeSeeker,makeGoldCog,makeBag,makeCamp,makeDeadTree,makeBoulder,makePuddle,makeCactus,makeBot,makeBuilding,makeRuin,makeChipDrop,makeCacheBottle,makeSaltCrystals,makeRubble,makeBrine,makeHero,makeDog,makePalm,makeHouse,heroGear,dogGear,makeLamp,makeBench,makeFlowers};
window.__hicons=only=>ST.sunink?hIconAtlas(only).toDataURL('image/png'):null;window.__woltReady=()=>!!WOLT;
window.__snd=()=>Object.keys(SBUF).length;window.__ps=(k)=>ps(k);window.__obst=(cx,cy)=>obstOf(cx,cy);window.__coast=(x,y)=>coastSD(x,y);window.__markSeen=(x,y,r)=>markSeen(x,y,r);window.__MVhits=()=>(MV.hits||[]).map(h=>({x:h.x,y:h.y,t:h.t,id:h.cp&&h.cp.id}));window.__segPt=segPt;window.__BS=BS;window.__camT=camT;window.__house=()=>openHouse();window.__close=()=>closeSheet();window.__SV=()=>SV;window.__rebuild=()=>{for(const k in BLD)rebuildBuilding(k);};window.__X=()=>X;window.__go=()=>startExpedition();window.__open=k=>openBuilding(k);window.__fix=p=>fixDest(p);window.__forX=(a,b,c,d,f)=>forX(a,b,c,d,f);
requestAnimationFrame(frame);
})();
