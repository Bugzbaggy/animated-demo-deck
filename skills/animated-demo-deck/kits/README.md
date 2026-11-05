# Demo deck kits

Four kinds of animated demo deck, so the next demo does not look like the last one. Each kit is a complete, working deck:
open `deck/<kind>-kit.html` in Chrome and press → to see its three example slides. All four tell the same made-up story
(a checkout slows down after a release, an alert fires, a thread finds the cause, a rollback ends it), so you can compare
how each kind shows the same facts. All four share one engine (`deck/engine.js`: beats, presenter view, auto mode, GIF
capture) and the same tools, so the way of working is the same whichever kind you pick. What differs is the look, the
motion and the **material**: what goes on screen, how the captions read and how the words sound.

| Kind | Format | Looks like | Material | Moves like | Pick it for |
|---|---|---|---|---|---|
| `cards` | slides, each its own composition | light, Inter, cards, chat mock-ups, a caption bar | cards that each make one claim; real messages as posted | fade and slide in, pop, marker highlight, a dot along a path | chat-thread replays, product walkthroughs |
| `console` | one terminal session through the whole talk | near-black, JetBrains Mono, tmux-style panes, a status line | the commands that ran and their output; a message is the output of the call that read or sent it | a command types, output streams line by line, a cursor blinks, a spinner turns, a pane splits | anything that is a run: a job, an MCP session, a script, SQL |
| `board` | one whiteboard; the camera pans and zooms between regions | paper, Caveat and Patrick Hand handwriting, marker colours, sticky notes, taped printouts | boxes, arrows and notes that explain; evidence taped on, ≤ 6 lines | a title writes itself, a box is sketched, an arrow is drawn, a note is stuck on, the camera flies | architecture, "what runs where", decisions, a story told around evidence |
| `dashboard` | one ops screen whose tiles update as a timeline needle moves | dark navy, Grafana-like tiles, big numbers, sparklines, status pills | numbers, events and states; a message is one event row and its facts | a counter ticks up, a sparkline draws, a gauge fills, an alert pings, a tile flips state | fleets, timelines, before/after numbers, incidents |

Rule of thumb: never the same kind twice in a row for the same audience. The same fact never appears in the same form in
two kinds: the skill's `materials.md` shows one fact (the alert and the first reply to it) in all four.

## Starting a deck from a kit

1. Copy the kit folder to the deck's own folder (for example `talks/<topic>/presentation`, or a `presentation_v<N>` next to
   an earlier version of the same talk). Never build in the kit itself.
2. Rename `deck/<kind>-kit.html` and its `<title>`; it must stay the only `.html` in `deck/`. In `deck/engine.js`,
   `openPresenter` names the presenter window (`'<kind>-kit-presenter'`): give it a name of its own, or Chrome reuses another deck's.
3. `node tools/fetch-fonts.mjs` once, to embed the kit's fonts (SIL OFL, from Google Fonts) in `deck/fonts.css`. Without
   it the deck falls back to system fonts.
4. Fill the kit's prep sheet from the source: `cards/thread-sheet.md`, `console/run-sheet.md`, `board/board-sheet.md` or
   `dashboard/facts-sheet.csv`. Everything that will be on screen goes in it first, with its source; the rows in each sheet
   are the example story. The kit's README ("Material") and the skill's `materials.md` give the limits, what never goes on
   screen in that kind, the caption grammar and the voice.
5. Replace the example scenes in `deck/scenes.js` from the sheet (the bottom half; keep the helpers in the top half). One
   `tl.beat` is one press of →. Write each caption in the kind's grammar.
6. `node tools/new-script.mjs --title "..." --audience "..."` writes `deck/script.js` for the beats you now have, then
   `node tools/render-gifs.mjs --timing && node tools/build-script.mjs --force` writes `SCRIPT.md`. Write the words there,
   in the kind's voice. From then on, words change only in `SCRIPT.md`, followed by `node tools/sync-script.mjs`. Adding or
   removing beats: change `scenes.js`, run `new-script.mjs` again (it keeps the words of beats that still exist), then
   `--timing` and `--force`. In "If you are running long", write a slide's start as `{start:<scene id>}`: the build fills in the time.
7. Check the captions with the skill's `captions.mjs list deck/scenes.js`. When the deck is a rebuild of another kind's deck,
   `captions.mjs compare <old>/deck/scenes.js deck/scenes.js` must report 0 identical.
8. `node tools/render-gifs.mjs --snap <dir>` for a PNG of every beat; `node tools/render-gifs.mjs --workers 2` for the GIFs.
9. Verify with the skill's `check-gifs.mjs` and `sweep-presenter.mjs` (in `<skill>/scripts`).
10. A blog or docs widget: start from `<kind>/widget-<kind>.html` and check it with the skill's
    `check-widget.mjs <widget.html> --widths 740,980,390`, which prints the iframe height to set.

The skill (`SKILL.md`, `materials.md` and `authoring.md`) has the full procedure, each kind's material, verbs and markup,
and the review list for what goes on screen.

## Kit contents

```
<kind>/
  deck/<kind>-kit.html   the page: that kind's CSS; rename on copy
  deck/scenes.js         helpers (keep) + example slides (replace)
  deck/engine.js         shared engine; the same in all four kits apart from the presenter window's name
  deck/script.js         generated by tools/new-script.mjs, then kept in step by sync-script
  deck/fonts.css         written by tools/fetch-fonts.mjs (not in git)
  tools/                 render-gifs, new-script, build-script, sync-script, fetch-fonts; timing.json
  <prep sheet>           thread-sheet.md, run-sheet.md, board-sheet.md or facts-sheet.csv: the material, filled first
  widget-<kind>.html     a self-contained, responsive widget skeleton in the same look, for a blog or docs page
  SCRIPT.md, README.md
```
