/* scenes.js, Console kit: one terminal session that runs through the whole talk.
   Three example slides that use every helper, on one made-up story (a checkout slows down after a release);
   every command, host and number in them is an example. Copy the kit, keep the helpers (top half),
   replace the scenes (bottom half). Every frame is a pure function of time: schedule
   everything through A.* in build(); no timers, no Date, no Math.random. */
(function () {
  'use strict';

  // ================================================================ helpers (keep)
  const CAP = '<div class="captions"></div>';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const H = (kick, title, sub, tags = []) => `<header class="hd"><div class="kick">${kick}</div><h1 class="title">${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}
    ${tags.length ? `<div class="tags">${tags.map(([t, c = '']) => `<span class="tag ${c}">${t}</span>`).join('')}</div>` : ''}</header>`;

  // ---- lines. Each is one .ln; cls names it for the timeline (l1, l2, ...). Text is escaped; wrap html in raw().
  const raw = html => ({ html });
  const txt = t => (t && t.html !== undefined) ? t.html : esc(t);
  const ln = (kind, cls, html) => `<div class="ln ${kind} ${cls}">${html}</div>`;
  const cmd = (cls, text, prompt = '$') => ln('cmd', cls, `<span class="pr${prompt === '$' ? '' : ' ps'}">${esc(prompt)}</span> <span class="tx">${txt(text)}</span>`);
  const out = (cls, text) => ln('out', cls, txt(text));
  const dim = (cls, text) => ln('dim', cls, txt(text));
  const ok = (cls, text) => ln('ok', cls, txt(text));
  const warn = (cls, text) => ln('warn', cls, txt(text));
  const err = (cls, text) => ln('err', cls, txt(text));
  const info = (cls, text) => ln('info', cls, txt(text));
  const add = (cls, text) => ln('add', cls, '+ ' + txt(text));
  const del = (cls, text) => ln('del', cls, '- ' + txt(text));
  // A tool call: → name args … 0.8 s
  const call = (cls, name, args, ms = '') => ln('out', cls, `<span class="muted">→</span> <span class="call">${esc(name)}</span> <span class="arg">${esc(args)}</span>${ms ? ` <span class="ms">${esc(ms)}</span>` : ''}`);
  // JSON, one .ln per text line, coloured keys/strings/numbers/booleans. Lines whose key is in markKeys get .mark (for hl()).
  const hiJson = s => esc(s).replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:').replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>')
    .replace(/: (-?\d[\d.]*)/g, ': <span class="n">$1</span>').replace(/: (true|false|null)/g, ': <span class="b">$1</span>');
  const json = (cls, obj, markKeys = []) => JSON.stringify(obj, null, 2).split('\n')
    .map(line => { const m = line.match(/^\s*"([^"]+)":/); const mk = m && markKeys.includes(m[1]); return ln(`json${mk ? ' mark' : ''}`, `${cls}${mk ? ` ${cls}-${m[1]}` : ''}`, hiJson(line)); }).join('');
  // A line with a spinner in front (spin() turns it), and a prompt line with a block cursor (cursor() blinks it).
  const spinner = (cls, text) => ln('out', cls, `<span class="spin"></span> ${txt(text)}`);
  const prompt = (cls, p = '$') => ln('cmd', cls, `<span class="pr">${esc(p)}</span> <span class="cur"></span>`);

  // ---- a pane, tmux-style. Sized through --w/--h so split() can resize it. opts: { tag, static, focus, size: 'lg' | 'sm' }
  const pane = (cls, x, y, w, h, title, lines, { tag = '', static: st = false, focus = false, size = '' } = {}) => `
    <div class="pane ${cls}${st ? ' static' : ''}${focus ? ' focus' : ''}${size ? ' ' + size : ''}" style="left:${x}px;top:${y}px;--w:${w};--h:${h}">
      <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="pt">${title}</span>${tag ? `<span class="tag">${tag}</span>` : ''}</div>
      <div class="body"><div class="lines">${lines.join('')}</div></div>
    </div>`;
  const card = (cls, x, y, w, title, html) => `<div class="card ${cls}" style="left:${x}px;top:${y}px;width:${w}px"><div class="ct">${title}</div>${html}</div>`;
  const kpi = (cls, x, y, value, label) => `<div class="kpi ${cls}" style="left:${x}px;top:${y}px"><div class="kv">${value}</div><div class="kl">${label}</div></div>`;
  const svg = inner => `<svg class="overlay">${inner}</svg>`;
  const path = (cls, d, ink = '') => `<path class="ink draw ${ink} ${cls}" d="${d}"/>`;

  // ---- verbs (all pure functions of time, built on the engine's A.*)
  // Reveal lines one after another at lps lines per second. Pass n (the number of lines) to get the time the last one is on.
  const stream = (A, sel, o = 0, lps = 6, n = 1) => { A.on(sel, o, 'on', 1 / lps); return o + Math.max(0, n - 1) / lps; };
  // Show a command line and type its text with the caret. Returns the seconds the typing takes.
  const typeCmd = (A, sel, o = 0, cps = 28) => { A.on(sel, o, 'on'); return A.type(`${sel} .tx`, o, cps); };
  // Blink a block cursor (.cur) for d seconds, then leave it on. Pure: on for the even half-seconds, off for the odd ones.
  const cursor = (A, sel, o = 0, d = 2) => A.fn(sel, o, d, (cur, p, local) => { cur['--on'] = local >= d ? 1 : (Math.floor(local * 2) % 2 === 0 ? 1 : 0); });
  const cursorOff = (A, sel, o = 0) => A.tween(sel, o, 0, { opacity: [null, 0] });
  // Turn a spinner (.spin) for d seconds, then show the done glyph in green. The glyph is a CSS variable, so seeking back resets it.
  const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const spin = (A, sel, o = 0, d = 1.5, done = '✓') => A.fn(sel, o, d + 0.001, (cur, p, local) => {
    const over = local >= d; cur['--g'] = `"${over ? done : FRAMES[Math.floor(local * 10) % 10]}"`; cur['.done'] = over ? 1 : 0;
  });
  // Scroll a pane's lines up to px (from the current position unless from is given).
  const tail = (A, sel, o, d, to, from = null) => A.move(`${sel} .lines`, o, d, { y: [from, -to] });
  // Resize a pane: { w: [from, to], h: [from, to] } in px.
  const split = (A, sel, o, d, { w, h } = {}) => { const v = {}; if (w) v['--w'] = w; if (h) v['--h'] = h; A.vars(sel, o, d, v, 'inOut'); };
  // Highlight a .ln.mark line with the coloured bar.
  const hl = (A, sel, o = 0, d = 0.5) => A.mark(sel, o, d);

  // ================================================================ scenes (replace)
  // The example story, made up: a release slows the checkout, the on-call engineer finds the cache key, a rollback
  // fixes it. One terminal session; times are UTC; the commands, hosts and numbers are examples.

  // ---- 1. deploys: a command is typed, its output streams, a computed interval is a comment
  Deck.add({
    id: 'deploys', title: 'What changed at 09:58',
    html: `
      ${H('Console kit · example 1 of 3', 'What changed at 09:58', 'The last two deploys, then the latency around them. Output as printed; the one number worked out is a # comment.', [['example run', ''], ['UTC', 'blue']])}
      ${pane('p1', 72, 200, 1776, 760, '<b>shell</b> · on-call laptop', [
        prompt('l0'),
        cmd('l1', 'deployctl history checkout-api --last 2'),
        out('l2', 'VERSION  ROLLED OUT (UTC)      BY            STATUS'),
        out('l3 mark', 'v2.14    2026-03-12 09:58:10   release-lead  live'),
        dim('l4', 'v2.13    2026-03-10 16:20:42   release-lead  replaced'),
        cmd('l5', "metrics query 'p95(checkout_latency_ms)' --from 09:50 --to 10:04 --step 2m"),
        out('l6', '09:50    180 ms'),
        out('l7', '09:54    175 ms'),
        out('l8', '09:58    190 ms'),
        out('l9', '10:00  1,950 ms'),
        out('l10 mark red', '10:02  2,400 ms'),
        out('l11', '10:04  2,380 ms'),
        dim('l12 mark amber', '# deploy 09:58:10 → alert 10:02:40 = 270 s'),
      ], { focus: true, size: 'lg' })}
      ${CAP}`,
    build(tl) {
      tl.beat('history', 4.8, A => {
        A.fade('.hd', 0, 0.5);
        A.show('.p1', 0.2, 0.5, { dy: 20 });
        A.on('.l0', 0.6, 'on');
        cursor(A, '.l0 .cur', 0.6, 1.2);
        A.off('.l0', 1.8, 'on');
        const t = typeCmd(A, '.l1', 1.8, 30);
        stream(A, '.l2, .l3, .l4', 1.8 + t + 0.3, 5, 3);
        hl(A, '.l3', 1.8 + t + 1.0, 0.5);
      }, 'deployctl history checkout-api → <b>v2.14 rolled out at 09:58:10</b>');
      tl.beat('latency', 5.0, A => {
        const t = typeCmd(A, '.l5', 0.1, 34);
        stream(A, '.l6, .l7, .l8, .l9, .l10, .l11', 0.1 + t + 0.3, 4, 6);
        hl(A, '.l10', 0.1 + t + 2.0, 0.5);
      }, 'metrics query p95 → <b>190 ms at 09:58, 2,400 ms at 10:02</b>');
      tl.beat('gap', 2.6, A => {
        A.on('.l12', 0.2, 'on');
        hl(A, '.l12', 0.6, 0.6);
      }, '# deploy 09:58:10 → alert 10:02:40 → <b>270 s</b>, worked out, not printed');
    },
  });

  // ---- 2. cache: a table, then the shell steps aside for a diff pane, and one note
  Deck.add({
    id: 'cache', title: 'One key per session',
    html: `
      ${H('Console kit · example 2 of 3', 'One key per session', 'The cart cache before and after 09:58, then the diff that explains it.', [['example run', '']])}
      ${pane('p1', 72, 200, 1776, 760, '<b>shell</b> · on-call laptop', [
        cmd('c1', 'cachectl stats cart --from 09:50 --to 10:04 --step 4m'),
        out('c2', 'WINDOW         HITS     MISSES   HIT RATE'),
        out('c3', '09:50-09:54    18,412    1,130   94%'),
        out('c4', '09:54-09:58    18,077    1,201   94%'),
        out('c5 mark red', '09:58-10:02     2,310   16,944   12%'),
        out('c6', '10:02-10:04     1,148    8,420   12%'),
      ], { focus: true })}
      ${pane('p2', 968, 200, 880, 500, '<b>diff</b> · src/cart/cache.ts', [
        cmd('e0', 'git diff v2.13 v2.14 -- src/cart/cache.ts'),
        dim('e1', '@@ function cartCacheKey(cart, session) @@'),
        del('e2', 'return `cart:${cart.id}`;'),
        add('e3 mark green', 'return `cart:${cart.id}:${session.id}`;'),
      ], { tag: 'v2.13 → v2.14' })}
      ${card('n1 amber', 968, 740, 880, 'One key per session', 'v2.14 made the key <span class="mono">cart + session</span>, so every visitor started with an empty cache.')}
      ${CAP}`,
    build(tl) {
      tl.beat('stats', 4.6, A => {
        A.fade('.hd', 0, 0.5);
        A.show('.p1', 0.2, 0.5, { dy: 20 });
        const t = typeCmd(A, '.c1', 0.7, 32);
        stream(A, '.c2, .c3, .c4, .c5, .c6', 0.7 + t + 0.3, 4, 5);
        hl(A, '.c5', 0.7 + t + 1.6, 0.5);
      }, 'cachectl stats cart → <b>hit rate 94% → 12% from 09:58</b>');
      tl.beat('diff', 4.8, A => {
        split(A, '.p1', 0.1, 1.1, { w: [1776, 860] });
        A.show('.p2', 0.9, 0.5, { dx: 30, dy: 0 });
        const t = typeCmd(A, '.e0', 1.5, 34);
        stream(A, '.e1, .e2, .e3', 1.5 + t + 0.3, 3, 3);
        hl(A, '.e3', 1.5 + t + 1.4, 0.5);
      }, 'git diff v2.13 v2.14 → <b>the key now ends in the session id</b>');
      tl.beat('note', 2.4, A => {
        A.show('.n1', 0.2, 0.5, { dy: 16 });
      }, 'note → <b>one key per session: every visitor starts empty</b>');
    },
  });

  // ---- 3. rollback: a spinner turns to ✓, the latency falls, three numbers to close, then the prompt
  Deck.add({
    id: 'rollback', title: 'Roll back, then measure',
    html: `
      ${H('Console kit · example 3 of 3', 'Roll back, then measure', 'The rollback, the same latency query again, and the three numbers to remember.', [['example run', '']])}
      ${pane('p1', 72, 200, 1120, 760, '<b>shell</b> · on-call laptop', [
        cmd('r1', 'deployctl rollback checkout-api --to v2.13'),
        spinner('r2', 'rolling back checkout-api to v2.13 (6 pods)'),
        ok('r3', 'done 10:06:30 → 10:07:05 · 6/6 pods on v2.13'),
        cmd('r4', "metrics query 'p95(checkout_latency_ms)' --from 10:06 --to 10:12 --step 2m"),
        out('r5', '10:06  2,350 ms'),
        out('r6', '10:08    640 ms'),
        out('r7', '10:10    210 ms'),
        out('r8 mark green', '10:12    180 ms'),
        dim('r9 mark amber', '# alert 10:02:40 → OK post 10:11:50 = 550 s'),
        prompt('r10'),
      ], { focus: true })}
      ${kpi('k1', 1262, 260, '270 s', 'from the deploy to the alert')}
      ${kpi('k2', 1262, 470, '12%', 'cart cache hit rate after 09:58')}
      ${kpi('k3', 1262, 680, '550 s', 'from the alert to 180 ms again')}
      ${svg(path('a1', 'M1192,700 C1214,700 1226,718 1250,718', 'green'))}
      ${CAP}`,
    build(tl) {
      tl.beat('rollback', 4.4, A => {
        A.fade('.hd', 0, 0.5);
        A.show('.p1', 0.2, 0.5, { dy: 20 });
        const t = typeCmd(A, '.r1', 0.7, 32);
        A.on('.r2', 0.7 + t + 0.3, 'on');
        spin(A, '.r2 .spin', 0.7 + t + 0.3, 1.4);
        A.on('.r3', 0.7 + t + 1.9, 'on');
      }, 'deployctl rollback --to v2.13 → <b>6/6 pods on v2.13 at 10:07:05</b>');
      tl.beat('recover', 5.0, A => {
        const t = typeCmd(A, '.r4', 0.1, 34);
        stream(A, '.r5, .r6, .r7, .r8', 0.1 + t + 0.3, 3, 4);
        hl(A, '.r8', 0.1 + t + 1.6, 0.5);
      }, 'metrics query p95 → <b>2,350 ms down to 180 ms by 10:12</b>');
      tl.beat('close', 4.0, A => {
        A.on('.r9', 0.1, 'on');
        hl(A, '.r9', 0.4, 0.5);
        A.show('.kpi', 0.8, 0.5, { dy: 14, stagger: 0.3 });
        A.draw('.a1', 1.9, 0.5);
        A.on('.r10', 2.4, 'on');
        cursor(A, '.r10 .cur', 2.4, 1.6);
      }, '# alert 10:02:40 → OK 10:11:50 → <b>550 s</b> · 270 s · 12%');
    },
  });
})();
