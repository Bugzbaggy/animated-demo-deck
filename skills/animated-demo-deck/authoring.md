# Authoring slides for the deck engine

Reference for `deck/scenes.js`, `deck/engine.js` and the page CSS in the four kits (`<skill>/kits/<kind>/`). The engine
is the same in all four, apart from the presenter window's name; each kind adds helpers and CSS. For anything not listed
here, read `api()` in `engine.js` and the kit's README.

## Model (all kinds)

- The stage is 1920x1080. Every frame is a pure function of scene time, so the live deck, the GIFs and the `--snap`
  PNGs draw the same thing. In `build`, only schedule tracks through `A.*`: no timers, `Math.random`, `Date` or direct
  DOM changes.
- A scene is `Deck.add({ id, title, theme, html, build(tl) })`. Scene-only CSS goes in a `<style>` inside `html`,
  scoped as `#scene-<id>` (Board: `.r-<region id>`). End `html` with `${CAP}`, or the captions don't show.
- A beat is `tl.beat(id, dur, A => { ... }, caption)`. `dur` must cover the last track in the beat. The caption is HTML
  in the kind's grammar (materials.md), with `<b>` on the key phrase or value. No caption leaves the previous one on screen.
  `node <skill>/scripts/captions.mjs list deck/scenes.js` prints them all, including captions built in a loop.
- Each beat is one press of → and one `**m:ss · beat N.**` block in SCRIPT.md.
- The pause after a beat, in GIFs and auto mode, is max(1.5 s, words ÷ 2.25 − dur), i.e. 135 wpm; `hold: n` on a beat in
  script.js overrides it. So a beat whose animation outlasts its words costs dur + 1.5 s.
- GIF frames are 70 ms (`FRAME` in engine.js). Render mode is the page URL plus `?capture`, driven through `window.__cap`
  (`ids`, `select`, `seek`).
- An element animated in with `show`, `fade` or `pop` starts hidden: its track's starting opacity is its resting state
  before the track begins.

## A.* calls

`o` is seconds from the beat start, `d` the duration; the target is a selector inside the scene, an element, or an array.
A selector that matches nothing throws, naming the scene.

| Call | Does |
|---|---|
| `show(t, o=0, d=0.55, {dy=18, dx=0, s=1, stagger=0, ease})` | Fades in while sliding from dx/dy. |
| `fade(t, o, d=0.5, stagger)`, `hide(t, o, d=0.35, stagger)` | Opacity 0 → 1; current → 0. |
| `pop(t, o, d=0.5, stagger)` | Fades in with a small overshoot. |
| `dim(t, o, d=0.4, to=0.3, stagger)` | Fades to `to`. |
| `move(t, o, d, {x, y, scale, rot}, ease='inOut')` | Transforms, each as `[from, to]`. A thread scroll is `move('.sk-scroll', o, d, {y: [-from, -to]})`. |
| `vars(t, o, d, {'--name': [a, b]}, ease, stagger)` | Animates a CSS custom property. |
| `wipe`, `mark`, `draw`, `strike` `(t, o, d, stagger)` | Drive `--wipe`, `--hl`, `--draw`, `--strike`; the element needs the class `.wipe`, `.mark`, `.draw` or `.strike`. |
| `on(t, o, name='on')`, `off(...)` | Add or remove a class at `o`. |
| `type(t, o, cps=40)` | Types the element's own text; returns the typing seconds. |
| `count(t, o, d, from, to)` | A number ticking up (or down). |
| `dots(t, o, d)` | "Thinking" dots. |
| `along(t, pathSel, o, d, span=[0, 1])` | Moves along an SVG path (same coordinates as the element's container). |
| `fn(t, o, d, (cur, p, local, el) => {...}, ease='lin')` | Per-frame callback: set `cur.text`, `cur.opacity`, `cur.x/y/scale/rot`, `cur['--var']` or `cur['.class']` (0/1). Seeking back resets them. Cursors, spinners, clocks and the Board camera hop are built on it. |
| `tween(t, o, d, props, ease)` | Raw tween, for example `{ opacity: [0, 0.12] }` to fade something in to less than full opacity. |

Eases: `lin`, `out`, `in`, `inOut`, `back`.

## Script tools (all kits)

| Command | Does |
|---|---|
| `node tools/new-script.mjs [--title …] [--audience …]` | Writes `deck/script.js` from the beats scenes.js has; keeps the words of beats that still exist (by beat id, else by position when the count is unchanged); new beats get the caption as cue and a TODO line. |
| `node tools/render-gifs.mjs --timing` | Writes `tools/timing.json` (needs Chrome). |
| `node tools/build-script.mjs [--force]` | Writes SCRIPT.md from script.js and timing.json; refuses to drop SCRIPT.md edits without `--force`. |
| `node tools/sync-script.mjs` | Copies SCRIPT.md's words, cues, titles, Q&A, checklist, running-long and sources into script.js, refreshes the timing, rebuilds SCRIPT.md, and prints the GIFs to re-render. |
| `node tools/fetch-fonts.mjs` | Writes `deck/fonts.css` with the kit's fonts embedded (SIL OFL, from Google Fonts), so the deck works offline and from `file://`. |

`{start:<scene id>}` in a running-long line becomes that slide's start time at every build.

## Kind: cards

Material: cards that each make one claim, and real messages as posted (materials.md; prep sheet `thread-sheet.md`).
Helpers at the top of the Cards kit's scenes.js:
- **Header:** `H(kicker, title, sub, [[tag, color], ...])`. Colors `'blue'`, `'green'`, `'amber'`.
- **People:** add each to `AV` (CSS class and initials) and `NAMES`, and bots to `APPS` (the APP badge); give `.av-xx` a
  background in the page CSS.
- **Messages:** `msg(cls, who, time, body, extra)`; `at(name)` a mention, `code(text)` inline code; `replies(whos, n)`;
  `think(cls, who)` the "is thinking" line (animate its `.dt` with `A.dots`).
- **Windows:** `threadWin(inner)` is the thread on the left (its channel name is `CHANNEL`); `side(title, sub, inner)` the
  card on the right, with `callout(cls, top, title, text)` inside it.
- **Abridging:** `<span class="sk-ell">⋯</span>` inside text. **Highlighting:** `<span class="mark m-x">`, then
  `A.mark('.m-x', o, d)`. **Masking:** `<span class="redacted">customer account</span>`.
- **Other markup:** `.callout` (green; `amber`, `red`, `blue`) with `.ct` and `.cd`, `chip(cls, text)` (`green`, `red`,
  `amber`, `gray`), `.card`, a dot on a path (`.pkt` and `A.along`).

## Kind: console

Material: the commands that ran and their output, copied from the run's own record; a chat message is the output of the
call that read or sent it (materials.md; prep sheet `run-sheet.md`). One terminal session.
`pane(cls, x, y, w, h, title, lines, {tag, static, focus, size})`; lines from `cmd`, `out`, `dim`, `ok`, `warn`, `err`,
`info`, `add`, `del`, `call`, `json`, `spinner`, `prompt`, `raw`. Verbs: `stream` (reveal lines at n per second), `typeCmd`,
`cursor`/`cursorOff`, `spin`, `tail` (scroll a pane), `split` (resize via `--w`/`--h`), `hl`. To highlight a whole line,
give it the class `mark` (and a colour: `red`, `amber`, `green`) and call `hl`. The captions are the status line: one line,
under about 90 characters. Line heights and the tail arithmetic are in the Console kit's README.

## Kind: board

Material: boxes, arrows and notes that explain, at most 60 handwritten words a region, evidence taped on as a printout of
at most 6 lines (materials.md; prep sheet `board-sheet.md`). One whiteboard; each slide is a region and the camera hops
between them.
- **Regions:** `REGIONS = [{ id, at: cell(col, row), html: () => '…' }]`, 1920x1080 cells 260 px apart. Each scene's html is
  `board(REGIONS, '<id>', COLS) + CAP`: every region is in every scene, the ones before the active one marked `done`, the
  ones after `future` (faint), plus a minimap.
- **Camera:** `view(at)` fills the stage with a region; `overview(cols, rows)` fits the board; `zoom(at, px, py, s)` centres a
  point. `hop(A, from, to, o, d, dip=0.35)` moves between regions, zooming out on the way (use it in each slide's first beat);
  `fly(A, from, to, o, d)` is a straight move (lean in on a detail, or the final pull-back); `park(A, view)` sets it.
- **Selectors:** wrap every one in `$()`, which scopes to the live region (`A.pop($('.note'), …)`).
- **On the board:** `title(kicker, title, sub, tags)` (the title wipes on), `box(cls, x, y, w, h, html, tilt)`,
  `note(cls, x, y, html, tilt, w)` (sticky note; `pink`, `blue`, `green`), `printout(cls, x, y, w, h, html, tilt)` (taped;
  a chat message inside it with `msg()`), `text(...)`, and strokes in `svg(...)`: `arrow`, `line`, `loop`, `underline` with
  `ink` `blue red green amber pencil thick thin`, drawn on with `A.draw`.
- **Wrappers:** boxes, notes and printouts are an outer div (moved and faded by the engine) plus `.in` (the tilt). So `.in`
  is reserved; never use it as your own class. A transformed `.in` is the containing block: absolute children are placed
  from its padding box.
- **Finished state:** regions the camera passes show their final state through `.region:not(.live)` rules (`--wipe`,
  `--draw`, `--hl`, `--strike` set to 1, moving markers hidden). Add a rule for each other variable you animate.
- **Global classes:** the page CSS styles some classes everywhere (`.tl`, `.ti`, `.call`, `.kpi`, `.final`, `.veil`).
  Name a region's own elements so they don't collide, or they inherit `white-space: nowrap`, borders and padding.
- **Captions:** a handwritten strip; `'<i class="blank"></i>'` clears it on a beat.
- **Measure:** `measure.mjs` measures the live region (`.sk-body`/`.sk-scroll` for a scrolling printout, overflow of boxes,
  notes and printouts). Snap mid-flight frames with `--times`.

## Kind: dashboard

Material: numbers, events and states (materials.md; prep sheet `facts-sheet.csv`). One ops screen. `topbar(name, sub,
range, clock)`, `tile(cls, x, y, w, h, title, html)` with state classes `ok warn crit info dim`, `kpi`, `pill`,
`spark(cls, points, w, h, pad, range)` (draw with `A.draw`; pass `range = [min, max]` so small noise stays small, and bring
its `.fill` in with `A.tween(…, { opacity: [0, 0.12] })`), `gauge`/`arc` (fill with `A.vars('--fill')`), `logTile`,
`rail(events, ticks, at)` with `RAIL.t0`/`t1` set in the scenes half and `tx('HH:MM[:SS]')`, `ring`. The material's own
helpers:
- `er(cls, t, who, lvl, text, sub)`: one message as one event-log row in an `<div class="elog">`; `lvl` is `CRIT HIGH LOW
  WARN OK DM INFO`; `text` ≤ 100 characters (it may be the post's own title), `sub` ≤ 130.
- `fact(cls, label, value, sub, tone)` inside `<div class="facts">`: a value too long for a KPI (a file name, a version).
- `vs(rows, heads)`: claimed against measured, `rows` as `[check, claimed, measured, tone]`; cells carry `v1`, `v2`, … to fade in.
- `<span class="quote">…</span>`: the one verbatim passage a message gets (`quote sm` for 16 px).
Verbs: `clock`, `needle`, `ping`, `flip`, `stream`, `count`. Tiles clip their content, so a ring inside a tile grows less.
`flip()` changes a tile's state class; a pill inside it keeps its text, so leave pills off tiles whose state changes.
Details in the Dashboard kit's README.

## Widgets (blog and docs pages)

`<kit>/widget-<kind>.html` is a reader-paced version of the kind: no engine, CSS transitions instead. The contract every
widget keeps: Next / Back / Replay, a step counter "k / N" and a caption line, click the stage to advance, arrow keys when
focused, `?step=N` to open at a step, step 1 plays when the widget scrolls into view (IntersectionObserver),
`prefers-reduced-motion` turns transitions off, system fonts only, no network, one self-contained file.
- Reveal with `data-at="N"` (and `data-delay` in seconds); other per-step effects toggle a class from `data-mark`,
  `data-draw`, `data-strike` or the widget's own step table.
- No `vh` units inside a widget: in an iframe the viewport is the iframe, so the height depends on itself.
- No inline `grid-template-columns`: an inline style beats the widget's breakpoints, so the columns never collapse on a
  phone. Use a class and give it its own breakpoint.
- `node <skill>/scripts/check-widget.mjs <widget.html> --widths 740,980,390 --shots <dir>` prints the content height per
  step and the iframe height per width (for example a site builder's "HTML code" block: desktop = the larger of 740 and
  980, mobile = 390), and fails on horizontal overflow or a box spilling out of its tile.

## Scrolling a long thread

Scroll offsets are constants in `build` (`const R1 = 114;`). Measure them, never guess:

```
node <skill>/scripts/measure.mjs <deck.html> thread-1,thread-2
```

It prints the viewport and content heights, each message's and highlight's top within the scrolling content, and anything
that overflows its card. Pick an offset a little above the message that should sit at the top, and no more than content
minus viewport. Then look at the `--snap` PNGs. The script launches its own headless Chrome (profile `deck-measure-`).

## Visual check before rendering GIFs

- `node tools/render-gifs.mjs --snap <dir>` writes a PNG of the end of every beat; `--times "thread:1.2,3.4;intro:2.5"`
  captures moments inside a beat instead.
- Look for text clipped by its card, callouts overlapping, a highlight before its text is on screen, a `.wipe` speck before
  its wipe, chips wrapping, a thread scrolled past its last message, a note under the minimap or the caption strip, and
  (Board) a region the camera passes that looks unfinished.
