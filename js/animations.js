// ==========================================================================
// Animation and Scroll Effects
// ==========================================================================

// Enhanced parallax effects with proper cleanup
function initParallaxEffects() {
  return window.utils.safeExecute(() => {
    const floatingElements = document.querySelectorAll('.floating-element');

    if (floatingElements.length === 0) return;

    const config = window.APP_CONFIG.ANIMATION_CONFIG;

    function updateParallax(scrollY) {
      try {
        // Enhanced floating elements with varied speeds
        floatingElements.forEach((element, index) => {
          try {
            const speed = config.BASE_PARALLAX_SPEED + (index % config.SPEED_CYCLE) * config.SPEED_VARIATION;
            const yPos = scrollY * speed;
            element.style.transform = `translateY(${yPos}px) rotate(${yPos * 0.01}deg)`;
          } catch (error) {
            console.error('Error animating floating element:', error);
          }
        });
      } catch (error) {
        console.error('Error in updateParallax:', error);
      }
    }

    // Use centralized scroll manager
    window.managers.scrollManager.addHandler(updateParallax);

    // Register cleanup
    window.managers.cleanupManager.add(() => {
      window.managers.scrollManager.removeHandler(updateParallax);
    });
  }, 'initParallaxEffects');
}

// Advanced animations with GSAP-like effects (vanilla JS)
function initAdvancedAnimations() {
  return window.utils.safeExecute(() => {
    // Magnetic effect removed from buttons to prevent jittery cursor following behavior
    // Only apply magnetic effect to project cards if desired
    const magneticElements = document.querySelectorAll('.project-card');
    const cleanups = [];

    magneticElements.forEach(element => {
      function handleMouseMove(e) {
        try {
          const rect = element.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;

          const moveX = x * 0.05; // Reduced sensitivity for project cards
          const moveY = y * 0.05;

          element.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.01)`;
        } catch (error) {
          console.error('Error in magnetic mousemove handler:', error);
        }
      }

      function handleMouseLeave() {
        try {
          element.style.transform = 'translate(0, 0) scale(1)';
        } catch (error) {
          console.error('Error in magnetic mouseleave handler:', error);
        }
      }

      // Use event listener manager for proper cleanup
      const cleanup1 = window.managers.eventListenerManager.add(element, 'mousemove', handleMouseMove);
      const cleanup2 = window.managers.eventListenerManager.add(element, 'mouseleave', handleMouseLeave);

      cleanups.push(cleanup1, cleanup2);
    });

    // Register cleanup
    window.managers.cleanupManager.add(() => {
      cleanups.forEach(cleanup => cleanup());
    });

    // Enhanced card stack animation - exclude service cards to prevent hover conflicts
    const cards = document.querySelectorAll('.card:not(.service-card), .project-card');
    cards.forEach((card, index) => {
      try {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in-up');
      } catch (error) {
        console.error('Error adding animation to card:', error);
      }
    });
  }, 'initAdvancedAnimations');
}

// Cursor effects removed - caused usability issues

// Staggered animation utility
function staggerAnimation(elements, delay = 100) {
  try {
    elements.forEach((element, index) => {
      setTimeout(() => {
        try {
          element.classList.add('animate');
        } catch (error) {
          console.error('Error adding animate class to element:', error);
        }
      }, index * delay);
    });
  } catch (error) {
    console.error('Error in staggerAnimation:', error);
  }
}

// Fade in animation utility
function fadeInElements(selector, delay = 0) {
  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      try {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';

        setTimeout(() => {
          try {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
          } catch (error) {
            console.error('Error applying fade-in animation:', error);
          }
        }, delay + (index * 100));
      } catch (error) {
        console.error('Error setting up fade-in animation for element:', error);
      }
    });
  } catch (error) {
    console.error('Error in fadeInElements:', error);
  }
}

// Scale animation utility
function scaleInElements(selector, delay = 0) {
  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      try {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

        setTimeout(() => {
          try {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
          } catch (error) {
            console.error('Error applying scale-in animation:', error);
          }
        }, delay + (index * 150));
      } catch (error) {
        console.error('Error setting up scale-in animation for element:', error);
      }
    });
  } catch (error) {
    console.error('Error in scaleInElements:', error);
  }
}

// Slide animation utility
function slideInElements(selector, direction = 'up', delay = 0) {
  try {
    const elements = document.querySelectorAll(selector);
    const transforms = {
      up: 'translateY(50px)',
      down: 'translateY(-50px)',
      left: 'translateX(50px)',
      right: 'translateX(-50px)'
    };

    elements.forEach((element, index) => {
      try {
        element.style.opacity = '0';
        element.style.transform = transforms[direction];
        element.style.transition = 'all 0.6s ease';

        setTimeout(() => {
          try {
            element.style.opacity = '1';
            element.style.transform = 'translate(0, 0)';
          } catch (error) {
            console.error('Error applying slide-in animation:', error);
          }
        }, delay + (index * 100));
      } catch (error) {
        console.error('Error setting up slide-in animation for element:', error);
      }
    });
  } catch (error) {
    console.error('Error in slideInElements:', error);
  }
}

// Export functions for global use
window.animationUtils = {
  initParallaxEffects,
  initAdvancedAnimations,
  staggerAnimation,
  fadeInElements,
  scaleInElements,
  slideInElements
};
