#!/bin/sh
# Builds the single-file game page.
#   sh build.sh                 -> site/index.html (three.js r128 from cdnjs, what zuroda.com serves)
#   sh build.sh <three.js> <out> -> custom build, e.g. a local three.min.js for offline tests
set -e
cd "$(dirname "$0")"
THREE=${1:-https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js}
OUT=${2:-site/index.html}
{ sed '/^\/\*@notebook\*\/$/r src/notebook.css' src/head.html; echo "<script src=\"$THREE\"></script>"; echo '<script>'; cat src/vendor/GLTFLoader.js; echo '</script><script>'; cat src/wolt_b64.js; echo '</script><script>'; cat src/icons.js; echo '</script><script>'; cat src/anims.js; echo '</script><script>'; cat src/nature.js; echo '</script><script>'; cat src/hero.js; echo '</script><script>'; sed "/^'use strict';\$/r src/lookh.js" src/game.js; echo '</script></body></html>'; } > "$OUT"
echo "built $OUT"
# zuroda.com/h was the preview address of look H until it became the game itself (22. 11.) – old links land on the main page
if [ "$OUT" = "site/index.html" ]; then mkdir -p site/h; printf '%s\n' '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Zuroda</title><meta http-equiv="refresh" content="0;url=/"><link rel="canonical" href="https://zuroda.com/"><script>location.replace("/"+location.search+location.hash)</script></head><body><a href="/">zuroda.com</a></body></html>' > site/h/index.html; echo "built site/h/index.html (redirect)"; fi
