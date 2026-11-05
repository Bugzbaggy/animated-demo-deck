// Captions of a deck's scenes.js: list them, replace them, or compare two decks.
//   node captions.mjs list <scenes.js>                  every beat as scene.beat<TAB>length<TAB>caption (raw HTML)
//   node captions.mjs apply <scenes.js> <map.json>      replace literal captions: { "scene.beat": "new caption html", ... }
//   node captions.mjs compare <old.js> <new.js>         captions the two decks share; exit 1 if any (a rebuild in another
//                                                       kind rewrites every caption in the new kind's grammar)
// A beat's caption is the string after its callback: tl.beat('id', dur, A => { ... }, '<caption>'). A caption passed as a
// variable from a loop, [[id, n, 'caption'], ...].forEach(([id, n, cap]) => tl.beat(id, ..., cap)), is read from the
// array literal; anything else passed as a variable is listed as "(variable name)" for checking by eye.
import { readFileSync, writeFileSync } from 'node:fs';
const [mode, file, other] = process.argv.slice(2);
const text = h => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const isBlank = h => !text(h) || /class="blank"/.test(h);

// Index of the bracket that closes (or opens, backwards) the one at i, skipping strings.
function match(s, i, dir) {
  const [o, c] = dir > 0 ? [s[i], s[i] === '[' ? ']' : s[i] === '{' ? '}' : ')'] : [s[i], s[i] === ']' ? '[' : s[i] === '}' ? '{' : '('];
  let depth = 0;
  for (let j = i; j >= 0 && j < s.length; j += dir) {
    const ch = s[j];
    if (ch === "'" || ch === '"' || ch === '`') {           // skip a string literal
      const q = ch; j += dir;
      while (j >= 0 && j < s.length && !(s[j] === q && s[j - 1] !== '\\')) j += dir;
      continue;
    }
    if (ch === o) depth++;
    else if (ch === c) { depth--; if (depth === 0) return j; }
  }
  return -1;
}

function loopCaptions(s, at, variable) {
  const head = s.lastIndexOf('.forEach(', at);
  if (head < 0 || at - head > 800) return null;
  const params = s.slice(head, s.indexOf('=>', head)).match(/\(\s*\[([^\]]*)\]/);
  if (!params) return null;
  const idx = params[1].split(',').map(t => t.trim()).indexOf(variable);
  if (idx < 0) return null;
  const close = head - 1;
  if (s[close] !== ']') return null;
  const open = match(s, close, -1);
  if (open < 0) return null;
  try {
    const arr = Function(`"use strict"; return (${s.slice(open, close + 1)});`)();
    return arr.map(t => ({ id: t[0], caption: t[idx] }));
  } catch { return null; }
}

function captions(s) {
  const out = [];
  const reBeat = /tl\.beat\(\s*(?:'([\w-]+)'|([A-Za-z_$][\w$]*))/g;
  const starts = [];
  let m;
  while ((m = reBeat.exec(s))) starts.push({ id: m[1] || null, at: m.index });
  for (let i = 0; i < starts.length; i++) {
    const from = starts[i].at, to = i + 1 < starts.length ? starts[i + 1].at : s.length;
    const sm = [...s.slice(0, from).matchAll(/Deck\.add\(\{\s*id:\s*'([\w-]+)'/g)].pop();
    const scene = sm ? sm[1] : '?';
    const open = s.indexOf('{', s.indexOf('=>', from));
    const close = match(s, open, 1);
    const rest = s.slice(close + 1, to);
    const cm = rest.match(/^\s*,\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1\s*\)/);
    if (cm) {
      out.push({ key: `${scene}.${starts[i].id}`, caption: cm[2], capAt: close + 1 + rest.indexOf(cm[0]), capLen: cm[0].length });
      continue;
    }
    const vm = rest.match(/^\s*,\s*([A-Za-z_$][\w$.]*)\s*\)/);
    const loop = vm && loopCaptions(s, from, vm[1]);
    if (loop) for (const l of loop) out.push({ key: `${scene}.${l.id}`, caption: l.caption, loop: true });
    else out.push({ key: `${scene}.${starts[i].id || '?'}`, caption: null, variable: vm ? vm[1] : null });
  }
  return out;
}

const src = readFileSync(file, 'utf8');
const list = captions(src);

if (mode === 'list') {
  for (const b of list) {
    const c = b.caption !== null ? b.caption : b.variable ? `(variable ${b.variable})` : '(none)';
    console.log(`${b.key}\t${b.caption !== null ? text(b.caption).length : '-'}\t${c}${b.loop ? '\t(from a loop)' : ''}`);
  }
  console.log(`# ${list.length} beats, ${list.filter(b => b.caption !== null).length} with a caption`);
} else if (mode === 'apply') {
  const map = JSON.parse(readFileSync(other, 'utf8'));
  let s = src, n = 0;
  const byKey = new Map(list.map(b => [b.key, b]));
  for (const k of Object.keys(map)) {
    const b = byKey.get(k);
    if (!b) throw new Error('no such beat: ' + k);
    if (b.loop || b.caption === null || b.capAt === undefined) throw new Error(`beat ${k} has no literal caption (from a loop or a variable): edit it by hand`);
  }
  for (const b of [...list].reverse()) {
    if (!(b.key in map)) continue;
    const t = map[b.key];
    const q = t.includes("'") ? '`' : "'";
    if (q === '`' && (t.includes('`') || t.includes('${'))) throw new Error('caption needs escaping: ' + b.key);
    const old = s.slice(b.capAt, b.capAt + b.capLen);
    const repl = old.replace(/(['"`])((?:(?!\1)[^\\]|\\.)*)\1(\s*\))$/, (_, _q, _t, tail) => `${q}${t}${q}${tail}`);
    if (repl === old) throw new Error('could not rewrite ' + b.key);
    s = s.slice(0, b.capAt) + repl + s.slice(b.capAt + b.capLen);
    n++;
  }
  writeFileSync(file, s);
  console.log(`replaced ${n} captions`);
} else if (mode === 'compare') {
  const set = s => new Set(captions(s).filter(b => b.caption !== null && !isBlank(b.caption)).map(b => text(b.caption)));
  const a = set(src), b = set(readFileSync(other, 'utf8'));
  const same = [...b].filter(t => a.has(t));
  console.log(`old: ${a.size} captions · new: ${b.size} captions · identical: ${same.length}`);
  for (const t of same) console.log('  same: ' + t);
  process.exit(same.length ? 1 : 0);
} else {
  console.error('usage: node captions.mjs list <scenes.js> | apply <scenes.js> <map.json> | compare <old.js> <new.js>');
  process.exit(2);
}
