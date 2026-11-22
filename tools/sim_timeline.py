# Balance check 2: a fresh save played by the bot without breaks – what does it own after N expeditions / T minutes?
#   python3 tools/sim_timeline.py [expeditions]   (same local server as sim_stages.py)
# The well and the battery are topped up for the game time that really passed, so water/energy walls show up.
import asyncio, sys, json
from playwright.async_api import async_playwright
MAXEXP = int(sys.argv[1]) if len(sys.argv) > 1 else 80
BASE_SECS = 15   # seconds a person spends in the village between two trips
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 180, 'height': 320}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html#bot'); await pg.evaluate('localStorage.clear()'); await pg.goto('about:blank'); await pg.goto('http://localhost:8765/index.html#bot')
        await pg.wait_for_timeout(1500); await pg.evaluate("(()=>{__SV().seed=424242;window.SPD=40;window.__g={t:0,seen:-1,lx:0,ly:0,same:0,waitW:0,nudges:0,ko:0,thirst:0};return 1})()")
        last = ''; rows = []
        for i in range(20000):
            await pg.wait_for_timeout(200)
            r = await pg.evaluate("""(BS=>{const S=__SV(),X=__X(),g=window.__g;const wr=[0.6,1,1.3,1.7,2.1,2.6,3.1,3.7,4.3,5,5.8][S.b.cerpadlo],er=[0,1.5,2.2,3,4,5,6.5,8,10,12,15][S.b.solar];
              if(X&&!X.end){if(Math.abs(X.x-g.lx)<1&&Math.abs(X.y-g.ly)<1&&!X.dis){g.same++;if(g.same>12){const a=Math.atan2(X.y,X.x)+1.57;X.x+=Math.cos(a)*70;X.y+=Math.sin(a)*70;g.same=0;g.nudges++;}}else g.same=0;g.lx=X.x;g.ly=X.y;}
              if(X&&X.end&&S.exp!==g.seen){g.seen=S.exp;const dt=X.endT+BS;g.t+=dt;S.well+=wr*dt/60;S.energy=(S.energy||0)+er*dt/60;if(X.ko)g.ko++;else if(X.end==='thirst')g.thirst++;g.last={s:X.scrap,c:X.cores,x:X.chips||0,t:Math.round(X.endT)};}
              if(!X&&S.well<2.5){g.waitW++;S.well+=wr*1/60*5;g.t+=5;}
              return {exp:S.exp,t:Math.round(g.t),b:Object.values(S.b).join(''),cr:['kladivo','batoh','cutora','boty','prak','kompas'].map(k=>S.craft[k]||0).join(''),s:S.scrap,c:S.cores,x:S.chips||0,e:Math.round(S.energy||0),well:Math.round(S.well),m:Math.round(S.meters),waitW:g.waitW,nud:g.nudges,ko:g.ko,th:g.thirst,camps:Object.keys(S.camps).length,bags:S.bags.length,last:g.last}})(%d)""" % BASE_SECS)
            key = r['b'] + '|' + r['cr']
            if key != last:
                last = key; print(json.dumps(r), flush=True)
            if r['exp'] >= MAXEXP: print('END', json.dumps(r), flush=True); break
        print('ERR', errs[:5]); await b.close()
asyncio.run(main())
