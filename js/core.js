// ==========================================================================
// Core Functionality and Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  initCore();
  initNavigation();
  initScrollAnimations();
  initParallaxEffects();
  initInteractiveElements();
  initScrollProgress();
  initAdvancedAnimations();
  
  // Custom cursor removed - caused usability issues
});

// Core initialization function
function initCore() {
  // Ensure header navigation stays hidden on mobile but visible on desktop
  const menu = document.getElementById('header-nav-links');
  if (menu) {
    // Always keep header navigation hidden on mobile screens
    if (window.innerWidth < 768) {
      menu.classList.add('hidden');
    }
  }

  // Handle window resize - keep header nav hidden on mobile
  window.addEventListener('resize', function() {
    const menu = document.getElementById('header-nav-links');
    if (menu) {
      // Keep header navigation hidden on mobile, visible on desktop
      if (window.innerWidth < 768) {
        menu.classList.add('hidden');
      } else {
        menu.classList.remove('hidden');
      }
    }
  });

  // Enhanced smooth scroll for nav links and internal page anchors
  document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
      const href = e.target.getAttribute('href');
      if (href.length > 1) {
        try {
          const targetElement = document.getElementById(href.slice(1));
          if (targetElement) {
            e.preventDefault();
            
            // Calculate offset for mobile header
            const isMobile = window.innerWidth < 1024;
            const headerHeight = isMobile ? 80 : 60;
            const elementPosition = targetElement.offsetTop - headerHeight;
            
            // Use smooth scrolling with proper offset
            window.scrollTo({
              top: elementPosition,
              behavior: 'smooth'
            });
          }
        } catch (error) {
          console.error("Error scrolling to element:", error);
        }
      }
    }
  });

  // Performance optimization - debounced scroll handler
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    scrollTimeout = setTimeout(function() {
      // Add dynamic header styling based on scroll
      const header = document.querySelector('header');
      if (header) {
        if (window.scrollY > 100) {
          header.style.backdropFilter = 'blur(25px) saturate(200%)';
          header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        } else {
          header.style.backdropFilter = 'blur(20px) saturate(180%)';
          header.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        }
      }
    }, 10);
  }, { passive: true });

  // Add loading animation
  window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Trigger hero animations
    const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-description, .hero-buttons');
    heroElements.forEach((element, index) => {
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 200);
    });
  });
}

// Enhanced scroll animations with intersection observer
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Don't add animate class to service cards to prevent hover conflicts
        if (!entry.target.classList.contains('service-card')) {
          entry.target.classList.add('animate');
        }
        
        // Add staggered animation for cards - exclude service cards
        if ((entry.target.classList.contains('card') && !entry.target.classList.contains('service-card')) || entry.target.classList.contains('project-card')) {
          const cards = entry.target.parentElement.querySelectorAll('.card:not(.service-card), .project-card');
          cards.forEach((card, index) => {
            setTimeout(() => {
              card.style.animationDelay = `${index * 0.1}s`;
              if (!card.classList.contains('service-card')) {
                card.classList.add('animate');
              }
            }, index * 100);
          });
        }
      }
    });
  }, observerOptions);

  // Observe elements with animation classes
  // Observe elements for scroll animations - exclude service cards from animation conflicts
  document.querySelectorAll('.section-animated, .card:not(.service-card), .project-card, .trust-item').forEach(el => {
    observer.observe(el);
  });
}

// Enhanced scroll progress indicator
function initScrollProgress() {
  const progressBar = document.querySelector('.scroll-progress-inner');
  if (progressBar) {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    window.addEventListener('scroll', function() {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      
      progressBar.style.width = scrolled + '%';
      
      // Show/hide indicator based on scroll position
      if (winScroll > 100) {
        scrollIndicator.classList.add('active');
      } else {
        scrollIndicator.classList.remove('active');
      }
    }, { passive: true });
  }
}

// Export functions for other modules
window.coreUtils = {
  initCore,
  initScrollAnimations,
  initScrollProgress
};
