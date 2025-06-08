// Enhanced JavaScript for Multi-Page Website
// Updated for new multi-page structure with bilingual support

document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle functionality
  function toggleMobileMenu() {
    const menu = document.getElementById('header-nav-links');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }
  
  // Make toggleMobileMenu available globally for inline onclick handlers
  window.toggleMobileMenu = toggleMobileMenu;

  // Add click event listener to mobile menu button
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', toggleMobileMenu);
  }

  // Ensure mobile menu starts hidden on page load
  const menu = document.getElementById('header-nav-links');
  if (menu) {
    // On mobile screens, ensure menu starts hidden
    if (window.innerWidth < 1280) {
      menu.classList.add('hidden');
    }
  }

  // Handle window resize to properly show/hide menu
  window.addEventListener('resize', function() {
    const menu = document.getElementById('header-nav-links');
    if (menu) {
      if (window.innerWidth >= 1280) {
        // Desktop view - remove hidden class to show normal navigation
        menu.classList.remove('hidden');
      } else {
        // Mobile view - add hidden class to hide menu by default
        menu.classList.add('hidden');
      }
    }
  });

  // Smooth scroll for nav links and internal page anchors
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
  }, true);

  // Close mobile menu when clicking on links
  document.addEventListener('click', function(e) {
    if (e.target.matches('a')) {
      const menu = document.getElementById('header-nav-links');
      if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
      }
    }
  });

  // Form submission handling for contact forms
  function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    // Get form data
    const formData = new FormData(form);
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const message = formData.get('message')?.trim();
    const subject = formData.get('subject')?.trim();
    
    // Basic form validation
    if (!name || !email || !message) {
      const isGerman = document.documentElement.lang === 'de';
      alert(isGerman ? 'Bitte füllen Sie alle Felder aus.' : 'Please fill in all fields.');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const isGerman = document.documentElement.lang === 'de';
      alert(isGerman ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.');
      return;
    }
    
    // Prepare email data
    const emailSubject = subject ? `${subject} - Message from ${name}` : `Contact Form: Message from ${name}`;
    const emailBody = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    
    // Create mailto link
    const mailtoLink = `mailto:contact@markwernsdorfer.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show success message
    const isGerman = document.documentElement.lang === 'de';
    const successMessage = isGerman 
      ? 'Vielen Dank für Ihre Nachricht! Ich werde mich innerhalb von 24 Stunden bei Ihnen melden.'
      : 'Thank you for your message! I will get back to you within 24 hours.';
    
    alert(successMessage);
    
    // Reset form
    form.reset();
  }
  
  // Make handleFormSubmit available globally for inline handlers
  window.handleFormSubmit = handleFormSubmit;

  // Add scroll animations for elements when they come into view
  const observerOptions = {
    threshold: window.innerWidth <= 768 ? 0.05 : 0.1,
    rootMargin: window.innerWidth <= 768 ? '0px 0px -20px 0px' : '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe sections for scroll animations
  setTimeout(() => {
    const sections = document.querySelectorAll('section');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    sections.forEach(section => {
      if (!prefersReducedMotion && section.classList.contains('fade-in-section')) {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
      }
    });
  }, 100);

  // Handle viewport changes for mobile devices
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 500);
  });

  // Enhanced image loading with error handling
  const images = document.querySelectorAll('img[data-src]');
  if (images.length > 0) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
          
          img.onerror = function() {
            // Fallback for broken images
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
          };
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }

  // Add keyboard navigation support
  document.addEventListener('keydown', function(e) {
    // Close mobile menu on Escape
    if (e.key === 'Escape') {
      const menu = document.getElementById('header-nav-links');
      if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
      }
    }
  });

  // Dark Mode Functionality
  function initDarkMode() {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Disable transitions during initial setup
    document.documentElement.classList.remove('transitions-enabled');
    
    // If no saved preference, use system preference
    if (savedTheme === null) {
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update initial state after DOM is fully loaded
    setTimeout(() => {
      // Enable transitions after everything is set up
      document.documentElement.classList.add('transitions-enabled');
    }, 100);
  }

  function toggleDarkMode() {
    const isDark = document.documentElement.classList.contains('dark');
    
    // Disable transitions temporarily
    document.documentElement.classList.remove('transitions-enabled');
    
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    
    // Re-enable transitions after a short delay
    setTimeout(() => {
      document.documentElement.classList.add('transitions-enabled');
    }, 50);
  }

  // Removed updateThemeToggleIcon function - no longer needed with flip switch

  // Initialize dark mode on page load
  initDarkMode();

  // Make toggle function available globally
  window.toggleDarkMode = toggleDarkMode;

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  });

  // Landing page animations on scroll
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          
          // Add staggered animation for cards
          if (entry.target.classList.contains('card')) {
            const cards = entry.target.parentElement.querySelectorAll('.card');
            const index = Array.from(cards).indexOf(entry.target);
            entry.target.style.transitionDelay = `${index * 0.1}s`;
          }
        }
      });
    }, observerOptions);

    // Enhanced scroll animations for different elements
    const animatedElements = document.querySelectorAll('.card, .section-animated, .hero-title, .hero-subtitle, .hero-description, .hero-buttons');
    
    animatedElements.forEach((el, index) => {
      // Different animation styles for different elements
      if (el.classList.contains('hero-title')) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px) scale(0.95)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      } else if (el.classList.contains('hero-subtitle')) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(-30px)';
        el.style.transition = 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s';
      } else if (el.classList.contains('hero-description')) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(30px)';
        el.style.transition = 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s';
      } else if (el.classList.contains('hero-buttons')) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s';
      } else {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      }
      
      observer.observe(el);
    });

    // Add hover animations for interactive elements
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.style.transform = 'translateY(-8px) scale(1.02)';
          this.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
        }
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '';
      });
    });
  }

  // Add subtle parallax effect to hero section
  function initParallaxEffect() {
    const heroSection = document.querySelector('#hero');
    if (heroSection && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (scrolled < window.innerHeight) {
          heroSection.style.transform = `translateY(${rate}px)`;
        }
      });
    }
  }

  // Add floating animation to cards
  function initFloatingAnimation() {
    const cards = document.querySelectorAll('.card');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach((card, index) => {
        // Stagger the animation start times
        setTimeout(() => {
          card.style.animation = `float ${3 + (index % 3)}s ease-in-out infinite`;
        }, index * 200);
      });
    }
  }

  // Initialize enhanced animations
  initParallaxEffect();
  setTimeout(initFloatingAnimation, 1000); // Start floating after initial load

  // Initialize scroll animations
  if (window.IntersectionObserver) {
    initScrollAnimations();
  }
});
