import asyncio,sys
from playwright.async_api import async_playwright
N=int(sys.argv[1]) if len(sys.argv)>1 else 18
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':300,'height':600})
        errs=[];pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('file:///tmp/tt.html');await pg.evaluate('localStorage.clear()');await pg.goto('about:blank');await pg.goto('file:///tmp/tt.html#bot')
        await pg.evaluate("window.SPD=8")
        for i in range(N):
            await pg.wait_for_timeout(10000)
            print(await pg.evaluate("(()=>{const S=__SV();return JSON.stringify({exp:S.exp,best:Math.round(S.best),s:S.scrap,g:S.cores,b:Object.values(S.b).join(''),well:Math.round(S.well),cr:S.craft,camps:Object.keys(S.camps).join(''),bags:S.bags.length,f:!!S.fetch,m:S.meters,x:S.chips,e:Math.round(S.energy),q:(S.caches||[]).length})})()"))
        print('ERR',errs[:5]);await b.close()
asyncio.run(main())
