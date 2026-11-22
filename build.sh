#!/bin/sh
# Builds the single-file game page.
#   sh build.sh                 -> site/index.html (three.js r128 from cdnjs, what zuroda.com serves)
#   sh build.sh <three.js> <out> -> custom build, e.g. a local three.min.js for offline tests
set -e
cd "$(dirname "$0")"
THREE=${1:-https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js}
OUT=${2:-site/index.html}
{ cat src/head.html; echo "<script src=\"$THREE\"></script>"; echo '<script>'; cat src/vendor/GLTFLoader.js; echo '</script><script>'; cat src/wolt_b64.js; echo '</script><script>'; cat src/icons.js; echo '</script><script>'; cat src/anims.js; echo '</script><script>'; cat src/nature.js; echo '</script><script>'; cat src/hero.js; echo '</script><script>'; sed "/^'use strict';\$/r src/lookh.js" src/game.js; echo '</script></body></html>'; } > "$OUT"
echo "built $OUT"
# look H preview (Robin 22. 11.): the same game in the sun-bleached ink look at zuroda.com/h
if [ "$OUT" = "site/index.html" ]; then mkdir -p site/h; sed '0,/<head>/s//<head><base href="..\/"><script>window.FORCE_STYLE="sun"<\/script>/' "$OUT" > site/h/index.html; echo "built site/h/index.html"; fi
