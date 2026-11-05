# Materials: what each kind puts on screen, and how it is said

The four kinds differ in material, not only in look. A Cards deck walks through cards and replays conversations as they
were posted, a Console deck replays a run, a Board deck draws an explanation, a Dashboard deck reads measurements. The
same fact never appears in the same form in two kinds: a chat message is a message card in Cards, command output in
Console, a taped printout in Board, and an event row plus numbers in Dashboard.

Turn the source into the kind's material first, in the kit's prep sheet, then build scenes.js from the sheet. Building
from another deck's slides carries that deck's material over (a Dashboard full of chat bodies is a Cards deck in navy).

**Which facts go on screen, in every kind:** a fact goes on screen when a beat's spoken line uses it or it sets a state on
screen; the rest stays in the sheet. A claim goes into a claimed-against-measured comparison only when the source measured
that claim. The example alert's "threshold 800 ms" is the service's configured threshold, so it is neither shown as
refuted nor singled out.

## At a glance

| | Cards | Console | Board | Dashboard |
|---|---|---|---|---|
| The talk is | a walkthrough in cards, and conversations replayed as posted | a run, replayed | an explanation, drawn | a situation, measured |
| Unit of material | a card (one claim, one line of support, chips) or a message | a command and its output | a box, an arrow, a note | a number, an event, a state |
| A chat message becomes | the message as posted (⋯ for cuts) | output of the command that read or sent it, ≤ 6 lines | a taped printout, ≤ 6 lines, one line circled | one event-log row, its facts as KPIs, at most one quoted line |
| A number becomes | the phrase in the message that states it, highlighted | the output line that printed it | marker on a note, or a struck claim with the real value beside it ("3 → 0") | a KPI that counts up, with a unit and a source line |
| A cause or a verdict becomes | a side card, ≤ 25 words | a highlighted output line or a note card | an arrow labelled with the cause, a conclusion note | a tile that flips state (ok, warn, crit) |
| Verbatim text | message bodies, abridged with ⋯ | command lines and output lines | printout lines | one quote per message: one or two sentences, ≤ 160 characters |
| Caption | one plain sentence, its key phrase in bold; ≤ 90 characters | `<what ran> → <b>result</b>`; ≤ 90 | a margin note, 4 to 10 words; ≤ 60 | `<panel or time>: <b>value</b> · meaning`; ≤ 90 |
| Spoken voice | a narrator: plain sentences; on a thread, names, times and what each said | operator at the keyboard: "I run…, it returns…" | explainer at the board: "this box…, because…, so…" | reading the screen: the time, the value, the state |
| Prep sheet in the kit | `thread-sheet.md` | `run-sheet.md` | `board-sheet.md` | `facts-sheet.csv` |
| Never on screen | KPI tiles, terminal panes, a number with no source (a message, a footer, the product page) | chat mock-ups, prose paragraphs, output that never ran | log tails, KPI tiles, tables over 3 columns or 5 rows | message bodies, bullet lists, paragraphs, a number with no source row |

## The same fact in four materials

Source (the kits' made-up example, times in UTC): a bot posted "[HIGH] checkout-api p95 latency 2,400 ms (threshold
800 ms) · error rate rising" at 10:02:40. The on-call engineer replied in the thread at 10:04:05 (85 s after the post):
"Cache hit rate fell from 94% to 12% at 09:58, right after v2.14. Error rate is flat at 0.2%." The cache stats show 94 %
for 09:54 to 09:58 and 12 % for 09:58 to 10:02.

| Kind | On screen | Caption | Spoken |
|---|---|---|---|
| Cards | The alert's message card, then the reply card under it; "Cache hit rate fell from 94% to 12% at 09:58" highlighted; a side card "The first lead, 85 s after the alert: not the database, the cache"; chips `alert 10:02:40`, `reply 10:04:05` | <b>The on-call engineer replies at 10:04</b>, 85 seconds after the alert. | "Eighty-five seconds later the on-call engineer answered: the cache hit rate had dropped from ninety-four to twelve percent, right after the deploy." |
| Console | `→ chat history #checkout`, then `  [HIGH] checkout-api p95 latency 2,400 ms (threshold 800 ms) · error rate rising`; `$ cachectl stats cart --from 09:54 --to 10:02 --step 4m`, then its two rows, the 12 % one highlighted; `→ chat reply #checkout`, then `ok  posted 10:04:05` and the comment `# alert 10:02:40 → reply 10:04:05 = 85 s`. The chat lines are summarised: the source is messages, not a run log | cachectl stats cart → <b>hit rate 94% → 12% from 09:58</b> | "It reads the alert. I check the cart cache: ninety-four percent hits before nine fifty-eight, twelve after. The reply goes out eighty-five seconds after the alert." |
| Board | The alert taped on as a printout (2 lines); its "error rate rising" struck in red with "0.2 %, flat" beside it; an arrow labelled "85 s" to a note "the cache, not the database"; "hit rate 94 % → 12 %" in marker | the cache, not the database | "The alert says the error rate is rising: it is flat. Eighty-five seconds later a reply points here, at the cache, because its hit rate fell to twelve percent." |
| Dashboard | Event rows 10:02:40 HIGH "[HIGH] checkout-api p95 latency 2,400 ms" and 10:04:05 INFO "reply: the cache, not the database"; the hit-rate arc drains from 94 to 12 % and its tile flips to crit; a claimed-against-measured table (error rate: rising / 0.2 %, flat); the reply's one quote | `10:04:05: <b>the cache, not the database</b> · errors 0.2%, flat` | "Ten oh four oh five, eighty-five seconds after the alert: the hit rate is at twelve percent, and the error rate never moved from zero point two." |

## Cards: cards and conversations

**Prep sheet** `cards/thread-sheet.md`: for each thread slide, one row per message, in thread order: number, posted time
(one timezone, named), who, the text as posted (⋯ for each cut), the highlight (≤ 12 words of that message), what the
message is in its full context, the slide that shows it. Fill it after reading every reply. For each walkthrough slide,
one row per card: its claim (≤ 10 words), its one line of support (≤ 20 words), its chips, its source (the product page
and section).

**On screen**
- A walkthrough slide is a header and 2 to 4 cards or callouts; a card is one claim, one line of support and chips.
- A thread slide is one thread window (left) and one side card (right). The window shows 2 to 5 messages; a longer thread
  scrolls, with offsets measured, never guessed.
- Each message as posted, abridged with ⋯. At most 2 highlights per message, each ≤ 12 words.
- The side card says what the highlighted line means, in ≤ 25 words; chips carry status (`Measured`, a self-rating).
- A bot's footer keeps its own numbers (seconds taken, tokens) as posted.
- A number appears only where a message, a footer or the product page states it.

**Caption**: one plain sentence with its key phrase in bold, ≤ 90 characters: "Rolling back to v2.13 <b>brought the
latency back to 180 ms</b>." On a thread slide, name who and when: "<b>The on-call engineer replies at 10:04</b>, 85
seconds after the alert."

**Spoken voice**: a narrator in plain sentences. On a thread: past tense, names and times: "At four past ten the on-call
engineer answered… The release lead named the cause…". Quote at most one short phrase per beat; the screen carries the rest.

**Beats**: a card or a message comes in, its phrase is highlighted, the side card explains, then the next card, message or
chip. **Opening**: a dark title slide, then the message or the claim that started it all. **Closing**: the outcome and three chips.

## Console: the run

**Prep sheet** `console/run-sheet.md`: one block per beat: the command as typed (`$ …`, ≤ 80 characters), its output lines
as printed (≤ 12 per block, a `…` line for each cut), how long it took, the line to highlight, and where the lines come
from (a log file, a transcript, a re-run on a stated date). Mask what the review list masks (a customer's name, account,
sub-account, campaign and file names); hosts and job names stay unless the deck leaves the company.

**On screen**
- One to three panes; a pane shows ≤ 20 lines and tails the older ones.
- Every number sits in an output line the record printed, or, when you computed it, in a `#` comment line; a `kpi()`
  beside a pane may repeat one, never add one. The closing slide may show three numbers to remember, each already shown.
- A chat message is the output of the call that read or sent it: the history call, then up to 6 lines of the post as
  posted (its title and the lines that carry its claims, ⋯ for cuts); a DM or a reply: the send call, its `ok` line, then up
  to 6 lines of its text. An `ok … ts=…` line appears only when the record has one.
- At most one note card per slide, ≤ 20 words.
- Output never invented: when only the result is known, show it as a result summary under the call (`→ cachectl stats cart`
  then `  hit rate 12%`) and say "summarised" in the README's sources.
- **When the source is messages, not a run record** (no log, no transcript; a headless `claude -p --output-format json` run
  keeps only its final result): every block is summarised, the calls are the ones the messages name, in the order they
  happened, and an interval you computed is a comment line, not output: `# alert 10:02:40 → reply 10:04:05 = 85 s`. The
  README's sources say "reconstructed from the messages".

**Caption** (the status line): `<what ran> → <b>result</b>`, ≤ 90 characters: "deployctl history checkout-api →
<b>v2.14 rolled out at 09:58:10</b>".

**Spoken voice**: present tense, replaying the run: "Here is the session that found it. It lists the deploys… here is the
cache: twelve percent." Say "I run" only for a command a person typed; a scheduled or headless run is "it", and a finding
is still credited to whoever posted it first.

**Beats**: the command types, the output streams, one line is highlighted, a spinner turns to ✓ or a pane splits.
**Opening**: an empty prompt, a blinking cursor, the first command. **Closing**: the run's own summary line (`exit 0`, or
the result line it printed), a `#` comment with the talk's numbers when they were computed, then the prompt and the cursor.

## Board: the explanation

**Prep sheet** `board/board-sheet.md`: one region per slide: its claim in ≤ 8 words (the handwritten title); boxes (≤ 6,
labels ≤ 4 words); arrows (from, to, label ≤ 3 words); notes (≤ 3, ≤ 12 words each: the reasoning); at most one printout
(≤ 6 lines, with a pencil footnote naming who and when); which line gets circled, underlined or struck.

**On screen**
- Handwriting for every word except printouts and code.
- ≤ 60 handwritten words per region, printouts aside.
- Evidence is a printout taped beside the box it proves, with an arrow to the line that matters.
- A number is written in marker on a note, or beside the struck claim it corrects ("3 → 0").
- Status is drawn: a tick or a cross; something not deployed is a dashed box labelled "later".

**Caption**: a margin note of 4 to 10 words, ≤ 60 characters: "the session id makes every key unique".

**Spoken voice**: an explainer pointing: "This box is the cache. When the key changes, this arrow fires… and here is the
proof." Use "because" and "so".

**Beats**: the camera hops in while the title writes, boxes and arrows are sketched, the evidence is taped on, the
conclusion note is stuck and its line circled. **Opening**: the whole board, then the first region. **Closing**: the camera
pulls back to the whole board; the finished drawing is the summary, with one closing card.

## Dashboard: the measurements

**Prep sheet** `dashboard/facts-sheet.csv`, one row per fact: `slide,beat,type,label,value,unit,time,state,source,verbatim`.
`type` is `kpi` (a number), `event` (something at a time), `state` (ok, warn, crit, info), `quote` (a verbatim line) or
`fact` (a label and a value too long for a KPI). Every row has a source; one `quote` row per message at most.

**On screen**
- A top bar with the screen's name and a clock at the slide's time; a rail with a needle when the slide spans time.
- A message is one event row `er()`: time HH:MM:SS, who, a level pill, one line ≤ 100 characters (it may be the post's own
  title), a subline ≤ 130. Its claims and findings become KPIs, `fact()` rows and `vs()` rows (claimed against measured).
- At most one verbatim passage per message, shown as `<span class="quote">`: one or two sentences, ≤ 160 characters, ⋯ where
  a sentence is cut. The slide's header may repeat it. Quote marks go only around words the message really contains.
- KPI values ≤ 6 characters (85, 12, 2,400, 10:02); a longer value (a version and its time) goes in a fact row.
- Text-only tiles: at most 3 per screen, ≤ 3 lines each. No bullet lists, no paragraphs.
- Every tile's state means something, and a verdict is a state flip, not a sentence.
- Every number on screen is spoken in that beat or explains a state on screen.
- An event the source gives no time (a tool call inside a run) gets no time and no needle position: show it after the
  timed event it belongs to, or in a tile. Never stamp a time the source does not show.

**Caption**: `<panel or time>: <b>value</b> · meaning`, ≤ 90 characters: "10:02:40: <b>p95 2,400 ms</b> · hit rate 12% ·
the alert fires".

**Spoken voice**: reading the screen, time then value then state: "Ten oh two forty: latency at twenty-four hundred
milliseconds. Eighty-five seconds later, the reply."

**Beats**: the clock and the needle move to the event's time, the event pings and its row appears, a KPI counts or a gauge
fills, a tile flips state (the verdict). **Opening**: the screen comes up with its clock and a "latest" tile. **Closing**: a
row of 3 or 4 numbers already shown, and status chips.

## Rebuilding a deck in another kind

1. Fill the new kind's prep sheet from the source, not from the old slides.
2. Keep the scene ids and beat ids, so the words carry over. Within a slide a beat may change places when the new kind
   needs another order (the run's order in Console, the needle's order in Dashboard): move its `tl.beat` block in
   scenes.js and run `node tools/new-script.mjs`, which keeps words by beat id, so they move with it. Re-read each moved
   line: one that said "then" may now come first.
3. Rewrite every cue: cues describe the screen.
4. Rewrite every caption in the new grammar, then check that none survived:
   `node <skill>/scripts/captions.mjs compare <old deck>/deck/scenes.js deck/scenes.js` must report 0 identical.
5. Keep the speaker's own words and every fact. Change only the words that point at the old kind's objects ("this sticky
   note", "the printout", "the terminal", "this tile"): find them with
   `grep -niE "printout|sticky|note|camera|board|terminal|pane|prompt|tile|screen|card" SCRIPT.md`. Offer a pass in the new
   kind's voice in the report; don't rewrite the speaker's words unasked. A word that is wrong on the facts is the
   exception: fix it, and list the changed lines in the report.
6. Re-check the Q&A and the checklist for references to the old screen.

## Checks before rendering

| Kind | Check | Expect |
|---|---|---|
| all | `node <skill>/scripts/captions.mjs list deck/scenes.js`: every caption against the grammar and its limit | each caption fits its kind's row above |
| Dashboard | `grep -c "msg(" deck/scenes.js` | 0: no message bodies |
| Console | `grep -c "msg(" deck/scenes.js` | 0: messages are command output |
| Board | `grep -cE "kpi\(|logTile\(" deck/scenes.js` | 0 |
| Cards | `grep -cE "kpi\(|cmd\(" deck/scenes.js` | 0 |
