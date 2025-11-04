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

// Logo Carousel Navigation
document.addEventListener('DOMContentLoaded', function() {
  const logoTrack = document.getElementById('logos-track');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const dots = document.querySelectorAll('.carousel-dot');
  
  if (!logoTrack || !prevBtn || !nextBtn) return;
  
  const config = window.APP_CONFIG.CAROUSEL_CONFIG;
  let currentSlide = 0;
  const totalSlides = config.TOTAL_SLIDES;
  let isAnimating = false;
  let autoPlayInterval;

  // Function to calculate slide width dynamically
  function getSlideWidth() {
    const firstSlide = logoTrack.querySelector('.logo-slide');
    if (!firstSlide) return config.SLIDE_WIDTH; // Fallback

    const styles = window.getComputedStyle(firstSlide);
    return firstSlide.offsetWidth + parseInt(styles.marginRight || 0);
  }

  // Function to update carousel position
  function updateCarousel(slideIndex, smooth = true) {
    if (isAnimating) return;

    isAnimating = true;
    currentSlide = slideIndex;

    // Calculate slide width dynamically
    const slideWidth = getSlideWidth();

    // Calculate transform value
    const translateX = -(currentSlide * slideWidth);

    // Apply transform with or without transition
    if (smooth) {
      logoTrack.style.transition = `transform ${config.TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    } else {
      logoTrack.style.transition = 'none';
    }

    logoTrack.style.transform = `translateX(${translateX}px)`;

    // Update dot indicators
    dots.forEach((dot, index) => {
      if (index === currentSlide) {
        dot.classList.add('active');
        dot.style.backgroundColor = '#f59e0b'; // amber-500
      } else {
        dot.classList.remove('active');
        dot.style.backgroundColor = '';
      }
    });

    setTimeout(() => {
      isAnimating = false;
    }, smooth ? config.TRANSITION_DURATION : 0);
  }
  
  // Next slide function
  function nextSlide() {
    const nextIndex = (currentSlide + 1) % totalSlides;
    updateCarousel(nextIndex);
  }
  
  // Previous slide function
  function prevSlide() {
    const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel(prevIndex);
  }
  
  // Event listeners for navigation buttons
  nextBtn.addEventListener('click', () => {
    stopAutoPlay();
    nextSlide();
    startAutoPlay();
  });
  
  prevBtn.addEventListener('click', () => {
    stopAutoPlay();
    prevSlide();
    startAutoPlay();
  });
  
  // Event listeners for dot indicators
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (index !== currentSlide) {
        stopAutoPlay();
        updateCarousel(index);
        startAutoPlay();
      }
    });
  });
  
  // Auto-play functionality with visibility check
  function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);

    autoPlayInterval = setInterval(() => {
      // Only advance if page is visible
      if (!document.hidden) {
        nextSlide();
      }
    }, config.AUTO_PLAY_DELAY);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  // Pause autoplay when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoPlay();
    } else if (carouselContainer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startAutoPlay();
    }
  });
  
  // Pause auto-play on hover
  const carouselContainer = logoTrack.closest('.logos-carousel');
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', stopAutoPlay);
    carouselContainer.addEventListener('mouseleave', startAutoPlay);
  }
  
  // Initialize carousel
  updateCarousel(0, false);
  
  // Start auto-play if user doesn't prefer reduced motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startAutoPlay();
  }
  
  // Handle resize
  window.addEventListener('resize', () => {
    updateCarousel(currentSlide, false);
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('.logos-carousel')) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stopAutoPlay();
        prevSlide();
        startAutoPlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stopAutoPlay();
        nextSlide();
        startAutoPlay();
      }
    }
  });
});

// Note: Interactive elements initialization is now handled by core.js orchestrator
// This ensures proper initialization order with other modules

// Export interaction utilities
window.interactionUtils = {
  initInteractiveElements,
  validateInput
};
