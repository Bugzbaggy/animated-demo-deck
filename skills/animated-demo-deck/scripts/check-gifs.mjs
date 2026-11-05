// Reads every GIF's frame delays straight from the file and checks them against tools/timing.json:
// animation frames are 70 ms, each beat's hold frame equals its pause, no loop block (plays once).
// Usage: node check-gifs.mjs <presentation dir>
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
const timing = JSON.parse(readFileSync(path.join(root, 'tools', 'timing.json'), 'utf8')).scenes;

function frames(buf) {
  let p = 13, loop = false;
  if (buf[10] & 0x80) p += 3 * (1 << ((buf[10] & 7) + 1));
  const delays = [];
  const skipSub = () => { while (buf[p] !== 0) p += buf[p] + 1; p += 1; };
  while (p < buf.length && buf[p] !== 0x3B) {
    if (buf[p] === 0x21) {
      const label = buf[p + 1];
      if (label === 0xF9) delays.push(buf.readUInt16LE(p + 4));
      if (label === 0xFF && buf.toString('latin1', p + 3, p + 14) === 'NETSCAPE2.0') loop = true;
      p += 2; skipSub();
    } else if (buf[p] === 0x2C) {
      const lf = buf[p + 9]; p += 10;
      if (lf & 0x80) p += 3 * (1 << ((lf & 7) + 1));
      p += 1; skipSub();
    } else throw new Error(`bad block at ${p}`);
  }
  return { delays, loop };
}

let bad = 0;
for (const t of timing) {
  const file = path.join(root, 'gifs', `${String(t.n).padStart(2, '0')}-${t.id}.gif`);
  const { delays, loop } = frames(readFileSync(file));
  const plan = delays.slice(0, -1);                       // the last frame is the list's closing repeat
  const holds = plan.filter(d => d !== 7);
  const want = t.beats.map(b => Math.round(Math.max(0.07, b.hold) * 100));
  const secs = plan.reduce((a, b) => a + b, 0) / 100;
  const expect = t.beats.reduce((a, b) => a + b.dur + b.hold, 0);
  const ok = !loop && JSON.stringify(holds) === JSON.stringify(want) && Math.abs(secs - expect) <= 0.07 * t.beats.length;
  if (!ok) bad++;
  const mtime = statSync(file).mtime.toTimeString().slice(0, 5);
  console.log(`${ok ? 'OK ' : 'BAD'} ${path.basename(file).padEnd(26)} ${String(delays.length).padStart(3)} frames, ${secs.toFixed(1).padStart(5)} s (script ${expect.toFixed(1)} s), pauses ${JSON.stringify(holds) === JSON.stringify(want) ? 'match' : `GIF ${holds} vs ${want}`}, ${loop ? 'LOOPS' : 'plays once'}, written ${mtime}`);
}
console.log(bad ? `${bad} GIF(s) out of step` : `all ${timing.length} GIFs match the current script`);
process.exit(bad ? 1 : 0);
