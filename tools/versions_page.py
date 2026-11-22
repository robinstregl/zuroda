# Writes site/verze/index.html – the history of numbered versions (Robin 22. 11.: every update under its own number).
# The list is versions.json: newest first in the file is not required, the page sorts by number. Run by build.sh.
import json, os, html
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
    cards += ('<article style="--r:%sdeg"><i class="tape"></i><header><b>%s</b><div><h2>%s</h2><time>%s</time></div></header>%s<ul>%s</ul>%s</article>\n'
              % ([-0.6, 0.5, -0.4, 0.7][i % 4], e(v['v']), e(v['title']), e(v['date']), ''.join('<span class="tag">%s</span>' % t for t in tags), notes, link))
page = '''<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Zuroda – verze</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%%3E%%3Ccircle cx='32' cy='32' r='26' fill='%%23f2957f' stroke='%%235a3d34' stroke-width='5'/%%3E%%3C/svg%%3E">
<style>
@font-face{font-family:'Shantell Sans';font-weight:400;font-display:swap;src:url(%(f)sshantell-sans-latin-ext-400-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Shantell Sans';font-weight:400;font-display:swap;src:url(%(f)sshantell-sans-latin-400-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Shantell Sans';font-weight:600;font-display:swap;src:url(%(f)sshantell-sans-latin-ext-600-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Shantell Sans';font-weight:600;font-display:swap;src:url(%(f)sshantell-sans-latin-600-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Shantell Sans';font-weight:700;font-display:swap;src:url(%(f)sshantell-sans-latin-ext-700-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Shantell Sans';font-weight:700;font-display:swap;src:url(%(f)sshantell-sans-latin-700-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Fraunces';font-weight:100 900;font-display:swap;src:url(%(f)sfraunces-latin-wght-normal.woff2) format('woff2')}
:root{--ni:#4a332b;--ns:#6b4c40;--np:#fffaf0;--nc:#f2957f;--nst:#b8432e}
html{background:#fbf3e4 repeating-linear-gradient(180deg,rgba(95,163,177,0) 0 27px,rgba(95,163,177,.26) 27px 28px)}
body{margin:0;padding:34px 20px 60px;font:400 15px/1.5 'Shantell Sans','Comic Sans MS',cursive;color:var(--ni)}
main{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:30px}
.top{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}
h1{font:600 46px/1 Fraunces,Georgia,serif;letter-spacing:-.012em;margin:0;color:#5a3d34;white-space:nowrap}
h1 i{display:inline-block;width:.6em;height:.6em;margin:0 .035em 0 .05em;border-radius:50%%;background:var(--nc);box-shadow:inset 0 0 0 .05em #5a3d34;vertical-align:-.03em}
.top a{font-weight:600;color:var(--ni);text-underline-offset:4px;text-decoration-color:var(--nst)}
p.lead{margin:-14px 0 0;color:var(--ns)}
article{position:relative;background:var(--np);padding:22px 20px 20px;box-shadow:2px 3px 0 rgba(74,51,43,.26);transform:rotate(var(--r))}
.tape{position:absolute;left:50%%;top:-10px;width:60px;height:19px;margin-left:-30px;background:rgba(224,198,150,.82);border-left:1.5px dotted rgba(74,51,43,.35);border-right:1.5px dotted rgba(74,51,43,.35);transform:rotate(-3deg)}
header{display:flex;align-items:center;gap:14px;margin-bottom:8px}
header b{flex:none;font:700 30px/1 'Shantell Sans',cursive;color:var(--nst);border:2px solid var(--nst);border-radius:6px;padding:6px 10px;transform:rotate(-4deg)}
h2{font:700 23px/1.15 'Shantell Sans',cursive;margin:0}
time{color:var(--ns);font-size:13.5px}
.tag{display:inline-block;margin:0 8px 6px 0;font:600 12.5px/1 'Shantell Sans',cursive;padding:5px 9px;border:1.5px dashed var(--ni);border-radius:999px}
ul{margin:6px 0 16px;padding-left:20px}li{margin:3px 0}
.go{position:relative;display:inline-block;min-width:200px;text-align:center;font:700 18px/1.15 'Shantell Sans',cursive;color:var(--ni);text-decoration:none;padding:13px 22px 13px 44px;background:var(--ni);clip-path:polygon(16px 0,100%% 0,100%% 100%%,16px 100%%,0 68%%,0 32%%);transform:rotate(-1.2deg)}
.go::before{content:'';position:absolute;z-index:-1;inset:1.6px;clip-path:polygon(15.2px 0,100%% 0,100%% 100%%,15.2px 100%%,0 68%%,0 32%%);background:radial-gradient(circle at 17.4px 50%%,#fbf3e4 0 4.6px,var(--ni) 4.9px 6.1px,rgba(74,51,43,0) 6.6px),var(--nc)}
.go{isolation:isolate}.go:focus-visible{outline:3px solid var(--nst);outline-offset:4px}
.no{color:var(--ns)}
</style>
</head>
<body>
<main>
<div class="top"><h1 aria-label="Zuroda">Zur<i></i>da</h1><a href="/">zuroda.com</a></div>
<p class="lead">Jak šel vývoj: každá úprava hry má své číslo a zůstává tu hratelná. Každá verze má vlastní uloženou hru; při prvním spuštění si převezme postup z té předchozí.</p>
%(cards)s</main>
</body>
</html>
''' % {'f': fonts, 'cards': cards}
out = os.path.join(root, 'site', 'verze'); os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(page)
print('built site/verze/index.html (%d versions, %d built)' % (len(vs), len(have)))
