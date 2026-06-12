/* =========================================================
   ZenvX AI Studio — main.js
   Navbar behaviour, mobile menu, smooth scroll, page
   transitions, mouse parallax. Runs on every page.
   ========================================================= */
(function () {
	"use strict";

	/* ---------- Mark active nav link ---------- */
	function setActiveLink() {
		const path = window.location.pathname.split("/").pop() || "index.html";
		document.querySelectorAll(".nav-links a").forEach(function (a) {
			const href = a.getAttribute("href");
			if (href === path || (path === "" && href === "index.html")) {
				a.classList.add("active");
			}
		});
	}

	/* ---------- Navbar scroll state ---------- */
	function initNavbarScroll() {
		const nav = document.querySelector(".navbar");
		if (!nav) return;
		const onScroll = function () {
			if (window.scrollY > 30) nav.classList.add("scrolled");
			else nav.classList.remove("scrolled");
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
	}

	/* ---------- Mobile hamburger menu ---------- */
	function initHamburger() {
		const burger = document.querySelector(".hamburger");
		const links = document.querySelector(".nav-links");
		if (!burger || !links) return;

		burger.addEventListener("click", function () {
			burger.classList.toggle("open");
			links.classList.toggle("open");
			const expanded = burger.classList.contains("open");
			burger.setAttribute("aria-expanded", expanded ? "true" : "false");
		});

		links.querySelectorAll("a").forEach(function (a) {
			a.addEventListener("click", function () {
				burger.classList.remove("open");
				links.classList.remove("open");
			});
		});
	}

	/* ---------- Footer year ---------- */
	function initYear() {
		document.querySelectorAll("[data-year]").forEach(function (el) {
			el.textContent = new Date().getFullYear();
		});
	}

	/* ---------- Mouse parallax on hero ---------- */
	function initParallax() {
		const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (prefersReduced) return;

		const hero = document.querySelector(".hero");
		if (!hero) return;
		const content = hero.querySelector(".hero-content");
		const cards = hero.querySelectorAll(".float-card");

		hero.addEventListener("mousemove", function (e) {
			const rect = hero.getBoundingClientRect();
			const cx = (e.clientX - rect.left) / rect.width - 0.5;
			const cy = (e.clientY - rect.top) / rect.height - 0.5;
			if (content) {
				content.style.transform = "translate(" + cx * 18 + "px," + cy * 18 + "px)";
			}
			cards.forEach(function (card, i) {
				const depth = (i + 1) * 10;
				card.style.transform = "translate(" + cx * depth + "px," + cy * depth + "px)";
			});
		});

		hero.addEventListener("mouseleave", function () {
			if (content) content.style.transform = "";
			cards.forEach(function (card) { card.style.transform = ""; });
		});
	}

	/* ---------- Page transition fade ---------- */
	function initPageTransitions() {
		const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const fade = document.querySelector(".page-fade");

		// Fade in on load
		if (fade && !prefersReduced) {
			fade.classList.add("active");
			requestAnimationFrame(function () {
				setTimeout(function () { fade.classList.remove("active"); }, 30);
			});
		}

		if (!fade || prefersReduced) return;

		document.querySelectorAll('a[href]').forEach(function (link) {
			const href = link.getAttribute("href");
			if (!href) return;
			const isInternal = /\.html$/.test(href) || href === "index.html";
			const sameTab = !link.target || link.target === "_self";
			if (isInternal && sameTab && !href.startsWith("#")) {
				link.addEventListener("click", function (e) {
					e.preventDefault();
					fade.classList.add("active");
					setTimeout(function () { window.location.href = href; }, 420);
				});
			}
		});
	}

	/* ---------- Init ---------- */
	document.addEventListener("DOMContentLoaded", function () {
		setActiveLink();
		initNavbarScroll();
		initHamburger();
		initYear();
		initParallax();
		initPageTransitions();
	});
})();
