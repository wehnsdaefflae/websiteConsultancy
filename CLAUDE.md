# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional consultancy website for Dr. Mark Wernsdorfer, an AI consultant specializing in machine learning, healthcare AI systems, and digital literacy tools. The site is a static HTML/CSS/JavaScript application with a focus on performance, accessibility, and conversion optimization.

**Target Audience**: Business decision-makers, SMEs, research institutions seeking AI consulting services.

## Key Architectural Decisions

This codebase prioritizes **performance**, **maintainability**, and **zero build complexity**:

1. **No Build Process**: Static HTML/CSS/JS with no npm, webpack, or bundlers. Edit files directly, refresh browser.
2. **Centralized Resource Management**: Single ScrollManager, ResizeManager, IntersectionManager to prevent multiple event listeners (critical for 60fps scroll performance).
3. **Progressive Enhancement**: Critical path loads immediately, non-critical features use `requestIdleCallback`, animations load only when visible.
4. **Configuration-Driven**: All magic numbers (timing, dimensions, breakpoints) centralized in `config.js`.
5. **Error Resilience**: All feature init wrapped in `safeExecute()` error boundaries; one feature breaking doesn't cascade.
6. **Theme Flicker Prevention**: Inline `<script>` applies theme before first paint, avoiding the common dark mode "flash of wrong theme".

**When making changes**: Respect these patterns. Don't add direct scroll listeners, don't hard-code constants, always use error boundaries.

## Tech Stack

- **Frontend**: Static HTML5, vanilla JavaScript (ES6+), CSS3
- **Styling**: Tailwind CSS (CDN), custom CSS with CSS custom properties
- **Icons**: Material Icons (Google)
- **Fonts**: Google Fonts (Playfair Display, Roboto Slab, Inter, Noto Sans)
- **No Build Process**: Direct file editing, no bundler or package manager

## Architecture & Code Organization

### File Structure

```
/
├── index.html              # Homepage (English)
├── en/                     # English page variants
│   ├── about.html
│   ├── services.html
│   ├── projects.html
│   ├── publications.html
│   ├── community.html
│   ├── grants.html
│   └── contact.html
├── css/                    # Modular CSS architecture
│   ├── design-tokens.css   # CSS custom properties, design system variables
│   ├── base.css           # Base styles, resets
│   ├── layout.css         # Layout patterns, grid systems
│   ├── components.css     # Component-specific styles
│   ├── animations.css     # Animation definitions
│   ├── theme.css          # Theme-specific overrides
│   ├── theme-classes.css  # Utility theme classes
│   ├── mobile.css         # Mobile-specific styles
│   ├── utilities.css      # Utility classes
│   └── inline-styles.css  # Critical path styles
├── js/                     # Modular JavaScript (load order matters)
│   ├── config.js          # Configuration constants (load first)
│   ├── utils.js           # Error handling and performance utilities
│   ├── managers.js        # Centralized resource managers (Scroll, Resize, Intersection)
│   ├── theme.js           # Dark mode toggle, theme persistence
│   ├── core.js            # Initialization orchestration (load after foundation)
│   ├── navigation.js      # Navigation, mobile menu, carousel
│   ├── animations.js      # Parallax, advanced animations
│   └── interactions.js    # Interactive elements, form handling
├── images/                 # Optimized images (WebP preferred)
├── logos/                  # Client/partner logos (SVG/PNG)
└── additional_info/        # Content strategy guides
    ├── guide_tech.md      # Technical SEO optimization guide
    ├── guide_content.md   # Content strategy & conversion tips
    └── additional_info.md # Background information, CV, experience
```

### CSS Architecture

The CSS follows a **modular design system approach**:

1. **design-tokens.css** - Single source of truth for design tokens (colors, spacing, typography, shadows, transitions)
2. **Theming** - CSS custom properties enable light/dark mode with `.dark` class on `<html>`
3. **Layer Order** - CSS files are loaded in dependency order in `<head>`
4. **Mobile-First** - Base styles are mobile, with desktop overrides

**Key Design Tokens**:
- Spacing: `--space-xs` through `--space-5xl` (4px to 128px)
- Colors: Theme-aware with `--bg-primary`, `--text-primary`, `--accent-color`
- Typography: Scale from `--font-size-xs` to `--font-size-5xl`
- Transitions: `--transition-fast` (150ms), `--transition-normal` (300ms), `--transition-slow` (600ms)

### JavaScript Architecture

The JavaScript uses a **hybrid module system** combining ES6 exports with global namespace utilities:

**Foundation Layer** (ES6 modules exported to `window`):

1. **config.js** - Centralized configuration constants
   - Exports: `window.APP_CONFIG` object with:
     - `CAROUSEL_CONFIG`: Slide dimensions, timing, auto-play settings
     - `SCROLL_CONFIG`: Breakpoints and header heights
     - `ANIMATION_CONFIG`: Parallax speeds, debounce delays, durations
     - `OBSERVER_CONFIG`: IntersectionObserver thresholds
     - `PERFORMANCE_CONFIG`: Idle callback and frame budgets

2. **utils.js** - Performance and error handling utilities
   - Exports: `window.utils` object with:
     - `safeExecute(fn, context)`: Error boundary wrapper with analytics integration
     - `debounce(func, wait)`: Debounce utility for event handlers
     - `throttle(func, limit)`: Throttle utility for performance-critical code
   - Integrates with Google Analytics for exception tracking

3. **managers.js** - Centralized resource managers
   - **ScrollManager**: Single scroll listener with RAF-based handler registry
     - Prevents multiple scroll event listeners (performance optimization)
     - Uses `requestAnimationFrame` for smooth updates
     - Methods: `addHandler(handler)`, `removeHandler(handler)`, `getScrollY()`
   - **ResizeManager**: Centralized window resize handling with debouncing
   - **IntersectionManager**: Shared IntersectionObserver pool

**Feature Layer** (depends on foundation):

4. **core.js** - Orchestration and initialization
   - DOMContentLoaded orchestration with prioritized loading:
     - **Critical path**: Immediate init (scroll progress, core utilities)
     - **Deferred**: Uses `requestIdleCallback` for non-critical features
     - **Lazy**: Animation init only when elements enter viewport
   - Integrates ScrollManager for centralized scroll handling
   - Fallback for browsers without `requestIdleCallback`

5. **theme.js** - Dark mode implementation
   - Exports: `window.themeUtils`
   - localStorage persistence with system preference detection
   - Inline flicker-prevention script in `<head>` (runs before DOMContentLoaded)
   - Transition delay pattern to prevent jarring theme changes

6. **navigation.js** - Navigation and carousel logic
   - Mobile/desktop navigation switching (< 1024px breakpoint)
   - Logo carousel with auto-scroll, manual controls, and infinite loop
   - Active state management for current page highlighting

7. **animations.js** - Scroll-triggered and parallax animations
   - IntersectionObserver for viewport-based animation triggers
   - Parallax effects using ScrollManager
   - Performance-optimized with RAF and passive listeners

8. **interactions.js** - Interactive UI elements
   - Form validation and submission handling
   - Button ripple effects and hover interactions

**Initialization Pattern**:
```javascript
// Critical path (immediate)
window.utils.safeExecute(() => {
  initCore();
  initScrollProgress();
}, 'critical-init');

// Non-critical (deferred with requestIdleCallback)
requestIdleCallback(() => {
  window.utils.safeExecute(initNavigation, 'initNavigation');
}, { timeout: 2000 });

// Lazy (only when needed)
const observer = new IntersectionObserver((entries) => {
  if (entry.isIntersecting) {
    window.utils.safeExecute(initAnimations, 'initAnimations');
    observer.disconnect();
  }
});
```

**Key Patterns**:
- All potentially-failing code wrapped in `window.utils.safeExecute()`
- Single scroll listener via ScrollManager (not per-component listeners)
- Configuration centralized in `config.js` (no magic numbers in code)
- ES6 modules export to `window` for cross-file compatibility

**Script Load Order** (critical for dependencies):
```html
<!-- In <head> with defer attribute -->
<script src="js/config.js" defer></script>    <!-- 1. Load config first -->
<script src="js/utils.js" defer></script>     <!-- 2. Load utilities -->
<script src="js/managers.js" defer></script>  <!-- 3. Load managers -->
<script src="js/theme.js" defer></script>     <!-- 4. Load theme -->
<script src="js/core.js" defer></script>      <!-- 5. Load orchestrator -->
<script src="js/navigation.js" defer></script>
<script src="js/animations.js" defer></script>
<script src="js/interactions.js" defer></script>
```

The `defer` attribute ensures scripts execute in order after HTML parsing, but before `DOMContentLoaded`. Theme flicker prevention still uses an inline `<script>` (no defer) that runs immediately.

## Development Workflows

### Editing Content

1. **HTML Pages**: Edit directly in `index.html` or `en/*.html`
2. **Styles**: Modify appropriate CSS file in `css/` directory
3. **Scripts**: Update relevant JS module in `js/` directory

### Testing Changes

No build step required. Open HTML files directly in browser:

```bash
# Simple HTTP server for testing
python3 -m http.server 8000
# Or use any static file server
```

### Theme Development

When modifying themes:
1. Update design tokens in `css/design-tokens.css`
2. Add/modify light theme in `:root { }`
3. Add/modify dark theme in `:root.dark { }`
4. Test with theme toggle button (top-right of header)

### Debugging

The codebase includes comprehensive error tracking:

1. **Browser Console**: All errors logged with context via `safeExecute()`
2. **Google Analytics**: Errors sent to GA4 (if configured) with exception tracking
3. **Network Tab**: Check for missing resources or slow CDN loads

Common debugging scenarios:

```javascript
// Check if ScrollManager is working
console.log(window.scrollManager.getScrollY());

// Verify config loaded
console.log(window.APP_CONFIG);

// Check theme state
console.log(localStorage.getItem('theme'));
console.log(document.documentElement.classList.contains('dark'));
```

### Animation Performance

- Use IntersectionObserver for scroll-triggered animations
- Avoid animating expensive properties (use `transform`, `opacity`)
- All scroll listeners MUST use ScrollManager (never direct `addEventListener('scroll')`)
- Use `{ passive: true }` for scroll listeners in ScrollManager
- Debounce resize handlers via ResizeManager (see `managers.js`)

## Key Features & Patterns

### Dark Mode Implementation

The site has a sophisticated dark mode system:

1. **Inline Script** in `<head>` prevents flicker by applying theme before render
2. **localStorage** persistence (`theme` key: `'light'` or `'dark'`)
3. **System Preference Detection** via `prefers-color-scheme` media query
4. **Manual Override Tracking** - Auto-switching disabled for 1 hour after manual toggle
5. **Theme Icons** - Material Icons toggle between `dark_mode` and `light_mode`

**Toggle Function**: `window.themeUtils.enhancedToggleDarkMode(event)`

### Logo Carousel

Located in the "Trusted by Leading Institutions" section:

- Auto-scrolls continuously with CSS animation
- Manual navigation with prev/next buttons
- Dot indicators for slide tracking
- Duplicated logo sets for seamless infinite scroll
- Hover interaction pauses auto-scroll

### Mobile Navigation

- **Desktop** (≥1024px): Header nav visible, no bottom nav
- **Mobile** (<1024px): Header nav hidden, fixed bottom nav with 5 items
- Active state management based on current page
- Material Icons for navigation icons

### Scroll Progress Indicator

A fixed top bar showing page scroll percentage:
- Hidden until scrolled past 100px
- Smooth width animation
- Located in `initScrollProgress()` in `core.js`

### Form Handling

Contact forms use basic HTML5 validation:
- Required fields marked with `required` attribute
- Email validation with `type="email"`
- Custom form styling in `components.css`
- Form submission handling in `interactions.js`

## Content Strategy Integration

The `additional_info/` directory contains strategic guides:

- **guide_tech.md**: SEO, Core Web Vitals, schema markup strategies
- **guide_content.md**: Conversion optimization, content formulas, persuasion techniques
- **additional_info.md**: Dr. Wernsdorfer's CV, projects, credentials

These guides inform content decisions but are not directly served.

## Performance Considerations

### Current Optimizations

1. **Lazy Loading**: Images below fold use `loading="lazy"`
2. **WebP Images**: Hero and profile images use WebP format
3. **Font Loading**: `font-display: swap` on Google Fonts
4. **Preconnect**: DNS prefetch for Google Fonts
5. **Debounced Scroll**: Scroll handlers use debouncing (10ms)
6. **Passive Listeners**: Scroll events use `{ passive: true }`
7. **Intersection Observer**: Replaces scroll-based element tracking

### Optimization Targets

- **LCP** (Largest Contentful Paint): < 2.5s
- **INP** (Interaction to Next Paint): < 200ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Critical Rendering Path

1. Inline theme script prevents flicker
2. Tailwind CSS loaded from CDN (consider self-hosting for production)
3. Custom CSS files loaded in dependency order
4. JavaScript deferred with `defer` attribute

## SEO & Accessibility

### Current Implementation

- **Semantic HTML**: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- **ARIA Labels**: Buttons and links have descriptive labels
- **Skip Link**: Jump to main content for keyboard users
- **Alt Text**: All images have descriptive alt attributes
- **Meta Tags**: Comprehensive OpenGraph and Twitter Card meta
- **Structured Data**: No schema markup currently implemented (see recommendations)

### Recommended Additions

From `guide_tech.md`, consider adding:

1. **LocalBusiness Schema**:
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "additionalType": "ProfessionalService",
  "name": "Dr. Mark Wernsdorfer - AI Consultant",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Berlin",
    "addressCountry": "DE"
  }
}
```

2. **Person Schema** for Dr. Wernsdorfer's credentials
3. **Service Schema** for AI consulting offerings
4. **Review Schema** for client testimonials

## Browser Compatibility

- **Targets**: Modern browsers (last 2 versions of Chrome, Firefox, Safari, Edge)
- **CSS**: Uses CSS custom properties (no IE11 support)
- **JavaScript**: ES6+ syntax (no transpilation)
- **Fallbacks**: None currently implemented

## Common Tasks

### Adding a New Page

1. Create `en/new-page.html` based on existing page structure
2. Update navigation links in all HTML files:
   - Header nav (`#header-nav-links`)
   - Mobile bottom nav (`.mobile-bottom-nav`)
   - Footer links
3. Add active state logic in `navigation.js` if needed

### Modifying Colors

1. Edit `css/design-tokens.css`
2. Modify both `:root` (light theme) and `:root.dark` (dark theme)
3. Use semantic token names (e.g., `--accent-color` not `--orange-500`)

### Adding a Project Card

In `index.html` or `en/projects.html`:

```html
<div class="project-card group relative overflow-hidden bg-gradient-to-br from-white/95 to-white/85 project-card backdrop-blur-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105">
  <div class="relative z-10 p-6">
    <!-- Icon/Image -->
    <div class="aspect-video bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
      <span class="material-icons-outlined text-6xl text-white opacity-90">icon_name</span>
    </div>
    <!-- Content -->
    <div class="space-y-4">
      <h3 class="text-xl sm:text-2xl font-bold text-primary">Project Name</h3>
      <p class="text-secondary leading-relaxed">Project description...</p>
      <!-- Tags -->
      <div class="flex flex-wrap gap-2 text-xs">
        <span class="px-3 py-1 bg-stone-200 dark:bg-stone-700 rounded-full">Tag</span>
      </div>
      <!-- CTA -->
      <a href="en/projects.html" class="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg mt-6">
        Learn More <span class="material-icons-outlined ml-2 text-sm">arrow_forward</span>
      </a>
    </div>
  </div>
</div>
```

### Updating Client Logos

1. Add logo file to `logos/` directory (SVG preferred, PNG acceptable)
2. Optimize: Keep logos under 50KB
3. Add to carousel in `index.html`:

```html
<div class="logo-slide flex-shrink-0 w-72 h-44 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white/80 dark:bg-white/15 backdrop-blur-sm shadow-xl hover:shadow-3xl transition-all duration-500 group transform hover:scale-105 hover:-translate-y-1 border border-white/60 dark:border-white/30">
  <div class="h-24 w-full flex items-center justify-center mb-3 relative">
    <img src="logos/logo-name.svg" alt="Client Name" class="max-h-full max-w-full object-contain opacity-70 group-hover:opacity-100 transition-all duration-500 filter grayscale group-hover:grayscale-0 transform group-hover:scale-110 relative z-10" loading="lazy" />
  </div>
  <div class="trust-text font-semibold text-sm">Client Name</div>
</div>
```

4. Duplicate in the second logo set for seamless looping

## Deployment

This is a static site. Deploy with any static hosting:

```bash
# Example: Deploy to simple hosting
rsync -avz --exclude='.git' --exclude='additional_info' ./ user@server:/var/www/html/

# Or use GitHub Pages, Netlify, Vercel, etc.
```

**Note**: The `additional_info/` directory contains internal strategy documents and should not be deployed to production.

## Progressive Web App (PWA)

The site includes basic PWA configuration via `manifest.json`:
- App name and icons for home screen installation
- Theme colors matching brand (amber/orange)
- Standalone display mode for app-like experience on mobile

Currently implemented:
- Web app manifest linked in HTML with app shortcuts (About, Services, Contact)
- Theme color meta tags (`#d97706` - amber/orange)
- Apple mobile web app meta tags for iOS installation
- SVG icons (192x192, 512x512) with maskable purpose

Not yet implemented:
- Service worker for offline functionality and caching
- Push notifications

## Important Implementation Notes

### ScrollManager Pattern

**Critical**: All scroll handling MUST use the centralized `ScrollManager` from `managers.js`:

```javascript
// CORRECT: Register with ScrollManager
window.scrollManager.addHandler((scrollY) => {
  // Your scroll logic here
});

// INCORRECT: Don't create separate scroll listeners
window.addEventListener('scroll', handler); // ❌ Causes performance issues
```

The ScrollManager uses a single `scroll` event listener with `requestAnimationFrame` batching. Adding separate scroll listeners bypasses this optimization and degrades performance.

### Error Handling Pattern

All feature initialization MUST be wrapped in `window.utils.safeExecute()`:

```javascript
// CORRECT: Wrapped with error boundary
window.utils.safeExecute(() => {
  initMyFeature();
}, 'initMyFeature');

// INCORRECT: Unwrapped - errors will break subsequent initializations
initMyFeature(); // ❌ If this throws, later init won't run
```

This pattern ensures errors are logged to console and Google Analytics without breaking other features.

### Configuration Constants

Never hard-code timing, dimensions, or breakpoints. Use `window.APP_CONFIG` from `config.js`:

```javascript
// CORRECT: Use centralized config
const speed = window.APP_CONFIG.ANIMATION_CONFIG.BASE_PARALLAX_SPEED;

// INCORRECT: Magic numbers
const speed = 0.2; // ❌ Where did this come from?
```

### Service Cards Animation

Service cards (`.service-card`) are explicitly excluded from scroll-triggered animations in `core.js` to prevent conflicts with hover effects. Do not add `.animate` class to service cards.

### Mobile Header Navigation

The header navigation is intentionally hidden on mobile screens (<1024px). This is controlled via ResizeManager. The mobile bottom nav provides primary navigation on small screens.

### Theme Toggle Position

Theme toggle button is in the header on all screen sizes. It's a `<button>` element with `onclick="window.themeUtils.enhancedToggleDarkMode(event)"`.

### Carousel Scroll Speed

Logo carousel auto-scroll speed is controlled by CSS animation duration in the `.animate-scroll` class. Adjust in `css/animations.css`:

```css
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-scroll {
  animation: scroll 60s linear infinite; /* Adjust duration here */
}
```

## Common Pitfalls & Troubleshooting

### Script Load Order Issues

**Problem**: `Uncaught ReferenceError: window.utils is not defined`
**Solution**: Ensure `utils.js` loads before files that use it. Check script tag order in `<head>`.

### Theme Flicker on Page Load

**Problem**: Page briefly shows wrong theme before switching
**Solution**: The inline theme script in `<head>` must run BEFORE any deferred scripts. Never add `defer` to the theme prevention script.

### Multiple Scroll Listeners Degrading Performance

**Problem**: Scroll feels janky, multiple RAF calls per scroll event
**Solution**: Never use `window.addEventListener('scroll', ...)` directly. Always register with `window.scrollManager.addHandler()`.

### Carousel Not Auto-Scrolling

**Problem**: Logo carousel stuck or not moving
**Solution**:
1. Check `.animate-scroll` class is applied to carousel container
2. Verify `CAROUSEL_CONFIG` in `config.js` has correct `SLIDE_WIDTH`
3. Ensure duplicate logo sets exist for infinite scroll effect

### Animations Not Triggering

**Problem**: Elements with `.animate` class never animate
**Solution**:
1. Verify `initScrollAnimations()` was called (check console for errors)
2. Ensure IntersectionObserver is supported (modern browsers only)
3. Check that elements are actually in viewport
4. Service cards are intentionally excluded - don't add `.animate` to `.service-card`

### Dark Mode Toggle Not Working

**Problem**: Clicking theme toggle does nothing
**Solution**:
1. Check `window.themeUtils.enhancedToggleDarkMode` is defined
2. Verify `theme.js` loaded successfully (check Network tab)
3. Check browser console for errors in theme initialization

### Mobile Navigation Not Showing

**Problem**: No navigation visible on mobile
**Solution**: The header nav is hidden < 1024px. Mobile bottom nav should appear. Check:
1. `.mobile-bottom-nav` element exists in HTML
2. Mobile CSS is loaded (`mobile.css`)
3. No JavaScript errors preventing nav initialization

## Contact & Links

- **Email**: wernsdorfer@gmail.com
- **Phone**: +49 (176) 24 003 575
- **Website**: https://markwernsdorfer.com
- **GitHub**: https://github.com/wehnsdaefflae
- **LinkedIn**: https://www.linkedin.com/in/wernsdorfer/

## Additional Resources

- Design inspiration: Modern consultancy sites with glass morphism, gradient accents
- Color palette: Amber/Orange accent (#d97706, #f59e0b, #fbbf24) with warm neutrals
- Typography: Playfair Display (headings), Roboto Slab (body), Inter (UI)
