document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section');
  const navItems = document.querySelectorAll('.nav-item');
  const subNavItems = document.querySelectorAll('.sub-nav-item');
  const hasSubLis = document.querySelectorAll('.has-sub');

  let currentMain = '';
  let currentSub = '';
  let isAutoScrolling = false;
  let autoScrollTimeout = null;

  // Scrollspy logic
  window.addEventListener('scroll', () => {
    const screenMiddle = window.scrollY + window.innerHeight / 2;

    // Check main sections (Home, Unity, Flutter, Contact)
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - window.innerHeight / 3 && 
          window.scrollY < sectionTop + sectionHeight - window.innerHeight / 3) {
        currentMain = section.getAttribute('id');
      }
    });

    // Fallback if at the very bottom of the page
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
      currentMain = 'contact';
    }

    // Check sub-items within the active section
    const currentSection = document.getElementById(currentMain);
    if (currentSection && currentSection.classList.contains('projects')) {
      let minDistance = Infinity;
      const projectCards = currentSection.querySelectorAll('.project-card');
      projectCards.forEach(card => {
        const cardMiddle = card.offsetTop + (card.clientHeight / 2);
        const distance = Math.abs(screenMiddle - cardMiddle);
        if (distance < minDistance) {
          minDistance = distance;
          currentSub = card.getAttribute('id');
        }
      });
    } else {
      currentSub = ''; // Reset if not in a projects section
    }

    // Update Main Nav Items
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${currentMain}`) {
        item.classList.add('active');
      }
    });

    // Update Sub Nav Items
    subNavItems.forEach(item => {
      item.classList.remove('active');
      if (currentSub && item.getAttribute('href') === `#${currentSub}`) {
        item.classList.add('active');
      }
    });

    // Control sub-nav visibility dynamically based on currentMain
    if (!isAutoScrolling) {
      hasSubLis.forEach(li => {
        const mainLink = li.querySelector('.nav-item');
        if (mainLink && mainLink.getAttribute('href') === `#${currentMain}`) {
          li.classList.add('open');
        } else {
          li.classList.remove('open');
        }
      });
    }
  });

  // Handle all nav links to prevent sub-nav flashing and provide perfect centering
  const allLinks = document.querySelectorAll('.desktop-nav a, .mobile-nav a');
  allLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // ... existing nav link logic remains exactly the same ...
      const targetId = link.getAttribute('href');
      
      // We are starting a programmatic smooth scroll
      isAutoScrolling = true;
      if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
      
      // Determine which main section this click belongs to
      let targetMainId = targetId;
      if (link.classList.contains('sub-nav-item')) {
         const closestSub = link.closest('.has-sub');
         if(closestSub) {
           targetMainId = closestSub.querySelector('.nav-item').getAttribute('href');
         }
      }

      // Immediately handle SubIndex visibility
      hasSubLis.forEach(li => {
        const mainLink = li.querySelector('.nav-item');
        if (mainLink && mainLink.getAttribute('href') === targetMainId) {
          li.classList.add('open');
        } else {
          li.classList.remove('open');
        }
      });

      // Redirect main project links to their first card
      let scrollTargetId = targetId;
      const targetSection = document.querySelector(targetId);
      if (targetSection && targetSection.classList.contains('projects')) {
        const firstProject = targetSection.querySelector('.project-card');
        if (firstProject) {
          scrollTargetId = '#' + firstProject.getAttribute('id');
        }
      }

      // Smooth scroll to target, centering it in the viewport
      const scrollTargetElement = document.querySelector(scrollTargetId);
      if (scrollTargetElement) {
        scrollTargetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Update history state to keep the URL hash consistent
        history.pushState(null, null, targetId);
      }

      // Reset auto-scroll flag after animation finishes
      autoScrollTimeout = setTimeout(() => {
        isAutoScrolling = false;
        // Resync visibility just in case
        hasSubLis.forEach(li => {
          const mainLink = li.querySelector('.nav-item');
          if (mainLink && mainLink.getAttribute('href') === `#${currentMain}`) {
            li.classList.add('open');
          } else {
            li.classList.remove('open');
          }
        });
      }, 1000);
    });
  });

  // Expandable Project Cards Logic
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Prevent triggering if clicking on buttons or links inside the card
      if (e.target.closest('.btn') || e.target.tagName === 'A') return;

      const isAlreadyExpanded = card.classList.contains('expanded');

      // Collapse all other cards first (accordion behavior)
      projectCards.forEach(otherCard => {
        otherCard.classList.remove('expanded');
      });

      if (!isAlreadyExpanded) {
        // Expand the card
        card.classList.add('expanded');
      }
    });
  });

  // Close sub-nav when clicking anywhere outside the menus
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.desktop-nav') && !e.target.closest('.mobile-nav') && !e.target.closest('.project-card')) {
      hasSubLis.forEach(li => li.classList.remove('open'));
    }
  });
});
