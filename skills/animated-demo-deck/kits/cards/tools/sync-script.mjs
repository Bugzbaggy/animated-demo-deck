// Copies the words you edit in SCRIPT.md into deck/script.js, which is what the deck reads
// for the presenter view (P), the pause after each beat in auto mode, and the target clock.
// Then it refreshes tools/timing.json from the deck (headless Chrome) and rebuilds SCRIPT.md,
// so its timestamps match the presenter view again.
// Usage: node tools/sync-script.mjs
//
// Each "**m:ss · beat N.** *cue*" block in SCRIPT.md is one press of →, and each slide's
// animation has a fixed number of beats: change the words, keep the blocks. Slide titles,
// the Q&A, the checklist, "If you are running long" and "Where the facts come from" sync too;
// the header, run of show and clock are rebuilt. To add or remove beats, change scenes.js and
// run node tools/new-script.mjs, which keeps the words of the beats that still exist.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const jsPath = path.join(root, 'deck', 'script.js');
const timingPath = path.join(here, 'timing.json');
const plain = h => h.replace(/<[^>]+>/g, '');
const fail = msg => { console.error(msg); process.exit(1); };
const load = src => { const ctx = { window: {} }; vm.runInNewContext(src, ctx); return ctx.window.SCRIPT; };

// ---------------------------------------------------------------- read SCRIPT.md
function parse(md) {
  const doc = { title: null, audience: null, slides: [], qa: null, checklist: null, cuts: null, sources: null };
  let section = null, slide = null, beat = null, qa = null;
  for (const line of md.split(/\r?\n/)) {
    let m;
    if (!doc.title && (m = line.match(/^# (.+)/))) doc.title = m[1].trim();
    else if ((m = line.match(/^Spoken script .*Audience: (.+)\.\s*$/))) doc.audience = m[1];
    else if (line.startsWith('## ')) {
      slide = beat = qa = null;
      if ((m = line.match(/^## (\d+)\. (.+) \(\d+:\d\d to \d+:\d\d\)\s*$/))) doc.slides.push(slide = { n: +m[1], slide: m[2], beats: [] });
      section = slide ? 'slide' : /^## Q&A prep\s*$/.test(line) ? 'qa' : /^## Before you present\s*$/.test(line) ? 'check'
        : /^## If you are running long\s*$/.test(line) ? 'cuts' : /^## Where the facts come from\s*$/.test(line) ? 'sources' : null;
      if (section === 'qa') doc.qa = [];
      if (section === 'check') doc.checklist = [];
      if (section === 'cuts') doc.cuts = [];
      if (section === 'sources') doc.sources = [];
    } else if (section === 'slide') {
      if ((m = line.match(/^\*\*\d+:\d\d · beat (\d+)\.\*\*(?: \*(.*)\*)?\s*$/))) slide.beats.push(beat = { cue: (m[2] || '').trim(), say: [] });
      else if (beat && line.startsWith('>')) beat.say.push(line.replace(/^> ?/, '').trim());
    } else if (section === 'qa') {
      if ((m = line.match(/^\*\*(.+)\*\*\s*$/))) doc.qa.push(qa = { q: m[1], a: [] });
      else if (qa) qa.a.push(line.trimEnd());
    } else if (section === 'check') {
      if ((m = line.match(/^- \[[ xX]\] (.+)$/))) doc.checklist.push(m[1].trim());
    } else if (section === 'cuts' || section === 'sources') {
      if ((m = line.match(/^- (.+)$/))) doc[section].push(m[1].trim());
    }
  }
  for (const s of doc.slides) for (const b of s.beats) b.say = b.say.join('\n').trim();
  for (const x of doc.qa || []) x.a = x.a.join('\n').trim();
  return doc;
}

// ---------------------------------------------------------------- write deck/script.js
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
    ...sc.beats.flatMap(b => [`        { ${b.beatId != null ? `beatId: ${q(b.beatId)}, ` : ''}cue: ${q(b.cue)},`, `          say: ${q(b.say)}${b.hold != null ? `, hold: ${b.hold}` : ''} },`]),
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
  ...(S.cuts || []).map(c => `    ${q(c)},`),
  '  ],',
  '  sources: [',
  ...(S.sources || []).map(c => `    ${q(c)},`),
  '  ],',
  '};',
  '',
].join('\n');

const doc = parse(await readFile(path.join(root, 'SCRIPT.md'), 'utf8'));
const before = await readFile(jsPath, 'utf8');
const S = load(before);
S.cuts = S.cuts || []; S.sources = S.sources || [];

if (doc.slides.length !== S.scenes.length) fail(`SCRIPT.md has ${doc.slides.length} slide sections like "## 1. Intro (0:00 to 0:43)"; the deck has ${S.scenes.length}. Nothing changed.`);
doc.slides.forEach((p, i) => {
  const n = S.scenes[i].beats.length;
  if (p.n !== i + 1) fail(`SCRIPT.md: slide sections must run 1 to ${S.scenes.length} in order, but section ${i + 1} is "## ${p.n}. ${p.slide}". Nothing changed.`);
  if (p.beats.length !== n) fail(`Slide ${i + 1} (${p.slide}): SCRIPT.md has ${p.beats.length} beat blocks, but its animation has ${n}. Each "**m:ss · beat N.**" block is one press of →, so keep ${n} and change only the words. To add or remove beats, change deck/scenes.js and run node tools/new-script.mjs. Nothing changed.`);
  p.beats.forEach((b, k) => { if (!b.say) fail(`Slide ${i + 1}, beat ${k + 1}: there is no "> " line to say. Nothing changed.`); });
});

const changed = [];
// SCRIPT.md shows the words without HTML tags, so keep script.js's tags when the text matches.
const set = (obj, key, value, label) => {
  if (value == null || plain(obj[key] ?? '') === value) return;
  obj[key] = value;
  changed.push(label);
};
set(S, 'title', doc.title, 'title');
set(S, 'audience', doc.audience, 'audience');
doc.slides.forEach((p, i) => {
  const sc = S.scenes[i];
  set(sc, 'slide', p.slide, `slide ${i + 1} title`);
  p.beats.forEach((b, k) => {
    set(sc.beats[k], 'cue', b.cue, `slide ${i + 1} beat ${k + 1} cue`);
    set(sc.beats[k], 'say', b.say, `slide ${i + 1} beat ${k + 1}`);
  });
});
if (doc.qa && JSON.stringify(doc.qa) !== JSON.stringify(S.qa)) { S.qa = doc.qa; changed.push('Q&A'); }
if (doc.checklist && JSON.stringify(doc.checklist) !== JSON.stringify(S.checklist)) { S.checklist = doc.checklist; changed.push('checklist'); }
// Running-long lines may hold {start:<scene id>} placeholders, which SCRIPT.md shows expanded with the timing it
// was built from. A line that still reads as its expansion keeps its placeholder; an edited line replaces it.
const oldTimingForCuts = JSON.parse(await readFile(timingPath, 'utf8').catch(() => '{"scenes":[]}')).scenes;
const startsFrom = timing => { const o = {}; let c = 0; for (const t of timing) { o[t.id] = c; c += t.beats.reduce((a, b) => a + b.dur + b.hold, 0); } return o; };
const mmss = s => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
const st = startsFrom(oldTimingForCuts);
const expandOld = s => s.replace(/\{start:([\w-]+)\}/g, (m, id) => st[id] == null ? m : mmss(st[id]));
if (doc.cuts) {
  const merged = doc.cuts.map((line, i) => (S.cuts[i] != null && expandOld(S.cuts[i]) === line ? S.cuts[i] : line));
  if (JSON.stringify(merged) !== JSON.stringify(S.cuts)) { S.cuts = merged; changed.push('running long'); }
}
if (doc.sources && JSON.stringify(doc.sources) !== JSON.stringify(S.sources)) { S.sources = doc.sources; changed.push('sources'); }

const js = serialize(S);
if (JSON.stringify(load(js)) !== JSON.stringify(S)) fail('deck/script.js would not read back the same, so it was left alone. Nothing changed.');
if (js !== before) await writeFile(jsPath, js);

// The pauses follow the words, so refresh the timing, then SCRIPT.md's timestamps.
const oldTiming = JSON.parse(await readFile(timingPath, 'utf8').catch(() => '{"scenes":[]}')).scenes;
const node = (script, args = []) => spawnSync(process.execPath, [path.join(here, script), ...args], { stdio: 'inherit' }).status;
if (node('render-gifs.mjs', ['--timing']) !== 0) fail('deck/script.js has your words, but tools/timing.json could not be refreshed (needs Chrome), so SCRIPT.md\'s times were not updated.');
const newTiming = JSON.parse(await readFile(timingPath, 'utf8')).scenes;
const stale = newTiming.filter(t => JSON.stringify(t.beats) !== JSON.stringify((oldTiming.find(o => o.id === t.id) || {}).beats));
if (node('build-script.mjs', ['--from-sync']) !== 0) fail('deck/script.js has your words, but SCRIPT.md was not rebuilt (see above).');

const page = readdirSync(path.join(root, 'deck')).find(f => f.toLowerCase().endsWith('.html'));
console.log(changed.length ? `deck/script.js: ${changed.length} updated (${changed.join(', ')})` : 'deck/script.js: already matched SCRIPT.md');
console.log(`Reload deck/${page} in Chrome to pick it up.`);
console.log(stale.length
  ? `GIF pauses changed on slide ${stale.map(t => t.n).join(', ')}. To update those GIFs (a few minutes each):\n  node tools/render-gifs.mjs --scenes ${stale.map(t => t.id).join(',')}`
  : 'GIF pauses unchanged.');
