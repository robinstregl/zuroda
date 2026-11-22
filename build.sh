#!/bin/sh
# Builds the single-file game page.
#   sh build.sh                   -> the version named in the file VERSION as a frozen copy of its own: site/v<VERSION>/ (page + pictures, fonts,
#                                    sounds) and the history page site/verze/. The main page of zuroda.com is NOT touched.
#   sh build.sh --root            -> puts the current sources on the main address too (site/index.html + site/img, fonts, sfx). Only on Robin's word.
#   sh build.sh <three.js> <out>  -> custom build, e.g. with a local three.min.js for offline tests (no assets are copied)
# Pictures, fonts and sounds live in assets/; every build gets its own copy, so an old version keeps working when a picture changes later.
set -e
cd "$(dirname "$0")"
CDN=https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
page() { # $1 three.js url, $2 output file, $3 version number ('' = none: the main page keeps the plain save)
  { sed '/^\/\*@notebook\*\/$/r src/notebook.css' src/head.html; echo "<script src=\"$1\"></script>"; echo '<script>'; cat src/icons.js; echo '</script><script>'; cat src/anims.js; echo '</script><script>'; cat src/nature.js; echo '</script><script>'; cat src/hero.js; echo '</script><script>'; sed "/^'use strict';\$/r src/lookh.js" src/game.js; echo '</script></body></html>'; } > "$2.tmp"
  if [ -n "$3" ]; then sed "0,/<head>/s//<head><script>window.ZVER=\"$3\"<\/script>/" "$2.tmp" > "$2"; rm "$2.tmp"; else mv "$2.tmp" "$2"; fi
  echo "built $2"
}
assets() { for d in img fonts sfx; do rm -rf "$1/$d"; cp -R "assets/$d" "$1/$d"; done; }
case "$1" in
  "") VER=$(cat VERSION); D="site/v$VER"; mkdir -p "$D"; page "$CDN" "$D/index.html" "$VER"; assets "$D"; python3 tools/versions_page.py && python3 tools/looks_page.py ;;
  --root) page "$CDN" site/index.html ""; assets site
    # zuroda.com/h was the preview address of look H until it became the game itself (22. 11.) – old links land on the main page
    mkdir -p site/h; printf '%s\n' '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Zuroda</title><meta http-equiv="refresh" content="0;url=/"><link rel="canonical" href="https://zuroda.com/"><script>location.replace("/"+location.search+location.hash)</script></head><body><a href="/">zuroda.com</a></body></html>' > site/h/index.html
    python3 tools/versions_page.py && python3 tools/looks_page.py ;;
  *) [ -n "$2" ] || { echo "usage: sh build.sh | sh build.sh --root | sh build.sh <three.js> <out.html>"; exit 1; }
    page "$1" "$2" "${ZVER:-}" ;;
esac
