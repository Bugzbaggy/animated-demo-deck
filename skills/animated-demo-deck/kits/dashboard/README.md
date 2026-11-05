# Dashboard kit

One ops screen whose tiles update as a timeline needle moves. Dark navy, Grafana-like tiles with big tabular numbers,
sparklines, gauges, status pills, a log tile, a rail across the bottom with time ticks, event markers and a needle, and
alert ping rings. Open `deck/dashboard-kit.html` in Chrome and press → through the three example slides;
`../README.md` says how to start a deck from a kit.

## Material

Numbers, events and states. Fill `facts-sheet.csv` first: one row per fact, typed `kpi` (a number), `event` (something at
a time), `state` (ok, warn, crit, info), `quote` (a verbatim passage) or `fact` (a label and a value too long for a KPI),
each with its source. The rows in the kit's sheet are the made-up example story.

- A message becomes one event row (`er()`), its findings KPIs, `fact()` rows and `vs()` rows (claimed against measured).
  The row's one line may be the post's own title; it is at most 100 characters, its subline at most 130.
- A message gets at most one verbatim passage, as `<span class="quote">`: one or two sentences, at most 160 characters, ⋯
  where a sentence is cut. The slide's header may repeat it. No message bodies, no bullet lists, no paragraphs.
- KPI values are at most 6 characters (85, 12, 2,400, 10:02). At most 3 text-only tiles per screen, at most 3 lines each.
- Every tile's state means something; a verdict is a state flip. Every number is spoken in its beat or explains a state.
- An interval names both ends and is the difference of two posted times: "85 s from the alert to the first reply".
- An event with no time in the source (a tool call inside a run) gets no time and no needle position: show it after the
  timed event it belongs to. Never stamp a time the source does not show.
- Captions read `panel or time: <b>value</b> · meaning`: "10:02:40: <b>p95 2,400 ms</b> · hit rate 12% · the alert fires".
- The voice reads the screen, time then value then state: "Ten oh two forty: latency at twenty-four hundred milliseconds."

The skill's `materials.md` has the full rules and the same fact shown in all four kinds.

## Writing a Dashboard deck

Everything lives in `deck/scenes.js`. The top half is helpers; keep them. The bottom half is the scenes.

**The screen.** Each scene starts with `topbar(name, sub, range, clock)` and usually `H(kicker, title, sub)`. Tiles are
absolutely positioned on the 1920x1080 stage; the rail sits at the bottom (`rail(events, ticks, at)`), the captions
strip above it, so keep tiles above about y 840.

**Tiles and what goes in them:**

| Helper | Draws |
|---|---|
| `tile(cls, x, y, w, h, title, html)` | a tile; state classes `ok`, `warn`, `crit`, `info`, `dim` colour its edge and glow; `.pill` inside the title sits at the right |
| `kpi(value, unit, sub, tone)` | a big number with unit and sub line; the last argument colours it (`ok warn crit info accent`), and `sm` in it makes it smaller |
| `pill(state, text)` | a status pill; `ok warn crit info off`, add `lg` for a larger one |
| `spark(cls, points, w, h, pad, range)` | a sparkline: `polyline.draw` (drawn by `A.draw`), a faint `.fill` area and a `.last` dot. `range = [min, max]` fixes the scale (without it, small noise fills the tile). Bring `.fill` in with `A.tween(sel, o, d, { opacity: [0, 0.12] })`; `A.fade` would end at 1 |
| `gauge(cls, fill, left, right)` | a bar whose width follows `--fill` (0 to 1); `A.vars(sel, o, d, { '--fill': [0, .6] })` fills it |
| `arc(cls, fill, size, value, label)` | a 3/4-circle gauge, also driven by `--fill`; `.arcwrap .av` is the number inside |
| `logTile(cls, x, y, w, h, title, lines)` | a mono log; `lines` are `[time, level, text]`, levels `INFO WARN CRIT OK` |
| `rail(events, ticks, at)` | the time rail; `events` are `{ t: 'HH:MM[:SS]', label, state }`, placed by `tx(t)` within `RAIL.t0..t1`; `at` is where the needle starts |
| `ring(cls, x, y)` | a free ping ring at a point (inside a tile, for example) |
| `er(cls, t, who, lvl, text, sub)` | one message as one event-log row, inside `<div class="elog">`; levels `CRIT HIGH LOW WARN OK DM INFO` |
| `fact(cls, label, value, sub, tone)` | a label and a value too long for a KPI, inside `<div class="facts">`; `tone` colours the value |
| `vs(rows, heads)` | claimed against measured: `rows` are `[check, claimed, measured, tone]`, each row's cells carry `v1`, `v2`, … |
| `<span class="quote">` | the one verbatim passage a message gets (`quote sm` for 16 px) |

**Verbs on top of the engine** (all pure functions of scene time):

| Verb | Does |
|---|---|
| `clock(A, o, d, from, to)` | runs the top-bar clock from one time to another over the beat |
| `needle(A, o, d, [from, to])` | moves the rail needle between two times; its bubble shows the time as it goes |
| `ping(A, sel, o, n, every, grow)` | a ring grows and fades `n` times; hidden before and after |
| `flip(A, sel, o, state)` | changes a tile's or pill's state class at `o` (a pill keeps its text, so leave pills off tiles that flip) |
| `stream(A, sel, o, lps, blink)` | streams a log tile's lines at `lps` per second, then blinks its cursor |
| `count(A, sel, o, d, from, to)` | counts a number up or down (`A.count`) |
| `A.draw`, `A.vars`, `A.show`, `A.pop`, `A.fade`, `A.mark` | as in every kit: draw a sparkline, fill a gauge, bring a tile in, highlight a phrase |

Set `RAIL.t0`/`t1` to the talk's window at the top of the scenes half and give `rail()` the real events; `tx('HH:MM')`
then places anything by time. Tiles have `overflow: hidden`, so a ring inside a tile should grow less (`grow` 1.3) than
one on the rail.

## Widget

`widget-dashboard.html` is the same look as a self-contained, responsive, reader-paced widget (system fonts, no network)
for a blog or docs page: Next / Back / Replay, a step counter and caption, `data-at`/`data-delay` reveals, `?step=N`,
arrow keys, autoplay of step 1 when scrolled into view, reduced-motion support. Its CSS-transition versions of the verbs:
a gauge fills via `--fill`, a sparkline draws via `stroke-dashoffset`, a tile changes state class, the rail needle
follows `--pos`, event rings ping with a keyframe on `.hit`, numbers count with a small JS tween on step entry. Tiles
reflow to two columns under 860 px and one under 480 px (`.grid.three` to one under 860 px). Classes to reuse:
`.tile .tt .body`, `.kpi .kv .ku .ks`, `.pill`, `.gauge .gf`, `svg.spark .fill`, `.log .ln .ts .lv .tx`,
`.rail .rl .tick .ev .ping .needle .nb`, `.ring`, `.bar`.

## Files

- `deck/dashboard-kit.html`: the CSS. Scene-only rules go in a `<style>` inside the scene's html, scoped as `#scene-<id>`.
- `deck/scenes.js`: helpers and the three example scenes (`screen`, `incident`, `recovery`).
- `tools/fetch-fonts.mjs`: writes `deck/fonts.css` (Inter, JetBrains Mono, Lato; SIL OFL).
- `widget-dashboard.html`: the widget skeleton described above.
