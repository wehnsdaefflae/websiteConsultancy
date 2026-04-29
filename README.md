# markwernsdorfer.com

Static site for Dr. Mark Wernsdorfer's AI consultancy. Two languages
(DE default, EN mirror). No build step. Deployed via Plesk.

---

## Stack

- **HTML5, vanilla CSS (CSS custom properties + `@media`), vanilla JS**
  — no framework, no bundler, no npm install
- **Fonts**: Rubik (body), Syne (headline), Space Mono (meta),
  Caprasimo (display accent) — loaded from Google Fonts
- **PHP** for the contact-form receiver (`contact.php`). Node.js
  equivalent (`contact.node.js`) ships alongside for servers that
  prefer Node.
- **Runtime**: any static host + PHP 7.4+ with `mail()`. We deploy
  via Plesk — see `DEPLOY.md`.

---

## File layout

```
/
├── index.html              DE home
├── about.html              DE "Profil"
├── services.html           DE "Leistungen"
├── portfolio.html          DE "Projekte"
├── contact.html            DE "Kontakt"
├── en/                     English mirror (same 5 pages)
│   ├── index.html
│   ├── about.html
│   ├── services.html
│   ├── portfolio.html
│   └── contact.html
│
├── colors_and_type.css     Design tokens (colours + typography)
├── styles.css              Everything else (1 file — on purpose)
├── script.js               All JS (1 file — on purpose)
│
├── contact.php             Server-side form receiver (primary)
├── contact.node.js         Node.js alternative (optional)
│
├── images/                 Profile portrait webp variants
├── logos/                  Partner / institution logos
│
├── .htaccess               Apache config (MIME, cache, security)
├── .pleskignore            Files NOT deployed to Plesk webroot
├── .gitignore
│
├── robots.txt              SEO
├── sitemap.xml             SEO
│
├── CLAUDE.md               guidance for Claude Code
├── DEPLOY.md               Plesk deployment instructions
└── README.md               this file
```

**Guiding principle**: one CSS file, one JS file. No modular split,
no import graph, no build step. The tradeoff is a single ~2,700-line
CSS file — searchable via `rg` / `grep`. Related rules are grouped
in commented blocks (see `styles.css` section banners).

---

## Design system

### Colour palette

All colours declared as CSS custom properties in `colors_and_type.css`.
Brand-saturated palette; bright colours (mint, yellow, lilac) stay
vivid in both light and dark mode; neutrals flip.

Key tokens:

| token | light | dark | used for |
|---|---|---|---|
| `--ink` | `#0A0A0A` | `#FFFFFF` | text, borders, shadow offset |
| `--paper` | `#FFF8E1` | `#0A0A0A` | main bg |
| `--paper-2` | `#F5ECD4` | `#141414` | secondary surfaces |
| `--tomato` | `#FF5A43` | `#FF7A66` | accent / CTA |
| `--yellow` | `#FFEF00` | `#FFEF00` | highlight / marker |
| `--mint` | `#34E5B3` | `#34E5B3` | secondary accent |
| `--lilac` | `#A7A5FF` | `#A7A5FF` | tertiary surface |
| `--royal` | `#3C3AE0` | `#5E5AFF` | deep blue block |

**Dark mode** is gated via `[data-theme="dark"]` on `<html>`. A single
override block at the bottom of `styles.css` handles:

- token flips (`--ink`, `--paper`, `--paper-2`, etc.)
- inverted-island sections (partners, footer, CTA, pullquote —
  forced to stay dark-on-light in dark mode regardless of token flip)
- saturated cards (tomato, royal, ink variants get literal
  light/dark text so readability survives the token flip)
- motion reduction (`animation: none; transition: none`)
- heading hover colour overrides on bright surfaces

### Typography

- `--font-head` — Syne, headings & navigation
- `--font-display` — Caprasimo, display accents
- `--font-body` — Rubik, body copy
- `--font-mono` — Space Mono, meta and eyebrows

Masthead headings use `clamp(40px, 9vw, 130px)` (floored at 30 px on
viewports ≤ 420 px, with `hyphens: auto` for long German compounds).

### Hover-safe rule

Any `:hover` rule may change only these properties:
`transform`, `color`, `background`, `box-shadow`, `outline`,
`opacity`, `filter`.

**Never** change `padding`, `margin`, `border-width`, `font-size`,
`width`, or `height` on hover — these cause reflow and may wrap
text onto a new line. This rule is enforced across every existing
hover block (40+).

### Cardboard-cutout shadows

Cards, buttons, pull-quote chips all use hard `box-shadow` offsets
(no blur) as paper-cutout shadows. Convention: `6px 6px 0` at rest,
`11px 11px 0` on hover (card lifts up-left by `-5px, -5px` so the
visible shadow offset stays constant — the card appears to peel off
the page).

### Highlight variants

Inline text highlights use `data-hi="A"`…`data-hi="F"` to opt into
one of six hover motions (flatten, scale-pop, underline-swipe,
colour-invert, wobble-stamp, mint-flip). See the `HIGHLIGHT
VARIANTS` section in `styles.css`.

---

## JS architecture

Single file `script.js`, wrapped in an IIFE. No classes. All init
functions are named `init…()` and called from `boot()`:

```
boot()
├── markObservables()          tags cards/rows with .bw-observable
├── initScrollIn()             IntersectionObserver toggles .is-in
├── initParallax()             RAF-driven --scroll-y on <html>
├── initDecor()                injects random decor shape layer
├── initThemeToggle()          [data-theme-toggle] button + URL ?t=
├── initQuoteCarousel()        pullquote rotator (5 s, pauses on hover)
└── initContactForm()          fetch POST with mailto fallback
```

No polyfills, no fallbacks for old browsers. Targets: Chrome/Firefox/
Safari/Edge current & current-1.

### Theme persistence

Three-tier cascade, inline script in each `<head>` runs before first
paint (no FOUC):

1. URL query param `?t=light` / `?t=dark` (survives cross-page nav
   via `propagateThemeToLinks()`)
2. `localStorage['bw.theme']`
3. `prefers-color-scheme` media feature

---

## Contact form

The form POSTs to `/contact.php` via `fetch()` with an inline
success / error banner. Features:

- **Honeypot** (`<input name="website">` hidden off-screen) —
  bots that fill every text field get silently "succeeded"
- **Rate limit** — 5 submissions per IP per hour, file-based in
  `sys_get_temp_dir()`
- **Validation** — required fields + email format + length caps
- **mailto fallback** — if `fetch` fails (network / CORS / 5xx),
  the user's mail client opens with pre-filled subject and body
- **Progressive enhancement** — with JS disabled, the form still
  posts natively to `contact.php` via its `action` attribute

Config lives at the top of `contact.php` (`$RECIPIENT`, `$FROM`,
`$SITE_NAME`, `$RATE_LIMIT`). No env var needed. Node.js version
reads env vars if you prefer that setup.

---

## Mobile

Tested at 390×844 (iPhone 14). Key breakpoints:

| `@media` | what changes |
|---|---|
| `≤ 1100px` | header's `.lang` switch hides (keeps CTA visible) |
| `≤ 900px` | `.bw-nav` hides, `.bw-mobnav` (fixed bottom) takes over; most grids collapse to single column with `minmax(0, 1fr)`; hero stub hides |
| `≤ 640px` | brand shrinks to 18 px; header CTA hides (bottom nav surfaces Kontakt); tools padding compacted |
| `≤ 420px` | masthead headline floor drops to 30 px; `hyphens: auto` allowed for long words |

All grid columns that collapse to 1 on mobile use `minmax(0, 1fr)`
instead of plain `1fr` so tracks can shrink below the content's
intrinsic max-content size (otherwise a single `max-width: 44ch`
lede inflates the track and the heading overflows).

---

## Local dev

```bash
# static preview (no contact form)
python3 -m http.server 8787

# with contact form (requires PHP)
php -S localhost:8787
```

Then open <http://localhost:8787/>. No build step, no watcher,
just edit and refresh.

---

## Deploy

See `DEPLOY.md`. TL;DR: Plesk Git integration, deployment path blank
(= repo root), push to trigger deploy. `.pleskignore` keeps the
dev-only files out of the webroot.
