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
    initHeroPad();
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


  /* -------------------------------------------------------------------
     Hero controller (3D)
     The inline SVG in .hero-visual is the baseline: it renders instantly,
     costs nothing, and is what a visitor sees if three.js fails to load
     or the GPU refuses a WebGL context. This upgrades that slot to a real
     extruded mesh lit from below by the grid, and only swaps the SVG out
     once the first frame has actually drawn -- so a failure anywhere in
     here leaves the page exactly as it was.
     ------------------------------------------------------------------- */
  function initHeroPad() {
    var mount = document.querySelector('.hero-pad-3d');
    var host = document.querySelector('.hero-visual');
    if (!mount || !host || !window.THREE) return;

    var svg = host.querySelector('svg');
    var ORANGE = 0xf97316;
    var DEEP = 0xea580c;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      return; // no WebGL -- the SVG stays
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(34, 400 / 440, 0.1, 100);
    camera.position.set(0, 0.85, 6.4);
    camera.lookAt(0, -0.35, 0);

    // ---- gamepad silhouette, same outline as the SVG fallback ----------
    var shape = new THREE.Shape();
    shape.moveTo(-1.50, 1.125);
    shape.quadraticCurveTo(0, 1.325, 1.55, 1.125);
    shape.quadraticCurveTo(2.25, 1.0, 2.35, 0.25);
    shape.quadraticCurveTo(2.55, -0.80, 2.20, -1.50);
    shape.quadraticCurveTo(1.925, -2.0, 1.425, -1.725);
    shape.quadraticCurveTo(1.025, -1.50, 0.80, -0.95);
    shape.quadraticCurveTo(0.65, -0.625, 0.25, -0.575);
    shape.lineTo(-0.20, -0.575);
    shape.quadraticCurveTo(-0.60, -0.625, -0.75, -0.95);
    shape.quadraticCurveTo(-0.975, -1.50, -1.375, -1.725);
    shape.quadraticCurveTo(-1.875, -2.0, -2.15, -1.50);
    shape.quadraticCurveTo(-2.50, -0.80, -2.30, 0.25);
    shape.quadraticCurveTo(-2.20, 1.0, -1.50, 1.125);

    var DEPTH = 0.42, BEV = 0.13;
    var bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH, bevelEnabled: true, bevelThickness: BEV,
      bevelSize: BEV, bevelSegments: 5, curveSegments: 24
    });
    var FACE = DEPTH + BEV + 0.01;

    var pad = new THREE.Group();
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
      color: 0x2b2018, roughness: 0.52, metalness: 0.35
    }));
    pad.add(body);

    // d-pad
    var cross = new THREE.Shape();
    var a = 0.30, b = 0.10;
    cross.moveTo(-a, -b); cross.lineTo(-b, -b); cross.lineTo(-b, -a); cross.lineTo(b, -a);
    cross.lineTo(b, -b); cross.lineTo(a, -b); cross.lineTo(a, b); cross.lineTo(b, b);
    cross.lineTo(b, a); cross.lineTo(-b, a); cross.lineTo(-b, b); cross.lineTo(-a, b);
    cross.closePath();
    var dpad = new THREE.Mesh(
      new THREE.ExtrudeGeometry(cross, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }),
      new THREE.MeshStandardMaterial({ color: 0x8d8177, roughness: 0.6, metalness: 0.2 })
    );
    dpad.position.set(-1.10, 0.55, FACE - 0.02);
    pad.add(dpad);

    // face buttons
    var btnGeo = new THREE.CylinderGeometry(0.16, 0.17, 0.12, 24);
    [[1.30, 0.90, ORANGE], [1.64, 0.56, DEEP], [0.96, 0.56, DEEP], [1.30, 0.22, 0xc2440c]]
      .forEach(function (b2) {
        var m = new THREE.Mesh(btnGeo, new THREE.MeshStandardMaterial({
          color: b2[2], roughness: 0.35, metalness: 0.1,
          emissive: b2[2], emissiveIntensity: 0.45
        }));
        m.rotation.x = Math.PI / 2;
        m.position.set(b2[0], b2[1], FACE + 0.03);
        pad.add(m);
      });

    // analog sticks
    [-0.42, 0.48].forEach(function (x) {
      var well = new THREE.Mesh(
        new THREE.CylinderGeometry(0.33, 0.33, 0.08, 28),
        new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.8 })
      );
      well.rotation.x = Math.PI / 2;
      well.position.set(x, -0.15, FACE);
      pad.add(well);
      var stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.20, 0.13, 0.24, 24),
        new THREE.MeshStandardMaterial({ color: 0x3a3029, roughness: 0.55, metalness: 0.3 })
      );
      stick.rotation.x = Math.PI / 2;
      stick.position.set(x, -0.15, FACE + 0.14);
      pad.add(stick);
    });

    // shoulder buttons
    [-1.10, 1.10].forEach(function (x) {
      var sh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0x241a14, roughness: 0.6, metalness: 0.3 })
      );
      sh.rotation.z = Math.PI / 2;
      sh.position.set(x, 1.16, DEPTH / 2);
      pad.add(sh);
    });

    bodyGeo.computeBoundingBox();
    pad.position.y = 0.35;
    scene.add(pad);

    // ---- holographic grid ---------------------------------------------
    var GRID_Y = -2.15;
    var N = 27, STEP = 0.32, half = (N - 1) / 2, maxR = half * STEP;
    var pos = [], col = [], c = new THREE.Color();
    for (var i = 0; i < N; i++) {
      for (var j = 0; j < N; j++) {
        var x = (i - half) * STEP, z = (j - half) * STEP;
        var t = Math.min(1, Math.sqrt(x * x + z * z) / maxR);
        var fall = Math.pow(1 - t, 1.6);
        if (fall <= 0.02) continue;
        pos.push(x, 0, z);
        c.setHex(ORANGE);
        col.push(c.r * (0.25 + fall), c.g * (0.25 + fall), c.b * (0.25 + fall));
      }
    }
    var gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    var grid = new THREE.Points(gGeo, new THREE.PointsMaterial({
      size: 0.085, sizeAttenuation: true, vertexColors: true,
      map: discTexture(), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    grid.position.y = GRID_Y;
    scene.add(grid);

    // floor bloom
    var bloom = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.MeshBasicMaterial({
        map: radialTexture(), transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.75
      })
    );
    bloom.rotation.x = -Math.PI / 2;
    bloom.position.y = GRID_Y - 0.02;
    scene.add(bloom);

    // light shafts between pad and grid
    var shafts = new THREE.Group();
    var shaftTex = shaftTexture();
    [-1.25, -0.62, 0, 0.62, 1.25].forEach(function (x, k) {
      var h = 1.55 - Math.abs(x) * 0.28;
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.10, h),
        new THREE.MeshBasicMaterial({
          map: shaftTex, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: 0.8 - Math.abs(x) * 0.18
        })
      );
      m.position.set(x, GRID_Y + h / 2, 0);
      shafts.add(m);
    });
    scene.add(shafts);

    // ---- lighting ------------------------------------------------------
    scene.add(new THREE.AmbientLight(0x4a3d33, 1.15));
    var key = new THREE.DirectionalLight(0xfff2e6, 1.5);
    key.position.set(3.5, 4.5, 5);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xffd8b0, 0.6);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    // the grid is the practical light source for the underside
    var bounce = new THREE.PointLight(ORANGE, 3.2, 7, 2);
    bounce.position.set(0, GRID_Y + 0.7, 0.9);
    scene.add(bounce);

    // ---- textures ------------------------------------------------------
    function discTexture() {
      var cv = document.createElement('canvas'); cv.width = cv.height = 64;
      var g = cv.getContext('2d');
      var rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, 'rgba(255,255,255,1)');
      rg.addColorStop(0.45, 'rgba(255,255,255,0.85)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    }
    function radialTexture() {
      var cv = document.createElement('canvas'); cv.width = cv.height = 256;
      var g = cv.getContext('2d');
      var rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      rg.addColorStop(0, 'rgba(249,115,22,0.55)');
      rg.addColorStop(0.4, 'rgba(234,88,12,0.22)');
      rg.addColorStop(1, 'rgba(234,88,12,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(cv);
    }
    function shaftTexture() {
      var cv = document.createElement('canvas'); cv.width = 8; cv.height = 128;
      var g = cv.getContext('2d');
      var lg = g.createLinearGradient(0, 128, 0, 0);
      lg.addColorStop(0, 'rgba(253,186,116,0.85)');
      lg.addColorStop(0.35, 'rgba(249,115,22,0.4)');
      lg.addColorStop(1, 'rgba(249,115,22,0)');
      g.fillStyle = lg; g.fillRect(0, 0, 8, 128);
      return new THREE.CanvasTexture(cv);
    }

    // ---- size / loop ---------------------------------------------------
    function resize() {
      var w = host.clientWidth || 400;
      var h = Math.round(w * 440 / 400);
      renderer.setSize(w, h, true);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    mount.appendChild(renderer.domElement);

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var px = 0, py = 0, tx = 0, ty = 0, running = false, raf = 0, t0 = performance.now();

    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener('resize', resize);

    function frame() {
      var t = (performance.now() - t0) / 1000;
      px += (tx - px) * 0.05;
      py += (ty - py) * 0.05;
      pad.position.y = 0.35 + Math.sin(t * 1.05) * 0.13;
      pad.rotation.y = -0.30 + Math.sin(t * 0.62) * 0.14 + px * 0.22;
      pad.rotation.x = 0.16 + Math.sin(t * 0.85) * 0.05 + py * 0.12;
      pad.rotation.z = Math.sin(t * 0.5) * 0.04;
      var pulse = 0.78 + Math.sin(t * 1.05) * 0.22;
      bloom.material.opacity = 0.5 + pulse * 0.35;
      bounce.intensity = 2.4 + pulse * 1.2;
      shafts.children.forEach(function (m, k) {
        m.material.opacity = (0.55 + Math.sin(t * 1.05 + k * 0.5) * 0.22);
      });
      renderer.render(scene, camera);
      if (running) raf = requestAnimationFrame(frame);
    }

    // first frame decides whether the upgrade actually happened
    try {
      renderer.render(scene, camera);
    } catch (e) {
      renderer.dispose();
      mount.innerHTML = '';
      return;
    }
    if (svg) svg.style.display = 'none';
    mount.classList.add('is-live');

    if (reduce) {
      pad.rotation.set(0.16, -0.30, 0);
      renderer.render(scene, camera);
      return;
    }

    // Same rule as the project clips: no GPU work while it is off screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !running) {
            running = true; raf = requestAnimationFrame(frame);
          } else if (!en.isIntersecting && running) {
            running = false; cancelAnimationFrame(raf);
          }
        });
      }, { rootMargin: '200px 0px' }).observe(host);
    } else {
      running = true; raf = requestAnimationFrame(frame);
    }
  }

})();
