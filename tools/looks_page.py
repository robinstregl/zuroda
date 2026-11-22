# Writes site/vzhledy/index.html – twenty looks of the same game side by side (Robin 22. 11.: "a page with 20 proposals that change the look
# without redoing the game"). Names and descriptions come from looks.json (same order as LOOKS in src/lookh.js), pictures from tools/render_looks.py.
# The play links go to the version in VERSION with ?look=N#max. Run by build.sh.
import json, os, html, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import page_style
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
%(icon)s
<style>
%(css)s
main{max-width:1240px;margin:0 auto}
.lead{max-width:760px;margin:14px 0 26px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:18px}
article{padding:16px 16px 18px;display:flex;flex-direction:column}
header{align-items:flex-start}
h2{margin:0 0 3px;font-size:19px}
header p{margin:0;font-size:14px;line-height:1.4;color:var(--gm)}
.tags{min-height:28px;margin:10px 0 8px}
.pics{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
.pics a{display:block;border-radius:16px;overflow:hidden;background:#f6dcc6}
.pics img{display:block;width:100%%;height:auto}
.go{margin-top:auto;align-self:flex-start;min-width:150px;font-size:16px;padding:12px 24px}
.work{max-width:760px;margin:36px 0 0}
.work h2{margin-bottom:8px}.work ul{margin:0;padding-left:20px}.work li{margin:5px 0}.work b{white-space:nowrap;font-weight:600}
.work p{margin:12px 0 0;color:var(--gm);font-size:14px}
</style>
</head>
<body>
<main>
<div class="top"><h1>Zuroda <small>dvacet vzhledů</small></h1><a href="../verze/">verze</a></div>
<p class="lead">Všech dvacet je <b>tatáž hra</b>, jen s jinak nastavenými čísly: tuš, stíny, barvy, světlo a kamera. Modely, textury ani ovládací prvky se nemění. Obrázky jsou přímo ze hry, vždy stejná vesnice a stejné místo v poušti; klepnutím se zvětší. Od verze 2.8 hra běží ve vzhledu <b>3 · Dioráma</b>; ostatní tu zůstávají na porovnání. Tlačítko <b>Zahrát si</b> otevře verzi %(ver)s v tom vzhledu ve zkušební hře se vším na max.</p>
<div class="grid">
%(cards)s</div>
<section class="work">
<h2>Jak velká je to práce</h2>
<ul>
<li><b>Minuty:</b> udělat kterýkoli z těchto vzhledů výchozím, nebo smíchat dva dohromady (třeba dioráma s barevnými obrysy). Je to jen přepínač.</li>
<li><b>Desítky minut:</b> doladit barvy jednotlivých věcí. Ikony jsou od 2.8 přepečené bez tuše.</li>
<li><b>Hodiny:</b> UI. Od 2.9 je místo ručně psaného zápisníku čisté „Sklo“: mléčné sklo, bílé karty a jedno písmo.</li>
<li><b>Dny:</b> jiné tvary modelů, například jednodušší postavička.</li>
</ul>
<p>Dioráma a Miniatura používají náročnější filtr stínů. Na skutečném telefonu zatím nezkoušeno.</p>
</section>
</main>
</body>
</html>
''' % {'icon': page_style.FAVICON, 'css': page_style.css('../v%s/fonts/' % ver), 'cards': cards, 'ver': e(ver)}
out = os.path.join(root, 'site', 'vzhledy'); os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(page)
print('built site/vzhledy/index.html (%d looks, version %s)' % (len(J['looks']), ver))
