# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Use GitHub's
[private vulnerability reporting](https://github.com/Bugzbaggy/animated-demo-deck/security/advisories/new)
instead.

## What the tools touch

- The kit tools read and write only inside the copied deck folder: `deck/script.js`, `tools/timing.json`, `SCRIPT.md`,
  `gifs/` and, with `fetch-fonts.mjs`, `deck/fonts.css`.
- `render-gifs.mjs`, `measure.mjs`, `sweep-presenter.mjs` and `check-widget.mjs` start a headless Chrome with a fresh
  temporary profile (`deck-chrome-*`, `deck-measure-*`, `sweep-*`, `widget-check-*`), load the local page over `file://`,
  and remove the profile when they finish.
- `fetch-fonts.mjs` is the only tool that uses the network: it downloads font files from Google Fonts.
- The decks and widgets load nothing from the network; the widgets use system fonts only.

## A deck is a disclosure

A deck built from a real thread or run can carry what the source carries: names, hosts, account ids, numbers. The skill's
review list (`SKILL.md`, "What goes on screen") masks a customer's names everywhere and asks for a heads-up when a private
channel or named colleagues appear. Check the GIFs, `SCRIPT.md` and any widget before they leave your organisation, and
keep a deck's GIFs out of public storage.

## Scope note for contributors

Everything in the kits' examples is made up: the shop, `checkout-api`, `alertbot`, the people's roles, the times and the
numbers. Keep them that way, and never paste real messages, hosts or ids into issues, pull requests or examples.
