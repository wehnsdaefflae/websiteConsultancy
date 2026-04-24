/* Dr. Mark Wernsdorfer — site scripts (single module, no framework) */

(() => {
  'use strict';

  // Theme — day / night edition toggle -------------------------------------
  const THEME_KEY = 'mw.theme';
  const root = document.documentElement;

  function applyTheme(t) {
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }

  function initTheme() {
    // Theme is applied inline in <head> before first paint; this handles the
    // user-click case. Enable transitions only after first frame so the
    // initial paint doesn't show a flash.
    requestAnimationFrame(() => root.classList.add('transitions-enabled'));

    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;

    const syncButton = () => {
      const isDark = root.classList.contains('dark');
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.dataset.edition = isDark ? 'night' : 'day';
    };
    syncButton();

    btn.addEventListener('click', () => {
      const next = root.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      syncButton();
    });
  }

  // Project filters --------------------------------------------------------
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

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(el => {
      el.textContent = String(new Date().getFullYear());
    });
  }

  // YouTube facade — only load iframe on click (GDPR + performance) -------
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
    initFilters();
    initVideos();
    initYear();
  });
})();
