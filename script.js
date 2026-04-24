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
    //   Shapes are positioned on the LEFT / RIGHT edges (most poking
    //   in from off-screen) so they don't land on body text. Each
    //   shape has its OWN scroll-parallax coefficient (--dec-k) so
    //   they glide at different speeds, and its OWN rotation base.
    //   Pool is intentionally large (~22) — we pick ~12 per page via
    //   pathname hash, so every subpage gets a different subset.
    var POOL = [
      { shape: 'rect',    w: 130, h: 95,  top: 6,   x: -60,  rot: -16, bg: 'var(--yellow)',   k: 0.06 },
      { shape: 'circle',  w: 160, h: 160, top: 11,  xr: -70, rot: 6,   bg: 'var(--mint)',     k: 0.05 },
      { shape: 'diamond', w: 70,  h: 70,  top: 16,  x: -35,  rot: 45,  bg: 'var(--tomato)',   k: 0.08 },
      { shape: 'rect',    w: 70,  h: 70,  top: 22,  x: -30,  rot: 24,  bg: 'var(--lilac)',    k: 0.09 },
      { shape: 'circle',  w: 95,  h: 95,  top: 28,  xr: -35, rot: 0,   bg: 'var(--sky)',      k: 0.06 },
      { shape: 'rect',    w: 155, h: 45,  top: 33,  x: -80,  rot: -8,  bg: 'var(--hot-pink)', k: 0.07 },
      { shape: 'plus',    w: 70,  h: 70,  top: 38,  xr: -25, rot: 10,  bg: 'var(--ink)',      k: 0.09 },
      { shape: 'diamond', w: 60,  h: 60,  top: 43,  x: -25,  rot: 48,  bg: 'var(--yellow)',   k: 0.05 },
      { shape: 'circle',  w: 75,  h: 75,  top: 48,  xr: -10, rot: 0,   bg: 'var(--hot-pink)', k: 0.07 },
      { shape: 'rect',    w: 190, h: 55,  top: 53,  x: -95,  rot: 9,   bg: 'var(--sky)',      k: 0.04 },
      { shape: 'rect',    w: 85,  h: 85,  top: 58,  xr: -45, rot: -6,  bg: 'var(--mint)',     k: 0.08 },
      { shape: 'plus',    w: 58,  h: 58,  top: 63,  x: -25,  rot: -15, bg: 'var(--ink)',      k: 0.1  },
      { shape: 'circle',  w: 130, h: 130, top: 68,  xr: -70, rot: 0,   bg: 'var(--lilac)',    k: 0.05 },
      { shape: 'diamond', w: 90,  h: 90,  top: 74,  x: -45,  rot: 40,  bg: 'var(--mint)',     k: 0.06 },
      { shape: 'rect',    w: 120, h: 90,  top: 79,  xr: -55, rot: 15,  bg: 'var(--tomato)',   k: 0.08 },
      { shape: 'plus',    w: 80,  h: 80,  top: 84,  x: -30,  rot: 18,  bg: 'var(--ink)',      k: 0.09 },
      { shape: 'rect',    w: 100, h: 100, top: 88,  x: -50,  rot: -12, bg: 'var(--tomato)',   k: 0.08 },
      { shape: 'circle',  w: 140, h: 140, top: 92,  xr: -70, rot: 0,   bg: 'var(--royal)',    k: 0.03 },
      { shape: 'diamond', w: 55,  h: 55,  top: 96,  xr: -25, rot: 50,  bg: 'var(--yellow)',   k: 0.08 },
      { shape: 'rect',    w: 115, h: 60,  top: 99,  x: -70,  rot: 8,   bg: 'var(--sky)',      k: 0.05 },
      { shape: 'circle',  w: 80,  h: 80,  top: 101, xr: -35, rot: 0,   bg: 'var(--hot-pink)', k: 0.07 },
      { shape: 'plus',    w: 65,  h: 65,  top: 103, x: -30,  rot: 24,  bg: 'var(--ink)',      k: 0.1  }
    ];

    // Pick ~12 shapes deterministically based on pathname — different
    // subpages get distinct combinations. Uses a tiny hash for each
    // candidate index so the selected set isn't just a contiguous slice.
    function pathHash(s) {
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) h = ((h ^ s.charCodeAt(i)) * 16777619) >>> 0;
      return h;
    }
    var path = (location.pathname || location.hash || '').toLowerCase();
    var h = pathHash(path);
    var want = Math.min(14, POOL.length);
    // Select `want` items — ordered by (index + h * (index+1)) mod POOL.length
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
      e.className = 'bw-decor__shape bw-decor__shape--' + s.shape;
      e.style.top = s.top + '%';
      if (s.x !== undefined) e.style.left = s.x + 'px';
      if (s.xr !== undefined) e.style.right = s.xr + 'px';
      e.style.width = s.w + 'px';
      e.style.height = s.h + 'px';
      e.style.background = s.bg;
      e.style.setProperty('--dec-rot', s.rot + 'deg');
      e.style.setProperty('--dec-k', s.k);
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
  //  On Firefox Android (and iOS Safari) a fixed `bottom: 0` nav
  //  drifts during URL-bar show/hide animations — the nav is anchored
  //  to the LARGE viewport but the user sees the SMALL viewport's
  //  bottom, so the nav floats above (or sits behind) the URL bar
  //  until a scroll event triggers a relayout.
  //
  //  The definitive fix is the visualViewport API: it reports the
  //  CURRENT visible viewport every frame. We expose the delta between
  //  layout and visual heights as a CSS custom property; the nav's
  //  `transform: translateY(calc(-1 * var(--vv-offset)))` rule reads
  //  it and self-corrects every frame to stay flush with the visual
  //  viewport bottom.
  // ------------------------------------------------------------
  function initMobnavViewportSync() {
    if (!window.visualViewport) return;   // older browsers: no-op
    var root = document.documentElement;
    function sync() {
      var delta = Math.max(0, window.innerHeight - window.visualViewport.height);
      root.style.setProperty('--vv-offset', delta + 'px');
    }
    window.visualViewport.addEventListener('resize', sync);
    window.visualViewport.addEventListener('scroll', sync);
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
