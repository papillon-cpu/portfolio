/* МЕРИДИАН — hero: cover-пейджер (механика как в ILCATO) + mouse-параллакс глубинных слоёв */
(function () {
  'use strict';

  /* iOS Safari: пиксель-лок высоты hero. Viewport-юниты репейнтятся при сворачивании
     адресбара во время скролла → дёргания. Re-lock ТОЛЬКО на orientationchange. */
  function lockVH() {
    var h = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
    if (h) document.documentElement.style.setProperty('--lockvh', h + 'px');
  }
  lockVH();
  window.addEventListener('orientationchange', function () { setTimeout(lockVH, 300); });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    var sec = document.querySelector('.hero');
    var heroEl = sec && sec.querySelector('[data-hero-swiper]');
    if (!heroEl || !window.Swiper) return;

    var bars = Array.prototype.slice.call(sec.querySelectorAll('.hbar'));
    var curEl = sec.querySelector('[data-hero-cur]');

    function updateUI(sw) {
      var real = sw.realIndex || 0;
      if (curEl) curEl.textContent = ('0' + (real + 1)).slice(-2);
      bars.forEach(function (b, idx) {
        b.classList.toggle('is-active', idx === real);
        var fill = b.querySelector('b');
        if (fill) fill.style.width = (idx < real || (reduce && idx === real)) ? '100%' : '0%';
      });
    }

    /* слой названий мест: свой Swiper, летит синхронно с основным через Controller */
    var titlesEl = sec.querySelector('[data-title-swiper]');
    var titles = titlesEl ? new Swiper(titlesEl, {
      speed: 1100,
      loop: true,
      allowTouchMove: false,
      slidesPerView: 1
    }) : null;

    var hero = new Swiper(heroEl, {
      speed: 1100,
      loop: true,
      parallax: true,
      effect: 'slide',
      grabCursor: true,
      autoplay: reduce ? false : { delay: 7000, disableOnInteraction: false },
      keyboard: { enabled: true },
      navigation: {
        nextEl: sec.querySelector('[data-hero-next]'),
        prevEl: sec.querySelector('[data-hero-prev]')
      },
      controller: titles ? { control: titles } : undefined,
      on: {
        init: function () { updateUI(this); },
        slideChange: function () { updateUI(this); },
        autoplayTimeLeft: function (s, time, progress) {
          var real = this.realIndex || 0;
          var fill = bars[real] && bars[real].querySelector('b');
          if (fill) fill.style.width = (100 * (1 - progress)) + '%';
        }
      }
    });

    bars.forEach(function (seg) {
      seg.addEventListener('click', function () {
        var idx = +seg.getAttribute('data-hero-goto');
        if (hero.slideToLoop) hero.slideToLoop(idx);
      });
    });

    /* ---------- mouse-параллакс: слои с data-depth двигаются с разной скоростью.
       Только десктоп с точным указателем; transform пишем на ВЛОЖЕННЫЙ элемент,
       внешний контролирует Swiper (data-swiper-parallax) — конфликтов нет. ---------- */
    var fine = window.matchMedia('(pointer: fine) and (min-width: 901px)').matches;
    if (fine && !reduce) {
      var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;   /* -0.5 … 0.5 */
        ty = (e.clientY - r.top) / r.height - 0.5;
        if (!running) { running = true; requestAnimationFrame(tick); }
      }, { passive: true });

      sec.addEventListener('pointerleave', function () {
        tx = 0; ty = 0;
        if (!running) { running = true; requestAnimationFrame(tick); }
      });

      function tick() {
        cx += (tx - cx) * 0.07;
        cy += (ty - cy) * 0.07;
        var layers = heroEl.querySelectorAll('.swiper-slide-active [data-depth]');
        for (var i = 0; i < layers.length; i++) {
          var d = +layers[i].getAttribute('data-depth') || 0;
          layers[i].style.transform = 'translate3d(' + (-cx * d).toFixed(2) + 'px,' + (-cy * d).toFixed(2) + 'px,0)';
        }
        if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
          requestAnimationFrame(tick);
        } else {
          running = false;
        }
      }
    }

    /* ---------- появление секций при скролле ---------- */
    var revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* ---------- шапка: плотный фон после hero (rAF + passive) ---------- */
    var header = document.querySelector('.site-header');
    var hdrTicking = false;
    function updateHeader() {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', function () {
      if (!hdrTicking) {
        requestAnimationFrame(function () { updateHeader(); hdrTicking = false; });
        hdrTicking = true;
      }
    }, { passive: true });
    updateHeader();

    /* ---------- плавный скролл ТОЛЬКО по клику на якорь (не глобально) ---------- */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });

    /* ---------- форма: демо-отправка ---------- */
    var form = document.querySelector('[data-contact-form]');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        form.querySelectorAll('.field, .contact__submit, .contact__consent').forEach(function (el) {
          el.style.display = 'none';
        });
        var done = form.querySelector('.contact__done');
        if (done) done.hidden = false;
      });
    }

    /* ---------- модалка маршрута: клик по карточке / кнопке hero ---------- */
    var ROUTES = window.MERIDIAN_ROUTES || {};

    var modal = document.querySelector('[data-route-modal]');
    if (modal) {
      var rm = {
        bg: modal.querySelector('[data-rm-bg]'),
        swiperEl: modal.querySelector('[data-rm-swiper]'),
        track: modal.querySelector('[data-rm-track]'),
        dots: modal.querySelector('[data-rm-dots]'),
        prev: modal.querySelector('[data-rm-prev]'),
        next: modal.querySelector('[data-rm-next]'),
        tag: modal.querySelector('[data-rm-tag]'),
        title: modal.querySelector('[data-rm-title]'),
        meta: modal.querySelector('[data-rm-meta]'),
        lead: modal.querySelector('[data-rm-lead]'),
        days: modal.querySelector('[data-rm-days]'),
        incl: modal.querySelector('[data-rm-incl]'),
        price: modal.querySelector('[data-rm-price]')
      };
      var lastFocus = null;
      var galSwiper = null;

      function fillList(el, arr) {
        el.innerHTML = arr.map(function (t) { return '<li>' + t + '</li>'; }).join('');
      }
      /* галерея места: главный кадр (2К) + 3 фотографии из assets/img/routes */
      function galleryFor(key) {
        var main = (ROUTES[key] && ROUTES[key].img) || '';
        return [main, 'assets/img/gal-' + key + '-1.jpg', 'assets/img/gal-' + key + '-2.jpg', 'assets/img/gal-' + key + '-3.jpg'];
      }
      function buildGallery(imgs) {
        rm.track.innerHTML = imgs.map(function (src) {
          return '<div class="swiper-slide"><img src="' + src + '" alt="" loading="lazy"></div>';
        }).join('');
        rm.dots.innerHTML = imgs.map(function (_, i) {
          return '<button class="gdot' + (i === 0 ? ' on' : '') + '" type="button" data-gi="' + i + '" aria-label="Фото ' + (i + 1) + '"></button>';
        }).join('');
        if (galSwiper) { galSwiper.destroy(true, true); galSwiper = null; }
        galSwiper = new Swiper(rm.swiperEl, {
          effect: 'fade', fadeEffect: { crossFade: true },
          speed: 900, loop: imgs.length > 1,
          autoplay: reduce ? false : { delay: 3800, disableOnInteraction: false },
          navigation: { nextEl: rm.next, prevEl: rm.prev },
          on: {
            slideChange: function () {
              var ri = this.realIndex || 0;
              rm.dots.querySelectorAll('.gdot').forEach(function (d, i) { d.classList.toggle('on', i === ri); });
            }
          }
        });
        rm.dots.querySelectorAll('.gdot').forEach(function (d) {
          d.addEventListener('click', function () {
            var i = +d.getAttribute('data-gi');
            if (galSwiper && galSwiper.slideToLoop) galSwiper.slideToLoop(i);
          });
        });
      }
      function openRoute(key) {
        var r = ROUTES[key];
        if (!r) return;
        rm.tag.textContent = r.tag;
        rm.title.textContent = r.title;
        rm.meta.textContent = r.meta;
        rm.lead.textContent = r.lead;
        rm.price.textContent = r.price;
        fillList(rm.days, r.days);
        fillList(rm.incl, r.incl);
        rm.bg.style.backgroundImage = 'url("' + r.img + '")';
        lastFocus = document.activeElement;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        var card = modal.querySelector('.rmodal__card');
        if (card) card.scrollTop = 0;
        buildGallery(galleryFor(key));
        var x = modal.querySelector('[data-route-close]');
        if (x) x.focus();
      }
      function closeRoute() {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
        if (galSwiper) { galSwiper.destroy(true, true); galSwiper = null; }
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }

      document.querySelectorAll('.trip[data-route]').forEach(function (card) {
        card.addEventListener('click', function () { openRoute(card.getAttribute('data-route')); });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRoute(card.getAttribute('data-route')); }
        });
      });
      modal.querySelectorAll('[data-route-close]').forEach(function (b) {
        b.addEventListener('click', closeRoute);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.hidden) closeRoute();
      });
      var book = modal.querySelector('[data-route-book]');
      if (book) book.addEventListener('click', closeRoute); /* закрыть; якорный обработчик сам проскроллит к форме */

      /* hero-кнопка «Узнать подробнее о маршруте» → маршрут текущего слайда, иначе к списку */
      var moreBtn = document.querySelector('[data-hero-more]');
      var HERO2ROUTE = window.MERIDIAN_HERO2ROUTE || [];
      if (moreBtn) {
        moreBtn.addEventListener('click', function () {
          var idx = (hero && typeof hero.realIndex === 'number') ? hero.realIndex : 0;
          var key = HERO2ROUTE[idx];
          if (key && ROUTES[key]) { openRoute(key); }
          else {
            var t = document.querySelector('#trips');
            if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          }
        });
      }
    }
  });
})();
