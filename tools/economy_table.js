// Balance check 3: every price in the game as a table and the totals (node tools/economy_table.js).
// The formulas are copied from src/game.js (mkLv, mkGear) – update them here when they change there.
// 2.1: no energy in any price (the en column stays, all zeros).
const r5=v=>v<20?Math.round(v):Math.round(v/5)*5;
const mkLv=o=>Array.from({length:10},(_,i)=>({s:r5(o.sc*Math.pow(o.g,i)),c:o.c[i]||0,x:o.x[i]||0,en:0}));
const B={pump:mkLv({sc:10,g:1.5,c:[0,0,1,2,3,4,6,8,11,15],x:[0,0,0,0,1,2,3,4,6,8],e0:6,eg:1.38}),
 solar:mkLv({sc:18,g:1.45,c:[0,0,1,2,3,5,7,9,12,16],x:[0,0,0,0,1,2,3,5,7,9],e0:0,eg:1}),
 workshop:mkLv({sc:24,g:1.45,c:[0,0,1,2,3,4,6,8,10,13],x:[0,0,0,0,1,2,3,4,6,8],e0:10,eg:1.36}),
 drone:mkLv({sc:40,g:1.42,c:[2,3,4,5,7,9,11,14,18,22],x:[0,0,0,1,2,3,4,6,8,10],e0:15,eg:1.3}),
 radio:mkLv({sc:400,g:1.3,c:[12,15,19,24,30,37,46,57,70,86],x:[3,4,5,7,9,11,14,17,21,25],e0:120,eg:1.15})};
const IG=[0,0,1,2,3,4,6,8,10,13],IX=[0,0,0,0,1,2,3,4,6,8];
const mkGear=(sc,e0)=>Array.from({length:10},(_,i)=>({s:r5(sc*Math.pow(1.45,i)),c:IG[i],x:IX[i],en:0}));
const Gr={hammer:mkGear(10,4),pack:mkGear(16,6),canteen:mkGear(14,5),boots:mkGear(16,6),sling:mkGear(30,8)};
const sum=(a,k)=>a.reduce((t,o)=>t+o[k],0);
const row=(n,a)=>console.log(n.padEnd(9),'scrap',a.map(o=>o.s).join(' ').padEnd(52),'| gold',a.map(o=>o.c).join(' ').padEnd(30),'| chips',a.map(o=>o.x).join(' ').padEnd(26),'| en',a.map(o=>o.en).join(' '));
for(const k in B)row(k,B[k]);for(const k in Gr)row(k,Gr[k]);
let T={s:0,c:0,x:0,en:0};const tot=(n,a)=>{const t={s:sum(a,'s'),c:sum(a,'c'),x:sum(a,'x'),en:sum(a,'en')};console.log('TOTAL',n.padEnd(9),JSON.stringify(t));for(const k in T)T[k]+=t[k];};
for(const k in B)tot(k,B[k]);for(const k in Gr)tot(k,Gr[k]);T.s+=24;T.c+=1;T.en+=6;console.log('ALL (with compass)',JSON.stringify(T));
// without the radio
let R={s:sum(B.radio,'s'),c:sum(B.radio,'c'),x:sum(B.radio,'x'),en:sum(B.radio,'en')};console.log('radio share of everything: scrap',(R.s/T.s*100).toFixed(0)+'%','gold',(R.c/T.c*100).toFixed(0)+'%','chips',(R.x/T.x*100).toFixed(0)+'%');
// cumulative cost to bring everything (except radio) to level n
for(const n of [1,2,3,5,7,10]){let s=0,c=0,x=0,e=0;for(const k of ['pump','solar','workshop','drone'])for(let i=0;i<n;i++){s+=B[k][i].s;c+=B[k][i].c;x+=B[k][i].x;e+=B[k][i].en;}for(const k in Gr)for(let i=0;i<n;i++){s+=Gr[k][i].s;c+=Gr[k][i].c;x+=Gr[k][i].x;e+=Gr[k][i].en;}console.log('everything but radio to level',n,'-> scrap',s,'gold',c,'chips',x,'energy',e);}
// bottles
let bs=0;for(let i=0;i<2;i++)bs+=6+4*i;console.log('2 bottles scrap',bs);
// hero / dog levels
const hr=n=>60*Math.pow(n-1,1.7),dr=n=>120*Math.pow(n-1,1.7);console.log('hero lvl m:',[2,3,5,10,15,20,25,30].map(n=>n+':'+Math.round(hr(n))).join(' '),'| dog:',[2,3,5,10,15].map(n=>n+':'+Math.round(dr(n))).join(' '));
// 2.4: camps on the way to the signal (CAMP_DEF in game.js) – name, metres from home, scrap, gold, chips, well water for the one-tap trip
const CAMPS=[['Dune',312,12,0,0,2],['Rock Gate',705,40,2,0,3],['Red Mesa',1176,80,5,4,4],['Broken Road',1732,130,8,8,5],['Station',2337,190,12,14,6],['Salt Gate',3001,260,16,20,7],['Salt Lake',3702,340,22,28,8]];
for(const c of CAMPS)console.log('camp',c[0].padEnd(12),(c[1]+' m').padEnd(7),'scrap',String(c[2]).padEnd(4),'gold',String(c[3]).padEnd(3),'chips',String(c[4]).padEnd(3),'trip',c[5]+' L');
console.log('TOTAL camps',JSON.stringify({s:CAMPS.reduce((a,c)=>a+c[2],0),c:CAMPS.reduce((a,c)=>a+c[3],0),x:CAMPS.reduce((a,c)=>a+c[4],0)}));
