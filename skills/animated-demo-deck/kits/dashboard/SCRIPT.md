# Dashboard kit: the checkout slowdown

Spoken script for this deck, one block per animation beat. Audience: anyone trying the Dashboard kit (a made-up example).

Total **1:35** at 135 words a minute (214 words), which leaves 8:25 of the 10:00 slot for slips.
The times below are the presenter view's target times; auto mode (press A) and the GIFs use the same pauses.
To change the words, edit them in this file and run `node tools/sync-script.mjs`. That copies them into the deck and recomputes these times; then reload the deck. It also prints how to re-render any GIF whose pauses changed.

**How to read this.** Each beat is one press of → in the live deck. In the GIFs, the beats play back to back, with each pause sized to its lines.
The *italic* line is what happens on screen; the quoted text is what you say.

## Run of show

| # | Slide | Starts | Length | GIF |
|---|---|---|---|---|
| 1 | One service, one screen | 0:00 | 0:29 | `gifs/01-screen.gif` |
| 2 | The needle reaches the alert | 0:29 | 0:33 | `gifs/02-incident.gif` |
| 3 | Rollback, then the close | 1:02 | 0:33 | `gifs/03-recovery.gif` |

## 1. One service, one screen (0:00 to 0:29)

GIF: `gifs/01-screen.gif` · 3 beats · 66 words

**0:00 · beat 1.** *The screen comes up: top bar, three green tiles, the rail with four event markers.*

> This is the checkout service's screen, at ten to ten in the morning. Every tile is green, and the rail along the bottom covers the next twenty-five minutes.

**0:12 · beat 2.** *The latency counts to 180, the hit-rate arc fills to 94%, both sparklines draw.*

> Latency at the ninety-fifth percentile: a hundred and eighty milliseconds. Cache hit rate: ninety-four percent. Errors: zero point two percent.

**0:21 · beat 3.** *The Latest tile comes in with two fact rows.*

> The latest tile: version two thirteen has been live since the tenth, and there are no open alerts.


## 2. The needle reaches the alert (0:29 to 1:02)

GIF: `gifs/02-incident.gif` · 3 beats · 74 words

**0:29 · beat 1.** *The needle runs to 09:58:10 and the deploy marker pings; the event log opens with its first row.*

> Nine fifty-eight and ten seconds: version two fourteen rolls out. Nothing on the screen moves yet.

**0:36 · beat 2.** *The hit-rate arc drains to 12% and flips red; the alert marker pings; latency counts up to 2,400 and flips red; the alert row lands.*

> Ten oh two forty: latency at twenty-four hundred milliseconds, the cache hit rate down to twelve percent, and the alert fires. It also claims the error rate is rising.

**0:49 · beat 3.** *The on-call row lands, then the reply's one quote, then claimed against measured, row by row.*

> Ten oh four oh five, eighty-five seconds after the alert: the on-call engineer points at the cache. Claimed against measured: the error rate never moved from zero point two.


## 3. Rollback, then the close (1:02 to 1:35)

GIF: `gifs/03-recovery.gif` · 3 beats · 74 words

**1:02 · beat 1.** *The needle reaches the rollback marker; the rollback tile fills its gauge and turns green.*

> Ten oh six thirty: the rollback to two thirteen starts. All six pods are on the old version by ten oh seven oh five.

**1:13 · beat 2.** *Latency counts down to 180, the arc refills to 93%, the all-clear marker pings, both tiles flip green.*

> Ten eleven fifty: latency back to a hundred and eighty, the hit rate back to ninety-three, and both tiles flip back to green.

**1:23 · beat 3.** *The closing tile counts its three intervals; the error rate pops in.*

> Three numbers to keep: two hundred and seventy seconds from the deploy to the alert, eighty-five to the first lead, and five hundred and fifty to recovery.


## If you are running long

- If slide 3 has not started by 1:02, say only the close beat on it.

## Q&A prep

**Why does the reply get only one quote?**
Dashboard shows a message as one event row and its facts; a message gets at most one verbatim passage, here the hit-rate sentence.

**Where does the 93% come from?**
The cache stats for the 10:10 to 10:14 window, in this made-up example. Every number on a Dashboard slide has a source row in facts-sheet.csv.

## Before you present

- [ ] Run the deck once with A (auto-advance) and speak along.
- [ ] Pick one way to present: the HTML deck in Chrome, or the GIFs in Google Slides.
- [ ] Just before you start: reload the deck, press P for the presenter view, then F for fullscreen.

## Where the facts come from

- Made-up example: every tile value, event time (UTC) and quote was written for this kit; facts-sheet.csv lists each one with its source in the story.
