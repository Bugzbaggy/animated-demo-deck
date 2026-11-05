---
name: animated-demo-deck
description: Use when the user wants an animated demo, demo deck, talk or slides with play-once GIFs and a spoken script, in a cards, console/terminal, board/whiteboard or dashboard/ops-screen look; when a chat thread, incident, runbook or package should become an animated talk or an interactive blog widget; or when an existing deck should be rebuilt in another look.
---

# Animated demo deck

## Overview

One engine, four kinds of deck, each with its own look, motion and **material**: what goes on screen, how captions read,
and how the words sound. Cards shows cards and real messages as posted, Console the commands that ran and their output,
Board a drawing with evidence taped on, Dashboard numbers, events and states. Every frame is a function of time, so one
source gives three outputs: the live deck (click-paced, with a presenter view), 1920x1080 GIFs that play once for Google
Slides, and a spoken SCRIPT.md with target times. Each kind has its own kit (look, helpers, verbs, example slides, a prep
sheet for its material) and a matching widget skeleton for a blog or docs page. The words live in SCRIPT.md and reach the
deck only through the sync script.

## Where things are

Below, `<skill>` is this skill's folder (for example `~/.claude/skills/animated-demo-deck`).

| What | Where |
|---|---|
| The four kits (start every deck here) | `<skill>/kits/<cards\|console\|board\|dashboard>/`; `kits/README.md` lists the kinds; each kit's README has its helpers and verbs |
| What each kind puts on screen, its caption grammar and its voice | This skill's `materials.md`; each kit's prep sheet: `cards/thread-sheet.md`, `console/run-sheet.md`, `board/board-sheet.md`, `dashboard/facts-sheet.csv` |
| A finished example of each kind | The kits themselves: three slides each, all on one made-up story (a checkout slows down after a release), so the four can be compared fact for fact |
| Checks | This skill's `scripts/`: measure, check-gifs, sweep-presenter, check-widget, captions |
| Engine API, each kind's markup, widgets | This skill's `authoring.md` |

The tools need Node 24 (no npm packages), Chrome or Edge, and ffmpeg. Run `node tools/fetch-fonts.mjs` once in a copied
kit to embed its fonts (SIL OFL, from Google Fonts); without it the deck uses system fonts.

## Step 0: pick the kind

| Kind | Format | Material (materials.md) | Moves like | Pick it for |
|---|---|---|---|---|
| `cards` | slides, each its own composition; light, chat mock-ups, a caption bar | cards that each make one claim, and real messages as posted | fade, pop, marker highlight, a dot along a path, a thread that scrolls | a chat-thread replay, a product walkthrough |
| `console` | one terminal session through the whole talk; tmux panes, a status line | the commands that ran and their output; a message is the output of the call that read or sent it | a command types, output streams, a cursor blinks, a spinner turns, a pane splits | anything that is a run: a job, an MCP session, a script, SQL |
| `board` | one whiteboard; each slide is a region and the camera hops between them | boxes, arrows and notes that explain, evidence taped on (≤ 6 lines) | a title writes itself, a box is sketched, an arrow is drawn, a note is stuck on | architecture, what runs where, decisions, a story told around evidence |
| `dashboard` | one ops screen; tiles update as a timeline needle moves | numbers, events and states; a message is one event row and its facts | a counter ticks up, a sparkline draws, a gauge fills, a tile flips, an alert pings | a fleet, an incident timeline, before/after numbers |

- If the user names a look ("whiteboard", "terminal", "Grafana-style"), that is the kind, even if the audience saw it last
  time; say so in one line.
- Otherwise never the same kind twice in a row for the same audience. Look up their last deck in its own README, or ask.
- If two kinds fit equally, pick one and say why in one line; ask only if the choice changes what the user must prepare.

## Steps

1. **Read the whole source.**
   - **A chat thread:** read every reply, with a chat connector if one is available (for Slack, a permalink's
     `p1792123413290249` is ts `1792123413.290249`; a reply's permalink carries the thread's ts in `thread_ts=`). Note who
     said each thing first, and when. If the link or an excerpt doesn't match the thread, ask. If you can't read it, say so
     and ask for an export or the pasted thread; never rebuild a thread from memory.
   - **Product facts:** the product's own documentation. Re-check numbers before reuse.
   - **A package folder someone is still editing:** copy each source file to a scratch folder when you first read it and
     note the modification times. Before rendering, list the times again, diff the changed files against your copies,
     and carry every change into the slides, the words, the Q&A and the README.
2. **Make the folder.** Never build in the kit itself; only ever change a copy.
   - New talk: copy the whole kit folder to the deck's own folder (for example `talks/<topic>/presentation`).
   - An existing deck in another kind: by default a new version folder next to it (`presentation_v<N+1>`), so the finished
     deck stays as it was. Rebuild in place only when the user names that folder; then first copy the old deck to
     `archive/v<old N>-<old kind>/` inside it (for example `archive/v1-cards/`).
   - For either kind of rebuild, take the new kit's `deck/` page, `engine.js` and `scenes.js` (keep its helpers,
     replace its example slides) and its `tools/`. Keep the old `deck/script.js` and SCRIPT.md, and reuse the old scene ids
     and beat ids, so the words carry over; within a slide a beat may move when the new kind needs another order (the
     run's order in Console). The material does not carry over: fill the new kind's prep sheet from the source, and
     rewrite every cue and caption (materials.md, "Rebuilding a deck in another kind").
   - Rename the page in `deck/` and its `<title>` (it must stay the only `.html` there). In `openPresenter` in
     `deck/engine.js`, give the presenter window its own name and title (the kits use `<kind>-kit-presenter`), or Chrome
     reuses another deck's.
   - Search the copy for the kit's example names and change every one: `<kind>-kit`, `checkout`, `alertbot`, `v2.14`,
     `v2.13`, `example`.
3. **Turn the source into the kind's material, then build the slides.**
   1. Fill the kit's prep sheet from the source: every message, command, box or number that will be on screen, with its
      source. materials.md gives each kind's sheet, its limits and what never goes on screen in that kind.
   2. Build `deck/scenes.js` from the sheet with the kind's helpers, and the CSS in the page; see authoring.md and the kit's
      README. One idea per beat, 2.5 to 5.5 s of animation; its pause covers the words.
   3. Write each caption in the kind's grammar (Cards: one sentence, key phrase bold; Console: `what ran → result`; Board: a
      margin note of 4 to 10 words; Dashboard: `panel or time: value · meaning`).
4. **Write the words.**
   1. On a rebuild, run `node tools/sync-script.mjs` first, so script.js holds every SCRIPT.md edit before anything else
      touches it.
   2. `node tools/new-script.mjs --title "…" --audience "…"` writes `deck/script.js` for the beats scenes.js has, keeping the
      words of beats that still exist (by beat id, else by position when a slide's beat count is unchanged). Run it again
      whenever beats are added or removed.
   3. `node tools/render-gifs.mjs --timing`, then `node tools/build-script.mjs --force` once: that writes SCRIPT.md. (After
      step 1, `--force` loses nothing.)
   4. Write the cues, words (in the kind's voice, materials.md), Q&A, checklist, "If you are running long" and "Where the
      facts come from" in SCRIPT.md, then `node tools/sync-script.mjs`. In "If you are running long", write a slide's start
      as `{start:<scene id>}`; the build fills in the time and keeps it right when timings move. The budget is `BUDGET` in
      `tools/build-script.mjs` (600 s).
   5. "Keeping the words" still means re-checking every number against the source: change a line when the source changed.
   6. A change to a beat's duration in scenes.js changes the pauses: run `sync-script` again so SCRIPT.md's times follow.
      Scroll offsets and markup changes need no sync, only new snapshots and a re-render of that slide.
5. **Check the words and the layout before rendering.**
   - Review every caption and spoken line against the source with the list in the next section.
   - `node <skill>/scripts/captions.mjs list deck/scenes.js`: every caption with its length, to check against the kind's
     grammar and limit. On a rebuild, `node <skill>/scripts/captions.mjs compare <old deck>/deck/scenes.js deck/scenes.js`
     must report 0 identical. Then the kind's grep in materials.md ("Checks before rendering"): a Dashboard has no `msg(`.
   - `node <skill>/scripts/measure.mjs <deck.html> <ids>`: thread scroll extents and anything that overflows its box.
   - `node tools/render-gifs.mjs --snap <scratch dir>`, then look at every PNG. Board: also `--times "<id>:1.0"` for
     mid-flight frames.
6. **Render.** Check free memory first (Windows: `[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB, 1)`
   in PowerShell; Linux: `free -g`; macOS: Activity Monitor). `node tools/render-gifs.mjs` uses 4 Chrome workers, each
   rendering one GIF at a time (a few minutes a GIF); under about 4 GB free add `--workers 2`, under 2 GB `--workers 1`.
   `--scenes <id>,<id>` renders only those. `--timing`, `--snap`, measure, sweep and check-widget each start one Chrome:
   under 2 GB, run them one at a time and not during a render.
7. **A widget for a blog or docs page** starts from `<kit>/widget-<kind>.html` (same look, reader-paced, self-contained).
   `node <skill>/scripts/check-widget.mjs <widget.html> --widths 740,980,390 --shots <dir>` prints the iframe height per
   width and fails on horizontal overflow; look at the shots.
8. **Verify, then report.**
   - `node <skill>/scripts/check-gifs.mjs <folder>`: every GIF's pauses match, and each plays once.
   - `node <skill>/scripts/sweep-presenter.mjs <deck.html> <folder>/SCRIPT.md`: every beat matches on words, cue, number
     and target time, with no page errors.
   - Leave no Chrome running. Kill only a Chrome whose command line has one of the tools' own profiles (`deck-chrome-`,
     `sweep-`, `deck-measure-`, `widget-check-`), never the user's.
   - Report the kind and why, the runtime against 10:00, the beat count, the check results, what is masked, what changed in
     the source while you worked, and anything the user has to do (a heads-up to colleagues, uploading GIFs).

## What goes on screen and into the script

Each of these is easy to get wrong in a long build, and only a final review catches it. The deck shows the source as it happened:
- **Credit:** each finding goes to whoever posted it first. Check the timestamps before you credit a bot with a lead a human gave it.
- **Wrong answers:** a bot's wrong or partly wrong answers appear as such, with its own self-rating if it gave one.
- **Context:** each message is described as what it is in its full context. A person describing their own method is not "testing the bot".
- **Quotes:** as posted, with a visible ⋯ wherever something is cut. Each quote comes from one message.
- **Numbers:** the source's own, in their own category (lost vs rejected). When the source replaces a number, replace it everywhere.
- **Intervals:** every "N s after" or "N min from" names both ends and is the difference of two posted times; subtract them.
  It is easy to show one interval under another's label (post to DM as post to thread reply) and carry it through every
  version and the blog.
- **Material:** the kind's own (materials.md). A Dashboard shows no message bodies and at most one quote per message, a
  Console no output that never ran, a Board printout ≤ 6 lines, Cards no KPI tiles. Quote marks only around words the
  message really contains.
- **Script vs screen:** every spoken number matches the one on screen. Re-read each beat's line against its slide.
- **Times:** each message's posted time, all in one timezone, and the slide or README names it. Times written inside a message stay as written.
- **KPIs:** count only what the source shows. If people wrote SQL, there is no "0 SQL written".
- **Masking:** a customer's name, account, sub-account, campaign and file names are masked everywhere: slides, SCRIPT.md, Q&A, README, file names.
- **Status:** nothing that isn't deployed is shown as live, and an open ticket is not shown as fixed. When something goes live
  during the build, change every slide, Q&A answer, README line and widget that said "not deployed".
- **Heads-up:** a private channel or named colleagues get a checklist item and a line in your report.

## Putting the GIFs into Google Slides

- **GIFs go in by hand** (Insert > Image > Upload from computer). The Slides API's `createImage` needs a public URL, and a
  deck's GIFs should not be made public to get one.
- **Filling text boxes through the Slides API:** read the slide first and send the batch with `requiredRevisionId` from that
  read. `createShape` stores a 3,000,000-EMU base size plus a scale, so any later ABSOLUTE transform must carry that scale,
  or the box shrinks. Check the result visually (a page thumbnail, or a PDF export).
- **Edit in place:** fill the template's own boxes, add one only where it lacks one, and keep what others added.

## Common mistakes

| Symptom | Fix |
|---|---|
| The new deck looks like the last one | Step 0: another kind, from its kit, not a restyle of the last deck. |
| The rebuilt deck says the same things in a new look: the same captions, the same message bodies | Fill the new kind's prep sheet from the source, not from the old slides; rewrite every cue and caption; `captions.mjs compare` must report 0 identical. |
| A Dashboard tile holds a chat message body | One event row per message (`er()`), its findings as KPIs and `fact()` rows, at most one quote. |
| Console output that nobody ran | Copy it from the run's log or transcript; a block that only has results is marked summarised, and the README says so. |
| `ReferenceError: Cannot access 'er' before initialization` | A helper declared with `const` further down is used by an earlier slide's html. Declare helpers in the top block. |
| "chrome did not start in 60 s" | Low memory. Rerun with `--workers 2` or `1`. |
| The sync stops because beat counts differ | SCRIPT.md can't add beats: run `tools/new-script.mjs`, then `--timing` and `build-script --force`. |
| "SCRIPT.md not rebuilt" after writing SCRIPT.md by hand | Run `node tools/build-script.mjs --force` once after the sync; the next sync is a no-op. |
| "If you are running long" times are stale or NaN | Write `{start:<scene id>}`; a wrong id now fails the build with its name. |
| A thread scrolls past its end, or not far enough | Scroll constants were guessed. Measure: max offset = content − viewport. |
| The presenter view shows the other deck | Both decks use the same window name in engine.js. |
| `A.wipe` or `A.mark` does nothing | The element lacks the `.wipe` or `.mark` class. |
| A Dashboard sparkline is a solid block, or its noise fills the tile | `A.fade` on `.fill` ends at opacity 1: tween it to `0.12` instead. Pass `spark()` a `range` so small noise stays small. |
| Board: a region the camera flies past is blank or half drawn | Its animated variable needs a `.region:not(.live)` rule (finished state) in the page CSS. |
| Board: the GIF capture freezes while the camera shows the whole board | Under memory pressure, opacity groups and blurred shadows on every region stall the screenshot. Keep the kit's veil for future regions (not `opacity`) and no shadows outside `.live`; render one slide per run (`--scenes <id>`) so a stall costs one GIF. |
| Small dots at the ends of arrows that are not drawn yet | A zero-length dash with a round cap. The kits' `.draw` rule uses a gap of 2 × length; keep it. |
| Board: everything in a region appears at once, or text stops wrapping | A class name collides: `.in` is every box's inner wrapper, and global classes (`.tl`, `.ti`, `.call`) carry styles. Use distinct names. |
| `SyntaxError: Identifier '…' has already been declared` | scenes.js is one scope: two regions declared the same const (`ROWS`). Rename one. |
| The last beat still shows the previous caption | Board: pass `'<i class="blank"></i>'` as the caption. Cards: `' '`. |
| A patch to scenes.js loses its backslashes | A shell heredoc ate them. Write the patch with a file-writing tool, not an inline shell string. |
| check-gifs reports a GIF out of step | The words changed after rendering. Re-render the scenes the sync listed. |
| sweep-presenter: a target 1 s off at one or two beats, the rest matching | An older engine summed exact holds, while SCRIPT.md and the GIFs use holds rounded to 0.01 s. The kits' `targetAt()` in engine.js rounds them; copy those two lines into the older deck's engine. |
| Edits to script.js vanished | The next sync overwrote them. Edit SCRIPT.md instead. |
