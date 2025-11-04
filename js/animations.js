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

// Export functions for global use
window.animationUtils = {
  initParallaxEffects,
  initAdvancedAnimations
};
