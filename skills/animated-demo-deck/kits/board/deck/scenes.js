/* scenes.js, Board kit: one big whiteboard, the camera pans and zooms between regions.
   Three example slides that use every helper, on one made-up story (a checkout slows down after a release);
   every name and number in them is an example. Copy the kit, keep the helpers (top half),
   replace the regions and scenes (bottom half). Every frame is a pure function of time:
   schedule everything through A.* in build(); no timers, no Date, no Math.random. */
(function () {
  'use strict';

  // ================================================================ helpers (keep)
  // ---- geometry. Regions are 1920x1080 cells on the board; cell(c, r) is a cell's origin.
  const RW = 1920, RH = 1080, GAP = 260;
  const cell = (c, r) => ({ x: c * (RW + GAP), y: r * (RH + GAP) });
  // The engine moves .cam with translate(x, y) scale(s) from origin 0 0, so a board point P lands at s*P + (x, y).
  const view = (at, s = 1) => ({ x: -at.x * s, y: -at.y * s, scale: s });                         // this region fills the stage
  const zoom = (at, px, py, s) => ({ x: 960 - (at.x + px) * s, y: 540 - (at.y + py) * s, scale: s }); // board point (px, py) of a region at stage centre
  const overview = (cols, rows, pad = 0.9) => {
    const W = cols * RW + (cols - 1) * GAP, Hh = rows * RH + (rows - 1) * GAP, s = Math.min(1920 / W, 1080 / Hh) * pad;
    return { x: (1920 - W * s) / 2, y: (1080 - Hh * s) / 2, scale: s };
  };
  // Camera: fly between two views, or park on one at the start of a scene.
  const fly = (A, from, to, o = 0, d = 1.4, ease = 'inOut') => A.move('.cam', o, d, { x: [from.x, to.x], y: [from.y, to.y], scale: [from.scale, to.scale] }, ease);
  const park = (A, v) => A.move('.cam', 0, 0, { x: [v.x, v.x], y: [v.y, v.y], scale: [v.scale, v.scale] });
  // Camera hop: from one view to another, zooming out on the way (dip 0 = a straight pan). The view centre moves in
  // a straight line across the board while the scale dips, so the neighbouring regions pass by. Use it between slides;
  // use fly() to lean in on a detail inside one region.
  const hop = (A, from, to, o = 0, d = 1.6, dip = 0.35) => {
    const c0 = { x: (960 - from.x) / from.scale, y: (540 - from.y) / from.scale };
    const c1 = { x: (960 - to.x) / to.scale, y: (540 - to.y) / to.scale };
    park(A, from);
    A.fn('.cam', o, d, (cur, p) => {
      const s = (from.scale + (to.scale - from.scale) * p) * (1 - dip * Math.sin(Math.PI * p));
      cur.x = 960 - (c0.x + (c1.x - c0.x) * p) * s;
      cur.y = 540 - (c0.y + (c1.y - c0.y) * p) * s;
      cur.scale = s;
    }, 'inOut');
  };
  // Scope a selector to the live region, so .n1 never matches the same class in a done or future region.
  const $ = sel => sel.split(',').map(s => '.region.live ' + s.trim()).join(', ');

  // ---- the board: every region, with the ones before the active one drawn as done and the ones after as faint "future".
  const board = (regions, activeId, cols) => {
    const k = regions.findIndex(r => r.id === activeId);
    if (k < 0) throw new Error(`board: no region ${activeId}`);
    const inner = regions.map((r, i) => `<div class="region r-${r.id} ${i < k ? 'done' : i > k ? 'future' : 'live'}" style="left:${r.at.x}px;top:${r.at.y}px">${r.html()}</div>`).join('');
    const mini = `<div class="minimap" style="grid-template-columns:repeat(${cols},22px)">${regions.map((r, i) => `<i class="${i < k ? 'done' : i === k ? 'now' : ''}"></i>`).join('')}</div>`;
    return `<div class="cam">${inner}</div>${mini}`;
  };

  // ---- hand-drawn strokes (SVG). Seeded jitter, so the same call always draws the same line.
  const rnd = seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const fmtPt = p => p.map(v => (+v).toFixed(1)).join(',');
  // A line from (x1,y1) to (x2,y2); bend bows it sideways by that many px at the middle.
  const stroke = (x1, y1, x2, y2, { bend = 0, seed = 1, amp = 1.8, n = 8 } = {}) => {
    const r = rnd(seed), dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, b = bend * Math.sin(Math.PI * t), j = i === 0 || i === n ? 0 : amp;
      pts.push([x1 + dx * t + nx * b + (r() * 2 - 1) * j, y1 + dy * t + ny * b + (r() * 2 - 1) * j]);
    }
    return 'M' + pts.map(fmtPt).join(' L');
  };
  const headAt = (x1, y1, x2, y2, bend, size) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, b = bend * Math.sin(Math.PI * 0.9);
    const px = x1 + dx * 0.9 + nx * b, py = y1 + dy * 0.9 + ny * b, a = Math.atan2(y2 - py, x2 - px);
    const l = [x2 - size * Math.cos(a - 0.5), y2 - size * Math.sin(a - 0.5)], rr = [x2 - size * Math.cos(a + 0.5), y2 - size * Math.sin(a + 0.5)];
    return `M${fmtPt(l)} L${x2},${y2} L${fmtPt(rr)}`;
  };
  // Two paths with the same class, so A.draw(cls) draws the shaft and the head together. Extra classes: blue, red, green, amber, pencil, thick, thin.
  const arrow = (cls, x1, y1, x2, y2, { bend = 0, seed = 1, size = 18, ink = '' } = {}) =>
    `<path class="ink draw ${ink} ${cls}" d="${stroke(x1, y1, x2, y2, { bend, seed })}"/><path class="ink draw ${ink} ${cls}" d="${headAt(x1, y1, x2, y2, bend, size)}"/>`;
  const line = (cls, x1, y1, x2, y2, { bend = 0, seed = 2, ink = '' } = {}) => `<path class="ink draw ${ink} ${cls}" d="${stroke(x1, y1, x2, y2, { bend, seed })}"/>`;
  // A hand-drawn loop around something: 1.08 turns of a jittered ellipse.
  const loop = (cls, cx, cy, rx, ry, { seed = 3, ink = '' } = {}) => {
    const r = rnd(seed), pts = [];
    for (let i = 0; i <= 26; i++) { const a = -0.6 + (i / 24) * Math.PI * 2 * 1.08, k = 1 + (r() * 2 - 1) * 0.035; pts.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]); }
    return `<path class="ink draw ${ink} ${cls}" d="M${pts.map(fmtPt).join(' L')}"/>`;
  };
  const underline = (cls, x1, y, x2, { ink = '', seed = 4 } = {}) => line(cls, x1, y, x2, y + 2, { bend: 3, seed, ink });
  const svg = inner => `<svg class="overlay">${inner}</svg>`;

  // ---- things on the board. The outer div is what the engine moves and fades; .in carries the tilt (--tilt).
  const box = (cls, x, y, w, h, html, tilt = 0) => `<div class="box ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="in" style="--tilt:${tilt}deg">${html}</div></div>`;
  const note = (cls, x, y, html, tilt = -1.6, w = 320) => `<div class="note ${cls}" style="left:${x}px;top:${y}px;width:${w}px"><div class="in" style="--tilt:${tilt}deg">${html}</div></div>`;
  const printout = (cls, x, y, w, h, html, tilt = 0.5) => `<div class="printout ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="in" style="--tilt:${tilt}deg">${html}</div></div>`;
  const text = (cls, x, y, html, w) => `<div class="abs hw ${cls}" style="left:${x}px;top:${y}px;${w ? `width:${w}px;` : ''}">${html}</div>`;
  const title = (kick, t, sub, tags = []) => `<div class="rt"><div class="kick">${kick}</div><h1 class="title wipe">${t}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>
    ${tags.length ? `<div class="tags">${tags.map(([t, c = '']) => `<span class="tag ${c}">${t}</span>`).join('')}</div>` : ''}`;
  const CAP = '<div class="captions"></div>';

  // ---- a chat message on a taped printout (the text as posted). Add people to AV and NAMES.
  const AV = { bot: ['av-bot', 'AB'], oc: ['av-oc', 'OC'] };
  const NAMES = { bot: 'alertbot', oc: 'On-call engineer' };
  const APPS = new Set(['bot']);
  const av = (who, sm = false) => `<div class="sk-av ${AV[who][0]}${sm ? ' sm' : ''}">${AV[who][1]}</div>`;
  const msg = (cls, who, time, body) => `<div class="sk-msg ${cls}">${av(who)}<div>
    <div class="sk-meta"><span class="sk-name">${NAMES[who]}</span>${APPS.has(who) ? '<span class="sk-app">APP</span>' : ''}<span class="sk-time">${time}</span></div>
    <div class="sk-text">${body}</div></div></div>`;
  const bullet = t => `<div class="sk-bul">• ${t}</div>`;
  const code = t => `<span class="sk-code">${t}</span>`;
  const ell = '<span class="sk-ell">⋯</span>';

  // ================================================================ regions and scenes (replace)
  // The example story, made up: a release slows the checkout because of a new cache key; a rollback ends it.
  // Three regions in one row. Times are UTC; names and numbers are examples.
  const COLS = 3, ROWS = 1;
  const AT = { what: cell(0, 0), why: cell(1, 0), fix: cell(2, 0) };
  const REGIONS = [
    { id: 'what', at: AT.what, html: () => `
      ${title('Board kit · example 1 of 3', 'A deploy, then a slow checkout', 'What the alert saw, drawn from left to right.', [['UTC', 'blue']])}
      ${box('', 100, 320, 300, 150, '<h3><span class="num">1</span>v2.14 out</h3><p>09:58</p>', -0.6)}
      ${box('', 520, 320, 300, 150, '<h3><span class="num">2</span>cache misses</h3><p>almost every one</p>', 0.5)}
      ${box('', 940, 320, 300, 150, '<h3><span class="num">3</span>database reads</h3><p>every request</p>', -0.4)}
      ${box('red', 1360, 320, 340, 150, '<h3><span class="num">4</span>p95 2,400 ms</h3><p>10:02</p>', 0.8)}
      ${svg(arrow('a1', 402, 395, 518, 395, { seed: 11 }) + arrow('a2', 822, 395, 938, 395, { seed: 12 }) + arrow('a3', 1242, 395, 1358, 395, { seed: 13, ink: 'red' })
        + arrow('a-fix', 880, 700, 1010, 700, { bend: -18, seed: 14, ink: 'green' }))}
      ${text('lb lb1 pencil small', 410, 345, 'new key')}
      ${text('lb lb2 pencil small', 822, 345, 'each one')}
      ${text('lb lb3 red small', 1262, 345, 'slow')}
      ${printout('po', 110, 590, 760, 170, `<div class="slack">
        ${msg('m1', 'bot', '10:02 AM', `<p>[HIGH] ${code('checkout-api')} p95 latency <b>2,400 ms</b> (threshold 800 ms) · <span class="strike s-claim">error rate rising</span> ${ell}</p>`)}
        <div class="pl">alertbot · 10:02:40 UTC · abridged where ⋯</div></div>`, -0.8)}
      ${text('corr red', 640, 672, '0.2 %, flat')}
      ${note('green n-err', 1030, 610, '<div class="nt green">Measured</div>Errors never rose: <b>0.2 %</b> all morning.', 1.4)}
    ` },
    { id: 'why', at: AT.why, html: () => `
      ${title('Board kit · example 2 of 3', 'One key per session', 'Why the cache stopped working.')}
      ${box('blue', 120, 300, 700, 200, '<h3>before · v2.13</h3><p><span class="mono">cart:{cartId}</span></p><p>one entry, shared by every visitor</p>', -0.5)}
      ${box('red', 1080, 300, 720, 200, '<h3>after · v2.14</h3><p><span class="mono k-new">cart:{cartId}:{sessionId}</span></p><p>one entry per visitor</p>', 0.6)}
      ${svg(arrow('a-ver', 830, 400, 1070, 400, { bend: -24, seed: 21, ink: 'blue' })
        + loop('lp', 1346, 380, 76, 27, { seed: 5, ink: 'red' })
        + underline('ul', 150, 402, 312, { ink: 'blue' }))}
      ${text('lb-ver blue', 900, 340, 'v2.14')}
      ${note('pink n-hit', 160, 660, '<div class="nt red">Hit rate</div><span class="strike s-old">94 %</span> → <b>12 %</b>', -1.8)}
      ${note('n-why', 1100, 660, 'Every visitor starts empty, so <b>every request</b> hits the database.', 1.2, 380)}
    ` },
    { id: 'fix', at: AT.fix, html: () => `
      ${title('Board kit · example 3 of 3', 'Roll back, then guard', 'What ended it, and what comes next.')}
      ${box('green', 120, 330, 420, 170, '<h3>rollback · v2.13</h3><p>10:06</p>', -0.6)}
      ${box('green', 660, 330, 420, 170, '<h3>p95 180 ms</h3><p>10:11</p>', 0.4)}
      ${box('dashed', 1200, 330, 580, 170, '<h3>later</h3><p>review every cache-key change</p>', -0.3)}
      ${svg(arrow('f1', 542, 415, 658, 415, { seed: 31, ink: 'green' }) + arrow('f2', 1082, 415, 1198, 415, { seed: 32, ink: 'pencil' }))}
      ${text('tick t1 green', 470, 292, '✓')}
      ${text('tick t2 green', 1010, 292, '✓')}
      ${text('lb-next pencil small', 1100, 360, 'next')}
      ${note('green n-total', 140, 620, '<div class="nt green">Alert to recovery</div><b>9 min 10 s</b>', -1.4)}
    ` },
  ];

  // ---- 1. what: from the whole board into the first region; boxes, arrows, a taped printout with a struck claim
  Deck.add({
    id: 'what', title: 'A deploy, then a slow checkout',
    html: board(REGIONS, 'what', COLS) + CAP,
    build(tl) {
      const OV = overview(COLS, ROWS), V = view(AT.what);
      tl.beat('fly-in', 3.4, A => {
        fly(A, OV, V, 0.4, 1.6);
        A.fade($('.rt .kick, .tags'), 1.6, 0.4);
        A.wipe($('.title'), 1.8, 1.1);
        A.fade($('.rt .sub'), 2.7, 0.5);
      }, 'a deploy, then a slow checkout');
      tl.beat('chain', 4.2, A => {
        A.show($('.box'), 0.1, 0.5, { dy: 14, stagger: 0.35 });
        A.draw($('.a1'), 0.7, 0.4); A.draw($('.a2'), 1.05, 0.4); A.draw($('.a3'), 1.4, 0.4);
        A.fade($('.lb'), 1.9, 0.4, 0.25);
      }, 'new key → misses → reads → slow');
      tl.beat('claim', 4.6, A => {
        A.show($('.po'), 0.1, 0.6, { dy: 24 });
        A.strike($('.s-claim'), 1.4, 0.5);
        A.fade($('.corr'), 1.9, 0.3);
        A.type($('.corr'), 1.9, 14);
        A.pop($('.n-err'), 3.0, 0.5);
        A.draw($('.a-fix'), 3.5, 0.6);
      }, 'error rate rising? no: 0.2 %, flat');
    },
  });

  // ---- 2. why: hop to the next region; two boxes, a loop, an underline, a struck number on a note
  Deck.add({
    id: 'why', title: 'One key per session',
    html: board(REGIONS, 'why', COLS) + CAP,
    build(tl) {
      tl.beat('hop', 3.8, A => {
        hop(A, view(AT.what), view(AT.why), 0, 1.4);
        A.fade($('.rt .kick'), 1.2, 0.4);
        A.wipe($('.title'), 1.4, 1.0);
        A.fade($('.rt .sub'), 2.2, 0.5);
        A.show($('.box'), 2.4, 0.5, { dy: 14, stagger: 0.4 });
      }, 'the key, before and after');
      tl.beat('circle', 3.6, A => {
        A.draw($('.ul'), 0.2, 0.7);
        A.draw($('.a-ver'), 0.8, 0.7);
        A.fade($('.lb-ver'), 1.3, 0.4);
        A.draw($('.lp'), 1.8, 1.0);
      }, 'the session id makes every key unique');
      tl.beat('notes', 3.6, A => {
        A.pop($('.n-hit'), 0.1, 0.5);
        A.strike($('.s-old'), 0.8, 0.5);
        A.pop($('.n-why'), 1.6, 0.5);
      }, 'hit rate 94 % → 12 %');
    },
  });

  // ---- 3. fix: hop in, ticks, a dashed "later" box, then the camera pulls back to the whole board
  Deck.add({
    id: 'fix', title: 'Roll back, then guard',
    html: board(REGIONS, 'fix', COLS) + CAP,
    build(tl) {
      const V = view(AT.fix);
      tl.beat('hop', 4.0, A => {
        hop(A, view(AT.why), V, 0, 1.4);
        A.fade($('.rt .kick'), 1.2, 0.4);
        A.wipe($('.title'), 1.4, 1.0);
        A.fade($('.rt .sub'), 2.2, 0.5);
        A.show($('.box.green'), 2.3, 0.5, { dy: 14, stagger: 0.4 });
        A.draw($('.f1'), 2.9, 0.4);
        A.pop($('.tick'), 3.2, 0.4, 0.2);
      }, 'rolled back at 10:06, 180 ms by 10:11');
      tl.beat('later', 3.4, A => {
        A.show($('.box.dashed'), 0.1, 0.5, { dy: 14 });
        A.draw($('.f2'), 0.6, 0.5);
        A.fade($('.lb-next'), 1.0, 0.4);
        A.pop($('.n-total'), 1.8, 0.5);
      }, 'the guard is still to build');
      tl.beat('pull-back', 3.0, A => {
        fly(A, V, overview(COLS, ROWS), 0.2, 1.8);
      }, '9 min 10 s from alert to recovery');
    },
  });
})();
