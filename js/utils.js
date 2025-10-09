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
function requestIdleCallback(callback, options = {}) {
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
function cancelIdleCallback(id) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Get computed style value
 * @param {HTMLElement} element - Element to get style from
 * @param {string} property - CSS property name
 * @returns {string} Computed value
 */
function getComputedStyleValue(element, property) {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Sanitize HTML string
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
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
 * Wait for element to exist in DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<HTMLElement>} Promise that resolves with element
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Measure performance of function execution
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for performance mark
 * @returns {*} Result of function
 */
function measurePerformance(fn, label) {
  if (!window.performance || !window.performance.mark) {
    return fn();
  }

  const startMark = `${label}-start`;
  const endMark = `${label}-end`;
  const measureName = `${label}-measure`;

  performance.mark(startMark);
  const result = fn();
  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  const measure = performance.getEntriesByName(measureName)[0];
  console.log(`${label} took ${measure.duration.toFixed(2)}ms`);

  // Clean up
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);

  return result;
}

// Export utilities
window.utils = {
  safeExecute,
  debounce,
  throttle,
  requestIdleCallback,
  cancelIdleCallback,
  isInViewport,
  getComputedStyleValue,
  sanitizeHTML,
  prefersReducedMotion,
  isPageVisible,
  waitForElement,
  measurePerformance
};
