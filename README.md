# Zuroda

Mobilní/prohlížečová hra studia **Vabiko**. Postapokalyptická poušť: stavíš vesnici, chodíš na výpravy s robopsem **Zurem**, sbíráš šrot, vyhýbáš se robotům.

Hraj na **https://zuroda.com**.

## Struktura

| Složka | Co v ní je |
|---|---|
| `src/` | Zdrojový kód hry: `head.html` (HTML + CSS), `game.js` (hra), `icons.js` (ikony), `wolt_b64.js` + `wolt.glb` (model Zura), `vendor/GLTFLoader.js` |
| `site/` | To, co se nahrává na web: sestavený `index.html`, fonty, obrázek pro sdílení, `robots.txt` |
| `design-system/` | Barvy, písmo a komponenty (zdroj artefaktu „Zuroda“ design system) |
| `tools/` | Testovací automat (`bot_regression.py`) a převod animací na naši postavu (`retarget.py`) |

## Sestavení

```sh
sh build.sh            # vytvoří site/index.html
```

Web se nasazuje ze složky `site/` (Cloudflare Pages, bez build příkazu).

## Zdroje třetích stran (vše CC0)

- **Zvuky:** Kenney – Impact Sounds, Interface Sounds, RPG Audio, Sci-fi Sounds, Digital Audio, Music Jingles (kenney.nl), v `site/sfx/`.
- **Suché stromy a velké kameny:** Quaternius – Stylized Nature MegaKit (jen geometrie, barví je hra vlastními materiály), v `src/nature.js` přes `tools/pack_models.py`.
- **Animace postavy:** Quaternius – Universal Animation Library 1 a 2 (quaternius.com). Pohyby jsou převedené na klouby naší postavy nástrojem `tools/retarget.py` a uložené v `src/anims.js`.
