# Writes site/verze/index.html – the history of numbered versions (Robin 22. 11.: every update under its own number).
# The list is versions.json: newest first in the file is not required, the page sorts by number. Run by build.sh.
import json, os, html, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import page_style
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(root, 'versions.json'), encoding='utf8'))
key = lambda v: [int(x) for x in v['v'].split('.')]
vs = sorted(J['versions'], key=key, reverse=True)
have = [v for v in vs if os.path.exists(os.path.join(root, 'site', 'v' + v['v'], 'index.html'))]
fonts = ('../v%s/fonts/' % have[0]['v']) if have else '../fonts/'
e = html.escape
cards = ''
for i, v in enumerate(vs):
    built = v in have
    tags = (['nejnovější'] if i == 0 else []) + (['běží na zuroda.com'] if v['v'] == J.get('root') else [])
    notes = ''.join('<li>%s</li>' % e(n) for n in v.get('notes', []))
    link = '<a class="go" href="../v%s/">Hrát verzi %s</a>' % (e(v['v']), e(v['v'])) if built else '<span class="no">není nasazená</span>'
    # test shortcut (from 2.6): the same build opened with #max plays a separate, fully unlocked save
    if built and v.get('max'):
        link += '<p class="alt">Na zkoušení: <a href="../v%s/#max">všechno na max</a> · <a href="../v%s/#maxall">max + kempy a celá mapa</a></p>' % (e(v['v']), e(v['v']))
    cards += ('<article><header><b>%s</b><div><h2>%s</h2><time>%s</time></div></header>%s<ul>%s</ul>%s</article>\n'
              % (e(v['v']), e(v['title']), e(v['date']), ('<div class="tags">%s</div>' % ''.join('<span class="tag%s">%s</span>' % (' on' if 'zuroda.com' in t else '', t) for t in tags)) if tags else '', notes, link))
page = '''<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Zuroda – verze</title>
%(icon)s
<style>
%(css)s
main{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
p.lead{margin:-4px 0 6px}
header{margin-bottom:10px}
time{color:var(--gm);font-size:13.5px}
.tags{margin:2px 0 4px}
ul{margin:6px 0 16px;padding-left:20px}li{margin:4px 0}
.no{color:var(--gm)}
.alt{margin:14px 0 0;font-size:14px;color:var(--gm)}.alt a{color:var(--grd);text-underline-offset:3px}
</style>
</head>
<body>
<main>
<div class="top"><h1 aria-label="Zuroda">Zur<i></i>da</h1><a href="/">zuroda.com</a></div>
<p class="lead">Jak šel vývoj: každá úprava hry má své číslo a zůstává tu hratelná. Každá verze má vlastní uloženou hru; při prvním spuštění si převezme postup z té předchozí.</p>
%(cards)s</main>
</body>
</html>
''' % {'icon': page_style.FAVICON, 'css': page_style.css(fonts), 'cards': cards}
out = os.path.join(root, 'site', 'verze'); os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(page)
print('built site/verze/index.html (%d versions, %d built)' % (len(vs), len(have)))
