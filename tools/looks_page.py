# Writes site/vzhledy/index.html – twenty looks of the same game side by side (Robin 22. 11.: "a page with 20 proposals that change the look
# without redoing the game"). Names and descriptions come from looks.json (same order as LOOKS in src/lookh.js), pictures from tools/render_looks.py.
# The play links go to the version in VERSION with ?look=N#max. Run by build.sh.
import json, os, html
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(root, 'looks.json'), encoding='utf8'))
ver = open(os.path.join(root, 'VERSION')).read().strip()
e = html.escape
img = lambda n, k: os.path.exists(os.path.join(root, 'site', 'vzhledy', 'img', '%02d-%s.webp' % (n, k)))
cards = ''
for L in J['looks']:
    n = L['n']
    tags = ''.join('<span class="tag">%s</span>' % e(t) for t in L.get('tags', []))
    pics = ''.join('<a href="img/%02d-%s.webp"><img src="img/%02d-%s.webp" width="560" height="1212" loading="lazy" alt="%s – %s"></a>' % (n, k, n, k, e(L['name']), lab)
                   for k, lab in (('a', 'vesnice'), ('b', 'výprava')) if img(n, k))
    cards += ('<article id="v%d"><header><b>%d</b><div><h2>%s</h2><p>%s</p></div></header><div class="tags">%s</div><div class="pics">%s</div>'
              '<a class="go" href="../v%s/?look=%d#max">Zahrát si</a></article>\n' % (n, n, e(L['name']), e(L['what']), tags, pics, e(ver), n))
page = '''<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Zuroda – dvacet vzhledů</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%%3E%%3Ccircle cx='32' cy='32' r='26' fill='%%23f2957f' stroke='%%235a3d34' stroke-width='5'/%%3E%%3C/svg%%3E">
<style>
@font-face{font-family:'Shantell Sans';font-weight:400;font-display:swap;src:url(%(f)sshantell-sans-latin-ext-400-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Shantell Sans';font-weight:400;font-display:swap;src:url(%(f)sshantell-sans-latin-400-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Shantell Sans';font-weight:700;font-display:swap;src:url(%(f)sshantell-sans-latin-ext-700-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Shantell Sans';font-weight:700;font-display:swap;src:url(%(f)sshantell-sans-latin-700-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Fraunces';font-weight:100 900;font-display:swap;src:url(%(f)sfraunces-latin-wght-normal.woff2) format('woff2')}
:root{--ni:#4a332b;--ns:#6b4c40;--np:#fffaf0;--nc:#f2957f;--nst:#b8432e}
*{box-sizing:border-box}
html{background:#fbf3e4}
body{margin:0;padding:30px 18px 70px;font:400 15px/1.5 'Shantell Sans','Comic Sans MS',cursive;color:var(--ni)}
main{max-width:1240px;margin:0 auto}
.top{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}
h1{font:600 42px/1 Fraunces,Georgia,serif;letter-spacing:-.012em;margin:0;color:#5a3d34}
h1 small{font:700 22px/1 'Shantell Sans',cursive;color:var(--nst);margin-left:10px;white-space:nowrap}
.top a{font-weight:700;color:var(--ni);text-underline-offset:4px;text-decoration-color:var(--nst)}
.lead{max-width:760px;margin:14px 0 26px;color:var(--ns)}.lead b{color:var(--ni)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:22px}
article{background:var(--np);padding:16px 16px 18px;box-shadow:2px 3px 0 rgba(74,51,43,.22);display:flex;flex-direction:column}
header{display:flex;align-items:flex-start;gap:12px}
header b{flex:none;min-width:44px;text-align:center;font:700 24px/1 'Shantell Sans',cursive;color:var(--nst);border:2px solid var(--nst);border-radius:6px;padding:6px 8px;transform:rotate(-4deg)}
h2{font:700 20px/1.15 'Shantell Sans',cursive;margin:0 0 3px}
header p{margin:0;font-size:14px;line-height:1.4;color:var(--ns)}
.tags{min-height:28px;margin:10px 0 8px}
.tag{display:inline-block;margin:0 6px 4px 0;font:700 12px/1 'Shantell Sans',cursive;padding:4px 8px;border:1.5px dashed var(--ni);border-radius:999px}
.pics{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
.pics a{display:block;border:1.5px solid rgba(74,51,43,.35);border-radius:10px;overflow:hidden;background:#f6dcc6}
.pics img{display:block;width:100%%;height:auto}
.go{margin-top:auto;align-self:flex-start;position:relative;isolation:isolate;display:inline-block;min-width:150px;text-align:center;font:700 16px/1.15 'Shantell Sans',cursive;color:var(--ni);text-decoration:none;padding:11px 20px 11px 40px;background:var(--ni);clip-path:polygon(14px 0,100%% 0,100%% 100%%,14px 100%%,0 68%%,0 32%%)}
.go::before{content:'';position:absolute;z-index:-1;inset:1.6px;clip-path:polygon(13.2px 0,100%% 0,100%% 100%%,13.2px 100%%,0 68%%,0 32%%);background:radial-gradient(circle at 15.4px 50%%,#fbf3e4 0 4.2px,var(--ni) 4.5px 5.6px,rgba(74,51,43,0) 6px),var(--nc)}
.go:focus-visible,.pics a:focus-visible{outline:3px solid var(--nst);outline-offset:3px}
.work{max-width:760px;margin:44px 0 0;background:#fff1b5;padding:18px 20px;box-shadow:2px 3px 0 rgba(74,51,43,.22)}
.work h2{margin-bottom:8px}.work ul{margin:0;padding-left:20px}.work li{margin:5px 0}.work b{white-space:nowrap}
.work p{margin:12px 0 0;color:var(--ns);font-size:14px}
</style>
</head>
<body>
<main>
<div class="top"><h1>Zuroda <small>dvacet vzhledů</small></h1><a href="../verze/">verze</a></div>
<p class="lead">Všech dvacet je <b>tatáž hra</b>, jen s jinak nastavenými čísly: tuš, stíny, barvy, světlo a kamera. Modely, textury ani zápisník se nemění. Obrázky jsou přímo ze hry, vždy stejná vesnice a stejné místo v poušti; klepnutím se zvětší. Od verze 2.8 hra běží ve vzhledu <b>3 · Dioráma</b>; ostatní tu zůstávají na porovnání. Tlačítko <b>Zahrát si</b> otevře verzi %(ver)s v tom vzhledu ve zkušební hře se vším na max.</p>
<div class="grid">
%(cards)s</div>
<section class="work">
<h2>Jak velká je to práce</h2>
<ul>
<li><b>Minuty:</b> udělat kterýkoli z těchto vzhledů výchozím, nebo smíchat dva dohromady (třeba dioráma s barevnými obrysy). Je to jen přepínač.</li>
<li><b>Desítky minut:</b> doladit barvy jednotlivých věcí. Ikony jsou od 2.8 přepečené bez tuše.</li>
<li><b>Hodiny:</b> UI. Zápisník je ručně psaný a kreslený tužkou; k Dioramatu patří čisté UI. To je nový styl pro všechny obrazovky a teprve se vybírá.</li>
<li><b>Dny:</b> jiné tvary modelů, například jednodušší postavička.</li>
</ul>
<p>Dioráma a Miniatura používají náročnější filtr stínů. Na skutečném telefonu zatím nezkoušeno.</p>
</section>
</main>
</body>
</html>
''' % {'f': '../v%s/fonts/' % ver, 'cards': cards, 'ver': e(ver)}
out = os.path.join(root, 'site', 'vzhledy'); os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(page)
print('built site/vzhledy/index.html (%d looks, version %s)' % (len(J['looks']), ver))
