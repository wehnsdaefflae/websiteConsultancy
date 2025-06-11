// ==========================================================================
// Navigation and Mobile Menu Functionality
// ==========================================================================

// Initialize navigation system
function initNavigation() {
  initMobileNavigation();
  initSmoothScrolling();
  initActiveStates();
  initHeaderBehavior();
}

// Enhanced mobile navigation
function initMobileNavigation() {
  const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
  
  mobileNavItems.forEach(item => {
    item.addEventListener('click', function(e) {
      // Remove active class from all items
      mobileNavItems.forEach(navItem => navItem.classList.remove('active'));
      
      // Add active class to clicked item
      this.classList.add('active');
      
      // Add haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Add ripple effect
      addNavigationRipple(this, e);
    });
  });
  
  // Set active state based on current page
  setActiveNavigationState();
}

// Set active navigation state based on current page
function setActiveNavigationState() {
  const currentPage = window.location.pathname;
  const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
  
  mobileNavItems.forEach(item => {
    const href = item.getAttribute('href');
    
    // Handle both relative and absolute paths
    if (currentPage.includes(href) || (currentPage === '/' && href === 'index.html')) {
      item.classList.add('active');
    }
  });
  
  // Also update desktop navigation if present
  const desktopNavLinks = document.querySelectorAll('.nav-link');
  desktopNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    if (currentPage.includes(href) || (currentPage === '/' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Enhanced smooth scrolling for navigation
function initSmoothScrolling() {
  document.addEventListener('click', function(e) {
    // Handle internal anchor links
    if (e.target.matches('a[href^="#"]')) {
      const href = e.target.getAttribute('href');
      
      if (href.length > 1) {
        e.preventDefault();
        smoothScrollToElement(href.slice(1));
      }
    }
    
    // Handle navigation links with smooth transitions
    if (e.target.matches('.nav-link, .mobile-nav-item')) {
      const href = e.target.getAttribute('href');
      
      // Add loading state for external links
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        e.target.style.opacity = '0.7';
        e.target.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
          e.target.style.opacity = '';
          e.target.style.transform = '';
        }, 200);
      }
    }
  });
}

// Smooth scroll to element with enhanced easing
function smoothScrollToElement(elementId) {
  try {
    const targetElement = document.getElementById(elementId);
    
    if (targetElement) {
      // Calculate offset for headers and mobile navigation
      const isMobile = window.innerWidth < 1024;
      const headerHeight = isMobile ? 80 : 60;
      const mobileNavHeight = isMobile ? 70 : 0;
      const totalOffset = headerHeight + mobileNavHeight;
      
      const elementPosition = targetElement.offsetTop - totalOffset;
      
      // Enhanced smooth scrolling with custom easing
      const startPosition = window.pageYOffset;
      const distance = elementPosition - startPosition;
      const duration = Math.min(Math.abs(distance) / 2, 1000); // Dynamic duration
      let start = null;
      
      function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      }
      
      function animateScroll(currentTime) {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);
        
        window.scrollTo(0, startPosition + distance * easedProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      }
      
      requestAnimationFrame(animateScroll);
    }
  } catch (error) {
    console.error("Error scrolling to element:", error);
    // Fallback to browser smooth scroll
    document.getElementById(elementId)?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Initialize active states and highlighting
function initActiveStates() {
  // Highlight current section in navigation while scrolling
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"], .mobile-nav-item[href^="#"]');
  
  if (sections.length > 0 && navLinks.length > 0) {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: '-100px 0px -100px 0px'
    };
    
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          
          // Update navigation highlighting
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${sectionId}`) {
              link.classList.add('current-section');
            } else {
              link.classList.remove('current-section');
            }
          });
        }
      });
    }, observerOptions);
    
    sections.forEach(section => sectionObserver.observe(section));
  }
}

// Enhanced header behavior on scroll
function initHeaderBehavior() {
  let lastScrollY = window.scrollY;
  let ticking = false;
  
  function updateHeader() {
    const header = document.querySelector('header');
    const currentScrollY = window.scrollY;
    
    if (header) {
      // Enhanced backdrop blur based on scroll position
      const blurAmount = Math.min(20 + (currentScrollY / 10), 40);
      const opacity = Math.min(0.9 + (currentScrollY / 1000), 0.98);
      
      header.style.backdropFilter = `blur(${blurAmount}px) saturate(180%)`;
      header.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
      
      // Add shadow when scrolled
      if (currentScrollY > 50) {
        header.style.boxShadow = 'var(--shadow-lg)';
      } else {
        header.style.boxShadow = 'var(--shadow-sm)';
      }
      
      // Hide/show header on mobile based on scroll direction
      if (window.innerWidth < 1024) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down - hide header
          header.style.transform = 'translateY(-100%)';
        } else {
          // Scrolling up - show header
          header.style.transform = 'translateY(0)';
        }
      }
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
}

// Add ripple effect to navigation items
function addNavigationRipple(element, event) {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.classList.add('ripple');
  
  element.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Breadcrumb navigation helper
function updateBreadcrumbs() {
  const breadcrumbs = document.querySelector('.breadcrumbs');
  
  if (breadcrumbs) {
    const pathArray = window.location.pathname.split('/').filter(Boolean);
    const breadcrumbHTML = pathArray.map((path, index) => {
      const isLast = index === pathArray.length - 1;
      const href = '/' + pathArray.slice(0, index + 1).join('/');
      
      return isLast 
        ? `<span class="breadcrumb-current">${path}</span>`
        : `<a href="${href}" class="breadcrumb-link">${path}</a>`;
    }).join(' <span class="breadcrumb-separator">></span> ');
    
    breadcrumbs.innerHTML = `<a href="/" class="breadcrumb-link">Home</a> <span class="breadcrumb-separator">></span> ${breadcrumbHTML}`;
  }
}

// Initialize navigation on DOM load
document.addEventListener('DOMContentLoaded', function() {
  initNavigation();
  updateBreadcrumbs();
});

// Export navigation functions
window.navigationUtils = {
  initNavigation,
  smoothScrollToElement,
  setActiveNavigationState,
  updateBreadcrumbs
};
