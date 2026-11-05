/* engine.js: timeline engine and deck runtime shared by the four deck kits (cards, console, board, dashboard).
   Every frame is a pure function of scene time t (seconds), so the live deck and the
   GIF renderer (tools/render-gifs.mjs) draw identical frames.
   A scene is a list of beats. Live, the deck pauses after each beat until you advance;
   in a GIF, each beat is followed by a hold sized to its narration in script.js. */
(function () {
  'use strict';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const EASE = {
    lin: p => p,
    out: p => 1 - Math.pow(1 - p, 3),
    in: p => p * p * p,
    inOut: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: p => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  };
  const XFORM = ['x', 'y', 'scale', 'rot'];
  const DEFAULTS = { opacity: 1, x: 0, y: 0, scale: 1, rot: 0 };
  const WORDS_PER_SEC = 2.25;  // 135 wpm, a natural demo pace; the GIF holds assume it
  const FRAME = 0.07;          // 70 ms per frame, same as the reference GIFs

  class Timeline {
    constructor(root, def) {
      this.root = root;
      this.def = def;
      this.tracks = [];
      this.beats = [];
      this.cursor = 0;
      this.state = new Map();
      this.captionBox = root.querySelector('.captions');
    }

    els(target) {
      if (target instanceof Element) return [target];
      if (Array.isArray(target)) return target.flatMap(t => this.els(t));
      const list = [...this.root.querySelectorAll(target)];
      if (!list.length) throw new Error(`[${this.def.id}] nothing matches ${target}`);
      return list;
    }

    track(el, s, d, apply, init, ease = 'lin') {
      if (!this.state.has(el)) this.state.set(el, { base: {}, cur: {}, last: {} });
      this.tracks.push({ el, s, d, apply, init, ease: EASE[ease], order: this.tracks.length });
    }

    tween(el, s, d, props, ease) {
      this.track(el, s, d,
        (cur, p) => {
          for (const k in props) {
            const [from, to] = props[k];
            const f = from === null ? (k in cur ? cur[k] : DEFAULTS[k] ?? 0) : from;
            cur[k] = lerp(f, to, p);
          }
        },
        base => { for (const k in props) if (props[k][0] !== null && !(k in base)) base[k] = props[k][0]; },
        ease);
    }

    // One beat of animation. build(A) schedules tracks relative to the beat start.
    beat(id, dur, build, caption) {
      const start = this.cursor;
      build(this.api(start));
      if (caption && this.captionBox) {
        const span = document.createElement('div');
        span.className = 'caption';
        span.innerHTML = caption;
        this.captionBox.appendChild(span);
        this.tween(span, start + 0.15, 0.45, { opacity: [0, 1], y: [10, 0] }, 'out');
        if (this.beats.length) {
          const prev = this.captionBox.children[this.captionBox.children.length - 2];
          if (prev) this.tween(prev, start, 0.3, { opacity: [null, 0] }, 'out');
        }
      }
      this.beats.push({ id, start, dur });
      this.cursor += dur;
      return this;
    }

    api(start) {
      const tl = this;
      const each = (target, stagger, fn) => tl.els(target).forEach((el, i) => fn(el, i * stagger));
      return {
        tween(target, o, d, props, ease = 'out', stagger = 0) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, d, props, ease));
        },
        show(target, o = 0, d = 0.55, { dy = 18, dx = 0, s = 1, stagger = 0, ease = 'out' } = {}) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, d,
            { opacity: [0, 1], y: [dy, 0], x: [dx, 0], scale: [s, 1] }, ease));
        },
        pop(target, o = 0, d = 0.5, stagger = 0) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, d, { opacity: [0, 1], scale: [0.86, 1] }, 'back'));
        },
        fade(target, o = 0, d = 0.5, stagger = 0) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, d, { opacity: [0, 1] }, 'out'));
        },
        hide(target, o = 0, d = 0.35, stagger = 0) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, d, { opacity: [null, 0] }, 'out'));
        },
        dim(target, o = 0, d = 0.4, to = 0.3, stagger = 0) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, d, { opacity: [null, to] }, 'out'));
        },
        move(target, o, d, props, ease = 'inOut', stagger = 0) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, d, props, ease));
        },
        vars(target, o, d, props, ease = 'out', stagger = 0) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, d, props, ease));
        },
        // clip reveal left to right (.wipe), highlighter (.mark), SVG stroke draw (.draw), strike line (.strike)
        wipe(target, o = 0, d = 0.6, stagger = 0) { this.vars(target, o, d, { '--wipe': [0, 1] }, 'inOut', stagger); },
        mark(target, o = 0, d = 0.6, stagger = 0) { this.vars(target, o, d, { '--hl': [0, 1] }, 'inOut', stagger); },
        draw(target, o = 0, d = 0.8, stagger = 0) { this.vars(target, o, d, { '--draw': [0, 1] }, 'inOut', stagger); },
        strike(target, o = 0, d = 0.4, stagger = 0) { this.vars(target, o, d, { '--strike': [0, 1] }, 'inOut', stagger); },
        on(target, o = 0, name = 'on', stagger = 0) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, 0, { ['.' + name]: [0, 1] }, 'lin'));
        },
        off(target, o = 0, name = 'on', stagger = 0) {
          each(target, stagger, (el, k) => tl.tween(el, start + o + k, 0, { ['.' + name]: [null, 0] }, 'lin'));
        },
        // Typewriter on an element's own text. Returns the typing time in seconds.
        type(target, o = 0, cps = 40) {
          let longest = 0;
          each(target, 0, el => {
            const full = el.textContent;
            const d = full.length / cps;
            longest = Math.max(longest, d);
            tl.track(el, start + o, d,
              (cur, p) => { const n = Math.round(p * full.length); cur.text = full.slice(0, n); cur['.caret'] = n < full.length ? 1 : 0; },
              base => { if (!('text' in base)) base.text = ''; }, 'lin');
          });
          return longest;
        },
        count(target, o, d, from, to) {
          each(target, 0, el => tl.track(el, start + o, d,
            (cur, p) => { cur.text = Math.round(lerp(from, to, p)).toLocaleString('en-US'); },
            base => { if (!('text' in base)) base.text = from.toLocaleString('en-US'); }, 'out'));
        },
        // "Thinking" dots, three steps per second, cleared when d runs out.
        dots(target, o, d) {
          each(target, 0, el => tl.track(el, start + o, d + 0.001,
            (cur, p, local) => { cur.text = local >= d ? '' : '.'.repeat(1 + (Math.floor(local * 3) % 3)); },
            base => { if (!('text' in base)) base.text = ''; }, 'lin'));
        },
        // Move an element along an SVG path (stage coordinates); [p0, p1] is the share of the path.
        // Per-frame callback. f(cur, p, local, el) sets state keys on cur: text, opacity, x, y, scale, rot,
        // a '--var' or a '.class' (0/1). The engine commits them like any track, so seeking back resets them.
        // Console's cursor and spinner, Board's camera and Dashboard's needle are built on this.
        fn(target, o, d, f, ease = 'lin', stagger = 0) {
          each(target, stagger, (el, k) => tl.track(el, start + o + k, d, (cur, p, local) => f(cur, p, local, el), null, ease));
        },

        along(target, pathSel, o, d, span = [0, 1], ease = 'inOut') {
          const path = tl.els(pathSel)[0];
          each(target, 0, el => tl.track(el, start + o, d, (cur, p) => {
            const len = path.getTotalLength();
            const pt = path.getPointAtLength(lerp(span[0], span[1], p) * len);
            cur.x = pt.x; cur.y = pt.y;
          }, null, ease));
        },
      };
    }

    finalize() {
      this.tracks.sort((a, b) => a.s - b.s || a.order - b.order);
      for (const tr of this.tracks) if (tr.init) tr.init(this.state.get(tr.el).base);
      this.length = this.cursor;
    }

    render(t) {
      for (const st of this.state.values()) st.cur = Object.assign({}, st.base);
      for (const tr of this.tracks) {
        if (t < tr.s) break;
        const local = t - tr.s;
        const p = tr.d > 0 ? clamp(local / tr.d) : 1;
        tr.apply(this.state.get(tr.el).cur, tr.ease(p), local);
      }
      for (const [el, st] of this.state) commit(el, st);
    }
  }

  // Write the computed state to the element. A key present last frame but absent now
  // (seeking back past a track's start) is reset, so no stale style survives a seek.
  function commit(el, st) {
    const c = st.cur, l = st.last;
    if (c.opacity !== l.opacity) el.style.opacity = 'opacity' in c ? c.opacity : '';
    if (XFORM.some(k => k in c || k in l)) {
      const x = c.x ?? 0, y = c.y ?? 0, s = c.scale ?? 1, r = c.rot ?? 0;
      if (x !== (l.x ?? 0) || y !== (l.y ?? 0) || s !== (l.scale ?? 1) || r !== (l.rot ?? 0) || !st.wrote) {
        el.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`;
        st.wrote = true;
      }
    }
    for (const k of new Set([...Object.keys(c), ...Object.keys(l)])) {
      if (c[k] === l[k]) continue;
      if (k.startsWith('--')) { if (k in c) el.style.setProperty(k, c[k]); else el.style.removeProperty(k); }
      else if (k.startsWith('.')) el.classList.toggle(k.slice(1), (c[k] ?? 0) >= 0.5);
    }
    if ('text' in c && c.text !== l.text) el.textContent = c.text;
    st.last = c;
  }

  // ---------------------------------------------------------------- deck runtime
  const Deck = {
    defs: [],
    scenes: [],
    si: 0,
    bi: -1,
    t: 0,
    play: null,
    auto: false,
    autoTimer: null,
    startedAt: null,
    presenter: null,
    capture: new URLSearchParams(location.search).has('capture'),

    add(def) { this.defs.push(def); },

    init() {
      const stage = document.getElementById('stage');
      for (const def of this.defs) {
        const sec = document.createElement('section');
        sec.className = 'scene ' + (def.theme || '');
        sec.id = 'scene-' + def.id;
        sec.innerHTML = def.html;
        stage.appendChild(sec);
        const tl = new Timeline(sec, def);
        def.build(tl);
        tl.finalize();
        this.scenes.push({ def, sec, tl, measured: false, holds: this.holdsFor(def, tl) });
      }
      if (this.capture) { this.exposeCapture(); return; }
      this.fit();
      addEventListener('resize', () => this.fit());
      addEventListener('keydown', e => this.key(e));
      document.getElementById('viewport').addEventListener('click', () => this.next());
      const fromHash = this.sceneIndex(location.hash.slice(1));
      this.enter(fromHash >= 0 ? fromHash : 0, false);
      requestAnimationFrame(now => this.tick(now));
    },

    // Hold after each beat = narration time minus animation time (script.js), at least 1.5 s.
    holdsFor(def, tl) {
      const sc = (window.SCRIPT && window.SCRIPT.scenes || []).find(s => s.id === def.id);
      return tl.beats.map((b, i) => {
        const beat = sc && sc.beats[i];
        if (!beat) return 3;
        if (beat.hold != null) return beat.hold;
        const words = beat.say.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        return Math.max(1.5, words / WORDS_PER_SEC - b.dur);
      });
    },

    sceneIndex(key) {
      if (!key) return -1;
      if (/^\d+$/.test(key)) return clamp(parseInt(key, 10) - 1, 0, this.scenes.length - 1);
      return this.scenes.findIndex(s => s.def.id === key);
    },

    fit() {
      const s = Math.min(innerWidth / 1920, innerHeight / 1080);
      document.getElementById('stage').style.transform = `scale(${s})`;
    },

    activate(i) {
      this.scenes.forEach((s, k) => s.sec.classList.toggle('active', k === i));
      const sc = this.scenes[i];
      if (!sc.measured) {
        sc.sec.querySelectorAll('path.draw, line.draw, polyline.draw').forEach(p => p.style.setProperty('--len', p.getTotalLength()));
        sc.measured = true;
      }
    },

    enter(i, autoplay = true) {
      this.si = i; this.bi = -1; this.t = 0; this.play = null;
      this.activate(i);
      this.scenes[i].tl.render(0);
      if (location.hash.slice(1) !== this.scenes[i].def.id) history.replaceState(null, '', '#' + this.scenes[i].def.id);
      if (autoplay) this.playBeat(0);
      this.sync();
    },

    playBeat(b) {
      const sc = this.scenes[this.si];
      const beat = sc.tl.beats[b];
      if (!beat) return;
      if (this.startedAt === null) this.startedAt = performance.now();
      this.bi = b;
      this.play = { from: beat.start, to: beat.start + beat.dur, t0: performance.now() };
      this.sync();
    },

    next() {
      clearTimeout(this.autoTimer);
      const sc = this.scenes[this.si];
      if (this.play) { this.t = this.play.to; this.play = null; sc.tl.render(this.t); this.beatDone(); return; }
      if (this.bi < sc.tl.beats.length - 1) return this.playBeat(this.bi + 1);
      if (this.si < this.scenes.length - 1) this.enter(this.si + 1, true);
    },

    prev() {
      clearTimeout(this.autoTimer);
      this.play = null;
      const sc = this.scenes[this.si];
      if (this.bi > 0) {
        this.bi -= 1;
        const b = sc.tl.beats[this.bi];
        this.t = b.start + b.dur;
      } else if (this.bi === 0) {
        this.bi = -1; this.t = 0;
      } else if (this.si > 0) {
        this.si -= 1;
        const p = this.scenes[this.si];
        this.activate(this.si);
        this.bi = p.tl.beats.length - 1;
        this.t = p.tl.length;
        history.replaceState(null, '', '#' + p.def.id);
      }
      this.scenes[this.si].tl.render(this.t);
      this.sync();
    },

    beatDone() {
      this.sync();
      if (!this.auto) return;
      const hold = this.scenes[this.si].holds[this.bi] || 3;
      this.autoTimer = setTimeout(() => this.next(), hold * 1000);
    },

    tick(now) {
      if (this.play) {
        const t = this.play.from + (now - this.play.t0) / 1000;
        if (t >= this.play.to) { this.t = this.play.to; this.play = null; this.scenes[this.si].tl.render(this.t); this.beatDone(); }
        else { this.t = t; this.scenes[this.si].tl.render(t); }
      }
      if (this.presenter && !this.presenter.closed) this.presenterClock();
      requestAnimationFrame(n => this.tick(n));
    },

    key(e) {
      const k = e.key;
      if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(k)) { e.preventDefault(); this.next(); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); this.prev(); }
      else if (k === 'r' || k === 'R') this.enter(this.si, true);
      else if (k === 'a' || k === 'A') { this.auto = !this.auto; clearTimeout(this.autoTimer); if (this.auto && !this.play) this.next(); this.sync(); }
      else if (k === 'f' || k === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
      else if (k === 'p' || k === 'P') this.openPresenter();
      else if (k === 'b' || k === 'B') document.body.classList.toggle('blank');
      else if (k === 'h' || k === 'H' || k === '?') document.body.classList.toggle('help');
      else if (k === 'Home') this.enter(0, false);
      else if (/^[0-9]$/.test(k)) this.enter(k === '0' ? 9 : parseInt(k, 10) - 1, false);
    },

    // ------------------------------------------------------------ presenter window
    openPresenter() {
      if (this.presenter && !this.presenter.closed) { this.presenter.focus(); return; }
      // Own window name, so another deck's presenter view (if open) is never reused. Change it when you copy the kit.
      const w = window.open('', 'board-kit-presenter', 'width=980,height=760');
      if (!w) { alert('Allow pop-ups for this file to open the presenter view.'); return; }
      this.presenter = w;
      w.document.title = 'Presenter: Board kit';
      w.document.body.innerHTML = PRESENTER_HTML;
      const css = w.document.createElement('style');
      css.textContent = PRESENTER_CSS;
      w.document.head.appendChild(css);
      w.addEventListener('keydown', e => this.key(e));
      this.sync();
    },

    // Cumulative target time of each beat start, in seconds (anim + hold of everything before).
    // Holds rounded to 0.01 s, as in the GIFs and tools/timing.json, so the target matches SCRIPT.md to the second.
    targetAt(si, bi) {
      let total = 0;
      for (let i = 0; i < si; i++) {
        const s = this.scenes[i];
        s.tl.beats.forEach((b, k) => { total += b.dur + +s.holds[k].toFixed(2); });
      }
      const s = this.scenes[si];
      for (let k = 0; k < bi; k++) total += s.tl.beats[k].dur + +s.holds[k].toFixed(2);
      return total;
    },

    sync() {
      const w = this.presenter;
      if (!w || w.closed) return;
      const d = w.document, sc = this.scenes[this.si];
      const script = (window.SCRIPT.scenes || []).find(s => s.id === sc.def.id) || { beats: [] };
      const bi = Math.max(0, this.bi);
      const beat = script.beats[bi] || { say: '' };
      const nextBeat = script.beats[bi + 1]
        || ((window.SCRIPT.scenes[this.si + 1] || {}).beats || [])[0];
      d.getElementById('p-scene').textContent = `Slide ${this.si + 1} of ${this.scenes.length} · ${sc.def.title}`;
      d.getElementById('p-beat').textContent = this.bi < 0 ? 'Not started: press → to play beat 1'
        : `Beat ${bi + 1} of ${sc.tl.beats.length}${this.play ? ' · animating' : ''}${this.auto ? ' · AUTO' : ''}`;
      d.getElementById('p-cue').textContent = beat.cue || '';
      d.getElementById('p-say').innerHTML = beat.say;
      d.getElementById('p-next').innerHTML = nextBeat ? 'Next: ' + nextBeat.say.split(/(?<=[.?!])\s/)[0] : 'Last beat. Questions.';
      d.getElementById('p-target').textContent = 'target ' + fmt(this.targetAt(this.si, bi));
    },

    presenterClock() {
      const el = this.presenter.document.getElementById('p-clock');
      if (!el) return;
      const secs = this.startedAt === null ? 0 : (performance.now() - this.startedAt) / 1000;
      const txt = fmt(secs);
      if (el.textContent !== txt) el.textContent = txt;
      const target = this.targetAt(this.si, Math.max(0, this.bi));
      el.className = secs - target > 20 ? 'late' : secs - target < -20 ? 'early' : '';
    },

    // ------------------------------------------------------------ GIF capture hooks
    exposeCapture() {
      document.getElementById('stage').style.transform = 'none';
      window.__cap = {
        ids: () => this.scenes.map(s => s.def.id),
        // Frame plan for one scene: 70 ms frames through each beat, then one frame held for the beat's hold.
        select: id => {
          const i = this.sceneIndex(id);
          this.si = i;
          this.activate(i);
          const sc = this.scenes[i];
          const plan = [];
          sc.tl.beats.forEach((b, k) => {
            for (let t = b.start; t < b.start + b.dur - 1e-6; t += FRAME) plan.push({ t: +t.toFixed(4), d: FRAME });
            plan.push({ t: b.start + b.dur, d: Math.max(FRAME, +sc.holds[k].toFixed(2)), end: k });
          });
          const beats = sc.tl.beats.map((b, k) => ({ id: b.id, dur: b.dur, hold: +sc.holds[k].toFixed(2) }));
          return { id: sc.def.id, title: sc.def.title, plan, beats };
        },
        // Synchronous on purpose: the renderer's screenshot waits for a fresh frame itself, and
        // waiting on requestAnimationFrame here would stall in a headless background tab.
        seek: t => { this.scenes[this.si].tl.render(t); return true; },
      };
      window.__capReady = true;
    },
  };

  function fmt(secs) {
    const s = Math.max(0, Math.round(secs));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  const PRESENTER_HTML = `
    <div class="top"><div id="p-scene"></div><div class="times"><span id="p-clock">0:00</span><span id="p-target"></span></div></div>
    <div id="p-beat"></div>
    <div id="p-cue"></div>
    <div id="p-say"></div>
    <div id="p-next"></div>
    <div class="keys">→ / Space next beat · ← back · R replay slide · A auto · B blank screen · F fullscreen (main window)</div>`;
  const PRESENTER_CSS = `
    body { font: 22px/1.5 'Segoe UI', system-ui, sans-serif; background: #12152b; color: #e9ebf7; margin: 0; padding: 22px 28px; }
    .top { display: flex; justify-content: space-between; align-items: baseline; color: #9aa0c3; font-size: 17px; }
    .times { display: flex; gap: 16px; align-items: baseline; }
    #p-clock { font: 700 44px/1 Consolas, monospace; color: #7ee2a8; }
    #p-clock.late { color: #ff8a8a; } #p-clock.early { color: #ffd27a; }
    #p-target { font: 17px Consolas, monospace; color: #9aa0c3; }
    #p-beat { margin-top: 10px; font-size: 15px; letter-spacing: .08em; text-transform: uppercase; color: #8f96c9; }
    #p-cue { margin-top: 8px; font-size: 17px; color: #ffd27a; min-height: 1.5em; }
    #p-say { margin-top: 10px; font-size: 30px; line-height: 1.45; color: #fff; }
    #p-say b { color: #9fd0ff; }
    #p-next { margin-top: 22px; font-size: 19px; color: #9aa0c3; border-top: 1px solid #2a2f55; padding-top: 12px; }
    .keys { position: fixed; bottom: 14px; left: 28px; font-size: 14px; color: #6d7399; }`;

  window.Deck = Deck;
  window.addEventListener('DOMContentLoaded', () => Deck.init());
})();
