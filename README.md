# Zuroda

Mobilní/prohlížečová hra studia **Vabiko**. Postapokalyptická poušť: stavíš vesnici, chodíš na výpravy s robopsem **Zurem**, sbíráš šrot, vyhýbáš se robotům.

Hraj na **https://zuroda.com**.

## Struktura

| Složka | Co v ní je |
|---|---|
| `src/` | Zdrojový kód hry: `head.html` (HTML + CSS), `game.js` (hra), `lookh.js` (vzhled H: tuš, stínování, modely, poutník), `icons.js` (ikony), `wolt_b64.js` + `wolt.glb` (model Zura), `hero.js` (tělo postavy s kostrou a animacemi), `vendor/GLTFLoader.js` |
| `site/` | To, co se nahrává na web: hlavní stránka (`index.html`, `img/`, `fonts/`, `sfx/`), číslované verze `v<číslo>/`, historie `verze/`, `robots.txt` |
| `assets/` | Obrázky, písma a zvuky – odsud si je každé sestavení kopíruje |
| `design-system/` | Barvy, písmo a komponenty (zdroj artefaktu „Zuroda“ design system) |
| `tools/` | Testovací automat (`bot_regression.py`) a zabalení postavy a animací (`pack_hero.py`, starší `retarget.py`) |

## Sestavení

```sh
sh build.sh            # sestaví verzi ze souboru VERSION do site/v<číslo>/ a stránku s historií site/verze/
sh build.sh --root     # dá aktuální stav i na hlavní adresu (jen na Robinův pokyn)
```

Každý push do větve `main` se sám nasadí na zuroda.com (Cloudflare Pages, projekt `zuroda-git`, složka `site/`, bez build příkazu).

## Zdroje třetích stran (vše CC0)

- **Zvuky:** Kenney – Impact Sounds, Interface Sounds, RPG Audio, Sci-fi Sounds, Digital Audio, Music Jingles (kenney.nl), v `assets/sfx/`.
- **Suché stromy a velké kameny:** Quaternius – Stylized Nature MegaKit (jen geometrie, barví je hra vlastními materiály), v `src/nature.js` přes `tools/pack_models.py`.
- **Tělo a animace postavy:** Quaternius – Universal Animation Library 1 a 2 (quaternius.com): figurína muže s kostrou a její animace, zabalené nástrojem `tools/pack_hero.py` do `src/hero.js`. Hlavu, vlasy, oblečení (barvy), batoh a kladivo dělá hra sama.
- **Písma:** Jost, Fraunces a Shantell Sans (všechna SIL Open Font License), v `assets/fonts/`.
