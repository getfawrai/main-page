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

  // Hero chat demo — sequenced typing + reply, replayable, plays once in view
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var bubble1 = document.getElementById("bubble1");
  var typing = document.getElementById("chatTyping");
  var bubble2 = document.getElementById("bubble2");
  var replayBtn = document.getElementById("chatReplay");
  var chatCard = document.getElementById("chatCard");
  var chatTimers = [];

  function clearChatTimers() {
    chatTimers.forEach(clearTimeout);
    chatTimers = [];
  }

  function playChatDemo() {
    clearChatTimers();
    bubble2.classList.remove("is-shown");
    typing.classList.remove("is-visible");
    if (reducedMotion) {
      bubble2.classList.add("is-shown");
      return;
    }
    chatTimers.push(setTimeout(function () { typing.classList.add("is-visible"); }, 500));
    chatTimers.push(setTimeout(function () {
      typing.classList.remove("is-visible");
      bubble2.classList.add("is-shown");
    }, 1900));
  }

  replayBtn.addEventListener("click", playChatDemo);

  if (chatCard && "IntersectionObserver" in window) {
    var played = false;
    var chatObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !played) {
          played = true;
          playChatDemo();
        }
      });
    }, { threshold: 0.5 });
    chatObserver.observe(chatCard);
  } else {
    bubble2.classList.add("is-shown");
  }

  // Scroll reveal for section-level content blocks (progressive enhancement — see .js class on <html>)
  var revealEls = document.querySelectorAll(".fw-reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
