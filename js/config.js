// ==========================================================================
// Configuration Constants
// ==========================================================================

// Carousel Configuration
export const CAROUSEL_CONFIG = {
  SLIDE_WIDTH: 312, // Card width (288px) + gap (24px)
  AUTO_PLAY_DELAY: 4000, // 4 seconds between slides
  TRANSITION_DURATION: 500, // 0.5 seconds for slide transition
  TOTAL_SLIDES: 7 // Number of logo cards
};

// Scroll Configuration
export const SCROLL_CONFIG = {
  MOBILE_HEADER_HEIGHT: 80, // Mobile header height in pixels
  DESKTOP_HEADER_HEIGHT: 60, // Desktop header height in pixels
  MOBILE_NAV_HEIGHT: 70, // Mobile bottom navigation height
  MOBILE_BREAKPOINT: 1024 // Breakpoint for mobile/desktop
};

// Animation Configuration
export const ANIMATION_CONFIG = {
  BASE_PARALLAX_SPEED: 0.2, // Base speed for parallax effects
  SPEED_VARIATION: 0.1, // Speed variation multiplier
  SPEED_CYCLE: 3, // Modulo cycle for speed calculation
  DEBOUNCE_DELAY: 10, // Scroll debounce delay in milliseconds
  RIPPLE_DURATION: 600, // Ripple animation duration in milliseconds
  STAGGER_DELAY: 100 // Default stagger delay for animations
};

// Observer Configuration
export const OBSERVER_CONFIG = {
  THRESHOLD: 0.1, // Intersection observer threshold
  ROOT_MARGIN: '0px 0px -50px 0px' // Intersection observer root margin
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  IDLE_CALLBACK_TIMEOUT: 2000, // RequestIdleCallback timeout
  ANIMATION_FRAME_BUDGET: 16 // Target 60fps (16ms per frame)
};

// Make available globally for non-module scripts
window.APP_CONFIG = {
  CAROUSEL_CONFIG,
  SCROLL_CONFIG,
  ANIMATION_CONFIG,
  OBSERVER_CONFIG,
  PERFORMANCE_CONFIG
};
