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
