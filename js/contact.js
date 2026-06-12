/* =========================================================
   ZenvX AI Studio — contact.js
   Contact form (client). Validates, sanitizes, blocks bots
   (honeypot + Cloudflare Turnstile CAPTCHA), rate-limits,
   then POSTs to a Cloudflare Pages serverless Function at
   /api/contact which verifies the captcha and sends the
   email via Resend server-side. No database, no client-side
   secrets.
   ========================================================= */
(function () {
	"use strict";

	/* Endpoint served by Cloudflare Pages Functions: functions/api/contact.js */
	const ENDPOINT = "/api/contact";

	const RATE_LIMIT_MS = 60 * 1000;          // 60s cooldown after success
	const RATE_LIMIT_KEY = "zenvx_last_submit";
	const MIN_MESSAGE_LEN = 20;

	/* ---------- Helpers ---------- */

	// Strip HTML tags + control chars and trim (defense-in-depth; the
	// serverless function sanitizes again before sending).
	function sanitize(value) {
		return String(value == null ? "" : value)
			.replace(/<[^>]*>/g, "")
			.replace(/[\u0000-\u001F\u007F]/g, "")
			.trim();
	}

	// Escape text before inserting into innerHTML status messages.
	function escHtml(value) {
		return String(value == null ? "" : value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	function isEmail(v) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
	}

	function isPhone(v) {
		const digits = v.replace(/\D/g, "");
		return /^[\d\s+()-]+$/.test(v) && digits.length >= 7 && digits.length <= 15;
	}

	function setError(field, message) {
		const input = document.getElementById(field);
		const err = document.querySelector('[data-error-for="' + field + '"]');
		if (err) err.textContent = message || "";
		if (input) input.style.borderColor = message ? "#ff5d73" : "";
	}

	function clearErrors(fields) {
		fields.forEach(function (f) { setError(f, ""); });
	}

	function setStatus(form, type, html) {
		const status = form.querySelector(".form-status");
		if (!status) return;
		status.className = "form-status " + (type || "");
		status.innerHTML = html || "";
	}

	// Read the Turnstile token from the hidden input the widget injects.
	function getCaptchaToken(form) {
		const el = form.querySelector('[name="cf-turnstile-response"]');
		return el ? el.value : "";
	}

	// Reset the Turnstile widget so a fresh token is issued for the next try.
	function resetCaptcha() {
		if (window.turnstile && typeof window.turnstile.reset === "function") {
			try { window.turnstile.reset(); } catch (_) { /* noop */ }
		}
	}

	/* ---------- Rate limit ---------- */
	function remainingCooldown() {
		const last = parseInt(localStorage.getItem(RATE_LIMIT_KEY) || "0", 10);
		if (!last) return 0;
		const diff = Date.now() - last;
		return diff < RATE_LIMIT_MS ? RATE_LIMIT_MS - diff : 0;
	}

	function startCooldown(btn) {
		localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
		lockButton(btn);
	}

	function lockButton(btn) {
		let remaining = remainingCooldown();
		if (remaining <= 0) return;
		const label = btn.querySelector(".btn-text");
		const original = btn.getAttribute("data-label") || (label ? label.textContent : "Send Message");
		btn.disabled = true;
		const timer = setInterval(function () {
			remaining = remainingCooldown();
			if (remaining <= 0) {
				clearInterval(timer);
				btn.disabled = false;
				if (label) label.textContent = original;
				return;
			}
			if (label) label.textContent = "Wait " + Math.ceil(remaining / 1000) + "s";
		}, 500);
	}

	/* ---------- Init ---------- */
	document.addEventListener("DOMContentLoaded", function () {
		const form = document.getElementById("contact-form");
		if (!form) return;

		const btn = form.querySelector(".submit-btn");
		if (btn) {
			const label = btn.querySelector(".btn-text");
			if (label) btn.setAttribute("data-label", label.textContent);
			lockButton(btn); // resume cooldown if page reloaded
		}

		const FIELDS = ["full_name", "phone", "email", "purpose", "message"];
		FIELDS.forEach(function (f) {
			const el = document.getElementById(f);
			if (el) el.addEventListener("input", function () { setError(f, ""); });
		});

		form.addEventListener("submit", async function (e) {
			e.preventDefault();
			clearErrors(FIELDS);
			setError("captcha", "");
			setStatus(form, "", "");

			// Honeypot — if filled, silently abort (likely a bot)
			const hp = form.querySelector('input[name="company_website"]');
			if (hp && hp.value.trim() !== "") { return; }

			// Cooldown guard
			if (remainingCooldown() > 0) {
				setStatus(form, "error", "Please wait a moment before sending another message.");
				return;
			}

			// Gather + sanitize
			const data = {
				full_name: sanitize(form.full_name.value),
				phone: sanitize(form.phone.value),
				email: sanitize(form.email.value),
				purpose: sanitize(form.purpose.value),
				message: sanitize(form.message.value),
				company_website: hp ? hp.value : "", // honeypot, validated again server-side
			};

			// Validate
			let ok = true;
			if (!data.full_name) { setError("full_name", "Please enter your full name."); ok = false; }
			if (!data.phone) { setError("phone", "Please enter your phone number."); ok = false; }
			else if (!isPhone(data.phone)) { setError("phone", "Enter a valid phone number (7–15 digits)."); ok = false; }
			if (!data.email) { setError("email", "Please enter your email address."); ok = false; }
			else if (!isEmail(data.email)) { setError("email", "Enter a valid email address."); ok = false; }
			if (!data.purpose) { setError("purpose", "Please select a purpose."); ok = false; }
			if (!data.message) { setError("message", "Please enter a message."); ok = false; }
			else if (data.message.length < MIN_MESSAGE_LEN) {
				setError("message", "Message must be at least " + MIN_MESSAGE_LEN + " characters."); ok = false;
			}

			// Turnstile CAPTCHA — must be completed before sending
			const captchaToken = getCaptchaToken(form);
			if (!captchaToken) {
				setError("captcha", "Please complete the CAPTCHA.");
				ok = false;
			}
			if (!ok) return;

			data["cf-turnstile-response"] = captchaToken;

			// Submit to the Cloudflare Pages Function
			if (btn) { btn.classList.add("loading"); btn.disabled = true; }

			try {
				const res = await fetch(ENDPOINT, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				let body = null;
				try { body = await res.json(); } catch (_) { /* non-JSON response */ }

				if (!res.ok || !body || body.ok !== true) {
					let msg = (body && body.error) ? body.error : ("Request failed (HTTP " + res.status + ").");
					if (body && body.detail) msg += " — " + body.detail;
					// Surface captcha-specific failures next to the widget too
					if (body && body.fields && body.fields.indexOf("captcha") !== -1) {
						setError("captcha", msg);
					}
					throw new Error(msg);
				}

				// Success UI
				setStatus(form, "success",
					'<div class="check-anim">✓</div>Message sent! We\'ll get back to you soon.');
				form.reset();
				resetCaptcha();
				if (btn) startCooldown(btn);
			} catch (err) {
				console.error(err);
				const detail = (err && err.message) ? err.message : "Please try again.";
				setStatus(form, "error", "Couldn't send your message: " + escHtml(detail));
				resetCaptcha(); // token is single-use; get a fresh one for the retry
				if (btn) btn.disabled = false;
			} finally {
				if (btn) btn.classList.remove("loading");
			}
		});
	});
})();
