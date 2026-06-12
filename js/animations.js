/* =========================================================
   ZenvX AI Studio — animations.js
   GSAP + ScrollTrigger driven animations with graceful
   fallback when GSAP is unavailable (offline / blocked CDN).
   ========================================================= */
(function () {
	"use strict";

	const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const hasGSAP = typeof window.gsap !== "undefined";

	// If GSAP didn't load (or reduced motion), reveal everything immediately.
	if (!hasGSAP || prefersReduced) {
		document.documentElement.classList.add("no-gsap");
		runCounters(true);
		drawUnderlines(true);
		return;
	}

	const gsap = window.gsap;
	if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

	document.addEventListener("DOMContentLoaded", function () {
		/* Navbar fade-in from top */
		gsap.from(".navbar", { y: -80, opacity: 0, duration: 0.9, ease: "power3.out" });

		/* Hero staggered fade-up on load */
		gsap.from(".hero-content [data-hero]", {
			y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.15, delay: 0.2,
		});

		/* Generic scroll reveals */
		gsap.utils.toArray(".reveal").forEach(function (el) {
			gsap.to(el, {
				y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
				scrollTrigger: { trigger: el, start: "top 85%" },
			});
		});

		/* Staggered card groups */
		gsap.utils.toArray("[data-stagger]").forEach(function (group) {
			const items = group.querySelectorAll(".reveal-item");
			gsap.to(items, {
				y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.12,
				scrollTrigger: { trigger: group, start: "top 82%" },
			});
		});

		/* Slide-in from alternating sides */
		gsap.utils.toArray(".reveal-left").forEach(function (el) {
			gsap.to(el, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out",
				scrollTrigger: { trigger: el, start: "top 85%" } });
		});
		gsap.utils.toArray(".reveal-right").forEach(function (el) {
			gsap.to(el, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out",
				scrollTrigger: { trigger: el, start: "top 85%" } });
		});

		/* Section heading clip-path reveal */
		gsap.utils.toArray(".clip-reveal").forEach(function (el) {
			gsap.to(el, {
				clipPath: "inset(0 0% 0 0)", duration: 1, ease: "power3.inOut",
				scrollTrigger: { trigger: el, start: "top 85%" },
			});
		});

		/* Timeline node sequential pop-in */
		gsap.utils.toArray("[data-timeline]").forEach(function (tl) {
			const nodes = tl.querySelectorAll(".tl-item, .ht-item");
			gsap.from(nodes, {
				opacity: 0, scale: 0.85, y: 24, duration: 0.6, ease: "back.out(1.6)", stagger: 0.18,
				scrollTrigger: { trigger: tl, start: "top 80%" },
			});
		});

		/* Animated underline draw */
		drawUnderlines(false);

		/* Count-up stats */
		runCounters(false);
	});

	/* ---------- Count-up helper ---------- */
	function runCounters(immediate) {
		const counters = document.querySelectorAll("[data-count]");
		counters.forEach(function (el) {
			const target = parseFloat(el.getAttribute("data-count"));
			const suffix = el.getAttribute("data-suffix") || "";
			const decimals = (el.getAttribute("data-decimals") | 0);

			function render(val) {
				el.textContent = val.toFixed(decimals) + suffix;
			}

			if (immediate || !window.gsap) { render(target); return; }

			const obj = { v: 0 };
			window.gsap.to(obj, {
				v: target, duration: 2, ease: "power2.out",
				onUpdate: function () { render(obj.v); },
				scrollTrigger: { trigger: el, start: "top 90%", once: true },
			});
		});
	}

	/* ---------- Underline draw helper ---------- */
	function drawUnderlines(immediate) {
		const lines = document.querySelectorAll(".draw-underline");
		lines.forEach(function (el) {
			if (immediate || !window.gsap) { el.style.transform = "scaleX(1)"; return; }
			window.gsap.to(el, {
				scaleX: 1, duration: 1, ease: "power3.out", delay: 0.3,
			});
		});
	}
})();
