// Появление блоков при прокрутке и подчёркивание шапки.
(function () {
  // Превью цветовых вариантов: ?p=a ... ?p=f (вариант A включён по умолчанию)
  var p = (new URLSearchParams(location.search).get("p") || "").toLowerCase();
  if (/^[b-f]$/.test(p)) document.documentElement.setAttribute("data-p", p);

  var nav = document.getElementById("nav");
  function onScroll() {
    nav.classList.toggle("is-stuck", (window.scrollY || 0) > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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
  }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();
