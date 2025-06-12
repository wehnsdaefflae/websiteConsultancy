// ==========================================================================
// Animation and Scroll Effects
// ==========================================================================

// Enhanced parallax effects
function initParallaxEffects() {
  const floatingElements = document.querySelectorAll('.floating-element');
  
  if (floatingElements.length > 0) {
    let ticking = false;
    
    function updateParallax() {
      const scrolled = window.pageYOffset;
      
      // Enhanced floating elements with varied speeds
      floatingElements.forEach((element, index) => {
        const speed = 0.2 + (index % 3) * 0.1;
        const yPos = scrolled * speed;
        element.style.transform = `translateY(${yPos}px) rotate(${yPos * 0.01}deg)`;
      });
      
      ticking = false;
    }
    
    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }
    
    window.addEventListener('scroll', requestTick, { passive: true });
  }
}

// Advanced animations with GSAP-like effects (vanilla JS)
function initAdvancedAnimations() {
  // Magnetic effect removed from buttons to prevent jittery cursor following behavior
  // Only apply magnetic effect to project cards if desired
  const magneticElements = document.querySelectorAll('.project-card');
  
  magneticElements.forEach(element => {
    element.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const moveX = x * 0.05; // Reduced sensitivity for project cards
      const moveY = y * 0.05;
      
      this.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.01)`;
    });
    
    element.addEventListener('mouseleave', function() {
      this.style.transform = 'translate(0, 0) scale(1)';
    });
  });

  // Reveal animations for text elements
  const textElements = document.querySelectorAll('h1, h2, h3, p');
  textElements.forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'all 0.6s ease';
    element.style.transitionDelay = `${index * 0.1}s`;
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, 100);
  });

  // Enhanced card stack animation - exclude service cards to prevent hover conflicts
  const cards = document.querySelectorAll('.card:not(.service-card), .project-card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('fade-in-up');
  });
}

// Cursor effects removed - caused usability issues

// Staggered animation utility
function staggerAnimation(elements, delay = 100) {
  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('animate');
    }, index * delay);
  });
}

// Fade in animation utility
function fadeInElements(selector, delay = 0) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'all 0.6s ease';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay + (index * 100));
  });
}

// Scale animation utility
function scaleInElements(selector, delay = 0) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    }, delay + (index * 150));
  });
}

// Slide animation utility
function slideInElements(selector, direction = 'up', delay = 0) {
  const elements = document.querySelectorAll(selector);
  const transforms = {
    up: 'translateY(50px)',
    down: 'translateY(-50px)',
    left: 'translateX(50px)',
    right: 'translateX(-50px)'
  };
  
  elements.forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = transforms[direction];
    element.style.transition = 'all 0.6s ease';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0)';
    }, delay + (index * 100));
  });
}

// Export functions for global use
window.animationUtils = {
  initParallaxEffects,
  initAdvancedAnimations,
  initCursorEffects,
  staggerAnimation,
  fadeInElements,
  scaleInElements,
  slideInElements
};
