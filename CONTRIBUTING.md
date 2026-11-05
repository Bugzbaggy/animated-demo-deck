# Contributing to animated-demo-deck

A Claude Code skill and four deck kits (cards, console, board, dashboard) that turn a source (a chat thread, a run, an
incident) into an animated deck, play-once GIFs, a spoken script and a blog widget.

Contributions are welcome. This project is maintained in spare time, so please open an issue before starting anything
large.

## Ground rules

1. **No real data in commits.** Example slides, prep sheets, scripts and widgets use made-up people, services, hosts and
   numbers. See [SECURITY.md](SECURITY.md).
2. **One logical change per pull request.** Small PRs get reviewed; large ones stall.
3. **Explain the failure mode.** For a bug fix, say what broke and how to reproduce it: the kit, the beat, the command.
4. **Keep the kinds apart.** A change to one kind's material, caption grammar or voice goes into `materials.md` and that
   kit's README together, and must not make two kinds show the same fact the same way.
5. **Shared files stay shared.** The tools in `kits/*/tools/` are identical in every kit, and `deck/engine.js` differs
   only in the presenter window's name. Change all four together; `ci/check-kits.sh` fails otherwise.

## Getting started

```bash
git clone https://github.com/Bugzbaggy/animated-demo-deck.git
cd animated-demo-deck
bash ci/check-kits.sh            # every check but the GIFs
bash ci/check-kits.sh --gifs     # and renders and checks every GIF (needs ffmpeg; a few minutes)
```

Changed a kit's scenes? Run, in that kit: `node tools/new-script.mjs`, `node tools/render-gifs.mjs --timing` and
`node tools/build-script.mjs --force`, then write the words in `SCRIPT.md` and `node tools/sync-script.mjs`. Commit the
regenerated `deck/script.js`, `tools/timing.json` and `SCRIPT.md` with the change that caused them.

## Pull request checklist

- [ ] CI is green (lint, the four kit jobs, leak scan)
- [ ] No real names, hosts, ids or customer data introduced
- [ ] Snapshots looked at (`node tools/render-gifs.mjs --snap <dir>`) for any slide you changed
- [ ] Docs updated if behaviour changed (`SKILL.md`, `materials.md`, `authoring.md`, the kit README)

## Reporting bugs

Open an issue with the kit, the platform, the Node and Chrome versions, what you expected, what happened, and the
smallest reproduction you can manage (a scenes.js with one slide is usually enough).
