# ZenvX AI Studio — Website

A modern, premium, futuristic, highly animated website for **ZenvX AI Studio**.
Built with pure HTML5, CSS3, and vanilla JavaScript — **no framework, no build step.**
The contact form is handled by a single **Cloudflare Pages serverless Function** that sends email via **EmailJS** (server-side). **No database.**

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
- Contact form with client-side validation, honeypot spam protection, input sanitization, and a 60s rate limit, posting to a **Cloudflare Pages Function** that sends mail through **EmailJS** — **all email credentials stay server-side**
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
│       └── contact.js  # Cloudflare Pages Function → sends email via EmailJS
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
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
```

---

## 📧 EmailJS Setup

1. Create a free account at [emailjs.com](https://www.emailjs.com).
2. Connect your email service (Gmail or custom SMTP).
3. Create an email template with these variables:
   `from_name`, `phone`, `from_email`, `purpose`, `message`, `time`, `ip`
   - In the template's **"To"** field, add both recipients: `sk@zenvx.in, abhi@zenvx.in`
     (or use the `to_email` variable, which the function passes as `sk@zenvx.in, abhi@zenvx.in`).
4. **Enable server-side sending:** in EmailJS go to **Account → Security** and turn on
   **"Allow EmailJS API for non-browser applications"**. This is required because the
   email is now sent from the Cloudflare Function, not the browser.
5. Collect four values for the environment variables below:
   - **Service ID** → `EMAILJS_SERVICE_ID`
   - **Template ID** → `EMAILJS_TEMPLATE_ID`
   - **Public Key** (Account → General) → `EMAILJS_PUBLIC_KEY`
   - **Private Key** (Account → Security) → `EMAILJS_PRIVATE_KEY`

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
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`
   - `EMAILJS_PUBLIC_KEY`
   - `EMAILJS_PRIVATE_KEY`
5. Deploy. Cloudflare auto-detects `functions/api/contact.js` and serves it at `https://<your-site>/api/contact`.
6. Add your custom domain `www.zenvx.in` under the project's **Custom domains** tab.

After deploying, confirm `https://www.zenvx.in/sitemap.xml` and `https://www.zenvx.in/robots.txt` are reachable, then submit the sitemap in Google Search Console.

---

## 🔒 Security Notes

- **No secret keys in the browser.** The EmailJS service/template/public/private keys live only in Cloudflare environment variables and are used inside the serverless function.
- **Honeypot** hidden field (`company_website`) is checked on both client and server.
- **Input sanitization** strips HTML tags and control characters on both client and server before the email is sent.
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
| **Contact** | Founder contact cards + validated form → `/api/contact` → EmailJS |

---

© 2025 ZenvX AI Studio. All rights reserved.
