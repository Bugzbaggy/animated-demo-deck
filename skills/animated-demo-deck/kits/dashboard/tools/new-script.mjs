// Builds deck/script.js from the beats that deck/scenes.js actually has, keeping the words already in
// script.js for beats that still exist (matched by scene id and beat id, then by position).
// New beats get the on-screen caption as their cue and a TODO line to say. Then:
//   node tools/render-gifs.mjs --timing && node tools/build-script.mjs --force
// writes SCRIPT.md for the new structure; from there on, change words only in SCRIPT.md and sync.
// Usage: node tools/new-script.mjs [--title "..."] [--audience "..."]
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const jsPath = path.join(root, 'deck', 'script.js');
const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i < 0 ? null : argv[i + 1]; };
const plain = h => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// ---- what the deck has: run scenes.js with a recording Deck and a no-op animation API
const defs = [];
const noop = new Proxy({}, { get: () => () => 0 });
const ctx = { window: {}, Deck: { add: d => defs.push(d) }, console };
vm.runInNewContext(await readFile(path.join(root, 'deck', 'scenes.js'), 'utf8'), ctx, { filename: 'scenes.js' });
const scenes = defs.map(d => {
  const beats = [];
  d.build({ beat(id, dur, fn, caption) { beats.push({ id, dur, caption: plain(caption) }); return this; } }, noop);
  return { id: d.id, title: d.title, beats };
});
if (!scenes.length) throw new Error('scenes.js added no scenes');

// ---- what the script has
const load = src => { const c = { window: {} }; vm.runInNewContext(src, c); return c.window.SCRIPT; };
const old = existsSync(jsPath) ? load(await readFile(jsPath, 'utf8')) : null;

const S = {
  title: opt('--title') || old?.title || 'Untitled demo',
  audience: opt('--audience') || old?.audience || 'TODO: who this is for',
  scenes: scenes.map(sc => {
    const was = old?.scenes.find(s => s.id === sc.id);
    return {
      id: sc.id, slide: was?.slide || sc.title,
      beats: sc.beats.map((b, i) => {
        const byId = was?.beats.find(x => x.beatId === b.id);
        const byPos = was && was.beats.length === sc.beats.length ? was.beats[i] : null;
        const w = byId || byPos;
        return { beatId: b.id, cue: w?.cue ?? (b.caption || 'TODO: what happens on screen'), say: w?.say ?? 'TODO: the words for this beat.', ...(w?.hold != null ? { hold: w.hold } : {}) };
      }),
    };
  }),
  qa: old?.qa || [{ q: 'TODO: a question you expect', a: 'TODO: the answer, with the number or source it rests on.' }],
  checklist: old?.checklist || ['Run the deck once with A (auto-advance) and speak along.', 'Pick one way to present: the HTML deck in Chrome, or the GIFs in Google Slides.', 'Just before you start: reload the deck, press P for the presenter view, then F for fullscreen.'],
  cuts: old?.cuts || [],
  sources: old?.sources || [],
};

// ---- same serializer as tools/sync-script.mjs
const q = s => {
  const e = String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
  if (!e.includes("'")) return `'${e}'`;
  if (!e.includes('"')) return `"${e}"`;
  return `'${e.replace(/'/g, "\\'")}'`;
};
const serialize = S => [
  '/* script.js: the spoken script, one entry per animation beat (same order as scenes.js).',
  '   Written by tools/sync-script.mjs from SCRIPT.md, so edit the words there, not here.',
  '   The deck reads it for the presenter view (P), the pause after each beat in auto mode',
  '   and the GIFs (narration time at 135 words per minute, minus the animation), and the',
  "   presenter's target clock. */",
  'window.SCRIPT = {',
  `  title: ${q(S.title)},`,
  `  audience: ${q(S.audience)},`,
  '  scenes: [',
  ...S.scenes.flatMap(sc => [
    '    {',
    `      id: ${q(sc.id)}, slide: ${q(sc.slide)},`,
    '      beats: [',
    ...sc.beats.flatMap(b => [`        { beatId: ${q(b.beatId)}, cue: ${q(b.cue)},`, `          say: ${q(b.say)}${b.hold != null ? `, hold: ${b.hold}` : ''} },`]),
    '      ],',
    '    },',
  ]),
  '  ],',
  '',
  '  qa: [',
  ...S.qa.flatMap(x => [`    { q: ${q(x.q)},`, `      a: ${q(x.a)} },`]),
  '  ],',
  '',
  '  checklist: [',
  ...S.checklist.map(c => `    ${q(c)},`),
  '  ],',
  '',
  '  // "If you are running long" and "Where the facts come from" in SCRIPT.md; synced like the words.',
  '  cuts: [',
  ...S.cuts.map(c => `    ${q(c)},`),
  '  ],',
  '  sources: [',
  ...S.sources.map(c => `    ${q(c)},`),
  '  ],',
  '};',
  '',
].join('\n');

const js = serialize(S);
if (JSON.stringify(load(js)) !== JSON.stringify(S)) throw new Error('round trip failed');
await writeFile(jsPath, js);
const todo = S.scenes.reduce((a, s) => a + s.beats.filter(b => b.say.startsWith('TODO')).length, 0);
console.log(`deck/script.js: ${S.scenes.length} scenes, ${S.scenes.reduce((a, s) => a + s.beats.length, 0)} beats, ${todo} still TODO`);
console.log('Next: node tools/render-gifs.mjs --timing && node tools/build-script.mjs --force, then write the words in SCRIPT.md and run node tools/sync-script.mjs.');
