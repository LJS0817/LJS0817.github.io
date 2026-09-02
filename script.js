/* =========================================================
   LJS0817 Portfolio — case "1b"
   - Plain, normal-flow page: the browser's own scrolling handles
     everything. Smooth anchor-jump behavior and the fixed top nav
     offset are both handled in CSS (scroll-behavior / scroll-padding-top
     on <html>), so no JS scroll coordination is needed here.
   - Project index (in-body right rail): one static copy per project
     with its own row pre-marked .is-active in the HTML, so it needs
     no JS at all.
   - Sticky banner background swap: a zero-height sentinel is inserted
     right before each .project-banner-text; once IntersectionObserver
     reports that sentinel has scrolled past the nav offset, the banner
     text is actually pinned, so we add .is-stuck to switch its
     background (CSS handles the actual look).
   - Screenshot grid orientation: portrait screenshots need a different
     layout (capped height, sit side by side) than landscape ones
     (full width, one per row) -- see .shot-grid / .shot-portrait in
     CSS. Rather than hand-tagging every future screenshot with a
     class, this reads each image's actual pixel dimensions once
     loaded and tags it automatically, so any screenshot added later
     just needs the plain <img> in .shot-grid.
   ========================================================= */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initStickyBanner();
    initShotOrientation();
  });

  function initStickyBanner() {
    var texts = Array.prototype.slice.call(document.querySelectorAll('.project-banner-text'));
    if (!texts.length || !('IntersectionObserver' in window)) return;

    var navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var text = entry.target.nextElementSibling;
          if (text) text.classList.toggle('is-stuck', !entry.isIntersecting);
        });
      },
      { rootMargin: '-' + (navH + 1) + 'px 0px 0px 0px', threshold: 0 }
    );

    texts.forEach(function (text) {
      var sentinel = document.createElement('div');
      sentinel.className = 'banner-sticky-sentinel';
      text.parentNode.insertBefore(sentinel, text);
      observer.observe(sentinel);
    });
  }

  function initShotOrientation() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('.shot-grid img'));
    if (!imgs.length) return;

    function tag(img) {
      if (img.naturalWidth && img.naturalHeight) {
        img.classList.toggle('shot-portrait', img.naturalHeight > img.naturalWidth);
      }
    }

    imgs.forEach(function (img) {
      if (img.complete) {
        tag(img);
      } else {
        img.addEventListener('load', function () { tag(img); });
      }
    });
  }

})();
