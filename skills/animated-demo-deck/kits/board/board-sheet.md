# Board sheet (Board)

The material of a Board deck: a drawing that explains, with the evidence taped beside the part it proves. Fill one
section per region, in the order the camera visits them, before writing `deck/scenes.js`; every word on the board is
written here first. The rules are in the skill's `materials.md`.

- A region makes one claim, written as its title in at most 8 words.
- At most 6 boxes (labels ≤ 4 words), 3 notes (≤ 12 words each), 1 printout (≤ 6 lines) per region.
- At most 60 handwritten words per region outside the printout. Count them in the last line of each section; over 60, split the region.
- An arrow says why, in at most 3 words. A number goes in marker on a note, or beside the claim it corrects ("3 → 0").
- Something not deployed is a dashed box labelled "later"; nothing not deployed gets a solid box.

The regions below are the kit's made-up example story. Replace them.

## Region `what` · cell (0, 0) · claim: "A deploy, then a slow checkout"

| Element | Text | Where (region px) | Animation |
|---|---|---|---|
| title | A deploy, then a slow checkout | 80, 54 | `A.wipe` while the camera flies in |
| boxes 1 to 4 | v2.14 out · 09:58 / cache misses · almost every one / database reads · every request / p95 2,400 ms · 10:02 | 100 to 1360, 320 | `A.show`, staggered |
| arrows | box 1 → 2 "new key", 2 → 3 "each one", 3 → 4 "slow" (red) | between the boxes | `A.draw`, then the labels fade in |
| printout | [HIGH] checkout-api p95 latency 2,400 ms (threshold 800 ms) · error rate rising ⋯ | 110, 590, 760 × 170 | `A.show` · pencil footnote "alertbot · 10:02:40 UTC" |
| strike + marker | strike "error rate rising"; write "0.2 %, flat" in red beside it | on the printout | `A.strike`, then `A.type` |
| note (green) | Measured: errors never rose, 0.2 % all morning. | 1030, 610 | `A.pop`, then a green arrow to it |

Handwritten words outside the printout: 35.

## Region `why` · cell (1, 0) · claim: "One key per session"

| Element | Text | Where (region px) | Animation |
|---|---|---|---|
| title | One key per session | 80, 54 | `A.wipe` while the camera hops in |
| box (blue) | before · v2.13 / `cart:{cartId}` / one entry, shared by every visitor | 120, 300 | `A.show` |
| box (red) | after · v2.14 / `cart:{cartId}:{sessionId}` / one entry per visitor | 1080, 300 | `A.show` |
| underline, arrow, loop | under the old key; old → new labelled "v2.14"; a red loop round `:{sessionId}` | in and between the boxes | `A.draw` |
| note (pink) | Hit rate: 94 % (struck) → 12 % | 160, 660 | `A.pop`, then `A.strike` |
| note (yellow) | Every visitor starts empty, so every request hits the database. | 1100, 660 | `A.pop` |

Handwritten words outside the printout: 33.

## Region `fix` · cell (2, 0) · claim: "Roll back, then guard"

| Element | Text | Where (region px) | Animation |
|---|---|---|---|
| title | Roll back, then guard | 80, 54 | `A.wipe` while the camera hops in |
| boxes (green) ✓ | rollback · v2.13 · 10:06 / p95 180 ms · 10:11 | 120 and 660, 330 | `A.show`, then the ticks pop |
| box (dashed) | later · review every cache-key change | 1200, 330 | `A.show`, with a pencil arrow "next" |
| note (green) | Alert to recovery: 9 min 10 s | 140, 620 | `A.pop` |
| camera | pull back to the whole board | | `fly` to `overview` |

Handwritten words outside the printout: 24.
