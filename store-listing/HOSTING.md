# Hosting runbook — Render (app) + Neon (Postgres), $0

Goal: put the embedded backend on a public always-reachable URL so real stores
(and the Shopify reviewer) can install it. Interactive steps you run; Claude has
already done the code side (Prisma→Postgres, `render.yaml`, migration).

Prereqs: a GitHub account. Have `shopify.app.toml`'s `client_id` handy
(`e050dfad27997cceac099a0251c52add`) — that is your **SHOPIFY_API_KEY**.

---

## 1. Neon — free Postgres
1. Sign up at https://neon.tech (no card).
2. Create a project (region: EU / Frankfurt).
3. Copy the **DIRECT** connection string (NOT the `-pooler` one), looks like:
   `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   → this is your **DATABASE_URL**.

## 2. Push the code to GitHub
The repo is already committed locally. Create a new **private** GitHub repo
(e.g. `delivery-date-app`) and push:
```
cd C:\Users\batuh\Desktop\shopify\app-delivery-date
git remote add origin https://github.com/<you>/delivery-date-app.git
git branch -M main
git push -u origin main
```

## 3. Render — free web service
1. Sign up at https://render.com (no card for the free plan).
2. **New → Blueprint** → connect the GitHub repo → it reads `render.yaml`.
   (Or **New → Web Service** and set: Build `npm install && npx prisma generate && npm run build`,
   Start `npx prisma migrate deploy && npm run start`, Plan **Free**.)
3. When asked, add the environment variables:
   - `SHOPIFY_API_KEY` = `e050dfad27997cceac099a0251c52add`
   - `SHOPIFY_API_SECRET` = Partner Dashboard → Apps → Delivery Date → **API credentials** → API secret key
   - `DATABASE_URL` = the Neon DIRECT string from step 1
   - `SHOPIFY_APP_URL` = leave blank for now (fill in step 4)
4. Deploy. Render assigns a URL like `https://delivery-date-xxxx.onrender.com`.

## 4. Point the app at the Render URL
1. In Render, set `SHOPIFY_APP_URL` = your `https://delivery-date-xxxx.onrender.com`
   and **redeploy** (Manual Deploy → Deploy latest commit).
2. Edit `shopify.app.toml` locally:
   ```toml
   application_url = "https://delivery-date-xxxx.onrender.com"

   [auth]
   redirect_urls = [ "https://delivery-date-xxxx.onrender.com/auth/callback" ]
   ```
3. Push the config to Shopify:
   ```
   shopify app deploy
   ```
   This also uploads the theme extension version.

## 5. Keep it warm (free cold-start fix)
Render free sleeps after 15 min idle (~50s first load). Add a free pinger so the
reviewer never hits a cold start:
- https://cron-job.org (free) → new cron job → URL `https://delivery-date-xxxx.onrender.com/`
  → every 10 minutes.

## 6. Reinstall & verify
1. Install the app on your dev store from the new URL (Partner Dashboard → app →
   Test on development store, or the install link).
2. Confirm the embedded admin page loads (Apps → Delivery Date) — no cold-start error.
3. Confirm the widget still shows on a product page.
4. Trigger a test webhook or just confirm install/uninstall works.

## 7. Finish the privacy policy
In `store-listing/PRIVACY.md`, replace `[HOSTING PROVIDER]` → **Render** and
`[DATABASE PROVIDER]` → **Neon**. Host the file publicly (e.g. GitHub Pages or a
gist) and paste that URL into the listing's Privacy policy field.

---

## Local dev after this change
The datasource is now Postgres, so local `shopify app dev` needs a DB too. Add a
`.env` (gitignored) in the project root with:
```
DATABASE_URL="<your Neon DIRECT string>"
```
Then `npx prisma migrate deploy` once, and `npm run dev` works against Neon.
(You can use the same Neon project for dev, or create a second one for prod.)
