// Renders each deck scene to a 1920x1080 GIF (70 ms frames, plays once) with headless
// Chrome and ffmpeg, and writes tools/timing.json for build-script.mjs.
//
//   node tools/render-gifs.mjs                    all scenes -> gifs/NN-<id>.gif (4 Chrome workers)
//   node tools/render-gifs.mjs --scenes intro,thread  only these scenes
//   node tools/render-gifs.mjs --workers 2        fewer parallel browsers
//   node tools/render-gifs.mjs --snap <dir>       PNG of the end of every beat (quick visual check), no GIFs
//   node tools/render-gifs.mjs --snap <dir> --times "action:1,1.8;intro:2.5"   PNGs at chosen scene times
//   node tools/render-gifs.mjs --timing           timing.json only
//
// Needs Chrome (or Edge) and ffmpeg on PATH. No npm packages.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
// The deck is the one .html page in deck/, whatever it is called.
const htmlFiles = readdirSync(path.join(root, 'deck')).filter(f => f.toLowerCase().endsWith('.html'));
if (htmlFiles.length !== 1) throw new Error(`deck/ should hold exactly one .html page, found ${htmlFiles.length}: ${htmlFiles.join(', ')}`);
const deckUrl = pathToFileURL(path.join(root, 'deck', htmlFiles[0])).href + '?capture';
const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i < 0 ? null : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const only = opt('--scenes') ? String(opt('--scenes')).split(',') : null;
const snapDir = opt('--snap');
const timingOnly = !!opt('--timing');
const workers = Number(opt('--workers')) || 4;
const times = opt('--times') ? Object.fromEntries(String(opt('--times')).split(';').map(p => {
  const [id, ts] = p.split(':');
  return [id, ts.split(',').map(Number)];
})) : null;

const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && existsSync(p));
if (!CHROME) throw new Error('Chrome or Edge not found; set CHROME=<path>');

class CDP {
  constructor(url) { this.ws = new WebSocket(url); this.seq = 0; this.pending = new Map(); this.listeners = new Set(); }
  open() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = e => {
        const m = JSON.parse(e.data);
        if (m.id && this.pending.has(m.id)) {
          const p = this.pending.get(m.id);
          this.pending.delete(m.id);
          m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
        } else this.listeners.forEach(l => l(m));
      };
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  once(method, sessionId) {
    return new Promise(resolve => {
      const l = m => { if (m.method === method && m.sessionId === sessionId) { this.listeners.delete(l); resolve(m.params); } };
      this.listeners.add(l);
    });
  }
}

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('error', reject);
    p.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

// One headless Chrome with the deck loaded in capture mode.
async function openDeck() {
  const profile = await mkdtemp(path.join(os.tmpdir(), 'deck-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--hide-scrollbars',
    '--mute-audio', '--no-first-run', '--no-default-browser-check', '--force-device-scale-factor=1', '--window-size=1920,1080',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe'] });
  const exited = new Promise(r => chrome.on('exit', r));
  const close = async () => {
    chrome.kill();
    await Promise.race([exited, new Promise(r => setTimeout(r, 5000))]);
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {});
  };
  try {
    const wsUrl = await new Promise((resolve, reject) => {
      let buf = '';
      chrome.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
      chrome.on('exit', c => reject(new Error(`chrome exited ${c}`)));
      setTimeout(() => reject(new Error('chrome did not start in 60 s')), 60000);
    });
    const cdp = new CDP(wsUrl);
    await cdp.open();
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m, p) => cdp.send(m, p, sessionId);
    const ev = async expr => {
      const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };
    const errors = [];
    cdp.listeners.add(m => {
      if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
    });
    await s('Page.enable');
    await s('Runtime.enable');
    await s('Page.bringToFront');
    await s('Emulation.setFocusEmulationEnabled', { enabled: true });
    await s('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    const loaded = cdp.once('Page.loadEventFired', sessionId);
    await s('Page.navigate', { url: deckUrl });
    await loaded;
    await ev('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 300))).then(() => !!window.__capReady)');
    if (errors.length) throw new Error('page errors:\n' + errors.join('\n'));
    const shot = async () => Buffer.from((await s('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })).data, 'base64');
    return { ev, shot, close, errors };
  } catch (e) { await close(); throw e; }
}

// ffmpeg's concat input rounds frame times to 40 ms, so after encoding, write the exact
// delay (in centiseconds) into each frame's Graphic Control Extension. Lossless.
function patchGifDelays(buf, delays) {
  let p = 13;
  if (buf[10] & 0x80) p += 3 * (1 << ((buf[10] & 7) + 1));
  let frame = 0;
  while (p < buf.length && buf[p] !== 0x3B) {
    if (buf[p] === 0x21) {
      if (buf[p + 1] === 0xF9 && buf[p + 2] === 4) {
        if (frame < delays.length) buf.writeUInt16LE(delays[frame], p + 4);
        frame++;
      }
      p += 2;
      while (buf[p] !== 0) p += buf[p] + 1;
      p += 1;
    } else if (buf[p] === 0x2C) {
      const lf = buf[p + 9];
      p += 10;
      if (lf & 0x80) p += 3 * (1 << ((lf & 7) + 1));
      p += 1;
      while (buf[p] !== 0) p += buf[p] + 1;
      p += 1;
    } else throw new Error(`unexpected GIF block 0x${buf[p].toString(16)} at ${p}`);
  }
  return frame;
}

async function renderScene(page, { id, idx }) {
  const sel = await page.ev(`__cap.select(${JSON.stringify(id)})`);
  const dir = await mkdtemp(path.join(os.tmpdir(), `deck-${id}-`));
  try {
    const list = [];
    let last = '';
    const t0 = Date.now();
    for (const [i, f] of sel.plan.entries()) {
      await page.ev(`__cap.seek(${f.t})`);
      last = `f${String(i).padStart(5, '0')}.png`;
      await writeFile(path.join(dir, last), await page.shot());
      list.push(`file '${last}'`, `duration ${f.d}`);
    }
    list.push(`file '${last}'`);
    await writeFile(path.join(dir, 'list.txt'), list.join('\n') + '\n');
    const out = path.join(root, 'gifs', `${String(idx + 1).padStart(2, '0')}-${id}.gif`);
    await mkdir(path.dirname(out), { recursive: true });
    await run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt',
      '-lavfi', 'split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
      '-fps_mode', 'vfr', '-loop', '-1', out], dir);
    const gif = await readFile(out);
    const delays = sel.plan.map(f => Math.round(f.d * 100));
    const n = patchGifDelays(gif, delays);
    if (n !== sel.plan.length + 1) throw new Error(`${id}: GIF has ${n} frames, expected ${sel.plan.length + 1}`);
    await writeFile(out, gif);
    const secs = delays.reduce((a, b) => a + b, 0) / 100;
    console.log(`${path.basename(out)}: ${sel.plan.length} frames, ${secs.toFixed(1)} s, ${(gif.length / 1048576).toFixed(1)} MB, captured in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
  }
}

async function main() {
  const first = await openDeck();
  const pages = [first];
  try {
    const ids = await first.ev('__cap.ids()');
    const timing = [];
    for (const [idx, id] of ids.entries()) {
      const sel = await first.ev(`__cap.select(${JSON.stringify(id)})`);
      timing.push({ n: idx + 1, id, title: sel.title, beats: sel.beats });
    }
    await writeFile(path.join(here, 'timing.json'), JSON.stringify({ scenes: timing }, null, 2) + '\n');
    if (timingOnly) return;
    const todo = ids.map((id, idx) => ({ id, idx })).filter(j => (!only || only.includes(j.id)) && (!times || times[j.id]));

    if (snapDir) {
      await mkdir(snapDir, { recursive: true });
      for (const { id, idx } of todo) {
        const sel = await first.ev(`__cap.select(${JSON.stringify(id)})`);
        const shots = times ? times[id].map(t => ({ t, name: `t${t}` }))
          : sel.plan.filter(f => f.end !== undefined).map(f => ({ t: f.t, name: `b${f.end + 1}` }));
        for (const { t, name } of shots) {
          await first.ev(`__cap.seek(${t})`);
          await writeFile(path.join(snapDir, `${String(idx + 1).padStart(2, '0')}-${id}-${name}.png`), await first.shot());
        }
        console.log(`${id}: ${shots.length} snapshots`);
      }
      return;
    }

    // One at a time, and every Chrome that starts goes into pages so the finally below closes it.
    // Short on memory, a worker may not start: render with the ones that did.
    const extra = Math.max(0, Math.min(workers, todo.length) - 1);
    for (let i = 0; i < extra; i++) {
      try { pages.push(await openDeck()); } catch (e) { console.error(`Chrome worker ${i + 2} did not start (${e.message}); rendering with ${pages.length}.`); break; }
    }
    await Promise.all(pages.map(async page => { while (todo.length) await renderScene(page, todo.shift()); }));
    const errors = pages.flatMap(p => p.errors);
    if (errors.length) console.error('page errors during capture:\n' + errors.join('\n'));
  } finally {
    await Promise.all(pages.map(p => p.close()));
  }
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
