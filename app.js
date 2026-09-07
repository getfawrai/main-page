/* FawrAI. Minimal progressive enhancement. No dependencies. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- nav: burger + stuck border ---------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");

  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      burger.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.setAttribute("data-open", "false");
        burger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
      }
    });
  }

  var onStuck = function () {
    nav.classList.toggle("is-stuck", window.scrollY > 8);
  };
  onStuck();
  window.addEventListener("scroll", onStuck, { passive: true });

  /* ---------- spine: one opportunity, carried forward with scroll ---------- */
  var fill = document.getElementById("spineFill");
  var dot = document.getElementById("spineDot");
  var stage = document.querySelector(".stage");
  var stops = Array.prototype.slice.call(document.querySelectorAll("#spineStops li"));
  var ticking = false;

  function paintSpine() {
    ticking = false;
    if (!stage || !fill) return;
    var rect = stage.getBoundingClientRect();
    var vh = window.innerHeight;
    // progress = how far the viewport centre has travelled through the stage
    var total = rect.height - vh * 0.4;
    var travelled = (vh * 0.5) - rect.top;
    var p = Math.max(0, Math.min(1, travelled / Math.max(total, 1)));
    fill.style.transform = "scaleY(" + p + ")";
    dot.style.top = (p * 100) + "%";
    for (var i = 0; i < stops.length; i++) {
      stops[i].classList.toggle("is-passed", p >= parseFloat(stops[i].dataset.at));
    }
  }
  function requestSpine() {
    if (!ticking) { ticking = true; requestAnimationFrame(paintSpine); }
  }
  paintSpine();
  window.addEventListener("scroll", requestSpine, { passive: true });
  window.addEventListener("resize", requestSpine, { passive: true });

  /* ---------- reveal on enter ---------- */
  var revealables = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- conversation: reveals in sequence, at conversational pace ---------- */
  var thread = document.getElementById("thread");
  if (thread) {
    var msgs = Array.prototype.slice.call(thread.querySelectorAll(".msg"));
    if (reduce || !("IntersectionObserver" in window)) {
      msgs.forEach(function (m) { m.classList.add("show"); });
    } else {
      var played = false;
      var tio = new IntersectionObserver(function (entries) {
        if (played || !entries[0].isIntersecting) return;
        played = true;
        tio.disconnect();
        var i = 0;
        (function next() {
          if (i >= msgs.length) { thread.classList.remove("typing"); return; }
          var m = msgs[i];
          var delay = parseInt(m.getAttribute("data-delay"), 10) || 700;
          if (m.classList.contains("msg--out")) thread.classList.add("typing");
          setTimeout(function () {
            thread.classList.remove("typing");
            m.classList.add("show");
            i++;
            next();
          }, delay);
        })();
      }, { threshold: 0.25 });
      tio.observe(thread);
    }
  }

  /* ---------- hero: the first log line types once ---------- */
  var ht = document.getElementById("hero-type");
  if (ht && !reduce) {
    var full = ht.textContent;
    ht.textContent = "";
    ht.classList.add("type");
    var n = 0;
    var timer = setInterval(function () {
      ht.textContent = full.slice(0, ++n);
      if (n >= full.length) {
        clearInterval(timer);
        setTimeout(function () { ht.classList.remove("type"); }, 1600);
      }
    }, 34);
  }

  /* ---------- smooth-scroll for the hero secondary action (respects reduced motion via CSS) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });
})();
