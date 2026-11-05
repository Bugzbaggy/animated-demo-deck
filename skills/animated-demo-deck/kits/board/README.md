# Board kit

One big whiteboard. Each slide is a region of it; the camera flies from the previous region into this one, and can lean
in on a detail. Paper with a faint grid, handwriting (Caveat for titles, Patrick Hand for everything else), marker colours,
sketched boxes, sticky notes, printouts taped on, arrows and loops drawn by hand. Open `deck/board-kit.html` in Chrome and
press → through the three example slides; `../README.md` says how to start a deck from a kit.

## Material

A drawing that explains, with the evidence taped beside the part it proves. Fill `board-sheet.md` first, one section per
region in the order the camera visits them; every word on the board is written there first.

- A region makes one claim, its title, in at most 8 words. At most 6 boxes (labels of at most 4 words), 3 notes (at most
  12 words each) and 1 printout (at most 6 lines, with a pencil footnote naming who and when).
- At most 60 handwritten words per region outside the printout; over 60, split the region.
- An arrow says why, in at most 3 words. A number goes in marker on a note, or beside the claim it corrects ("3 → 0").
- Something not deployed is a dashed box labelled "later". No KPI tiles, no log tails, no tables over 3 columns or 5 rows.
- Captions are margin notes of 4 to 10 words: "the session id makes every key unique".
- The voice is an explainer's, pointing: "This box is the cache. When the key changes, this arrow fires… because… so…".

The skill's `materials.md` has the full rules and the same fact shown in all four kinds.

## Writing a Board deck

Everything lives in `deck/scenes.js`. The top half is helpers; keep them. The bottom half is the board and the scenes.

**Regions.** `REGIONS` is an ordered list of `{ id, at: cell(col, row), html: () => '...' }`. Every scene's markup is
`board(REGIONS, '<id>', COLS) + CAP`: the whole board goes into `.cam`, regions before the active one drawn as done, the
ones after as faint "future" outlines, plus the minimap. Regions are 1920x1080 cells, 260 px apart; `cell(c, r)` is a cell's origin.

**Camera.** `view(at)` is the view in which a region fills the stage; `overview(cols, rows)` fits the whole board;
`zoom(at, px, py, s)` puts a region's point (px, py) at the stage centre at scale s. In a beat:
`hop(A, fromView, toView, o, d, dip = 0.35)` moves between regions and zooms out on the way, so the neighbours pass by
(use it in each slide's first beat while the title writes itself); `fly(A, fromView, toView, o, d)` is a straight move, for
leaning in on a detail or pulling back to the overview at the end; `park(A, view)` sets the camera without moving.

**Finished state.** Every region is in every scene, so the ones the camera passes must look finished. The page CSS sets
`--wipe`, `--draw`, `--hl` and `--strike` to 1 on `.region:not(.live)` and hides `.pkt` markers there; add a line for any
other variable your scenes animate.

**Zoomed out is expensive.** When the camera shows the whole board, every region paints. Future regions are faded with
a paper-coloured veil (`.region.future::after`), not `opacity`, and shadows are off outside the live region; both keep the
GIF capture from freezing when the machine is short of memory. Render a long Board deck one slide per run
(`--scenes <id>`), so a stall costs one GIF, not the set.

**Names.** `.in` is the inner wrapper of every box, note and printout, so never use it as your own class; and the page styles
some classes globally (`.tl`, `.ti`, `.call`, `.kpi`, `.final`, `.veil`), so give a region's own elements names of their
own, or they inherit `white-space`, borders and padding. scenes.js is one scope: two regions cannot both declare `const ROWS`.

**Selectors.** Wrap every selector in `$()`: `A.pop($('.note'), ...)`. It scopes to the live region, so `.note` never
matches a note in a done or future region.

**On the board** (each takes a position in region coordinates):

| Helper | Draws |
|---|---|
| `title(kicker, title, sub, tags)` | the region's handwritten heading; the title has `.wipe`, so `A.wipe($('.title'))` writes it |
| `box(cls, x, y, w, h, html, tilt)` | a sketched box; `blue`, `red`, `green`, `amber`, `dashed`, `plain`; `<h3><span class="num">1</span>…</h3><p>…</p>` inside |
| `note(cls, x, y, html, tilt, w)` | a sticky note with tape; `pink`, `blue`, `green`, `notape`; `<div class="nt">title</div>` then text; `<b>` is a white marker |
| `printout(cls, x, y, w, h, html, tilt)` | a taped printout (a chat message, a screenshot, a table); `.pl` is its pencil footnote |
| `text(cls, x, y, html, w)` | handwriting at a point; colour classes `blue red green amber pencil`, size `small` |
| `svg(…)` with `arrow(cls, x1, y1, x2, y2, {bend, seed, ink})`, `line(…)`, `loop(cls, cx, cy, rx, ry, {ink})`, `underline(cls, x1, y, x2)` | strokes with the `draw` class; `A.draw($('.cls'))` draws them on; `ink` is `blue`, `red`, `green`, `amber`, `pencil`, `thick`, `thin` |
| `msg(cls, who, time, body)`, `bullet`, `code`, `ell` | a chat message for a printout; add people to `AV` and `NAMES`, give `.av-xx` a colour in the page |

Boxes, notes and printouts are a wrapper plus `.in`: the engine moves and fades the wrapper, `.in` carries the tilt
(`--tilt`), so a popped note keeps its angle.

**Verbs that fit this kind:** `A.wipe` on a title (writes it), `A.type` on a line of text (pen with a blue caret),
`A.draw` on arrows, loops and underlines, `A.mark` on a `<span class="mark">` (yellow marker; `pink`, `green`),
`A.strike` on `<span class="strike">`, `A.pop` for notes, `A.show` for boxes and printouts, `fly` for the camera.

**Captions** are a handwritten strip at the bottom. A beat with no caption keeps the previous one; pass
`'<i class="blank"></i>'` to clear the strip (the closing card, for example). Keep notes clear of the strip and of the
minimap in the bottom-right corner (below about y 975 and right of x 1780).

## Files

- `deck/board-kit.html`: the CSS. Scene-only rules go in a `<style>` inside the region's html, scoped as `.r-<id>`.
- `deck/scenes.js`: helpers and the three example regions (`what`, `why`, `fix`).
- `tools/fetch-fonts.mjs`: writes `deck/fonts.css` (Caveat, Patrick Hand, Inter, JetBrains Mono, Lato; SIL OFL).
- `widget-board.html`: the same look as a self-contained, responsive, reader-paced widget for a blog or docs page.
