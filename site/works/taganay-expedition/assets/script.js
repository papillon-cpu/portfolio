// ТРОПА ТАГАНАЯ — interactions

(function () {
  'use strict';

  /* ---------- nav: solid on scroll ---------- */
  var nav = document.getElementById('nav');
  var solid = false;

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        var y = window.scrollY || document.documentElement.scrollTop;
        var next = y > 40;
        if (next !== solid) {
          solid = next;
          nav.classList.toggle('nav--solid', solid);
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('nav--open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });

  /* ---------- smooth anchors (точечно, не глобально) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      nav.classList.remove('nav--open');
      burger.setAttribute('aria-expanded', 'false');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- reveal on scroll ---------- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) { revealIO.observe(el); });

  /* ---------- iOS: pixel-lock full-height video bands ----------
     On iOS Safari the address bar collapse during scroll resizes any
     viewport-height element → the background video visibly "compresses"/zooms.
     Fix: lock each band's height to a pixel constant (largest viewport) so it
     never reflows. Re-lock only on orientationchange, NOT on resize (resize
     fires on every address-bar move → brings the jerk back). Mobile only —
     desktop keeps the CSS svh heights. */
  var isMobile = window.matchMedia('(max-width: 960px)').matches || ('ontouchstart' in window);
  if (isMobile) {
    var lockBands = [
      { el: document.querySelector('.hero'), f: 1 },
      { el: document.querySelector('.camp'), f: 1 },
      { el: document.querySelector('.vista'), f: 0.82 }
    ];
    var lockHeights = function () {
      var vh = Math.max(
        window.innerHeight,
        document.documentElement.clientHeight,
        (screen.height || 0) * 0.92
      );
      lockBands.forEach(function (o) {
        if (!o.el) return;
        o.el.style.setProperty('--locked-h', Math.round(vh * o.f) + 'px');
        o.el.classList.add('is-locked');
      });
    };
    lockHeights();
    window.addEventListener('orientationchange', function () {
      setTimeout(lockHeights, 300);
    });
  }

  /* ---------- lazy videos: грузим/играем только у вьюпорта (camp + reels) ---------- */
  var lazyVideos = document.querySelectorAll('video[preload="none"]');
  if (lazyVideos.length) {
    var loadLazyVideo = function (video) {
      if (video.dataset.loaded) return;
      video.dataset.loaded = '1';
      video.querySelectorAll('source[data-src]').forEach(function (s) {
        s.src = s.getAttribute('data-src');
        s.removeAttribute('data-src');
      });
      video.load();
    };

    var lazyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          loadLazyVideo(video);
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        } else if (video.dataset.loaded && !video.paused) {
          video.pause();
        }
      });
    }, { rootMargin: '400px 0px' });

    lazyVideos.forEach(function (v) { lazyIO.observe(v); });
  }

  /* ---------- form (демо) ---------- */
  var form = document.getElementById('applyForm');
  var toast = document.getElementById('toast');
  var toastTimer = null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    form.querySelectorAll('input').forEach(function (input) {
      var empty = !input.value.trim();
      input.classList.toggle('is-error', empty);
      if (empty) ok = false;
    });
    if (!ok) return;

    form.reset();
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-shown');
    }, 4000);
  });

  form.querySelectorAll('input').forEach(function (input) {
    input.addEventListener('input', function () {
      input.classList.remove('is-error');
    });
  });
})();
