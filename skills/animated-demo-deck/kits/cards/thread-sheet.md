# Thread sheet (Cards)

The material of a Cards deck: real messages as they were posted, and cards that each make one claim. Fill this sheet
before writing `deck/scenes.js`; the deck shows only what is in it. The rules are in the skill's `materials.md`.

- Read every reply first; never fill a row from memory or from an older deck.
- Posted times in one timezone, named in the header. Text as posted, with ⋯ for each cut. One row is one message, never two merged.
- A highlight is at most 12 words of that one message; at most 2 highlights per message.
- "In context" says what the message is in the whole thread ("a person describing their own method"), not what it looks like.
- Credit: the row that first says a thing is the one the slide credits, whoever posted it.

The rows below are the kit's made-up example story. Replace them.

## Thread slides

| # | Posted (UTC) | Who | Text as posted (⋯ for cuts) | Highlight (≤ 12 words) | In context | Slide |
|---|---|---|---|---|---|---|
| 1 | 2026-03-12 10:02:40 | alertbot | [HIGH] checkout-api p95 latency 2,400 ms (threshold 800 ms) · error rate rising | error rate rising | the alert that opened the thread; its latency is a measurement, its "error rate rising" is the rule's own wording | `intro`, `thread` |
| 2 | 10:04:05 | On-call engineer | Looking. Cache hit rate fell from 94% to 12% at 09:58, right after v2.14. Error rate is flat at 0.2%. | Cache hit rate fell from 94% to 12% at 09:58 | the first lead, and the first measurement of the error rate | `thread` |
| 3 | 10:05:20 | Release lead | v2.14 changed the cart cache key to include the session id. Rolling back to v2.13. | Rolling back to v2.13. | the cause, named by the person who shipped the change | `thread` |
| 4 | 10:11:50 | alertbot | [OK] checkout-api p95 latency back to 180 ms. | 180 ms | the all-clear | `thread` |

## Walkthrough slides

| Slide | Card | Claim (≤ 10 words) | Support (≤ 20 words) | Chips | Source |
|---|---|---|---|---|---|
| `cause` | 1 | The cache key gained a session id | v2.14 keyed the cart cache by cart and session, so no two visitors ever shared an entry. | `v2.14`, `hit rate 94% → 12%` | row 2, row 3 |
| `cause` | 2 | Rolling back restored the shared key | v2.13 went back out at 10:06. By 10:11 the p95 latency was 180 ms again. | `v2.13`, `p95 180 ms` | row 4; the rollback's start time from the deploy log |
| `cause` | 3 | Next: review cache-key changes | A release that changes a cache key gets a named reviewer before it ships. | `later`, `not deployed` | the follow-up agreed in the thread |

## Numbers on screen

| Number | Where it is stated (row or source) | Slide | Spoken in beat |
|---|---|---|---|
| 85 s | row 1 10:02:40 against row 2 10:04:05 | `thread` | `lead` |
| 9 min 10 s | row 1 10:02:40 against row 4 10:11:50 | `cause` | `guard` |
