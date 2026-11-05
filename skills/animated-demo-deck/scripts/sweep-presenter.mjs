// End-to-end check: open the deck, press P, step through every beat with →, and compare what
// the presenter view shows (slide, beat, cue, words, target time) with SCRIPT.md.
// Usage: node sweep-presenter.mjs <deck.html> <SCRIPT.md>
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [deckFile, mdFile] = process.argv.slice(2);
const norm = s => s.replace(/\s+/g, ' ').trim();

// Expected values, parsed independently of tools/sync-script.mjs.
const expect = [];
let slide = null, cur = null;
for (const line of (await readFile(mdFile, 'utf8')).split(/\r?\n/)) {
  let m;
  if ((m = line.match(/^## (\d+)\. (.+) \(\d+:\d\d to \d+:\d\d\)\s*$/))) { slide = +m[1]; cur = null; }
  else if (line.startsWith('## ')) { slide = null; cur = null; }
  else if (slide && (m = line.match(/^\*\*(\d+:\d\d) · beat (\d+)\.\*\*(?: \*(.*)\*)?\s*$/))) expect.push(cur = { slide, beat: +m[2], t: m[1], cue: (m[3] || '').trim(), say: '' });
  else if (cur && line.startsWith('>')) cur.say = norm(cur.say + ' ' + line.replace(/^> ?/, ''));
}

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && existsSync(p));
if (!CHROME) { console.error('Chrome or Edge not found; set CHROME=<path>'); process.exit(2); }
const profile = await mkdtemp(path.join(os.tmpdir(), 'sweep-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1600,900', '--no-first-run', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((res, rej) => {
  let b = ''; chrome.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) res(m[1]); });
  setTimeout(() => rej(new Error('no chrome')), 20000);
});
const ws = new WebSocket(wsUrl);
await new Promise(r => (ws.onopen = r));
let seq = 0; const pend = new Map(); const errors = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
};
const send = (method, params = {}, sessionId) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params, sessionId })); return new Promise((res, rej) => pend.set(id, { res, rej })); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const evalIn = async (s, x) => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true }, s); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };

let exit = 1;
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, s); await send('Page.enable', {}, s);
  await send('Page.navigate', { url: pathToFileURL(deckFile).href }, s);
  await sleep(1500);
  const info = await evalIn(s, '({ title: document.title, scenes: Deck.scenes.length, beats: Deck.scenes.reduce((a, x) => a + x.tl.beats.length, 0) })');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'p', code: 'KeyP', windowsVirtualKeyCode: 80 }, s);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'p', code: 'KeyP', windowsVirtualKeyCode: 80 }, s);
  await sleep(800);
  const pres = (await send('Target.getTargets')).targetInfos.find(t => t.type === 'page' && t.title.startsWith('Presenter'));
  if (!pres) throw new Error('presenter window did not open');
  const { sessionId: ps } = await send('Target.attachToTarget', { targetId: pres.targetId, flatten: true });
  await send('Runtime.enable', {}, ps);
  const read = () => evalIn(ps, "(() => { const g = id => document.getElementById(id).textContent; return { scene: g('p-scene'), beat: g('p-beat'), cue: g('p-cue'), say: g('p-say'), target: g('p-target') }; })()");

  console.log(`deck: "${info.title}", ${info.scenes} slides, ${info.beats} beats; SCRIPT.md: ${expect.length} beat blocks`);
  const bad = [];
  for (const [i, e] of expect.entries()) {
    await evalIn(s, 'Deck.next()');            // start the beat, as one press of →
    const got = await read();
    const want = { scene: `Slide ${e.slide} of ${info.scenes}`, beat: `Beat ${e.beat} of`, cue: e.cue, say: e.say, target: `target ${e.t}` };
    const diffs = [];
    if (!got.scene.startsWith(want.scene + ' ·')) diffs.push(`scene "${got.scene}"`);
    if (!got.beat.startsWith(want.beat)) diffs.push(`beat "${got.beat}"`);
    if (norm(got.cue) !== want.cue) diffs.push(`cue "${got.cue}" vs "${want.cue}"`);
    if (norm(got.say) !== want.say) diffs.push(`say "${norm(got.say)}"\n      vs SCRIPT.md "${want.say}"`);
    if (got.target !== want.target) diffs.push(`${got.target} vs SCRIPT.md ${e.t}`);
    if (diffs.length) bad.push(`#${i + 1} slide ${e.slide} beat ${e.beat}: ${diffs.join('; ')}`);
    await evalIn(s, 'Deck.next()');            // finish the beat
  }
  if (expect.length !== info.beats) bad.push(`SCRIPT.md has ${expect.length} beats, deck has ${info.beats}`);
  console.log(bad.length ? `MISMATCHES (${bad.length}):\n  ` + bad.join('\n  ') : `ALL ${expect.length} BEATS MATCH: words, cue, slide/beat number and target time`);
  console.log('page errors:', errors.length ? errors : 'none');
  exit = bad.length || errors.length ? 1 : 0;
} finally {
  chrome.kill(); await sleep(500); await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {});
}
process.exit(exit);
