# Cards kit

Slides, each its own composition: a light page, Inter, cards and callouts, chat mock-ups with highlighted quotes, a
caption bar under every slide. Things fade and slide in, pop, get a marker highlight, and a dot travels along a path.
Open `deck/cards-kit.html` in Chrome and press → through the three example slides (`intro`, `thread`, `cause`);
`../README.md` says how to start a deck from a kit.

## Material

Cards that each make one claim, and real messages as posted. Fill `thread-sheet.md` first: one row per message (posted
time in one named timezone, who, the text as posted with ⋯ for each cut, a highlight of at most 12 words, what the message
is in its full context) and one row per walkthrough card (a claim of at most 10 words, one line of support of at most 20,
its chips, its source).

- A thread window shows 2 to 5 messages; a message gets at most 2 highlights; the side card says what the highlight means in
  at most 25 words. A longer thread scrolls, with measured offsets.
- A number appears only where a message, a bot footer or the product page states it. No KPI tiles, no terminal panes.
- Captions are one plain sentence with the key phrase in bold: "Rolling back to v2.13 <b>brought the latency back to 180 ms</b>."
- The voice is a narrator's. On a thread: past tense, names and times ("At four past ten the on-call engineer answered…").

The skill's `materials.md` has the full rules and the same fact shown in all four kinds.

## Writing a Cards deck

- Everything on screen is in `deck/scenes.js`, one `Deck.add({ id, title, theme, html, build(tl) })` per slide.
  `theme` is `'dark'` (a title slide), `'act'` (thread slides) or nothing (light).
- Helpers at the top of `scenes.js`: `H(kicker, title, sub, tags)` for the header; `msg`, `replies`, `think`, `at`,
  `code` for chat messages; `threadWin(inner)` for the thread on the left (channel name in `CHANNEL`) and
  `side(title, sub, inner)` with `callout(...)` for the card on the right; `chip(cls, text)`. Add people to `AV` and
  `NAMES`, bots to `APPS`.
- Markup: `.callout` (`amber`, `red`, `blue`), `.chip` (`green`, `red`, `amber`, `gray`), `.card`,
  `<span class="mark m-x">` for a highlight, `<span class="redacted">` for a mask, `<span class="sk-ell">⋯</span>` for a cut.
- Verbs that fit this kind: `A.show`, `A.pop`, `A.fade`, `A.mark`, `A.wipe`, `A.draw`, `A.along` (a dot on an SVG
  path), `A.type`, `A.move` for scrolling a thread (`.sk-scroll`, offsets measured with the skill's `measure.mjs`).
- The words: `node tools/new-script.mjs` after changing beats, then `--timing` and `build-script --force`; from then on
  edit `SCRIPT.md` and run `node tools/sync-script.mjs`.

The full engine API is in the skill's `authoring.md`.

## Files

- `deck/cards-kit.html`: the page and its CSS (rename on copy). `deck/scenes.js`: helpers and the three example slides.
- `deck/engine.js`: the shared engine (presenter window `cards-kit-presenter`; rename on copy).
- `tools/fetch-fonts.mjs`: writes `deck/fonts.css` (Inter, JetBrains Mono, Lato; SIL OFL).
- `widget-cards.html`: the same look as a self-contained, responsive, reader-paced widget for a blog or docs page.
