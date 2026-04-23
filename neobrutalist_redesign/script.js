/* ============================================================
   BLOCKWERK — tiny runtime
   - day/night theme toggle (localStorage-persisted)
   - filter buttons on portfolio page
   - year stamp
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'bw.theme';
  var root = document.documentElement;

  function applyTheme(t) {
    if (t === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }

  // Theme is set inline in <head> before first paint. This picks up clicks.
  function initThemeToggle() {
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;

    function sync() {
      var dark = root.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.dataset.edition = dark ? 'night' : 'day';
    }
    sync();

    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initThemeToggle();
      initFilters();
      initYear();
    });
  } else {
    initThemeToggle();
    initFilters();
    initYear();
  }
})();
