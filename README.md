# Zuroda

Mobilní/prohlížečová hra studia **Vabiko**. Postapokalyptická poušť: stavíš vesnici, chodíš na výpravy s robopsem **Zurem**, sbíráš šrot, vyhýbáš se robotům.

Hraj na **https://zuroda.com**.

## Struktura

| Složka | Co v ní je |
|---|---|
| `src/` | Zdrojový kód hry: `head.html` (HTML + CSS), `game.js` (hra), `icons.js` (ikony), `wolt_b64.js` + `wolt.glb` (model Zura), `vendor/GLTFLoader.js` |
| `site/` | To, co se nahrává na web: sestavený `index.html`, fonty, obrázek pro sdílení, `robots.txt` |
| `design-system/` | Barvy, písmo a komponenty (zdroj artefaktu „Zuroda“ design system) |
| `tools/` | Testovací skripty (automat, který hraje hru sám) |

## Sestavení

```sh
sh build.sh            # vytvoří site/index.html
```

Web se nasazuje ze složky `site/` (Cloudflare Pages, bez build příkazu).
