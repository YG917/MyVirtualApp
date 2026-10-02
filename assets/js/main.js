/* Newshadow 介绍页交互，无依赖。
   没有脚本时，所有内容与图形都直接可见。 */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var wideQuery = window.matchMedia ? window.matchMedia('(min-width: 960px)') : null;
  function reducedMotion() { return !!(motionQuery && motionQuery.matches); }
  function isWide() { return !wideQuery || wideQuery.matches; }
  function toArray(list) { return Array.prototype.slice.call(list); }
  function onChange(query, fn) {
    if (!query) return;
    if (query.addEventListener) query.addEventListener('change', fn);
    else if (query.addListener) query.addListener(fn);
  }

  /* ---------- 顶栏与目录 ---------- */
  var topbar = document.querySelector('.topbar');
  var toc = document.getElementById('toc');
  var tocBtn = document.querySelector('.toc-btn');

  function tocOpen() { return !!tocBtn && tocBtn.getAttribute('aria-expanded') === 'true'; }
  function setToc(open, returnFocus) {
    if (!toc || !tocBtn) return;
    toc.classList.toggle('is-open', open);
    tocBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open && returnFocus) tocBtn.focus();
  }
  if (toc && tocBtn) {
    tocBtn.addEventListener('click', function () { setToc(!tocOpen()); });
    toc.addEventListener('click', function (e) { if (e.target.closest('a')) setToc(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tocOpen()) setToc(false, true);
    });
    document.addEventListener('click', function (e) {
      if (tocOpen() && !e.target.closest('.topbar')) setToc(false);
    });
    document.addEventListener('focusin', function (e) {
      if (tocOpen() && !e.target.closest('.topbar')) setToc(false);
    });
  }

  /* 当前章节高亮 */
  var tocLinks = toc ? toArray(toc.querySelectorAll('a[href^="#"]')) : [];
  if ('IntersectionObserver' in window && tocLinks.length) {
    var watched = tocLinks.map(function (a) { return document.getElementById(a.hash.slice(1)); }).filter(Boolean);
    var hero = document.getElementById('top');
    if (hero) watched.push(hero);
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (a) {
          if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    watched.forEach(function (el) { sectionObserver.observe(el); });
  }

  /* ---------- 图形描线与段落显现 ---------- */
  var reveals = toArray(document.querySelectorAll('.reveal'));
  var figs = toArray(document.querySelectorAll('.fig'));

  function playFig(fig) {
    fig.classList.add('is-in');
    window.setTimeout(function () { fig.classList.add('is-done'); }, reducedMotion() ? 0 : 3400);
  }
  function showEverything() {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
    figs.forEach(function (f) { f.classList.add('is-in', 'is-done'); });
  }

  if (reducedMotion() || !('IntersectionObserver' in window)) {
    showEverything();
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        revealObserver.unobserve(el);
        if (el.classList.contains('fig')) {
          // 先让未描线的状态绘出一帧，过渡才会发生
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () { playFig(el); });
          });
        } else {
          el.classList.add('is-in');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
    reveals.concat(figs).forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 三层：滚动到哪一段，图中就点亮哪条轨道 ---------- */
  var storySvg = document.querySelector('.fig-story .fig-svg');
  var steps = toArray(document.querySelectorAll('.step[data-step]'));

  function setLayer(layer) {
    if (storySvg) storySvg.setAttribute('data-active', layer);
    steps.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-step') === layer); });
  }

  if (steps.length && 'IntersectionObserver' in window) {
    var stepObserver = new IntersectionObserver(function (entries) {
      if (!isWide()) return;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setLayer(entry.target.getAttribute('data-step'));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { stepObserver.observe(s); });
  }
  onChange(wideQuery, function () {
    if (!isWide()) { setLayer('all'); return; }
    // 回到宽屏时重新观察，让图立即与视口中央的那一段同步
    if (stepObserver) steps.forEach(function (s) { stepObserver.unobserve(s); stepObserver.observe(s); });
  });

  // 指针用户可以直接点图里的轨道，跳到对应说明
  if (storySvg) {
    storySvg.addEventListener('click', function (e) {
      var track = e.target.closest('.trk');
      if (!track) return;
      var layer = track.getAttribute('data-layer');
      var step = document.getElementById('step-' + layer);
      if (isWide()) setLayer(layer);
      if (step) step.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: isWide() ? 'center' : 'start' });
    });
  }

  /* ---------- 层间视差 ---------- */
  var depthEls = toArray(document.querySelectorAll('[data-depth]'));
  var inkEls = toArray(document.querySelectorAll('.sec-ink, .foot'));
  var ticking = false;

  function resetDepth() { depthEls.forEach(function (el) { el.style.transform = ''; }); }
  function update() {
    ticking = false;
    var vh = window.innerHeight;

    if (topbar) topbar.classList.toggle('is-scrolled', window.scrollY > 4);

    // 宽屏右侧目录经过深色段落时换成反白
    if (toc) {
      var mid = vh / 2;
      var onInk = inkEls.some(function (el) {
        var r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      });
      toc.classList.toggle('on-ink', onInk);
    }

    if (reducedMotion()) { resetDepth(); return; }
    depthEls.forEach(function (el) {
      // 以没有位移的父元素为参照，避免位移影响测量
      var host = el.parentElement;
      if (!host) return;
      var r = host.getBoundingClientRect();
      if (r.bottom < -240 || r.top > vh + 240) return;
      var depth = parseFloat(el.getAttribute('data-depth')) || 0;
      var y = Math.max(-24, Math.min(24, ((r.top + r.height / 2) - vh / 2) * depth));
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    });
  }
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();

  onChange(motionQuery, function () {
    if (reducedMotion()) { showEverything(); resetDepth(); }
    else requestUpdate();
  });

  /* ---------- 年份 ---------- */
  toArray(document.querySelectorAll('[data-year]')).forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
