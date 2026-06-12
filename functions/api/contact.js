/* =========================================================
   ZenvX AI Studio — Cloudflare Pages Function
   Path: /api/contact  (file: functions/api/contact.js)

   Receives the contact form POST, validates + sanitizes
   server-side, then sends an email via the EmailJS REST API
   using SERVER-SIDE credentials (kept out of the browser).

   Required environment variables (set in the Cloudflare
   Pages dashboard → Settings → Environment variables):
     EMAILJS_SERVICE_ID    — your EmailJS service id
     EMAILJS_TEMPLATE_ID   — your EmailJS template id
     EMAILJS_PUBLIC_KEY    — EmailJS public key (user_id)
     EMAILJS_PRIVATE_KEY   — EmailJS private key (accessToken)

   In your EmailJS account, enable
   "Allow EmailJS API for non-browser applications"
   (Account → Security) so server-side calls are accepted.
   ========================================================= */

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const MIN_MESSAGE_LEN = 20;
const MAX_LEN = 5000;

function json(data, status) {
	return new Response(JSON.stringify(data), {
		status: status || 200,
		headers: { "Content-Type": "application/json" },
	});
}

function sanitize(value) {
	return String(value == null ? "" : value)
		.replace(/<[^>]*>/g, "")
		.replace(/[\u0000-\u001F\u007F]/g, "")
		.slice(0, MAX_LEN)
		.trim();
}

function isEmail(v) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isPhone(v) {
	const digits = v.replace(/\D/g, "");
	return /^[\d\s+()-]+$/.test(v) && digits.length >= 7 && digits.length <= 15;
}

export async function onRequestPost(context) {
	const { request, env } = context;

	// Parse JSON body
	let payload;
	try {
		payload = await request.json();
	} catch (_) {
		return json({ ok: false, error: "Invalid request body." }, 400);
	}

	// Honeypot — silently accept so bots don't learn they were blocked
	if (payload && typeof payload.company_website === "string" && payload.company_website.trim() !== "") {
		return json({ ok: true });
	}

	// Sanitize
	const data = {
		full_name: sanitize(payload.full_name),
		phone: sanitize(payload.phone),
		email: sanitize(payload.email),
		purpose: sanitize(payload.purpose),
		message: sanitize(payload.message),
	};

	// Validate
	const errors = [];
	if (!data.full_name) errors.push("full_name");
	if (!data.phone || !isPhone(data.phone)) errors.push("phone");
	if (!data.email || !isEmail(data.email)) errors.push("email");
	if (!data.purpose) errors.push("purpose");
	if (!data.message || data.message.length < MIN_MESSAGE_LEN) errors.push("message");
	if (errors.length) {
		return json({ ok: false, error: "Validation failed.", fields: errors }, 422);
	}

	// Ensure server is configured
	if (!env.EMAILJS_SERVICE_ID || !env.EMAILJS_TEMPLATE_ID || !env.EMAILJS_PUBLIC_KEY || !env.EMAILJS_PRIVATE_KEY) {
		return json({ ok: false, error: "Email service is not configured." }, 500);
	}

	// Best-effort client IP (for spam triage inside the email)
	const ip = request.headers.get("CF-Connecting-IP") || "unknown";

	const emailBody = {
		service_id: env.EMAILJS_SERVICE_ID,
		template_id: env.EMAILJS_TEMPLATE_ID,
		user_id: env.EMAILJS_PUBLIC_KEY,       // EmailJS public key
		accessToken: env.EMAILJS_PRIVATE_KEY,  // EmailJS private key (server-side only)
		template_params: {
			from_name: data.full_name,
			phone: data.phone,
			from_email: data.email,
			purpose: data.purpose,
			message: data.message,
			time: new Date().toISOString(),
			ip: ip,
			// Recipients are best set in the EmailJS template's "To" field
			// (sk@zenvx.in, abhi@zenvx.in). Passed here too for convenience.
			to_email: "sk@zenvx.in, abhi@zenvx.in",
		},
	};

	try {
		const res = await fetch(EMAILJS_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(emailBody),
		});

		if (!res.ok) {
			const detail = await res.text().catch(function () { return ""; });
			return json({ ok: false, error: "Email provider error.", detail: detail.slice(0, 300) }, 502);
		}

		return json({ ok: true });
	} catch (err) {
		return json({ ok: false, error: "Failed to send email." }, 500);
	}
}

// Reject non-POST methods cleanly.
export async function onRequest(context) {
	if (context.request.method === "POST") {
		return onRequestPost(context);
	}
	return new Response("Method Not Allowed", {
		status: 405,
		headers: { "Allow": "POST" },
	});
}
