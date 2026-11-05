# Console kit

One terminal session that runs through the whole talk. Near-black, JetBrains Mono inside the panes, Inter for the few
labels. tmux-style panes with a title bar, a status line at the bottom in place of a caption bar, ok/warn/err lines,
red/green diff lines, a blinking cursor, a spinner. Open `deck/console-kit.html` in Chrome and press → through the three
example slides; `../README.md` says how to start a deck from a kit.

Pick this kind for anything that *is* a run: a scheduled job, an MCP session, a script, a SQL batch, a deploy. The
audience watches the thing happen in the order it happened, with its timings.

## Material

The commands that ran and what they printed, in order. Fill `run-sheet.md` first, copying commands and output from the
run's own record (its log, a headless run's stream-json, a recorded terminal); never type output from memory. A block that
only has results (a tool call whose raw output was not kept) shows one result line under the call and is marked
`summarised`; the deck's README sources then say so.

- One to three panes; a pane shows at most 20 lines and tails the rest; a block has at most 12 output lines, cut with `…`.
- Every number sits in an output line the record printed, or in a `#` comment line when you computed it. A `kpi()` beside
  a pane may repeat one, never add one; the closing slide may show three numbers to remember that the talk has already shown.
- A chat message is the output of the call that read or sent it: the history call, then up to 6 lines of the post as
  posted (its title and the lines with its claims); a DM or reply: the send call, its `ok` line, up to 6 lines of the text.
  No chat mock-ups, no prose paragraphs.
- When the source is messages, not a run record, every block is `summarised`, the calls are the ones the messages name,
  and an interval you computed is a comment line (`# alert 10:02:40 → reply 10:04:05 = 85 s`), never output.
- At most one note card per slide, at most 20 words.
- The status line reads `what ran → <b>result</b>`: "cachectl stats cart → <b>hit rate 94% → 12% from 09:58</b>".
- The voice replays the run, present tense: "Here is the session that found it. I list the deploys… it returns…". "I
  run" only for a command a person typed.

The skill's `materials.md` has the full rules and the same fact shown in all four kinds.

## Writing a Console deck

Everything lives in `deck/scenes.js`. The top half is helpers; keep them. The bottom half is the scenes.

**Panes.** `pane(cls, x, y, w, h, title, lines, opts)` is one tmux-style window at stage coordinates; `opts` is
`{ tag, static, focus, size: 'lg' | 'sm' }`. Lines are hidden until streamed, so a pane whose lines should all be there
from the start takes `static: true`. Size goes through `--w`/`--h`, which is what lets `split()` resize a pane.

**Lines.** Each takes a class name first, which is how the timeline addresses it (`l1`, `l2`, … or `g1`… for a group):

| Helper | Draws |
|---|---|
| `cmd(cls, text, prompt = '$')` | a command line; `typeCmd()` types its text |
| `out`, `dim`, `ok`, `warn`, `err`, `info` `(cls, text)` | output in that colour |
| `add`, `del` `(cls, text)` | a diff line, green `+` or red `−` |
| `call(cls, name, args, ms)` | a tool call: `→ name args 0.8 s` |
| `json(cls, obj, markKeys)` | pretty JSON, one `.ln` per line, coloured; lines whose key is in `markKeys` get `.mark` and the class `cls-key` |
| `spinner(cls, text)` | a line with a spinner glyph; `spin()` turns it |
| `prompt(cls)` | a prompt with a block cursor; `cursor()` blinks it |
| `raw(html)` | pass HTML instead of escaped text to any of the above (for `<span class="mark">` and `<span class="strike">`) |

A line whose class includes `mark` (plus `red`, `amber` or `green` for the colour) can be highlighted whole with `hl()`.

Also `card(cls, x, y, w, title, html)` for a note beside a pane (left border colour: `green`, `amber`, `red`),
`kpi(cls, x, y, value, label)`, `H(kicker, title, sub, tags)` for the header, and `svg(path(cls, d, ink))` for a drawn line.

**Verbs** (all pure functions of time; `A` is the beat's animation API):

| Verb | Does |
|---|---|
| `stream(A, sel, o, lps, n)` | reveals the matched lines one after another, `lps` lines per second; returns the time the `n`th is on |
| `typeCmd(A, sel, o, cps)` | shows a `cmd` line and types its text with the caret; returns the typing time |
| `cursor(A, sel, o, d)`, `cursorOff(A, sel, o)` | blinks a `.cur` block for `d` seconds (on for even half-seconds), then leaves it on; hides it |
| `spin(A, sel, o, d, done = '✓')` | turns a `.spin` glyph for `d` seconds, then shows the done glyph in green; the glyph is a CSS variable, so seeking back resets it |
| `tail(A, sel, o, d, to, from)` | scrolls a pane's lines up to `to` px, like `tail -f` |
| `split(A, sel, o, d, { w: [a, b], h: [a, b] })` | resizes a pane, so another can take the room |
| `hl(A, sel, o, d)` | highlights a `.ln.mark` line with the coloured bar (`A.mark`) |

Plus the engine's own: `A.show`, `A.fade`, `A.mark` on `<span class="mark">`, `A.strike` on `<span class="strike">`,
`A.wipe` on a `.wipe` element, `A.draw` on an SVG path with class `draw`.

**Measuring a tail.** Lines are 1.6 × the font size tall (18.5 px → 29.6 px; `sm` 16 px → 24.8 px; `lg` 21 px → 33.6 px).
The pane body is the pane height minus 40 px of bar and 28 px of padding. Overflow = lines × line height − body; that is
the `to` for `tail()`. Check it with `node tools/render-gifs.mjs --snap <dir>`.

**The status line.** The engine's captions are the status line: `[demo]` on the left, the caption after a `>`, the key
hints on the right. Captions are one line; keep them under about 90 characters.

**Hand-written SCRIPT.md.** If you write SCRIPT.md from scratch rather than from a build, `sync-script` copies the words
into the deck and then stops at the header check; run `node tools/build-script.mjs --force` once after it, and the
next sync is a no-op.

## Files

- `deck/console-kit.html`: the CSS. Scene-only rules go in a `<style>` inside the scene's html, scoped as `#scene-<id>`.
- `deck/scenes.js`: helpers and the three example scenes (`deploys`, `cache`, `rollback`).
- `deck/engine.js`: the shared engine; presenter window `console-kit-presenter` (rename on copy).
- `tools/fetch-fonts.mjs`: writes `deck/fonts.css` (Inter, JetBrains Mono, Lato; SIL OFL).
- `widget-console.html`: the same look as a self-contained, responsive, reader-paced widget (a terminal whose lines appear
  step by step, notes beside it) for a blog or docs page. `?step=N` opens it at a step.
