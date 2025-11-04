// ==========================================================================
// Utility Functions - Error Handling, Performance, and Helpers
// ==========================================================================

/**
 * Safely execute a function with error handling
 * @param {Function} fn - Function to execute
 * @param {string} context - Context/name for error logging
 * @returns {*} Result of function or null on error
 */
function safeExecute(fn, context = 'unknown') {
  try {
    return fn();
  } catch (error) {
    console.error(`Error in ${context}:`, error);

    // Send to analytics if available
    if (window.gtag) {
      gtag('event', 'exception', {
        description: `${context}: ${error.message}`,
        fatal: false
      });
    }

    return null;
  }
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Request idle callback with fallback
 * @param {Function} callback - Callback to execute when idle
 * @param {Object} options - Options object with timeout
 */
function safeRequestIdleCallback(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers without requestIdleCallback
    return setTimeout(() => callback({
      didTimeout: false,
      timeRemaining: () => 50
    }), options.timeout || 1);
  }
}

/**
 * Cancel idle callback with fallback
 * @param {number} id - ID returned from requestIdleCallback
 */
function safeCancelIdleCallback(id) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Check if device prefers reduced motion
 * @returns {boolean} True if prefers reduced motion
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if page is currently visible
 * @returns {boolean} True if page is visible
 */
function isPageVisible() {
  return !document.hidden;
}

/**
 * Create ripple effect on element
 * @param {HTMLElement} element - Element to add ripple to
 * @param {Event} event - Click event
 */
function createRipple(element, event) {
  try {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    element.appendChild(ripple);

    setTimeout(() => {
      try {
        ripple.remove();
      } catch (error) {
        console.error('Error removing ripple element:', error);
      }
    }, 600);
  } catch (error) {
    console.error('Error in createRipple:', error);
  }
}

// Export utilities
window.utils = {
  safeExecute,
  debounce,
  throttle,
  requestIdleCallback: safeRequestIdleCallback,
  cancelIdleCallback: safeCancelIdleCallback,
  prefersReducedMotion,
  isPageVisible,
  createRipple
};
