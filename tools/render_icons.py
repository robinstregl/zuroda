# Bakes the look-H icon sheet (site/img/hicons.png) from the game's own models and its own pen.
#   sh build.sh <local three.min.js> /tmp/zt/www/index.html      (any page the browser can open over http)
#   python3 tools/render_icons.py http://localhost:8765/index.html [site/img/hicons.png]
# The models are in hIconDefs() in src/lookh.js, the order and the grid in HICON in src/icons.js.
# After baking, bump the ?v= number of HICON.url so browsers fetch the new sheet.
import asyncio, base64, sys
from playwright.async_api import async_playwright
url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
out = sys.argv[2] if len(sys.argv) > 2 else 'site/img/hicons.png'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') and '404' not in m.text else None)
        await pg.goto(url + ('&' if '?' in url else '?') + 's=sun')
        for _ in range(60):
            if await pg.evaluate("typeof __woltReady==='function'&&__woltReady()"): break
            await pg.wait_for_timeout(250)
        data = await pg.evaluate("__hicons()")
        open(out, 'wb').write(base64.b64decode(data.split(',', 1)[1]))
        print('wrote', out, len(data) * 3 // 4, 'bytes'); print('messages', errs[:8]); await b.close()
asyncio.run(main())
