// Extracted JS for dynamic section loading and smooth scrolling

document.addEventListener('DOMContentLoaded', function() {
  // Section files in order
  const sectionFiles = [
    'sections/01_about.html',
    'sections/02_services.html',
    'sections/03_projects.html',
    'sections/04_grants.html',
    'sections/05_publications.html',
    'sections/06_community.html',
    'sections/07_contact.html'
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
          
          // Assuming the first direct child of the fetched content is the <section> element
          // Or, more robustly, query for the section tag if structure might vary
          const sectionElement = tempDiv.querySelector('section');

          if (sectionElement) {
            const sectionId = sectionElement.id;
            if (sectionId && sectionId.trim() !== 'contact') {
              const link = document.createElement('a');
              link.href = `#${sectionId}`;
              link.className = "nav-link";
              // Create user-friendly link text from ID (e.g., "about" -> "About")
              const linkText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
              link.textContent = linkText;
              headerNavLinksContainer.appendChild(link);
            }

            // Append section to main container
            // Move all children from tempDiv to the main container
            while (tempDiv.firstChild) {
              container.appendChild(tempDiv.firstChild);
            }
          } else {
            console.warn(`No <section> element found in ${file}.`);
            // Still append content if any, or handle as error
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

  // Smooth scroll for nav links (targets all a[href^="#"] including dynamically added ones)
  document.addEventListener('click', function(e) {
    // Check if the clicked element is an anchor link pointing to an ID
    if (e.target.matches('a[href^="#"]')) {
      const href = e.target.getAttribute('href');
      // Ensure it's not just "#"
      if (href.length > 1) {
        try {
          const targetElement = document.getElementById(href.slice(1));
          if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (error) {
          // Catch potential errors if href.slice(1) is not a valid ID selector, though unlikely for simple IDs.
          console.error("Error scrolling to element:", error);
        }
      }
    }
  }, true); // Use capture phase to ensure it runs, or delegate from a common ancestor.
});
