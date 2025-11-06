// ==========================================================================
// Interactive Effects and UI Enhancements
// ==========================================================================

// Initialize all interactive elements
function initInteractiveElements() {
  initRippleEffects();
  initHoverEffects();
  initFormInteractions();
  initTooltips();
  initLoadingStates();
  initMagneticEffects();
}

// Enhanced ripple effects for interactive elements - exclude service cards and no-hover cards
function initRippleEffects() {
  const rippleElements = document.querySelectorAll('.btn-primary, .mobile-nav-item, .card:not(.service-card):not(.card-no-hover), .project-card');

  rippleElements.forEach(element => {
    element.addEventListener('click', function(e) {
      window.utils.createRipple(this, e);
    });
  });
}

// Enhanced hover effects
function initHoverEffects() {
  // Logo animation enhancement
  const logo = document.querySelector('.logo-text');
  if (logo) {
    logo.addEventListener('mouseenter', function() {
      this.style.animationDuration = '0.5s';
    });
    
    logo.addEventListener('mouseleave', function() {
      this.style.animationDuration = '3s';
    });
  }
  
  // Card hover enhancements - exclude service cards to prevent hover conflicts
  const cards = document.querySelectorAll('.card:not(.service-card), .project-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.willChange = 'transform, box-shadow';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.willChange = 'auto';
    });
  });
  
  // Button hover sound effect (optional)
  const buttons = document.querySelectorAll('.btn-primary');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      // Add subtle hover feedback
      this.style.filter = 'brightness(1.1)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.filter = '';
    });
  });
}

// Form interaction enhancements with ARIA support
function initFormInteractions() {
  const inputs = document.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    // Enhanced focus states
    input.addEventListener('focus', function() {
      this.parentElement?.classList.add('input-focused');
      this.style.transform = 'scale(1.02)';
    });

    input.addEventListener('blur', function() {
      this.parentElement?.classList.remove('input-focused');
      this.style.transform = '';

      // Validate on blur for accessible error announcements
      validateInput(this);
    });

    // Real-time validation feedback
    input.addEventListener('input', function() {
      // Clear error on input if field was previously invalid
      if (this.getAttribute('aria-invalid') === 'true') {
        validateInput(this);
      }

      if (this.validity.valid) {
        this.classList.remove('invalid');
        this.classList.add('valid');
      } else {
        this.classList.remove('valid');
        this.classList.add('invalid');
      }
    });

    // Auto-resize textareas
    if (input.tagName === 'TEXTAREA') {
      input.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      });
    }
  });

  // Add form submit validation
  const forms = document.querySelectorAll('form[novalidate]');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const inputs = this.querySelectorAll('input[required], textarea[required], select[required]');
      let isValid = true;

      inputs.forEach(input => {
        if (!validateInput(input)) {
          isValid = false;
        }
      });

      if (!isValid) {
        e.preventDefault();
        // Focus first invalid field
        const firstInvalid = this.querySelector('[aria-invalid="true"]');
        if (firstInvalid) {
          firstInvalid.focus();
        }
      }
    });
  });
}

// Validate individual input and update ARIA attributes
function validateInput(input) {
  const errorElement = document.getElementById(input.getAttribute('aria-describedby'));
  let isValid = true;
  let errorMessage = '';

  // Check if required field is empty
  if (input.hasAttribute('required') && !input.value.trim()) {
    isValid = false;
    errorMessage = 'This field is required';
  }
  // Check email format
  else if (input.type === 'email' && input.value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(input.value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    }
  }
  // Use native validation if available
  else if (!input.validity.valid) {
    isValid = false;
    errorMessage = input.validationMessage || 'Please check this field';
  }

  // Update ARIA attributes and display
  input.setAttribute('aria-invalid', isValid ? 'false' : 'true');

  if (errorElement) {
    if (!isValid) {
      errorElement.textContent = errorMessage;
      errorElement.classList.remove('hidden');
      input.classList.add('border-red-500', 'dark:border-red-400');
      input.classList.remove('border-gray-300', 'dark:border-gray-600');
    } else {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
      input.classList.remove('border-red-500', 'dark:border-red-400');
      input.classList.add('border-gray-300', 'dark:border-gray-600');
    }
  }

  return isValid;
}

// Tooltip system
function initTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  
  tooltipElements.forEach(element => {
    let tooltip = null;
    
    element.addEventListener('mouseenter', function() {
      const tooltipText = this.getAttribute('data-tooltip');
      
      tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = tooltipText;
      document.body.appendChild(tooltip);
      
      // Position tooltip
      const rect = this.getBoundingClientRect();
      tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
      tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
      
      // Animate in
      requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
      });
    });
    
    element.addEventListener('mouseleave', function() {
      if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
          tooltip?.remove();
        }, 200);
      }
    });
  });
}

// Loading states for buttons and forms
function initLoadingStates() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const submitButton = this.querySelector('button[type="submit"], input[type="submit"]');
      
      if (submitButton) {
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Loading...';
        
        // Reset after form submission attempt
        setTimeout(() => {
          submitButton.classList.remove('loading');
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }, 3000);
      }
    });
  });
}

// Magnetic effect for interactive elements
// Removed .btn-primary to prevent jittery cursor following behavior on buttons
function initMagneticEffects() {
  const magneticElements = document.querySelectorAll('.magnetic-element');
  
  magneticElements.forEach(element => {
    let bounds = null;
    
    element.addEventListener('mouseenter', function() {
      bounds = this.getBoundingClientRect();
    });
    
    element.addEventListener('mousemove', function(e) {
      if (bounds) {
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;
        
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        
        const deltaX = (x - centerX) * 0.1; // Reduced sensitivity
        const deltaY = (y - centerY) * 0.1; // Reduced sensitivity
        
        this.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.02)`;
      }
    });
    
    element.addEventListener('mouseleave', function() {
      this.style.transform = '';
      bounds = null;
    });
  });
}

// ==========================================================================
// Portfolio Filter Functionality
// ==========================================================================

// Initialize portfolio filtering
function initPortfolioFilter() {
  const filterButtons = document.querySelectorAll('.portfolio-filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  
  if (filterButtons.length === 0 || portfolioItems.length === 0) return;

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter portfolio items
      portfolioItems.forEach(item => {
        const categories = item.getAttribute('data-category');
        
        if (filter === 'all' || (categories && categories.includes(filter))) {
          item.classList.remove('hidden');
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
        } else {
          item.classList.add('hidden');
          item.style.opacity = '0';
          item.style.transform = 'scale(0.8)';
        }
      });
      
      // Trigger analytics event if available
      if (typeof gtag !== 'undefined') {
        gtag('event', 'portfolio_filter', {
          'filter_category': filter
        });
      }
    });
  });
}

// Initialize portfolio animations on scroll
function initPortfolioAnimations() {
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  
  if (!portfolioItems.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  portfolioItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    observer.observe(item);
  });
}

// ==========================================================================
// End Portfolio Functionality
// ==========================================================================

// Infinite Circular Carousel with Drag/Swipe
document.addEventListener('DOMContentLoaded', function() {
  const logoTrack = document.getElementById('logos-track');
  if (!logoTrack) return;

  // Use transform instead of scroll for smoother animation
  let currentX = 0;
  let targetX = 0;
  let isDragging = false;
  let startX = 0;
  let dragStartX = 0;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;
  let isAutoScrolling = true;
  const autoScrollSpeed = 0.5;
  let hasDragged = false;

  // Get total width of one set of logos
  function getTrackWidth() {
    const slides = logoTrack.querySelectorAll('.logo-slide');
    let width = 0;
    for (let i = 0; i < slides.length / 2; i++) {
      width += slides[i].offsetWidth + parseInt(getComputedStyle(slides[i]).marginRight || 0);
    }
    return width;
  }

  function normalize(x) {
    const trackWidth = getTrackWidth();
    // Keep position within bounds of one loop
    while (x > 0) x -= trackWidth;
    while (x < -trackWidth) x += trackWidth;
    return x;
  }

  function updatePosition() {
    currentX = normalize(currentX);
    logoTrack.style.transform = `translateX(${currentX}px)`;
  }

  function startDrag(e) {
    isDragging = true;
    isAutoScrolling = false;
    hasDragged = false;
    startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    dragStartX = currentX;
    lastX = startX;
    lastTime = Date.now();
    velocity = 0;
    logoTrack.style.cursor = 'grabbing';

    if (e.cancelable) {
      e.preventDefault();
    }
  }

  function drag(e) {
    if (!isDragging) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    const dx = x - startX;
    const now = Date.now();
    const dt = now - lastTime;

    // Mark as dragged if moved more than 5 pixels
    if (Math.abs(dx) > 5) {
      hasDragged = true;
    }

    if (dt > 0) {
      velocity = (x - lastX) / dt * 16; // Convert to px per frame
    }

    currentX = dragStartX + dx;
    targetX = currentX;

    lastX = x;
    lastTime = now;
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    logoTrack.style.cursor = 'grab';

    // Apply velocity for inertia with resistance
    targetX = currentX + velocity * 10; // Reduced from 20 to add more resistance

    setTimeout(() => {
      isAutoScrolling = true;
    }, 2000);
  }

  function animate() {
    if (!isDragging) {
      // Smooth interpolation with damping
      const diff = targetX - currentX;
      currentX += diff * 0.08;

      // Auto-scroll at constant speed
      if (isAutoScrolling) {
        currentX -= autoScrollSpeed;
        targetX = currentX; // Keep target synced to prevent drift
      } else {
        // Apply friction when not auto-scrolling
        const decay = 0.92;
        targetX = currentX + (targetX - currentX) * decay;
      }
    }

    updatePosition();
    requestAnimationFrame(animate);
  }

  // Event listeners
  logoTrack.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);

  logoTrack.addEventListener('touchstart', startDrag, { passive: false });
  document.addEventListener('touchmove', drag, { passive: false });
  document.addEventListener('touchend', endDrag);

  logoTrack.addEventListener('dragstart', (e) => e.preventDefault());
  logoTrack.addEventListener('selectstart', (e) => e.preventDefault());

  // Prevent link clicks when dragging
  logoTrack.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Pause on hover
  const carouselContainer = logoTrack.closest('.logos-carousel');
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', () => {
      isAutoScrolling = false;
    });
    carouselContainer.addEventListener('mouseleave', () => {
      if (!isDragging) {
        isAutoScrolling = true;
      }
    });
  }

  // Pause when hidden
  document.addEventListener('visibilitychange', () => {
    isAutoScrolling = !document.hidden;
  });

  // Initialize
  logoTrack.style.cursor = 'grab';
  logoTrack.style.transition = 'none';
  logoTrack.style.willChange = 'transform';

  // Start animation loop
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animate();
  }
});

// Note: Interactive elements initialization is now handled by core.js orchestrator
// This ensures proper initialization order with other modules

// Export interaction utilities
window.interactionUtils = {
  initInteractiveElements,
  validateInput
};
