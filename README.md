# ZenvX AI Studio — Website

A modern, premium, futuristic, highly animated website for **ZenvX AI Studio**.
Built with pure HTML5, CSS3, and vanilla JavaScript — **no framework, no build step.**
The contact form is handled by a single **Cloudflare Pages serverless Function** that verifies a **Cloudflare Turnstile** CAPTCHA and sends email via **Resend** (server-side). **No database.**

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
- Contact form with client-side validation, honeypot spam protection, **Cloudflare Turnstile CAPTCHA**, input sanitization, and a 60s rate limit, posting to a **Cloudflare Pages Function** that verifies the captcha and sends mail through **Resend** — **all secret keys stay server-side**
- SEO meta tags, Open Graph, Twitter cards, `sitemap.xml`, and `robots.txt`

---

## 📁 File Structure

```
zenvx-website/
├── index.html          # Home
├── about.html          # About & founders
├── products.html       # Product showcase (CUSAT PYQ) + roadmap
├── upcoming.html       # ZenvX OS & upcoming projects
├── contact.html        # Contact form (Turnstile + posts to /api/contact)
├── css/
│   ├── style.css       # Core styles, glassmorphism, dark theme, neon accents
│   ├── animations.css  # Keyframes + animation utility classes
│   └── responsive.css  # Tablet / mobile breakpoints
├── js/
│   ├── main.js         # Navbar, mobile menu, parallax, page transitions
│   ├── animations.js   # GSAP / ScrollTrigger animations (with fallback)
│   ├── particles.js    # Canvas particle network
│   └── contact.js      # Form validation + captcha token + POST to the function
├── functions/
│   └── api/
│       └── contact.js  # Cloudflare Pages Function → verifies Turnstile + sends via Resend
├── assets/
│   └── images/         # Your image assets
├── _routes.json        # Tells Cloudflare Pages which routes invoke Functions (/api/*)
├── wrangler.toml       # Marks this repo as a Cloudflare PAGES project
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
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

For local testing you can use Cloudflare's **Turnstile test keys** (always pass):

```
Site key (in contact.html):  1x00000000000000000000AA
Secret key (TURNSTILE_SECRET_KEY):  1x0000000000000000000000000000000AA
```

---

## 🖥️ Deploying as a Cloudflare PAGES project (not a Worker)

> **Important:** the `functions/` folder that powers `/api/contact` is a **Cloudflare Pages** feature. If you import the repo as a plain **Worker**, the function will NOT be detected. Create a **Pages** project.

1. Push the project to a GitHub repository (done).
2. In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git** and select the repo. (Choose the **Pages** tab, not Workers.)
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (repo root — where `index.html` lives)
4. Add the environment variables under **Settings → Variables and secrets** (for both Production and Preview):
   - `RESEND_API_KEY`
   - `CONTACT_FROM`
   - `CONTACT_TO`
   - `TURNSTILE_SECRET_KEY`
5. Deploy. Cloudflare auto-detects `functions/api/contact.js` and serves it at `https://<your-site>/api/contact`.
6. Add your custom domain `www.zenvx.in` under the project's **Custom domains** tab.

> **Environment variables only take effect on deployments created _after_ they were added.** After adding or changing any variable, trigger a new deployment (Deployments → ⋯ → Retry deployment, or push a commit).

The included `wrangler.toml` (`pages_build_output_dir = "."`) and `_routes.json` make the project explicitly a Pages project with Functions, which is what allows Cloudflare to detect and run `/api/contact`.

After deploying, confirm `https://www.zenvx.in/sitemap.xml` and `https://www.zenvx.in/robots.txt` are reachable, then submit the sitemap in Google Search Console.

---

## 🛡️ Cloudflare Turnstile (CAPTCHA) Setup

1. In the Cloudflare dashboard go to **Turnstile → Add site**.
2. Add your domain (`zenvx.in`) and create a widget. You'll get a **Site key** (public) and a **Secret key** (private).
3. Put the **Site key** in `contact.html` — the widget is already wired up:
   ```html
   <div class="cf-turnstile" data-sitekey="0x4AAAAAADjFGe7MnrtJ2n0y" data-theme="dark"></div>
   ```
4. Put the **Secret key** in the `TURNSTILE_SECRET_KEY` environment variable (never in the HTML/JS). It must belong to the **same** widget as the site key above.

The Turnstile script is already loaded in `contact.html`:
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```
The server function rejects any submission whose token is missing or fails verification.

---

## 📧 Resend Setup

1. Create a free account at [resend.com](https://resend.com).
2. Go to **Domains** and add **zenvx.in**, then add the DNS records Resend gives you (SPF/DKIM) at your domain registrar. Wait for the domain to show as **Verified**.
   - **You cannot send `from` an address on an unverified domain.** Until `zenvx.in` is verified, sending from `noreply@zenvx.in` will be rejected by Resend (this is what causes an HTTP 502 from `/api/contact`).
   - To test before DNS is ready, set `CONTACT_FROM=onboarding@resend.dev` and set `CONTACT_TO` to the email address you signed up to Resend with (sandbox sending only delivers to your own account email).
3. Go to **API Keys → Create API Key** (give it *Sending access*). Copy the key — it starts with `re_`. This is your `RESEND_API_KEY`.
4. Decide your sender and recipients:
   - **`CONTACT_FROM`** — a verified address on your domain, e.g. `ZenvX Website <noreply@zenvx.in>`.
   - **`CONTACT_TO`** — where enquiries land, e.g. `sk@zenvx.in, abhi@zenvx.in` (comma-separated).

> The function also sets `reply_to` to the visitor's email address, so you can reply to enquiries directly from your inbox.

---

## 🧪 Troubleshooting the contact form

The form now shows the **exact** server error on failure. Common cases:

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Resend rejected the email (HTTP 403) … domain is not verified` | `CONTACT_FROM` uses an unverified domain | Verify `zenvx.in` in Resend, or use `onboarding@resend.dev` for testing |
| `Email service is not configured (missing RESEND_API_KEY)` | Env var missing on the live deployment | Add `RESEND_API_KEY`, then **redeploy** |
| `Captcha is not configured (missing TURNSTILE_SECRET_KEY)` | Env var missing | Add `TURNSTILE_SECRET_KEY`, then **redeploy** |
| `Captcha verification failed` | Secret key doesn't match the site key's widget | Use the secret + site key from the **same** Turnstile widget |
| `Request failed (HTTP 404)` on `/api/contact` | Imported as a Worker, or Functions not detected | Recreate as a **Pages** project (see deploy section) |

For the precise error, open your Pages project → **Deployments → (active deployment) → Functions / Real-time Logs**, then submit the form once.

---

## 🔒 Security Notes

- **No secret keys in the browser.** The Resend API key and the Turnstile secret key live only in Cloudflare environment variables and are used inside the serverless function. Only the Turnstile *site* key (public by design) is in the HTML.
- **Cloudflare Turnstile CAPTCHA** is verified server-side via `siteverify` before any email is sent.
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
| **Contact** | Founder contact cards + validated form with Turnstile CAPTCHA → `/api/contact` → Resend |

---

© 2025 ZenvX AI Studio. All rights reserved.
