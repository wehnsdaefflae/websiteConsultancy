/* Dr. Mark Wernsdorfer — site scripts (single module, no framework) */

(() => {
  'use strict';

  // Theme ---------------------------------------------------------------
  const THEME_KEY = 'mw.theme';
  const root = document.documentElement;

  function applyTheme(t) {
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }

  function initTheme() {
    // Theme was set inline before first paint to avoid flash. This re-syncs
    // and enables transitions for user-initiated switches.
    requestAnimationFrame(() => root.classList.add('transitions-enabled'));

    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = root.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // Reveal on scroll ----------------------------------------------------
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    els.forEach(el => io.observe(el));
  }

  // Marquee: duplicate children so translateX(-50%) loops seamlessly ----
  function initMarquee() {
    document.querySelectorAll('.marquee__track').forEach(track => {
      if (track.dataset.doubled) return;
      Array.from(track.children).forEach(k => {
        const c = k.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      });
      track.dataset.doubled = '1';
    });
  }

  // Project filters ----------------------------------------------------
  function initFilters() {
    const filterRow = document.querySelector('[data-filters]');
    if (!filterRow) return;
    const items = document.querySelectorAll('[data-tags]');
    filterRow.querySelectorAll('.filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.filter;
        filterRow.querySelectorAll('.filter').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        items.forEach(it => {
          const tags = (it.dataset.tags || '').split(/\s+/);
          if (tag === 'all' || tags.includes(tag)) {
            it.classList.remove('u-hide');
          } else {
            it.classList.add('u-hide');
          }
        });
      });
    });
  }

  // Subtle year ticker in header-tools (optional - just sets the year) --
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(el => {
      el.textContent = String(new Date().getFullYear());
    });
  }

  // YouTube facade — only load iframe on click (GDPR + performance) -----
  function initVideos() {
    document.querySelectorAll('[data-youtube]').forEach(el => {
      el.addEventListener('click', () => {
        if (el.dataset.playing === 'true') return;
        const id = el.dataset.youtube;
        const title = el.getAttribute('aria-label') || 'Video';
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
        iframe.title = title;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        el.appendChild(iframe);
        el.dataset.playing = 'true';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initReveal();
    initMarquee();
    initFilters();
    initVideos();
    initYear();
  });
})();
