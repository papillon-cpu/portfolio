/* ============ HEADER: solid on scroll (rAF + passive) ============ */
(function () {
  const header = document.getElementById('header');
  let ticking = false;

  function update() {
    header.classList.toggle('scrolled', window.scrollY > 40);
    ticking = false;
  }
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
})();

/* ============ MOBILE NAV ============ */
(function () {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const header = document.getElementById('header');
  if (!burger) return;

  function close() {
    burger.classList.remove('open');
    nav.classList.remove('mobile-open');
    header.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
  }
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('mobile-open');
    burger.classList.toggle('open', open);
    header.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
})();

/* ============ SMOOTH ANCHOR SCROLL (point-wise, no global CSS smooth) ============ */
(function () {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();

/* ============ REVEAL ON SCROLL ============ */
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach((i) => i.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  items.forEach((i) => io.observe(i));
})();

/* ============ COUNT-UP STATS ============ */
(function () {
  const nums = document.querySelectorAll('.stat__num[data-count]');
  if (!nums.length) return;

  function animate(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val.toLocaleString('ru-RU') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  nums.forEach((n) => io.observe(n));
})();

/* ============ PHONE MASK + FORM ============ */
(function () {
  const phone = document.getElementById('phone');
  if (phone) {
    phone.addEventListener('input', () => {
      let v = phone.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      phone.value = out;
    });
  }

  const form = document.getElementById('bookingForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const tel = form.phone.value.replace(/\D/g, '');
    if (!name || tel.length < 11) {
      form.querySelector('input:invalid, input[required]').focus();
      if (!name) { form.name.focus(); return; }
      if (tel.length < 11) { form.phone.focus(); return; }
      return;
    }
    // Демо: здесь была бы отправка на сервер / в Telegram
    const ok = document.getElementById('formOk');
    form.querySelector('button[type="submit"]').style.display = 'none';
    ok.hidden = false;
    form.reset();
  });
})();

/* ============ HERO VIDEO: ensure muted autoplay keeps running ============ */
(function () {
  const v = document.getElementById('heroVideo');
  if (!v) return;
  const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  v.addEventListener('canplay', play, { once: true });
  play();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
})();

/* ============ iOS: pixel-lock hero height (address-bar collapse) ============
   On iOS Safari the address bar collapse during scroll resizes any
   viewport-height element → the hero video visibly "compresses"/zooms.
   Fix: lock the hero to a pixel constant (largest viewport) so it never
   reflows. Re-lock only on orientationchange, NOT on resize. Mobile only. */
(function () {
  const isMobile = window.matchMedia('(max-width: 960px)').matches || ('ontouchstart' in window);
  if (!isMobile) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const lock = () => {
    const h = Math.max(
      window.innerHeight,
      document.documentElement.clientHeight,
      (screen.height || 0) * 0.92
    );
    hero.style.setProperty('--locked-h', Math.round(h) + 'px');
    hero.classList.add('is-locked');
  };
  lock();
  window.addEventListener('orientationchange', () => setTimeout(lock, 300));
})();
