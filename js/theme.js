// ==========================================================================
// Theme Toggle and Dark Mode Functionality
// ==========================================================================

// Initialize theme system
function initTheme() {
  try {
    // Load saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Update theme toggle icons
    updateThemeIcons(savedTheme);
  } catch (error) {
    console.error('Error in initTheme:', error);
  }
}

// Apply theme to document
function applyTheme(theme) {
  try {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  } catch (error) {
    console.error('Error in applyTheme:', error);
  }
}

// Update theme toggle icons
function updateThemeIcons(theme) {
  try {
    const icons = document.querySelectorAll('.theme-toggle-icon');
    icons.forEach(icon => {
      try {
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
      } catch (error) {
        console.error('Error updating theme icon:', error);
      }
    });
  } catch (error) {
    console.error('Error in updateThemeIcons:', error);
  }
}

// Enhanced theme toggle functionality
function toggleDarkMode() {
  try {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';

    // Add transition class for smooth theme change
    html.classList.add('theme-transitioning');

    // Apply new theme
    applyTheme(newTheme);

    // Save preference
    localStorage.setItem('theme', newTheme);

    // Update theme toggle icons
    updateThemeIcons(newTheme);

    // Remove transition class after animation
    setTimeout(() => {
      try {
        html.classList.remove('theme-transitioning');
      } catch (error) {
        console.error('Error removing theme transition class:', error);
      }
    }, 300);

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: newTheme }
    }));
  } catch (error) {
    console.error('Error in toggleDarkMode:', error);
  }
}

// Detect system theme preference
function detectSystemTheme() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch (error) {
    console.error('Error in detectSystemTheme:', error);
    return 'light'; // Default fallback
  }
}

// Auto-apply system theme if no preference saved
function initSystemTheme() {
  try {
    const savedTheme = localStorage.getItem('theme');

    if (!savedTheme) {
      const systemTheme = detectSystemTheme();
      applyTheme(systemTheme);
      updateThemeIcons(systemTheme);
      localStorage.setItem('theme', systemTheme);
    }
  } catch (error) {
    console.error('Error in initSystemTheme:', error);
  }
}

// Listen for system theme changes
function watchSystemTheme() {
  try {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      mediaQuery.addEventListener('change', (e) => {
        try {
          const savedTheme = localStorage.getItem('theme');

          // Only auto-switch if user hasn't manually set a preference recently
          const lastManualChange = localStorage.getItem('lastThemeChange');
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;

          if (!lastManualChange || (now - parseInt(lastManualChange)) > oneHour) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            updateThemeIcons(newTheme);
            localStorage.setItem('theme', newTheme);
          }
        } catch (error) {
          console.error('Error in system theme change handler:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error in watchSystemTheme:', error);
  }
}

// Enhanced theme toggle with ripple effect
function enhancedToggleDarkMode(event) {
  try {
    // Record manual theme change
    localStorage.setItem('lastThemeChange', Date.now().toString());

    // Add ripple effect if event is provided
    if (event && event.target) {
      addRippleToElement(event.target, event);
    }

    // Toggle theme
    toggleDarkMode();
  } catch (error) {
    console.error('Error in enhancedToggleDarkMode:', error);
  }
}

// Add ripple effect to theme toggle button
function addRippleToElement(element, event) {
  try {
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
      try {
        ripple.remove();
      } catch (error) {
        console.error('Error removing ripple element:', error);
      }
    }, 600);
  } catch (error) {
    console.error('Error in addRippleToElement:', error);
  }
}

// Theme-aware image loading
function loadThemeAwareImages() {
  try {
    const images = document.querySelectorAll('[data-light-src][data-dark-src]');
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    images.forEach(img => {
      try {
        const lightSrc = img.getAttribute('data-light-src');
        const darkSrc = img.getAttribute('data-dark-src');

        img.src = currentTheme === 'dark' ? darkSrc : lightSrc;
      } catch (error) {
        console.error('Error loading theme-aware image:', error);
      }
    });
  } catch (error) {
    console.error('Error in loadThemeAwareImages:', error);
  }
}

// Initialize theme system on DOM load
document.addEventListener('DOMContentLoaded', function() {
  try {
    initTheme();
    initSystemTheme();
    watchSystemTheme();

    // Load theme-aware images
    loadThemeAwareImages();

    // Listen for theme changes to update images
    window.addEventListener('themeChanged', loadThemeAwareImages);
  } catch (error) {
    console.error('Error initializing theme system on DOMContentLoaded:', error);
  }
});

// Export theme functions for global use
window.themeUtils = {
  initTheme,
  toggleDarkMode,
  enhancedToggleDarkMode,
  applyTheme,
  detectSystemTheme,
  loadThemeAwareImages
};

// Make toggle function globally available
window.toggleDarkMode = toggleDarkMode;
