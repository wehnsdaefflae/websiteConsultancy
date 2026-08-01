# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repo.

## Repo layout

```
/
├── index.html              DE home              ← LIVE SITE
├── about.html              DE "Profil"
├── services.html           DE "Leistungen"
├── portfolio.html          DE "Projekte"
├── contact.html            DE "Kontakt"
├── datenschutz.html        DE "Datenschutz" (legal)
├── en/                     English mirror (6 pages; privacy = en/privacy.html)
│
├── .well-known/security.txt  RFC 9116 security contact
├── styles.css              1 file, ~3.7k lines — grep-friendly
├── colors_and_type.css     design tokens only
├── script.js               1 file, single IIFE (~1.5k lines)
│
├── contact.php             server-side form receiver (primary)
├── contact.node.js         Node.js alternative (excluded from Plesk deploy)
│
├── images/                 portrait webp variants
├── logos/                  institutional / client logos
├── portrait-mark.png       full-size source
│
├── .htaccess               Apache config shipped to webroot
├── .pleskignore            files excluded from Plesk deploy
├── .gitignore
├── robots.txt
├── sitemap.xml
├── README.md               live site's architecture doc
├── DEPLOY.md               Plesk setup instructions
├── CLAUDE.md               this file
│
└── deprecated/             the OLD Tailwind site (reference only)
    ├── index.html, css/, js/, en/, de/, images/, logos/, manifest.json
    └── .htaccess           (legacy one — not used)
```

**When asked to change / fix / build something**, it's always the
root live site — not `deprecated/`. Touch `deprecated/` only if the
user explicitly names a file inside it.

---

## Local dev

No build step, no watcher, no `package.json` — edit and refresh.

```bash
python3 -m http.server 8787   # static preview; contact form's PHP won't run
php -S localhost:8787          # full preview, exercises contact.php
```

Then open <http://localhost:8787/>. (In this harness, prefer the
`preview_*` tools over launching a server by hand.)

There is no test/lint/build tooling — "build" = `git push`.

---

## Deploy flow

See `DEPLOY.md`. TL;DR:

- Plesk Git integration pulls from this repo on `git push`.
- **Deployment path** in Plesk: **blank** (repo root = webroot).
- `.pleskignore` excludes `deprecated/`, dev docs, Node receiver.
- `git push` → live, no build step.

---

## Key conventions (live site)

Full detail in `README.md`. Do not violate these:

1. **One CSS file (`styles.css`), one JS file (`script.js`).**
   No modular split, no build step. Related rules are grouped into
   banner-commented blocks — search with `rg` / `grep`.

2. **Hover-safe rule**: `:hover` rules may change only `transform`,
   `color`, `background`, `box-shadow`, `outline`, `opacity`,
   `filter`. Never `padding`, `margin`, `border-width`, `font-size`,
   `width`, or `height` — those reflow and can wrap heading text
   onto a new line. Enforced across 40+ hover blocks.

3. **Dark mode** = `[data-theme="dark"]` on `<html>`. A single
   override block at the bottom of `styles.css` handles token flips
   + inverted-island sections (partners / footer / CTA / pullquote
   stay dark-on-light in dark mode) + motion reduction. When adding
   any new saturated card or coloured section, test in dark mode —
   `--ink` and `--paper` flip.

4. **Card lift**: cards rotate at rest (`--card-rot` per nth-child);
   on hover they translate `(-5px, -5px)` while `box-shadow` grows
   from `6px 6px` → `11px 11px`. Visible shadow stays put; the card
   appears to peel up. **`transform` and `box-shadow` transitions
   must share the same easing** (`var(--ease-pop)`) or the shadow
   visibly desyncs.

5. **Mobile**: every grid that collapses to one column on `≤900px`
   uses `grid-template-columns: minmax(0, 1fr)` — plain `1fr`
   inflates to content's max-content, which overflows long German
   words (zwischen, Ausgeliefert, Fünfzehn) on narrow phones.

6. **Theme persistence**: URL query param (`?t=dark`/`?t=light`)
   → localStorage → prefers-color-scheme. The inline `<script>` in
   every `<head>` runs **before first paint** to prevent flash-of-
   wrong-theme. Never add `defer` to that script.

7. **Contact form**: POSTs to `/contact.php` (PHP 7.4+ on Plesk).
   JS adds fetch-based feedback + mailto fallback. Config
   (`$RECIPIENT`, `$FROM`) lives at the top of `contact.php`.
   Honeypot + file-based rate limit built in.

---

## Common tasks

### Add a page to the live site

1. Copy an existing DE page (e.g. `about.html`).
2. Add the EN mirror in `en/`.
3. Wire the nav: add an entry to `<nav class="bw-nav">` AND
   `<nav class="bw-mobnav">` in every existing page's header.
4. Wire the language switch: `href="en/<newpage>.html"` on the DE
   version, `href="../<newpage>.html"` on the EN version.
   **Exception**: the legal page filename differs by language —
   DE is `datenschutz.html`, EN is `en/privacy.html`. The switch
   links cross-name (DE → `en/privacy.html`, EN → `../datenschutz.html`).
5. Use relative paths (no leading `/`).
6. Add the URL to `sitemap.xml`.

Note: the inline `<head>` script also does a one-time **language
auto-redirect** (browser `en` → `/en/…`, stored in `bw.lang`),
in addition to the theme logic in rule #6. Don't strip it.

### Change colours or typography

Only `colors_and_type.css`. Components read through CSS custom
properties; dark mode swaps neutrals in the same file's
`:root[data-theme="dark"]` block (with an extended override at the
bottom of `styles.css`).

### Fix a dark-mode contrast regression

Contrast audit snippet to run in the preview console:

```js
function contrast(a, b) {
  const p = c => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m && [+m[1], +m[2], +m[3]]; };
  const lum = ([r, g, b]) => {
    [r, g, b] = [r, g, b].map(c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); });
    return .2126 * r + .7152 * g + .0722 * b;
  };
  const [A, B] = [p(a), p(b)]; const [L1, L2] = [lum(A), lum(B)];
  return (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
}
```

Walk every text element, compute contrast against the nearest opaque
ancestor background, flag anything below 4.5:1. Fix in the override
block at the bottom of `styles.css`. **Use literal hex colours** (not
tokens) in dark-mode island overrides — a future token flip breaks
them otherwise.

### Add a hover animation

1. Never change layout properties (see rule #2).
2. Match the transition easing: `transform` + `box-shadow` + any
   other animated property must use `var(--ease-pop)` together if
   they're part of the same visual lift.
3. For cards / steps / windows / phases / works / times / stats /
   partners / toc-items: the combined
   `.<class>.bw-observable { transition: opacity .5s, transform .25s var(--ease-pop), box-shadow .25s var(--ease-pop); }`
   rule is what lets hover work after scroll-in entry. Keep the new
   component in that selector list if it participates.

---

## Legacy site (`deprecated/`, reference only)

The old Tailwind site is preserved under `deprecated/` for asset
salvage or archaeological reference. It uses a completely different
architecture (Tailwind CDN + modular CSS under `deprecated/css/` +
modular JS with ScrollManager / ResizeManager / IntersectionManager
patterns + `safeExecute()` error-boundary wrappers). None of that
applies to the live site.

---

## User context

- **User email**: wernsdorfer@gmail.com
- **Domain**: markwernsdorfer.com
- **GitHub**: https://github.com/wehnsdaefflae
- **LinkedIn**: https://www.linkedin.com/in/wernsdorfer/
