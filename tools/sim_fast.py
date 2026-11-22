# Balance checks without drawing: the built-in bot plays whole expeditions inside one browser call (window.__simExp in game.js),
# so a stage or an hour of play takes seconds instead of minutes.
#   sh build.sh <local three.min.js> <dir>/index.html ; serve <dir> on http://localhost:8765
#   python3 tools/sim_fast.py stages [N]      -> N expeditions (default 12) at six fixed stages of progress, on fresh ground each
#   python3 tools/sim_fast.py hour [minutes]  -> a fresh save played without breaks (15 s in the village between trips), log of what it owns
# The bot is a careful collector: it turns back when the water just covers the way home (×1.35) or the bag is full.
# A person wanders and hesitates, so count on 1.5–2× the time. It plays by day only (the clock does not run here).
import asyncio, sys, json
from playwright.async_api import async_playwright
URL = 'http://localhost:8765/index.html'
STAGES = {
 'S0 start':      dict(b=[0,0,0,0,0], craft={}, meters=0),
 'S1 first gear': dict(b=[2,1,2,0,0], craft=dict(kladivo=1,batoh=1,cutora=1), meters=300),
 'S2 early-mid':  dict(b=[3,3,3,1,0], craft=dict(kladivo=3,batoh=3,cutora=3,boty=2,kompas=1), meters=1500),
 'S3 mid':        dict(b=[5,5,5,3,0], craft=dict(kladivo=5,batoh=5,cutora=5,boty=4,prak=3,kompas=1), meters=4000),
 'S4 late':       dict(b=[8,8,8,6,2], craft=dict(kladivo=7,batoh=8,cutora=8,boty=7,prak=6,kompas=1), meters=9000),
 'S5 max':        dict(b=[10,10,10,10,6], craft=dict(kladivo=10,batoh=10,cutora=10,boty=10,prak=10,kompas=1), meters=18000),
}
SETUP = """(st=>{const S=__SV();['cerpadlo','solar','dilna','dron','radio'].forEach((k,i)=>S.b[k]=st.b[i]);S.craft=Object.assign({},st.craft);S.meters=st.meters;
  S.seed=424242;S.scrapT={};S.takenSet=new Set();S.bags=[];S.caches=[];S.camps={};S.exp=0;S.tod=0.3;S.scrap=0;S.cores=0;S.chips=0;S.well=999;S.energy=0;S.bottles=__bottleMax();return __lv()})"""
async def page(p):
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg = await b.new_page(viewport={'width': 180, 'height': 320}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    return b, pg, errs
async def fresh(pg):
    await pg.goto('about:blank'); await pg.goto(URL); await pg.evaluate('localStorage.clear()'); await pg.goto('about:blank'); await pg.goto(URL)
    await pg.wait_for_timeout(1500); await pg.evaluate("document.querySelector('#tbtns button').click()"); await pg.wait_for_timeout(500)
async def stages(n, only):
    async with async_playwright() as p:
        b, pg, errs = await page(p)
        for name, st in STAGES.items():
            if only and not any(o in name for o in only): continue
            await fresh(pg); lv = await pg.evaluate(SETUP, st); rows = []
            for i in range(n):
                r = await pg.evaluate("(()=>{const S=__SV();S.well=999;S.scrap=0;S.cores=0;S.chips=0;S.bags=[];S.bottles=__bottleMax();return __simExp()})()")
                if r: rows.append(r)
            k = max(1, len(rows)); avg = lambda f: sum(f(r) for r in rows) / k
            ends = {}
            for r in rows: e = ('ko' if r['ko'] else r['end']); ends[e] = ends.get(e, 0) + 1
            print(json.dumps({'stage': name, 'bag': lv[2], 'water_L': lv[3], 'bottles': rows[0]['nb0'] if rows else 0, 'n': len(rows), 'scrap': round(avg(lambda r: r['s']), 1), 'gold': round(avg(lambda r: r['c']), 2), 'chips': round(avg(lambda r: r['x']), 2),
                'secs': round(avg(lambda r: r['t'])), 'water_left_%': round(100 * avg(lambda r: r['left'] / r['cap'])), 'bottles_left': round(avg(lambda r: r['nb']), 1), 'bag_full_%': round(100 * avg(lambda r: min(1, r['load'] / r['bag']))),
                'robots_met': round(avg(lambda r: r['seen']), 1), 'robots_killed': round(avg(lambda r: r['kills']), 2), 'shots': round(avg(lambda r: r['shots']), 1), 'farthest_m': round(avg(lambda r: r['maxD'])), 'walked_m': round(avg(lambda r: r['walk'])), 'ends': ends, 'nudges': sum(r['stuck'] for r in rows)}), flush=True)
            print('   per trip (scrap, secs, water left %, end):', [(r['s'], round(r['t']), round(100 * r['left'] / r['cap']), ('ko' if r['ko'] else r['end'])[0]) for r in rows], flush=True)
        print('ERR', errs[:5]); await b.close()
async def hour(minutes):
    async with async_playwright() as p:
        b, pg, errs = await page(p); await fresh(pg)
        await pg.evaluate("(()=>{const S=__SV();S.seed=424242;S.tod=0.3;window.__g={t:0,n:0,ko:0,thirst:0,nudges:0,idle:0};return 1})()")
        marks = [7, 20, 30, 45, 60, 90, 120]; last = ''
        while True:
            r = await pg.evaluate("""(()=>{const S=__SV(),g=window.__g;const r=__simExp();if(!r){g.t+=5;__simShop(5);g.idle++;return {wait:1,t:g.t,well:S.well};}
              g.n++;g.t+=r.t;if(r.ko)g.ko++;else if(r.end==='thirst')g.thirst++;g.nudges+=r.stuck;__simShop(r.t+15);g.t+=15;const lv=__lv();
              return {t:Math.round(g.t),n:g.n,b:Object.values(S.b).join('-'),gear:['kladivo','batoh','cutora','boty','prak','kompas'].map(k=>S.craft[k]||0).join('-'),scrap:S.scrap,gold:S.cores,chips:S.chips||0,energy:Math.round(S.energy||0),well:Math.round(S.well),
                kills:(g.kills=(g.kills||0)+r.kills),chipsIn:(g.chipsIn=(g.chipsIn||0)+r.x),hero:lv[0],dog:lv[1],km:Math.round((S.meters||0)/100)/10,last:[r.s,Math.round(r.t),Math.round(100*r.left/r.cap),r.ko?'ko':r.end],ko:g.ko,thirst:g.thirst,nudges:g.nudges,camps:Object.keys(S.camps).length}})()""")
            if r.get('wait'):
                if r['t'] > minutes * 60: break
                continue
            key = r['b'] + '|' + r['gear']
            while marks and r['t'] >= marks[0] * 60: print('--- %d min ---' % marks.pop(0), json.dumps(r), flush=True)
            if key != last: last = key; print(json.dumps(r), flush=True)
            if r['t'] >= minutes * 60: print('END', json.dumps(r), flush=True); break
        print('ERR', errs[:5]); await b.close()
if len(sys.argv) > 1 and sys.argv[1] == 'hour': asyncio.run(hour(int(sys.argv[2]) if len(sys.argv) > 2 else 60))
else:
    a = sys.argv[2:] if len(sys.argv) > 1 and sys.argv[1] == 'stages' else sys.argv[1:]
    n = int(a[0]) if a and a[0].isdigit() else 12
    asyncio.run(stages(n, [x for x in a if not x.isdigit()]))
