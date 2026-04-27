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
  //  Decorative shape layer — fewer, bigger, more varied cardboard-cut
  //  shapes that ride over the page. About 10 are picked per pathname
  //  so each subpage has a distinct silhouette set, with a path-derived
  //  palette rotation so the same shape entry shows up in different
  //  colors on different pages. Most center-crossing (xp) shapes use
  //  a long horizontal "drift" idle animation so they continually
  //  traverse the column rather than parking on a headline. Dark mode
  //  hides the layer entirely (see styles.css [data-theme="dark"]).
  // ------------------------------------------------------------
  function initDecorLayer() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.documentElement.dataset.theme === 'dark') return;
    var main = document.querySelector('main');
    if (!main) return;

    // SVG renderers — the wrapper element is positioner; the SVG fills
    // it. CSS draws the chunky --ink stroke + offset drop-shadow so
    // every shape stays inside the cardboard-collage grammar.
    var SVG_RENDERERS = {
      triangle: function () {
        return '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'
          + '<polygon points="50,8 92,90 8,90" fill="var(--bg)"/></svg>';
      },
      hexagon: function () {
        return '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'
          + '<polygon points="50,6 92,28 92,72 50,94 8,72 8,28" fill="var(--bg)"/></svg>';
      },
      star: function () {
        return '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'
          + '<polygon points="50,6 62,38 95,38 68,58 79,94 50,72 21,94 32,58 5,38 38,38" fill="var(--bg)"/></svg>';
      },
      arrow: function () {
        return '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'
          + '<polygon points="6,38 60,38 60,12 96,50 60,88 60,62 6,62" fill="var(--bg)"/></svg>';
      },
      squiggle: function () {
        // Stroke-only; no fill. Color comes from --bg via CSS.
        return '<svg viewBox="0 0 200 50" preserveAspectRatio="none">'
          + '<path d="M8,25 Q38,-2 68,25 T128,25 T188,25" fill="none"/></svg>';
      },
      asterisk: function () {
        return '<svg viewBox="0 0 100 100">'
          + '<g><line x1="50" y1="8" x2="50" y2="92"/>'
          + '<line x1="8" y1="50" x2="92" y2="50"/>'
          + '<line x1="22" y1="22" x2="78" y2="78"/>'
          + '<line x1="78" y1="22" x2="22" y2="78"/></g></svg>';
      }
    };
    function isSvgShape(name) { return name in SVG_RENDERERS; }

    // Palette rotated per pathname so the same shape entry shows up in
    // different colors across subpages. Order matters: it's the
    // rotation cycle, not a random shuffle.
    var COLORS = ['yellow','mint','tomato','lilac','sky','lime','hot-pink','royal','orange'];

    // ---- POOL — text-safe placement, scroll-driven motion ----------
    //   Each shape's resting position (scroll=0 anchor) is in a known
    //   text-safe zone: either an inter-section gutter or beyond the
    //   text column (x / xr edge anchors). Motion comes ENTIRELY from
    //   scroll: vertical parallax (k) lifts the shape up the page,
    //   horizontal drift (kx) sweeps it across the column, rotation
    //   (kr) tumbles it. When the user stops scrolling, the shape
    //   stops moving — no idle drift, so a shape that sits clear of
    //   text at rest never wanders onto text while reading.
    //
    //   xp values are chosen to land at section transitions (the
    //   horizontal seams between coloured bands on the page), and
    //   kx is signed so center shapes anchored on one side sweep
    //   diagonally toward the other side as you scroll, giving the
    //   "cuts cross the column" feel without idle motion.
    var POOL = [
      // ---- CENTER-CROSSING SHAPES (xp) ----------------------------
      //   Anchored at section seams (rest position is in an inter-
      //   section gutter, not on text). Vertical k is small (0.04-0.07)
      //   so the shape stays near its gutter row instead of traversing
      //   text-bearing sections; horizontal kx is large (±0.10-0.16)
      //   so as the user scrolls THROUGH that row, the shape sweeps
      //   visibly across the column. The two together produce a
      //   diagonal scroll-driven sweep without idle motion.
      // Center shapes: k=0 (vertically locked to anchor row) + large kx
      // (visible horizontal sweep on scroll). Anchored ONLY at the
      // page's wide inter-section gutters where there's no body text:
      //   ~12% — above the section sequence (off-paper stats stripe)
      //   ~46% — Felder cards row 2 → pullquote (175px gap)
      //   ~78% — projects last entry → Phasen heading (325px gap)
      //   ~97% — under the CTA (dive-under z-stacking covers it)
      // Skipped rows: the Haltung lede sits at ~22-24%, the projects
      // cards span 55-72% with right-side metadata columns, the stats
      // grid is 86-90% — all too text-dense for a center shape.
      { shape: 'star',     w: 140, h: 140, top: 12, xp: 16, rot: -10, bg: 'orange',   k: 0, kx:  0.16, kr:  0.014, anim: 'spin' },
      { shape: 'asterisk', w: 130, h: 130, top: 46, xp: 18, rot:   0, bg: 'hot-pink', k: 0, kx:  0.18, kr:  0.020, anim: 'spin' },
      { shape: 'squiggle', w: 220, h: 50,  top: 78, xp: 84, rot:  -6, bg: 'royal',    k: 0, kx: -0.22, kr:  0.010 },
      { shape: 'diamond',  w: 130, h: 130, top: 97, xp: 35, rot:  38, bg: 'lime',     k: 0, kx:  0.14, kr:  0.014 },
      { shape: 'triangle', w: 160, h: 160, top: 99, xp: 70, rot: -12, bg: 'yellow',   k: 0, kx: -0.12, kr: -0.016 },

      // ---- EDGE-ANCHORED FRAMERS ----------------------------------
      //   Anchored outside the text column. kx is signed to push the
      //   shape OUTWARD as you scroll (left shapes drift further left,
      //   right shapes further right), so even at maximum scroll they
      //   never invade the column. Most of each shape is off-screen at
      //   rest; the visible peek grows as you scroll past them.
      { shape: 'circle',   w: 220, h: 220, top:  6, xr: -150, rot:   0, bg: 'mint',     k: 0.10, kx:  0.04, kr:  0.008, anim: 'spin' },
      { shape: 'rect',     w: 130, h: 110, top: 18, x:  -130, rot: -16, bg: 'yellow',   k: 0.14, kx: -0.05, kr:  0.012 },
      { shape: 'plus',     w: 120, h: 120, top: 30, xr: -75,  rot:   8, bg: 'tomato',   k: 0.18, kx:  0.04, kr: -0.018 },
      { shape: 'star',     w: 150, h: 150, top: 42, x:  -110, rot:  10, bg: 'lime',     k: 0.16, kx: -0.05, kr:  0.014, anim: 'spin' },
      { shape: 'diamond',  w: 140, h: 140, top: 54, xr: -100, rot:  45, bg: 'hot-pink', k: 0.12, kx:  0.04, kr:  0.010 },
      { shape: 'hexagon',  w: 160, h: 160, top: 66, x:  -130, rot:  18, bg: 'sky',      k: 0.14, kx: -0.04, kr:  0.012, anim: 'spin' },
      { shape: 'arch',     w: 220, h: 110, top: 78, xr: -140, rot:  -6, bg: 'tomato',   k: 0.10, kx:  0.03, kr:  0.008 },
      { shape: 'asterisk', w: 140, h: 140, top: 90, x:  -90,  rot:   0, bg: 'royal',    k: 0.16, kx: -0.05, kr:  0.014, anim: 'spin' },

      // ---- DEEP BACKGROUND --------------------------------------
      { shape: 'circle',   w: 300, h: 300, top: 33, xr: -190, rot:   0, bg: 'yellow', k: 0.05, kx:  0.02, kr:  0.004 },
      { shape: 'arch',     w: 340, h: 170, top: 70, x:  -220, rot:   8, bg: 'lilac',  k: 0.06, kx: -0.02, kr:  0.004 },
      { shape: 'hexagon',  w: 260, h: 260, top: 95, xr: -180, rot: -12, bg: 'mint',   k: 0.04, kx:  0.02, kr:  0.003, anim: 'spin' }
    ];

    function pathHash(s) {
      var h = 2166136261 >>> 0;
      for (var i = 0; i < s.length; i++) h = ((h ^ s.charCodeAt(i)) * 16777619) >>> 0;
      return h;
    }
    var path = (location.pathname || '/').toLowerCase();
    var h = pathHash(path);

    // Pick ~10 shapes — small enough that each subpage feels distinct
    // rather than the same backdrop with minor shuffling.
    var TARGET = 10;
    var chosen = [];
    var used = new Set();
    for (var i = 0; i < POOL.length && chosen.length < TARGET; i++) {
      var idx = (i * 7 + ((h >>> (i % 24)) % POOL.length)) % POOL.length;
      while (used.has(idx)) idx = (idx + 1) % POOL.length;
      used.add(idx);
      chosen.push(POOL[idx]);
    }

    // Palette rotation per pathname — same shape entry, different color
    // on different pages. Keeps the pool small but pages feel singular.
    var paletteShift = (h >>> 4) % COLORS.length;
    function shiftColor(name) {
      var i = COLORS.indexOf(name);
      if (i < 0) return 'var(--' + name + ')';
      return 'var(--' + COLORS[(i + paletteShift) % COLORS.length] + ')';
    }

    var layer = document.createElement('div');
    layer.className = 'bw-decor';
    layer.setAttribute('aria-hidden', 'true');

    // ---- TEXT-SAFE GUTTER DETECTION ---------------------------------
    //   For center-crossing (xp) shapes we don't trust the pool's `top`
    //   percent literally — different pages have different section
    //   layouts, so a hard-coded 46% might land on a card row on one
    //   page and on whitespace on another. Instead we scan main's
    //   immediate <section> children, find the inter-section gaps
    //   (whitespace between coloured bands), and snap each xp shape's
    //   anchor to the closest gap-midpoint to its intended top%.
    //   Edge-anchored shapes (x / xr) keep their literal top% — they
    //   live outside the column so their vertical position can't hit
    //   text regardless of section layout.
    // Find text-free vertical bands inside main: scan every heading
    // and large display paragraph, merge their Y-intervals, then take
    // the gaps between merged intervals as safe anchor candidates.
    // This works regardless of how the page is sectioned — what
    // matters is where headlines and ledes actually sit. xp shapes
    // snap to whichever gap-midpoint is closest to their requested
    // top%, so the pool's intent ("ride near 46% of the page") is
    // respected while the actual position lands in real whitespace.
    var mainTop = main.getBoundingClientRect().top + window.scrollY;
    var mainH = main.offsetHeight;
    // Two kinds of text-anchors:
    //   (a) Headings & display ledes — treat their bbox as one interval.
    //   (b) Self-contained content blocks (cards / project entries /
    //       phase cards / pullquote bodies) — treat their FULL rect as
    //       a text interval, since a shape landing anywhere on a card
    //       overlaps copy even if the heading itself is clear.
    var headingEls = main.querySelectorAll('h1, h2, h3, .bw-mast__title, .bw-mast__lede, .bw-segment__body p, .bw-pq__quote, strong');
    var blockEls = main.querySelectorAll('.bw-card, .bw-work, .bw-phase, .bw-pullquote, .bw-haltung, .bw-segment, .bw-stat, .bw-pubs, .bw-spec, .bw-format, .bw-step, .bw-mast__strip, .bw-mast__inner, .bw-imprint');
    var intervals = [];
    headingEls.forEach(function (e) {
      var cs = window.getComputedStyle(e);
      var fs = parseFloat(cs.fontSize);
      var fw = parseInt(cs.fontWeight);
      // Treat as text-anchor if it's a real heading-class element
      // (h1/h2/h3, mast lede/title, pullquote body) regardless of
      // size — section ledes can be 20px non-bold but still need
      // protecting. <strong> and inline emphasis only count if the
      // font is genuinely big OR bold-700.
      var isHeadingClass = /^H[1-3]$/.test(e.tagName) ||
        /bw-(mast__title|mast__lede|pq__quote|segment__body)/.test(e.className);
      if (!isHeadingClass && fs < 22 && fw < 700) return;
      var r = e.getBoundingClientRect();
      if (r.height <= 0) return;
      intervals.push([r.top + window.scrollY - mainTop, r.bottom + window.scrollY - mainTop]);
    });
    blockEls.forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.height <= 0) return;
      intervals.push([r.top + window.scrollY - mainTop, r.bottom + window.scrollY - mainTop]);
    });
    intervals.sort(function (a, b) { return a[0] - b[0]; });
    // Merge intervals that abut or come within 30px of each other.
    var merged = [];
    intervals.forEach(function (iv) {
      if (merged.length && iv[0] <= merged[merged.length - 1][1] + 30) {
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], iv[1]);
      } else {
        merged.push(iv.slice());
      }
    });
    // Gaps between text bands are our safe anchor candidates. Require
    // ≥180px so a shape (up to 160px + rotation/shadow expansion ~30%)
    // sits centered with at least ~10px buffer above and below the
    // nearest text band. Each anchor is the gap midpoint as a percent
    // of main height.
    var anchors = [];
    var prevEnd = 0;
    merged.forEach(function (iv) {
      if (iv[0] - prevEnd >= 180) {
        anchors.push(((prevEnd + iv[0]) / 2) / mainH * 100);
      }
      prevEnd = iv[1];
    });
    if (mainH - prevEnd >= 180) {
      anchors.push(((prevEnd + mainH) / 2) / mainH * 100);
    }

    function snapToAnchor(targetPct) {
      if (!anchors.length) return targetPct;
      var best = anchors[0];
      var bestDist = Math.abs(best - targetPct);
      for (var i = 1; i < anchors.length; i++) {
        var d = Math.abs(anchors[i] - targetPct);
        if (d < bestDist) { best = anchors[i]; bestDist = d; }
      }
      return best;
    }

    chosen.forEach(function (s, i) {
      var e = document.createElement('span');
      var classes = ['bw-decor__shape', 'bw-decor__shape--' + s.shape];
      if (isSvgShape(s.shape)) classes.push('bw-decor__shape--svg');
      if (s.anim) classes.push('bw-decor__shape--anim-' + s.anim);
      e.className = classes.join(' ');

      // Snap xp-anchored shapes into a real text-free band, then
      // adjust so the shape's CENTER (not top edge) sits at the
      // band midpoint — otherwise a 150px-tall shape extends down
      // into the heading immediately below the gap.
      var topPct;
      if (s.xp !== undefined) {
        var snappedPct = snapToAnchor(s.top);
        topPct = snappedPct - (s.h / 2 / mainH * 100);
      } else {
        topPct = s.top;
      }
      e.style.top = topPct + '%';
      if (s.x !== undefined) e.style.left = s.x + 'px';
      if (s.xr !== undefined) e.style.right = s.xr + 'px';
      if (s.xp !== undefined) {
        e.style.left = s.xp + '%';
        e.style.marginLeft = (-s.w / 2) + 'px';
        e.classList.add('bw-decor__shape--cross');
      }

      e.style.width = s.w + 'px';
      e.style.height = s.h + 'px';
      e.style.setProperty('--bg', shiftColor(s.bg));
      e.style.setProperty('--dec-rot', s.rot + 'deg');
      e.style.setProperty('--dec-k', s.k);
      if (s.kx !== undefined) e.style.setProperty('--dec-kx', s.kx);
      if (s.kr !== undefined) e.style.setProperty('--dec-kr', s.kr);

      // Only spin uses an idle keyframe; stagger its phase so adjacent
      // shapes don't rotate in lockstep. Negative delay starts mid-cycle
      // so motion is already underway at first paint.
      if (s.anim === 'spin') {
        var delay = -((i * 5.3 + ((h >>> i) & 7)) % 38).toFixed(2);
        e.style.animationDelay = delay + 's';
      }

      if (isSvgShape(s.shape)) e.innerHTML = SVG_RENDERERS[s.shape]();

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
