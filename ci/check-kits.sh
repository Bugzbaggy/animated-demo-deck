#!/usr/bin/env bash
# Checks the four kits the way a user's deck is checked, plus the repo's own invariants.
#
#   bash ci/check-kits.sh [--gifs] [--workers N] [kind ...]     (default: all four kinds)
#
# Per kit:
#   1. the shared tools are byte-identical across kits, and the engines differ only in the presenter window's name;
#   2. script.js matches the beats scenes.js has (new-script is a no-op), timing.json matches the deck
#      (render-gifs --timing is a no-op), and SCRIPT.md matches both (build-script without --force succeeds);
#   3. every caption fits its kind's limit, and the kind's material grep finds nothing (materials.md, "Checks");
#   4. sweep-presenter: every beat's words, cue, slide/beat number and target time match SCRIPT.md, no page errors;
#   5. check-widget at 740, 980 and 390 px: no horizontal overflow, nothing spilling out of a tile;
#   6. with --gifs: render every GIF, then check-gifs (pauses match the script, each GIF plays once).
# Needs Node 24+, Chrome, Edge or Chromium (or CHROME=<path>), and ffmpeg for --gifs. Writes only gifs/ (git-ignored).
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
SK=skills/animated-demo-deck
GIFS=0 WORKERS=3 KINDS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --gifs) GIFS=1 ;;
    --workers) WORKERS="$2"; shift ;;
    *) KINDS+=("$1") ;;
  esac
  shift
done
[ ${#KINDS[@]} -gt 0 ] || KINDS=(cards console board dashboard)
fail=0
ok() { echo "ok   - $*"; }
bad() { echo "FAIL - $*"; fail=1; }
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

# 1. Shared files. fetch-fonts differs in board only (it adds the two handwriting fonts).
for t in build-script.mjs new-script.mjs render-gifs.mjs sync-script.mjs; do
  n=$(md5sum "$SK"/kits/*/tools/"$t" | awk '{print $1}' | sort -u | wc -l)
  [ "$n" -eq 1 ] && ok "tools/$t is the same in every kit" || bad "tools/$t differs between kits"
done
n=$(md5sum "$SK"/kits/{cards,console,dashboard}/tools/fetch-fonts.mjs | awk '{print $1}' | sort -u | wc -l)
[ "$n" -eq 1 ] && ok "tools/fetch-fonts.mjs is the same in cards, console and dashboard" || bad "tools/fetch-fonts.mjs differs"
for k in cards console board dashboard; do
  sed -E "s/'$k-kit-presenter'/'KIND-kit-presenter'/; s/'Presenter: [A-Z][a-z]+ kit'/'Presenter: KIND kit'/" "$SK/kits/$k/deck/engine.js" > "$tmp/engine-$k.js"
done
n=$(md5sum "$tmp"/engine-*.js | awk '{print $1}' | sort -u | wc -l)
[ "$n" -eq 1 ] && ok "deck/engine.js differs between kits only in the presenter window's name" || bad "deck/engine.js differs between kits"

limit_for() { case "$1" in board) echo 60 ;; *) echo 90 ;; esac; }
material_grep() {   # prints the pattern that must not occur in the kind's scenes.js
  case "$1" in
    cards) echo 'kpi\(|cmd\(' ;;
    board) echo 'kpi\(|logTile\(' ;;
    console|dashboard) echo 'msg\(' ;;
  esac
}

for k in "${KINDS[@]}"; do
  K="$SK/kits/$k"
  echo "== $k"
  [ -d "$K" ] || { bad "no kit $k"; continue; }
  page=$(ls "$K"/deck/*.html)

  # 2. The generated files are current: regenerating them changes nothing.
  cp "$K/deck/script.js" "$tmp/script.js"; cp "$K/tools/timing.json" "$tmp/timing.json"; cp "$K/SCRIPT.md" "$tmp/SCRIPT.md"
  if (cd "$K" && node tools/new-script.mjs >/dev/null) && cmp -s "$K/deck/script.js" "$tmp/script.js"; then ok "$k: script.js matches the deck's beats"
  else bad "$k: script.js is not what new-script.mjs writes for the deck's beats"; cp "$tmp/script.js" "$K/deck/script.js"; fi
  if (cd "$K" && node tools/render-gifs.mjs --timing >/dev/null) && cmp -s "$K/tools/timing.json" "$tmp/timing.json"; then ok "$k: timing.json matches the deck"
  else bad "$k: timing.json is stale (run node tools/render-gifs.mjs --timing)"; cp "$tmp/timing.json" "$K/tools/timing.json"; fi
  if (cd "$K" && node tools/build-script.mjs >/dev/null) && cmp -s "$K/SCRIPT.md" "$tmp/SCRIPT.md"; then ok "$k: SCRIPT.md matches script.js and timing.json"
  else bad "$k: SCRIPT.md is out of step (run node tools/sync-script.mjs)"; cp "$tmp/SCRIPT.md" "$K/SCRIPT.md"; fi

  # 3. Captions and material.
  lim=$(limit_for "$k")
  over=$(node "$SK/scripts/captions.mjs" list "$K/deck/scenes.js" | awk -F'\t' -v L="$lim" '!/^#/ && ($2 == "-" || $2 + 0 > L) { print $1 " (" $2 ")" }')
  [ -z "$over" ] && ok "$k: every caption has text and fits $lim characters" || bad "$k: captions missing or over $lim: $over"
  pat=$(material_grep "$k")
  if grep -qE "$pat" "$K/deck/scenes.js"; then bad "$k: scenes.js uses what the $k material never shows ($pat)"; else ok "$k: no $pat in scenes.js"; fi

  # 4. The presenter view against SCRIPT.md.
  out=$(node "$SK/scripts/sweep-presenter.mjs" "$page" "$K/SCRIPT.md" 2>&1); rc=$?
  [ $rc -eq 0 ] && ok "$k: $(printf '%s\n' "$out" | grep -E '^ALL ')" || { bad "$k: sweep-presenter"; printf '%s\n' "$out" | sed 's/^/       /'; }

  # 5. The widget.
  out=$(node "$SK/scripts/check-widget.mjs" "$K/widget-$k.html" --widths 740,980,390 2>&1); rc=$?
  [ $rc -eq 0 ] && ok "$k: widget fits at 740, 980 and 390 px ($(printf '%s\n' "$out" | grep -cE '^iframe height') widths)" \
    || { bad "$k: check-widget"; printf '%s\n' "$out" | grep -E 'OVERFLOW|SPILL|rror' | sed 's/^/       /'; }

  # 6. The GIFs.
  if [ "$GIFS" -eq 1 ]; then
    if (cd "$K" && node tools/render-gifs.mjs --workers "$WORKERS"); then
      out=$(node "$SK/scripts/check-gifs.mjs" "$K" 2>&1); rc=$?
      [ $rc -eq 0 ] && ok "$k: $(printf '%s\n' "$out" | tail -1)" || { bad "$k: check-gifs"; printf '%s\n' "$out" | sed 's/^/       /'; }
    else bad "$k: render-gifs failed"; fi
  fi
done

[ "$fail" -eq 0 ] && echo "check-kits: PASS" || echo "check-kits: FAIL"
exit "$fail"
