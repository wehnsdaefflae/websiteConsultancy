/* ============================================================
   BLOCKWERK — tiny runtime
   - day/night theme toggle (persists via URL param + localStorage,
     so it works on file:// origins where localStorage is blocked
     per-path — Safari / some Chrome configurations)
   - filter buttons on portfolio page
   - year stamp
   - scroll-in IntersectionObserver (adds `.is-in` when elements enter)
   - home-page Kontakt-stub scroll parallax + leave-before-partners
   - pullquote carousel (auto-rotate every 5 s, paused on hover)
   - mirrored-underline width sync (about-page masthead)
   - global --scroll-y custom property for parallax-reading CSS rules
   - contact form mailto fallback (works without a backend)
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'bw.theme';
  var QUERY = 't';          // ?t=dark / ?t=light
  var root = document.documentElement;

  // ------------------------------------------------------------
  //  Theme (unchanged behaviour)
  // ------------------------------------------------------------
  function applyTheme(t) {
    if (t === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }
  function writeThemeToUrl(t) {
    try {
      var u = new URL(location.href);
      u.searchParams.set(QUERY, t);
      history.replaceState(null, '', u.toString());
    } catch (e) {}
  }
  function propagateThemeToLinks(t) {
    if (!t) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      if (href.charAt(0) === '#' ||
          href.indexOf('mailto:') === 0 ||
          href.indexOf('tel:') === 0 ||
          href.indexOf('javascript:') === 0) return;
      try {
        var dest = new URL(href, location.href);
        if (dest.origin !== location.origin) return;
        dest.searchParams.set(QUERY, t);
        var rewritten = dest.pathname + dest.search + (dest.hash || '');
        a.setAttribute('href', rewritten);
      } catch (e) {}
    });
  }
  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function initThemeToggle() {
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    function sync() {
      var t = currentTheme();
      btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      btn.dataset.edition = t === 'dark' ? 'night' : 'day';
    }
    sync();
    try {
      var q = new URL(location.href).searchParams.get(QUERY);
      if (q === 'dark' || q === 'light') localStorage.setItem(KEY, q);
    } catch (e) {}
    propagateThemeToLinks(currentTheme());
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      writeThemeToUrl(next);
      propagateThemeToLinks(next);
      sync();
    });
  }

  function initFilters() {
    var rows = document.querySelectorAll('[data-filters]');
    rows.forEach(function (row) {
      var items = document.querySelectorAll('[data-tags]');
      row.querySelectorAll('.bw-filter').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var tag = btn.dataset.filter;
          row.querySelectorAll('.bw-filter').forEach(function (b) {
            b.setAttribute('aria-pressed', 'false');
          });
          btn.setAttribute('aria-pressed', 'true');
          items.forEach(function (it) {
            var tags = (it.dataset.tags || '').split(/\s+/);
            if (tag === 'all' || tags.indexOf(tag) !== -1) {
              it.classList.remove('bw-hide');
            } else {
              it.classList.add('bw-hide');
            }
          });
        });
      });
    });
  }

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  // ------------------------------------------------------------
  //  Scroll-in IntersectionObserver
  //  Any element with [data-observe] (or class .bw-observable) gets
  //  `.is-in` once it crosses 12 % into the viewport. CSS handles the
  //  actual animation. Disabled on reduced-motion users.
  // ------------------------------------------------------------
  function initScrollIn() {
    if (!('IntersectionObserver' in window)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Immediately reveal everything — no transitions, no faff.
      document.querySelectorAll('.bw-observable, [data-observe]').forEach(function (el) {
        el.classList.add('is-in');
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.bw-observable, [data-observe]').forEach(function (el) {
      io.observe(el);
    });
  }

  // ------------------------------------------------------------
  //  Auto-tag the usual-suspect elements as observable so we don't
  //  have to mark every card by hand across 10 HTML pages. Pages
  //  can still opt in to extras via [data-observe].
  // ------------------------------------------------------------
  function markObservables() {
    var selectors = [
      '.bw-card',
      '.bw-phase',
      '.bw-time',
      '.bw-stat',
      '.bw-step',
      '.bw-work',
      '.bw-window',
      '.bw-toc__item',
      '.bw-partner',
      '.bw-segment__fill',
      '.bw-bigtext'
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.classList.add('bw-observable');
      });
    });
  }

  // ------------------------------------------------------------
  //  Global --scroll-y CSS var for parallax accents. Rate-limited via
  //  requestAnimationFrame so we never do > 1 write per frame. The
  //  value is UNITLESS (just a number) so CSS can multiply it by a
  //  per-shape coefficient in `calc(var(--scroll-y) * -0.06 * 1px)`
  //  to produce a per-shape translateY without locking the whole
  //  rail to a single speed.
  // ------------------------------------------------------------
  function initScrollVar() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ticking = false;
    function write() {
      root.style.setProperty('--scroll-y', window.scrollY);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(write);
        ticking = true;
      }
    }, { passive: true });
    write();
  }

  // ------------------------------------------------------------
  //  Decorative shape layer — injects a set of cardboard-cut blobs
  //  (rects, circles, tilted rectangles) at fixed document-relative
  //  positions. Each shape:
  //    - reads --scroll-y × a per-shape coefficient to produce its
  //      own translate-Y on scroll (so they move at different speeds
  //      and appear to float OVER section boundaries);
  //    - starts hidden and fades in when entering the viewport
  //      (bw-observable scroll-in).
  //  Shape placements differ per page via a simple seed based on the
  //  URL pathname — so profile/services/projects each feel unique
  //  but deterministic, not chaotic on every reload.
  // ------------------------------------------------------------
  function initDecorLayer() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var main = document.querySelector('main');
    if (!main) return;

    // ---- SHAPE POOL
    //   Shapes have one of three placement strategies:
    //     x   (px from left)   — anchored to LEFT edge, often poking
    //                            in from off-screen
    //     xr  (px from right)  — anchored to RIGHT edge, same idea
    //     xp  (percent of main) — placed CENTRALLY across the page,
    //                            travelling OVER section content as
    //                            you scroll. These are the shapes
    //                            that feel like they cut across the
    //                            cardboard collage rather than
    //                            framing it.
    //   Per-shape motion fingerprint:
    //     k    — vertical scroll parallax coefficient
    //              (range 0.05 .. 0.32 — bigger = floats further as
    //              you scroll, "closer to the camera")
    //     kr   — rotation per scroll-px in deg (default 0.012,
    //              negative = tumbles the other way)
    //     anim — optional idle keyframe: 'bob' | 'sway' | 'spin'
    //              ('spin' only for round/diamond shapes; squares
    //              spinning would feel wrong against the rest of the
    //              cardboard collage which keeps a fixed tilt)
    //   Pool is large — we pick ~26 per page via pathname hash, so
    //   every subpage gets a distinct subset. .bw-cta and .bw-partners
    //   are stacking contexts above the decor layer (see styles.css),
    //   so as a central shape scrolls into one of those sections it
    //   visibly DIVES UNDER it and re-emerges on the other side.
    var POOL = [
      // ---- TOP BAND (0–25%) — densest near the hero
      { shape: 'rect',    w: 130, h: 95,  top: 4,   x: -60,  rot: -16, bg: 'var(--yellow)',   k: 0.10, kr:  0.012, anim: 'sway' },
      { shape: 'circle',  w: 170, h: 170, top: 9,   xr: -75, rot: 6,   bg: 'var(--mint)',     k: 0.08, kr:  0.010, anim: 'spin' },
      { shape: 'diamond', w: 70,  h: 70,  top: 13,  x: -30,  rot: 45,  bg: 'var(--tomato)',   k: 0.18, kr:  0.020, anim: 'bob'  },
      { shape: 'plus',    w: 60,  h: 60,  top: 16,  xr: -20, rot: -8,  bg: 'var(--ink)',      k: 0.22, kr: -0.024 },
      { shape: 'rect',    w: 70,  h: 70,  top: 19,  x: -25,  rot: 24,  bg: 'var(--lilac)',    k: 0.14, kr:  0.018, anim: 'bob'  },
      { shape: 'circle',  w: 95,  h: 95,  top: 23,  xr: -40, rot: 0,   bg: 'var(--sky)',      k: 0.11, kr:  0.014, anim: 'spin' },
      { shape: 'rect',    w: 50,  h: 50,  top: 26,  x: -20,  rot: 12,  bg: 'var(--lime)',     k: 0.26, kr: -0.022, anim: 'sway' },

      // ---- UPPER MIDDLE (25–50%)
      { shape: 'rect',    w: 155, h: 45,  top: 30,  x: -85,  rot: -8,  bg: 'var(--hot-pink)', k: 0.12, kr:  0.014 },
      { shape: 'plus',    w: 70,  h: 70,  top: 33,  xr: -25, rot: 10,  bg: 'var(--ink)',      k: 0.16, kr:  0.022, anim: 'sway' },
      { shape: 'diamond', w: 60,  h: 60,  top: 37,  x: -22,  rot: 48,  bg: 'var(--yellow)',   k: 0.09, kr: -0.012, anim: 'bob'  },
      { shape: 'circle',  w: 75,  h: 75,  top: 40,  xr: -10, rot: 0,   bg: 'var(--hot-pink)', k: 0.13, kr:  0.016, anim: 'spin' },
      { shape: 'rect',    w: 40,  h: 40,  top: 43,  xr: -16, rot: 30,  bg: 'var(--orange)',   k: 0.28, kr:  0.026, anim: 'sway' },
      { shape: 'rect',    w: 190, h: 55,  top: 46,  x: -95,  rot: 9,   bg: 'var(--sky)',      k: 0.07, kr:  0.008 },
      { shape: 'plus',    w: 50,  h: 50,  top: 49,  x: -18,  rot: 18,  bg: 'var(--ink)',      k: 0.24, kr: -0.020 },

      // ---- LOWER MIDDLE (50–75%)
      { shape: 'rect',    w: 85,  h: 85,  top: 53,  xr: -45, rot: -6,  bg: 'var(--mint)',     k: 0.15, kr:  0.018, anim: 'bob'  },
      { shape: 'plus',    w: 58,  h: 58,  top: 56,  x: -25,  rot: -15, bg: 'var(--ink)',      k: 0.20, kr:  0.024 },
      { shape: 'diamond', w: 45,  h: 45,  top: 59,  xr: -18, rot: 50,  bg: 'var(--royal)',    k: 0.27, kr: -0.026, anim: 'bob'  },
      { shape: 'circle',  w: 130, h: 130, top: 62,  xr: -70, rot: 0,   bg: 'var(--lilac)',    k: 0.08, kr:  0.010, anim: 'spin' },
      { shape: 'rect',    w: 65,  h: 65,  top: 65,  x: -25,  rot: -22, bg: 'var(--lime)',     k: 0.22, kr:  0.020, anim: 'sway' },
      { shape: 'diamond', w: 90,  h: 90,  top: 68,  x: -45,  rot: 40,  bg: 'var(--mint)',     k: 0.10, kr:  0.014 },
      { shape: 'rect',    w: 120, h: 90,  top: 71,  xr: -55, rot: 15,  bg: 'var(--tomato)',   k: 0.13, kr:  0.016, anim: 'bob'  },
      { shape: 'plus',    w: 80,  h: 80,  top: 74,  x: -30,  rot: 18,  bg: 'var(--ink)',      k: 0.17, kr: -0.018, anim: 'sway' },

      // ---- BOTTOM BAND (75–100%) — looser, larger pieces
      { shape: 'rect',    w: 100, h: 100, top: 78,  x: -50,  rot: -12, bg: 'var(--tomato)',   k: 0.12, kr:  0.014, anim: 'bob'  },
      { shape: 'circle',  w: 55,  h: 55,  top: 81,  x: -22,  rot: 0,   bg: 'var(--orange)',   k: 0.25, kr:  0.022, anim: 'spin' },
      { shape: 'circle',  w: 145, h: 145, top: 84,  xr: -70, rot: 0,   bg: 'var(--royal)',    k: 0.06, kr:  0.008, anim: 'spin' },
      { shape: 'diamond', w: 55,  h: 55,  top: 87,  xr: -25, rot: 50,  bg: 'var(--yellow)',   k: 0.18, kr:  0.020, anim: 'sway' },
      { shape: 'rect',    w: 115, h: 60,  top: 90,  x: -70,  rot: 8,   bg: 'var(--sky)',      k: 0.09, kr:  0.012 },
      { shape: 'circle',  w: 80,  h: 80,  top: 93,  xr: -35, rot: 0,   bg: 'var(--hot-pink)', k: 0.14, kr:  0.016, anim: 'spin' },
      { shape: 'plus',    w: 65,  h: 65,  top: 95,  x: -30,  rot: 24,  bg: 'var(--ink)',      k: 0.22, kr: -0.024 },
      { shape: 'rect',    w: 75,  h: 75,  top: 97,  xr: -32, rot: -18, bg: 'var(--lilac)',    k: 0.16, kr:  0.020, anim: 'bob'  },
      { shape: 'diamond', w: 70,  h: 70,  top: 99,  x: -28,  rot: 42,  bg: 'var(--lime)',     k: 0.11, kr:  0.014, anim: 'sway' },
      { shape: 'rect',    w: 50,  h: 50,  top: 101, x: -20,  rot: 6,   bg: 'var(--mint)',     k: 0.28, kr:  0.026 },
      { shape: 'circle',  w: 40,  h: 40,  top: 103, xr: -16, rot: 0,   bg: 'var(--tomato)',   k: 0.30, kr:  0.024, anim: 'spin' },
      { shape: 'plus',    w: 55,  h: 55,  top: 105, xr: -22, rot: -10, bg: 'var(--ink)',      k: 0.19, kr:  0.022, anim: 'bob'  },

      // ---- DEEP BACKGROUND (slow drifters, scattered across the page)
      { shape: 'rect',    w: 220, h: 36,  top: 27,  xr: -120, rot: -22, bg: 'var(--royal)',   k: 0.04, kr:  0.006 },
      { shape: 'rect',    w: 200, h: 32,  top: 67,  x: -110,  rot: 14,  bg: 'var(--hot-pink)',k: 0.05, kr:  0.006 },
      { shape: 'circle',  w: 200, h: 200, top: 45,  xr: -110, rot: 0,   bg: 'var(--yellow)',  k: 0.04, kr:  0.006, anim: 'spin' },

      // ---- CENTRAL CROSSING SHAPES — these sit OVER the page columns
      //   and fly past content with stronger parallax (k ≥ 0.14). They
      //   give the "cardboard cuts moving across the page" feel that
      //   edge-anchored shapes can't. xp is a percentage of the main
      //   column width. Sizes are kept modest (≤90px most) so body
      //   text stays readable and the eye still finds typographic
      //   focus over the moving graphics.
      { shape: 'diamond', w: 65,  h: 65,  top: 8,   xp: 28,   rot: 35,  bg: 'var(--lime)',     k: 0.20, kr:  0.022, anim: 'bob'  },
      { shape: 'plus',    w: 55,  h: 55,  top: 14,  xp: 65,   rot: 12,  bg: 'var(--ink)',      k: 0.26, kr: -0.024, anim: 'sway' },
      { shape: 'circle',  w: 70,  h: 70,  top: 21,  xp: 42,   rot: 0,   bg: 'var(--orange)',   k: 0.18, kr:  0.018, anim: 'spin' },
      { shape: 'rect',    w: 55,  h: 55,  top: 27,  xp: 78,   rot: -18, bg: 'var(--royal)',    k: 0.22, kr:  0.020, anim: 'bob'  },
      { shape: 'diamond', w: 50,  h: 50,  top: 34,  xp: 16,   rot: 42,  bg: 'var(--hot-pink)', k: 0.28, kr:  0.026, anim: 'sway' },
      { shape: 'circle',  w: 60,  h: 60,  top: 41,  xp: 70,   rot: 0,   bg: 'var(--mint)',     k: 0.16, kr:  0.014, anim: 'spin' },
      { shape: 'plus',    w: 50,  h: 50,  top: 48,  xp: 35,   rot: 22,  bg: 'var(--ink)',      k: 0.24, kr: -0.022, anim: 'bob'  },
      { shape: 'rect',    w: 65,  h: 65,  top: 55,  xp: 82,   rot: 8,   bg: 'var(--lilac)',    k: 0.20, kr:  0.018, anim: 'sway' },
      { shape: 'diamond', w: 55,  h: 55,  top: 62,  xp: 24,   rot: 38,  bg: 'var(--tomato)',   k: 0.32, kr:  0.028, anim: 'bob'  },
      { shape: 'circle',  w: 80,  h: 80,  top: 70,  xp: 58,   rot: 0,   bg: 'var(--sky)',      k: 0.14, kr:  0.012, anim: 'spin' },
      { shape: 'plus',    w: 60,  h: 60,  top: 77,  xp: 18,   rot: -10, bg: 'var(--ink)',      k: 0.26, kr:  0.024, anim: 'sway' },
      { shape: 'rect',    w: 50,  h: 50,  top: 84,  xp: 72,   rot: -22, bg: 'var(--yellow)',   k: 0.22, kr:  0.020, anim: 'bob'  },
      { shape: 'diamond', w: 60,  h: 60,  top: 91,  xp: 38,   rot: 45,  bg: 'var(--mint)',     k: 0.30, kr: -0.026, anim: 'sway' },
      { shape: 'circle',  w: 55,  h: 55,  top: 98,  xp: 80,   rot: 0,   bg: 'var(--lime)',     k: 0.18, kr:  0.018, anim: 'spin' }
    ];

    // Pick shapes deterministically based on pathname — different
    // subpages get distinct combinations. Uses a tiny hash for each
    // candidate index so the selected set isn't just a contiguous slice.
    function pathHash(s) {
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) h = ((h ^ s.charCodeAt(i)) * 16777619) >>> 0;
      return h;
    }
    var path = (location.pathname || location.hash || '').toLowerCase();
    var h = pathHash(path);
    var want = Math.min(30, POOL.length);
    var chosen = [];
    var used = new Set();
    for (var i = 0; i < POOL.length && chosen.length < want; i++) {
      var idx = (i + ((h >>> (i % 16)) % POOL.length)) % POOL.length;
      while (used.has(idx)) idx = (idx + 1) % POOL.length;
      used.add(idx);
      chosen.push(POOL[idx]);
    }
    var shapes = chosen;

    var layer = document.createElement('div');
    layer.className = 'bw-decor';
    layer.setAttribute('aria-hidden', 'true');

    shapes.forEach(function (s, i) {
      var e = document.createElement('span');
      // Decor shapes are NOT .bw-observable — they manage their own
      // scroll motion via --scroll-y × --dec-k. Adding .bw-observable
      // would clash (the generic rule sets translateY(24px) until
      // .is-in which overrides the parallax transform).
      var classes = ['bw-decor__shape', 'bw-decor__shape--' + s.shape];
      if (s.anim) classes.push('bw-decor__shape--anim-' + s.anim);
      e.className = classes.join(' ');
      e.style.top = s.top + '%';
      if (s.x !== undefined) e.style.left = s.x + 'px';
      if (s.xr !== undefined) e.style.right = s.xr + 'px';
      // xp = percent of main column width — the central "crossing"
      // shapes use this. We translate(-50%, 0) so xp reads as the
      // shape's CENTRE, not its left edge — feels more natural to
      // place a 60-wide blob "at 35%" meaning its midpoint sits there.
      if (s.xp !== undefined) {
        e.style.left = s.xp + '%';
        e.style.marginLeft = (-s.w / 2) + 'px';
        e.classList.add('bw-decor__shape--cross');
      }
      e.style.width = s.w + 'px';
      e.style.height = s.h + 'px';
      e.style.background = s.bg;
      e.style.setProperty('--dec-rot', s.rot + 'deg');
      e.style.setProperty('--dec-k', s.k);
      if (s.kr !== undefined) e.style.setProperty('--dec-kr', s.kr);
      // Stagger idle animation phases so neighbouring shapes don't
      // bob/sway in lockstep — that would look mechanical. Negative
      // delay starts mid-cycle so motion is in progress at first paint.
      if (s.anim) {
        var delay = -((i * 0.83) % 6).toFixed(2);
        e.style.animationDelay = delay + 's';
      }
      layer.appendChild(e);
    });

    main.insertBefore(layer, main.firstChild);
  }

  // ------------------------------------------------------------
  //  (The home-page Kontakt stub used to live here as a scroll listener.
  //   It's now pure CSS — `position: sticky` inside a full-height track.
  //   See .bw-mast__stub-track / .bw-mast__stub in styles.css.)
  // ------------------------------------------------------------
  //  Pullquote carousel — looks for .bw-pullquote__body with > 1
  //  .bw-pullquote__slide. Rotates every 5 s; pauses on hover.
  //  Adds clickable dot indicators.
  // ------------------------------------------------------------
  function initQuoteCarousel() {
    document.querySelectorAll('.bw-pullquote__body').forEach(function (body) {
      var slides = body.querySelectorAll('.bw-pullquote__slide');
      if (slides.length < 2) return;
      slides[0].classList.add('is-active');

      // Dot navigation — appended to the OUTER .bw-pullquote so the
      // dots sit BELOW the quote card, not layered on top of the cite
      // text. Users can still flip manually even when auto-rotate is
      // paused (dark mode / reduced motion).
      var dots = document.createElement('div');
      dots.className = 'bw-pullquote__dots';
      var dotEls = [];
      slides.forEach(function (_, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'bw-pullquote__dot';
        d.setAttribute('aria-label', 'Quote ' + (i + 1));
        d.addEventListener('click', function () { show(i, true); });
        dots.appendChild(d);
        dotEls.push(d);
      });
      // Append to .bw-pullquote (outer section), not .bw-pullquote__body
      var outer = body.closest('.bw-pullquote') || body.parentNode;
      outer.appendChild(dots);

      var current = 0;
      dotEls[0].classList.add('is-active');

      var interval = null;
      function isDark()  { return root.getAttribute('data-theme') === 'dark'; }
      function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
      function next() { show((current + 1) % slides.length, false); }
      function show(i, userTriggered) {
        slides[current].classList.remove('is-active');
        dotEls[current].classList.remove('is-active');
        current = i;
        slides[current].classList.add('is-active');
        dotEls[current].classList.add('is-active');
        if (userTriggered) { restart(); }
      }
      function start() {
        if (interval) return;
        // Dark mode / reduced motion: stay on the first slide, no auto.
        if (isDark() || reduced()) return;
        interval = setInterval(next, 5000);
      }
      function stop() {
        if (interval) { clearInterval(interval); interval = null; }
      }
      function restart() { stop(); start(); }

      body.addEventListener('mouseenter', stop);
      body.addEventListener('mouseleave', start);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });
      // React to theme toggles: if user switches to dark, stop auto.
      // (Watched by MutationObserver on <html data-theme>.)
      var mo = new MutationObserver(function () {
        if (isDark() || reduced()) stop();
        else if (!interval) start();
      });
      mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

      start();
    });
  }

  // (Mirrored-uline used to have a JS width sync — it's now pure CSS:
  //  each line hugs its word via `width: max-content` / `width: 100%`.)

  // ------------------------------------------------------------
  //  Contact form — POSTs to the server-side receiver (contact.php)
  //  via fetch() and shows inline success/error. Falls back to a
  //  mailto: URL if the fetch fails (network error, server down).
  //  Progressive enhancement: if JS is disabled, the form posts
  //  natively to the same endpoint via the action attribute.
  // ------------------------------------------------------------
  function initContactForm() {
    var form = document.querySelector('.bw-form');
    if (!form) return;
    var okBanner  = form.querySelector('.bw-form__ok');
    var errBanner = form.querySelector('.bw-form__err');
    var submitBtn = form.querySelector('button[type="submit"]');

    // Time-trap stamp — contact.php rejects submissions arriving faster
    // than ~3s after this is set. Bots POST instantly; humans take ≥10s.
    var rtField = form.querySelector('[name="_rt"]');
    if (rtField) rtField.value = String(Date.now());

    function showOk()  { if (okBanner)  okBanner.style.display  = 'flex'; if (errBanner) errBanner.style.display = 'none'; }
    function showErr(msg) {
      if (errBanner) {
        errBanner.style.display = 'flex';
        if (msg) {
          var msgEl = errBanner.querySelector('.bw-form__err-msg');
          if (msgEl) msgEl.textContent = msg;
        }
      }
      if (okBanner) okBanner.style.display = 'none';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '.7'; }

      var data = new FormData(form);

      fetch(form.getAttribute('action') || 'contact.php', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
      .then(function (res) {
        return res.json().then(function (j) { return { ok: res.ok, body: j }; });
      })
      .then(function (r) {
        if (r.ok && r.body && r.body.ok) {
          showOk();
          form.reset();
        } else {
          showErr((r.body && r.body.error) || null);
        }
      })
      .catch(function (err) {
        // Network failure — fall back to opening the user's mail
        // client with pre-filled fields so the submission isn't lost.
        var get = function (name) {
          var el = form.querySelector('[name="' + name + '"]');
          return el ? (el.value || '').trim() : '';
        };
        var name  = get('name');
        var email = get('email');
        var org   = get('org');
        var topic = get('topic');
        var msg   = get('msg');
        var ndaEl = form.querySelector('#nda');
        var ndaLn = ndaEl && ndaEl.checked ? 'NDA: ja — bitte vor dem Gespräch senden.' : '';
        var body = [
          'Name: ' + name, 'E-Mail: ' + email, 'Organisation: ' + org,
          'Thema: ' + topic, '', 'Nachricht:', msg, '', ndaLn
        ].filter(Boolean).join('\n');
        var subject = 'Anfrage über markwernsdorfer.com — ' + (topic || 'Allgemein');
        window.location.href =
          'mailto:wernsdorfer@gmail.com?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
        showErr('Senden fehlgeschlagen — Dein E-Mail-Programm öffnet sich als Fallback.');
      })
      .then(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ''; }
      });
    });
  }

  // ------------------------------------------------------------
  //  Mobile bottom-nav viewport sync.
  //  Earlier attempts relied on `position: fixed; bottom: 0` plus a
  //  translateY correction. That depends on where each engine anchors
  //  fixed-bottom (iOS = layout viewport, Firefox Android = buggy paint
  //  during URL-bar animation, Bugzilla #1880375). Sentinel measurement
  //  reads the LAYOUT position, not the painted one — so when Firefox
  //  paints fixed-bottom in the wrong place, the sentinel sees nothing
  //  wrong and the correction is a no-op.
  //
  //  Robust fix: bypass fixed-bottom entirely. Compute the absolute pixel
  //  position where the nav should sit (visual viewport bottom minus nav
  //  height), and set `top` directly via a CSS custom property. The CSS
  //  rule uses `top: var(--mobnav-top, auto)` so it falls back to the
  //  default `bottom: 0` on browsers without visualViewport.
  // ------------------------------------------------------------
  function initMobnavViewportSync() {
    if (!window.visualViewport) return;   // older browsers: bottom:0 fallback
    var nav = document.querySelector('.bw-mobnav');
    if (!nav) return;
    // Measure nav's natural height ONCE before we override its bottom anchor;
    // subsequent measurements would include any stretching from `top + bottom`
    // both being set during a transient state.
    var navHeight = nav.offsetHeight;
    function sync() {
      var vv = window.visualViewport;
      // Switch nav from bottom-anchored to top-anchored. `bottom: auto`
      // releases the default `bottom: 0` so the nav's height stays
      // natural and its top edge sits where we tell it to.
      nav.style.bottom = 'auto';
      nav.style.top = (vv.offsetTop + vv.height - navHeight) + 'px';
    }
    window.visualViewport.addEventListener('resize', sync);
    window.visualViewport.addEventListener('scroll', sync);
    // Firefox Android fires vv.scroll less reliably than Chrome during
    // URL-bar animation — add window.scroll as a fallback ticker.
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  // ------------------------------------------------------------
  //  Boot
  // ------------------------------------------------------------
  function boot() {
    initThemeToggle();
    initFilters();
    initYear();
    // Decor layer first (it appends to <main>), then observable marking,
    // so decor shapes participate in scroll-in.
    initDecorLayer();
    markObservables();
    initScrollIn();
    initScrollVar();
    initQuoteCarousel();
    initContactForm();
    initMobnavViewportSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
