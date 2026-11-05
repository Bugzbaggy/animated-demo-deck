# Console kit: the checkout slowdown

Spoken script for this deck, one block per animation beat. Audience: anyone trying the Console kit (a made-up example).

Total **1:32** at 135 words a minute (207 words), which leaves 8:28 of the 10:00 slot for slips.
The times below are the presenter view's target times; auto mode (press A) and the GIFs use the same pauses.
To change the words, edit them in this file and run `node tools/sync-script.mjs`. That copies them into the deck and recomputes these times; then reload the deck. It also prints how to re-render any GIF whose pauses changed.

**How to read this.** Each beat is one press of → in the live deck. In the GIFs, the beats play back to back, with each pause sized to its lines.
The *italic* line is what happens on screen; the quoted text is what you say.

## Run of show

| # | Slide | Starts | Length | GIF |
|---|---|---|---|---|
| 1 | What changed at 09:58 | 0:00 | 0:36 | `gifs/01-deploys.gif` |
| 2 | One key per session | 0:36 | 0:25 | `gifs/02-cache.gif` |
| 3 | Roll back, then measure | 1:01 | 0:31 | `gifs/03-rollback.gif` |

## 1. What changed at 09:58 (0:00 to 0:36)

GIF: `gifs/01-deploys.gif` · 3 beats · 80 words

**0:00 · beat 1.** *The prompt blinks, the history command types, two deploys print; v2.14 is highlighted.*

> Here is the terminal from that morning. First question: what changed? I list the last two deploys. Version two fourteen went out at nine fifty-eight and ten seconds.

**0:12 · beat 2.** *The latency query types; six rows stream; 2,400 ms is highlighted.*

> Then the latency, in two-minute steps. A hundred and ninety at nine fifty-eight, nineteen fifty at ten, twenty-four hundred at ten oh two.

**0:23 · beat 3.** *A # comment line appears and is highlighted.*

> The deploy at nine fifty-eight ten, the alert at ten oh two forty: two hundred and seventy seconds apart. That line is a comment I worked out, not output.


## 2. One key per session (0:36 to 1:01)

GIF: `gifs/02-cache.gif` · 3 beats · 57 words

**0:36 · beat 1.** *The cache stats command types; the table streams; the 12% row is highlighted.*

> So I look at the cart cache. Ninety-four percent hits until nine fifty-eight, twelve percent after it.

**0:43 · beat 2.** *The shell shrinks to the left; a diff pane opens on the right; the new key line is highlighted.*

> The pane splits, and the diff between the two versions shows why. The cache key used to be the cart. Now it is the cart plus the session.

**0:56 · beat 3.** *A note card appears under the diff.*

> One key per session means every visitor starts with an empty cache.


## 3. Roll back, then measure (1:01 to 1:32)

GIF: `gifs/03-rollback.gif` · 3 beats · 70 words

**1:01 · beat 1.** *The rollback command types; the spinner turns to a tick; the done line prints.*

> I roll back to two thirteen. Six pods, and it is done at ten oh seven and five seconds.

**1:09 · beat 2.** *The latency query types again; four rows stream; 180 ms is highlighted.*

> The same latency query, from ten oh six: twenty-three fifty, six forty, two ten, and a hundred and eighty at ten twelve.

**1:19 · beat 3.** *The closing # comment, three numbers beside the pane, then the prompt and its cursor.*

> Alert to recovery, by the bot's two posts: five hundred and fifty seconds. Two seventy from the deploy to the alert, and a twelve percent hit rate in between.


## If you are running long

- If slide 2 has not started by 0:36, say its diff beat in one sentence and skip the note.

## Q&A prep

**Is this output real?**
No. The whole run is a made-up example for the kit. In a real deck every line comes from a log or a recorded terminal, and a block that only has results is marked summarised.

**Why is 270 s a comment and not output?**
No command printed it: it is the difference of two times that were printed or posted (09:58:10 and 10:02:40). The Console material shows computed numbers as # comments.

## Before you present

- [ ] Run the deck once with A (auto-advance) and speak along.
- [ ] Pick one way to present: the HTML deck in Chrome, or the GIFs in Google Slides.
- [ ] Just before you start: reload the deck, press P for the presenter view, then F for fullscreen.

## Where the facts come from

- Made-up example: every command, output line and time (UTC) was written for this kit. A real deck names the log or transcript each block comes from, and says which blocks are summarised.
