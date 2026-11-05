/* scenes.js, Cards kit: slides, each its own composition, and chat threads replayed as posted.
   Three example slides on one made-up story (a checkout slows down after a release); every name, host and
   number in them is an example. Copy the kit, keep the helpers (top half), replace the scenes (bottom half).
   Every frame is a pure function of time: schedule everything through A.* in build(); no timers, no Date,
   no Math.random. */
(function () {
  'use strict';

  // ================================================================ helpers (keep)
  const CAP = '<div class="captions"></div>';
  const H = (kicker, title, sub, tags = []) => `
    <header class="hd">
      <div class="kicker">${kicker}</div>
      <h1>${title}</h1>
      ${sub ? `<p class="sub">${sub}</p>` : ''}
      <div class="tags">${tags.map(([t, c = '']) => `<span class="tag ${c}">${t}</span>`).join('')}</div>
    </header>`;

  // ---- people in the thread: add each to AV (CSS class and initials) and NAMES; give .av-xx a background in the page.
  const AV = { bot: ['av-bot', 'AB'], oc: ['av-oc', 'OC'], rl: ['av-rl', 'RL'] };
  const NAMES = { bot: 'alertbot', oc: 'On-call engineer', rl: 'Release lead' };
  const APPS = new Set(['bot']);              // shown with the APP badge
  const CHANNEL = 'checkout';                 // the thread window's channel name
  const av = (who, sm = false) => `<div class="sk-av ${AV[who][0]}${sm ? ' sm' : ''}">${AV[who][1]}</div>`;
  const at = n => `<span class="sk-mention">@${n}</span>`;
  const code = t => `<span class="sk-code">${t}</span>`;
  const ell = '<span class="sk-ell">⋯</span>';
  const msg = (cls, who, time, body, extra = '') => `
    <div class="sk-msg ${cls}">${av(who)}<div>
      <div class="sk-meta"><span class="sk-name">${NAMES[who]}</span>${APPS.has(who) ? '<span class="sk-app">APP</span>' : ''}<span class="sk-time">${time}</span></div>
      <div class="sk-text">${body}</div>${extra}</div></div>`;
  const replies = (whos, n) => `<div class="sk-replies">${whos.map(w => av(w, true)).join('')}<span class="link">${n} ${n === 1 ? 'reply' : 'replies'}</span></div>`;
  // "<name> is thinking" with dots: A.fade the line, then A.dots('.<cls> .dt', o, d).
  const think = (cls, who) => `<div class="sk-think ${cls}">${av(who, true)} ${NAMES[who]} is thinking<span class="dt"></span></div>`;
  // The thread on the left, and the card on the right that says what the highlighted lines mean.
  const threadWin = inner => `
    <div class="sk-win slack win" style="left:72px;top:190px;width:1120px;height:770px">
      <div class="sk-bar">Thread <span class="muted"># ${CHANNEL}</span><div class="right muted">✕</div></div>
      <div class="sk-body"><div class="sk-scroll">${inner}</div></div>
    </div>`;
  const side = (title, sub, inner) => `
    <div class="abs card uth" style="left:1232px;top:190px;width:616px;height:770px">
      <h3>${title}</h3><div class="us">${sub}</div>
      ${inner}
    </div>`;
  const callout = (cls, top, title, text) => `<div class="callout ${cls}" style="top:${top}px"><div class="ct">${title}</div><div class="cd">${text}</div></div>`;
  const chip = (cls, text) => `<span class="chip ${cls}">${text}</span>`;

  // ================================================================ scenes (replace)
  // The example story, made up: a release slows the checkout, an alert fires, a thread finds the cause and a
  // rollback ends it. Times are UTC; the shop, its services and its people are examples.
  const ALERT = `[HIGH] ${code('checkout-api')} <span class="mark m-lat">p95 latency <b>2,400 ms</b></span> (threshold 800 ms) · <span class="mark m-claim">error rate rising</span>`;

  // ---- 1. intro: a dark title slide, then the message that started it
  Deck.add({
    id: 'intro', title: 'The checkout slowdown', theme: 'dark',
    html: `
      <div class="dots-bg"></div>
      <div class="abs i-kicker">Cards kit · example 1 of 3</div>
      <h1 class="abs i-title"><span>The</span> <span>checkout</span> <span>slowdown</span></h1>
      <p class="abs i-sub">One release, one alert, one thread, and a normal checkout again nine minutes later.</p>
      <div class="abs i-chips">${chip('', 'the thread, replayed as posted')}${chip('', 'times in UTC')}${chip('live', 'example names and hosts')}</div>
      <div class="abs i-chat slack">${msg('m-alert', 'bot', '10:02 AM', ALERT)}</div>
      ${CAP}`,
    build(tl) {
      tl.beat('title', 3.2, A => {
        A.fade('.i-kicker', 0, 0.5);
        A.show('.i-title span', 0.3, 0.6, { dy: 26, stagger: 0.18 });
        A.fade('.i-sub', 1.5, 0.6);
      }, 'One release, one alert and <b>one thread</b>, replayed as posted.');
      tl.beat('alert', 3.4, A => {
        A.show('.i-chat', 0.1, 0.6, { dy: 30 });
        A.mark('.m-lat', 1.6, 0.9);
      }, 'It starts with an alert at 10:02: <b>p95 latency 2,400 ms</b>.');
      tl.beat('chips', 2.6, A => {
        A.pop('.i-chips .chip', 0.1, 0.5, 0.3);
      }, 'Times are in <b>UTC</b>, and every name on screen is an example.');
    },
  });

  // ---- 2. thread: the window on the left, the side card on the right; each highlight gets its meaning
  Deck.add({
    id: 'thread', title: 'Eighty-five seconds to a lead', theme: 'act',
    html: `
      ${H('Cards kit · example 2 of 3', 'Eighty-five seconds to a lead', 'The thread as posted. The card on the right says what each highlighted line means.', [['as posted', 'green'], ['UTC', '']])}
      ${threadWin(`
        ${msg('m1', 'bot', '10:02 AM', ALERT)}
        <div class="sk-divider dv">3 replies</div>
        ${msg('m2', 'oc', '10:04 AM', 'Looking. <span class="mark m-lead">Cache hit rate fell from 94% to 12% at 09:58</span>, right after v2.14. Error rate is flat at 0.2%.')}
        ${msg('m3', 'rl', '10:05 AM', 'v2.14 changed the cart cache key to include the session id. <span class="mark m-fix">Rolling back to v2.13.</span>')}
        ${msg('m4', 'bot', '10:11 AM', `[OK] ${code('checkout-api')} p95 latency back to <span class="mark m-ok">180 ms</span>.`)}`)}
      ${side('What the thread shows', 'What the highlighted lines mean, in thread order.', `
        ${callout('amber c1', 128, 'The alert’s wording', 'The latency is measured. “Error rate rising” is the alert’s own phrase; nobody had measured it yet.')}
        ${callout('c2', 300, 'The first lead, 85 s after the alert', 'Not the database: the cache. Its hit rate fell in the deploy minute, and errors stayed at 0.2 %.')}
        ${callout('blue c3', 472, 'The cause, then the fix', 'A session id in the cache key gave every visitor a cache of one. Rolled back; 180 ms by 10:11.')}
        <div class="chips">${chip('green', 'Measured')}${chip('gray', 'alert 10:02:40')}${chip('gray', 'reply 10:04:05')}</div>`)}
      ${CAP}`,
    build(tl) {
      tl.beat('alert', 4.0, A => {
        A.fade('.hd', 0, 0.5);
        A.show('.win', 0.2, 0.55, { dy: 30 });
        A.show('.m1', 0.7, 0.45, { dy: 10 });
        A.mark('.m1 .m-claim', 1.6, 0.8);
        A.show('.uth', 2.2, 0.5, { dx: 24, dy: 0 });
        A.show('.c1', 2.8, 0.5, { dy: 12 });
      }, 'The alert says <b>“error rate rising”</b>; only the latency was measured.');
      tl.beat('lead', 4.2, A => {
        A.fade('.dv', 0, 0.4);
        A.show('.m2', 0.3, 0.45, { dy: 10 });
        A.mark('.m-lead', 1.2, 0.9);
        A.show('.c2', 2.2, 0.5, { dy: 12 });
        A.pop('.uth .chip', 3.0, 0.45, 0.2);
      }, '<b>The on-call engineer replies at 10:04</b>, 85 seconds after the alert.');
      tl.beat('fix', 4.6, A => {
        A.show('.m3', 0.1, 0.45, { dy: 10 });
        A.mark('.m-fix', 0.9, 0.7);
        A.show('.m4', 2.0, 0.45, { dy: 10 });
        A.mark('.m-ok', 2.7, 0.5);
        A.show('.c3', 3.4, 0.5, { dy: 12 });
      }, 'The release lead names the cause and <b>rolls back to v2.13</b>.');
    },
  });

  // ---- 3. cause: three cards, a dot along the path between them, then the outcome and its chips
  Deck.add({
    id: 'cause', title: 'One key per session',
    html: `
      ${H('Cards kit · example 3 of 3', 'One key per session', 'The cause, the fix, and the guard that is still to come.', [['UTC', '']])}
      <div class="abs card kc k1" style="left:72px"><span class="num">1</span><h3>The cache key gained a session id</h3>
        <p>v2.14 keyed the cart cache by cart and session, so no two visitors ever shared an entry.</p>
        <div class="row">${chip('', 'v2.14')}${chip('red', 'hit rate 94% → 12%')}</div></div>
      <div class="abs card kc k2" style="left:690px"><span class="num">2</span><h3>Rolling back restored the shared key</h3>
        <p>v2.13 went back out at 10:06. By 10:11 the p95 latency was 180 ms again.</p>
        <div class="row">${chip('', 'v2.13')}${chip('green', 'p95 180 ms')}</div></div>
      <div class="abs card kc k3 later" style="left:1308px"><span class="num">3</span><h3>Next: review cache-key changes</h3>
        <p>A release that changes a cache key gets a named reviewer before it ships.</p>
        <div class="row">${chip('amber', 'later')}${chip('gray', 'not deployed')}</div></div>
      <svg class="overlay"><path class="draw trk" d="M342,700 Q651,740 960,700 T1578,700"/></svg>
      <div class="abs pkt"><div class="dot"></div></div>
      <div class="abs outcome"><span class="ol wipe">Alert to recovery: 9 min 10 s</span>${chip('green', 'first lead in 85 s')}${chip('green', 'rolled back')}${chip('amber', 'guard: later')}</div>
      ${CAP}`,
    build(tl) {
      tl.beat('cause', 3.8, A => {
        A.fade('.hd', 0, 0.5);
        A.show('.k1', 0.4, 0.55, { dy: 20 });
        A.pop('.k1 .chip', 1.4, 0.45, 0.25);
        A.draw('.trk', 2.0, 1.2);
        A.along('.pkt', '.trk', 2.4, 0.1, [0, 0]);
        A.fade('.pkt', 2.4, 0.3);
      }, 'v2.14 added a session id, so <b>every visitor got a cache of one</b>.');
      tl.beat('fix', 3.6, A => {
        A.along('.pkt', '.trk', 0.1, 1.4, [0, 0.5]);
        A.show('.k2', 1.0, 0.55, { dy: 20 });
        A.pop('.k2 .chip', 2.0, 0.45, 0.25);
      }, 'Rolling back to v2.13 <b>brought the latency back to 180 ms</b>.');
      tl.beat('guard', 4.4, A => {
        A.along('.pkt', '.trk', 0.1, 1.4, [0.5, 1]);
        A.show('.k3', 1.0, 0.55, { dy: 20 });
        A.pop('.k3 .chip', 1.9, 0.45, 0.25);
        A.wipe('.ol', 2.5, 0.9);
        A.pop('.outcome .chip', 3.2, 0.4, 0.2);
      }, 'From alert to recovery: <b>9 min 10 s</b>, and a guard still to build.');
    },
  });
})();
