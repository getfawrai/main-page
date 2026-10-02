/* FawrAI sections: reveal on enter, the leak stream, the system line.
   Scroll + rAF driven (not IntersectionObserver for reveals): on some mobile
   browsers IO callbacks stall during momentum scroll and leave sections half-faded. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vh = window.innerHeight;

  /* ---------------- reveal ---------------- */
  var rvs = Array.prototype.slice.call(document.querySelectorAll(".rv"));
  // stagger siblings that enter together
  function paintReveal() {
    var n = 0;
    for (var i = rvs.length - 1; i >= 0; i--) {
      var r = rvs[i].getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) {
        (function (el, d) {
          el.style.transitionDelay = d + "ms";
          el.classList.add("on");
          setTimeout(function () { el.style.transitionDelay = ""; }, d + 1300);
        })(rvs[i], reduce ? 0 : Math.min(n++, 4) * 90);
        rvs.splice(i, 1);
      }
    }
  }
  // splice walks backwards; reverse so the stagger runs top to bottom
  rvs.reverse();

  /* ---------------- 02 the system line ---------------- */
  var track = document.querySelector(".sys__track");
  var fill = document.getElementById("sysFill");
  var head = document.getElementById("sysHead");
  var sysSteps = Array.prototype.slice.call(document.querySelectorAll(".sys__step"));
  var lineP = 0, lineGoal = 0;

  function measureLine() {
    if (!track) return;
    var r = track.getBoundingClientRect();
    // the line's tip sits at 62% of the viewport height
    lineGoal = Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height));
  }
  function paintLine() {
    if (!track) return;
    fill.style.transform = "scaleY(" + lineP + ")";
    head.style.top = (lineP * 100) + "%";
    head.style.opacity = lineP > 0.002 && lineP < 0.998 ? "1" : "0";
    var h = track.getBoundingClientRect().height;
    for (var i = 0; i < sysSteps.length; i++) {
      var at = (sysSteps[i].offsetTop + 14) / h;
      sysSteps[i].classList.toggle("is-on", lineP >= at - 0.002);
    }
  }

  /* ---------------- 01 the leak stream ---------------- */
  var canvas = document.getElementById("stream");
  var ctx = canvas && canvas.getContext("2d");
  var W = 0, H = 0, DPR = 1, parts = [], mobile = false;
  var REPLY = 0.34, KEEP = 0.42;

  function sizeStream() {
    var r = canvas.getBoundingClientRect();
    mobile = window.innerWidth <= 920;
    REPLY = mobile ? 0.30 : 0.34;
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    var n = mobile ? 170 : 320;
    parts = [];
    for (var i = 0; i < n; i++) parts.push(newPart(Math.random()));
  }

  function newPart(x) {
    var keep = Math.random() < KEEP;
    return {
      x: x,                          // 0..1 along the stream
      lane: Math.random() * 2 - 1,   // -1..1 across it
      v: 0.055 + Math.random() * 0.04,
      keep: keep,
      off: 0.01 + Math.random() * 0.12,   // how long after the reply it gives up
      fall: 0, a: 0.4 + Math.random() * 0.6,
      r: 0.7 + Math.random() * 0.9,
      ph: Math.random() * 6.283
    };
  }

  function streamFrame(dt, T) {
    var cy = H * 0.52, band = H * (mobile ? 0.17 : 0.2);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.x += p.v * dt;
      if (p.x > 1.02) { parts[i] = p = newPart(-0.02); }

      var lane = p.lane;
      var after = p.x - REPLY;
      var y, alpha = p.a, col;

      if (p.keep) {
        // the worked enquiries tighten into a narrower stream and carry on
        var k = Math.max(0, Math.min(1, after / 0.18));
        k = k * k * (3 - 2 * k);
        y = cy + lane * band * (1 - k * 0.55) + Math.sin(p.x * 9 + p.ph + T * 0.6) * 3;
        col = "248,245,240";
        alpha *= 0.55 + 0.45 * k;
      } else {
        y = cy + lane * band + Math.sin(p.x * 9 + p.ph + T * 0.6) * 3;
        if (after > p.off) {
          // left after the first reply: drifts out of the stream and fades
          var g = (after - p.off) / 0.14;
          y += g * g * H * 0.42;
          alpha *= Math.max(0, 1 - g);
          col = "157,176,194";
        } else {
          col = "248,245,240";
          alpha *= 0.55;
        }
      }
      // fade in at the left edge, out at the right
      alpha *= Math.min(1, p.x / 0.06) * Math.min(1, (1.02 - p.x) / 0.06);
      if (alpha <= 0.01) continue;

      var x = p.x * W;
      ctx.strokeStyle = "rgba(" + col + "," + (alpha * 0.45).toFixed(3) + ")";
      ctx.lineWidth = p.r;
      ctx.beginPath();
      ctx.moveTo(x - 10 - p.v * 60, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(" + col + "," + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, 6.283);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  var streamOn = false;
  if (canvas) {
    sizeStream();
    if (reduce) {
      for (var s = 0; s < 400; s++) streamFrame(1 / 30, s / 30);   // settle into a natural still
    } else if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { streamOn = es[0].isIntersecting; }, { rootMargin: "80px" }).observe(canvas);
    } else {
      streamOn = true;
    }
  }

  /* ---------------- loop ---------------- */
  var last = 0, T = 0, ticking = false;
  function loop(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now; T += dt;

    measureLine();
    if (reduce) lineP = lineGoal;
    else lineP += (lineGoal - lineP) * (1 - Math.exp(-dt * 7));
    paintLine();

    if (streamOn && !reduce) streamFrame(dt, T);
    requestAnimationFrame(loop);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { ticking = false; paintReveal(); });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  var lastW = window.innerWidth;
  window.addEventListener("resize", function () {
    vh = window.innerHeight;
    onScroll();
    if (canvas && window.innerWidth !== lastW) {
      lastW = window.innerWidth;
      sizeStream();
      if (reduce) for (var s = 0; s < 400; s++) streamFrame(1 / 30, s / 30);
    }
  }, { passive: true });

  paintReveal();
  requestAnimationFrame(loop);
})();
