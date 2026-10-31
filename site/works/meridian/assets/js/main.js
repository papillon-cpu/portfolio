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
    var ROUTES = {
      matterhorn: {
        img: 'assets/img/hero/desk-ch-matterhorn.jpg', tag: 'Церматт',
        title: 'Тропа пяти озёр вокруг Маттерхорна',
        meta: '6 дней · июль 2027 · группа до 10 · сложность средняя', price: 'от 145 000 ₽',
        lead: 'Классический маршрут «5-Seenweg» над Церматтом: пять горных озёр, в четырёх из которых отражается Маттерхорн. База — в самой деревне, каждый день выходим на балконные тропы с видом на 38 четырёхтысячников Вале.',
        days: [
          'Прилёт в Церматт, заселение, разминочная прогулка вдоль Маттер-Виспы',
          'Горнерграт: подъём на зубчатке до 3089 м, спуск к Ротенбодену и озеру Риффельзее',
          'Тропа пяти озёр: Штеллизее — Гриндьизее — Грюнзее — Мосьезее — Лейзее',
          'Кляйн-Маттерхорн 3883 м: ледниковый рай и панорама на Монблан',
          'Резервный день на погоду или треккинг к хижине Хёрнли (2757 м)',
          'Свободное утро, трансфер до аэропорта'
        ],
        incl: ['6 ночей в горном отеле 3*', 'Все горные подъёмники по маршруту', 'Гид-фотограф на каждый день', 'Завтраки и 4 ужина', 'Трансферы внутри Швейцарии', 'Страховка для треккинга']
      },
      oeschinensee: {
        img: 'assets/img/hero/desk-ch-oeschinensee.jpg', tag: 'Кандерштег',
        title: 'Эшинензее: бирюзовые озёра Бернских Альп',
        meta: '5 дней · август 2026 · группа до 8 · сложность лёгкая', price: 'от 128 000 ₽',
        lead: 'Бирюзовое Эшинензее под трёхкилометровыми стенами Блюмлизальп — одно из красивейших озёр Альп. Спокойный маршрут с базой в Кандерштеге и радиальными выходами к озёрам, водопадам и панорамным перевалам.',
        days: [
          'Кандерштег, подъём по канатке, обход Эшинензее по берегу',
          'Панорамная тропа Хойбергли с видом на Блюмлизальп и ледник',
          'Перевал Гэмми и суровое высокогорное озеро Даубензее',
          'Водопады Кандерштега и висячие долины',
          'Свободное утро, трансфер, вылет'
        ],
        incl: ['4 ночи в шале в Кандерштеге', 'Канатки и подъёмники', 'Гид-фотограф', 'Завтраки и 3 ужина', 'Трансферы внутри Швейцарии', 'Страховка для треккинга']
      },
      bachalpsee: {
        img: 'assets/img/hero/desk-ch-bachalpsee.jpg', tag: 'Гриндельвальд',
        title: 'First и Бахальпзее: тропа под Айгером',
        meta: '6 дней · сентябрь 2026 · группа до 10 · сложность средняя', price: 'от 138 000 ₽',
        lead: 'Канатка на First и балконная тропа к зеркальному Бахальпзее, где в воде отражаются Шрекхорн и Финстераархорн. Всю дорогу над нами — легендарная северная стена Айгера.',
        days: [
          'Гриндельвальд, подъём на First 2168 м, тропа к Бахальпзее',
          'Faulhorn 2681 м — самый длинный балкон Оберланда, спуск к Баховзее',
          'Клайне-Шайдегг под стеной Айгера, тропа Эйгер-Трейл',
          'Ущелье Гletscherschlucht и висячие мосты Пфингстэгг',
          'Резервный день / выход к Бахальпзее на рассвете',
          'Свободное утро, трансфер, вылет'
        ],
        incl: ['5 ночей в отеле в Гриндельвальде', 'Все горные подъёмники', 'Гид-фотограф', 'Завтраки и 4 ужина', 'Трансферы внутри Швейцарии', 'Страховка для треккинга']
      },
      lauterbrunnen: {
        img: 'assets/img/hero/desk-ch-lauterbrunnen.jpg', tag: 'Лаутербруннен',
        title: 'Долина 72 водопадов: Венген и Мюррен',
        meta: '7 дней · июнь 2027 · группа до 10 · сложность средняя', price: 'от 152 000 ₽',
        lead: 'Долина Лаутербруннен с 72 водопадами вдохновила Толкина на Ривенделл. Живём в деревнях без машин — Венген и Мюррен — и ходим по тропам между водопадами Штауббах и подземным Труммельбахом.',
        days: [
          'Лаутербруннен, водопад Штауббах, подземный Труммельбах',
          'Венген: канатка и балконная тропа к Мэнлихен',
          'Мюррен и Северная тропа под стеной Юнгфрау',
          'Шильтхорн 2970 м — круговая панорама Айгер-Мёнх-Юнгфрау',
          'Гиммельвальд и тропа вдоль края долины',
          'Резервный день на погоду',
          'Свободное утро, трансфер, вылет'
        ],
        incl: ['6 ночей в деревнях Венген/Мюррен', 'Все канатки и зубчатки', 'Гид-фотограф', 'Завтраки и 5 ужинов', 'Трансферы внутри Швейцарии', 'Страховка для треккинга']
      },
      aletsch: {
        img: 'assets/img/hero/desk-ch-aletsch.jpg', tag: 'Вале',
        title: 'Вдоль Алечского ледника: самый длинный лёд Альп',
        meta: '6 дней · август 2027 · группа до 8 · сложность выше средней', price: 'от 168 000 ₽',
        lead: 'Алечский ледник — 23 км льда, объект Всемирного наследия ЮНЕСКО. Идём по панорамной кромке от Эггисхорна и Беттмерхорна и ночуем в деревнях Алечского плато над облаками.',
        days: [
          'Фиш, подъём на Эггисхорн 2926 м, первый вид на ледник',
          'Беттмерхорн — Бетмеральп, балкон над языком ледника',
          'Тропа Алечского леса — древние арвы над льдом',
          'Мэрьелензее — ледниковое озеро у самой кромки',
          'Резервный день / выход к слиянию ледников Konkordiaplatz',
          'Свободное утро, трансфер, вылет'
        ],
        incl: ['5 ночей на Алечском плато', 'Все горные подъёмники', 'Гид-фотограф', 'Завтраки и 4 ужина', 'Трансферы внутри Швейцарии', 'Страховка для высокогорного треккинга']
      },
      seealpsee: {
        img: 'assets/img/hero/desk-ch-seealpsee.jpg', tag: 'Аппенцелль',
        title: 'Альпштайн: Зеальпзее и хребет Эбенальп',
        meta: '5 дней · июль 2027 · группа до 10 · сложность средняя', price: 'от 122 000 ₽',
        lead: 'Изумрудное Зеальпзее в сердце массива Альпштайн, подъём к пещерной деревне Вильдкирхли и знаменитому горному дому Эшер, встроенному прямо в отвесную скалу.',
        days: [
          'Вассерауэн, тропа к озеру Зеальпзее',
          'Эбенальп 1644 м, пещера Вильдкирхли и дом Эшер в скале',
          'Гребневая тропа к Шефлеру с видом на всё плато Альпштайн',
          'Мегльисальп — горная сыроварня и альпийские луга',
          'Свободное утро, трансфер, вылет'
        ],
        incl: ['4 ночи в Аппенцелле', 'Канатки и подъёмники', 'Гид-фотограф', 'Завтраки и 3 ужина', 'Трансферы внутри Швейцарии', 'Страховка для треккинга']
      }
    };

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
        return [
          'assets/img/hero/desk-ch-' + key + '.jpg',
          'assets/img/routes/gal-' + key + '-1.jpg',
          'assets/img/routes/gal-' + key + '-2.jpg',
          'assets/img/routes/gal-' + key + '-3.jpg'
        ];
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
      var HERO2ROUTE = ['matterhorn', 'oeschinensee', 'bachalpsee', 'bachalpsee', 'matterhorn', 'lauterbrunnen', 'lauterbrunnen', 'seealpsee', 'aletsch', 'lauterbrunnen', null, null];
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
