/* =========================================================
   ZenvX AI Studio — Cloudflare Pages Function
   Path: /api/contact  (file: functions/api/contact.js)

   Receives the contact form POST, validates + sanitizes
   server-side, then sends an email via the Resend REST API
   using a SERVER-SIDE API key (kept out of the browser).

   Required environment variables (set in the Cloudflare
   Pages dashboard → Settings → Environment variables):
     RESEND_API_KEY  — your Resend API key (starts with "re_")
     CONTACT_FROM    — verified sender, e.g.
                       "ZenvX Website <noreply@zenvx.in>"
     CONTACT_TO      — recipient(s), comma-separated
                       (defaults to sk@zenvx.in, abhi@zenvx.in)

   In Resend → Domains, verify your sending domain (zenvx.in)
   so the CONTACT_FROM address is allowed to send. Until the
   domain is verified you can test with Resend's sandbox
   sender "onboarding@resend.dev".
   ========================================================= */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const MIN_MESSAGE_LEN = 20;
const MAX_LEN = 5000;
const DEFAULT_FROM = "ZenvX Website <onboarding@resend.dev>";
const DEFAULT_TO = "sk@zenvx.in, abhi@zenvx.in";

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

// HTML-escape sanitized values before embedding them in the email body.
function esc(value) {
	return String(value == null ? "" : value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
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
	if (!env.RESEND_API_KEY) {
		return json({ ok: false, error: "Email service is not configured." }, 500);
	}

	// Best-effort client IP (for spam triage inside the email)
	const ip = request.headers.get("CF-Connecting-IP") || "unknown";
	const time = new Date().toISOString();

	const from = env.CONTACT_FROM || DEFAULT_FROM;
	const toList = (env.CONTACT_TO || DEFAULT_TO)
		.split(",")
		.map(function (s) { return s.trim(); })
		.filter(Boolean);

	const subject = "New ZenvX enquiry — " + data.purpose + " — " + data.full_name;

	const html =
		'<div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a1c24;">' +
			'<h2 style="margin:0 0 16px;">New contact form submission</h2>' +
			'<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
				'<tr><td style="padding:6px 10px;font-weight:600;width:140px;">Name</td><td style="padding:6px 10px;">' + esc(data.full_name) + '</td></tr>' +
				'<tr><td style="padding:6px 10px;font-weight:600;">Email</td><td style="padding:6px 10px;">' + esc(data.email) + '</td></tr>' +
				'<tr><td style="padding:6px 10px;font-weight:600;">Phone</td><td style="padding:6px 10px;">' + esc(data.phone) + '</td></tr>' +
				'<tr><td style="padding:6px 10px;font-weight:600;">Purpose</td><td style="padding:6px 10px;">' + esc(data.purpose) + '</td></tr>' +
				'<tr><td style="padding:6px 10px;font-weight:600;vertical-align:top;">Message</td><td style="padding:6px 10px;white-space:pre-wrap;">' + esc(data.message) + '</td></tr>' +
				'<tr><td style="padding:6px 10px;font-weight:600;">Time</td><td style="padding:6px 10px;">' + esc(time) + '</td></tr>' +
				'<tr><td style="padding:6px 10px;font-weight:600;">IP</td><td style="padding:6px 10px;">' + esc(ip) + '</td></tr>' +
			'</table>' +
		'</div>';

	const text =
		"New contact form submission\n\n" +
		"Name: " + data.full_name + "\n" +
		"Email: " + data.email + "\n" +
		"Phone: " + data.phone + "\n" +
		"Purpose: " + data.purpose + "\n" +
		"Message:\n" + data.message + "\n\n" +
		"Time: " + time + "\n" +
		"IP: " + ip + "\n";

	const emailBody = {
		from: from,
		to: toList,
		reply_to: data.email,
		subject: subject,
		html: html,
		text: text,
	};

	try {
		const res = await fetch(RESEND_ENDPOINT, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + env.RESEND_API_KEY,
				"Content-Type": "application/json",
			},
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
