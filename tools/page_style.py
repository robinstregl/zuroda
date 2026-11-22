# The look shared by the two helper pages (verze/, vzhledy/): the same "Sklo" style as the game – Outfit, navy ink, white rounded cards
# with soft shadows, one red pill for the thing to press. The wordmark stays in Fraunces. Used by versions_page.py and looks_page.py.
EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
FAVICON = '''<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='28' fill='%23d9453a'/%3E%3C/svg%3E">'''
def css(f):
    """f = path to the fonts folder of a built version (with a slash at the end)"""
    return ("@font-face{font-family:'Outfit';font-weight:100 900;font-display:swap;src:url(" + f + "outfit-latin-ext-wght-normal.woff2) format('woff2');unicode-range:" + EXT + "}\n"
            "@font-face{font-family:'Outfit';font-weight:100 900;font-display:swap;src:url(" + f + "outfit-latin-wght-normal.woff2) format('woff2');unicode-range:" + LAT + "}\n"
            "@font-face{font-family:'Fraunces';font-weight:100 900;font-display:swap;src:url(" + f + "fraunces-latin-wght-normal.woff2) format('woff2')}\n" + '''
:root{--gi:#2a2f4f;--gm:rgba(42,47,79,.74);--gr:#d9453a;--grd:#b9352d;--ff:Outfit,'Century Gothic',system-ui,sans-serif}
*{box-sizing:border-box}
html{background:#fdf1e6}
body{margin:0;padding:34px 20px 70px;font:400 15px/1.55 var(--ff);color:var(--gi)}
.top{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}
h1{font:600 46px/1 Fraunces,Georgia,serif;letter-spacing:-.012em;margin:0;white-space:nowrap}
h1 i{display:inline-block;width:.6em;height:.6em;margin:0 .035em 0 .05em;border-radius:50%;background:var(--gr);vertical-align:-.03em}
h1 small{font:600 20px/1 var(--ff);letter-spacing:0;color:var(--gm);margin-left:12px;white-space:nowrap}
.top a{font-weight:600;color:var(--gi);text-underline-offset:4px;text-decoration-color:var(--gr)}
.lead{color:var(--gm)}.lead b{color:var(--gi);font-weight:600}
article,.work{background:#fff;border-radius:26px;padding:20px;box-shadow:0 6px 18px rgba(150,95,60,.12)}
header{display:flex;align-items:center;gap:14px}
header b{flex:none;min-width:48px;text-align:center;font:600 19px/1 var(--ff);color:var(--grd);background:rgba(217,69,58,.1);border-radius:14px;padding:10px 12px}
h2{font:600 21px/1.15 var(--ff);letter-spacing:-.01em;margin:0}
.tag{display:inline-block;margin:0 6px 6px 0;font:600 12px/1 var(--ff);padding:5px 10px;border-radius:999px;background:rgba(42,47,79,.07)}
.tag.on{background:var(--gi);color:#fff}
.go{display:inline-block;min-width:170px;text-align:center;font:600 17px/1.15 var(--ff);color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;background:linear-gradient(180deg,#d6453a,#c93a30);box-shadow:0 10px 22px rgba(217,69,58,.3)}
.go:focus-visible,a:focus-visible{outline:3px solid var(--gi);outline-offset:3px}
''')
