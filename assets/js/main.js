/* =========================================================================
   ZenvX AI Studio — site JS (vanilla, no dependencies)
   - Mobile nav toggle
   - Scroll-in reveals (IntersectionObserver)
   - FAQ accordion (accessible)
   - Concept demo state machine (Speak -> Understand -> Execute)
   Respects prefers-reduced-motion throughout.
   ========================================================================= */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------ Nav ---------------------------------- */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close menu when a link is tapped (mobile)
    nav.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------ Reveals ------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ------------------------------ FAQ accordion ------------------------ */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var panel = item.querySelector(".faq-a");
    if (!btn || !panel) return;
    btn.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
    });
  });

  /* ------------------------------ Clock (demo cosmetic) ---------------- */
  var clock = document.querySelector("[data-clock]");
  function tick() {
    if (!clock) return;
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    clock.textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  tick(); setInterval(tick, 15000);

  /* ------------------------------ Concept demo ------------------------- */
  var demo = document.querySelector(".demo");
  if (demo) {
    // If a real media asset has been dropped into the swap slot, skip the mock.
    var media = demo.querySelector(".demo-media");
    var hasRealMedia = media && media.getAttribute("data-active") === "true";

    var bubble = demo.querySelector("[data-typed]");
    var caret = demo.querySelector(".caret");
    var steps = demo.querySelectorAll(".pipe .step");
    var COMMAND = (bubble && bubble.getAttribute("data-command")) ||
                  "Open my presentation and mute notifications";

    function setStep(i) {
      steps.forEach(function (s, idx) { s.classList.toggle("on", idx === i); });
    }
    function clearState() {
      demo.classList.remove("listening", "typing", "executed");
      if (bubble) bubble.textContent = "";
      setStep(0);
    }

    // Static end-state for reduced motion or when no timers should run.
    function showStatic() {
      demo.classList.add("executed");
      if (bubble) bubble.textContent = COMMAND;
      if (caret) caret.style.display = "none";
      setStep(2);
    }

    var timers = [];
    function schedule(fn, t) { timers.push(setTimeout(fn, t)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function runCycle() {
      clearTimers();
      clearState();
      // 1) Listening
      demo.classList.add("listening");
      setStep(0);
      // 2) Typing the command
      schedule(function () {
        demo.classList.add("typing");
        typeOut(COMMAND, 0);
      }, 1100);
    }

    function typeOut(text, i) {
      if (!bubble) return;
      if (i <= text.length) {
        bubble.textContent = text.slice(0, i);
        schedule(function () { typeOut(text, i + 1); }, 42);
      } else {
        // 3) Understanding
        demo.classList.remove("listening", "typing");
        setStep(1);
        // 4) Executing
        schedule(function () {
          setStep(2);
          demo.classList.add("executed");
        }, 900);
        // 5) Pause, then loop
        schedule(function () { runCycle(); }, 4200);
      }
    }

    if (hasRealMedia) {
      // Real footage present: nothing to animate.
    } else if (reduceMotion) {
      showStatic();
    } else if ("IntersectionObserver" in window) {
      var started = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; runCycle(); }
          else if (!e.isIntersecting && started) { clearTimers(); started = false; clearState(); }
        });
      }, { threshold: 0.35 });
      io.observe(demo);
    } else {
      runCycle();
    }
  }
})();
