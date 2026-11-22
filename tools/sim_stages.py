# Balance check 1: plays N expeditions with the built-in bot at a fixed stage of progress and logs what each one brought
# (scrap, gold, chips, seconds, metres, how it ended, how much water was left).
#   sh build.sh <local three.min.js> <dir>/index.html ; serve <dir> on http://localhost:8765
#   python3 tools/sim_stages.py [S0 S3 ...]
# The bot is a careful collector (always turns back in time); a person is slower. When it gets stuck on a crater it is nudged sideways.
import asyncio, sys, json
from playwright.async_api import async_playwright
STAGES = {
 'S0 start':        dict(b=[0,0,0,0,0], craft={}, meters=0),
 'S1 first gear':   dict(b=[2,1,2,0,0], craft=dict(kladivo=1,batoh=1,cutora=1), meters=300),
 'S2 early-mid':    dict(b=[3,3,3,1,0], craft=dict(kladivo=3,batoh=3,cutora=3,boty=2,kompas=1), meters=1500),
 'S3 mid':          dict(b=[5,5,5,3,0], craft=dict(kladivo=5,batoh=5,cutora=5,boty=4,prak=3,kompas=1), meters=4000),
 'S4 late':         dict(b=[8,8,8,6,2], craft=dict(kladivo=7,batoh=8,cutora=8,boty=7,prak=6,kompas=1), meters=9000),
 'S5 max':          dict(b=[10,10,10,10,6], craft=dict(kladivo=10,batoh=10,cutora=10,boty=10,prak=10,kompas=1), meters=18000),
}
only = sys.argv[1:] ; N = 7
async def run(pg, name, st):
    await pg.goto('about:blank'); await pg.goto('http://localhost:8765/index.html#bot'); await pg.evaluate('localStorage.clear()'); await pg.goto('about:blank'); await pg.goto('http://localhost:8765/index.html#bot')
    await pg.wait_for_timeout(1500)
    setup = "(st=>{const S=__SV();const ks=['cerpadlo','solar','dilna','dron','radio'];ks.forEach((k,i)=>S.b[k]=st.b[i]);S.craft=Object.assign({},st.craft);S.meters=st.meters;S.scrap=0;S.cores=0;S.chips=0;S.well=999;S.energy=0;S.bottles=st.craft.batoh?2+st.craft.batoh:0;S.seed=777777;window.SPD=40;return 1})"
    await pg.evaluate(setup, st)
    rows = []; seen = -1; idle = 0
    for i in range(4000):
        await pg.wait_for_timeout(150)
        r = await pg.evaluate("(st=>{const S=__SV(),X=__X();const ks=['cerpadlo','solar','dilna','dron','radio'];ks.forEach((k,i)=>S.b[k]=st.b[i]);S.craft=Object.assign({},st.craft);S.well=Math.max(S.well,200);S.scrap=0;S.cores=0;S.chips=0;S.energy=0;S.bags=[];const g=window.__g||(window.__g={lx:0,ly:0,same:0,n:0});if(X&&!X.end){if(Math.abs(X.x-g.lx)<1&&Math.abs(X.y-g.ly)<1&&!X.dis){g.same++;if(g.same>14){const a=Math.atan2(X.y,X.x)+1.57;X.x+=Math.cos(a)*70;X.y+=Math.sin(a)*70;g.same=0;g.n++;}}else g.same=0;g.lx=X.x;g.ly=X.y;}if(!X||!X.end)return X?{run:1,t:X.t,x:X.x,y:X.y,w:X.water}:null;return {exp:S.exp,end:X.end,ko:X.ko||'',s:X.scrap,c:X.cores,x:X.chips||0,t:X.endT,walk:X.walked/10,maxD:X.maxD,lostS:X.lostS||0,cap:X.cap,w:X.water,bot:X.bottles||0,bag:X.scrap+X.cores*2+(X.chips||0)}})", st)
        if r and 'exp' in r and r['exp'] != seen:
            seen = r['exp']; rows.append(r); idle = 0
            if len(rows) >= N: break
        else:
            idle += 1
            if idle > 1500: rows.append({'stall': r}); break
    ok = [r for r in rows if 'exp' in r]
    n = max(1, len(ok)); avg = lambda k: sum(r[k] for r in ok) / n
    print(json.dumps({'stage': name, 'n': len(ok), 'scrap': round(avg('s'), 1), 'gold': round(avg('c'), 2), 'chips': round(avg('x'), 2), 'secs': round(avg('t')), 'walk_m': round(avg('walk')), 'maxD_m': round(avg('maxD') / 10) if ok and ok[0]['maxD'] > 500 else round(avg('maxD')), 'home': sum(1 for r in ok if r['end'] == 'home'), 'ko': sum(1 for r in ok if r['ko']), 'thirst': sum(1 for r in ok if r['end'] == 'thirst' and not r['ko']), 'lost': round(avg('lostS'), 1), 'water_left_pct': round(100*sum(max(0,r['w'])/r['cap'] for r in ok)/n), 'cap_L': ok[0]['cap'] if ok else 0, 'bottles_left': round(avg('bot'),1), 'bagload': round(avg('bag')), 'stall': [r for r in rows if 'stall' in r][:1]}), flush=True)
    print('   per-exp:', [(r['s'], r['c'], r['x'], round(r['t']), r['end'][0] + ('!' if r['ko'] else '')) for r in ok], flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 180, 'height': 320})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        for name, st in STAGES.items():
            if only and not any(o in name for o in only): continue
            await run(pg, name, st)
        print('ERR', errs[:5]); await b.close()
asyncio.run(main())
