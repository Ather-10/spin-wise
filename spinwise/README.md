# Spinwise – Next.js SEO wheel spinner

## Run locally (no database needed)
1. `npm install`
2. `cp .env.example .env.local` and set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
3. `npm run dev` → http://localhost:3000

Leave `DATABASE_URL` empty locally. Users and wheels are then stored in `.data/dev-db.json`
(delete that file to reset). Never use this file database in production.

## How saving works
- **Guest:** wheels are saved in the browser (localStorage) and removed after 7 days without use
  (opening or saving a wheel renews the 7 days). Nothing is stored on your server.
- **Logged in:** wheels are saved in the database with no expiry, on any device.
- **Guest → account:** when a guest signs up or logs in, their local wheels are moved into the account.

## Header
Logo left. Right: My Wheels dropdown (open / delete, updates instantly), language dropdown (23 languages,
keeps the current page), Login / Sign up (becomes the user's name + Log out).

## Deploy on Hostinger (Node.js / Next.js web app hosting)
1. Hostinger hPanel → create a MySQL database + user → copy the connection string:
   `DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DBNAME`
2. Add environment variables in the web app settings:
   `NEXT_PUBLIC_SITE_URL` (your real https domain), `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_GTM_ID` (optional).
   Make `SESSION_SECRET` a long random string:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Deploy (upload the zip or connect a GitHub repo). Build: `npm run build`. Start: `npm start`.
4. Tables (`users`, `wheels`) are created automatically on the first request.
5. Open the site, sign up, save a wheel, check it in phpMyAdmin.
6. Search Console: add the domain, submit `https://your-domain.com/sitemap.xml`.
NEXT_PUBLIC_* variables must exist BEFORE `npm run build`.

## SEO already done
Per-page title, description, canonical, hreflang + x-default, Open Graph, Twitter cards, sitemap.xml,
robots.txt, JSON-LD (WebApplication + FAQPage), static generation, internal links in header and footer.

## To do next
- Translate the 21 languages that still fall back to English (`lib/dict.ts`, `lib/ui.ts`). Do not keep them as English copies.
- Unique text (300+ words) on each preset page; more presets in `lib/presets.ts`.
- Image entries, wheel background / center image, share links `/w/<id>` (noindex).
- Password reset by email (Hostinger SMTP), email verification, Google login.
- Login limiter is in-memory (resets on restart). Move it to the database if you get attacked.
