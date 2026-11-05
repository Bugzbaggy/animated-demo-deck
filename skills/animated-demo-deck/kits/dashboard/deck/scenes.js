/* scenes.js, Dashboard kit: one ops screen whose tiles update as a timeline needle moves.
   Three example slides that use every helper and verb, on one made-up story (a checkout slows down after a
   release); every name and number in them is an example. Copy the kit, keep the helpers (top half),
   replace the scenes (bottom half). Every frame is a pure function of time: schedule everything
   through A.* in build(); no timers, no Date, no Math.random. */
(function () {
  'use strict';

  // ================================================================ helpers (keep)
  const CAP = '<div class="captions"></div>';
  const lerp = (a, b, p) => a + (b - a) * p;
  const pad2 = n => String(n).padStart(2, '0');
  // times: 'HH:MM' or 'HH:MM:SS' <-> seconds since midnight
  const toSec = t => { const [h, m, s = 0] = t.split(':').map(Number); return h * 3600 + m * 60 + s; };
  const fmtHM = sec => `${pad2(Math.floor(sec / 3600))}:${pad2(Math.floor(sec / 60) % 60)}`;
  const fmtHMS = sec => `${fmtHM(sec)}:${pad2(Math.floor(sec) % 60)}`;

  // ---- the screen chrome
  const topbar = (name, sub, range, clock = '00:00:00') => `<div class="topbar"><div class="tb-name"><span class="dot"></span>${name}</div><div class="tb-sub">${sub}</div>
    <div class="tb-range">${range}</div><div class="tb-clock num">${clock}</div></div>`;
  const H = (kicker, title, sub) => `<div class="hd"><div class="kicker">${kicker}</div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;

  // ---- tiles and what goes in them
  const tile = (cls, x, y, w, h, title, html) => `<div class="tile ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="tt">${title}</div><div class="body">${html}</div></div>`;
  const kpi = (value, unit = '', sub = '', cls = '') => `<div class="kpi ${cls.includes('sm') ? 'sm' : ''}"><span class="kv num ${cls.replace('sm', '')}">${value}</span>${unit ? `<span class="ku">${unit}</span>` : ''}${sub ? `<div class="ks">${sub}</div>` : ''}</div>`;
  const pill = (state, text) => `<span class="pill ${state}">${text}</span>`;
  // A sparkline from numbers: polyline.draw (A.draw draws it), a faint area under it, a dot on the last point.
  // range = [min, max] fixes the scale; without it the line spans its own min..max, so small noise fills the tile.
  // Bring the area in with A.tween(sel + ' .fill', o, d, { opacity: [0, 0.12] }), not A.fade, which ends at 1.
  const spark = (cls, points, w = 300, h = 80, pad = 6, range = null) => {
    const [min, max] = range || [Math.min(...points), Math.max(...points)], span = max - min || 1;
    const pts = points.map((v, i) => [pad + (i / (points.length - 1)) * (w - 2 * pad), h - pad - ((v - min) / span) * (h - 2 * pad)]);
    const str = pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
    const [lx, ly] = pts[pts.length - 1];
    return `<svg class="spark ${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path class="fill" d="M${pts[0][0]},${h} L${str.replace(/ /g, ' L')} L${lx},${h} Z"/><polyline class="draw" points="${str}"/><circle class="last" cx="${lx}" cy="${ly}" r="4.5"/></svg>`;
  };
  // Gauge bar; --fill is 0..1. Pass the resting value for a static gauge, 0 and animate with A.vars for a live one.
  const gauge = (cls, fill, left = '', right = '') => `<div class="gauge ${cls}" style="--fill:${fill}"><div class="gf"></div></div>${left || right ? `<div class="gl"><span>${left}</span><span>${right}</span></div>` : ''}`;
  // Arc gauge (3/4 circle); --fill 0..1; the number inside is a separate element you can A.count.
  const arc = (cls, fill, size = 140, value = '', label = '') => {
    const r = (size - 14) / 2, c = size / 2, len = 2 * Math.PI * r * 0.75;
    const p = a => [c + r * Math.cos(a), c + r * Math.sin(a)];
    const [sx, sy] = p(Math.PI * 0.75), [ex, ey] = p(Math.PI * 2.25);
    const d = `M${sx.toFixed(1)},${sy.toFixed(1)} A${r},${r} 0 1 1 ${ex.toFixed(1)},${ey.toFixed(1)}`;
    return `<div class="arcwrap" style="width:${size}px;height:${size}px"><svg class="arc ${cls}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="--arc:${len.toFixed(1)};--fill:${fill}"><path class="bg" d="${d}"/><path class="fg" d="${d}"/></svg><div class="av num">${value}</div><div class="al">${label}</div></div>`;
  };
  const logTile = (cls, x, y, w, h, title, lines) => tile(cls, x, y, w, h, title,
    `<div class="log">${lines.map(([ts, lv, tx]) => `<div class="ln"><span class="ts">${ts}</span><span class="lv ${lv}">${lv}</span><span class="tx">${tx}</span></div>`).join('')}<div class="ln cursor"><span class="cur">▌</span></div></div>`);
  // The rail across the bottom. RAIL.t0..t1 is the time window; tx(t) is a time's x on the stage.
  const RAIL = { x0: 120, x1: 1800, t0: toSec('00:00'), t1: toSec('00:30') };
  const tx = t => RAIL.x0 + ((toSec(t) - RAIL.t0) / (RAIL.t1 - RAIL.t0)) * (RAIL.x1 - RAIL.x0);
  const rail = (events, ticks, at) => `<div class="rail"><div class="rl"></div>
    ${ticks.map(t => `<div class="tick" style="left:${tx(t)}px"><i></i><span>${t}</span></div>`).join('')}
    ${events.map((e, i) => `<div class="ev ${e.state} e${i + 1}" style="left:${tx(e.t)}px"><span>${e.label}</span><i></i><div class="ping"></div></div>`).join('')}
    <div class="needle" style="left:${RAIL.x0}px"><div class="nb num">${at}</div></div></div>`;
  const ring = (cls, x, y) => `<div class="ping free ${cls}" style="left:${x - 20}px;top:${y - 20}px"></div>`;

  // ---- verbs on top of the engine
  // The top-bar clock runs from one time to another over the beat (a function of scene time, like everything else).
  const clock = (A, o, d, from, to) => A.fn('.tb-clock', o, d, (cur, p) => { cur.text = fmtHMS(lerp(toSec(from), toSec(to), p)); });
  // Move the rail needle between two times; its bubble shows the time as it goes. The needle's CSS left is
  // the rail's start, so x is the offset of a time from there; at scene start it sits at `from`.
  const needle = (A, o, d, [from, to]) => {
    A.move('.rail .needle', o, d, { x: [tx(from) - RAIL.x0, tx(to) - RAIL.x0] }, 'inOut');
    A.fn('.rail .needle .nb', o, d, (cur, p) => { cur.text = fmtHM(lerp(toSec(from), toSec(to), p)); }, 'inOut');
  };
  // A ring that grows and fades, n times; hidden before and after (A.fn sets nothing outside its window).
  const ping = (A, sel, o, n = 2, every = 0.55, grow = 2.2) => {
    for (let k = 0; k < n; k++) A.fn(sel, o + k * every, 0.9, (cur, p) => { cur.opacity = 0.9 * (1 - p); cur.scale = 0.5 + grow * p; }, 'out');
  };
  // Change a tile's (or pill's) state class at o: flip(A, '.t1', 2.0, 'crit').
  const STATES = ['ok', 'warn', 'crit', 'info', 'off', 'dim'];
  const flip = (A, sel, o, state) => { STATES.filter(s => s !== state).forEach(s => A.off(sel, o, s)); if (state) A.on(sel, o, state); };
  // Stream a log tile's lines at lps lines per second, then blink its cursor for `blink` seconds.
  const stream = (A, sel, o, lps = 3, blink = 4) => {
    A.show(`${sel} .log .ln:not(.cursor)`, o, 0.3, { dy: 6, stagger: 1 / lps });
    A.fn(`${sel} .log .cursor`, o, blink, (cur, p, local) => { cur.opacity = Math.floor(local * 2.5) % 2 ? 0.15 : 1; });
  };
  // Count a KPI's number up; a plain wrapper so the examples read as one vocabulary.
  const count = (A, sel, o, d, from, to) => A.count(sel, o, d, from, to);

  // ---- the material: a message is one event row, its claims and findings are facts (see the skill's materials.md)
  // One event-log row: time HH:MM:SS, who, a level (CRIT, HIGH, LOW, WARN, OK, DM, INFO), one line (<= 100 chars; it may be the post's own title), a subline (<= 130).
  const LV = { CRIT: 'crit', HIGH: 'crit', LOW: 'warn', WARN: 'warn', OK: 'ok', DM: 'ok' };
  const er = (cls, t, who, lvl, text, sub = '') => `<div class="er ${cls}"><span class="t">${t}</span><span class="w">${who}</span><span>${pill(LV[lvl] || 'info', lvl)}</span><span class="x">${text}${sub ? `<small>${sub}</small>` : ''}</span></div>`;
  // One fact: a label and a value too long for a KPI (a file name, a version), with an optional source line.
  const fact = (cls, label, value, sub = '', tone = '') => `<div class="fact ${cls}"><span class="fk">${label}</span><span class="fv ${tone}">${value}</span>${sub ? `<span class="fs">${sub}</span>` : ''}</div>`;
  // Claimed against measured: rows of [check, claimed, measured, tone]; each row's cells get the class v1, v2, … for fading in.
  const vs = (rows, heads = ['check', 'claimed', 'measured']) => `<div class="vs">${heads.map(h => `<span class="h">${h}</span>`).join('')}${rows.map(([l, a, b, tone = ''], i) => `<span class="l v${i + 1}">${l}</span><span class="a v${i + 1}">${a}</span><span class="b ${tone} v${i + 1}">${b}</span>`).join('')}</div>`;
  // A verbatim line, at most one per message: <span class="quote">…</span> inside any tile (⋯ for a cut).

  // ================================================================ scenes (replace)
  // The example story, made up: a release slows the checkout, the cache hit rate collapses, a rollback ends it.
  // One service's screen; times are UTC; every name and number is an example.
  RAIL.t0 = toSec('09:50'); RAIL.t1 = toSec('10:15');
  const TICKS = ['09:50', '09:55', '10:00', '10:05', '10:10', '10:15'];
  const EVENTS = [
    { t: '09:58:10', label: 'v2.14 out', state: '' },
    { t: '10:02:40', label: 'HIGH alert', state: 'crit' },
    { t: '10:06:30', label: 'rollback', state: 'warn' },
    { t: '10:11:50', label: 'back to 180 ms', state: 'ok' },
  ];
  const TOP = clock => topbar('checkout-api', 'example shop · production · UTC', 'Last 25 min · 09:50 to 10:15', clock);
  const LAT = [180, 176, 182, 175, 179, 181, 178, 180, 177, 180];   // ms, on a 0 to 800 ms scale (the threshold)
  const ERR = [0.2, 0.21, 0.19, 0.2, 0.2, 0.21, 0.2, 0.2, 0.19, 0.2];   // %, on a 0 to 1 % scale
  // The latency and hit-rate tiles on slides 2 and 3: the tile's edge carries the state, which flip() changes.
  const latTile = (state, value) => tile(`${state} t-lat`, 40, 200, 560, 260, 'p95 latency',
    `${kpi(value, "ms", 'threshold 800 ms · metrics, 2-minute steps')}`);
  const hitTile = (state, fill, value) => tile(`${state} t-hit`, 620, 200, 520, 260, 'Cart cache hit rate',
    `<div class="row"><div>${arc('', fill, 170, value, 'hits')}</div><div style="padding-bottom:14px">${kpi('94', '%', 'before 09:58 · cachectl stats, 4-minute windows', 'sm')}</div></div>`);

  // ---- 1. screen: the screen comes up, numbers count, sparklines draw, a "latest" tile
  Deck.add({
    id: 'screen', title: 'One service, one screen',
    html: `
      ${TOP('09:50:00')}
      ${H('Dashboard kit · example 1 of 3', 'One service, one screen', 'Latency, the cache in front of it, and errors. Every tile has a number, a state and a source.')}
      ${tile('ok t-lat', 40, 200, 560, 300, `p95 latency ${pill('ok', 'normal')}`, `${kpi('0', "ms", 'threshold 800 ms · metrics, 2-minute steps', 'ok')}<div style="margin-top:14px">${spark('ok', LAT, 500, 90, 6, [0, 800])}</div>`)}
      ${tile('ok t-hit', 620, 200, 520, 300, `Cart cache hit rate ${pill('ok', 'normal')}`, `<div class="row"><div>${arc('ok', 0, 190, '0%', 'hits')}</div><div style="padding-bottom:18px"><div class="ks" style="font:400 14px/1.35 var(--sans);color:var(--muted)">cachectl stats,<br>4-minute windows</div></div></div>`)}
      ${tile('ok t-err', 1160, 200, 720, 300, `Error rate ${pill('ok', 'flat')}`, `${kpi('0.2', '%', 'share of checkout calls that failed', 'ok')}<div style="margin-top:14px">${spark('ok', ERR, 660, 90, 6, [0, 1])}</div>`)}
      ${tile('info t-latest', 40, 530, 1840, 200, `Latest ${pill('info', 'no open alerts')}`, `<div class="facts">
        ${fact('f1', 'live version', 'v2.13', 'since 10 Mar 16:20 UTC · deployctl history')}
        ${fact('f2', 'open alerts', '0', 'alertbot · #checkout')}</div>`)}
      ${rail(EVENTS, TICKS, '09:50')}
      ${CAP}`,
    build(tl) {
      tl.beat('up', 3.6, A => {
        clock(A, 0, 3.6, '09:50:00', '09:50:04');
        A.fade('.topbar', 0, 0.4);
        A.show('.hd', 0.2, 0.5, { dy: 10 });
        A.show('.t-lat, .t-hit, .t-err', 0.6, 0.45, { dy: 14, stagger: 0.25 });
        A.fade('.rail', 1.7, 0.5);
        A.pop('.rail .ev', 2.1, 0.4, 0.2);
      }, 'checkout-api: <b>all tiles ok</b> · the rail covers 09:50 to 10:15');
      tl.beat('numbers', 4.0, A => {
        clock(A, 0, 4.0, '09:50:04', '09:50:08');
        count(A, '.t-lat .kv', 0.1, 1.4, 0, 180);
        A.draw('.t-lat .spark polyline', 0.3, 1.4);
        A.tween('.t-lat .spark .fill', 1.6, 0.4, { opacity: [0, 0.12] });
        A.fade('.t-lat .spark .last', 1.6, 0.4);
        A.vars('.t-hit .arc', 0.6, 1.8, { '--fill': [0, 0.94] }, 'out');
        A.fn('.t-hit .arcwrap .av', 0.6, 1.8, (cur, p) => { cur.text = Math.round(p * 94) + '%'; }, 'out');
        A.draw('.t-err .spark polyline', 1.2, 1.4);
        A.tween('.t-err .spark .fill', 2.5, 0.4, { opacity: [0, 0.12] });
        A.fade('.t-err .spark .last', 2.5, 0.4);
      }, '09:50: <b>p95 180 ms · hit rate 94% · errors 0.2%</b>');
      tl.beat('latest', 3.0, A => {
        clock(A, 0, 3.0, '09:50:08', '09:50:11');
        A.show('.t-latest', 0.1, 0.5, { dy: 14 });
        A.fade('.t-latest .fact', 0.6, 0.4, 0.3);
      }, 'Latest: <b>v2.13 since 10 Mar</b> · no open alerts');
    },
  });

  // ---- 2. incident: the needle moves, an event pings, tiles flip, rows land in the event log, claimed against measured
  Deck.add({
    id: 'incident', title: 'The needle reaches the alert',
    html: `
      <style>#scene-incident .vs { grid-template-columns: 1fr 140px 200px; }</style>
      ${TOP('09:50:11')}
      ${H('Dashboard kit · example 2 of 3', 'The needle moves, the tiles react', 'Each event on the rail changes a tile above it.')}
      ${latTile('ok', '180')}
      ${hitTile('ok', 0.94, '94%')}
      ${tile('info t-quote', 1160, 200, 720, 260, `On-call reply · 10:04:05 ${pill('info', 'in thread')}`,
        '<div style="margin-top:16px"><span class="quote">Cache hit rate fell from 94% to 12% at 09:58, right after v2.14.</span></div>')}
      ${tile('t-log', 40, 490, 1100, 310, 'Event log · #checkout', `<div class="elog">
        ${er('e1', '09:58:10', 'release lead', 'INFO', 'v2.14 rolled out', 'deployctl · 6 pods')}
        ${er('e2 crit', '10:02:40', 'alertbot', 'HIGH', '[HIGH] checkout-api p95 latency 2,400 ms (threshold 800 ms)', 'the post also says: error rate rising')}
        ${er('e3', '10:04:05', 'on-call engineer', 'INFO', 'reply: the cache, not the database', 'in thread · 85 s after the alert')}</div>`)}
      ${tile('t-vs', 1160, 490, 720, 310, `Claimed against measured ${pill('ok', 'measured')}`, vs([
        ['error rate', 'rising', '0.2 %, flat'],
        ['p95 latency', '2,400 ms', '2,400 ms', 'warn'],
      ]))}
      ${rail(EVENTS, TICKS, '09:50')}
      ${CAP}`,
    build(tl) {
      tl.beat('deploy', 3.8, A => {
        A.fade('.topbar, .hd, .t-lat, .t-hit, .rail', 0, 0.3);
        clock(A, 0, 3.8, '09:50:11', '09:58:10');
        needle(A, 0.3, 2.2, ['09:50', '09:58:10']);
        ping(A, '.rail .e1 .ping', 2.5, 2);
        A.show('.t-log', 2.6, 0.5, { dy: 12 });
        A.show('.er.e1', 3.0, 0.4, { dy: 8 });
      }, '09:58:10: <b>v2.14 rolled out</b> · every tile still ok');
      tl.beat('alert', 4.6, A => {
        clock(A, 0, 4.6, '09:58:10', '10:02:40');
        needle(A, 0.1, 1.8, ['09:58:10', '10:02:40']);
        A.vars('.t-hit .arc', 0.3, 1.6, { '--fill': [0.94, 0.12] }, 'inOut');
        A.fn('.t-hit .arcwrap .av', 0.3, 1.6, (cur, p) => { cur.text = Math.round(94 - p * 82) + '%'; }, 'inOut');
        flip(A, '.t-hit', 1.9, 'crit');
        ping(A, '.rail .e2 .ping', 2.0, 2);
        count(A, '.t-lat .kv', 2.0, 1.2, 180, 2400);
        flip(A, '.t-lat', 2.4, 'crit');
        A.show('.er.e2', 3.0, 0.4, { dy: 8 });
      }, '10:02:40: <b>p95 2,400 ms</b> · hit rate 12% · the alert fires');
      tl.beat('reply', 4.6, A => {
        clock(A, 0, 4.6, '10:02:40', '10:04:05');
        A.show('.er.e3', 0.2, 0.4, { dy: 8 });
        A.show('.t-quote', 0.8, 0.5, { dy: 12 });
        A.show('.t-vs', 1.8, 0.5, { dy: 12 });
        A.fade('.t-vs .v1', 2.4, 0.4);
        A.fade('.t-vs .v2', 3.2, 0.4);
      }, '10:04:05: <b>the cache, not the database</b> · errors 0.2%, flat');
    },
  });

  // ---- 3. recovery: a gauge fills, numbers count back down, tiles flip to ok, the closing numbers
  Deck.add({
    id: 'recovery', title: 'Rollback, then the close',
    html: `
      ${TOP('10:04:05')}
      ${H('Dashboard kit · example 3 of 3', 'Rollback, then the close', 'The needle runs to the all-clear, and the tiles flip back.')}
      ${latTile('crit', '2,400')}
      ${hitTile('crit', 0.12, '12%')}
      ${tile('warn t-roll', 1160, 200, 720, 260, 'Rollback · v2.13 · pods on the old version', `
        <div style="margin-top:12px">${gauge('ok', 0, '0 pods', '6 pods')}</div>
        <div class="facts">${fact('r1', 'started', '10:06:30', 'deployctl rollback')}${fact('r2', 'all pods on v2.13', '10:07:05', 'deployctl')}</div>`)}
      ${tile('accent close', 40, 520, 1840, 220, 'What the morning measured', `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:8px">
          <div class="k k1">${kpi('0', 's', 'from the deploy (09:58:10) to the alert (10:02:40)', 'accent')}</div>
          <div class="k k2">${kpi('0', 's', 'from the alert to the first lead in the thread (10:04:05)', 'accent')}</div>
          <div class="k k3">${kpi('0', 's', 'from the alert to the all-clear (10:11:50)', 'accent')}</div>
          <div class="k k4">${kpi('0.2', '%', 'errors, all morning: the alert’s “rising” was never measured', 'ok')}</div>
        </div>`)}
      ${rail(EVENTS, TICKS, '10:04')}
      ${CAP}`,
    build(tl) {
      tl.beat('rollback', 4.2, A => {
        A.fade('.topbar, .hd, .t-lat, .t-hit, .rail', 0, 0.3);
        clock(A, 0, 4.2, '10:04:05', '10:07:05');
        needle(A, 0.2, 1.6, ['10:04:05', '10:06:30']);
        ping(A, '.rail .e3 .ping', 1.8, 2);
        A.show('.t-roll', 1.9, 0.5, { dy: 12 });
        A.vars('.t-roll .gauge', 2.3, 1.2, { '--fill': [0, 1] }, 'inOut');
        A.fade('.t-roll .fact', 2.4, 0.4, 0.6);
        flip(A, '.t-roll', 3.6, 'ok');
      }, '10:06:30: <b>rollback to v2.13</b> · 6/6 pods by 10:07:05');
      tl.beat('clear', 4.4, A => {
        clock(A, 0, 4.4, '10:07:05', '10:11:50');
        needle(A, 0.1, 1.8, ['10:06:30', '10:11:50']);
        count(A, '.t-lat .kv', 0.4, 1.6, 2400, 180);
        A.vars('.t-hit .arc', 0.4, 1.6, { '--fill': [0.12, 0.93] }, 'inOut');
        A.fn('.t-hit .arcwrap .av', 0.4, 1.6, (cur, p) => { cur.text = Math.round(12 + p * 81) + '%'; }, 'inOut');
        ping(A, '.rail .e4 .ping', 2.0, 2);
        flip(A, '.t-lat', 2.2, 'ok');
        flip(A, '.t-hit', 2.2, 'ok');
      }, '10:11:50: <b>p95 180 ms</b> · hit rate back to 93%');
      tl.beat('close', 4.4, A => {
        clock(A, 0, 4.4, '10:11:50', '10:15:00');
        needle(A, 0, 1.4, ['10:11:50', '10:15']);
        A.show('.close', 0.3, 0.5, { dy: 14 });
        count(A, '.k1 .kv', 0.9, 1.4, 0, 270);
        count(A, '.k2 .kv', 1.2, 1.4, 0, 85);
        count(A, '.k3 .kv', 1.5, 1.4, 0, 550);
        A.pop('.k4 .kv', 2.8, 0.5);
      }, 'Measured: <b>270 s · 85 s · 550 s</b> · each the gap between two times');
    },
  });
})();
