# Cards kit: the checkout slowdown

Spoken script for this deck, one block per animation beat. Audience: anyone trying the Cards kit (a made-up example).

Total **1:49** at 135 words a minute (245 words), which leaves 8:11 of the 10:00 slot for slips.
The times below are the presenter view's target times; auto mode (press A) and the GIFs use the same pauses.
To change the words, edit them in this file and run `node tools/sync-script.mjs`. That copies them into the deck and recomputes these times; then reload the deck. It also prints how to re-render any GIF whose pauses changed.

**How to read this.** Each beat is one press of → in the live deck. In the GIFs, the beats play back to back, with each pause sized to its lines.
The *italic* line is what happens on screen; the quoted text is what you say.

## Run of show

| # | Slide | Starts | Length | GIF |
|---|---|---|---|---|
| 1 | The checkout slowdown | 0:00 | 0:32 | `gifs/01-intro.gif` |
| 2 | Eighty-five seconds to a lead | 0:32 | 0:44 | `gifs/02-thread.gif` |
| 3 | One key per session | 1:16 | 0:33 | `gifs/03-cause.gif` |

## 1. The checkout slowdown (0:00 to 0:32)

GIF: `gifs/01-intro.gif` · 3 beats · 73 words

**0:00 · beat 1.** *The title builds word by word on the dark slide.*

> This is a story about nine slow minutes at an online shop: one release, one alert, one chat thread, and the rollback that ended it.

**0:11 · beat 2.** *The alert's message card slides in; its latency is highlighted.*

> It started with an alert at two minutes past ten. Checkout latency at the ninety-fifth percentile: two thousand four hundred milliseconds, three times the threshold.

**0:22 · beat 3.** *Three chips pop in under the title.*

> Everything you will see is the thread as it was posted. The times are UTC, and every name on screen is an example.


## 2. Eighty-five seconds to a lead (0:32 to 1:16)

GIF: `gifs/02-thread.gif` · 3 beats · 98 words

**0:32 · beat 1.** *The thread window opens on the alert; "error rate rising" is highlighted; the first side card appears.*

> Here is that thread. The alert said the latency was high, and it added that the error rate was rising. Hold on to that second part.

**0:44 · beat 2.** *The on-call engineer's reply comes in; the hit-rate line is highlighted; the second card and the chips appear.*

> Eighty-five seconds later the on-call engineer answered. The cache hit rate had dropped from ninety-four to twelve percent at nine fifty-eight, right after version two fourteen went out. And the error rate was flat.

**0:59 · beat 3.** *The release lead's reply and the bot's all-clear come in; the third card appears.*

> A minute later the release lead named the cause: two fourteen had put the session id into the cart cache key. They rolled back, and at eleven minutes past ten the bot reported a hundred and eighty milliseconds.


## 3. One key per session (1:16 to 1:49)

GIF: `gifs/03-cause.gif` · 3 beats · 74 words

**1:16 · beat 1.** *The first card comes in; the path under the cards draws and the dot appears.*

> So what happened? The new key included the session, so no two visitors ever shared a cache entry. Every visitor had a cache of one.

**1:27 · beat 2.** *The dot moves to the second card, which comes in.*

> Rolling back to two thirteen put the shared key back, and the latency came back with it.

**1:35 · beat 3.** *The dot reaches the dashed third card; the outcome line writes itself and its chips pop in.*

> Nine minutes and ten seconds from alert to recovery. One thing is still to do: a named reviewer for any release that changes a cache key. That part is not built yet.


## If you are running long

- If slide 3 has not started by 1:16, say only the outcome line on its last beat.

## Q&A prep

**Why did the alert say the error rate was rising?**
Its rule adds a trend phrase to the latency check. The on-call engineer measured the error rate and found it flat at 0.2 %, so the deck shows those words as the alert’s wording, not as a finding.

**Why roll back instead of fixing the key?**
The rollback took effect in about five minutes (10:06:30 to 10:11:50); a fix would have needed a build and a review first.

## Before you present

- [ ] Run the deck once with A (auto-advance) and speak along.
- [ ] Pick one way to present: the HTML deck in Chrome, or the GIFs in Google Slides.
- [ ] Just before you start: reload the deck, press P for the presenter view, then F for fullscreen.

## Where the facts come from

- Made-up example: the thread, its posted times (UTC) and its numbers were written for this kit. A real deck names the thread, when it was read, and what is masked.
