// Checks a reader-paced widget (the kits' widget-*.html files, or one built from them) at real viewport
// widths, step by step: the content height at each step, horizontal overflow, and anything that spills out of
// its tile or card. Prints the iframe height to set for each width (a site builder's "HTML code" block, say).
//
//   node check-widget.mjs <widget.html> [--widths 740,980,390] [--steps N] [--shots <dir>]
//
// - Opens <widget.html>?step=k for k = 0..N. N is read from the step counter ("0 / N") unless --steps is given.
// - Viewport through Emulation.setDeviceMetricsOverride, so 390 px is really 390 px (Chrome's --window-size has
//   a minimum width). Widths under 600 px are emulated as mobile.
// - prefers-reduced-motion is emulated, so CSS transitions and keyframes are skipped and each step is measured in
//   its final state. The widgets must honour it (their CSS turns transitions off under that media query).
// - Height = the widget's natural height: min-height on html, body and the widget root (.w) is turned off first,
//   because a 100vh min-height would otherwise report the viewport. Avoid other vh units inside a widget: in an
//   iframe the viewport is the iframe, so they make the height depend on itself.
// - "spills": an element whose box runs more than 1 px past the right or bottom edge of its nearest .tile/.card.
//   "clipped": an element with overflow hidden whose text is wider than its box (an ellipsis or a cut word).
// - --shots <dir> writes <dir>/w<width>-s<step>.png, full height.
// Exit code 1 if anything overflows horizontally or spills; clipped text is a note only.
// Launches its own headless Chrome (profile folder widget-check-*), one at a time, and removes it at the end.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i < 0 ? null : argv[i + 1]; };
const optValues = new Set(['--widths', '--steps', '--shots'].map(n => argv.indexOf(n)).filter(i => i >= 0).map(i => i + 1));
const file = argv.find((a, i) => !a.startsWith('--') && !optValues.has(i));
if (!file || !existsSync(file)) { console.error('usage: node check-widget.mjs <widget.html> [--widths 740,980,390] [--steps N] [--shots <dir>]'); process.exit(2); }
const widths = (opt('--widths') || '740,980,390').split(',').map(Number).filter(Boolean);
const stepsArg = opt('--steps') ? +opt('--steps') : null;
const shots = opt('--shots');
if (shots) await mkdir(shots, { recursive: true });

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && existsSync(p));
if (!CHROME) { console.error('Chrome or Edge not found; set CHROME=<path>'); process.exit(2); }
const profile = await mkdtemp(path.join(os.tmpdir(), 'widget-check-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--hide-scrollbars',
  '--no-first-run', '--no-default-browser-check', '--force-device-scale-factor=1', '--window-size=1280,900', 'about:blank'],
{ stdio: ['ignore', 'ignore', 'pipe'] });
const exited = new Promise(r => chrome.on('exit', r));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Runs in the page after each navigation: natural height, overflow and spills.
const PROBE = `(() => {
  const st = document.createElement('style');
  st.textContent = 'html,body,.w{min-height:0!important}';
  document.head.appendChild(st);
  const root = document.querySelector('.w') || document.body;
  const height = Math.ceil(Math.max(root.getBoundingClientRect().height, document.body.getBoundingClientRect().height));
  const d = document.documentElement;
  const notes = [];
  if (d.scrollWidth > d.clientWidth + 1) {
    const wide = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > d.clientWidth + 1; })
      .filter(e => !e.parentElement || e.parentElement.getBoundingClientRect().right <= d.clientWidth + 1).slice(0, 4);
    notes.push('OVERFLOW-X scrollWidth ' + d.scrollWidth + ' > ' + d.clientWidth + (wide.length ? ' (' + wide.map(e => e.tagName.toLowerCase() + '.' + [...e.classList].join('.')).join(', ') + ')' : ''));
  }
  const vis = e => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const seen = new Set();
  for (const box of document.querySelectorAll('.tile, .card')) {
    if (!vis(box)) continue;
    const b = box.getBoundingClientRect();
    if (!b.width || !b.height) continue;
    for (const e of box.querySelectorAll('*')) {
      if (e.closest('.tile, .card') !== box || !vis(e)) continue;
      const r0 = e.getBoundingClientRect();
      if (!r0.width || !r0.height) continue;
      if (getComputedStyle(e).position === 'absolute' && getComputedStyle(e).opacity === '0') continue;   // rings and the like
      // what is left of it after the clipping boxes between it and the tile (a collapsed list, a scroller)
      const r = { right: r0.right, bottom: r0.bottom, left: r0.left, top: r0.top };
      for (let a = e.parentElement; a && a !== box; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const c = a.getBoundingClientRect();
        r.right = Math.min(r.right, c.right); r.bottom = Math.min(r.bottom, c.bottom); r.left = Math.max(r.left, c.left); r.top = Math.max(r.top, c.top);
      }
      if (r.right - r.left < 1 || r.bottom - r.top < 1) continue;   // fully hidden by an inner clip
      if (r.right > b.right + 1 || r.bottom > b.bottom + 1) {
        const key = 'SPILL ' + (box.id || [...box.classList].join('.')) + ' > ' + e.tagName.toLowerCase() + '.' + [...e.classList].join('.');
        if (!seen.has(key)) { seen.add(key); notes.push(key + ' "' + e.textContent.trim().slice(0, 30) + '" by ' + Math.round(Math.max(r.right - b.right, r.bottom - b.bottom)) + ' px'); }
      }
    }
  }
  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e) || !e.textContent.trim() || e.children.length > 3) continue;
    const cs = getComputedStyle(e);
    if (cs.overflowX !== 'hidden' && cs.overflow !== 'hidden') continue;
    if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) {
      const key = 'clipped ' + e.tagName.toLowerCase() + '.' + [...e.classList].join('.') + ' "' + e.textContent.trim().slice(0, 40) + '"';
      if (!seen.has(key)) { seen.add(key); notes.push(key); }
    }
  }
  st.remove();
  return { height, notes };
})()`;

let failed = false;
try {
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    chrome.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
    setTimeout(() => reject(new Error('chrome did not start in 30 s')), 30000);
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}, sessionId) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params, sessionId })); });
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  const ev = async expr => {
    const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
    return r.result?.result?.value;
  };
  await s('Page.enable'); await s('Runtime.enable');
  await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const base = pathToFileURL(path.resolve(file)).href;
  const load = async (w, k) => {
    await s('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await s('Page.navigate', { url: `${base}?step=${k}` });
    await ev(`new Promise(r => { const t = () => document.readyState === 'complete' ? document.fonts.ready.then(() => setTimeout(r, 450)) : setTimeout(t, 50); t(); })`);
  };

  let total = stepsArg;
  if (total == null) {
    await load(widths[0], 0);
    total = await ev(`(() => { for (const e of document.querySelectorAll('body *')) { if (e.children.length) continue; const m = e.textContent.match(/^\\s*\\d+\\s*\\/\\s*(\\d+)\\s*$/); if (m) return +m[1]; } return null; })()`);
    if (!total) throw new Error('no step counter like "0 / N" found; pass --steps N');
  }
  console.log(`${path.basename(file)}: ${total} steps`);
  for (const w of widths) {
    let max = 0, maxAt = 0;
    console.log(`\nwidth ${w} px${w < 600 ? ' (mobile)' : ''}`);
    console.log('step  height  notes');
    for (let k = 0; k <= total; k++) {
      await load(w, k);
      const { height, notes } = await ev(PROBE);
      if (height > max) { max = height; maxAt = k; }
      if (notes.some(n => n.startsWith('OVERFLOW') || n.startsWith('SPILL'))) failed = true;
      console.log(`${String(k).padStart(4)}  ${String(height).padStart(6)}  ${notes.join('; ')}`);
      if (shots) {
        await s('Emulation.setDeviceMetricsOverride', { width: w, height: Math.max(200, height), deviceScaleFactor: 1, mobile: w < 600 });
        await sleep(250);
        const shot = await s('Page.captureScreenshot', { format: 'png' });
        await writeFile(path.join(shots, `w${w}-s${k}.png`), Buffer.from(shot.result.data, 'base64'));
      }
    }
    console.log(`iframe height for ${w}: ${max + 8} px (tallest at step ${maxAt})`);
  }
  ws.close();
} catch (e) {
  console.error(String(e && e.message || e));
  failed = true;
} finally {
  chrome.kill();
  await Promise.race([exited, sleep(5000)]);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {});
}
process.exit(failed ? 1 : 0);
