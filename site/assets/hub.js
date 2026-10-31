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

  // Вкладки «Все / Лендинги / ИИ и автоматизации»
  var tabs = document.querySelectorAll(".tab");
  var cards = document.querySelectorAll(".work");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var f = tab.getAttribute("data-filter");
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
      cards.forEach(function (c) { c.hidden = f !== "all" && c.getAttribute("data-cat") !== f; });
    });
  });

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
