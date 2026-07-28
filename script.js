(function () {
  "use strict";

  // Sticky nav background on scroll
  var nav = document.getElementById("siteNav");
  function updateNav() {
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });

  // Mobile drawer
  var burger = document.getElementById("burgerBtn");
  var drawer = document.getElementById("drawer");
  var scrim = document.getElementById("scrim");

  function openDrawer() {
    drawer.classList.add("is-open");
    scrim.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    drawer.classList.remove("is-open");
    scrim.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", openDrawer);
  scrim.addEventListener("click", closeDrawer);
  drawer.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeDrawer);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });

  // "How it works" accordion — single item open at a time, click active to close
  var steps = document.querySelectorAll(".fw-step");
  steps.forEach(function (step) {
    var header = step.querySelector(".fw-step-header");
    header.addEventListener("click", function () {
      var wasActive = step.classList.contains("is-active");
      steps.forEach(function (s) {
        s.classList.remove("is-active");
        s.querySelector(".fw-step-header").setAttribute("aria-expanded", "false");
      });
      if (!wasActive) {
        step.classList.add("is-active");
        header.setAttribute("aria-expanded", "true");
      }
    });
  });

  // Book a call form — fake submit, swap to success state
  var form = document.getElementById("bookForm");
  var intro = document.getElementById("bookIntro");
  var success = document.getElementById("bookSuccess");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    form.hidden = true;
    intro.hidden = true;
    success.hidden = false;
  });
})();
