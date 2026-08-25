(function () {
  "use strict";

  /* ---------------- Mobile burger menu ---------------- */
  var burger = document.getElementById("fw-burger");
  var mobileMenu = document.getElementById("fw-mobile-menu");

  function closeMobileMenu() {
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("open");
  }

  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("open");
      burger.classList.toggle("open", isOpen);
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMobileMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileMenu();
    });
  }

  /* ---------------- Step tabs (action journey) ---------------- */
  var steps = [
    { num: "01", title: "Enquiries, Answered", detail: "Every message met with a real, qualified conversation on WhatsApp, Instagram, SMS or your website the moment it lands. No waiting. No missed leads.", example: '"Hi, I saw your Botox post. Do you have anything free this weekend?"' },
    { num: "02", title: "Follow-ups, Personalised", detail: 'Timed, personal outreach so a "maybe later" never turns into silence. FawrAI follows up at the right moment, in the right tone, with the right message.', example: '"Sara, just checking in. Saturday at 11am is still available if you would like to book."' },
    { num: "03", title: "Objections, Handled", detail: "Real answers on price, timing and hesitation in the moment, without a hand-off to your team. Patients get the clarity they need to say yes. Hand-offs to your staff only when it matters and when necesary.", example: '"Price is a question. Hesitation is a feeling. FawrAI handles both before they become a reason to leave."' },
    { num: "04", title: "Leads, Converted", detail: "The appointment goes straight onto your calendar, confirmed and booked. FawrAI collects everything needed and hands it off without friction.", example: '"Your appointment is confirmed for Saturday 18 October at 11am. See you then."' },
    { num: "05", title: "Clients, Retained", detail: "Reaches out when it is time to return, and books the next visit before they think to look elsewhere. Every client relationship deepens over time.", example: '"Hi Sara. It has been 3 months since your last visit. Ready to touch up your botox?"' }
  ];

  var tabsWrap = document.getElementById("step-tabs");
  var titleEl = document.getElementById("step-detail-title");
  var bodyEl = document.getElementById("step-detail-body");
  var exampleEl = document.getElementById("step-detail-example");
  var countEl = document.getElementById("step-detail-count");

  function renderStep(i) {
    var s = steps[i];
    [titleEl, bodyEl, exampleEl, countEl].forEach(function (el) {
      el.style.animation = "none";
      void el.offsetWidth; // restart animation
      el.style.animation = "";
    });
    titleEl.textContent = s.title;
    bodyEl.textContent = s.detail;
    exampleEl.textContent = s.example;
    countEl.textContent = s.num + " of 05";
  }

  function setActiveTab(i, btn) {
    var tabs = tabsWrap.querySelectorAll(".step-tab");
    tabs.forEach(function (t) { t.classList.remove("active"); });
    btn.classList.add("active");
    renderStep(i);
  }

  if (tabsWrap) {
    tabsWrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".step-tab");
      if (!btn) return;
      var i = parseInt(btn.getAttribute("data-step"), 10);

      // ripple feedback
      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement("span");
      var size = Math.max(rect.width, rect.height);
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
      ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 600);

      setActiveTab(i, btn);
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".fw-reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------------- Chat demo animation (loops, 10s pause between cycles) ---------------- */
  var chatWrap = document.getElementById("chat-wrap");
  var typingEl = document.getElementById("chat-typing");
  var chatStarted = false;
  var LOOP_PAUSE = 10000;

  function resetChat() {
    var wrappers = Array.prototype.slice.call(chatWrap.children).filter(function (el) { return el !== typingEl; });
    wrappers.forEach(function (wrapper) {
      wrapper.classList.add("chat-pending");
      var msg = wrapper.querySelector(".chat-msg");
      if (msg) msg.classList.remove("shown");
    });
    typingEl.classList.remove("active", "out");
  }

  function playChat() {
    if (!chatWrap) return;
    // typingEl stays fixed as the last DOM child; hidden (chat-pending) wrappers before it
    // take no layout space, so it always renders directly beneath whatever is currently visible
    // and nothing ever gets reordered or shifted.
    var msgs = Array.prototype.slice.call(chatWrap.querySelectorAll(".chat-msg"))
      .sort(function (a, b) { return parseInt(a.dataset.order, 10) - parseInt(b.dataset.order, 10); });

    var TYPING_DURATION = 900;
    var time = 250;
    msgs.forEach(function (msg) {
      var isOut = msg.classList.contains("out");
      var wrapper = msg.parentElement;

      // typing dots first, on the side of whoever is about to "type"
      setTimeout(function () {
        typingEl.classList.toggle("out", isOut);
        typingEl.classList.add("active");
      }, time);
      time += TYPING_DURATION;

      // then swap dots for the actual message, no DOM movement
      setTimeout(function () {
        typingEl.classList.remove("active");
        wrapper.classList.remove("chat-pending");
        requestAnimationFrame(function () { msg.classList.add("shown"); });
      }, time);
      time += 550;
    });

    setTimeout(function () {
      resetChat();
      setTimeout(playChat, 500);
    }, time + LOOP_PAUSE);
  }

  function startChatLoop() {
    if (chatStarted || !chatWrap) return;
    chatStarted = true;
    playChat();
  }

  if (chatWrap && "IntersectionObserver" in window) {
    var chatObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          startChatLoop();
          chatObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    chatObserver.observe(chatWrap);
  } else if (chatWrap) {
    chatWrap.querySelectorAll(".chat-msg").forEach(function (m) { m.classList.add("shown"); });
  }

  /* ---------------- Contact form submit ---------------- */
  var form = document.getElementById("fw-contact-form");
  var statusEl = document.getElementById("fw-form-status");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var action = form.getAttribute("action") || "";
      if (!action || action.indexOf("YOUR_FORM_ID") !== -1) {
        statusEl.textContent = "Form isn't connected yet. Add your Formspree endpoint in index.html.";
        statusEl.className = "fw-form-status error";
        return;
      }

      var submitBtn = form.querySelector("button[type=submit]");
      var originalLabel = submitBtn.textContent;
      submitBtn.setAttribute("disabled", "disabled");
      submitBtn.textContent = "Sending...";
      statusEl.textContent = "";
      statusEl.className = "fw-form-status";

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            statusEl.textContent = "Thanks! We'll be in touch soon.";
            statusEl.className = "fw-form-status success";
            form.reset();
          } else {
            return response.json().then(function (data) {
              var msg = (data && data.errors && data.errors.map(function (er) { return er.message; }).join(", ")) || "Something went wrong. Please try again.";
              statusEl.textContent = msg;
              statusEl.className = "fw-form-status error";
            });
          }
        })
        .catch(function () {
          statusEl.textContent = "Network error. Please try again, or email hello@fawrai.com directly.";
          statusEl.className = "fw-form-status error";
        })
        .finally(function () {
          submitBtn.removeAttribute("disabled");
          submitBtn.textContent = originalLabel;
        });
    });
  }
})();
