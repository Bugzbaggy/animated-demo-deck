// Builds SCRIPT.md from deck/script.js (the words) and tools/timing.json (beat timings written by
// render-gifs.mjs), so the script's clock matches the deck and the GIFs. tools/sync-script.mjs runs
// this after copying your SCRIPT.md edits into deck/script.js, and that is the command to use.
// Run on its own, this stops rather than overwrite SCRIPT.md edits that deck/script.js doesn't have
// yet (--force overwrites them).
// Usage: node tools/build-script.mjs [--force]
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const out = path.join(root, 'SCRIPT.md');
const ctx = { window: {} };
vm.runInNewContext(await readFile(path.join(root, 'deck', 'script.js'), 'utf8'), ctx);
const S = ctx.window.SCRIPT;
const timing = JSON.parse(await readFile(path.join(here, 'timing.json'), 'utf8')).scenes;
const BUDGET = 600; // seconds: a 10-minute slot

const fmt = s => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
const plain = h => h.replace(/<[^>]+>/g, '');
const words = h => plain(h).split(/\s+/).filter(Boolean).length;

let clock = 0;
const rows = [], sections = [], startOf = {};
for (const t of timing) {
  const sc = S.scenes.find(s => s.id === t.id);
  if (!sc) throw new Error(`script.js has no scene ${t.id}`);
  if (sc.beats.length !== t.beats.length) throw new Error(`${t.id}: script has ${sc.beats.length} beats, deck has ${t.beats.length}`);
  const start = clock;
  startOf[t.id] = start;
  const len = t.beats.reduce((a, b) => a + b.dur + b.hold, 0);
  const gif = `gifs/${String(t.n).padStart(2, '0')}-${t.id}.gif`;
  rows.push(`| ${t.n} | ${sc.slide} | ${fmt(start)} | ${fmt(len)} | \`${gif}\` |`);
  const lines = [`## ${t.n}. ${sc.slide} (${fmt(start)} to ${fmt(start + len)})`, '', `GIF: \`${gif}\` · ${t.beats.length} beats · ${sc.beats.reduce((a, b) => a + words(b.say), 0)} words`, ''];
  t.beats.forEach((b, i) => {
    const { cue, say } = sc.beats[i];
    lines.push(`**${fmt(clock)} · beat ${i + 1}.**${cue ? ` *${plain(cue)}*` : ''}`, '', `> ${plain(say).replace(/\n/g, '\n> ')}`, '');
    clock += b.dur + b.hold;
  });
  sections.push(lines.join('\n'));
}

const spare = BUDGET - clock;
const total = S.scenes.reduce((a, s) => a + s.beats.reduce((b, x) => b + words(x.say), 0), 0);
// "{start:<scene id>}" in a running-long line becomes that slide's start time, so the line stays right when timings move.
const expand = s => s.replace(/\{start:([\w-]+)\}/g, (m, id) => {
  if (startOf[id] == null) throw new Error(`"If you are running long" names {start:${id}}, but the deck has no scene ${id}`);
  return fmt(startOf[id]);
});
const cuts = (S.cuts && S.cuts.length) ? S.cuts.map(expand) : [
  `The deck is ${fmt(clock)} against a ${fmt(BUDGET)} slot. Name here the slide that must start by a given time, and the beat to cut to one sentence if you are 30 seconds behind. The clock values come from the run of show above.`,
];
const sources = (S.sources && S.sources.length) ? S.sources : [
  'TODO: for each slide, where its facts come from (a document and its date, a thread and its timestamps). Say what is masked, and that nothing undeployed is shown as live.',
];

const md = `# ${S.title}

Spoken script for this deck, one block per animation beat. Audience: ${S.audience}.

Total **${fmt(clock)}** at 135 words a minute (${total} words), which ${spare >= 0 ? `leaves ${fmt(spare)} of the ${fmt(BUDGET)} slot for slips` : `runs ${fmt(-spare)} over the ${fmt(BUDGET)} slot`}.
The times below are the presenter view's target times; auto mode (press A) and the GIFs use the same pauses.
To change the words, edit them in this file and run \`node tools/sync-script.mjs\`. That copies them into the deck and recomputes these times; then reload the deck. It also prints how to re-render any GIF whose pauses changed.

**How to read this.** Each beat is one press of → in the live deck. In the GIFs, the beats play back to back, with each pause sized to its lines.
The *italic* line is what happens on screen; the quoted text is what you say.

## Run of show

| # | Slide | Starts | Length | GIF |
|---|---|---|---|---|
${rows.join('\n')}

${sections.join('\n\n')}

## If you are running long

${cuts.map(c => `- ${c}`).join('\n')}

## Q&A prep

${S.qa.map(x => `**${x.q}**\n${x.a}`).join('\n\n')}

## Before you present

${S.checklist.map(c => `- [ ] ${c}`).join('\n')}

## Where the facts come from

${sources.map(c => `- ${c}`).join('\n')}
`;

// Clock times and word counts are what this build computes. With those masked, the current
// SCRIPT.md matches the rebuild unless it holds edits that deck/script.js doesn't have.
const computed = text => {
  const ls = text.split(/\r?\n/).map(l => (l.startsWith('Total **') ? 'Total' : l.replace(/\{start:[\w-]+\}/g, 'm:ss').replace(/\d+:\d\d/g, 'm:ss').replace(/\d+ words/g, 'N words').trimEnd()));
  while (ls.length && !ls[ls.length - 1]) ls.pop();
  return ls;
};
const old = await readFile(out, 'utf8').catch(() => null);
if (old !== null && !process.argv.includes('--force')) {
  const a = computed(old), b = computed(md);
  let at = a.findIndex((l, k) => l !== b[k]);
  if (at < 0 && a.length !== b.length) at = a.length;
  if (at >= 0) {
    console.error(`SCRIPT.md not rebuilt: its line ${at + 1} isn't what deck/script.js gives.\n` +
      `  SCRIPT.md: ${old.split(/\r?\n/)[at] ?? '(end of file)'}\n` +
      `  rebuild:   ${md.split('\n')[at] ?? '(end of file)'}\n` +
      (process.argv.includes('--from-sync') ? '' : 'If you edited SCRIPT.md, run node tools/sync-script.mjs, which copies the edits into the deck first.\n') +
      'The header, run of show and the per-beat clock are written by this build; the words, cues, slide titles, Q&A, checklist,\n' +
      '"If you are running long" and "Where the facts come from" are yours and sync from SCRIPT.md. --force drops the SCRIPT.md edits.');
    process.exit(1);
  }
}
await writeFile(out, md);
console.log(`SCRIPT.md: ${timing.length} slides, ${fmt(clock)} total`);
