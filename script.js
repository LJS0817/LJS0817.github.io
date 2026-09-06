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
     just needs the plain <img> (or <video>) in .shot-grid.
   - Project video restart: every clip in a project detail is a short
     muted loop, so a visitor who scrolls into a section mid-loop lands
     halfway through the clip and never sees how it starts. Each video
     is watched with IntersectionObserver; entering the viewport rewinds
     it to 0 and plays, leaving pauses it. Side benefit: clips that are
     off-screen aren't left looping, which is ~20 videos' worth of
     decode work saved on a long page.
   - 핵심 구현 media orientation: same idea as the screenshot grid, but
     for .tech-card-img (img or video). A portrait clip left at the
     fixed 280px card height would render as a narrow sliver with the
     rest of the box empty, so a portrait .tech-card switches to a
     side-by-side layout (text | media) instead of stacked -- see
     .tech-card.is-portrait in CSS. Detected from the media's real
     pixel/video dimensions once known, so any future tech-card-img
     just needs the plain <img>/<video> and this tags it automatically.
   ========================================================= */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initStickyBanner();
    initShotOrientation();
    initTechCardOrientation();
    initVideoRestart();
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
    var media = Array.prototype.slice.call(document.querySelectorAll('.shot-grid img, .shot-grid video'));
    if (!media.length) return;

    function tag(el) {
      var isVideo = el.tagName === 'VIDEO';
      var w = isVideo ? el.videoWidth : el.naturalWidth;
      var h = isVideo ? el.videoHeight : el.naturalHeight;
      if (!w || !h) return;
      el.classList.toggle('shot-portrait', h > w);
    }

    media.forEach(function (el) {
      if (el.tagName === 'VIDEO') {
        if (el.readyState >= 1) {
          tag(el);
        } else {
          el.addEventListener('loadedmetadata', function () { tag(el); });
        }
      } else if (el.complete) {
        tag(el);
      } else {
        el.addEventListener('load', function () { tag(el); });
      }
    });
  }

  function initTechCardOrientation() {
    var media = Array.prototype.slice.call(document.querySelectorAll('.tech-card-img'));
    if (!media.length) return;

    function tag(el) {
      var isVideo = el.tagName === 'VIDEO';
      var w = isVideo ? el.videoWidth : el.naturalWidth;
      var h = isVideo ? el.videoHeight : el.naturalHeight;
      if (!w || !h) return;
      var card = el.closest('.tech-card');
      if (card && !card.classList.contains('no-portrait')) card.classList.toggle('is-portrait', h > w);
    }

    media.forEach(function (el) {
      if (el.tagName === 'VIDEO') {
        if (el.readyState >= 1) {
          tag(el);
        } else {
          el.addEventListener('loadedmetadata', function () { tag(el); });
        }
      } else if (el.complete) {
        tag(el);
      } else {
        el.addEventListener('load', function () { tag(el); });
      }
    });
  }


  function initVideoRestart() {
    var videos = Array.prototype.slice.call(document.querySelectorAll('.project video'));
    if (!videos.length || !('IntersectionObserver' in window)) return;

    function rewindAndPlay(v) {
      try {
        v.currentTime = 0;
      } catch (e) {
        /* seeking before metadata is ready throws in some browsers -- harmless */
      }
      // play() rejects when the browser's autoplay policy blocks it (Safari's
      // per-site "Never Auto-Play", Low Power Mode). Nothing to do about it
      // here, but the rejection must be swallowed or it surfaces as an
      // unhandled promise rejection in the console.
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }

    function enter(v) {
      // currentTime = 0 only sticks once the media has a timeline, so on a
      // cold video wait for metadata before rewinding.
      if (v.readyState >= 1) {
        rewindAndPlay(v);
      } else {
        v.addEventListener('loadedmetadata', function once() {
          v.removeEventListener('loadedmetadata', once);
          rewindAndPlay(v);
        });
      }
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) {
            // Guard against the observer re-firing while the clip is already
            // on screen -- without it, any threshold recalculation would
            // yank a playing video back to 0 mid-view.
            if (v.getAttribute('data-inview') === '1') return;
            v.setAttribute('data-inview', '1');
            enter(v);
          } else {
            v.setAttribute('data-inview', '0');
            v.pause();
          }
        });
      },
      // Expanding the root vertically starts a clip a screenful-ish BEFORE
      // it scrolls into view, so it is already running by the time the
      // reader can see it. Triggering on actual visibility instead would
      // leave the video visibly paused for the moment it takes to start,
      // and Safari draws its own play-button glyph over a paused video --
      // so the reader would watch a play button slide up the screen.
      { rootMargin: '400px 0px 400px 0px', threshold: 0 }
    );

    videos.forEach(function (v) { observer.observe(v); });
  }

})();
