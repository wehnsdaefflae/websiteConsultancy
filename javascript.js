// Enhanced JavaScript for Multi-Page Website
// Updated for new multi-page structure with bilingual support

document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle functionality
  function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }
  
  // Make toggleMobileMenu available globally for inline onclick handlers
  window.toggleMobileMenu = toggleMobileMenu;

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
      const menu = document.getElementById('mobileMenu');
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
      const menu = document.getElementById('mobileMenu');
      if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
      }
    }
  });
});
