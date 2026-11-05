// Layout probe for demo slides (cards and board kinds): where each thread element sits inside its scrolling
// thread (px from the top of the scroll content), plus anything that overflows its card.
// Usage: node measure.mjs <deck html path> <scene id>[,<scene id>...]
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [deckPath, ids] = process.argv.slice(2);
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && existsSync(p));
if (!CHROME) { console.error('Chrome or Edge not found; set CHROME=<path>'); process.exit(2); }
const profile = await mkdtemp(path.join(os.tmpdir(), 'deck-measure-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--hide-scrollbars',
  '--no-first-run', '--no-default-browser-check', '--force-device-scale-factor=1', '--window-size=1920,1080', 'about:blank'],
{ stdio: ['ignore', 'ignore', 'pipe'] });
const exited = new Promise(r => chrome.on('exit', r));
try {
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    chrome.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
    setTimeout(() => reject(new Error('chrome did not start')), 20000);
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map(); const events = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else events.push(m); };
  const send = (method, params = {}, sessionId) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params, sessionId })); });
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  const ev = async expr => { const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };
  await s('Page.enable'); await s('Runtime.enable');
  await s('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await s('Page.navigate', { url: pathToFileURL(deckPath).href + '?capture' });
  await ev('new Promise(r => { const t = () => window.__capReady ? document.fonts.ready.then(r) : setTimeout(t, 100); t(); })');
  for (const id of ids.split(',')) {
    const out = await ev(`(() => {
      __cap.select(${JSON.stringify(id)});
      const scene = document.getElementById('scene-${id}');
      // Board decks hold every region in each scene; measure only the live one.
      const sc = scene.querySelector('.region.live') || scene;
      const body = sc.querySelector('.sk-body'), scroll = sc.querySelector('.sk-scroll');
      const top = el => { let y = 0; for (let e = el; e && e !== body; e = e.offsetParent) y += e.offsetTop; return y; };
      const rows = [];
      if (scroll) {
        rows.push('viewport ' + body.clientHeight + ', content ' + scroll.offsetHeight);
        for (const el of sc.querySelectorAll('.sk-scroll .sk-msg, .sk-scroll .mark, .sk-scroll .sk-table, .sk-scroll .sk-foot, .sk-scroll .sk-btns, .sk-scroll .skip')) {
          const name = el.className.replace(/\\s+/g, '.');
          rows.push(String(top(el)).padStart(5) + ' h' + String(el.offsetHeight).padStart(4) + '  ' + name + (el.classList.contains('mark') ? '  "' + el.textContent.slice(0, 50) + '"' : ''));
        }
      }
      // Cards whose content runs past their bottom edge, and stage-level overlaps worth a look.
      for (const card of sc.querySelectorAll('.uth, .tlc, .final, .box > .in, .note > .in, .printout > .in, .tile, .pane')) {
        const cb = card.getBoundingClientRect();
        for (const el of card.querySelectorAll('*')) {
          const b = el.getBoundingClientRect();
          if (b.height && (b.bottom > cb.bottom + 1 || b.right > cb.right + 1)) rows.push('OVERFLOW ' + card.className + ' > ' + el.tagName + '.' + el.className + ' bottom ' + Math.round(b.bottom - cb.top) + '/' + Math.round(cb.height) + ' right ' + Math.round(b.right - cb.left) + '/' + Math.round(cb.width));
        }
      }
      for (const sel of ['.final h2', '.final .fs', '.kpi .kl', '.hd h1', '.hd .sub', '.callout', '.cat', '.waves', '.srcs', '.call', '.title', '.rt .sub']) {
        for (const el of sc.querySelectorAll(sel)) rows.push('size ' + sel + ' ' + el.offsetWidth + 'x' + el.offsetHeight + ' at ' + el.offsetTop + (el.className ? ' (' + el.className + ')' : ''));
      }
      return rows.join('\\n');
    })()`);
    console.log(`=== ${id}\n${out}`);
  }
  ws.close();
} finally {
  chrome.kill();
  await Promise.race([exited, new Promise(r => setTimeout(r, 5000))]);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {});
}
