/* =========================================================
   ZenvX AI Studio — particles.js
   Lightweight canvas particle + connection network for hero.
   No dependencies. Auto-attaches to <canvas id="particles">.
   ========================================================= */
(function () {
	"use strict";

	const canvas = document.getElementById("particles");
	if (!canvas) return;

	const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const ctx = canvas.getContext("2d");

	let width = 0;
	let height = 0;
	let dpr = Math.min(window.devicePixelRatio || 1, 2);
	let particles = [];
	let rafId = null;
	const mouse = { x: null, y: null, radius: 140 };

	const COLORS = ["0, 245, 255", "123, 47, 255"];

	function sizeFor() {
		const area = width * height;
		// roughly one particle per 11k px², capped for performance
		return Math.max(28, Math.min(110, Math.round(area / 11000)));
	}

	function resize() {
		const rect = canvas.getBoundingClientRect();
		width = rect.width;
		height = rect.height;
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		init();
	}

	function rand(min, max) { return Math.random() * (max - min) + min; }

	function Particle() {
		this.x = rand(0, width);
		this.y = rand(0, height);
		this.vx = rand(-0.35, 0.35);
		this.vy = rand(-0.35, 0.35);
		this.r = rand(1, 2.6);
		this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
		this.alpha = rand(0.4, 0.9);
	}

	Particle.prototype.update = function () {
		this.x += this.vx;
		this.y += this.vy;
		if (this.x < 0 || this.x > width) this.vx *= -1;
		if (this.y < 0 || this.y > height) this.vy *= -1;

		// gentle mouse repulsion
		if (mouse.x !== null) {
			const dx = this.x - mouse.x;
			const dy = this.y - mouse.y;
			const dist = Math.hypot(dx, dy);
			if (dist < mouse.radius && dist > 0) {
				const force = (mouse.radius - dist) / mouse.radius;
				this.x += (dx / dist) * force * 1.4;
				this.y += (dy / dist) * force * 1.4;
			}
		}
	};

	Particle.prototype.draw = function () {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
		ctx.fillStyle = "rgba(" + this.color + "," + this.alpha + ")";
		ctx.fill();
	};

	function connect() {
		const maxDist = 130;
		for (let i = 0; i < particles.length; i++) {
			for (let j = i + 1; j < particles.length; j++) {
				const a = particles[i];
				const b = particles[j];
				const dx = a.x - b.x;
				const dy = a.y - b.y;
				const dist = Math.hypot(dx, dy);
				if (dist < maxDist) {
					const op = (1 - dist / maxDist) * 0.5;
					ctx.strokeStyle = "rgba(0, 245, 255," + op + ")";
					ctx.lineWidth = 0.6;
					ctx.beginPath();
					ctx.moveTo(a.x, a.y);
					ctx.lineTo(b.x, b.y);
					ctx.stroke();
				}
			}
		}
	}

	function init() {
		particles = [];
		const count = sizeFor();
		for (let i = 0; i < count; i++) particles.push(new Particle());
	}

	function animate() {
		ctx.clearRect(0, 0, width, height);
		for (let i = 0; i < particles.length; i++) {
			particles[i].update();
			particles[i].draw();
		}
		connect();
		rafId = requestAnimationFrame(animate);
	}

	function drawStatic() {
		// Single static frame for reduced-motion users
		ctx.clearRect(0, 0, width, height);
		for (let i = 0; i < particles.length; i++) particles[i].draw();
		connect();
	}

	window.addEventListener("mousemove", function (e) {
		const rect = canvas.getBoundingClientRect();
		mouse.x = e.clientX - rect.left;
		mouse.y = e.clientY - rect.top;
	});
	window.addEventListener("mouseout", function () { mouse.x = null; mouse.y = null; });

	let resizeTimer;
	window.addEventListener("resize", function () {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(resize, 200);
	});

	// Pause when tab not visible (saves battery)
	document.addEventListener("visibilitychange", function () {
		if (document.hidden) {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = null;
		} else if (!prefersReduced && !rafId) {
			animate();
		}
	});

	resize();
	if (prefersReduced) {
		drawStatic();
	} else {
		animate();
	}
})();
