// ==========================================================================
// Centralized Managers for Performance and Memory Management
// ==========================================================================

// Scroll Manager - Centralized scroll handling to prevent multiple listeners
class ScrollManager {
  constructor() {
    this.handlers = [];
    this.ticking = false;
    this.scrollY = 0;
    this.boundHandleScroll = this.handleScroll.bind(this);

    window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
  }

  handleScroll() {
    try {
      this.scrollY = window.pageYOffset;

      if (!this.ticking) {
        requestAnimationFrame(() => {
          try {
            this.handlers.forEach(handler => {
              try {
                handler(this.scrollY);
              } catch (error) {
                console.error('Error in scroll handler:', error);
              }
            });
            this.ticking = false;
          } catch (error) {
            console.error('Error in scroll animation frame:', error);
          }
        });
        this.ticking = true;
      }
    } catch (error) {
      console.error('Error in handleScroll:', error);
    }
  }

  addHandler(handler) {
    try {
      if (typeof handler === 'function' && !this.handlers.includes(handler)) {
        this.handlers.push(handler);
      }
    } catch (error) {
      console.error('Error adding scroll handler:', error);
    }
  }

  removeHandler(handler) {
    try {
      this.handlers = this.handlers.filter(h => h !== handler);
    } catch (error) {
      console.error('Error removing scroll handler:', error);
    }
  }

  cleanup() {
    try {
      window.removeEventListener('scroll', this.boundHandleScroll);
      this.handlers = [];
    } catch (error) {
      console.error('Error in ScrollManager cleanup:', error);
    }
  }
}

// Observer Manager - Centralized IntersectionObserver management
class ObserverManager {
  constructor() {
    this.observers = new Map();
    this.elementCallbacks = new WeakMap();
  }

  observe(elements, options, callback) {
    try {
      const key = JSON.stringify(options);

      // Create observer if it doesn't exist for these options
      if (!this.observers.has(key)) {
        const observer = new IntersectionObserver((entries) => {
          try {
            entries.forEach(entry => {
              try {
                const callbacks = this.elementCallbacks.get(entry.target) || [];
                callbacks.forEach(cb => {
                  try {
                    cb(entry);
                  } catch (error) {
                    console.error('Error in intersection observer callback:', error);
                  }
                });
              } catch (error) {
                console.error('Error processing intersection observer entry:', error);
              }
            });
          } catch (error) {
            console.error('Error in intersection observer entries loop:', error);
          }
        }, options);

        this.observers.set(key, {
          observer,
          elements: new Set()
        });
      }

      const observerData = this.observers.get(key);

      // Ensure elements is an array or NodeList
      const elementArray = Array.isArray(elements) ? elements : Array.from(elements);

      elementArray.forEach(element => {
        try {
          // Store callback for this element
          const callbacks = this.elementCallbacks.get(element) || [];
          callbacks.push(callback);
          this.elementCallbacks.set(element, callbacks);

          // Observe element
          observerData.observer.observe(element);
          observerData.elements.add(element);
        } catch (error) {
          console.error('Error observing element:', error);
        }
      });

      // Return cleanup function
      return () => {
        try {
          elementArray.forEach(element => {
            try {
              observerData.observer.unobserve(element);
              observerData.elements.delete(element);
            } catch (error) {
              console.error('Error unobserving element:', error);
            }
          });
        } catch (error) {
          console.error('Error in observer cleanup function:', error);
        }
      };
    } catch (error) {
      console.error('Error in ObserverManager.observe:', error);
      return () => {}; // Return no-op cleanup function
    }
  }

  disconnect() {
    try {
      this.observers.forEach(({ observer }) => {
        try {
          observer.disconnect();
        } catch (error) {
          console.error('Error disconnecting observer:', error);
        }
      });
      this.observers.clear();
    } catch (error) {
      console.error('Error in ObserverManager.disconnect:', error);
    }
  }
}

// Event Listener Manager - Track and cleanup event listeners
class EventListenerManager {
  constructor() {
    this.listeners = new WeakMap();
  }

  add(element, event, handler, options) {
    try {
      if (!this.listeners.has(element)) {
        this.listeners.set(element, []);
      }

      const listeners = this.listeners.get(element);
      const listenerData = { event, handler, options };
      listeners.push(listenerData);

      element.addEventListener(event, handler, options);

      // Return cleanup function
      return () => {
        try {
          element.removeEventListener(event, handler, options);
          const index = listeners.indexOf(listenerData);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        } catch (error) {
          console.error('Error removing event listener:', error);
        }
      };
    } catch (error) {
      console.error('Error in EventListenerManager.add:', error);
      return () => {}; // Return no-op cleanup function
    }
  }

  removeAll(element) {
    try {
      const listeners = this.listeners.get(element);
      if (listeners) {
        listeners.forEach(({ event, handler, options }) => {
          try {
            element.removeEventListener(event, handler, options);
          } catch (error) {
            console.error('Error removing event listener:', error);
          }
        });
        this.listeners.delete(element);
      }
    } catch (error) {
      console.error('Error in EventListenerManager.removeAll:', error);
    }
  }
}

// Cleanup Manager - Centralized cleanup tracking
class CleanupManager {
  constructor() {
    this.cleanupFunctions = [];
  }

  add(cleanupFn) {
    try {
      if (typeof cleanupFn === 'function') {
        this.cleanupFunctions.push(cleanupFn);
      }
    } catch (error) {
      console.error('Error adding cleanup function:', error);
    }
  }

  cleanupAll() {
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    this.cleanupFunctions = [];
  }
}

// Create singleton instances
const scrollManager = new ScrollManager();
const observerManager = new ObserverManager();
const eventListenerManager = new EventListenerManager();
const cleanupManager = new CleanupManager();

// Export for global use
window.managers = {
  scrollManager,
  observerManager,
  eventListenerManager,
  cleanupManager
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  try {
    cleanupManager.cleanupAll();
    observerManager.disconnect();
    scrollManager.cleanup();
  } catch (error) {
    console.error('Error during page unload cleanup:', error);
  }
});
