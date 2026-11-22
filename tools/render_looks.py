# Renders two pictures of every look (village, desert) for the page zuroda.com/vzhledy/ – from the game itself, nothing else.
# usage: python3 tools/render_looks.py [look numbers…]   needs a local build on http://localhost:8765/index.html (see CLAUDE.md, Měření rovnováhy)
# The save in tools/looks_save.json is a fixed, fully built village with a fixed world seed, so every look shows the same scene.
import asyncio, sys, os, json
from playwright.async_api import async_playwright
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'site', 'vzhledy', 'img'); os.makedirs(out, exist_ok=True)
N = len(json.load(open(os.path.join(root, 'looks.json'), encoding='utf8'))['looks'])
looks = [int(x) for x in sys.argv[1:]] or list(range(N))
SAVE = open(os.path.join(root, 'tools', 'looks_save.json')).read()
# stand next to a helicopter wreck with a seeker robot and a ruin in view; robots are frozen so nobody gets hurt during the photo
EXP = """(()=>{window.NOKO=1;const X=__X();X.intro=null;X.x=1262;X.y=-1006;X.dx=X.x;X.dy=X.y+10;X.dest=null;X.water=X.cap;X.drillWarn=1;X.foeWarn=new Proxy({},{get:()=>1});
 __forX(600,-1700,1900,-400,c=>{for(const f of c.foes){f.tDet=1e9;f.alert=0;f.chase=0;}});__step(160);return 1})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
        for n in looks:
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
            pg = await ctx.new_page(); await pg.add_init_script('window.FIXQ=1')
            url = 'http://localhost:8765/index.html?look=%d' % n
            await pg.goto(url); await pg.evaluate("s=>localStorage.setItem('daleko3_save',s)", SAVE); await pg.goto('about:blank'); await pg.goto(url); await pg.wait_for_timeout(1500)
            await pg.evaluate("document.querySelector('#tbtns button').click()"); await pg.wait_for_timeout(3500)
            await pg.evaluate("document.getElementById('toast').classList.remove('on')")
            await pg.screenshot(path='/tmp/look-a.png')
            await pg.evaluate("__go()"); await pg.wait_for_timeout(2500)
            await pg.evaluate(EXP); await pg.wait_for_timeout(3200); await pg.evaluate("__step(2)"); await pg.wait_for_timeout(1800)
            await pg.screenshot(path='/tmp/look-b.png')
            for k in 'ab':
                Image.open('/tmp/look-%s.png' % k).convert('RGB').resize((560, 1212), Image.LANCZOS).save(os.path.join(out, '%02d-%s.webp' % (n, k)), 'WEBP', quality=80, method=6)
            print('look', n, 'done'); await ctx.close()
        await b.close()
asyncio.run(main())
