# Writes site/statistiky/index.html – Robin's private page with play statistics (2.13, Robin 23. 11.: "abych viděl, kolik hráčů
# hru zkusilo, jak dlouho ji hráli"). The page itself holds no numbers: it asks /api/stats (functions/api/stats.js) with a key
# that Robin opens it with once (…/statistiky/#k=<key>; the browser then remembers it) and does all the counting itself.
# Charts follow the house rules for data: one hue (Zuro's red, checked with the palette validator on white), thin bars with a
# rounded data end, figures printed beside the bars, a table for everything a chart shows, no numbers of people – the game
# gives players no number, so everything counts sittings (one opening of the game). Run by build.sh.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import json, page_style
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(root, 'versions.json'), encoding='utf8'))
key = lambda v: [int(x) for x in v['v'].split('.')]
have = [v for v in sorted(J['versions'], key=key, reverse=True) if os.path.exists(os.path.join(root, 'site', 'v' + v['v'], 'index.html'))]
fonts = ('../v%s/fonts/' % have[0]['v']) if have else '../fonts/'

CSS = '''
main{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
p.lead{margin:-4px 0 0;max-width:640px}
.filters{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
.seg{display:inline-flex;background:rgba(42,47,79,.07);border-radius:999px;padding:3px}
.seg button{font:600 14px/1 var(--ff);color:var(--gm);background:none;border:0;border-radius:999px;padding:9px 14px;cursor:pointer}
.seg button[aria-pressed=true]{background:#fff;color:var(--gi);box-shadow:0 2px 6px rgba(150,95,60,.16)}
.filters label{display:inline-flex;align-items:center;gap:7px;font-size:14px;color:var(--gm);cursor:pointer}
.filters select,.filters input[type=password]{font:500 14px/1 var(--ff);color:var(--gi);background:#fff;border:0;border-radius:999px;padding:9px 12px;box-shadow:0 2px 6px rgba(150,95,60,.12)}
.filters .re{margin-left:auto;font:600 14px/1 var(--ff);color:var(--gi);background:#fff;border:0;border-radius:999px;padding:9px 16px;cursor:pointer;box-shadow:0 2px 6px rgba(150,95,60,.12)}
button:focus-visible,select:focus-visible,input:focus-visible,.col:focus-visible{outline:3px solid var(--gi);outline-offset:2px}
#view{display:flex;flex-direction:column;gap:18px;transition:opacity .2s}#view.wait{opacity:.45}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:14px}
.tile{background:#fff;border-radius:22px;padding:16px 18px;box-shadow:0 6px 18px rgba(150,95,60,.12)}
.tile .l{font-size:13.5px;color:var(--gm)}
.tile .v{font:600 32px/1.1 var(--ff);letter-spacing:-.02em;margin:6px 0 2px}
.tile .n{font-size:13px;color:var(--gm);min-height:1.5em}
article h2{margin-bottom:2px}article .sub{color:var(--gm);font-size:14px;margin:0 0 14px}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}
/* meter list: a name, a thin bar on a lighter track of the same hue, the figure – bars share one baseline */
.ml{display:grid;grid-template-columns:minmax(96px,max-content) 1fr max-content;gap:9px 12px;align-items:center;font-size:14.5px}
.ml .nm{color:var(--gi)}.ml .fg{font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}.ml .fg small{color:var(--gm);font-size:13px;margin-left:6px}
.ml .tr{height:12px;border-radius:0 4px 4px 0;background:rgba(217,69,58,.11);overflow:hidden}
.ml .tr i{display:block;height:100%;background:var(--gr);border-radius:0 4px 4px 0;min-width:2px}
.ml .tr i.z{background:none;min-width:0}
/* columns per day */
.plot{position:relative;height:170px;margin:6px 0 0 34px;border-bottom:1px solid rgba(42,47,79,.16)}
.plot .gl{position:absolute;left:0;right:0;height:0;border-top:1px solid rgba(42,47,79,.08)}
.plot .gl span{position:absolute;left:-34px;top:-9px;width:28px;text-align:right;font-size:12px;color:var(--gm);font-variant-numeric:tabular-nums}
.cols{position:absolute;inset:0;display:flex;align-items:flex-end}
.col{flex:1 1 0;min-width:0;height:100%;display:flex;align-items:flex-end;justify-content:center;cursor:default;border-radius:6px}
.col i{display:block;width:min(24px,70%);background:var(--gr);border-radius:4px 4px 0 0}
.col:hover,.col:focus-visible{background:rgba(42,47,79,.05)}.col:hover i,.col:focus-visible i{filter:brightness(1.12)}
.xax{display:flex;margin:6px 0 0 34px;font-size:12px;color:var(--gm)}.xax span{flex:1 1 0;min-width:0;text-align:center;white-space:nowrap;overflow:visible}
#tip{position:fixed;z-index:9;pointer-events:none;background:var(--gi);color:#fff;border-radius:12px;padding:9px 12px;font-size:13px;line-height:1.5;box-shadow:0 8px 20px rgba(42,47,79,.25);display:none;max-width:240px}
#tip b{font-weight:600;font-size:15px}#tip span{opacity:.78}
table{width:100%;border-collapse:collapse;font-size:14px}
th{font-weight:500;color:var(--gm);text-align:right;padding:6px 8px;border-bottom:1px solid rgba(42,47,79,.14);white-space:nowrap}
td{padding:7px 8px;border-bottom:1px solid rgba(42,47,79,.07);text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
th:first-child,td:first-child,th.l,td.l{text-align:left}
tr:last-child td{border-bottom:0}
.scroll{overflow-x:auto}
details{margin-top:14px}summary{cursor:pointer;color:var(--gm);font-size:14px}
.pill{display:inline-block;font:600 11.5px/1 var(--ff);padding:4px 8px;border-radius:999px;background:rgba(42,47,79,.07);color:var(--gm);margin-left:6px}
.note{color:var(--gm);font-size:13.5px;margin:0}
.empty{color:var(--gm);padding:10px 0}
#gate{display:none}#gate form{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
#gate button{font:600 15px/1 var(--ff);color:#fff;border:0;border-radius:999px;padding:11px 20px;background:linear-gradient(180deg,#d6453a,#c93a30);cursor:pointer}
'''

JS = r'''
(function(){
const $=s=>document.querySelector(s);
const el=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e;};
const KEYN='zuroda_stats_key';let key='';
try{const m=(location.hash||'').match(/^#k=([\w-]{12,80})$/);if(m){localStorage.setItem(KEYN,m[1]);history.replaceState(null,'',location.pathname);}key=localStorage.getItem(KEYN)||'';}catch(_){}
let DATA=null;const F={days:7,own:false,ver:''};
const nf=new Intl.NumberFormat('cs-CZ');
const med=a=>{a=a.filter(x=>x!=null&&isFinite(x)).sort((x,y)=>x-y);if(!a.length)return null;const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2;};
const dur=s=>{if(s==null)return '–';s=Math.round(s);if(s<60)return s+' s';const m=Math.floor(s/60),r=s%60;if(m<60)return m+' min'+(r?' '+r+' s':'');return Math.floor(m/60)+' h '+(m%60)+' min';};
const pct=(a,b)=>b?Math.round(100*a/b)+' %':'–';
const dayAdd=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
const dayCz=d=>{const p=d.split('-');return (+p[2])+'. '+(+p[1])+'.';};
const clock=t=>new Date(t*1000).toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Prague'});
const BLD={dilna:'Workshop',cerpadlo:'Water Pump',solar:'Solar Field',dron:'Drone',radio:'Radio',dum:'Home'};
const END={home:'domů',camp:'do kempu',thirst:'došla voda'};
const vyp=n=>n===1?'výprava':n>=2&&n<=4?'výpravy':'výprav';

function gate(msg){$('#gate').style.display='block';$('#gmsg').textContent=msg;$('#view').style.display='none';$('.filters').style.display='none';}
async function load(){
  if(!key){gate('Stránka potřebuje klíč. Otevři ji odkazem, který jsi dostal (…/statistiky/#k=…), nebo klíč vlož sem – prohlížeč si ho pak pamatuje.');return;}
  $('#view').classList.add('wait');
  let r;try{r=await fetch('/api/stats?from=2026-11-01',{headers:{'x-key':key},cache:'no-store'});}catch(e){$('#view').classList.remove('wait');$('#state').textContent='Nepodařilo se spojit se serverem.';return;}
  if(r.status===401){gate('Tenhle klíč neplatí. Vlož správný.');return;}
  if(!r.ok){$('#view').classList.remove('wait');$('#state').textContent='Server odpověděl chybou '+r.status+'.';return;}
  DATA=await r.json();$('#gate').style.display='none';$('#view').style.display='';$('.filters').style.display='';
  const vs=[...new Set(DATA.sessions.map(s=>s.v).filter(Boolean))].sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
  const sel=$('#ver');sel.textContent='';sel.appendChild(new Option('všechny verze',''));for(const v of vs)sel.appendChild(new Option('verze '+v,v));sel.value=vs.includes(F.ver)?F.ver:'';F.ver=sel.value;
  $('#state').textContent='Načteno v '+new Date().toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});
  render();$('#view').classList.remove('wait');
}

function meter(rows,total){// rows: [name, count, extra?]; bars share one baseline, the figure stands beside each bar
  const g=el('div','ml');const mx=Math.max(1,...rows.map(r=>r[1]));
  for(const r of rows){g.appendChild(el('span','nm',r[0]));const t=el('div','tr'),i=el('i',r[1]?'':'z');i.style.width=(100*r[1]/mx)+'%';t.appendChild(i);g.appendChild(t);
    const f=el('span','fg',nf.format(r[1]));if(total)f.appendChild(el('small','',pct(r[1],total)));if(r[2])f.appendChild(el('small','',r[2]));g.appendChild(f);}
  return g;}
function table(head,rows,left){const w=el('div','scroll'),t=el('table'),h=el('tr');head.forEach((c,i)=>h.appendChild(el('th',left&&left.includes(i)?'l':'',c)));t.appendChild(h);
  for(const r of rows){const tr=el('tr');for(let i=0;i<r.length;i++){const c=r[i],td=el('td',left&&left.includes(i)?'l':'');if(c instanceof Node)td.appendChild(c);else td.textContent=c;tr.appendChild(td);}t.appendChild(tr);}w.appendChild(t);return w;}
function card(title,sub){const a=el('article');a.appendChild(el('h2','',title));if(sub)a.appendChild(el('p','sub',sub));return a;}
const tip=$('#tip');
function tipShow(node,lines){tip.textContent='';lines.forEach((l,i)=>{if(i)tip.appendChild(el('br'));if(Array.isArray(l)){tip.appendChild(el('b','',l[0]));tip.appendChild(el('span','',' '+l[1]));}else tip.appendChild(el('span','',l));});
  tip.style.display='block';const b=node.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;tip.style.left=Math.max(8,Math.min(innerWidth-w-8,b.left+b.width/2-w/2))+'px';tip.style.top=Math.max(8,b.top-h-8)+'px';}
const tipHide=()=>{tip.style.display='none';};

function render(){
  const V=$('#view');V.textContent='';
  const today=DATA.today,first=(DATA.total&&DATA.total.first)||today,from=F.days?dayAdd(today,-(F.days-1)):first;
  const inR=DATA.sessions.filter(s=>s.day>=from&&(!F.ver||s.v===F.ver));
  const bots=inR.filter(s=>s.bot).length,mine=inR.filter(s=>!s.bot&&s.own).length;
  const S=inR.filter(s=>!s.bot&&(F.own||!s.own)),ids=new Set(S.map(s=>s.sid));
  const E=DATA.exps.filter(e=>ids.has(e.sid)),U=DATA.ups.filter(u=>ids.has(u.sid));
  const st=S.filter(s=>s.st),ex1=S.filter(s=>s.ex>0),plays=st.map(s=>s.play||0),back=st.filter(s=>s.n0>0);

  // headline figures
  const T=el('div','tiles');const tile=(l,v,n)=>{const t=el('div','tile');t.appendChild(el('div','l',l));t.appendChild(el('div','v',v));t.appendChild(el('div','n',n||''));T.appendChild(t);};
  tile('Otevřeli hru',nf.format(S.length),'počet hraní');
  tile('Zmáčkli Start',nf.format(st.length),S.length?pct(st.length,S.length)+' z otevření':'');
  tile('Dokončili výpravu',nf.format(ex1.length),st.length?pct(ex1.length,st.length)+' z těch, kdo začali':'');
  tile('Typická doba hraní',dur(med(plays)),plays.length?'polovina hrála déle; nejdéle '+dur(Math.max(...plays)):'');
  tile('Pokračovali ve hře',nf.format(back.length),st.length?pct(back.length,st.length)+' začatých hraní navazovalo na rozehranou hru':'');
  V.appendChild(T);
  if(!S.length){const c=card('Zatím tu nic není','V tomhle období hru nikdo neotevřel – nebo jen roboti a tvoje označená zařízení.');V.appendChild(c);foot(V,bots,mine);return;}

  // first visit: where people drop off
  const N=S.filter(s=>!(s.n0>0)),fun=[['Otevřeli hru',N.length],['Hra se načetla',N.filter(s=>s.rd).length],['Zmáčkli Start',N.filter(s=>s.st).length]];
  for(const k of [1,2,3,5,10])fun.push([k===1?'1. výprava':k+' '+vyp(k),N.filter(s=>s.ex>=k).length]);
  const c1=card('První návštěva: kde lidé odpadají','Jen hraní, která začínala od nuly (bez rozehrané hry). Každý řádek je podíl z těch, kdo hru otevřeli.');
  c1.appendChild(meter(fun,N.length));V.appendChild(c1);

  // per day
  const d0=from<first?first:from,days=[];for(let d=d0;d<=today;d=dayAdd(d,1))days.push(d);
  const per=days.map(d=>{const a=S.filter(s=>s.day===d),b=a.filter(s=>s.st);return {d,open:a.length,st:b.length,exp:E.filter(e=>e.day===d).length,play:b.reduce((x,s)=>x+(s.play||0),0)};});
  const c2=card('Kolik hraní za den','Sloupec = kolikrát se ten den zmáčkl Start.');
  const mx=Math.max(1,...per.map(p=>p.st)),nice=m=>{if(m<=4)return 1;const q=Math.pow(10,Math.floor(Math.log10(m))),r=m/q;return (r<=2?0.5:r<=5?1:2)*q;},step=nice(mx),top=Math.ceil(mx/step)*step;
  const plot=el('div','plot');for(let v=step;v<=top;v+=step){const g=el('div','gl');g.style.bottom=(100*v/top)+'%';g.appendChild(el('span','',nf.format(v)));plot.appendChild(g);}
  const cols=el('div','cols');per.forEach(p=>{const c=el('div','col');c.tabIndex=0;c.setAttribute('role','img');c.setAttribute('aria-label',dayCz(p.d)+': Start '+p.st+'×, otevřeno '+p.open+'×');
    const i=el('i');i.style.height=(100*p.st/top)+'%';c.appendChild(i);
    const show=()=>tipShow(c,[dayCz(p.d),[nf.format(p.st),'× Start'],[nf.format(p.open),'× otevřeno'],[nf.format(p.exp),vyp(p.exp)],[dur(p.play),'hraní celkem']]);
    c.addEventListener('pointerenter',show);c.addEventListener('focus',show);c.addEventListener('pointerleave',tipHide);c.addEventListener('blur',tipHide);cols.appendChild(c);});
  plot.appendChild(cols);c2.appendChild(plot);
  const xa=el('div','xax'),every=Math.max(1,Math.ceil(per.length/8));per.forEach((p,i)=>xa.appendChild(el('span','',(i%every===0||i===per.length-1)&&!(i!==per.length-1&&per.length-1-i<every)?dayCz(p.d):'')));c2.appendChild(xa);
  const dt=el('details');dt.appendChild(el('summary','','Tabulka po dnech'));dt.appendChild(table(['Den','Otevřeno','Start','Výprav','Hraní celkem'],per.slice().reverse().map(p=>[dayCz(p.d),nf.format(p.open),nf.format(p.st),nf.format(p.exp),dur(p.play)])));c2.appendChild(dt);V.appendChild(c2);

  // expeditions by their order in the save
  const c3=card('Výpravy','Podle toho, kolikátá výprava to v uložené hře byla. Typická hodnota = medián.');
  if(E.length){const B=[[1,1,'1.'],[2,2,'2.'],[3,3,'3.'],[4,5,'4.–5.'],[6,10,'6.–10.'],[11,20,'11.–20.'],[21,1e9,'21. a další']];
    c3.appendChild(table(['Výprava','Počet','Typická délka','Typicky nejdál','Typicky ušli','Došla voda'],B.map(b=>{const a=E.filter(e=>e.n>=b[0]&&e.n<=b[1]);return a.length?[b[2],nf.format(a.length),dur(med(a.map(e=>e.a))),nf.format(Math.round(med(a.map(e=>e.b))))+' m',nf.format(Math.round(med(a.map(e=>e.c))))+' m',pct(a.filter(e=>e.s==='thirst').length,a.length)]:null;}).filter(Boolean)));
    const ends={};for(const e of E)ends[e.s]=(ends[e.s]||0)+1;const p=el('p','note','Jak výpravy končily: '+Object.keys(ends).sort((a,b)=>ends[b]-ends[a]).map(k=>(END[k]||k)+' '+nf.format(ends[k])+'×').join(', ')+'.');p.style.marginTop='12px';c3.appendChild(p);}
  else c3.appendChild(el('div','empty','V tomhle období nikdo žádnou výpravu nedokončil.'));
  V.appendChild(c3);

  // who plays
  const two=el('div','two');const grp=(title,sub,f,names,lim)=>{const m={};for(const s of st){const k=f(s);m[k]=(m[k]||0)+1;}let rows=Object.keys(m).map(k=>[names&&names[k]||k,m[k]]).sort((a,b)=>b[1]-a[1]);
    if(lim&&rows.length>lim){const rest=rows.slice(lim-1).reduce((x,r)=>x+r[1],0);rows=rows.slice(0,lim-1);rows.push(['ostatní',rest]);}
    const c=card(title,sub);if(rows.length)c.appendChild(meter(rows,st.length));else c.appendChild(el('div','empty','Zatím nikdo nezačal hrát.'));two.appendChild(c);};
  grp('Na čem hrají','Hraní, kde se zmáčkl Start.',s=>s.app?'app':s.dev,{m:'telefon nebo tablet',d:'počítač',app:'aplikace z plochy'});
  grp('Odkud jsou','Země podle Cloudflare.',s=>s.cc||'neznámá',null,7);
  grp('Odkud přišli','Stránka, ze které se na hru dostali.',s=>s.ref||'přímo (adresa, záložka, QR)',null,7);
  grp('Verze hry','',s=>s.v||'neznámá',null,7);
  V.appendChild(two);

  // what they build
  if(U.length){const m={};for(const u of U){const k=u.k==='up'?(u.s||'').replace(/^b:(.*)$/,(x,b)=>'budova '+(BLD[b]||b)).replace(/^g:/,'výbava '):u.k==='camp'?'kemp '+(u.s||''):u.k==='drill'?'vrták '+(u.s||''):'zeleň vesnice';m[k]=(m[k]||0)+1;}
    const rows=Object.keys(m).map(k=>[k,m[k]]).sort((a,b)=>b[1]-a[1]).slice(0,14);const c=card('Co si pořizují','Kolikrát se co vylepšilo, postavilo nebo našlo.');c.appendChild(meter(rows));V.appendChild(c);}

  // the latest sittings
  const c5=card('Poslední hraní','Nejnovější nahoře.');
  c5.appendChild(table(['Kdy','Zařízení','Země','Verze','Co se stalo','Hrálo se'],S.slice(0,30).map(s=>{const w=el('span','',s.st?(s.ex?nf.format(s.ex)+' '+vyp(s.ex):'Start, žádná výprava'):s.rd?'jen se načetla':'odešel při načítání');
    if(s.n0>0)w.appendChild(el('span','pill','rozehraná · už '+s.n0+' '+vyp(s.n0)));if(s.own)w.appendChild(el('span','pill','moje'));
    return [dayCz(s.day)+' '+clock(s.t0),s.app?'aplikace':s.dev==='m'?'telefon':'počítač',s.cc||'–',s.v||'–',w,s.st?dur(s.play||0):'–'];}),[0,1,2,3,4]));
  V.appendChild(c5);foot(V,bots,mine);
}
function foot(V,bots,mine){const a=[];if(bots)a.push(nf.format(bots)+'× robot');if(mine&&!F.own)a.push(nf.format(mine)+'× tvoje označená zařízení');
  V.appendChild(el('p','note','Počítají se hraní (jedno otevření hry), ne lidé – hra si hráče nijak nečísluje, takže kdo přijde třikrát, je tu třikrát. Doba hraní běží od Startu a jen když je hra vidět.'+(a.length?' V tomhle období vynecháno: '+a.join(', ')+'.':'')));}

document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{F.days=+b.dataset.d;document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));if(DATA)render();}));
$('#own').addEventListener('change',e=>{F.own=e.target.checked;if(DATA)render();});
$('#ver').addEventListener('change',e=>{F.ver=e.target.value;if(DATA)render();});
$('#re').addEventListener('click',load);
$('#gate form').addEventListener('submit',e=>{e.preventDefault();key=$('#gk').value.trim();try{localStorage.setItem(KEYN,key);}catch(_){}load();});
addEventListener('scroll',tipHide,{passive:true});
load();
})();
'''

page = '''<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<title>Zuroda – statistiky</title>
%(icon)s
<style>
%(css)s%(own)s</style>
</head>
<body>
<main>
<div class="top"><h1 aria-label="Zuroda">Zur<i></i>da<small>statistiky</small></h1><a href="../verze/">verze</a></div>
<p class="lead">Kolik lidí hru zkusilo, kam došli a jak dlouho hráli. Hra posílá jen anonymní poznámky o hraní – žádné cookies, žádná čísla hráčů.</p>
<div class="filters">
  <div class="seg" role="group" aria-label="Období"><button data-d="1" aria-pressed="false">Dnes</button><button data-d="7" aria-pressed="true">7 dní</button><button data-d="30" aria-pressed="false">30 dní</button><button data-d="0" aria-pressed="false">Vše</button></div>
  <select id="ver" aria-label="Verze hry"><option value="">všechny verze</option></select>
  <label><input type="checkbox" id="own"> počítat i moje zařízení</label>
  <button class="re" id="re">Obnovit</button>
</div>
<p class="note" id="state"></p>
<article id="gate"><h2>Klíč ke statistikám</h2><p class="sub" id="gmsg"></p><form class="filters"><input type="password" id="gk" aria-label="Klíč" autocomplete="off" placeholder="klíč"><button>Otevřít</button></form></article>
<div id="view"></div>
</main>
<div id="tip" role="tooltip"></div>
<script>%(js)s</script>
</body>
</html>
''' % {'icon': page_style.FAVICON, 'css': page_style.css(fonts), 'own': CSS, 'js': JS}
out = os.path.join(root, 'site', 'statistiky'); os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(page)
print('built site/statistiky/index.html')
