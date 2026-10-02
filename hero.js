/* FawrAI hero.
   A ribbon of light carries every enquiry into the live panel; the panel
   shows one run being worked step by step while other runs land in the log.
   No dependencies. Canvas 2D. Paused when off-screen. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- nav ---------------- */
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

  var hero = document.getElementById("hero");
  var canvas = document.getElementById("ribbon");
  var panel = document.getElementById("run");
  var steps = Array.prototype.slice.call(document.querySelectorAll("#runSteps .run__step"));
  var railFill = document.getElementById("railFill");
  var statusText = document.querySelector("#runStatus span");
  var runId = document.getElementById("runId");
  var logEl = document.getElementById("log");

  /* ---------------- live panel ---------------- */
  var STEP_MS = 1500;
  var HOLD_MS = 3400;
  var active = -1;
  var onStep = null; // ribbon hooks in here

  function railTo(i) {
    if (!railFill) return;
    var first = steps[0], last = steps[steps.length - 1];
    var span = last.offsetTop - first.offsetTop;
    var at = Math.min(i, steps.length - 1);
    var p = i < 0 ? 0 : (steps[at].offsetTop - first.offsetTop) / span;
    railFill.style.transform = "scaleY(" + p + ")";
  }

  function setActive(i) {
    active = i;
    for (var k = 0; k < steps.length; k++) {
      steps[k].classList.toggle("is-done", k < i);
      steps[k].classList.toggle("is-active", k === i);
    }
    railTo(i);
    if (onStep) onStep(i);
  }

  function setStatus(s) {
    if (statusText) statusText.textContent = s;
    panel.classList.toggle("is-complete", s === "complete");
  }

  var runTimer = null;
  function playRun() {
    var i = 0;
    setStatus("running");
    (function tick() {
      setActive(i);
      i++;
      if (i < steps.length) {
        runTimer = setTimeout(tick, STEP_MS);
      } else {
        runTimer = setTimeout(function () {
          setActive(steps.length);       // last step settles to done
          setStatus("complete");
          pushLog(["botox", "forehead", "rebooked", "3 wk"]);
          runTimer = setTimeout(function () {
            panel.classList.add("is-resetting");
            setActive(-1);
            if (runId) runId.textContent = String(parseInt(runId.textContent, 10) + 1);
            runTimer = setTimeout(function () {
              panel.classList.remove("is-resetting");
              playRun();
            }, 900);
          }, HOLD_MS);
        }, STEP_MS);
      }
    })();
  }

  /* ---------------- last runs log ---------------- */
  var POOL = [
    ["filler", "lips", "qualified", "23s"],
    ["hydrafacial", "", "booked", "18s"],
    ["laser", "6 sessions", "followed up", "2h"],
    ["skin consult", "", "booked", "29s"],
    ["profhilo", "", "rebooked", "3 wk"],
    ["botox", "masseter", "booked", "52s"],
    ["microneedling", "", "qualified", "34s"],
    ["peel", "first visit", "confirmed", "1d"],
    ["filler", "cheeks", "booked", "44s"],
    ["laser", "underarm", "reminded", "1d"]
  ];
  var clock = 9 * 60 + 44;
  var poolIdx = 0;

  function hhmm(m) {
    var h = Math.floor(m / 60) % 24, mm = m % 60;
    return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
  }
  function row(e) {
    var li = document.createElement("li");
    var what = e[0] + (e[1] ? " · " + e[1] : "");
    li.innerHTML =
      '<span class="t">' + hhmm(clock) + "</span>" +
      '<span class="w">' + what + "</span>" +
      '<span class="s">' + e[2] + "</span>" +
      '<span class="d">' + e[3] + "</span>";
    return li;
  }
  function pushLog(e, instant) {
    clock += 2 + Math.floor(Math.random() * 5);
    var li = row(e || POOL[poolIdx++ % POOL.length]);
    if (instant) { logEl.appendChild(li); return; }
    li.classList.add("enter");
    logEl.insertBefore(li, logEl.firstChild);
    li.getBoundingClientRect();
    li.classList.remove("enter");
    var extra = logEl.children;
    if (extra.length > 3) {
      var old = extra[extra.length - 1];
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 950);
    }
  }
  // seed: newest first
  (function seed() {
    var s = [["hydrafacial", "", "booked", "18s"], ["filler", "lips", "qualified", "23s"], ["botox", "forehead", "booked", "41s"]];
    clock = 9 * 60 + 22;
    var items = s.map(function (e) { clock += 6; return row(e); });
    items.reverse().forEach(function (li) { logEl.appendChild(li); });
    poolIdx = 3;
  })();

  var logTimer = null;
  function scheduleLog() {
    logTimer = setTimeout(function () { pushLog(); scheduleLog(); }, 3800 + Math.random() * 2600);
  }

  /* ---------------- ribbon ---------------- */
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, VH = 0, DPR = 1, mobile = false;
  var tx = 0, ty = 0, goalY = 0;          // where the light enters the panel
  var sets = [];                          // strand bundles
  var comets = [], sparks = [];
  var surge = 0, reveal = reduce ? 1 : 0;
  var T = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function measureTarget() {
    var c = canvas.getBoundingClientRect();
    if (mobile) {
      var p = panel.getBoundingClientRect();
      tx = p.left - c.left + p.width * 0.5;
      goalY = p.top - c.top + 1;
    } else {
      var idx = Math.max(0, Math.min(steps.length - 1, active));
      var n = steps[idx].querySelector(".node").getBoundingClientRect();
      tx = n.left - c.left + n.width / 2;
      goalY = n.top - c.top + n.height / 2;
    }
  }

  function makeSet(count, opts) {
    var strands = [];
    for (var i = 0; i < count; i++) {
      var sage = Math.random() < opts.sage;
      strands.push({
        u: (i + 0.5) / count - 0.5 + rnd(-0.008, 0.008),
        sage: sage,
        a: sage ? rnd(0.12, 0.26) : rnd(0.16, 0.42) * (Math.random() < 0.12 ? 1.8 : 1),
        lw: rnd(0.5, 1.05),
        ph: rnd(0, Math.PI * 2),
        f: rnd(1.2, 3.2),
        wob: rnd(0.04, 0.16),
        pts: new Float32Array(opts.k * 2),
        grad: null
      });
    }
    return { strands: strands, k: opts.k, width: opts.width, twist: opts.twist, tph: opts.tph, curve: opts.curve, alpha: opts.alpha };
  }

  function build() {
    var r = hero.getBoundingClientRect();
    mobile = window.innerWidth <= 920;
    DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
    W = r.width; H = r.height; VH = Math.min(window.innerHeight, H);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    measureTarget();
    ty = goalY;

    if (mobile) {
      sets = [makeSet(32, { k: 44, width: 0.07, twist: 0.9, tph: 0, sage: 0.18, curve: "mobile", alpha: 1 })];
    } else {
      sets = [
        makeSet(84, { k: 72, width: 0.2, twist: 0.95, tph: 0, sage: 0.16, curve: "low", alpha: 1 }),
        makeSet(34, { k: 60, width: 0.1, twist: 0.8, tph: 1.9, sage: 0.25, curve: "high", alpha: 0.6 })
      ];
    }
    sets.forEach(buildGradients);

    sparks = [];
    var ns = mobile ? 18 : 64;
    for (var i = 0; i < ns; i++) sparks.push(newSpark());
    comets = [];
  }

  function buildGradients(set) {
    var x0 = -0.08 * W;
    var x1 = mobile ? tx : tx;
    set.strands.forEach(function (s) {
      var g, c = s.sage ? "138,158,133" : "212,175,110";
      if (mobile) g = ctx.createLinearGradient(-0.25 * W, 0, tx, 0);
      else g = set.curve === "high"
        ? ctx.createLinearGradient(0.46 * W, 0.04 * VH, x1, ty)
        : ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, "rgba(" + c + ",0)");
      g.addColorStop(set.curve === "high" ? 0.32 : 0.18, "rgba(" + c + "," + (s.a * 0.55).toFixed(3) + ")");
      g.addColorStop(0.75, "rgba(" + c + "," + s.a.toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + (s.sage ? c : "240,214,160") + "," + Math.min(1, s.a * 2.4).toFixed(3) + ")");
      s.grad = g;
    });
  }

  // centre line of a bundle: cubic bezier into (tx, ty), drifting slowly
  function controls(set) {
    var d1 = Math.sin(T * 0.11), d2 = Math.sin(T * 0.083 + 1.3), d3 = Math.sin(T * 0.067 + 2.1);
    if (set.curve === "low") return [  // rises from the bottom-left corner, under the copy
      -0.04 * W, VH * (1.10 + 0.03 * d1),
      0.40 * W, VH * (1.08 + 0.04 * d2),
      tx - 0.14 * W, ty + VH * (0.16 + 0.04 * d3),
      tx, ty
    ];
    if (set.curve === "high") return [ // falls from above, through the gap between copy and panel
      0.42 * W, -VH * (0.14 + 0.03 * d2),
      0.51 * W, VH * (0.12 + 0.04 * d3),
      tx - 0.12 * W, ty - VH * (0.10 + 0.03 * d1),
      tx, ty
    ];
    return [ // mobile: crosses the gap above the panel, then pours into its top edge
      -0.25 * W, ty - VH * (0.09 + 0.015 * d1),
      0.35 * W, ty - VH * (0.12 + 0.02 * d2),
      tx + 0.08 * W * d3, ty - VH * 0.08,
      tx, ty
    ];
  }

  var cx = new Float32Array(160), cy = new Float32Array(160), nx = new Float32Array(160), ny = new Float32Array(160);

  function computeSet(set) {
    var P = controls(set), k = set.k;
    for (var j = 0; j < k; j++) {
      var t = j / (k - 1), m = 1 - t;
      var a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
      cx[j] = a * P[0] + b * P[2] + c * P[4] + d * P[6];
      cy[j] = a * P[1] + b * P[3] + c * P[5] + d * P[7];
      var dx = 3 * m * m * (P[2] - P[0]) + 6 * m * t * (P[4] - P[2]) + 3 * t * t * (P[6] - P[4]);
      var dy = 3 * m * m * (P[3] - P[1]) + 6 * m * t * (P[5] - P[3]) + 3 * t * t * (P[7] - P[5]);
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      nx[j] = -dy / len; ny[j] = dx / len;
    }
    var wmax = set.width * VH;
    var ss = set.strands;
    for (var i = 0; i < ss.length; i++) {
      var s = ss[i], pts = s.pts;
      for (j = 0; j < k; j++) {
        t = j / (k - 1);
        var taper = Math.pow(1 - t, 0.6) * (0.7 + 0.3 * Math.sin(Math.PI * t));
        var w = wmax * taper;
        var th = Math.PI * set.twist * t + T * 0.22 + set.tph;
        var off = w * s.u * (0.58 + 0.42 * Math.cos(th)) * 2 +   // breathes, never collapses
                  w * s.wob * Math.sin(s.f * t * 6.283 + s.ph + T * 0.35) * (1 - t);
        pts[j * 2] = cx[j] + nx[j] * off;
        pts[j * 2 + 1] = cy[j] + ny[j] * off;
      }
    }
  }

  function newSpark() {
    var set = Math.random() < 0.8 || sets.length < 2 ? 0 : 1;
    return {
      set: set,
      s: Math.floor(Math.random() * (sets[set] ? sets[set].strands.length : 1)),
      t: rnd(0.15, 0.95),
      v: rnd(0.006, 0.02),
      ph: rnd(0, 6.283),
      sp: rnd(0.6, 1.6),
      r: rnd(0.5, 1.3)
    };
  }

  function spawnComet(burst) {
    var set = Math.random() < 0.82 || sets.length < 2 ? 0 : 1;
    comets.push({
      set: set,
      s: Math.floor(Math.random() * sets[set].strands.length),
      c: burst ? rnd(0.35, 0.7) : 0,
      v: rnd(0.16, 0.30) * (burst ? 1.4 : 1),
      len: rnd(0.07, 0.14)
    });
  }

  function pointAt(set, s, t) {
    var k = set.k, f = Math.max(0, Math.min(0.9999, t)) * (k - 1);
    var j = Math.floor(f), r = f - j, p = set.strands[s].pts;
    return [p[j * 2] + (p[j * 2 + 2] - p[j * 2]) * r, p[j * 2 + 1] + (p[j * 2 + 3] - p[j * 2 + 1]) * r];
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // strands
    for (var q = 0; q < sets.length; q++) {
      var set = sets[q];
      computeSet(set);
      var kmax = Math.max(2, Math.floor(set.k * reveal));
      ctx.globalAlpha = set.alpha * (1 + surge * 0.55);
      for (var i = 0; i < set.strands.length; i++) {
        var s = set.strands[i], p = s.pts;
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        for (var j = 1; j < kmax; j++) ctx.lineTo(p[j * 2], p[j * 2 + 1]);
        ctx.strokeStyle = s.grad;
        ctx.lineWidth = s.lw;
        ctx.stroke();
      }
    }

    // comets: pulses of light travelling into the panel
    ctx.globalAlpha = 1;
    for (i = comets.length - 1; i >= 0; i--) {
      var cm = comets[i], cs = sets[cm.set];
      if (!cs) { comets.splice(i, 1); continue; }
      var head = Math.min(cm.c, reveal), tail = Math.max(0, cm.c - cm.len);
      if (head > tail) {
        var fade = Math.min(1, cm.c / 0.25) * Math.min(1, (1.02 - cm.c) / 0.12);
        ctx.beginPath();
        var n = 10;
        for (j = 0; j <= n; j++) {
          var pt = pointAt(cs, cm.s, tail + (head - tail) * (j / n));
          if (j === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]);
        }
        var hp = pointAt(cs, cm.s, head), tp = pointAt(cs, cm.s, tail);
        var g = ctx.createLinearGradient(tp[0], tp[1], hp[0], hp[1]);
        g.addColorStop(0, "rgba(240,214,160,0)");
        g.addColorStop(1, "rgba(255,236,196," + (0.85 * Math.max(0, fade)).toFixed(3) + ")");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // sparkles riding the ribbon
    ctx.fillStyle = "rgb(246,224,178)";
    for (i = 0; i < sparks.length; i++) {
      var sp = sparks[i], ss = sets[sp.set];
      if (!ss || sp.t > reveal) continue;
      var a = Math.sin(T * sp.sp + sp.ph);
      a = reduce ? 0.35 : a > 0 ? a * a * a : 0;
      if (a < 0.02) continue;
      var pp = pointAt(ss, sp.s, sp.t);
      ctx.globalAlpha = a * 0.9;
      ctx.beginPath();
      ctx.arc(pp[0], pp[1], sp.r, 0, 6.283);
      ctx.fill();
    }

    // the port: where the ribbon meets the panel (sits under the glass)
    ctx.globalAlpha = 1;
    var gr = mobile ? 70 : 54;
    var glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, gr);
    var ga = (0.22 + surge * 0.4) * reveal;
    glow.addColorStop(0, "rgba(240,214,160," + ga.toFixed(3) + ")");
    glow.addColorStop(1, "rgba(212,175,110,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(tx - gr, ty - gr, gr * 2, gr * 2);

    ctx.globalCompositeOperation = "source-over";
  }

  var t0 = 0, last = 0, running = false, visible = true, raf = 0, nextComet = 0;
  function frame(now) {
    raf = 0;
    if (!running) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    T += dt;

    if (!t0) t0 = now;
    if (reveal < 1) reveal = Math.min(1, (now - t0) / 2400); // wall clock: same intro length on any device
    var revealEased = 1 - Math.pow(1 - reveal, 3);
    var rv = reveal; reveal = revealEased;

    ty += (goalY - ty) * (1 - Math.exp(-dt * 2.6));
    surge *= Math.exp(-dt * 1.6);

    nextComet -= dt;
    if (nextComet <= 0 && rv > 0.6) {
      spawnComet(false);
      nextComet = mobile ? rnd(0.5, 1.1) : rnd(0.18, 0.5);
    }
    for (var i = comets.length - 1; i >= 0; i--) {
      comets[i].c += comets[i].v * dt;
      if (comets[i].c > 1.02) comets.splice(i, 1);
    }
    for (i = 0; i < sparks.length; i++) {
      sparks[i].t += sparks[i].v * dt;
      if (sparks[i].t > 0.97) sparks[i] = newSpark(), sparks[i].t = rnd(0.1, 0.3);
    }

    draw();
    reveal = rv;
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce || !visible) return; // rAF itself idles in background tabs
    running = true; last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf), raf = 0;
  }

  // light reaches the step: ribbon re-aims, a surge runs down it
  onStep = function (i) {
    if (mobile) { surge = Math.min(1, surge + 0.6); return; }
    measureTarget();
    if (i >= 0 && i < steps.length) {
      surge = Math.min(1, surge + 0.75);
      for (var k = 0; k < (mobile ? 2 : 5); k++) spawnComet(true);
    }
  };

  /* ---------------- boot ---------------- */
  function boot() {
    build();
    if (reduce) {
      setActive(steps.length);
      setStatus("complete");
      // a single, still frame of the ribbon
      measureTarget(); ty = goalY; sets.forEach(buildGradients);
      reveal = 1; draw();
    } else {
      setActive(-1);
      start();
      setTimeout(playRun, 1700);
      setTimeout(scheduleLog, 2600);
    }
    document.body.classList.add("is-ready");
  }

  var rT = 0, lastW = window.innerWidth;
  window.addEventListener("resize", function () {
    // ignore mobile URL-bar height jitter
    if (window.innerWidth === lastW && mobile) return;
    lastW = window.innerWidth;
    clearTimeout(rT);
    rT = setTimeout(function () {
      build();
      if (reduce) { reveal = 1; draw(); }
    }, 120);
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  if (document.fonts && document.fonts.ready) {
    // measure after fonts settle so the target sits exactly on the node
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(boot);
  } else {
    boot();
  }
})();
