#!/bin/sh
# Builds the single-file game page.
#   sh build.sh                 -> site/index.html (three.js r128 from cdnjs, what zuroda.com serves)
#   sh build.sh <three.js> <out> -> custom build, e.g. a local three.min.js for offline tests
set -e
cd "$(dirname "$0")"
THREE=${1:-https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js}
OUT=${2:-site/index.html}
{ cat src/head.html; echo "<script src=\"$THREE\"></script>"; echo '<script>'; cat src/vendor/GLTFLoader.js; echo '</script><script>'; cat src/wolt_b64.js; echo '</script><script>'; cat src/icons.js; echo '</script><script>'; cat src/anims.js; echo '</script><script>'; cat src/game.js; echo '</script></body></html>'; } > "$OUT"
echo "built $OUT"
