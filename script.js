/* =========================================================
   LJS0817 Portfolio — Steam Library Interactions
   - Tech card orientation detection (.tech-card.is-portrait)
   - Steam-style screenshot & clip carousel + expand grid toggle (.shot-gallery)
   - Lightbox preview modal (#media-lightbox)
   - Deferred video loading + playback control for tech cards & gallery slides
   - Steam Library left sidebar: category filters, keyword search, collapsible
     groups, ScrollSpy highlighting, internal rail scroll sync, and mobile drawer
   ========================================================= */
(function () {
  'use strict';

  var pauseClipFn = function () {};
  var enterClipFn = function () {};
  var openLightboxFn = function () {};
  var syncScrollUIFn = function () {};

  document.addEventListener('DOMContentLoaded', function () {
    initTechCardOrientation();
    initShotGallery();
    initLightbox();
    initVideoRestart();
    initSteamLibrary();
    initScrollUI();
  });

  /* -------------------------------------------------------
     1. 핵심 구현 카드 세로형 미디어 자동 판별
     ------------------------------------------------------- */
  function initTechCardOrientation() {
    var media = Array.prototype.slice.call(document.querySelectorAll('.tech-card-img'));
    if (!media.length) return;

    function tag(el) {
      var isVideo = el.tagName === 'VIDEO';
      var w = isVideo ? el.videoWidth : el.naturalWidth;
      var h = isVideo ? el.videoHeight : el.naturalHeight;
      if (!w || !h) return;
      var card = el.closest('.tech-card');
      if (card && !card.classList.contains('no-portrait')) {
        card.classList.toggle('is-portrait', h > w);
      }
    }

    media.forEach(function (el) {
      if (el.tagName === 'VIDEO') {
        if (el.readyState >= 1) tag(el);
        else el.addEventListener('loadedmetadata', function () { tag(el); });
      } else if (el.complete) {
        tag(el);
      } else {
        el.addEventListener('load', function () { tag(el); });
      }
    });
  }

  /* -------------------------------------------------------
     2. Steam Store/Library 미디어 갤러리 (캐러셀 + 전체 펼치기)
     ------------------------------------------------------- */
  function initShotGallery() {
    var grids = Array.prototype.slice.call(document.querySelectorAll('.shot-grid'));
    if (!grids.length) return;

    grids.forEach(function (grid) {
      var slides = Array.prototype.slice.call(grid.children).filter(function (el) {
        return el.tagName === 'IMG' || el.tagName === 'VIDEO';
      });
      if (!slides.length) return;

      var project = grid.closest('.project');
      var showcase = grid.closest('.project-showcase');
      var projectTitle = project && project.querySelector('h2') ? project.querySelector('h2').textContent.trim() : '';
      var fallbackPosterEl = project ? project.querySelector('.project-banner-img') : null;
      var firstImgSlide = slides.find(function (el) { return el.tagName === 'IMG' && el.getAttribute('src'); });
      var fallbackPoster = (project && project.getAttribute('data-poster'))
        || (fallbackPosterEl ? fallbackPosterEl.getAttribute('src') : '')
        || (firstImgSlide ? firstImgSlide.getAttribute('src') : '');

      grid.classList.add('is-enhanced');

      var gallery = document.createElement('div');
      gallery.className = 'shot-gallery';
      gallery.setAttribute('tabindex', '0');

      // Toolbar bar
      var bar = document.createElement('div');
      bar.className = 'gallery-bar';

      var counter = document.createElement('div');
      counter.className = 'gallery-counter';

      var tools = document.createElement('div');
      tools.className = 'gallery-tools';

      var expandBtn = document.createElement('button');
      expandBtn.type = 'button';
      expandBtn.className = 'gallery-tool-btn';
      expandBtn.textContent = '모두 펼치기';

      var zoomBtn = document.createElement('button');
      zoomBtn.type = 'button';
      zoomBtn.className = 'gallery-tool-btn';
      zoomBtn.textContent = '확대 보기';

      if (slides.length > 1) tools.appendChild(expandBtn);
      tools.appendChild(zoomBtn);
      bar.appendChild(counter);
      bar.appendChild(tools);

      // Stage
      var stage = document.createElement('div');
      stage.className = 'gallery-stage';

      var track = document.createElement('div');
      track.className = 'gallery-stage-track';
      slides.forEach(function (el) {
        if (el.tagName === 'VIDEO' && !el.getAttribute('poster') && fallbackPoster) {
          el.poster = fallbackPoster;
        }
        track.appendChild(el);
      });
      stage.appendChild(track);

      var prevBtn = null;
      var nextBtn = null;
      if (slides.length > 1) {
        prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'gallery-nav gallery-nav--prev';
        prevBtn.setAttribute('aria-label', '이전 스크린샷');
        prevBtn.innerHTML = '&#8249;';

        nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'gallery-nav gallery-nav--next';
        nextBtn.setAttribute('aria-label', '다음 스크린샷');
        nextBtn.innerHTML = '&#8250;';

        stage.appendChild(prevBtn);
        stage.appendChild(nextBtn);
      }

      // Thumbnail strip
      var thumbsWrap = document.createElement('div');
      thumbsWrap.className = 'gallery-thumbs';

      var activeIdx = 0;
      var thumbBtns = [];

      slides.forEach(function (el, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gallery-thumb' + (el.tagName === 'VIDEO' ? ' gallery-thumb--video' : '');
        btn.setAttribute('aria-label', (idx + 1) + '번 미디어 보기');

        var thumbImg = document.createElement('img');
        thumbImg.alt = '';
        thumbImg.loading = 'lazy';
        thumbImg.src = el.tagName === 'IMG' ? el.getAttribute('src') : fallbackPoster;
        btn.appendChild(thumbImg);

        if (el.tagName === 'VIDEO') {
          var badge = document.createElement('span');
          badge.className = 'thumb-video-badge';
          badge.innerHTML = '&#9654; CLIP';
          btn.appendChild(badge);
        }

        btn.addEventListener('click', function () {
          setSlide(idx);
        });

        thumbBtns.push(btn);
        thumbsWrap.appendChild(btn);

        if (el.tagName === 'IMG') {
          el.addEventListener('click', function () {
            if (!gallery.classList.contains('is-expanded') && activeIdx !== idx) return;
            openLightboxFn(el, projectTitle + ' · ' + (idx + 1) + ' / ' + slides.length);
          });
        }
      });

      function keepThumbVisible(btn) {
        if (!btn) return;
        var stripRect = thumbsWrap.getBoundingClientRect();
        var btnRect = btn.getBoundingClientRect();
        if (btnRect.left < stripRect.left + 8) {
          thumbsWrap.scrollLeft += btnRect.left - stripRect.left - 8;
        } else if (btnRect.right > stripRect.right - 8) {
          thumbsWrap.scrollLeft += btnRect.right - stripRect.right + 8;
        }
      }

      function setSlide(nextIdx) {
        if (nextIdx < 0) nextIdx = slides.length - 1;
        if (nextIdx >= slides.length) nextIdx = 0;
        activeIdx = nextIdx;

        slides.forEach(function (el, i) {
          var on = i === activeIdx;
          el.classList.toggle('is-active', on);
          if (el.tagName === 'VIDEO') {
            if (on && stage.getAttribute('data-inview') === '1' && (!project || !project.hidden)) {
              enterClipFn(el);
            } else if (!on && !gallery.classList.contains('is-expanded')) {
              pauseClipFn(el);
            }
          }
        });

        thumbBtns.forEach(function (btn, i) {
          btn.classList.toggle('is-active', i === activeIdx);
        });

        counter.innerHTML = '<strong>' + (activeIdx + 1) + '</strong> / ' + slides.length;
        keepThumbVisible(thumbBtns[activeIdx]);
      }

      if (prevBtn) prevBtn.addEventListener('click', function () { setSlide(activeIdx - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { setSlide(activeIdx + 1); });

      zoomBtn.addEventListener('click', function () {
        var current = slides[activeIdx];
        if (current) {
          openLightboxFn(current, projectTitle + ' · ' + (activeIdx + 1) + ' / ' + slides.length);
        }
      });

      expandBtn.addEventListener('click', function () {
        var expanded = gallery.classList.toggle('is-expanded');
        if (showcase) showcase.classList.toggle('is-gallery-expanded', expanded);
        expandBtn.textContent = expanded ? '갤러리로 접기' : '모두 펼치기';
        zoomBtn.hidden = expanded;
        slides.forEach(function (el, i) {
          if (el.tagName === 'VIDEO') {
            var shouldPlay = (expanded || i === activeIdx) && stage.getAttribute('data-inview') === '1' && (!project || !project.hidden);
            if (shouldPlay) enterClipFn(el);
            else pauseClipFn(el);
          }
        });
      });

      gallery.addEventListener('keydown', function (e) {
        if (gallery.classList.contains('is-expanded')) return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSlide(activeIdx - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSlide(activeIdx + 1);
        }
      });

      gallery.appendChild(bar);
      gallery.appendChild(stage);
      if (slides.length > 1) gallery.appendChild(thumbsWrap);

      grid.innerHTML = '';
      grid.appendChild(gallery);
      setSlide(0);
    });
  }

  /* -------------------------------------------------------
     3. 미디어 확대 보기 라이트박스
     ------------------------------------------------------- */
  function initLightbox() {
    var modal = document.getElementById('media-lightbox');
    var backdrop = document.getElementById('lightbox-backdrop');
    var closeBtn = document.getElementById('lightbox-close');
    var stage = document.getElementById('lightbox-stage');
    var caption = document.getElementById('lightbox-caption');
    if (!modal || !stage) return;

    function close() {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      stage.innerHTML = '';
    }

    openLightboxFn = function (sourceEl, text) {
      stage.innerHTML = '';
      if (sourceEl.tagName === 'VIDEO') {
        var vid = document.createElement('video');
        vid.src = sourceEl.getAttribute('src') || sourceEl.dataset.src || '';
        if (sourceEl.getAttribute('poster')) vid.poster = sourceEl.getAttribute('poster');
        vid.controls = true;
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        stage.appendChild(vid);
      } else {
        var img = document.createElement('img');
        img.src = sourceEl.getAttribute('src') || '';
        img.alt = sourceEl.getAttribute('alt') || text || '';
        stage.appendChild(img);
      }
      if (caption) caption.textContent = text || '';
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
    };

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) close();
    });

    // Also allow clicking tech-card images to inspect diagrams closely
    document.querySelectorAll('.tech-card img.tech-card-img').forEach(function (img) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        var card = img.closest('.tech-card');
        var title = card && card.querySelector('.tech-card-title') ? card.querySelector('.tech-card-title').textContent.trim() : '';
        openLightboxFn(img, title);
      });
    });
  }

  /* -------------------------------------------------------
     4. 프로젝트 영상 지연 로드 · 화면 진입 시 재생 · 이탈 시 정지
     ------------------------------------------------------- */
  function initVideoRestart() {
    var techVideos = Array.prototype.slice.call(document.querySelectorAll('.tech-card video'));
    var galleryStages = Array.prototype.slice.call(document.querySelectorAll('.gallery-stage'));

    techVideos.forEach(function (v) {
      var frame = v.closest('.tech-media-frame');
      function markReady() {
        if (frame) frame.classList.add('is-ready');
      }
      if (v.readyState >= 2) markReady();
      else {
        v.addEventListener('loadeddata', markReady, { once: true });
        v.addEventListener('canplay', markReady, { once: true });
        v.addEventListener('playing', markReady, { once: true });
      }
    });

    function attachSource(v) {
      if (!v.getAttribute('src') && v.dataset.src) {
        // preload="none" blocks fetching unless preload is upgraded BEFORE assigning src.
        v.preload = 'auto';
        v.src = v.dataset.src;
      }
    }

    function playVideo(v) {
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }

    function rewindAndPlay(v) {
      try {
        v.currentTime = 0;
      } catch (e) {
        /* seeking before metadata is ready throws in some browsers */
      }
      playVideo(v);
    }

    enterClipFn = function (v) {
      if (!v) return;
      var proj = v.closest('.project');
      if (proj && proj.hidden) return;
      attachSource(v);
      if (v.readyState >= 1) rewindAndPlay(v);
      else playVideo(v);
    };

    pauseClipFn = function (v) {
      if (!v) return;
      if (v.getAttribute('src')) {
        v.pause();
      }
    };

    if (!('IntersectionObserver' in window)) {
      techVideos.forEach(function (v) { enterClipFn(v); });
      galleryStages.forEach(function (stage) {
        stage.setAttribute('data-inview', '1');
        var active = stage.querySelector('video.is-active');
        if (active) enterClipFn(active);
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var target = entry.target;
          if (target.classList.contains('gallery-stage')) {
            var gallery = target.closest('.shot-gallery');
            var expanded = gallery && gallery.classList.contains('is-expanded');
            var clips = Array.prototype.slice.call(target.querySelectorAll('video'));
            if (entry.isIntersecting) {
              target.setAttribute('data-inview', '1');
              clips.forEach(function (v) {
                if (expanded || v.classList.contains('is-active')) enterClipFn(v);
              });
            } else {
              target.setAttribute('data-inview', '0');
              clips.forEach(pauseClipFn);
            }
            return;
          }

          if (entry.isIntersecting) {
            if (target.getAttribute('data-inview') === '1') return;
            target.setAttribute('data-inview', '1');
            enterClipFn(target);
          } else {
            target.setAttribute('data-inview', '0');
            pauseClipFn(target);
          }
        });
      },
      { rootMargin: '320px 0px 320px 0px', threshold: 0 }
    );

    techVideos.forEach(function (v) { observer.observe(v); });
    galleryStages.forEach(function (s) { observer.observe(s); });
  }

  /* -------------------------------------------------------
     5. 스팀 라이브러리 사이드바: 필터 · 검색 · ScrollSpy · 모바일 서랍
     ------------------------------------------------------- */
  function initSteamLibrary() {
    var workSection = document.getElementById('work');
    var shell = document.getElementById('library-shell');
    var libraryMain = document.getElementById('library-main');
    var sidebar = document.getElementById('library-sidebar');
    var libList = document.getElementById('lib-list');
    var backdrop = document.getElementById('library-backdrop');
    var searchInput = document.getElementById('lib-search');
    var searchClear = document.getElementById('lib-search-clear');
    var matchCountEl = document.getElementById('lib-match-count');
    var appWinCurrent = document.getElementById('app-win-current');
    var appWinStatus = document.getElementById('app-win-status');
    var filterBanner = document.getElementById('active-filter-banner');
    var filterText = document.getElementById('active-filter-text');
    var resetFiltersBtn = document.getElementById('reset-filters-btn');
    var emptyState = document.getElementById('library-empty');
    var emptyResetBtn = document.getElementById('empty-reset-btn');
    var mobileToggle = document.getElementById('mobile-lib-toggle');
    var closeBtn = document.getElementById('lib-close-btn');
    var mobileActiveNum = document.getElementById('mobile-active-num');
    var mobileActiveTitle = document.getElementById('mobile-active-title');
    var mobilePrevBtn = document.getElementById('mobile-prev-btn');
    var mobileNextBtn = document.getElementById('mobile-next-btn');

    var filterTabs = Array.prototype.slice.call(document.querySelectorAll('.lib-filter-tab'));
    var groupEls = Array.prototype.slice.call(document.querySelectorAll('.lib-group'));
    var libItems = Array.prototype.slice.call(document.querySelectorAll('.lib-item'));
    var projectSections = Array.prototype.slice.call(document.querySelectorAll('section.project'));

    if (!sidebar || !libList || !libraryMain || !libItems.length || !projectSections.length) return;

    function isWindowBoxMode() {
      var style = getComputedStyle(libraryMain);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && libraryMain.clientHeight > 0;
    }

    function getLockScrollY() {
      var targetEl = workSection || shell;
      if (!targetEl) return 0;
      var navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 56;
      var targetRect = targetEl.getBoundingClientRect();
      var targetDocTop = (window.scrollY || window.pageYOffset || 0) + targetRect.top;
      var targetStyle = getComputedStyle(targetEl);
      var padTop = parseFloat(targetStyle.paddingTop) || 0;
      var padBottom = parseFloat(targetStyle.paddingBottom) || 0;
      var contentH = Math.max(0, targetRect.height - padTop - padBottom);
      var contentDocTop = targetDocTop + padTop;
      var availableH = Math.max(0, window.innerHeight - navH);
      var targetTop = navH + Math.max(16, (availableH - contentH) / 2);
      var maxAllowedScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return Math.min(maxAllowedScroll, Math.max(0, Math.round(contentDocTop - targetTop)));
    }

    var wheelQueue = 0;
    var wheelRaf = 0;
    var lastWheelTick = 0;

    function resetWheelQueue() {
      wheelQueue = 0;
      lastWheelTick = 0;
      if (wheelRaf) {
        window.cancelAnimationFrame(wheelRaf);
        wheelRaf = 0;
      }
    }

    function ensureShellVisible() {
      if (!workSection && !shell) return;
      resetWheelQueue();
      var lockY = getLockScrollY();
      var winY = window.scrollY || window.pageYOffset || 0;
      if (Math.abs(winY - lockY) > 2) {
        window.scrollTo({ top: lockY, behavior: 'smooth' });
      }
    }

    function scrollToProject(target) {
      if (!target) return;
      resetWheelQueue();
      if (isWindowBoxMode()) {
        ensureShellVisible();
        var topOffset;
        if (target.offsetParent === libraryMain) {
          topOffset = target.offsetTop;
        } else {
          topOffset = libraryMain.scrollTop + (target.getBoundingClientRect().top - libraryMain.getBoundingClientRect().top);
        }
        libraryMain.scrollTo({ top: Math.max(0, Math.round(topOffset)), behavior: 'smooth' });
      } else {
        var navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 56;
        var mobBar = document.querySelector('.mobile-library-bar');
        var mobBarH = (mobBar && mobBar.offsetHeight) ? mobBar.offsetHeight : 52;
        var targetDocTop = (window.scrollY || window.pageYOffset || 0) + target.getBoundingClientRect().top;
        var finalY = Math.max(0, Math.round(targetDocTop - navH - mobBarH));
        window.scrollTo({ top: finalY, behavior: 'smooth' });
      }
    }

    var state = {
      filter: 'all',
      query: '',
      activeId: projectSections[0].id,
    };

    var itemById = {};
    libItems.forEach(function (item) {
      itemById[item.dataset.project] = item;
    });

    function visibleProjects() {
      return projectSections.filter(function (sec) { return !sec.hidden; });
    }

    function keepSidebarItemVisible(item) {
      if (!item || !libList) return;
      var group = item.closest('.lib-group');
      if (group && group.classList.contains('is-collapsed')) return;
      var listRect = libList.getBoundingClientRect();
      var itemRect = item.getBoundingClientRect();
      if (!listRect.height || !itemRect.height) return;
      if (itemRect.top < listRect.top + 8) {
        libList.scrollTop += itemRect.top - listRect.top - 8;
      } else if (itemRect.bottom > listRect.bottom - 8) {
        libList.scrollTop += itemRect.bottom - listRect.bottom + 8;
      }
    }

    function setActiveProject(pid, syncRailScroll) {
      if (!pid || !itemById[pid]) return;
      state.activeId = pid;

      libItems.forEach(function (item) {
        item.classList.toggle('is-active', item.dataset.project === pid);
      });

      var activeItem = itemById[pid];
      if (syncRailScroll) {
        keepSidebarItemVisible(activeItem);
      }

      if (mobileActiveNum) mobileActiveNum.textContent = activeItem.dataset.num || '';
      if (mobileActiveTitle) mobileActiveTitle.textContent = activeItem.dataset.title || '';
      if (appWinCurrent) {
        appWinCurrent.textContent = (activeItem.dataset.num ? activeItem.dataset.num + ' ' : '') + (activeItem.dataset.title || '');
      }

      updateMobileStepButtons();
    }

    function updateMobileStepButtons() {
      if (!mobilePrevBtn || !mobileNextBtn) return;
      var vis = visibleProjects();
      var idx = vis.findIndex(function (sec) { return sec.id === state.activeId; });
      mobilePrevBtn.disabled = idx <= 0;
      mobileNextBtn.disabled = idx < 0 || idx >= vis.length - 1;
    }

    function openDrawer() {
      sidebar.classList.add('is-open');
      if (backdrop) backdrop.hidden = false;
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      sidebar.classList.remove('is-open');
      if (backdrop) backdrop.hidden = true;
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    }

    function applyFilterAndSearch(scrollToFirstMatch) {
      var q = state.query.trim().toLowerCase();
      var cat = state.filter;
      var visibleIds = {};
      var visibleCount = 0;

      libItems.forEach(function (item) {
        var matchCat = cat === 'all' || item.dataset.category === cat;
        var haystack = (item.dataset.search || '').toLowerCase();
        var matchQuery = !q || haystack.indexOf(q) !== -1;
        var show = matchCat && matchQuery;
        item.hidden = !show;
        if (show) {
          visibleIds[item.dataset.project] = true;
          visibleCount += 1;
        }
      });

      // Show/hide groups & update visible group counts
      groupEls.forEach(function (grp) {
        var grpItems = Array.prototype.slice.call(grp.querySelectorAll('.lib-item'));
        var count = grpItems.filter(function (it) { return !it.hidden; }).length;
        grp.hidden = count === 0;
        var cntBadge = grp.querySelector('.lib-group-count');
        if (cntBadge) cntBadge.textContent = String(count);
        if (q || cat !== 'all') {
          grp.classList.remove('is-collapsed');
        }
      });

      // Sync project sections visibility & pause videos inside newly hidden projects
      projectSections.forEach(function (sec) {
        var show = !!visibleIds[sec.id];
        sec.hidden = !show;
        if (!show) {
          sec.querySelectorAll('video').forEach(pauseClipFn);
        }
      });

      if (matchCountEl) {
        matchCountEl.textContent = visibleCount + ' / ' + projectSections.length;
      }
      if (appWinStatus) {
        appWinStatus.textContent = visibleCount === projectSections.length
          ? projectSections.length + ' Projects'
          : visibleCount + ' / ' + projectSections.length + ' Projects';
      }

      if (searchClear) {
        searchClear.hidden = !state.query;
      }

      var isFiltered = cat !== 'all' || !!q;
      if (filterBanner && filterText) {
        filterBanner.hidden = !isFiltered;
        if (isFiltered) {
          var parts = [];
          if (cat !== 'all') parts.push(cat.toUpperCase());
          if (q) parts.push('"' + state.query.trim() + '"');
          filterText.textContent = '필터 적용 중 (' + parts.join(' · ') + ') — ' + visibleCount + '개 표시';
        }
      }

      if (emptyState) {
        emptyState.hidden = visibleCount > 0;
      }

      if (visibleCount > 0) {
        if (!visibleIds[state.activeId]) {
          var firstVis = visibleProjects()[0];
          if (firstVis) {
            setActiveProject(firstVis.id, false);
            if (scrollToFirstMatch) {
              scrollToProject(firstVis);
            }
          }
        } else {
          updateMobileStepButtons();
        }
      } else {
        updateMobileStepButtons();
      }
      syncScrollUIFn();
    }

    function resetFilters() {
      state.filter = 'all';
      state.query = '';
      if (searchInput) searchInput.value = '';
      filterTabs.forEach(function (tab) {
        var active = tab.dataset.filter === 'all';
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      applyFilterAndSearch(false);
    }

    // Filter tabs
    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        state.filter = tab.dataset.filter || 'all';
        filterTabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        applyFilterAndSearch(true);
      });
    });

    // Search box
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.query = searchInput.value;
        applyFilterAndSearch(false);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', function () {
        state.query = '';
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        applyFilterAndSearch(false);
      });
    }

    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetFilters);

    // Collapsible group headers
    groupEls.forEach(function (grp) {
      var header = grp.querySelector('.lib-group-header');
      if (!header) return;
      header.addEventListener('click', function () {
        var collapsed = grp.classList.toggle('is-collapsed');
        header.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      });
    });

    // Sidebar item click
    libItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        var pid = item.dataset.project;
        setActiveProject(pid, false);
        closeDrawer();
        var target = document.getElementById(pid);
        if (target) {
          e.preventDefault();
          scrollToProject(target);
        }
      });
    });

    // Mobile drawer controls
    if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) closeDrawer();
    });

    if (mobilePrevBtn) {
      mobilePrevBtn.addEventListener('click', function () {
        var vis = visibleProjects();
        var idx = vis.findIndex(function (sec) { return sec.id === state.activeId; });
        if (idx > 0) {
          setActiveProject(vis[idx - 1].id, true);
          scrollToProject(vis[idx - 1]);
        }
      });
    }

    if (mobileNextBtn) {
      mobileNextBtn.addEventListener('click', function () {
        var vis = visibleProjects();
        var idx = vis.findIndex(function (sec) { return sec.id === state.activeId; });
        if (idx >= 0 && idx < vis.length - 1) {
          setActiveProject(vis[idx + 1].id, true);
          scrollToProject(vis[idx + 1]);
        }
      });
    }

    // Handle #work links so app window centers cleanly on desktop
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href="#work"]');
      if (!link || !isWindowBoxMode()) return;
      e.preventDefault();
      resetWheelQueue();
      window.scrollTo({ top: getLockScrollY(), behavior: 'smooth' });
    });

    // Handle internal links pointing to a project (#p-...) when filtered out
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#p-"]');
      if (!link || link.classList.contains('lib-item')) return;
      var pid = link.getAttribute('href').slice(1);
      var target = document.getElementById(pid);
      if (!target) return;
      if (target.hidden) {
        resetFilters();
      }
      e.preventDefault();
      setActiveProject(pid, true);
      scrollToProject(target);
    });

    // Unified wheel handoff: outer page -> centered app window inner scroll -> outer footer (and reverse)
    function consumeScrollDelta(delta) {
      if (!delta) return;
      var lockY = getLockScrollY();
      var winY = window.scrollY || window.pageYOffset || 0;
      var maxWinY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var maxMainY = Math.max(0, libraryMain.scrollHeight - libraryMain.clientHeight);
      var mainY = libraryMain.scrollTop;
      var EPS = 2;

      if (delta > 0) {
        var rem = delta;
        if (winY < lockY - EPS) {
          var toLock = lockY - winY;
          if (rem <= toLock) {
            window.scrollTo({ top: winY + rem, behavior: 'instant' });
            return;
          }
          window.scrollTo({ top: lockY, behavior: 'instant' });
          winY = lockY;
          rem -= toLock;
        }

        if (Math.abs(winY - lockY) <= 24 && mainY < maxMainY - EPS) {
          if (Math.abs(winY - lockY) > 0.5) {
            window.scrollTo({ top: lockY, behavior: 'instant' });
            winY = lockY;
          }
          var toMainEnd = maxMainY - mainY;
          if (rem <= toMainEnd) {
            libraryMain.scrollTop = mainY + rem;
            return;
          }
          libraryMain.scrollTop = maxMainY;
          rem -= toMainEnd;
        }

        if (rem > 0) {
          window.scrollTo({ top: Math.min(maxWinY, winY + rem), behavior: 'instant' });
        }
      } else {
        var remUp = -delta;
        if (winY > lockY + EPS) {
          var toLockUp = winY - lockY;
          if (remUp <= toLockUp) {
            window.scrollTo({ top: winY - remUp, behavior: 'instant' });
            return;
          }
          window.scrollTo({ top: lockY, behavior: 'instant' });
          winY = lockY;
          remUp -= toLockUp;
        }

        if (Math.abs(winY - lockY) <= 24 && mainY > EPS) {
          if (Math.abs(winY - lockY) > 0.5) {
            window.scrollTo({ top: lockY, behavior: 'instant' });
            winY = lockY;
          }
          if (remUp <= mainY) {
            libraryMain.scrollTop = mainY - remUp;
            return;
          }
          libraryMain.scrollTop = 0;
          remUp -= mainY;
        }

        if (remUp > 0) {
          window.scrollTo({ top: Math.max(0, winY - remUp), behavior: 'instant' });
        }
      }
    }

    function stepWheel(now) {
      wheelRaf = 0;
      if (!isWindowBoxMode()) {
        resetWheelQueue();
        return;
      }

      var dt = lastWheelTick ? Math.min(34, Math.max(6, now - lastWheelTick)) : 16;
      lastWheelTick = now;

      var step;
      if (Math.abs(wheelQueue) < 1.2) {
        step = wheelQueue;
        wheelQueue = 0;
      } else {
        var factor = 1 - Math.pow(0.66, dt / 16);
        step = wheelQueue * factor;
        wheelQueue -= step;
      }

      consumeScrollDelta(step);

      if (Math.abs(wheelQueue) >= 0.25) {
        wheelRaf = window.requestAnimationFrame(stepWheel);
      } else {
        wheelQueue = 0;
        lastWheelTick = 0;
      }
    }

    function enqueueScrollDelta(dy) {
      if (!dy) return;
      wheelQueue = Math.max(-1800, Math.min(1800, wheelQueue + dy));
      if (!wheelRaf) {
        lastWheelTick = 0;
        wheelRaf = window.requestAnimationFrame(stepWheel);
      }
    }

    window.addEventListener(
      'wheel',
      function (e) {
        if (!isWindowBoxMode()) return;
        if (e.ctrlKey || e.metaKey || e.defaultPrevented) return;
        var lightbox = document.getElementById('media-lightbox');
        if (lightbox && !lightbox.hidden) return;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

        var dy = e.deltaY;
        if (e.deltaMode === 1) dy *= 36;
        else if (e.deltaMode === 2) dy *= window.innerHeight * 0.85;
        if (!dy) return;

        var inLibList = e.target && e.target.closest && e.target.closest('#lib-list');
        if (inLibList) {
          var libMax = inLibList.scrollHeight - inLibList.clientHeight;
          if ((dy > 0 && inLibList.scrollTop < libMax - 1) || (dy < 0 && inLibList.scrollTop > 1)) {
            return;
          }
        }

        e.preventDefault();
        enqueueScrollDelta(dy);
      },
      { passive: false }
    );

    window.addEventListener('keydown', function (e) {
      if (!isWindowBoxMode()) return;
      if (e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented) return;
      var lightbox = document.getElementById('media-lightbox');
      if (lightbox && !lightbox.hidden) return;

      var active = document.activeElement;
      if (active) {
        var tag = active.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable) return;
        if ((e.code === 'Space' || e.key === ' ') && (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY')) return;
      }

      var pageStep = Math.round(Math.min(libraryMain.clientHeight, window.innerHeight) * 0.85);
      var dy = 0;
      if (e.key === 'PageDown') {
        dy = pageStep;
      } else if (e.key === 'PageUp') {
        dy = -pageStep;
      } else if (e.code === 'Space' || e.key === ' ') {
        dy = e.shiftKey ? -pageStep : pageStep;
      }
      if (!dy) return;

      e.preventDefault();
      enqueueScrollDelta(dy);
    });

    // ScrollSpy: highlight whichever project crosses top reading trigger line
    var spyScheduled = false;
    function updateScrollSpy() {
      spyScheduled = false;
      var vis = visibleProjects();
      if (!vis.length) return;

      var triggerY;
      if (isWindowBoxMode()) {
        var mainRect = libraryMain.getBoundingClientRect();
        triggerY = mainRect.top + Math.min(180, mainRect.height * 0.25);
      } else {
        var navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 56;
        triggerY = navH + Math.min(220, window.innerHeight * 0.28);
      }

      var chosen = vis[0];
      for (var i = 0; i < vis.length; i++) {
        var rect = vis[i].getBoundingClientRect();
        if (rect.top <= triggerY) {
          chosen = vis[i];
        } else {
          break;
        }
      }

      if (chosen && chosen.id !== state.activeId) {
        setActiveProject(chosen.id, true);
      }
    }

    function scheduleSpy() {
      if (spyScheduled) return;
      spyScheduled = true;
      window.requestAnimationFrame(updateScrollSpy);
    }

    window.addEventListener('scroll', scheduleSpy, { passive: true });
    libraryMain.addEventListener('scroll', scheduleSpy, { passive: true });

    window.addEventListener('resize', updateScrollSpy, { passive: true });
    updateScrollSpy();
  }

  /* -------------------------------------------------------
     6. 전역 스크롤 진행 바 · Top 복귀 버튼
     ------------------------------------------------------- */
  function initScrollUI() {
    var progressBar = document.getElementById('scroll-progress-bar');
    var topBtn = document.getElementById('scroll-top-btn');
    var libraryMain = document.getElementById('library-main');
    if (!progressBar && !topBtn) return;

    var rafPending = false;
    function sync() {
      rafPending = false;
      var y = window.scrollY || window.pageYOffset || 0;
      var maxWinScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

      var mainStyle = libraryMain ? getComputedStyle(libraryMain) : null;
      var inBox = mainStyle && (mainStyle.overflowY === 'auto' || mainStyle.overflowY === 'scroll') && libraryMain.clientHeight > 0;
      var mainY = inBox ? libraryMain.scrollTop : 0;
      var maxMainScroll = inBox ? Math.max(0, libraryMain.scrollHeight - libraryMain.clientHeight) : 0;

      var totalScroll = maxWinScroll + maxMainScroll;
      var ratio = totalScroll > 0 ? Math.min(1, Math.max(0, (y + mainY) / totalScroll)) : 0;

      if (progressBar) {
        progressBar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      }
      if (topBtn) {
        var visible = y > 420 || mainY > 120;
        topBtn.classList.toggle('is-visible', visible);
        topBtn.setAttribute('aria-hidden', visible ? 'false' : 'true');
      }
    }

    function scheduleSync() {
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(sync);
    }

    syncScrollUIFn = scheduleSync;

    if (topBtn) {
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    window.addEventListener('scroll', scheduleSync, { passive: true });
    if (libraryMain) libraryMain.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });
    sync();
  }
})();
