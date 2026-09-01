/* =========================================================
   LJS0817 Portfolio — case "1b"
   - "ALL WORK" grid category filter
   - Fix-up for nav links that point INSIDE a slide (e.g. "역량"/"이력"
     point at content nested inside the hero slide, not the hero's own
     id). With scroll-snap-type: mandatory on <html>, the browser's
     native anchor jump can measure a mid-slide target and snap to the
     *next* slide instead, since only whole slides are valid snap
     points. We intercept just those nested links and do the scroll
     ourselves: snap to the right slide, then adjust that slide's own
     internal scroll to reveal the nested target.
   ========================================================= */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initFilters();
    initNavLinks();
    initScrollUI();
    initSlideScroll();
  });

  /* ---------- Seamless Slide & Wheel Coordinator ---------- */
  function initSlideScroll() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero, .work, .project, .contact'));
    if (!slides.length) return;

    var isTransitioning = false;
    var transitionTimeout = null;
    var accumulatedDelta = 0;
    var deltaResetTimer = null;

    function getActiveIndex() {
      var mid = window.innerHeight / 2;
      for (var i = 0; i < slides.length; i++) {
        var r = slides[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) {
          return i;
        }
      }
      return 0;
    }

    function transitionTo(index, fromDirection) {
      if (index < 0 || index >= slides.length || isTransitioning) return;
      isTransitioning = true;
      clearTimeout(transitionTimeout);

      var targetSlide = slides[index];
      if (fromDirection === 'up') {
        var targetMax = targetSlide.scrollHeight - targetSlide.clientHeight;
        if (targetMax > 0) {
          targetSlide.scrollTop = targetMax;
        }
      } else if (fromDirection === 'down') {
        targetSlide.scrollTop = 0;
      }

      targetSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });

      transitionTimeout = setTimeout(function () {
        isTransitioning = false;
        accumulatedDelta = 0;
      }, 450);
    }

    window.addEventListener('wheel', function (e) {
      if (isTransitioning) {
        e.preventDefault();
        return;
      }

      var active = getActiveIndex();
      var slide = slides[active];
      if (!slide) return;

      var maxScroll = slide.scrollHeight - slide.clientHeight;
      var scrollTop = slide.scrollTop;
      var delta = e.deltaY;

      // Scrolling DOWN
      if (delta > 0) {
        // If the slide can still scroll down internally
        if (maxScroll > 5 && scrollTop < maxScroll - 3) {
          accumulatedDelta = 0;
          return; // Let native internal scroll work smoothly
        }

        // At the bottom of current slide (or slide has no overflow)
        if (active < slides.length - 1) {
          e.preventDefault();
          accumulatedDelta += delta;
          clearTimeout(deltaResetTimer);
          deltaResetTimer = setTimeout(function () {
            accumulatedDelta = 0;
          }, 200);

          if (accumulatedDelta >= 25) {
            accumulatedDelta = 0;
            transitionTo(active + 1, 'down');
          }
        }
      }
      // Scrolling UP
      else if (delta < 0) {
        // If the slide can still scroll up internally
        if (maxScroll > 5 && scrollTop > 3) {
          accumulatedDelta = 0;
          return; // Let native internal scroll work smoothly
        }

        // At the top of current slide
        if (active > 0) {
          e.preventDefault();
          accumulatedDelta += delta;
          clearTimeout(deltaResetTimer);
          deltaResetTimer = setTimeout(function () {
            accumulatedDelta = 0;
          }, 200);

          if (accumulatedDelta <= -25) {
            accumulatedDelta = 0;
            transitionTo(active - 1, 'up');
          }
        }
      }
    }, { passive: false });

    window.addEventListener('keydown', function (e) {
      if (isTransitioning) return;
      var active = getActiveIndex();
      var slide = slides[active];
      if (!slide) return;
      var maxScroll = slide.scrollHeight - slide.clientHeight;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        if (maxScroll <= 5 || slide.scrollTop >= maxScroll - 5) {
          if (active < slides.length - 1) {
            e.preventDefault();
            transitionTo(active + 1, 'down');
          }
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        if (maxScroll <= 5 || slide.scrollTop <= 5) {
          if (active > 0) {
            e.preventDefault();
            transitionTo(active - 1, 'up');
          }
        }
      }
    });
  }

  /* ---------- Custom scroll progress bar + dot nav ---------- */
  function initScrollUI() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero, .work, .project, .contact'));
    if (!slides.length) return;

    var progress = document.createElement('div');
    progress.className = 'scroll-progress';
    var fill = document.createElement('div');
    fill.className = 'scroll-progress-fill';
    progress.appendChild(fill);
    document.body.appendChild(progress);

    var nav = document.createElement('nav');
    nav.className = 'slide-nav';
    nav.setAttribute('aria-label', '슬라이드 내비게이션');
    var dots = slides.map(function (slide) {
      var dot = document.createElement('a');
      dot.className = 'slide-dot';
      dot.href = '#' + slide.id;
      dot.setAttribute('aria-label', slide.id);
      nav.appendChild(dot);
      return dot;
    });
    document.body.appendChild(nav);

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function (e) {
        e.preventDefault();
        slides[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    var ticking = false;
    function update() {
      var mid = window.innerHeight / 2;
      var active = 0;
      for (var i = 0; i < slides.length; i++) {
        var r = slides[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) {
          active = i;
          break;
        }
      }
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === active);
      });

      // Progress is scoped to the current slide's own internal scroll
      // (top -> bottom of ITS content), not the whole 15-slide document —
      // each slide fills the bar on its own, then the next one starts over.
      var slide = slides[active];
      var max = slide.scrollHeight - slide.clientHeight;
      var pct = max > 0 ? (slide.scrollTop / max) * 100 : 100;
      fill.style.width = pct + '%';
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Each slide scrolls its own overflow internally, which does not
    // bubble up as a window scroll event — listen on every slide too so
    // the bar tracks progress while scrolling through a long project page.
    slides.forEach(function (slide) {
      slide.addEventListener('scroll', onScroll, { passive: true });
    });
    window.addEventListener('resize', update);
    update();
  }

  function initNavLinks() {
    var links = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = id && document.getElementById(id);
        if (!target) return;
        var slide = target.closest('.hero, .work, .project, .contact');
        if (!slide || target === slide) return; // whole-slide links: default behavior is already correct

        e.preventDefault();
        slide.scrollIntoView({ behavior: 'auto', block: 'start' });
        var offset = target.offsetTop - slide.offsetTop;
        slide.scrollTop = Math.max(0, offset - 16);
      });
    });
  }

  function initFilters() {
    var pills = Array.prototype.slice.call(document.querySelectorAll('.pill'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.work-card'));
    if (!pills.length || !cards.length) return;

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var filter = pill.getAttribute('data-filter');

        pills.forEach(function (p) {
          p.classList.toggle('pill--active', p === pill);
        });

        cards.forEach(function (card) {
          var show = filter === 'all' || card.getAttribute('data-category') === filter;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
  }
})();
