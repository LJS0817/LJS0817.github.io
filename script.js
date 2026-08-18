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
        if (currentMain === 'about') currentMain = 'home';
      }
    });



    // Check sub-items within the active section
    const currentSection = document.getElementById(currentMain);
    if (currentSection && currentSection.classList.contains('projects')) {
      let minDistance = Infinity;
      const projectCards = currentSection.querySelectorAll('.project-card');
      projectCards.forEach(card => {
        if (card.style.visibility === 'hidden' || card.style.opacity === '0') return;
        const rect = card.getBoundingClientRect();
        const cardMiddle = rect.top + (rect.height / 2);
        const viewportMiddle = window.innerHeight / 2;
        const distance = Math.abs(viewportMiddle - cardMiddle);
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

  // Handle all nav links to provide perfect scrolling to sticky project cards and regular sections
  const allLinks = document.querySelectorAll('a[href^="#"]');
  allLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      e.preventDefault();

      // We are starting a programmatic smooth scroll
      isAutoScrolling = true;
      if (autoScrollTimeout) clearTimeout(autoScrollTimeout);

      // Determine which main section this click belongs to
      let targetMainId = targetId;
      if (link.classList.contains('sub-nav-item')) {
        const closestSub = link.closest('.has-sub');
        if (closestSub) {
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

      // Smooth scroll to target: calculate exact scroll position for sticky card wrapper
      const scrollTargetElement = document.querySelector(scrollTargetId);
      if (scrollTargetElement) {
        const wrapper = scrollTargetElement.closest('.card-scroll-wrapper');
        let targetScrollY;
        if (wrapper) {
          // For project cards: scroll precisely so wrapper top is at STICKY_TOP
          targetScrollY = window.pageYOffset + wrapper.getBoundingClientRect().top - STICKY_TOP;
        } else {
          // For regular sections (home, contact, etc.)
          targetScrollY = window.pageYOffset + scrollTargetElement.getBoundingClientRect().top;
        }

        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: 'smooth'
        });

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

  // Scroll Reveal Logic (Fade In / Out) for non-project elements
  const revealTargets = document.querySelectorAll('.about-bio, .about-skills, .timeline-item');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        // Fade out when scrolling out of view
        entry.target.classList.remove('visible');
      }
    });
  }, {
    threshold: 0,
    rootMargin: '0px 0px -50px 0px'
  });

  revealTargets.forEach(el => {
    el.classList.add('reveal-element');
    revealObserver.observe(el);
  });

  // Unified Sticky Scroll & Parallax Logic (Deterministic State Machine)
  const STICKY_TOP = 120;
  const OVERLAP_ZONE = Math.round(window.innerHeight * 0.7);
  const PAUSE_ZONE = Math.round(window.innerHeight * 0.3);
  
  const projectsGrids = document.querySelectorAll('.projects-grid');
  const allCardData = [];
  
  projectsGrids.forEach(grid => {
    grid.style.gap = '0';
    const cards = Array.from(grid.querySelectorAll('.project-card'));
    
    cards.forEach((card, index) => {
      const isLast = (index === cards.length - 1);
      const wrapper = document.createElement('div');
      wrapper.className = 'card-scroll-wrapper';
      wrapper.style.position = 'relative';
      card.parentNode.insertBefore(wrapper, card);
      wrapper.appendChild(card);
      
      allCardData.push({
        card,
        wrapper,
        isLast
      });
    });
  });
  
  function updateCardsOnScroll() {
    allCardData.forEach(({ card, wrapper, isLast }) => {
      const scrollH = card.scrollHeight;
      const clientH = card.clientHeight;
      const maxScroll = Math.max(0, scrollH - clientH);
      
      const extraHeight = isLast ? 0 : (PAUSE_ZONE + OVERLAP_ZONE);
      const totalHeight = scrollH + extraHeight;
      
      if (wrapper.style.height !== `${totalHeight}px`) {
        wrapper.style.height = `${totalHeight}px`;
      }
      const targetMarginBottom = isLast ? '0px' : `-${OVERLAP_ZONE}px`;
      if (wrapper.style.marginBottom !== targetMarginBottom) {
        wrapper.style.marginBottom = targetMarginBottom;
      }
      
      const rect = wrapper.getBoundingClientRect();
      
      // Phase 1: User has not reached this card yet (Card is in the future)
      if (rect.top > STICKY_TOP) {
        card.scrollTop = 0;
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.transform = 'translateY(0) scale(1)';
        return;
      }
      
      // User is scrolling through or past this card
      const scrolledPast = STICKY_TOP - rect.top;
      
      // Phase 2: Scrolling inner content (1:1 scroll sync)
      card.scrollTop = Math.min(scrolledPast, maxScroll);
      
      if (isLast) {
        // Last card in the grid: stays 100% visible, naturally scrolls away with section
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.transform = 'translateY(0) scale(1)';
        return;
      }
      
      // Phase 3: Content finished, in PAUSE_ZONE (lingering before next card appears)
      const overlapStart = maxScroll + PAUSE_ZONE;
      if (scrolledPast <= overlapStart) {
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.transform = 'translateY(0) scale(1)';
        return;
      }
      
      // Phase 4: In OVERLAP_ZONE (Next card is rising, this card is fading out)
      const overlapOffset = scrolledPast - overlapStart;
      const progress = Math.min(1, overlapOffset / OVERLAP_ZONE);
      
      if (progress < 1) {
        card.style.visibility = 'visible';
        const translateY = -(progress * 50);
        const scale = 1 - (progress * 0.03);
        const opacity = 1 - progress;
        
        card.style.transform = `translateY(${translateY}px) scale(${scale})`;
        card.style.opacity = opacity.toFixed(3);
      } else {
        // Phase 5: Overlap complete -> GONE FOREVER (100% hidden, never reappears)
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
        card.style.transform = 'translateY(-50px) scale(0.97)';
      }
    });
  }

  window.addEventListener('resize', updateCardsOnScroll);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateCardsOnScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  updateCardsOnScroll(); // Trigger once on load


});
