# Zuroda

Mobilní/prohlížečová hra studia **Vabiko**. Postapokalyptická poušť: stavíš vesnici, chodíš na výpravy s robopsem **Zurem**, sbíráš šrot, vyhýbáš se robotům.

Hraj na **https://zuroda.com**.

## Struktura

| Složka | Co v ní je |
|---|---|
| `src/` | Zdrojový kód hry: `head.html` (HTML + CSS), `game.js` (hra), `icons.js` (ikony), `wolt_b64.js` + `wolt.glb` (model Zura), `hero.js` (tělo postavy s kostrou a animacemi), `vendor/GLTFLoader.js` |
| `site/` | To, co se nahrává na web: sestavený `index.html`, fonty, obrázek pro sdílení, `robots.txt` |
| `design-system/` | Barvy, písmo a komponenty (zdroj artefaktu „Zuroda“ design system) |
| `tools/` | Testovací automat (`bot_regression.py`) a zabalení postavy a animací (`pack_hero.py`, starší `retarget.py`) |

## Sestavení

```sh
sh build.sh            # vytvoří site/index.html
```

Každý push do větve `main` se sám nasadí na zuroda.com (Cloudflare Pages, projekt `zuroda-git`, složka `site/`, bez build příkazu).

## Zdroje třetích stran (vše CC0)

- **Zvuky:** Kenney – Impact Sounds, Interface Sounds, RPG Audio, Sci-fi Sounds, Digital Audio, Music Jingles (kenney.nl), v `site/sfx/`.
- **Suché stromy a velké kameny:** Quaternius – Stylized Nature MegaKit (jen geometrie, barví je hra vlastními materiály), v `src/nature.js` přes `tools/pack_models.py`.
- **Tělo a animace postavy:** Quaternius – Universal Animation Library 1 a 2 (quaternius.com): figuríny muže a ženy s kostrou a jejich animace, zabalené nástrojem `tools/pack_hero.py` do `src/hero.js`. Hlavu, vlasy, oblečení (barvy), batoh a kladivo dělá hra sama.
