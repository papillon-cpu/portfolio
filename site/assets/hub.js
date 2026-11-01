// Бегущие строки, фильтр работ и появление блоков при прокрутке.
(function () {
  // Бесшовный цикл: содержимое дублируется один раз, анимация сдвигает ровно на половину.
  document.querySelectorAll("[data-loop]").forEach(function (track) {
    Array.prototype.slice.call(track.children).forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  });

  // Переключатель темы: выбор запоминается в браузере
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme");
  function paintTheme() {
    var dark = root.getAttribute("data-theme") === "dark";
    if (!themeBtn) return;
    themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
    themeBtn.setAttribute("aria-label", dark ? "Включить светлую тему" : "Включить тёмную тему");
  }
  paintTheme();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      paintTheme();
    });
  }

  // Небо: время суток посетителя; для проверки можно открыть страницу с ?tod=night
  (function () {
    var hero = document.getElementById("hero");
    if (!hero) return;
    var q = /[?&]tod=(dawn|day|dusk|night)/.exec(location.search);
    var now = new Date(), hr = now.getHours() + now.getMinutes() / 60;
    var tod = hr >= 5 && hr < 8 ? "dawn" : hr >= 8 && hr < 18 ? "day" : hr >= 18 && hr < 21.5 ? "dusk" : "night";
    if (q) { tod = q[1]; hr = { dawn: 6.5, day: 13, dusk: 19.5, night: 1 }[tod]; }
    hero.setAttribute("data-tod", tod);
    // солнце идёт по дуге с 6 до 22 часов, луна ночью с 22 до 6
    var sunUp = hr >= 6 && hr < 22;
    var p = sunUp ? (hr - 6) / 16 : ((hr >= 22 ? hr - 22 : hr + 2) / 8);
    // светило обходит заголовок: держится по краям, середину пропускает
    hero.style.setProperty("--orb-x", (p < 0.5 ? 7 + p * 2 * 21 : 72 + (p - 0.5) * 2 * 21).toFixed(1));
    hero.style.setProperty("--orb-y", (52 - Math.sin(p * Math.PI) * 34).toFixed(1));
  })();

  // Главный экран: заголовок и подзаголовок печатаются по буквам, потом постепенно стираются
  (function () {
    var H = document.getElementById("tw-h"), S = document.getElementById("tw-s");
    if (!H || !S) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var pairs = [
      ["Сайты и боты, которые приводят клиентов.", "Веб-дизайн, лендинги, Telegram-боты, мини-приложения и автоматизации для малого бизнеса."],
      ["Сайт, который работает, пока вы заняты делом.", "Принимает заявки, отвечает клиентам и ничего не теряет."],
      ["Бот, который отвечает за секунды.", "Собирает контакты и передаёт заявку вам в Telegram."]
    ];
    var hFull = pairs[0][0], sFull = pairs[0][1];
    // высота резервируется по самой длинной паре, чтобы страница не прыгала
    function reserve() {
      H.style.minHeight = S.style.minHeight = "";
      var mh = 0, ms = 0;
      pairs.forEach(function (p) {
        H.textContent = p[0]; S.textContent = p[1];
        mh = Math.max(mh, H.offsetHeight); ms = Math.max(ms, S.offsetHeight);
      });
      H.style.minHeight = mh + "px"; S.style.minHeight = ms + "px";
    }
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    async function type(el, text, speed) {
      el.classList.add("tw-cursor");
      for (var i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await wait(speed + Math.random() * speed * 0.6); }
    }
    async function erase(el, text, speed) {
      el.classList.add("tw-cursor");
      for (var i = text.length - 1; i >= 0; i--) { el.textContent = text.slice(0, i); await wait(speed); }
    }
    async function run() {
      var n = 0;
      reserve(); window.addEventListener("resize", function () { var a = H.textContent, b = S.textContent; reserve(); H.textContent = a; S.textContent = b; });
      H.textContent = ""; S.textContent = "";
      await wait(500);
      for (;;) {
        var p = pairs[n % pairs.length];
        H.classList.add("tw-cursor"); S.classList.remove("tw-cursor");
        await type(H, p[0], 55);
        H.classList.remove("tw-cursor");
        await wait(250);
        await type(S, p[1], 22);
        S.classList.remove("tw-cursor");
        await wait(3200);
        await erase(S, p[1], 9);
        S.classList.remove("tw-cursor");
        await erase(H, p[0], 22);
        H.classList.remove("tw-cursor");
        await wait(500);
        n++;
      }
    }
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
  })();

  // Главный экран: сетка точек оживает от курсора или касания, а без них мерцает волной
  (function () {
    var cv = document.getElementById("dots"), hero = document.getElementById("hero");
    if (!cv || !hero || !cv.getContext) return;
    var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, step = 34, px = -999, py = -999, power = 0, visible = true;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function size() {
      var b = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = b.width; H = b.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      step = W < 600 ? 28 : 34;
    }
    function point(e) {
      var b = hero.getBoundingClientRect();
      px = e.clientX - b.left; py = e.clientY - b.top; power = 1;
    }
    hero.addEventListener("pointermove", point);
    hero.addEventListener("pointerdown", point);
    hero.addEventListener("pointerleave", function () { power = 0; });
    hero.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") power = 0; });
    var cur = 0;
    function draw(t) {
      requestAnimationFrame(draw);
      if (!visible) return;
      cur += (power - cur) * 0.12;
      ctx.clearRect(0, 0, W, H);
      var cols = Math.ceil(W / step) + 1, rows = Math.ceil(H / step) + 1, R = 150;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var x = c * step, y = r * step;
          var wave = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(c * 0.45 + r * 0.3 - t / 900);
          var a = 0.12 + wave * 0.16, rad = 1.1 + wave * 0.7, lime = 0;
          var dx = x - px, dy = y - py, d = Math.sqrt(dx * dx + dy * dy);
          if (cur > 0.01 && d < R) {
            var k = (1 - d / R) * cur;
            a += k * 0.6; rad += k * 3.2; lime = k;
            x += (dx / (d || 1)) * k * 9; y += (dy / (d || 1)) * k * 9;
          }
          ctx.fillStyle = lime > 0.05 ? "rgba(" + Math.round(255 - 29 * lime) + "," + Math.round(255 - 9 * lime) + "," + Math.round(255 - 145 * lime) + "," + Math.min(a, 0.95).toFixed(2) + ")" : "rgba(255,255,255," + a.toFixed(2) + ")";
          ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
        }
      }
    }
    size(); window.addEventListener("resize", size);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
    requestAnimationFrame(draw);
  })();

  // Карусель: работы на дуге, поворот следует за мышью или пальцем
  (function () {
    var ring = document.getElementById("ring"), spin = document.getElementById("spin");
    if (!ring || !spin) return;
    var cards = Array.prototype.slice.call(spin.children);
    var gap = 40, reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var target = 0, cur = 0, dragging = false, startX = 0, startT = 0, moved = 0, last = 0;
    function layout() {
      var w = spin.offsetWidth, r = (w / 2) / Math.tan(gap * Math.PI / 360) * 1.12;
      cards.forEach(function (c, i) {
        c.style.transform = "rotateY(" + ((i - (cards.length - 1) / 2) * gap) + "deg) translateZ(" + r + "px)";
      });
      spin.style.transform = "translateZ(" + (-r) + "px) rotateY(" + cur + "deg)";
      spin._r = r;
    }
    function clamp(v) { return Math.max(-45, Math.min(45, v)); }
    ring.addEventListener("pointermove", function (e) {
      if (dragging) { target = clamp(startT + (e.clientX - startX) * 0.18); if (Math.abs(e.clientX - startX) > 6) moved = 1; return; }
      if (e.pointerType === "mouse") { var b = ring.getBoundingClientRect(); target = clamp(-((e.clientX - b.left) / b.width - 0.5) * 90); }
    });
    ring.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse") return; dragging = true; moved = 0; startX = e.clientX; startT = target; ring.classList.add("is-drag"); });
    function end() { dragging = false; ring.classList.remove("is-drag"); }
    ring.addEventListener("pointerup", end); ring.addEventListener("pointercancel", end);
    ring.addEventListener("click", function (e) { if (moved) { e.preventDefault(); moved = 0; } }, true);
    function tick(t) {
      var idle = reduce ? 0 : Math.sin(t / 2600) * 6;
      var goal = target + idle;
      cur += (goal - cur) * 0.08;
      spin.style.transform = "translateZ(" + (-(spin._r || 0)) + "px) rotateY(" + cur.toFixed(3) + "deg)";
      requestAnimationFrame(tick);
    }
    layout(); window.addEventListener("resize", layout);
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(spin);
    requestAnimationFrame(tick);
  })();

  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();
