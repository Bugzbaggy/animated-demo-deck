# Run sheet (Console)

The material of a Console deck: the commands that ran and what they printed, in the order it happened. Fill this sheet
before writing `deck/scenes.js`; every `cmd`, `out`, `ok`, `warn`, `err` and `call` line in the deck comes from a block here.
The rules are in the skill's `materials.md`.

- Copy commands and output from the run's own record: its log, a headless run's stream-json, a terminal you recorded.
  Never type output from memory, and never "tidy" a number. Commands use the tool's real syntax.
- When only the result is known (a tool call whose raw output was not kept), write one result line under the call and mark
  the block `summarised`; the README's sources then say so.
- When the source is messages, not a run record (no log, no transcript; `claude -p --output-format json` keeps only the
  final result): every block is `summarised`, the calls are the ones the messages name, in the order they happened, and
  an interval you computed is a comment line (`# alert 10:02:40 → reply 10:04:05 = 85 s`), never output. The README's
  sources say "reconstructed from the messages".
- At most 12 output lines per block; cut with a `…` line. A pane shows at most 20 lines, so a long block tails.
- A chat message is the output of the call that read or sent it: the history call, then up to 6 lines of the post as
  posted (its title and the lines with its claims, ⋯ for cuts); a DM or a reply: the send call, its `ok` line, then up to
  6 lines of the text. A `ts=` value appears only when the record shows one.
- Mask what the skill's review list masks (a customer's name, account, sub-account, campaign and file names). Hosts and
  job names stay unless the deck leaves the company.

The blocks below are the kit's made-up example story. Every `source:` line says "example"; in a real sheet it names the
log or transcript and the time. Replace them.

## `deploys` · beat `history`

```
source: example (a real sheet: the log or transcript, and its time)
$ deployctl history checkout-api --last 2
VERSION  ROLLED OUT (UTC)      BY            STATUS
v2.14    2026-03-12 09:58:10   release-lead  live
v2.13    2026-03-10 16:20:42   release-lead  replaced
highlight: v2.14    2026-03-12 09:58:10   release-lead  live
```

## `deploys` · beats `latency`, `gap`

```
source: example
$ metrics query 'p95(checkout_latency_ms)' --from 09:50 --to 10:04 --step 2m
09:50    180 ms
…
10:02  2,400 ms
10:04  2,380 ms
# deploy 09:58:10 → alert 10:02:40 = 270 s
highlight: 10:02  2,400 ms
```

## `cache` · beats `stats`, `diff`

```
source: example
$ cachectl stats cart --from 09:50 --to 10:04 --step 4m
WINDOW         HITS     MISSES   HIT RATE
09:54-09:58    18,077    1,201   94%
09:58-10:02     2,310   16,944   12%
$ git diff v2.13 v2.14 -- src/cart/cache.ts
- return `cart:${cart.id}`;
+ return `cart:${cart.id}:${session.id}`;
highlight: 09:58-10:02     2,310   16,944   12%
```

## `rollback` · beats `rollback`, `recover`, `close`

```
source: example
$ deployctl rollback checkout-api --to v2.13
done 10:06:30 → 10:07:05 · 6/6 pods on v2.13
$ metrics query 'p95(checkout_latency_ms)' --from 10:06 --to 10:12 --step 2m
10:06  2,350 ms
…
10:12    180 ms
# alert 10:02:40 → OK post 10:11:50 = 550 s
highlight: 10:12    180 ms
```

## Numbers on screen

Every "N s after" names both ends and is the difference of two printed or posted times: 10:02:40 − 09:58:10 = 270 s (deploy
to alert); 10:11:50 − 10:02:40 = 550 s (alert to the all-clear post).

| Number | Line that shows it | Slide | Spoken in beat |
|---|---|---|---|
| 2,400 ms | `10:02  2,400 ms` | `deploys` | `latency` |
| 270 s | `# deploy 09:58:10 → alert 10:02:40 = 270 s` | `deploys` | `gap` |
| 12% | `09:58-10:02     2,310   16,944   12%` | `cache` | `stats` |
| 550 s | `# alert 10:02:40 → OK post 10:11:50 = 550 s` | `rollback` | `close` |
