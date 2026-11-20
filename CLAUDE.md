# Zuroda – pravidla pro práci na hře

- Hra (texty ve hře) je **anglicky**, komunikace s Robinem a dokumentace **česky**.
- **Nikdy nepoužívej Robinovy fotky / Midjourney obrázky** – ani ve hře, ani jako náhledy, ani na webu. Veškerá grafika musí pocházet z renderů hry samotné.
- **Nasazení:** push do `main` → Cloudflare Pages projekt `zuroda-git` (výstup `site/`, bez build příkazu) → https://zuroda.com a www. Starý projekt `zuroda` (ruční nahrávání zipu) už domény nemá.
- Celá hra je jeden soubor: upravuj `src/*`, pak `sh build.sh` → `site/index.html`. Do commitu patří i sestavený `site/index.html` (web se nasazuje přímo ze `site/`, bez build kroku).
- three.js r128 (z cdnjs), MeshToonMaterial + vlastní `brawlify` shader, ortografická kamera. Jednotky: S=0.1 (2D → 3D), M_PER_U=0.1 m.
- Ladicí háčky v konzoli: `__SV()`, `__X()`, `__go()`, `__open(k)`, `__close()`, `__house()`, `__markSeen(x,y,r)`, `__obst(cx,cy)`. Automat: `#bot` v URL, `window.SPD` zrychlení.
- Test: `sh build.sh <cesta k lokálnímu three.min.js> /tmp/tt.html` a `python3 tools/bot_regression.py 18` (Playwright + Chrome se swiftshaderem). Na začátku je výběr postavy – v testech klikni „Woman“ a „Start“.
- Rozhodnutí o designu (ekonomika, nepřátelé, předměty, mapa) jsou v projektu „THE GAME“ na claude.ai (`claude/daleko-zaklad-hry.md`, `claude/zuroda-kolo-nepratele-ekonomika.md`, `claude/daleko-postavy.md`).
- Budovy se stavějí okamžitě (Robin nechce čekací časovače). Všechny budovy mají 10 úrovní, předměty taky (kromě Kompasu).
- Animace postavy: `src/anims.js` vzniká z Quaternius Universal Animation Library (GLB na Robinově Macu ve složce Desktop/Animace) příkazem `python3 tools/retarget.py UAL1.glb UAL2.glb '{"klíč":["1|2","Název_klipu",loop]}' src/anims.js`. Postava nemá kostru – převod nastavuje rotace kloubů (hips, spine, neck, sh/el/hand, leg/knee/foot). Akce (`heroPlay(H,'smash')`) hrají jen na horní polovině těla.
- Zvuky jsou v `site/sfx/*.mp3`, mapování v `SND` v game.js; syntetické tóny jsou záloha.
- Suché stromy a kameny (pevné překážky v poušti, `o.solid` v `obstOf`) používají geometrii ze Stylized Nature MegaKit v `src/nature.js` (`tools/pack_models.py`); bez ní se kreslí vlastní náhradní modely.
