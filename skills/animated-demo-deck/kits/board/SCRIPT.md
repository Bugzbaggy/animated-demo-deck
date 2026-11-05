# Board kit: the checkout slowdown

Spoken script for this deck, one block per animation beat. Audience: anyone trying the Board kit (a made-up example).

Total **1:28** at 135 words a minute (198 words), which leaves 8:32 of the 10:00 slot for slips.
The times below are the presenter view's target times; auto mode (press A) and the GIFs use the same pauses.
To change the words, edit them in this file and run `node tools/sync-script.mjs`. That copies them into the deck and recomputes these times; then reload the deck. It also prints how to re-render any GIF whose pauses changed.

**How to read this.** Each beat is one press of → in the live deck. In the GIFs, the beats play back to back, with each pause sized to its lines.
The *italic* line is what happens on screen; the quoted text is what you say.

## Run of show

| # | Slide | Starts | Length | GIF |
|---|---|---|---|---|
| 1 | A deploy, then a slow checkout | 0:00 | 0:34 | `gifs/01-what.gif` |
| 2 | One key per session | 0:34 | 0:25 | `gifs/02-why.gif` |
| 3 | Roll back, then guard | 1:00 | 0:28 | `gifs/03-fix.gif` |

## 1. A deploy, then a slow checkout (0:00 to 0:34)

GIF: `gifs/01-what.gif` · 3 beats · 77 words

**0:00 · beat 1.** *The camera flies from the whole board into the first region; the title writes itself.*

> This is the whole story on one board. Let's start on the left, with what the alert saw.

**0:08 · beat 2.** *Four boxes are sketched in a row; arrows and their labels draw between them.*

> Version two fourteen goes out at nine fifty-eight. Its new cache key means misses, misses mean every request reads the database, and so checkout slows to twenty-four hundred milliseconds.

**0:21 · beat 3.** *The alert is taped on; "error rate rising" is struck out and "0.2 %, flat" is written beside it; a green note sticks on.*

> Here is the alert, taped on. It says the error rate is rising. It was not: the errors stayed at zero point two percent, so I cross that part out.


## 2. One key per session (0:34 to 1:00)

GIF: `gifs/02-why.gif` · 3 beats · 57 words

**0:34 · beat 1.** *The camera hops to the second region; the before and after boxes are sketched.*

> Why did the cache miss? Because of the key. On the left, before: one entry per cart. On the right, after.

**0:44 · beat 2.** *The old key is underlined, an arrow draws across, and the session id is circled in red.*

> This piece here, the session id, makes every key unique, so no two visitors ever share an entry.

**0:52 · beat 3.** *Two notes stick on; 94 % is struck and 12 % stands beside it.*

> So the hit rate falls from ninety-four percent to twelve, and every visitor starts with an empty cache.


## 3. Roll back, then guard (1:00 to 1:28)

GIF: `gifs/03-fix.gif` · 3 beats · 64 words

**1:00 · beat 1.** *The camera hops to the last region; two green boxes, an arrow and two ticks.*

> What ended it: a rollback to two thirteen at ten oh six, and by ten eleven the latency is back to a hundred and eighty.

**1:11 · beat 2.** *A dashed "later" box, a pencil arrow, and the alert-to-recovery note.*

> And what comes next is drawn dashed, because it isn't built yet: a review for any change to a cache key.

**1:20 · beat 3.** *The camera pulls back to the whole board.*

> Step back and the board is the summary: nine minutes and ten seconds from the alert to recovery.


## If you are running long

- If slide 3 has not started by 1:00, say the "later" beat in one sentence.

## Q&A prep

**Why is the alert taped on and not redrawn?**
It is evidence: Board shows a source as a printout, as posted, and writes the correction beside it ("0.2 %, flat") instead of editing it.

**Why is the last box dashed?**
The review step is not built. Board draws anything not deployed as a dashed box labelled "later", never as a solid one.

## Before you present

- [ ] Run the deck once with A (auto-advance) and speak along.
- [ ] Pick one way to present: the HTML deck in Chrome, or the GIFs in Google Slides.
- [ ] Just before you start: reload the deck, press P for the presenter view, then F for fullscreen.

## Where the facts come from

- Made-up example: the alert, its time (UTC) and every number on the board were written for this kit. A real deck names the source of each printout and who posted it, and when.
