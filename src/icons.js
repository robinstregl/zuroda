// ================= Daleko icon set (one style: chunky dark outline, flat palette, soft highlight) =================
const ICO_O='#3a2a20';
// look H: the icons are drawn in their own style (same rule as STN in game.js)
const ICO_H=((window.FORCE_STYLE)||(new URLSearchParams(location.search).get('s'))||'sun')==='sun';
// the baked sheet of look-H icons: cell sizes, grid and the order of the icons (the baker in lookh.js reads the same list)
const HICON={L:160,S:64,cols:8,url:'img/hicons.png?v=1',names:['scrap','core','chip','energy','water','pack','hammer','canteen','boots','sling','compass','bottle','flowers','lamp','bench','palm',
  'sun','moon','dawn','dusk','hero','paw','levelup','check','close','wrench','signal','sound','mute','radio','chest','empty','cog','map','scroll','desert','home','drone']};
const ICON_SRC=(()=>{
  const g=(inner,sw)=>`<g fill="none" stroke="${ICO_O}" stroke-width="${sw||3.2}" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`;
  const hl=(d,o)=>`<path d="${d}" fill="#fff" opacity="${o||0.45}"/>`;
  const gear=(cx,cy,r1,r2,n)=>{let d='';for(let i=0;i<n*2;i++){const a0=(i/(n*2))*Math.PI*2,a1=((i+1)/(n*2))*Math.PI*2;const r=i%2?r1:r2;const p=(a,rr)=>`${(cx+Math.cos(a)*rr).toFixed(1)} ${(cy+Math.sin(a)*rr).toFixed(1)}`;d+=(i?'L':'M')+p(a0+0.06,r)+'L'+p(a1-0.06,r);}return d+'Z';};
  const S={};
  // --- resources ---
  S.scrap=g(`<path d="M32 7 L53 19 L53 43 L32 55 L11 43 L11 19 Z" fill="#9aa1a8"/><circle cx="32" cy="31" r="10" fill="#5d6168"/>`)+hl('M32 12 L48 21 L48 25 L32 16 L16 25 L16 21 Z')+`<path d="M41 43 l5 -2 l2 4 l-5 2z" fill="#a0623c"/>`;
  S.core=g(`<path d="M32 7 L53 19 L53 43 L32 55 L11 43 L11 19 Z" fill="#f2c14e"/><circle cx="32" cy="31" r="10" fill="#a8782a"/>`)+hl('M32 12 L48 21 L48 25 L32 16 L16 25 L16 21 Z',0.6)+`<path d="M48 6 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" fill="#fff6d2" stroke="${ICO_O}" stroke-width="1.6" stroke-linejoin="round"/>`;
  S.energy=g(`<path d="M37 4 L13 37 L29 37 L25 60 L51 25 L35 25 Z" fill="#f2c14e"/>`)+hl('M35 9 L19 33 L24 33 Z',0.5);
  S.melon=g(`<path d="M5 22 A27 27 0 0 0 59 22 Z" fill="#6f9a4e"/><path d="M10 22 A22 22 0 0 0 54 22 Z" fill="#f3ead2" stroke="none"/><path d="M13 22 A19 19 0 0 0 51 22 Z" fill="#e05a57"/>`)+
    [[22,29],[32,33],[42,29],[27,38],[37,38]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.8" fill="${ICO_O}"/>`).join('')+hl('M16 24 h10 a10 6 0 0 1 -10 6z',0.35);
  S.water=g(`<path d="M32 5 C32 5 11 30 11 42 A21 21 0 0 0 53 42 C53 30 32 5 32 5 Z" fill="#4fa3b3"/>`)+hl('M22 38 c0 -6 4 -12 7 -16 c-1 6 -2 11 -2 16 a3 3 0 0 1 -5 0z',0.6);
  S.pack=g(`<rect x="13" y="16" width="38" height="42" rx="10" fill="#9a6438"/><path d="M13 30 H51" /><rect x="22" y="34" width="20" height="14" rx="4" fill="#b8804c"/><path d="M24 16 V10 a8 8 0 0 1 16 0 V16"/>`)+`<rect x="29" y="27" width="6" height="6" rx="1.5" fill="#e0b04c" stroke="${ICO_O}" stroke-width="2"/>`+hl('M17 22 a6 6 0 0 1 6 -4 h4 v4z');
  // --- gear (crafted) ---
  S.chip=g(`<path d="M18 9 v6 M26 9 v6 M38 9 v6 M46 9 v6 M18 49 v6 M26 49 v6 M38 49 v6 M46 49 v6 M9 18 h6 M9 26 h6 M9 38 h6 M9 46 h6 M49 18 h6 M49 26 h6 M49 38 h6 M49 46 h6" stroke="#d9a441"/><rect x="14" y="14" width="36" height="36" rx="4" fill="#3f8a5a"/><rect x="23" y="23" width="18" height="18" rx="2" fill="#2b3436"/><path d="M27 32 h10 M32 27 v10" stroke="#7ee0a8" stroke-width="2.4"/>`)+hl('M17 17 h30 v4 h-30z',0.35);
  S.sling=g(`<path d="M32 60 L32 36 M32 37 L18 12 M32 37 L46 12" stroke-width="9" stroke="${ICO_O}"/><path d="M32 59 L32 36 M32 37 L18 13 M32 37 L46 13" stroke-width="5.5" stroke="#9a6438"/><path d="M18 13 Q32 30 46 13" stroke="#c0432f" stroke-width="2.6"/><circle cx="32" cy="24" r="5" fill="#8d949c"/>`);
  S.hammer=`<g transform="rotate(38 32 32)">`+g(`<rect x="28" y="22" width="8" height="38" rx="3" fill="#9a6438"/><rect x="12" y="8" width="40" height="15" rx="3" fill="#8d949c"/><rect x="12" y="8" width="9" height="15" rx="2" fill="#6b727a"/>`)+hl('M24 11 h24 v3 h-24z')+`</g>`;
  S.boots=g(`<path d="M16 7 H36 V35 L50 41 C55 43 57 46 57 50 V53 H11 V40 Z" fill="#9a6438"/><rect x="9" y="52" width="50" height="7" rx="2.5" fill="#5a3a26"/><path d="M22 18 h10 M22 25 h10 M22 32 h10" stroke-width="2.4"/>`)+hl('M19 10 h4 v24 h-4z',0.35);
  S.goggles=g(`<path d="M3 31 H61" stroke-width="7" stroke="#6e4426"/><path d="M3 31 H61" stroke-width="1"/><circle cx="20" cy="31" r="13" fill="#7a5a3a"/><circle cx="44" cy="31" r="13" fill="#7a5a3a"/><circle cx="20" cy="31" r="8" fill="#7fd0dc"/><circle cx="44" cy="31" r="8" fill="#7fd0dc"/>`)+hl('M15 28 a6 6 0 0 1 6 -5 v3 a3 3 0 0 0 -3 3z',0.7)+hl('M39 28 a6 6 0 0 1 6 -5 v3 a3 3 0 0 0 -3 3z',0.7);
  S.compass=g(`<circle cx="32" cy="34" r="24" fill="#e0b04c"/><circle cx="32" cy="34" r="18" fill="#f6ecd8"/><rect x="28" y="4" width="8" height="7" rx="2" fill="#e0b04c"/><path d="M32 18 L37 34 L27 34 Z" fill="#d9483b" stroke-width="2.4"/><path d="M27 34 L37 34 L32 50 Z" fill="#fff" stroke-width="2.4"/><circle cx="32" cy="34" r="2.6" fill="${ICO_O}"/>`)+hl('M18 26 a16 16 0 0 1 8 -8 l1 3 a13 13 0 0 0 -6 6z',0.6);
  S.bottle=g(`<path d="M27 13 Q27 19 21 24 Q17 28 17 34 V54 Q17 59 22 59 H42 Q47 59 47 54 V34 Q47 28 43 24 Q37 19 37 13 Z" fill="#8fd0e0"/><rect x="25" y="5" width="14" height="9" rx="2.5" fill="#c8643c"/><path d="M17 38 H47" stroke-width="2.4"/>`)+hl('M22 34 Q22 29 26 26 l2 2 Q25 31 25 34 V50 h-3z',0.55);
  S.canteen=g(`<path d="M10 14 Q32 2 54 14" stroke-width="4" stroke="#6e4426"/><path d="M10 14 Q32 2 54 14" stroke-width="1"/><circle cx="32" cy="38" r="20" fill="#6f9a7f"/><rect x="26" y="10" width="12" height="9" rx="2" fill="#5d6168"/><path d="M12 38 H52" stroke-width="2.4"/>`)+hl('M19 30 a14 14 0 0 1 8 -8 l1 3 a11 11 0 0 0 -6 6z',0.5);
  // --- decorations ---
  S.flowers=g(`<path d="M20 58 V36 M32 58 V28 M44 58 V38" stroke="#5f8a45" stroke-width="4"/><path d="M20 58 V36 M32 58 V28 M44 58 V38" stroke-width="1"/>`)+
    [[20,30,'#e9a0b0'],[32,20,'#f3d06b'],[44,32,'#fff3e0']].map(([x,y,c])=>g([0,1,2,3,4].map(i=>{const a=i/5*6.283-1.57;return `<circle cx="${(x+Math.cos(a)*6).toFixed(1)}" cy="${(y+Math.sin(a)*6).toFixed(1)}" r="4.6" fill="${c}"/>`}).join('')+`<circle cx="${x}" cy="${y}" r="3.6" fill="#e0a43c"/>`,2.4)).join('');
  S.lamp=`<circle cx="32" cy="24" r="17" fill="#ffd27a" opacity="0.45"/>`+g(`<path d="M32 36 V60 M24 60 H40" stroke-width="4"/><path d="M22 14 H42 L38 8 H26 Z" fill="#5d4a3a"/><rect x="24" y="14" width="16" height="20" rx="3" fill="#ffd98a"/><path d="M24 34 H40" />`)+hl('M27 17 h3 v14 h-3z',0.6);
  S.bench=g(`<rect x="8" y="16" width="48" height="10" rx="2.5" fill="#a87448"/><rect x="6" y="32" width="52" height="9" rx="2.5" fill="#b8804c"/><path d="M13 26 V32 M51 26 V32 M12 41 V56 M52 41 V56" stroke-width="5"/><path d="M13 26 V32 M51 26 V32 M12 41 V56 M52 41 V56" stroke="#8a5a34" stroke-width="2.4"/>`);
  S.palm=g(`<path d="M30 60 C30 46 34 34 31 24" stroke-width="8"/><path d="M30 60 C30 46 34 34 31 24" stroke="#8a6440" stroke-width="4.4"/><path d="M31 24 C22 14 12 16 6 22 C14 20 22 22 31 24 Z M31 24 C40 12 52 14 58 22 C50 19 40 21 31 24 Z M31 24 C26 12 30 6 36 4 C34 10 33 17 31 24 Z M31 24 C20 24 14 32 13 38 C19 32 25 28 31 24 Z M31 24 C42 24 49 31 51 37 C45 31 38 28 31 24 Z" fill="#7fa05a"/>`);
  // --- time of day ---
  S.sun=g(`<circle cx="32" cy="32" r="13" fill="#f2c14e"/>`+[0,1,2,3,4,5,6,7].map(i=>{const a=i/8*6.283;return `<path d="M${(32+Math.cos(a)*19).toFixed(1)} ${(32+Math.sin(a)*19).toFixed(1)} L${(32+Math.cos(a)*27).toFixed(1)} ${(32+Math.sin(a)*27).toFixed(1)}" stroke-width="4"/>`}).join(''))+hl('M24 29 a9 9 0 0 1 6 -6 l1 3 a6 6 0 0 0 -4 4z',0.6);
  S.moon=g(`<path d="M40 8 A24 24 0 1 0 56 44 A19 19 0 1 1 40 8 Z" fill="#f3e3a8"/>`)+`<circle cx="22" cy="30" r="3" fill="#e0cc86"/><circle cx="30" cy="44" r="2.2" fill="#e0cc86"/>`;
  S.dawn=g(`<path d="M14 44 A18 18 0 0 1 50 44 Z" fill="#f6b56a"/><path d="M6 44 H58" stroke-width="3.6"/>`+[-2,-1,0,1,2].map(i=>{const a=-1.57+i*0.55;return `<path d="M${(32+Math.cos(a)*24).toFixed(1)} ${(44+Math.sin(a)*24).toFixed(1)} L${(32+Math.cos(a)*31).toFixed(1)} ${(44+Math.sin(a)*31).toFixed(1)}" stroke-width="3.6"/>`}).join('')+`<path d="M14 52 H50 M22 58 H42" stroke-width="2.6"/>`);
  S.dusk=g(`<path d="M14 44 A18 18 0 0 1 50 44 Z" fill="#e8784a"/><path d="M6 44 H58" stroke-width="3.6"/><path d="M14 52 H50 M22 58 H42" stroke-width="2.6"/>`)+`<circle cx="12" cy="16" r="2" fill="#b8a0d0"/><circle cx="50" cy="12" r="2.4" fill="#b8a0d0"/><circle cx="36" cy="20" r="1.6" fill="#b8a0d0"/>`;
  // --- characters / progress ---
  S.paw=g(`<path d="M32 30 C22 30 15 40 17 48 C19 55 26 54 32 52 C38 54 45 55 47 48 C49 40 42 30 32 30 Z" fill="#4e7290"/><ellipse cx="17" cy="26" rx="5.5" ry="7" fill="#4e7290"/><ellipse cx="27" cy="16" rx="5.5" ry="7.5" fill="#4e7290"/><ellipse cx="37" cy="16" rx="5.5" ry="7.5" fill="#4e7290"/><ellipse cx="47" cy="26" rx="5.5" ry="7" fill="#4e7290"/>`)+hl('M24 38 a8 6 0 0 1 8 -4 v3 a5 4 0 0 0 -5 3z',0.4);
  S.hero=g(`<circle cx="32" cy="34" r="19" fill="#ebbb98"/><path d="M13 32 C12 14 26 8 34 10 C44 8 54 16 51 32 C46 24 40 22 36 20 C30 24 22 26 13 32 Z" fill="#45301f"/>`)+`<ellipse cx="25" cy="38" rx="2.6" ry="3.4" fill="${ICO_O}"/><ellipse cx="39" cy="38" rx="2.6" ry="3.4" fill="${ICO_O}"/><circle cx="20" cy="44" r="1.3" fill="#a0523a"/><circle cx="44" cy="44" r="1.3" fill="#a0523a"/>`+g(`<path d="M27 46 Q32 50 37 46" stroke-width="2.4"/>`);
  S.levelup=g(`<circle cx="32" cy="32" r="25" fill="#e0b04c"/><path d="M32 16 L46 32 H37 V48 H27 V32 H18 Z" fill="#fff8ea"/>`)+hl('M14 26 a19 19 0 0 1 10 -12 l1 3 a16 16 0 0 0 -8 10z',0.55);
  S.check=g(`<circle cx="32" cy="32" r="25" fill="#7fa05a"/><path d="M19 33 L28 42 L46 22" stroke="#fff8ea" stroke-width="7"/><path d="M19 33 L28 42 L46 22" stroke-width="0"/>`);
  S.close=g(`<path d="M16 16 L48 48 M48 16 L16 48" stroke-width="10"/><path d="M16 16 L48 48 M48 16 L16 48" stroke="#c8643c" stroke-width="5"/>`);
  // --- village / world ---
  S.wrench=`<g transform="rotate(-40 32 32)">`+g(`<path d="M28 20 H36 V58 a4 4 0 0 1 -8 0 Z" fill="#8d949c"/><path d="M22 6 a12 12 0 1 0 20 0 V14 a2 2 0 0 1 -2 2 H24 a2 2 0 0 1 -2 -2 Z" fill="#8d949c"/>`)+hl('M30 24 h3 v30 h-3z',0.5)+`</g>`;
  S.radio=g(`<path d="M40 24 L50 6" stroke-width="3"/><circle cx="50" cy="6" r="2.5" fill="${ICO_O}"/><rect x="8" y="24" width="48" height="32" rx="7" fill="#c8643c"/><circle cx="22" cy="40" r="8" fill="#5a3a26"/><path d="M36 34 H48 M36 40 H48 M36 46 H48" stroke-width="2.6"/>`)+hl('M12 28 h10 v3 h-10z',0.45);
  S.chest=g(`<path d="M8 30 A24 14 0 0 1 56 30 Z" fill="#a06a3c"/><rect x="8" y="30" width="48" height="26" rx="3" fill="#8a5a34"/><path d="M18 18 V56 M46 18 V56" stroke="#5d6168" stroke-width="5"/><path d="M18 18 V56 M46 18 V56" stroke-width="0"/><rect x="27" y="28" width="10" height="12" rx="2" fill="#e0b04c"/>`)+hl('M12 28 a22 12 0 0 1 12 -10 l1 3 a19 10 0 0 0 -10 8z',0.4);
  S.empty=g(`<path d="M8 32 L56 32 L56 56 L8 56 Z" fill="#8a5a34"/><path d="M8 32 L14 12 L58 12 L56 32" fill="#a06a3c"/><path d="M12 32 H52" stroke-width="2"/>`)+`<path d="M22 44 q4 -4 8 0 q4 4 8 0" fill="none" stroke="#e8d2a6" stroke-width="3" stroke-linecap="round"/>`;
  S.cog=g(`<path d="${gear(32,32,25,18,9)}" fill="#8d949c"/><circle cx="32" cy="32" r="8" fill="#5d6168"/>`)+hl('M18 24 a16 16 0 0 1 8 -8 l1 3 a13 13 0 0 0 -6 6z',0.5);
  S.map=g(`<path d="M8 14 L24 8 L40 14 L56 8 V50 L40 56 L24 50 L8 56 Z" fill="#f1e4c6"/><path d="M24 8 V50 M40 14 V56" stroke-width="2.2"/><path d="M14 40 Q20 30 28 34 T44 24" fill="none" stroke="#c8643c" stroke-width="2.6" stroke-dasharray="4 3"/><path d="M45 19 l4 4 m0 -4 l-4 4" stroke="#b2402a" stroke-width="2.6"/>`);
  S.scroll=g(`<rect x="14" y="10" width="36" height="44" rx="3" fill="#f3e7cf"/><path d="M10 10 a4 4 0 0 1 8 0 V54 a4 4 0 0 1 -8 0 Z M46 10 a4 4 0 0 1 8 0 V54 a4 4 0 0 1 -8 0 Z" fill="#d9c49a"/><path d="M22 22 H42 M22 30 H42 M22 38 H36" stroke-width="2.6"/>`);
  S.desert=g(`<circle cx="44" cy="20" r="9" fill="#f2c14e"/><path d="M2 46 Q18 30 34 46 Z" fill="#e2b46e"/><path d="M22 52 Q42 32 62 52 Z" fill="#d6a05c"/><path d="M2 56 H62" stroke-width="3"/>`);
  S.home=g(`<path d="M8 30 L32 10 L56 30 Z" fill="#c8643c"/><rect x="14" y="30" width="36" height="26" rx="2" fill="#efe1c4"/><rect x="27" y="38" width="10" height="18" rx="1.5" fill="#6a4a34"/><rect x="40" y="16" width="6" height="10" fill="#9aa1a8"/>`);
  S.bag=g(`<path d="M20 22 C10 30 10 54 32 56 C54 54 54 30 44 22 Z" fill="#b3a481"/><path d="M22 22 L42 22 L38 14 L26 14 Z" fill="#9a8a68"/><path d="M20 30 Q32 34 44 30" stroke-width="2.6"/>`)+`<path d="M26 14 l4 -6 l4 6" fill="#9a6a4a" stroke="${ICO_O}" stroke-width="2.4" stroke-linejoin="round"/>`+hl('M18 36 a12 14 0 0 1 4 -8 l2 2 a10 12 0 0 0 -3 7z',0.4);
  S.drone=g(`<path d="M6 28 H22 M42 28 H58" stroke-width="3"/><ellipse cx="14" cy="24" rx="9" ry="3" fill="#b8bec6"/><ellipse cx="50" cy="24" rx="9" ry="3" fill="#b8bec6"/><path d="M18 32 A14 10 0 0 1 46 32 Z" fill="#8b6aa0"/><rect x="16" y="32" width="32" height="8" rx="4" fill="#7a5a8c"/><circle cx="32" cy="46" r="5" fill="#ffd36e"/>`);
  S.signal=g(`<circle cx="32" cy="44" r="5" fill="#7a5a8c"/><path d="M22 34 a14 14 0 0 1 20 0 M15 27 a24 24 0 0 1 34 0 M8 20 a34 34 0 0 1 48 0" stroke-width="4"/>`);
  S.sound=g(`<path d="M26 44 V14 L48 8 V38" stroke-width="4"/><ellipse cx="20" cy="46" rx="8" ry="6" fill="#3a2a20"/><ellipse cx="42" cy="40" rx="8" ry="6" fill="#3a2a20"/>`);
  S.mute=S.sound+g(`<path d="M10 10 L54 54" stroke="#c8643c" stroke-width="6"/>`);
  S.full=S.pack+g(`<circle cx="50" cy="14" r="10" fill="#c0532f"/><path d="M50 9 V15 M50 19 V19.5" stroke="#fff8ea" stroke-width="3.4"/>`);

  // ---- look H (Robin 22. 11.): no drawn symbols – every icon is a small model of the game, drawn by the game's own pen and baked into one sheet
  // (hIconDefs / hIconAtlas in lookh.js, tools/render_icons.py). Each icon carries a large picture (tiles, toasts) and a small one (HUD, prices);
  // the CSS in head.html shows the right one. Both sit in a 64-unit box so every size rule for svg.ic keeps working.
  if(ICO_H){const {L,S:Sm,cols,names,url}=HICON,N=names.length,rowsL=Math.ceil(N/cols),W=cols*L,colsS=Math.floor(W/Sm),H=rowsL*L+Math.ceil(N/colsS)*Sm,k=64/L,ks=64/Sm;
    names.forEach((n,i)=>{const lx=(i%cols)*L,ly=Math.floor(i/cols)*L,sx=(i%colsS)*Sm,sy=rowsL*L+Math.floor(i/colsS)*Sm;
      S[n]=`<image class="hl" href="${url}" x="${-lx*k}" y="${-ly*k}" width="${W*k}" height="${H*k}"/><image class="hs" href="${url}" x="${-sx*ks}" y="${-sy*ks}" width="${W*ks}" height="${H*ks}"/>`;});}
  return S;})();
const ICON_NAMES={scrap:'Šrot',core:'Zlatý šrot',chip:'Čip',sling:'Prak',energy:'Energie',melon:'Meloun',bottle:'Láhev s vodou',water:'Voda',pack:'Batoh / kapacita',hammer:'Kladivo',boots:'Lehké boty',goggles:'Brýle proti oparu',compass:'Kompas',canteen:'Polní čutora',
  flowers:'Květiny',lamp:'Lampa',bench:'Lavička',palm:'Palma',sun:'Den',moon:'Noc',dawn:'Svítání',dusk:'Soumrak',paw:'Wolt (úroveň)',hero:'Poutník (úroveň)',levelup:'Nová úroveň',check:'Hotovo / vlastníš',close:'Zavřít',
  wrench:'Oprava',radio:'Rádio / zpráva',chest:'Truhla',empty:'Prázdná truhla',cog:'Vrak',scroll:'Útržek deníku',map:'Mapa',desert:'Poušť',home:'Domov',bag:'Ztracený vak',drone:'Mapovací dron',signal:'Signál',sound:'Zvuk',mute:'Zvuk vypnutý',full:'Plný batoh'};
const icSvg=(n,cls)=>`<svg class="ic ${cls||''}" viewBox="0 0 64 64" aria-hidden="true">${ICON_SRC[n]||''}</svg>`;
// text with tokens like "+3 {scrap}" -> HTML with inline icons
const icx=s=>String(s).replace(/\{([a-z]+)\}/g,(m,n)=>ICON_SRC[n]?icSvg(n):m);
// canvas images
const ICIMG={};for(const n in ICON_SRC){if(ICO_H&&HICON.names.indexOf(n)>=0)continue;const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128">${ICON_SRC[n]}</svg>`);ICIMG[n]=im;}
// look H: the canvas copies are cut from the baked sheet once it has loaded (small cells)
if(ICO_H){const at=new Image();at.onload=()=>{const {L,S,cols,names}=HICON,rowsL=Math.ceil(names.length/cols),colsS=Math.floor(cols*L/S);
  names.forEach((n,i)=>{const cv=document.createElement('canvas');cv.width=cv.height=S;cv.getContext('2d').drawImage(at,(i%colsS)*S,rowsL*L+Math.floor(i/colsS)*S,S,S,0,0,S,S);cv.complete=true;ICIMG[n]=cv;});};at.src=HICON.url;}
// draw text with icon tokens on a 2D canvas, honouring ctx.textAlign (left/center/right)
function drawRich(c,s,x,y,px,shadow){const parts=String(s).split(/(\{[a-z]+\})/).filter(Boolean);const isz=px*1.25;const al=c.textAlign;c.textAlign='left';
  const w=parts.map(p=>{const m=p.match(/^\{([a-z]+)\}$/);return m&&ICON_SRC[m[1]]?isz:c.measureText(p).width;});const tot=w.reduce((a,b)=>a+b,0);
  let cx=al==='center'?x-tot/2:al==='right'?x-tot:x;
  parts.forEach((p,i)=>{const m=p.match(/^\{([a-z]+)\}$/);if(m&&ICON_SRC[m[1]]){const im=ICIMG[m[1]];if(im&&im.complete)c.drawImage(im,cx,y-isz*0.82,isz,isz);}else{if(shadow){const f=c.fillStyle;c.fillStyle=shadow;c.fillText(p,cx+1.5,y+1.5);c.fillStyle=f;}c.fillText(p,cx,y);}cx+=w[i];});
  c.textAlign=al;}
