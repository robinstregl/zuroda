# Zuroda – pravidla pro práci na hře

- Hra (texty ve hře) je **anglicky**, komunikace s Robinem a dokumentace **česky**.
- **Nikdy nepoužívej Robinovy fotky / Midjourney obrázky** – ani ve hře, ani jako náhledy, ani na webu. Veškerá grafika musí pocházet z renderů hry samotné.
- Celá hra je jeden soubor: upravuj `src/*`, pak `sh build.sh` → `site/index.html`. Do commitu patří i sestavený `site/index.html` (web se nasazuje přímo ze `site/`, bez build kroku).
- three.js r128 (z cdnjs), MeshToonMaterial + vlastní `brawlify` shader, ortografická kamera. Jednotky: S=0.1 (2D → 3D), M_PER_U=0.1 m.
- Ladicí háčky v konzoli: `__SV()`, `__X()`, `__go()`, `__open(k)`, `__close()`, `__house()`, `__markSeen(x,y,r)`, `__obst(cx,cy)`. Automat: `#bot` v URL, `window.SPD` zrychlení.
- Test: `sh build.sh <cesta k lokálnímu three.min.js> /tmp/tt.html` a `python3 tools/bot_regression.py 18` (Playwright + Chrome se swiftshaderem). Na začátku je výběr postavy – v testech klikni „Woman“ a „Start“.
- Rozhodnutí o designu (ekonomika, nepřátelé, předměty, mapa) jsou v projektu „THE GAME“ na claude.ai (`claude/daleko-zaklad-hry.md`, `claude/zuroda-kolo-nepratele-ekonomika.md`, `claude/daleko-postavy.md`).
- Budovy se stavějí okamžitě (Robin nechce čekací časovače). Všechny budovy mají 10 úrovní, předměty taky (kromě Kompasu).
