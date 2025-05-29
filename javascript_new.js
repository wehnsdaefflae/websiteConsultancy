// Enhanced JavaScript for Dynamic Section Loading - Template Style
// Based on original script.js but adapted for new template structure

document.addEventListener('DOMContentLoaded', function() {
  // Section files in order
  const sectionFiles = [
    'sections_new/01_about.html',
    'sections_new/02_services.html',
    'sections_new/03_projects.html',
    'sections_new/04_grants.html',
    'sections_new/05_publications.html',
    'sections_new/06_community.html',
    'sections_new/07_contact.html'
  ];
  
  const container = document.getElementById('dynamic-sections');
  const headerNavLinksContainer = document.getElementById('header-nav-links');

  if (container && headerNavLinksContainer) {
    sectionFiles.reduce((promise, file) => {
      return promise.then(() => fetch(file)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status} for ${file}`);
          }
          return res.text();
        })
        .then(html => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          
          // Find the section element
          const sectionElement = tempDiv.querySelector('section');

          if (sectionElement) {
            const sectionId = sectionElement.id;
            if (sectionId && sectionId.trim() !== 'contact') {
              const link = document.createElement('a');
              link.href = `#${sectionId}`;
              link.className = "text-stone-700 text-base font-medium hover:text-amber-600 transition-colors hover-underline-animation";
              
              // Create user-friendly link text from ID
              let linkText = '';
              switch(sectionId) {
                case 'about':
                  linkText = 'About';
                  break;
                case 'services':
                  linkText = 'Services';
                  break;
                case 'projects':
                  linkText = 'Projects';
                  break;
                case 'grants':
                  linkText = 'Recognition';
                  break;
                case 'publications':
                  linkText = 'Publications';
                  break;
                case 'community':
                  linkText = 'Community';
                  break;
                default:
                  linkText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
              }
              
              link.textContent = linkText;
              headerNavLinksContainer.appendChild(link);
            }

            // Append section to main container
            while (tempDiv.firstChild) {
              container.appendChild(tempDiv.firstChild);
            }
          } else {
            console.warn(`No <section> element found in ${file}.`);
            // Still append content if any
            while (tempDiv.firstChild) {
              container.appendChild(tempDiv.firstChild);
            }
          }
        })
        .catch(error => console.error(`Error loading or processing section ${file}:`, error))
      );
    }, Promise.resolve());
  } else {
    if (!container) console.error('Dynamic sections container not found.');
    if (!headerNavLinksContainer) console.error('Header navigation links container not found.');
  }

  // Smooth scroll for nav links (including dynamically added ones)
  document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
      const href = e.target.getAttribute('href');
      if (href.length > 1) {
        try {
          const targetElement = document.getElementById(href.slice(1));
          if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (error) {
          console.error("Error scrolling to element:", error);
        }
      }
    }
  }, true);

  // Mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const headerNavLinks = document.getElementById('header-nav-links');

  if (mobileMenuButton && headerNavLinks) {
    mobileMenuButton.addEventListener('click', () => {
      const isHidden = headerNavLinks.classList.toggle('hidden');
      const iconElement = mobileMenuButton.querySelector('.material-icons-outlined');
      
      if (!isHidden) { // Menu is now visible
        iconElement.textContent = 'close';
      } else { // Menu is now hidden
        iconElement.textContent = 'menu_open';
      }
    });

    // Close mobile menu when a nav link is clicked
    headerNavLinks.addEventListener('click', (e) => {
      if (e.target.closest('a[href^="#"]')) {
        // Check if we're in mobile view by checking if the button is visible
        const computedStyle = window.getComputedStyle(mobileMenuButton);
        if (computedStyle.display !== 'none') {
          headerNavLinks.classList.add('hidden');
          // Reset menu icon
          mobileMenuButton.querySelector('.material-icons-outlined').textContent = 'menu_open';
        }
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!headerNavLinks.contains(e.target) && !mobileMenuButton.contains(e.target)) {
        const computedStyle = window.getComputedStyle(mobileMenuButton);
        if (computedStyle.display !== 'none' && !headerNavLinks.classList.contains('hidden')) {
          headerNavLinks.classList.add('hidden');
          mobileMenuButton.querySelector('.material-icons-outlined').textContent = 'menu_open';
        }
      }
    });
  }

  // Form submission handling with improved functionality
  const contactForm = document.querySelector('#contact form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(contactForm);
      const name = formData.get('name').trim();
      const email = formData.get('email').trim();
      const message = formData.get('message').trim();
      
      // Basic form validation
      if (!name || !email || !message) {
        showFormMessage('Please fill in all fields.', 'error');
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showFormMessage('Please enter a valid email address.', 'error');
        return;
      }
      
      // Show loading state
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Sending...';
      submitButton.disabled = true;
      
      // Prepare email data
      const emailSubject = `Contact Form: Message from ${name}`;
      const emailBody = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
      
      // Create mailto link as fallback and primary method
      const mailtoLink = `mailto:contact@markwernsdorfer.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Try to send via email client
      window.location.href = mailtoLink;
      
      // Show success message and reset form
      setTimeout(() => {
        showFormMessage('Email client opened! Please send the email to complete your message.', 'success');
        contactForm.reset();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }, 1000);
      
      // Alternative: If you want to integrate with a service like Formspree, EmailJS, or Netlify Forms
      // you can uncomment and modify the following code:
      
      /*
      // Example using Formspree (requires account and form endpoint)
      fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          showFormMessage('Thank you for your message! I will get back to you soon.', 'success');
          contactForm.reset();
        } else {
          throw new Error('Network response was not ok');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showFormMessage('There was a problem sending your message. Please try the direct email link below.', 'error');
      })
      .finally(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      });
      */
    });
  }
  
  // Function to show form messages
  function showFormMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Create new message element
    const messageElement = document.createElement('div');
    messageElement.className = `form-message mt-4 p-4 rounded-lg text-center transition-all duration-300 ${
      type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
    }`;
    messageElement.textContent = message;
    
    // Insert message after the form
    const contactForm = document.querySelector('#contact form');
    if (contactForm) {
      contactForm.parentNode.insertBefore(messageElement, contactForm.nextSibling);
      
      // Auto-remove success messages after 5 seconds
      if (type === 'success') {
        setTimeout(() => {
          if (messageElement.parentNode) {
            messageElement.style.opacity = '0';
            setTimeout(() => messageElement.remove(), 300);
          }
        }, 5000);
      }
    }
  }

  // Add scroll animations (optional enhancement)
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
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
    sections.forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
      section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(section);
    });
  }, 100);
});
