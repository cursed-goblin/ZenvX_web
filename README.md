# ZenvX AI Studio — Website

A modern, premium, futuristic, highly animated website for **ZenvX AI Studio**.
Built with pure HTML5, CSS3, and vanilla JavaScript — **no framework, no build step.**
The contact form is handled by a single **Cloudflare Pages serverless Function** that sends email via **Resend** (server-side). **No database.**

**Live domain:** [www.zenvx.in](https://www.zenvx.in)

---

## ✨ Features

- **Dark-mode, glassmorphism, cyberpunk** aesthetic with neon cyan (`#00f5ff`) + purple (`#7b2fff`) accents
- Premium typography (Google Fonts: **Inter** + **Space Grotesk**)
- Fully responsive (desktop / tablet / mobile) with a hamburger menu
- **GSAP + ScrollTrigger** animations: staggered hero text, scroll reveals, count-up stats, clip-path heading reveals, sequential timeline pop-ins
- Custom **canvas particle network** + neural-network SVG in the hero
- Interactive **mouse-parallax** hero, floating glass cards, animated gradients
- Smooth **page-to-page fade transitions**
- Graceful fallback: if the GSAP CDN is blocked, all content still renders (no hidden sections)
- Contact form with client-side validation, honeypot spam protection, input sanitization, and a 60s rate limit, posting to a **Cloudflare Pages Function** that sends mail through **Resend** — **the API key stays server-side**
- SEO meta tags, Open Graph, Twitter cards, `sitemap.xml`, and `robots.txt`

---

## 📁 File Structure

```
zenvx-website/
├── index.html          # Home
├── about.html          # About & founders
├── products.html       # Product showcase (CUSAT PYQ) + roadmap
├── upcoming.html       # ZenvX OS & upcoming projects
├── contact.html        # Contact form (posts to /api/contact)
├── css/
│   ├── style.css       # Core styles, glassmorphism, dark theme, neon accents
│   ├── animations.css  # Keyframes + animation utility classes
│   └── responsive.css  # Tablet / mobile breakpoints
├── js/
│   ├── main.js         # Navbar, mobile menu, parallax, page transitions
│   ├── animations.js   # GSAP / ScrollTrigger animations (with fallback)
│   ├── particles.js    # Canvas particle network
│   └── contact.js      # Form validation + POST to the serverless function
├── functions/
│   └── api/
│       └── contact.js  # Cloudflare Pages Function → sends email via Resend
├── assets/
│   └── images/         # Your image assets
├── sitemap.xml
├── robots.txt
└── README.md
```

> Cloudflare Pages automatically turns any file under `functions/` into a serverless route. `functions/api/contact.js` is served at `/api/contact`.

---

## 🚀 Running Locally

The static pages work by just opening `index.html`, but to test the contact form you need the Functions runtime. Use Wrangler:

```bash
# install once
npm install -g wrangler

# from the project root
wrangler pages dev .
# then visit the printed localhost URL
```

Set your secrets locally by creating a `.dev.vars` file in the project root (do **not** commit it):

```
RESEND_API_KEY=re_your_api_key
CONTACT_FROM=ZenvX Website <noreply@zenvx.in>
CONTACT_TO=sk@zenvx.in, abhi@zenvx.in
```

---

## 📧 Resend Setup

1. Create a free account at [resend.com](https://resend.com).
2. Go to **Domains** and add **zenvx.in**, then add the DNS records Resend gives you (SPF/DKIM) at your domain registrar. Wait for the domain to show as **Verified**.
   - Until the domain is verified you can test with Resend's sandbox sender `onboarding@resend.dev` as the `CONTACT_FROM` value.
3. Go to **API Keys → Create API Key** (give it *Sending access*). Copy the key — it starts with `re_`. This is your `RESEND_API_KEY`.
4. Decide your sender and recipients:
   - **`CONTACT_FROM`** — a verified address on your domain, e.g. `ZenvX Website <noreply@zenvx.in>`.
   - **`CONTACT_TO`** — where enquiries land, e.g. `sk@zenvx.in, abhi@zenvx.in` (comma-separated).

> The function also sets `reply_to` to the visitor's email address, so you can reply to enquiries directly from your inbox.

---

## 🌐 Deployment — Cloudflare Pages

This project is built specifically for **Cloudflare Pages** (static assets + Functions).

1. Push the project to a GitHub repository.
2. In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git** and select the repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (repo root — where `index.html` lives)
4. Add the environment variables under **Settings → Environment variables** (for both Production and Preview):
   - `RESEND_API_KEY`
   - `CONTACT_FROM`
   - `CONTACT_TO`
5. Deploy. Cloudflare auto-detects `functions/api/contact.js` and serves it at `https://<your-site>/api/contact`.
6. Add your custom domain `www.zenvx.in` under the project's **Custom domains** tab.

After deploying, confirm `https://www.zenvx.in/sitemap.xml` and `https://www.zenvx.in/robots.txt` are reachable, then submit the sitemap in Google Search Console.

---

## 🔒 Security Notes

- **No secret keys in the browser.** The Resend API key lives only in Cloudflare environment variables and is used inside the serverless function.
- **Honeypot** hidden field (`company_website`) is checked on both client and server.
- **Input sanitization** strips HTML tags and control characters on both client and server, and the email body is HTML-escaped before sending.
- **Validation** runs client-side (for UX) and again server-side (authoritative).
- **Rate limiting** disables the submit button for 60 seconds (tracked via `localStorage`) after a successful send.
- The function only accepts `POST`; other methods return `405`.

---

## 📋 Pages Overview

| Page | Highlights |
| --- | --- |
| **Home** | Hero with particles + neural SVG, parallax, stat counters, featured CUSAT PYQ card, upcoming-projects timeline |
| **About** | Five focus-area cards, founder profile cards, animated mission statement |
| **Products** | CUSAT PYQ featured card with shimmer border, vertical product roadmap |
| **Upcoming** | ZenvX OS feature grid, 5-phase development roadmap, other upcoming projects |
| **Contact** | Founder contact cards + validated form → `/api/contact` → Resend |

---

© 2025 ZenvX AI Studio. All rights reserved.
