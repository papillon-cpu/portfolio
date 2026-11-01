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
